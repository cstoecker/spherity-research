export const STRUCTURAL = new Set(['Jurisdiction','Sector','Concept']);
export const human = value => String(value || '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
export const normal = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const layerOf = e => ['LegalInstrument','Provision','Requirement','Policy'].includes(e.type) ? 'legal' : ['Standard','StandardisationProject','Specification','Ontology','Committee'].includes(e.type) ? 'standards' : 'ecosystems';
export const emptyState = () => ({jurisdiction:'',standards:[],ecosystems:[],sector:'',status:'',layer:'',q:'',view:'map',focus:'',mapMode:'coverage',review:'',access:'',claim:'',observedAfter:'',observedBefore:''});
export const defaultState = () => ({...emptyState(),mapMode:'regulation'});
export const currentAssertions = dataset => dataset.assertions.filter(assertion=>assertion.curation?.status!=='superseded');

export function createModel(dataset, map, taxonomy) {
  const entities = new Map(dataset.entities.map(e=>[e.id,e]));
  const sources = new Map(dataset.sources.map(s=>[s.id,s]));
  const records = dataset.entities.filter(e=>!STRUCTURAL.has(e.type));
  const groups = taxonomy.groups;
  const jurisdictions = map.jurisdictions;
  const scopes = new Map(jurisdictions.map(j=>[j.jurisdiction_id,new Map(j.records.map(r=>[r.entity_id,{...r,associations:[]}]))]));
  for (const link of taxonomy.geographic_associations) {
    const scope=scopes.get(link.jurisdiction_id); const e=entities.get(link.entity_id);
    if (!scope || !e) throw new Error('Invalid ecosystem geography reference');
    if (!scope.has(e.id)) scope.set(e.id,{entity_id:e.id,scope_basis:'ecosystem_association',associations:[]});
    scope.get(e.id).associations.push(link);
  }
  // Country browsing also discovers explicitly parented territories. This is a
  // display join only: record jurisdictions and sourced assertions stay intact.
  const jurisdictionById = new Map(jurisdictions.map(j=>[j.jurisdiction_id,j]));
  for (const child of jurisdictions) {
    const parent = jurisdictionById.get(child.geography.parent_id);
    if (!['territory','subnational'].includes(child.geography.kind) || parent?.geography.kind!=='country') continue;
    const parentScope = scopes.get(parent.jurisdiction_id);
    for (const row of child.records) {
      const entity = entities.get(row.entity_id);
      // Exclude inherited membership joins and editorial location associations.
      if (!entity?.jurisdiction_ids.includes(child.jurisdiction_id)) continue;
      if (!parentScope.has(entity.id)) parentScope.set(entity.id,{
        ...row,scope_basis:'territorial_display_rollup',associations:[],territorial_scopes:[],
      });
      const entry = parentScope.get(entity.id);
      entry.territorial_scopes ||= [];
      if (!entry.territorial_scopes.some(scope=>scope.jurisdiction_id===child.jurisdiction_id)) {
        entry.territorial_scopes.push({jurisdiction_id:child.jurisdiction_id,scope_basis:row.scope_basis});
      }
    }
  }
  const assertionsByEntity = new Map(dataset.entities.map(e=>[e.id,[]]));
  for (const a of currentAssertions(dataset)) {
    assertionsByEntity.get(a.subject)?.push(a);
    if (a.object.entity_id && a.object.entity_id!==a.subject) assertionsByEntity.get(a.object.entity_id)?.push(a);
  }
  const searchText=new Map(records.map(e=>{
    const assertions=assertionsByEntity.get(e.id)||[];
    const sourceIds=new Set([...e.source_ids,...assertions.flatMap(a=>a.source_ids)]);
    const evidence=[...sourceIds].flatMap(id=>{const s=sources.get(id);return s?[s.id,s.title,s.url,s.publisher,s.locator||'']:[];});
    return [e.id,normal([e.id,e.label,e.description,e.version||'',e.type,e.status.value,e.status.scope_note,...e.limitations,...groups.filter(g=>g.entity_ids.includes(e.id)).map(g=>g.label),...assertions.flatMap(a=>[a.id,a.statement,a.locator]),...evidence].join(' '))];
  }));
  return {dataset,taxonomy,entities,sources,records,groups,jurisdictions,scopes,assertionsByEntity,searchText};
}

export function filterRecords(model, state) {
  const selectedGroups=(ids)=>new Set(model.groups.filter(g=>ids.includes(g.id)).flatMap(g=>g.entity_ids));
  const standards=selectedGroups(state.standards), ecosystems=selectedGroups(state.ecosystems);
  const geo=state.jurisdiction ? model.scopes.get(state.jurisdiction) : null;
  const tokens=normal(state.q).trim().split(/\s+/).filter(Boolean);
  let result=model.records.filter(e=>(!state.jurisdiction || geo?.has(e.id)) && (!state.standards.length || standards.has(e.id)) && (!state.ecosystems.length || ecosystems.has(e.id)) && (!state.sector || e.sector_ids.includes(state.sector)) && (!state.status || e.status.value===state.status) && (!state.layer || layerOf(e)===state.layer) && tokens.every(t=>model.searchText.get(e.id).includes(t)));
  if(state.mapMode==='regulation' && model.regulatory)result=result.filter(e=>model.regulatory.recordIds.has(e.id));
  result=result.filter(e=>{
    const assertions=model.assertionsByEntity.get(e.id)||[];
    const observations=[e.status.as_of,...assertions.map(a=>a.observed_at)];
    const sources=[...new Set([...e.source_ids,...assertions.flatMap(a=>a.source_ids)])].map(id=>model.sources.get(id));
    return (!state.review||e.review_status===state.review)&&(!state.access||sources.some(s=>s?.access_status===state.access))&&(!state.claim||assertions.some(a=>a.assertion_type===state.claim))&&observations.some(date=>(!state.observedAfter||date>=state.observedAfter)&&(!state.observedBefore||date<=state.observedBefore));
  });
  if(state.focus){
    const ids=new Set([state.focus]);
    for(const a of model.assertionsByEntity.get(state.focus)||[]){ids.add(a.subject);if(a.object.entity_id)ids.add(a.object.entity_id);}
    result=result.filter(e=>ids.has(e.id));
  }
  return result;
}

export function mapCounts(model, records) {
  const ids=new Set(records.map(e=>e.id));
  return new Map(model.jurisdictions.map(j=>[j.jurisdiction_id,[...model.scopes.get(j.jurisdiction_id).keys()].filter(id=>ids.has(id)).length]));
}

export function graphData(model, records) {
  const ids=new Set(records.map(e=>e.id));
  return {nodes:records.map(e=>({...e})),edges:currentAssertions(model.dataset).filter(a=>a.object.entity_id && ids.has(a.subject) && ids.has(a.object.entity_id)).map(a=>({id:a.id,source:a.subject,target:a.object.entity_id,assertion:a}))};
}

export function parseState(params,model) {
  const s=emptyState(); const p=new URLSearchParams(params);
  for(const k of ['jurisdiction','sector','status','layer','q','focus','review','access','claim','observedAfter','observedBefore'])s[k]=p.get(k)||'';
  s.view=['map','graph','table','timeline'].includes(p.get('view'))?p.get('view'):'map';
  const known=new Set(model.groups.map(g=>g.id));
  s.standards=(p.get('standards')||'').split(',').filter(x=>known.has(x)&&model.groups.find(g=>g.id===x).kind==='standards');
  s.ecosystems=(p.get('ecosystems')||'').split(',').filter(x=>known.has(x)&&model.groups.find(g=>g.id===x).kind==='dpp');
  if(!model.scopes.has(s.jurisdiction))s.jurisdiction='';
  if(model.entities.get(s.sector)?.type!=='Sector')s.sector='';
  if(!model.records.some(e=>e.status.value===s.status))s.status='';
  if(!['legal','standards','ecosystems'].includes(s.layer))s.layer='';
  if(!model.entities.has(s.focus))s.focus='';
  if(!['machine_assisted_unreviewed','human_reviewed','adjudicated'].includes(s.review))s.review='';
  if(!['opened','search_snippet','dossier_only','unavailable'].includes(s.access))s.access='';
  if(!['source_statement','research_classification','reported_result'].includes(s.claim))s.claim='';
  for(const key of ['observedAfter','observedBefore'])if(!/^\d{4}-\d{2}-\d{2}$/.test(s[key])||Number.isNaN(Date.parse(s[key])))s[key]='';
  const hasFilters=['jurisdiction','sector','status','layer','q','focus','standards','ecosystems','selected','assertion','review','access','claim','observedAfter','observedBefore'].some(key=>p.get(key));
  s.mapMode=['regulation','coverage'].includes(p.get('mapMode'))?p.get('mapMode'):(!hasFilters&&s.view==='map'?'regulation':'coverage');
  return s;
}
export function stateParams(state){
  const p=new URLSearchParams();
  for(const [k,v] of Object.entries(state))if(Array.isArray(v)?v.length:!!v)p.set(k,Array.isArray(v)?v.join(','):v);
  return p.toString();
}

export function countryCode(feature){
  const p=feature.properties;
  return [p.ISO_A3_EH,p.ISO_A3,p.ADM0_A3].find(v=>v&&v!=='-99')||'';
}
