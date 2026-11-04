const STRUCTURAL = new Set(['Jurisdiction', 'Sector', 'Concept']);
const clone = value => structuredClone(value);

function date(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error(`Invalid ${label}`);
}
function list(value, label) {
  if (!Array.isArray(value)) throw new Error(`Expected ${label} array`);
  return value;
}
function idMap(items, label) {
  const result = new Map();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id) throw new Error(`Invalid ${label} ID`);
    if (result.has(item.id)) throw new Error(`Duplicate ${label} ID: ${item.id}`);
    result.set(item.id, item);
  }
  return result;
}
function provenance(base, updates) {
  date(updates.checked_at, 'update check date');
  if (!updates.id || !updates.description || updates.base_version !== base) throw new Error('Evidence update must identify the matching base version');
  return {
    id: updates.id,
    checked_at: updates.checked_at,
    base_version: updates.base_version,
    review_status: updates.review_status,
    description: updates.description,
    relationship_definitions: clone(updates.relationship_definitions || {}),
    batches: clone(updates.batches || []),
    navigation_groups: clone(updates.navigation_groups || []),
  };
}
function references(ids, known, label) {
  for (const id of list(ids || [], label)) if (!known.has(id)) throw new Error(`Dangling ${label}: ${id}`);
}
function validateSources(record, sources, required = false) {
  if (required && !record.source_ids?.length) throw new Error(`Missing source references: ${record.id}`);
  references(record.source_ids, sources, `source reference on ${record.id}`);
}

/** Add dated evidence without altering or relabelling the frozen release. */
export function applyEvidenceUpdates(dataset, updates) {
  if (dataset.metadata?.evidence_updates) throw new Error('Evidence update already applied');
  const note = provenance(dataset.metadata?.version, updates);
  const merged = clone(dataset);
  for (const kind of ['entities', 'assertions', 'sources']) {
    merged[kind] = [...list(merged[kind], kind), ...clone(list(updates[kind], `update ${kind}`))];
  }
  const entities = idMap(merged.entities, 'entity');
  const sources = idMap(merged.sources, 'source');
  const assertions = idMap(merged.assertions, 'assertion');
  const allIds = new Set();
  for (const record of [...entities.values(), ...sources.values(), ...assertions.values()]) {
    if (allIds.has(record.id)) throw new Error(`Duplicate record ID: ${record.id}`);
    allIds.add(record.id);
  }
  for (const entity of entities.values()) {
    validateSources(entity, sources);
    references(entity.jurisdiction_ids, entities, `jurisdiction on ${entity.id}`);
    references(entity.sector_ids, entities, `sector on ${entity.id}`);
    for (const id of entity.jurisdiction_ids || []) if (entities.get(id).type !== 'Jurisdiction') throw new Error(`Invalid jurisdiction type: ${id}`);
    for (const id of entity.sector_ids || []) if (entities.get(id).type !== 'Sector') throw new Error(`Invalid sector type: ${id}`);
    for (const event of entity.dates || []) validateSources(event, sources);
  }
  for (const assertion of assertions.values()) {
    if (!entities.has(assertion.subject)) throw new Error(`Dangling assertion subject: ${assertion.subject}`);
    if (assertion.object?.entity_id && !entities.has(assertion.object.entity_id)) throw new Error(`Dangling assertion object: ${assertion.object.entity_id}`);
    validateSources(assertion, sources, true);
  }
  for (const entity of updates.entities) {
    if (STRUCTURAL.has(entity.type) && entity.type !== 'Jurisdiction') throw new Error('Additive updates must not create sector or concept taxonomy records');
    if (entity.type === 'Jurisdiction' && (entity.geography?.kind !== 'country' || !/^[A-Z]{3}$/.test(entity.geography?.iso_alpha3 || '') || entity.jurisdiction_ids.length)) throw new Error(`Invalid added map jurisdiction: ${entity.id}`);
    validateSources(entity, sources, true);
    if (!entity.label || !entity.description || !entity.status?.scope_note || entity.review_status !== 'machine_assisted_unreviewed') throw new Error(`Unqualified added entity: ${entity.id}`);
    date(entity.status.as_of, 'entity status date');
  }
  for (const assertion of updates.assertions) {
    if (!assertion.statement || !assertion.locator || !assertion.object?.entity_id || !updates.relationship_definitions?.[assertion.predicate] || assertion.review_status !== 'machine_assisted_unreviewed') throw new Error(`Unqualified added assertion: ${assertion.id}`);
    date(assertion.observed_at, 'assertion observation date');
  }
  for (const source of updates.sources) {
    if (!source.url?.startsWith('https://') || !source.title || !source.publisher || !source.locator) throw new Error(`Incomplete update source: ${source.id}`);
    date(source.retrieved_at, 'source retrieval date');
  }
  for (const group of updates.navigation_groups || []) {
    if (!group.id || !group.description || group.membership_basis !== 'editorial_filter') throw new Error('Unqualified navigation group');
    references(group.entity_ids, entities, `navigation entity on ${group.id}`);
    references(group.source_ids, sources, `navigation source on ${group.id}`);
  }
  merged.metadata.evidence_updates = { ...note, base_evidence_cutoff: dataset.metadata.evidence_cutoff };
  return merged;
}

/** Add each new record only to its explicit jurisdiction; map coverage is not adoption. */
export function applyEvidenceMapUpdates(map, updates) {
  if (map.evidence_updates) throw new Error('Map evidence update already applied');
  const note = provenance(map.dataset_version, updates);
  const merged = clone(map);
  const jurisdictions = new Map(list(merged.jurisdictions, 'map jurisdictions').map(row => [row.jurisdiction_id, row]));
  for (const entity of list(updates.entities, 'update entities').filter(entity => entity.type === 'Jurisdiction')) {
    if (jurisdictions.has(entity.id)) throw new Error(`Duplicate map jurisdiction: ${entity.id}`);
    if (entity.geography?.kind !== 'country' || !/^[A-Z]{3}$/.test(entity.geography?.iso_alpha3 || '')) throw new Error(`Invalid added map jurisdiction: ${entity.id}`);
    const row = { jurisdiction_id: entity.id, label: entity.label, geography: clone(entity.geography), coverage: 'selected_direct_records', records: [] };
    merged.jurisdictions.push(row);
    jurisdictions.set(entity.id, row);
  }
  for (const entity of updates.entities.filter(entity => !STRUCTURAL.has(entity.type))) {
    const layer = ['LegalInstrument', 'Provision', 'Requirement', 'Policy'].includes(entity.type) ? 'legal_and_policy' : ['Standard', 'StandardisationProject', 'Specification', 'Ontology', 'Committee'].includes(entity.type) ? 'standards_and_specifications' : 'ecosystem_and_implementation';
    for (const id of entity.jurisdiction_ids || []) {
      const row = jurisdictions.get(id);
      if (!row) throw new Error(`Dangling map jurisdiction: ${id}`);
      if (row.records.some(record => record.entity_id === entity.id)) throw new Error(`Duplicate map record: ${entity.id}`);
      row.records.push({
        entity_id: entity.id, entity_type: entity.type, label: entity.label,
        layer, scope_basis: 'direct_record',
        membership_assertion_id: null, status: clone(entity.status),
        sector_ids: clone(entity.sector_ids), source_ids: clone(entity.source_ids),
        evidence_status: entity.evidence_status, review_status: entity.review_status,
        limitations: clone(entity.limitations),
      });
    }
  }
  merged.evidence_updates = note;
  return merged;
}

/** Keep the JTC 5 filter inclusive of its sourced neighbours, without implying membership. */
export function applyEvidenceTaxonomyUpdates(taxonomy, updates) {
  if (taxonomy.evidence_updates) throw new Error('Taxonomy evidence update already applied');
  const note = provenance(taxonomy.dataset_version, updates);
  const merged = clone(taxonomy);
  const group = list(merged.groups, 'taxonomy groups').find(entry => entry.id === 'iso-iec-jtc5');
  if (!group) throw new Error('JTC 5 taxonomy group is missing');
  const relationships = list(updates.assertions, 'update assertions').filter(assertion => assertion.subject === 'std-iso-jtc5' || assertion.object?.entity_id === 'std-iso-jtc5');
  group.entity_ids = [...new Set([...group.entity_ids, ...relationships.flatMap(assertion => [assertion.subject, assertion.object.entity_id])])];
  group.source_ids = [...new Set([...group.source_ids, ...relationships.flatMap(assertion => assertion.source_ids)])];
  group.description = `JTC 5, its two recorded work items, announced cooperation with JTC 24 and nine listed Category A liaison organisations. Connections checked ${updates.checked_at}; this editorial filter does not imply adoption or completed interoperability.`;
  // Explicit editorial context keeps documented technical paths visible in filters.
  // It neither creates relationships nor changes geographic scope.
  for (const addition of updates.navigation_groups || []) {
    const target = merged.groups.find(entry => entry.id === addition.id);
    if (!target) throw new Error(`Missing navigation group: ${addition.id}`);
    target.entity_ids = [...new Set([...target.entity_ids, ...addition.entity_ids])];
    target.source_ids = [...new Set([...target.source_ids, ...addition.source_ids])];
    target.description = addition.description;
  }
  merged.evidence_updates = note;
  return merged;
}
