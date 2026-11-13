// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import test from "node:test";
import canonicalize from "canonicalize";
import { base58Encode, digest, DIGEST, ecdsaSign, generateKeyPair, typedId } from "../src/crypto.mjs";
import { issueLfsc, PROFILE, storedConfiguration, verifyFromQuads, verifyLfsc } from "../src/lfsc.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "../src/loader.mjs";
import { poison } from "../src/poison.mjs";
import { listTermsFrom, prescan } from "../src/prescan.mjs";
import { addProof, rdfc, UNBOUNDED, verifyProof } from "../src/suites.mjs";

const V2 = "https://www.w3.org/ns/credentials/v2";
const ENERGY = "https://contexts.example/energy-roles/v1";
const honest = () => staticLoader({ ...W3C_CONTEXTS, [ENERGY]: contextFile("energy-roles-v1.jsonld") });
const substituted = () => staticLoader({ ...W3C_CONTEXTS, [ENERGY]: contextFile("energy-roles-v1.SUBSTITUTED.jsonld") });
const signer = generateKeyPair();
const issuerDid = `did:key:${signer.publicKeyMultibase}`;
const vm = `${issuerDid}#${signer.publicKeyMultibase}`;
const credential = {
  "@context": [V2, ENERGY],
  id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11",
  type: ["VerifiableCredential", "MarketRoleCredential"],
  issuer: issuerDid,
  validFrom: "2026-11-10T00:00:00Z",
  credentialSubject: { id: "did:example:grid-operator-42", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData" }
};
const policy = { allowedContexts: new Set([V2, ENERGY]), issuers: new Map([[issuerDid, new Set([vm])]]) };

test("JCS proof stays valid when the context behind the URL is substituted (the gap)", async () => {
  const signed = await addProof(credential, { suite: "ecdsa-jcs-2019", signer, verificationMethod: vm });
  assert.equal((await verifyProof(signed)).verified, true);
});

test("RDFC proof fails under the same substitution", async () => {
  const signed = await addProof(credential, { suite: "ecdsa-rdfc-2019", signer, verificationMethod: vm, loader: honest() });
  assert.equal((await verifyProof(signed, { loader: honest() })).verified, true);
  assert.equal((await verifyProof(signed, { loader: substituted() })).verified, false);
});

test("LFSC 0.4 accepts the honest context, returns the authenticated view, and rejects the substituted one", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  assert.equal(signed.proof.profile, PROFILE);
  const ok = await verifyLfsc(signed, { loader: honest(), ...policy });
  assert.equal(ok.verified, true);
  assert.ok(Object.isFrozen(ok.view) && Object.isFrozen(ok.view.document));
  assert.match(ok.view.nquads, /BatteryPassportPublicData|Public/);
  const bad = await verifyLfsc(signed, { loader: substituted(), ...policy });
  assert.equal(bad.verified, false);
  assert.equal(bad.stage, 2);
  assert.match(bad.reason, /dependency digest mismatch/);
});

test("LFSC rejects a tampered claim at the lexical stage", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  signed.credentialSubject.dataAccessScope = "BatteryPassportRestrictedData";
  const result = await verifyLfsc(signed, { loader: honest(), ...policy });
  assert.equal(result.stage, 1);
  assert.match(result.reason, /lexical digest mismatch/);
});

test("X10 / VER-15: a key that does not belong to the named issuer is rejected, even if allowlisted", async () => {
  const other = generateKeyPair();
  const otherVm = `did:key:${other.publicKeyMultibase}#${other.publicKeyMultibase}`;
  const signed = await issueLfsc(credential, { signer: other, verificationMethod: otherVm, loader: honest() }); // names issuerDid
  const lax = { ...policy, issuers: new Map([[issuerDid, new Set([vm, otherVm])]]) };
  const result = await verifyLfsc(signed, { loader: honest(), ...lax });
  assert.equal(result.stage, 1);
  assert.match(result.reason, /does not belong to the named issuer/);
  const notAuthorised = await verifyLfsc(await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() }), { loader: honest(), ...policy, issuers: new Map() });
  assert.match(notAuthorised.reason, /not authorised for this issuer/);
});

test("X11 / H10: an oversized or malformed proof value is rejected before decoding", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  for (const proofValue of ["z" + "2".repeat(5000), "z0OIl", "u" + signed.proof.proofValue.slice(1), "z" + base58Encode(Buffer.alloc(63, 7))]) {
    const forged = structuredClone(signed);
    forged.proof.proofValue = proofValue;
    const result = await verifyLfsc(forged, { loader: honest(), ...policy });
    assert.equal(result.stage, 1);
    assert.match(result.reason, /proof value malformed|signature length/);
  }
});

test("H7 / VER-14: raw input with duplicate member names or out-of-range integers is rejected at stage 0", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  const raw = JSON.stringify(signed);
  assert.equal((await verifyLfsc(raw, { loader: honest(), ...policy })).verified, true);
  const duplicated = raw.replace('"validFrom":', '"validFrom":"2026-01-01T00:00:00Z","validFrom":');
  const r1 = await verifyLfsc(duplicated, { loader: honest(), ...policy });
  assert.equal(r1.stage, 0);
  assert.match(r1.reason, /duplicate member name/);
  const r2 = await verifyLfsc(raw.replace('"credentialSubject":{', '"credentialSubject":{"n":9007199254740993,'), { loader: honest(), ...policy });
  assert.match(r2.reason, /I-JSON range/);
});

test("v0.3 proofs (no profile) are rejected as an unsupported profile (must-understand)", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  delete signed.proof.profile;
  assert.match((await verifyLfsc(signed, { loader: honest(), ...policy })).reason, /unsupported LFSC profile/);
});

test("X13 / H11: a warm cache does not accept substituted context bytes; keys include epoch and configuration", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  const cache = new Map();
  const warm = await verifyLfsc(signed, { loader: honest(), ...policy, cache, epoch: 1 });
  assert.equal(warm.cached, false);
  assert.equal((await verifyLfsc(signed, { loader: honest(), ...policy, cache, epoch: 1 })).cached, true);
  const substitutedWarm = await verifyLfsc(signed, { loader: substituted(), ...policy, cache, epoch: 1 });
  assert.equal(substitutedWarm.verified, false); // v0.3: true/true on a warm cache
  assert.equal((await verifyLfsc(signed, { loader: honest(), ...policy, cache, epoch: 2 })).cached, false);
  assert.equal((await verifyLfsc(signed, { loader: honest(), ...policy, cache, epoch: 1, bound: UNBOUNDED })).cached, false);
});

test("X12 / H2: a context referenced from inside the document data is declared at issuance and pinned at verification", async () => {
  const A = "https://contexts.example/a/v1", B = "https://contexts.example/b/v1";
  const ctxA = { "@context": { subject: { "@id": "urn:p:subject", "@type": "@id" } } };
  const ctxB = (iri) => ({ "@context": { x: iri } });
  // A nested @context is not permitted by the lexical pre-scan, so this exercises issuance and stage 2
  // directly with an admission policy that allows it (the nested context is what the processor dereferences).
  const doc = { "@context": [V2, A], id: "urn:uuid:x12", type: ["VerifiableCredential"], issuer: issuerDid, credentialSubject: { id: "urn:subject", "@context": B, x: "value" } };
  const loaderFor = (iri) => staticLoader({ ...W3C_CONTEXTS, [A]: JSON.stringify(ctxA), [B]: JSON.stringify(ctxB(iri)) });
  const signed = await issueLfsc(doc, { signer, verificationMethod: vm, loader: loaderFor("urn:public") });
  assert.deepEqual(signed.proof.semanticCommitment.dependencies.map((d) => d.id).sort(), [A, B, V2].sort());
  const permissive = { check: () => ({ ok: true }) };
  const opts = (loader) => ({ loader, ...policy, admission: permissive });
  assert.equal((await verifyLfsc(signed, opts(loaderFor("urn:public")))).verified, true);
  const swapped = await verifyLfsc(signed, opts(loaderFor("urn:restricted")));
  assert.equal(swapped.verified, false);
  assert.match(swapped.reason, /dependency digest mismatch: https:\/\/contexts.example\/b\/v1/);
  // Tampering with the declaration fails at stage 1: the signature covers it.
  const tampered = structuredClone(signed);
  tampered.proof.semanticCommitment.dependencies = tampered.proof.semanticCommitment.dependencies.filter((d) => d.id !== B);
  assert.equal((await verifyLfsc(tampered, opts(loaderFor("urn:public")))).stage, 1);
  // An issuer that *signs* an incomplete declaration (omitting B) is caught at stage 2: the
  // pinned loader refuses the undeclared dependency instead of resolving it (VER-16).
  const incomplete = structuredClone(signed);
  const sc = incomplete.proof.semanticCommitment;
  sc.dependencies = sc.dependencies.filter((d) => d.id !== B);
  sc.contextManifest = typedId(DIGEST.contextManifest, canonicalize(sc.dependencies));
  const config = structuredClone(incomplete.proof); delete config.proofValue; config["@context"] = structuredClone(incomplete["@context"]);
  incomplete.proof.proofValue = "z" + base58Encode(ecdsaSign(signer.crv, signer.key, digest("sha256", canonicalize(config))));
  const r = await verifyLfsc(incomplete, opts(loaderFor("urn:public")));
  assert.equal(r.verified, false);
  assert.equal(r.stage, 2);
  assert.match(r.reason, /undeclared dependency: https:\/\/contexts.example\/b\/v1/);
});

test("X2: a context referenced from a scoped term definition (transitive) is part of the declared closure", async () => {
  const X = "https://contexts.example/x/v1", Y = "https://contexts.example/y/v1";
  const ctxX = { "@context": { "@protected": true, Role: { "@id": "https://vocab.example/x#Role", "@context": Y } } };
  const ctxY = (pub) => ({ "@context": { scope: { "@id": "https://vocab.example/y#scope", "@type": "@vocab" }, Public: pub } });
  const loaderFor = (pub) => staticLoader({ ...W3C_CONTEXTS, [X]: JSON.stringify(ctxX), [Y]: JSON.stringify(ctxY(pub)) });
  const doc = { "@context": [V2, X], id: "urn:uuid:x2", type: ["VerifiableCredential", "Role"], issuer: issuerDid, credentialSubject: { id: "urn:s:1" }, scope: "Public" };
  const signed = await issueLfsc(doc, { signer, verificationMethod: vm, loader: loaderFor("https://vocab.example/y#Public") });
  assert.ok(signed.proof.semanticCommitment.dependencies.some((d) => d.id === Y));
  const opts = (loader) => ({ loader, allowedContexts: new Set([V2, X]), issuers: policy.issuers });
  assert.equal((await verifyLfsc(signed, opts(loaderFor("https://vocab.example/y#Public")))).verified, true);
  const r = await verifyLfsc(signed, opts(loaderFor("https://vocab.example/y#Restricted")));
  assert.match(r.reason, /dependency digest mismatch: https:\/\/contexts.example\/y\/v1/);
});

test("negative cache: a stage-1 rejection is remembered for identical input, bounded in size", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  signed.credentialSubject.marketRole = "TransmissionSystemOperator";
  const negativeCache = new Map();
  await verifyLfsc(signed, { loader: honest(), ...policy, negativeCache, maxCacheEntries: 2 });
  assert.equal((await verifyLfsc(signed, { loader: honest(), ...policy, negativeCache, maxCacheEntries: 2 })).negativeCached, true);
});

test("pre-scan (v0.3, kept for comparison) rejects blank nodes, unlisted contexts and keywords", () => {
  const allowedContexts = policy.allowedContexts;
  assert.equal(prescan(credential, { allowedContexts }).ok, true);
  const attack = poison("complete", 5);
  assert.match(prescan(attack, { allowedContexts }).reason, /context not allowlisted/);
  attack["@context"] = [...allowedContexts];
  assert.match(prescan(attack, { allowedContexts }).reason, /keyword not permitted: @included/);
  delete attack["@included"];
  assert.match(prescan(attack, { allowedContexts }).reason, /blank nodes/);
});

test("context-aware pre-scan counts RDF lists as blank nodes (A1 remark in Proofs over Statements)", () => {
  const listContext = { "@context": { measurements: { "@id": "https://vocab.example/energy#measurements", "@container": "@list" } } };
  const listTerms = listTermsFrom([listContext]);
  const doc = structuredClone(credential);
  doc.credentialSubject.measurements = [1, 2, 3];
  assert.equal(prescan(doc, { allowedContexts: policy.allowedContexts }).ok, true);
  assert.match(prescan(doc, { allowedContexts: policy.allowedContexts, listTerms }).reason, /RDF list/);
});

test("LFSC-G re-verifies the whole dataset from stored quads, configuration and the authenticated issuer", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  const unsecured = structuredClone(signed); delete unsecured.proof;
  const nquads = await rdfc(unsecured, honest(), UNBOUNDED, "sha256");
  const proof = storedConfiguration(signed);
  const invalidSignature = { ...proof, proofValue: "z" + base58Encode(Buffer.alloc(64, 1)) };
  assert.match((await verifyFromQuads({ nquads, proof: invalidSignature, issuer: issuerDid, issuers: policy.issuers })).reason, /signature invalid/);
  assert.equal((await verifyFromQuads({ nquads, proof, issuer: issuerDid, issuers: policy.issuers })).verified, true);
  assert.equal((await verifyFromQuads({ nquads: nquads.replace("PublicData", "RestrictedData"), proof, issuer: issuerDid, issuers: policy.issuers })).verified, false);
  // X10: graph-native re-verification now also binds the issuer and its authorisation.
  assert.match((await verifyFromQuads({ nquads, proof, issuer: "did:example:someone-else", issuers: policy.issuers })).reason, /does not belong/);
  assert.match((await verifyFromQuads({ nquads, proof, issuer: issuerDid, issuers: new Map() })).reason, /not authorised/);
});

test("LFSC ingestion and graph re-verification reject signed proofs for another purpose or type", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  const accepted = await verifyLfsc(signed, { loader: honest(), ...policy });
  assert.equal(accepted.verified, true);
  const variants = [
    ["authentication purpose", (proof) => { proof.proofPurpose = "authentication"; }],
    ["missing purpose", (proof) => { delete proof.proofPurpose; }],
    ["wrong type", (proof) => { proof.type = "NotADataIntegrityProof"; }]
  ];
  for (const [name, edit] of variants) {
    const changed = structuredClone(signed);
    edit(changed.proof);
    const config = storedConfiguration(changed); delete config.proofValue;
    changed.proof.proofValue = "z" + base58Encode(ecdsaSign(signer.crv, signer.key, digest("sha256", canonicalize(config))));
    const ingestion = await verifyLfsc(changed, { loader: honest(), ...policy });
    assert.equal(ingestion.verified, false, `${name}: ingestion`);
    assert.equal(ingestion.stage, 1, `${name}: rejected before semantic processing`);
    const graph = await verifyFromQuads({ nquads: accepted.view.nquads, proof: storedConfiguration(changed), issuer: issuerDid, issuers: policy.issuers });
    assert.equal(graph.verified, false, `${name}: graph re-verification`);
  }
});
