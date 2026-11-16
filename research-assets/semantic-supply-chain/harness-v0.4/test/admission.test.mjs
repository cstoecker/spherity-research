// SPDX-License-Identifier: Apache-2.0
// H1: restricted admission grammar and signed admission certificate (PRD-10, VER-4, T9.2).
// Regression cases are the blank-node sources the formal review found (X1, X9) and the second
// review's probe; the soundness cross-check runs JSON-LD expansion on every accepted document.
import assert from "node:assert/strict";
import jsonld from "jsonld";
import test from "node:test";
import { analyse, certify, createAdmission } from "../src/admission.mjs";
import { generateKeyPair } from "../src/crypto.mjs";
import { issueLfsc, verifyLfsc } from "../src/lfsc.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "../src/loader.mjs";
import { freshResolver } from "../src/suites.mjs";

const V2 = "https://www.w3.org/ns/credentials/v2";
const ENERGY = "https://contexts.example/energy-roles/v1";
const X = "https://contexts.example/x/v1";
const Y = "https://contexts.example/y/v1";
const publisher = generateKeyPair();
const pubVm = `did:key:${publisher.publicKeyMultibase}#${publisher.publicKeyMultibase}`;
const publishers = new Map([[pubVm.split("#")[0], new Set([pubVm])]]);
const bytesOf = (entries) => new Map(Object.entries(entries).map(([u, v]) => [u, Buffer.from(v)]));
const energyBytes = bytesOf({ [V2]: W3C_CONTEXTS[V2], [ENERGY]: contextFile("energy-roles-v1.jsonld") });

async function blankNodes(document, bytes) {
  const loader = staticLoader(Object.fromEntries(bytes));
  const doc = structuredClone(document); delete doc.proof;
  const nq = await jsonld.toRDF(doc, { format: "application/n-quads", documentLoader: loader, contextResolver: freshResolver(), safe: false });
  return new Set(nq.match(/_:[A-Za-z0-9]+/g) ?? []).size;
}

const credential = {
  "@context": [V2, ENERGY],
  id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11",
  type: ["VerifiableCredential", "MarketRoleCredential"],
  issuer: "did:example:issuer",
  validFrom: "2026-11-10T00:00:00Z",
  credentialSubject: { id: "did:example:grid-operator-42", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData" }
};

test("the W3C v2 + energy-roles closure is admissible; graph-container and @json terms are excluded", () => {
  const a = analyse([V2, ENERGY], energyBytes);
  assert.equal(a.admissible, true, a.refused.join("; "));
  for (const t of ["credentialSubject", "issuer", "validFrom", "marketRole", "dataAccessScope"]) assert.ok(a.terms[t], t);
  assert.match(a.excluded.proof, /@graph/);
  assert.match(a.excluded.verifiableCredential, /@graph/);
  assert.ok(a.excluded.jsonSchema);
});

test("certificate: signed, publisher-bound, and checked against the verifier's own context bytes", () => {
  const cert = certify(analyse([V2, ENERGY], energyBytes), { signer: publisher, verificationMethod: pubVm });
  assert.equal(createAdmission(cert, { publishers, bytes: energyBytes }).ok, true);
  const tampered = structuredClone(cert); tampered.terms.proof = { kind: "id", iri: "https://w3id.org/security#proof" };
  assert.match(createAdmission(tampered, { publishers, bytes: energyBytes }).reason, /signature invalid/);
  assert.match(createAdmission(cert, { publishers: new Map(), bytes: energyBytes }).reason, /not authorised/);
  const drifted = bytesOf({ [V2]: W3C_CONTEXTS[V2], [ENERGY]: contextFile("energy-roles-v1.SUBSTITUTED.jsonld") });
  assert.match(createAdmission(cert, { publishers, bytes: drifted }).reason, /differs from the certified closure/);
});

test("probe closure (second review): terms and prefixes mapped to blank nodes refuse the whole closure", () => {
  const ctx = { "@context": { "@protected": true, id: "@id", type: "@type",
    points: { "@id": "https://vocab.example/x#points", "@container": "@list" },
    meta: { "@id": "https://vocab.example/x#meta", "@context": { id: "https://vocab.example/x#identifier" } },
    kind: { "@id": "https://vocab.example/x#kind", "@type": "@vocab" },
    Anon: "_:anon", bn: "_:" } };
  const a = analyse([X], bytesOf({ [X]: JSON.stringify(ctx) }));
  assert.equal(a.admissible, false);
  assert.ok(a.refused.some((r) => /"Anon" maps to a blank node/.test(r)));
  assert.ok(a.refused.some((r) => /"bn" maps to a blank node/.test(r)));
  assert.throws(() => certify(a, { signer: publisher, verificationMethod: pubVm }), /closure refused/);
});

test("probe closure without blank mappings: a scoped context that redefines 'id' excludes its carrier", () => {
  const ctx = { "@context": { "@protected": true, id: "@id", type: "@type",
    meta: { "@id": "https://vocab.example/x#meta", "@context": { id: "https://vocab.example/x#identifier" } },
    kind: { "@id": "https://vocab.example/x#kind", "@type": "@vocab" } } };
  const a = analyse([X], bytesOf({ [X]: JSON.stringify(ctx) }));
  assert.equal(a.admissible, true);
  assert.match(a.excluded.meta, /redefines "id"/);
  assert.equal(a.terms.kind.kind, "vocab");
});

test("X1 closure: @graph container, list terms (top-level and type-scoped) excluded; transitive context included", async () => {
  const ctxX = { "@context": { "@protected": true,
    Shipment: { "@id": "https://vocab.example/x#Shipment", "@context": { items: { "@id": "https://vocab.example/x#items", "@container": "@list" } } },
    evidence2: { "@id": "https://vocab.example/x#evidence2", "@container": "@graph" },
    Role: { "@id": "https://vocab.example/x#Role", "@context": Y },
    points: { "@id": "https://vocab.example/x#points", "@container": "@list" } } };
  const ctxY = { "@context": { scope: { "@id": "https://vocab.example/y#scope", "@type": "@vocab" }, Public: "https://vocab.example/y#Public" } };
  const bytes = bytesOf({ [V2]: W3C_CONTEXTS[V2], [X]: JSON.stringify(ctxX), [Y]: JSON.stringify(ctxY) });
  const a = analyse([V2, X], bytes);
  assert.equal(a.admissible, true, a.refused.join("; "));
  assert.ok(a.closure.some((c) => c.id === Y), "transitive context Y is part of the certified closure");
  for (const t of ["evidence2", "items", "points"]) assert.ok(a.excluded[t], t);
  const admission = createAdmission(certify(a, { signer: publisher, verificationMethod: pubVm }), { publishers, bytes });
  const base = (extra) => ({ "@context": [V2, X], id: "urn:uuid:1", type: ["VerifiableCredential"], issuer: "did:example:i", validFrom: "2026-11-12T00:00:00Z", credentialSubject: { id: "urn:s:1", ...extra } });
  const attacks = {
    "@graph container": base({ evidence2: { id: "urn:e:1", "https://vocab.example/x#note": "x" } }),
    "type-scoped list term": base({ type: "Shipment", items: ["urn:i:1", "urn:i:2"] }),
    "top-level list term": base({ points: ["urn:p:1", "urn:p:2"] })
  };
  for (const [name, doc] of Object.entries(attacks)) {
    assert.ok((await blankNodes(doc, bytes)) > 0, `${name} produces blank nodes when expanded`);
    assert.equal(admission.check(doc).ok, false, name);
  }
  const fine = base({ type: "Role", scope: "Public" });
  assert.equal(admission.check(fine).ok, true, admission.check(fine).reason);
  assert.equal(await blankNodes(fine, bytes), 0);
});

test("document grammar: missing or blank ids, keywords, value objects, nested arrays and blank strings are rejected", () => {
  const admission = createAdmission(certify(analyse([V2, ENERGY], energyBytes), { signer: publisher, verificationMethod: pubVm }), { publishers, bytes: energyBytes });
  assert.equal(admission.check(credential).ok, true, admission.check(credential).reason);
  const variants = {
    "subject without id": (d) => { delete d.credentialSubject.id; },
    "blank subject id": (d) => { d.credentialSubject.id = "_:b0"; },
    "@included": (d) => { d["@included"] = [{ id: "urn:x" }]; },
    "value object": (d) => { d.credentialSubject.marketRole = { "@value": "x" }; },
    "nested array": (d) => { d.credentialSubject.marketRole = [["DistributionSystemOperator"]]; },
    "nested @context": (d) => { d.credentialSubject["@context"] = "https://contexts.example/b/v1"; },
    "unknown term": (d) => { d.credentialSubject.note = "x"; },
    "blank vocab value": (d) => { d.credentialSubject.marketRole = "_:x"; },
    "other top-level context": (d) => { d["@context"] = [V2]; }
  };
  for (const [name, mutate] of Object.entries(variants)) {
    const d = structuredClone(credential); mutate(d);
    assert.equal(admission.check(d).ok, false, name);
  }
});

test("soundness cross-check: every accepted random document expands without blank nodes", async () => {
  const admission = createAdmission(certify(analyse([V2, ENERGY], energyBytes), { signer: publisher, verificationMethod: pubVm }), { publishers, bytes: energyBytes });
  let seed = 7;
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  const pick = (xs) => xs[rnd(xs.length)];
  const terms = ["credentialSubject", "issuer", "validFrom", "marketRole", "dataAccessScope", "evidence", "note", "@reverse", "proof", "relatedResource"];
  const values = () => pick(["urn:x:" + rnd(9), "_:b" + rnd(3), "DistributionSystemOperator", "2026-01-01T00:00:00Z", 42, true, null, ["urn:a", "urn:b"], { id: "urn:n:" + rnd(9) }, {}, { "@value": "v" }]);
  let accepted = 0;
  let expanded = 0;
  // Biased towards valid structure, so that a meaningful share is accepted and cross-checked.
  const often = (good, bad) => (rnd(10) < 7 ? good : bad);
  for (let i = 0; i < 400; i++) {
    const doc = { "@context": [V2, ENERGY], id: often("urn:uuid:1", pick(["_:root", undefined])), type: often(["VerifiableCredential", "MarketRoleCredential"], pick(["_:T", "MarketRoleCredential"])) };
    if (doc.id === undefined) delete doc.id;
    const node = { id: often("did:example:s", pick(["_:s", undefined])) };
    if (node.id === undefined) delete node.id;
    for (let k = 0; k < 3; k++) node[often(pick(["marketRole", "dataAccessScope", "issuer"]), pick(terms))] = often(pick(["DistributionSystemOperator", "BatteryPassportPublicData", "urn:x:1"]), values());
    doc.credentialSubject = node;
    doc.issuer = "did:example:issuer";
    if (rnd(2)) doc[pick(terms)] = values();
    if (!admission.check(doc).ok) continue;
    accepted++;
    let n;
    try { n = await blankNodes(doc, energyBytes); } catch { continue; } // processing errors are rejections, not blank nodes
    expanded++;
    assert.equal(n, 0, `accepted document produced blank nodes: ${JSON.stringify(doc)}`);
  }
  assert.ok(expanded > 10, `enough successful expansions to be meaningful (${expanded})`);
  assert.ok(accepted > 10, `enough accepted documents to be meaningful (${accepted})`);
});

test("LFSC 0.4 with certified admission instead of the lexical pre-scan", async () => {
  const issuer = generateKeyPair();
  const did = `did:key:${issuer.publicKeyMultibase}`;
  const vm = `${did}#${issuer.publicKeyMultibase}`;
  const doc = { ...structuredClone(credential), issuer: did };
  const loader = () => staticLoader(Object.fromEntries(energyBytes));
  const signed = await issueLfsc(doc, { signer: issuer, verificationMethod: vm, loader: loader() });
  const admission = createAdmission(certify(analyse([V2, ENERGY], energyBytes), { signer: publisher, verificationMethod: pubVm }), { publishers, bytes: energyBytes });
  const opts = { loader: loader(), admission, issuers: new Map([[did, new Set([vm])]]) };
  assert.equal((await verifyLfsc(signed, opts)).verified, true);
  const attack = structuredClone(signed); attack.credentialSubject.note = "x";
  const r = await verifyLfsc(attack, opts);
  assert.equal(r.stage, 0);
  assert.match(r.reason, /term not admitted: note/);
});


test("excluded absolute and compact type terms cannot activate a rejected scoped context", async () => {
  for (const type of ["https://example.test/Evil", "ex:Evil"]) {
    const ctx = { "@context": { id: "@id", type: "@type", [type]: { "@id": type, "@context": { id: "https://example.test/identifier" } } } };
    const bytes = bytesOf({ [X]: JSON.stringify(ctx) });
    const analysis = analyse([X], bytes);
    assert.equal(analysis.admissible, true);
    assert.ok(analysis.excluded[type]);
    const admission = createAdmission(certify(analysis, { signer: publisher, verificationMethod: pubVm }), { publishers, bytes });
    const doc = { "@context": X, id: "urn:s", type };
    assert.ok(await blankNodes(doc, bytes) > 0, "fixture really produces a blank node");
    assert.equal(admission.check(doc).ok, false);
  }
});

test("admission certificates must match the supported processor profile", () => {
  for (const field of ["version", "rdfDirection"]) {
    const analysis = structuredClone(analyse([V2, ENERGY], energyBytes));
    if (field === "version") analysis.processor.version = "0.0.0-other";
    else analysis.processor.options.rdfDirection = "compound-literal";
    const cert = certify(analysis, { signer: publisher, verificationMethod: pubVm });
    assert.equal(createAdmission(cert, { publishers, bytes: energyBytes }).ok, false);
  }
  const mutable = analyse([V2, ENERGY], energyBytes);
  mutable.processor.options.rdfDirection = "compound-literal";
  assert.equal(analyse([V2, ENERGY], energyBytes).processor.options.rdfDirection, null);
});
