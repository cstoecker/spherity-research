// SPDX-License-Identifier: Apache-2.0
// Data Integrity cryptosuites ecdsa-jcs-2019 and ecdsa-rdfc-2019 (W3C Data
// Integrity ECDSA Cryptosuites v1.0), plus a VC-JOSE-COSE style ES256 JWS
// envelope (application/vc+jwt). Written from the specifications; the
// ecdsa-jcs-2019 path is checked against the W3C test vectors in test/.

import canonicalize from "canonicalize";
import jsonld from "jsonld";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ContextResolver = require("jsonld/lib/ContextResolver.js");
const MessageDigest = require("rdf-canonize/lib/MessageDigest.js");

/** A resolver with a private cache, so no context resolution leaks between calls. */
export const freshResolver = () => new ContextResolver({ sharedCache: new Map() });
import { base58Decode, base58Encode, digest, ecdsaSign, ecdsaVerify, hashFor, publicKeyFromMultibase } from "./crypto.mjs";

const clone = (value) => structuredClone(value);

export function resolveVerificationMethod(verificationMethod) {
  // did:key Multikey only; the fragment is the publicKeyMultibase.
  const match = /^did:key:(z[1-9A-HJ-NP-Za-km-z]+)#(z[1-9A-HJ-NP-Za-km-z]+)$/.exec(verificationMethod ?? "");
  if (!match || match[1] !== match[2]) throw new Error(`unsupported verification method ${verificationMethod}`);
  return publicKeyFromMultibase(match[2]);
}

function proofConfiguration(document, options) {
  const config = clone(options);
  delete config.proofValue;
  if (document["@context"]) config["@context"] = clone(document["@context"]);
  return config;
}

async function rdfc(document, loader, maxDeepIterations, hash = "sha256") {
  return jsonld.canonize(document, {
    algorithm: "URDNA2015",
    format: "application/n-quads",
    documentLoader: loader,
    safe: true,
    maxDeepIterations,
    // A fresh resolver per call: no process-wide shared cache (see WE-1c).
    contextResolver: freshResolver(),
    // RDFC-1.0 internal hash follows the curve (SHA-384 for P-384), as the W3C vectors require.
    createMessageDigest: () => new MessageDigest(hash)
  });
}

/** Transformation + hashing for one suite. Returns hashData. */
async function hashData(suite, crv, unsecured, config, { loader, maxDeepIterations } = {}) {
  const algorithm = hashFor(crv);
  if (suite === "ecdsa-jcs-2019") {
    const configHash = digest(algorithm, canonicalize(config));
    const documentHash = digest(algorithm, canonicalize(unsecured));
    return Buffer.concat([configHash, documentHash]);
  }
  if (suite === "ecdsa-rdfc-2019") {
    const configHash = digest(algorithm, await rdfc(config, loader, maxDeepIterations, algorithm));
    const documentHash = digest(algorithm, await rdfc(unsecured, loader, maxDeepIterations, algorithm));
    return Buffer.concat([configHash, documentHash]);
  }
  throw new Error(`unsupported cryptosuite ${suite}`);
}

export async function addProof(document, { suite, signer, verificationMethod, created = "2026-11-10T00:00:00Z", extra = {}, loader }) {
  const unsecured = clone(document);
  delete unsecured.proof;
  const options = {
    type: "DataIntegrityProof",
    cryptosuite: suite,
    created,
    verificationMethod,
    proofPurpose: "assertionMethod",
    ...extra
  };
  const config = proofConfiguration(unsecured, options);
  const data = await hashData(suite, signer.crv, unsecured, config, { loader });
  const proofValue = "z" + base58Encode(ecdsaSign(signer.crv, signer.key, data));
  return { ...unsecured, proof: { ...options, proofValue } };
}

/**
 * Verify one Data Integrity proof. The order follows the specification:
 * transform (canonicalise), hash, then check the signature.
 */
export async function verifyProof(secured, { loader, maxDeepIterations } = {}) {
  const unsecured = clone(secured);
  const proof = unsecured.proof;
  delete unsecured.proof;
  const options = clone(proof);
  const proofValue = options.proofValue;
  delete options.proofValue;
  if (options["@context"]) {
    const expected = [].concat(options["@context"]);
    const actual = [].concat(unsecured["@context"] ?? []);
    if (!expected.every((value, index) => JSON.stringify(value) === JSON.stringify(actual[index]))) {
      return { verified: false, reason: "proof @context does not match document @context" };
    }
    unsecured["@context"] = options["@context"];
  }
  const { key, crv } = resolveVerificationMethod(options.verificationMethod);
  const config = proofConfiguration(unsecured, options);
  const data = await hashData(options.cryptosuite, crv, unsecured, config, { loader, maxDeepIterations });
  const signature = base58Decode(proofValue.slice(1));
  return { verified: ecdsaVerify(crv, key, data, signature), reason: "signature" };
}

// ---- VC-JOSE-COSE style envelope (application/vc+jwt), ES256 ----------------
const b64url = (value) => Buffer.from(value).toString("base64url");

export function signJwt(payload, signer, kid) {
  const header = { alg: "ES256", typ: "vc+jwt", cty: "vc", kid };
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  return `${input}.${b64url(ecdsaSign(signer.crv, signer.key, Buffer.from(input)))}`;
}

export function verifyJwt(jwt, allowedAlgorithms = ["ES256"]) {
  const [h, p, s] = jwt.split(".");
  const header = JSON.parse(Buffer.from(h, "base64url"));
  if (!allowedAlgorithms.includes(header.alg)) return { verified: false, reason: `alg ${header.alg} not allowed` };
  const { key, crv } = publicKeyFromMultibase(header.kid.split("#")[1]);
  const verified = ecdsaVerify(crv, key, Buffer.from(`${h}.${p}`), Buffer.from(s, "base64url"));
  return { verified, payload: JSON.parse(Buffer.from(p, "base64url")) };
}

export { rdfc };
