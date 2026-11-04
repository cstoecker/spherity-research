"""Adversarial data/export checks. No domain interoperability experiment is run."""
from copy import deepcopy
import hashlib, json
from validate import validate

def run_checks(data,views):
    results=[]
    def passed(name,condition):
        if not condition: raise AssertionError('Regression failed: '+name)
        results.append({'check':name,'result':'passed'})
    def rejected(name,mutator):
        changed=deepcopy(data); mutator(changed)
        try: validate(changed)
        except (ValueError,TypeError): results.append({'check':name,'result':'passed'}); return
        raise AssertionError('Invalid fixture accepted: '+name)
    def entity(d,eid): return next(e for e in d['entities'] if e['id']==eid)
    def assertion(d,aid): return next(a for a in d['assertions'] if a['id']==aid)
    rejected('Missing entity references rejected',lambda d:d['assertions'][0].update(subject='missing-entity'))
    rejected('Duplicate IDs rejected',lambda d:d['entities'].append(deepcopy(d['entities'][0])))
    rejected('Unsourced substantive entities rejected',lambda d:entity(d,'eu-espr').update(source_ids=[]))
    rejected('Unsourced dated events rejected',lambda d:entity(d,'eu-battery-passport-requirement')['dates'][0].update(source_ids=[]))
    rejected('Conditional trigger cannot become a fabricated date',lambda d:entity(d,'eu-construction-passport-requirement')['dates'][0].update(date='2027-01-01'))
    rejected('Conditional dates require trigger text',lambda d:entity(d,'eu-construction-passport-requirement')['dates'][0].update(condition=None))
    rejected('Impossible calendar dates rejected',lambda d:entity(d,'eu-battery-passport-requirement')['dates'][0].update(date='2027-02-30',precision='day'))
    rejected('Reopened source requires retrieval date',lambda d:next(s for s in d['sources'] if s['access_status']=='opened').update(retrieved_at=None))
    rejected('Geographic parents must be jurisdictions',lambda d:entity(d,'jur-gb-nir')['geography'].update(parent_id='sec-batteries'))
    rejected('Geographic parent cycles rejected',lambda d:entity(d,'jur-gb')['geography'].update(parent_id='jur-gb-nir'))
    rejected('Source retrieval after cut-off rejected',lambda d:next(s for s in d['sources'] if s['access_status']=='opened').update(retrieved_at='2027-01-01'))
    rejected('Future interoperability result rejected',lambda d:assertion(d,'a-global-jp-cfp-exchange')['interoperability'].update(test_date='2027-01-01'))
    rejected('Observation beyond evidence cut-off rejected',lambda d:d['assertions'][0].update(observed_at='2027-01-01'))
    maps={r['jurisdiction_id']:r for r in views['world_map']['jurisdictions']}
    passed('EU membership join has 27 explicit members',len(entity(data,'jur-eu')['geography']['member_ids'])==27)
    passed('Country rows do not inherit regional/global standards as law',all(r['entity_type'] in ('LegalInstrument','Provision','Requirement','Policy') for row in maps.values() for r in row['records'] if r['scope_basis']=='eu_membership_display_join'))
    passed('Norway receives no automatic EU scope join',all(r['scope_basis']=='direct_record' for r in maps['jur-no']['records']))
    passed('Northern Ireland scope does not become UK-wide records',not any('jur-gb' not in entity(data,r['entity_id'])['jurisdiction_ids'] for r in maps['jur-gb']['records']))
    regional_ids={e['id'] for e in data['entities'] if e['jurisdiction_ids']==['jur-br-pr']}
    passed('Parana-only records remain outside Brazil national row',not any(r['entity_id'] in regional_ids for r in maps['jur-br']['records']))
    passed('Conditional timeline events keep null dates',all(r['date'] is None and r['condition'] for r in views['timeline'] if r['precision']=='conditional'))
    passed('Future legal dates remain in timeline',any(r['entity_id']=='eu-battery-passport-requirement' and r['date']=='2027-02-18' for r in views['timeline']))
    cited={a['object']['entity_id'] for a in data['assertions'] if a['predicate']=='cites_standard' and 'entity_id' in a['object']}
    passed('Six EN citation edges remain distinct from eight EN editions',len([e for e in data['entities'] if e['id'].startswith('std-en-')])==8 and len(cited)==6)
    passed('Late EN editions are not silently OJ cited',not {'std-en-18239-2026','std-en-18246-2026'}&cited)
    graph_edges={e['id']:e for e in views['graph']['edges'] if e['edge_kind']=='qualified_assertion'}
    passed('Graph export preserves evidence and temporal qualifiers',all(all(graph_edges[a['id']][k]==a[k] for k in ('evidence_type','observed_at','valid_from','valid_to','interoperability','limitations')) for a in data['assertions']))
    passed('Japan result remains attributed and version bounded',all(c['result']=='reported_success' and c['independence']=='consortium_report' and c['test_date'] is None for c in views['interoperability']))
    passed('Uncoded dimensions are not failed tests',all(c['result']=='not_tested' for c in views['interoperability_matrix'] if c['coding_status']=='not_assessed'))
    passed('Authentication evidence is not business authority recognition',all(c['coding_status']=='not_assessed' for c in views['interoperability_matrix'] if c['dimension'] in ('business_identity','delegated_authority','legal_acceptance')))
    before=hashlib.sha256(json.dumps(data,sort_keys=True).encode()).hexdigest()
    new=deepcopy(data); new['metadata']['version']='0.1.1'; new['assertions'][0]['statement']='Synthetic correction fixture; not a research finding.'
    passed('Synthetic revision leaves previous snapshot unchanged',before==hashlib.sha256(json.dumps(data,sort_keys=True).encode()).hexdigest() and new['assertions'][0]['statement']!=data['assertions'][0]['statement'])
    return dict(status='passed',count=len(results),scope='Computer checks of seed integrity and projection semantics, including negative synthetic fixtures. Expected outcomes are researcher-defined, not independently human-adjudicated.',results=results)

if __name__=='__main__':
    import sys
    from pathlib import Path
    from build_release import projections
    data=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    print(json.dumps(run_checks(data,projections(data)),indent=2))
