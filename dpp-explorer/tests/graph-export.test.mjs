import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGraphExport } from '../src/graph-export.js';

const dataset = JSON.parse(await readFile(new URL('../../dpp-research/releases/0.1.0/dataset.json', import.meta.url), 'utf8'));
const exportedAt = '2026-10-25T12:00:00.000Z';
const original = JSON.stringify(dataset);
const exportGraph = options => createGraphExport(dataset, { exportedAt, ...options });
const nodeIds = result => result.nodes.map(node => node.id);

function verifyReferences(result) {
  const entities = new Set([...result.nodes, ...result.context_entities].map(entity => entity.id));
  const sources = new Set(result.sources.map(source => source.id));
  const graphIds = new Set(nodeIds(result));
  const inspectSources = value => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'source_ids') for (const id of child) assert.ok(sources.has(id), `Unresolved source ${id}`);
      inspectSources(child);
    }
  };
  for (const entity of [...result.nodes, ...result.context_entities]) {
    for (const id of [...entity.jurisdiction_ids, ...entity.sector_ids, ...(entity.geography?.member_ids || [])]) assert.ok(entities.has(id), id);
    if (entity.geography?.parent_id) assert.ok(entities.has(entity.geography.parent_id));
  }
  for (const assertion of result.assertions) {
    assert.ok(entities.has(assertion.subject), assertion.subject);
    if (assertion.object.entity_id) assert.ok(entities.has(assertion.object.entity_id), assertion.object.entity_id);
  }
  for (const edge of result.edges) {
    assert.ok(graphIds.has(edge.source));
    assert.ok(graphIds.has(edge.target));
    assert.equal(edge.source, edge.subject);
    assert.equal(edge.target, edge.object.entity_id);
  }
  inspectSources([result.metadata, result.nodes, result.context_entities, result.assertions]);
}

test('full export preserves the complete evidence dataset and original provenance', () => {
  const result = exportGraph();
  assert.equal(result.format, 'spherity-dpp-knowledge-graph');
  assert.equal(result.schema_version, '1.0.0');
  assert.equal(result.scope.kind, 'full_graph');
  assert.deepEqual(result.scope.counts, { nodes: 128, edges: 87, context_entities: 75, assertions: 224, sources: 112 });
  assert.equal(result.metadata.exported_at, exportedAt);
  for (const [key, value] of Object.entries(dataset.metadata)) assert.deepEqual(result.metadata[key], value);
  assert.deepEqual(result.assertions, dataset.assertions);
  assert.deepEqual(result.sources, dataset.sources);
  for (const entity of [...result.nodes, ...result.context_entities]) assert.deepEqual(entity, dataset.entities.find(item => item.id === entity.id));
  assert.ok(result.nodes.every(node => !['Jurisdiction', 'Sector', 'Concept'].includes(node.type)));
  verifyReferences(result);
});

test('publishing a schema 0.2.0 snapshot retains wrapper 1.1 and its qualified assertion history', async () => {
  const candidate = JSON.parse(await readFile(new URL('../../dpp-research/candidates/0.2.0/dataset.json', import.meta.url), 'utf8'));
  const before = createGraphExport(candidate, { exportedAt });
  const published = structuredClone(candidate);
  published.metadata.release_status = 'research_seed';
  const after = createGraphExport(published, { exportedAt });
  assert.equal(after.schema_version, '1.1.0');
  assert.deepEqual(after.scope, before.scope);
  for (const field of ['nodes', 'edges', 'assertions', 'sources', 'context_entities']) {
    assert.deepEqual(after[field], before[field], `${field} must not change on publication`);
  }
  assert.equal(after.scope.counts.active_assertions, 361);
  assert.ok(after.assertions.some(assertion => assertion.curation?.status === 'superseded'));
  assert.ok(after.edges.every(edge => edge.curation?.status !== 'superseded'));
  assert.ok(after.assertions.every(assertion => assertion.review_status === 'machine_assisted_unreviewed'));
  const oldAssertion = published.assertions.find(assertion => assertion.curation?.status === 'superseded');
  const focused = createGraphExport(published, { records: [oldAssertion.subject], exportedAt });
  assert.equal(focused.schema_version, '1.1.0');
  assert.ok(focused.assertions.some(assertion => assertion.id === oldAssertion.id));
  for (const id of oldAssertion.curation.replacement_ids) assert.ok(focused.assertions.some(assertion => assertion.id === id));
  assert.equal(focused.scope.counts.active_assertions, focused.assertions.filter(assertion => assertion.curation?.status !== 'superseded').length);
  verifyReferences(after);
  verifyReferences(focused);
});

test('each exported graph edge retains every qualified assertion field', () => {
  const result = exportGraph();
  for (const edge of result.edges) {
    const { source, target, ...assertion } = edge;
    assert.deepEqual(assertion, dataset.assertions.find(item => item.id === edge.id));
  }
  const reported = result.assertions.find(item => item.id === 'a-global-jp-cfp-exchange');
  assert.equal(reported.interoperability.result, 'reported_success');
  assert.match(reported.limitations.join(' '), /No independent replication/);
  assert.ok(result.assertions.some(item => !item.object.entity_id && typeof item.object.value === 'string'));
});

test('a filtered JTC 5 export keeps hidden neighbours as reference-only context', () => {
  const filters = { focus: 'std-iso-jtc5', q: 'JTC' };
  const result = exportGraph({ records: ['std-iso-jtc5'], filters, layout: 'network' });
  assert.equal(result.scope.kind, 'current_view');
  assert.deepEqual(result.scope.filters, filters);
  assert.equal(result.scope.layout, 'network');
  assert.deepEqual(nodeIds(result), ['std-iso-jtc5']);
  assert.equal(result.edges.length, 0);
  assert.equal(result.assertions.length, 2);
  assert.ok(result.context_entities.some(item => item.id === 'std-iso-25534-1'));
  assert.ok(result.context_entities.some(item => item.id === 'std-iso-25534-2'));
  assert.ok(result.context_entities.some(item => item.id === 'jur-global'));
  assert.equal(result.sources.length, 3);
  verifyReferences(result);
  const neighbourhood = exportGraph({ records: ['std-iso-jtc5', 'std-iso-25534-1', 'std-iso-25534-2'] });
  assert.equal(neighbourhood.nodes.length, 3);
  assert.equal(neighbourhood.edges.length, 2);
  verifyReferences(neighbourhood);
});

test('an explicitly empty view stays empty, without silently exporting the full graph', () => {
  const result = exportGraph({ records: [], filters: { q: 'no matching records' } });
  assert.equal(result.scope.kind, 'current_view');
  assert.deepEqual(result.scope.counts, { nodes: 0, edges: 0, context_entities: 0, assertions: 0, sources: 0 });
  assert.deepEqual(result.semantic_profiles.profiles, []);
});

test('date citations and transitive geographic context resolve in filtered exports', () => {
  const copy = structuredClone(dataset);
  const record = copy.entities.find(item => item.id === 'eu-batteries-regulation');
  record.dates.push({ kind: 'research_check', date: '2026-10-25', source_ids: ['date-only-source'] });
  copy.sources.push({ id: 'date-only-source', title: 'Date-only evidence', url: 'https://example.org/evidence' });
  const result = createGraphExport(copy, { records: [record], exportedAt });
  assert.ok(result.sources.some(item => item.id === 'date-only-source'));
  const eu = result.context_entities.find(item => item.id === 'jur-eu');
  assert.ok(eu.geography.member_ids.length > 0);
  assert.ok(eu.geography.member_ids.every(id => result.context_entities.some(item => item.id === id)));
  verifyReferences(result);
});

test('semantic annotations retain their dated independent evidence and no inherited badges', () => {
  const result = exportGraph({ records: ['std-eclass', 'std-iso-jtc5'] });
  assert.equal(result.semantic_profiles.review.checkedAt, '2026-10-25');
  assert.equal(result.semantic_profiles.profiles.length, 1);
  const profile = result.semantic_profiles.profiles[0];
  assert.equal(profile.entity_id, 'std-eclass');
  assert.match(profile.limits, /No licensing conclusion is propagated/);
  const localSources = new Set(profile.sources.map(source => source.id));
  for (const finding of profile.findings) for (const id of finding.sourceIds) assert.ok(localSources.has(id));
  assert.match(result.semantic_profiles.interpretation, /absent badge means unassessed/);
});

test('dated update metadata and unknown qualifiers survive without changing release dates or rights', () => {
  const copy = structuredClone(dataset);
  copy.metadata.evidence_updates = { id: 'test-update', checked_at: '2026-10-25', base_version: '0.1.0', base_evidence_cutoff: '2026-10-23', review_status: 'machine_assisted_unreviewed', relationship_definitions: { coordinates_with: 'Coordination, not equivalence.' } };
  copy.entities.find(item => item.id === 'std-iso-jtc5').update_note = { evidence_checked_at: '2026-10-25', limitations: ['Coordination does not prove interoperability.'] };
  const result = createGraphExport(copy, { exportedAt });
  assert.deepEqual(result.metadata.evidence_updates, copy.metadata.evidence_updates);
  assert.equal(result.metadata.evidence_cutoff, '2026-10-23');
  assert.equal(result.metadata.version, '0.1.0');
  assert.equal(result.metadata.rights_statement, dataset.metadata.rights_statement);
  assert.deepEqual(result.nodes.find(item => item.id === 'std-iso-jtc5').update_note, copy.entities.find(item => item.id === 'std-iso-jtc5').update_note);
});

test('exports are detached from input, use canonical records and reject broken references', () => {
  const record = { ...dataset.entities.find(item => item.id === 'std-iso-jtc5'), label: 'Changed by view' };
  const filters = { standards: ['w3c'] };
  const result = exportGraph({ records: [record, record], filters });
  assert.equal(result.nodes.length, 1);
  assert.equal(result.nodes[0].label, 'ISO/IEC JTC 5 — Digital Product Passport');
  result.nodes[0].status.value = 'changed';
  result.context_entities[0].source_ids.push('changed');
  result.scope.filters.standards.push('changed');
  result.metadata.limitations.push('changed');
  assert.equal(JSON.stringify(dataset), original);
  assert.deepEqual(filters, { standards: ['w3c'] });
  assert.throws(() => exportGraph({ records: ['missing'] }), /Unknown export record/);
  const broken = structuredClone(dataset);
  broken.entities.find(item => item.id === 'std-iso-jtc5').source_ids.push('missing-source');
  assert.throws(() => createGraphExport(broken), /Unresolved source/);
  broken.entities.find(item => item.id === 'std-iso-jtc5').jurisdiction_ids.push('missing-entity');
  assert.throws(() => createGraphExport(broken), /Unresolved entity/);
});


test('the dated JTC 5 update is included in full and focused downloads with sourced qualifications', async () => {
  const { applyEvidenceUpdates } = await import('../src/evidence-updates.js');
  const updates = JSON.parse(await readFile(new URL('../src/data/evidence-updates.json', import.meta.url), 'utf8'));
  const merged = applyEvidenceUpdates(dataset, updates);
  const result = createGraphExport(merged, { exportedAt });
  assert.equal(result.nodes.length, 150);
  assert.equal(result.edges.length, 139);
  assert.equal(result.metadata.evidence_updates.checked_at, '2026-10-25');
  assert.equal(result.metadata.evidence_cutoff, '2026-10-23');
  const jtcEdges = result.edges.filter(edge => edge.source === 'std-iso-jtc5' || edge.target === 'std-iso-jtc5');
  assert.equal(jtcEdges.length, 13);
  assert.equal(jtcEdges.filter(edge => edge.predicate === 'coordinates_with').length, 1);
  assert.equal(jtcEdges.filter(edge => edge.predicate === 'liaison_with').length, 9);
  const focusIds = [...new Set(['std-iso-jtc5', ...jtcEdges.flatMap(edge => [edge.source, edge.target])])];
  const focused = createGraphExport(merged, { records: focusIds, filters: { focus: 'std-iso-jtc5' }, exportedAt });
  assert.equal(focused.nodes.length, 14);
  assert.equal(focused.edges.filter(edge => edge.source === 'std-iso-jtc5' || edge.target === 'std-iso-jtc5').length, 13);
  assert.ok(focused.sources.some(source => source.id === 'src-update-20261025-iso-jtc5'));
  assert.ok(focused.sources.some(source => source.id === 'src-update-20261025-cen-jtc5'));
  for (const assertion of updates.assertions.filter(item => item.subject === 'std-iso-jtc5' || item.object.entity_id === 'std-iso-jtc5')) assert.deepEqual(focused.assertions.find(item => item.id === assertion.id), assertion);
  verifyReferences(result);
  verifyReferences(focused);
  assert.equal(JSON.stringify(dataset), original);
});


test('complete downloads include all dated policy batches while preserving the frozen baseline', async () => {
  const { applyEvidenceUpdates } = await import('../src/evidence-updates.js');
  const updates = JSON.parse(await readFile(new URL('../src/data/evidence-updates.json', import.meta.url), 'utf8'));
  const merged = applyEvidenceUpdates(dataset, updates);
  const result = createGraphExport(merged, { exportedAt });
  assert.deepEqual(result.scope.counts, { nodes: 150, edges: 139, context_entities: 76, assertions: 276, sources: 143 });
  assert.deepEqual(result.metadata.evidence_updates.batches, updates.batches);
  assert.equal(result.nodes.filter(node => node.id === 'eu-gb-dpr-consultation').length, 1);
  assert.ok(result.context_entities.some(entity => entity.id === 'jur-tw'));
  assert.equal(result.metadata.rights_statement, dataset.metadata.rights_statement);
  assert.deepEqual(result.assertions.slice(0, dataset.assertions.length), dataset.assertions);
  assert.deepEqual(result.sources.slice(0, dataset.sources.length), dataset.sources);
  verifyReferences(result);
  assert.equal(JSON.stringify(dataset), original);
});

test('filtered UK and Taiwan downloads keep source closure and separate hidden evidence from visible edges', async () => {
  const { applyEvidenceUpdates } = await import('../src/evidence-updates.js');
  const updates = JSON.parse(await readFile(new URL('../src/data/evidence-updates.json', import.meta.url), 'utf8'));
  const merged = applyEvidenceUpdates(dataset, updates);
  const ukIds = ['eu-gb-dpr-consultation', 'eu-northern-ireland-scope', 'uk-construction-products-reform-white-paper', 'uk-toy-safety-dpp-consultation'];
  const uk = createGraphExport(merged, { records: ukIds, filters: { jurisdiction: 'jur-gb' }, exportedAt });
  assert.deepEqual(new Set(nodeIds(uk)), new Set(ukIds));
  assert.equal(uk.edges.length, 2);
  assert.ok(uk.context_entities.some(entity => entity.id === 'eu-espr'));
  assert.ok(uk.context_entities.some(entity => entity.id === 'jur-gb-gbn'));
  assert.ok(uk.context_entities.some(entity => entity.id === 'jur-gb-nir'));
  for (const id of updates.batches.find(batch => batch.id === 'uk-policy-additions-2026-10-25').assertion_ids) {
    assert.ok(uk.assertions.some(assertion => assertion.id === id), id);
  }
  assert.ok(uk.sources.some(source => source.id === 'src-update-20261025-uk-construction-progress'));
  assert.ok(uk.nodes.every(node => !node.jurisdiction_ids.includes('jur-gb')));
  verifyReferences(uk);
  const twIds = ['global-tw-resource-circulation-act', 'global-tw-product-information-art22', 'global-tw-dpp-voluntary-pilot'];
  const taiwan = createGraphExport(merged, { records: twIds, filters: { jurisdiction: 'jur-tw' }, exportedAt });
  assert.deepEqual(new Set(nodeIds(taiwan)), new Set(twIds));
  assert.equal(taiwan.edges.length, 2);
  assert.ok(taiwan.assertions.some(assertion => assertion.object.entity_id === 'eu-battery-passport-requirement'));
  assert.ok(!taiwan.nodes.some(node => node.id === 'eu-battery-passport-requirement'));
  assert.equal(taiwan.context_entities.find(entity => entity.id === 'jur-tw').geography.iso_alpha3, 'TWN');
  assert.equal(taiwan.nodes.find(node => node.id === 'global-tw-dpp-voluntary-pilot').status.value, 'voluntary_pilot_reported');
  verifyReferences(taiwan);
});


test('filtered committee and ecosystem downloads preserve visible W3C paths and complete qualified source closure', async () => {
  const { applyEvidenceUpdates, applyEvidenceMapUpdates, applyEvidenceTaxonomyUpdates } = await import('../src/evidence-updates.js');
  const { createModel, filterRecords, emptyState, graphData } = await import('../src/model.js');
  const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
  const updates = await json('../src/data/evidence-updates.json');
  const merged = applyEvidenceUpdates(dataset, updates);
  const map = applyEvidenceMapUpdates(await json('../../dpp-research/releases/0.1.0/views/world-map.json'), updates);
  const taxonomy = applyEvidenceTaxonomyUpdates(await json('../src/data/ecosystems.json'), updates);
  const model = createModel(merged, map, taxonomy);
  for (const [id, key, nodes, edges] of [
    ['iso-iec-jtc5', 'standards', 20, 23], ['cen-cenelec-jtc24', 'standards', 17, 25],
    ['w3c', 'standards', 21, 32], ['untp', 'ecosystems', 11, 16], ['cirpass2', 'ecosystems', 8, 7],
  ]) {
    const filters = { ...emptyState(), view: 'graph', [key]: [id] };
    const records = filterRecords(model, filters), visible = graphData(model, records);
    const result = createGraphExport(merged, { records, filters, exportedAt, layout: 'network' });
    assert.equal(result.nodes.length, nodes, id);
    assert.equal(result.edges.length, edges, id);
    assert.deepEqual(nodeIds(result), records.map(record => record.id));
    assert.deepEqual(result.edges.map(edge => edge.id), visible.edges.map(edge => edge.id));
    assert.deepEqual(result.scope.filters, filters);
    for (const edge of result.edges) {
      const { source, target, ...assertion } = edge;
      assert.deepEqual(assertion, merged.assertions.find(item => item.id === edge.id));
    }
    verifyReferences(result);
    if (id === 'iso-iec-jtc5' || id === 'cen-cenelec-jtc24') {
      assert.ok(result.edges.some(edge => edge.source === 'std-en-18219-2026' && edge.target === 'std-w3c-vc2' && edge.predicate === 'normatively_references'));
      assert.ok(result.edges.some(edge => edge.source === 'std-w3c-dpp-committee-discussion-20260727' && edge.target === 'std-iso-jtc5' && edge.predicate === 'references'));
      assert.ok(!result.edges.some(edge => edge.predicate === 'liaison_with' && /std-w3c-/.test(edge.source + edge.target)));
    }
  }
});
