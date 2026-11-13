// SPDX-License-Identifier: Apache-2.0
// M15 (harness v0.4): codec binding over a complete decoding manifest.
// EXPERIMENTAL envelope and manifest formats, not standards.
//
// Why a binding: a CBOR-LD payload is decoded with a registry entry (type tables), a decoder with
// its own codec semantics, and the contexts the decoder loads. If any of these differ from the
// issuer's, the same bytes can decode into a different document without an error (WE-2 S3). A
// commitment inside the compressed payload cannot help, because it would be decoded with the
// same wrong inputs, so the binding sits outside the payload, in an envelope.
//
// What v0.4 changes, and why (formal review of harness v0.3; paper T10, DST-9, DST-12):
//  - X4: the v0.3 envelope was unsigned. Under a signature over the CBOR-LD bytes only
//    (profile A) an attacker rewrites the registry id or manifest digest to match a drifted
//    verifier. v0.4 authenticates the binding: profile B signs the first five envelope fields;
//    profile I-RDFC relies on an inner proof that binds the RDF graph. Profiles A and I-JCS are
//    recognised and rejected by verifier policy.
//  - X7: v0.3 pinned only the contexts named in the type table. v0.4 lists every URL the
//    encoder's loader requested (including @import and scoped contexts) and decodes with a
//    pinned loader that refuses any URL the manifest does not list.
//  - X8: an ecdsa-jcs-2019 inner proof binds the JSON, not its meaning (hence I-JCS rejected).
//  - MC-4: the manifest names the decoder, its version and its codec semantics, so a decoder
//    change is detected before decoding, like a table or context change.
//  - The full 256-bit typed digest is carried (v0.3 carried 128 bits).
//
// Envelope v2, a CBOR array:
//   ["ssc-m15/v2", profile, registryEntryId, manifestDigest32, cborldBytes, verificationMethod|null, signature|null]

import canonicalize from "canonicalize";
import jsonld from "jsonld";
import { decode as cborDecode, decodeFirst as cborDecodeFirst, encode as cborEncode } from "cborg";
import { decode as cborldDecode, encode as cborldEncode } from "@digitalbazaar/cborld";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DIGEST, ecdsaSign, ecdsaVerify, sri, typedDigest } from "./crypto.mjs";
import { pinnedLoader } from "./loader.mjs";
import { canonizeOptions, freshResolver, resolveVerificationMethod, verifyProof } from "./suites.mjs";

export const ENVELOPE_TAG = "ssc-m15/v2";
export const MANIFEST_VERSION = "ssc-decoding-manifest/v2";
export const PROCESSING_MODEL = "cbor-ld/registry-entry";
export const PROFILES = Object.freeze(["A", "B", "I-RDFC", "I-JCS"]);
/** DST-9: the only profiles whose authenticated output binds meaning. */
export const ACCEPTED_PROFILES = Object.freeze(["B", "I-RDFC"]);
/**
 * The decoder below never sets a base IRI; the manifest records that, so a decoder that did would
 * not match. The decoder applies no canonicalization or normalization to its output, so none is
 * listed; for I-RDFC the canonicalization (RDFC-1.0) is fixed by the inner proof's cryptosuite.
 */
export const DECODING_OPTIONS = Object.freeze({ base: null });

const CONTEXT_SRI = "sha384";
const sriOf = (bytes) => sri(bytes, CONTEXT_SRI);
const INNER_SUITE = Object.freeze({ "I-RDFC": "ecdsa-rdfc-2019", "I-JCS": "ecdsa-jcs-2019" });
const POLICY_REASON = Object.freeze({
  A: "profile A rejected by policy: its signature covers only the CBOR-LD bytes, so the registry entry id and manifest digest can be rewritten to match a drifted verifier (X4)",
  "I-JCS": "profile I-JCS rejected by policy: an ecdsa-jcs-2019 inner proof binds the JSON, not the RDF graph, so a rewritten envelope can decode into another meaning under a valid proof (X8)"
});

// ---- Decoder identity and codec semantics (DST-12) -------------------------------------------
// The keyword and URL-scheme tables are read from the installed library rather than restated
// here, so a changed build changes the manifest even if it kept the version string. The typed
// value codecs are not exported by the library; the list below is the default processing mode
// of @digitalbazaar/cborld 8.1.0 (lib/codecs/ValueDecoder.js). A digest of the decoder's source
// files would bind the implementation more strictly, but would tie every label to one build.
const VALUE_CODECS = [
  "url",
  "https://w3id.org/security#multibase",
  "http://www.w3.org/2001/XMLSchema#date",
  "http://www.w3.org/2001/XMLSchema#dateTime"
];
const require = createRequire(import.meta.url);
const cborldDir = path.dirname(path.dirname(require.resolve("@digitalbazaar/cborld")));
const cborldPackage = JSON.parse(readFileSync(path.join(cborldDir, "package.json"), "utf8"));
const cborldTables = await import(pathToFileURL(path.join(cborldDir, "lib", "tables.js")).href);

const byKey = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);
const sortedPairs = (map) => [...map.entries()].sort(byKey);
const deepFreeze = (value) => {
  if (value && typeof value === "object") for (const inner of Object.values(value)) deepFreeze(inner);
  return Object.freeze(value);
};

/** The decoder this process runs. A verifier simulating another decoder passes a modified copy. */
export const INSTALLED_DECODER = deepFreeze({
  name: cborldPackage.name,
  version: cborldPackage.version,
  codecs: {
    format: "cbor-ld-1.0",
    keywordTermIds: sortedPairs(cborldTables.KEYWORDS_TABLE),
    firstCustomTermId: cborldTables.FIRST_CUSTOM_TERM_ID,
    urlCodecs: sortedPairs(cborldTables.URL_SCHEME_TABLE),
    valueCodecs: [...VALUE_CODECS].sort()
  }
});

// Installed implementation is trusted; package versions do not attest binary integrity.
// Use this same explicit profile to both bind and execute graph processing.
export const INSTALLED_GRAPH_PROCESSING = deepFreeze({
  processors: ["jsonld", "rdf-canonize"].map((name) => {
    const pkg = require(`${name}/package.json`);
    return { name: pkg.name, version: pkg.version };
  }),
  options: {
    processingMode: "json-ld-1.1", base: null, safe: true,
    rdfDirection: null, skipExpansion: false, produceGeneralizedRdf: false,
    format: "application/n-quads", canonizeOptions: canonizeOptions()
  }
});

// ---- Decoding manifest --------------------------------------------------------------------------

/** Type tables as sorted pairs, with the core tables the library adds when they are absent. */
export function canonicalTypeTables(typeTable) {
  const normalised = new Map(typeTable);
  for (const [type, table] of normalised) {
    const codes = new Set();
    for (const [value, code] of table) {
      if (typeof type !== "string" || typeof value !== "string" ||
          !Number.isSafeInteger(code) || code < 0 || codes.has(code)) {
        throw new Error(`invalid or duplicate code in type table ${type}`);
      }
      codes.add(code);
    }
  }
  for (const core of ["context", "url", "none"]) if (!normalised.has(core)) normalised.set(core, new Map());
  return sortedPairs(normalised).map(([type, table]) => [type, sortedPairs(table)]);
}

/** Context URLs a registry entry names in its type table: v0.3's (incomplete) manifest scope. */
export const tableContextIds = (typeTable) => [...(typeTable.get("context") ?? new Map()).keys()].sort();

/**
 * The decoding manifest: every input that can change what the decoder outputs (DST-12).
 * With allowMissing, a context whose bytes are not held gets digestSRI null, so a verifier can
 * still say what differs; such a manifest never matches a digest.
 */
export function buildManifest({ registryEntryId, typeTable, contextIds, contextBytes, decoder = INSTALLED_DECODER, options = DECODING_OPTIONS, graphProcessing = INSTALLED_GRAPH_PROCESSING, allowMissing = false }) {
  const typeTables = canonicalTypeTables(typeTable);
  const contexts = [...new Set(contextIds)].sort().map((id) => {
    const bytes = contextBytes.get(id);
    if (!bytes && !allowMissing) throw new Error(`context bytes missing for ${id}`);
    return { id, digestSRI: bytes ? sriOf(bytes) : null };
  });
  return {
    manifestVersion: MANIFEST_VERSION,
    registryEntryId,
    decoder: { name: decoder.name, version: decoder.version },
    processingModel: PROCESSING_MODEL,
    codecs: { implementation: `${decoder.name}@${decoder.version}`, ...decoder.codecs, typeTableKeys: typeTables.map(([type]) => type) },
    typeTables,
    contexts,
    options: { ...options },
    graphProcessing: structuredClone(graphProcessing)
  };
}

/** 256-bit typed digest over the JCS form of the manifest (domain-separated, crypto.mjs). */
export const manifestDigest = (manifest) => typedDigest(DIGEST.decodingManifest, canonicalize(manifest));
export const digestHex = (digest) => Buffer.from(digest).toString("hex");
const sameBytes = (a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)) === 0;

/** Lifetime-archive record, content-addressed by digestHex(manifestDigest(manifest)). */
export function archiveEntry(manifest, typeTable, contextBytes) {
  return {
    manifest,
    typeTable: new Map([...typeTable].map(([type, table]) => [type, new Map(table)])),
    contextBytes: new Map(manifest.contexts.map(({ id }) => [id, Buffer.from(contextBytes.get(id))]))
  };
}

const abbreviate = (value) => (typeof value === "string" && value.length > 24 ? `${value.slice(0, 19)}…` : String(value));

/** Which decoding inputs differ between the issuer's manifest and the verifier's, by name. */
export function explainDifferences(issuer, verifier) {
  const out = [];
  const add = (input, id, issuerValue, verifierValue, message) => out.push({ input, id, issuer: issuerValue, verifier: verifierValue, message });
  if (!verifier) {
    add("registryEntry", issuer.registryEntryId, issuer.registryEntryId, null, `registry entry ${issuer.registryEntryId} is not held by the verifier`);
    return out;
  }
  for (const key of ["manifestVersion", "registryEntryId", "processingModel"]) {
    if (issuer[key] !== verifier[key]) add(key, null, issuer[key], verifier[key], `${key}: issuer ${issuer[key]}, verifier ${verifier[key]}`);
  }
  if (canonicalize(issuer.decoder) !== canonicalize(verifier.decoder)) {
    add("decoder", issuer.decoder.name, issuer.decoder, verifier.decoder,
      `decoder: the issuer used ${issuer.decoder.name} ${issuer.decoder.version}, the verifier runs ${verifier.decoder.name} ${verifier.decoder.version}`);
  }
  const codecKeys = new Set([...Object.keys(issuer.codecs ?? {}), ...Object.keys(verifier.codecs ?? {})]);
  for (const key of [...codecKeys].sort()) {
    // Both are derived fields, reported under "decoder" and "typeTable".
    if (key === "implementation" || key === "typeTableKeys") continue;
    const a = issuer.codecs?.[key] ?? null;
    const b = verifier.codecs?.[key] ?? null;
    if (canonicalize(a) !== canonicalize(b)) add("codecs", key, a, b, `codec semantics differ: ${key}`);
  }
  const issuerTables = new Map(issuer.typeTables.map(([type, entries]) => [type, new Map(entries)]));
  const verifierTables = new Map(verifier.typeTables.map(([type, entries]) => [type, new Map(entries)]));
  for (const type of [...new Set([...issuerTables.keys(), ...verifierTables.keys()])].sort()) {
    const a = issuerTables.get(type);
    const b = verifierTables.get(type);
    if (!b || !a) {
      add("typeTable", type, a ? [...a] : null, b ? [...b] : null, `type table "${type}" is ${a ? "missing at the verifier" : "present only at the verifier"}`);
      continue;
    }
    for (const value of [...new Set([...a.keys(), ...b.keys()])].sort()) {
      if (a.get(value) !== b.get(value)) {
        add("typeTable", type, a.get(value) ?? null, b.get(value) ?? null,
          `type table "${type}": ${value} is ${a.get(value) ?? "absent"} at the issuer, ${b.get(value) ?? "absent"} at the verifier`);
      }
    }
  }
  const issuerContexts = new Map(issuer.contexts.map(({ id, digestSRI }) => [id, digestSRI]));
  const verifierContexts = new Map(verifier.contexts.map(({ id, digestSRI }) => [id, digestSRI]));
  for (const id of [...new Set([...issuerContexts.keys(), ...verifierContexts.keys()])].sort()) {
    const a = issuerContexts.get(id) ?? null;
    const b = verifierContexts.get(id) ?? null;
    if (a === b) continue;
    if (!issuerContexts.has(id)) add("context", id, null, b, `context ${id} is listed by the verifier's registry entry but not by the issuer`);
    else if (b === null) add("context", id, a, null, `context ${id} is not held by the verifier`);
    else add("context", id, a, b, `context ${id}: the verifier's bytes (${abbreviate(b)}) differ from the issuer's (${abbreviate(a)})`);
  }
  if (canonicalize(issuer.graphProcessing ?? null) !== canonicalize(verifier.graphProcessing ?? null)) {
    add("graphProcessing", null, issuer.graphProcessing ?? null, verifier.graphProcessing ?? null,
      "graph processing implementation/version or options differ");
  }
  if (canonicalize(issuer.options) !== canonicalize(verifier.options)) add("options", null, issuer.options, verifier.options, "decoding options differ");
  return out;
}

// ---- Envelope v2 ----------------------------------------------------------------------------------

const u8 = (bytes) => new Uint8Array(bytes);

/** Registry entry id from a CBOR-LD 1.0 header (tag 0xcb1d over [registryEntryId, payload]). */
export function cborldRegistryEntryId(cborldBytes) {
  const b = cborldBytes;
  if (b.length < 5 || b[0] !== 0xd9 || b[1] !== 0xcb || b[2] !== 0x1d || b[3] !== 0x82) {
    throw new Error("payload is not CBOR-LD 1.0 (tag 0xcb1d over [registryEntryId, payload])");
  }
  return cborDecodeFirst(b.subarray(4))[0];
}

export function encodeEnvelope({ profile, registryEntryId, manifestDigest: digest, cborldBytes, verificationMethod = null, signature = null }) {
  return cborEncode([ENVELOPE_TAG, profile, registryEntryId, u8(digest), u8(cborldBytes), verificationMethod, signature === null ? null : u8(signature)]);
}

/** The bytes profile B signs: the CBOR encoding of the first five envelope fields. */
export const signingInput = ({ profile, registryEntryId, manifestDigest: digest, cborldBytes }) =>
  cborEncode([ENVELOPE_TAG, profile, registryEntryId, u8(digest), u8(cborldBytes)]);

/** Structural checks only; nothing here is authenticated yet. */
export function parseEnvelope(envelope) {
  let fields;
  try {
    fields = cborDecode(u8(envelope));
  } catch (error) {
    throw new Error(`envelope is not valid CBOR: ${error.message}`);
  }
  if (!Array.isArray(fields) || fields.length !== 7) throw new Error("envelope must be a CBOR array of 7 elements");
  const [tag, profile, registryEntryId, digest, cborldBytes, verificationMethod, signature] = fields;
  if (tag !== ENVELOPE_TAG) throw new Error(`unknown envelope tag ${JSON.stringify(tag)} (expected ${ENVELOPE_TAG})`);
  if (!PROFILES.includes(profile)) throw new Error(`unknown profile ${JSON.stringify(profile)}`);
  if (!Number.isInteger(registryEntryId) || registryEntryId < 0) throw new Error("registry entry id must be a non-negative integer");
  if (!(digest instanceof Uint8Array) || digest.length !== 32) throw new Error(`manifest digest must be 32 bytes (256 bits), got ${digest?.length ?? typeof digest}`);
  if (!(cborldBytes instanceof Uint8Array)) throw new Error("CBOR-LD payload must be a byte string");
  const signed = profile === "A" || profile === "B";
  const hasSignature = typeof verificationMethod === "string" && signature instanceof Uint8Array;
  const hasNone = verificationMethod === null && signature === null;
  if (signed ? !hasSignature : !hasNone) {
    throw new Error(`profile ${profile} ${signed ? "requires a verification method and a signature" : "must not carry an envelope signature"}`);
  }
  const headerId = cborldRegistryEntryId(cborldBytes);
  if (headerId !== registryEntryId) throw new Error(`CBOR-LD header names registry entry ${headerId}, the envelope names ${registryEntryId}`);
  return { profile, registryEntryId, manifestDigest: digest, cborldBytes, verificationMethod, signature };
}

const didOf = (verificationMethod) => String(verificationMethod).split("#")[0];

/** Profile B: signature over the first five fields. Profile A: over the CBOR-LD bytes only. */
export function verifyEnvelopeSignature(fields) {
  let resolved;
  try {
    resolved = resolveVerificationMethod(fields.verificationMethod);
  } catch (error) {
    return { ok: false, reason: error.message };
  }
  const data = fields.profile === "A" ? fields.cborldBytes : signingInput(fields);
  let valid = false;
  try {
    valid = ecdsaVerify(resolved.crv, resolved.key, Buffer.from(data), Buffer.from(fields.signature));
  } catch {
    valid = false;
  }
  return valid
    ? { ok: true, signer: didOf(fields.verificationMethod) }
    : { ok: false, reason: `envelope signature invalid for ${fields.verificationMethod} (profile ${fields.profile})` };
}

/** Build an envelope for a given manifest. Profiles A and B sign; I-RDFC and I-JCS do not. */
export function sealEnvelope({ profile, registryEntryId, manifest, cborldBytes, signer, verificationMethod }) {
  const fields = { profile, registryEntryId, manifestDigest: manifestDigest(manifest), cborldBytes };
  if (profile === "A" || profile === "B") {
    if (!signer || !verificationMethod) throw new Error(`profile ${profile} needs a signer and a verification method`);
    const data = profile === "A" ? cborldBytes : signingInput(fields);
    return encodeEnvelope({ ...fields, verificationMethod, signature: ecdsaSign(signer.crv, signer.key, Buffer.from(data)) });
  }
  return encodeEnvelope(fields);
}

const tableLoaderFor = (registryEntryId, typeTable) => async ({ registryEntryId: requested }) => {
  // The CBOR-LD header picks the table; refuse any entry other than the one the binding covers.
  if (requested !== registryEntryId) throw new Error(`decoder asked for registry entry ${requested}, the binding covers ${registryEntryId}`);
  return typeTable;
};

// ---- Issuer -------------------------------------------------------------------------------------

/**
 * Encode a JSON-LD document as CBOR-LD and wrap it in an envelope v2.
 * The manifest lists every URL the encoder's loader requested, so transitive contexts are pinned.
 * documentLoader must expose the exact bytes it serves (loader.bytes, as staticLoader does).
 */
export async function encodeBound(jsonldDocument, { registryEntryId, typeTable, documentLoader, profile = "B", signer, verificationMethod }) {
  if (!PROFILES.includes(profile)) throw new Error(`unknown profile ${profile}`);
  if (!(documentLoader?.bytes instanceof Map)) throw new Error("documentLoader must expose the exact bytes it serves (loader.bytes), so the manifest can pin them");
  if (INNER_SUITE[profile] && jsonldDocument.proof?.cryptosuite !== INNER_SUITE[profile]) {
    throw new Error(`profile ${profile} needs an inner ${INNER_SUITE[profile]} proof added before encoding`);
  }
  const requested = [];
  const recording = async (url) => {
    requested.push(url);
    return documentLoader(url);
  };
  const typeTableLoader = tableLoaderFor(registryEntryId, typeTable);
  const cborldBytes = await cborldEncode({ jsonldDocument, documentLoader: recording, registryEntryId, typeTableLoader });
  const manifest = buildManifest({ registryEntryId, typeTable, contextIds: requested, contextBytes: documentLoader.bytes });
  // Self-check: the label must decode, with exactly the pinned inputs, to the document that was
  // signed; otherwise the issuer would print a label that no conforming verifier can read.
  const decoded = await cborldDecode({ cborldBytes, documentLoader: pinnedLoader(documentLoader.bytes, manifest.contexts, sriOf), typeTableLoader });
  if (canonicalize(decoded) !== canonicalize(jsonldDocument)) throw new Error("issuer self-check failed: the label does not decode to the input document with the pinned inputs");
  const envelope = sealEnvelope({ profile, registryEntryId, manifest, cborldBytes, signer, verificationMethod });
  return { envelope, cborldBytes, manifest, manifestDigest: manifestDigest(manifest), archiveEntry: archiveEntry(manifest, typeTable, documentLoader.bytes) };
}

// ---- Verifier -------------------------------------------------------------------------------------

/**
 * Pin the decoding inputs before decoding: the verifier's own inputs if they reproduce the bound
 * digest, else the issuer's archived material, else a failure that names what differs.
 */
function pinDecodingInputs(fields, { registry, archive, decoder }) {
  const { registryEntryId, manifestDigest: bound } = fields;
  const archived = archive.get(digestHex(bound));
  // The archive is content-addressed: re-hash, never trust the key.
  const issuerManifest = archived?.manifest && sameBytes(manifestDigest(archived.manifest), bound) ? archived.manifest : null;
  if (issuerManifest && issuerManifest.registryEntryId !== registryEntryId) {
    return { ok: false, reason: `the archived manifest is for registry entry ${issuerManifest.registryEntryId}, the envelope names ${registryEntryId}` };
  }
  const local = registry.get(registryEntryId);
  let localManifest = null;
  if (local) {
    // Exactly the URLs the issuer's manifest lists when it is known; otherwise the closure the
    // local registry entry declares (by default the contexts its type table names).
    const contextIds = issuerManifest ? issuerManifest.contexts.map(({ id }) => id) : (local.contexts ?? tableContextIds(local.typeTable));
    localManifest = buildManifest({ registryEntryId, typeTable: local.typeTable, contextIds, contextBytes: local.loader?.bytes ?? new Map(), decoder, allowMissing: true });
    if (sameBytes(manifestDigest(localManifest), bound)) {
      return { ok: true, manifest: localManifest, typeTable: local.typeTable, contextBytes: local.loader.bytes, source: "local registry" };
    }
  }
  if (!issuerManifest) {
    return {
      ok: false,
      differences: [],
      reason: `decoding manifest mismatch: the verifier's inputs for registry entry ${registryEntryId} ${local ? "do not reproduce the bound digest" : "are missing"}, and the issuer's manifest is not in the archive, so the differing input cannot be named`
    };
  }
  const differences = explainDifferences(issuerManifest, localManifest);
  if (archived.typeTable && archived.contextBytes) {
    // The archive restores tables and context bytes, never decoder code: the verifier's own
    // decoder and options must still match the issuer's.
    const rebuilt = buildManifest({ registryEntryId, typeTable: archived.typeTable, contextIds: issuerManifest.contexts.map(({ id }) => id), contextBytes: archived.contextBytes, decoder, allowMissing: true });
    if (sameBytes(manifestDigest(rebuilt), bound)) {
      return { ok: true, manifest: rebuilt, typeTable: archived.typeTable, contextBytes: archived.contextBytes, source: "lifetime archive (resolved by manifest digest)", differences };
    }
    const remaining = explainDifferences(issuerManifest, rebuilt);
    return { ok: false, differences: remaining, reason: `decoding manifest mismatch that the archive cannot repair: ${remaining.map((d) => d.message).join("; ")}` };
  }
  return { ok: false, differences, reason: `decoding manifest mismatch: ${differences.map((d) => d.message).join("; ")}; the archive holds the issuer's manifest but not its material` };
}

const withoutProof = (document) => {
  const copy = structuredClone(document);
  delete copy.proof;
  return copy;
};

/**
 * Verify and decode an envelope v2 (DST-9). Steps, in order:
 *  1. structure; 2. profile policy; 3. envelope signature (B) before anything is decoded;
 *  4. manifest digest against the verifier's inputs before decoding (archive on mismatch);
 *  5. decoding with a loader that serves only manifest-listed, digest-matching bytes;
 *  6. inner graph-binding proof (I-RDFC); 7. issuer-key binding; 8. the graph under pinned contexts.
 *
 * @param registry  local registry: id -> { typeTable, loader (with .bytes), contexts? }
 * @param archive   lifetime archive: digestHex(manifestDigest) -> { manifest, typeTable?, contextBytes? }
 *                  (an entry with a manifest only stands for a published manifest log, M9)
 * @param decoder   the decoder description this verifier runs (default: the installed one)
 * @param acceptProfiles verifier policy; only demonstrations widen it beyond ACCEPTED_PROFILES
 * @returns {{ok: true, profile, document, graph, loader, manifest, source, signer} | {ok: false, stage, reason, differences?}}
 *   Consume only `graph` (the RDF the profile authenticates, under the pinned contexts) or
 *   `document` interpreted with `loader`; never re-interpret the document with other contexts.
 */
export async function decodeBound(envelope, { registry = new Map(), archive = new Map(), decoder = INSTALLED_DECODER, acceptProfiles = ACCEPTED_PROFILES } = {}) {
  const fail = (stage, reason, extra = {}) => ({ ok: false, stage, reason, ...extra });
  let fields;
  try {
    fields = parseEnvelope(envelope);
  } catch (error) {
    return fail("envelope", error.message);
  }
  const { profile } = fields;
  if (!acceptProfiles.includes(profile)) return fail("policy", POLICY_REASON[profile] ?? `profile ${profile} not accepted by verifier policy`);

  let signer = null;
  if (profile === "A" || profile === "B") {
    const check = verifyEnvelopeSignature(fields);
    if (!check.ok) return fail("signature", check.reason);
    signer = check.signer;
  }

  let pinned;
  try {
    pinned = pinDecodingInputs(fields, { registry, archive, decoder });
  } catch (error) {
    return fail("manifest", `invalid decoding material: ${error.message}`);
  }
  if (!pinned.ok) return fail("manifest", pinned.reason, { differences: pinned.differences ?? [] });
  const listed = new Set(pinned.manifest.contexts.map(({ id }) => id));
  const freshPinnedLoader = () => pinnedLoader(pinned.contextBytes, pinned.manifest.contexts, sriOf);
  const undeclared = (loader) => loader.requests.find((url) => !listed.has(url));

  const decodeLoader = freshPinnedLoader();
  let document;
  try {
    document = await cborldDecode({ cborldBytes: fields.cborldBytes, documentLoader: decodeLoader, typeTableLoader: tableLoaderFor(fields.registryEntryId, pinned.typeTable) });
  } catch (error) {
    const url = undeclared(decodeLoader);
    return fail("decode", url ? `undeclared URL requested during decoding: ${url} (not in the decoding manifest)` : `decoding failed with the pinned inputs: ${error.message}`);
  }

  if (INNER_SUITE[profile]) {
    const proof = document.proof;
    if (!proof || Array.isArray(proof) || proof.cryptosuite !== INNER_SUITE[profile]) {
      return fail("inner-proof", `profile ${profile} requires a single inner ${INNER_SUITE[profile]} proof`);
    }
    const proofLoader = freshPinnedLoader();
    let verified = false;
    let detail = "signature";
    try {
      ({ verified, reason: detail } = await verifyProof(document, { loader: proofLoader }));
    } catch (error) {
      const url = undeclared(proofLoader);
      detail = url ? `undeclared URL requested while verifying: ${url}` : error.message;
    }
    if (!verified) return fail("inner-proof", `inner ${INNER_SUITE[profile]} proof invalid with the pinned inputs (${detail})`);
    signer = didOf(proof.verificationMethod);
  }

  // Issuer-key binding: the key that authenticated the label must be the credential issuer's.
  let expanded;
  try {
    expanded = await jsonld.expand(withoutProof(document), {
      documentLoader: freshPinnedLoader(), safe: true, contextResolver: freshResolver()
    });
  } catch (error) {
    return fail("issuer-binding", `cannot resolve credential issuer: ${error.message}`);
  }
  const issuers = expanded.length === 1 && expanded[0]["https://www.w3.org/2018/credentials#issuer"];
  if (!Array.isArray(issuers) || issuers.length !== 1 || issuers[0]["@id"] !== signer) {
    return fail("issuer-binding", `credential must name exactly one issuer matching ${signer}`);
  }

  const graphLoader = freshPinnedLoader();
  let graph;
  try {
    graph = await jsonld.canonize(withoutProof(document), {
      ...structuredClone(INSTALLED_GRAPH_PROCESSING.options),
      documentLoader: graphLoader, contextResolver: freshResolver()
    });
  } catch (error) {
    const url = undeclared(graphLoader);
    return fail("graph", url ? `undeclared URL requested while computing the graph: ${url}` : `no RDF graph under the pinned contexts: ${error.message}`);
  }
  return { ok: true, profile, document, graph, loader: freshPinnedLoader(), manifest: pinned.manifest, source: pinned.source, signer };
}

// ---- As deployed today (kept for the WE-2 problem scenarios) ----------------------------------

/** Unbound encoding: CBOR-LD bytes with no envelope. */
export async function encodePlain(jsonldDocument, { registryEntryId, typeTable, documentLoader }) {
  return cborldEncode({ jsonldDocument, documentLoader, registryEntryId, typeTableLoader: tableLoaderFor(registryEntryId, typeTable) });
}

/** Unbound decoding, as deployed today: whatever the local registry and loader say. */
export async function decodePlain(cborldBytes, { registryEntryId, typeTable, documentLoader }) {
  return cborldDecode({ cborldBytes, documentLoader, typeTableLoader: tableLoaderFor(registryEntryId, typeTable) });
}
