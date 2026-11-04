import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createModel, defaultState, emptyState, filterRecords, graphData, mapCounts, parseState, stateParams} from '../src/model.js';
import {applyEvidenceUpdates, applyEvidenceMapUpdates, applyEvidenceTaxonomyUpdates} from '../src/evidence-updates.js';
import {REGULATORY_PHASES, createRegulatoryModel, regulatoryProfile, regulationMapProfile, phaseLabel, jurisdictionOverviewState, jurisdictionDevelopments} from '../src/regulation.js';

const json = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const [baseline, baselineMap, taxonomy, updates, review] = await Promise.all([
  json('../../dpp-research/releases/0.1.0/dataset.json'),
  json('../../dpp-research/releases/0.1.0/views/world-map.json'),
  json('../src/data/ecosystems.json'),
  json('../src/data/evidence-updates.json'),
  json('../src/data/regulatory-phases.json'),
]);
const dataset = applyEvidenceUpdates(baseline, updates);
const map = applyEvidenceMapUpdates(baselineMap, updates);
const groups = applyEvidenceTaxonomyUpdates(taxonomy, updates);
const model = createModel(dataset, map, groups);
const inputsBefore = JSON.stringify({dataset, map, groups, review});
const scopeBefore = JSON.stringify([...model.scopes].map(([id, rows]) => [id, [...rows]]));
const fullGraphBefore = graphData(model, model.records);
const fullCountsBefore = mapCounts(model, model.records);
model.regulatory = createRegulatoryModel(model, review);
const state = patch => ({...defaultState(), ...patch});
const ids = records => records.map(record => record.id).sort();

// Phase colour is a dated research interpretation, not a country record count.
test('the unfiltered map landing defaults to regulation while reset/filter state remains explicit', () => {
  assert.equal(defaultState().mapMode, 'regulation');
  assert.equal(emptyState().mapMode, 'coverage');
  for (const url of ['', '?view=map', '?embed=map', '?view=map&embed=map']) {
    assert.equal(parseState(url, model).mapMode, 'regulation', url);
  }
  for (const view of ['graph', 'table']) assert.equal(parseState(`?view=${view}`, model).mapMode, 'coverage');
  const first = defaultState();
  first.standards.push('w3c');
  assert.deepEqual(defaultState().standards, [], 'new landing state must not share mutable filters');
});

test('existing filtered and evidence links retain coverage without an explicit mode', () => {
  for (const url of [
    '?standards=w3c&jurisdiction=jur-global', '?standards=iso-iec-jtc5',
    '?ecosystems=untp', '?jurisdiction=jur-cn', '?q=battery', '?layer=legal',
    '?sector=sec-batteries', '?status=enacted', '?focus=std-untp',
    '?selected=std-iso-jtc5', '?assertion=example',
  ]) assert.equal(parseState(url, model).mapMode, 'coverage', url);
  assert.equal(parseState('?mapMode=unknown', model).mapMode, 'regulation');
  assert.equal(parseState('?mapMode=unknown&standards=w3c', model).mapMode, 'coverage');
});

test('explicit map mode survives country inspection and share-link round trips in every view', () => {
  for (const mapMode of ['regulation', 'coverage']) {
    for (const view of ['map', 'graph', 'table']) {
      const selected = {...emptyState(), mapMode, view, jurisdiction: 'jur-cn'};
      assert.deepEqual(parseState(stateParams(selected), model), selected);
      assert.equal(parseState(`?view=${view}&jurisdiction=jur-cn&mapMode=${mapMode}`, model).mapMode, mapMode);
    }
  }
});

test('the regulation view contains only explicitly reviewed evidence and excludes global standards', () => {
  const records = filterRecords(model, defaultState());
  assert.deepEqual(ids(records), [...model.regulatory.recordIds].sort());
  assert.ok(records.length > 0 && records.length < model.records.length);
  for (const id of ['std-w3c-vc2', 'std-w3c-did1', 'std-untp', 'std-iso-jtc5', 'std-cen-jtc24']) {
    assert.ok(model.entities.has(id), id);
    assert.equal(model.regulatory.recordIds.has(id), false, id);
  }
  for (const groupId of ['w3c', 'iso-iec-jtc5', 'untp']) {
    const globalStandards = model.groups.find(group => group.id === groupId).entity_ids
      .map(id => model.entities.get(id))
      .filter(record => record?.jurisdiction_ids.includes('jur-global') && ['Standard', 'Specification', 'Ontology', 'Committee'].includes(record.type));
    assert.ok(globalStandards.length > 0, groupId);
    assert.ok(globalStandards.every(record => !model.regulatory.recordIds.has(record.id)), groupId);
  }
  assert.deepEqual(ids(filterRecords(model, emptyState())), ids(model.records), 'coverage remains the full dataset');
});

test('the review keeps applying, adopted and proposed phases distinct with territorial qualifications', () => {
  const china = regulatoryProfile(model, 'jur-cn');
  const eu = regulatoryProfile(model, 'jur-eu');
  const uk = regulatoryProfile(model, 'jur-gb');
  assert.equal(china.phase, 'applying');
  assert.equal(eu.phase, 'adopted');
  assert.equal(uk.phase, 'proposal');
  assert.equal(uk.scope_kind, 'territorial');
  assert.match(phaseLabel(uk), /territorial scope/);
  assert.match(uk.caveats.join(' '), /Great Britain|UK-wide|Northern Ireland/);
  assert.match(eu.caveats.join(' '), /future|not yet|no general|not.*every product/i);
  assert.equal(phaseLabel(null), 'Not assessed in this phase review');
  for (const profile of model.regulatory.profiles.values()) {
    assert.ok(REGULATORY_PHASES[profile.phase], profile.jurisdiction_id);
    assert.equal(profile.checked_at, review.checked_at);
    assert.ok(profile.caveats.length && profile.sources.every(source => source.url.startsWith('https://') && source.locator));
  }
});

test('EU display joins carry the shared instrument phase without implying a national review', () => {
  for (const id of ['jur-de', 'jur-fr']) {
    const profile = regulatoryProfile(model, id);
    assert.equal(profile.phase, 'adopted');
    assert.equal(profile.scope_kind, 'eu_join');
    assert.match(phaseLabel(profile), /EU scope/);
    assert.match(profile.caveats.join(' '), /not a separate review of national implementation/);
    assert.equal(model.regulatory.profiles.has(id), false, 'the shared view must not insert a country profile');
  }
});

test('Norway and Northern Ireland never inherit the EU phase automatically', () => {
  const profiles = new Map(model.regulatory.profiles);
  profiles.delete('jur-no');
  profiles.delete('jur-gb-nir');
  const withoutExplicitProfiles = {...model, regulatory: {...model.regulatory, profiles}};
  assert.equal(regulatoryProfile(withoutExplicitProfiles, 'jur-no'), null);
  assert.equal(regulatoryProfile(withoutExplicitProfiles, 'jur-gb-nir'), null);
  assert.equal(regulatoryProfile(withoutExplicitProfiles, 'jur-unknown'), null);
});

test('filters can hide reviewed evidence but cannot promote or recompute its regulatory phase', () => {
  const all = filterRecords(model, defaultState());
  assert.equal(regulationMapProfile(model, 'jur-cn', all)?.phase, 'applying');
  assert.equal(regulationMapProfile(model, 'jur-eu', all)?.phase, 'adopted');
  const uk = regulatoryProfile(model, 'jur-gb');
  for (const recordId of uk.record_ids) {
    assert.equal(regulationMapProfile(model, 'jur-gb', [model.entities.get(recordId)])?.phase, 'proposal');
  }
  const chinaOnly = filterRecords(model, state({jurisdiction: 'jur-cn'}));
  assert.ok(chinaOnly.length > 0);
  assert.ok(chinaOnly.every(record => model.regulatory.recordIds.has(record.id)));
  assert.equal(regulationMapProfile(model, 'jur-gb', chinaOnly), null);
  assert.equal(regulationMapProfile(model, 'jur-cn', []), null);
  const unrelated = [model.entities.get('std-untp')];
  assert.equal(regulationMapProfile(model, 'jur-cn', unrelated), null);
});

test('review construction rejects missing qualifications and dangling evidence', () => {
  const invalid = edit => { const copy = structuredClone(review); edit(copy); return copy; };
  for (const [label, edit] of [
    ['missing review date', value => value.checked_at = ''],
    ['unqualified review', value => value.review_status = 'verified'],
    ['duplicate jurisdiction', value => value.profiles.push(structuredClone(value.profiles[0]))],
    ['non-jurisdiction', value => value.profiles[0].jurisdiction_id = 'std-untp'],
    ['unknown phase', value => value.profiles[0].phase = 'complete'],
    ['unknown scope', value => value.profiles[0].scope_kind = 'worldwide'],
    ['missing summary', value => value.profiles[0].summary = ''],
    ['missing caveat', value => value.profiles[0].caveats = []],
    ['mismatched date', value => value.profiles[0].checked_at = '2025-01-01'],
    ['missing evidence', value => value.profiles[0].record_ids = []],
    ['dangling evidence', value => value.profiles[0].record_ids = ['missing-record']],
    ['structural evidence', value => value.profiles[0].record_ids = ['jur-cn']],
    ['dangling related evidence', value => value.profiles[0].related_record_ids = ['missing-record']],
    ['missing sources', value => value.profiles[0].sources = []],
    ['missing source locator', value => value.profiles[0].sources[0].locator = ''],
    ['non-web source', value => value.profiles[0].sources[0].url = 'file:///untrusted'],
  ]) assert.throws(() => createRegulatoryModel(model, invalid(edit)), Error, label);
});

test('phase review and filtering leave source data, jurisdiction joins, graph edges and counts unchanged', () => {
  for (const jurisdiction of model.jurisdictions) regulatoryProfile(model, jurisdiction.jurisdiction_id);
  filterRecords(model, state({jurisdiction: 'jur-gb'}));
  assert.equal(JSON.stringify({dataset, map, groups, review}), inputsBefore);
  assert.equal(JSON.stringify([...model.scopes].map(([id, rows]) => [id, [...rows]])), scopeBefore);
  assert.deepEqual(graphData(model, model.records), fullGraphBefore);
  assert.deepEqual(mapCounts(model, model.records), fullCountsBefore);
});


test('every jurisdiction dropdown choice clears conflicting filters and preserves all three views', () => {
  assert.equal(model.jurisdictions.length, 53, 'audit every currently selectable jurisdiction/scope');
  for (const view of ['map', 'graph', 'table']) {
    const conflicting = Object.freeze({...emptyState(), view, jurisdiction:'jur-global',
      standards:Object.freeze(['w3c']), ecosystems:Object.freeze(['untp']), sector:'sec-batteries',
      status:'recommendation', layer:'standards', q:'no-matching-geographic-evidence', focus:'std-untp'});
    const before = JSON.stringify(conflicting);
    for (const jurisdiction of model.jurisdictions) {
      const next = jurisdictionOverviewState(model, conflicting, jurisdiction.jurisdiction_id);
      assert.equal(next.view, view, jurisdiction.jurisdiction_id);
      assert.equal(next.jurisdiction, jurisdiction.jurisdiction_id);
      assert.equal(next.mapMode, regulatoryProfile(model,jurisdiction.jurisdiction_id)?'regulation':'coverage');
      for (const key of ['q','sector','status','layer','focus']) assert.equal(next[key], '', key);
      assert.deepEqual(next.standards, []);
      assert.deepEqual(next.ecosystems, []);
      assert.ok(filterRecords(model,next).length>0, `${jurisdiction.jurisdiction_id} must not inherit an empty topic intersection`);
    }
    assert.equal(JSON.stringify(conflicting), before, 'navigation must not mutate the old state');
  }
});

test('UK overview escapes a W3C-only topic and retains GB and Northern Ireland scope qualifications', () => {
  const w3c = {...emptyState(),standards:['w3c'],jurisdiction:'jur-global',view:'graph'};
  assert.equal(filterRecords(model,{...w3c,jurisdiction:'jur-gb'}).length,0,'reproduce the former empty intersection');
  const next = jurisdictionOverviewState(model,w3c,'jur-gb');
  assert.equal(next.mapMode,'regulation');
  assert.equal(next.view,'graph');
  assert.deepEqual(ids(filterRecords(model,next)),[
    'eu-gb-dpr-consultation','eu-northern-ireland-scope',
    'uk-construction-products-reform-white-paper','uk-toy-safety-dpp-consultation',
  ].sort());
  assert.equal(regulatoryProfile(model,'jur-gb').phase,'proposal');
  assert.equal(model.scopes.get('jur-gb').get('eu-gb-dpr-consultation').scope_basis,'territorial_display_rollup');
  assert.deepEqual(model.entities.get('eu-gb-dpr-consultation').jurisdiction_ids,['jur-gb-gbn']);
});

test('California and Paraná are independently selectable reviewed territories without inherited national duties', () => {
  for (const [id,phase,record] of [
    ['jur-us-ca','adopted','global-us-ca-sb615'],
    ['jur-br-pr','early','global-br-pr-vehicle-pilot'],
  ]) {
    const profile=regulatoryProfile(model,id);
    assert.equal(profile?.phase,phase);
    assert.equal(profile.scope_kind,'territorial');
    assert.deepEqual(profile.record_ids,[record]);
    assert.deepEqual(ids(filterRecords(model,jurisdictionOverviewState(model,emptyState(),id))),[record]);
    assert.deepEqual(model.entities.get(record).jurisdiction_ids,[id]);
  }
});

test('empty or unknown jurisdiction selections return the default lens without changing the chosen tab', () => {
  for (const view of ['map','graph','table']) {
    for (const id of ['',undefined,'jur-not-known']) {
      const next=jurisdictionOverviewState(model,{...emptyState(),view,standards:['w3c'],q:'W3C'},id);
      assert.deepEqual(next,{...defaultState(),view});
    }
  }
  for (const id of ['jur-global','jur-europe']) {
    assert.equal(jurisdictionOverviewState(model,defaultState(),id).mapMode,'coverage');
  }
});

test('jurisdiction developments expose every scoped legal record regardless of the topic view', () => {
  for (const jurisdiction of model.jurisdictions) {
    const scope=model.scopes.get(jurisdiction.jurisdiction_id);
    const developments=jurisdictionDevelopments(model,jurisdiction.jurisdiction_id);
    const developmentIds=new Set(ids(developments));
    for (const record of model.records.filter(record=>scope.has(record.id)&&['LegalInstrument','Provision','Requirement','Policy'].includes(record.type))) {
      assert.ok(developmentIds.has(record.id), `${jurisdiction.jurisdiction_id}: omitted ${record.id}`);
    }
    assert.ok(developments.every(record=>scope.has(record.id)),jurisdiction.jurisdiction_id);
    assert.deepEqual(developments.map(record=>record.label),developments.map(record=>record.label).sort((a,b)=>a.localeCompare(b)));
  }
  const euIds=new Set(ids(jurisdictionDevelopments(model,'jur-eu')));
  for (const id of ['eu-construction-passport-requirement','eu-toy-passport-requirement','eu-detergent-passport-requirement','eu-vehicle-passport-requirement']) assert.ok(euIds.has(id),id);
  assert.deepEqual(jurisdictionDevelopments(model,'jur-not-known'),[]);
  assert.equal(JSON.stringify({dataset,map,groups,review}),inputsBefore);
});

test('planned European Product Act is discoverable without driving an adopted phase colour', () => {
  const id='eu-european-product-act', eu=regulatoryProfile(model,'jur-eu');
  assert.ok(eu.related_record_ids.includes(id));
  assert.equal(eu.record_ids.includes(id),false,'planned reform must not serve as adopted-phase evidence');
  assert.ok(model.regulatory.recordIds.has(id),'related proposal remains discoverable in the regulatory lens');
  assert.ok(jurisdictionDevelopments(model,'jur-eu').some(record=>record.id===id));
  const filtered=filterRecords(model,state({q:'eu-european-product-act'}));
  assert.deepEqual(ids(filtered),[id]);
  assert.equal(regulationMapProfile(model,'jur-eu',filtered),null);
  for (const country of ['jur-de','jur-fr']) {
    assert.equal(regulatoryProfile(model,country).phase,'adopted');
    assert.equal(regulationMapProfile(model,country,filtered),null,'an EU membership join must not turn a proposal into an adopted measure');
  }
});


test('newly assessed guidance and public pilots remain early, with Busan distinct from national Korean duties', () => {
  for (const id of ['jur-bd','jur-eg','jur-sg','jur-kr-26']) {
    const profile=regulatoryProfile(model,id);
    assert.equal(profile?.phase,'early',id);
    assert.ok(profile.caveats.length && profile.sources.every(source=>source.locator),id);
    const next=jurisdictionOverviewState(model,{...emptyState(),standards:['w3c']},id);
    assert.equal(next.mapMode,'regulation');
    assert.ok(filterRecords(model,next).length>0,id);
  }
  assert.deepEqual(regulatoryProfile(model,'jur-bd').record_ids,['global-bd-export-dpp-guidance']);
  assert.equal(regulatoryProfile(model,'jur-kr-26').scope_kind,'territorial');
  assert.equal(regulatoryProfile(model,'jur-kr').phase,'applying','local pilot must not replace the national duties assessment');
  assert.equal(model.entities.get('global-eg-goeic-dpp-programme').status.value,'public_programme_announced');
  assert.equal(model.entities.get('global-bd-export-dpp-guidance').type,'Report');
});
