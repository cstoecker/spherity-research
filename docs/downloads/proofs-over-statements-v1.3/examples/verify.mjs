// Public-input-only regression checks for the explicitly stated example profile.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {ROOT,ISSUER,NOW,readJson,readText,writeJson,hash,b64,createLoader,verifyPlain,verifyOuter,verifyNested,canonicalArtifacts} from './common.mjs';

const credential=readJson('plain-vc.json');
const token=readText('nested.sd-jwt');
const jwt=readText('issuer.jwt');
const disclosure=readText('disclosure.txt');
const cases=[];
async function positive(name,action) {
  const result=await action();cases.push({name,expected:'accept',actual:'accept',pass:true});return result;
}
async function negative(name,action) {
  try {await action();} catch(e) {
    cases.push({name,expected:'reject',actual:'reject',pass:true,reason:e.message});return;
  }
  throw new Error('Negative test unexpectedly accepted: '+name);
}
await positive('plain-vc: Ed25519 proof, issuer/controller authorization and validity',()=>verifyPlain(credential));
const verified=await positive('nested: outer ES256, disclosure digest and inner Ed25519',()=>verifyNested(token));
assert.deepEqual(verified.outer.claims.credential,credential);
assert.deepEqual(verified.outer.claims,readJson('reconstructed-outer-claims.json'));
assert.deepEqual(verified.outer.protectedHeader,readJson('outer-protected-header.json'));
assert.deepEqual(verified.outer.payload,readJson('outer-signed-payload.json'));
assert.deepEqual(JSON.parse(Buffer.from(disclosure,'base64url')),readJson('disclosure-decoded.json'));
assert.equal(token,jwt+'~'+disclosure+'~');
const canon=await canonicalArtifacts(credential);
assert.equal(canon.canonicalDocument,readText('canonical-document.nq'));
assert.equal(canon.canonicalProof,readText('canonical-proof-configuration.nq'));
assert.equal(canon.signingInputHex,readText('signing-input.hex').trim());

const changedClaim=structuredClone(credential);changedClaim.credentialSubject.recycledCobaltShare=17;
await negative('plain: changed signed claim (16 -> 17)',()=>verifyPlain(changedClaim));
const changedProof=structuredClone(credential);
changedProof.proof.proofValue=changedProof.proof.proofValue.slice(0,-1)+(changedProof.proof.proofValue.endsWith('1')?'2':'1');
await negative('plain: changed proofValue',()=>verifyPlain(changedProof));
const changedContext=structuredClone(credential);changedContext['@context'][1].recycledCobaltShare='ex:otherMeaning';
await negative('plain: changed context meaning',()=>verifyPlain(changedContext));
const unknownTerm=structuredClone(credential);unknownTerm.credentialSubject.unmappedClaim=1;
await negative('plain: unmapped claim would be lost during RDF conversion',()=>verifyPlain(unknownTerm));
const controller=readJson('controller.json');controller.assertionMethod=[];
await negative('plain: public key removed from controller assertionMethod',()=>verifyPlain(credential,{documentLoader:createLoader(new Map([[ISSUER,controller]]))}));

const [h,p,s]=jwt.split('.');
const tamperedPayload=readJson('outer-signed-payload.json');tamperedPayload.iat+=1;
await negative('nested: altered outer payload',()=>verifyNested(h+'.'+b64(tamperedPayload)+'.'+s+'~'+disclosure+'~'));
const changedSignature=Buffer.from(s,'base64url');changedSignature[0]^=1;
await negative('nested: altered outer signature',()=>verifyNested(h+'.'+p+'.'+changedSignature.toString('base64url')+'~'+disclosure+'~'));
const alteredDisclosure=readJson('disclosure-decoded.json');alteredDisclosure[2].credentialSubject.recycledCobaltShare=17;
await negative('nested: altered disclosure',()=>verifyNested(jwt+'~'+b64(alteredDisclosure)+'~'));
await negative('nested: duplicate disclosure',()=>verifyNested(jwt+'~'+disclosure+'~'+disclosure+'~'));
await negative('nested: uncommitted disclosure',()=>verifyNested(jwt+'~'+b64(['bXVsdGlwbGUtYnl0ZXMtc2FsdA','other',1])+'~'));
await negative('nested: disclosed claim collides with clear issuer',()=>verifyNested(readText('negative-fixtures/claim-collision.sd-jwt')));
await positive('withheld: issuer signature remains valid without credential disclosure',()=>verifyOuter(jwt+'~',{requireCredential:false}));
await negative('withheld: local application profile requires credential',()=>verifyNested(jwt+'~'));
const badInnerToken=readText('negative-fixtures/outer-valid-inner-invalid.sd-jwt');
await positive('outer-valid/inner-invalid fixture: outer signature and commitment pass',()=>verifyOuter(badInnerToken));
await negative('outer-valid/inner-invalid fixture: combined verification rejects inner proof',()=>verifyNested(badInnerToken));

const compactPlain=JSON.stringify(credential);
fs.writeFileSync(path.join(ROOT,'plain-vc.compact.json'),compactPlain);
const manifestFiles=['plain-vc.json','plain-vc.compact.json','verification-method.json','controller.json','outer-public-jwk.json','issuer-metadata.json','outer-protected-header.json','outer-signed-payload.json','disclosure-decoded.json','disclosure.txt','issuer.jwt','nested.sd-jwt','reconstructed-outer-claims.json','profile.json','canonical-document.nq','canonical-proof-configuration.nq','canonical-hashes.json','signing-input.hex',...readJson('contexts/manifest.json').map(x=>x.file),'negative-fixtures/outer-valid-inner-invalid.sd-jwt','negative-fixtures/claim-collision.sd-jwt'];
const files=manifestFiles.map(file=>{const bytes=fs.readFileSync(path.join(ROOT,file));return {file,bytes:bytes.length,sha256:hash(bytes)};});
writeJson('fixtures-manifest.json',files);
const pkg=readJson('package.json');
const report={result:'PASS',verificationTime:NOW,runtime:process.version,dependencies:pkg.dependencies,
  acceptedCases:cases.filter(x=>x.actual==='accept').length,rejectedCases:cases.filter(x=>x.actual==='reject').length,cases,
  artifactsIdentical:true,canonicalDocumentQuads:canon.canonicalDocument.trim().split('\n').length,
  sizes:{plainCompactUtf8Bytes:Buffer.byteLength(compactPlain),plainPrettyFileBytes:fs.statSync(path.join(ROOT,'plain-vc.json')).size,nestedCombinedAsciiBytes:Buffer.byteLength(token),issuerJwtAsciiBytes:Buffer.byteLength(jwt),disclosureBase64urlAsciiBytes:Buffer.byteLength(disclosure),disclosureDecodedUtf8Bytes:Buffer.from(disclosure,'base64url').length},
  algorithmicWork:{plain:{ed25519SignatureVerifications:1,rdfCanonicalizations:2,sha256Hashes:2},nested:{es256SignatureVerifications:1,disclosureSha256Hashes:1,ed25519SignatureVerifications:1,rdfCanonicalizations:2,innerSha256Hashes:2},note:'Algorithmic counts for this single-proof/single-disclosure example; no timing or universal format benchmark.'},
  scope:'Complete positive cryptographic worked examples under a local profile; no holder binding, status/revocation service, remote discovery, QTSP/QEAA qualification, production conformance suite or performance benchmark.'};
writeJson('verification-results.json',report);
console.log(JSON.stringify({result:report.result,acceptedCases:report.acceptedCases,rejectedCases:report.rejectedCases,sizes:report.sizes},null,2));
