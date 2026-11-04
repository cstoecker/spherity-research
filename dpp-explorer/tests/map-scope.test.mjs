import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createModel, emptyState, filterRecords, mapCounts} from '../src/model.js';
import {globalMapScope} from '../src/map-scope.js';

const releaseRoot = new URL('../../dpp-research/releases/0.1.0/', import.meta.url);
const readJson = async url => JSON.parse(await readFile(url, 'utf8'));
const [dataset, worldMap, taxonomy] = await Promise.all([
  readJson(new URL('dataset.json', releaseRoot)),
  readJson(new URL('views/world-map.json', releaseRoot)),
  readJson(new URL('../src/data/ecosystems.json', import.meta.url)),
]);
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}
for (const source of [dataset, worldMap, taxonomy]) deepFreeze(source);
const model = createModel(dataset, worldMap, taxonomy);
const state = patch => ({...emptyState(), ...patch});
function context(patch = {}) {
  const selected = state(patch);
  const current = filterRecords(model, selected);
  return {selected, current, result: globalMapScope(model, current, selected)};
}

 test('W3C globally preset requests a worldwide cue for its eight global records', () => {
  const {current, result} = context({jurisdiction: 'jur-global', standards: ['w3c']});
  assert.equal(current.length, 8);
  assert.equal(result.active, true);
  assert.equal(result.globalCount, 8);
  assert.match(result.label, /Global scope.*8 matching records/);
  assert.match(result.label, /does not imply adoption or legal applicability in every country/);
});

test('UNTP ecosystem preset requests a worldwide cue without a geography filter', () => {
  const {result} = context({ecosystems: ['untp']});
  assert.equal(result.active, true);
  assert.equal(result.globalCount, 7);
});

test('the unfiltered overview keeps global scope separate and has no worldwide cue', () => {
  const {result} = context();
  assert.ok(result.globalCount > 0);
  assert.equal(result.active, false);
  assert.equal(result.label, '');
});

test('explicit global scope and intentional standards, focus, or search filters activate the cue', () => {
  for (const patch of [
    {jurisdiction: 'jur-global'}, {standards: ['w3c']}, {focus: 'std-untp'}, {q: 'UNTP'},
  ]) {
    const {result} = context(patch);
    assert.equal(result.active, true, JSON.stringify(patch));
    assert.ok(result.globalCount > 0);
  }
});

test('a country filter takes precedence even when its associated records have global scope', () => {
  const {current, result} = context({jurisdiction: 'jur-de', standards: ['aas-idta']});
  assert.equal(current.length, 2);
  assert.equal(result.globalCount, 2, 'retain the factual global count without activating the cue');
  assert.equal(result.active, false);
  assert.equal(result.label, '');
});

test('EU, regional, subnational, and unknown non-global scopes never request a worldwide cue', () => {
  const {current} = context({ecosystems: ['untp']});
  assert.equal(context({jurisdiction: 'jur-eu'}).result.active, false);
  // Use known global matches here to exercise geography precedence independently
  // of whether the release happens to contain mixed-scope regional records.
  for (const jurisdiction of ['jur-eu', 'jur-br-pr', 'jur-unknown']) {
    assert.equal(globalMapScope(model, current, state({jurisdiction, ecosystems: ['untp']})).active, false);
  }
});

test('empty and exclusively non-global results never request a worldwide cue', () => {
  for (const patch of [
    {jurisdiction: 'jur-global', q: 'no-such-record-xyz'},
    {standards: ['w3c'], ecosystems: ['gba']},
    {standards: ['cen-cenelec-jtc24']},
    {jurisdiction: 'jur-cn', standards: ['china-sac-swg41']},
  ]) {
    assert.deepEqual(context(patch).result, {active: false, globalCount: 0, label: ''});
  }
  assert.deepEqual(globalMapScope(model, [], state({jurisdiction: 'jur-global'})), {active: false, globalCount: 0, label: ''});
});

test('whitespace search and broad sector, status, or layer filters do not imply a global request', () => {
  for (const patch of [{q: '   '}, {sector: 'sec-cross-sector'}, {status: 'published'}, {layer: 'standards'}]) {
    const {result} = context(patch);
    assert.equal(result.active, false, JSON.stringify(patch));
    assert.equal(result.label, '');
  }
});

test('the count describes unique matching global records, not the full filtered set', () => {
  const globalRecord = model.entities.get('std-untp');
  const nationalRecord = model.entities.get('global-cn-order73');
  const result = globalMapScope(model, [globalRecord, globalRecord, nationalRecord], state({q: 'passport'}));
  assert.equal(result.globalCount, 1);
  assert.equal(result.active, true);
  assert.match(result.label, /1 matching record\./);
});

test('display context leaves frozen sources, selected records, scope joins, and every map count unchanged', () => {
  const sourceBefore = JSON.stringify({dataset, worldMap, taxonomy});
  const scopesBefore = JSON.stringify([...model.scopes].map(([id, records]) => [id, [...records]]));
  for (const patch of [{jurisdiction: 'jur-global', standards: ['w3c']}, {ecosystems: ['untp']}]) {
    const selected = deepFreeze(state(patch));
    const current = deepFreeze(filterRecords(model, selected));
    const recordsBefore = JSON.stringify(current);
    const stateBefore = JSON.stringify(selected);
    const countsBefore = mapCounts(model, current);
    assert.equal(globalMapScope(model, current, selected).active, true);
    assert.deepEqual(mapCounts(model, current), countsBefore);
    assert.equal(countsBefore.get('jur-de'), 0);
    assert.equal(countsBefore.get('jur-us'), 0);
    assert.equal(countsBefore.get('jur-cn'), 0);
    assert.equal(JSON.stringify(current), recordsBefore);
    assert.equal(JSON.stringify(selected), stateBefore);
  }
  assert.equal(JSON.stringify({dataset, worldMap, taxonomy}), sourceBefore);
  assert.equal(JSON.stringify([...model.scopes].map(([id, records]) => [id, [...records]])), scopesBefore);
});
