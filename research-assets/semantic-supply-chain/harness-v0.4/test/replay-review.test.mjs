// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import test from 'node:test';
import canonicalize from 'canonicalize';
import { CoSigner, Device, produceReceipt, acceptReceipt, signRequest, signStatus, newParty, groupKeyId } from '../src/replay-receipts.mjs';
import { issueLfsc, verifyLfsc } from '../src/lfsc.mjs';
import { contextFile, staticLoader, W3C_CONTEXTS } from '../src/loader.mjs';
import { typedId, DIGEST } from '../src/crypto.mjs';
const V2='https://www.w3.org/ns/credentials/v2', EN='https://contexts.example/energy-roles/v1';
async function fixture(extra={}) {
 const issuer=newParty('issuer'), rp=newParty('rp'), statusIssuer=newParty('status'), coParty=newParty('co'), deviceParty=newParty('device');
 const did=`did:key:${issuer.id}`,vm=`${did}#${issuer.id}`;
 const loader=()=>staticLoader({...W3C_CONTEXTS,[EN]:contextFile('energy-roles-v1.jsonld')});
 const input=await issueLfsc({'@context':[V2,EN],id:'urn:credential:1',type:['VerifiableCredential','MarketRoleCredential'],issuer:did,credentialSubject:{id:'urn:subject:1',marketRole:'TransmissionSystemOperator',dataAccessScope:'BatteryPassportRestrictedData'}},{signer:issuer.keys,verificationMethod:vm,loader:loader()});
 const verifier={loader:loader(),allowedContexts:new Set([V2,EN]),issuers:new Map([[did,new Set([vm])]])};
 let time=10, epoch=1;
 const req=signRequest(rp,{audience:'rp:1',purpose:'read',action:'read',scope:'battery:1',authorisedClosure:'closure:strict'});
 const status=signStatus(statusIssuer,{credential:input.id,state:'current',epoch:1,issued:9,expires:15});
 const proposal={request:req,input,status,claimedClosure:'closure:strict',time:10,decisionId:'d:1',outcome:'GRANT'};
 const cs=new CoSigner({party:coParty,verifier,closures:new Map([['closure:strict',{rule:d=>d.credentialSubject.marketRole==='TransmissionSystemOperator'}]]),approvedClosures:new Set(['closure:strict']),statusIssuer,currentEpoch:()=>epoch,clock:()=>time,...extra});
 const device=new Device({party:deviceParty});
 return {rp,statusIssuer,coParty,deviceParty,proposal,cs,device,verifier,setTime:t=>time=t,setEpoch:e=>epoch=e, approve:p=>cs.approve(p,{rp,groupKey:groupKeyId([deviceParty.id,coParty.id],1),keyEpoch:1})};
}
test('approval snapshots the same input it authenticates, replays and commits', async()=>{
 const f=await fixture(); const expected=typedId(DIGEST.input,canonicalize(f.proposal.input));
 const pending=produceReceipt({device:f.device,coSigner:f.cs,proposal:f.proposal,rp:f.rp});
 f.proposal.input.credentialSubject.marketRole='DistributionSystemOperator';
 const result=await pending;
 assert.equal(result.ok,true,result.reason);
 const acc=acceptReceipt(result.receipt,{request:f.proposal.request,deviceParty:f.deviceParty,coSignerParty:f.coParty,consumed:new Set()});
 assert.equal(acc.accepted,true,acc.reason);
 assert.equal(acc.fields.inputDigest,expected,'receipt must commit the authenticated pre-mutation input');
 assert.equal((await verifyLfsc(f.proposal.input,f.verifier)).verified,false);
});
test('approval rejects non-finite or absent clock/status values',async()=>{
 for(const invalid of [undefined,null,'garbage',NaN,Infinity]) {
  const f=await fixture();f.proposal.time=invalid;
  assert.equal((await f.approve(f.proposal)).ok,false,`proposal time ${invalid}`);
 }
 for(const field of ['issued','expires','epoch']){
  const f=await fixture(); const body={...f.proposal.status.body};delete body[field];
  f.proposal.status=signStatus(f.statusIssuer,body);
  assert.equal((await f.approve(f.proposal)).ok,false,`missing status ${field}`);
 }
 const f=await fixture(); f.setTime(NaN);
 assert.equal((await f.approve(f.proposal)).ok,false,'non-finite local clock');
});
test('approval becomes unusable after expiry, withdrawal or authority epoch change',async()=>{
 for(const change of ['time','epoch','closure']) {
  const f=await fixture();const a=await f.approve(f.proposal); assert.equal(a.ok,true,a.reason);
  if(change==='time') f.setTime(16);
  if(change==='epoch') f.setEpoch(2);
  if(change==='closure')f.cs.approvedClosures.clear();
  assert.equal(f.cs.sign(a.message.bytes).ok,false,change);
 }
});
test('approval storage has a configured bound and expires old approvals',async()=>{
 const f=await fixture({maxApprovals:2,approvalTtlTicks:2});
 const approved=[];
 for(let i=0;i<3;i++) approved.push(await f.approve({...f.proposal,decisionId:`d:${i}`}));
 assert.ok(approved.every(x=>x.ok)); assert.equal(f.cs.approvals.size,2);
 assert.equal(f.cs.sign(approved[0].message.bytes).ok,false,'evicted approval');
 f.setTime(13); assert.equal(f.cs.sign(approved[2].message.bytes).ok,false,'TTL elapsed');
 assert.equal(f.cs.approvals.size,0,'expired entries pruned');
});
test('each required signature is independently verified',async()=>{
 const f=await fixture();const produced=await produceReceipt({device:f.device,coSigner:f.cs,proposal:f.proposal,rp:f.rp});
 assert.equal(produced.ok,true,produced.reason);
 for(const who of ['device','coSigner']) {
  const receipt=structuredClone(produced.receipt);
  const bytes=Buffer.from(receipt.signatures[who],'base64');bytes[0]^=1;receipt.signatures[who]=bytes.toString('base64');
  const acc=acceptReceipt(receipt,{request:f.proposal.request,deviceParty:f.deviceParty,coSignerParty:f.coParty,consumed:new Set()});
  assert.equal(acc.accepted,false,`${who} must be checked independently`);
  assert.equal(acc.reason,`${who} signature invalid`);
 }
});
