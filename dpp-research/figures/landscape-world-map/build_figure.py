"""Generate print-ready vector map and full-size A4 landscape proof from release 0.1.0.

Run generate-map.mjs first. Dependencies: reportlab, pypdf, Pillow; bundled Poppler
renders the proof in the supplied build.ps1. Frozen research files are read only.
"""
from pathlib import Path
import base64, collections, hashlib, html, json, re, shutil
import reportlab
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, landscape
from pypdf import PdfReader

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
RELEASE = ROOT/'dpp-research/releases/0.1.0'
DATA = json.loads((RELEASE/'dataset.json').read_text('utf-8'))
MAP = json.loads((RELEASE/'views/world-map.json').read_text('utf-8'))
GEO = json.loads((HERE/'geometry.json').read_text('utf-8'))
ENTITIES = {e['id']:e for e in DATA['entities']}
SOURCES = {s['id']:s for s in DATA['sources']}
FONT_DIR = Path(reportlab.__file__).parent/'fonts'
pdfmetrics.registerFont(TTFont('Vera', str(FONT_DIR/'Vera.ttf')))
pdfmetrics.registerFont(TTFont('VeraBold', str(FONT_DIR/'VeraBd.ttf')))
W,H = 770,480
INK='#172b44'; MUTED='#536478'; BLUE='#0969da'; PALE='#c6def6'; EMPTY='#eef1f5'; BORDER='#bac6d3'; OCEAN='#ffffff'
COLORS={'selected_direct_records':BLUE,'eu_instrument_scope_only':PALE,'no_record_extracted':EMPTY,'not_assessed':EMPTY}
OPS=[]

def text(x,y,value,size=9,color=INK,bold=False):
    assert size>=9, 'Minimum print size is 9 pt'
    OPS.append(('text',x,y,value,size,color,bold))
def rect(x,y,w,h,fill=None,stroke=None,width=.5): OPS.append(('rect',x,y,w,h,fill,stroke,width))
def line(x1,y1,x2,y2,color=BORDER,width=.5): OPS.append(('line',x1,y1,x2,y2,color,width))
def path(d,fill=None,stroke=None,width=.35):
    if d: OPS.append(('path',d,fill,stroke,width))
def wrap(value, width, size=9, bold=False):
    result=[]; current=''; font='VeraBold' if bold else 'Vera'
    for word in value.split():
        candidate=f'{current} {word}'.strip()
        if current and pdfmetrics.stringWidth(candidate,font,size)>width:
            result.append(current);current=word
        else: current=candidate
    if current:result.append(current)
    return result
def paragraph(x,y,value,width,size=9,color=MUTED,bold=False,leading=12):
    for row in wrap(value,width,size,bold): text(x,y,row,size,color,bold);y+=leading
    return y

countries=[j for j in MAP['jurisdictions'] if j['geography']['kind']=='country']
counts=collections.Counter(j['coverage'] for j in countries)
assert counts=={'selected_direct_records':17,'eu_instrument_scope_only':26,'no_record_extracted':1}
assert len({r['entity_id'] for j in MAP['jurisdictions'] for r in j['records'] if r['scope_basis']=='direct_record'})==128
selected_ids=['std-w3c-dpp-bw-tf','std-iso-jtc5','std-untp-0-7','std-gba','std-rain-dpp-001','std-cen-jtc24','std-cirpass2']
assert all(i in ENTITIES for i in selected_ids)

rect(0,0,W,H,'#ffffff')
text(0,21,'Global DPP landscape: evidence coverage',18,INK,True)
text(0,42,'Selected legal, standards and ecosystem records | Release 0.1.0 | Evidence cut-off: 23 October 2026',9,MUTED)
line(0,55,W,55)
text(0,70,'A   GEOGRAPHIC COVERAGE',9,INK,True)
path(GEO['sphere'],OCEAN,BORDER,.45)
path(GEO['graticule'],None,'#e7edf3',.3)
for feature in GEO['features']:
    path(feature['path'],COLORS[feature['coverage']],'#ffffff',.4)

# Main panel intentionally codes coverage, not count, implementation maturity or legal force.
text(0,375,'Country-level extraction',10,INK,True)
for y,key,label in [(393,'selected_direct_records','17 countries with direct records'),(412,'eu_instrument_scope_only','26 countries: EU-scope joins only'),(431,'not_assessed','No country-level record / not assessed')]:
    rect(0,y-9,11,11,COLORS[key],BORDER,.4);text(19,y,label,9,INK)
text(0,449,'44 country rows; 1 has no country-level record.',9,MUTED)
rect(355,361,175,89,'#f7fafc',BORDER,.45)
for feature in GEO['features']:
    path(feature['europePath'],COLORS[feature['coverage']],'#ffffff',.4)
rect(355,361,175,89,None,BORDER,.45)
rect(359,365,109,15,'#ffffff')
text(364,376,'European detail',9,INK,True)

line(546,70,546,450)
text(561,70,'B   TRANSNATIONAL SCOPE',9,INK,True)
text(561,90,'Global standards and ecosystems',10,INK,True)
rows=[
 ('W3C DPP & Business Wallet TF','Active task force; vocabulary work evolving.','std-w3c-dpp-bw-tf'),
 ('ISO/IEC JTC 5','Active international DPP committee.','std-iso-jtc5'),
 ('UN Transparency Protocol','0.7.0 maintained pilot release.','std-untp-0-7'),
 ('Global Battery Alliance','Active battery passport programme.','std-gba'),
 ('RAIN-DPP-001','Published non-normative guidance.','std-rain-dpp-001'),
]
y=111
for title,summary,eid in rows:
    text(561,y,title,9,INK,True)
    y=paragraph(561,y+13,summary,205,9,MUTED,leading=11)+10
text(561,y+2,'European scope',10,INK,True); y+=23
for title,summary,eid in [
 ('CEN-CENELEC JTC 24','Europe: horizontal DPP standards.','std-cen-jtc24'),
 ('CIRPASS-2','EU: research and implementation pilots.','std-cirpass2')]:
    text(561,y,title,9,INK,True)
    y=paragraph(561,y+13,summary,205,9,MUTED,leading=11)+10
paragraph(561,421,'Examples are not assigned to countries or treated as domestic legal obligations.',205,9,MUTED,leading=11)
line(0,458,W,458)
text(0,474,'Coverage is not a legal-readiness ranking. Small states and territorial scopes require the accompanying table.',9,MUTED)

TOKEN=re.compile(r'[MLCQZmlcqz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?')
def draw_path(c,d):
    tokens=TOKEN.findall(d); p=c.beginPath(); i=0;cmd=None
    while i<len(tokens):
        if tokens[i].isalpha(): cmd=tokens[i];i+=1
        if cmd=='Z' or cmd=='z':p.close();cmd=None;continue
        if cmd in ('M','L'):
            x,y=map(float,tokens[i:i+2]);i+=2
            if cmd=='M':p.moveTo(x,H-y);cmd='L'
            else:p.lineTo(x,H-y)
        elif cmd=='C':
            x1,y1,x2,y2,x3,y3=map(float,tokens[i:i+6]);i+=6;p.curveTo(x1,H-y1,x2,H-y2,x3,H-y3)
        else:raise ValueError(f'Unsupported path command {cmd}')
    return p

def render_pdf(name,proof=False):
    pw,ph=landscape(A4) if proof else (W,H)
    c=canvas.Canvas(str(HERE/name),pagesize=(pw,ph),pageCompression=1,invariant=1)
    c.setTitle('Global DPP landscape - evidence coverage, release 0.1.0')
    c.setAuthor('Spherity research dataset; machine-assisted figure production')
    c.setSubject('Selected evidence coverage; no country-readiness inference; human review pending')
    c.saveState();c.translate((pw-W)/2,ph-H-34.015748 if proof else 0)
    for op in OPS:
        kind,*a=op
        if kind=='text':
            x,y,value,size,color,bold=a;c.setFillColor(HexColor(color));c.setFont('VeraBold' if bold else 'Vera',size);c.drawString(x,H-y,value)
        elif kind=='rect':
            x,y,w,h,fill,stroke,width=a
            if fill:c.setFillColor(HexColor(fill))
            if stroke:c.setStrokeColor(HexColor(stroke))
            c.setLineWidth(width);c.rect(x,H-y-h,w,h,stroke=int(bool(stroke)),fill=int(bool(fill)))
        elif kind=='line':
            x1,y1,x2,y2,color,width=a;c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x1,H-y1,x2,H-y2)
        elif kind=='path':
            d,fill,stroke,width=a
            if fill:c.setFillColor(HexColor(fill))
            if stroke:c.setStrokeColor(HexColor(stroke))
            c.setLineWidth(width);c.drawPath(draw_path(c,d),stroke=int(bool(stroke)),fill=int(bool(fill)),fillMode=0)
    c.restoreState()
    if proof:
        caption=('Figure 1. Selected DPP evidence coverage, release 0.1.0, 23 October 2026. '
                 'Of 44 country rows, 42 have geometry; Malta and Singapore remain in the accompanying table. '
                 'UK data has separate Great Britain and Northern Ireland scopes. '
                 'Direct records and EU display joins do not establish national legal readiness; grey never means absence of law. '
                 'Panel B shows transnational examples, not interoperability results. '
                 'Sources: frozen release and Natural Earth v5.1.2. Human review pending.')
        c.setFont('Vera',9);c.setFillColor(HexColor(MUTED));y=ph-H-47.015748
        for row in wrap(caption,W,9):c.drawString((pw-W)/2,y,row);y-=11
        assert y>=15, 'Proof caption overflows the A4 landscape sheet'
    c.showPage();c.save()

def render_svg():
    fonts=''.join(f"@font-face{{font-family:Vera;src:url(data:font/ttf;base64,{base64.b64encode((FONT_DIR/file).read_bytes()).decode()}) format('truetype');font-weight:{weight};}}" for file,weight in [('Vera.ttf',400),('VeraBd.ttf',700)])
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}pt" height="{H}pt" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">', '<title id="title">Global DPP landscape: evidence coverage</title>', '<desc id="desc">Release 0.1.0: 17 country rows have selected direct records, 26 have only EU-scope display joins, and one has no country-level record. Global and European standardisation and ecosystem examples appear separately. No legal-readiness ranking is shown.</desc>',f'<style>{fonts} text{{font-family:Vera,sans-serif}}</style>']
    for op in OPS:
        kind,*a=op
        if kind=='text':
            x,y,value,size,color,bold=a;out.append(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}">{html.escape(value)}</text>')
        elif kind=='rect':
            x,y,w,h,fill,stroke,width=a;out.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill or "none"}" stroke="{stroke or "none"}" stroke-width="{width}"/>')
        elif kind=='line':
            x1,y1,x2,y2,color,width=a;out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}"/>')
        elif kind=='path':
            d,fill,stroke,width=a;out.append(f'<path d="{d}" fill="{fill or "none"}" stroke="{stroke or "none"}" stroke-width="{width}" fill-rule="evenodd"/>')
    out.append('</svg>');(HERE/'dpp-world-map.svg').write_text('\n'.join(out),'utf-8')

render_pdf('dpp-world-map.pdf')
render_pdf('dpp-world-map-a4-proof.pdf',True)
render_svg()
shutil.copyfile(FONT_DIR/'bitstream-vera-license.txt',HERE/'FONT-LICENSE.txt')

geometry_codes={f['code'] for f in GEO['features']}
coverage_table=[]
for j in MAP['jurisdictions']:
    direct={r['entity_id'] for r in j['records'] if r['scope_basis']=='direct_record'}
    joined={r['entity_id'] for r in j['records'] if r['scope_basis']=='eu_membership_display_join'}
    coverage_table.append({'id':j['jurisdiction_id'],'label':j['label'],'kind':j['geography']['kind'],'coverage':j['coverage'],
                           'direct_records':len(direct),'eu_scope_joins':len(joined),'map_code':j['geography']['map_code'],
                           'geometry_join_available':j['geography']['kind']=='country' and j['geography']['map_code'] in geometry_codes,
                           'record_ids':sorted(direct|joined)})
(HERE/'coverage-table.json').write_text(json.dumps(coverage_table,indent=2,ensure_ascii=False)+'\n','utf-8')
table=['# Figure 1 geographic coverage table','',
       'Counts are unique substantive entity IDs within each row. The same EU records recur through display joins; never sum rows to count unique records. The table retains all 52 geographic entities, including small countries and separate territorial scopes.', '',
       '| Geography | Kind | Direct records | EU-scope joins | Country polygon available |',
       '|---|---|---:|---:|---|']
for row in coverage_table:table.append(f"| {row['label']} | {row['kind']} | {row['direct_records']} | {row['eu_scope_joins']} | {'yes' if row['geometry_join_available'] else 'no'} |")
(HERE/'coverage-table.md').write_text('\n'.join(table)+'\n','utf-8')

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
stats={
 'dataset_version':'0.1.0','evidence_cutoff':'2026-10-23','figure_dimensions_pt':[W,H],
 'proof_dimensions_pt':list(landscape(A4)),'minimum_font_size_pt':9,
 'country_rows':len(countries),'coverage_counts':dict(counts),
 'unique_substantive_entities':128,'entities_total':len(DATA['entities']),'assertions_total':len(DATA['assertions']),
 'sources_total':len(DATA['sources']),'geometry_features':len(GEO['features']),
 'country_rows_without_geometry':['Malta','Singapore'],
 'projection':GEO['projection'],'scope_panel_entity_ids':selected_ids,
 'source_records':{sid:SOURCES[sid] for eid in selected_ids for sid in ENTITIES[eid]['source_ids']},
 'inputs':{str(p.relative_to(ROOT)).replace('\\','/'):sha(p) for p in [RELEASE/'dataset.json',RELEASE/'views/world-map.json',ROOT/'dpp-explorer/src/vendor/world.geojson',ROOT/'dpp-explorer/src/vendor/d3.min.js']},
 'pdf_checks':{},
 'limitations':['Selected research seed, not exhaustive global inventory; all substantive claims await qualified human review.','Direct coverage can describe laws, policy, pilots, standards or ecosystems; it does not mean a DPP mandate exists.','EU scope joins are cartographic display joins and do not evidence national implementation.','The UK country row has no extracted record; Great Britain and Northern Ireland have separate scoped records.','Germany has five direct records plus the same 27 EU-scope joins; direct coverage takes precedence in the map colour.','Small states and subnational or territory scopes are not exhaustively visible at this scale.','Natural Earth uses de facto boundaries; cartographic geometry is not a statement of legal jurisdiction.','Displayed scope-panel examples are illustrative, not an exhaustive list or proof of interoperability.']
}
for filename in ['dpp-world-map.pdf','dpp-world-map-a4-proof.pdf']:
    r=PdfReader(HERE/filename); p=r.pages[0];resources=p['/Resources'].get_object()
    fonts=resources.get('/Font',{}).get_object(); embedded=[]
    for key,font in fonts.items():
        font=font.get_object(); desc=font.get('/FontDescriptor')
        if desc and any(k in desc.get_object() for k in ['/FontFile','/FontFile2','/FontFile3']):embedded.append(str(font['/BaseFont']))
    xobjects=resources.get('/XObject',{})
    if hasattr(xobjects,'get_object'):xobjects=xobjects.get_object()
    images=[str(key) for key,val in xobjects.items() if val.get_object().get('/Subtype')=='/Image']
    stats['pdf_checks'][filename]={'pages':len(r.pages),'page_size_pt':[float(p.mediabox.width),float(p.mediabox.height)],'embedded_fonts':embedded,'image_xobjects':images,'text_extract_chars':len(p.extract_text()),'sha256':sha(HERE/filename)}
    assert len(r.pages)==1 and len(embedded)==2 and not images
(HERE/'provenance.json').write_text(json.dumps(stats,indent=2,ensure_ascii=False)+'\n','utf-8')
print(json.dumps({'outputs':['dpp-world-map.pdf','dpp-world-map-a4-proof.pdf','dpp-world-map.svg'],'coverage_counts':dict(counts),'pdf_checks':stats['pdf_checks']},indent=2))
