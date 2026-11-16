// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import test from "node:test";
import { decodeBound, decodePlain, encodeBound, manifestDigest } from "../src/cborld-binding.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "../src/loader.mjs";

const V2 = "https://www.w3.org/ns/credentials/v2";
const EN = "https://contexts.example/energy-roles/v1";
const table = new Map([["context", new Map([[V2, 32768], [EN, 32769]])], ["url", new Map()], ["none", new Map()]]);
const original = contextFile("energy-roles-v1.jsonld");
const ctx = JSON.parse(original);
ctx["@context"] = { "@protected": true, AggregatorRole: "https://vocab.example/energy#Aggregator", ...Object.fromEntries(Object.entries(ctx["@context"]).filter(([k]) => k !== "@protected")) };
const updated = Buffer.from(JSON.stringify(ctx));
const loaderWith = (energy) => staticLoader({ ...W3C_CONTEXTS, [EN]: energy });
const credential = {
  "@context": [V2, EN], id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11", type: ["VerifiableCredential", "MarketRoleCredential"],
  issuer: "did:example:issuer",
  credentialSubject: { id: "did:example:grid-operator-42", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData" }
};

test("a routine context update silently changes what unbound CBOR-LD bytes decode to", async () => {
  const { cborldBytes } = await encodeBound(credential, { registryEntryId: 100, typeTable: table, documentLoader: loaderWith(original) });
  const decoded = await decodePlain(cborldBytes, { registryEntryId: 100, typeTable: table, documentLoader: loaderWith(updated) });
  assert.notDeepEqual(decoded, credential);
  assert.equal(decoded.credentialSubject, undefined);
});

test("M15 rejects a drifted registry before decoding and recovers from the lifetime archive", async () => {
  const { envelope, manifest } = await encodeBound(credential, { registryEntryId: 100, typeTable: table, documentLoader: loaderWith(original) });
  const registry = new Map([[100, { typeTable: table, loader: loaderWith(updated) }]]);
  assert.equal((await decodeBound(envelope, { registry })).ok, false);
  const archive = new Map([[manifestDigest(manifest).subarray(0, 16).toString("hex"), { typeTable: table, loader: loaderWith(original) }]]);
  const recovered = await decodeBound(envelope, { registry, archive });
  assert.equal(recovered.ok, true);
  assert.deepEqual(recovered.document.credentialSubject, credential.credentialSubject);
});
