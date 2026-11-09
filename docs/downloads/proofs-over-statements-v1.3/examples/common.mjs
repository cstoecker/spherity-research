// Local worked-example profile; intentionally not a general-purpose verifier.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import * as vc from '@digitalbazaar/vc';
import {DataIntegrityProof} from '@digitalbazaar/data-integrity';
import {cryptosuite} from '@digitalbazaar/eddsa-rdfc-2022-cryptosuite';
import {compactVerify, importJWK} from 'jose';

export const ROOT=path.dirname(fileURLToPath(import.meta.url));
export const ISSUER='https://issuer.example';
export const VCT='https://issuer.example/type/nested-material';
export const CREATED='2026-11-09T00:00:00Z';
export const NOW='2026-11-09T12:00:00Z';
export const VC_CONTEXT='https://www.w3.org/ns/credentials/v2';
export const readJson=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),'utf8'));
export const readText=name=>fs.readFileSync(path.join(ROOT,name),'utf8');
export const writeJson=(name,x)=>fs.writeFileSync(path.join(ROOT,name),JSON.stringify(x,null,2)+'\n');
export const hash=(x,encoding='hex')=>createHash('sha256').update(x).digest(encoding);
export const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');

export function createLoader(overrides=new Map()) {
  const manifest=readJson('contexts/manifest.json');
  const docs=new Map();
  for(const entry of manifest) {
    const bytes=fs.readFileSync(path.join(ROOT,entry.file));
    assert.equal(hash(bytes),entry.sha256,'Pinned context hash mismatch');
    docs.set(entry.url,JSON.parse(bytes));
  }
  docs.set(ISSUER,readJson('controller.json'));
  const vm=readJson('verification-method.json');docs.set(vm.id,vm);
  for(const [url,doc] of overrides)docs.set(url,doc);
  const requested=[];
  const loader=async url=>{
    requested.push(url);
    assert(docs.has(url),'Unrecognized document URL: '+url);
    return {contextUrl:null,documentUrl:url,document:structuredClone(docs.get(url))};
  };
  loader.requested=requested;
  return loader;
}

export async function verifyPlain(credential,{documentLoader=createLoader()}={}) {
  assert.equal(credential.issuer,ISSUER,'Untrusted inner issuer');
  assert.equal(credential['@context'][0],VC_CONTEXT,'Require VCDM 2.0 context first');
  assert.deepEqual(credential.type,['VerifiableCredential','MaterialCredential']);
  assert.equal(credential.proof?.type,'DataIntegrityProof');
  assert.equal(credential.proof.cryptosuite,'eddsa-rdfc-2022');
  assert.equal(credential.proof.proofPurpose,'assertionMethod');
  assert.equal(credential.proof.verificationMethod,ISSUER+'#ed25519');
  assert(Date.parse(credential.proof.created)<=Date.parse(NOW),'Future proof');
  assert.equal(credential.credentialSubject.unit,'ex:percentagePoint');
  assert(Number.isInteger(credential.credentialSubject.recycledCobaltShare));
  assert(credential.credentialSubject.recycledCobaltShare>=0 && credential.credentialSubject.recycledCobaltShare<=100);
  const result=await vc.verifyCredential({credential,
    suite:new DataIntegrityProof({cryptosuite}),documentLoader,now:NOW,maxClockSkew:0});
  assert(result.verified,'Data Integrity verification rejected: '+(result.error?.message||JSON.stringify(result.error||{})));
  return {verified:true,issuer:credential.issuer,proofPurpose:'assertionMethod',time:NOW,requestedDocuments:[...new Set(documentLoader.requested)]};
}

export async function verifyOuter(token,{requireCredential=true}={}) {
  assert(typeof token==='string' && token.length<32768,'Token limit');
  const parts=token.split('~');assert.equal(parts.pop(),'','No holder-binding JWT in this example');
  const jwt=parts.shift();assert(jwt && parts.every(Boolean),'Malformed combined format');
  const metadata=readJson('issuer-metadata.json');
  assert.equal(metadata.issuer,ISSUER);
  const jwk=metadata.jwks.keys.find(k=>k.kid===ISSUER+'#es256');assert(jwk);
  const key=await importJWK(jwk,'ES256');
  const {payload:bytes,protectedHeader}=await compactVerify(jwt,key,{algorithms:['ES256']});
  assert.equal(protectedHeader.typ,'dc+sd-jwt');assert.equal(protectedHeader.kid,jwk.kid);
  assert.deepEqual(Object.keys(protectedHeader).sort(),['alg','kid','typ']);
  const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  assert.equal(payload.iss,ISSUER);assert.equal(payload.vct,VCT);
  assert(Number.isSafeInteger(payload.iat) && payload.iat<=Date.parse(NOW)/1000);
  assert.equal(payload._sd_alg,'sha-256');
  assert(Array.isArray(payload._sd) && payload._sd.length===1 && typeof payload._sd[0]==='string');
  assert.deepEqual(Object.keys(payload).sort(),['_sd','_sd_alg','iat','iss','vct']);
  const claims=structuredClone(payload);delete claims._sd;delete claims._sd_alg;
  const used=new Set();
  for(const disclosure of parts) {
    assert(/^[A-Za-z0-9_-]+$/.test(disclosure),'Malformed base64url disclosure');
    const digest=hash(disclosure,'base64url');
    assert(payload._sd.includes(digest),'Uncommitted disclosure');
    assert(!used.has(digest),'Duplicate disclosure');used.add(digest);
    const decoded=Buffer.from(disclosure,'base64url');
    assert.equal(decoded.toString('base64url'),disclosure,'Non-canonical base64url');
    const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(decoded));
    assert(Array.isArray(value) && value.length===3,'Object-member disclosure required');
    const [salt,name,claim]=value;
    assert(typeof salt==='string' && Buffer.from(salt,'base64url').length>=16,'Example requires at least 128 salt bits');
    assert(typeof name==='string' && !['_sd','...'].includes(name),'Reserved claim name');
    assert(!Object.hasOwn(claims,name),'Disclosure collides with clear claim');
    claims[name]=claim;
  }
  if(requireCredential) {
    assert(Object.hasOwn(claims,'credential'),'Profile requires the credential disclosure');
    assert(claims.credential && typeof claims.credential==='object' && !Array.isArray(claims.credential));
    assert.equal(claims.credential.issuer,claims.iss,'Profile requires matching outer/inner issuers');
  }
  return {verified:true,protectedHeader,payload,claims,disclosureCount:parts.length};
}

export async function verifyNested(token) {
  const outer=await verifyOuter(token);
  const inner=await verifyPlain(outer.claims.credential);
  return {verified:true,outer,inner};
}

export async function canonicalArtifacts(credential) {
  const document=structuredClone(credential);delete document.proof;
  const loader=createLoader();
  const suite=new DataIntegrityProof({cryptosuite});
  const canonicalDocument=await cryptosuite.canonize(document,{documentLoader:loader,base:null,safe:true});
  const canonicalProof=await suite.canonizeProof(credential.proof,{document,documentLoader:loader});
  const signingInput=Buffer.concat([Buffer.from(hash(canonicalProof),'hex'),Buffer.from(hash(canonicalDocument),'hex')]);
  return {canonicalDocument,canonicalProof,signingInputHex:signingInput.toString('hex'),documentSha256:hash(canonicalDocument),proofConfigurationSha256:hash(canonicalProof)};
}
