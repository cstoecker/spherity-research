// SPDX-License-Identifier: Apache-2.0
// Static, allowlisted JSON-LD document loader. It never touches the network and
// records every URL the processor asks for (to observe SSRF reachability, as in
// arXiv:2611.04461). Context bytes are kept so their SRI digest can be checked.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
export const contextFile = (name) => readFileSync(path.join(here, "..", "contexts", name));

/**
 * @param {Record<string, Buffer|string>} entries URL -> exact context bytes
 * @param {{tag?: string}} options tag "static" opts into jsonld.js's process-wide cache
 */
export function staticLoader(entries, { tag } = {}) {
  const requests = [];
  const bytes = new Map(Object.entries(entries).map(([url, value]) => [url, Buffer.from(value)]));
  const loader = async (url) => {
    requests.push(url);
    if (!bytes.has(url)) {
      const error = new Error(`URL not on the allowlist: ${url}`);
      error.name = "jsonld.LoadDocumentError";
      throw error;
    }
    const document = JSON.parse(bytes.get(url).toString("utf8"));
    const result = { contextUrl: null, documentUrl: url, document };
    if (tag) result.tag = tag;
    return result;
  };
  loader.requests = requests;
  loader.bytes = bytes;
  return loader;
}

export const W3C_CONTEXTS = {
  "https://www.w3.org/ns/credentials/v2": contextFile("credentials-v2.jsonld"),
  "https://www.w3.org/ns/credentials/examples/v2": contextFile("credentials-examples-v2.jsonld"),
  // Needed only for the W3C ecdsa-rdfc-2019 test vectors.
  "https://w3id.org/citizenship/v4rc1": contextFile("citizenship-v4rc1.jsonld")
};

/**
 * Pinned loader (v0.4, H2; requirement VER-16): serves only the dependencies a proof declares,
 * and only if the bytes the verifier holds match the declared digest. Any other URL the
 * processor asks for (for example a context referenced from inside the document data or from a
 * scoped term definition) is an *undeclared dependency* and fails verification, instead of being
 * fetched or silently resolved.
 *
 * @param {Map<string, Buffer>} available bytes the verifier holds, by URL
 * @param {Array<{id: string, digestSRI: string}>} declared the proof's dependency list
 * @param {(bytes: Buffer) => string} sriOf digest function matching digestSRI
 */
export function pinnedLoader(available, declared, sriOf) {
  const allowed = new Map(declared.map(({ id, digestSRI }) => [id, digestSRI]));
  const requests = [];
  const refusals = []; // jsonld wraps loader errors; the precise reason is kept here
  const loader = async (url) => {
    requests.push(url);
    if (!allowed.has(url)) {
      refusals.push(`undeclared dependency: ${url}`);
      const error = new Error(`undeclared dependency: ${url}`);
      error.name = "jsonld.LoadDocumentError";
      throw error;
    }
    const bytes = available.get(url);
    if (!bytes || sriOf(bytes) !== allowed.get(url)) {
      refusals.push(`dependency digest mismatch: ${url}`);
      const error = new Error(`dependency digest mismatch: ${url}`);
      error.name = "jsonld.LoadDocumentError";
      throw error;
    }
    return { contextUrl: null, documentUrl: url, document: JSON.parse(bytes.toString("utf8")) };
  };
  loader.requests = requests;
  loader.refusals = refusals;
  loader.bytes = new Map([...allowed.keys()].filter((u) => available.has(u)).map((u) => [u, available.get(u)]));
  return loader;
}
