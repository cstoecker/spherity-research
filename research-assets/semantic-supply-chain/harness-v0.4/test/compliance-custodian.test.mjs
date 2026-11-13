// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import test from 'node:test';
import canonicalize from 'canonicalize';
// SPDX-License-Identifier: Apache-2.0
// WE-7: compliance evidence, scenario by scenario (H15). Regime A (full disclosure of the
// sufficient key-claim set) and regime B (commit-and-certify), the twelve negative tests, and the
// selective-disclosure counterexample. Each scenario states the outcome the theory predicts.
// SYNTHETIC: parties, identifiers, methods and limits are illustrative.

import { acceptCertificate, certify, Custodian, DECISION_CLASS, dictionaryTest, disputeReport, evaluate, KEY_CLAIMS, POLICY_V1, POLICY_V2, SelectionLog } from "../src/compliance.mjs";
import { digest, DIGEST, typedId } from "../src/crypto.mjs";
import { newParty, signObject, verifyObject } from "../src/signed.mjs";

async function fixture() {
  const p = Object.fromEntries(["importer", "manufacturer", "lab", "forger", "status", "accreditationBody", "authority", "certifier", "tsa", "custodian", "logOperator"].map((n) => [n, newParty(n)]));
  const T = 100; // certification and decision time (days)
  const PRODUCT = "urn:gtin:04012345000017";
  const record = (batch) => signObject(p.manufacturer, { type: "ProductRecord", id: `urn:product-record:PB-100:${batch}`, product: PRODUCT, batch, chemistry: "Li-ion", manufacturer: "did:example:manufacturer-7" });
  const report = (id, batch, date, results, method = "M-XRF-3", by = p.lab) => signObject(by, { type: "TestReport", id, product: PRODUCT, batch, date, method, sample: "5 units", results });
  const absence = (reportId, batch) => signObject(p.lab, { type: "AbsenceAttestation", id: `${reportId}:absence`, report: reportId, product: PRODUCT, batch, substances: ["Hg", "Cd", "Pb"], method: "M-XRF-3", statement: "no result above the limit, for the tested sample and substances" });
  // Laboratory source: every report it issued, per batch (the authoritative population).
  const labReports = {
    B7: [report("urn:report:lab1:2026-0412", "B7", 80, { Hg: 0.5, Cd: 3, Pb: 35 }), report("urn:report:lab1:2026-0533", "B7", 95, { Hg: 0.4, Cd: 2, Pb: 160 })], // later failed retest
    B8: [report("urn:report:lab1:2026-0501", "B8", 90, { Hg: 0.2, Cd: 1, Pb: 60 })],
    B9: [report("urn:report:lab1:2026-0520", "B9", 92, { Hg: 0.1, Cd: 1, Pb: 10 }, "M-ICP-9")] // method outside the accreditation
  };
  const lab = {
    completeList: (batch, issuedAt = T) => signObject(p.lab, { type: "CompleteListResponse", product: PRODUCT, batch, reports: labReports[batch].map((r) => r.body.id), complete: true, issuedAt }),
    fetch: (ids) => Object.values(labReports).flat().filter((r) => ids.includes(r.body.id))
  };
  const statusOf = (overrides = {}, issuedAt = T) => signObject(p.status, { type: "StatusSnapshot", issuedAt, entries: { ...Object.fromEntries(Object.values(labReports).flat().map((r) => [r.body.id, "current"])), ...overrides } });
  const accreditation = signObject(p.accreditationBody, { type: "AccreditationList", labs: { [p.lab.id]: { methods: ["M-XRF-3"], validFrom: 0, validUntil: 365 } } });
  const profile = signObject(p.authority, { type: "CoverageProfile", id: "urn:profile:battery-release/1", decision: DECISION_CLASS, keyClaims: KEY_CLAIMS, sources: { testReports: p.lab.id, status: p.status.id }, maxCoverageAge: 2, absence: ["AbsenceAttestation"] });
  if (!verifyObject(profile, p.authority) || !verifyObject(accreditation, p.accreditationBody)) throw new Error("setup: profile or accreditation not authentic");
  const declaration = (consignmentId, batch, testReport) => signObject(p.importer, { consignmentId, hsCode: "8507.60", declaredValue: "EUR 140", product: `urn:product-record:PB-100:${batch}`, batch, manufacturer: "did:example:manufacturer-7", chemistry: "Li-ion", testReport, conformityDeclaration: `urn:doc:PB-100:${batch}` });
  const ctx = (extra = {}) => ({ parties: { importer: p.importer, manufacturer: p.manufacturer, lab: p.lab, status: p.status }, accreditation, profile: profile.body, time: T, ...extra });
  // What the holder supplies, and what the verifier obtains itself from the profile's sources (regime A).
  const holderEvidence = (consignmentId, batch, testReport, supplied) => ({
    declaration: declaration(consignmentId, batch, testReport),
    statements: new Map([[`urn:product-record:PB-100:${batch}`, record(batch)], ...supplied.map((s) => [s.body.id, s])])
  });
  const withCoverage = (ev, batch, { listAt = T, statusOverrides = {} } = {}) => {
    const completeList = lab.completeList(batch, listAt);
    const statements = new Map(ev.statements);
    for (const r of lab.fetch(completeList.body.reports)) if (!statements.has(r.body.id)) statements.set(r.body.id, r); // obtained from the source, not the holder
    return { ...ev, statements, coverage: { completeList, status: statusOf(statusOverrides) } };
  };
  const R = { B7a: labReports.B7[0], B7b: labReports.B7[1], B8: labReports.B8[0], B9: labReports.B9[0] };
  const evB8 = holderEvidence("urn:consignment:C2", "B8", R.B8.body.id, [R.B8, absence(R.B8.body.id, "B8")]);
  const evB7 = holderEvidence("urn:consignment:C1", "B7", R.B7a.body.id, [R.B7a, absence(R.B7a.body.id, "B7")]); // holder omits the failed retest

  const policies = new Map([[POLICY_V1.digest, POLICY_V1]]);
  const custodian = new Custodian(p.custodian, {ctx:ctx(),policies});
  const covered=withCoverage(evB8,'B8');
  const scope={subject:'urn:subject',action:DECISION_CLASS,purpose:'import-control',audience:'customs',validFrom:100,validUntil:130};
  const result=await certify({certifier:p.certifier,tsa:p.tsa,custodian,policy:POLICY_V1,ev:covered,coverage:covered.coverage,ctx:ctx(),scope,certificateId:'urn:cert:test',authorization:'urn:auth'});
  assert.equal(result.ok,true,result.reason);
  return {p,custodian,certificate:result.certificate,ctx:ctx(),policies,scope};
}

test('custodian uses its own policy and evaluator, not a deposit callback', async()=>{
 const f=await fixture();const core=f.certificate.signed.body;
 const archive=f.custodian.restore(core.certificateId).archive;
 archive.policy.limits.Pb=0;
 const sealed=f.custodian.seal(archive);
 const result=await f.custodian.deposit(core.certificateId,sealed,{core,expectedCommitment:core.commitment,replay:()=> 'GRANT'});
 assert.equal(result.ok,false,'modified archive policy was acknowledged through caller replay');
});
test('relying party rejects custodian outcome or core mismatch',async()=>{
 const f=await fixture();const core=f.certificate.signed.body;
 const check=(cert)=>acceptCertificate(cert,{request:{...f.scope,time:101},certifiers:new Map([[f.p.certifier.id,{party:f.p.certifier,decisionClasses:[DECISION_CLASS]}]]),tsa:f.p.tsa,custodian:f.custodian,statusService:{entries:new Map([[core.statusEntry,'current']])},currentPolicy:POLICY_V1,epoch:1});
 assert.equal(check(f.certificate).authorises,true);
 for(const changes of [{replayedOutcome:'DENY'},{coreDigest:'wrong-core'}]){
  const cert=structuredClone(f.certificate);
  cert.custodianAck=signObject(f.p.custodian,{...cert.custodianAck.body,...changes});
  assert.equal(check(cert).accepted,false);
 }
});

test('dispute distinguishes a changed private time from a computation mismatch', async()=>{
 const f=await fixture();
 f.custodian.tamper(f.certificate.signed.body.certificateId,a=>{a.time=999;});
 const report=await disputeReport(f.certificate,{custodian:f.custodian,certifiers:new Map([[f.p.certifier.id,{party:f.p.certifier}]]),ctx:f.ctx,policies:f.policies});
 assert.equal(report.opening,'valid');
 assert.equal(report.contextReconstructible,false);
 assert.equal(report.outcomeEqual,undefined);
});
test('relying party refuses a missing or nonnumeric decision clock',async()=>{
 const f=await fixture();const core=f.certificate.signed.body;
 for(const time of [undefined,'garbage',NaN]){
  const result=acceptCertificate(f.certificate,{request:{...f.scope,time},certifiers:new Map([[f.p.certifier.id,{party:f.p.certifier,decisionClasses:[DECISION_CLASS]}]]),tsa:f.p.tsa,custodian:f.custodian,statusService:{entries:new Map([[core.statusEntry,'current']])},currentPolicy:POLICY_V1,epoch:1});
  assert.equal(result.accepted,false);
 }
});
