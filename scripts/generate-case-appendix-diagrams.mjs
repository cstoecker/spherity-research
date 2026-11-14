// Concrete examples adapted from the first-edition case diagrams.
// Run prepare-case-study-assets.mjs afterwards for embedded fonts/XMP and PNGs.
import {writeFileSync} from 'node:fs';
const dir='docs/assets/verifiable-ai-lab-results/';
const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const text=(x,y,s,size=22,color='#172536',weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${xml(s)}</text>`;
const box=(x,y,w,h,title,lines,accent=false)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${accent?'#e0f6ef':'#f2f8f9'}" stroke="${accent?'#167d8d':'#a8c9d0'}" stroke-width="2"/>${text(x+18,y+35,title,23,'#167d8d',700)}${lines.map((s,i)=>text(x+18,y+72+i*28,s,20)).join('')}`;
const arrow=(x,y,x2,y2,dashed=false)=>`<path d="M${x} ${y} L${x2} ${y2}" fill="none" stroke="#167d8d" stroke-width="3" ${dashed?'stroke-dasharray="7 5"':''} marker-end="url(#arrow)"/>`;
function save(id,title,subtitle,body,height=1100){
 writeFileSync(dir+id+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${height}" viewBox="0 0 1600 ${height}" role="img" aria-labelledby="title desc" font-family="Arial, Liberation Sans, sans-serif"><title id="title">${xml(title)}</title><desc id="desc">${xml(subtitle)}</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#167d8d"/></marker></defs><rect width="1600" height="${height}" fill="white"/>${text(40,55,title,38,'#071c2b',700)}${text(40,94,subtitle,22,'#526273')}${body}</svg>\n`);
}
function flow(id,title,subtitle,sources,steps,records,limit){
 let b='';
 for(let i=0;i<3;i++){const x=40+i*520;b+=box(x,130,480,175,sources[i][0],sources[i].slice(1));b+=arrow(x+240,305,x+240,345,true);}
 b+=`<rect x="40" y="345" width="1520" height="58" rx="12" fill="#071c2b"/>`+text(62,382,'Versioned source records → applicable evidence references in the actual run',26,'#fff',700)+arrow(800,403,800,445,true);
 for(let i=0;i<5;i++){const x=40+i*310;b+=box(x,445,280,175,steps[i][0],steps[i].slice(1));if(i<4)b+=arrow(x+280,532,x+310,532);b+=arrow(x+140,620,x+140,705,true);b+=box(x,705,280,280,records[i][0],records[i].slice(1),i===3);}
 b+=text(40,1070,'Solid arrows: operational hand-off. Dashed arrows: supporting records; each retains its own issuer and scope.',19,'#526273');
 b+=text(40,1035,limit,23,'#167d8d',700);
 save(id,title,subtitle,b);
}

flow('figure-13-product-authenticity-detail','A1 · Product authenticity: a concrete evidence workflow',
 'Tailorlux marking / reader context; proposed credential integration. All record IDs below are illustrative.',[
 ['Organisation and delegated authority','Operator wallet: legal identity credentials','Agent Card + mandate for lot L-0417','Register evidence supports legal identity'],
 ['Device and material assurance','Reader identity + firmware + applicable DCC','Reference-material lot + certificate scope','Controls, storage and suitability at use'],
 ['AI service and validation','AISP-03 + profile P-MARKER-02','Model v3.2 / marker DB v9 / library v14','TEVV report + assessed version and limits']
 ],[
 ['1  Marked material','Lot L-0417 / sample S-17','Expected marker M-4711','Bind sample to the lot'],
 ['2  Reader + capture','Tailor-Scan context','Spectrum + time + set-up','Bind capture to device'],
 ['3  AI analysis','Run R-8812','Apply method + profile','Retain match evidence'],
 ['4  Report service','Accountable operator','Signs result credential','Optional interpretation'],
 ['5  Receiver','Brand / recycler / buyer','Check evidence + scope','Apply acceptance rule']
 ],[
 ['Object record','lot: L-0417','sample: S-17','markerRef: M-4711','collection + custody','claim owner + status','Physical binding checked'],
 ['Observation record','capture: SCAN-17','rawDataDigest: SHA-256','deviceRef: READER-231','setUpRef + timestamp','DCCRef: CAL-09','materialRefs + controls'],
 ['AI result record','run: R-8812','inputRef: SCAN-17','serviceRef: AISP-03','profile: P-MARKER-02','reference releases','finding + limitations'],
 ['Signed report','report: REP-17','issuer: operator','subject: L-0417 / S-17','resultRef: R-8812','interpretation, if any','proof + status + policy'],
 ['Receiver checks','Issuer + task authority','Bound data + versions','Calibration applicability','Material lots + controls','Validation + uncertainty','Accept / refer / reject']
 ],'Marker detection supports a scoped finding; it does not establish composition, origin or authenticity by itself.');

let graph=box(40,175,480,165,'Report REP-17',['Issuer: accountable operator','Subject: lot L-0417 / sample S-17','Interpretation + limits; resultRef: R-8812'],true)+
box(560,175,480,165,'Analysis run R-8812',['Issuer: authorised analysis service','Finding + method + configuration','Evidence references identify the actual run'])+
box(1080,175,480,165,'Receiver trust policy',['Evaluate report and linked evidence','Check issuer, proof, scope, time and status','Scientific acceptance is a separate judgment']);
// Policy evaluates the report; it is not an evidence record issued by the run.
graph+=`<path id="policy-evaluation" d="M1320 175 V130 H280 V175" fill="none" stroke="#167d8d" stroke-width="3" stroke-dasharray="7 5" stroke-linejoin="round" marker-end="url(#arrow)"/>`;
graph+=text(500,120,'evaluates the report and its linked evidence',20,'#526273');
graph+=arrow(520,258,560,258);
graph+=text(825,390,'Run evidence references',20,'#526273');
// Staggered junctions distinguish independent references from pairwise links.
// End the spine exactly at its final junction, without a dangling tail.
graph+=`<path id="run-reference-spine" d="M800 340 V1085" fill="none" stroke="#167d8d" stroke-width="3" stroke-linecap="round"/>`;
const nodes=[
 ['objectRef → sample / lot',['L-0417 / S-17 / marker M-4711','Collection + custody + physical binding','Marker registration identifies the claim owner','Sources: collector, operator, marker record']],
 ['inputRef → captured observation',['SCAN-17 / rawDataDigest / capture time','Device key or gateway capture attestation','Preprocessing points back to retained raw data','Source: capture service; access controlled']],
 ['deviceRef → reader and calibration',['READER-231 / firmware / actual settings','CAL-09: calibration result + uncertainty','Check range, conditions and applicability','Sources: device operator, calibration laboratory']],
 ['materialRefs → lots used in this run',['Reference lot CRM-04 / consumable lot C-08','Producer certificate or declaration + scope','Expiry, storage and run controls recorded','Sources: producer + laboratory at time of use']],
 ['serviceRef → AISP and validation',['AISP-03 / model v3.2 / profile P-MARKER-02','Marker DB v9 / library v14 / threshold rule','TEVV evidence: tests, cohorts, limits, assessor','Vendor declaration ≠ independent assessment']],
 ['authorityRef → organisation and mandate',['Agent Card + permitted task / assets / time','Operator wallet presents identity credentials','Register establishes identity within its remit','CAB evidence, if applicable, keeps exact scope']]
];
for(let i=0;i<6;i++){const right=i%2===1,x=right?870:40,y=440+Math.floor(i/2)*260,junctionY=y+(right?125:80);graph+=box(x,y,690,205,nodes[i][0],nodes[i][1]);graph+=arrow(800,junctionY,right?870:730,junctionY);graph+=`<circle cx="800" cy="${junctionY}" r="5" fill="#167d8d"/>`;}
graph+=text(40,1200,'Solid: typed record references. Dashed: receiver evaluation. Dots: branches from the same run.',24,'#167d8d',700)+
text(40,1243,'Illustrative identifiers. A reference or valid signature does not prove that its underlying assertion is scientifically correct.',22);
save('figure-14-concrete-evidence-graph','A2 · Follow one result through its evidence graph','Worked product-authenticity example; proposed record structure, not a normative credential schema.',graph,1300);

flow('figure-15-forensic-detail','A3 · Forensic laboratory: custody, analysis and review',
 'Worked spectral-analysis example. DNA and fingerprint comparison require different methods and validation profiles.',[
 ['Public-body identity and competence','Official identity source + laboratory wallet','Accreditation evidence: current method scope','Bounded mandate for analyst / analysis service'],
 ['Calibration and material records','Calibration laboratory issues applicable DCC','Reference-material and reagent lot records','Blanks, controls and contamination checks'],
 ['Model, references and validation','Vendor model record + AISP + method profile','Reference-library release + reviewed matches','Independent assessment is a separate claim']
 ],[
 ['1  Exhibit','Exhibit E-0931','Seal + custody record','Subsample S-0931-A'],
 ['2  Instrument / LIMS','Example: IR or Raman','Set-up + actual inputs','Raw data + run controls'],
 ['3  Analysis service','Run F-12 / method M-12','Versioned library search','Candidate + limitations'],
 ['4  Expert report','Review within lab scope','Interpretation + limits','Signed report + evidence'],
 ['5  Authorised party','Court / parties / expert','Controlled evidence access','Legal decision separate']
 ],[
 ['Custody record','exhibit: E-0931','subsample: S-0931-A','collector + transfers','seal + condition + time','authorised access','Trace each hand-off'],
 ['Measurement record','rawDataDigest + units','instrument + set-up','applicable DCCRef','material + reagent lots','blank / control outcomes','analyst + timestamp'],
 ['Analysis result','run: F-12 / inputRef','methodRef: M-12','AISP + model version','library release + rule','candidate substance','uncertainty / limitations'],
 ['Laboratory report','issuer: laboratory','subject: E-0931','resultRef + expert review','method + scope','supporting evidence','signature + status'],
 ['Receiver checks','Authority + lab scope','Custody + exhibit link','Calibration + controls','Method / library validity','Expert interpretation','Reasons + access audit']
 ],'A candidate identification is not a legal conclusion. Evidence integrity alone does not establish admissibility.');

flow('figure-16-automotive-detail','A4 · Automotive Driving Labels: from trip to data product',
 'Informed by the reported BMW Dangerous Driving field-test context; the credential workflow below is proposed.',[
 ['Accountable organisation','Operator business wallet + source credentials','Agent Card + permission to label this dataset','Data rights, consent or other applicable basis'],
 ['Sensor and capture provenance','Sensor identities, configuration and time sync','Calibration evidence where the method needs it','Gateway attestation binds captured records'],
 ['Labelling and review evidence','AISP + model v1.4 + taxonomy T-03','Validation profile + reference dataset release','Ground truth, operating domain and review']
 ],[
 ['1  Trip segment','Vehicle pseudonym V-7F','Trip TR-12 / segment 08','Bounded sensor window'],
 ['2  Gateway / ingest','Frames + telemetry','Timestamps + transforms','Retain source digests'],
 ['3  Labelling agent','Run A-08 / model v1.4','Detect a braking event','Label + supporting data'],
 ['4  Data product','Dataset DS-12','Versioned labelled segment','Signed provenance record'],
 ['5  Data consumer','Engineering / evaluation','Check intended-use fit','Accept or review']
 ],[
 ['Segment record','vehicle pseudonym','trip + segment bounds','sensor set + clocks','collection permission','custody / processing log','Access restrictions'],
 ['Capture record','frame / telemetry hashes','gateway identity + key','sensor configurations','preprocessing versions','calibrationRef if needed','time-sync evidence'],
 ['Labelling result','event: braking candidate','model + taxonomy','profile + ground truth','operating conditions','review / abstention flag','No universal confidence'],
 ['Provenance record','issuer: data operator','subject: DS-12 / seg 08','resultRef: A-08','source + transform refs','rights + access policy','proof + status'],
 ['Consumer checks','Permitted data use','Issuer + agent mandate','Capture + time integrity','Profile / domain fit','Review and disagreement','Fitness for stated use']
 ],'An event label does not establish dangerous conduct, liability or vehicle safety. A gateway signature is not calibration.');
console.log('Generated four concrete use-case appendix diagrams.');
