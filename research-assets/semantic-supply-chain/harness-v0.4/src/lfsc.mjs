// SPDX-License-Identifier: Apache-2.0
// M17: Lexical-first, semantic-committed proofs, graph-native variant (LFSC-G), profile 0.4.
// EXPERIMENTAL cryptosuite identifier "ecdsa-lfsc-2026", profile "lfsc-g/0.4".
//
// The signature covers only the proof configuration. The configuration carries
//   - lexicalDigest:      typed digest of the JCS form of the unsecured credential;
//   - semanticCommitment: typed digest of its RDFC-1.0 canonical N-Quads, the processor and its
//                         options, and the *processing-aware dependency closure*: every document
//                         the JSON-LD processor actually dereferenced while issuing, with the
//                         digest of its bytes (contexts named at the top level, contexts referenced
//                         from scoped term definitions or from inside the document data).
//
// Verification at ingestion:
//   stage 0  raw-text I-JSON check (when given raw bytes) and admission check (no JSON-LD);
//   stage 1  bounded proof decoding, issuer-key binding, lexical digest, signature (no JSON-LD);
//   stage 2  dependency digests, then bounded RDFC with a loader that serves only the declared
//            dependencies, compared with the commitment.
// Nothing is authorised before stage 2: there is no "light" acceptance mode (review R2-16).
//
// Changes from v0.3 (formal review X2, X10–X13; second review R2-02, R2-15, R2-16):
//   - H2/H11: the dependency list is recorded during issuance; undeclared dependencies fail; the
//     cache is consulted only after the current dependency bytes are checked, is keyed by the
//     verifier configuration, issuer authorisation and epoch, and returns the immutable
//     authenticated view, not a Boolean.
//   - H9: the verification method must belong to the issuer the credential names, and be
//     authorised for that issuer (VER-15); the same holds for graph-native re-verification.
//   - H10: the proof value is checked for format and length before it is decoded.
//   - H13: typed digests with domain separation.
// An unknown cryptosuite or profile makes the verifier reject (must-understand).

import canonicalize from "canonicalize";
import { createRequire } from "node:module";
import { base58Decode, base58Encode, digest, DIGEST, ecdsaSign, ecdsaVerify, sri, typedId } from "./crypto.mjs";
import { checkIJson } from "./ijson.mjs";
import { pinnedLoader } from "./loader.mjs";
import { prescan } from "./prescan.mjs";
import { DEFAULT_BOUND, canonizeOptions, rdfc, resolveVerificationMethod, UNBOUNDED } from "./suites.mjs";

const require = createRequire(import.meta.url);
const rdfCanonize = require("rdf-canonize");

export const SUITE = "ecdsa-lfsc-2026";
export const PROFILE = "lfsc-g/0.4";
export const PROCESSOR = Object.freeze({
  name: "jsonld",
  version: require("jsonld/package.json").version,
  canonicalizer: { name: "rdf-canonize", version: require("rdf-canonize/package.json").version, algorithm: "RDFC-1.0" },
  options: { processingMode: "json-ld-1.1", safe: true, rdfDirection: null, produceGeneralizedRdf: false }
});
const SIGNATURE_BYTES = { "P-256": 64, "P-384": 96 };
const MAX_PROOF_VALUE = 140; // base58btc of 96 bytes is at most 132 characters, plus the "z" prefix

const now = () => process.hrtime.bigint();
const ms = (start) => Number(now() - start) / 1e6;

function configOf(unsecured, options) {
  const config = structuredClone(options);
  delete config.proofValue;
  if (unsecured["@context"]) config["@context"] = structuredClone(unsecured["@context"]);
  return config;
}
const signingInput = (config) => digest("sha256", canonicalize(config));

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

const issuerOf = (document) => (typeof document.issuer === "string" ? document.issuer : document.issuer?.id);
const didOf = (verificationMethod) => String(verificationMethod ?? "").split("#")[0];

export async function issueLfsc(document, { signer, verificationMethod, loader, created = "2026-11-13T00:00:00Z" }) {
  const unsecured = structuredClone(document);
  delete unsecured.proof;
  const first = loader.requests.length;
  const nquads = await rdfc(unsecured, loader, UNBOUNDED, "sha256");
  // Processing-aware dependency closure: everything the processor dereferenced (VER-16, PRD-3).
  const dependencies = [...new Set(loader.requests.slice(first))].sort().map((id) => {
    const bytes = loader.bytes.get(id);
    if (!bytes) throw new Error(`issuer loader has no bytes for ${id}`);
    return { id, digestSRI: sri(bytes) };
  });
  const options = {
    type: "DataIntegrityProof",
    cryptosuite: SUITE,
    profile: PROFILE,
    created,
    verificationMethod,
    proofPurpose: "assertionMethod",
    lexicalDigest: typedId(DIGEST.lexical, canonicalize(unsecured)),
    semanticCommitment: {
      canonicalization: "RDFC-1.0",
      processor: PROCESSOR,
      digest: typedId(DIGEST.semanticContent, nquads),
      dependencies,
      contextManifest: typedId(DIGEST.contextManifest, canonicalize(dependencies))
    }
  };
  const proofValue = "z" + base58Encode(ecdsaSign(signer.crv, signer.key, signingInput(configOf(unsecured, options))));
  return { ...unsecured, proof: { ...options, proofValue } };
}

/** H10: format and length of the proof value are checked before any decoding. */
function decodeProofValue(proofValue, crv) {
  if (typeof proofValue !== "string" || proofValue.length > MAX_PROOF_VALUE || !/^z[1-9A-HJ-NP-Za-km-z]+$/.test(proofValue)) {
    return { ok: false, reason: "proof value malformed or too long" };
  }
  const signature = base58Decode(proofValue.slice(1));
  if (signature.length !== SIGNATURE_BYTES[crv]) return { ok: false, reason: `signature length ${signature.length} != ${SIGNATURE_BYTES[crv]}` };
  return { ok: true, signature };
}

/** H9 / VER-15: the key must belong to the named issuer and be authorised for it. */
function issuerBinding(issuer, verificationMethod, issuers) {
  if (typeof issuer !== "string") return "credential names no issuer";
  if (didOf(verificationMethod) !== issuer) return "verification method does not belong to the named issuer";
  if (!issuers.get(issuer)?.has(verificationMethod)) return "verification method not authorised for this issuer";
  return null;
}

/** Accepts either issuers: Map(issuer -> Set(vm)) or a flat allowlist of verification methods. */
function issuerMap({ issuers, allowedVerificationMethods }) {
  if (issuers) return issuers;
  const map = new Map();
  for (const vm of allowedVerificationMethods ?? []) {
    const did = didOf(vm);
    if (!map.has(did)) map.set(did, new Set());
    map.get(did).add(vm);
  }
  return map;
}

function boundedSet(cache, key, value, max) {
  if (!cache) return;
  cache.set(key, value);
  while (cache.size > max) cache.delete(cache.keys().next().value);
}

/**
 * @param input raw JSON text (string/Buffer: the I-JSON check runs) or a parsed object
 * @param options.admission optional admission verifier ({ check(document) }) from src/admission.mjs;
 *        without it, the v0.3 lexical pre-scan runs (kept for comparison; unsound in general, X1/X9)
 * @param options.cache positive cache (Map); options.negativeCache bounded cache of stage-0/1 rejections
 */
export async function verifyLfsc(input, options) {
  const {
    loader, allowedContexts, admission, bound = DEFAULT_BOUND, cache, negativeCache,
    epoch = 0, validAt, maxCacheEntries = 1024
  } = options;
  const issuers = issuerMap(options);
  const timings = {};
  let start = now();

  // ---- stage 0: raw text and admission, no JSON-LD --------------------------------------
  let secured;
  let rawChecked = false;
  if (typeof input === "string" || Buffer.isBuffer(input)) {
    const raw = checkIJson(input);
    if (!raw.ok) return { verified: false, stage: 0, reason: `I-JSON: ${raw.reason}`, timings: { stage0: ms(start) } };
    secured = raw.value;
    rawChecked = true;
  } else secured = structuredClone(input);
  const negativeKey = negativeCache ? digest("sha256", canonicalize(secured)).toString("base64") : null;
  if (negativeKey && negativeCache.has(negativeKey)) return { verified: false, stage: negativeCache.get(negativeKey).stage, reason: negativeCache.get(negativeKey).reason, negativeCached: true, timings };
  const reject = (stage, reason, extra = {}) => {
    if (stage <= 1 && negativeKey) boundedSet(negativeCache, negativeKey, { stage, reason }, maxCacheEntries);
    return { verified: false, stage, reason, rawChecked, timings, ...extra };
  };
  const scan = admission ? admission.check(secured) : prescan(secured, { allowedContexts });
  timings.stage0 = ms(start);
  if (!scan.ok) return reject(0, scan.reason);

  // ---- stage 1: proof decoding, issuer binding, lexical digest, signature ----------------
  start = now();
  const proof = secured.proof ?? {};
  const fail1 = (reason) => { timings.stage1 = ms(start); return reject(1, reason); };
  if (proof.cryptosuite !== SUITE) return fail1("not an LFSC proof (must-understand)");
  if (proof.profile !== PROFILE) return fail1(`unsupported LFSC profile ${proof.profile ?? "(none)"} (must-understand)`);
  if (!proof.semanticCommitment || !proof.lexicalDigest) return fail1("LFSC proof incomplete");
  let key, crv;
  try { ({ key, crv } = resolveVerificationMethod(proof.verificationMethod)); } catch (error) { return fail1(error.message); }
  const decoded = decodeProofValue(proof.proofValue, crv);
  if (!decoded.ok) return fail1(decoded.reason);
  const unsecured = structuredClone(secured);
  delete unsecured.proof;
  const issuer = issuerOf(unsecured);
  const binding = issuerBinding(issuer, proof.verificationMethod, issuers);
  if (binding) return fail1(binding);
  if (typedId(DIGEST.lexical, canonicalize(unsecured)) !== proof.lexicalDigest) return fail1("lexical digest mismatch");
  const config = configOf(unsecured, proof);
  if (!ecdsaVerify(crv, key, signingInput(config), decoded.signature)) return fail1("signature invalid");
  timings.stage1 = ms(start);

  // ---- stage 2: dependencies, bounded canonicalisation, commitment ----------------------
  start = now();
  const fail2 = (reason) => { timings.stage2 = ms(start); return reject(2, reason); };
  const commitment = proof.semanticCommitment;
  const dependencies = commitment.dependencies ?? [];
  // The bytes the verifier holds *now* are checked before any cache lookup (closes X13).
  for (const { id, digestSRI } of dependencies) {
    const bytes = loader.bytes.get(id);
    if (!bytes) return fail2(`dependency not available: ${id}`);
    if (sri(bytes) !== digestSRI) return fail2(`dependency digest mismatch: ${id}`);
  }
  if (typedId(DIGEST.contextManifest, canonicalize(dependencies)) !== commitment.contextManifest) return fail2("context manifest digest mismatch");
  const cacheKey = cache ? typedId(DIGEST.semanticContent, canonicalize({
    proofValue: proof.proofValue, semantic: commitment.digest, contextManifest: commitment.contextManifest,
    verifier: { processor: PROCESSOR, bound: canonizeOptions(bound) }, issuer, verificationMethod: proof.verificationMethod, epoch
  })) : null;
  let view = cacheKey ? cache.get(cacheKey) : undefined;
  const cached = !!view;
  if (!view) {
    let nquads;
    const pinned = pinnedLoader(loader.bytes, dependencies, sri);
    try {
      nquads = await rdfc(unsecured, pinned, bound, "sha256");
    } catch (error) {
      return fail2(pinned.refusals[0] ?? `bounded canonicalisation aborted: ${error.message}`);
    }
    if (typedId(DIGEST.semanticContent, nquads) !== commitment.digest) return fail2("semantic digest mismatch");
    view = deepFreeze({ document: unsecured, nquads, issuer, verificationMethod: proof.verificationMethod, dependencies: structuredClone(dependencies) });
    if (cacheKey) boundedSet(cache, cacheKey, view, maxCacheEntries);
  }
  timings.stage2 = ms(start);
  // Validity is checked on the authenticated view at every use, never cached.
  if (validAt) {
    const t = Date.parse(validAt);
    if (view.document.validFrom && t < Date.parse(view.document.validFrom)) return { verified: false, stage: 2, reason: "not yet valid", rawChecked, timings };
    if (view.document.validUntil && t > Date.parse(view.document.validUntil)) return { verified: false, stage: 2, reason: "expired", rawChecked, timings };
  }
  return { verified: true, stage: 2, cached, view, rawChecked, timings };
}

/**
 * Graph-native re-verification: from stored N-Quads, the stored proof configuration and the
 * authenticated issuer. No JSON bytes, no context documents, no JSON-LD. Re-verifies the whole
 * committed dataset; single facts need a separate membership scheme.
 */
export async function verifyFromQuads({ nquads, proof, issuer, bound = DEFAULT_BOUND, ...rest }) {
  const issuers = issuerMap(rest);
  const config = structuredClone(proof);
  const proofValue = config.proofValue;
  delete config.proofValue;
  if (config.cryptosuite !== SUITE || config.profile !== PROFILE) return { verified: false, reason: "not an LFSC 0.4 proof" };
  const binding = issuerBinding(issuer, config.verificationMethod, issuers);
  if (binding) return { verified: false, reason: binding };
  let key, crv;
  try { ({ key, crv } = resolveVerificationMethod(config.verificationMethod)); } catch (error) { return { verified: false, reason: error.message }; }
  const decoded = decodeProofValue(proofValue, crv);
  if (!decoded.ok) return { verified: false, reason: decoded.reason };
  if (!ecdsaVerify(crv, key, signingInput(config), decoded.signature)) return { verified: false, reason: "signature invalid" };
  let canonical;
  try {
    canonical = await rdfCanonize.canonize(rdfCanonize.NQuads.parse(nquads), { ...canonizeOptions(bound), format: "application/n-quads" });
  } catch (error) {
    return { verified: false, reason: `bounded canonicalisation aborted: ${error.message}` };
  }
  return typedId(DIGEST.semanticContent, canonical) === config.semanticCommitment.digest
    ? { verified: true }
    : { verified: false, reason: "stored quads do not match the commitment" };
}

/** Proof configuration as a graph store would keep it next to the quads. */
export const storedConfiguration = (secured) => ({ ...structuredClone(secured.proof), "@context": structuredClone(secured["@context"]) });
