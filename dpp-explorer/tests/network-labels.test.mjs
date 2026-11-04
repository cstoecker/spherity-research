import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { networkLabel, NETWORK_LABEL_MAX, NETWORK_LABEL_OVERRIDES } from '../src/network-labels.js';

const dataset = JSON.parse(await readFile(new URL('../../dpp-research/releases/0.1.0/dataset.json', import.meta.url), 'utf8'));
const records = dataset.entities.filter(node => !['Jurisdiction', 'Sector', 'Concept'].includes(node.type));
const byId = new Map(records.map(node => [node.id, node]));

function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

test('all 128 release records have bounded, nonempty and distinct readable network names', () => {
  assert.equal(records.length, 128);
  const owners = new Map();
  for (const node of records) {
    const label = networkLabel(node);
    assert.ok(label.trim(), `${node.id} has a name`);
    assert.equal(label, label.trim());
    assert.ok([...label].length <= NETWORK_LABEL_MAX, `${node.id}: ${label}`);
    assert.ok(!label.endsWith('…'), `${node.id} has a curated name rather than a truncated release label`);
    const normalized = label.normalize('NFKC').toLocaleLowerCase('en');
    assert.ok(!owners.has(normalized), `${node.id} must not collapse into ${owners.get(normalized)}`);
    owners.set(normalized, node.id);
  }
});

test('static overrides are immutable, concise and resolve to existing research records', () => {
  assert.ok(Object.isFrozen(NETWORK_LABEL_OVERRIDES));
  for (const [id, label] of Object.entries(NETWORK_LABEL_OVERRIDES)) {
    assert.ok(byId.has(id), `${id} is in release 0.1.0`);
    assert.ok(typeof label === 'string' && label.length > 0);
    assert.ok([...label].length <= NETWORK_LABEL_MAX, `${id} exceeds the display contract`);
  }
  assert.throws(() => { NETWORK_LABEL_OVERRIDES['std-eclass'] = 'Changed'; }, TypeError);
});

test('familiar identifiers remain useful without losing article and standard identities', () => {
  assert.equal(networkLabel(byId.get('eu-espr')), 'ESPR');
  assert.equal(networkLabel(byId.get('eu-battery-passport-requirement')), 'Battery passport Art.77');
  assert.equal(networkLabel(byId.get('std-eclass')), 'ECLASS');
  assert.equal(networkLabel(byId.get('std-w3c-vc2')), 'VC Data Model 2.0');
  assert.match(networkLabel(byId.get('std-iec-63278-1')), /AAS.*63278-1:2023/);
  for (const node of records.filter(node => /^std-en-/.test(node.id))) {
    const identifier = node.label.match(/^EN \d+:\d{4}/)[0];
    assert.ok(networkLabel(node).startsWith(identifier));
  }
});

test('UNTP protocol, unversioned family, maintained pilot and working schema stay distinct', () => {
  const ids = ['std-untp', 'std-untp-0-7', 'std-untp-dpp-0-8', 'std-untp-dpp-family'];
  const labels = ids.map(id => networkLabel(byId.get(id)));
  assert.equal(new Set(labels).size, ids.length);
  assert.equal(labels[0], 'UNTP');
  assert.match(labels[1], /0\.7\.0.*pilot/);
  assert.match(labels[2], /0\.8\.0.*working/);
  assert.match(labels[3], /specification family/);
  assert.ok(!/0\.[78]/.test(labels[3]), 'the family does not inherit an artifact version');
  assert.match(networkLabel(byId.get('std-gs1-digital-link-1-7')), /1\.7\.0/);
  assert.match(networkLabel(byId.get('std-gs1-epcis-2')), /2\.0/);
});

test('display naming does not mutate labels, versions, assertions or nested frozen input', () => {
  const input = deepFreeze(structuredClone(dataset));
  const before = JSON.stringify(input);
  for (const node of input.entities) networkLabel(node);
  assert.equal(JSON.stringify(input), before);
  assert.equal(input.entities.find(node => node.id === 'std-w3c-vc2').label, 'W3C Verifiable Credentials Data Model 2.0');
});

test('unknown names use readable bounded ellipsis and never fabricate acronyms or inherited overrides', () => {
  assert.equal(networkLabel({ id: 'new', label: '  New   programme \n name  ' }), 'New programme name');
  const source = 'A newly discovered product passport initiative with a much longer descriptive name';
  const label = networkLabel({ id: 'new', label: source });
  assert.ok(label.endsWith('…'));
  assert.ok([...label].length <= NETWORK_LABEL_MAX);
  assert.ok(source.startsWith(label.slice(0, -1)), 'fallback retains actual wording');
  for (const id of ['constructor', 'toString', '__proto__']) {
    assert.equal(networkLabel({ id, label: 'Readable label' }), 'Readable label');
  }
  const unicode = networkLabel({ id: 'new', label: '😀'.repeat(40) });
  assert.equal([...unicode].length, NETWORK_LABEL_MAX);
  assert.equal(unicode, '😀'.repeat(NETWORK_LABEL_MAX - 1) + '…');
  assert.equal(networkLabel({ id: 'fallback-id', label: '  ' }), 'fallback-id');
  assert.equal(networkLabel(null), 'Unnamed record');
  assert.equal(networkLabel({}), 'Unnamed record');
});
