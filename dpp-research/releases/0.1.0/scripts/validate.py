"""Structural and semantic checks for the research seed (not legal validation)."""
import json
from collections import Counter
from datetime import date
from pathlib import Path
from models import Dataset

def validate(data):
    model=Dataset.model_validate(data)
    d=model.model_dump(exclude_none=False)
    entities={x['id']:x for x in d['entities']}; sources={x['id']:x for x in d['sources']}
    errors=[]
    def check(ok,msg):
        if not ok: errors.append(msg)
    all_ids=[x['id'] for group in ('entities','assertions','sources') for x in d[group]]
    check(len(all_ids)==len(set(all_ids)), 'Duplicate IDs across record collections')
    cutoff=date.fromisoformat(d['metadata']['evidence_cutoff'])
    def day(value, label):
        if value is not None:
            try: date.fromisoformat(value)
            except ValueError: errors.append('Invalid calendar date: '+label)
    def refs(ids, pool, label):
        for rid in ids: check(rid in pool, f'Missing reference {rid} in {label}')
        check(len(ids)==len(set(ids)), 'Duplicate references in '+label)
    day(d['metadata']['release_date'],'release_date')
    for e in d['entities']:
        eid=e['id']; refs(e['source_ids'],sources,eid)
        if e['type'] not in ('Sector','Concept','Jurisdiction'):
            check(bool(e['source_ids']), 'Unsourced substantive entity '+eid)
        refs(e['jurisdiction_ids'],entities,eid); refs(e['sector_ids'],entities,eid)
        for rid in e['jurisdiction_ids']: check(entities.get(rid,{}).get('type')=='Jurisdiction','Non-jurisdiction reference '+eid)
        for rid in e['sector_ids']: check(entities.get(rid,{}).get('type')=='Sector','Non-sector reference '+eid)
        day(e['status']['as_of'],eid)
        check(e['status']['as_of']<=d['metadata']['evidence_cutoff'],'Status observed beyond cut-off '+eid)
        for event in e['dates']:
            refs(event['source_ids'],sources,eid+' date')
            check(bool(event['source_ids']), 'Unsourced date '+eid)
        geo=e.get('geography')
        check((e['type']=='Jurisdiction') == bool(geo), 'Geography/type mismatch '+eid)
        if geo:
            refs(geo['member_ids'],entities,eid+' members')
            if geo['parent_id']: refs([geo['parent_id']],entities,eid+' parent')
            for rid in geo['member_ids']+([geo['parent_id']] if geo['parent_id'] else []):
                check(entities.get(rid,{}).get('type')=='Jurisdiction','Non-jurisdiction geography reference '+eid)
        if e['evidence_status']=='primary_rechecked':
            check(any(sources.get(s,{}).get('access_status')=='opened' for s in e['source_ids']), 'Rechecked entity without opened source '+eid)
    for a in d['assertions']:
        aid=a['id']; refs([a['subject']],entities,aid); refs(a['source_ids'],sources,aid)
        if 'entity_id' in a['object']: refs([a['object']['entity_id']],entities,aid)
        for key in ('observed_at','valid_from','valid_to'): day(a[key],aid+' '+key)
        check(a['observed_at']<=d['metadata']['evidence_cutoff'],'Assertion observation beyond cut-off '+aid)
        if a['valid_from'] and a['valid_to']: check(a['valid_from']<=a['valid_to'],'Reversed validity '+aid)
        if a['interoperability']:
            inter=a['interoperability']; day(inter['test_date'],aid)
            if inter['test_date']: check(inter['test_date']<=min(d['metadata']['evidence_cutoff'],a['observed_at']),'Future test result '+aid)
            if inter['result'] in ('pass','fail','partial'):
                check(a['evidence_type']=='project_report', 'Measured test outcome requires a result report '+aid)
            if inter['result']=='reported_success':
                check(a['assertion_type']=='reported_result','Reported success must remain attributed '+aid)
    for s in d['sources']:
        day(s['retrieved_at'],s['id'])
        if s['retrieved_at']: check(s['retrieved_at']<=d['metadata']['evidence_cutoff'],'Retrieval beyond cut-off '+s['id'])
    # A geographic parent chain must be acyclic; regional membership is separate.
    for eid,e in entities.items():
        seen=set(); current=eid
        while current in entities and entities[current].get('geography'):
            if current in seen:
                errors.append('Geographic parent cycle '+eid); break
            seen.add(current); current=entities[current]['geography']['parent_id']
            if current is None: break
    if errors: raise ValueError('\n'.join(errors))
    return dict(status='passed',scope='Structural, referential, temporal and provenance checks only; not independent legal or technical conformance review.',checks=['Pydantic strict model matching generated JSON Schema','Unique IDs','Complete entity/source references','Jurisdiction and sector reference types','Sources for substantive entities and dated events','Date precision and conditional trigger integrity','Calendar dates and observation cut-off','Source access/recheck consistency','Reported versus measured interoperability outcome consistency'],counts={k:len(d[k]) for k in ('entities','assertions','sources')},entity_types=dict(sorted(Counter(x['type'] for x in d['entities']).items())),source_access=dict(sorted(Counter(x['access_status'] for x in d['sources']).items())),human_reviewed_assertions=sum(a['review_status']!='machine_assisted_unreviewed' for a in d['assertions']))

if __name__=='__main__':
    import sys
    print(json.dumps(validate(json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))),indent=2))
