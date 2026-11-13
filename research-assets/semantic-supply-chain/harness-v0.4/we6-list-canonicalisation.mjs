// SPDX-License-Identifier: Apache-2.0
// WE-6: F5 on two stacks. Writes results/we6.txt and results/we6.json.
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { current, EXPECTED_DEFAULT, MATRIX, pinnedV03 } from "./src/f5.mjs";
import { analyse } from "./src/admission.mjs";

const require = createRequire(import.meta.url);
const versions = { jsonld: require("jsonld/package.json").version, rdfCanonize: require("rdf-canonize/package.json").version, jsonldV8: require("jsonld-v8/package.json").version };
const out = [];
const log = (s = "") => { console.log(s); out.push(s); };
const json = { harness: "0.4.0", example: "WE-6", versions, matrix: [], equalValuesV03: [], unbounded: [] };

log(`WE-6: lists with repeated interior values (F5). jsonld ${versions.jsonld} / rdf-canonize ${versions.rdfCanonize}; pinned v0.3 stack jsonld ${versions.jsonldV8} (rdf-canonize 3.4.0).`);
log("Measured outcomes for this generated graph (named subject, one @list property, literal items, default graph); not a general criterion.\n");
log("| List | 5.0.0 default (maxWorkFactor 1) | maxWorkFactor 2 | v0.3 stack, maxDeepIterations 1 |");
log("|---|---|---|---|");
let asExpected = true;
for (const [i, values] of MATRIX.entries()) {
  const d = await current(values), w2 = await current(values, { maxWorkFactor: 2 }), v3 = await pinnedV03(values);
  if (d.completes !== EXPECTED_DEFAULT[i]) asExpected = false;
  const cell = (r) => (r.completes ? "completes" : `fails (${r.error.replace(/\.$/, "")})`);
  log(`| \`[${values}]\` | ${cell(d)} | ${cell(w2)} | ${cell(v3)} |`);
  json.matrix.push({ values, default: d, maxWorkFactor2: w2, pinnedV03: v3 });
}
log(`\nDefault-bound outcomes ${asExpected ? "match" : "DO NOT match"} the matrix of 13 November 2026.`);
log("\nv0.3 stack, all values equal, maxDeepIterations 1:");
for (const n of [3, 4, 5, 6]) {
  const r = await pinnedV03(Array(n).fill(0));
  log(`  ${n} equal values: ${r.completes ? "completes" : "fails"}`);
  json.equalValuesV03.push({ n, completes: r.completes });
}
log("\nUnbounded (maxWorkFactor Infinity), all values equal, single runs on this machine:");
for (const n of [50, 100, 200]) {
  const r = await current(Array(n).fill(7), { maxWorkFactor: Infinity });
  log(`  ${n} values: ${r.ms.toFixed(0)} ms`);
  json.unbounded.push({ n, ms: Math.round(r.ms) });
}
const a = analyse(["https://contexts.example/x/v1"], new Map([["https://contexts.example/x/v1", Buffer.from(JSON.stringify({ "@context": { id: "@id", type: "@type", points: { "@id": "https://vocab.example/x#points", "@container": "@list" } } }))]]));
log(`\nUnder the v0.4 admission grammar the list term is excluded (${a.excluded.points}): certified credentials never carry RDF lists,`);
log("so F5 cannot arise in admitted input. Applications that need ordered values model them without @list (for example indexed items).");
json.admission = { listTermExcluded: !!a.excluded.points };
writeFileSync(new URL("./results/we6.txt", import.meta.url), out.join("\n") + "\n");
writeFileSync(new URL("./results/we6.json", import.meta.url), JSON.stringify(json, null, 2) + "\n");
if (!asExpected) process.exit(1);
