// SPDX-License-Identifier: Apache-2.0
// WE-3: attested decisions (M24, theorem T11, MC-3) on a software TPM, harness v0.4.0.
// A relying party needs to know which meaning a remote edge device applied, even when the device's
// own verifier says "valid" (WE-1 B). The v0.3 design measured bundle loads into the resettable
// PCR 23 and was defeated (X6). Here an engine, measured into the non-resettable PCR 15 and run
// as a separate OS process, decides and signs receipts with a TPM key under one of two policies:
// PCR-only (MC-3 V4, reproduced as defeated) or PCR and an authorisation value held only by the
// engine (MC-3 V5).
//
// The test exercises receipt construction, policy-gated signing and appraisal under an idealised
// boundary, in which the test adversary has no access to authorisation secrets, protected memory
// or bypass paths. Ordinary host root is not excluded by such process boundaries, so isolation is
// not demonstrated; that requires a TEE or a confidential VM.
//
// Prints the scenario table and writes results/we3.txt and results/we3.json. Needs swtpm,
// swtpm_ioctl and tpm2-tools; uses TCP ports 2351 (TPM) and 2352 (swtpm control channel).

import { writeFileSync } from "node:fs";
import { IDEALISED_BOUNDARY, runMeasuredSemantics, tpmToolchain } from "./src/attestation.mjs";

const toolchain = tpmToolchain();
if (!toolchain.swtpm || !toolchain.swtpmIoctl || !toolchain.tpm2Tools) {
  console.error("WE-3 needs swtpm, swtpm_ioctl and tpm2-tools (e.g. apt-get install swtpm swtpm-tools tpm2-tools).");
  process.exit(1);
}

const { environment: env, scenarios: rows } = await runMeasuredSemantics({ port: 2351 });
const short = (hex) => `${hex.slice(0, 16)}…`;
const header = [
  "WE-3: attested decisions (M24, theorem T11, MC-3), harness v0.4.0",
  `swtpm ${env.swtpm}, tpm2-tools ${env.tpm2Tools}, Node ${env.node}`,
  "",
  IDEALISED_BOUNDARY,
  "",
  `Measured launch: SHA-256 over the engine's modules (${env.engine.modules.join(", ")}) as a typed engine-launch event,`,
  `extended into PCR ${env.enginePcr} (PC Client profile: resettable at no locality); the engine runs as a separate OS process.`,
  `  engine code ${short(env.engine.codeDigest)}  approved PCR ${env.enginePcr} ${short(env.engine.pcrValue)}  modified engine code ${short(env.modifiedEngine.codeDigest)}`,
  `Receipt keys: ECDSA P-256, attributes ${env.keyAttributes} (userWithAuth clear), certified by the attestation key:`,
  `  PCR-only  (MC-3 V4)  PolicyPCR(sha256:${env.enginePcr} = approved engine)                     ${short(env.policies.trial.pcrOnly)}`,
  `  exclusive (MC-3 V5)  PolicyPCR(sha256:${env.enginePcr} = approved engine) AND PolicyAuthValue  ${short(env.policies.trial.exclusive)}`,
  `  trial-session digests equal the TPM 2.0 Part 3 computation: ${JSON.stringify(env.policies.trial) === JSON.stringify(env.policies.computed) ? "yes" : "NO"}`,
  `Closures: approved ${short(env.closures.approved.split(":").pop())} (rule: ${env.ruleOutcomes.approved}), ` +
    `substituted ${short(env.closures.substituted.split(":").pop())} (rule: ${env.ruleOutcomes.substituted})`,
  `Bundle loads extend PCR ${env.monitorPcr} for monitoring only (M23); they bind no decision.`,
  ""
];
const lines = rows.map((r) => `${r.ok ? "as predicted" : "UNEXPECTED  "} ${r.id.padEnd(4)} ${r.name}\n${" ".repeat(18)}-> ${r.actual} (${r.detail})`);
const text = [...header, ...lines, "", `${rows.filter((r) => r.ok).length} of ${rows.length} scenarios as predicted`].join("\n");
console.log(text);
writeFileSync(new URL("./results/we3.txt", import.meta.url), text + "\n");
writeFileSync(new URL("./results/we3.json", import.meta.url),
  JSON.stringify({ harness: "0.4.0", example: "WE-3", boundary: IDEALISED_BOUNDARY, environment: env, scenarios: rows }, null, 2) + "\n");
if (!rows.every((r) => r.ok)) process.exit(1);
