// node canon.mjs <stack: old|new> <file> [maxWorkFactor]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const [stack, file, mwf] = process.argv.slice(2);
const base = stack === "old" ? new URL("../package.json", import.meta.url).pathname : process.cwd() + "/package.json";
const canonize = createRequire(base)("rdf-canonize");
const nq = readFileSync(file, "utf8");
const opts = stack === "old" ? { algorithm: "URDNA2015", inputFormat: "application/n-quads", format: "application/n-quads" }
  : { algorithm: "RDFC-1.0", inputFormat: "application/n-quads", format: "application/n-quads", ...(mwf !== undefined ? { maxWorkFactor: Number(mwf) } : {}) };
const t = process.hrtime.bigint();
let out = "ok";
try { await canonize.canonize(stack === "old" ? canonize.NQuads.parse(nq) : nq, opts); } catch (e) { out = "ABORT: " + e.message.slice(0, 60); }
console.log(JSON.stringify({ ms: +(Number(process.hrtime.bigint() - t) / 1e6).toFixed(1), out }));
