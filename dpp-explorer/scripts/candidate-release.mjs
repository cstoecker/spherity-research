import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { applyEvidenceUpdates, applyEvidenceTaxonomyUpdates } from '../src/evidence-updates.js';
import { createGraphExport } from '../src/graph-export.js';
import { STRUCTURAL, layerOf, currentAssertions } from '../src/model.js';
import { SEMANTIC_REVIEW, SEMANTIC_PROFILES } from '../src/semantic-profiles.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baselineRoot = path.join(root, 'dpp-research/releases/0.1.0');
export const candidateRoot = path.join(root, 'dpp-research/candidates/0.2.0');
export const CANDIDATE = Object.freeze({version:'0.2.0', schema_version:'0.2.0', protocol_version:'0.2.0', previous_version:'0.1.0', release_date:'2026-10-25', evidence_cutoff:'2026-10-25', candidate_id:'0.2.0-candidate-2026-10-25'});
const clone = value => structuredClone(value);
const json = async file => JSON.parse(await fs.readFile(file, 'utf8'));
const bytes = value => Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const countBy = (rows,key) => Object.fromEntries([...new Set(rows.map(key))].sort().map(value=>[value,rows.filter(row=>key(row)===value).length]));
const dateOK = value => /^\d{4}-\d{2}-\d{2}$/.test(value||'') && !Number.isNaN(Date.parse(value)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10)===value;

/** Explicit successor schema. The sealed schema and scripts remain untouched. */
export function candidateSchema(baselineSchema) {
  const schema=clone(baselineSchema);
  schema.$id='urn:spherity:dpp-atlas:schema:0.2.0';
  schema.title='Global DPP Atlas candidate dataset schema 0.2.0';
  schema.description='Qualified documentary and analytical records, including explicit curation history and source-observation identity. Semantic and reference checks supplement this schema.';
  const meta=schema.$defs.Metadata;
  meta.properties.release_status.enum.push('candidate');
  Object.assign(meta.properties,{
    previous_version:{type:'string',pattern:'^\\d+\\.\\d+\\.\\d+$'},
    candidate_id:{type:'string',minLength:1},
    change_manifest:{type:'string',const:'change-manifest.json'},
    evidence_updates:{type:'object'},
    evidence_batches:{type:'array',items:{type:'object',additionalProperties:false,properties:{id:{type:'string'},checked_at:{type:'string',format:'date'},description:{type:'string'},review_status:{const:'machine_assisted_unreviewed'}},required:['id','checked_at','description','review_status']}}
  });
  meta.required.push('previous_version','candidate_id','change_manifest','evidence_batches');
  schema.$defs.Assertion.properties.predicate.enum.push('coordinates_with','liaison_with','uses_standard');
  schema.$defs.Assertion.properties.evidence_type.enum.push('meeting_minutes');
  schema.$defs.Source.properties.source_type.enum.push('standard');
  schema.$defs.Assertion.properties.curation={type:'object',additionalProperties:false,properties:{status:{const:'superseded'},superseded_at:{type:'string',format:'date'},replacement_ids:{type:'array',minItems:1,items:{type:'string'}},reason:{type:'string',minLength:1}},required:['status','superseded_at','replacement_ids','reason']};
  Object.assign(schema.$defs.Source.properties,{
    locator:{type:'string'},published_at:{type:['string','null'],format:'date'},updated_at:{type:['string','null'],format:'date'},
    source_identity_id:{type:'string',pattern:'^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$'},artifact_version:{type:['string','null']}
  });
  return schema;
}

function sourceIdentity(url) {
  const u=new URL(url); u.hash='';
  return `${u.protocol}//${u.hostname.toLowerCase()}${decodeURIComponent(u.pathname).replace(/\/$/,'')}${u.search}`;
}

export function assembleCandidate(baseline,updates,batches) {
  const dataset=applyEvidenceUpdates(baseline,updates), changes=[];
  const originalCounts=Object.fromEntries(['entities','assertions','sources'].map(key=>[key,dataset[key].length]));
  for(const batch of batches) {
    if(!batch.id || !batch.description || !dateOK(batch.checked_at) || batch.review_status!=='machine_assisted_unreviewed') throw new Error('Unqualified candidate evidence batch');
    for(const kind of ['entities','assertions','sources']) {
      if(!Array.isArray(batch[kind]))throw new Error(`Missing ${kind} in ${batch.id}`);
      for(const record of batch[kind]) {
        if(dataset[kind].some(row=>row.id===record.id))throw new Error(`Candidate ID collision: ${record.id}`);
        dataset[kind].push(clone(record));
        changes.push({change_id:`${batch.id}-add-${record.id}`,batch_id:batch.id,operation:'add',kind,id:record.id,previous:null,current:clone(record),observed_at:batch.checked_at,source_ids:record.source_ids||[record.id],reason:batch.description,review_status:'machine_assisted_unreviewed'});
      }
    }
    for(const revision of batch.revisions||[]) {
      if(!['entities','sources'].includes(revision.kind)||!revision.reason||!revision.source_ids?.length||!dateOK(revision.observed_at))throw new Error(`Unqualified revision in ${batch.id}`);
      const index=dataset[revision.kind].findIndex(row=>row.id===revision.id);
      if(index<0||revision.record?.id!==revision.id)throw new Error(`Invalid revision ID ${revision.id}`);
      const previous=clone(dataset[revision.kind][index]);
      dataset[revision.kind][index]=clone(revision.record);
      changes.push({change_id:`${batch.id}-revise-${revision.id}`,batch_id:batch.id,operation:'revise',...clone(revision),previous,current:clone(revision.record),review_status:'machine_assisted_unreviewed'});
    }
    for(const supersession of batch.supersessions||[]) {
      const old=dataset.assertions.find(row=>row.id===supersession.assertion_id);
      if(!old||old.curation||!supersession.replacement_ids?.length||!supersession.reason||!supersession.source_ids?.length||!dateOK(supersession.observed_at))throw new Error(`Invalid supersession ${supersession.assertion_id}`);
      for(const id of supersession.replacement_ids)if(id===old.id||!dataset.assertions.some(row=>row.id===id))throw new Error(`Missing replacement assertion ${id}`);
      const previous=clone(old);
      old.curation={status:'superseded',superseded_at:supersession.observed_at,replacement_ids:clone(supersession.replacement_ids),reason:supersession.reason};
      changes.push({change_id:`${batch.id}-supersede-${old.id}`,batch_id:batch.id,operation:'supersede',kind:'assertions',id:old.id,previous,current:clone(old),...clone(supersession),review_status:'machine_assisted_unreviewed'});
    }
  }
  const identities=new Map();
  for(const source of dataset.sources) {
    const identity=sourceIdentity(source.url);
    if(!identities.has(identity))identities.set(identity,source.id);
    source.source_identity_id ||= identities.get(identity);
  }
  dataset.metadata={...dataset.metadata,...CANDIDATE,title:'Global DPP Atlas — candidate evidence release 0.2.0',release_status:'candidate',change_manifest:'change-manifest.json',evidence_batches:batches.map(({id,checked_at,description,review_status})=>({id,checked_at,description,review_status})),coverage_statement:'Selected international evidence from immutable release 0.1.0, seven retained website update batches and dated manuscript supplements. Coverage is incomplete; country scope and analytical classifications are not adoption rankings.',limitations:[...dataset.metadata.limitations,'Unsealed candidate release: computational validation is not independent human review.','Later documentary observations do not establish live-service operation or successful testing.']};
  const changeManifest={version:CANDIDATE.version,candidate_id:CANDIDATE.candidate_id,previous_version:CANDIDATE.previous_version,checked_at:CANDIDATE.evidence_cutoff,review_status:'machine_assisted_unreviewed',retained_website_update:clone(updates),pre_candidate_counts:originalCounts,changes,source_identity_method:'Exact canonical URL (excluding fragment/trailing slash) groups retrieval observations. Distinct edition URLs retain distinct identities. Rolling URLs share a resource identity; artifact versions and access remain on their individual observations. Semantic aliases require explicit review. Historical source IDs and access states remain in their original release.',schema_changes:['Explicit candidate metadata and predecessor','Documented committee coordination, liaison and technical-use predicates retained from website updates','Source locator, publication/update dates and source identity grouping','Assertion curation history separate from legal valid_from/valid_to'],validation_boundary:'No registry transaction, EDC test, independent interoperability reproduction or human adjudication is performed by this build.'};
  return {dataset,changeManifest};
}

/** Strict shape validation plus referential, temporal and evidence boundaries. */
export function validateCandidate(dataset,schema,changeManifest,calendar) {
  const ajv=new Ajv2020({allErrors:true,strict:false}); addFormats(ajv);
  const validate=ajv.compile(schema);
  if(!validate(dataset))throw new Error(`Candidate schema validation failed:\n${ajv.errorsText(validate.errors,{separator:'\n'})}`);
  const all=[...dataset.entities,...dataset.assertions,...dataset.sources],ids=new Set(all.map(row=>row.id));
  if(ids.size!==all.length)throw new Error('Duplicate IDs across candidate collections');
  const entities=new Map(dataset.entities.map(e=>[e.id,e])),sources=new Map(dataset.sources.map(s=>[s.id,s])),assertions=new Map(dataset.assertions.map(a=>[a.id,a]));
  const check=(ok,message)=>{if(!ok)throw new Error(message);};
  const day=(date,label)=>check(dateOK(date),`Invalid calendar day: ${label}`);
  const refs=(values,pool,label)=>{check(new Set(values).size===values.length,`Duplicate references: ${label}`);for(const id of values)check(pool.has(id),`Unresolved ${id} in ${label}`);};
  for(const entity of dataset.entities) {
    refs(entity.source_ids,sources,entity.id);refs(entity.jurisdiction_ids,entities,entity.id);refs(entity.sector_ids,entities,entity.id);
    check(STRUCTURAL.has(entity.type)||entity.source_ids.length,`Unsourced entity ${entity.id}`);
    check(entity.review_status==='machine_assisted_unreviewed',`Human review cannot be conferred by candidate build: ${entity.id}`);
    day(entity.status.as_of,entity.id);check(entity.status.as_of<=dataset.metadata.evidence_cutoff,`Future observation ${entity.id}`);
    for(const id of entity.jurisdiction_ids)check(entities.get(id).type==='Jurisdiction',`Wrong jurisdiction type ${entity.id}`);
    for(const id of entity.sector_ids)check(entities.get(id).type==='Sector',`Wrong sector type ${entity.id}`);
    check((entity.type==='Jurisdiction')===!!entity.geography,`Geography/type mismatch ${entity.id}`);
    if(entity.geography){refs(entity.geography.member_ids,entities,entity.id);if(entity.geography.parent_id)refs([entity.geography.parent_id],entities,entity.id);}
    for(const event of entity.dates){
      refs(event.source_ids,sources,entity.id);check(event.source_ids.length,`Unsourced date ${entity.id}`);
      const widths={day:/^\d{4}-\d{2}-\d{2}$/,month:/^\d{4}-\d{2}$/,year:/^\d{4}$/};
      if(widths[event.precision]){check(widths[event.precision].test(event.date||''),`Date precision mismatch ${entity.id}`);day(event.date+({day:'',month:'-01',year:'-01-01'}[event.precision]),entity.id);}
      else check(event.date===null&&(event.precision!=='conditional'||event.condition),`Conditional/unknown date must not be invented: ${entity.id}`);
    }
    if(entity.evidence_status==='primary_rechecked')check(entity.source_ids.some(id=>sources.get(id).access_status==='opened'),`Rechecked entity lacks an opened source ${entity.id}`);
  }
  for(const assertion of dataset.assertions){
    refs([assertion.subject],entities,assertion.id);refs(assertion.source_ids,sources,assertion.id);
    if(assertion.object.entity_id)refs([assertion.object.entity_id],entities,assertion.id);
    if(assertion.object.datatype==='date')day(assertion.object.value,assertion.id);
    day(assertion.observed_at,assertion.id);check(assertion.observed_at<=dataset.metadata.evidence_cutoff,`Future assertion observation ${assertion.id}`);
    for(const key of ['valid_from','valid_to'])if(assertion[key])day(assertion[key],assertion.id);
    check(!assertion.valid_from||!assertion.valid_to||assertion.valid_from<=assertion.valid_to,`Reversed validity ${assertion.id}`);
    check(assertion.review_status==='machine_assisted_unreviewed',`Unsubstantiated human review ${assertion.id}`);
    if(assertion.curation){refs(assertion.curation.replacement_ids,assertions,assertion.id);day(assertion.curation.superseded_at,assertion.id);}
    const inter=assertion.interoperability;
    if(inter){check(inter.independence!=='independently_reproduced',`No independent reproduction performed: ${assertion.id}`);if(inter.test_date){day(inter.test_date,assertion.id);check(inter.test_date<=assertion.observed_at,`Future test result ${assertion.id}`);}if(inter.result==='reported_success')check(assertion.assertion_type==='reported_result',`Unattributed result ${assertion.id}`);}
  }
  for(const source of dataset.sources){
    if(source.retrieved_at){day(source.retrieved_at,source.id);check(source.retrieved_at<=dataset.metadata.evidence_cutoff,`Future retrieval ${source.id}`);}
    check(source.access_status!=='opened'||source.retrieved_at,`Opened source without retrieval ${source.id}`);
    check(source.access_status!=='dossier_only'||source.retrieved_at===null,`Dossier-only source invents retrieval ${source.id}`);
    refs([source.source_identity_id],sources,source.id);
  }
  for(const entity of dataset.entities){const seen=new Set();let cursor=entity;while(cursor?.geography?.parent_id){check(!seen.has(cursor.id),`Geographic parent cycle ${entity.id}`);seen.add(cursor.id);cursor=entities.get(cursor.geography.parent_id);}}
  for(const change of changeManifest.changes)refs(change.source_ids||[],sources,change.change_id);
  for(const event of [...(calendar?.events||[]),...(calendar?.checkpoints||[])]){
    refs(event.record_ids,entities,event.id);check(event.sources?.length,`Unsourced calendar event ${event.id}`);
    refs(event.sources.map(ref=>ref.source_id),sources,event.id);day(event.observed_at,event.id);
    for(const ref of event.sources)check(ref.url===sources.get(ref.source_id).url&&ref.locator,`Calendar source/locator mismatch ${event.id}`);
    check(event.observed_at<=dataset.metadata.evidence_cutoff,`Future calendar observation ${event.id}`);
    check(['day','month','year','conditional','unknown'].includes(event.date?.precision),`Unsupported calendar precision ${event.id}`);
    if(['conditional','unknown'].includes(event.date.precision))check(event.date.value===null&&(event.date.precision!=='conditional'||event.date.condition),`Invented or unqualified conditional calendar day ${event.id}`);
    else {const suffix={day:'',month:'-01',year:'-01-01'}[event.date.precision];check(event.date.value?.length==={day:10,month:7,year:4}[event.date.precision],`Calendar precision mismatch ${event.id}`);day(event.date.value+suffix,event.id);}
  }
  const active=currentAssertions(dataset),nodes=dataset.entities.filter(e=>!STRUCTURAL.has(e.type)),nodeIds=new Set(nodes.map(e=>e.id));
  return {status:'passed',scope:'Strict JSON Schema, references, dates, history and evidence boundaries; no legal adjudication, live service test or independent human review.',schema_version:CANDIDATE.schema_version,counts:{entities:dataset.entities.length,substantive_records:nodes.length,assertions:dataset.assertions.length,active_assertions:active.length,graph_edges:active.filter(a=>nodeIds.has(a.subject)&&nodeIds.has(a.object.entity_id)).length,sources:dataset.sources.length,source_identities:new Set(dataset.sources.map(s=>s.source_identity_id)).size},entity_types:countBy(dataset.entities,e=>e.type),source_access:countBy(dataset.sources,s=>s.access_status),human_reviewed_assertions:0,qualified_interoperability_claims:active.filter(a=>a.interoperability).length,checks:['Strict candidate schema including retained website predicates','Unique IDs and complete source/entity references','Day/month/year precision and conditional-date integrity','Observation/retrieval cutoff separate from event time','Source access and recheck consistency','History-preserving assertion supersession','Source observations retain identities and access limits','Calendar record/source references','No automatically assigned human review or independent result']};
}

export function candidateProjections(dataset) {
  const entities=dataset.entities,assertions=currentAssertions(dataset),byId=new Map(entities.map(e=>[e.id,e]));
  const euMembers=new Set(byId.get('jur-eu').geography.member_ids);
  const jurisdictions=entities.filter(e=>e.type==='Jurisdiction').map(j=>{
    const records=entities.filter(e=>!STRUCTURAL.has(e.type)).flatMap(e=>{
      const direct=e.jurisdiction_ids.includes(j.id),inherited=euMembers.has(j.id)&&e.jurisdiction_ids.includes('jur-eu')&&layerOf(e)==='legal';
      return direct||inherited?[{entity_id:e.id,label:e.label,entity_type:e.type,layer:{legal:'legal_and_policy',standards:'standards_and_specifications',ecosystems:'ecosystem_and_implementation'}[layerOf(e)],status:clone(e.status),sector_ids:clone(e.sector_ids),source_ids:clone(e.source_ids),review_status:e.review_status,evidence_status:e.evidence_status,scope_basis:direct?'direct_record':'eu_membership_display_join',membership_assertion_id:direct?null:`a-root-eu-member-${j.id.replace('jur-','')}`,limitations:clone(e.limitations)}]:[];
    });
    return {jurisdiction_id:j.id,label:j.label,geography:clone(j.geography),coverage:records.some(r=>r.scope_basis==='direct_record')?'selected_direct_records':records.length?'eu_instrument_scope_only':'no_record_extracted',records};
  });
  const timeline=entities.flatMap(e=>e.dates.map((date,index)=>({id:`event-${e.id}-${index+1}`,entity_id:e.id,label:e.label,entity_type:e.type,jurisdiction_ids:e.jurisdiction_ids,sector_ids:e.sector_ids,observed_at:e.status.as_of,review_status:e.review_status,...clone(date)}))).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999')||a.id.localeCompare(b.id));
  const standards=entities.filter(e=>['Standard','StandardisationProject','Specification','Ontology','Committee','Initiative','CertificationScheme'].includes(e.type)).map(e=>({...clone(e),citation_assertion_ids:assertions.filter(a=>a.predicate==='cites_standard'&&a.object.entity_id===e.id).map(a=>a.id)}));
  const interoperability=assertions.filter(a=>a.interoperability).map(a=>({assertion_id:a.id,subject:a.subject,statement:a.statement,source_ids:a.source_ids,locator:a.locator,review_status:a.review_status,...clone(a.interoperability)}));
  const dimensions=['product_identity','syntactic_exchange','semantic_meaning','evidence_provenance','authentication','business_identity','delegated_authority','access_control','lifecycle_continuity','legal_acceptance'];
  const aliases={semantic:'semantic_meaning',protocol:'syntactic_exchange',identity_authentication:'authentication'};
  const interoperability_matrix=interoperability.flatMap(claim=>dimensions.map(dimension=>{const assessed=claim.dimensions.some(d=>(aliases[d]||d)===dimension);return {assertion_id:claim.assertion_id,dimension,coding_status:assessed?'bounded_reported_evidence':'not_assessed',result:assessed?claim.result:'not_tested',source_ids:assessed?claim.source_ids:[],independence:claim.independence,limitations:[...claim.limitations,...(assessed?[]:['Missing evidence is not a failed test.'])]};}));
  const review_queue=entities.filter(e=>!STRUCTURAL.has(e.type)).map(e=>({entity_id:e.id,priority:layerOf(e)==='legal'||e.dates.some(d=>d.precision==='conditional')?'high':'normal',review_status:e.review_status,source_ids:e.source_ids,reasons:[...(layerOf(e)==='legal'?['legal_scope_or_status']:[]),...(e.limitations.length?['recorded_limitations']:[])],limitations:e.limitations}));
  return {world_map:{dataset_version:CANDIDATE.version,candidate_id:CANDIDATE.candidate_id,default_missing_country_state:'not_assessed',interpretation:'Selected evidence coverage. EU joins show instrument scope; global and territorial records do not imply national adoption.',jurisdictions},timeline,standards,interoperability,interoperability_matrix,review_queue};
}

export function candidateJsonLd(dataset) {
  const ns=dataset.metadata.namespace;
  const context={atlas:ns,rdf:'http://www.w3.org/1999/02/22-rdf-syntax-ns#',rdfs:'http://www.w3.org/2000/01/rdf-schema#',prov:'http://www.w3.org/ns/prov#',dct:'http://purl.org/dc/terms/',dcat:'http://www.w3.org/ns/dcat#',xsd:'http://www.w3.org/2001/XMLSchema#',label:'rdfs:label',description:'dct:description',record:{'@id':'atlas:record','@type':'@json'}};
  const graph=[{'@id':`${ns}candidate:${dataset.metadata.candidate_id}`,'@type':['dcat:Dataset','prov:Entity'],label:dataset.metadata.title,'dcat:version':dataset.metadata.version,record:clone(dataset.metadata)}];
  for(const entity of dataset.entities)graph.push({'@id':ns+entity.id,'@type':['atlas:'+entity.type,'prov:Entity'],label:entity.label,description:entity.description,'prov:wasDerivedFrom':entity.source_ids.map(id=>({'@id':ns+id})),record:clone(entity)});
  for(const source of dataset.sources)graph.push({'@id':ns+source.id,'@type':'prov:Entity',label:source.title,'dct:source':{'@id':source.url},'atlas:sourceIdentity':{'@id':ns+source.source_identity_id},record:clone(source)});
  for(const assertion of dataset.assertions){const object=assertion.object;graph.push({'@id':ns+assertion.id,'@type':['rdf:Statement','prov:Entity'],'rdf:subject':{'@id':ns+assertion.subject},'rdf:predicate':{'@id':ns+assertion.predicate},'rdf:object':object.entity_id?{'@id':ns+object.entity_id}:{'@value':object.value,'@type':'xsd:'+({number:'decimal'}[object.datatype]||object.datatype)},description:assertion.statement,'prov:wasDerivedFrom':assertion.source_ids.map(id=>({'@id':ns+id})),'atlas:locator':assertion.locator,'atlas:reviewStatus':assertion.review_status,'atlas:assertionType':assertion.assertion_type,'atlas:evidenceType':assertion.evidence_type,'atlas:curationStatus':assertion.curation?.status||'active','atlas:replacedBy':(assertion.curation?.replacement_ids||[]).map(id=>({'@id':ns+id})),'atlas:observedAt':{'@value':assertion.observed_at,'@type':'xsd:date'},record:clone(assertion)});}
  return {'@context':context,'@graph':graph};
}

function csv(rows,fields){const cell=v=>`"${String(v&&typeof v==='object'?JSON.stringify(v):v??'').replaceAll('"','""')}"`;return fields.join(',')+'\n'+rows.map(row=>fields.map(k=>cell(row[k])).join(',')).join('\n')+'\n';}

export async function loadCandidate() {
  const baseline=await json(path.join(baselineRoot,'dataset.json'));
  const updates=await json(path.join(root,'dpp-explorer/src/data/evidence-updates.json'));
  const batches=await Promise.all(['candidate-regulatory-2026-10-25.json','candidate-technical-2026-10-25.json'].map(name=>json(path.join(root,'dpp-explorer/src/data',name))));
  const calendar=await json(path.join(root,'dpp-explorer/src/data/regulatory-calendar-2026-10-25.json'));
  const {dataset,changeManifest}=assembleCandidate(baseline,updates,batches);
  const schema=candidateSchema(await json(path.join(baselineRoot,'dataset.schema.json')));
  const validation=validateCandidate(dataset,schema,changeManifest,calendar),views=candidateProjections(dataset);
  const taxonomy=applyEvidenceTaxonomyUpdates(await json(path.join(root,'dpp-explorer/src/data/ecosystems.json')),updates);
  for(const batch of batches)for(const addition of batch.navigation_groups||[]){
    let group=taxonomy.groups.find(g=>g.id===addition.id);
    if(!group){group={id:addition.id,label:addition.label||addition.id.replaceAll('-',' '),kind:addition.kind||'standards',entity_ids:[],source_ids:[],description:addition.description,membership_basis:'editorial_filter'};taxonomy.groups.push(group);}
    group.entity_ids=[...new Set([...group.entity_ids,...addition.entity_ids])];group.source_ids=[...new Set([...group.source_ids,...addition.source_ids])];group.description=addition.description;
  }
  for(const group of taxonomy.groups)if({'aas-international':'AAS — international evidence','identity-policy-evidence':'Identity, policy & evidence'}[group.id])group.label={'aas-international':'AAS — international evidence','identity-policy-evidence':'Identity, policy & evidence'}[group.id];
  taxonomy.dataset_version=CANDIDATE.version;taxonomy.candidate_id=CANDIDATE.candidate_id;
  const entities=new Set(dataset.entities.map(e=>e.id)),sources=new Set(dataset.sources.map(s=>s.id));
  for(const group of taxonomy.groups){for(const id of group.entity_ids)if(!entities.has(id))throw new Error(`Unknown taxonomy entity ${id}`);for(const id of group.source_ids)if(!sources.has(id))throw new Error(`Unknown taxonomy source ${id}`);}
  const regulatory=await json(path.join(root,'dpp-explorer/src/data/regulatory-phases.json'));
  changeManifest.regulatory_overlay_corrections=clone(regulatory.corrections||[]);
  regulatory.id='regulatory-phases-0.2.0-candidate';regulatory.dataset_version=CANDIDATE.version;regulatory.candidate_id=CANDIDATE.candidate_id;
  // UK remains a navigation parent. Its whole-country geometry must not inherit
  // Great Britain's proposal or Northern Ireland's separate legal position.
  const uk=regulatory.profiles.find(p=>p.jurisdiction_id==='jur-gb');
  if(uk){uk.map_display='locator_only';uk.headline='United Kingdom · inspect Great Britain and Northern Ireland separately';uk.caveats.unshift('The UK outline is a neutral locator. Great Britain-only records do not colour the whole United Kingdom.');}
  const eu=regulatory.profiles.find(p=>p.jurisdiction_id==='jur-eu');
  if(eu){eu.related_record_ids=[...new Set([...(eu.related_record_ids||[]),...batches[0].entities.filter(e=>e.jurisdiction_ids.includes('jur-eu')&&!/machinery|cyber-resilience|cra/.test(e.id)).map(e=>e.id)])];}
  const semantic={review:SEMANTIC_REVIEW,profiles:SEMANTIC_PROFILES,interpretation:'Separate scoped annotation overlay; no inference to connected records.'};
  const graph=createGraphExport(dataset,{exportedAt:null,regulatoryProfiles:regulatory});
  const outputs=new Map([
    ['dataset.json',bytes(dataset)],['dataset.schema.json',bytes(schema)],['dataset.jsonld',bytes(candidateJsonLd(dataset))],['change-manifest.json',bytes(changeManifest)],['validation-report.json',bytes(validation)],
    ['views/world-map.json',bytes(views.world_map)],['views/graph.json',bytes(graph)],['views/standards.json',bytes(views.standards)],['views/timeline.json',bytes(views.timeline)],['views/review-queue.json',bytes(views.review_queue)],['views/interoperability.json',bytes(views.interoperability)],['views/interoperability-matrix.json',bytes(views.interoperability_matrix)],['views/regulatory-calendar.json',bytes(calendar)],['views/regulatory-phases.json',bytes(regulatory)],['views/semantic-profiles.json',bytes(semantic)],['views/ecosystems.json',bytes(taxonomy)],
    ['figure-inputs/regulatory-world-map.json',bytes({dataset_version:CANDIDATE.version,world_map:views.world_map,regulatory_profiles:regulatory})],['figure-inputs/regulatory-timeline.json',bytes({dataset_version:CANDIDATE.version,events:calendar.events.filter(event=>event.display_figure2)} )],
    ['vocabulary.json',bytes({entity_types:schema.$defs.Entity.properties.type.enum,predicates:schema.$defs.Assertion.properties.predicate.enum,evidence_types:schema.$defs.Assertion.properties.evidence_type.enum,assertion_types:schema.$defs.Assertion.properties.assertion_type.enum,source_types:schema.$defs.Source.properties.source_type.enum})],
    ['tables/entities.csv',Buffer.from(csv(dataset.entities,[...new Set(dataset.entities.flatMap(record=>Object.keys(record)))]))],['tables/assertions.csv',Buffer.from(csv(dataset.assertions,[...new Set(dataset.assertions.flatMap(record=>Object.keys(record)))]))],['tables/sources.csv',Buffer.from(csv(dataset.sources,[...new Set(dataset.sources.flatMap(record=>Object.keys(record)))]))],['tables/timeline.csv',Buffer.from(csv(views.timeline,['id','entity_id','label','kind','date','precision','condition','observed_at','source_ids']))],['tables/standards.csv',Buffer.from(csv(views.standards,['id','type','label','version','status','source_ids','citation_assertion_ids']))],
    ['tables/regulatory-calendar.csv',Buffer.from(csv(calendar.events,[...new Set(calendar.events.flatMap(record=>Object.keys(record)))]))],['tables/review-queue.csv',Buffer.from(csv(views.review_queue,['entity_id','priority','review_status','source_ids','reasons','limitations']))],
    ['README.md',Buffer.from(`# Global DPP Atlas 0.2.0 candidate\n\nUnsealed candidate; evidence cutoff ${CANDIDATE.evidence_cutoff}. Predecessor: 0.1.0. Schema/protocol: 0.2.0.\n\n${validation.counts.substantive_records} substantive records, ${validation.counts.graph_edges} active graph edges, ${validation.counts.assertions} assertions (${validation.counts.active_assertions} active), ${validation.counts.sources} source observations.\n\nThe change manifest retains all seven website update batches, additions, before/after revisions and assertion supersessions. The sealed release 0.1.0 remains unchanged. JSON-LD reifies qualified assertions rather than flattening them into unconditional facts.\n\nAll claims await qualified human review. No live registry transaction, EDC execution or independent interoperability reproduction was performed. Calendar targets remain distinct from operative obligations. Third-party rights remain with source holders.\n`)]
  ]);
  for(const batch of batches)outputs.set(`inputs/${batch.id}.json`,bytes(batch));
  outputs.set('inputs/retained-website-updates.json',bytes(updates));
  outputs.set('graph-schema.md',Buffer.from('# Candidate graph schema 0.2.0\n\nThe strict dataset.schema.json is normative for shape validation. Documentary assertions, reported results and research classifications remain separate. Legal validity, evidence observation, source retrieval and curation supersession are independent dates. Curation never changes legal valid_from/valid_to. Source identities group resource URLs; observation IDs retain access, version and retrieval limits.\n\nThe portable graph wrapper uses schema 1.1.0; metadata.schema_version is the canonical schema and metadata.version is the evidence edition. Historical assertions remain available, while active edges exclude superseded claims.\n'));
  outputs.set('research-protocol.md',Buffer.from('# Candidate research protocol 0.2.0\n\nPredecessor: immutable protocol 0.1.0. Candidate checked 25 October 2026. Existing extraction and evidence-access rules continue: primary_rechecked requires reopened primary material, while indexed excerpts and inherited dossiers retain their own limits. No source access is upgraded by a linked record.\n\nAdditions have unique IDs; meaning-changing corrections retain before/after records in change-manifest.json. Replaced assertions receive new IDs; old assertions remain marked superseded. All seven earlier website batches are retained intact. No live service transaction, EDC execution, independent interoperability reproduction or human adjudication was performed.\n\nThe calendar distinguishes publication, adoption, entry into force, application, indicative plans and conditional events. Adjacent Machinery/CRA duties are not DPP mandates. International AAS associations are navigation evidence, not national adoption. The UK outline is a locator; GB and NI scopes remain separate.\n'));
  outputs.set('competency-queries.json',bytes({dataset_version:CANDIDATE.version,queries:[{id:'phase-is-not-duty',question:'Which measures are adopted, proposed, planned or adjacent?',projection:'views/regulatory-calendar.json'},{id:'current-vs-historical-claims',question:'Which qualified assertions were replaced and why?',projection:'change-manifest.json'},{id:'interoperability-boundaries',question:'Which exact operations were reported and which dimensions remain unassessed?',projection:'views/interoperability-matrix.json'},{id:'international-aas',question:'Which international AAS records are documented without inferring country-wide adoption?',projection:'views/ecosystems.json'}]}));
  const manifest={...CANDIDATE,release_status:'candidate',review_status:'machine_assisted_unreviewed',sealed:false,hash_algorithm:'sha256',counts:validation.counts,change_summary:'Reconciled website additions and dated manuscript supplements, with qualified legal tracks, technical editions, international AAS evidence and consistent derived outputs.',files:Object.fromEntries([...outputs].map(([name,data])=>[name,hash(data)]))};
  outputs.set('manifest.json',bytes(manifest));
  outputs.set('checksums.sha256',Buffer.from([...outputs].map(([name,data])=>`${hash(data)}  ${name}`).join('\n')+'\n'));
  return {dataset,updates,batches,changeManifest,schema,validation,views,taxonomy,regulatory,calendar,graph,manifest,outputs};
}

export async function writeCandidate(candidate) {
  for(const [name,data]of candidate.outputs){const destination=path.join(candidateRoot,name);await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,data);}
  const c=candidate.validation.counts;
  const summary={...CANDIDATE,...c,updated_at:CANDIDATE.release_date,research_cutoff:CANDIDATE.evidence_cutoff,calendar_events:candidate.calendar.events.length};
  await fs.writeFile(path.join(root,'docs/_data/dpp_candidate.json'),bytes(summary));
  await fs.writeFile(path.join(root,'docs/_data/dpp_calendar.json'),bytes(candidate.calendar));
  return summary;
}
