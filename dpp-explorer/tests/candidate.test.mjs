import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadCandidate, assembleCandidate, candidateSchema, validateCandidate, candidateProjections, candidateJsonLd } from '../scripts/candidate-release.mjs';
import { applyEvidenceUpdates } from '../src/evidence-updates.js';
import { createGraphExport } from '../src/graph-export.js';
import { loadAtlasData, timelineRows, timelinePrecisionLabel } from '../src/atlas-data.js';
import { createModel, filterRecords, graphData, emptyState, currentAssertions, parseState } from '../src/model.js';
import {createRegulatoryModel,regulationMapProfile} from '../src/regulation.js';

const clone = value => structuredClone(value);
const json = async relative => JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'));
const baselineUrl = new URL('../../dpp-research/releases/0.1.0/dataset.json', import.meta.url);
const baselineBytes = await readFile(baselineUrl);
const baseline = JSON.parse(baselineBytes);
const baselineSchema = await json('../../dpp-research/releases/0.1.0/dataset.schema.json');
const candidate = await loadCandidate();
const { dataset, schema, changeManifest, calendar, taxonomy, regulatory, views, graph } = candidate;
const retained = applyEvidenceUpdates(baseline, candidate.updates);
const model = createModel(dataset, views.world_map, taxonomy);
model.calendar = calendar;
model.timeline = views.timeline;
model.regulatory=createRegulatoryModel(model,regulatory);
const byId = new Map(dataset.entities.map(entity => [entity.id, entity]));
const sourceIds = new Set(dataset.sources.map(source => source.id));
const assertionIds = new Set(dataset.assertions.map(assertion => assertion.id));
const validate = (data = dataset, events = calendar) => validateCandidate(data, schema, changeManifest, events);

test('quarter windows sort chronologically without inventing dates or losing their conditions',()=>{
  const before=JSON.stringify(calendar),rows=timelineRows(model,model.records);
  const steel=rows.findIndex(event=>event.id==='steel-measure-adoption');
  const february=rows.findIndex(event=>event.date.value==='2027-02-18');
  assert.ok(steel>=0&&february>=0&&steel<february);
  const event=rows[steel];assert.equal(event.date.value,'2026');assert.equal(event.date.precision,'year');
  assert.equal(timelinePrecisionLabel(event),'Indicative planning window');
  assert.equal(JSON.stringify(calendar),before);
  assert.equal(rows.length,calendar.events.length);
});

test('Chinese standards planning and enabling provisions cannot drive an applicable-duties colour',()=>{
  const profile=regulatory.profiles.find(p=>p.jurisdiction_id==='jur-cn');
  for(const id of ['global-cn-dpp-general-project','global-cn-digital-id-art12']){
    assert.ok(profile.related_record_ids.includes(id));assert.ok(!profile.record_ids.includes(id));
    assert.equal(regulationMapProfile(model,'jur-cn',[model.entities.get(id)]),null);
  }
  assert.equal(regulationMapProfile(model,'jur-cn',profile.record_ids.map(id=>model.entities.get(id))).phase,'applying');
  assert.ok(changeManifest.regulatory_overlay_corrections.some(c=>c.id==='phase-cn-applying-basis-20261025'));
});

test('candidate is a distinct, unreviewed edition with reconciled denominators', () => {
  assert.deepEqual(candidate.validation.counts, {
    entities: 268, substantive_records: 192, assertions: 364, active_assertions: 361,
    graph_edges: 205, sources: 188, source_identities: 171,
  });
  assert.equal(dataset.metadata.version, '0.2.0');
  assert.equal(dataset.metadata.schema_version, '0.2.0');
  assert.equal(dataset.metadata.previous_version, '0.1.0');
  assert.equal(dataset.metadata.release_status, 'candidate');
  assert.equal(dataset.metadata.evidence_cutoff, '2026-10-25');
  assert.equal(candidate.manifest.sealed, false);
  assert.equal(candidate.validation.human_reviewed_assertions, 0);
  assert.ok(dataset.assertions.every(assertion => assertion.review_status === 'machine_assisted_unreviewed'));
  assert.equal(graph.nodes.length, candidate.validation.counts.substantive_records);
  assert.equal(graph.edges.length, candidate.validation.counts.graph_edges);
  assert.equal(currentAssertions(dataset).length, candidate.validation.counts.active_assertions);
});

test('assembly leaves the sealed input and retained observations intact except declared revisions', async () => {
  const inputs = clone({ baseline, updates: candidate.updates, batches: candidate.batches });
  const before = clone(inputs);
  assembleCandidate(inputs.baseline, inputs.updates, inputs.batches);
  assert.deepEqual(inputs, before);
  const revised = new Set(changeManifest.changes.filter(change => change.operation === 'revise').map(change => change.id));
  for (const entity of retained.entities) {
    if (!revised.has(entity.id)) assert.deepEqual(byId.get(entity.id), entity, entity.id);
    else assert.deepEqual(changeManifest.changes.find(change => change.operation === 'revise' && change.id === entity.id).previous, entity);
  }
  for (const assertion of retained.assertions) {
    const actual = clone(dataset.assertions.find(row => row.id === assertion.id));
    delete actual.curation;
    assert.deepEqual(actual, assertion, assertion.id);
  }
  for (const source of retained.sources) {
    if (revised.has(source.id)) continue;
    const actual = dataset.sources.find(row => row.id === source.id);
    for (const [key, value] of Object.entries(source)) assert.deepEqual(actual[key], value, `${source.id}.${key}`);
    assert.ok(Object.keys(actual).every(key => key in source || key === 'source_identity_id'));
  }
  assert.deepEqual(await readFile(baselineUrl), baselineBytes);
  assert.equal(createHash('sha256').update(baselineBytes).digest('hex'), '2c6e9d377bf265bc7edf288ee95cd5cd75955dbed4298cf5fa7f7c649b3134f1');
  assert.deepEqual(candidateSchema(baselineSchema), schema);
  assert.ok(!baselineSchema.$defs.Metadata.properties.release_status.enum.includes('candidate'));
});

test('superseded claims remain auditable but cannot become current graph edges', () => {
  const superseded = dataset.assertions.filter(assertion => assertion.curation?.status === 'superseded');
  assert.equal(superseded.length, 3);
  const visibleEdges = new Set(graphData(model, model.records).edges.map(edge => edge.id));
  for (const assertion of superseded) {
    assert.ok(graph.assertions.some(row => row.id === assertion.id));
    assert.ok(!visibleEdges.has(assertion.id));
    assert.ok(!graph.edges.some(row => row.id === assertion.id));
    assert.ok(assertion.curation.reason);
    for (const replacement of assertion.curation.replacement_ids) {
      assert.ok(assertionIds.has(replacement));
      assert.ok(currentAssertions(dataset).some(row => row.id === replacement));
    }
  }
});

test('all projections resolve to canonical records, sources and active claims', () => {
  const projected = candidateProjections(dataset);
  for (const jurisdiction of projected.world_map.jurisdictions) {
    assert.equal(byId.get(jurisdiction.jurisdiction_id).type, 'Jurisdiction');
    for (const row of jurisdiction.records) {
      assert.ok(byId.has(row.entity_id));
      assert.deepEqual(row.status, byId.get(row.entity_id).status);
      assert.ok(row.source_ids.every(id => sourceIds.has(id)));
      if (row.membership_assertion_id) assert.ok(assertionIds.has(row.membership_assertion_id));
    }
  }
  for (const event of projected.timeline) {
    const record = byId.get(event.entity_id);
    assert.ok(record.dates.some(date => date.kind === event.kind && date.date === event.date && date.precision === event.precision));
    assert.ok(event.source_ids.every(id => sourceIds.has(id)));
  }
  for (const row of projected.standards) assert.deepEqual(row.source_ids, byId.get(row.id).source_ids);
  for (const row of projected.review_queue) assert.equal(row.review_status, 'machine_assisted_unreviewed');
  assert.ok(projected.interoperability.every(row => currentAssertions(dataset).some(assertion => assertion.id === row.assertion_id)));
  assert.ok(projected.interoperability_matrix.filter(row => row.coding_status === 'not_assessed').every(row => row.result === 'not_tested'));
});

test('JSON-LD reifies qualifications, proposal types and supersession instead of asserting unconditional facts', () => {
  const ld = candidateJsonLd(dataset);
  const ns = dataset.metadata.namespace;
  const nodes = new Map(ld['@graph'].map(node => [node['@id'], node]));
  for (const assertion of dataset.assertions) {
    const node = nodes.get(ns + assertion.id);
    assert.ok(node['@type'].includes('rdf:Statement'));
    assert.equal(node['rdf:subject']['@id'], ns + assertion.subject);
    assert.equal(node['rdf:predicate']['@id'], ns + assertion.predicate);
    assert.equal(node['atlas:assertionType'], assertion.assertion_type);
    assert.equal(node['atlas:evidenceType'], assertion.evidence_type);
    assert.equal(node['atlas:curationStatus'], assertion.curation?.status || 'active');
    assert.deepEqual(node['atlas:observedAt'], { '@value': assertion.observed_at, '@type': 'xsd:date' });
    assert.ok(node['prov:wasDerivedFrom'].every(source => nodes.has(source['@id'])));
    assert.ok(!(ns + assertion.predicate in nodes.get(ns + assertion.subject)));
    if (assertion.curation) assert.deepEqual(node['atlas:replacedBy'].map(item => item['@id']), assertion.curation.replacement_ids.map(id => ns + id));
  }
  const proposal = dataset.assertions.filter(assertion => assertion.subject === 'report-proposed-wallet-policy-evidence-architecture');
  assert.ok(proposal.length > 0 && proposal.every(assertion => assertion.assertion_type === 'research_classification'));
  assert.equal(byId.get('report-proposed-wallet-policy-evidence-architecture').status.value, 'proposed_architecture');
});

test('filtered graph exports retain resolvable history and regulatory context without hidden nodes', () => {
  const selected = ['std-untp-dia', 'eu-dpp-registry'];
  const output = createGraphExport(dataset, { records: selected, regulatoryProfiles: regulatory, exportedAt: null });
  assert.deepEqual(new Set(output.nodes.map(node => node.id)), new Set(selected));
  const entities = new Set([...output.nodes, ...output.context_entities].map(entity => entity.id));
  const assertions = new Set(output.assertions.map(assertion => assertion.id));
  const sources = new Set(output.sources.map(source => source.id));
  for (const assertion of output.assertions) {
    assert.ok(entities.has(assertion.subject));
    if (assertion.object.entity_id) assert.ok(entities.has(assertion.object.entity_id));
    assert.ok(assertion.source_ids.every(id => sources.has(id)));
    for (const id of assertion.curation?.replacement_ids || []) assert.ok(assertions.has(id));
  }
  for (const source of output.sources) assert.ok(sources.has(source.source_identity_id));
  for (const profile of output.regulatory_profiles?.profiles || []) {
    for (const id of [...(profile.record_ids || []), ...(profile.related_record_ids || [])]) assert.ok(entities.has(id), id);
  }
  assert.ok(output.edges.every(edge => selected.includes(edge.source) && selected.includes(edge.target)));
});

test('calendar preserves deadlines, announcements, conditional duties and research checkpoints as different claims', () => {
  const event = id => calendar.events.find(row => row.id === id);
  assert.equal(event('registry-establishment-deadline').date.value, '2026-07-19');
  assert.equal(event('registry-establishment-deadline').event_role, 'statutory_deadline');
  assert.equal(event('registry-availability-announcement').date.value, '2026-07-20');
  assert.equal(event('registry-availability-announcement').event_role, 'availability_announcement');
  assert.match(event('registry-availability-announcement').caveats.join(' '), /No live/i);
  const adopted = event('registry-regulation-adoption');
  const published = event('registry-regulation-publication');
  assert.notEqual(adopted.date.value, published.date.value);
  assert.ok(published.observed_at > published.date.value);
  assert.equal(event('battery-passport-application').date.value, '2027-02-18');
  for (const id of ['construction-system-operation', 'construction-passport-application']) {
    assert.equal(event(id).date.value, null);
    assert.equal(event(id).date.precision, 'conditional');
    assert.ok(event(id).date.condition);
  }
  assert.ok(calendar.checkpoints.every(row => row.event_role === 'review_checkpoint'));
  assert.ok(!timelineRows(model, model.records).some(row => calendar.checkpoints.some(checkpoint => checkpoint.id === row.id)));
  assert.ok(timelineRows(model, [byId.get('eu-dpp-registry')]).every(row => row.record_ids.includes('eu-dpp-registry')));
  const futurePaper = timelineRows(model, [byId.get('report-grimm-aas-rdf-2026')], 'evidence');
  assert.ok(futurePaper.some(row => row.event_role === 'workshop_scheduled' && row.date.value === '2026-10-26' && row.observed_at === '2026-10-25'));
});

test('validation rejects invented dates, unsupported references and unearned evidence upgrades', () => {
  for (const collection of ['events', 'checkpoints']) {
    for (const date of [{ precision: 'day', value: '2027-02-30' }, { precision: 'day', value: null }, { precision: 'month', value: '2027-13' }, { precision: 'year', value: '2027-01-01' }, { precision: 'conditional', value: '2027-01-01', condition: 'future act' }, { precision: 'conditional', value: null, condition: null }]) {
      const bad = clone(calendar); bad[collection][0].date = date;
      assert.throws(() => validate(dataset, bad), `${collection}: ${JSON.stringify(date)}`);
    }
  }
  for (const mutate of [
    data => data.assertions[0].object = { entity_id: 'missing-record' },
    data => data.assertions[0].source_ids = ['missing-source'],
    data => data.assertions[0].review_status = 'human_reviewed',
    data => data.assertions[0].observed_at = '2026-10-26',
    data => data.sources.find(source => source.access_status === 'opened').retrieved_at = null,
    data => data.entities.find(entity => entity.id === 'std-dsp-2025-1-err2').evidence_status = 'primary_rechecked',
  ]) {
    const bad = clone(dataset); mutate(bad); assert.throws(() => validate(bad));
  }
  for (const id of ['std-dsp-2025-1-err2', 'std-dcp-1-0-1']) {
    assert.equal(byId.get(id).dates[0].date, null);
    assert.equal(byId.get(id).dates[0].precision, 'unknown');
  }
});

test('historical loader never fetches candidate or regulatory overlays', async () => {
  const paths = [];
  const historical = await loadAtlasData(async path => {
    paths.push(path);
    if (path === 'data/dataset.json') return clone(baseline);
    return path.endsWith('timeline.json') ? [] : {};
  }, '0.1.0');
  assert.equal(historical.historical, true);
  assert.equal(historical.dataset.metadata.version, '0.1.0');
  assert.ok(paths.every(path => !/current|candidate|regulatory/.test(path)));
  assert.deepEqual(historical.regulatory.profiles, []);
  assert.deepEqual(historical.calendar.events, []);
  assert.ok(paths.includes('releases/0.1.0/views/timeline.json'));
  const currentPaths = [];
  await loadAtlasData(async path => { currentPaths.push(path); return path.includes('dataset') ? dataset : {}; });
  assert.ok(currentPaths.includes('data/current-dataset.json'));
  assert.ok(currentPaths.includes('data/current-regulatory-calendar.json'));
});

test('international AAS navigation distinguishes country evidence from global scope and mandates', () => {
  const records = filterRecords(model, { ...emptyState(), standards: ['aas-international'] });
  const ids = new Set(records.map(record => record.id));
  for (const id of ['std-cn-aas-20243452-t-604', 'std-kr-ks-x-iec-63278-1', 'global-kr-aas-reference-model-programme-2026', 'global-jp-aas-iec-participation-2024', 'global-us-de-aas-dpp-prototypes-2024']) assert.ok(ids.has(id));
  assert.deepEqual(byId.get('std-iec-63278-1').jurisdiction_ids, ['jur-global']);
  assert.equal(byId.get('std-cn-aas-20243452-t-604').status.value, 'under_approval');
  assert.equal(byId.get('std-kr-ks-x-iec-63278-1').status.value, 'published_national_standard');
  assert.equal(byId.get('global-us-de-aas-dpp-prototypes-2024').status.value, 'reported_prototypes');
  assert.equal(byId.get('global-jp-aas-iec-participation-2024').status.value, 'participant_report');
  assert.ok(views.world_map.jurisdictions.filter(row => row.geography.kind === 'country').every(row => !row.records.some(record => record.entity_id === 'std-iec-63278-1')));
  assert.equal(regulatory.profiles.find(profile => profile.jurisdiction_id === 'jur-gb').map_display, 'locator_only');
});

test('evidence filters support identifiers, versions, source text, access and claim type', () => {
  const records = state => filterRecords(model, { ...emptyState(), ...state });
  assert.ok(records({ q: 'std-dcp-1-0-1' }).some(record => record.id === 'std-dcp-1-0-1'));
  assert.ok(records({ q: '0.18.1' }).some(record => record.id === 'std-edc-connector-0-18-1'));
  assert.ok(records({ q: 'src-tech-20261025-odrl-model' }).some(record => record.id === 'std-w3c-odrl-model-2-2'));
  assert.ok(records({ q: 'eclipse-dataspace-dcp.github.io', access: 'search_snippet' }).some(record => record.id === 'std-dcp-1-0-1'));
  const analytical = records({ claim: 'research_classification' });
  assert.ok(analytical.some(record => record.id === 'report-proposed-wallet-policy-evidence-architecture'));
  assert.ok(analytical.every(record => model.assertionsByEntity.get(record.id).some(assertion => assertion.assertion_type === 'research_classification')));
  assert.equal(records({ observedAfter: '2026-10-26' }).length, 0);
  const parsed = parseState('q=0.18.1&access=opened&claim=research_classification&view=table', model);
  assert.equal(parsed.q, '0.18.1');
  assert.equal(parsed.access, 'opened');
  assert.equal(parsed.claim, 'research_classification');
  assert.equal(parsed.view, 'table');
});
