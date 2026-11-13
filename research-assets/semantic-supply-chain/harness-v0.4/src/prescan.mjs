// SPDX-License-Identifier: Apache-2.0
// M18: linear-time structural pre-scan, run before any JSON-LD processing.
// Rejects blank nodes, unknown keywords, inline or unlisted contexts and
// oversized or deeply nested input. The proof object is a pinned pattern and
// is skipped: LFSC never canonicalises it as RDF. A verifier that canonicalises
// the proof options with RDFC (ecdsa-rdfc-2019) must scan them as well.

/**
 * Minimal "compiled context" information (M5): the terms whose definitions make
 * JSON arrays into RDF lists. An RDF list creates one blank node per element,
 * even when every entity has an IRI ("Proofs over Statements", A1 remark).
 * This reads simple term definitions; a signed compiled context would supply it.
 */
export function listTermsFrom(contextDocuments) {
  const terms = new Set();
  for (const document of contextDocuments) {
    for (const context of [].concat(document["@context"] ?? [])) {
      if (!context || typeof context !== "object") continue;
      for (const [term, definition] of Object.entries(context)) {
        const container = definition && typeof definition === "object" ? [].concat(definition["@container"] ?? []) : [];
        if (container.includes("@list")) terms.add(term);
      }
    }
  }
  return terms;
}

export function prescan(document, {
  allowedContexts,
  listTerms = new Set(),
  maxBytes = 64 * 1024,
  maxDepth = 16,
  maxBlankNodes = 0,
  allowedKeywords = new Set(["@context"])
} = {}) {
  const bytes = Buffer.byteLength(JSON.stringify(document));
  if (bytes > maxBytes) return { ok: false, reason: `size ${bytes} > ${maxBytes}` };
  const contexts = [].concat(document["@context"] ?? []);
  for (const context of contexts) {
    if (typeof context !== "string") return { ok: false, reason: "inline context not permitted" };
    if (!allowedContexts.has(context)) return { ok: false, reason: `context not allowlisted: ${context}` };
  }
  let blankNodes = 0;
  const stack = [[document, 0, true]];
  while (stack.length) {
    const [value, depth, isRoot] = stack.pop();
    if (depth > maxDepth) return { ok: false, reason: `depth > ${maxDepth}` };
    if (Array.isArray(value)) {
      for (const item of value) stack.push([item, depth + 1, false]);
      continue;
    }
    if (value === null || typeof value !== "object") continue;
    if (!("@value" in value)) {
      const id = value.id ?? value["@id"];
      if (typeof id !== "string" || id.startsWith("_:")) blankNodes++;
      if (blankNodes > maxBlankNodes) return { ok: false, reason: `blank nodes > ${maxBlankNodes}` };
    }
    for (const [key, child] of Object.entries(value)) {
      if (key.startsWith("@") && !(isRoot && allowedKeywords.has(key)) && key !== "@value" && key !== "@id") {
        return { ok: false, reason: `keyword not permitted: ${key}` };
      }
      if (isRoot && (key === "proof" || key === "@context")) continue;
      // Arrays under @list terms become RDF lists: one blank node per element.
      if (listTerms.has(key) && Array.isArray(child)) {
        blankNodes += Math.max(child.length, 1);
        if (blankNodes > maxBlankNodes) return { ok: false, reason: `blank nodes > ${maxBlankNodes} (RDF list under "${key}")` };
      }
      // A string can also reference a blank node (for terms coerced to @id).
      const strings = typeof child === "string" ? [child] : Array.isArray(child) ? child.filter((item) => typeof item === "string") : [];
      if (key !== "id" && key !== "@id" && strings.some((item) => item.startsWith("_:"))) {
        blankNodes++;
        if (blankNodes > maxBlankNodes) return { ok: false, reason: `blank nodes > ${maxBlankNodes}` };
      }
      // Recurse into objects and arrays only.
      if (child && typeof child === "object") stack.push([child, depth + 1, false]);
    }
  }
  return { ok: true, bytes, blankNodes };
}
