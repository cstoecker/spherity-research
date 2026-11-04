import {createModel, filterRecords, mapCounts, graphData, emptyState, defaultState, parseState, stateParams, human, layerOf, countryCode, STRUCTURAL} from './model.js';
import {createGraphView} from './graph-view.js';
import {createGraphExport} from './graph-export.js';
import {globalMapScope} from './map-scope.js';
import {REGULATORY_PHASES,UNASSESSED_COLOR,createRegulatoryModel,regulatoryProfile,regulationMapProfile,phaseLabel,jurisdictionOverviewState,jurisdictionDevelopments} from './regulation.js';
import {semanticProfile, SEMANTIC_REVIEW} from './semantic-profiles.js';
import {loadAtlasData,timelineRows,timelinePrecisionLabel} from './atlas-data.js';

const $ = id => document.getElementById(id);
const embedded = new URLSearchParams(location.search).get("embed")==="map";
const historical = new URLSearchParams(location.search).get('release')==='0.1.0';
let timelineKind=historical?'all':'regulatory';
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names = (ids=[]) => ids.map(id=>model.entities.get(id)?.label||id).join(', ');
const list = (values=[]) => values.length ? `<ul>${values.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>` : '';
const section = (title,body) => body ? `<section class="detail-section"><h3>${esc(title)}</h3>${body}</section>` : '';
const pair = (key,value) => value ? `<dt>${esc(key)}</dt><dd>${esc(value)}</dd>` : '';
const link = (url,label) => { try { const u=new URL(url); return ['https:','http:'].includes(u.protocol) ? `<a href="${esc(u.href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>` : esc(label); } catch{return esc(label);} };
const entityButton = (id,label,small='') => `<button class="detail-link" data-entity="${esc(id)}">${esc(label||model.entities.get(id)?.label||id)}${small?`<small>${esc(small)}</small>`:''}</button>`;
const dossierLink=f=>['eu-legal-evidence.md','global-jurisdictions-evidence.md','standards-ecosystem-evidence.md','untp-w3c-evidence.md'].includes(f)?`<a href="data/provenance/${encodeURIComponent(f)}">${esc(f)}</a>`:f==='docs/Spherity-Research-Global-DPP-Whitepaper.pdf'?'<a href="../Spherity-Research-Global-DPP-Whitepaper.pdf">Supplied whitepaper PDF</a>':`<span>${esc(f)} · retained research reference; not redistributed here</span>`;
const colors = {legal:'#0969da',standards:'#167a79',ecosystems:'#ad6f1a'};
const family = {legal:'Regulation & policy',standards:'Standards & specifications',ecosystems:'Ecosystems & implementation'};
const presets={regulation:{mapMode:'regulation'},aasGlobal:{standards:['aas-international']},aas:{jurisdiction:'jur-de',standards:['aas-idta']},w3c:{standards:['w3c']},china:{jurisdiction:'jur-cn',standards:['china-sac-swg41']},cen:{standards:['cen-cenelec-jtc24']},jtc5:{standards:['iso-iec-jtc5']},untp:{ecosystems:['untp']}};
const initialDetail = $('detail-content').innerHTML;
let graphMode=new URLSearchParams(location.search).get('layout')==='network'?'network':'structured';
let model, state, world, d3, current=[], counts, mapScope={active:false,globalCount:0,label:''}, selected='', selectedAssertion='', mapSvg, mapZoom, graphView, mapPaths, regulationMapRecords=[], toastTimer, detailReturnFocus=null, expandedFallback=false, fullscreenInert=[], graphOutlookBeforeFullscreen=null;

function sourceCards(ids=[]) {
  return [...new Set(ids)].map(id=>{
    const s=model.sources.get(id); if(!s)return '';
    return `<div class="source-item">${link(s.url,s.title)}<code class="record-id">${esc(s.id)}</code><div class="source-meta">${esc(s.publisher)} · ${esc(human(s.source_type))}<br>Access: ${esc(human(s.access_status))} · Retrieved ${esc(s.retrieved_at||'not recorded')}${s.published_at?` · Published ${esc(s.published_at)}`:''}${s.updated_at?` · Updated ${esc(s.updated_at)}`:''}</div>${s.source_identity_id?`<small>Source identity: ${esc(s.source_identity_id)}</small>`:''}${s.limitations.map(l=>`<p>${esc(l)}</p>`).join('')}${s.dossier_files?.length?`<details><summary>Research dossier</summary>${s.dossier_files.map(dossierLink).join('')}</details>`:''}</div>`;
  }).join('');
}

function saveUrl() {
  const p=new URLSearchParams(stateParams(state));
  if(historical)p.set('release','0.1.0');
  if(graphMode==='network')p.set('layout','network');
  if(selected)p.set('selected',selected);
  if(selectedAssertion)p.set('assertion',selectedAssertion);
  if(embedded){$('embed-open-full').href=`${location.pathname}?${p}`;p.set('embed','map');}
  history.replaceState(null,'',`${location.pathname}?${p}${location.hash}`);
}
function toast(text){$('toast').textContent=text;$('toast').classList.add('active');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('active'),3200);}
function clearDetail(){document.body.classList.remove('has-detail');selected='';selectedAssertion='';$('detail-content').innerHTML=state?.mapMode==='regulation'&&model?.regulatory?regulationOverview():initialDetail;$('close-detail').hidden=true;highlight();saveUrl();}
function detail(html){if(embedded)document.body.classList.add('has-detail');$('detail-content').innerHTML=html;prepareEmbeddedLinks($('detail-content'));$('detail-content').querySelector('h2')?.setAttribute('tabindex','-1');$('close-detail').hidden=false;}
function revealDetail(){
  const compact=window.matchMedia('(max-width:1250px)').matches;
  detailReturnFocus=document.activeElement;
  $('detail-content').querySelector('h2')?.focus({preventScroll:compact});
  if(compact)$('inspector').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
function highlight(){
  graphView?.highlight(selected,selectedAssertion);
  $('explore').classList.toggle('graph-has-detail',!!(selected||selectedAssertion));
  const geography=model?.entities.get(state.jurisdiction)?.geography;
  const mapSelection=['territory','subnational'].includes(geography?.kind)?geography.parent_id:state.jurisdiction;
  mapPaths?.classed('selected',f=>geoFor(f)?.jurisdiction_id===mapSelection);
}

function semanticDetails(id){
  if(historical)return '';
  const profile=semanticProfile(id);
  if(!profile)return section('Semantics & vocabulary reuse','<p>No assessment badge is assigned to this record. This does not establish open-world semantics, unrestricted reuse, or the absence of constraints. A connected record’s badge is not inherited.</p>');
  const chips=profile.badges.map(b=>`<span class="semantic-chip tone-${esc(b.tone)}"><span aria-hidden="true">${esc(b.symbol)}</span> ${esc(b.label)}</span>`).join('');
  const findings=profile.findings.map(f=>`<div class="semantic-finding"><p class="semantic-dimension">${esc(f.dimension)} · ${esc(f.basis)}</p><h4>${esc(f.title)}</h4><p>${esc(f.text)}</p>${f.sourceIds.map(id=>{const source=profile.sources.find(s=>s.id===id);return `<p class="semantic-source">${link(source.url,source.title)}<small>${esc(source.locator)}</small></p>`;}).join('')}</div>`).join('');
  return section('Semantics & vocabulary reuse',`<div class="semantic-chip-row">${chips}</div><p class="semantic-review">Separate research annotation · checked ${esc(SEMANTIC_REVIEW.checkedAt)} · independent review pending</p>${findings}<p class="detail-callout">${esc(profile.limits)}</p><p><a href="#semantic-guide" data-semantic-guide>How to read these markers ↓</a></p>`);
}

function showEntity(id) {
  const e=model.entities.get(id); if(!e)return;
  if(e.type==='Jurisdiction'){showJurisdiction(id);return;}
  selected=id;selectedAssertion='';
  if(STRUCTURAL.has(e.type)){
    detail(`<div class="detail-heading"><span class="badge">${esc(human(e.type))}</span><h2>${esc(e.label)}</h2><p>${esc(e.description)}</p></div>${section('Vocabulary context',`<p>This entry provides geography or analytical vocabulary for the dataset. It is not a substantive research record.</p>`)}${section('Coded assertions',(model.assertionsByEntity.get(id)||[]).map(a=>`<button class="detail-link" data-assertion="${esc(a.id)}">${esc(a.statement)}</button>`).join(''))}${section('Sources',sourceCards(e.source_ids))}`);highlight();saveUrl();return;
  }
  const layer=layerOf(e), assertions=model.assertionsByEntity.get(id)||[];
  const groups=model.groups.filter(g=>g.entity_ids.includes(id));
  const associations=model.taxonomy.geographic_associations.filter(a=>a.entity_id===id);
  const dates=(e.dates||[]).map(t=>`<div class="source-item"><p><strong>${esc(human(t.kind))}: ${esc(t.date||'Conditional / no fixed date')}</strong> · ${esc(t.precision)}</p>${t.condition?`<p>${esc(t.condition)}</p>`:''}<details><summary>Date sources</summary>${sourceCards(t.source_ids)}</details></div>`).join('');
  detail(`<div class="detail-heading"><span class="badge ${layer}">${esc(human(e.type))}</span><h2>${esc(e.label)}</h2><p>${esc(e.description)}</p></div><div class="detail-actions"><button data-focus="${esc(id)}">Explore connections</button><a href="${historical?'catalogue-0.1.0.html':'catalogue.html'}#${encodeURIComponent(id)}">Static record ↗</a></div>${!current.some(r=>r.id===id)?'<div class="detail-callout">This selected record is outside the current filters.</div>':''}${section('Status & scope',`<dl>${pair('Record ID',e.id)}${pair('Recorded status',human(e.status.value))}${pair('As of',e.status.as_of)}${pair('Scope qualification',e.status.scope_note)}${pair('Jurisdictions',names(e.jurisdiction_ids))}${pair('Sectors',names(e.sector_ids))}${pair('Version',e.version)}</dl>`)}${semanticDetails(id)}${section('Evidence & review',`<dl>${pair('Evidence status',human(e.evidence_status))}${pair('Review',human(e.review_status))}</dl>${list(e.limitations)}`)}${section('Dates & conditions',dates)}${section('Navigation groups',groups.map(g=>`<details><summary>${esc(g.label)}</summary><p>${esc(g.description)}</p><p>Editorial filter membership; not a legal or technical equivalence claim.</p><button class="text-button" data-group="${esc(g.id)}">Filter this group →</button></details>`).join(''))}${section('Geographic associations',associations.map(a=>`<p><strong>${esc(names([a.jurisdiction_id]))}: ${esc(human(a.relationship))}</strong></p><p>${esc(a.note)}</p>${link(a.source_url,a.source_title)}<p>Overlay observation: ${esc(a.observed_at)}. This is separate from the record’s jurisdiction scope.</p>`).join(''))}${section(`Coded assertions (${assertions.length})`,assertions.map(a=>`<button class="detail-link" data-assertion="${esc(a.id)}">${esc(a.statement)}<small>${esc(human(a.predicate))} · ${esc(human(a.assertion_type))}${a.interoperability?' · bounded interoperability result':''}</small></button>`).join('')||'<p>No relationship or literal statement coded in this release.</p>')}${section('Correction history',model.dataset.assertions.filter(a=>a.curation&&(a.subject===id||a.object.entity_id===id)).map(a=>`<button class="detail-link" data-assertion="${esc(a.id)}">${esc(a.statement)}<small>Superseded · ${esc(a.curation.reason)}</small></button>`).join(''))}${section('Record sources',sourceCards(e.source_ids))}`);
  highlight();saveUrl();
}

function showAssertion(id) {
  const a=model.dataset.assertions.find(a=>a.id===id);if(!a)return;
  selected='';selectedAssertion=id;
  const i=a.interoperability;
  detail(`<div class="detail-heading"><span class="badge">${esc(human(a.assertion_type))}</span><h2>${esc(human(a.predicate))}</h2><p>${esc(a.statement)}</p></div>${a.curation?section('Superseded assertion',`<p>${esc(a.curation.reason)}</p><p>Retained for history; excluded from the current graph.</p>${a.curation.replacement_ids.map(id=>`<button class="detail-link" data-assertion="${esc(id)}">Replacement: ${esc(id)}</button>`).join('')}`):''}${a.assertion_type==='research_classification'?'<p class="detail-callout">Analytical classification or author proposal. This is not a normative requirement or demonstrated interoperability result.</p>':''}${section('Relationship',entityButton(a.subject)+(a.object.entity_id?entityButton(a.object.entity_id):`<p><strong>Recorded value</strong><br>${esc(typeof a.object.value==='object'?JSON.stringify(a.object.value):a.object.value)}</p>`))}${section('Evidence details',`<dl>${pair('Assertion ID',a.id)}${pair('Evidence type',human(a.evidence_type))}${pair('Observed',a.observed_at)}${pair('Source locator',a.locator)}${pair('Valid from',a.valid_from)}${pair('Valid to',a.valid_to)}${pair('Review',human(a.review_status))}</dl>${list(a.limitations)}`)}${i?section('Bounded interoperability evidence',`<dl>${pair('Result',i.result==='not_tested'||i.coding_status==='not_assessed'?'No qualified result coded':human(i.result))}${pair('Operation',i.operation)}${pair('Dimensions',i.dimensions.map(d=>d==='identity_authentication'?'Authentication (reported conversion)':human(d)).join(', '))}${pair('Independence',human(i.independence))}${pair('Test date',i.test_date||'Not specified')}</dl>${list(i.systems)}${list(i.limitations)}<div class="detail-callout">This result applies to the reported systems and operation. It does not establish universal interoperability or legal acceptance. Authentication conversion does not establish cross-border business-identity recognition.</div>`):'<div class="detail-callout">A sourced relationship is not by itself a demonstrated exchange, conformance test or legal recognition.</div>'}${section('Assertion sources',sourceCards(a.source_ids))}`);
  highlight();saveUrl();
}

function scopeBasisLabel(row) {
  if(row.scope_basis==='territorial_display_rollup')return `Territorial record: ${names(row.territorial_scopes.map(scope=>scope.jurisdiction_id))} · display only`;
  return {direct:'Recorded jurisdiction scope',direct_scope:'Recorded jurisdiction scope',direct_record:'Recorded jurisdiction scope',eu_membership_display_join:'EU instrument scope join',ecosystem_association:'Ecosystem association'}[row.scope_basis]||human(row.scope_basis);
}
function territorialOrigins(id, records=current) {
  const scope=model.scopes.get(id);
  return [...new Set(records.flatMap(e=>scope?.get(e.id)?.scope_basis==='territorial_display_rollup'?scope.get(e.id).territorial_scopes.map(origin=>origin.jurisdiction_id):[]))];
}
function mapRecordSummary(j) {
  const origins=territorialOrigins(j.jurisdiction_id);
  return `${counts.get(j.jurisdiction_id)} matching records${origins.length?`; includes ${names(origins)} records, not nationwide scope`:''}`;
}

function regulationOverview(){
  return `<div class="regulation-overview"><p class="regulation-kicker"><span>REGULATORY SNAPSHOT</span><time datetime="${esc(model.regulatory.review.checked_at)}">25 Oct 2026</time></p><h2>Where are DPP rules taking shape?</h2><p>Read the stage of the recorded measure, then inspect its products, dates and territorial scope.</p><div class="phase-guide">${Object.entries(REGULATORY_PHASES).map(([id,phase])=>`<div><span class="phase-dot" style="--phase-color:${phase.color}" aria-hidden="true">${phase.symbol}</span><p><strong>${esc(phase.label)}</strong><small>${esc(phase.description)}</small></p></div>`).join('')}</div><h3>Start with a jurisdiction</h3><div class="regulation-examples"><button data-scope="jur-eu">European Union →</button><button data-scope="jur-cn">China →</button><button data-scope="jur-gb">United Kingdom →</button></div><p class="regulation-caveat">Stripes mark territorial scope. Grey means unassessed, not absence of law. These are different policy paths, not a ranking or a prediction.</p><a href="data/current-regulatory-phases.json" download>Download phases &amp; sources ↓</a></div>`;
}
function regulatoryDetails(id){
  const profile=regulatoryProfile(model,id),developments=jurisdictionDevelopments(model,id);
  const entries=developments.map(record=>entityButton(record.id,record.label,`${human(record.status.value)} · as of ${record.status.as_of}`)).join('');
  const developmentsSection=section(`Regulatory developments (${developments.length})`,`${entries||'<p>No regulatory development is documented for this jurisdiction in this snapshot. This does not establish absence of regulation.</p>'}<p class="source-meta">Complete jurisdiction overview, independent of the active topic filters.</p>`);
  if(!profile)return section('Regulatory phase','<p>Not assessed in this phase review. Other evidence may be present; no conclusion about absence of regulation follows.</p>')+developmentsSection;
  const phase=REGULATORY_PHASES[profile.phase];
  return section('Regulatory phase',`<p class="phase-badge" style="--phase-color:${phase.color}"><span aria-hidden="true">${phase.symbol}</span> ${esc(phaseLabel(profile))}</p><h4>${esc(profile.headline)}</h4><p>${esc(profile.summary)}</p><button class="regulatory-overview-action" data-regulatory-scope="${esc(id)}">Show regulatory overview on map →</button>`)+developmentsSection+section('Scope, dates & evidence',`<details><summary>Read qualifications and sources</summary>${list(profile.caveats)}<p class="source-meta">Phase assessment checked ${esc(profile.checked_at)} · human review pending.</p><h4>Evidence behind this phase</h4>${profile.record_ids.map(id=>entityButton(id)).join('')}${profile.related_record_ids?.length?`<h4>Related developments · separate status</h4>${profile.related_record_ids.map(id=>entityButton(id)).join('')}`:''}${profile.sources.map(source=>`<p>${link(source.url,source.title)}<small class="source-meta">${esc(source.locator)}</small></p>`).join('')}</details>`);
}
function openJurisdictionOverview(id,view=state.view){
  const hadTopicFilters=state.q||state.standards.length||state.ecosystems.length||state.sector||state.status||state.layer||state.focus;
  state=jurisdictionOverviewState(model,{...state,view},id);if(historical)state.mapMode='coverage';selected=state.jurisdiction;selectedAssertion='';render();
  if(hadTopicFilters)toast('Opened the complete jurisdiction overview. Previous topic filters were cleared.');
}
function showJurisdiction(id) {
  const j=model.jurisdictions.find(j=>j.jurisdiction_id===id);if(!j)return;
  selected=id;selectedAssertion='';
  const scoped=current.filter(e=>model.scopes.get(id).has(e.id));
  const allScoped=model.records.filter(e=>model.scopes.get(id).has(e.id));
  const origins=territorialOrigins(id,allScoped);
  const mapLocator=['territory','subnational'].includes(j.geography.kind)&&j.geography.parent_id?`<p class="detail-callout">Map locator: ${esc(names([j.geography.parent_id]))}. This map has no separate outline for ${esc(j.label)}; the assessment below is specific to this territory. The parent country’s colour retains its own scope.</p>`:'';
  const territorialNote=origins.length?`<p><strong>Includes territorial records from ${esc(names(origins))}.</strong> These are shown under the parent country for discovery only; each record retains its own territorial scope. This does not establish nationwide law or adoption.</p>`:'';
  detail(`<div class="detail-heading"><span class="badge">${esc(human(j.geography.kind))}</span><h2>${esc(j.label)}</h2><p>${scoped.length} matching research records in this view.</p></div>${mapLocator}${id==='jur-gb'?section('Inspect the territorial scope','<p>The UK outline is a neutral locator. Great Britain and Northern Ireland must be read separately.</p><button data-regulatory-scope="jur-gb-gbn">Great Britain →</button><button data-regulatory-scope="jur-gb-nir">Northern Ireland →</button>'):''}${['country','territory','subnational','supranational'].includes(j.geography.kind)?regulatoryDetails(id):''}${section('How to read this scope',`${origins.length?'':`<p>${allScoped.length} research records are catalogued for this scope; ${scoped.length} match the active view.</p>`}${territorialNote}${id==='jur-global'?'<p>Global scope means international reach, not adoption or legal requirements in every country. Worldwide highlighting keeps these records separate from country evidence counts.</p>':''}<p>EU joins represent the scope of EU instruments; they are not completed national implementation reviews. Global initiatives are kept separate. Missing evidence does not establish absence of law.</p>`)}${section('Records & scope basis',scoped.map(e=>{const r=model.scopes.get(id).get(e.id);return entityButton(e.id,e.label,scopeBasisLabel(r));}).join('')||'<p>No records match the current filters for this scope.</p>')}`);
  highlight();saveUrl();
}

function fillFilters(){
  for(const j of model.jurisdictions)$('jurisdiction').add(new Option(`${j.label}${j.geography.kind!=='country'?' · '+human(j.geography.kind):''}`,j.jurisdiction_id));
  for(const e of [...model.entities.values()].filter(e=>e.type==='Sector').sort((a,b)=>a.label.localeCompare(b.label)))$('sector').add(new Option(e.label,e.id));
  for(const [kind,label]of Object.entries(family)){const group=document.createElement('optgroup');group.label=label;for(const value of [...new Set(model.records.filter(e=>layerOf(e)===kind).map(e=>e.status.value))].sort())group.append(new Option(human(value),value));$('status').append(group);}
  for(const [kind,key] of [['standards','standards'],['dpp','ecosystems']]){
    $(key+'-options').innerHTML=model.groups.filter(g=>g.kind===kind).map(g=>`<label title="${esc(g.description)}"><input type="checkbox" value="${esc(g.id)}" data-filter="${key}"><span>${esc(g.label)}</span></label>`).join('');
  }
}
function syncControls(){
  document.body.classList.toggle('is-graph-view',state.view==='graph');
  if(state.view!=='graph'&&(expandedFallback||document.fullscreenElement===$('explore')))exitGraphFullscreen();
  for(const key of ['jurisdiction','sector','status','layer','review','access','claim','observedAfter','observedBefore'])$(key).value=state[key];
  document.querySelectorAll('[data-preset]').forEach(b=>{
    const expected={...emptyState(),...presets[b.dataset.preset]};
    b.setAttribute('aria-pressed',String(Object.keys(expected).filter(k=>k!=='view').every(k=>JSON.stringify(expected[k])===JSON.stringify(state[k]))));
  });
  if($('search').value!==state.q)$('search').value=state.q;
  document.querySelectorAll('[data-filter]').forEach(el=>el.checked=state[el.dataset.filter].includes(el.value));
  for(const key of ['standards','ecosystems'])$(key+'-count').textContent=state[key].length||'';
  document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===state.view;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
  for(const view of ['map','graph','table','timeline'])$(view+'-panel').hidden=state.view!==view;
  const chips=[];
  for(const key of ['jurisdiction','sector','status','layer','q','focus','review','access','claim','observedAfter','observedBefore'])if(state[key])chips.push([key,state[key],key==='q'?`“${state.q}”`:key==='focus'?`Connections: ${names([state.focus])}`:key.startsWith('observed')?`${human(key)}: ${state[key]}`:family[state[key]]||model.entities.get(state[key])?.label||human(state[key])]);
  for(const key of ['standards','ecosystems'])for(const id of state[key])chips.push([key,id,model.groups.find(g=>g.id===id).label]);
  const scope=globalMapScope(model,current,state);
  if(state.mapMode==='regulation')chips.unshift(['mapMode','regulation','Global regulation']);
  const globalChip=state.mapMode!=='regulation'&&scope.active&&state.jurisdiction!=='jur-global'?`<span class="global-scope-chip" title="${esc(scope.label)}"><span aria-hidden="true">◎</span> Global scope<span class="sr-only">: ${esc(scope.globalCount)} matching records; scope indicator, not a jurisdiction filter.</span></span>`:'';
  $('filter-chips').innerHTML=globalChip+chips.map(([k,v,label])=>`<button${k==='jurisdiction'&&v==='jur-global'?' class="global-scope-chip"':''} data-remove="${k}" data-value="${esc(v)}" aria-label="Remove filter: ${esc(label)}">${k==='jurisdiction'&&v==='jur-global'?'<span aria-hidden="true">◎</span> ':''}${esc(label)} ×</button>`).join('');
}
function render(){
  regulationMapRecords=state.mapMode==='regulation'?filterRecords(model,{...state,jurisdiction:''}):[];
  current=filterRecords(model,state).sort((a,b)=>a.label.localeCompare(b.label));counts=mapCounts(model,current);
  syncControls();$('result-count').textContent=current.length;$('result-summary').textContent=` of ${model.records.length} research records`;$('empty-state').hidden=!!current.length;
  renderMap();renderTable();renderCards();if(state.view==='graph')renderGraph();if(state.view==='timeline')renderTimeline();
  if(selected){if(model.entities.get(selected)?.type==='Jurisdiction')showJurisdiction(selected);else showEntity(selected);}else if(selectedAssertion)showAssertion(selectedAssertion);else{document.body.classList.remove('has-detail');$('detail-content').innerHTML=state.mapMode==='regulation'?regulationOverview():initialDetail;$('close-detail').hidden=true;}
  saveUrl();
}
function change(patch){Object.assign(state,patch);render();}
function selectView(view){
  // The first general graph visit starts with all records. Explicit graph links
  // and connection actions render their requested view directly, so keep those.
  if(view==='graph'&&!graphView){state=emptyState();selected='';selectedAssertion='';}
  change({view});
}
function reset(){state=historical?emptyState():defaultState();clearDetail();render();}

function renderTimeline(){
  const rows=timelineRows(model,current,timelineKind);
  $('timeline-kind').value=timelineKind;
  $('timeline-summary').textContent=`${rows.length} dated or conditional entries in the filtered records. Event dates and evidence observation dates are separate.`;
  $('timeline-rows').innerHTML=rows.map(event=>`<article class="timeline-event"><div><span class="timeline-date">${esc(event.date_label||event.date.value||'Conditional / date unknown')}</span><small>${esc(timelinePrecisionLabel(event))} · ${esc(human(event.event_role))}</small></div><div><h3>${esc(event.title)}</h3><p>${esc(event.summary)}</p>${event.date.condition?`<p><strong>Condition:</strong> ${esc(event.date.condition)}</p>`:''}${list(event.caveats)}<p class="source-meta">Observed ${esc(event.observed_at||'not recorded')} · human review pending</p>${event.record_ids.map(id=>entityButton(id)).join('')}<details><summary>Event evidence &amp; sources</summary>${(event.sources||[]).map(s=>`<p>${link(s.url||model.sources.get(s.source_id)?.url,s.title||model.sources.get(s.source_id)?.title)}<small>${esc(s.locator||'See record for exact source context')}</small></p>`).join('')}<code>${esc(event.id)}</code></details></div></article>`).join('')||'<p>No calendar entries match these filters. This does not establish that no deadlines exist.</p>';
}

const geoFor = f => model.jurisdictions.find(j=>j.geography.iso_alpha3===countryCode(f));
function regulationMapDescription(id){
  const profile=regulationMapProfile(model,id,regulationMapRecords);
  if(profile)return {label:phaseLabel(profile),headline:profile.headline};
  return regulatoryProfile(model,id)
    ?{label:'No reviewed evidence matches these filters',headline:'Clear the search or filters to restore this jurisdiction’s phase.'}
    :{label:'Not assessed in this phase review',headline:'No phase assessment; this does not mean no law.'};
}

function initMap(){
  mapSvg=d3.select('#world-map');
  const projection=d3.geoNaturalEarth1().fitExtent([[14,22],[946,500]],{type:'Sphere'}),path=d3.geoPath(projection);
  const pattern=mapSvg.append('defs').append('pattern').attr('id','global-scope-pattern').attr('width',8).attr('height',8).attr('patternUnits','userSpaceOnUse');
  pattern.append('rect').attr('width',8).attr('height',8).attr('fill','#c5e7e1');
  pattern.append('path').attr('d','M-2,2L2,-2 M0,8L8,0 M6,10L10,6').attr('stroke','#a0d3ca').attr('stroke-width',1);
  for(const [id,phase] of Object.entries(REGULATORY_PHASES)){
    const hatch=mapSvg.select('defs').append('pattern').attr('id',`phase-territorial-${id}`).attr('width',8).attr('height',8).attr('patternUnits','userSpaceOnUse');
    hatch.append('rect').attr('width',8).attr('height',8).attr('fill',phase.color);
    hatch.append('path').attr('d','M-2,2L2,-2 M0,8L8,0 M6,10L10,6').attr('stroke','#fff').attr('stroke-opacity',.65).attr('stroke-width',2.2);
  }
  const group=mapSvg.append('g');group.append('path').datum({type:'Sphere'}).attr('class','map-ocean').attr('d',path);
  mapPaths=group.selectAll('.country').data(world.features).join('path').attr('class','country').attr('d',path).attr('role','button').attr('tabindex',0)
    .on('click',(_,f)=>selectCountry(f)).on('keydown',(event,f)=>{if(['Enter',' '].includes(event.key)){event.preventDefault();selectCountry(f);}})
    .on('pointermove',(event,f)=>{const j=geoFor(f);const name=j?.label||f.properties.ADMIN||f.properties.NAME;const tip=$('map-tooltip'),phase=regulationMapDescription(j?.jurisdiction_id);tip.innerHTML=`${esc(name)}${state.mapMode==='regulation'?`<span>${esc(phase.label)}</span><span>${esc(phase.headline)}</span>`:''}${mapScope.active?'<span>Global scope highlighted; national adoption is not assessed by this overlay.</span>':''}<span>${j?esc(mapRecordSummary(j)):'Country scope: not assessed in the current research snapshot'}</span>`;tip.hidden=false;const box=event.currentTarget.ownerSVGElement.parentElement.getBoundingClientRect();tip.style.left=Math.min(Math.max(4,event.clientX-box.left+10),box.width-235)+'px';tip.style.top=Math.max(0,event.clientY-box.top-45)+'px';})
    .on('pointerleave',()=>$('map-tooltip').hidden=true);
  mapZoom=d3.zoom().scaleExtent([1,7]).on('zoom',e=>group.attr('transform',e.transform));if(embedded)mapZoom.touchable(()=>false);mapSvg.call(mapZoom).on('dblclick.zoom',null);if(embedded)mapSvg.on('wheel.zoom',null);
  for(const [id,factor] of [['map-plus',1.6],['map-minus',1/1.6]])$(id).onclick=()=>mapSvg.call(mapZoom.scaleBy,factor);
  $('map-reset').onclick=()=>mapSvg.call(mapZoom.transform,d3.zoomIdentity);
}
function selectCountry(f){
  $('map-tooltip').hidden=true;const j=geoFor(f);
  if(j){selected=j.jurisdiction_id;selectedAssertion='';change({jurisdiction:j.jurisdiction_id});revealDetail();}
  else {selected='';selectedAssertion='';detail(`<div class="detail-heading"><span class="badge">Not assessed</span><h2>${esc(f.properties.ADMIN||f.properties.NAME)}</h2><p>No jurisdiction record is present in the current research snapshot. This is not a finding about the existence of DPP regulation or activity.</p></div>`);highlight();saveUrl();revealDetail();}
}
function renderMap(){
  mapScope=globalMapScope(model,current,state);
  if(state.mapMode==='regulation'){renderRegulationMap();return;}
  $('map-coverage-label').textContent='EVIDENCE COVERAGE';$('coverage-legend').hidden=false;$('regulation-legend').hidden=true;
  $('map-note').innerHTML='Country shading includes qualified EU scope joins and labelled ecosystem associations. Small territories and subnational records remain available in the scope filter. <a href="#method">Map methodology ↓</a>';
  $('scope-tray-label').textContent='GLOBAL & REGIONAL SCOPE';
  mapSvg.classed('has-global-scope',mapScope.active);mapPaths.attr('data-regulatory-phase',null);
  mapPaths.attr('fill',f=>{const jid=geoFor(f)?.jurisdiction_id;const n=counts.get(jid)||0;if(!historical&&jid==='jur-gb')return mapScope.active?'url(#global-scope-pattern)':'#e4e8ed';return n>15?'#0969da':n>5?'#72a7e2':n>0?'#c4daf3':mapScope.active?'url(#global-scope-pattern)':'#e4e8ed';})
    .classed('global-scope-country',mapScope.active)
    .attr('aria-label',f=>{const j=geoFor(f);return `${j?.label||f.properties.ADMIN||f.properties.NAME}: ${mapScope.active?'global scope highlighted, not national adoption; ':''}${j?mapRecordSummary(j):'country scope not assessed'}`;});
  $('map-tooltip').hidden=true;
  $('map-inspect-global').disabled=mapScope.globalCount===0;
  $('map-inspect-global').title=mapScope.globalCount?`Inspect ${mapScope.globalCount} matching global records and their evidence. This applies the global scope filter.`:'No global records match the current filters.';
  $('map-global-count').textContent=`Global scope · ${mapScope.globalCount} ${mapScope.globalCount===1?'record':'records'}`;
  $('map-global-key').hidden=!mapScope.active;
  const countryEvidence=model.jurisdictions.some(j=>j.geography.kind==='country'&&counts.get(j.jurisdiction_id)>0);
  document.querySelectorAll('[data-country-key]').forEach(el=>el.hidden=mapScope.active&&(el.dataset.countryKey==='none'||!countryEvidence));
  const hasTerritorialRecords=model.jurisdictions.some(j=>j.geography.kind==='country'&&territorialOrigins(j.jurisdiction_id).length);
  $('map-legend-note').textContent=(mapScope.active?(countryEvidence?'Teal hatching shows global scope. Blue shades show separately recorded country evidence.':'Teal hatching shows global scope. Country evidence counts remain separate.'):'Counts describe this dataset, not regulatory maturity.')+(hasTerritorialRecords?' Country counts include explicitly labelled territorial records; these do not establish nationwide scope.':'');
  $('scope-buttons').innerHTML=model.jurisdictions.filter(j=>['global','region','supranational'].includes(j.geography.kind)).map(j=>`<button data-scope="${j.jurisdiction_id}" aria-pressed="${state.jurisdiction===j.jurisdiction_id}">${esc(j.label)}<b>${counts.get(j.jurisdiction_id)}</b></button>`).join('');highlight();
}

function regulatoryScopeButtons(){
  const featured=['jur-eu','jur-cn','jur-gb','jur-in','jur-us','jur-tw'];
  // Use explicit assessments: EU member-country display joins are not separate reviews.
  const reviewed=model.jurisdictions.filter(j=>model.regulatory.profiles.has(j.jurisdiction_id));
  const territorial=j=>['territory','subnational'].includes(j.geography.kind);
  const alphabetical=(a,b)=>a.label.localeCompare(b.label,'en');
  const countries=reviewed.filter(j=>!territorial(j)).sort((a,b)=>{
    const first=featured.indexOf(a.jurisdiction_id),second=featured.indexOf(b.jurisdiction_id);
    return (first<0?featured.length:first)-(second<0?featured.length:second)||alphabetical(a,b);
  });
  const territories=reviewed.filter(territorial).sort(alphabetical);
  const button=j=>`<button data-regulatory-scope="${esc(j.jurisdiction_id)}" aria-pressed="${state.jurisdiction===j.jurisdiction_id}"${territorial(j)?` title="${esc(j.label)} · ${esc(names([j.geography.parent_id]))}"`:''}>${esc(j.label)}</button>`;
  return countries.map(button).join('')+(territories.length?`<div class="scope-territories" role="group" aria-labelledby="territorial-scopes-label"><span id="territorial-scopes-label">Territorial scopes</span><div class="scope-territory-buttons">${territories.map(button).join('')}</div></div>`:'');
}

function renderRegulationMap(){
  mapScope={active:false,globalCount:0,label:''};
  mapSvg.classed('has-global-scope',false);
  $('map-coverage-label').textContent='REGULATORY PHASES';
  $('coverage-legend').hidden=true;$('regulation-legend').hidden=false;
  mapPaths.classed('global-scope-country',false).attr('data-regulatory-phase',f=>geoFor(f)?.jurisdiction_id==='jur-gb'&&!historical?'territorial-locator':regulationMapProfile(model,geoFor(f)?.jurisdiction_id,regulationMapRecords)?.phase||'unassessed').attr('fill',f=>{
    const profile=regulationMapProfile(model,geoFor(f)?.jurisdiction_id,regulationMapRecords);
    return !profile||profile.map_display==='locator_only'?UNASSESSED_COLOR:profile.scope_kind==='territorial'?`url(#phase-territorial-${profile.phase})`:REGULATORY_PHASES[profile.phase].color;
  }).attr('aria-label',f=>{const j=geoFor(f),phase=regulationMapDescription(j?.jurisdiction_id);return `${j?.label||f.properties.ADMIN||f.properties.NAME}: ${phase.label}; ${phase.headline}`;});
  $('map-inspect-global').disabled=true;$('map-inspect-global').title='Global standards and ecosystems are available through the other exploration presets. This view compares jurisdiction-specific measures.';
  $('map-tooltip').hidden=true;
  $('scope-tray-label').textContent='EXPLORE JURISDICTIONS';
  $('scope-buttons').innerHTML=regulatoryScopeButtons();
  $('map-note').innerHTML='Phases cover DPP and related product-traceability measures. EU colour denotes shared EU instrument scope. Stripes denote territorial scope. Grey means not assessed or excluded by your filters. <a href="data/current-regulatory-phases.json" download>Phase evidence &amp; sources ↓</a>';
  highlight();
}
function renderTable(){
  $('records-table').innerHTML=current.map(e=>`<tr><td><button data-entity="${esc(e.id)}">${esc(e.label)}</button><small>${esc(human(e.type))}</small></td><td>${esc(family[layerOf(e)])}<small>${esc(human(e.status.value))}</small></td><td>${esc(names(e.jurisdiction_ids))}${state.jurisdiction&&model.scopes.get(state.jurisdiction)?.get(e.id)?.scope_basis==='ecosystem_association'?'<small>Also associated with selected location (overlay)</small>':''}${state.jurisdiction&&model.scopes.get(state.jurisdiction)?.get(e.id)?.scope_basis==='territorial_display_rollup'?'<small>Territorial record shown under parent country · display only</small>':''}</td><td>${e.source_ids.length}<small>${esc(human(e.evidence_status))}</small></td></tr>`).join('');
}
function renderCards(){
  const featured=[...current].sort((a,b)=>(model.assertionsByEntity.get(b.id)?.length||0)-(model.assertionsByEntity.get(a.id)?.length||0)).slice(0,6);
  $('record-cards').innerHTML=featured.map(e=>`<button class="record-card" data-entity="${esc(e.id)}"><span class="card-type ${layerOf(e)}">${esc(human(e.type))}</span><strong>${esc(e.label)}</strong><small>${esc(human(e.status.value))} · ${e.source_ids.length} source${e.source_ids.length===1?'':'s'}</small></button>`).join('');
}

function renderGraph(){
  graphView ||= createGraphView({d3,model,onNode:id=>showEntity(id),onEdge:id=>showAssertion(id)});
  const visible=graphData(model,current);
  graphView.draw(visible,graphMode);
  $('graph-download-view-count').textContent=`${visible.nodes.length} records · ${visible.edges.length} connections`;
  $('graph-download').open=false;
  document.querySelectorAll('[data-graph-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.graphLayout===graphMode)));
  const allRecords=Object.entries(emptyState()).every(([key,value])=>key==='view'||(Array.isArray(value)?!state[key].length:state[key]===value));
  document.querySelectorAll('[data-graph-example]').forEach(b=>b.setAttribute('aria-pressed',String(!b.dataset.graphExample?allRecords:b.dataset.graphExample==='std-iso-jtc5'?state.standards.includes('iso-iec-jtc5'):b.dataset.graphExample===state.focus && !state.standards.length && !state.ecosystems.length)));
  highlight();
}

function syncGraphFullscreen(){
  const active=expandedFallback||document.fullscreenElement===$('explore');
  // Restore the interpretation state when leaving the focused graph workspace.
  if(active&&graphOutlookBeforeFullscreen===null){graphOutlookBeforeFullscreen=$('graph-outlook').open;$('graph-outlook').open=false;}
  else if(!active&&graphOutlookBeforeFullscreen!==null){$('graph-outlook').open=graphOutlookBeforeFullscreen;graphOutlookBeforeFullscreen=null;}
  if(active&&!fullscreenInert.length){
    let branch=$('explore');
    while(branch.parentElement){
      for(const sibling of branch.parentElement.children)if(sibling!==branch){fullscreenInert.push([sibling,sibling.inert]);sibling.inert=true;}
      branch=branch.parentElement;if(branch===document.body)break;
    }
  }else if(!active){for(const [element,wasInert] of fullscreenInert)element.inert=wasInert;fullscreenInert=[];}
  $('explore').classList.toggle('graph-expanded',active);
  document.body.classList.toggle('graph-expanded',active);
  $('graph-fullscreen').setAttribute('aria-pressed',String(active));
  $('graph-fullscreen').innerHTML=active?'Exit full screen <span aria-hidden="true">⤢</span>':'Full screen <span aria-hidden="true">⛶</span>';
  $('graph-fullscreen').title=active?'Exit full screen (Escape)':'Focus on the graph and evidence, with page explanations hidden';
  graphView?.setExpanded(active);
}
async function exitGraphFullscreen(){
  expandedFallback=false;
  if(document.fullscreenElement===$('explore'))await document.exitFullscreen();
  syncGraphFullscreen();
  if(state.view==='graph')$('graph-fullscreen').focus({preventScroll:true});
}
async function toggleGraphFullscreen(){
  if(expandedFallback||document.fullscreenElement===$('explore')){await exitGraphFullscreen();return;}
  try{
    if(!$('explore').requestFullscreen||!document.fullscreenEnabled)throw new Error('Fullscreen is unavailable');
    await $('explore').requestFullscreen();
  }catch{
    expandedFallback=true;
    toast('Expanded graph view. Press Escape or Exit full screen to return.');
  }
  syncGraphFullscreen();
}

function downloadGraph(complete=false){
  try{
    const exported=createGraphExport(model.dataset,complete?{exportedAt:new Date().toISOString(),regulatoryProfiles:model.regulatory.review,includeSemantic:!historical}:{records:current,filters:{...state},layout:graphMode,exportedAt:new Date().toISOString(),regulatoryProfiles:model.regulatory.review,includeSemantic:!historical});
    const blob=new Blob([JSON.stringify(exported,null,2)+'\n'],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(blob), anchor=document.createElement('a');
    anchor.href=url;anchor.download=complete?'global-dpp-knowledge-graph.json':'global-dpp-knowledge-graph-current-view.json';
    anchor.hidden=true;document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    $('graph-download').open=false;
    toast(`JSON prepared: ${exported.nodes.length} records and ${exported.edges.length} connections, with evidence and sources.`);
  }catch(error){console.error(error);toast('The graph export could not be prepared. Please use the complete graph download.');}
}
function events(){
  $('graph-download-view').onclick=()=>downloadGraph(false);
  $('graph-download-all').onclick=event=>{event.preventDefault();downloadGraph(true);};
  document.addEventListener('click',event=>{if(!event.target.closest('#graph-download'))$('graph-download').open=false;});
  $('graph-download').addEventListener('keydown',event=>{if(event.key==='Escape'){$('graph-download').open=false;$('graph-download').querySelector('summary').focus();event.stopPropagation();}});
  $('jurisdiction').onchange=()=>openJurisdictionOverview($('jurisdiction').value);
  for(const key of ['sector','status','layer','review','access','claim','observedAfter','observedBefore'])$(key).onchange=()=>change({[key]:$(key).value,...(key==='layer'&&['standards','ecosystems'].includes($(key).value)?{mapMode:'coverage'}:{})});
  $('timeline-kind').onchange=()=>{timelineKind=$('timeline-kind').value;renderTimeline();};
  $('timeline-all').onclick=()=>{state={...emptyState(),view:'timeline'};selected='';selectedAssertion='';render();};
  $('edition-select').onchange=()=>{const p=new URLSearchParams(location.search);p.set('release',$('edition-select').value);if($('edition-select').value==='0.1.0')p.set('mapMode','coverage');location.href=`${location.pathname}?${p}${location.hash}`;};
  $('search').oninput=()=>change({q:$('search').value});
  $('reset').onclick=reset;$('empty-reset').onclick=reset;$('close-detail').onclick=()=>{const target=detailReturnFocus;clearDetail();(target?.isConnected?target:$(state.view+'-tab')).focus();};$('show-table').onclick=()=>{change({view:'table'});$('table-tab').focus();};
  document.addEventListener('change',event=>{const el=event.target;if(!el.matches('[data-filter]'))return;const key=el.dataset.filter;change({mapMode:'coverage',[key]:el.checked?[...state[key],el.value]:state[key].filter(id=>id!==el.value)});});
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.entity){showEntity(b.dataset.entity);revealDetail();}
    if(b.dataset.assertion){showAssertion(b.dataset.assertion);revealDetail();}
    if(b.dataset.view)selectView(b.dataset.view);
    if(b.dataset.graphLayout){graphMode=b.dataset.graphLayout==='network'?'network':'structured';renderGraph();saveUrl();}
    if('graphExample' in b.dataset){selected=b.dataset.graphExample;selectedAssertion='';state=emptyState();change(b.dataset.graphExample==='std-iso-jtc5'?{view:'graph',standards:['iso-iec-jtc5']}:{view:'graph',focus:b.dataset.graphExample});if(b.hasAttribute('data-semantic-example')){$('graph-stage').scrollIntoView({block:'center'});$('graph-stage').focus({preventScroll:true});}}
    if(b.dataset.graphAction==='inspect')revealDetail();
    if(b.dataset.graphAction==='clear'){
      const previousNode=selected;clearDetail();
      (document.querySelector(`[data-node-id="${CSS.escape(previousNode)}"]`)||$('graph-stage')).focus({preventScroll:true});
    }
    if(b.dataset.graphAction==='focus'&&selected){state=emptyState();change({view:'graph',focus:selected});document.querySelector('[data-graph-action=focus]')?.focus({preventScroll:true});}

    if(b.dataset.regulatoryScope){openJurisdictionOverview(b.dataset.regulatoryScope,'map');revealDetail();return;}
    if(b.dataset.scope){selected=b.dataset.scope;selectedAssertion='';change({jurisdiction:b.dataset.scope});revealDetail();}
    if(b.dataset.focus){selected=b.dataset.focus;selectedAssertion='';state=emptyState();change({view:'graph',focus:b.dataset.focus});}
    if(b.dataset.group){const g=model.groups.find(g=>g.id===b.dataset.group);state=emptyState();change({[g.kind==='standards'?'standards':'ecosystems']:[g.id]});}
    if(b.dataset.remove==='mapMode'){change({mapMode:'coverage'});return;}
    if(b.dataset.remove){const key=b.dataset.remove;if(key==='jurisdiction'&&model.entities.get(selected)?.type==='Jurisdiction'){selected='';selectedAssertion='';}change({[key]:Array.isArray(state[key])?state[key].filter(id=>id!==b.dataset.value):''});}
    if(b.dataset.preset){
      // Exploration presets change the topic while keeping the reader's chosen view.
      state={...emptyState(),view:state.view};
      clearDetail();
      change(presets[b.dataset.preset]);
      mapSvg.call(mapZoom.transform,d3.zoomIdentity);
    }
  });
  document.querySelector('.tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const views=['map','graph','table','timeline'],i=views.indexOf(state.view),next=event.key==='Home'?0:event.key==='End'?3:(i+(event.key==='ArrowRight'?1:3))%4;selectView(views[next]);$(views[next]+'-tab').focus();});
  $('share').onclick=async()=>{saveUrl();try{await navigator.clipboard.writeText(location.href);toast('View link copied, including filters and selection.');}catch{toast('Copy the address from your browser to share this view.');}};
  window.addEventListener('popstate',()=>{if((new URLSearchParams(location.search).get('release')==='0.1.0')!==historical){location.reload();return;}state=parseState(location.search,model);if(historical)state.mapMode='coverage';const p=new URLSearchParams(location.search);graphMode=p.get('layout')==='network'?'network':'structured';selected=model.entities.has(p.get('selected'))?p.get('selected'):(!p.get('assertion')?state.jurisdiction:'');selectedAssertion=model.dataset.assertions.some(a=>a.id===p.get('assertion'))?p.get('assertion'):'';render();});
  for(const id of ['graph-outlook-jump','graph-guide-jump','semantic-guide-jump'])$(id).onclick=()=>{
    $('graph-outlook').open=true;
    $('graph-outlook-heading').focus({preventScroll:true});
  };
  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-semantic-guide]'))return;
    if(state.view!=='graph')selectView('graph');
    $('graph-outlook').open=true;
  });
  $('graph-fullscreen').onclick=toggleGraphFullscreen;
  $('graph-stage-fullscreen').onclick=toggleGraphFullscreen;
  document.addEventListener('fullscreenchange',syncGraphFullscreen);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&expandedFallback){exitGraphFullscreen();$('graph-fullscreen').focus();}});
}

function prepareEmbeddedLinks(scope=document){
  if(!embedded)return;
  scope.querySelectorAll('a[href]:not([target])').forEach(a=>{if(!a.getAttribute('href').startsWith('#'))a.target='_top';});
}
function setupEmbeddedView(){
  if(!embedded)return;
  document.body.classList.add('dpp-embedded');
  $('embed-toolbar').hidden=false;
  $('atlas-filters').hidden=true;
  const setFilters=open=>{
    $('atlas-filters').hidden=!open;
    $('embed-filters').setAttribute('aria-expanded',String(open));
    if(open)$('search').focus();
    else{$((state?.view||'map')+'-tab').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
  };
  $('embed-filters').onclick=()=>setFilters($('atlas-filters').hidden);
  $('embed-show-results').onclick=()=>setFilters(false);
  document.querySelectorAll('a[href="#method"]').forEach(a=>{a.href='./#method';a.target='_top';});
  prepareEmbeddedLinks();
}
async function start(){
  setupEmbeddedView();
  try{
    const data=await loadAtlasData(async path=>{const response=await fetch(path);if(!response.ok)throw new Error(`Could not load ${path} (${response.status})`);return response.json();},historical?'0.1.0':'current');
    d3=window.d3;if(!d3)throw new Error('The local graph library did not load.');
    model=createModel(data.dataset,data.map,data.taxonomy);model.regulatory=createRegulatoryModel(model,data.regulatory);model.historical=historical;document.body.classList.toggle('is-historical',historical);model.timeline=data.timeline;model.calendar=data.calendar;world=data.world;state=parseState(location.search,model);if(historical)state.mapMode='coverage';
    const editionVersion=model.dataset.metadata.version;
    const evidenceDate=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${model.dataset.metadata.evidence_cutoff}T00:00:00Z`));
    $('edition-select').value=historical?'0.1.0':'current';$('edition-label').textContent=historical?'FROZEN 0.1.0':`RESEARCH RELEASE ${editionVersion}`;$('edition-description').textContent=historical?'Immutable baseline · 23 October 2026':`Research release · evidence through ${evidenceDate}`;
    document.querySelectorAll('[data-preset=regulation],[data-preset=aasGlobal]').forEach(button=>button.hidden=historical);
    document.querySelectorAll('a[href="data/knowledge-graph.json"]').forEach(link=>link.href=historical?'data/knowledge-graph-0.1.0.json':'data/knowledge-graph.json');
    if(historical){$('timeline-kind').querySelector('[value=regulatory]').disabled=true;$('timeline-download').href='releases/0.1.0/views/timeline.json';}
    const p=new URLSearchParams(location.search);selected=model.entities.has(p.get('selected'))?p.get('selected'):(!p.get('assertion')?state.jurisdiction:'');selectedAssertion=model.dataset.assertions.some(a=>a.id===p.get('assertion'))?p.get('assertion'):'';
    const complete=graphData(model,model.records);
    $('graph-download-all-count').textContent=`${complete.nodes.length} records · ${complete.edges.length} connections`;
    $('evidence-current-summary').textContent=`This ${historical?'frozen baseline':`research release ${editionVersion}`} contains ${complete.nodes.length} substantive records and ${complete.edges.length} active sourced connections. Evidence cutoff: ${model.dataset.metadata.evidence_cutoff}.`;
    $('phase-items').innerHTML=Object.values(REGULATORY_PHASES).map(phase=>`<div class="phase-legend-item"><i style="--phase-color:${phase.color}" aria-hidden="true">${phase.symbol}</i><span><strong>${esc(phase.label)}</strong><small>${esc(phase.description)}</small></span></div>`).join('');
    fillFilters();initMap();events();render();
    if(state.view==='graph'&&['#graph-outlook','#graph-guide','#semantic-guide'].includes(location.hash))$(location.hash.slice(1)).scrollIntoView({block:'start'});
  }catch(error){$('load-error').hidden=false;$('load-error').textContent=`The interactive data could not be loaded. ${error.message} Open the static evidence catalogue below, or serve this folder through a web server.`;$('result-count').textContent='Unavailable';console.error(error);}
}
start();
