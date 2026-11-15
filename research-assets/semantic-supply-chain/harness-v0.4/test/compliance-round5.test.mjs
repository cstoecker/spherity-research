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

import { fixture } from './compliance-round6-fixture.mjs';

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

test('statement Map keys must be nonempty well-formed text identifiers', async()=>{
 const f=await fixture(); const ev=f.withCoverage(f.evB8,'B8');
 assert.equal(evaluate(POLICY_V1,ev,f.ctx()).outcome,'GRANT');
 await assert.doesNotReject(canonicalGraph(ev,ev.coverage));
 const id=f.R.B8.body.id+':absence',absence=ev.statements.get(id);
 for(const key of [{},[],null,undefined,7,'','\ud800']){
  const bad={...ev,statements:new Map(ev.statements)};
  bad.statements.delete(id);bad.statements.set(key,absence);
  const result=evaluate(POLICY_V1,bad,f.ctx());
  assert.equal(result.outcome,'UNKNOWN');
  assert.match(result.reason,/invalid statement map keys/);
  await assert.rejects(canonicalGraph(bad,bad.coverage),/invalid statement map keys/);
 }
});
