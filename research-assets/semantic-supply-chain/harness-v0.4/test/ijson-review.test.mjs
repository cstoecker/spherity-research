// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import test from 'node:test';
import { checkIJson } from '../src/ijson.mjs';
import { generateKeyPair } from '../src/crypto.mjs';
import { issueLfsc, verifyLfsc } from '../src/lfsc.mjs';
import { staticLoader } from '../src/loader.mjs';

test('raw string input rejects lone surrogates before lossy UTF-8 conversion', () => {
  for (const code of [0xd800, 0xdbff, 0xdc00, 0xdfff]) {
    for (const raw of ['"' + String.fromCharCode(code) + '"', '{"' + String.fromCharCode(code) + '":0}']) {
      const result = checkIJson(raw);
      assert.equal(result.ok, false, `accepted ${JSON.stringify(raw)}`);
      assert.match(result.reason, /surrogate|UTF-16/);
    }
  }
  for (const raw of ['"😀"', '"\\ud83d\\ude00"', '"�"']) {
    const result = checkIJson(raw);
    assert.equal(result.ok, true);
    assert.deepEqual(result.value, JSON.parse(raw));
  }
});

test('valid numeric tokens are consumed past 400 characters', () => {
  for (const raw of [
    '0.' + '0'.repeat(399),
    '1e' + '0'.repeat(399),
    '1' + '0'.repeat(400) + 'e-400',
    '0.' + '0'.repeat(65000),
    '-0.' + '0'.repeat(399),
  ]) {
    const result = checkIJson(raw);
    assert.equal(result.ok, true, result.reason);
    assert.ok(Object.is(result.value, JSON.parse(raw)));
  }
  for (const raw of ['01', '1.', '1e', '1e309', '9007199254740992']) assert.equal(checkIJson(raw).ok, false);
});

test('LFSC rejects malformed Unicode text despite an otherwise valid proof', async () => {
  const context = 'https://contexts.example/ijson-review';
  const bytes = JSON.stringify({ '@context': { id: '@id', type: '@type', issuer: { '@id': 'urn:issuer', '@type': '@id' }, label: 'urn:label', Example: 'urn:Example' } });
  const loader = () => staticLoader({ [context]: bytes });
  const signer = generateKeyPair();
  const issuer = `did:key:${signer.publicKeyMultibase}`;
  const verificationMethod = `${issuer}#${signer.publicKeyMultibase}`;
  const policy = { allowedContexts: new Set([context]), issuers: new Map([[issuer, new Set([verificationMethod])]]) };
  const document = { '@context': context, id: 'urn:ijson-review', type: 'Example', issuer, label: '\ufffd' };
  const signed = await issueLfsc(document, { signer, verificationMethod, loader: loader() });
  const raw = JSON.stringify(signed);
  assert.equal((await verifyLfsc(raw, { ...policy, loader: loader() })).verified, true);
  const malformed = raw.replace('\ufffd', '\ud800');
  assert.equal(JSON.parse(malformed).label.charCodeAt(0), 0xd800);
  const result = await verifyLfsc(malformed, { ...policy, loader: loader() });
  assert.equal(result.verified, false, 'verifier authenticated a substituted U+FFFD value');
  assert.equal(result.stage, 0);
  assert.match(result.reason, /surrogate|UTF-16/);
});
