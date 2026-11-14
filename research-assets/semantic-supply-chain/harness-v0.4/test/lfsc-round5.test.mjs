// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import canonicalize from 'canonicalize';
import {issueLfsc,verifyLfsc,verifyFromQuads,storedConfiguration} from '../src/lfsc.mjs';
import {staticLoader,W3C_CONTEXTS,contextFile} from '../src/loader.mjs';
import {generateKeyPair,base58Encode,digest,ecdsaSign} from '../src/crypto.mjs';
const V2='https://www.w3.org/ns/credentials/v2',ENERGY='https://contexts.example/energy-roles/v1';
const loader=()=>staticLoader({...W3C_CONTEXTS,[ENERGY]:contextFile('energy-roles-v1.jsonld')});
const signer=generateKeyPair(),issuer=`did:key:${signer.publicKeyMultibase}`,vm=`${issuer}#${signer.publicKeyMultibase}`;
const doc={'@context':[V2,ENERGY],id:'urn:uuid:lfsc-r5',type:['VerifiableCredential','MarketRoleCredential'],issuer,validFrom:'2026-11-10T00:00:00Z',validUntil:'2026-11-20T00:00:00Z',credentialSubject:{id:'did:example:s',marketRole:'DistributionSystemOperator',dataAccessScope:'BatteryPassportPublicData'}};
const policy={allowedContexts:new Set([V2,ENERGY]),issuers:new Map([[issuer,new Set([vm])]])};
const issue=doc=>issueLfsc(doc,{signer,verificationMethod:vm,loader:loader()});
const check=(signed,extra={})=>verifyLfsc(signed,{loader:loader(),...policy,...extra});
function resign(signed){const config=storedConfiguration(signed);delete config.proofValue;signed.proof.proofValue='z'+base58Encode(ecdsaSign(signer.crv,signer.key,digest('sha256',canonicalize(config))));return signed;}
test('signed validity syntax is checked even when no decision time is supplied',async()=>{
 for(const [field,value] of [['validFrom','garbage'],['validUntil','2026-02-30T00:00:00Z'],['validUntil',null]]){
  const signed=await issue({...doc,[field]:value}),cache=new Map();
  for(let i=0;i<2;i++){
   const result=await check(signed,{cache});
   assert.equal(result.verified,false,`${field}: ${value}, use ${i}`);
   assert.match(result.reason,new RegExp(`invalid ${field}`));
  }
 }
});
test('proof created is mandatory and strictly parsed on both verification paths',async()=>{
 const good=await issue(doc),view=(await check(good)).view;
 for(const created of [undefined,null,'garbage','2026-02-30T00:00:00Z']){
  const signed=structuredClone(good);
  if(created===undefined)delete signed.proof.created;else signed.proof.created=created;
  resign(signed);
  const lexical=await check(signed);
  assert.equal(lexical.verified,false,String(created));assert.match(lexical.reason,/invalid created/);
  const graph=await verifyFromQuads({nquads:view.nquads,proof:storedConfiguration(signed),issuer,...policy});
  assert.equal(graph.verified,false,String(created));assert.match(graph.reason,/invalid created/);
 }
});
test('cryptographic success exposes whether decision-time validity was checked',async()=>{
 const signed=await issue(doc);
 assert.equal((await check(signed)).validityChecked,false);
 assert.equal((await check(signed,{validAt:'2026-11-15T00:00:00Z'})).validityChecked,true);
 assert.equal((await check(signed,{validAt:'2026-11-21T00:00:00Z'})).verified,false);
 const timeless={...doc};delete timeless.validFrom;delete timeless.validUntil;
 assert.equal((await check(await issue(timeless))).verified,true);
});
