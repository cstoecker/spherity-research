import {emptyState, layerOf} from './model.js';

/** Dated editorial classifications; never inferred from counts or status strings. */
export const REGULATORY_PHASES = Object.freeze({
  applying: { label: 'Applicable sector duties', short: 'Applying', symbol: '●', color: '#276595', description: 'Specific product-information or traceability duties already apply. Scope varies by sector.' },
  adopted: { label: 'Adopted framework / scheduled', short: 'Adopted', symbol: '◷', color: '#218577', description: 'A legal framework is adopted; passport duties may be future, conditional or need implementing measures.' },
  proposal: { label: 'Draft / consultation', short: 'Proposed', symbol: '◇', color: '#d39a35', description: 'A published proposal or consultation exists; adoption or final requirements are not established.' },
  early: { label: 'Early policy / pilots', short: 'Exploring', symbol: '○', color: '#9380b6', description: 'Official exploration, guidance or pilots; no DPP duty is established by this evidence.' },
});
export const UNASSESSED_COLOR = '#e5e9ee';

export function createRegulatoryModel(model, review) {
  if (!review || !/^\d{4}-\d{2}-\d{2}$/.test(review.checked_at) || review.review_status !== 'machine_assisted_unreviewed') throw new Error('Unqualified regulatory review');
  const profiles = new Map(), recordIds = new Set();
  for (const profile of review.profiles) {
    if (profiles.has(profile.jurisdiction_id) || model.entities.get(profile.jurisdiction_id)?.type !== 'Jurisdiction') throw new Error('Invalid regulatory jurisdiction');
    if (!REGULATORY_PHASES[profile.phase] || !['direct','territorial','eu_join'].includes(profile.scope_kind) || !profile.headline || !profile.summary || !profile.caveats?.length || profile.checked_at !== review.checked_at) throw new Error('Unqualified regulatory profile');
    if (!profile.record_ids?.length || profile.record_ids.some(id => !model.records.some(record => record.id === id))) throw new Error('Invalid regulatory evidence record');
    if (!profile.sources?.length || profile.sources.some(source => !source.title || !source.locator || !source.url?.startsWith('https://'))) throw new Error('Invalid regulatory source');
    if (profile.related_record_ids?.some(id => !model.records.some(record => record.id === id))) throw new Error('Invalid related regulatory record');
    for (const id of [...profile.record_ids, ...(profile.related_record_ids || [])]) recordIds.add(id);
    profiles.set(profile.jurisdiction_id, profile);
  }
  return { review, profiles, recordIds };
}

export function regulatoryProfile(model, jurisdictionId) {
  const regulatory = model.regulatory;
  if (!regulatory) return null;
  const direct = regulatory.profiles.get(jurisdictionId);
  if (direct) return direct;
  const eu = regulatory.profiles.get('jur-eu'), jurisdiction = model.entities.get(jurisdictionId);
  if (eu && jurisdiction?.geography?.kind === 'country' && [...(model.scopes.get(jurisdictionId)?.values() || [])].some(row => row.scope_basis === 'eu_membership_display_join' && eu.record_ids.includes(row.entity_id))) {
    return { ...eu, jurisdiction_id: jurisdictionId, scope_kind: 'eu_join', headline: 'EU framework · shared instrument scope', summary: eu.summary,
      caveats: ['Colour reflects the shared EU instruments, not a separate review of national implementation.', ...eu.caveats] };
  }
  return null;
}

/** Respect substantive filters, but keep the world visible while a country is inspected. */
export function regulationMapProfile(model, jurisdictionId, records) {
  const profile = regulatoryProfile(model, jurisdictionId);
  return profile && records.some(record => profile.record_ids.includes(record.id)) ? profile : null;
}

export function phaseLabel(profile) {
  if(profile?.map_display==='locator_only')return 'Territorial scopes · inspect separately';
  return profile ? `${REGULATORY_PHASES[profile.phase].label}${profile.scope_kind === 'territorial' ? ' · territorial scope' : profile.scope_kind === 'eu_join' ? ' · EU scope' : ''}` : 'Not assessed in this phase review';
}

/** A jurisdiction selection opens its complete overview, not an old topic intersection. */
export function jurisdictionOverviewState(model, state, jurisdictionId) {
  const jurisdiction = model.scopes.has(jurisdictionId) ? jurisdictionId : '';
  return {...emptyState(), view: state.view, jurisdiction,
    mapMode: !jurisdiction || regulatoryProfile(model, jurisdiction) ? 'regulation' : 'coverage'};
}

/** Keep regulatory developments discoverable independently of active topic filters. */
export function jurisdictionDevelopments(model, jurisdictionId) {
  const profile = regulatoryProfile(model, jurisdictionId);
  const evidence = new Set([...(profile?.record_ids || []), ...(profile?.related_record_ids || [])]);
  const scope = model.scopes.get(jurisdictionId);
  return model.records.filter(record => scope?.has(record.id) && (layerOf(record) === 'legal' || evidence.has(record.id)))
    .sort((a,b) => a.label.localeCompare(b.label));
}
