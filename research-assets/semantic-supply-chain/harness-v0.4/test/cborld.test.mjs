// SPDX-License-Identifier: Apache-2.0
// M15 v0.4: codec binding over a complete decoding manifest. Uses the WE-2 credential and
// registry entry so results stay comparable with harness v0.3; X4, X7 and X8 are the formal
// review's attacks on v0.3, re-run against v0.4.
import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  ACCEPTED_PROFILES, INSTALLED_DECODER, buildManifest, decodeBound, decodePlain, digestHex, encodeBound,
  encodeEnvelope, encodePlain, manifestDigest, parseEnvelope, sealEnvelope, tableContextIds, verifyEnvelopeSignature
} from "../src/cborld-binding.mjs";
import { DIGEST, generateKeyPair, typedDigest } from "../src/crypto.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "../src/loader.mjs";
import { addProof, rdfc } from "../src/suites.mjs";
import canonicalize from "canonicalize";

const V2 = "https://www.w3.org/ns/credentials/v2";
const EN = "https://contexts.example/energy-roles/v1";
const REG = 100;
const table = new Map([["context", new Map([[V2, 32768], [EN, 32769]])], ["url", new Map()], ["none", new Map()]]);
const original = contextFile("energy-roles-v1.jsonld");
const substituted = contextFile("energy-roles-v1.SUBSTITUTED.jsonld");
const ctx = JSON.parse(original);
ctx["@context"] = { "@protected": true, AggregatorRole: "https://vocab.example/energy#Aggregator", ...Object.fromEntries(Object.entries(ctx["@context"]).filter(([k]) => k !== "@protected")) };
const updated = Buffer.from(JSON.stringify(ctx));
const loaderWith = (energy) => staticLoader({ ...W3C_CONTEXTS, [EN]: energy });

// X7 fixture: the same terms, but the access-scope vocabulary is imported from inside the pinned
// top-level context, so it never appears in the type table.
const ENX = "https://contexts.example/energy-roles/v2";
const SC = "https://contexts.example/battery-scopes/v1";
const PUBLIC = "https://vocab.example/battery#PublicData";
const RESTRICTED = "https://vocab.example/battery#RestrictedData";
const enx = JSON.stringify({ "@context": { "@import": SC, "@protected": true,
  MarketRoleCredential: "https://vocab.example/energy#MarketRoleCredential",
  marketRole: { "@id": "https://vocab.example/energy#marketRole", "@type": "@vocab" },
  DistributionSystemOperator: "https://vocab.example/energy#DistributionSystemOperator",
  TransmissionSystemOperator: "https://vocab.example/energy#TransmissionSystemOperator" } });
const scopes = (publicIri) => JSON.stringify({ "@context": {
  dataAccessScope: { "@id": "https://vocab.example/energy#dataAccessScope", "@type": "@vocab" },
  BatteryPassportPublicData: publicIri, BatteryPassportRestrictedData: RESTRICTED } });
const tableX = new Map([["context", new Map([[V2, 32768], [ENX, 32769]])], ["url", new Map()], ["none", new Map()]]);
const loaderX = (scopeIri) => staticLoader({ [V2]: W3C_CONTEXTS[V2], [ENX]: enx, [SC]: scopes(scopeIri) });

const signer = generateKeyPair("P-256");
const did = `did:key:${signer.publicKeyMultibase}`;
const vm = `${did}#${signer.publicKeyMultibase}`;
const credential = {
  "@context": [V2, EN], id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11", type: ["VerifiableCredential", "MarketRoleCredential"],
  issuer: did,
  credentialSubject: { id: "did:example:grid-operator-42", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData" }
};
const credentialX = { ...credential, "@context": [V2, ENX] };

const scopeOf = (graph) => /energy#dataAccessScope> <([^>]+)>/.exec(graph ?? "")?.[1];
const registry = (typeTable, loader, contexts) => new Map([[REG, { typeTable, loader, ...(contexts ? { contexts } : {}) }]]);
/** The digest a drifted verifier computes locally: what an attacker writes into a rewritten envelope. */
const localDigest = (typeTable, loader, contextIds = tableContextIds(typeTable)) =>
  manifestDigest(buildManifest({ registryEntryId: REG, typeTable, contextIds, contextBytes: loader.bytes }));
const rewrite = (envelope, digest) => encodeEnvelope({ ...parseEnvelope(envelope), manifestDigest: digest });
const issueB = (doc = credential, typeTable = table, loader = loaderWith(original)) =>
  encodeBound(doc, { registryEntryId: REG, typeTable, documentLoader: loader, profile: "B", signer, verificationMethod: vm });
const signedWith = (suite, loader = loaderWith(original)) => addProof(credential, { suite, signer, verificationMethod: vm, loader });

test("as deployed today: a routine context update silently changes what unbound CBOR-LD bytes decode to", async () => {
  const cborldBytes = await encodePlain(credential, { registryEntryId: REG, typeTable: table, documentLoader: loaderWith(original) });
  const decoded = await decodePlain(cborldBytes, { registryEntryId: REG, typeTable: table, documentLoader: loaderWith(updated) });
  assert.notDeepEqual(decoded, credential);
  assert.equal(decoded.credentialSubject, undefined);
});

test("the decoding manifest binds decoder, codecs, tables, transitive contexts and options under a 256-bit typed digest", async () => {
  const { envelope, manifest, manifestDigest: digest } = await issueB(credentialX, tableX, loaderX(PUBLIC));
  const pkg = JSON.parse(readFileSync(new URL("../node_modules/@digitalbazaar/cborld/package.json", import.meta.url)));
  assert.deepEqual(manifest.decoder, { name: "@digitalbazaar/cborld", version: pkg.version });
  assert.equal(manifest.processingModel, "cbor-ld/registry-entry");
  assert.equal(manifest.codecs.implementation, `@digitalbazaar/cborld@${pkg.version}`);
  assert.deepEqual(manifest.codecs.typeTableKeys, ["context", "none", "url"]);
  assert.ok(manifest.codecs.urlCodecs.some(([scheme]) => scheme === "did:key:"));
  assert.deepEqual(manifest.options, { base: null });
  // The transitive context SC is not in the type table, but the encoder requested it.
  assert.deepEqual(tableContextIds(tableX), [ENX, V2].sort());
  assert.deepEqual(manifest.contexts.map(({ id }) => id), [SC, ENX, V2].sort());
  assert.ok(manifest.contexts.every(({ digestSRI }) => digestSRI.startsWith("sha384-")));
  // 256 bits, domain-separated (not a bare SHA-256 of the JCS bytes).
  const fields = parseEnvelope(envelope);
  assert.equal(digest.length, 32);
  assert.equal(fields.manifestDigest.length, 32);
  assert.deepEqual(Buffer.from(fields.manifestDigest), typedDigest(DIGEST.decodingManifest, canonicalize(manifest)));
  assert.notDeepEqual(Buffer.from(fields.manifestDigest), createHash("sha256").update(canonicalize(manifest)).digest());
});

test("honest round trip, profile B: envelope signature checked first, document and graph as issued", async () => {
  const { envelope } = await issueB();
  assert.equal(parseEnvelope(envelope).profile, "B");
  const result = await decodeBound(envelope, { registry: registry(table, loaderWith(original)) });
  assert.equal(result.ok, true, result.reason);
  assert.equal(result.source, "local registry");
  assert.equal(result.signer, did);
  assert.deepEqual(result.document, credential);
  assert.equal(scopeOf(result.graph), PUBLIC);
});

test("honest round trip, profile I-RDFC: verified inner proof, graph as issued", async () => {
  const signed = await signedWith("ecdsa-rdfc-2019");
  const { envelope } = await encodeBound(signed, { registryEntryId: REG, typeTable: table, documentLoader: loaderWith(original), profile: "I-RDFC" });
  const fields = parseEnvelope(envelope);
  assert.equal(fields.verificationMethod, null);
  assert.equal(fields.signature, null);
  const result = await decodeBound(envelope, { registry: registry(table, loaderWith(original)) });
  assert.equal(result.ok, true, result.reason);
  assert.deepEqual(result.document, signed);
  assert.equal(result.signer, did);
  assert.equal(scopeOf(result.graph), PUBLIC);
});

test("X4 under profile B: a rewritten envelope fails the signature check before decoding; honest drift is caught and archived material restores it", async () => {
  const { envelope, archiveEntry, manifestDigest: digest } = await issueB();
  const drifted = registry(table, loaderWith(updated));
  const forged = rewrite(envelope, localDigest(table, loaderWith(updated)));
  const attacked = await decodeBound(forged, { registry: drifted });
  assert.equal(attacked.ok, false);
  assert.equal(attacked.stage, "signature");

  const honest = await decodeBound(envelope, { registry: drifted });
  assert.equal(honest.stage, "manifest");
  const named = await decodeBound(envelope, { registry: drifted, archive: new Map([[digestHex(digest), { manifest: archiveEntry.manifest }]]) });
  assert.deepEqual(named.differences.map(({ input, id }) => [input, id]), [["context", EN]]);
  const restored = await decodeBound(envelope, { registry: drifted, archive: new Map([[digestHex(digest), archiveEntry]]) });
  assert.equal(restored.ok, true, restored.reason);
  assert.match(restored.source, /lifetime archive/);
  assert.equal(scopeOf(restored.graph), PUBLIC);
});

test("the archive is content-addressed: an entry whose manifest does not hash to its key is ignored", async () => {
  const { envelope, manifestDigest: digest } = await issueB();
  // A tampered archive returns the drifted verifier's own manifest and material under the issuer's digest.
  const forgedManifest = buildManifest({ registryEntryId: REG, typeTable: table, contextIds: [V2, EN], contextBytes: loaderWith(updated).bytes });
  const tampered = new Map([[digestHex(digest), { manifest: forgedManifest, typeTable: table, contextBytes: loaderWith(updated).bytes }]]);
  const result = await decodeBound(envelope, { registry: registry(table, loaderWith(updated)), archive: tampered });
  assert.equal(result.stage, "manifest");
  assert.match(result.reason, /not in the archive, so the differing input cannot be named/);
  assert.deepEqual(result.differences, []);
});

test("profile A (signature over CBOR-LD bytes only) is rejected by policy", async () => {
  const { envelope } = await encodeBound(credential, { registryEntryId: REG, typeTable: table, documentLoader: loaderWith(original), profile: "A", signer, verificationMethod: vm });
  const forged = rewrite(envelope, localDigest(table, loaderWith(updated)));
  const result = await decodeBound(forged, { registry: registry(table, loaderWith(updated)) });
  assert.equal(result.stage, "policy");
  assert.match(result.reason, /X4/);
  assert.ok(!ACCEPTED_PROFILES.includes("A"));
});

test("why A is rejected (X4): accepted, the rewritten label decodes into restricted data under a valid signature", async () => {
  const { envelope } = await encodeBound(credential, { registryEntryId: REG, typeTable: table, documentLoader: loaderWith(original), profile: "A", signer, verificationMethod: vm });
  const forged = rewrite(envelope, localDigest(table, loaderWith(updated)));
  assert.equal(verifyEnvelopeSignature(parseEnvelope(forged)).ok, true);
  const unsafe = await decodeBound(forged, { registry: registry(table, loaderWith(updated)), acceptProfiles: ["A"] });
  assert.equal(unsafe.ok, true, unsafe.reason);
  assert.equal(unsafe.document.credentialSubject, undefined);
  assert.equal(scopeOf(unsafe.graph), RESTRICTED);
});

test("profile I-JCS is rejected by policy; I-RDFC under the same rewrite fails its inner proof", async () => {
  const drifted = registry(table, loaderWith(substituted));
  const forgedDigest = localDigest(table, loaderWith(substituted));
  const jcs = await encodeBound(await signedWith("ecdsa-jcs-2019"), { registryEntryId: REG, typeTable: table, documentLoader: loaderWith(original), profile: "I-JCS" });
  const rejected = await decodeBound(rewrite(jcs.envelope, forgedDigest), { registry: drifted });
  assert.equal(rejected.stage, "policy");
  assert.match(rejected.reason, /X8/);

  const rdfcLabel = await encodeBound(await signedWith("ecdsa-rdfc-2019"), { registryEntryId: REG, typeTable: table, documentLoader: loaderWith(original), profile: "I-RDFC" });
  const result = await decodeBound(rewrite(rdfcLabel.envelope, forgedDigest), { registry: drifted });
  assert.equal(result.ok, false);
  assert.equal(result.stage, "inner-proof");
});

test("why I-JCS is rejected (X8): accepted, the rewritten label keeps a valid JCS proof but means restricted data", async () => {
  const jcs = await encodeBound(await signedWith("ecdsa-jcs-2019"), { registryEntryId: REG, typeTable: table, documentLoader: loaderWith(original), profile: "I-JCS" });
  const forged = rewrite(jcs.envelope, localDigest(table, loaderWith(substituted)));
  const unsafe = await decodeBound(forged, { registry: registry(table, loaderWith(substituted)), acceptProfiles: ["I-JCS"] });
  assert.equal(unsafe.ok, true, unsafe.reason);
  assert.equal(unsafe.document.credentialSubject.dataAccessScope, "BatteryPassportPublicData");
  assert.equal(scopeOf(unsafe.graph), RESTRICTED);
});

test("X7: a substituted transitive context is detected before decoding; archive restores, else a precise failure", async () => {
  const { envelope, archiveEntry, manifestDigest: digest } = await issueB(credentialX, tableX, loaderX(PUBLIC));
  const key = digestHex(digest);
  const verifierLoader = loaderX(RESTRICTED);
  const closure = [V2, ENX, SC];
  // The verifier's registry entry declares the full closure; its copy of SC is substituted.
  const drifted = registry(tableX, verifierLoader, closure);
  assert.equal((await decodeBound(envelope, { registry: registry(tableX, loaderX(PUBLIC), closure) })).ok, true);

  const blind = await decodeBound(envelope, { registry: drifted });
  assert.equal(blind.stage, "manifest");
  assert.match(blind.reason, /cannot be named/);

  const precise = await decodeBound(envelope, { registry: drifted, archive: new Map([[key, { manifest: archiveEntry.manifest }]]) });
  assert.equal(precise.stage, "manifest");
  assert.deepEqual(precise.differences.map(({ input, id }) => [input, id]), [["context", SC]]);
  assert.match(precise.reason, /battery-scopes\/v1/);

  const restored = await decodeBound(envelope, { registry: drifted, archive: new Map([[key, archiveEntry]]) });
  assert.equal(restored.ok, true, restored.reason);
  assert.match(restored.source, /lifetime archive/);
  assert.equal(scopeOf(restored.graph), PUBLIC);
});

test("X7 as in the review probe: a substituted type-scoped context is named in the mismatch", async () => {
  const X = "https://contexts.example/x/v1";
  const Y = "https://contexts.example/y/v1";
  const ctxX = { "@context": { "@protected": true, Role: { "@id": "https://vocab.example/x#Role", "@context": Y } } };
  const ctxY = (pub) => ({ "@context": { scope: { "@id": "https://vocab.example/y#scope", "@type": "@vocab" }, Public: `https://vocab.example/y#${pub}`, Restricted: "https://vocab.example/y#Restricted" } });
  const L = (pub) => staticLoader({ [V2]: W3C_CONTEXTS[V2], [X]: JSON.stringify(ctxX), [Y]: JSON.stringify(ctxY(pub)) });
  const tableXY = new Map([["context", new Map([[V2, 32768], [X, 32769]])], ["url", new Map()], ["none", new Map()]]);
  const doc = { "@context": [V2, X], id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11", type: ["VerifiableCredential"], issuer: did, credentialSubject: { id: "urn:s:1", type: "Role", scope: "Public" } };
  const { envelope, archiveEntry, manifestDigest: digest } = await issueB(doc, tableXY, L("Public"));
  assert.ok(archiveEntry.manifest.contexts.some(({ id }) => id === Y));
  const result = await decodeBound(envelope, { registry: registry(tableXY, L("Restricted")), archive: new Map([[digestHex(digest), { manifest: archiveEntry.manifest }]]) });
  assert.equal(result.stage, "manifest");
  assert.deepEqual(result.differences.map(({ input, id }) => [input, id]), [["context", Y]]);
});

test("decoder drift (MC-4) is detected before decoding, and archived material cannot repair it", async () => {
  const { envelope, archiveEntry, manifestDigest: digest } = await issueB();
  const local = registry(table, loaderWith(original));
  const archive = new Map([[digestHex(digest), archiveEntry]]);
  const newer = { ...INSTALLED_DECODER, version: "9.0.0" };
  const versionDrift = await decodeBound(envelope, { registry: local, archive, decoder: newer });
  assert.equal(versionDrift.stage, "manifest");
  assert.deepEqual(versionDrift.differences.map(({ input }) => input), ["decoder"]);
  assert.match(versionDrift.reason, /archive cannot repair.*8\.1\.0.*9\.0\.0/);
  // Same version string, different codec semantics (for example a patched build).
  const patched = { ...INSTALLED_DECODER, codecs: { ...INSTALLED_DECODER.codecs, urlCodecs: [...INSTALLED_DECODER.codecs.urlCodecs, ["did:web:", 1026]] } };
  const codecDrift = await decodeBound(envelope, { registry: local, archive: new Map([[digestHex(digest), { manifest: archiveEntry.manifest }]]), decoder: patched });
  assert.deepEqual(codecDrift.differences.map(({ input, id }) => [input, id]), [["codecs", "urlCodecs"]]);
});

test("a URL the manifest does not list is refused during decoding (v0.3 top-level manifest scope)", async () => {
  const cborldBytes = await encodePlain(credentialX, { registryEntryId: REG, typeTable: tableX, documentLoader: loaderX(PUBLIC) });
  // A manifest that lists only the contexts named in the type table, as v0.3 did.
  const topLevel = buildManifest({ registryEntryId: REG, typeTable: tableX, contextIds: tableContextIds(tableX), contextBytes: loaderX(PUBLIC).bytes });
  const envelope = sealEnvelope({ profile: "B", registryEntryId: REG, manifest: topLevel, cborldBytes, signer, verificationMethod: vm });
  const result = await decodeBound(envelope, { registry: registry(tableX, loaderX(PUBLIC)) });
  assert.equal(result.stage, "decode");
  assert.match(result.reason, /undeclared URL requested during decoding: https:\/\/contexts\.example\/battery-scopes\/v1/);
  // What v0.3's unpinned decoding gave under that valid signature, with SC substituted (X7).
  assert.equal(verifyEnvelopeSignature(parseEnvelope(envelope)).ok, true);
  const v03 = await decodePlain(cborldBytes, { registryEntryId: REG, typeTable: tableX, documentLoader: loaderX(RESTRICTED) });
  assert.equal(scopeOf(await rdfc(v03, loaderX(RESTRICTED))), RESTRICTED);
});

test("a substituted registry entry is rejected before decoding, naming the table entries", async () => {
  const { envelope, archiveEntry, manifestDigest: digest } = await issueB();
  const swapped = new Map([["context", new Map([[EN, 32768], [V2, 32769]])], ["url", new Map()], ["none", new Map()]]);
  const result = await decodeBound(envelope, { registry: registry(swapped, loaderWith(original)), archive: new Map([[digestHex(digest), { manifest: archiveEntry.manifest }]]) });
  assert.equal(result.stage, "manifest");
  assert.deepEqual(result.differences.map(({ input, id }) => [input, id]), [["typeTable", "context"], ["typeTable", "context"]]);
});

test("issuer-key binding: a profile B envelope re-signed with another key is rejected", async () => {
  const { envelope } = await issueB();
  const attacker = generateKeyPair("P-256");
  const attackerVm = `did:key:${attacker.publicKeyMultibase}#${attacker.publicKeyMultibase}`;
  const fields = parseEnvelope(envelope);
  const manifest = buildManifest({ registryEntryId: REG, typeTable: table, contextIds: [V2, EN], contextBytes: loaderWith(original).bytes });
  const resigned = sealEnvelope({ profile: "B", registryEntryId: REG, manifest, cborldBytes: fields.cborldBytes, signer: attacker, verificationMethod: attackerVm });
  const result = await decodeBound(resigned, { registry: registry(table, loaderWith(original)) });
  assert.equal(result.stage, "issuer-binding");
});

test("malformed envelopes are rejected before any processing", async () => {
  const { envelope } = await issueB();
  const fields = parseEnvelope(envelope);
  const short = encodeEnvelope({ ...fields, manifestDigest: fields.manifestDigest.subarray(0, 16) });
  assert.match((await decodeBound(short)).reason, /32 bytes/);
  const otherEntry = encodeEnvelope({ ...fields, registryEntryId: 101 });
  assert.match((await decodeBound(otherEntry)).reason, /header names registry entry 100/);
  const unsignedB = encodeEnvelope({ ...fields, verificationMethod: null, signature: null });
  assert.equal((await decodeBound(unsignedB)).stage, "envelope");
});
