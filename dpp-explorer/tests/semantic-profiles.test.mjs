import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SEMANTIC_REVIEW, SEMANTIC_PROFILES, semanticProfile, semanticBadges, semanticSummary } from '../src/semantic-profiles.js';

const dataset = JSON.parse(await readFile(new URL('../../dpp-research/releases/0.1.0/dataset.json', import.meta.url), 'utf8'));
const assessedIds = ['std-cirpass2-ontology', 'std-eclass', 'std-w3c-vc2'];
const knownEntities = new Map(dataset.entities.map(entity => [entity.id, entity]));

function assertDeepFrozen(value) {
  if (value && typeof value === 'object') {
    assert.ok(Object.isFrozen(value));
    for (const child of Object.values(value)) assertDeepFrozen(child);
  }
}

test('the dated assessment only annotates its explicit existing-record whitelist', () => {
  assert.deepEqual(Object.keys(SEMANTIC_PROFILES).sort(), assessedIds);
  assert.match(SEMANTIC_REVIEW.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(SEMANTIC_REVIEW.status, /review pending/i);
  assert.ok(SEMANTIC_REVIEW.version);
  for (const id of assessedIds) {
    assert.ok(knownEntities.has(id), `${id} resolves to an existing record`);
    assert.equal(semanticProfile(id), SEMANTIC_PROFILES[id]);
    assert.equal(semanticBadges(id), SEMANTIC_PROFILES[id].badges);
    assert.equal(semanticSummary(id), SEMANTIC_PROFILES[id].summary);
    assert.ok(semanticSummary(id).length > 0);
  }
});

test('neighbours, organisations, related versions and unknown IDs do not inherit classifications', () => {
  const unassessedIds = [
    'std-idta', 'std-iec-63278-1', 'std-iec-cdd', 'std-etim',
    'std-w3c-vcwg', 'std-untp-0-7', 'std-untp-dpp-family', 'std-untp-dpp-0-8',
    'std-cirpass2-aas-rdf', 'std-eclass-other-version', 'STD-ECLASS', 'unknown', '',
    '__proto__', 'constructor', 'toString', null, undefined,
  ];
  for (const id of unassessedIds) {
    assert.equal(semanticProfile(id), null, `no implicit profile for ${id}`);
    assert.deepEqual(semanticBadges(id), [], `no inherited badges for ${id}`);
    assert.equal(semanticSummary(id), '', `no implicit claim for ${id}`);
  }
  for (const record of dataset.entities.filter(entity => !assessedIds.includes(entity.id))) {
    assert.equal(semanticProfile(record.id), null);
  }
});

test('every assessment finding cites a local source record or explicitly states it was not assessed', () => {
  for (const [id, profile] of Object.entries(SEMANTIC_PROFILES)) {
    const sources = new Map(profile.sources.map(source => [source.id, source]));
    assert.equal(sources.size, profile.sources.length, `${id} has unique source IDs`);
    assert.ok(profile.limits, `${id} states version and scope limits`);
    for (const source of profile.sources) {
      assert.equal(new URL(source.url).protocol, 'https:');
      assert.ok(source.title && source.locator, `${source.id} has readable provenance`);
    }
    const citedSources = new Set();
    for (const finding of profile.findings) {
      assert.ok(finding.dimension && finding.title && finding.basis && finding.text);
      assert.ok(Array.isArray(finding.sourceIds));
      if (!finding.sourceIds.length) assert.match(finding.basis, /not assessed/i);
      for (const sourceId of finding.sourceIds) {
        assert.ok(sources.has(sourceId), `${id} finding resolves ${sourceId}`);
        citedSources.add(sourceId);
      }
    }
    assert.equal(citedSources.size, sources.size, `${id} does not present uncited sources as evidence`);
  }
});

test('semantic model, closed validation and licensing remain independent classifications', () => {
  const ids = id => semanticBadges(id).map(badge => badge.id);
  assert.deepEqual(ids('std-eclass'), ['closed-validation', 'use-licence']);
  assert.deepEqual(ids('std-w3c-vc2'), ['open-world']);
  assert.deepEqual(ids('std-cirpass2-ontology'), ['open-world', 'closed-validation']);
  assert.match(semanticSummary('std-eclass'), /Neither means all ECLASS reasoning is closed-world/);
  assert.match(semanticProfile('std-cirpass2-ontology').findings.find(finding => finding.dimension === 'Ontology').basis, /Inference/);
  assert.ok(!ids('std-w3c-vc2').includes('use-licence'), 'an open model implies no licence claim');
  assert.ok(!ids('std-cirpass2-ontology').includes('use-licence'), 'a component licence implies no network-wide badge');
});

test('visible badge labels and symbols fit the two-chip accessible footer contract', () => {
  const tones = new Set(['validation', 'open', 'licensed', 'reuse']);
  for (const [id, profile] of Object.entries(SEMANTIC_PROFILES)) {
    assert.ok(profile.badges.length > 0 && profile.badges.length <= 2, `${id} has at most two badges`);
    assert.equal(new Set(profile.badges.map(badge => badge.id)).size, profile.badges.length);
    for (const badge of profile.badges) {
      assert.match(badge.id, /^[a-z][a-z-]+$/);
      assert.ok(tones.has(badge.tone));
      assert.ok([...badge.label].length <= 13 && badge.label.length > 0);
      assert.ok(badge.symbol && badge.description, 'text and description accompany every symbol');
      assert.ok(!/[<>]/.test(badge.label + badge.symbol), 'badge text is plain text');
    }
  }
});

test('profile data, nested findings, source references and the unknown badge array are immutable', () => {
  assertDeepFrozen(SEMANTIC_REVIEW);
  assertDeepFrozen(SEMANTIC_PROFILES);
  assertDeepFrozen(semanticBadges('unknown'));
  const before = JSON.stringify(SEMANTIC_PROFILES);
  assert.throws(() => { semanticProfile('std-eclass').summary = 'Changed'; }, TypeError);
  assert.throws(() => semanticBadges('std-eclass').push({ id: 'inferred' }), TypeError);
  assert.throws(() => { semanticProfile('std-w3c-vc2').findings[0].sourceIds[0] = 'other'; }, TypeError);
  assert.throws(() => semanticBadges('unknown').push({ id: 'inferred' }), TypeError);
  assert.equal(JSON.stringify(SEMANTIC_PROFILES), before);
});
