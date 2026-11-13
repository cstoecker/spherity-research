import assert from 'node:assert/strict';
import test from 'node:test';
import {buildManifest,decodeBound,digestHex,encodeBound,manifestDigest,sealEnvelope} from '../src/cborld-binding.mjs';
import {generateKeyPair} from '../src/crypto.mjs';
import {staticLoader,W3C_CONTEXTS} from '../src/loader.mjs';
const signer=generateKeyPair('P-256'),did=`did:key:${signer.publicKeyMultibase}`,verificationMethod=`${did}#${signer.publicKeyMultibase}`;
const V2='https://www.w3.org/ns/credentials/v2',loader=staticLoader(W3C_CONTEXTS),typeTable=new Map([['context',new Map([[V2,32768]])]]);
const doc={'@context':V2,id:'urn:credential:1',type:'VerifiableCredential',issuer:did,credentialSubject:{id:'urn:subject:1'}};
test('B binds the installed graph processor profile and honest round-trip still succeeds',async()=>{
 const label=await encodeBound(doc,{registryEntryId:100,typeTable,documentLoader:loader,signer,verificationMethod});
 assert.deepEqual(label.manifest.graphProcessing?.processors.map(p=>p.name),['jsonld','rdf-canonize']);
 assert.equal(label.manifest.graphProcessing.options.canonizeOptions.algorithm,'RDFC-1.0');
 assert.equal((await decodeBound(label.envelope,{registry:new Map([[100,{typeTable,loader}]])})).ok,true);
});
test('graph processor/version and option drift fails before decoding even with archived material',async()=>{
 const label=await encodeBound(doc,{registryEntryId:100,typeTable,documentLoader:loader,signer,verificationMethod});
 for(const change of [p=>{p.processors[0].version='10.0.0';},p=>{p.processors[1].version='6.0.0';},p=>{p.options.base='https://other.example/';},p=>{p.options.canonizeOptions.maxWorkFactor=2;}]){
  const graphProcessing=structuredClone(label.manifest.graphProcessing ?? {
   processors:[{name:'jsonld',version:'9.0.0'},{name:'rdf-canonize',version:'5.0.0'}],
   options:{base:null,canonizeOptions:{maxWorkFactor:1}}
  });change(graphProcessing);
  const manifest=buildManifest({registryEntryId:100,typeTable,contextIds:[V2],contextBytes:loader.bytes,graphProcessing});
  const envelope=sealEnvelope({profile:'B',registryEntryId:100,manifest,cborldBytes:label.cborldBytes,signer,verificationMethod});
  const result=await decodeBound(envelope,{registry:new Map([[100,{typeTable,loader}]]),archive:new Map([[digestHex(manifestDigest(manifest)),{...label.archiveEntry,manifest}]])});
  assert.equal(result.ok,false);assert.equal(result.stage,'manifest');
  assert.ok(result.differences.some(d=>d.input==='graphProcessing'));
 }
});
