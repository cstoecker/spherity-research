// SPDX-License-Identifier: Apache-2.0
// M31: compliance evidence: a sufficient key-claim set fixed per decision, an independent coverage
// contract, and one evaluation under full disclosure (regime A) or commit-and-certify (regime B)
// (H15; theorem T19; requirements DEC-8 to DEC-15, PRV-6, KEY-6).
//
// SYNTHETIC worked example: a low-value consignment of portable lithium-ion battery packs presented
// to a customs risk engine. Parties, identifiers, methods and substance limits are illustrative;
// the key-claim set is inspired by, but is not, the legal H7 data set. Evidence items are signed
// JSON statements (ECDSA P-256 over JCS); the evidence graph G is derived from them by a fixed
// extraction procedure and canonicalised with RDFC-1.0 (blank-node-free by construction).
//
// What the example shows, and what it does not:
//   - coverage, not the disclosure format, decides whether omitted adverse evidence is caught;
//   - commit-and-certify gives one evaluation, scope-checked reliance, lifecycle, a verified
//     archive and a dispute report that separates its findings;
//   - it does not show that real data sets suffice, real laboratories, legal admissibility, or scale.

import canonicalize from "canonicalize";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createRequire } from "node:module";
import { digest, DIGEST, typedDigest, typedId } from "./crypto.mjs";
import { signObject, verifyObject } from "./signed.mjs";

const require = createRequire(import.meta.url);
const rdfCanonize = require("rdf-canonize");

export const KEY_CLAIMS = ["consignmentId", "hsCode", "declaredValue", "product", "batch", "manufacturer", "chemistry", "testReport", "conformityDeclaration"];
export const SUBSTANCES = ["Hg", "Cd", "Pb"];
export const CLOSURE = typedId(DIGEST.semanticClosure, "compliance-vocabulary/v1 + extraction/v2 + rules/battery-release");
export const DECISION_CLASS = "customs-release-risk-assessment";
export const policyVersion = (version, limits) => {
  const body = { id: "urn:policy:battery-release", version, limits, closure: CLOSURE, freshness: 30, decisionClass: DECISION_CLASS };
  return { ...body, digest: typedId(DIGEST.policy, canonicalize(body)) };
};
// Illustrative limits in mg/kg; not regulatory values.
export const POLICY_V1 = policyVersion("1", { Hg: 5, Cd: 20, Pb: 100 });
export const POLICY_V2 = policyVersion("2", { Hg: 5, Cd: 20, Pb: 40 }); // a policy-only correction, closure unchanged

// ---- evaluation (deterministic) ----------------------------------------------------------------
/**
 * π_C: GRANT, DENY or UNKNOWN for one consignment.
 * @param ev.declaration  signed key-claim declaration by the importer (holder)
 * @param ev.statements   Map id -> signed statement (product records, test reports, attestations)
 * @param ev.coverage     { completeList, status } signed responses from the profile's sources, or null
 * @param ctx.parties     authoritative keys: manufacturer, lab, status, importer, accreditation
 * @param ctx.mode        "contract": the coverage contract applies; "holder-only": only what the holder supplied
 */
export function evaluate(policy, ev, ctx) {
  const why = [];
  const out = (outcome, reason) => ({ outcome, reason, considered: why });
  const { parties, accreditation, profile, time, mode = "contract" } = ctx;
  const finite = (v) => typeof v === "number" && Number.isFinite(v);
  if (!finite(time) || !finite(profile.maxCoverageAge) || profile.maxCoverageAge < 0) return out("UNKNOWN", "invalid evaluation time or coverage age");
  const fresh = (issued) => finite(issued) && issued <= time && time - issued <= profile.maxCoverageAge;
  if (!verifyObject(ev.declaration, parties.importer)) return out("UNKNOWN", "key-claim declaration not authenticated");
  const k = ev.declaration.body;
  const missing = KEY_CLAIMS.filter((c) => k[c] === undefined);
  if (missing.length) return out("UNKNOWN", `key claims missing: ${missing.join(", ")}`);
  if (Object.keys(k).some((c) => !KEY_CLAIMS.includes(c))) return out("UNKNOWN", "declaration outside the closed key-claim profile");
  if (!String(k.hsCode).startsWith("8507")) return out("UNKNOWN", "HS code outside this profile");
  const product = ev.statements.get(k.product);
  if (!product || !verifyObject(product, parties.manufacturer)) return out("UNKNOWN", "product record not authenticated by the manufacturer");
  if (product.body.type !== "ProductRecord" || product.body.id !== k.product || product.body.batch !== k.batch || product.body.manufacturer !== k.manufacturer) return out("UNKNOWN", "product record does not match the declaration");
  // Which reports are relevant: under the contract, the laboratory's complete list for the batch.
  let reportIds;
  if (mode === "contract") {
    const list = ev.coverage?.completeList;
    if (!list || !verifyObject(list, parties.lab)) return out("UNKNOWN", "no authenticated complete-list response from the laboratory");
    if (list.body.product !== product.body.product || list.body.batch !== k.batch || list.body.complete !== true) return out("UNKNOWN", "complete-list response does not cover this product and batch");
    if (!fresh(list.body.issuedAt)) return out("UNKNOWN", "coverage stale or invalid time");
    if (!Array.isArray(list.body.reports) || !list.body.reports.every((id) => typeof id === "string") || new Set(list.body.reports).size !== list.body.reports.length) return out("UNKNOWN", "invalid complete-list report identifiers");
    reportIds = list.body.reports;
    const unseen = reportIds.filter((id) => !ev.statements.has(id));
    if (unseen.length) return out("UNKNOWN", `coverage incomplete: reports not obtained (${unseen.join(", ")})`);
  } else reportIds = [...ev.statements.keys()].filter((id) => ev.statements.get(id).body.type === "TestReport").sort();
  if (!reportIds.includes(k.testReport)) return out("UNKNOWN", "the declared test report is not among the relevant reports");
  const status = ev.coverage?.status;
  if (!status || !verifyObject(status, parties.status)) return out("UNKNOWN", "no authenticated status snapshot");
  if (!fresh(status.body.issuedAt)) return out("UNKNOWN", "status snapshot stale or invalid time");
  for (const id of reportIds) {
    const report = ev.statements.get(id);
    if (!verifyObject(report, parties.lab)) return out("UNKNOWN", `test report ${id} not authenticated by the laboratory`);
    if (report.body.type !== "TestReport" || report.body.id !== id || report.body.product !== product.body.product || report.body.batch !== k.batch) return out("UNKNOWN", `test report ${id} does not match the covered identity, product and batch`);
    const state = status.body.entries?.[id] ?? "unknown";
    why.push(`${id}: ${state}`);
    if (state === "revoked") { if (id === k.testReport) return out("DENY", `declared test report ${id} is revoked`); continue; }
    if (state !== "current") return out("UNKNOWN", `status of ${id} unknown`);
    if (!finite(report.body.date) || report.body.date > time) return out("UNKNOWN", "invalid or future test report date");
    const acc = accreditation.body.labs[report.signer];
    if (!acc || !acc.methods.includes(report.body.method) || !finite(acc.validFrom) || !finite(acc.validUntil) || report.body.date < acc.validFrom || report.body.date > acc.validUntil) {
      return out("UNKNOWN", `method ${report.body.method} outside the laboratory's accreditation`);
    }
    for (const s of SUBSTANCES) {
      const r = report.body.results?.[s];
      if (!finite(r) || r < 0 || !finite(policy.limits[s]) || policy.limits[s] < 0) return out("UNKNOWN", `${id} has no valid numeric result or limit for ${s}`);
      if (r > policy.limits[s]) return out("DENY", `${id}: ${s} ${r} mg/kg above the limit ${policy.limits[s]}`);
    }
  }
  const attestations = [...ev.statements.values()].filter((x) => x.body.type === "AbsenceAttestation" && x.body.report === k.testReport);
  if (attestations.length !== 1) return out("UNKNOWN", "absence attestation missing or ambiguous for the declared report");
  const [attestation] = attestations;
  if (!attestation || !verifyObject(attestation, parties.lab)) return out("UNKNOWN", "no authenticated absence attestation for the declared report");
  if (attestation.body.product !== product.body.product || attestation.body.batch !== k.batch) return out("UNKNOWN", "absence attestation does not match the product and batch");
  if (!Array.isArray(attestation.body.substances) || !SUBSTANCES.every((s) => attestation.body.substances.includes(s))) return out("UNKNOWN", "absence attestation does not cover every substance in the policy");
  return out("GRANT", "all relevant reports current, accredited and below the limits; absence attested");
}

// ---- evidence graph G: fixed extraction, RDFC-1.0 --------------------------------------------
const V = "https://vocab.example/compliance#";
const lit = (v) => JSON.stringify(String(v));
const iri = (v) => {
  const value = String(v);
  if (/[\u0000-\u0020<>"{}|^`\\]/u.test(value) || !/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) throw new Error("invalid evidence IRI");
  return `<${value}>`;
};
const obj = (v) => (/^(urn|did|https?):/.test(String(v)) ? iri(v) : lit(v));
const subj = (id) => (/^(urn|did|https?):/.test(id) ? id : `urn:statement:${id}`);
export async function canonicalGraph(ev, coverage) {
  const lines = [];
  const add = (s, p, o) => lines.push(`${iri(subj(s))} ${iri(V + p)} ${o} .`);
  const statements = [["declaration", "declaration", ev.declaration], ...[...ev.statements].map(([id, st]) => ["statement", id, st]), ...(coverage ? [["coverage", "completeList", coverage.completeList], ["coverage", "status", coverage.status]] : [])];
  for (const [role, id, st] of statements) {
    if (!st) continue;
    const sid = subj(st.body.id ?? id);
    // Commit the role/key-to-statement association, not only its RDF-set projection.
    add(sid, "sourceEntry", lit(canonicalize([role, id, st])));
    add(sid, "signer", lit(st.signer));
    add(sid, "signature", lit(st.signature));
    add(sid, "statement", lit(canonicalize(st.body)));
    for (const [key, value] of Object.entries(st.body)) if (typeof value !== "object") add(sid, key, obj(value));
  }
  return rdfCanonize.canonize(rdfCanonize.NQuads.parse(lines.join("\n") + "\n"), { algorithm: "RDFC-1.0", format: "application/n-quads", maxWorkFactor: 0 });
}
export const commit = (salt, canonical) => typedDigest(DIGEST.evidenceCommitment, salt, canonical).toString("base64");
export const coverageRef = (coverage) => typedId(DIGEST.coverage, canonicalize(coverage ?? null));

// ---- custodian (DEC-13) -----------------------------------------------------------------------
export class Custodian {
  constructor(party, { ctx, policies } = {}) { this.party = party; this.key = randomBytes(32); this.store = new Map(); this.ctx = ctx; this.policies = policies; }
  /** Verified deposit: decrypt, recompute the commitment, replay, then acknowledge. */
  async deposit(certificateId, sealed, { core }) {
    if (!this.ctx || !this.policies) return { ok: false, reason: "custodian replay trust not provisioned" };
    if (core?.certificateId !== certificateId) return { ok: false, reason: "deposit certificate core mismatch" };
    const expectedCommitment = core.commitment;
    const archive = this.#open(sealed);
    const canonical = await canonicalGraph(archive.evidence, archive.coverage);
    if (commit(Buffer.from(archive.salt, "base64"), canonical) !== expectedCommitment) return { ok: false, reason: "deposit does not open the certified commitment" };
    const policy = this.policies.get(core.policy.digest);
    if (!policy || canonicalize(policy) !== canonicalize(archive.policy)) return { ok: false, reason: "archive policy not independently approved" };
    const cov = coverageRef(archive.coverage);
    const binding = typedId(DIGEST.decisionContext, canonicalize({ commitment: expectedCommitment, closure: CLOSURE, policy: policy.digest, coverage: cov, time: archive.time }));
    if (core.semanticClosure !== CLOSURE || core.coverage !== cov || core.privateContextBinding !== binding) return { ok: false, reason: "archive decision context differs from certificate" };
    const replayed = evaluate(policy, { ...archive.evidence, coverage: archive.coverage }, { ...this.ctx, time: archive.time }).outcome;
    if (replayed === "UNKNOWN" || replayed !== core.outcome) return { ok: false, reason: "independent deposit replay differs or is indeterminate" };
    this.store.set(certificateId, sealed);
    return { ok: true, ack: signObject(this.party, { certificateId, coreDigest: typedId(DIGEST.certificate, canonicalize(core)), archiveDigest: typedId(DIGEST.archive, sealed.ciphertext), verifiedCommitment: expectedCommitment, replayedOutcome: replayed }) };
  }
  seal(archive) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(archive, (k, v) => (v instanceof Map ? { __map: [...v] } : v))), cipher.final()]).toString("base64");
    return { iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), ciphertext };
  }
  #open(sealed) {
    if (!this.key) throw new Error("custodian key lost");
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(sealed.iv, "base64"));
    decipher.setAuthTag(Buffer.from(sealed.tag, "base64"));
    const text = Buffer.concat([decipher.update(Buffer.from(sealed.ciphertext, "base64")), decipher.final()]).toString("utf8");
    return JSON.parse(text, (k, v) => (v && v.__map ? new Map(v.__map) : v));
  }
  restore(certificateId) {
    const sealed = this.store.get(certificateId);
    if (!sealed) return { ok: false, reason: "archive not held" };
    try { return { ok: true, archive: this.#open(sealed) }; } catch (error) { return { ok: false, reason: `archive cannot be opened: ${error.message}` }; }
  }
  loseKey() { this.key = null; }
  tamper(certificateId, mutate) { const s = this.store.get(certificateId); const a = this.#open(s); mutate(a); this.store.set(certificateId, this.seal(a)); }
}

// ---- certifier (DEC-10) -----------------------------------------------------------------------
/**
 * Validate sources and coverage, commit, evaluate once, sign the certificate core; trusted time is
 * an external timestamp over the core's digest; the archive is deposited with the custodian.
 */
export async function certify({ certifier, tsa, custodian, policy, ev, coverage, ctx, scope, certificateId, authorization }) {
  const result = evaluate(policy, { ...ev, coverage }, ctx);
  if (result.outcome === "UNKNOWN") return { ok: false, reason: `indeterminate: ${result.reason}` };
  const salt = randomBytes(32);
  const canonical = await canonicalGraph(ev, coverage);
  const commitment = commit(salt, canonical);
  const cov = coverageRef(coverage);
  const core = {
    type: "EvidenceGraphCertificate", certificateId, certifier: certifier.id, authorization,
    commitment, semanticClosure: CLOSURE, policy: { id: policy.id, version: policy.version, digest: policy.digest },
    outcome: result.outcome, scope, coverage: cov,
    // Private inputs are bound only through the salted commitment h, never through a plain digest of G (PRV-6, R3-12).
    privateContextBinding: typedId(DIGEST.decisionContext, canonicalize({ commitment, closure: CLOSURE, policy: policy.digest, coverage: cov, time: ctx.time })),
    retention: { custodian: custodian.party.id },
    statusEntry: `${certificateId}#status`
  };
  const signed = signObject(certifier, core);
  const timestamp = signObject(tsa, { coreDigest: typedId(DIGEST.certificate, canonicalize(core)), time: ctx.time });
  const sealed = custodian.seal({ evidence: ev, coverage, salt: salt.toString("base64"), policy, time: ctx.time });
  const deposit = await custodian.deposit(certificateId, sealed, { core });
  if (!deposit.ok) return { ok: false, reason: deposit.reason };
  return { ok: true, certificate: { signed, timestamp, custodianAck: deposit.ack }, result };
}

// ---- relying party (DEC-11, DEC-12, DEC-13, DEC-15) -----------------------------------------
export function acceptCertificate(cert, { request, certifiers, tsa, custodian, statusService, currentPolicy, selectionLog, epoch }) {
  const core = cert.signed.body;
  const certifier = certifiers.get(core.certifier);
  if (!certifier || !verifyObject(cert.signed, certifier.party)) return { accepted: false, reason: "certificate signature or certifier unknown" };
  if (!certifier.decisionClasses.includes(request.action)) return { accepted: false, reason: "certifier not authorised for this decision class" };
  if (!verifyObject(cert.timestamp, tsa) || cert.timestamp.body.coreDigest !== typedId(DIGEST.certificate, canonicalize(core))) return { accepted: false, reason: "trusted time missing or not over this certificate core" };
  if (!verifyObject(cert.custodianAck, custodian.party) || cert.custodianAck.body.verifiedCommitment !== core.commitment || cert.custodianAck.body.certificateId !== core.certificateId || cert.custodianAck.body.coreDigest !== typedId(DIGEST.certificate, canonicalize(core)) || cert.custodianAck.body.replayedOutcome !== core.outcome) return { accepted: false, reason: "no verified archive deposit for this certificate" };
  for (const f of ["subject", "action", "purpose", "audience"]) if (core.scope[f] !== request[f]) return { accepted: false, reason: `scope ${f} does not match the request (${core.scope[f]} vs ${request[f]})` };
  if (![request.time, core.scope.validFrom, core.scope.validUntil].every(Number.isFinite) || core.scope.validFrom > core.scope.validUntil || request.time < core.scope.validFrom || request.time > core.scope.validUntil) return { accepted: false, reason: "outside the certificate's validity period" };
  if (core.semanticClosure !== CLOSURE) return { accepted: false, reason: "closure not approved" };
  if (core.policy.version !== currentPolicy.version || core.policy.digest !== currentPolicy.digest) return { accepted: false, reason: `suspended: policy ${core.policy.version} superseded by ${currentPolicy.version}, re-evaluation required` };
  const st = statusService.entries.get(core.statusEntry) ?? "unknown";
  if (st !== "current") return { accepted: false, reason: `certificate status ${st}` };
  if (selectionLog) {
    const selected = selectionLog.selected(core.scope.subject, epoch);
    if (selected !== core.certificateId) return { accepted: false, reason: `not the authoritative certificate for this scope and epoch (selected: ${selected})` };
  }
  if (core.outcome !== "GRANT") return { accepted: true, authorises: false, outcome: core.outcome };
  return { accepted: true, authorises: true, outcome: core.outcome };
}

/** DEC-14: separate findings; no attribution without further evidence. */
export async function disputeReport(cert, { custodian, certifiers, ctx, policies }) {
  const core = cert.signed.body;
  const report = { certificateAuthentic: !!certifiers.get(core.certifier) && verifyObject(cert.signed, certifiers.get(core.certifier).party) };
  const restored = custodian.restore(core.certificateId);
  if (!restored.ok) return { ...report, opening: "unavailable", detail: restored.reason, attribution: "not determined by this report" };
  const canonical = await canonicalGraph(restored.archive.evidence, restored.archive.coverage);
  report.opening = commit(Buffer.from(restored.archive.salt, "base64"), canonical) === core.commitment ? "valid" : "invalid";
  if (report.opening !== "valid") return { ...report, detail: "the archived evidence does not open the certified commitment", attribution: "not determined by this report" };
  const archive = restored.archive;
  const cov = coverageRef(archive.coverage);
  const binding = typedId(DIGEST.decisionContext, canonicalize({ commitment: core.commitment, closure: core.semanticClosure, policy: core.policy.digest, coverage: cov, time: archive.time }));
  if (cov !== core.coverage || binding !== core.privateContextBinding) return { ...report, contextReconstructible: false, detail: "archived decision context does not match the certificate", attribution: "not determined by this report" };
  const policy = policies.get(core.policy.digest);
  report.contextReconstructible = !!policy;
  if (!policy) return { ...report, detail: "policy version not archived" };
  const replayed = evaluate(policy, { ...restored.archive.evidence, coverage: restored.archive.coverage }, { ...ctx, time: restored.archive.time });
  report.outcomeEqual = replayed.outcome === core.outcome;
  report.replayedOutcome = replayed.outcome;
  report.note = "a matching replay shows a consistent computation, not that the evidence was true or complete";
  return report;
}

/** DEC-15: an append-only, signed selection of the authoritative certificate per scope and epoch. */
export class SelectionLog {
  constructor(party) { this.party = party; this.entries = []; }
  select(subject, epoch, certificateId) { this.entries.push(signObject(this.party, { seq: this.entries.length, subject, epoch, certificateId })); }
  selected(subject, epoch) { return [...this.entries].reverse().find((e) => e.body.subject === subject && e.body.epoch === epoch && verifyObject(e, this.party))?.body.certificateId ?? null; }
}

/** PRV-6 / R3-12: what an observer who can enumerate candidate graphs learns from public digests. */
export async function dictionaryTest(candidates, actual, coverage, { time }) {
  const salt = randomBytes(32);
  const canonicalActual = await canonicalGraph(actual, coverage);
  const h = commit(salt, canonicalActual);
  const leaky = typedId(DIGEST.decisionContext, canonicalize({ input: digest("sha256", canonicalActual).toString("hex"), closure: CLOSURE, time }));
  const bound = typedId(DIGEST.decisionContext, canonicalize({ commitment: h, closure: CLOSURE, time }));
  let leakyMatches = 0, boundMatches = 0;
  for (const c of candidates) {
    const canonical = await canonicalGraph(c, coverage);
    if (typedId(DIGEST.decisionContext, canonicalize({ input: digest("sha256", canonical).toString("hex"), closure: CLOSURE, time })) === leaky) leakyMatches++;
    if (typedId(DIGEST.decisionContext, canonicalize({ commitment: commit(Buffer.alloc(32), canonical), closure: CLOSURE, time })) === bound) boundMatches++;
  }
  return { candidates: candidates.length, plainDigestIdentifiesGraph: leakyMatches === 1, saltedBindingMatches: boundMatches };
}
