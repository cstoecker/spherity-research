// SPDX-License-Identifier: Apache-2.0
// M24 attested decisions (WE-3). The swtpm tests need swtpm, swtpm_ioctl and tpm2-tools and are
// skipped without them; they use TCP ports 2341/2342 and 2343/2344.
//
// The test exercises receipt construction, policy-gated signing and appraisal under an idealised
// boundary, in which the test adversary has no access to authorisation secrets, protected memory
// or bypass paths. Ordinary host root is not excluded by such process boundaries, so isolation is
// not demonstrated; that requires a TEE or a confidential VM.
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import canonicalize from "canonicalize";
import {
  appraiseKeyCertification, engineModules, engineReference, IDEALISED_BOUNDARY, modifiedEngineModules, policyDigest,
  provisionAttestationKey, provisionStorageKey, runMeasuredSemantics, startTpm, tpmToolchain
} from "../src/attestation.mjs";
import { DIGEST, sri, typedId } from "../src/crypto.mjs";
import {
  certifyKey, contextManifestOf, createKey, evaluateRule, KEY_ATTRIBUTES, receiptMessage, snapshotOf, TAG, taggedDigest, trialPolicy
} from "../src/engine-process.mjs";

const toolchain = tpmToolchain();
const skip = !(toolchain.swtpm && toolchain.swtpmIoctl && toolchain.tpm2Tools) && "swtpm, swtpm_ioctl or tpm2-tools not installed";
const BOUNDARY = "(idealised boundary: isolation is not demonstrated; that requires a TEE or a confidential VM)";

const V2 = "https://www.w3.org/ns/credentials/v2";
const EN = "https://contexts.example/energy-roles/v1";
const context = (name) => readFileSync(new URL(`../contexts/${name}`, import.meta.url));
const closureWith = (energy) => [{ url: V2, bytes: context("credentials-v2.jsonld") }, { url: EN, bytes: context(energy) }];
const credential = (subject = {}) => Buffer.from(JSON.stringify({
  "@context": [V2, EN], type: ["VerifiableCredential", "MarketRoleCredential"],
  credentialSubject: { id: "did:example:grid-operator-42", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData", ...subject }
}));

test("receipt message: domain-separated, covers every field, refuses unsigned extras", () => {
  const receipt = { type: TAG.receipt, audience: "rp", challenge: "c", decisionId: "d", outcome: "public", semanticClosure: "s", decisionContext: "x" };
  const message = receiptMessage(receipt);
  for (const field of ["audience", "challenge", "decisionId", "outcome", "semanticClosure", "decisionContext"]) {
    assert.notDeepEqual(receiptMessage({ ...receipt, [field]: `${receipt[field]}'` }), message, field);
  }
  // Moving bytes between adjacent fields changes the encoding (length prefixes).
  assert.notDeepEqual(receiptMessage({ ...receipt, challenge: "cd", decisionId: "d" }), receiptMessage({ ...receipt, challenge: "c", decisionId: "dd" }));
  // Not a T11′ replay receipt: the tags differ, so neither kind verifies as the other.
  assert.notEqual(TAG.receipt, DIGEST.receipt);
  assert.throws(() => receiptMessage({ ...receipt, note: "unsigned" }), /field set/);
  assert.throws(() => receiptMessage({ ...receipt, outcome: undefined }), /field set|non-empty/);
  assert.throws(() => receiptMessage({ ...receipt, type: DIGEST.receipt }), /not an attested-decision receipt/);
});

test("policy digest: TPM 2.0 Part 3 computation reproduces digests recorded from tpm2-tools 5.6 trial sessions", () => {
  // Recorded on swtpm 0.7.3: PCR 15 extended once from zero with 32 bytes 0xaa, then
  // tpm2_policypcr -l sha256:15 [-> tpm2_policyauthvalue] in a trial session.
  const pcrValue = createHash("sha256").update(Buffer.concat([Buffer.alloc(32), Buffer.alloc(32, 0xaa)])).digest();
  assert.equal(pcrValue.toString("hex"), "9ef814b42fa0be12d197c44d3e8e03441a4b1118237658368ba1351090e556ed");
  assert.equal(policyDigest({ pcrValue, withAuthValue: false }).toString("hex"), "7e6f1db67ede1859445bbdd838cd555108e8447d206a6ea059c5a7984536a645");
  assert.equal(policyDigest({ pcrValue, withAuthValue: true }).toString("hex"), "66ce647446d280bd44f12f2cfdd7204797f70c62eda87ec36c48c5440a8353b7");
});

test("engine rule: the closure decides the meaning; tested unsupported forms are unknown", () => {
  const decide = (input, closure) => evaluateRule(snapshotOf({ input, closure }));
  assert.equal(decide(credential(), closureWith("energy-roles-v1.jsonld")), "public");
  assert.equal(decide(credential(), closureWith("energy-roles-v1.SUBSTITUTED.jsonld")), "restricted");
  assert.equal(decide(credential(), closureWith("energy-roles-v1.jsonld").slice(0, 1)), "unknown", "context missing from the closure");
  assert.equal(decide(credential({ dataAccessScope: "SomethingElse" }), closureWith("energy-roles-v1.jsonld")), "unknown", "undefined value term");
  const redefining = Buffer.from(JSON.stringify({ "@context": { id: "https://example.org/other-id" } }));
  const input = Buffer.from(JSON.stringify({ ...JSON.parse(credential()), "@context": [V2, EN, "https://example.org/redefine"] }));
  assert.equal(decide(input, [...closureWith("energy-roles-v1.jsonld"), { url: "https://example.org/redefine", bytes: redefining }]), "unknown", "protected term redefined");
  assert.equal(decide(Buffer.from("not json"), closureWith("energy-roles-v1.jsonld")), "unknown");
});

test("engine rule refuses nested input contexts instead of ignoring their semantics", () => {
  const url = "https://example.test/flat";
  const context = { "@context": {
    id: "@id", credentialSubject: "https://www.w3.org/2018/credentials#credentialSubject",
    dataAccessScope: { "@id": "https://vocab.example/energy#dataAccessScope", "@type": "@vocab" },
    Choice: "https://vocab.example/battery#RestrictedData"
  } };
  const doc = { "@context": url, id: "urn:credential", credentialSubject: {
    "@context": { Choice: "https://vocab.example/battery#PublicData" },
    id: "urn:subject", dataAccessScope: "Choice"
  } };
  const closure = [{ url, bytes: Buffer.from(JSON.stringify(context)) }];
  assert.equal(evaluateRule(snapshotOf({ input: Buffer.from(JSON.stringify(doc)), closure })), "unknown");
  delete doc.credentialSubject["@context"];
  assert.equal(evaluateRule(snapshotOf({ input: Buffer.from(JSON.stringify(doc)), closure })), "restricted");
});

test("engine snapshot: own frozen copy; context manifest equals the JCS form LFSC-G commits to", () => {
  const input = credential();
  const closure = closureWith("energy-roles-v1.jsonld");
  const snapshot = snapshotOf({ input, closure });
  const before = Buffer.from(snapshot.inputBytes);
  input.fill(0);
  closure[1].bytes.fill(0);
  assert.deepEqual(snapshot.inputBytes, before, "a later change to the caller's buffer does not reach the snapshot");
  assert.ok(Object.isFrozen(snapshot) && Object.isFrozen(snapshot.closure) && snapshot.closure.every(Object.isFrozen));
  const fresh = closureWith("energy-roles-v1.jsonld");
  const dependencies = fresh.map(({ url, bytes }) => ({ id: url, digestSRI: sri(bytes) })).sort((a, b) => (a.id < b.id ? -1 : 1));
  assert.equal(contextManifestOf(fresh), typedId(DIGEST.contextManifest, canonicalize(dependencies)));
  assert.throws(() => contextManifestOf([...fresh, fresh[0]]), /twice/);
});

test("measured engine code: entry plus crypto.mjs; a modification changes the launch event and the PCR value", () => {
  const modules = engineModules();
  assert.deepEqual(modules.map(({ name }) => name), ["engine-process.mjs", "crypto.mjs"]);
  const approved = engineReference(modules);
  const modified = engineReference(modifiedEngineModules(modules));
  assert.notEqual(modified.codeDigest, approved.codeDigest);
  assert.ok(!modified.pcrValue.equals(approved.pcrValue));
  assert.equal(approved.digest, taggedDigest(TAG.engineLaunch, approved.engine, approved.codeDigest).toString("hex"));
  assert.notDeepEqual(policyDigest({ pcrValue: modified.pcrValue, withAuthValue: true }), policyDigest({ pcrValue: approved.pcrValue, withAuthValue: true }));
});

// WE-3 A-H on swtpm. The test adversary is host code with TPM access but, by the idealised
// boundary, no access to the engine's authorisation value, its memory or bypass paths.
test(`M24 on swtpm: scenarios A-H as predicted ${BOUNDARY}`, { skip }, async () => {
  const { environment, scenarios } = await runMeasuredSemantics({ port: 2341 });
  for (const row of scenarios) assert.equal(row.actual, row.expected, `${row.id} ${row.name}: ${row.detail}`);
  const actual = Object.fromEntries(scenarios.map(({ id, actual: result }) => [id, result]));
  assert.deepEqual(Object.keys(actual), ["A1", "A2", "A3", "B", "C1", "C2", "C3", "C4", "C5", "D1", "D2", "E1", "E2", "E3", "F1", "F2", "F3", "G1", "G2", "H"]);
  assert.equal(actual.B, "accepted restricted", "B reproduces the V4 defect: a forged receipt under the PCR-only key is accepted");
  assert.equal(actual.C1, "TPM refused: TPM_RC_BAD_AUTH", "C: the exclusive key refuses the host");
  assert.equal(actual.D1, "TPM refused: TPM_RC_LOCALITY");
  assert.equal(actual.D2, "reset succeeded; register rewritten", "D2: PCR 23 is resettable, so bundle events are monitoring only");
  assert.equal(actual.E1, "TPM refused: TPM_RC_POLICY_FAIL");
  assert.equal(actual.F1, "TPM refused: TPM_RC_POLICY_FAIL");
  assert.equal(actual.F2, "accepted public");
  assert.deepEqual(environment.policies.trial, environment.policies.computed, "trial sessions equal the Part 3 computation");
  assert.deepEqual(environment.ruleOutcomes, { approved: "public", substituted: "restricted" });
  assert.match(environment.pcrOnlyKeyUnderExclusivePolicy, /not the approved engine's policy/);
  assert.match(IDEALISED_BOUNDARY, /isolation is not demonstrated; that requires a TEE or a confidential VM\.$/);
});

test(`M24 key certification on swtpm: tampered, swapped, policy-bypassing and wrong-policy keys are rejected ${BOUNDARY}`, { skip }, () => {
  const work = mkdtempSync(path.join(tmpdir(), "we3-cert-"));
  const tpm = startTpm(work, 2343);
  try {
    const ak = provisionAttestationKey(tpm);
    const srk = provisionStorageKey(tpm);
    const { pcrValue } = engineReference();
    const expectedPolicy = trialPolicy(tpm, pcrValue, { withAuthValue: true });
    const authValue = randomBytes(32);
    const certified = (handle, { withAuthValue = true, attributes } = {}) => {
      const publicArea = createKey(tpm, { parent: srk, handle, policy: trialPolicy(tpm, pcrValue, { withAuthValue }), authValue: withAuthValue ? authValue : undefined, attributes });
      const { attest, signature } = certifyKey(tpm, { key: handle, ak: ak.handle, authValue: withAuthValue ? authValue : undefined });
      return { public: publicArea.toString("base64"), attest: attest.toString("base64"), signature: signature.toString("base64") };
    };
    const check = (certification) => appraiseKeyCertification({ akPublicKeyPem: ak.publicKeyPem, certification, expectedPolicy });

    const good = certified("0x81010011");
    assert.equal(check(good).ok, true, check(good).reason);
    const attest = Buffer.from(good.attest, "base64");
    attest[attest.length - 1] ^= 1;
    assert.match(check({ ...good, attest: attest.toString("base64") }).reason, /not signed by the attestation key/);

    // userWithAuth set: the same policy digest, but the authorisation value alone signs, with no
    // PCR condition (PCR 15 is zero here, not the approved value). The relying party must refuse it.
    const bypass = certified("0x81010012", { attributes: `${KEY_ATTRIBUTES}|userwithauth` });
    tpm.run("tpm2_sign", ["-c", "0x81010012", "-g", "sha256", "-f", "plain", "-p", "file:-", "-o", "bypass.sig", "ak.pub"], authValue);
    assert.match(check(bypass).reason, /userWithAuth is set/);
    assert.match(check({ ...good, public: bypass.public }).reason, /certified name does not match/);

    assert.match(check(certified("0x81010013", { withAuthValue: false })).reason, /not the approved engine's policy/);
  } finally {
    tpm.stop();
    rmSync(work, { recursive: true, force: true });
  }
});
