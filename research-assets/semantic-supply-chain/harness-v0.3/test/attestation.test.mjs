// SPDX-License-Identifier: Apache-2.0
// Requires swtpm and tpm2-tools; skipped when they are not installed.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { appraise, closureOf, EdgeDevice, provisionAttestationKey, startTpm } from "../src/attestation.mjs";
import { contextFile, W3C_CONTEXTS } from "../src/loader.mjs";

const available = spawnSync("swtpm", ["--version"]).status === 0 && spawnSync("tpm2_quote", ["--version"]).status === 0;
const V2 = "https://www.w3.org/ns/credentials/v2";
const EN = "https://contexts.example/energy-roles/v1";
const bundle = (file) => new Map([[V2, W3C_CONTEXTS[V2]], [EN, contextFile(file)]]);

test("measured semantics: approved closure accepted; substituted, forged, replayed and withdrawn rejected", { skip: !available && "swtpm/tpm2-tools not installed" }, () => {
  const work = mkdtempSync(path.join(tmpdir(), "we3-test-"));
  const tpm = startTpm(work, 2331);
  try {
    const ak = provisionAttestationKey(tpm);
    const honest = closureOf(bundle("energy-roles-v1.jsonld")).closureDigest;
    const approved = new Map([[honest, { status: "current" }]]);
    const run = (file, { log, receiptClosure, replay, closures = approved } = {}) => {
      const device = new EdgeDevice(tpm, ak);
      device.loadBundle({ bundleId: "b", version: "1", contextBytesByUrl: bundle(file) });
      const receipt = { verified: true, closureDigest: receiptClosure ?? device.loaded.closureDigest };
      const nonce = "00112233445566778899aabbccddeeff";
      const quote = device.attest(replay ? "ffeeddccbbaa99887766554433221100" : nonce, receipt);
      return appraise(tpm, { akPublicKeyPem: ak.publicKeyPem, quote, eventLog: log ?? device.eventLog, receipt, nonceHex: nonce, approvedClosures: closures });
    };
    assert.equal(run("energy-roles-v1.jsonld").accepted, true);
    assert.match(run("energy-roles-v1.SUBSTITUTED.jsonld").reason, /not approved/);
    assert.match(run("energy-roles-v1.SUBSTITUTED.jsonld", { log: [{ type: "semantic-bundle", bundleId: "b", version: "1", closureDigest: honest }], receiptClosure: honest }).reason, /does not replay/);
    assert.match(run("energy-roles-v1.jsonld", { replay: true }).reason, /quote invalid/);
    assert.match(run("energy-roles-v1.jsonld", { closures: new Map([[honest, { status: "withdrawn" }]]) }).reason, /withdrawn/);
  } finally {
    tpm.stop();
    rmSync(work, { recursive: true, force: true });
  }
});
