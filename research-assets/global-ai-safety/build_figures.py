"""Faithful vector reconstructions of the revised edition 2.6 publication figures.

Uses ReportLab, Pillow and PyMuPDF. Set PYTHONPATH to an installed PyMuPDF if needed.
All lettering is outlined in SVG; PDFs retain embedded fonts and selectable text.
Original publication sources are read-only. Figure 3 sources follow body.tex overlays.
"""
from pathlib import Path
import argparse, json, math, shutil, hashlib, re, os
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
import pymupdf as fitz
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/assets/global-ai-safety'
REFERENCE=Path(__file__).resolve().parent/'reference'
SRC=Path(os.environ.get('AI_SAFETY_SOURCE_DIR', str(REFERENCE)))
def source_pdf():
    source=SRC/'main.pdf'
    if source.exists():return source
    if SRC.resolve()==REFERENCE:return ROOT/'docs/top-10-global-ai-safety-companies-2026.pdf'
    raise FileNotFoundError(f'Publication source PDF missing: {source}')

def configure(source_dir=None,regular_font=None,bold_font=None):
    global SRC
    if source_dir:SRC=Path(source_dir).resolve()
    font_dir=Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts'
    regular_font=regular_font or os.environ.get('AI_SAFETY_FONT_REGULAR') or str(font_dir/'segoeui.ttf')
    bold_font=bold_font or os.environ.get('AI_SAFETY_FONT_BOLD') or str(font_dir/'segoeuib.ttf')
    for name,font in [('UI',regular_font),('UIB',bold_font)]:
        if not Path(font).is_file():raise FileNotFoundError(f'Font missing: {font}; pass --font-regular and --font-bold or set AI_SAFETY_FONT_REGULAR / AI_SAFETY_FONT_BOLD.')
        pdfmetrics.registerFont(TTFont(name,font))
INK='#17373f'; DARK='#133d43'; MUTED='#526a74'; TEAL='#08766e'; BLUE='#2b5370'; ORANGE='#965116'
PALE='#f1f6f7'; LINE='#d4e3e7'; GREEN='#e8f4f1'
manifest=[]
class Fig:
    def __init__(self,slug,w,h,title,alt):
        self.slug,self.w,self.h,self.title,self.alt=slug,w,h,title,alt
        self.c=canvas.Canvas(str(OUT/(slug+'.pdf')),pagesize=(w,h))
        self.c.setTitle(title); self.c.setAuthor('Dr. Carsten Stöcker, Spherity GmbH')
        self.c.setSubject('Reconstructed vector artwork from Top 10 Global AI Safety Companies, revised edition 2.6. CC BY 4.0.')
        self.rect(0,0,w,h,'#ffffff',None,0)
    def rect(self,x,y,w,h,fill=PALE,stroke=LINE,r=15,sw=2):
        c=self.c;c.setFillColor(HexColor(fill));c.setLineWidth(sw)
        if stroke:c.setStrokeColor(HexColor(stroke))
        c.roundRect(x,self.h-y-h,w,h,r,stroke=int(bool(stroke)),fill=1)
    def text(self,x,y,s,size=32,bold=False,color=INK,anchor='start'):
        c=self.c;c.setFillColor(HexColor(color));c.setFont('UIB' if bold else 'UI',size)
        # y is the baseline, measured down from the top.
        if anchor=='middle':c.drawCentredString(x,self.h-y,s)
        elif anchor=='end':c.drawRightString(x,self.h-y,s)
        else:c.drawString(x,self.h-y,s)
    def lines(self,x,y,lines,size=32,bold=False,color=INK,step=None):
        for i,s in enumerate(lines):self.text(x,y+i*(step or size*1.35),s,size,bold,color)
    def line(self,x1,y1,x2,y2,color=LINE,width=2):
        c=self.c;c.setStrokeColor(HexColor(color));c.setLineWidth(width);c.line(x1,self.h-y1,x2,self.h-y2)
    def circle(self,x,y,r,color=TEAL,fill=True,sw=3):
        c=self.c;c.setFillColor(HexColor(color));c.setStrokeColor(HexColor(color));c.setLineWidth(sw);c.circle(x,self.h-y,r,stroke=1,fill=int(fill))
    def diamond(self,x,y,r,color=ORANGE):
        c=self.c;c.setFillColor(HexColor(color));p=c.beginPath();p.moveTo(x,self.h-y-r);p.lineTo(x+r,self.h-y);p.lineTo(x,self.h-y+r);p.lineTo(x-r,self.h-y);p.close();c.drawPath(p,fill=1,stroke=0)
    def arrow(self,x1,y1,x2,y2,color=MUTED,width=4):
        self.line(x1,y1,x2,y2,color,width)
        a=math.atan2(y2-y1,x2-x1)
        for off in [-.6,.6]:self.line(x2,y2,x2-16*math.cos(a+off),y2-16*math.sin(a+off),color,width)
    def finish(self):
        self.c.showPage();self.c.save()
        doc=fitz.open(OUT/(self.slug+'.pdf'));page=doc[0]
        svg=page.get_svg_image(text_as_path=True)
        title=self.title.replace('&','&amp;');alt=self.alt.replace('&','&amp;')
        at=svg.index('>')+1
        svg=svg[:at]+f'<title>{title}</title><desc>{alt} © 2026 Dr. Carsten Stöcker, Spherity GmbH. CC BY 4.0.</desc>'+svg[at:]
        (OUT/(self.slug+'.svg')).write_text(svg,encoding='utf-8')
        pix=page.get_pixmap(matrix=fitz.Matrix(1.5,1.5),alpha=False)
        pix.save(OUT/(self.slug+'.png'))
        manifest.append(dict(slug=self.slug,title=self.title,alt=self.alt,width=self.w,height=self.h,png_width=pix.width,png_height=pix.height,formats=['svg','pdf','png']))

def disciplines():
    f=Fig('figure-1-ai-safety-disciplines',1920,1180,'Four domains of AI safety activity','A: improve and qualify behavior. B: observe and manage live behavior. C: design bounded execution. D: verify and enforce each action. Cryptographic verifiability connects all four domains.')
    f.text(650,88,'Design and qualification',44,True,DARK,'middle');f.text(1480,88,'Live operation',44,True,DARK,'middle')
    f.lines(22,300,['Model or','system','behavior'],38,True,DARK,46)
    f.lines(22,848,['External','actions and','effects'],38,True,DARK,46)
    cards=[(240,134,'A',['Improve and qualify','behavior'],['Training and reliability engineering','Validation and red teaming','Evidence for release decisions']), (1080,134,'B',['Observe and manage','live behavior'],['Runtime monitoring','Drift and misuse detection','Input and output guardrails']), (240,704,'C',['Design bounded','execution'],['Air gaps or logical isolation','Deterministic controller design','Requirement and issuer profiles']), (1080,704,'D',['Verify and enforce','each action'],['Check current authority and evidence','Apply status and revocation rules','Permit, block or escalate at the boundary'])]
    for x,y,code,title,body in cards:
        color=BLUE if code in 'AB' else TEAL
        f.rect(x,y,814,429,'#eff4fa' if code in 'AB' else '#ecf6f4',LINE,28)
        f.circle(x+72,y+72,40,color);f.text(x+72,y+87,code,41,True,'#ffffff','middle')
        f.lines(x+134,y+78,title,44,True,DARK,47)
        for i,s in enumerate(body):
            yy=y+215+i*65;f.circle(x+44,yy-11,5,color);f.text(x+65,yy,s,33)
    for x in [666,1476]:f.line(x,563,x,704,TEAL,3)
    f.rect(345,568,1445,132,DARK,None,26)
    f.text(1067,636,'Cryptographic verifiability',44,True,'#ffffff','middle')
    f.text(1067,683,'Provenance  ·  integrity  ·  scoped proofs  ·  current status evidence',31,False,'#d9eeeb','middle')
    f.finish()

def levels():
    f=Fig('figure-2-assurance-levels',1027,1214,'Assurance types for linked claims','Shared RDF and JSON-LD semantics link Q qualified authority, E issuer-authenticated verifiable evidence and U self-asserted information. Each claim requires its own issuer, proof and status checks.')
    f.text(5,62,'Shared linked semantics',61,True);f.text(5,128,'RDF statements and JSON-LD',53,False,MUTED)
    f.line(856,112,933,58,'#80aaa6',6);f.line(933,58,1003,105,'#80aaa6',6)
    for x,y in [(856,112),(933,58),(1003,105)]:f.circle(x,y,14,TEAL)
    rows=[('Q','Qualified authority',['Eligible issuer and legal profile','Scope, validity and status'],'#284f7b','#eaf2fc','#bfd2e8'),('E','Verifiable evidence',['Scoped issuer proof','Applicability, validity and status'],TEAL,GREEN,'#badbd5'),('U','Self-asserted information',['Unsigned publisher claim','Discovery or local provenance'],'#4b626b','#f0f5f6','#d1dfe3')]
    for i,(code,title,body,color,bg,border) in enumerate(rows):
        y=204+i*344;f.rect(3,y,1020,306,bg,border,24,4);f.rect(39,y+68,103,103,color,None,20)
        f.text(90,y+141,code,61,True,'#ffffff','middle');f.text(178,y+103,title,59,True,color)
        f.text(178,y+173,body[0],53);f.text(178,y+239,body[1],53,False,MUTED)
    f.finish()

companies=[
('Alibaba Group','B','A','Qwen3Guard and live content screening',[29,30]),
('Amazon / AWS','D','BC','AgentCore gateway, policy and guardrails',[9,10]),
('Anthropic','A','','Constitutional AI and frontier risk evaluation',[31,32,33]),
('Google / Alphabet','A','D','Frontier thresholds and AP2 mandates',[26,34]),
('Meta','A','B','Scaling framework and Llama Guard',[35,36]),
('Microsoft','A','D','Foundry red teaming and Entra access',[27,38]),
('NTT Group','A','B','AI Assurance and AI Protection',[39,40]),
('NVIDIA','D','BC','OpenShell policy and NeMo guardrails',[11,25,41]),
('OpenAI','A','','Preparedness and release governance',[43,44,45]),
('Spherity','D','C','Registry authority and runtime graph design',[5,6,28])]
def matrix():
    f=Fig('figure-3-company-activity-matrix',1920,1120,'Qualitative placement of ten company cases','Filled circles mark primary and open circles supporting activities across A to D. Spherity D and C are research and integration design. Citation labels match the edition 2.6 published overlays.')
    f.rect(24,30,1872,94,DARK,None,15)
    for x,s in [(50,'Company'),(454,'A'),(551,'B'),(647,'C'),(743,'D'),(826,'Activity used for coding'),(1692,'Sources')]:f.text(x,95,s,37,True,'#ffffff')
    bibliography=re.findall(r'\\bibitem\{src(\d+)\}',(SRC/'references.tex').read_text(encoding='utf-8'))
    citation_number={int(key):n+1 for n,key in enumerate(bibliography)}
    def citation_label(keys):
        numbers=sorted(citation_number[key] for key in keys)
        groups=[];i=0
        while i<len(numbers):
            end=i
            while end+1<len(numbers) and numbers[end+1]==numbers[end]+1:end+=1
            if end-i>=2:groups.append(f'{numbers[i]}–{numbers[end]}')
            else:groups.extend(map(str,numbers[i:end+1]))
            i=end+1
        return '['+', '.join(groups)+']'
    for i,(company,primary,support,activity,refs) in enumerate(companies):
        y=124+i*94;f.rect(24,y,1872,94,'#d9efec' if i==9 else PALE if i%2==0 else '#ffffff',None,0)
        f.text(50,y+62,company,37,True,DARK);f.text(826,y+62,activity,34)
        f.text(1692,y+60,citation_label(refs),29,False,TEAL)
        for j,code in enumerate('ABCD'):
            if code==primary or code in support:f.circle(468+j*96,y+47,14.5,TEAL,code==primary,4.5)
    for x in [24,420,516,612,708,804,1676,1896]:f.line(x,124,x,1064,LINE,2)
    f.line(24,1064,1896,1064,LINE,2)
    f.text(28,1104,'A  Improve and qualify   ·   B  Observe behavior   ·   C  Design bounded execution   ·   D  Verify and enforce',33,False,MUTED)
    f.finish()

# Robinson projection interpolation; Natural Earth world geometry already held by the repository.
RX=[1,.9986,.9954,.99,.9822,.973,.96,.9427,.9216,.8962,.8679,.835,.7986,.7597,.7186,.6732,.6213,.5722,.5322]
RY=[0,.062,.124,.186,.248,.31,.372,.434,.4958,.5571,.6176,.6769,.7346,.7903,.8435,.8936,.9394,.9761,1]
def proj(lon,lat):
    a=min(abs(lat)/5,18);i=min(int(a),17);t=a-i
    x=RX[i]*(1-t)+RX[i+1]*t;y=RY[i]*(1-t)+RY[i+1]*t
    return 720+lon/180*x*633,390-math.copysign(y*307,lat)
def atlas():
    f=Fig('figure-4-ai-safety-atlas',1440,1744,'AI Safety Atlas: twenty selected organizations in eight countries','Map and alphabetical lists of ten commercial companies and ten research organizations in the United States, United Kingdom, Canada, Germany, China, Japan, Singapore and Australia. Teal circles represent companies; ochre diamonds represent research organizations. Filled A–D badges show primary activity and outlined badges supporting activity.')
    f.text(1,36,'Geographic distribution of selected cases',32,True);f.text(1438,36,'20 organizations  /  8 countries',28,False,MUTED,'end')
    f.rect(1,64,1438,644,'#f4f8fa',LINE,22)
    # Projection boundary and graticule.
    def path(points,fill=None,stroke=LINE,width=1):
        c=f.c;p=c.beginPath();p.moveTo(points[0][0],f.h-points[0][1])
        for x,y in points[1:]:p.lineTo(x,f.h-y)
        if fill:p.close();c.setFillColor(HexColor(fill))
        c.setStrokeColor(HexColor(stroke));c.setLineWidth(width);c.drawPath(p,fill=int(bool(fill)),stroke=1)
    boundary=[proj(-180,lat) for lat in range(-90,91,2)]+[proj(180,lat) for lat in range(90,-91,-2)]
    path(boundary,'#ffffff',LINE,1.5)
    for lat in [-60,-30,0,30,60]:path([proj(lon,lat) for lon in range(-180,181,3)],None,'#e5eff2')
    for lon in range(-150,180,30):path([proj(lon,lat) for lat in range(-90,91,3)],None,'#e5eff2')
    geo=json.loads((ROOT/'dpp-explorer/src/vendor/world.geojson').read_text(encoding='utf-8'))
    for feat in geo['features']:
        props=feat['properties'];name=props.get('name') or props.get('NAME') or props.get('ADMIN')
        selected=name in ['United States of America','United States','United Kingdom','Canada','Germany','China','Japan','Singapore','Australia']
        g=feat['geometry'];polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
        for poly in polys:
            if not poly:continue
            points=[proj(*coord[:2]) for coord in poly[0]]
            if len(points)>2:path(points,'#c5dce0' if selected else '#dde8eb','#ffffff',.7)
    countries=[('Canada','CA',0,1,230,100,183,-101,57),('United States','US',6,3,160,249,264,-100,40),('United Kingdom','UK',1,1,459,195,249,-2,55),('Germany','DE',1,1,799,100,201,10,52),('China','CN',1,1,847,256,198,103,37),('Japan','JP',1,1,1203,158,186,138,38),('Singapore','SG',0,1,865,404,210,104,1.4),('Australia','AU',0,1,1205,456,213,134,-25)]
    for name,code,nc,nr,x,y,w,lon,lat in countries:
        px,py=proj(lon,lat);ex=max(x,min(px,x+w));ey=max(y,min(py,y+94));f.line(px,py,ex,ey,'#9bb3bd',3);f.circle(px,py,8,'#526a74',False,3);f.circle(px,py,6,'#ffffff',True,1)
        f.rect(x,y,w,94,'#ffffff',LINE,12);f.text(x+18,y+36,name,25,True)
        off=x+27
        if nc:f.circle(off,y+64,8,TEAL);f.text(off+18,y+73,str(nc),25,True,TEAL);off+=62
        f.diamond(off,y+64,10);f.text(off+18,y+73,str(nr),25,True,ORANGE);f.text(x+w-18,y+73,code,25,True,MUTED,'end')
    f.rect(1,741,701,67,GREEN,None,13);f.circle(34,775,11,TEAL);f.text(64,787,'Commercial companies',32,True,TEAL);f.text(674,787,'10',32,True,TEAL,'end')
    f.rect(738,741,701,67,'#fbf0e6',None,13);f.diamond(772,775,13);f.text(802,787,'Research organizations',32,True,ORANGE);f.text(1410,787,'10',32,True,ORANGE,'end')
    left=[('CN','Alibaba Group / Alibaba Cloud','Qwen3Guard live content screening','B','A'),('US','Amazon / AWS','AgentCore tool policy and guardrails','D','BC'),('US','Anthropic','Constitutional AI and frontier risk evaluation','A',''),('UK','Google DeepMind / Alphabet','Frontier safety thresholds and AP2 mandates','A','D'),('US','Meta','Scaling framework and Llama Guard','A','B'),('US','Microsoft','Foundry red teaming and Entra access','A','D'),('JP','NTT Group / NTT DATA','AI Assurance and AI Protection','A','B'),('US','NVIDIA','OpenShell policy and NeMo guardrails','D','BC'),('US','OpenAI','Preparedness and release governance','A',''),('DE','Spherity','Register-backed authority and runtime assurance','D','C')]
    right=[('SG','AI Verify Foundation','Moonshot application testing'),('AU','Australian AI Safety Institute','Scalable oversight research'),('CN','Beijing Academy of Artificial Intelligence','FlagEval model testing'),('DE','Fraunhofer IAIS','Industrial AI assurance and assessment'),('JP','Japan AI Safety Institute','AI agent evaluation guidance'),('CA','Mila / Quebec AI Institute','Open safeguards and youth safety'),('US','MLCommons','AILuminate safety benchmarks'),('US','NIST CAISSI','Frontier evaluation and monitoring'),('US','Stanford HAI / CRFM','AI Index and HELM Safety'),('UK','UK AI Security Institute','Frontier testing and Inspect')]
    def badge(x,y,code,filled):
        f.rect(x,y,35,35,TEAL if filled else '#ffffff',TEAL,7,2);f.text(x+17.5,y+26,code,24,True,'#ffffff' if filled else TEAL,'middle')
    for side,rows in enumerate([left,right]):
        x=1 if side==0 else 738
        for i,row in enumerate(rows):
            code,name,desc=row[:3];y=820+i*74.5
            if i%2==0 or (side==0 and i==9):f.rect(x,y,701,74.5,GREEN if i==9 else '#f7f9fa','#badbd5' if i==9 else None,10)
            f.rect(x+18,y+12,67,46,'#ffffff',LINE,7);f.text(x+51.5,y+44,code,25,True,MUTED,'middle')
            maxwidth=480 if side==0 else 580
            size=29
            if pdfmetrics.stringWidth(name,'UIB',size)>maxwidth:size=maxwidth/pdfmetrics.stringWidth(name,'UIB',1)
            f.text(x+103,y+31,name,size,True,TEAL if name=='Spherity' else INK)
            ds=27
            if pdfmetrics.stringWidth(desc,'UI',ds)>581:ds=581/pdfmetrics.stringWidth(desc,'UI',1)
            f.text(x+103,y+63,desc,ds,False,MUTED)
            if side==0:
                primary,supp=row[3:];letters=primary+supp
                for j,l in enumerate(letters):badge(684-len(letters)*43+j*43,y+4,l,j==0)
    f.line(1,1588,1439,1588,LINE,1.5);f.text(1,1632,'A–D company activity key',29,True)
    badge(464,1604,'A',True);f.text(511,1632,'Primary',27,False,MUTED);badge(665,1604,'A',False);f.text(711,1632,'Supporting',27,False,MUTED)
    f.text(1439,1632,'Country tags link rows to map counts.',27,False,MUTED,'end')
    f.text(1,1680,'A  Improve and qualify behavior',28);f.text(738,1680,'B  Observe and manage live behavior',28)
    f.text(1,1723,'C  Design bounded execution',28);f.text(738,1723,'D  Verify and enforce each action',28)
    f.finish()

def runtime():
    f=Fig('figure-5-runtime-assurance',1863,1312,'Spherity’s proposed runtime assurance architecture','Policy, domain and episode graphs feed admission and coordinated containment. An independent local stop works during model, graph, network and identity-service outages. Stops override admission at the resource boundary. Safe resumption requires verified recovery and separate authorization.')
    f.rect(15,12,1210,252,PALE,'#cbdfe3',22,3);f.text(54,79,'Verifiable runtime inputs',44,True,DARK);f.line(55,107,1185,107,'#cbdfe3',3)
    for x,title,body in [(54,'Policy graph','Rules and triggers'),(441,'Domain graph','Agents, assets and roles'),(827,'Episode graph','Pending effects')]:f.text(x,166,title,38,True);f.text(x,220,body,34,False,MUTED)
    f.rect(1260,12,587,579,'#fcf2e4','#edcfaa',22,3);f.text(1299,82,'Independent local stop',44,True,'#85501c')
    f.lines(1299,150,['Local operator control or','independent safety monitor'],37,False,INK,47);f.line(1299,245,1808,245,'#edcfaa',2)
    f.text(1299,310,'Direct protective path',39,True,'#85501c');f.lines(1299,377,['Independent of the AI model,','graphs, network and remote','identity services.'],37,False,INK,47)
    f.arrow(309,268,309,334);f.arrow(931,268,931,334,TEAL)
    f.rect(15,339,587,252,PALE,'#cbdfe3',22,3);f.text(54,409,'Normal admission',44,True,DARK)
    f.lines(54,469,['Check the exact action','Verify mandate and evidence','Pin source versions'],37,False,INK,47)
    f.rect(638,339,587,252,GREEN,'#badbd5',22,3);f.text(677,409,'Coordinated kill switch',44,True,TEAL)
    f.lines(677,469,['Verify evidence and freshness','Authenticate the responder','Check scoped stop authority'],37,False,INK,47)
    for x,color in [(309,MUTED),(931,TEAL),(1553,'#85501c')]:f.arrow(x,595,x,672,color)
    f.rect(15,678,1832,300,PALE,'#cbdfe3',22,3);f.rect(15,678,1832,86,DARK,None,21)
    f.text(54,737,'Protected resource boundary',44,True,'#ffffff');f.text(1805,737,'Stop overrides admission',36,True,'#ffffff','end')
    f.line(620,785,620,950,'#cbdfe3',3);f.line(1243,785,1243,950,'#cbdfe3',3)
    for x,title,body,color in [(54,'Action decision',['Allow, deny or escalate.','Commit only if permitted.'],DARK),(677,'Contain effects',['Block new effects and hold.','Cancel or hand off work safely.'],TEAL),(1299,'Safe state or fallback',['Reach a defined safe state or','transfer to validated fallback.'],'#85501c')]:
        f.text(x,827,title,39,True,color);f.lines(x,882,body,37,False,INK,47)
    f.arrow(433,981,433,1047);f.line(931,981,931,1005,TEAL,4);f.line(1553,981,1553,1005,'#85501c',4);f.line(931,1005,1553,1005,MUTED,4);f.arrow(1374,1005,1374,1047)
    f.rect(15,1052,852,248,PALE,'#cbdfe3',22,3);f.text(54,1119,'Signed receipt to episode graph',42,True,DARK)
    f.text(54,1186,'Record decisions and enforced stops.',36);f.text(54,1237,'Log asynchronously and track unresolved work.',36,False,MUTED)
    f.rect(901,1052,946,248,GREEN,'#badbd5',22,3);f.text(940,1119,'Safe resumption',44,True,TEAL)
    f.text(940,1186,'Verify recovery and obtain separate authorization.',36);f.text(940,1237,'Release the hold only after both checks pass.',36,False,MUTED)
    f.finish()

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir',help='Verified LaTeX source package; defaults to AI_SAFETY_SOURCE_DIR or archived reference folder.')
    parser.add_argument('--font-regular',help='Regular TrueType font; defaults to AI_SAFETY_FONT_REGULAR or Windows Segoe UI.')
    parser.add_argument('--font-bold',help='Bold TrueType font; defaults to AI_SAFETY_FONT_BOLD or Windows Segoe UI Bold.')
    args=parser.parse_args();configure(args.source_dir,args.font_regular,args.font_bold)
    OUT.mkdir(parents=True,exist_ok=True)
    disciplines();levels();matrix();atlas();runtime()
    published_pdf=ROOT/'docs/top-10-global-ai-safety-companies-2026.pdf'
    if source_pdf().resolve()!=published_pdf.resolve():shutil.copyfile(source_pdf(),published_pdf)
    doc=fitz.open(source_pdf());doc[0].get_pixmap(matrix=fitz.Matrix(2,2),alpha=False).save(OUT/'paper-cover.png')
    (OUT/'figure-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    refs=Path(__file__).parent/'reference';refs.mkdir(exist_ok=True)
    for item in list((SRC/'figures').glob('*.png'))+[SRC/name for name in ['main.tex','body.tex','references.tex']]:
        if item.resolve()!=(refs/item.name).resolve():shutil.copyfile(item,refs/item.name)
    info={'source_edition':'2.6','source_pdf_sha256':hashlib.sha256(source_pdf().read_bytes()).hexdigest(),'source_pdf_pages':len(doc),'method':'Faithful vector reconstruction from published raster artwork. Figure 3 labels derive from live overlay source keys in body.tex mapped through references.tex bibliography order; checked against page 8 of main.pdf. SVG lettering outlined from the embedded-font PDFs.','map_geometry':'Repository Natural Earth world.geojson; Robinson projection. Coastline rendering and font metrics may differ slightly from source raster; all labels, counts, indicator meanings, relative layout and semantic content preserved.','figures':manifest}
    (Path(__file__).parent/'provenance.json').write_text(json.dumps(info,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'figures':len(manifest),'paper_pages':len(doc),'assets':str(OUT)}))
