import { STRUCTURAL, currentAssertions } from './model.js';
import { SEMANTIC_REVIEW, SEMANTIC_PROFILES } from './semantic-profiles.js';

const clone = value => JSON.parse(JSON.stringify(value));
const ENTITY_KEYS = new Set(['entity_id', 'jurisdiction_id', 'sector_id', 'parent_id', 'subject']);
const ENTITY_LIST_KEYS = new Set(['entity_ids', 'jurisdiction_ids', 'sector_ids', 'member_ids','record_ids','related_record_ids']);

function references(value, kind, result = new Set()) {
  if (!value || typeof value !== 'object') return result;
  for (const [key, child] of Object.entries(value)) {
    if (kind === 'source' && key === 'source_ids' && Array.isArray(child)) child.forEach(id => result.add(id));
    if (kind === 'entity' && ENTITY_KEYS.has(key) && typeof child === 'string') result.add(child);
    if (kind === 'entity' && ENTITY_LIST_KEYS.has(key) && Array.isArray(child)) child.forEach(id => result.add(id));
    references(child, kind, result);
  }
  return result;
}

/**
 * Portable evidence export. Graph nodes/edges describe the selected induced graph;
 * context_entities and assertions retain supporting evidence without adding hidden
 * records to that graph. Passing records: [] intentionally exports an empty view.
 */
export function createGraphExport(dataset, { records, filters = {}, layout = null, exportedAt = new Date().toISOString(), regulatoryProfiles = null, includeSemantic = true } = {}) {
  // Curation belongs to the dataset schema, regardless of publication status.
  const hasQualifiedHistory = dataset.metadata.schema_version === '0.2.0';
  const entityById = new Map(dataset.entities.map(entity => [entity.id, entity]));
  const sourceById = new Map(dataset.sources.map(source => [source.id, source]));
  const fullGraph = records === undefined;
  if (!fullGraph && !Array.isArray(records)) throw new TypeError('Export records must be an array of records or IDs.');
  const selectedIds = fullGraph ? null : new Set(records.map(record => typeof record === 'string' ? record : record.id));
  for (const id of selectedIds || []) if (!entityById.has(id)) throw new Error(`Unknown export record: ${id}`);
  const nodes = dataset.entities.filter(entity => !STRUCTURAL.has(entity.type) && (fullGraph || selectedIds.has(entity.id)));
  const nodeIds = new Set(nodes.map(node => node.id));
  const assertions = fullGraph ? [...dataset.assertions] : dataset.assertions.filter(assertion => nodeIds.has(assertion.subject) || nodeIds.has(assertion.object?.entity_id));
  for(const assertion of assertions)for(const id of assertion.curation?.replacement_ids||[]){const replacement=dataset.assertions.find(a=>a.id===id);if(!replacement)throw new Error(`Unresolved replacement assertion: ${id}`);if(!assertions.some(a=>a.id===id))assertions.push(replacement);}
  const exportedRegulatory=regulatoryProfiles?{...regulatoryProfiles,profiles:(regulatoryProfiles.profiles||[]).filter(profile=>fullGraph||[...profile.record_ids,...(profile.related_record_ids||[])].some(id=>nodeIds.has(id))),interpretation:'Scoped phase annotations remain qualified; profiles and their evidence are supporting context, not extra visible graph nodes.'}:null;
  const edges = assertions.filter(assertion => assertion.curation?.status!=='superseded' && nodeIds.has(assertion.subject) && nodeIds.has(assertion.object?.entity_id))
    .map(assertion => ({ ...assertion, source: assertion.subject, target: assertion.object.entity_id }));

  // Resolve context transitively, including geography parents/members and all
  // off-view endpoints of the supporting assertions. Never promote it to nodes.
  const includedIds = fullGraph ? new Set(entityById.keys()) : new Set(nodeIds);
  const needed = references([nodes, assertions,exportedRegulatory], 'entity');
  for (const id of needed) {
    const entity = entityById.get(id);
    if (!entity) throw new Error(`Unresolved entity in graph export: ${id}`);
    includedIds.add(id);
    references(entity, 'entity', needed);
  }
  const contextEntities = dataset.entities.filter(entity => includedIds.has(entity.id) && !nodeIds.has(entity.id));
  const sourceIds = references([dataset.metadata, nodes, contextEntities, assertions], 'source');
  for (const id of sourceIds) { const source=sourceById.get(id); if(source?.source_identity_id)sourceIds.add(source.source_identity_id); }
  for (const id of sourceIds) if (!sourceById.has(id)) throw new Error(`Unresolved source in graph export: ${id}`);
  const sources = dataset.sources.filter(source => fullGraph || sourceIds.has(source.id));
  const profiles = Object.entries(SEMANTIC_PROFILES).filter(([id]) => includeSemantic && nodeIds.has(id))
    .map(([entityId, profile]) => ({ entity_id: entityId, ...profile }));

  // Clone the whole result, including nested status, dates and evidence fields,
  // so callers can serialize or manipulate it without changing the live model.
  return clone({
    format: 'spherity-dpp-knowledge-graph',
    schema_version: hasQualifiedHistory ? '1.1.0' : '1.0.0',
    schema_version_note: 'This version identifies the graph-download wrapper. metadata.schema_version identifies the canonical dataset schema; metadata.version identifies the dataset edition.',
    metadata: { ...dataset.metadata, exported_at: exportedAt },
    scope: {
      kind: fullGraph ? 'full_graph' : 'current_view',
      filters: fullGraph ? {} : filters,
      layout,
      counts: { nodes: nodes.length, edges: edges.length, context_entities: contextEntities.length, assertions: assertions.length, sources: sources.length, ...(hasQualifiedHistory ? {active_assertions:currentAssertions({assertions}).length} : {}) },
      node_definition: 'Substantive research records only; jurisdictions, sectors and concepts are supporting context.',
      edge_definition: 'Active sourced entity-to-entity assertions whose two endpoints are present in nodes. Direction runs from source to target. Superseded assertions remain in assertions as history and are not current graph edges.',
      context_definition: 'Reference-only entities needed by the evidence, including structural context and records outside the current view. They are not graph nodes.',
      assertion_definition: fullGraph ? 'All qualified assertions from the dataset, including literal values and structural relationships.' : 'All qualified assertions directly involving a graph node, including literal values and links to reference-only context entities.',
      limitations: [
        'Missing connections mean no relationship is recorded in this export; they do not establish that no relationship exists.',
        'Research status, evidence limitations and third-party rights remain as stated in the original records and metadata.',
        'Graph positions, geographic boundary geometry and inferred future connections are not included.'
      ]
    },
    nodes,
    edges,
    context_entities: contextEntities,
    assertions,
    sources,
    regulatory_profiles: exportedRegulatory,
    semantic_profiles: {
      review: SEMANTIC_REVIEW,
      profiles,
      interpretation: 'Separate dated research overlay; badges apply only to the named record and are not inherited by connected records. An absent badge means unassessed. These sources are local to each profile.'
    }
  });
}
