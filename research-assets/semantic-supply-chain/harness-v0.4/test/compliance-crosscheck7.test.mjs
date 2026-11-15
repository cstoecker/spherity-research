// SPDX-License-Identifier: Apache-2.0
// Round-7 cross-check (X7-F01): the committed sourceEntry tuple cannot be emitted by a body field.
// Before the repair, statements sharing another entry's subject (body.id) and carrying the fields
// sourceEntry, signer, signature and statement reproduced every triple of that entry, so evidence
// with and without the entry had one canonical graph, and one commitment opened to two outcomes.
import assert from 'node:assert/strict';
import test from 'node:test';
import canonicalize from 'canonicalize';
import { fixture } from './compliance-round6-fixture.mjs';
import * as C from '../src/compliance.mjs';
import { signObject } from '../src/signed.mjs';

const policies = new Map([[C.POLICY_V1.digest, C.POLICY_V1]]);
const scope = { subject: 'urn:consignment:C2', action: C.DECISION_CLASS, purpose: 'release', audience: 'customs', validFrom: 99, validUntil: 110 };
async function setup() {
  const f = await fixture();
  const custodian = new C.Custodian(f.p.custodian, { ctx: f.ctx(), policies });
  const opts = { custodian, certifiers: new Map([[f.p.certifier.id, { party: f.p.certifier }]]), ctx: f.ctx(), policies };
  const certify = (ev, certificateId) => C.certify({ certifier: f.p.certifier, tsa: f.p.tsa, custodian, policy: C.POLICY_V1, ev, coverage: ev.coverage, ctx: f.ctx(), scope, certificateId, authorization: 'synthetic-profile' });
  return { f, custodian, opts, certify };
}
const unsigned = (body) => ({ body, signer: 'none', signature: 'none' });
// Two unsigned notes that together carry every triple of the entry [role, key, st] under its subject.
// The fields named in `split` go to the second note, so that neither note matches a selection rule.
function mimic(role, key, st, subjectId, split = []) {
  const first = { ...Object.fromEntries(Object.entries(st.body).filter(([, v]) => typeof v !== 'object')), id: subjectId,
    sourceEntry: canonicalize([role, key, st]), signer: st.signer, signature: st.signature, statement: canonicalize(st.body) };
  const second = { id: subjectId };
  for (const field of split) { second[field] = first[field]; delete first[field]; }
  if (typeof st.body.statement === 'string') second.statement = st.body.statement;
  return [unsigned(first), unsigned(second)];
}

test('X7-F01: a body field named sourceEntry is outside the extraction domain', async () => {
  const { f, certify } = await setup(), ev = f.withCoverage(f.evB8, 'B8');
  assert.equal(C.evaluate(C.POLICY_V1, ev, f.ctx()).outcome, 'GRANT');
  const bad = { ...ev, statements: new Map(ev.statements) };
  bad.statements.set('urn:note', unsigned({ type: 'Note', sourceEntry: 'text' }));
  const result = C.evaluate(C.POLICY_V1, bad, f.ctx());
  assert.equal(result.outcome, 'UNKNOWN');
  assert.match(result.reason, /invalid statement map keys or entries/);
  await assert.rejects(C.canonicalGraph(bad, bad.coverage), /invalid statement map keys or entries/);
  assert.equal((await certify(bad, 'urn:cert:x7-reserved')).ok, false);
  // the same rule for the declaration and the coverage statements, which are not Map entries
  const status = signObject(f.p.status, { ...ev.coverage.status.body, sourceEntry: 'text' });
  const coverage = { ...ev.coverage, status };
  const viaCoverage = C.evaluate(C.POLICY_V1, { ...ev, coverage }, f.ctx());
  assert.equal(viaCoverage.outcome, 'UNKNOWN');
  assert.match(viaCoverage.reason, /invalid declaration or coverage statement/);
  await assert.rejects(C.canonicalGraph(ev, coverage), /invalid declaration or coverage statement/);
  const declaration = signObject(f.p.importer, { ...ev.declaration.body, sourceEntry: 'text' });
  assert.equal(C.evaluate(C.POLICY_V1, { ...ev, declaration }, f.ctx()).outcome, 'UNKNOWN');
  await assert.rejects(C.canonicalGraph({ ...ev, declaration }, ev.coverage), /invalid declaration or coverage statement/);
});

test('X7-F01: notes cannot stand in for the absence attestation under one commitment', async () => {
  const { f, custodian, opts, certify } = await setup(), ev = f.withCoverage(f.evB8, 'B8');
  const key = f.R.B8.body.id + ':absence', attestation = ev.statements.get(key);
  const [n1, n2] = mimic('statement', key, attestation, attestation.body.id, ['report']);
  ev.statements.set('urn:note:1', n1).set('urn:note:2', n2);
  const without = { ...ev, statements: new Map(ev.statements) };
  without.statements.delete(key);
  // Before the repair: GRANT with the attestation, UNKNOWN without it, and one canonical graph for both.
  const outcomes = [C.evaluate(C.POLICY_V1, ev, f.ctx()).outcome, C.evaluate(C.POLICY_V1, without, f.ctx()).outcome];
  const graphs = await Promise.allSettled([C.canonicalGraph(ev, ev.coverage), C.canonicalGraph(without, without.coverage)]);
  const sameGraph = graphs.every((g) => g.status === 'fulfilled') && graphs[0].value === graphs[1].value;
  assert.ok(!(sameGraph && outcomes[0] !== outcomes[1]), `one canonical graph, outcomes ${outcomes.join(' and ')}`);
  assert.deepEqual(outcomes, ['UNKNOWN', 'UNKNOWN']);
  assert.equal((await certify(ev, 'urn:cert:x7-notes')).ok, false);
  // An archive altered in this way no longer opens the commitment of a certificate over the clean evidence.
  const clean = f.withCoverage(f.evB8, 'B8');
  const r = await certify(clean, 'urn:cert:x7-clean');
  assert.equal(r.ok, true);
  custodian.tamper('urn:cert:x7-clean', (a) => { a.evidence.statements.set('urn:note:1', n1).set('urn:note:2', n2); a.evidence.statements.delete(key); });
  const report = await C.disputeReport(r.certificate, opts);
  assert.equal(report.opening, 'invalid');
  assert.equal(report.replayedOutcome, undefined);
});

test('X7-F01: two signed declarations cannot share one commitment (GRANT and DENY)', async () => {
  const { f, certify } = await setup();
  const second = f.report('urn:report:lab1:2026-0601', 'B8', 96, { Hg: 0.1, Cd: 1, Pb: 10 });
  f.labReports.B8.push(second); // the complete list now names two reports; the first is revoked below
  const absence = signObject(f.p.lab, { type: 'AbsenceAttestation', id: `${second.body.id}:absence`, report: second.body.id, product: f.PRODUCT, batch: 'B8', substances: ['Hg', 'Cd', 'Pb'], method: 'M-XRF-3', statement: 'no result above the limit, for the tested sample and substances' });
  const base = f.withCoverage(f.evB8, 'B8', { statusOverrides: { [f.R.B8.body.id]: 'revoked' } });
  base.statements.set(absence.body.id, absence);
  const declaresRevoked = base.declaration;
  const declaresCurrent = signObject(f.p.importer, { ...declaresRevoked.body, testReport: second.body.id });
  // Without the notes the two declarations give DENY and GRANT under different canonical graphs.
  const plain = [{ ...base, declaration: declaresRevoked }, { ...base, declaration: declaresCurrent }];
  assert.deepEqual(plain.map((ev) => C.evaluate(C.POLICY_V1, ev, f.ctx()).outcome), ['DENY', 'GRANT']);
  assert.notEqual(await C.canonicalGraph(plain[0], base.coverage), await C.canonicalGraph(plain[1], base.coverage));
  // With notes that carry both declarations' triples, the graphs were identical before the repair.
  const statements = new Map(base.statements);
  let i = 0;
  for (const d of [declaresRevoked, declaresCurrent]) for (const note of mimic('declaration', 'declaration', d, 'declaration')) statements.set(`urn:note:${++i}`, note);
  const padded = plain.map((ev) => ({ ...ev, statements }));
  const outcomes = padded.map((ev) => C.evaluate(C.POLICY_V1, ev, f.ctx()).outcome);
  const graphs = await Promise.allSettled(padded.map((ev) => C.canonicalGraph(ev, ev.coverage)));
  const sameGraph = graphs.every((g) => g.status === 'fulfilled') && graphs[0].value === graphs[1].value;
  assert.ok(!(sameGraph && outcomes[0] !== outcomes[1]), `one canonical graph, outcomes ${outcomes.join(' and ')}`);
  assert.deepEqual(outcomes, ['UNKNOWN', 'UNKNOWN']);
  for (const [n, ev] of padded.entries()) assert.equal((await certify(ev, `urn:cert:x7-decl-${n}`)).ok, false);
});

// X7-F02: malformed statements and unreadable deposits give structured results, not exceptions.
test('X7-F02: a statement that names a signer without a text signature or a body is unauthenticated', async () => {
  const { f, certify } = await setup(), ev = f.withCoverage(f.evB8, 'B8');
  const cases = [
    ['signed null body', { ...ev, declaration: signObject(f.p.importer, null) }],
    ['no signature', { ...ev, declaration: { body: ev.declaration.body, signer: f.p.importer.id } }],
    ['no body', { ...ev, declaration: { signer: f.p.importer.id, signature: 'AAAA' } }],
    ['numeric signature', { ...ev, declaration: { body: ev.declaration.body, signer: f.p.importer.id, signature: 7 } }]
  ];
  const report = new Map(ev.statements);
  report.set(f.R.B8.body.id, { body: f.R.B8.body, signer: f.p.lab.id });
  cases.push(['listed report without signature', { ...ev, statements: report }]);
  for (const [label, bad] of cases) {
    assert.equal(C.evaluate(C.POLICY_V1, bad, f.ctx()).outcome, 'UNKNOWN', label);
    assert.equal((await certify(bad, `urn:cert:x7-${label}`)).ok, false, label);
  }
});

test('X7-F02: a deposit that cannot be opened is refused and leaves the store unchanged', async () => {
  const { f, custodian, certify } = await setup(), ev = f.withCoverage(f.evB8, 'B8');
  const r = await certify(ev, 'urn:cert:x7-open');
  assert.equal(r.ok, true);
  const core = r.certificate.signed.body, held = custodian.store.get(core.certificateId);
  for (const sealed of [{ ...held, ciphertext: `AAAA${held.ciphertext.slice(4)}` }, {}]) {
    const refused = await custodian.deposit(core.certificateId, sealed, { core });
    assert.equal(refused.ok, false);
    assert.match(refused.reason, /deposit archive cannot be opened/);
  }
  assert.equal((await custodian.deposit(core.certificateId, held, { core: { ...core, policy: undefined } })).ok, false);
  assert.equal(custodian.store.get(core.certificateId), held);
  assert.equal(custodian.store.size, 1);
});

test('X7-F02: evidence the archive encoding cannot carry is refused at certification, without throwing', async () => {
  const { f, certify } = await setup();
  for (const value of [true, 1, 'x', [1], { a: 1 }]) {
    const ev = f.withCoverage(f.evB8, 'B8');
    ev.statements.set('urn:note', unsigned({ type: 'Note', __map: value }));
    assert.equal(C.evaluate(C.POLICY_V1, ev, f.ctx()).outcome, 'GRANT');
    const r = await certify(ev, `urn:cert:x7-map-${JSON.stringify(value)}`);
    assert.equal(r.ok, false);
    assert.match(r.reason, /deposit archive cannot be opened/);
  }
});
