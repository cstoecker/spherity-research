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
