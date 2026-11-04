"""Stable vocabulary and geographic joins; no political boundaries are generated."""
CUTOFF = '2026-10-23'
REVIEW = 'machine_assisted_unreviewed'

def source(sid, url, title, publisher):
    return dict(id=sid,url=url,title=title,publisher=publisher,source_type='public_authority',language='en',access_status='opened',retrieved_at=CUTOFF,dossier_files=[],limitations=['Geographic coding source; does not establish DPP legal applicability.'])

def basic(eid, etype, label, description, sources=None):
    return dict(id=eid,type=etype,label=label,description=description,version=None,jurisdiction_ids=[],sector_ids=[],status=dict(value='research_defined',as_of=CUTOFF,scope_note='Research vocabulary or geographic join; no DPP obligation implied.'),dates=[],source_ids=sources or [],evidence_status='research_defined',review_status=REVIEW,limitations=[])

def base_data():
    sources = [source('src-root-m49','https://unstats.un.org/unsd/methodology/m49/overview/','UN M49 country and area coding table','United Nations Statistics Division'),source('src-root-eu-countries','https://european-union.europa.eu/principles-countries-history/eu-countries_en','European Union country directory','European Union')]
    eu = [('AT','AUT','Austria'),('BE','BEL','Belgium'),('BG','BGR','Bulgaria'),('HR','HRV','Croatia'),('CY','CYP','Cyprus'),('CZ','CZE','Czechia'),('DK','DNK','Denmark'),('EE','EST','Estonia'),('FI','FIN','Finland'),('FR','FRA','France'),('DE','DEU','Germany'),('GR','GRC','Greece'),('HU','HUN','Hungary'),('IE','IRL','Ireland'),('IT','ITA','Italy'),('LV','LVA','Latvia'),('LT','LTU','Lithuania'),('LU','LUX','Luxembourg'),('MT','MLT','Malta'),('NL','NLD','Netherlands'),('PL','POL','Poland'),('PT','PRT','Portugal'),('RO','ROU','Romania'),('SK','SVK','Slovakia'),('SI','SVN','Slovenia'),('ES','ESP','Spain'),('SE','SWE','Sweden')]
    other = [('GB','GBR','United Kingdom'),('NO','NOR','Norway'),('CN','CHN','China'),('VN','VNM','Viet Nam'),('KR','KOR','Republic of Korea'),('IN','IND','India'),('JP','JPN','Japan'),('CA','CAN','Canada'),('US','USA','United States'),('AU','AUS','Australia'),('SG','SGP','Singapore'),('BR','BRA','Brazil'),('EG','EGY','Egypt'),('BD','BGD','Bangladesh'),('NZ','NZL','New Zealand'),('TR','TUR','Türkiye'),('CH','CHE','Switzerland')]
    entities=[]; assertions=[]
    for a2,a3,label in eu+other:
        e=basic('jur-'+a2.lower(),'Jurisdiction',label,'Country join for assessed records; national completeness is not implied.',['src-root-m49'])
        e['geography']=dict(kind='country',iso_alpha2=a2,iso_alpha3=a3,iso_3166_2=None,map_code=a3,parent_id=None,member_ids=[],join_note='Join to a separately licensed boundary dataset by ISO alpha-3; do not infer coverage from missing records.')
        entities.append(e)
    scopes=[('eu','European Union','supranational',None,'EU',None,[f'jur-{x[0].lower()}' for x in eu]),('europe','Europe','region',None,'EUROPE',None,[]),('global','Global scope','global',None,'GLOBAL',None,[]),('gb-gbn','Great Britain','territory',None,'GB-GREAT-BRITAIN','jur-gb',[]),('gb-nir','Northern Ireland','territory','GB-NIR','GB-NIR','jur-gb',[]),('us-ca','California','subnational','US-CA','US-CA','jur-us',[]),('br-pr','Paraná','subnational','BR-PR','BR-PR','jur-br',[]),('kr-26','Busan','subnational','KR-26','KR-26','jur-kr',[])]
    for slug,label,kind,subcode,mapcode,parent,members in scopes:
        e=basic('jur-'+slug,'Jurisdiction',label,'Territorial or programme scope object; membership and applicability are separate concepts.',['src-root-eu-countries'] if slug=='eu' else [])
        e['geography']=dict(kind=kind,iso_alpha2=None,iso_alpha3=None,iso_3166_2=subcode,map_code=mapcode,parent_id=parent,member_ids=members,join_note='Use a regional/subnational boundary or separate panel. Global/European initiative scope is not domestic legislation. Subnational join codes require boundary-provider compatibility checks.')
        if slug=='gb-gbn': e['limitations']=['Great Britain is a composite territorial scope; no automatic join to the whole UK polygon.']
        if slug=='eu': e['limitations']=['Member-country joins show EU-instrument scope only. Product, territorial exceptions and conditions remain attached to each record.']
        entities.append(e)
    for a2,_,label in eu:
        assertions.append(dict(id='a-root-eu-member-'+a2.lower(),subject='jur-'+a2.lower(),predicate='part_of',object={'entity_id':'jur-eu'},statement=f'{label} is included in the EU country directory at the research cut-off.',source_ids=['src-root-eu-countries'],locator='EU countries directory; country entry',assertion_type='source_statement',evidence_type='official_guidance',review_status=REVIEW,observed_at=CUTOFF,valid_from=None,valid_to=None,limitations=['Geographic membership does not determine the scope of every legal provision.']))
    sectors={'cross-sector':'Cross-sector','batteries':'Batteries','textiles':'Textiles','construction':'Construction products','toys':'Toys','detergents':'Detergents','vehicles':'Vehicles','packaging':'Packaging','critical-materials':'Critical materials','electronics':'Electrical and electronic equipment','tyres':'Tyres','energy':'Energy','plastics':'Plastics','solar-pv':'Solar photovoltaics'}
    for slug,label in sectors.items():
        entities.append(basic('sec-'+slug,'Sector',label,'Research classification for filtering; scope remains qualified in the linked record.'))
    concepts={'product-identity':'Product identity and resolution','semantic-meaning':'Semantic meaning and measurement context','evidence-provenance':'Evidence provenance and integrity','business-identity':'Business and issuer identity','delegated-authority':'Delegation and authority','access-control':'Access and confidentiality','lifecycle-continuity':'Lifecycle and version continuity','legal-acceptance':'Legal and organisational acceptance','syntactic-exchange':'Syntactic exchange'}
    for slug,label in concepts.items():
        entities.append(basic('concept-'+slug,'Concept',label,'Analytical interoperability dimension defined by research protocol 0.1.0.'))
    return dict(entities=entities,assertions=assertions,sources=sources)
