"""Publish faithful figure derivatives and descriptive metadata from final PDFs.

Requires PyMuPDF 1.26.7 and Pillow. Set PYTHONPATH to a temporary dependency
directory if necessary. Original manuscript PDFs and publication ZIP stay intact.
"""
from pathlib import Path
import argparse
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image, PngImagePlugin
import pymupdf

REPO = Path(__file__).resolve().parents[1]
CANONICAL = 'https://spherity.github.io/spherity-research/proofs-over-statements-evidence-graphs.html'
LICENSE = 'https://creativecommons.org/licenses/by/4.0/'
AUTHOR = 'Carsten Stöcker'
RIGHTS = 'Copyright 2026 Carsten Stöcker, Spherity GmbH. Licensed under CC BY 4.0.'
STAMP = '2026-11-09T00:00:00Z'
WEB = '/assets/proofs-over-statements/'

SPECS = [
    ('full',1,'argument-structure','Structure of the proof-domain and assurance argument',
     'Results, assumptions and worked designs connect the RDF encoding, proof recovery, reuse cost and assurance arguments.',
     ['verifiable evidence graphs','proof domains','RDF','decision assurance']),
    ('full',2,'linked-data-and-qualified-authority','One linked-data model for web markup, evidence and qualified authority',
     'Three layers connect schema.org JSON-LD, verifiable evidence graphs and the proposed graph-proof profile for qualified authority attestations.',
     ['JSON-LD','schema.org','qualified electronic attestations of attributes','eIDAS 2.0']),
    ('full',3,'graph-and-envelope-proof-domains','Graph proofs and envelope proofs authenticate different inputs',
     'Architecture A authenticates canonical RDF quads and proof configuration; architecture B authenticates envelope bytes and needs recoverable source evidence after a merge.',
     ['W3C VCDM 2.0','RDF Data Integrity','SD-JWT','credential verification']),
    ('full',4,'verification-cost-crossover','Prototype cost crossover for repeated credential verification',
     'Cumulative and per-check prototype costs compare graph proofs, fresh envelope-to-graph expansion and an envelope-only check with a trusted cached mapping.',
     ['credential verification cost','RDF canonicalisation','SD-JWT','evidence reuse']),
    ('full',5,'authority-and-content-assurance','Qualified authority and content assurance remain distinct',
     'Qualified authority checks do not eliminate a feasible independent attack on an ordinary content declaration that changes the accepted outcome.',
     ['QEAA','EAA','authority assurance','content integrity','trust graph']),
    ('full',6,'battery-passport-evidence-graph','Battery passport evidence graph and reporting decision',
     'A battery passport joins issuer declarations, verification statements, digest links and authority checks for a carbon-footprint reporting decision.',
     ['Digital Product Passport','battery passport','evidence graph','supply chain']),
    ('full',7,'customs-shipment-evidence-graph','Customs shipment evidence graph at the port of entry',
     'Authority facts, signed shipment evidence, digest links and release-decision inputs form a cross-organisation customs evidence graph.',
     ['B2G','customs','shipment evidence','European Business Wallet']),
    ('full',8,'ai-safety-supervisor','AI safety supervisor with a verifiable requirements graph',
     'A safety supervisor checks proposed actions against authenticated requirements, records its decision and keeps local protective functions separate.',
     ['Trusted AI','trusted industrial AI','trusted physical AI','AI safety','assurance graph']),
    ('brief',1,'citizen-and-business-wallets','Citizen presentations and business-wallet evidence graphs',
     'A citizen presents selected credentials while organisations combine EAA-backed evidence with selected policy-required QEAA relationships in a common graph stack.',
     ['European Business Wallet','EUDI Wallet','QEAA','EAA','verifiable evidence graph']),
    ('brief',2,'verification-and-unnesting','How a machine verifies and unnests an industrial credential',
     'Side-by-side steps compare stored graph-proof verification with envelope-only B1 processing, disclosure reconstruction, expansion and source binding.',
     ['nested credentials','SD-JWT verification','Data Integrity proof','credential verification steps']),
    ('brief',3,'per-check-verification-cost','Prototype cost of an additional verification by credential size',
     'Measured prototype times compare a stored graph-proof check with envelope processing and fresh RDF expansion; the caption distinguishes cached-view checks.',
     ['credential verification performance','JSON-LD expansion','RDF','SD-JWT']),
    ('brief',4,'cumulative-verification-cost','Cumulative verification cost and the cached-envelope alternative',
     'The graph-proof path costs more initially and crosses the fresh-expansion path at 4.24 additional checks for the 146-quad fixture; the cached-envelope path has a different scope.',
     ['repeated verification','credential cost model','Data Integrity','cached mapping']),
    ('brief',5,'battery-content-and-authority','Battery evidence separates content claims from authority checks',
     'The battery-passport graph illustrates why a valid mandate or qualified authority does not itself authenticate the exact reported carbon-footprint class.',
     ['battery passport','qualified authority','content attacks','industrial evidence']),
]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def latex_plain(value):
    value = re.sub(r'\\cite\{ref1\}', '[full paper]', value)
    value = re.sub(r'\\ref\{(fig|tab|sec):([^}]+)\}', lambda m:m[2], value)
    value = value.replace(r'\textquotesingle s', "'s").replace(r'\textquotesingle', "'")
    value = value.replace(r'\(', '').replace(r'\)', '').replace(r'\ast', '*')
    value = value.replace('^{s}', 's').replace('_1','1').replace('\\%','%').replace('^*','*')
    value = value.replace('--', '–').replace('~',' ')
    assert '\\' not in value, value
    return value


def captions(folder):
    tex = (folder/'main.tex').read_text(encoding='utf8')
    result = {}
    for figure in re.findall(r'\\begin\{figure\}.*?\\end\{figure\}', tex, re.S):
        number = int(re.search(r'\\label\{fig:(\d+)\}',figure)[1])
        start = figure.index(r'\caption{')+len(r'\caption{')
        depth=1
        end=start
        while depth:
            if figure[end]=='{': depth+=1
            elif figure[end]=='}': depth-=1
            end+=1
        result[number] = latex_plain(figure[start:end-1])
    return result


def metadata(title, description, keywords, format_, identifier):
    return dict(title=title, description=description, creator=AUTHOR,
                keywords=keywords, rights=RIGHTS, source=CANONICAL+'#'+identifier,
                format=format_, credit='Carsten Stöcker / Spherity GmbH',
                licensePage=CANONICAL+'#license-and-citation', license=LICENSE,
                metadataDate=STAMP)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=REPO.parent/'latex-production/output')
    args=parser.parse_args()
    out=REPO/'docs/assets/proofs-over-statements'
    out.mkdir(parents=True,exist_ok=True)
    sources={k:args.source/v for k,v in [('full','full-paper'),('brief','executive-brief')]}
    caption_sets={k:captions(v) for k,v in sources.items()}
    jobs=[]
    manifest=[]
    for document,number,slug,title,alt,keywords in SPECS:
        identifier=f'{document}-figure-{number:02}-{slug}'
        original=sources[document]/f'figures/fig{number:02}.pdf'
        source_bytes=original.read_bytes()
        cap=caption_sets[document][number]
        with pymupdf.open(stream=source_bytes,filetype='pdf') as pdf:
            assert len(pdf)==1
            page=pdf[0]
            width=round(page.rect.width*4/3)
            height=round(page.rect.height*4/3)
            svg=page.get_svg_image(text_as_path=True)
            assert not re.search(r'<(?:text|image)\b',svg), 'Expected all-vector, outlined source figure'
            svg=re.sub(r'<svg\b[^>]*>',lambda m:re.sub(r'\bwidth="[^"]+"',f'width="{width}"',re.sub(r'\bheight="[^"]+"',f'height="{height}"',m[0])),svg,count=1)
            # Keep MuPDF's SVG prefix-free and avoid rewriting geometry.
            from html import escape
            svg=re.sub(r'(<svg\b[^>]*)(>)',r'\1 role="img" aria-labelledby="figure-title figure-description"\2',svg,count=1)
            svg=svg.replace('>', '><title id="figure-title">'+escape(title)+'</title><desc id="figure-description">'+escape(cap)+'</desc>',1)
            svg_path=out/(identifier+'.svg')
            svg_path.write_text(svg,encoding='utf8')
            pix=page.get_pixmap(matrix=pymupdf.Matrix(2400/max(page.rect.width,page.rect.height),2400/max(page.rect.width,page.rect.height)),alpha=False)
            image=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
            info=PngImagePlugin.PngInfo()
            for key,value in {'Title':title,'Description':cap,'Author':AUTHOR,'Copyright':RIGHTS,'Keywords':'; '.join(keywords),'Source':CANONICAL+'#'+identifier,'License':LICENSE}.items():
                info.add_itxt(key,value)
            image.save(out/(identifier+'.png'),pnginfo=info,optimize=True)
        destination=out/(identifier+'.pdf')
        destination.write_bytes(source_bytes)
        jobs.extend([dict(path=str(out/(identifier+'.'+extension)),metadata=metadata(title,cap,keywords,mime,identifier))
                     for extension,mime in [('svg','image/svg+xml'),('png','image/png'),('pdf','application/pdf')]])
        manifest.append(dict(id=identifier,document=document,figure_number=number,name=title,alt=alt,
                             description=alt,caption=cap,width=width,height=height,
                             png_width=pix.width,png_height=pix.height,
                             creator=AUTHOR,copyright_holder='Carsten Stöcker, Spherity GmbH',
                             copyright_notice=RIGHTS,license=LICENSE,keywords=keywords,
                             source_pdf_sha256=sha(source_bytes),
                             artwork='Original vector PDF with lettering converted to outlines for self-contained SVG delivery.',
                             content_url=WEB+identifier+'.svg',
                             downloads=[dict(format=ext.upper(),encoding_format=mime,url=WEB+identifier+'.'+ext)
                                        for ext,mime in [('svg','image/svg+xml'),('png','image/png'),('pdf','application/pdf')]]))
    covers=[]
    for document,label in [('full','full-paper'),('brief','executive-brief')]:
        with pymupdf.open(sources[document]/'main.pdf') as pdf:
            page=pdf[0]
            pix=page.get_pixmap(matrix=pymupdf.Matrix(1600/page.rect.height,1600/page.rect.height),alpha=False)
            image=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
            path=out/(label+'-cover.jpg')
            image.save(path,quality=92,subsampling=0)
            title=('Proofs over Statements — full paper' if document=='full' else 'Business-wallet evidence graphs — executive brief')+' cover'
            meta=metadata(title,'Complete first page of the final '+label.replace('-',' ')+', including title, author and CC BY 4.0 notice.',
                          ['verifiable evidence graphs','European Business Wallet','W3C VCDM 2.0'],'image/jpeg','downloads')
            jobs.append(dict(path=str(path),metadata=meta))
            covers.append(dict(document=document,url=WEB+path.name,width=pix.width,height=pix.height,alt=meta['description']))

    # Reuse the repository's maintained XMP implementation for all asset formats.
    js="""import fs from 'node:fs'; import {pathToFileURL} from 'node:url';
const api=await import(pathToFileURL(process.argv[1]).href);
const jobs=JSON.parse(fs.readFileSync(0,'utf8'));
for(const job of jobs){
 if(job.metadata.format==='application/pdf'){job.xmp=api.createImageXmp(job.metadata);continue;}
 let data=fs.readFileSync(job.path);
 data=job.metadata.format==='image/svg+xml'?Buffer.from(api.embedSvgMetadata(data.toString(),job.metadata,'proofs-publication-metadata')):api.embedImageXmp(data,job.metadata);
 fs.writeFileSync(job.path,data);
}
process.stdout.write(JSON.stringify(jobs.filter(j=>j.metadata.format==='application/pdf')));
"""
    process=subprocess.run(['node','--input-type=module','-e',js,str(REPO/'scripts/lib/image-metadata.mjs')],input=json.dumps(jobs),text=True,encoding='utf8',capture_output=True,check=True)
    for job in json.loads(process.stdout):
        path=Path(job['path']); original=path.read_bytes()
        with pymupdf.open(path) as pdf:
            before=(pdf[0].get_contents(),[pdf.xref_stream(x) for x in pdf[0].get_contents()],pdf[0].get_pixmap().samples)
            values=pdf.metadata
            values.update(title=job['metadata']['title'],author=AUTHOR,subject=job['metadata']['description'],keywords='; '.join(job['metadata']['keywords']))
            pdf.set_metadata(values);pdf.set_xml_metadata(job['xmp']);pdf.saveIncr()
        assert path.read_bytes().startswith(original)
        with pymupdf.open(path) as pdf:
            after=(pdf[0].get_contents(),[pdf.xref_stream(x) for x in pdf[0].get_contents()],pdf[0].get_pixmap().samples)
            assert before==after
            assert pdf.metadata['author']==AUTHOR and LICENSE in pdf.get_xml_metadata()
    for figure in manifest:
        for download in figure['downloads']:
            path=out/Path(download['url']).name
            download.update(bytes=path.stat().st_size,sha256=sha(path.read_bytes()))
        svg=(out/(figure['id']+'.svg')).read_text(encoding='utf8')
        assert '<text' not in svg and '<title' in svg and '<desc' in svg and '<metadata' in svg
        assert not re.search(r'(?:href|src)="(?!#|data:)[^"]+"',svg)
        ET.fromstring(svg)
        with Image.open(out/(figure['id']+'.png')) as image:
            assert image.info['Author']==AUTHOR and LICENSE in image.info['XML:com.adobe.xmp']
    for cover in covers:
        path=out/Path(cover['url']).name
        cover.update(bytes=path.stat().st_size,sha256=sha(path.read_bytes()))
    data=dict(version='1.3',date='2026-11-09',canonical_url=CANONICAL,
              author=AUTHOR,copyright_holder='Carsten Stöcker, Spherity GmbH',license=LICENSE,
              figures=manifest,covers=covers,validation={'figures':13,'formats_per_figure':3,
              'all_vector_svg_text_outlined':True,'pdf_content_streams_and_pixels_unchanged':True,
              'all_formats_have_embedded_metadata':True})
    (out/'assets-manifest.json').write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    print(json.dumps({'result':'PASS','figures':len(manifest),'figure_files':len(manifest)*3,'covers':len(covers),'manifest':str(out/'assets-manifest.json')}))


if __name__=='__main__':
    main()
