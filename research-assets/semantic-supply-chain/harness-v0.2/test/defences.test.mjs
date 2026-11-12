// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import test from "node:test";
import { generateKeyPair } from "../src/crypto.mjs";
import { issueLfsc, storedConfiguration, verifyFromQuads, verifyLfsc } from "../src/lfsc.mjs";
import { rdfc } from "../src/suites.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "../src/loader.mjs";
import { poison } from "../src/poison.mjs";
import { listTermsFrom, prescan } from "../src/prescan.mjs";
import { addProof, verifyProof } from "../src/suites.mjs";

const ENERGY = "https://contexts.example/energy-roles/v1";
const honest = () => staticLoader({ ...W3C_CONTEXTS, [ENERGY]: contextFile("energy-roles-v1.jsonld") });
const substituted = () => staticLoader({ ...W3C_CONTEXTS, [ENERGY]: contextFile("energy-roles-v1.SUBSTITUTED.jsonld") });
const signer = generateKeyPair();
const vm = `did:key:${signer.publicKeyMultibase}#${signer.publicKeyMultibase}`;
const credential = {
  "@context": ["https://www.w3.org/ns/credentials/v2", ENERGY],
  id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11",
  type: ["VerifiableCredential", "MarketRoleCredential"],
  issuer: vm.split("#")[0],
  validFrom: "2026-11-10T00:00:00Z",
  credentialSubject: { id: "did:example:grid-operator-42", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData" }
};
const policy = { allowedContexts: new Set(["https://www.w3.org/ns/credentials/v2", ENERGY]), allowedVerificationMethods: new Set([vm]) };

test("JCS proof stays valid when the context behind the URL is substituted (the gap)", async () => {
  const signed = await addProof(credential, { suite: "ecdsa-jcs-2019", signer, verificationMethod: vm });
  assert.equal((await verifyProof(signed)).verified, true);
});

test("RDFC proof fails under the same substitution", async () => {
  const signed = await addProof(credential, { suite: "ecdsa-rdfc-2019", signer, verificationMethod: vm, loader: honest() });
  assert.equal((await verifyProof(signed, { loader: honest() })).verified, true);
  assert.equal((await verifyProof(signed, { loader: substituted() })).verified, false);
});

test("LFSC accepts the honest context and rejects the substituted one", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  assert.equal((await verifyLfsc(signed, { loader: honest(), ...policy })).verified, true);
  const result = await verifyLfsc(signed, { loader: substituted(), ...policy });
  assert.equal(result.verified, false);
  assert.equal(result.stage, 2);
});

test("LFSC rejects a tampered claim at the lexical stage", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  signed.credentialSubject.dataAccessScope = "BatteryPassportRestrictedData";
  const result = await verifyLfsc(signed, { loader: honest(), ...policy });
  assert.equal(result.verified, false);
  assert.equal(result.stage, 1);
});

test("LFSC cache is keyed by proof, commitment and authority epoch", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  const cache = new Map();
  assert.equal((await verifyLfsc(signed, { loader: honest(), ...policy, cache, epoch: 1 })).cached, false);
  assert.equal((await verifyLfsc(signed, { loader: honest(), ...policy, cache, epoch: 1 })).cached, true);
  assert.equal((await verifyLfsc(signed, { loader: honest(), ...policy, cache, epoch: 2 })).cached, false);
});

test("pre-scan rejects blank nodes, unlisted contexts and keywords before JSON-LD processing", () => {
  const allowedContexts = policy.allowedContexts;
  assert.equal(prescan(credential, { allowedContexts }).ok, true);
  const attack = poison("complete", 5);
  assert.match(prescan(attack, { allowedContexts }).reason, /context not allowlisted/);
  attack["@context"] = [...allowedContexts];
  assert.match(prescan(attack, { allowedContexts }).reason, /keyword not permitted: @included/);
  delete attack["@included"];
  assert.match(prescan(attack, { allowedContexts }).reason, /blank nodes/);
});

test("pre-scan also catches blank-node references carried as strings", () => {
  const doc = structuredClone(credential);
  doc.credentialSubject.link = ["_:b1", "_:b2"];
  assert.match(prescan(doc, { allowedContexts: policy.allowedContexts }).reason, /blank nodes/);
});

test("LFSC-G re-verifies from stored quads and configuration alone (graph-native)", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  const unsecured = structuredClone(signed); delete unsecured.proof;
  const nquads = await rdfc(unsecured, honest(), Infinity, "sha256");
  const proof = storedConfiguration(signed);
  assert.equal((await verifyFromQuads({ nquads, proof })).verified, true);
  const tampered = nquads.replace("PublicData", "RestrictedData");
  assert.equal((await verifyFromQuads({ nquads: tampered, proof })).verified, false);
});

test("LFSC-G rejects a genuine proof configuration attached to a different document at stage 1", async () => {
  const signed = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
  const other = structuredClone(signed);
  other.credentialSubject.marketRole = "TransmissionSystemOperator";
  const result = await verifyLfsc(other, { loader: honest(), ...policy });
  assert.equal(result.stage, 1);
  assert.match(result.reason, /lexical digest mismatch/);
});

test("context-aware pre-scan counts RDF lists as blank nodes (A1 remark in Proofs over Statements)", () => {
  const listContext = { "@context": { measurements: { "@id": "https://vocab.example/energy#measurements", "@container": "@list" } } };
  const listTerms = listTermsFrom([listContext]);
  const doc = structuredClone(credential);
  doc.credentialSubject.measurements = [1, 2, 3];
  assert.equal(prescan(doc, { allowedContexts: policy.allowedContexts }).ok, true); // context-unaware scan misses it
  assert.match(prescan(doc, { allowedContexts: policy.allowedContexts, listTerms }).reason, /RDF list/);
});
