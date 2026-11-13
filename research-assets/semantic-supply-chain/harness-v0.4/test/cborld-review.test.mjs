import assert from 'node:assert/strict';
import test from 'node:test';
import {encodeBound,decodeBound,buildManifest} from '../src/cborld-binding.mjs';
import {generateKeyPair} from '../src/crypto.mjs';
import {staticLoader,W3C_CONTEXTS} from '../src/loader.mjs';
import {addProof} from '../src/suites.mjs';
const signer=generateKeyPair('P-256'), did=`did:key:${signer.publicKeyMultibase}`,vm=`${did}#${signer.publicKeyMultibase}`;
const V2='https://www.w3.org/ns/credentials/v2', ISSUER='https://www.w3.org/2018/credentials#issuer';
const loader=staticLoader(W3C_CONTEXTS), table=new Map([['context',new Map([[V2,32768]])]]);
const base={'@context':V2,id:'urn:credential:1',type:'VerifiableCredential',credentialSubject:{id:'urn:subject:1'}};
const verify=async(doc,profile='B')=>{
 if(profile==='I-RDFC')doc=await addProof(doc,{suite:'ecdsa-rdfc-2019',signer,verificationMethod:vm,loader});
 const label=await encodeBound(doc,{registryEntryId:100,typeTable:table,documentLoader:loader,profile,signer,verificationMethod:vm});
 return decodeBound(label.envelope,{registry:new Map([[100,{typeTable:table,loader,contexts:label.manifest.contexts.map(c=>c.id)}]])});
};
test('reject duplicate integer IDs in every type subtable before binding',()=>{
 for(const type of ['context','url','none','https://example.org/Custom']){
  for(const entries of [[['https://example.org/Restricted',32768],['https://example.org/Public',32768]],[['https://example.org/Public',32768],['https://example.org/Restricted',32768]]]){
   assert.throws(()=>buildManifest({registryEntryId:100,typeTable:new Map([[type,new Map(entries)]]),contextIds:[],contextBytes:new Map()}),/duplicate code/);
  }
 }
});
test('issuer is mandatory for credential labels',async()=>{
 const result=await verify(base);assert.equal(result.ok,false);assert.equal(result.stage,'issuer-binding');
});
test('semantic issuer aliases are bound for B and I-RDFC',async()=>{
 for(const profile of ['B','I-RDFC']){
  const context=[V2,{maker:{'@id':ISSUER,'@type':'@id'}}];
  const result=await verify({...base,'@context':context,maker:'did:example:victim'},profile);
  assert.equal(result.ok,false);assert.equal(result.stage,'issuer-binding');
  const honest=await verify({...base,'@context':context,maker:did},profile);assert.equal(honest.ok,true,honest.reason);
 }
});
test('a compact issuer key mapped to another predicate cannot stand in for VC issuer',async()=>{
 const doc={'@context':{id:'@id',issuer:{'@id':'https://example.org/harmless','@type':'@id'},maker:{'@id':ISSUER,'@type':'@id'}},id:'urn:credential:1',issuer:did,maker:'did:example:victim'};
 const result=await verify(doc);assert.equal(result.ok,false);assert.equal(result.stage,'issuer-binding');
});
