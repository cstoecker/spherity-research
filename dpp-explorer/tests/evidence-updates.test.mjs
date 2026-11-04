import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { applyEvidenceUpdates, applyEvidenceMapUpdates, applyEvidenceTaxonomyUpdates } from '../src/evidence-updates.js';
import { createModel, filterRecords, graphData, emptyState } from '../src/model.js';
import { catalogueHtml } from '../scripts/build.mjs';
import { createGraphExport } from '../src/graph-export.js';

const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const baselinePath = new URL('../../dpp-research/releases/0.1.0/dataset.json', import.meta.url);
const baselineBytes = await readFile(baselinePath);
const baseline = JSON.parse(baselineBytes);
const updates = await json('../src/data/evidence-updates.json');
const map = await json('../../dpp-research/releases/0.1.0/views/world-map.json');
const taxonomy = await json('../src/data/ecosystems.json');
const original = JSON.stringify({ baseline, updates, map, taxonomy });
const current = applyEvidenceUpdates(baseline, updates);
const currentMap = applyEvidenceMapUpdates(map, updates);
const currentTaxonomy = applyEvidenceTaxonomyUpdates(taxonomy, updates);
const model = createModel(current, currentMap, currentTaxonomy);
const graph = graphData(model, model.records);
const clone = value => structuredClone(value);

// These are sourced additions, not a rewritten release or inferred graph edges.
test('JTC 5 has thirteen directly evidenced neighbours without altering its frozen base', async () => {
  assert.equal(model.records.length, 150);
  assert.equal(graph.edges.length, 139);
  const links = graph.edges.filter(edge => edge.source === 'std-iso-jtc5' || edge.target === 'std-iso-jtc5');
  assert.equal(links.length, 13);
  assert.deepEqual(new Set(links.map(edge => edge.source === 'std-iso-jtc5' ? edge.target : edge.source)), new Set(['std-iso-25534-1', 'std-iso-25534-2', 'std-cen-jtc24', 'std-idta', 'org-anec', 'org-astm', 'org-dtid', 'org-eclass-ev', 'org-gs1', 'org-opc-federation', 'org-rain-alliance', 'org-sbs', 'std-w3c-dpp-committee-discussion-20260727']));
  assert.deepEqual(current.entities.slice(0, baseline.entities.length), baseline.entities);
  assert.deepEqual(current.assertions.slice(0, baseline.assertions.length), baseline.assertions);
  assert.deepEqual(current.sources.slice(0, baseline.sources.length), baseline.sources);
  assert.equal(JSON.stringify({ baseline, updates, map, taxonomy }), original);
  assert.deepEqual(await readFile(baselinePath), baselineBytes);
  assert.equal(createHash('sha256').update(baselineBytes).digest('hex'), '2c6e9d377bf265bc7edf288ee95cd5cd75955dbed4298cf5fa7f7c649b3134f1');
});

test('dated additions retain batch provenance and the JTC 5 institutional qualifications', () => {
  const note = current.metadata.evidence_updates;
  assert.equal(current.metadata.version, '0.1.0');
  assert.equal(current.metadata.evidence_cutoff, '2026-10-23');
  assert.equal(note.checked_at, '2026-10-25');
  assert.equal(note.base_evidence_cutoff, '2026-10-23');
  assert.equal(note.review_status, 'machine_assisted_unreviewed');
  assert.equal(updates.assertions.filter(a => a.predicate === 'liaison_with').length, 9);
  for (const assertion of updates.assertions) {
    assert.equal(assertion.observed_at, note.checked_at);
    assert.equal(assertion.review_status, note.review_status);
    assert.equal(assertion.interoperability, null);
    assert.equal(assertion.valid_from, null);
    assert.ok(assertion.locator && assertion.limitations.length >= 1);
    for (const sourceId of assertion.source_ids) {
      const source = model.sources.get(sourceId);
      assert.ok(source, sourceId);
      assert.equal(source.retrieved_at, note.checked_at);
      assert.ok(source.locator);
    }
  }
  assert.match(updates.assertions.find(a => a.predicate === 'coordinates_with').statement, /announced close cooperation/);
  const jtcBatch = note.batches.find(batch => batch.id === 'jtc5-connections-2026-10-25');
  const jtcAssertions = updates.assertions.filter(a => jtcBatch.assertion_ids.includes(a.id));
  assert.equal(jtcAssertions.length, 10);
  assert.ok(updates.entities.filter(entity => jtcBatch.entity_ids.includes(entity.id)).every(entity => entity.type === 'Organisation'));
  assert.ok(jtcAssertions.every(a => a.subject !== 'std-eclass' && a.object.entity_id !== 'std-eclass'));
  assert.ok(jtcAssertions.every(a => !/untp|w3c|aas|iec-63278/.test(a.subject + a.object.entity_id)));
  assert.deepEqual(note.batches.map(batch => batch.id), ['jtc5-connections-2026-10-25', 'uk-policy-additions-2026-10-25', 'jurisdiction-additions-2026-10-25', 'w3c-committee-additions-2026-10-25', 'w3c-technical-connections-2026-10-25', 'european-product-act-2026-10-25', 'missing-jurisdiction-readiness-2026-10-25']);
  for (const batch of note.batches) {
    assert.equal(batch.checked_at, note.checked_at);
    assert.equal(batch.review_status, note.review_status);
    for (const [key, records] of [['entity_ids', updates.entities], ['assertion_ids', updates.assertions], ['source_ids', updates.sources]]) {
      assert.ok(batch[key].every(id => records.some(record => record.id === id)), `${batch.id}: ${key}`);
    }
  }
});

test('JTC 5 filter includes its sourced neighbours; map adds global scope without country adoption', () => {
  const records = filterRecords(model, { ...emptyState(), standards: ['iso-iec-jtc5'] });
  assert.equal(records.length, 20);
  assert.equal(graphData(model, records).edges.length, 23);
  assert.equal(currentMap.jurisdictions.find(row => row.jurisdiction_id === 'jur-global').records.length, map.jurisdictions.find(row => row.jurisdiction_id === 'jur-global').records.length + 12);
  for (const entity of updates.entities.filter(entity => entity.type === 'Organisation')) {
    const countries = currentMap.jurisdictions.filter(row => row.geography.kind === 'country' && row.records.some(record => record.entity_id === entity.id));
    assert.equal(countries.length, 0, `${entity.id} must not create country adoption`);
  }
  const jtcGroup = currentTaxonomy.groups.find(group => group.id === 'iso-iec-jtc5');
  assert.ok(!jtcGroup.entity_ids.some(id => /^(uk-|global-tw|global-ch-thg|global-no-battery)/.test(id)));
  assert.deepEqual(currentTaxonomy.geographic_associations, taxonomy.geographic_associations);
  assert.equal(currentTaxonomy.dataset_version, '0.1.0');
});

test('additive merging rejects duplicate IDs and missing source or endpoint references', () => {
  const cases = [
    update => update.entities.push(clone(update.entities[0])),
    update => update.entities[0].id = baseline.entities[0].id,
    update => update.sources.push(clone(update.sources[0])),
    update => update.assertions.push(clone(update.assertions[0])),
    update => update.assertions[0].subject = 'missing-subject',
    update => update.assertions[0].object.entity_id = 'missing-object',
    update => update.assertions[0].source_ids = ['missing-source'],
    update => update.entities[0].source_ids = ['missing-source'],
    update => update.entities[0].jurisdiction_ids = ['missing-jurisdiction'],
    update => update.base_version = '0.2.0',
    update => update.assertions[0].source_ids = [],
    update => update.sources[0].retrieved_at = '2026-02-30',
  ];
  for (const change of cases) {
    const update = clone(updates); change(update);
    assert.throws(() => applyEvidenceUpdates(baseline, update));
  }
  assert.throws(() => applyEvidenceUpdates(current, updates), /already applied/);
  assert.throws(() => applyEvidenceMapUpdates(currentMap, updates), /already applied/);
  assert.throws(() => applyEvidenceTaxonomyUpdates(currentTaxonomy, updates), /already applied/);
});

test('catalogue and portable graph expose the dated update with complete source closure', () => {
  const html = catalogueHtml(current);
  assert.match(html, /Baseline 0.1.0 \+ evidence update 2026-10-25/);
  assert.match(html, /Edition evidence cut-off: <strong>2026-10-23/);
  assert.match(html, /data\/knowledge-graph.json/);
  assert.match(html, /Frozen baseline JSON/);
  assert.doesNotMatch(html, /The frozen dataset contains (211|219|223)/);
  for (const record of [...updates.entities.filter(entity => entity.type !== 'Jurisdiction'), ...updates.sources]) assert.ok(html.includes(`id="${record.id.startsWith('src-') ? 'source-' : ''}${record.id}"`));
  const exported = createGraphExport(current);
  assert.deepEqual(exported.scope.counts, { nodes: 150, edges: 139, context_entities: 76, assertions: 276, sources: 143 });
  assert.deepEqual(exported.metadata.evidence_updates, current.metadata.evidence_updates);
  const sources = new Set(exported.sources.map(source => source.id));
  for (const assertion of exported.assertions) for (const id of assertion.source_ids) assert.ok(sources.has(id));
  const changed = clone(current); changed.entities[0].label = 'Changed clone';
  assert.notEqual(baseline.entities[0].label, changed.entities[0].label);
});


test('the existing GB consultation gains six sourced references without duplication', () => {
  assert.equal(current.entities.filter(entity => entity.id === 'eu-gb-dpr-consultation').length, 1);
  assert.equal(updates.entities.filter(entity => entity.id === 'eu-gb-dpr-consultation').length, 0);
  const references = graph.edges.filter(edge => edge.source === 'eu-gb-dpr-consultation');
  assert.equal(references.length, 6);
  assert.ok(references.every(edge => edge.assertion.predicate === 'references' && edge.assertion.interoperability === null));
  assert.deepEqual(new Set(references.map(edge => edge.target)), new Set([
    'eu-espr', 'eu-batteries-regulation', 'eu-toy-safety-regulation', 'eu-construction-regulation',
    'uk-construction-products-reform-white-paper', 'uk-toy-safety-dpp-consultation',
  ]));
  assert.ok(references.every(edge => edge.assertion.source_ids.includes('src-update-20261025-uk-dpr')));
});

test('UK sector proposals retain consultation dates and remain distinct from enacted duties', () => {
  for (const [id, opened, closed] of [
    ['uk-construction-products-reform-white-paper', '2026-02-25', '2026-05-20'],
    ['uk-toy-safety-dpp-consultation', '2026-07-06', '2026-10-06'],
  ]) {
    const entity = model.entities.get(id);
    assert.equal(entity.type, 'Policy');
    assert.equal(entity.status.value, 'consultation_closed_policy_unresolved');
    assert.equal(entity.dates.find(date => date.kind === 'published').date, opened);
    assert.equal(entity.dates.find(date => date.kind === 'ends').date, closed);
    assert.deepEqual(entity.jurisdiction_ids, ['jur-gb-gbn']);
    assert.match(entity.status.scope_note, /Northern Ireland/);
    assert.equal(graph.edges.filter(edge => edge.source === id).length, 2);
  }
  const construction = model.entities.get('uk-construction-products-reform-white-paper');
  assert.ok(construction.source_ids.includes('src-update-20261025-uk-construction-progress'));
  assert.equal(model.sources.get('src-update-20261025-uk-construction-progress').updated_at, '2026-10-02');
});

test('UK country browsing includes GB and Northern Ireland without changing legal scopes', () => {
  const ukIds = filterRecords(model, { ...emptyState(), jurisdiction: 'jur-gb' }).map(record => record.id);
  assert.deepEqual(new Set(ukIds), new Set([
    'eu-gb-dpr-consultation', 'eu-northern-ireland-scope',
    'uk-construction-products-reform-white-paper', 'uk-toy-safety-dpp-consultation',
  ]));
  const gbIds = filterRecords(model, { ...emptyState(), jurisdiction: 'jur-gb-gbn' }).map(record => record.id);
  assert.equal(gbIds.length, 3);
  assert.ok(!gbIds.includes('eu-northern-ireland-scope'));
  assert.deepEqual(model.entities.get('eu-northern-ireland-scope').jurisdiction_ids, ['jur-gb-nir']);
  assert.deepEqual(model.entities.get('eu-gb-dpr-consultation').jurisdiction_ids, ['jur-gb-gbn']);
  assert.deepEqual(currentMap.jurisdictions.find(row => row.jurisdiction_id === 'jur-gb'), map.jurisdictions.find(row => row.jurisdiction_id === 'jur-gb'));
  for (const id of ukIds) {
    const row = model.scopes.get('jur-gb').get(id);
    assert.equal(row.scope_basis, 'territorial_display_rollup');
    assert.ok(row.territorial_scopes.every(scope => ['jur-gb-gbn', 'jur-gb-nir'].includes(scope.jurisdiction_id)));
  }
});

test('Swiss and Norwegian additions distinguish consultation proposals from adoption', () => {
  const swiss = model.entities.get('global-ch-thg-dpp-proposal');
  const norway = model.entities.get('global-no-battery-registry-consultation');
  assert.equal(swiss.type, 'Policy');
  assert.equal(swiss.status.value, 'draft_consultation_closed');
  assert.equal(swiss.dates.find(date => date.kind === 'consultation_closed').date, '2026-09-28');
  assert.match(swiss.status.scope_note, /not an enacted Swiss DPP requirement/);
  assert.equal(norway.type, 'Policy');
  assert.equal(norway.status.value, 'closed_consultation_current_adoption_unverified');
  assert.equal(norway.dates.find(date => date.kind === 'consultation_closed').date, '2026-05-11');
  assert.match(norway.status.scope_note, /adoption.*not established/);
  for (const entity of [swiss, norway]) {
    const links = graph.edges.filter(edge => edge.source === entity.id);
    assert.ok(links.length > 0);
    assert.ok(links.every(edge => edge.assertion.predicate === 'references' && edge.assertion.interoperability === null));
    assert.ok(filterRecords(model, { ...emptyState(), jurisdiction: entity.jurisdiction_ids[0] }).some(record => record.id === entity.id));
  }
});

test('Taiwan adds a map join and three distinct records without treating pilot coverage as adoption', () => {
  const taiwan = model.entities.get('jur-tw');
  assert.equal(taiwan.type, 'Jurisdiction');
  assert.equal(taiwan.geography.iso_alpha3, 'TWN');
  assert.equal(taiwan.status.value, 'research_defined');
  assert.match(taiwan.status.scope_note, /does not establish a universal DPP obligation/);
  const records = filterRecords(model, { ...emptyState(), jurisdiction: 'jur-tw' });
  assert.equal(records.length, 3);
  assert.deepEqual(new Set(records.map(record => record.type)), new Set(['LegalInstrument', 'Provision', 'Pilot']));
  assert.equal(model.entities.get('global-tw-product-information-art22').status.value, 'enabling_provision_in_force');
  assert.match(model.entities.get('global-tw-product-information-art22').status.scope_note, /specify covered products/);
  const pilot = model.entities.get('global-tw-dpp-voluntary-pilot');
  assert.equal(pilot.status.value, 'voluntary_pilot_reported');
  assert.match(pilot.status.scope_note, /not nationwide compliance/);
  assert.ok(!graph.nodes.some(record => record.id === 'jur-tw'));
  const row = currentMap.jurisdictions.find(row => row.jurisdiction_id === 'jur-tw');
  assert.equal(row.coverage, 'selected_direct_records');
  assert.equal(row.records.length, 3);
  assert.equal(row.records.filter(record => record.layer === 'legal_and_policy').length, 2);
  assert.equal(row.records.filter(record => record.layer === 'ecosystem_and_implementation').length, 1);
  for (const record of records) {
    assert.ok(currentMap.jurisdictions.filter(scope => scope.records.some(item => item.entity_id === record.id)).every(scope => scope.jurisdiction_id === 'jur-tw'));
  }
  assert.deepEqual(currentTaxonomy.geographic_associations, taxonomy.geographic_associations);
});


test('committee discussion, normative references and technical use remain different evidence relationships', () => {
  const report = 'std-w3c-dpp-committee-discussion-20260727';
  const incoming = graph.edges.filter(edge => edge.source === report);
  assert.equal(incoming.length, 4);
  assert.deepEqual(new Set(incoming.filter(edge => edge.assertion.predicate === 'references').map(edge => edge.target)), new Set(['std-iso-jtc5', 'std-cen-jtc24', 'std-w3c-vc2']));
  assert.equal(model.entities.get(report).status.value, 'recorded_technical_discussion');
  assert.match(model.entities.get(report).status.scope_note, /not a formal liaison/);
  for (const committee of ['std-iso-jtc5', 'std-cen-jtc24']) {
    const link = incoming.find(edge => edge.target === committee).assertion;
    assert.match(link.limitations.join(' '), /not a formal W3C liaison/);
    assert.ok(link.source_ids.includes('src-update-20261025-w3c-minutes'));
    assert.equal(link.interoperability, null);
  }
  assert.ok(!graph.edges.some(edge => edge.assertion.predicate === 'liaison_with' && /std-w3c-/.test(edge.source + edge.target)));
  assert.ok(!graph.edges.some(edge => edge.source === 'std-iso-jtc5' && /std-w3c-/.test(edge.target) && ['uses_standard', 'normatively_references'].includes(edge.assertion.predicate)));
  for (const id of ['std-w3c-did1', 'std-w3c-vc2']) {
    const link = graph.edges.find(edge => edge.source === 'std-en-18219-2026' && edge.target === id).assertion;
    assert.equal(link.predicate, 'normatively_references');
    assert.match(link.locator, /Clause 2.*page 8/);
    assert.deepEqual(link.source_ids, ['src-update-20261025-w3c-en18219']);
    assert.match(link.limitations.join(' '), /does not mandate.*every DPP/);
  }
  const informative = graph.edges.find(edge => edge.source === 'std-w3c-vc2' && edge.target === 'std-w3c-did1').assertion;
  assert.equal(informative.predicate, 'references');
  assert.match(informative.locator, /Informative references/);
  assert.match(informative.limitations.join(' '), /does not require every credential/);
});

test('all five ecosystem filters retain their evidenced W3C paths without adding inferred edges', () => {
  const report = 'std-w3c-dpp-committee-discussion-20260727';
  const cases = [
    ['iso-iec-jtc5', 'standards', 20, 23, [
      ['std-iso-jtc5', report, 'std-w3c-vc2', 'std-w3c-jsonld11'],
      ['std-iso-jtc5', 'std-cen-jtc24', 'std-en-18219-2026', 'std-w3c-did1'],
      [report, 'std-w3c-dpp-bw-tf', 'std-w3c-vcwg', 'std-w3c-vc2'],
    ]],
    ['cen-cenelec-jtc24', 'standards', 17, 25, [
      ['std-cen-jtc24', 'std-en-18219-2026', 'std-w3c-vc2', 'std-w3c-jsonld11'],
      ['std-cen-jtc24', report, 'std-w3c-dpp-bw-tf'],
    ]],
    ['untp', 'ecosystems', 11, 16, [
      ['std-untp', 'std-w3c-vc2', 'std-w3c-jsonld11'],
      ['std-untp', 'std-w3c-did1'],
      ['std-untp-dpp-0-8', 'std-w3c-vc2'],
      ['std-untp-dia', 'std-w3c-recognized'],
    ]],
    ['cirpass2', 'ecosystems', 8, 7, [
      ['std-cirpass2', 'std-cirpass2-ontology', 'std-w3c-owl2'],
      ['std-cirpass2-ontology', 'std-w3c-shacl'],
      ['std-cirpass2-ontology', 'std-w3c-dpp-vocabulary'],
    ]],
    ['w3c', 'standards', 21, 32, [
      ['std-w3c-vc2', 'std-en-18219-2026', 'std-cen-jtc24', 'std-iso-jtc5'],
      ['std-untp', 'std-w3c-vc2', 'std-w3c-jsonld11'],
      ['std-w3c-dpp-bw-tf', 'std-w3c-dpp-vocabulary', 'std-cirpass2-ontology', 'std-w3c-owl2'],
    ]],
  ];
  for (const [id, key, nodeCount, edgeCount, paths] of cases) {
    const visible = graphData(model, filterRecords(model, { ...emptyState(), [key]: [id] }));
    assert.equal(visible.nodes.length, nodeCount, id);
    assert.equal(visible.edges.length, edgeCount, id);
    const nodeIds = new Set(visible.nodes.map(node => node.id));
    for (const path of paths) for (let index = 0; index < path.length; index++) {
      assert.ok(nodeIds.has(path[index]), `${id}: visible ${path[index]}`);
      if (index) {
        const source = path[index - 1], target = path[index];
        const edge = visible.edges.find(edge => edge.source === source && edge.target === target || edge.source === target && edge.target === source);
        assert.ok(edge, `${id}: sourced step ${source} / ${target}`);
        assert.deepEqual(edge.assertion, current.assertions.find(assertion => assertion.id === edge.id));
      }
    }
  }
  const withoutNavigation = clone(updates); delete withoutNavigation.navigation_groups;
  const unfiltered = applyEvidenceUpdates(baseline, withoutNavigation);
  assert.deepEqual(current.entities, unfiltered.entities, 'Editorial inclusion must not create entities');
  assert.deepEqual(current.assertions, unfiltered.assertions, 'Editorial inclusion must not invent evidence relationships');
  for (const group of updates.navigation_groups) assert.equal(group.membership_basis, 'editorial_filter');
});

test('editorial navigation rejects dangling references and unknown groups', () => {
  for (const mutate of [
    update => update.navigation_groups[0].entity_ids.push('missing-navigation-entity'),
    update => update.navigation_groups[0].source_ids.push('missing-navigation-source'),
    update => update.navigation_groups[0].membership_basis = 'formal_membership',
  ]) {
    const update = clone(updates); mutate(update);
    assert.throws(() => applyEvidenceUpdates(baseline, update), /Dangling navigation|Unqualified navigation/);
  }
  const unknown = clone(updates); unknown.navigation_groups[0].id = 'missing-navigation-group';
  assert.throws(() => applyEvidenceTaxonomyUpdates(taxonomy, unknown), /Missing navigation group/);
});

test('W3C standards, draft documents and UNTP release boundaries remain qualified', () => {
  for (const id of ['std-w3c-vc2', 'std-w3c-did1', 'std-w3c-jsonld11', 'std-w3c-owl2', 'std-w3c-shacl']) {
    assert.equal(model.entities.get(id).status.value, 'recommendation', id);
  }
  assert.equal(model.entities.get('std-w3c-recognized').status.value, 'experimental_working_draft');
  assert.equal(model.entities.get('std-w3c-dpp-vocabulary').status.value, 'unofficial_proposal');
  assert.equal(model.entities.get('std-w3c-bw-vocabulary').status.value, 'tentative_deliverable');
  assert.equal(model.entities.get('std-w3c-ucr').status.value, 'work_in_progress');
  const technical = updates.assertions.filter(assertion => assertion.predicate === 'uses_standard' && assertion.subject.startsWith('std-untp'));
  assert.equal(technical.length, 7);
  for (const assertion of technical) {
    assert.notEqual(assertion.subject, 'std-untp-0-7');
    assert.match(assertion.limitations.join(' '), /working|Working/);
    assert.match(assertion.limitations.join(' '), /0\.7\.0/);
    assert.equal(assertion.interoperability, null);
  }
});
