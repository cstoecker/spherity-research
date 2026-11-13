// SPDX-License-Identifier: Apache-2.0
// WE-4: pre-authentication cost. A naive Data Integrity verifier canonicalises
// before it checks the signature, so an attacker with no issuer key can make it
// spend seconds. LFSC-G (M17) with the M18 pre-scan rejects the same inputs
// before any JSON-LD processing.
//
// Graph families follow arXiv:2611.04461: complete graph K_n and bidirectional
// ring C_n of blank nodes, plus an acyclic tree as control.

import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { generateKeyPair } from "./src/crypto.mjs";
import { poison } from "./src/poison.mjs";
import { issueLfsc, PROFILE, storedConfiguration, verifyFromQuads, verifyLfsc } from "./src/lfsc.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "./src/loader.mjs";
import { addProof, DEFAULT_BOUND, rdfc, UNBOUNDED, verifyProof } from "./src/suites.mjs";

const ENERGY = "https://contexts.example/energy-roles/v1";
const loader = () => staticLoader({ ...W3C_CONTEXTS, [ENERGY]: contextFile("energy-roles-v1.jsonld") });
const BUDGET_MS = 20000;

function naiveInChild(family, n, runs) {
  const child = spawnSync(process.execPath, [new URL("./src/naive-worker.mjs", import.meta.url).pathname, family, String(n), String(runs)],
    { timeout: BUDGET_MS + 2000, encoding: "utf8" });
  if (child.error || child.status !== 0 || !child.stdout) return { ms: BUDGET_MS, runs: 0, error: `exceeded ${BUDGET_MS / 1000} s budget` };
  return JSON.parse(child.stdout);
}

const p50 = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

async function measure(fn, runs) {
  const times = [];
  let last;
  for (let i = 0; i < runs; i++) {
    const start = process.hrtime.bigint();
    try {
      last = { value: await fn() };
    } catch (error) {
      last = { error: error.message.split("\n")[0].slice(0, 90) };
    }
    times.push(Number(process.hrtime.bigint() - start) / 1e6);
    if (times.at(-1) > BUDGET_MS / 2) break;
  }
  return { ms: p50(times), runs: times.length, ...last };
}

const allowedContexts = new Set(["https://www.w3.org/ns/credentials/v2", ENERGY]);
const issuer = generateKeyPair("P-256");
const issuerVm = `did:key:${issuer.publicKeyMultibase}#${issuer.publicKeyMultibase}`;
const allowedVerificationMethods = new Set([issuerVm]);

const results = [];
const cases = [
  ...[3, 4, 5, 6, 7, 8].map((n) => ["complete", n]),
  ...[6, 8, 10, 12, 16].map((n) => ["ring", n]),
  ...[63, 127, 255, 511].map((n) => ["binary-tree", n]),
  ["labelled-tree", 1500]
];

console.log("\nWE-4: cost to reject an attacker document with a forged proof (p50 ms)\n");
console.log("family          n    bytes |  naive, no limit           |  naive, default bound      | LFSC: as sent / allowlisted ctx + blank nodes / no blank nodes, forged proof");
for (const [family, n] of cases) {
  const doc = poison(family, n);
  const bytes = Buffer.byteLength(JSON.stringify(doc));
  const runs = (family === "complete" && n >= 7) || (family === "binary-tree" && n >= 127) ? 1 : 5;
  const naive = naiveInChild(family, n, runs);
  const bounded = await measure(() => verifyProof(doc, { loader: loader(), bound: DEFAULT_BOUND }), 5);
  const gate = await measure(() => verifyLfsc(doc, { loader: loader(), allowedContexts, allowedVerificationMethods }), 5);
  // Same graph with IRIs instead of blank nodes and an LFSC-shaped forged proof:
  const noBlank = poison(family, n, "ecdsa-lfsc-2026", { blankNodes: false });
  noBlank.proof.lexicalDigest = "sha256-AAAA";
  noBlank.proof.profile = PROFILE;
  noBlank.proof.semanticCommitment = { canonicalization: "RDFC-1.0", digest: "sha256-AAAA", dependencies: [], contextManifest: "sha256-AAAA" };
  noBlank["@context"] = ["https://www.w3.org/ns/credentials/v2", ENERGY];
  delete noBlank["@included"];
  const gate2 = await measure(() => verifyLfsc(noBlank, { loader: loader(), allowedContexts, allowedVerificationMethods }), 5);
  // Same graph with blank nodes, allowlisted contexts and no @included: isolates the M18 blank-node rule.
  const blankAllowlisted = poison(family, n, "ecdsa-lfsc-2026");
  blankAllowlisted["@context"] = ["https://www.w3.org/ns/credentials/v2", ENERGY];
  delete blankAllowlisted["@included"];
  blankAllowlisted.proof.lexicalDigest = "sha256-AAAA";
  blankAllowlisted.proof.profile = PROFILE;
  blankAllowlisted.proof.semanticCommitment = { canonicalization: "RDFC-1.0", digest: "sha256-AAAA", dependencies: [], contextManifest: "sha256-AAAA" };
  const gate3 = await measure(() => verifyLfsc(blankAllowlisted, { loader: loader(), allowedContexts, allowedVerificationMethods }), 5);
  const row = {
    family, n, bytes,
    naive: { ms: naive.ms, runs: naive.runs, outcome: naive.error ?? naive.outcome },
    bounded: { ms: bounded.ms, outcome: bounded.error ?? `verified=${bounded.value?.verified}` },
    lfsc: { ms: gate.ms, stage: gate.value?.stage, reason: gate.value?.reason },
    lfscBlankNodesAllowlistedContexts: { ms: gate3.ms, stage: gate3.value?.stage, reason: gate3.value?.reason },
    lfscWithoutBlankNodes: { ms: gate2.ms, stage: gate2.value?.stage, reason: gate2.value?.reason }
  };
  results.push(row);
  const cell = (r) => `${(r.runs === 0 ? ">" + r.ms : r.ms.toFixed(3)).toString().padStart(10)} ${(r.outcome ?? `stage ${r.stage}: ${r.reason}`).slice(0, 14).padEnd(14)}`;
  const g = (r) => `${r.ms.toFixed(3)} s${r.stage} ${r.reason.split(":")[0]}`;
  console.log(`${family.padEnd(13)} ${String(n).padStart(4)} ${String(bytes).padStart(8)} | ${cell(row.naive)} | ${cell(row.bounded)} | ${g(row.lfsc)} / ${g(row.lfscBlankNodesAllowlistedContexts)} / ${g(row.lfscWithoutBlankNodes)}`);
}

// Legitimate credential: naive RDFC verify vs. LFSC (first and cached)
const credential = {
  "@context": ["https://www.w3.org/ns/credentials/v2", ENERGY],
  id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11",
  type: ["VerifiableCredential", "MarketRoleCredential"],
  issuer: issuerVm.split("#")[0],
  validFrom: "2026-11-10T00:00:00Z",
  credentialSubject: { id: "did:example:grid-operator-42", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData" }
};
const rdfcSigned = await addProof(credential, { suite: "ecdsa-rdfc-2019", signer: issuer, verificationMethod: issuerVm, loader: loader() });
const jcsSigned = await addProof(credential, { suite: "ecdsa-jcs-2019", signer: issuer, verificationMethod: issuerVm });
const lfscSigned = await issueLfsc(credential, { signer: issuer, verificationMethod: issuerVm, loader: loader() });
for (let i = 0; i < 50; i++) await verifyProof(rdfcSigned, { loader: loader() }); // warm-up
const legit = {
  rdfc: await measure(() => verifyProof(rdfcSigned, { loader: loader() }), 200),
  jcs: await measure(() => verifyProof(jcsSigned), 200),
  lfscFirst: await measure(() => verifyLfsc(lfscSigned, { loader: loader(), allowedContexts, allowedVerificationMethods }), 200),
  lfscGraphNative: await (async () => {
    const unsecured = structuredClone(lfscSigned); delete unsecured.proof;
    const nquads = await rdfc(unsecured, loader(), UNBOUNDED, "sha256");
    const proof = storedConfiguration(lfscSigned);
    return measure(() => verifyFromQuads({ nquads, proof, issuer: issuerVm.split("#")[0], allowedVerificationMethods }), 200);
  })(),
  lfscCached: await (async () => {
    const cache = new Map();
    await verifyLfsc(lfscSigned, { loader: loader(), allowedContexts, allowedVerificationMethods, cache });
    return measure(() => verifyLfsc(lfscSigned, { loader: loader(), allowedContexts, allowedVerificationMethods, cache }), 200);
  })()
};
console.log("\nLegitimate market-role credential (p50 ms over 200 runs)");
for (const [name, r] of Object.entries(legit)) console.log(`  ${name.padEnd(11)} ${r.ms.toFixed(3)}  ${r.error ?? `verified=${r.value?.verified}`}`);

writeFileSync(new URL("./results/we4.json", import.meta.url), JSON.stringify({
  node: process.version, platform: `${process.platform}/${process.arch}`, at: new Date().toISOString(),
  budgetMs: BUDGET_MS, results,
  legitimate: Object.fromEntries(Object.entries(legit).map(([k, r]) => [k, { ms: r.ms, runs: r.runs }]))
}, null, 2));
