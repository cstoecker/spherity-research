// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {issueLfsc,verifyLfsc} from '../src/lfsc.mjs';
import {staticLoader,W3C_CONTEXTS,contextFile} from '../src/loader.mjs';
import {generateKeyPair} from '../src/crypto.mjs';
import {resolveVerificationMethod} from '../src/suites.mjs';
const V2='https://www.w3.org/ns/credentials/v2',ENERGY='https://contexts.example/energy-roles/v1';
const loader=()=>staticLoader({...W3C_CONTEXTS,[ENERGY]:contextFile('energy-roles-v1.jsonld')});
const signer=generateKeyPair(),issuer=`did:key:${signer.publicKeyMultibase}`,vm=`${issuer}#${signer.publicKeyMultibase}`;
const doc={'@context':[V2,ENERGY],id:'urn:uuid:lfsc-regression',type:['VerifiableCredential','MarketRoleCredential'],issuer,validFrom:'2026-11-10T00:00:00Z',validUntil:'2026-11-20T00:00:00Z',credentialSubject:{id:'did:example:s',marketRole:'DistributionSystemOperator',dataAccessScope:'BatteryPassportPublicData'}};
const policy={allowedContexts:new Set([V2,ENERGY]),issuers:new Map([[issuer,new Set([vm])]])};
const issue=doc=>issueLfsc(doc,{signer,verificationMethod:vm,loader:loader()});
const check=(signed,extra={})=>verifyLfsc(signed,{loader:loader(),...policy,...extra});
const signed=await issue(doc);

test('negative issuer rejection does not suppress later authorization, even in the same epoch',async()=>{
 const negativeCache=new Map();
 assert.match((await check(signed,{negativeCache,issuers:new Map()})).reason,/not authorised/);
 assert.equal((await check(signed,{negativeCache})).verified,true);
});
test('negative admission rejection does not suppress re-evaluation after policy update',async()=>{
 const negativeCache=new Map();
 assert.match((await check(signed,{negativeCache,allowedContexts:new Set([V2])})).reason,/not allowlisted/);
 assert.equal((await check(signed,{negativeCache,epoch:2})).verified,true);
});
test('intrinsic negative entries expire and size is bounded',async()=>{
 const negativeCache=new Map();
 const bad=structuredClone(signed);bad.credentialSubject.marketRole='bad';
 await check(bad,{negativeCache,maxCacheEntries:2});
 assert.equal((await check(bad,{negativeCache,maxCacheEntries:2})).negativeCached,true);
 const [key,entry]=[...negativeCache][0];
 assert.ok(Number.isFinite(entry.expiresAt)&&entry.expiresAt>Date.now());
 negativeCache.set(key,{...entry,expiresAt:0});
 assert.notEqual((await check(bad,{negativeCache,maxCacheEntries:2})).negativeCached,true);
 for(const role of ['bad2','bad3']){bad.credentialSubject.marketRole=role;await check(bad,{negativeCache,maxCacheEntries:2});}
 assert.equal(negativeCache.size,2);
});
test('cache preserves current issuer checks and deep immutability of the returned view',async()=>{
 const cache=new Map(),r=await check(signed,{cache});assert.equal(r.verified,true);
 assert.ok(Object.isFrozen(r.view.document.credentialSubject));
 assert.throws(()=>{r.view.document.credentialSubject.marketRole='changed'},TypeError);
 assert.equal((await check(signed,{cache,issuers:new Map()})).verified,false);
});
test('invalid validAt fails closed with both cold and warm positive caches',async()=>{
 const cache=new Map();
 for(const validAt of ['garbage','','2026-02-30T00:00:00Z',null]){
  const cold=await check(signed,{validAt});assert.equal(cold.verified,false,String(validAt));assert.match(cold.reason,/invalid validAt/);
 }
 assert.equal((await check(signed,{cache,validAt:'2026-11-15T00:00:00Z'})).verified,true);
 assert.equal((await check(signed,{cache,validAt:'2026-11-21T00:00:00Z'})).reason,'expired');
 const bad=await check(signed,{cache,validAt:'garbage'});assert.equal(bad.verified,false);assert.match(bad.reason,/invalid validAt/);
});
test('malformed signed validity bounds fail closed',async()=>{
 for(const [field,value] of [['validFrom','garbage'],['validUntil',''],['validUntil','2026-02-30T00:00:00Z'],['validUntil',0]]){
  const result=await check(await issue({...doc,[field]:value}),{validAt:'2026-11-15T00:00:00Z'});
  assert.equal(result.verified,false,`${field}: ${value}`);assert.match(result.reason,new RegExp(`invalid ${field}`));
 }
});
test('did:key size is bounded before base58 public-key decoding',async()=>{
 const key='z'+'2'.repeat(31000),bad=structuredClone(signed);bad.proof.verificationMethod=`did:key:${key}#${key}`;
 assert.ok(Buffer.byteLength(JSON.stringify(bad))<65536);
 const result=await check(bad);assert.equal(result.stage,1);assert.match(result.reason,/verification method malformed or too long/);
 assert.throws(()=>resolveVerificationMethod(bad.proof.verificationMethod),/verification method malformed or too long/);
 for(const crv of ['P-256','P-384']){const pair=generateKeyPair(crv),id=`did:key:${pair.publicKeyMultibase}#${pair.publicKeyMultibase}`;assert.equal(resolveVerificationMethod(id).crv,crv);}
});
