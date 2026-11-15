// SPDX-License-Identifier: Apache-2.0
// Follow-up to R6-01: archived evidence outside the extraction/v2 key domain is reported as an
// invalid opening (DEC-14 separate findings) and refused at deposit, rather than throwing.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fixture } from './compliance-round6-fixture.mjs';
import * as C from '../src/compliance.mjs';
test('a tampered archive with an invalid statement key gives an invalid opening, not an exception', async () => {
  const f = await fixture(), ev = f.withCoverage(f.evB8, 'B8');
  const absence = ev.statements.get(f.R.B8.body.id + ':absence');
  const policies = new Map([[C.POLICY_V1.digest, C.POLICY_V1]]);
  const custodian = new C.Custodian(f.p.custodian, { ctx: f.ctx(), policies });
  const scope = { subject: 'urn:consignment:C2', action: C.DECISION_CLASS, purpose: 'release', audience: 'customs', validFrom: 99, validUntil: 110 };
  const r = await C.certify({ certifier: f.p.certifier, tsa: f.p.tsa, custodian, policy: C.POLICY_V1, ev, coverage: ev.coverage, ctx: f.ctx(), scope, certificateId: 'urn:cert:r6', authorization: 'synthetic-profile' });
  assert.equal(r.ok, true);
  const opts = { custodian, certifiers: new Map([[f.p.certifier.id, { party: f.p.certifier }]]), ctx: f.ctx(), policies };
  assert.equal((await C.disputeReport(r.certificate, opts)).opening, 'valid');
  custodian.tamper('urn:cert:r6', (a) => a.evidence.statements.set({}, absence));
  const report = await C.disputeReport(r.certificate, opts);
  assert.equal(report.opening, 'invalid');
  assert.match(report.detail, /invalid statement map keys/);
  assert.equal(report.attribution, 'not determined by this report');
});
