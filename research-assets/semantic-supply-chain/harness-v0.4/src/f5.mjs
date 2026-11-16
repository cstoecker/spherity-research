// SPDX-License-Identifier: Apache-2.0
// F5: RDF lists with repeated interior values under RDFC-1.0, on two library stacks (WE-6, H5).
// Current stack: jsonld 9.0.0 / rdf-canonize 5.0.0, whose default budget (maxWorkFactor 1) is the
// number of blank nodes that share a first-degree hash; each entry into N-degree hashing consumes
// one unit. Pinned v0.3 stack: jsonld 8.3.3 with rdf-canonize 3.4.0 and maxDeepIterations 1.
// These are measured outcomes for this generated graph shape, not a general criterion.
import jsonld from "jsonld";
import jsonldV8 from "jsonld-v8";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const canonize = require("rdf-canonize");
const context = { points: { "@id": "https://vocab.example/x#points", "@container": "@list" } };
export const listDocument = (values) => ({ "@context": context, "@id": "urn:s:1", points: values.map((v) => ({ "@value": v })) });

export async function current(values, options = {}) {
  const dataset = await jsonld.toRDF(listDocument(values), {});
  const t = performance.now();
  try {
    await canonize.canonize(dataset, { algorithm: "RDFC-1.0", ...options });
    return { completes: true, ms: performance.now() - t };
  } catch (error) {
    return { completes: false, ms: performance.now() - t, error: error.message };
  }
}

export async function pinnedV03(values, maxDeepIterations = 1) {
  const t = performance.now();
  try {
    await jsonldV8.canonize(listDocument(values), { algorithm: "URDNA2015", format: "application/n-quads", maxDeepIterations });
    return { completes: true, ms: performance.now() - t };
  } catch (error) {
    return { completes: false, ms: performance.now() - t, error: error.message };
  }
}

export const MATRIX = [
  [1, 2, 2, 3], [0, 0, 0, 1], [0, 1, 1, 0], [1, 2, 3, 3, 4, 5], [1, 2, 1, 2, 1, 2],
  [1, 2, 3, 1], [1, 2, 3, 2, 4], [0, 1, 0, 1, 0], [1, 2, 1, 2], [0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0, 0]
];
/** Outcomes on rdf-canonize 5.0.0 defaults, as measured on 13 November 2026 and reproduced independently. */
export const EXPECTED_DEFAULT = [false, false, false, false, false, true, true, true, true, true, false, false];
