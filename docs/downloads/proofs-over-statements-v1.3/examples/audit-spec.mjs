// Independent public-fixture audit. No signing key and no vc.verifyCredential.
// RDF processing uses the installed jsonld/rdf-canonize dependencies; signature
// verification uses Node/OpenSSL rather than the Data Integrity suite or jose.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createHash, createPublicKey, verify} from 'node:crypto';
import jsonld from 'jsonld';
import * as base58 from 'base58-universal';

const root=path.dirname(fileURLToPath(import.meta.url));
const bytes=name=>fs.readFileSync(path.join(root,name));
const text=name=>bytes(name).toString('utf8');
const json=name=>JSON.parse(text(name));
const sha=(value,encoding='hex')=>createHash('sha256').update(value).digest(encoding);
const manifest=json('contexts/manifest.json');
const docs=new Map();
for(const item of manifest) {
  const data=bytes(item.file);assert.equal(sha(data),item.sha256);
  docs.set(item.url,JSON.parse(data));
}
const requested=[];
const documentLoader=async url=>{
  assert(docs.has(url),'Audit forbids unknown/network context: '+url);
  requested.push(url);
  return {contextUrl:null,documentUrl:url,document:structuredClone(docs.get(url))};
};
async function canonicalParts(credential) {
  const document=structuredClone(credential);delete document.proof;
  const proof={...credential.proof,'@context':document['@context']};
  delete proof.proofValue;
  const opts={algorithm:'RDFC-1.0',format:'application/n-quads',base:null,
    safe:true,rdfDirection:'i18n-datatype',produceGeneralizedRdf:false,documentLoader};
  const doc=await jsonld.canonize(document,opts);
  const config=await jsonld.canonize(proof,opts);
  return {doc,config,input:Buffer.concat([Buffer.from(sha(config),'hex'),Buffer.from(sha(doc),'hex')])};
}
const credential=json('plain-vc.json');
const vm=json('verification-method.json');
const controller=json('controller.json');
assert.equal(credential.issuer,controller.id);
assert.equal(vm.controller,controller.id);
assert.equal(vm.id,credential.proof.verificationMethod);
const authorized=controller.assertionMethod.find(x=>(typeof x==='string'?x:x.id)===vm.id);
assert(authorized);
if(typeof authorized==='object')assert.deepEqual(authorized,vm);
assert.equal(credential.proof.proofPurpose,'assertionMethod');
assert.equal(credential.proof.cryptosuite,'eddsa-rdfc-2022');
const multikey=Buffer.from(base58.decode(vm.publicKeyMultibase.slice(1)));
assert.equal(vm.publicKeyMultibase[0],'z');
assert.deepEqual([...multikey.subarray(0,2)],[0xed,0x01]);
assert.equal(multikey.length,34);
const edKey=createPublicKey({key:Buffer.concat([
  Buffer.from('302a300506032b6570032100','hex'),multikey.subarray(2)]),format:'der',type:'spki'});
const signature=Buffer.from(base58.decode(credential.proof.proofValue.slice(1)));
assert.equal(credential.proof.proofValue[0],'z');assert.equal(signature.length,64);
const parts=await canonicalParts(credential);
assert.equal(parts.doc,text('canonical-document.nq'));
assert.equal(parts.config,text('canonical-proof-configuration.nq'));
assert.equal(parts.input.toString('hex'),text('signing-input.hex').trim());
assert(verify(null,parts.input,edKey,signature),'Independent Ed25519 check failed');
const changes=[];
for(const [name,change] of [
  ['changed-claim',x=>x.credentialSubject.recycledCobaltShare++],
  ['changed-context-meaning',x=>x['@context'][1].recycledCobaltShare='https://example.org/otherShare'],
  ['changed-proof-purpose',x=>x.proof.proofPurpose='authentication']
]) {
  const changed=structuredClone(credential);change(changed);
  assert(!verify(null,(await canonicalParts(changed)).input,edKey,signature));
  changes.push(name);
}
const badSignature=Buffer.from(signature);badSignature[0]^=1;
assert(!verify(null,parts.input,edKey,badSignature));changes.push('changed-ed25519-signature');
const reordered=Object.fromEntries(Object.entries(credential).reverse());
assert(verify(null,(await canonicalParts(reordered)).input,edKey,signature));

const token=text('nested.sd-jwt').trim();
const components=token.split('~');assert.equal(components.length,3);assert.equal(components[2],'');
const [issuerJwt,disclosure]=components;
const jwtParts=issuerJwt.split('.');assert.equal(jwtParts.length,3);
const header=JSON.parse(Buffer.from(jwtParts[0],'base64url'));
const payload=JSON.parse(Buffer.from(jwtParts[1],'base64url'));
assert.equal(header.alg,'ES256');assert.equal(header.typ,'dc+sd-jwt');
const publicJwk=json('outer-public-jwk.json');
assert.equal(header.kid,publicJwk.kid);
const metadata=json('issuer-metadata.json');
assert.equal(metadata.issuer,payload.iss);assert.equal(payload.iss,credential.issuer);
assert.deepEqual(metadata.jwks.keys.find(k=>k.kid===header.kid),publicJwk);
const ecKey=createPublicKey({key:publicJwk,format:'jwk'});
const signingBytes=Buffer.from(jwtParts[0]+'.'+jwtParts[1]);
const ecSignature=Buffer.from(jwtParts[2],'base64url');assert.equal(ecSignature.length,64);
assert(verify('sha256',signingBytes,{key:ecKey,dsaEncoding:'ieee-p1363'},ecSignature));
assert.deepEqual(payload._sd,[sha(disclosure,'base64url')]);
assert.equal(payload._sd_alg,'sha-256');
const decoded=JSON.parse(Buffer.from(disclosure,'base64url'));
assert.equal(decoded.length,3);assert.equal(decoded[1],'credential');
assert(Buffer.from(decoded[0],'base64url').length>=16);
assert.deepEqual(decoded[2],credential);
const ecBad=Buffer.from(ecSignature);ecBad[0]^=1;
assert(!verify('sha256',signingBytes,{key:ecKey,dsaEncoding:'ieee-p1363'},ecBad));
changes.push('changed-es256-signature');
const alteredPayload={...payload,iat:payload.iat+1};
const alteredInput=Buffer.from(jwtParts[0]+'.'+Buffer.from(JSON.stringify(alteredPayload)).toString('base64url'));
assert(!verify('sha256',alteredInput,{key:ecKey,dsaEncoding:'ieee-p1363'},ecSignature));
changes.push('changed-jwt-payload');
const changedDisclosure=Buffer.from(JSON.stringify([decoded[0],decoded[1],{...decoded[2],issuer:'https://other.example'}])).toString('base64url');
assert.notEqual(sha(changedDisclosure,'base64url'),payload._sd[0]);changes.push('changed-disclosure');
const badInnerComponents=text('negative-fixtures/outer-valid-inner-invalid.sd-jwt').trim().split('~');
const badInnerJwt=badInnerComponents[0].split('.');
assert(verify('sha256',Buffer.from(badInnerJwt[0]+'.'+badInnerJwt[1]),
  {key:ecKey,dsaEncoding:'ieee-p1363'},Buffer.from(badInnerJwt[2],'base64url')));
const badInnerPayload=JSON.parse(Buffer.from(badInnerJwt[1],'base64url'));
assert.deepEqual(badInnerPayload._sd,[sha(badInnerComponents[1],'base64url')]);
const invalidInner=JSON.parse(Buffer.from(badInnerComponents[1],'base64url'))[2];
assert(!verify(null,(await canonicalParts(invalidInner)).input,edKey,
  Buffer.from(base58.decode(invalidInner.proof.proofValue.slice(1)))));
changes.push('valid-outer-envelope-does-not-validate-invalid-inner-proof');

const result={result:'PASS',scope:'Independent direct Node/OpenSSL signature audit; JSON-LD/RDFC libraries are shared dependencies, not a fully independent normalization implementation. No general VC/SD-JWT conformance or live issuer discovery claimed.',
  node:process.version,
  assertions:{plainEd25519:true,canonicalDocumentMatches:true,canonicalProofConfigurationMatches:true,
    reorderedJsonStillVerifies:true,outerEs256:true,disclosureCommitmentMatches:true,
    recoveredInnerEqualsPlain:true,issuerAndAssertionAuthorizationBound:true,
    validOuterInvalidInnerIndependentlyConfirmed:true},
  negativeChecks:changes,documentSha256:sha(parts.doc),proofConfigurationSha256:sha(parts.config),
  inputArtifacts:Object.fromEntries(['plain-vc.json','verification-method.json','controller.json',
    'outer-public-jwk.json','issuer-metadata.json','nested.sd-jwt'].map(n=>[n,sha(bytes(n))])),
  contexts:[...new Set(requested)]};
fs.writeFileSync(path.join(root,'audit-spec-results.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
