// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import test from 'node:test';
// SPDX-License-Identifier: Apache-2.0
// WE-3 R: replay-validated receipts, scenario by scenario (H14). Each scenario states the outcome
// the theory predicts; the test suite asserts it and we3-replay-receipts.mjs prints the table.
// Scenarios mirror the model-checking cases MC-3 V6/V6x/V6c and MC-6.

import { typedId, DIGEST } from "../src/crypto.mjs";
import { issueLfsc } from "../src/lfsc.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "../src/loader.mjs";
import { acceptReceipt, CoSigner, decide, Device, newParty, produceReceipt, ProtectedActuator, signRequest, signStatus } from "../src/replay-receipts.mjs";

const V2 = "https://www.w3.org/ns/credentials/v2";
const ENERGY = "https://contexts.example/energy-roles/v1";
const loader = () => staticLoader({ ...W3C_CONTEXTS, [ENERGY]: contextFile("energy-roles-v1.jsonld") });
const STRICT = typedId(DIGEST.semanticClosure, "energy-roles/v1 + restricted-data-access/strict");
const LENIENT = typedId(DIGEST.semanticClosure, "energy-roles/v1 + restricted-data-access/lenient-2025");
const UNREPLAYABLE = typedId(DIGEST.semanticClosure, "energy-roles/v1 + restricted-data-access/engine-not-archived");
const role = (doc) => doc.credentialSubject?.marketRole;

async function fixture() {
  const issuer = newParty("issuer");
  const issuerDid = `did:key:${issuer.id}`;
  const vm = `${issuerDid}#${issuer.id}`;
  const credentialFor = (marketRole, id) => issueLfsc({
    "@context": [V2, ENERGY], id, type: ["VerifiableCredential", "MarketRoleCredential"], issuer: issuerDid,
    validFrom: "2026-11-10T00:00:00Z", credentialSubject: { id: "did:example:grid-operator-42", marketRole, dataAccessScope: "BatteryPassportRestrictedData" }
  }, { signer: { ...issuer.keys }, verificationMethod: vm, loader: loader() });
  const tso = await credentialFor("TransmissionSystemOperator", "urn:uuid:tso-1");
  const dso = await credentialFor("DistributionSystemOperator", "urn:uuid:dso-1");
  const closures = new Map([
    [STRICT, { name: "strict", rule: (d) => role(d) === "TransmissionSystemOperator" }],
    [LENIENT, { name: "lenient (approved 2025 policy)", rule: (d) => ["TransmissionSystemOperator", "DistributionSystemOperator"].includes(role(d)) }]
  ]);
  const rp = newParty("relying party"), statusIssuer = newParty("status issuer"), forger = newParty("forger");
  const deviceParty = newParty("device engine"), coParty = newParty("co-signer");
  let epoch = 1;
  let clock = 10;
  const verifier = { loader: loader(), allowedContexts: new Set([V2, ENERGY]), issuers: new Map([[issuerDid, new Set([vm])]]) };
  const coSigner = (extra = {}) => new CoSigner({ party: coParty, verifier, closures, approvedClosures: new Set([STRICT, LENIENT, UNREPLAYABLE]), statusIssuer, currentEpoch: () => epoch, clock: () => clock, ...extra });
  const device = new Device({ party: deviceParty });
  const request = (extra = {}) => signRequest(rp, { audience: "rp:battery-passport-portal", purpose: "data-access", action: "read:BatteryPassportRestrictedData", scope: "battery:DE-7731", authorisedClosure: STRICT, ...extra });
  const status = (credential, state = "current", e = 1, issued = 9, by = statusIssuer) => signStatus(by, { credential: credential.id, state, epoch: e, issued, expires: issued + 5 });
  const proposal = (credential, { req = request(), st = status(credential), claimedClosure = STRICT, outcome, time = clock, decisionId = "d-" + Math.random().toString(36).slice(2, 8) } = {}) => ({
    request: req, input: credential, status: st, claimedClosure, time, decisionId,
    outcome: outcome ?? decide(closures, claimedClosure, { document: credential }, st.body)
  });
  const p = proposal(tso);
  const produced = await produceReceipt({device, coSigner:coSigner(), proposal:p, rp});
  assert.equal(produced.ok, true, produced.reason);
  const acceptance = acceptReceipt(produced.receipt, {request:p.request, deviceParty, coSignerParty:coParty, consumed:new Set()});
  assert.equal(acceptance.accepted, true, acceptance.reason);
  return { acceptance, action:p.request.body.action, actuator:new ProtectedActuator({currentEpoch:()=>epoch,clock:()=>clock}), advance:()=>{epoch=2;}, expire:()=>{clock=20;} };
}

test('effect gate rejects a different action with a genuine accepted receipt', async()=>{
 const f=await fixture();
 assert.equal(f.actuator.execute('write:BatteryPassportRestrictedData',{acceptance:f.acceptance,decidedAtEpoch:1}).executed,false);
 assert.equal(f.actuator.effects.length,0);
 assert.equal(f.actuator.execute(f.action,{acceptance:f.acceptance,decidedAtEpoch:1}).executed,true);
});
test('effect gate consumes a genuine accepted receipt only once', async()=>{
 const f=await fixture();
 assert.equal(f.actuator.execute(f.action,{acceptance:f.acceptance,decidedAtEpoch:1}).executed,true);
 assert.equal(f.actuator.execute(f.action,{acceptance:f.acceptance,decidedAtEpoch:1}).executed,false);
 assert.equal(f.actuator.effects.length,1);
});
test('effect epoch comes from the signed receipt, not caller metadata', async()=>{
 const f=await fixture();f.advance();
 assert.equal(f.actuator.execute(f.action,{acceptance:f.acceptance,decidedAtEpoch:2}).executed,false);
 assert.equal(f.actuator.effects.length,0);
});

test('effect gate rechecks signed status expiry at the effect',async()=>{
 const f=await fixture();f.expire();
 assert.equal(f.actuator.execute(f.action,{acceptance:f.acceptance,decidedAtEpoch:1}).executed,false);
 assert.equal(f.actuator.effects.length,0);
});
test('provisional flag cannot use a genuine accepted GRANT',async()=>{
 const f=await fixture();
 assert.equal(f.actuator.execute(f.action,{acceptance:f.acceptance,decidedAtEpoch:1,provisional:true}).executed,false);
 assert.equal(f.actuator.effects.length,0);
});
