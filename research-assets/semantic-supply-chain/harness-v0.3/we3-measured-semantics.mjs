// SPDX-License-Identifier: Apache-2.0
// WE-3: measured semantics (M24) on a software TPM. An edge verifier (gateway,
// battery management system, charge point) runs a common JCS-only stack, so
// its own verdict cannot reveal which meaning it applied (WE-1 B). Can a
// relying party still tell, remotely, which meaning the device ran?

import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import jsonld from "jsonld";
import { appraise, closureOf, EdgeDevice, provisionAttestationKey, startTpm } from "./src/attestation.mjs";
import { generateKeyPair } from "./src/crypto.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "./src/loader.mjs";
import { addProof, freshResolver, verifyProof } from "./src/suites.mjs";

const V2 = "https://www.w3.org/ns/credentials/v2";
const EN = "https://contexts.example/energy-roles/v1";
const bundle = (energyFile) => new Map([[V2, W3C_CONTEXTS[V2]], [EN, contextFile(energyFile)]]);
const honestBundle = bundle("energy-roles-v1.jsonld");
const substitutedBundle = bundle("energy-roles-v1.SUBSTITUTED.jsonld");

const signer = generateKeyPair("P-256");
const did = `did:key:${signer.publicKeyMultibase}`;
const vm = `${did}#${signer.publicKeyMultibase}`;
const credential = await addProof({
  "@context": [V2, EN], id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11", type: ["VerifiableCredential", "MarketRoleCredential"],
  issuer: did, validFrom: "2026-11-10T00:00:00Z",
  credentialSubject: { id: "did:example:grid-operator-42", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData" }
}, { suite: "ecdsa-jcs-2019", signer, verificationMethod: vm });

/** The device's verification: JCS signature check, then the meaning it applies. */
async function deviceVerify(device) {
  const { verified } = await verifyProof(credential);
  const loader = staticLoader(Object.fromEntries(device.loaded.contextBytesByUrl));
  const expanded = await jsonld.expand(credential, { documentLoader: loader, contextResolver: freshResolver() });
  const scope = expanded[0]["https://www.w3.org/2018/credentials#credentialSubject"][0]["https://vocab.example/energy#dataAccessScope"][0]["@id"];
  return { credentialId: credential.id, verified, appliedScope: scope, closureDigest: device.loaded.closureDigest, at: "2026-11-12T12:00:00Z" };
}

const work = mkdtempSync(path.join(tmpdir(), "we3-"));
const tpm = startTpm(work);
const rows = [];
try {
  const ak = provisionAttestationKey(tpm);
  const honest = closureOf(honestBundle).closureDigest;
  const substituted = closureOf(substitutedBundle).closureDigest;
  const approvedClosures = new Map([[honest, { bundle: "energy-roles", version: "1.0", status: "current" }]]);
  const nonce = () => randomBytes(16).toString("hex");
  const record = (id, scenario, receipt, result) =>
    rows.push({ id, scenario, deviceVerdict: receipt.verified, appliedScope: receipt.appliedScope, ...result });

  // A: device loads the approved bundle
  let device = new EdgeDevice(tpm, ak);
  device.loadBundle({ bundleId: "energy-roles", version: "1.0", contextBytesByUrl: honestBundle });
  let receipt = await deviceVerify(device);
  let n = nonce();
  record("A", "Device runs the approved semantic bundle", receipt,
    appraise(tpm, { akPublicKeyPem: ak.publicKeyPem, quote: device.attest(n, receipt), eventLog: device.eventLog, receipt, nonceHex: n, approvedClosures }));

  // B: device's local copy of the context was substituted (CDN, cache, tampering)
  device = new EdgeDevice(tpm, ak);
  device.loadBundle({ bundleId: "energy-roles", version: "1.0", contextBytesByUrl: substitutedBundle });
  receipt = await deviceVerify(device);
  n = nonce();
  record("B", "Device runs a substituted context under the same URL (its JCS verifier still says valid)", receipt,
    appraise(tpm, { akPublicKeyPem: ak.publicKeyPem, quote: device.attest(n, receipt), eventLog: device.eventLog, receipt, nonceHex: n, approvedClosures }));

  // C: compromised device lies: runs the substituted bundle, presents a forged log and receipt naming the approved closure
  const lying = new EdgeDevice(tpm, ak);
  lying.loadBundle({ bundleId: "energy-roles", version: "1.0", contextBytesByUrl: substitutedBundle });
  receipt = { ...(await deviceVerify(lying)), closureDigest: honest };
  const forgedLog = [{ type: "semantic-bundle", bundleId: "energy-roles", version: "1.0", closureDigest: honest }];
  n = nonce();
  record("C", "Compromised device forges its event log and receipt to claim the approved closure", receipt,
    appraise(tpm, { akPublicKeyPem: ak.publicKeyPem, quote: lying.attest(n, receipt), eventLog: forgedLog, receipt, nonceHex: n, approvedClosures }));

  // D: replay of an old, genuine quote for a new challenge
  device = new EdgeDevice(tpm, ak);
  device.loadBundle({ bundleId: "energy-roles", version: "1.0", contextBytesByUrl: honestBundle });
  receipt = await deviceVerify(device);
  const oldNonce = nonce();
  const oldQuote = device.attest(oldNonce, receipt);
  record("D", "Old genuine quote replayed against a fresh challenge", receipt,
    appraise(tpm, { akPublicKeyPem: ak.publicKeyPem, quote: oldQuote, eventLog: device.eventLog, receipt, nonceHex: nonce(), approvedClosures }));

  // E: the publisher withdraws the bundle (semantic advisory, M30 -> M25); device has not updated
  const afterWithdrawal = new Map([[honest, { bundle: "energy-roles", version: "1.0", status: "withdrawn" }]]);
  n = nonce();
  record("E", "Publisher withdrew the bundle; device still runs it", receipt,
    appraise(tpm, { akPublicKeyPem: ak.publicKeyPem, quote: device.attest(n, receipt), eventLog: device.eventLog, receipt, nonceHex: n, approvedClosures: afterWithdrawal }));

  console.log("\nWE-3: measured semantics on a software TPM (swtpm 0.7.3, tpm2-tools 5.6), PCR 23, ECDSA P-256 attestation key\n");
  console.log(`approved closure:    ${honest.slice(0, 16)}…   substituted closure: ${substituted.slice(0, 16)}…\n`);
  for (const r of rows) {
    console.log(`[${r.id}] ${r.scenario}`);
    console.log(`     device verdict: ${r.deviceVerdict}; meaning applied: ${r.appliedScope}`);
    console.log(`     relying party: ${r.accepted ? "ACCEPT" : "REJECT"} — ${r.reason}\n`);
  }
  writeFileSync(new URL("./results/we3.json", import.meta.url), JSON.stringify({ node: process.version, tpm: "swtpm 0.7.3 / tpm2-tools 5.6", pcr: 23, rows }, null, 2));
} finally {
  tpm.stop();
  rmSync(work, { recursive: true, force: true });
}
