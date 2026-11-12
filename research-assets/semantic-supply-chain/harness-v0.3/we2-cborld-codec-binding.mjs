// SPDX-License-Identifier: Apache-2.0
// WE-2: what a CBOR-LD label means depends on codec tables and context bytes
// that travel separately. Reference case: a market-role credential encoded for
// a Battery Passport label (QR / NFC), read years after printing.

import { writeFileSync } from "node:fs";
import { generateKeyPair, ecdsaSign, ecdsaVerify } from "./src/crypto.mjs";
import { decodeBound, decodePlain, encodeBound, manifestDigest } from "./src/cborld-binding.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "./src/loader.mjs";
import { addProof, verifyProof } from "./src/suites.mjs";

const V2 = "https://www.w3.org/ns/credentials/v2";
const EN = "https://contexts.example/energy-roles/v1";
const REGISTRY_ENTRY = 100;
const tableV1 = new Map([["context", new Map([[V2, 32768], [EN, 32769]])], ["url", new Map()], ["none", new Map()]]);

const original = contextFile("energy-roles-v1.jsonld");
// A routine vocabulary update published under the same URL: one term added.
const updatedContext = JSON.parse(original);
updatedContext["@context"] = { "@protected": true, AggregatorRole: "https://vocab.example/energy#Aggregator",
  ...Object.fromEntries(Object.entries(updatedContext["@context"]).filter(([k]) => k !== "@protected")) };
const updated = Buffer.from(JSON.stringify(updatedContext, null, 2));
const loaderWith = (energy) => staticLoader({ ...W3C_CONTEXTS, [EN]: energy });

const signer = generateKeyPair("P-256");
const did = `did:key:${signer.publicKeyMultibase}`;
const vm = `${did}#${signer.publicKeyMultibase}`;
const credential = {
  "@context": [V2, EN],
  id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11",
  type: ["VerifiableCredential", "MarketRoleCredential"],
  issuer: did,
  credentialSubject: { id: "did:example:grid-operator-42", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData" }
};

const rows = [];
const record = (id, scenario, outcome, detail) => rows.push({ id, scenario, outcome, detail });
const summary = (doc) => doc && JSON.stringify({
  topLevelKeys: Object.keys(doc).filter((k) => k !== "@context" && k !== "proof").sort(),
  type: doc.type,
  subject: doc.credentialSubject ?? "(missing)",
  scope: (doc.credentialSubject ?? doc.credentialStatus)?.dataAccessScope
});

// Issuance, as in the VC Barcodes pattern: Data Integrity proof first, then CBOR-LD.
const signed = await addProof(credential, { suite: "ecdsa-rdfc-2019", signer, verificationMethod: vm, loader: loaderWith(original) });
const { envelope, cborldBytes, manifest } = await encodeBound(signed, { registryEntryId: REGISTRY_ENTRY, typeTable: tableV1, documentLoader: loaderWith(original) });
// A compact profile that signs the compressed bytes instead (byte-level signature):
const unsignedBytes = (await encodeBound(credential, { registryEntryId: REGISTRY_ENTRY, typeTable: tableV1, documentLoader: loaderWith(original) })).cborldBytes;
const byteSignature = ecdsaSign("P-256", signer.key, Buffer.from(unsignedBytes));
const { key: issuerPublicKey } = await import("./src/suites.mjs").then((m) => m.resolveVerificationMethod(vm));

// S1 baseline
let decoded = await decodePlain(cborldBytes, { registryEntryId: REGISTRY_ENTRY, typeTable: tableV1, documentLoader: loaderWith(original) });
let v = await verifyProof(decoded, { loader: loaderWith(original) });
record("S1", "Baseline: label decoded with the issuer's registry entry and contexts", `proof valid: ${v.verified}`, summary(decoded));

// S2 routine context update at the verifier (same URL, one term added)
try {
  decoded = await decodePlain(cborldBytes, { registryEntryId: REGISTRY_ENTRY, typeTable: tableV1, documentLoader: loaderWith(updated) });
  let verify2;
  try { verify2 = (await verifyProof(decoded, { loader: loaderWith(updated) })).verified; } catch (error) { verify2 = `error: ${error.message.slice(0, 60)}`; }
  record("S2", "Signed label after a routine vocabulary update (one term added under the same URL)",
    `decodes without error into a different document; Data Integrity proof: ${verify2}`, summary(decoded));
} catch (error) {
  record("S2", "Signed label after a routine vocabulary update (one term added under the same URL)",
    `label UNREADABLE: decode error "${error.message.slice(0, 70)}" — the reason (codec drift) is not reported; the label stays unusable for its lifetime`, "");
}

// S3 byte-level signature over the compressed payload
const bytesValid = ecdsaVerify("P-256", issuerPublicKey, Buffer.from(unsignedBytes), byteSignature);
const decoded3 = await decodePlain(unsignedBytes, { registryEntryId: REGISTRY_ENTRY, typeTable: tableV1, documentLoader: loaderWith(updated) });
record("S3", "Compact profile signing the CBOR-LD bytes, after the same update",
  `signature valid: ${bytesValid}; meaning changed silently${(decoded3.credentialSubject ?? decoded3.credentialStatus)?.dataAccessScope !== "BatteryPassportPublicData" ? " (access scope changed)" : ""}`, summary(decoded3));

// S4 registry entry substituted at the verifier (context codes swapped)
const tableSwapped = new Map([["context", new Map([[EN, 32768], [V2, 32769]])], ["url", new Map()], ["none", new Map()]]);
let s4;
try {
  const d = await decodePlain(cborldBytes, { registryEntryId: REGISTRY_ENTRY, typeTable: tableSwapped, documentLoader: loaderWith(original) });
  let pv; try { pv = (await verifyProof(d, { loader: loaderWith(original) })).verified; } catch (e) { pv = `error: ${e.message.slice(0, 60)}`; }
  s4 = { outcome: `decodes; proof: ${pv}`, detail: summary(d) };
} catch (error) {
  s4 = { outcome: `decode error: ${error.message.slice(0, 80)}`, detail: "" };
}
record("S4", "Registry entry substituted at the verifier (context codes swapped)", s4.outcome, s4.detail);

// S5 M15: bound envelope, verifier has the updated context, no archive
const registryUpdated = new Map([[REGISTRY_ENTRY, { typeTable: tableV1, loader: loaderWith(updated) }]]);
let r = await decodeBound(envelope, { registry: registryUpdated });
record("S5", "M15 bound envelope; verifier's context was updated; no archive", r.ok ? "decoded" : `rejected before decoding: ${r.reason}`, "");

// S6 M15 + lifetime archive resolved by manifest digest
const archive = new Map([[manifestDigest(manifest).subarray(0, 16).toString("hex"), { typeTable: tableV1, loader: loaderWith(original) }]]);
r = await decodeBound(envelope, { registry: registryUpdated, archive });
v = r.ok ? await verifyProof(r.document, { loader: loaderWith(original) }) : { verified: false };
record("S6", "M15 bound envelope + lifetime archive of the issuer's manifest", `decoded from ${r.source}; proof valid: ${v.verified}`, summary(r.document));

// S7 M15 against the substituted registry entry
r = await decodeBound(envelope, { registry: new Map([[REGISTRY_ENTRY, { typeTable: tableSwapped, loader: loaderWith(original) }]]) });
record("S7", "M15 bound envelope; registry entry substituted at the verifier", r.ok ? "decoded" : `rejected before decoding: ${r.reason}`, "");

console.log(`\nWE-2 results (@digitalbazaar/cborld 8.1.0, Node ${process.version}); label sizes: CBOR-LD ${cborldBytes.length} bytes, bound envelope ${envelope.length} bytes\n`);
for (const row of rows) console.log(`[${row.id}] ${row.scenario}\n     => ${row.outcome}${row.detail ? `\n     decoded: ${row.detail}` : ""}\n`);
writeFileSync(new URL("./results/we2.json", import.meta.url), JSON.stringify({ node: process.version, sizes: { cborld: cborldBytes.length, envelope: envelope.length }, rows }, null, 2));
