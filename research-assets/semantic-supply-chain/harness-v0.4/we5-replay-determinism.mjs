// SPDX-License-Identifier: Apache-2.0
// WE-5: a wall-clock limit makes the verification outcome depend on the
// machine's load; an operation bound does not. Input: a *legitimate* credential
// with many blank nodes (unique literal per node: no deep iterations needed),
// i.e. a credential a verifier should accept every time, including on replay.

import { cpus } from "node:os";
import { Worker } from "node:worker_threads";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import jsonld from "jsonld";
import { poison } from "./src/poison.mjs";
import { staticLoader, W3C_CONTEXTS } from "./src/loader.mjs";
import { freshResolver } from "./src/suites.mjs";

const require = createRequire(import.meta.url);
const canonize = require("rdf-canonize");
const RUNS = 21;

const doc = poison("labelled-tree", 600);
delete doc.proof;
const nquads = await jsonld.toRDF(doc, { format: "application/n-quads", documentLoader: staticLoader(W3C_CONTEXTS), contextResolver: freshResolver(), safe: true });
const dataset = () => canonize.NQuads.parse(nquads);

async function once(maxDeepIterations) {
  const start = process.hrtime.bigint();
  let completed = true;
  try {
    await canonize.canonize(dataset(), { algorithm: "RDFC-1.0", format: "application/n-quads", maxDeepIterations });
  } catch {
    completed = false;
  }
  return { ms: Number(process.hrtime.bigint() - start) / 1e6, completed };
}

async function series(label, maxDeepIterations) {
  const out = [];
  for (let i = 0; i < RUNS; i++) out.push(await once(maxDeepIterations));
  const sorted = out.map((r) => r.ms).sort((a, b) => a - b);
  return { label, runs: out, p50: sorted[Math.floor(RUNS / 2)], max: sorted.at(-1) };
}

function startLoad(workers) {
  const code = "const end = Date.now() + 600000; let x = 0; while (Date.now() < end) { x += Math.sqrt(x + 1); }";
  return Array.from({ length: workers }, () => new Worker(code, { eval: true }));
}

for (let i = 0; i < 5; i++) await once(1); // warm-up
const idle = await series("idle", 1);
const limitMs = Math.round(idle.p50 * 1.5 * 10) / 10; // a plausible, generous-looking time limit
const OPERATION_BOUND = 1; // RDFC deep-iteration bound (enough for this legitimate input)

const loadWorkers = cpus().length * 2;
const load = startLoad(loadWorkers);
await new Promise((resolve) => setTimeout(resolve, 500));
const loaded = await series(`loaded (${loadWorkers} busy threads on ${cpus().length} CPUs)`, 1);
await Promise.all(load.map((w) => w.terminate()));

const decide = (r) => ({
  time: r.completed && r.ms <= limitMs ? "accept" : "reject",
  operations: r.completed ? "accept" : "reject"
});
const tally = (s) => {
  const decisions = s.runs.map(decide);
  const count = (policy, value) => decisions.filter((d) => d[policy] === value).length;
  return { p50: +s.p50.toFixed(1), max: +s.max.toFixed(1),
    timePolicy: `${count("time", "accept")}/${RUNS} accepted`, operationPolicy: `${count("operations", "accept")}/${RUNS} accepted` };
};

const result = {
  node: process.version, cpus: cpus().length, input: "labelled tree, 600 blank nodes with unique literals (legitimate)",
  quads: nquads.trim().split("\n").length, timeLimitMs: limitMs, operationBound: `maxDeepIterations=${OPERATION_BOUND}`,
  idle: tally(idle), loaded: tally(loaded)
};
console.log("\nWE-5: same legitimate credential, same verifier, different load\n");
console.log(`time limit = ${limitMs} ms (1.5 × idle median); operation bound = ${result.operationBound}`);
for (const [name, t] of [["idle", result.idle], [loaded.label, result.loaded]]) {
  console.log(`${name.padEnd(42)} p50 ${String(t.p50).padStart(7)} ms  max ${String(t.max).padStart(7)} ms | time-limit policy: ${t.timePolicy.padEnd(14)} | operation-bound policy: ${t.operationPolicy}`);
}
writeFileSync(new URL("./results/we5.json", import.meta.url), JSON.stringify(result, null, 2));
