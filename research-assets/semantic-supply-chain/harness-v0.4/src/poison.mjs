// SPDX-License-Identifier: Apache-2.0
// Poison-graph generators following the families of arXiv:2611.04461.
import { createHash } from "node:crypto";
import { base58Encode, generateKeyPair } from "./crypto.mjs";

const EX = "https://www.w3.org/ns/credentials/examples/v2";
const attacker = generateKeyPair("P-256"); // not trusted by the verifier
const attackerVm = `did:key:${attacker.publicKeyMultibase}#${attacker.publicKeyMultibase}`;

export function edges(family, n) {
  const out = Array.from({ length: n }, () => []);
  if (family === "complete") for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) out[i].push(j);
  if (family === "ring") for (let i = 0; i < n; i++) out[i].push((i + 1) % n, (i - 1 + n) % n);
  // Complete binary tree: acyclic but symmetric (all leaves look alike).
  if (family === "binary-tree" || family === "labelled-tree") for (let i = 1; i < n; i++) out[Math.floor((i - 1) / 2)].push(i);
  return out;
}

export function poison(family, n, suite = "ecdsa-rdfc-2019", { blankNodes = true } = {}) {
  const id = (i) => (blankNodes ? `_:b${i}` : `urn:example:n${i}`);
  const adjacency = edges(family, n);
  // labelled-tree: a unique literal per node breaks symmetry (benign control).
  const nodes = adjacency.map((targets, i) => ({
    id: id(i), ...(family === "labelled-tree" ? { seq: i } : {}), link: targets.map((j) => ({ id: id(j) }))
  }));
  return {
    "@context": ["https://www.w3.org/ns/credentials/v2", EX],
    id: "urn:uuid:00000000-0000-4000-8000-000000000001",
    type: ["VerifiableCredential"],
    issuer: attackerVm.split("#")[0],
    validFrom: "2026-11-10T00:00:00Z",
    credentialSubject: nodes[0],
    "@included": nodes.slice(1),
    proof: {
      type: "DataIntegrityProof",
      cryptosuite: suite,
      created: "2026-11-10T00:00:00Z",
      verificationMethod: attackerVm,
      proofPurpose: "assertionMethod",
      // forged: no key needed; fixed bytes so that fixture sizes are reproducible (review R4-30)
      proofValue: "z" + base58Encode(createHash("sha512").update(`forged:${family}:${n}:${suite}`).digest())
    }
  };
}

export { attackerVm };
