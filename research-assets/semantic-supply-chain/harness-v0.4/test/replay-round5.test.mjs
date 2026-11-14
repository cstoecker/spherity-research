// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import test from 'node:test';
import canonicalize from 'canonicalize';
import { CoSigner, Device, produceReceipt, acceptReceipt, signRequest, signStatus, newParty, groupKeyId, encodeMessage, ProtectedActuator } from '../src/replay-receipts.mjs';
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

function wrap(f, message, coSignature) {
 const bytes=Buffer.from(message);
 return {message:bytes.toString('utf8'),signatures:{device:f.device.signShare(bytes),coSigner:coSignature??new Device({party:f.coParty}).signShare(bytes)},keys:{device:f.deviceParty.id,coSigner:f.coParty.id}};
}
function accept(f,receipt){return acceptReceipt(receipt,{request:f.proposal.request,deviceParty:f.deviceParty,coSignerParty:f.coParty,consumed:new Set()});}
for(const change of ['expiry','epoch','closure']) test(`returned approval cannot repair internal ${change} rejection`,async()=>{
 const f=await fixture();const a=await f.approve(f.proposal);assert.equal(a.ok,true,a.reason);
 if(change==='expiry'){f.setTime(16);a.approval.expiresAt=1000;}
 if(change==='epoch'){f.setEpoch(2);a.approval.authorityEpoch=2;}
 if(change==='closure'){f.cs.approvedClosures.clear();f.cs.approvedClosures.add('closure:other');a.approval.fields.semanticClosure='closure:other';}
 const share=f.cs.sign(a.message.bytes);
 if(share.ok) assert.equal(accept(f,wrap(f,a.message.bytes,share.signature)).accepted,true,'bypass yields valid receipt');
 assert.equal(share.ok,false,`${change} bypass through returned object`);
});
test('receipt v2 validates its exact canonical array schema',async()=>{
 const f=await fixture();const a=await f.approve(f.proposal);assert.equal(a.ok,true,a.reason);
 const original=JSON.parse(a.message.bytes.toString());
 const cases=[
 ['extra slot', x=>[...x,'ignored']],
 ['numeric-key object',x=>Object.fromEntries(x.map((v,i)=>[i,v]))],
 ['inner v1 profile',x=>(x[1]='ssc-replay-receipt/v1',x)],
 ['wrong key epoch',x=>(x[3]=2,x)],
 ['negative authority epoch',x=>(x[4]=-1,x)],
 ['non-number expiry',x=>(x[5]='15',x)],
 ['unknown outcome',x=>(x[12]='UNKNOWN',x)],
 ['object decision ID',x=>(x[9]={id:'d:1'},x)],
 ['absent digest',x=>(x[13]=null,x)]
 ];
 const accepted=[];
 for(const [name,mutate]of cases){const message=canonicalize(mutate(structuredClone(original)));const acc=accept(f,wrap(f,message));if(acc.accepted)accepted.push(name);}
 const spaced=JSON.stringify(original,null,2);if(accept(f,wrap(f,spaced)).accepted)accepted.push('non-canonical whitespace');
 assert.deepEqual(accepted,[],'malformed messages accepted despite valid signatures');
});
test('encoder rejects values outside the receipt v2 schema',async()=>{
 const f=await fixture();const a=await f.approve(f.proposal);
 const accepted=[];
 for(const [field,value] of [['extra','uncommitted'],['keyEpoch',-1],['statusExpires',Infinity],['outcome','UNKNOWN'],['inputDigest',null],['profile','ssc-replay-receipt/v1']]){
  try{encodeMessage({...a.approval.fields,[field]:value});accepted.push(field);}catch{}
 }
 assert.deepEqual(accepted,[]);
});
test('malformed receipt containers return rejection rather than throwing',async()=>{
 const f=await fixture();const a=await f.approve(f.proposal);const good=wrap(f,a.message.bytes);
 const cases=[null,{}, {...good,signatures:null}, {...good,keys:null}, {...good,message:null}];
 const thrown=[];for(const [i,receipt]of cases.entries()){try{assert.equal(accept(f,receipt).accepted,false);}catch(e){thrown.push([i,e.message]);}}
 assert.deepEqual(thrown,[]);
});

test('returned window approval cannot alter its recorded status issue time',async()=>{
 const f=await fixture({admissibility:'window',windowTicks:2});const a=await f.approve(f.proposal);
 assert.equal(a.ok,true,a.reason);f.setTime(11.5);a.approval.statusIssued=11.5;
 assert.equal(f.cs.sign(a.message.bytes).ok,false,'status issue-time alias extends freshness window');
});
test('declared key epoch must match relying-party key epoch even with genuine co-signing',async()=>{
 const f=await fixture();const a=await f.cs.approve(f.proposal,{rp:f.rp,groupKey:groupKeyId([f.deviceParty.id,f.coParty.id],1),keyEpoch:2});
 assert.equal(a.ok,true,a.reason);const share=f.cs.sign(a.message.bytes);assert.equal(share.ok,true,share.reason);
 const acceptance=accept(f,wrap(f,a.message.bytes,share.signature));assert.equal(acceptance.accepted,false,'inconsistent signed epoch must fail');
});
test('receipt verification is distinct from current authorisation at use',async()=>{
 const f=await fixture();const a=await f.approve(f.proposal);const share=f.cs.sign(a.message.bytes);
 f.setTime(16);f.setEpoch(2);const acceptance=accept(f,wrap(f,a.message.bytes,share.signature));
 assert.equal(acceptance.accepted,true,'historical proof still verifies');
 const actuator=new ProtectedActuator({currentEpoch:()=>2,clock:()=>16});
 assert.equal(actuator.execute(f.proposal.request.body.action,{acceptance}).executed,false,'historical proof does not authorise current effect');
});
