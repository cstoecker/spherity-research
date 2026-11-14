// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import test from 'node:test';
// WE-7: compliance evidence, scenario by scenario (H15). Regime A (full disclosure of the
// sufficient key-claim set) and regime B (commit-and-certify), the twelve negative tests, and the
// selective-disclosure counterexample. Each scenario states the outcome the theory predicts.
// SYNTHETIC: parties, identifiers, methods and limits are illustrative.

import { canonicalGraph, acceptCertificate, certify, Custodian, DECISION_CLASS, dictionaryTest, disputeReport, evaluate, KEY_CLAIMS, POLICY_V1, POLICY_V2, SelectionLog } from "../src/compliance.mjs";
import { digest } from "../src/crypto.mjs";
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

  return {p,T,PRODUCT,R,evB7,evB8,withCoverage,ctx,labReports,report,statusOf};
}

test('future report date cannot authorize a present-time decision', async()=>{
 const f=await fixture(); const ev=f.withCoverage(f.evB8,'B8');
 const report=f.R.B8;
 ev.statements.set(report.body.id,signObject(f.p.lab,{...report.body,date:f.T+1}));
 const result=evaluate(POLICY_V1,ev,f.ctx());
 assert.equal(result.outcome,'UNKNOWN',JSON.stringify(result));
 assert.match(result.reason,/invalid or future test report date/);
});
test('graph-equivalent evidence order cannot change the outcome', async()=>{
 const f=await fixture(); const ev=f.withCoverage(f.evB8,'B8');
 const id=f.R.B8.body.id+':absence'; const full=ev.statements.get(id);
 const partial=signObject(f.p.lab,{...full.body,id:id+':partial',substances:['Hg']});
 ev.statements.set(partial.body.id,partial);
 const reversed={...ev,statements:new Map([...ev.statements].reverse())};
 assert.equal(await canonicalGraph(ev,ev.coverage),await canonicalGraph(reversed,reversed.coverage));
 const a=evaluate(POLICY_V1,ev,f.ctx()), b=evaluate(POLICY_V1,reversed,f.ctx());
 assert.equal(a.outcome,b.outcome,JSON.stringify({forward:a,reversed:b}));
 assert.equal(a.outcome,'UNKNOWN','ambiguous multiple absence attestations must not authorize');
});
test('holder-only report order is a property of the committed graph, not Map insertion', async()=>{
 const f=await fixture(); const ev=f.withCoverage(f.evB7,'B7');
 ev.statements.set(f.R.B7a.body.id,signObject(f.p.forger,f.R.B7a.body));
 const reversed={...ev,statements:new Map([...ev.statements].reverse())};
 assert.equal(await canonicalGraph(ev,ev.coverage),await canonicalGraph(reversed,reversed.coverage));
 const a=evaluate(POLICY_V1,ev,f.ctx({mode:'holder-only'}));
 const b=evaluate(POLICY_V1,reversed,f.ctx({mode:'holder-only'}));
 assert.equal(a.outcome,b.outcome,JSON.stringify({forward:a,reversed:b}));
});
test('graph commits the statement map key as well as the signed body', async()=>{
 const f=await fixture(); const ev=f.withCoverage(f.evB8,'B8');
 const moved={...ev,statements:new Map(ev.statements)};
 moved.statements.delete(f.R.B8.body.id);
 moved.statements.set('urn:report:moved',f.R.B8);
 assert.equal(evaluate(POLICY_V1,ev,f.ctx()).outcome,'GRANT');
 assert.equal(evaluate(POLICY_V1,moved,f.ctx()).outcome,'UNKNOWN');
 assert.notEqual(await canonicalGraph(ev,ev.coverage),await canonicalGraph(moved,moved.coverage));
});
test('graph commits aliased statement multiplicity and role-key associations', async()=>{
 const f=await fixture(); const ev=f.withCoverage(f.evB8,'B8');
 const duplicate={...ev,statements:new Map(ev.statements)};
 const absence=ev.statements.get(f.R.B8.body.id+':absence');
 duplicate.statements.set('urn:absence:alias',absence);
 assert.notEqual(await canonicalGraph(ev,ev.coverage),await canonicalGraph(duplicate,duplicate.coverage));
 const other=signObject(f.p.lab,{...absence.body,substances:['Hg']});
 const a={...ev,statements:new Map([['urn:a',absence],['urn:b',other]])};
 const b={...ev,statements:new Map([['urn:a',other],['urn:b',absence]])};
 assert.notEqual(await canonicalGraph(a,a.coverage),await canonicalGraph(b,b.coverage));
});
