// Editable vector masters. Run before prepare-case-study-assets.mjs to embed fonts/XMP.
import {writeFileSync} from 'node:fs';
const dir='docs/assets/verifiable-ai-lab-results/';
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const text=(x,y,s,size=22,fill='#172536',weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}">${esc(s)}</text>`;
const box=(x,y,w,h,title,lines)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#f1f8f8" stroke="#a8c9d0" stroke-width="2"/>${text(x+22,y+35,title,24,'#167d8d',700)}${lines.map((l,i)=>text(x+22,y+72+i*29,l,20)).join('')}`;
const arrow=(x,y,x2,y2)=>`<path d="M${x} ${y} L${x2} ${y2}" fill="none" stroke="#167d8d" stroke-width="3" marker-end="url(#arrow)"/>`;
function save(id,title,desc,content){
 writeFileSync(dir+id+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="760" viewBox="0 0 1280 760" role="img" aria-labelledby="title desc" font-family="Arial, Liberation Sans, sans-serif"><title id="title">${esc(title)}</title><desc id="desc">${esc(desc)}</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#167d8d"/></marker></defs><rect width="1280" height="760" fill="white"/>${text(40,52,title,32,'#071c2b',700)}${content}</svg>\n`);
}
save('figure-6-calibration-matching','From calibration to a verifiable analysis result','Calibration evidence and run inputs support measurement, matching and the result credential.',
 box(40,90,350,130,'1  Request calibration',['DCR: device, range, conditions','Requested calibration scope'])+
 box(465,90,350,130,'2  Calibration laboratory',['Reference standards + procedure','DCC: results and uncertainty'])+
 box(890,90,350,130,'3  Device and set-up',['Identity, firmware, configuration','Applicable calibration evidence'])+
 arrow(391,155,465,155)+arrow(815,155,890,155)+
 box(40,285,350,160,'4  Actual inputs',['Sample / exhibit / lot identity','Consumable and CRM lots','Custody, conditions, controls'])+
 box(465,285,350,160,'5  Measurement',['Raw data + units + time','Preprocessing + uncertainty','Bind device and input records'])+
 box(890,285,350,160,'6  Reference matching',['Marker / DNA / fingerprint data','Versioned method + references','Scope-specific validation'])+
 arrow(391,365,465,365)+arrow(815,365,890,365)+
 `<path d="M1065 220 V252 H640 V285" fill="none" stroke="#167d8d" stroke-width="3" marker-end="url(#arrow)"/>`+
 box(465,510,775,150,'7  Result credential and linked evidence',['Value, match or finding; interpretation and limits stated separately','Digests + issuer + scope + status + access policy for each record'])+
 arrow(1065,445,1065,510)+text(40,590,'Calibration ≠ matching.',22,'#167d8d',700)+text(40,625,'A signature ≠ scientific validity.',20)+
 text(40,710,'DCR: Digital Calibration Request  ·  DCC: Digital Calibration Certificate  ·  CRM: certified reference material',20));
save('figure-7-material-assurance','Authentic material. Suitable material. Valid run.','Four separate checks support consumables and reference materials in an actual test.',
box(40,100,560,205,'1  Identity and authenticity',['Producer + product + lot / batch','Authentic issuer record and certificate revision','Physical label-to-record binding'])+
box(680,100,560,205,'2  Certified or declared scope',['Property, matrix, range and method','CRM value, uncertainty and traceability','Consumable declaration ≠ CRM certificate'])+
box(40,355,560,205,'3  Condition at use',['Expiry, storage and transport conditions','Opening date, preparation and minimum intake','Suitability for this sample and procedure'])+
box(680,355,560,205,'4  Controls and release',['Blanks, positive / negative controls','Contamination checks and acceptance limits','Record actual use; hold failed runs'])+
arrow(320,305,320,355)+arrow(960,305,960,355)+arrow(320,560,320,610)+arrow(960,560,960,610)+
`<rect x="40" y="610" width="1200" height="90" rx="14" fill="#071c2b"/>`+text(65,648,'Run record → result credential → receiver’s applicability check',27,'#ffffff',700)+text(65,680,'Each assertion retains its issuer, scope, time and evidence reference.',21,'#b4e9df'));
save('figure-8-service-passport-validation','Verifiable AI Service Passport','A proposed service passport links agent identity, configuration, validation profile and TEVV evidence to the actual run.',
text(40,88,'Proposed evidence container — not a certification scheme',22,'#526273')+
box(40,120,560,190,'Verifiable Agent Card',['Service and agent identity; declared interfaces','Accountable organisation; authorised issuer / key','Declared capability ≠ demonstrated competence'])+
box(680,120,560,190,'Execution configuration',['Model, tools, preprocessing and relevant prompts','Reference-library release and thresholds','Versioned configuration + change history'])+
box(40,355,560,190,'Validation profile',['Intended use, matrix, range and exclusions','Marker recognition or forensic comparison cases','Acceptance criteria, abstention and review'])+
box(680,355,560,190,'TEVV evidence',['Tests, datasets, assessor and assessed version','False accepts / rejects; confidence intervals','Independent lots, challenge cases and limitations'])+
arrow(320,310,320,355)+arrow(960,310,960,355)+arrow(320,545,320,605)+arrow(960,545,960,605)+
`<rect x="40" y="605" width="1200" height="96" rx="14" fill="#071c2b"/>`+text(65,645,'Actual run: prove which configuration and profile applied',27,'#ffffff',700)+text(65,679,'Changed model, reference release or operating conditions → applicability review / revalidation',21,'#b4e9df'));
save('figure-9-wallet-recognition','Identity, competence and authority are separate checks','Sources support organisational evidence and bounded delegation; the receiver decides whether the evidence is applicable.',
box(40,100,350,180,'Sources and assurance',['Official identity registers','CAB / accreditation records','Producer certificates and lots','Each authoritative in its scope'])+
box(465,100,350,180,'Organisation + wallet',['Present identity and evidence','Control keys and permissions','Issue a bounded agent mandate','Wallet ≠ laboratory or CAB'])+
box(890,100,350,180,'Agent + actual run',['Task, assets and time limits','Service Passport + profile','Execution evidence + result','Enforced delegation scope'])+
arrow(391,190,465,190)+arrow(815,190,890,190)+
box(40,365,530,190,'Recognition and trust policy',['Who may assert which claim?','Check scope, dates, status and issuer competence','Established registers / policies for a pilot','W3C recognition model: experimental draft'])+
box(680,365,560,190,'Receiver / verifier',['Check proofs, evidence binding and applicability','Evaluate scientific support and uncertainty','Apply the acceptance rule; retain the reasons','Accept / reject / indeterminate'])+
arrow(570,460,680,460)+arrow(1065,280,1065,365)+
text(40,635,'Legal identity does not establish scientific competence.',27,'#167d8d',700)+text(40,678,'Accreditation and recognition have scopes. A valid signature does not make every claim true.',23));
// Revised first-edition figures keep their published asset URLs.
save('figure-1-problem-framing','Six questions behind a verifiable test result','Six evidence questions surround a result: organisation, AI service, set-up, input, device and object. A result may be a value, finding, match or optional verdict.',
box(40,110,350,155,'1  Who is accountable?',['Organisation and trusted identity','Agent mandate for this task','Issuer competence and scope'])+
box(465,110,350,155,'2  Which AI service?',['Agent Card + Service Passport','Model and execution version','Validation profile + TEVV'])+
box(890,110,350,155,'3  Which set-up?',['Method and reference release','Matching rule and thresholds','Materials, controls and conditions'])+
`<rect x="40" y="325" width="1200" height="95" rx="14" fill="#071c2b"/>`+
text(68,365,'Result: measured value, finding, match or optional verdict',29,'#ffffff',700)+
text(68,397,'The receiver needs supporting evidence, its scope and its current applicability.',22,'#b4e9df')+
box(40,480,350,155,'4  Which actual input?',['Raw data, preprocessing, tools','Collection and custody records','Hashes bind files, not objects'])+
box(465,480,350,155,'5  Which device?',['Identity, firmware and settings','DCC scope and uncertainty','Calibration ≠ type conformity'])+
box(890,480,350,155,'6  Which sample or lot?',['Physical-to-digital binding','Product, exhibit or tank identity','Consumable and reference lots'])+
text(40,700,'Across all six: check dates, status, evidence access and fitness for the intended use.',24,'#167d8d',700));

function operational(id,title,steps,support,limit){
 let s=text(40,90,'Operational flow: observations, analysis and receiver decisions',21,'#526273');
 const xs=[40,350,660,970];
 for(let i=0;i<4;i++){s+=box(xs[i],125,270,170,steps[i][0],steps[i].slice(1));if(i<3)s+=arrow(xs[i]+270,210,xs[i+1],210);}
 s+=`<rect x="40" y="345" width="1200" height="80" rx="14" fill="#071c2b"/>`;
 s+=text(65,378,'Result credential + typed, versioned evidence references',27,'#ffffff',700);
 s+=text(65,408,'Keep results, interpretation and acceptance separate. Access sensitive evidence under policy.',20,'#b4e9df');
 s+=arrow(795,295,795,345)+arrow(1105,345,1105,295);
 for(let i=0;i<3;i++){const x=[40,465,890][i];s+=box(x,485,350,165,support[i][0],support[i].slice(1));s+=arrow(x+175,485,x+175,425);}
 s+=text(40,708,limit,23,'#167d8d',700);
 save(id,title,'The operational workflow links result credentials to separate identity, calibration, materials and validation records. The receiver checks applicability rather than trusting a signature alone.',s);
}
operational('figure-2-system-view','System view: from sample to accountable result',[
 ['1  Sample / object','Food, product or tank','Identity + collection','Custody / lot binding'],
 ['2  Measurement','Device + actual set-up','Raw data + conditions','Values and uncertainty'],
 ['3  AI analysis','Versioned method','Reference matching','Service Passport'],
 ['4  Receiver','Evidence + policy','Accept / reject /','indeterminate']
],[
 ['Identity and authority','Organisation + business wallet','Agent Card + bounded mandate','Authoritative source / register'],
 ['Calibration and materials','DCC: scope, results, uncertainty','Consumable + reference lots','Certificates, conditions, controls'],
 ['Validation and assurance','Profile + TEVV for this version','CAB evidence where applicable','Recognition and scope checks']
],'Proposed integration. Calibration, certification and method validation are separate activities.');

save('figure-3-evidence-graph','Evidence graph: follow claims to scoped sources','A report references a result and actual run; the run links sample, calibration and material evidence, and service and authority evidence. Each record retains its own issuer, scope and status.',
box(40,115,350,145,'Report / result certificate',['Interpretation, if provided','Digest of the analysis result','Accountable report issuer'])+
box(465,115,350,145,'Analysis result + actual run',['Value, units or analytical finding','Method + configuration + limits','Result issuer and signing key'])+
box(890,115,350,145,'Typed evidence references',['Identifiers + versions + digests','Issuer, scope, time and status','Access policy for retained data'])+
arrow(390,185,465,185)+arrow(815,185,890,185)+
`<path d="M1065 260 V330 H215 V405 M640 330 V405 M1065 330 V405" fill="none" stroke="#167d8d" stroke-width="3"/>`+
arrow(215,365,215,405)+arrow(640,365,640,405)+arrow(1065,365,1065,405)+
box(40,405,350,190,'Sample and observation',['Object / exhibit / lot binding','Collection, custody and raw data','Issuer: collector / laboratory','Reference owner: library record'])+
box(465,405,350,190,'Device and materials',['Calibration lab: applicable DCC','Producer: material lot certificate','Laboratory: conditions + controls','Do not merge certificate scopes'])+
box(890,405,350,190,'Service and authority',['Operator: AISP + agent mandate','Assessor: scoped TEVV evidence','CAB / accreditation: exact scope','Register: organisational identity'])+
text(40,656,'Recognition is checked for each issuer and action under the receiver’s trust policy.',23,'#167d8d',700)+
text(40,699,'Arrows follow evidence references. They do not establish truth, competence or universal recognition.',21));

operational('figure-4-vehicle-data-variant','Automotive Driving Labels: provenance with limits',[
 ['1  Trip segment','Pseudonymous vehicle','Sensor set + timestamps','Retained data segment'],
 ['2  Acquisition','Gateway identity','Signed data + transforms','Time synchronisation'],
 ['3  Labelling','Model + taxonomy','Reference dataset','Profile + reviewed label'],
 ['4  Data consumer','Intended-use checks','Quality / review policy','Accept or refer']
],[
 ['Identity and mandate','Processor + business wallet','Agent identity and permissions','Data rights and access scope'],
 ['Sensor evidence','Configuration and provenance','Calibration where applicable','Gateway signature ≠ calibration'],
 ['Validation evidence','Ground truth and dataset release','Operating conditions + TEVV','Label score ≠ safety assurance']
],'A driving-event label does not by itself establish dangerous conduct, liability or vehicle safety.');

operational('figure-5-forensic-laboratory-variant','Forensic analysis: evidence, authority and review',[
 ['1  Exhibit','Collection + seals','Custody + subsampling','Lawful access'],
 ['2  Laboratory','Method + instrument','Materials + controls','Raw data + uncertainty'],
 ['3  Analysis','DNA / fingerprint /','substance: own profile','Expert interpretation'],
 ['4  Recipient','Authorised reviewer','Evidence + limitations','Legal decision separate']
],[
 ['Authority and competence','Official public-body identity','Accreditation: method and scope','Wallet + bounded agent mandate'],
 ['Measurement assurance','Calibration lab: applicable DCC','Consumable and reference lots','Contamination and run controls'],
 ['Model and reference data','Vendor assertion ≠ assessment','AISP + validated reference release','Domain-specific TEVV + review']
],'A candidate match is not guilt. Evidence integrity does not establish legal admissibility.');

save('figure-12-spherity-products','How Spherity can help','Concept chart connecting EIDA business wallets, agent identity, AI Service Passports, Trusted AI evidence checks and VERA product passports. Scientific assurance remains with laboratories and assessors.',
text(40,94,'Conceptual integration for this case; arrows show how the capabilities connect.',21,'#526273')+
box(40,155,350,150,'EBW / EIDA',['Company identity','Credential presentation','Bounded delegation'])+
box(465,155,350,150,'Agent Identity',['Agent and key binding','Accountable organisation','Task-specific authority'])+
box(890,155,350,150,'AI Service Passport',['Service and model versions','Validation profiles + TEVV','Configuration and limits'])+
arrow(390,230,465,230)+arrow(815,230,890,230)+
box(890,405,350,150,'Trusted AI',['Evidence and status checks','Access and acceptance policy','Audit trail + review'])+
box(40,405,350,150,'DPP / VERA',['Product and lot identity','Links to test evidence','Reusable lifecycle records'])+
arrow(1065,305,1065,405)+arrow(890,480,390,480)+
text(480,448,'Reusable evidence',27,'#167d8d',700)+text(515,523,'for the receiver',24)+
text(40,628,'All Spherity products are based on open standards.',28,'#167d8d',700)+
text(40,672,'Active in W3C: Verifiable Credentials and DPP / Business Wallet work.',24)+
text(40,711,'Labs and assessors provide scientific assurance. Integration and validated scope are case-specific.',21));
console.log('Generated ten laboratory evidence SVG masters, including five revised first-edition figures.');
