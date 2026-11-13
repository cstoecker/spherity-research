// SPDX-License-Identifier: Apache-2.0
// WE-2: what a CBOR-LD label means depends on codec tables, decoder semantics and context bytes
// that travel separately. Reference case: a market-role credential encoded for a Battery Passport
// label (QR / NFC), read years after printing.
//
// Part 1 (S1-S4) shows the problem with unbound CBOR-LD, as deployed today (unchanged from v0.3).
// Part 2 (S5-S20) runs M15 v0.4: envelope v2 over a complete decoding manifest, profiles B and
// I-RDFC accepted, A and I-JCS rejected by policy, and the formal review's attacks X4, X7, X8.
// Keys are derived from fixed labels so that the output is reproducible; ECDSA signatures are
// randomised, so no signature bytes are printed.

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { encode as cborEncode } from "cborg";
import {
  ENVELOPE_TAG, INSTALLED_DECODER, MANIFEST_VERSION, buildManifest, decodeBound, decodePlain, digestHex, encodeBound,
  encodeEnvelope, encodePlain, manifestDigest, parseEnvelope, sealEnvelope, tableContextIds, verifyEnvelopeSignature
} from "./src/cborld-binding.mjs";
import { base58Encode, DIGEST, privateKeyFromMultibase } from "./src/crypto.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "./src/loader.mjs";
import { addProof, rdfc, verifyProof } from "./src/suites.mjs";

const V2 = "https://www.w3.org/ns/credentials/v2";
const EN = "https://contexts.example/energy-roles/v1";
const REG = 100;
const tableV1 = new Map([["context", new Map([[V2, 32768], [EN, 32769]])], ["url", new Map()], ["none", new Map()]]);

const original = contextFile("energy-roles-v1.jsonld");
// A routine vocabulary update published under the same URL: one term added.
const updatedContext = JSON.parse(original);
updatedContext["@context"] = { "@protected": true, AggregatorRole: "https://vocab.example/energy#Aggregator",
  ...Object.fromEntries(Object.entries(updatedContext["@context"]).filter(([k]) => k !== "@protected")) };
const updated = Buffer.from(JSON.stringify(updatedContext, null, 2));
// Same terms, other IRIs (WE-1's substituted copy): TSO and restricted data.
const substituted = contextFile("energy-roles-v1.SUBSTITUTED.jsonld");
const loaderWith = (energy) => staticLoader({ ...W3C_CONTEXTS, [EN]: energy });

// X7 fixture: the WE-2 credential with its access-scope vocabulary imported from inside the
// top-level context, so the imported context never appears in the registry's type table.
const ENX = "https://contexts.example/energy-roles/v2";
const SC = "https://contexts.example/battery-scopes/v1";
const PUBLIC = "https://vocab.example/battery#PublicData";
const RESTRICTED = "https://vocab.example/battery#RestrictedData";
const enx = JSON.stringify({ "@context": { "@import": SC, "@protected": true,
  MarketRoleCredential: "https://vocab.example/energy#MarketRoleCredential",
  marketRole: { "@id": "https://vocab.example/energy#marketRole", "@type": "@vocab" },
  DistributionSystemOperator: "https://vocab.example/energy#DistributionSystemOperator",
  TransmissionSystemOperator: "https://vocab.example/energy#TransmissionSystemOperator" } }, null, 2);
const scopes = (publicIri) => JSON.stringify({ "@context": {
  dataAccessScope: { "@id": "https://vocab.example/energy#dataAccessScope", "@type": "@vocab" },
  BatteryPassportPublicData: publicIri, BatteryPassportRestrictedData: RESTRICTED } }, null, 2);
const tableX = new Map([["context", new Map([[V2, 32768], [ENX, 32769]])], ["url", new Map()], ["none", new Map()]]);
const loaderX = (publicIri) => staticLoader({ [V2]: W3C_CONTEXTS[V2], [ENX]: enx, [SC]: scopes(publicIri) });

// P-256 key from a fixed label (multikey private-key prefix 0x8626), so DIDs are stable.
const fixedSigner = (label) =>
  privateKeyFromMultibase("z" + base58Encode(Buffer.concat([Buffer.from([0x86, 0x26]), createHash("sha256").update(label).digest()])));
const signer = fixedSigner("ssc-harness/we2/issuer/v1");
const did = `did:key:${signer.publicKeyMultibase}`;
const vm = `${did}#${signer.publicKeyMultibase}`;
const credential = {
  "@context": [V2, EN],
  id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11",
  type: ["VerifiableCredential", "MarketRoleCredential"],
  issuer: did,
  credentialSubject: { id: "did:example:grid-operator-42", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData" }
};
const credentialX = { ...credential, "@context": [V2, ENX] };

const rows = [];
const record = (id, scenario, outcome, detail = "", extra = {}) => rows.push({ id, scenario, outcome, detail, ...extra });
const summary = (doc) => doc && JSON.stringify({
  topLevelKeys: Object.keys(doc).filter((k) => k !== "@context" && k !== "proof").sort(),
  type: doc.type,
  subject: doc.credentialSubject ?? "(missing)",
  scope: (doc.credentialSubject ?? doc.credentialStatus)?.dataAccessScope
});
const scopeOf = (graph) => /energy#dataAccessScope> <([^>]+)>/.exec(graph ?? "")?.[1] ?? "(none)";
const short = (iri) => iri.replace("https://vocab.example/battery#", "battery#");
// Error messages that quote payload bytes would differ per run (randomised signatures).
const clean = (message) => message.split("\n")[0].replace(/"[0-9,]{16,}[^"]*"?/g, "<payload bytes>");
const graphScope = async (doc, loader) => {
  try {
    return short(scopeOf(await rdfc(doc, loader)));
  } catch (error) {
    return `no graph (${clean(error.message).slice(0, 60)})`;
  }
};
const describe = (result) => (result.ok
  ? `ACCEPTED (${result.profile}, ${result.source}); graph: dataAccessScope = ${short(scopeOf(result.graph))}`
  : `REJECTED at ${result.stage}: ${result.reason}`);
const registry = (typeTable, loader, contexts) => new Map([[REG, { typeTable, loader, ...(contexts ? { contexts } : {}) }]]);
const localDigest = (typeTable, loader) =>
  manifestDigest(buildManifest({ registryEntryId: REG, typeTable, contextIds: tableContextIds(typeTable), contextBytes: loader.bytes }));
const rewrite = (envelope, digest) => encodeEnvelope({ ...parseEnvelope(envelope), manifestDigest: digest });
const meaningRow = (result) => ({ accepted: result.ok, stage: result.ok ? null : result.stage, scope: result.ok ? scopeOf(result.graph) : null });

// ---- Issuance -------------------------------------------------------------------------------
// The WE-2 label as published: Data Integrity proof first, then CBOR-LD (VC Barcodes pattern).
const signedRdfc = await addProof(credential, { suite: "ecdsa-rdfc-2019", signer, verificationMethod: vm, loader: loaderWith(original) });
const signedJcs = await addProof(credential, { suite: "ecdsa-jcs-2019", signer, verificationMethod: vm, loader: loaderWith(original) });
const labelI = await encodeBound(signedRdfc, { registryEntryId: REG, typeTable: tableV1, documentLoader: loaderWith(original), profile: "I-RDFC" });
const labelB = await encodeBound(credential, { registryEntryId: REG, typeTable: tableV1, documentLoader: loaderWith(original), profile: "B", signer, verificationMethod: vm });
const labelA = await encodeBound(credential, { registryEntryId: REG, typeTable: tableV1, documentLoader: loaderWith(original), profile: "A", signer, verificationMethod: vm });
const labelJ = await encodeBound(signedJcs, { registryEntryId: REG, typeTable: tableV1, documentLoader: loaderWith(original), profile: "I-JCS" });
const labelX = await encodeBound(credentialX, { registryEntryId: REG, typeTable: tableX, documentLoader: loaderX(PUBLIC), profile: "B", signer, verificationMethod: vm });
const cborldBytes = labelI.cborldBytes;
const unsignedBytes = labelB.cborldBytes;

// ---- Part 1: the problem, as deployed today (unbound CBOR-LD) --------------------------------
let decoded = await decodePlain(cborldBytes, { registryEntryId: REG, typeTable: tableV1, documentLoader: loaderWith(original) });
let v = await verifyProof(decoded, { loader: loaderWith(original) });
record("S1", "Baseline: label decoded with the issuer's registry entry and contexts", `proof valid: ${v.verified}`, summary(decoded), { part: 1 });

try {
  decoded = await decodePlain(cborldBytes, { registryEntryId: REG, typeTable: tableV1, documentLoader: loaderWith(updated) });
  let verify2;
  try { verify2 = (await verifyProof(decoded, { loader: loaderWith(updated) })).verified; } catch (error) { verify2 = `error: ${clean(error.message).slice(0, 60)}`; }
  record("S2", "Signed label after a routine vocabulary update (one term added under the same URL)",
    `decodes without error into a different document; Data Integrity proof: ${verify2}`, summary(decoded), { part: 1 });
} catch (error) {
  record("S2", "Signed label after a routine vocabulary update (one term added under the same URL)",
    `label UNREADABLE: decode error "${clean(error.message).slice(0, 70)}"; the reason (codec drift) is not reported, and the label stays unusable for its lifetime`, "", { part: 1 });
}

const decoded3 = await decodePlain(unsignedBytes, { registryEntryId: REG, typeTable: tableV1, documentLoader: loaderWith(updated) });
const s3signature = verifyEnvelopeSignature(parseEnvelope(labelA.envelope)).ok;
record("S3", "Compact profile signing the CBOR-LD bytes, after the same update",
  `signature valid: ${s3signature}; meaning changed silently; graph: dataAccessScope = ${await graphScope(decoded3, loaderWith(updated))}`, summary(decoded3), { part: 1 });

const tableSwapped = new Map([["context", new Map([[EN, 32768], [V2, 32769]])], ["url", new Map()], ["none", new Map()]]);
let s4;
try {
  const d = await decodePlain(cborldBytes, { registryEntryId: REG, typeTable: tableSwapped, documentLoader: loaderWith(original) });
  let pv; try { pv = (await verifyProof(d, { loader: loaderWith(original) })).verified; } catch (e) { pv = `error: ${clean(e.message).slice(0, 60)}`; }
  s4 = { outcome: `decodes; proof: ${pv}`, detail: summary(d) };
} catch (error) {
  s4 = { outcome: `decode error: ${clean(error.message).slice(0, 80)}`, detail: "" };
}
record("S4", "Registry entry substituted at the verifier (context codes swapped)", s4.outcome, s4.detail, { part: 1 });

// ---- Part 2: M15 v0.4 ---------------------------------------------------------------------------
const registryUpdated = registry(tableV1, loaderWith(updated));
const archiveI = new Map([[digestHex(labelI.manifestDigest), labelI.archiveEntry]]);
const manifestLogI = new Map([[digestHex(labelI.manifestDigest), { manifest: labelI.manifest }]]);

let r = await decodeBound(labelI.envelope, { registry: registryUpdated });
record("S5", "M15 v0.4, WE-2 label (I-RDFC); verifier's context was updated; no archive", describe(r), "", { part: 2, ...meaningRow(r) });

r = await decodeBound(labelI.envelope, { registry: registryUpdated, archive: archiveI });
record("S6", "M15 v0.4, WE-2 label (I-RDFC) + lifetime archive of the issuer's manifest and material", describe(r), summary(r.document), { part: 2, ...meaningRow(r) });

r = await decodeBound(labelI.envelope, { registry: registry(tableSwapped, loaderWith(original)), archive: manifestLogI });
record("S7", "M15 v0.4, WE-2 label (I-RDFC); registry entry substituted at the verifier; issuer's manifest published", describe(r), "", { part: 2, ...meaningRow(r) });

r = await decodeBound(labelB.envelope, { registry: registry(tableV1, loaderWith(original)) });
record("S8", "Profile B (issuer signs the envelope), honest round trip", describe(r), summary(r.document), { part: 2, ...meaningRow(r) });

r = await decodeBound(labelI.envelope, { registry: registry(tableV1, loaderWith(original)) });
record("S9", "Profile I-RDFC (inner ecdsa-rdfc-2019 proof), honest round trip", describe(r), summary(r.document), { part: 2, ...meaningRow(r) });

// X4: the attacker rewrites the manifest digest to the one a drifted verifier computes locally.
const forgedUpdated = localDigest(tableV1, loaderWith(updated));
const forgedA = rewrite(labelA.envelope, forgedUpdated);
r = await decodeBound(forgedA, { registry: registryUpdated });
const unsafeA = await decodeBound(forgedA, { registry: registryUpdated, acceptProfiles: ["A"] });
record("S10", "X4: profile A (signature over CBOR-LD bytes only), envelope rewritten to match a verifier with the updated context",
  `${describe(r)}. If A were accepted: signature valid: ${verifyEnvelopeSignature(parseEnvelope(forgedA)).ok}; ${describe(unsafeA)}`,
  summary(unsafeA.document), { part: 2, ...meaningRow(r), ifAccepted: meaningRow(unsafeA) });

r = await decodeBound(rewrite(labelB.envelope, forgedUpdated), { registry: registryUpdated });
record("S11", "X4 against profile B: the same rewrite", describe(r), "", { part: 2, ...meaningRow(r) });

// X8: substituted context (same terms, other IRIs); the JSON decodes unchanged.
const registrySubstituted = registry(tableV1, loaderWith(substituted));
const forgedSubstituted = localDigest(tableV1, loaderWith(substituted));
const forgedJ = rewrite(labelJ.envelope, forgedSubstituted);
r = await decodeBound(forgedJ, { registry: registrySubstituted });
const unsafeJ = await decodeBound(forgedJ, { registry: registrySubstituted, acceptProfiles: ["I-JCS"] });
record("S12", "X8: profile I-JCS (inner ecdsa-jcs-2019 proof), envelope rewritten to match a verifier with the substituted context",
  `${describe(r)}. If I-JCS were accepted: inner JCS proof valid; ${describe(unsafeJ)}`,
  summary(unsafeJ.document), { part: 2, ...meaningRow(r), ifAccepted: meaningRow(unsafeJ) });

r = await decodeBound(rewrite(labelI.envelope, forgedSubstituted), { registry: registrySubstituted });
record("S13", "X8 against profile I-RDFC: the same rewrite", describe(r), "", { part: 2, ...meaningRow(r) });

// X7: a context imported from inside a pinned context is substituted at the verifier.
const topLevel = buildManifest({ registryEntryId: REG, typeTable: tableX, contextIds: tableContextIds(tableX), contextBytes: loaderX(PUBLIC).bytes });
const labelTop = sealEnvelope({ profile: "B", registryEntryId: REG, manifest: topLevel, cborldBytes: labelX.cborldBytes, signer, verificationMethod: vm });
const v03 = await decodePlain(labelX.cborldBytes, { registryEntryId: REG, typeTable: tableX, documentLoader: loaderX(RESTRICTED) });
record("S14", "X7 with the v0.3 manifest scope: profile B over a top-level manifest; imported context substituted; unpinned decoding",
  `signature valid: ${verifyEnvelopeSignature(parseEnvelope(labelTop)).ok}; top-level contexts match; decodes; graph: dataAccessScope = ${await graphScope(v03, loaderX(RESTRICTED))}`,
  summary(v03), { part: 2 });

const closure = [V2, ENX, SC];
const registryX = registry(tableX, loaderX(RESTRICTED), closure);
r = await decodeBound(labelX.envelope, { registry: registryX });
record("S15", "X7 with v0.4 (transitive manifest, profile B); imported context substituted; no archive", describe(r), "", { part: 2, ...meaningRow(r) });

const keyX = digestHex(labelX.manifestDigest);
r = await decodeBound(labelX.envelope, { registry: registryX, archive: new Map([[keyX, { manifest: labelX.manifest }]]) });
record("S16", "X7 with v0.4; issuer's manifest published, material not archived", describe(r), "", { part: 2, ...meaningRow(r) });

r = await decodeBound(labelX.envelope, { registry: registryX, archive: new Map([[keyX, labelX.archiveEntry]]) });
record("S17", "X7 with v0.4 + lifetime archive of the issuer's material", describe(r), summary(r.document), { part: 2, ...meaningRow(r) });

r = await decodeBound(labelTop, { registry: registry(tableX, loaderX(PUBLIC)) });
record("S18", "v0.4 decoder given a signed top-level manifest (v0.3 scope); verifier holds the issuer's bytes", describe(r), "", { part: 2, ...meaningRow(r) });

const archiveB = new Map([[digestHex(labelB.manifestDigest), labelB.archiveEntry]]);
r = await decodeBound(labelB.envelope, { registry: registry(tableV1, loaderWith(original)), archive: archiveB, decoder: { ...INSTALLED_DECODER, version: "9.0.0" } });
record("S19", "Decoder drift (MC-4): profile B; verifier's decoder reports version 9.0.0 (simulated); archive holds the issuer's material", describe(r), "", { part: 2, ...meaningRow(r) });

const patched = { ...INSTALLED_DECODER, codecs: { ...INSTALLED_DECODER.codecs, urlCodecs: [...INSTALLED_DECODER.codecs.urlCodecs, ["did:web:", 1026]] } };
r = await decodeBound(labelB.envelope, { registry: registry(tableV1, loaderWith(original)), archive: archiveB, decoder: patched });
record("S20", "Codec drift under an unchanged version string: verifier's build adds a URL codec (simulated)", describe(r), "", { part: 2, ...meaningRow(r) });

// ---- Sizes ------------------------------------------------------------------------------------
const textLength = (value) => cborEncode(value).length;
const v03Envelope = cborEncode([REG, new Uint8Array(16), new Uint8Array(cborldBytes)]).length;
const sizes = {
  cborldSigned: cborldBytes.length,
  cborldUnsigned: unsignedBytes.length,
  v03EnvelopeWith128BitDigest: v03Envelope,
  envelopeIRdfc: labelI.envelope.length,
  envelopeB: labelB.envelope.length,
  envelopeBParts: {
    digest: textLength(new Uint8Array(32)),
    signature: textLength(new Uint8Array(64)),
    verificationMethod: textLength(vm),
    framing: labelB.envelope.length - unsignedBytes.length - textLength(new Uint8Array(32)) - textLength(new Uint8Array(64)) - textLength(vm)
  }
};

const lines = [];
const out = (line = "") => lines.push(line);
out(`WE-2 results, harness v0.4.0 (@digitalbazaar/cborld ${INSTALLED_DECODER.version}, Node ${process.version})`);
out(`Experimental formats, not standards: envelope "${ENVELOPE_TAG}", manifest "${MANIFEST_VERSION}".`);
out(`Verifier policy (DST-9): profiles B and I-RDFC accepted; A and I-JCS rejected.`);
out();
out("Label sizes (bytes):");
out(`  plain CBOR-LD, WE-2 credential with inner ecdsa-rdfc-2019 proof: ${sizes.cborldSigned}`);
out(`  plain CBOR-LD, same credential without inner proof (profile B payload): ${sizes.cborldUnsigned}`);
out(`  v0.3 envelope (unsigned, 128-bit digest), for comparison: ${sizes.v03EnvelopeWith128BitDigest} (+${sizes.v03EnvelopeWith128BitDigest - sizes.cborldSigned})`);
out(`  v0.4 envelope, profile I-RDFC (256-bit digest, unsigned envelope): ${sizes.envelopeIRdfc} (+${sizes.envelopeIRdfc - sizes.cborldSigned} over ${sizes.cborldSigned})`);
out(`  v0.4 envelope, profile B (256-bit digest, ECDSA P-256 signature, did:key verification method): ${sizes.envelopeB} (+${sizes.envelopeB - sizes.cborldUnsigned} over ${sizes.cborldUnsigned})`);
out(`    of which: digest ${sizes.envelopeBParts.digest}, signature ${sizes.envelopeBParts.signature}, verification method ${sizes.envelopeBParts.verificationMethod}, tag, profile, id and framing ${sizes.envelopeBParts.framing}`);
out();
out(`Decoding manifest digest of the WE-2 label (typed SHA-256, ${DIGEST.decodingManifest}): ${digestHex(labelI.manifestDigest)}`);
out();
for (const part of [1, 2]) {
  out(part === 1 ? "Part 1: the problem, unbound CBOR-LD as deployed today" : "Part 2: M15 v0.4 (envelope v2, complete decoding manifest, pinned decoding)");
  out();
  for (const row of rows.filter((x) => x.part === part)) {
    out(`[${row.id}] ${row.scenario}`);
    out(`     => ${row.outcome}`);
    if (row.detail) out(`     decoded: ${row.detail}`);
    out();
  }
}

const text = lines.join("\n");
console.log(`\n${text}`);
writeFileSync(new URL("./results/we2.txt", import.meta.url), `${text}\n`);
writeFileSync(new URL("./results/we2.json", import.meta.url), JSON.stringify({
  harness: "0.4.0",
  node: process.version,
  decoder: { name: INSTALLED_DECODER.name, version: INSTALLED_DECODER.version },
  formats: { envelope: ENVELOPE_TAG, manifest: MANIFEST_VERSION, status: "experimental, not a standard" },
  policy: { accepted: ["B", "I-RDFC"], rejected: ["A", "I-JCS"] },
  sizes,
  vectors: { issuer: did, manifest: labelI.manifest, manifestDigestHex: digestHex(labelI.manifestDigest) },
  rows
}, null, 2) + "\n");
