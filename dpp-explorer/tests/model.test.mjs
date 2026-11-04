import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  createModel, emptyState, filterRecords, mapCounts, graphData,
  parseState, stateParams, countryCode,
} from '../src/model.js';

const releaseRoot = new URL('../../dpp-research/releases/0.1.0/', import.meta.url);
const readJson = async url => JSON.parse(await readFile(url, 'utf8'));
const [dataset, worldMap, taxonomy] = await Promise.all([
  readJson(new URL('dataset.json', releaseRoot)),
  readJson(new URL('views/world-map.json', releaseRoot)),
  readJson(new URL('../src/data/ecosystems.json', import.meta.url)),
]);
const originalData = JSON.stringify(dataset);
const originalMap = JSON.stringify(worldMap);
const model = createModel(dataset, worldMap, taxonomy);
const state = overrides => ({ ...emptyState(), ...overrides });
const ids = records => records.map(record => record.id).sort();
const filtered = overrides => filterRecords(model, state(overrides));
const group = id => taxonomy.groups.find(entry => entry.id === id);

test('unfiltered and reset states expose every non-structural research record', () => {
  const expected = dataset.entities.filter(e => !['Jurisdiction', 'Sector', 'Concept'].includes(e.type));
  assert.deepEqual(ids(filtered({})), ids(expected));
  assert.ok(filtered({ jurisdiction: 'jur-cn', standards: ['china-sac-swg41'] }).length < expected.length);
  assert.deepEqual(ids(filterRecords(model, emptyState())), ids(expected));
  const first = emptyState();
  first.standards.push('w3c');
  assert.deepEqual(emptyState().standards, [], 'reset must not retain a previously selected group');
});

test('multiple standards selections use OR within the standards family', () => {
  const expected = [...new Set([...group('aas-idta').entity_ids, ...group('china-sac-swg41').entity_ids])].sort();
  assert.deepEqual(ids(filtered({ standards: ['aas-idta', 'china-sac-swg41'] })), expected);
});

test('multiple DPP ecosystem selections use OR and de-duplicate shared records', () => {
  const expected = [...new Set([...group('catena-x').entity_ids, ...group('ouranos').entity_ids])].sort();
  const result = ids(filtered({ ecosystems: ['catena-x', 'ouranos'] }));
  assert.deepEqual(result, expected);
  assert.equal(result.filter(id => id === 'global-jp-catena-x-cfp-demo').length, 1);
});

test('standards and DPP ecosystem families combine with AND', () => {
  assert.deepEqual(ids(filtered({ standards: ['aas-idta'], ecosystems: ['cirpass2'] })), ['std-cirpass2-aas-rdf']);
  assert.deepEqual(ids(filtered({ standards: ['w3c'], ecosystems: ['gba'] })), []);
});

test('Germany plus AAS returns only the two documented geographic associations', () => {
  const result = ids(filtered({ jurisdiction: 'jur-de', standards: ['aas-idta'] }));
  assert.deepEqual(result, ['std-dpp4-0', 'std-idta']);
  assert.equal(model.scopes.get('jur-de').has('std-iec-63278-1'), false);
  for (const id of result) {
    const scope = model.scopes.get('jur-de').get(id);
    assert.equal(scope.scope_basis, 'ecosystem_association');
    assert.equal(scope.associations.length, 1);
    assert.equal(scope.associations[0].jurisdiction_id, 'jur-de');
    assert.ok(scope.associations[0].source_url.startsWith('https://industrialdigitaltwin.org/'));
  }
  assert.equal(model.scopes.get('jur-de').get('std-idta').associations[0].relationship, 'organisation_base');
  assert.equal(model.scopes.get('jur-de').get('std-dpp4-0').associations[0].relationship, 'ecosystem_activity');
});

test('W3C is discoverable globally without being projected into every country', () => {
  assert.deepEqual(ids(filtered({ jurisdiction: 'jur-global', standards: ['w3c'] })), [...group('w3c').entity_ids].sort());
  assert.deepEqual(ids(filtered({ jurisdiction: 'jur-de', standards: ['w3c'] })), []);
  assert.deepEqual(ids(filtered({ jurisdiction: 'jur-cn', standards: ['w3c'] })), []);
  const counts = mapCounts(model, filtered({ standards: ['w3c'] }));
  assert.equal(counts.get('jur-global'), group('w3c').entity_ids.length);
  assert.equal(counts.get('jur-de'), 0);
  assert.equal(counts.get('jur-us'), 0);
});

test('China standards filter does not silently include battery-law records', () => {
  assert.deepEqual(ids(filtered({ jurisdiction: 'jur-cn', standards: ['china-sac-swg41'] })), [
    'global-cn-dpp-general-project', 'global-cn-dpp-working-group',
  ]);
  assert.equal(filtered({ standards: ['china-sac-swg41'] }).some(e => e.id === 'global-cn-order73'), false);
});

test('jurisdiction, sector and exact status filters combine with AND', () => {
  assert.deepEqual(ids(filtered({
    jurisdiction: 'jur-cn', standards: ['china-sac-swg41'], sector: 'sec-textiles', status: 'established',
  })), ['global-cn-dpp-working-group']);
  assert.deepEqual(ids(filtered({ standards: ['china-sac-swg41'], sector: 'sec-toys' })), []);
  assert.ok(filtered({ sector: 'sec-batteries' }).every(e => e.sector_ids.includes('sec-batteries')));
});

test('EU display joins preserve their membership provenance and exclude Norway', () => {
  const germanESPR = model.scopes.get('jur-de').get('eu-espr');
  assert.ok(germanESPR);
  assert.equal(germanESPR.scope_basis, 'eu_membership_display_join');
  assert.equal(germanESPR.membership_assertion_id, 'a-root-eu-member-de');
  assert.equal(model.scopes.get('jur-no').has('eu-espr'), false);
  assert.deepEqual(ids(filtered({ jurisdiction: 'jur-no' })), ['eu-norway-espr-status']);
  assert.match(model.entities.get('eu-norway-espr-status').status.value, /unverified/);
});

test('global initiatives stay separate while regional pilots retain display-only country joins', () => {
  for (const id of ['std-untp', 'std-gba', 'std-rain-dpp-001', 'std-iso-jtc5']) {
    assert.equal(model.scopes.get('jur-global').has(id), true, id);
    assert.equal(model.scopes.get('jur-de').has(id), false, id);
    assert.equal(model.scopes.get('jur-cn').has(id), false, id);
  }
  assert.equal(model.scopes.get('jur-br').get('global-br-pr-vehicle-pilot').scope_basis, 'territorial_display_rollup');
  assert.deepEqual(model.entities.get('global-br-pr-vehicle-pilot').jurisdiction_ids, ['jur-br-pr']);
  assert.equal(model.scopes.get('jur-br-pr').has('global-br-pr-vehicle-pilot'), true);
});

test('United Kingdom browsing discovers Great Britain and Northern Ireland with explicit territorial provenance', () => {
  assert.deepEqual(ids(filtered({ jurisdiction: 'jur-gb' })), ['eu-gb-dpr-consultation', 'eu-northern-ireland-scope']);
  assert.deepEqual(ids(filtered({ jurisdiction: 'jur-gb-gbn' })), ['eu-gb-dpr-consultation']);
  assert.deepEqual(ids(filtered({ jurisdiction: 'jur-gb-nir' })), ['eu-northern-ireland-scope']);
  for (const [recordId, territoryId] of [['eu-gb-dpr-consultation', 'jur-gb-gbn'], ['eu-northern-ireland-scope', 'jur-gb-nir']]) {
    const row = model.scopes.get('jur-gb').get(recordId);
    assert.equal(row.scope_basis, 'territorial_display_rollup');
    assert.deepEqual(row.territorial_scopes, [{jurisdiction_id: territoryId, scope_basis: 'direct_record'}]);
    assert.deepEqual(model.entities.get(recordId).jurisdiction_ids, [territoryId]);
    assert.equal(model.scopes.get(territoryId).get(recordId).scope_basis, 'direct_record');
  }
  const counts = mapCounts(model, filtered({ jurisdiction: 'jur-gb' }));
  assert.equal(counts.get('jur-gb'), 2);
  assert.equal(counts.get('jur-gb-gbn'), 1);
  assert.equal(counts.get('jur-gb-nir'), 1);
  assert.deepEqual(worldMap.jurisdictions.find(j => j.jurisdiction_id === 'jur-gb').records, []);
});

test('explicit subnational parents make local records discoverable without changing their geographic scope', () => {
  for (const [parentId, childId, recordId] of [
    ['jur-br', 'jur-br-pr', 'global-br-pr-vehicle-pilot'],
    ['jur-kr', 'jur-kr-26', 'global-kr-busan-pilot'],
    ['jur-us', 'jur-us-ca', 'global-us-ca-sb615'],
  ]) {
    assert.ok(filtered({ jurisdiction: parentId }).some(e => e.id === recordId));
    assert.equal(model.scopes.get(parentId).get(recordId).scope_basis, 'territorial_display_rollup');
    assert.deepEqual(model.scopes.get(parentId).get(recordId).territorial_scopes.map(s => s.jurisdiction_id), [childId]);
    assert.deepEqual(model.entities.get(recordId).jurisdiction_ids, [childId]);
    assert.equal(mapCounts(model, [model.entities.get(recordId)]).get(parentId), 1);
  }
});

test('territorial discovery ignores supranational parents and records without direct child scope', () => {
  const map = structuredClone(worldMap);
  const eu = map.jurisdictions.find(j => j.jurisdiction_id === 'jur-eu');
  eu.geography.parent_id = 'jur-gb';
  const gb = map.jurisdictions.find(j => j.jurisdiction_id === 'jur-gb-gbn');
  gb.records.push({entity_id: 'std-untp', scope_basis: 'ecosystem_association'});
  const scoped = createModel(dataset, map, taxonomy);
  assert.equal(scoped.scopes.get('jur-gb').has('eu-espr'), false);
  assert.equal(scoped.scopes.get('jur-gb').has('std-untp'), false);
  assert.equal(scoped.scopes.get('jur-gb').has('eu-gb-dpr-consultation'), true);
});

test('a record already scoped to the country keeps its original basis and is counted once', () => {
  const map = structuredClone(worldMap);
  const gb = map.jurisdictions.find(j => j.jurisdiction_id === 'jur-gb');
  const child = map.jurisdictions.find(j => j.jurisdiction_id === 'jur-gb-gbn');
  gb.records.push(structuredClone(child.records[0]));
  const data = structuredClone(dataset);
  data.entities.find(e => e.id === 'eu-gb-dpr-consultation').jurisdiction_ids.push('jur-gb');
  const scoped = createModel(data, map, taxonomy);
  const record = scoped.scopes.get('jur-gb').get('eu-gb-dpr-consultation');
  assert.equal(record.scope_basis, 'direct_record');
  assert.deepEqual(record.territorial_scopes, [{jurisdiction_id: 'jur-gb-gbn', scope_basis: 'direct_record'}]);
  assert.equal(mapCounts(scoped, [scoped.entities.get('eu-gb-dpr-consultation')]).get('jur-gb'), 1);
});

test('ecosystem overlay does not mutate the frozen dataset or its world-map view', () => {
  assert.equal(JSON.stringify(dataset), originalData);
  assert.equal(JSON.stringify(worldMap), originalMap);
  assert.deepEqual(model.entities.get('std-idta').jurisdiction_ids, ['jur-global']);
  assert.deepEqual(model.entities.get('std-dpp4-0').jurisdiction_ids, ['jur-global']);
});

test('all taxonomy groups and geographic overlays resolve to release entities and sources', () => {
  assert.equal(taxonomy.dataset_version, '0.1.0');
  assert.equal(new Set(taxonomy.groups.map(g => g.id)).size, taxonomy.groups.length);
  for (const g of taxonomy.groups) {
    assert.equal(g.membership_basis, 'editorial_filter');
    assert.ok(['standards', 'dpp'].includes(g.kind));
    assert.ok(g.entity_ids.length);
    for (const id of g.entity_ids) assert.ok(model.entities.has(id), `${g.id}: ${id}`);
    for (const id of g.source_ids) assert.ok(model.sources.has(id), `${g.id}: ${id}`);
  }
  for (const link of taxonomy.geographic_associations) {
    assert.ok(model.entities.has(link.entity_id));
    assert.equal(model.entities.get(link.jurisdiction_id)?.type, 'Jurisdiction');
    assert.ok(['ecosystem_activity', 'organisation_base', 'pilot_location'].includes(link.relationship));
    assert.ok(new URL(link.source_url).protocol === 'https:');
  }
});

test('sources used by entities and assertions are resolvable with original evidence status', () => {
  for (const item of [...dataset.entities, ...dataset.assertions]) {
    for (const id of item.source_ids) assert.ok(model.sources.has(id), `${item.id}: ${id}`);
  }
  const unavailable = model.sources.get('src-std-w3c-dpp-vocabulary');
  assert.equal(unavailable.access_status, 'unavailable');
  assert.equal(unavailable.retrieved_at, null);
  assert.ok(unavailable.limitations.length > 0);
});

test('country joins prefer ISO_A3_EH rather than sovereignty or administrative fallback codes', () => {
  assert.equal(countryCode({ properties: { ISO_A3_EH: 'FRA', ISO_A3: '-99', ADM0_A3: 'FR1' } }), 'FRA');
  assert.equal(countryCode({ properties: { ISO_A3_EH: 'NOR', ISO_A3: '-99', ADM0_A3: 'NOR' } }), 'NOR');
  assert.equal(countryCode({ properties: { ISO_A3_EH: '-99', ISO_A3: 'DEU', ADM0_A3: 'GER' } }), 'DEU');
  assert.equal(countryCode({ properties: { ISO_A3: '-99', ADM0_A3: 'AAA' } }), 'AAA');
  assert.equal(countryCode({ properties: {} }), '');
});

test('vendored map can join France and Norway despite Natural Earth ISO_A3 sentinel values', async () => {
  const geometry = await readJson(new URL('../src/vendor/world.geojson', import.meta.url));
  for (const code of ['FRA', 'NOR', 'DEU', 'CHN', 'JPN']) {
    assert.ok(geometry.features.some(feature => countryCode(feature) === code), `Missing usable join for ${code}`);
  }
});

test('malformed or unknown URL IDs cannot become active filters', () => {
  const parsed = parseState('jurisdiction=jur-missing&sector=jur-cn&status=made-up&layer=nope&focus=does-not-exist&view=bogus&standards=made-up,untp,w3c&ecosystems=bad,w3c,untp', model);
  assert.equal(parsed.jurisdiction, '');
  assert.equal(parsed.sector, '');
  assert.equal(parsed.status, '');
  assert.equal(parsed.layer, '');
  assert.equal(parsed.focus, '');
  assert.equal(parsed.view, 'map');
  assert.deepEqual(parsed.standards, ['w3c']);
  assert.deepEqual(parsed.ecosystems, ['untp']);
});

test('shareable URL state round-trips valid filters and encoded search text', () => {
  const selected = state({
    jurisdiction: 'jur-de', standards: ['aas-idta'], ecosystems: ['dpp4-0'],
    sector: 'sec-cross-sector', status: 'active', layer: 'ecosystems',
    q: 'AAS & identity / meaning', view: 'graph', focus: 'std-idta',
  });
  assert.deepEqual(parseState(stateParams(selected), model), selected);
});

test('free-text search includes ecosystem labels and requires all tokens', () => {
  assert.deepEqual(ids(filtered({ q: 'SAC SWG 41' })), [...group('china-sac-swg41').entity_ids].sort());
  assert.equal(filtered({ q: 'SAC unknown-impossible-token' }).length, 0);
});

test('graph edges preserve the complete qualified assertion rather than flattening it', () => {
  const graph = graphData(model, model.records);
  assert.ok(graph.edges.length > 0);
  for (const edge of graph.edges) {
    const original = dataset.assertions.find(a => a.id === edge.id);
    assert.deepEqual(edge.assertion, original);
    assert.equal(edge.source, original.subject);
    assert.equal(edge.target, original.object.entity_id);
    assert.ok(edge.assertion.review_status);
    assert.ok(edge.assertion.observed_at);
    assert.deepEqual(edge.assertion.source_ids, original.source_ids);
    assert.equal(edge.assertion.limitations, original.limitations);
    assert.equal(edge.assertion.locator, original.locator);
  }
});

test('graph filtering never invents cross-group edges or renders dangling endpoints', () => {
  const records = filtered({ standards: ['aas-idta'], ecosystems: ['cirpass2'] });
  assert.equal(graphData(model, records).edges.length, 0);
  const selected = filtered({ ecosystems: ['untp', 'gba'] });
  const allowed = new Set(ids(selected));
  for (const edge of graphData(model, selected).edges) {
    assert.ok(allowed.has(edge.source));
    assert.ok(allowed.has(edge.target));
    assert.ok(dataset.assertions.some(a => a.id === edge.id));
  }
});

test('versioned UNTP specifications remain separate graph nodes', () => {
  const graph = graphData(model, filtered({ ecosystems: ['untp'] }));
  for (const id of ['std-untp-0-7', 'std-untp-dpp-0-8', 'std-untp-dpp-family']) {
    const node = graph.nodes.find(n => n.id === id);
    const original = model.entities.get(id);
    assert.ok(node);
    assert.equal(node.version, original.version);
    assert.deepEqual(node.source_ids, original.source_ids);
    assert.deepEqual(node.status, original.status);
  }
});

test('literal findings and reported results remain available in evidence details', () => {
  const literals = dataset.assertions.filter(a => !a.object.entity_id);
  assert.ok(literals.length);
  for (const assertion of literals) {
    assert.ok(model.assertionsByEntity.get(assertion.subject).includes(assertion));
  }
  const results = dataset.assertions.filter(a => a.interoperability);
  assert.ok(results.length > 0);
  for (const assertion of results) {
    const found = model.assertionsByEntity.get(assertion.subject).find(a => a.id === assertion.id);
    assert.deepEqual(found.interoperability, assertion.interoperability);
    assert.deepEqual(found.source_ids, assertion.source_ids);
  }
});

test('the release dataset retains its pinned original SHA-256 digest', async () => {
  const bytes = await readFile(new URL('dataset.json', releaseRoot));
  const digest = createHash('sha256').update(bytes).digest('hex');
  assert.equal(digest, '2c6e9d377bf265bc7edf288ee95cd5cd75955dbed4298cf5fa7f7c649b3134f1');
});

test('every file listed in the frozen release checksum manifest is unchanged', async () => {
  const manifest = await readFile(new URL('checksums.sha256', releaseRoot), 'utf8');
  const lines = manifest.trim().split(/\r?\n/);
  assert.ok(lines.length > 20);
  for (const line of lines) {
    const [, expected, path] = line.match(/^([0-9a-f]{64})\s{2}(.+)$/) || [];
    assert.ok(expected && path, `Malformed checksum entry: ${line}`);
    assert.ok(!path.includes('..'), 'Manifest paths must stay within the release');
    const bytes = await readFile(new URL(path.replaceAll('\\', '/'), releaseRoot));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, path);
  }
});
