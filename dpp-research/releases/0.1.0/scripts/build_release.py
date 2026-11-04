"""Build reproducible local research releases and map/figure inputs."""
from __future__ import annotations
import argparse, csv, hashlib, json, shutil, sys, tempfile
sys.dont_write_bytecode = True
from collections import Counter
from pathlib import Path
from base_data import base_data, CUTOFF, REVIEW
from models import Dataset, schema
from validate import validate

ROOT=Path(__file__).resolve().parents[1]
NS='urn:spherity:dpp-atlas:'
DIMENSIONS=['product_identity','syntactic_exchange','semantic_meaning','evidence_provenance','authentication','business_identity','delegated_authority','access_control','lifecycle_continuity','legal_acceptance']

def dump(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2,sort_keys=True)+'\n',encoding='utf-8')

def write_csv(path,rows,fields):
    path.parent.mkdir(parents=True,exist_ok=True)
    with path.open('w',encoding='utf-8',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore'); writer.writeheader()
        for row in rows:
            writer.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(list,dict)) else v for k,v in row.items() if k in fields})

def projections(data):
    entities=data['entities']; assertions=data['assertions']; em={e['id']:e for e in entities}
    def layer(e):
        if e['type'] in ('LegalInstrument','Provision','Requirement','Policy'): return 'legal_and_policy'
        if e['type'] in ('Standard','StandardisationProject','Specification','Ontology','Committee'): return 'standards_and_specifications'
        return 'ecosystem_and_implementation'
    map_rows=[]
    eu_members=set(em['jur-eu']['geography']['member_ids'])
    for jurisdiction in (e for e in entities if e['type']=='Jurisdiction'):
        jid=jurisdiction['id']; records=[]
        for e in entities:
            if e['type'] in ('Jurisdiction','Sector','Concept'): continue
            direct=jid in e['jurisdiction_ids']
            inherited=jid in eu_members and 'jur-eu' in e['jurisdiction_ids'] and e['type'] in ('LegalInstrument','Provision','Requirement','Policy')
            if direct or inherited:
                records.append(dict(entity_id=e['id'],label=e['label'],entity_type=e['type'],layer=layer(e),status=e['status'],sector_ids=e['sector_ids'],source_ids=e['source_ids'],review_status=e['review_status'],evidence_status=e['evidence_status'],scope_basis='direct_record' if direct else 'eu_membership_display_join',membership_assertion_id=None if direct else 'a-root-eu-member-'+jid.removeprefix('jur-'),limitations=e['limitations']))
        direct_count=sum(x['scope_basis']=='direct_record' for x in records)
        coverage='selected_direct_records' if direct_count else ('eu_instrument_scope_only' if records else 'no_record_extracted')
        map_rows.append(dict(jurisdiction_id=jid,label=jurisdiction['label'],geography=jurisdiction['geography'],coverage=coverage,records=records))
    timeline=[dict(entity_id=e['id'],label=e['label'],entity_type=e['type'],jurisdiction_ids=e['jurisdiction_ids'],sector_ids=e['sector_ids'],review_status=e['review_status'],**d) for e in entities for d in e['dates']]
    timeline.sort(key=lambda x:(x['date'] is None,x['date'] or '',x['entity_id'],x['kind']))
    assertion_edges=[dict(id=a['id'],source=a['subject'],predicate=a['predicate'],target=a['object'].get('entity_id'),literal=a['object'].get('value'),literal_datatype=a['object'].get('datatype'),edge_kind='qualified_assertion',statement=a['statement'],assertion_type=a['assertion_type'],evidence_type=a['evidence_type'],source_ids=a['source_ids'],locator=a['locator'],review_status=a['review_status'],observed_at=a['observed_at'],valid_from=a['valid_from'],valid_to=a['valid_to'],interoperability=a['interoperability'],limitations=a['limitations']) for a in assertions]
    derived=[]
    for e in entities:
        for field,pred in [('jurisdiction_ids','record_scope'),('sector_ids','record_sector')]:
            for target in e[field]: derived.append(dict(id=f'derived-{e["id"]}-{target}',source=e['id'],target=target,predicate=pred,edge_kind='entity_summary_association',source_ids=e['source_ids'],review_status=e['review_status'],limitations=['Derived from entity summary; not an independently coded legal applicability assertion.']))
    standards=[dict(entity_id=e['id'],type=e['type'],label=e['label'],version=e['version'],status=e['status'],dates=e['dates'],source_ids=e['source_ids'],citation_assertion_ids=[a['id'] for a in assertions if a['predicate']=='cites_standard' and a['object'].get('entity_id')==e['id']],limitations=e['limitations']) for e in entities if e['type'] in ('Standard','StandardisationProject','Specification','Ontology','Committee','Initiative','CertificationScheme')]
    inter=[dict(assertion_id=a['id'],subject=a['subject'],statement=a['statement'],source_ids=a['source_ids'],locator=a['locator'],review_status=a['review_status'],**a['interoperability']) for a in assertions if a.get('interoperability')]
    aliases={'semantic':('semantic_meaning','Model conversion was reported; comprehensive semantic equivalence was not independently tested.'),'protocol':('syntactic_exchange','Protocol conversion was reported for the specified demonstration.'),'identity_authentication':('authentication','Authentication conversion was reported; business identity and legal authority are separate dimensions.')}
    matrix=[]
    for claim in inter:
        observed={aliases.get(dim,(dim,'Use the claim limitations.'))[0]:dict(source_dimension=dim,mapping_note=aliases.get(dim,(dim,'Use the claim limitations.'))[1]) for dim in claim['dimensions']}
        for dim in DIMENSIONS:
            evidence=observed.get(dim)
            matrix.append(dict(assertion_id=claim['assertion_id'],subject=claim['subject'],dimension=dim,coding_status='bounded_reported_evidence' if evidence else 'not_assessed',result=claim['result'] if evidence else 'not_tested',source_ids=claim['source_ids'] if evidence else [],source_dimension=evidence['source_dimension'] if evidence else None,mapping_note=evidence['mapping_note'] if evidence else 'No qualified result for this dimension is coded in this seed; no incompatibility conclusion.',independence=claim['independence'],limitations=claim['limitations']))
    queue=[]
    for e in entities:
        if e['type'] in ('Jurisdiction','Sector','Concept'): continue
        reasons=[]
        if e['type'] in ('LegalInstrument','Provision','Requirement'): reasons.append('legal_scope_or_status')
        if any(d['kind'] in ('applies_from','entered_into_force') or d['precision']=='conditional' for d in e['dates']): reasons.append('date_or_trigger')
        if e['limitations']: reasons.append('recorded_limitations')
        if e['evidence_status']=='dossier_extracted': reasons.append('inherited_dossier')
        queue.append(dict(entity_id=e['id'],priority='high' if any(x in reasons for x in ('legal_scope_or_status','date_or_trigger')) else 'normal',review_status=e['review_status'],reasons=reasons,source_ids=e['source_ids'],limitations=e['limitations']))
    queue.sort(key=lambda x:(x['priority']!='high',x['entity_id']))
    return dict(world_map=dict(dataset_version=data['metadata']['version'],default_missing_country_state='not_assessed',interpretation='Selected evidence coverage. No single country maturity score. EU inherited rows show scope only; regional and global initiatives are not domestic law.',jurisdictions=map_rows),timeline=timeline,graph=dict(nodes=entities,edges=assertion_edges+derived),standards=standards,interoperability=inter,interoperability_matrix=matrix,review_queue=queue)

def jsonld(data):
    context={'atlas':NS,'rdf':'http://www.w3.org/1999/02/22-rdf-syntax-ns#','rdfs':'http://www.w3.org/2000/01/rdf-schema#','prov':'http://www.w3.org/ns/prov#','dct':'http://purl.org/dc/terms/','dcat':'http://www.w3.org/ns/dcat#','xsd':'http://www.w3.org/2001/XMLSchema#','label':'rdfs:label','description':'dct:description','record':{'@id':'atlas:record','@type':'@json'}}
    graph=[{'@id':NS+'release:'+data['metadata']['version'],'@type':['dcat:Dataset','prov:Entity'],'label':data['metadata']['title'],'dcat:version':data['metadata']['version'],'dct:issued':{'@value':data['metadata']['release_date'],'@type':'xsd:date'},'record':data['metadata']}]
    for e in data['entities']:
        graph.append({'@id':NS+e['id'],'@type':['atlas:'+e['type'],'prov:Entity'],'label':e['label'],'description':e['description'],'atlas:status':e['status']['value'],'atlas:reviewStatus':e['review_status'],'prov:wasDerivedFrom':[{'@id':NS+s} for s in e['source_ids']],'record':e})
    for s in data['sources']:
        graph.append({'@id':NS+s['id'],'@type':'prov:Entity','label':s['title'],'dct:source':{'@id':s['url']},'atlas:accessStatus':s['access_status'],'record':s})
    for a in data['assertions']:
        obj=a['object']; rdf_obj={'@id':NS+obj['entity_id']} if 'entity_id' in obj else {'@value':obj['value'],'@type':'xsd:'+{'string':'string','date':'date','boolean':'boolean','number':'decimal'}[obj['datatype']]}
        graph.append({'@id':NS+a['id'],'@type':['rdf:Statement','prov:Entity'],'rdf:subject':{'@id':NS+a['subject']},'rdf:predicate':{'@id':NS+a['predicate']},'rdf:object':rdf_obj,'description':a['statement'],'prov:wasDerivedFrom':[{'@id':NS+s} for s in a['source_ids']],'atlas:locator':a['locator'],'atlas:reviewStatus':a['review_status'],'atlas:observedAt':{'@value':a['observed_at'],'@type':'xsd:date'},'record':a})
    return {'@context':context,'@graph':graph}

def query_results(data,views):
    entities=data['entities']; assertions=data['assertions']
    matches=lambda term:[e['id'] for e in entities if term in e['label'].lower() or term in e['id']]
    return [
      dict(id='CQ01',question='Which selected battery-related requirements are coded?',result=[e['id'] for e in entities if e['type']=='Requirement' and 'sec-batteries' in e['sector_ids']],boundary='Includes adjacent identification duties; inspect scope before classifying a record as a passport obligation.'),
      dict(id='CQ02',question='Which dates remain conditional?',result=[r for r in views['timeline'] if r['precision']=='conditional'],boundary='No calendar dates imputed.'),
      dict(id='CQ03',question='Which standards have explicit OJ citation assertions?',result=[a['id'] for a in assertions if a['predicate']=='cites_standard'],boundary='Citation scope and presumption limits remain in source assertions.'),
      dict(id='CQ04',question='Which UNTP and W3C artifacts have versioned status records?',result=sorted(set(matches('untp')+matches('w3c'))),boundary='Use each artifact status; do not equate working drafts and Recommendations.'),
      dict(id='CQ05',question='What interoperability results have been coded?',result=[x['assertion_id'] for x in views['interoperability']],boundary='Attributed results only; this release runs no ecosystem exchange experiment.'),
      dict(id='CQ06',question='Which records distinguish Great Britain and Northern Ireland?',result={j:[e['id'] for e in entities if j in e['jurisdiction_ids']] for j in ['jur-gb-gbn','jur-gb-nir']},boundary='Territorial records retain their instrument-specific conditions.'),
      dict(id='CQ07',question='Which source records were actually reopened?',result=[s['id'] for s in data['sources'] if s['access_status']=='opened'],boundary='Opened status does not imply full text or human review.'),
      dict(id='CQ08',question='Which records need priority human review?',result=[x['entity_id'] for x in views['review_queue'] if x['priority']=='high'],boundary='Review tasks, not findings of error.'),
      dict(id='CQ09',question='Which country rows only inherit EU scope?',result=[r['jurisdiction_id'] for r in views['world_map']['jurisdictions'] if r['coverage']=='eu_instrument_scope_only'],boundary='No national legal survey is implied.'),
      dict(id='CQ10',question='Which specifications refer to another artifact as input or reference?',result=[a['id'] for a in assertions if a['predicate'] in ('uses_as_input','references','normatively_references')],boundary='These relations do not imply semantic equivalence or tested interoperability.')]

def build(version='0.1.0', seal=False):
    build_parent=ROOT.parent.parent/'_build' if ROOT.parent.name=='releases' else ROOT/'_build'
    build_parent.mkdir(parents=True,exist_ok=True)
    out=Path(tempfile.mkdtemp(prefix=version+'-',dir=build_parent))
    input_dir=ROOT/'staging' if (ROOT/'staging').exists() else ROOT/'inputs'
    provenance_dir=ROOT if (ROOT/'sources-index.json').exists() else ROOT/'provenance'
    data=base_data()
    for name in ('eu','global','standards'):
        part=json.loads((input_dir/f'{name}.json').read_text(encoding='utf-8-sig'))
        for k in ('entities','assertions','sources'): data[k].extend(part[k])
    for k in ('entities','assertions','sources'): data[k].sort(key=lambda x:x['id'])
    data['metadata']=dict(title='Global DPP Atlas initial evidence dataset',version=version,schema_version='0.1.0',protocol_version='0.1.0',release_date=CUTOFF,evidence_cutoff=CUTOFF,namespace=NS,release_status='research_seed',review_status=REVIEW,coverage_statement='Selected international dossier extraction plus targeted primary-source rechecks. EU member rows include explicit display joins; national coverage is not exhaustive.',rights_statement='Local research release. Third-party rights remain with source holders; no new public licence grant is made. Resolve release licensing before external publication.',limitations=['All substantive claims await qualified human review.','Some sources remain dossier-only, snippets or inaccessible; catalogue access is not full standard-text review.','No new cross-implementation interoperability experiment was executed.','No political boundary geometry or inferred global absence-of-law claims are included.'])
    report=validate(data)
    data=Dataset.model_validate(data).model_dump(exclude_none=False)
    views=projections(data); ld=jsonld(data)
    from regression_checks import run_checks
    report['regression_checks']=run_checks(data,views)
    dump(out/'dataset.json',data); dump(out/'dataset.schema.json',schema()); dump(out/'dataset.jsonld',ld); dump(out/'context.jsonld',{'@context':ld['@context']})
    for name in ('world_map','timeline','graph','standards','interoperability','interoperability_matrix','review_queue'): dump(out/'views'/f'{name.replace("_","-")}.json',views[name])
    write_csv(out/'tables'/'entities.csv',data['entities'],['id','type','label','version','jurisdiction_ids','sector_ids','status','source_ids','review_status','limitations'])
    write_csv(out/'tables'/'assertions.csv',data['assertions'],['id','subject','predicate','object','statement','source_ids','locator','assertion_type','evidence_type','review_status','observed_at','valid_from','valid_to','limitations'])
    write_csv(out/'tables'/'timeline.csv',views['timeline'],['entity_id','label','entity_type','kind','date','precision','condition','jurisdiction_ids','sector_ids','source_ids','review_status'])
    write_csv(out/'tables'/'standards.csv',views['standards'],['entity_id','type','label','version','status','citation_assertion_ids','source_ids','limitations'])
    write_csv(out/'tables'/'sources.csv',data['sources'],['id','url','title','publisher','source_type','language','access_status','retrieved_at','limitations'])
    source_index=json.loads((provenance_dir/'sources-index.json').read_text(encoding='utf-8-sig'))
    used={s['url'] for s in data['sources']}; candidates=source_index['sources']
    screening=[dict(url=s['url'],disposition='extracted' if s['url'] in used else 'pending_not_yet_extracted',reason='Cited by at least one seed source record.' if s['url'] in used else 'Not yet selected for structured extraction; no exclusion or irrelevance finding.',dossier_files=s['cited_in']) for s in candidates]
    for s in data['sources']:
        if not any(r['url']==s['url'] for r in screening): screening.append(dict(url=s['url'],disposition='added_during_extraction',reason='Additional primary or geographic source used in seed.',dossier_files=s['dossier_files']))
    dump(out/'screening-log.json',screening)
    queries=query_results(data,views); dump(out/'competency-questions.json',queries)
    figures=dict(version=version,interpretation='Corpus summaries, not estimates of global prevalence or adoption.',entity_types=report['entity_types'],source_access=report['source_access'],standards_status=dict(sorted(Counter(x['status']['value'] for x in views['standards']).items())),dates_by_kind=dict(sorted(Counter(x['kind'] for x in views['timeline']).items())),interop_assertion_ids=[x['assertion_id'] for x in views['interoperability']],figure_inputs={'world_map':'views/world-map.json','timeline':'views/timeline.json','requirements_graph':'views/graph.json','interoperability':'views/interoperability-matrix.json','case_paths':'competency-questions.json','release_history':'manifest.json'})
    dump(out/'figure-inputs.json',figures)
    statuses={}
    for e in data['entities']: statuses.setdefault(e['type'],set()).add(e['status']['value'])
    dump(out/'vocabulary.json',dict(entity_types=sorted(statuses),status_values_by_type={k:sorted(v) for k,v in sorted(statuses.items())},predicates=sorted(set(a['predicate'] for a in data['assertions'])),interoperability_dimensions=DIMENSIONS,notes=['Status values describe type-specific recorded states. They are not a single ordered maturity scale.','Interoperability dimension labels from sources may be narrower; retain original labels in claims.']))
    report['unique_source_urls']=len(used); report['source_records_with_retrieval_dates']=sum(s['retrieved_at'] is not None for s in data['sources']); report['qualified_interoperability_claims']=len(views['interoperability']); report['conditional_events']=sum(x['precision']=='conditional' for x in views['timeline'])
    dump(out/'validation-report.json',report)
    for name in ('research-protocol.md','graph-schema.md','data-contract.md'):
        shutil.copyfile(ROOT/name,out/name)
    for name in ('eu','global','standards'):
        dest=out/'inputs'/f'{name}.json'; dest.parent.mkdir(exist_ok=True); shutil.copyfile(input_dir/f'{name}.json',dest)
    for file in (ROOT/'scripts').glob('*.py'):
        dest=out/'scripts'/file.name; dest.parent.mkdir(exist_ok=True); shutil.copyfile(file,dest)
    for name in ('eu-legal-evidence.md','global-jurisdictions-evidence.md','standards-ecosystem-evidence.md','untp-w3c-evidence.md','sources-index.json'):
        dest=out/'provenance'/name; dest.parent.mkdir(exist_ok=True); shutil.copyfile(provenance_dir/name,dest)
    summary=f'''# Global DPP Atlas release {version}\n\nEvidence cut-off: {CUTOFF}. Initial research seed; all claims await human review.\n\n{len(data['entities'])} entities, {len(data['assertions'])} assertions and {len(data['sources'])} source records ({len(used)} distinct URLs).\n\n- dataset.json is the canonical exchange file; dataset.schema.json defines its structure.\n- dataset.jsonld retains qualified claims and source provenance.\n- views/world-map.json supplies geographic joins and multiple records per jurisdiction.\n- views/graph.json supplies nodes and qualified/derived edges.\n- views/standards.json includes initiatives, specifications and citation links.\n- views/timeline.json preserves conditional dates.\n- tables/ contains CSV exports; figure-inputs.json indexes reproducible figure data.\n- competency-questions.json contains actual query outputs, not independent human answer validation.\n- screening-log.json retains pending source candidates.\n- validation-report.json records computational checks only.\n- manifest.json and checksums.sha256 identify exact bytes.\n\nNo website, DOI, legal review or ecosystem conformance certification is implied. See the protocol and schema notes for interpretation. Boundary geometry is supplied separately when the map is built.\n'''
    (out/'README.md').write_text(summary,encoding='utf-8')
    def md(value): return str(value).replace('|','\\|').replace('\n',' ')
    source_map={s['id']:s for s in data['sources']}; entity_map={e['id']:e for e in data['entities']}
    lines=[f'# Global DPP Atlas record catalogue {version}','',f'Evidence cut-off: {CUTOFF}. Selected machine-assisted seed, pending human review. Status labels are type-specific. See dataset.json for full sources, conditions, dates and limitations.','']
    for kind in sorted(set(e['type'] for e in data['entities'])-{'Sector','Concept','Jurisdiction'}):
        lines += ['## '+kind,'','| ID and record | Recorded status | Scope | Sources |','|---|---|---|---|']
        for e in (x for x in data['entities'] if x['type']==kind):
            links='; '.join(f'[{md(source_map[s]["publisher"])}]({source_map[s]["url"]})' for s in e['source_ids'])
            scopes=', '.join(entity_map[j]['label'] for j in e['jurisdiction_ids'])
            lines.append(f'| `{e["id"]}` — {md(e["label"])} | {md(e["status"]["value"])} | {md(scopes)} | {links} |')
        lines.append('')
    (out/'catalogue.md').write_text('\n'.join(lines),encoding='utf-8')
    (out/'requirements.txt').write_text('pydantic==2.14.1\n',encoding='utf-8')
    # Manifest is calculated last; it covers content files, not itself/checksum list.
    files={p.relative_to(out).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.rglob('*')) if p.is_file() and p.name not in ('manifest.json','checksums.sha256')}
    manifest=dict(version=version,release_date=CUTOFF,previous_version=None,hash_algorithm='sha256',files=files,input_dossier='provenance/',change_summary='Initial selected evidence extraction, schema and derived map/figure inputs.',schema_version='0.1.0',protocol_version='0.1.0')
    dump(out/'manifest.json',manifest)
    (out/'checksums.sha256').write_text(''.join(f'{h}  {name}\n' for name,h in sorted(files.items())),encoding='utf-8')
    if seal:
        target=ROOT/'releases'/version
        if target.exists():
            if (target/'manifest.json').read_bytes()!=(out/'manifest.json').read_bytes(): raise RuntimeError('Refusing to overwrite immutable release; choose a new version.')
        else: shutil.copytree(out,target)
        dump(ROOT/'current.json',dict(version=version,path=f'releases/{version}/dataset.json',manifest=f'releases/{version}/manifest.json',evidence_cutoff=CUTOFF))
    print(json.dumps(dict(output=str(out),sealed=seal,**report),indent=2))
    return data,views

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--version',default='0.1.0'); parser.add_argument('--seal',action='store_true'); args=parser.parse_args(); build(args.version,args.seal)
