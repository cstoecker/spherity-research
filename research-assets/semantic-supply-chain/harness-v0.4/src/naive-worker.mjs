// SPDX-License-Identifier: Apache-2.0
// Child process: naive Data Integrity verification (canonicalise first, no limit).
import { staticLoader, W3C_CONTEXTS } from "./loader.mjs";
import { poison } from "./poison.mjs";
import { UNBOUNDED, verifyProof } from "./suites.mjs";

const [family, n, runs] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4])];
const doc = poison(family, n);
const times = [];
let outcome;
for (let i = 0; i < runs; i++) {
  const start = process.hrtime.bigint();
  try {
    const r = await verifyProof(doc, { loader: staticLoader(W3C_CONTEXTS), bound: UNBOUNDED });
    outcome = `verified=${r.verified}`;
  } catch (error) {
    outcome = error.message.split("\n")[0].slice(0, 90);
  }
  times.push(Number(process.hrtime.bigint() - start) / 1e6);
}
times.sort((a, b) => a - b);
process.stdout.write(JSON.stringify({ ms: times[Math.floor(times.length / 2)], runs: times.length, outcome }));
