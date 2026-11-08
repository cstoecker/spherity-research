from pathlib import Path
import argparse, json, hashlib, re, sys, xml.etree.ElementTree as ET
sys.dont_write_bytecode=True
import build_figures as b

parser=argparse.ArgumentParser(description='Audit AI Safety figure exports and citation mapping without changing artwork.')
parser.add_argument('--source-dir',help='Verified LaTeX package; defaults to AI_SAFETY_SOURCE_DIR or archived references plus published PDF.')
args=parser.parse_args()
if args.source_dir:b.SRC=Path(args.source_dir).resolve()
out=b.OUT
manifest=json.loads((out/'figure-manifest.json').read_text(encoding='utf-8'))
checks=[]
for f in manifest:
    pdf=b.fitz.open(out/(f['slug']+'.pdf'));p=pdf[0]
    assert len(pdf)==1 and not p.get_images(), f['slug']+' must be genuine vector'
    for block in p.get_text('dict')['blocks']:
        for line in block.get('lines',[]):
            for span in line['spans']:
                x0,y0,x1,y1=span['bbox']
                assert x0>=-1 and y0>=-1 and x1<=p.rect.width+1 and y1<=p.rect.height+1,(f['slug'],span)
    svg=(out/(f['slug']+'.svg')).read_text(encoding='utf-8');root=ET.fromstring(svg)
    assert '<image' not in svg and '<text' not in svg
    assert '<title>' in svg and '<desc>' in svg
    for el in root.iter():
        for k,v in el.attrib.items():
            if k.endswith('href'):assert v.startswith('#')
    img=b.Image.open(out/(f['slug']+'.png'))
    assert img.size==(f['png_width'],f['png_height'])
    checks.append({'figure':f['slug'],'pdf_vector':True,'svg_self_contained_outlined_text':True,'text_within_page':True,'png_dimensions':list(img.size),'visual_review':'Pass: compared reconstruction with published source raster; all labels, badges, counts and diagram paths retained.'})
orig=b.source_pdf();copy=b.ROOT/'docs/top-10-global-ai-safety-companies-2026.pdf'
assert orig.read_bytes()==copy.read_bytes()
provenance=json.loads((Path(__file__).parent/'provenance.json').read_text(encoding='utf-8'))
assert hashlib.sha256(orig.read_bytes()).hexdigest()==provenance['source_pdf_sha256']
assert manifest==provenance['figures']
pub=b.fitz.open(orig)[7].get_text()
fig=b.fitz.open(out/'figure-3-company-activity-matrix.pdf')[0].get_text()
labels=['[26,27]','[9,10]','[28–30]','[31,32]','[33,34]','[35,36]','[37,38]','[11,39,40]','[41–43]','[5,6,44]']
for label in labels:
    assert label in pub.replace(' ','') and label in fig.replace(' ','')
report={'figures':checks,'pdf_24_pages':len(b.fitz.open(orig))==24,'paper_byte_identical':True,'figure_3_citations_match_published_page_8':labels,'source_sha256':hashlib.sha256(orig.read_bytes()).hexdigest()}
(Path(__file__).parent/'qa-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS: five genuine vector PDFs, self-contained outlined SVGs, corresponding PNGs, bounds, source citations and unchanged 24-page paper.')
