// SPDX-License-Identifier: Apache-2.0
// Round 7: a statement Map entry must hold a statement object (R7-01); disputes, deposits and
// certification return structured results for archives or evidence outside the extraction
// domain (R7-04); the refused deposit of R6-N1 is exercised directly (R7-05).
import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture } from './compliance-round6-fixture.mjs';
import * as C from '../src/compliance.mjs';

const policies = new Map([[C.POLICY_V1.digest, C.POLICY_V1]]);
const scope = (subject) => ({ subject, action: C.DECISION_CLASS, purpose: 'release', audience: 'customs', validFrom: 99, validUntil: 110 });
async function setup() {
  const f = await fixture();
  const custodian = new C.Custodian(f.p.custodian, { ctx: f.ctx(), policies });
  const opts = { custodian, certifiers: new Map([[f.p.certifier.id, { party: f.p.certifier }]]), ctx: f.ctx(), policies };
  const certify = (ev, certificateId, subject) => C.certify({ certifier: f.p.certifier, tsa: f.p.tsa, custodian, policy: C.POLICY_V1, ev, coverage: ev.coverage, ctx: f.ctx(), scope: scope(subject), certificateId, authorization: 'synthetic-profile' });
  return { f, custodian, opts, certify };
}

test('R7-01: a Map entry without a statement object is outside the extraction domain', async () => {
  const { f } = await setup(), ev = f.withCoverage(f.evB8, 'B8');
  assert.equal(C.evaluate(C.POLICY_V1, ev, f.ctx()).outcome, 'GRANT');
  for (const value of [null, undefined, 0, false, '', 'text', {}, { body: null }, { body: 'text' }]) {
    const bad = { ...ev, statements: new Map(ev.statements) };
    bad.statements.set('urn:placeholder', value);
    const result = C.evaluate(C.POLICY_V1, bad, f.ctx());
    assert.equal(result.outcome, 'UNKNOWN', JSON.stringify(value));
    assert.match(result.reason, /invalid statement map keys or entries/);
    await assert.rejects(C.canonicalGraph(bad, bad.coverage), /invalid statement map keys or entries/);
  }
});

test('R7-01: a placeholder for a listed report cannot satisfy coverage or share a commitment', async () => {
  const { f, certify } = await setup();
  const extra = f.report('urn:report:lab1:2026-0599', 'B7', 96, { Hg: 0.1, Cd: 1, Pb: 10 });
  f.labReports.B7.push(extra); // the laboratory's complete list now names three reports
  const covered = f.withCoverage(f.evB7, 'B7');
  const missing = { ...covered, statements: new Map(covered.statements) };
  missing.statements.delete(extra.body.id);
  const placeholder = { ...covered, statements: new Map(missing.statements) };
  placeholder.statements.set(extra.body.id, null);
  assert.match(C.evaluate(C.POLICY_V1, missing, f.ctx()).reason, /coverage incomplete/);
  const result = C.evaluate(C.POLICY_V1, placeholder, f.ctx());
  assert.equal(result.outcome, 'UNKNOWN', 'a placeholder entry counted as an obtained report');
  await assert.rejects(C.canonicalGraph(placeholder, placeholder.coverage), /invalid statement map keys or entries/);
  const certified = await certify(placeholder, 'urn:cert:r7-placeholder', 'urn:consignment:C1');
  assert.equal(certified.ok, false);
});

test('R7-01: a tampered archive with a placeholder entry gives an invalid opening, not an exception', async () => {
  const { f, custodian, opts, certify } = await setup(), ev = f.withCoverage(f.evB8, 'B8');
  const r = await certify(ev, 'urn:cert:r7-null', 'urn:consignment:C2');
  assert.equal(r.ok, true);
  custodian.tamper('urn:cert:r7-null', (a) => a.evidence.statements.set('urn:placeholder', null));
  const report = await C.disputeReport(r.certificate, opts);
  assert.equal(report.opening, 'invalid');
  assert.equal(report.replayedOutcome, undefined);
  assert.equal(report.attribution, 'not determined by this report');
});

test('R7-04: an archive without a salt gives an invalid opening and a refused deposit', async () => {
  const { f, custodian, opts, certify } = await setup(), ev = f.withCoverage(f.evB8, 'B8');
  const r = await certify(ev, 'urn:cert:r7-salt', 'urn:consignment:C2');
  assert.equal(r.ok, true);
  const archive = custodian.restore('urn:cert:r7-salt').archive;
  delete archive.salt;
  const deposit = await custodian.deposit('urn:cert:r7-salt', custodian.seal(archive), { core: r.certificate.signed.body });
  assert.equal(deposit.ok, false);
  assert.match(deposit.reason, /no salt/);
  custodian.tamper('urn:cert:r7-salt', (a) => { delete a.salt; });
  const report = await C.disputeReport(r.certificate, opts);
  assert.equal(report.opening, 'invalid');
  assert.match(report.detail, /no salt/);
});

test('R7-04: certification refuses evidence the extraction cannot represent, without throwing', async () => {
  const { f, certify } = await setup(), ev = f.withCoverage(f.evB8, 'B8');
  ev.statements.set('urn:note', { body: { type: 'Note', 'not an iri': 1 }, signer: 'none', signature: 'none' });
  const r = await certify(ev, 'urn:cert:r7-iri', 'urn:consignment:C2');
  assert.equal(r.ok, false);
  assert.match(r.reason, /outside the extraction domain/);
});

test('R7-05: a deposit outside the extraction domain is refused and leaves the store unchanged', async () => {
  const { f, custodian, certify } = await setup(), ev = f.withCoverage(f.evB8, 'B8');
  const r = await certify(ev, 'urn:cert:r7-deposit', 'urn:consignment:C2');
  assert.equal(r.ok, true);
  const held = custodian.store.get('urn:cert:r7-deposit');
  const archive = custodian.restore('urn:cert:r7-deposit').archive;
  archive.evidence.statements.set({}, archive.evidence.statements.get(f.R.B8.body.id + ':absence'));
  const deposit = await custodian.deposit('urn:cert:r7-deposit', custodian.seal(archive), { core: r.certificate.signed.body });
  assert.equal(deposit.ok, false);
  assert.match(deposit.reason, /outside the extraction domain: invalid statement map keys/);
  assert.equal(custodian.store.get('urn:cert:r7-deposit'), held);
  assert.equal(custodian.store.size, 1);
});
