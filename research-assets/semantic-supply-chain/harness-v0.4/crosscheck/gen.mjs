// Writes N-Quads for each poison family using the pinned harness stack (toRDF only).
import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(new URL("../package.json", import.meta.url));
const jsonld = require("jsonld");
const { poison } = await import("../src/poison.mjs");
const { staticLoader, W3C_CONTEXTS } = await import("../src/loader.mjs");
const { freshResolver } = await import("../src/suites.mjs");
mkdirSync("nq", { recursive: true });
const cases = [["complete",7],["complete",8],["ring",16],["binary-tree",63],["binary-tree",127],["binary-tree",255],["binary-tree",511],["labelled-tree",1500]];
for (const [f, n] of cases) {
  const doc = poison(f, n); delete doc.proof;
  const t = process.hrtime.bigint();
  const nq = await jsonld.toRDF(doc, { format: "application/n-quads", documentLoader: staticLoader(W3C_CONTEXTS), contextResolver: freshResolver(), safe: true });
  const ms = Number(process.hrtime.bigint() - t) / 1e6;
  writeFileSync(`nq/${f}-${n}.nq`, nq);
  console.log(f, n, "toRDF ms", ms.toFixed(1), "quads", nq.trim().split("\n").length, "blank nodes", new Set(nq.match(/_:[A-Za-z0-9]+/g)).size);
}
