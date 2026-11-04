/**
 * Display-only context for a worldwide map highlight. Global records remain in
 * their own scope; this helper never assigns them to countries or changes counts.
 */
export function globalMapScope(model, current, state = {}) {
  const globalScope = model.scopes.get('jur-global');
  const globalCount = new Set(current.filter(record => globalScope?.has(record.id)).map(record => record.id)).size;
  const jurisdiction = state.jurisdiction || '';
  const recordFilter = Boolean(state.standards?.length || state.ecosystems?.length || state.focus || String(state.q || '').trim());
  const active = globalCount > 0 && (jurisdiction === 'jur-global' || (!jurisdiction && recordFilter));
  return {
    active,
    globalCount,
    label: active
      ? `Global scope · ${globalCount} matching ${globalCount === 1 ? 'record' : 'records'}. Worldwide scope does not imply adoption or legal applicability in every country.`
      : '',
  };
}
