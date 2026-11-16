// SPDX-License-Identifier: Apache-2.0
// WE-1: the meaning gap of lexical (JCS) and enveloping (JOSE) proofs, and its
// mitigations. Reference case: a market-role credential that controls access to
// restricted Battery Passport data.

import { writeFileSync } from "node:fs";
import jsonld from "jsonld";
import { generateKeyPair, sri } from "./src/crypto.mjs";
import { issueLfsc, verifyLfsc } from "./src/lfsc.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "./src/loader.mjs";
import { addProof, freshResolver, signJwt, verifyJwt, verifyProof } from "./src/suites.mjs";

const ENERGY = "https://contexts.example/energy-roles/v1";
const honest = () => staticLoader({ ...W3C_CONTEXTS, [ENERGY]: contextFile("energy-roles-v1.jsonld") });
const substituted = () => staticLoader({ ...W3C_CONTEXTS, [ENERGY]: contextFile("energy-roles-v1.SUBSTITUTED.jsonld") });

const signer = generateKeyPair("P-256");
const did = `did:key:${signer.publicKeyMultibase}`;
const vm = `${did}#${signer.publicKeyMultibase}`;

const credential = {
  "@context": ["https://www.w3.org/ns/credentials/v2", ENERGY],
  id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11",
  type: ["VerifiableCredential", "MarketRoleCredential"],
  issuer: did,
  validFrom: "2026-11-10T00:00:00Z",
  credentialSubject: {
    id: "did:example:grid-operator-42",
    marketRole: "DistributionSystemOperator",
    dataAccessScope: "BatteryPassportPublicData"
  }
};

/** What an RDF-level policy engine sees: the expanded IRIs of the two claims. */
async function view(document, loader, options = {}) {
  const expanded = await jsonld.expand(document, { documentLoader: loader, contextResolver: freshResolver(), ...options });
  const subject = expanded[0]["https://www.w3.org/2018/credentials#credentialSubject"][0];
  const pick = (iri) => subject[iri]?.[0]?.["@id"] ?? subject[iri]?.[0]?.["@value"] ?? "(absent)";
  return {
    marketRole: pick("https://vocab.example/energy#marketRole"),
    dataAccessScope: pick("https://vocab.example/energy#dataAccessScope"),
    terms: Object.keys(subject).length
  };
}

const rows = [];
const record = (id, scenario, signature, meaning, outcome) => {
  rows.push({ id, scenario, signature, meaning, outcome });
};

// A: ecdsa-jcs-2019, honest context
const jcs = await addProof(credential, { suite: "ecdsa-jcs-2019", signer, verificationMethod: vm });
let v = await verifyProof(jcs);
let m = await view(jcs, honest());
record("A", "ecdsa-jcs-2019, context as issued", v.verified, m, "baseline");

// B: same credential, the document behind the context URL is substituted
v = await verifyProof(jcs);
const mB = await view(jcs, substituted());
record("B", "ecdsa-jcs-2019, context substituted behind the same URL", v.verified, mB,
  v.verified && mB.dataAccessScope !== m.dataAccessScope ? "GAP: valid signature, different meaning" : "no gap");

// C: ecdsa-rdfc-2019 under the same substitution
const rdfcSigned = await addProof(credential, { suite: "ecdsa-rdfc-2019", signer, verificationMethod: vm, loader: honest() });
v = await verifyProof(rdfcSigned, { loader: substituted() });
record("C", "ecdsa-rdfc-2019, context substituted", v.verified, await view(rdfcSigned, substituted()),
  v.verified ? "no detection" : "detected: signature fails (meaning is in the signing input)");

// D: VC-JOSE-COSE style envelope (application/vc+jwt)
const jwt = signJwt(credential, signer, vm);
const j = verifyJwt(jwt);
const mD = await view(j.payload, substituted());
record("D", "vc+jwt envelope (ES256), context substituted", j.verified, mD,
  j.verified && mD.dataAccessScope !== m.dataAccessScope ? "GAP: valid signature, different meaning" : "no gap");

// E: HW-S3 — relatedResource with digestSRI, checked by the verifier
const withRelated = { ...credential, relatedResource: [{ id: ENERGY, digestSRI: sri(contextFile("energy-roles-v1.jsonld")) }] };
const jcsRelated = await addProof(withRelated, { suite: "ecdsa-jcs-2019", signer, verificationMethod: vm });
v = await verifyProof(jcsRelated);
const loaderE = substituted();
const digestOk = jcsRelated.relatedResource.every((r) => sri(loaderE.bytes.get(r.id)) === r.digestSRI);
record("E", "ecdsa-jcs-2019 + relatedResource digestSRI (HW-S3), context substituted", v.verified, await view(jcsRelated, loaderE),
  digestOk ? "no detection" : "detected: context digest mismatch");

// F: LFSC-G (M17) — honest and substituted
const allowedContexts = new Set(["https://www.w3.org/ns/credentials/v2", ENERGY]);
const allowedVerificationMethods = new Set([vm]);
const lfsc = await issueLfsc(credential, { signer, verificationMethod: vm, loader: honest() });
const fHonest = await verifyLfsc(lfsc, { loader: honest(), allowedContexts, allowedVerificationMethods });
record("F1", "LFSC-G (M17), context as issued", fHonest.verified, await view(lfsc, honest()), `accepted at stage ${fHonest.stage}`);
const fSub = await verifyLfsc(lfsc, { loader: substituted(), allowedContexts, allowedVerificationMethods });
record("F2", "LFSC-G (M17), context substituted", fSub.verified, await view(lfsc, substituted()), `detected at stage ${fSub.stage}: ${fSub.reason}`);

// G (WE-1b): a signed claim with no definition in any context
const extra = structuredClone(credential);
extra.credentialSubject.eligibleForFastTrack = true;
const jcsExtra = await addProof(extra, { suite: "ecdsa-jcs-2019", signer, verificationMethod: vm });
v = await verifyProof(jcsExtra);
const mG = await view(jcsExtra, honest());
let safeError = "";
try {
  await view(jcsExtra, honest(), { safe: true });
} catch (error) {
  safeError = error.message.split("\n")[0];
}
let rdfcError = "";
try {
  await addProof(extra, { suite: "ecdsa-rdfc-2019", signer, verificationMethod: vm, loader: honest() });
} catch (error) {
  rdfcError = error.message.split("\n")[0];
}
record("G", "ecdsa-jcs-2019 with an undefined term (JSON view has it, RDF view drops it)", v.verified,
  { ...mG, note: `JSON terms in subject: ${Object.keys(extra.credentialSubject).length}; RDF terms: ${mG.terms}` },
  `GAP: signed claim invisible to RDF consumers. jsonld safe mode: "${safeError || "no error"}"; RDFC issuance: "${rdfcError || "no error"}"`);

// I: SSRF reachability vs. pre-scan
const ssrf = { ...credential, "@context": ["https://www.w3.org/ns/credentials/v2", "http://169.254.169.254/latest/meta-data/"] };
const ssrfSigned = await addProof(ssrf, { suite: "ecdsa-jcs-2019", signer, verificationMethod: vm });
const naiveLoader = honest();
try {
  await view(ssrfSigned, naiveLoader);
} catch {}
const lfscLoader = honest();
const ssrfLfsc = await verifyLfsc(ssrfSigned, { loader: lfscLoader, allowedContexts, allowedVerificationMethods });
record("I", "context URL pointing at a cloud metadata endpoint",
  "n/a", { naiveLoaderRequests: naiveLoader.requests.filter((u) => u.includes("169.254")), lfscLoaderRequests: lfscLoader.requests },
  `naive processing asks for the URL; LFSC stage ${ssrfLfsc.stage} rejects before any request (${ssrfLfsc.reason})`);

// H (WE-1c): jsonld.js process-wide resolved-context cache for loaders tagging documents "static"
const staticSubstituted = staticLoader({ ...W3C_CONTEXTS, [ENERGY]: contextFile("energy-roles-v1.SUBSTITUTED.jsonld") }, { tag: "static" });
const staticHonest = staticLoader({ ...W3C_CONTEXTS, [ENERGY]: contextFile("energy-roles-v1.jsonld") }, { tag: "static" });
const first = await jsonld.expand(credential, { documentLoader: staticSubstituted });
const second = await jsonld.expand(credential, { documentLoader: staticHonest });
const scope = (expanded) => expanded[0]["https://www.w3.org/2018/credentials#credentialSubject"][0]["https://vocab.example/energy#dataAccessScope"][0]["@id"];
record("H", "two loaders with different 'static' copies of one URL in one process (default jsonld.js cache)", "n/a",
  { firstLoader: scope(first), secondLoader: scope(second), secondLoaderAskedFor: staticHonest.requests },
  scope(second) !== "https://vocab.example/battery#PublicData"
    ? "GAP: the honest loader's copy is never consulted; the first resolution wins process-wide"
    : "no cross-loader effect");

console.log("\nWE-1 results (jsonld 8.3.3 / rdf-canonize 3.4.0, Node " + process.version + ")\n");
for (const row of rows) {
  console.log(`[${row.id}] ${row.scenario}`);
  console.log(`     signature valid: ${row.signature}`);
  console.log(`     meaning: ${JSON.stringify(row.meaning)}`);
  console.log(`     => ${row.outcome}\n`);
}
writeFileSync(new URL("./results/we1.json", import.meta.url), JSON.stringify({ node: process.version, at: new Date().toISOString(), rows }, null, 2));
