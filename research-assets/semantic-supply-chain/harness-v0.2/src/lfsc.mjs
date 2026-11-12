// SPDX-License-Identifier: Apache-2.0
// M17: Lexical-first, semantic-committed proofs, graph-native variant (LFSC-G).
// EXPERIMENTAL cryptosuite identifier "ecdsa-lfsc-2026".
//
// The signature covers only the proof configuration. The configuration carries
//   - lexicalDigest:      SHA-256 of the JCS form of the unsecured credential,
//   - semanticCommitment: SHA-256 of its RDFC-1.0 canonical N-Quads, plus the
//                         SRI digest of every context.
// Ingestion: pre-scan -> lexical digest + signature (no JSON-LD) -> bounded
// expansion compared with the commitment. Later re-verification needs only the
// stored quads and the proof configuration (graph-native per-fact
// verifiability in the sense of "Proofs over Statements", Definition 5.1).
// An unknown cryptosuite identifier makes legacy verifiers reject the proof
// instead of silently skipping the semantic check (must-understand).

import canonicalize from "canonicalize";
import { createRequire } from "node:module";
import { base58Decode, base58Encode, digest, ecdsaSign, ecdsaVerify, sri } from "./crypto.mjs";
import { prescan } from "./prescan.mjs";
import { rdfc, resolveVerificationMethod } from "./suites.mjs";

const require = createRequire(import.meta.url);
const rdfCanonize = require("rdf-canonize");

export const SUITE = "ecdsa-lfsc-2026";
const now = () => process.hrtime.bigint();
const ms = (start) => Number(now() - start) / 1e6;
const b64 = (buffer) => buffer.toString("base64");
const sha256SRI = (data) => `sha256-${b64(digest("sha256", data))}`;

function configOf(unsecured, options) {
  const config = structuredClone(options);
  delete config.proofValue;
  if (unsecured["@context"]) config["@context"] = structuredClone(unsecured["@context"]);
  return config;
}

const signingInput = (config) => digest("sha256", canonicalize(config));

export async function issueLfsc(document, { signer, verificationMethod, loader, created = "2026-11-10T00:00:00Z" }) {
  const unsecured = structuredClone(document);
  delete unsecured.proof;
  const nquads = await rdfc(unsecured, loader, Infinity, "sha256");
  const options = {
    type: "DataIntegrityProof",
    cryptosuite: SUITE,
    created,
    verificationMethod,
    proofPurpose: "assertionMethod",
    lexicalDigest: sha256SRI(canonicalize(unsecured)),
    semanticCommitment: {
      canonicalization: "RDFC-1.0",
      digestSRI: sha256SRI(nquads),
      contexts: [].concat(unsecured["@context"]).map((id) => ({ id, digestSRI: sri(loader.bytes.get(id)) }))
    }
  };
  const proofValue = "z" + base58Encode(ecdsaSign(signer.crv, signer.key, signingInput(configOf(unsecured, options))));
  return { ...unsecured, proof: { ...options, proofValue } };
}

function checkSignature(config, proofValue) {
  const { key, crv } = resolveVerificationMethod(config.verificationMethod);
  return ecdsaVerify(crv, key, signingInput(config), base58Decode(proofValue.slice(1)));
}

/**
 * Stage 0: pre-scan (linear, no JSON-LD).
 * Stage 1: lexical digest + signature over the configuration (no JSON-LD).
 * Stage 2: context digests, then bounded RDFC compared with the commitment.
 */
export async function verifyLfsc(secured, {
  loader, allowedVerificationMethods, allowedContexts, maxDeepIterations = 1, cache, epoch = 0
}) {
  const timings = {};
  let start = now();
  const scan = prescan(secured, { allowedContexts });
  timings.stage0 = ms(start);
  if (!scan.ok) return { verified: false, stage: 0, reason: scan.reason, timings };

  start = now();
  const proof = secured.proof ?? {};
  const fail1 = (reason) => ({ verified: false, stage: 1, reason, timings: { ...timings, stage1: ms(start) } });
  if (proof.cryptosuite !== SUITE || !proof.semanticCommitment || !proof.lexicalDigest) return fail1("not an LFSC proof (must-understand)");
  if (!allowedVerificationMethods.has(proof.verificationMethod)) return fail1("issuer not allowlisted");
  const unsecured = structuredClone(secured);
  delete unsecured.proof;
  if (sha256SRI(canonicalize(unsecured)) !== proof.lexicalDigest) return fail1("lexical digest mismatch");
  const config = configOf(unsecured, proof);
  if (!checkSignature(config, proof.proofValue)) return fail1("signature invalid");
  timings.stage1 = ms(start);

  start = now();
  const commitment = proof.semanticCommitment;
  const key = `${proof.proofValue}|${commitment.digestSRI}|${epoch}`;
  if (cache?.has(key)) {
    timings.stage2 = ms(start);
    return { verified: true, stage: 2, cached: true, timings };
  }
  const fail2 = (reason) => ({ verified: false, stage: 2, reason, timings: { ...timings, stage2: ms(start) } });
  for (const { id, digestSRI } of commitment.contexts) {
    const bytes = loader.bytes.get(id);
    if (!bytes) return fail2(`context not available: ${id}`);
    if (sri(bytes) !== digestSRI) return fail2(`context digest mismatch: ${id}`);
  }
  let nquads;
  try {
    nquads = await rdfc(unsecured, loader, maxDeepIterations, "sha256");
  } catch (error) {
    return fail2(`bounded canonicalisation aborted: ${error.message}`);
  }
  if (sha256SRI(nquads) !== commitment.digestSRI) return fail2("semantic digest mismatch");
  timings.stage2 = ms(start);
  cache?.set(key, true);
  return { verified: true, stage: 2, cached: false, timings };
}

/**
 * Graph-native re-verification: from stored N-Quads and the stored proof
 * configuration only. No JSON bytes, no context documents, no JSON-LD.
 */
export async function verifyFromQuads({ nquads, proof, maxDeepIterations = 1 }) {
  const config = structuredClone(proof);
  const proofValue = config.proofValue;
  delete config.proofValue;
  if (config.cryptosuite !== SUITE) return { verified: false, reason: "not an LFSC proof" };
  if (!checkSignature(config, proofValue)) return { verified: false, reason: "signature invalid" };
  const canonical = await rdfCanonize.canonize(rdfCanonize.NQuads.parse(nquads), {
    algorithm: "URDNA2015", format: "application/n-quads", maxDeepIterations
  });
  return sha256SRI(canonical) === config.semanticCommitment.digestSRI
    ? { verified: true }
    : { verified: false, reason: "stored quads do not match the commitment" };
}

/** Proof configuration as a graph store would keep it next to the quads. */
export const storedConfiguration = (secured) => ({ ...structuredClone(secured.proof), "@context": structuredClone(secured["@context"]) });
