// SPDX-License-Identifier: Apache-2.0
// M18 v0.4: blank-node-free admission through a restricted grammar and a signed admission
// certificate (H1; requirements PRD-10 and VER-4; formal model T9.2).
//
// Why: blank nodes arise from many constructs in any reachable context (lists, graph containers,
// scoped contexts that redefine "id", terms or prefixes or @vocab mapped to "_:", value objects,
// reverse properties, nesting, compound-literal direction). A lexical scan against arbitrary
// contexts cannot be both simple and sound; the v0.3 scan is not (formal review X1, X9).
// Responsibility is therefore split:
//   1. Publisher side: analyse(closure) checks every term definition in the complete context
//      closure, including scoped contexts and contexts they reference, against the grammar below,
//      and signs a certificate listing the admitted terms and the closure digests.
//   2. Verifier side: createAdmission(certificate) checks the certificate once; check(document)
//      then enforces the grammar on each document in one linear pass, with no JSON-LD processing.
//
// Grammar "ssc-admission/v1":
//   - closure refused if any term, prefix or @vocab maps to a blank node, if "id"/"type" are not
//     the aliases of @id/@type at the top level, or a context uses @base, @import, @propagate,
//     @direction or @language;
//   - a term is admitted only if every definition of it, in every admitted scope, is a plain IRI
//     mapping or {@id, @type ∈ {@id, @vocab, datatype IRI}, @container ∈ {absent, @set}, @protected,
//     @context}; @list, @graph, @index, @json, @reverse, @nest, @language and @direction terms are
//     excluded; a scoped context that redefines "id" or "type" excludes its carrier term or type;
//   - a document: top-level @context exactly as certified; every node object has an absolute,
//     non-blank "id"; every key is an admitted term (or "id", "type", and at the top level
//     "@context" and "proof"); no other keywords, no value objects, no nested arrays.
// Under these rules JSON-LD expansion produces no blank node (T9.2), given that the certifier ran
// this analysis honestly: until a separately specified checker exists, the certifier is trusted.

import canonicalize from "canonicalize";
import { createRequire } from "node:module";
import { base58Decode, base58Encode, digest, DIGEST, ecdsaSign, ecdsaVerify, sri, typedId } from "./crypto.mjs";
import { resolveVerificationMethod } from "./suites.mjs";

const require = createRequire(import.meta.url);
export const GRAMMAR = "ssc-admission/v1";
const PROCESSOR = { name: "jsonld", version: require("jsonld/package.json").version, options: { processingMode: "json-ld-1.1", rdfDirection: null } };
const FORBIDDEN_CONTEXT_KEYWORDS = new Set(["@base", "@import", "@propagate", "@direction", "@language", "@type", "@context", "@nest"]);
const EXCLUDING_DEFINITION_KEYS = new Set(["@reverse", "@nest", "@prefix", "@language", "@direction", "@index"]);
const ABSOLUTE_IRI = /^[A-Za-z][A-Za-z0-9+.-]*:[^\s<>"{}|\\^`]*$/;

const isBlank = (iri) => typeof iri === "string" && iri.startsWith("_:");

/** Expand a term value (absolute IRI, compact IRI using a prefix of this scope, or a term). */
function expandIri(value, scope, seen = new Set()) {
  if (typeof value !== "string") return null;
  if (value.startsWith("@")) return value;
  if (isBlank(value)) return value;
  const colon = value.indexOf(":");
  if (colon > 0) {
    const prefix = value.slice(0, colon);
    const suffix = value.slice(colon + 1);
    if (!suffix.startsWith("//") && scope.has(prefix) && !seen.has(prefix)) {
      seen.add(prefix);
      const base = expandIri(scope.get(prefix).raw, scope, seen);
      return base ? base + suffix : null;
    }
    return value;
  }
  if (scope.has(value) && !seen.has(value)) { seen.add(value); return expandIri(scope.get(value).raw, scope, seen); }
  return null; // relative: not admitted
}

/**
 * Analyse one context object into a scope.
 * @returns {{ scope: Map<string, def>, fatal: string[], remote: string[] }}
 */
function analyseContextObject(context, inherited, label) {
  const scope = new Map(inherited);
  const remote = [];
  const fatal = [];
  for (const [key, value] of Object.entries(context)) {
    if (key === "@protected" || key === "@version") continue;
    if (key === "@vocab") {
      if (typeof value !== "string" || isBlank(value) || !ABSOLUTE_IRI.test(value)) fatal.push(`${label}: @vocab must be an absolute, non-blank IRI`);
      continue;
    }
    if (FORBIDDEN_CONTEXT_KEYWORDS.has(key)) { fatal.push(`${label}: context keyword ${key} not admitted`); continue; }
    if (key.startsWith("@")) { fatal.push(`${label}: unknown context keyword ${key}`); continue; }
    scope.set(key, typeof value === "string" ? { raw: value } : { raw: value?.["@id"] ?? null, object: value });
  }
  // Second pass: classify each definition now that prefixes are known.
  for (const [term, def] of scope) {
    if (inherited.has(term) && inherited.get(term) === def) continue; // unchanged inherited definition
    const object = def.object;
    const raw = def.raw ?? (object && object["@id"] === undefined ? term : null);
    const iri = raw === null ? null : expandIri(raw, scope);
    if (isBlank(iri)) { fatal.push(`${label}: term "${term}" maps to a blank node`); continue; }
    if (term === "id" || term === "type") {
      def.kind = iri === `@${term}` ? "alias" : "redefined";
      continue;
    }
    if (typeof iri === "string" && iri.startsWith("@")) { def.kind = "excluded"; def.reason = `aliases keyword ${iri}`; continue; }
    if (!iri || !ABSOLUTE_IRI.test(iri)) { def.kind = "excluded"; def.reason = "no absolute IRI"; continue; }
    def.iri = iri;
    if (!object) { def.kind = "literal"; continue; }
    if ([...Object.keys(object)].some((k) => EXCLUDING_DEFINITION_KEYS.has(k))) { def.kind = "excluded"; def.reason = "uses an excluded definition keyword"; continue; }
    const container = [].concat(object["@container"] ?? []);
    if (container.some((c) => c !== "@set")) { def.kind = "excluded"; def.reason = `container ${container.join(",")}`; continue; }
    const type = object["@type"];
    if (type === undefined) def.kind = "literal";
    else if (type === "@id") def.kind = "id";
    else if (type === "@vocab") def.kind = "vocab";
    else if (typeof type === "string" && !type.startsWith("@")) {
      const datatype = expandIri(type, scope);
      if (!datatype || isBlank(datatype) || !ABSOLUTE_IRI.test(datatype)) { def.kind = "excluded"; def.reason = "datatype not an absolute IRI"; continue; }
      def.kind = "datatype";
      def.datatype = datatype;
    } else { def.kind = "excluded"; def.reason = `type ${type}`; continue; }
    if (object["@context"] !== undefined) def.scoped = object["@context"];
  }
  return { scope, fatal, remote };
}

/**
 * Publisher side: analyse the closure reachable from the top-level contexts and sign a certificate.
 * @param {string[]} topLevel context URLs as documents will name them
 * @param {Map<string, Buffer>} bytes context bytes by URL (the publisher's authoritative copies)
 */
export function analyse(topLevel, bytes) {
  const used = new Set();
  const load = (url) => {
    if (!bytes.has(url)) throw new Error(`closure incomplete: no bytes for ${url}`);
    used.add(url);
    return JSON.parse(bytes.get(url).toString("utf8"))["@context"];
  };
  let root = new Map();
  const fatal = [];
  for (const url of topLevel) {
    for (const context of [].concat(load(url))) {
      if (typeof context !== "object" || context === null) { fatal.push(`${url}: nested context reference not admitted`); continue; }
      const result = analyseContextObject(context, root, url);
      fatal.push(...result.fatal);
      root = result.scope;
    }
  }
  for (const alias of ["id", "type"]) if (root.get(alias)?.kind !== "alias") fatal.push(`top-level "${alias}" is not the alias of @${alias}`);
  // Every definition of every term, across the root scope and all scoped contexts reached
  // through admissible carriers. A term is admitted only if all its definitions are admissible.
  const definitions = new Map();
  const excludedCarriers = new Map();
  const note = (term, def) => { if (!definitions.has(term)) definitions.set(term, []); definitions.get(term).push(def); };
  const visit = (scope, carrierPath) => {
    for (const [term, def] of scope) {
      if (term === "id" || term === "type") continue;
      note(term, def);
      if (def.scoped !== undefined && def.kind !== "excluded") {
        const path = `${carrierPath}/${term}`;
        let inner = scope;
        let problem = null;
        for (const sc of [].concat(def.scoped)) {
          let obj = sc;
          if (typeof sc === "string") { try { obj = load(sc); } catch (error) { problem = error.message; break; } }
          for (const context of [].concat(obj)) {
            if (typeof context !== "object" || context === null) { problem = "remote reference inside a scoped context"; break; }
            const result = analyseContextObject(context, inner, path);
            if (result.fatal.length) { problem = result.fatal.join("; "); break; }
            inner = result.scope;
          }
          if (problem) break;
        }
        if (!problem) for (const alias of ["id", "type"]) if (inner.get(alias) && inner.get(alias).kind !== "alias") problem = `scoped context redefines "${alias}"`;
        if (problem) { excludedCarriers.set(term, problem); continue; }
        const own = new Map([...inner].filter(([t, d]) => scope.get(t) !== d));
        visit(own, path);
      }
    }
  };
  visit(root, "");
  const terms = {};
  const excluded = {};
  for (const [term, defs] of definitions) {
    if (excludedCarriers.has(term)) { excluded[term] = excludedCarriers.get(term); continue; }
    const bad = defs.find((d) => d.kind === "excluded");
    if (bad) { excluded[term] = bad.reason; continue; }
    const kinds = new Set(defs.map((d) => d.kind));
    if (kinds.size > 1) { excluded[term] = `inconsistent definitions across scopes (${[...kinds].join(", ")})`; continue; }
    terms[term] = { kind: defs[0].kind, iri: defs[0].iri };
  }
  const closure = [...used].sort().map((id) => ({ id, digestSRI: sri(bytes.get(id)) }));
  return {
    grammar: GRAMMAR,
    processor: structuredClone(PROCESSOR),
    topLevel: [...topLevel],
    closure,
    contextManifest: typedId(DIGEST.contextManifest, canonicalize(closure)),
    admissible: fatal.length === 0,
    refused: fatal,
    terms,
    excluded
  };
}

/** Sign an analysis as an admission certificate (PRD-10). Refused closures are not certified. */
export function certify(analysis, { signer, verificationMethod, issued = "2026-11-13T00:00:00Z" }) {
  if (!analysis.admissible) throw new Error(`closure refused: ${analysis.refused.join("; ")}`);
  const body = { type: "AdmissionCertificate", ...analysis, publisher: verificationMethod.split("#")[0], verificationMethod, issued };
  delete body.admissible; delete body.refused;
  const signature = ecdsaSign(signer.crv, signer.key, Buffer.from(typedId(DIGEST.admission, canonicalize(body))));
  return { ...body, proofValue: "z" + base58Encode(signature) };
}

/**
 * Verifier side. Checks the certificate once (publisher authorised, signature, the verifier's own
 * context bytes match the certified closure), then returns a linear document checker.
 */
export function createAdmission(certificate, { publishers, bytes, maxDepth = 16, maxBytes = 64 * 1024 }) {
  const body = structuredClone(certificate);
  const proofValue = body.proofValue;
  delete body.proofValue;
  const fail = (reason) => ({ ok: false, reason, check: () => ({ ok: false, reason: `admission unavailable: ${reason}` }) });
  if (body.grammar !== GRAMMAR) return fail(`unsupported grammar ${body.grammar}`);
  if (canonicalize(body.processor) !== canonicalize(PROCESSOR)) return fail("unsupported admission processor profile");
  if (!publishers.get(body.publisher)?.has(body.verificationMethod) || body.verificationMethod.split("#")[0] !== body.publisher) return fail("certificate publisher not authorised");
  const { key, crv } = resolveVerificationMethod(body.verificationMethod);
  if (!ecdsaVerify(crv, key, Buffer.from(typedId(DIGEST.admission, canonicalize(body))), base58Decode(String(proofValue).slice(1)))) return fail("certificate signature invalid");
  for (const { id, digestSRI } of body.closure) if (!bytes.get(id) || sri(bytes.get(id)) !== digestSRI) return fail(`verifier context differs from the certified closure: ${id}`);
  if (typedId(DIGEST.contextManifest, canonicalize(body.closure)) !== body.contextManifest) return fail("closure digest mismatch");
  const terms = new Map(Object.entries(body.terms));
  const excluded = new Set(Object.keys(body.excluded ?? {}));
  const expectedContext = JSON.stringify(body.topLevel.length === 1 ? body.topLevel[0] : body.topLevel);

  const iriOk = (value) => typeof value === "string" && !isBlank(value) && ABSOLUTE_IRI.test(value);
  const vocabOk = (value) => typeof value === "string" && !isBlank(value) && !excluded.has(value) && (terms.has(value) || ABSOLUTE_IRI.test(value));

  function check(document) {
    if (Buffer.byteLength(JSON.stringify(document)) > maxBytes) return { ok: false, reason: `size > ${maxBytes}` };
    if (JSON.stringify(document["@context"]) !== expectedContext) return { ok: false, reason: "top-level @context differs from the certified one" };
    const stack = [[document, 0, true]];
    while (stack.length) {
      const [node, depth, isRoot] = stack.pop();
      if (depth > maxDepth) return { ok: false, reason: `depth > ${maxDepth}` };
      if (node === null || typeof node !== "object" || Array.isArray(node)) return { ok: false, reason: "expected a node object" };
      if (!iriOk(node.id)) return { ok: false, reason: `node object without an absolute, non-blank id${node.id ? `: ${node.id}` : ""}` };
      for (const [key, value] of Object.entries(node)) {
        if (key === "id") continue;
        if (isRoot && (key === "@context" || key === "proof")) continue; // the proof is a pinned pattern, never canonicalised
        if (key === "type") {
          for (const t of [].concat(value)) if (!vocabOk(t)) return { ok: false, reason: `type value not admitted: ${JSON.stringify(t)}` };
          continue;
        }
        if (key.startsWith("@")) return { ok: false, reason: `keyword not permitted: ${key}` };
        const def = terms.get(key);
        if (!def) return { ok: false, reason: `term not admitted: ${key}` };
        for (const item of [].concat(value)) {
          if (Array.isArray(item)) return { ok: false, reason: `nested array under ${key}` };
          if (item !== null && typeof item === "object") {
            if (def.kind === "vocab" || def.kind === "datatype") return { ok: false, reason: `object value under ${def.kind} term ${key}` };
            stack.push([item, depth + 1, false]);
            continue;
          }
          if (def.kind === "id" && !iriOk(item)) return { ok: false, reason: `value of ${key} is not an absolute, non-blank IRI` };
          if (def.kind === "vocab" && !vocabOk(item)) return { ok: false, reason: `value of ${key} is not an admitted term or absolute IRI` };
          if (typeof item === "string" && isBlank(item)) return { ok: false, reason: `blank-node string under ${key}` };
        }
      }
    }
    return { ok: true };
  }
  return { ok: true, certificate: body, check };
}
