import assert from 'node:assert/strict';
import test from 'node:test';
// SPDX-License-Identifier: Apache-2.0
// WE-7: compliance evidence, scenario by scenario (H15). Regime A (full disclosure of the
// sufficient key-claim set) and regime B (commit-and-certify), the twelve negative tests, and the
// selective-disclosure counterexample. Each scenario states the outcome the theory predicts.
// SYNTHETIC: parties, identifiers, methods and limits are illustrative.

import { acceptCertificate, certify, Custodian, DECISION_CLASS, dictionaryTest, disputeReport, evaluate, KEY_CLAIMS, POLICY_V1, POLICY_V2, SelectionLog } from "../src/compliance.mjs";
import { digest } from "../src/crypto.mjs";
import { newParty, signObject, verifyObject } from "../src/signed.mjs";

import { fixture } from './compliance-round6-fixture.mjs';

test('coverage membership binds each report id and product/batch to its signed body',async()=>{
 const f=await fixture();const ev=f.withCoverage(f.evB7,'B7');
 ev.statements.set(f.R.B7b.body.id,f.R.B8);
 const result=evaluate(POLICY_V1,ev,f.ctx());
 assert.equal(result.outcome,'UNKNOWN',JSON.stringify(result));
});
test('substance results must be finite nonnegative numbers',async()=>{
 const f=await fixture();
 for(const value of [null,'not measured',-1]) {
  const ev=f.withCoverage(f.evB8,'B8');
  ev.statements.set(f.R.B8.body.id,signObject(f.p.lab,{...f.R.B8.body,results:{...f.R.B8.body.results,Pb:value}}));
  const result=evaluate(POLICY_V1,ev,f.ctx());
  assert.equal(result.outcome,'UNKNOWN',JSON.stringify({value,...result}));
 }
});
test('coverage and status times must be finite and no later than evaluation',async()=>{
 const f=await fixture();
 for(const kind of ['completeList','status']) for(const issuedAt of [undefined,'bad',f.T+10]) {
  const ev=f.withCoverage(f.evB8,'B8');const body={...ev.coverage[kind].body};
  if(issuedAt===undefined) delete body.issuedAt;else body.issuedAt=issuedAt;
  ev.coverage[kind]=signObject(kind==='status'?f.p.status:f.p.lab,body);
  const result=evaluate(POLICY_V1,ev,f.ctx());
  assert.equal(result.outcome,'UNKNOWN',JSON.stringify({kind,issuedAt,...result}));
 }
});
