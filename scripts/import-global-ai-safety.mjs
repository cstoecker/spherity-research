// Convert the approved edition without renumbering its bibliography.
// Usage: node scripts/import-global-ai-safety.mjs <verified-source-directory>
import fs from 'node:fs';
import path from 'node:path';
import { stringify, parse } from 'yaml';
const root = process.argv[2];
if (!root) throw new Error('Pass the verified edition 2.6 source directory');
const read = f => fs.readFileSync(path.join(root,f),'utf8').replaceAll('\r','');
const body = read('body.tex'), main = read('main.tex'), refs = read('references.tex');
const slug='top-10-global-ai-safety-companies-2026';
const canonical=`https://spherity.github.io/spherity-research/${slug}.html`;
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const bib=[...refs.matchAll(/\\bibitem\{([^}]+)\}\n([\s\S]*?)(?=\\bibitem|\\end\{thebibliography\})/g)];
if(bib.length!==98) throw new Error(`Expected 98 references, found ${bib.length}`);
const numbers=Object.fromEntries(bib.map((m,i)=>[m[1],i+1]));
const refsMap={};
const slugify=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
let section=0, tableNo=0;
for(const m of body.matchAll(/\\section(\*)?\{([^}]+)\}(?:\n\\label\{([^}]+)\})?/g)){
 if(!m[1]) section++;
 if(m[3]) refsMap[m[3]]={id:slugify(m[2]),text:String(section)};
}
for(const m of body.matchAll(/\\(?:caption|captionof\{table\})\{([^{}]+)\}\n\s*\\label\{(tab:[^}]+)\}/g)) refsMap[m[2]]={id:slugify(m[2]),text:String(++tableNo)};
const fids=['disciplines','assurance-types','company-activities','ai-safety-atlas','runtime-assurance'];
const fnames=['ai-safety-disciplines','assurance-levels','company-activity-matrix','ai-safety-atlas','runtime-assurance'];
fids.forEach((x,i)=>refsMap['fig:'+x]={id:`figure-${i+1}-${fnames[i]}-figure`,text:String(i+1)});
function inline(s, links=true){
 s=esc(s.trim()).replace(/\\url\{([^}]+)\}/g,(_,u)=>`<a href="${u}">${u}</a>`);
 s=s.replace(/\\cite\{([^}]+)\}/g,(_,keys)=>{
  const ns=keys.split(',').map(k=>{if(!numbers[k]) throw new Error(k);return numbers[k]}).sort((a,b)=>a-b);
  return '['+ns.map(n=>links?`<a href="#ref-${n}" aria-label="Reference ${n}">${n}</a>`:n).join(', ')+']';
 });
 s=s.replace(/\\ref\{([^}]+)\}/g,(_,k)=>{const r=refsMap[k];if(!r)throw new Error(k);return `<a href="#${r.id}">${r.text}</a>`});
 s=s.replace(/\\textbullet\{\}/g,'·');
 for(let i=0;i<4;i++)s=s.replace(/\\(textbf|textit|mbox)\{([^{}]*)\}/g,(_,t,v)=>t==='mbox'?v:`<${t==='textbf'?'strong':'em'}>${v}</${t==='textbf'?'strong':'em'}>`);
 return s.replace(/\\textbullet\{\}/g,'·').replace(/\\newline/g,'<br>').replaceAll('\\&amp;','&amp;').replaceAll('\\%','%').replaceAll('~',' ').replaceAll('---','—').replaceAll('--','–').replaceAll('``','“').replaceAll("''",'”').replace(/\n/g,' ').replace(/ +/g,' ');
}
// Balanced argument reader is needed because published captions contain citations.
function argument(s,command){const start=s.indexOf(command+'{');if(start<0)return '';let p=start+command.length+1,d=1,out='';for(;p<s.length;p++){if(s[p]==='{')d++;if(s[p]==='}')d--;if(!d)break;out+=s[p]}return out;}
const figureBlocks=[...body.matchAll(/\\begin\{figure\}\[!htbp\]([\s\S]*?)\\end\{figure\}/g)].map(m=>m[0]);
figureBlocks.splice(3,0,body.match(/\\begin\{minipage\}\{\\linewidth\}\n\s*\\subsection\{AI Safety Atlas\}[\s\S]*?\\end\{minipage\}/)[0]);
const captions=figureBlocks.map(b=>inline(argument(b,'\\caption'),false).replace(/<[^>]+>/g,''));
const alts=[
 'Four domains: A design and qualification of behavior, B live behavior monitoring, C bounded execution design, and D runtime enforcement of effects; cryptographic verifiability connects their evidence.',
 'Linked claims carry Q qualified authority, E issuer-authenticated evidence, or U self-asserted information; a graph can mix all three and policy checks each claim.',
 'Ten-company qualitative activity matrix. Filled circles mark primary activity and open circles supporting activity across A–D. Spherity D and C describe research and integration design.',
 'World map of ten companies and ten research organizations in eight countries, with distinct color and shape markers and A–D activity badges. Spherity in Germany has a subtle authority-and-evidence callout.',
 'An agent proposes; the resource owner admits or blocks the exact action using policy, domain and episode graphs. Independent local stop works during outages. Coordinated stop verifies evidence, responder identity and authority; resumption needs recovery and separate authorization.'
];
const figureObjects=fnames.map((n,i)=>({id:`figure-${i+1}-${n}`,name:['AI safety disciplines model','Q/E/U assurance levels','Company activity matrix','AI Safety Atlas','Runtime assurance architecture'][i],content_url:`/assets/global-ai-safety/figure-${i+1}-${n}.svg`,alt:alts[i],width:1920,height:1120,description:alts[i],caption:captions[i],credit_text:'Dr. Carsten Stöcker, Spherity GmbH',copyright_notice:'© 2026 Dr. Carsten Stöcker, Spherity GmbH',creator_type:'Person',creator_name:'Dr. Carsten Stöcker',creator_url:'https://spherity.github.io/spherity-research/#dr-carsten-stoecker',copyright_holder:{type:'Person',name:'Dr. Carsten Stöcker',url:'https://spherity.github.io/spherity-research/#dr-carsten-stoecker'},keywords:['AI safety','runtime assurance','verifiable assurance graphs'],downloads:['svg','png','pdf'].map(ext=>({url:`/assets/global-ai-safety/figure-${i+1}-${n}.${ext}`,label:ext.toUpperCase(),encoding_format:ext==='svg'?'image/svg+xml':ext==='png'?'image/png':'application/pdf'}))}));
function table(b){
 const caption=argument(b,b.includes('\\captionof')?'\\captionof{table}':'\\caption');
 const label=b.match(/\\label\{(tab:[^}]+)\}/)[1];
 const grid=b.split('\\toprule')[1].split('\\bottomrule')[0];
 const [header,rows]=grid.split('\\midrule');
 const splitRows=s=>s.split(/\\\\(?:\[[^\]]+\])?/).map(s=>s.trim()).filter(Boolean);
 const cells=s=>s.split(/(?<!\\)&/).map(s=>inline(s));
 const h=cells(splitRows(header)[0]);
 return `<div class="safety-table-scroll" role="region" aria-label="${esc(caption)}" tabindex="0"><table id="${slugify(label)}"><caption>Table ${refsMap[label].text}. ${inline(caption)}</caption><thead><tr>${h.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${splitRows(rows).map(row=>`<tr>${cells(row).map((x,i)=>`<${i?'td':'th scope="row"'}>${x}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function fig(i){return `{% assign safety_figure = page.figure_objects[${i}] %}\n{% include research-figure.html figure=safety_figure number=${i+1} %}`;}
const saved=[]; const token=s=>{saved.push(s);return `\n\n@@BLOCK${saved.length-1}@@\n\n`};
let converted=body;
const activityRows=[['Alibaba Group / Alibaba Cloud','China','B','A','src29,src30'],['Amazon / AWS','United States','D','B, C','src9,src10'],['Anthropic','United States','A','—','src31,src32,src33'],['Google DeepMind / Alphabet','United Kingdom / United States','A','D','src26,src34'],['Meta','United States','A','B','src35,src36'],['Microsoft','United States','A','D','src27,src38'],['NTT Group / NTT DATA','Japan','A','B','src39,src40'],['NVIDIA','United States','D','B, C','src11,src25,src41'],['OpenAI','United States','A','—','src43,src44,src45'],['Spherity','Germany','D (research / integration)','C (research / integration)','src5,src6,src28']];
const atlasText=`<div class="safety-atlas-key"><h4>Read the Atlas and activity indicators</h4><p><strong>Color and shape:</strong> teal circles identify commercial companies; ochre diamonds identify research organizations. Filled A–D badges indicate primary activity and outlined badges supporting activity.</p><dl><dt>A — Improve and qualify behavior</dt><dd>Design and qualification of model or system behavior.</dd><dt>B — Observe and manage live behavior</dt><dd>Operational validation, monitoring and behavior safeguards.</dd><dt>C — Design bounded execution</dt><dd>Configure isolation, reachability and deterministic control boundaries.</dd><dt>D — Verify and enforce each action</dt><dd>Runtime admission and enforcement before an external effect.</dd></dl><p><strong>Country counts (companies / research organizations):</strong> United States 6 / 3; United Kingdom 1 / 1; Canada 0 / 1; Germany 1 / 1; China 1 / 1; Japan 1 / 1; Singapore 0 / 1; Australia 0 / 1. Google DeepMind is mapped to the UK; parent Alphabet is based in the US.</p><details><summary>Company activity matrix — accessible text and sources</summary><div class="safety-table-scroll" role="region" aria-label="Company activity matrix as text" tabindex="0"><table><caption>Text companion to Figures 3 and 4. Unmarked cells carry no inference beyond the reviewed material.</caption><thead><tr><th scope="col">Company</th><th scope="col">Country</th><th scope="col">Primary</th><th scope="col">Supporting</th><th scope="col">Published references</th></tr></thead><tbody>${activityRows.map(r=>`<tr><th scope="row">${esc(r[0])}</th>${r.slice(1,4).map(v=>`<td>${esc(v)}</td>`).join('')}<td>${inline('\\cite{'+r[4]+'}')}</td></tr>`).join('')}</tbody></table></div></details></div>`;
figureBlocks.forEach((b,i)=>{let html=fig(i);if(i===1)html=`<div class="safety-assurance-pair">\n${table(b)}\n${html}\n</div>`;if(i===3)html='<h3 id="ai-safety-atlas">AI Safety Atlas</h3>\n<p>The Atlas locates both selections and retains their activity indicators. Open the full-size vector for detailed reading or download a print-ready PDF. A text companion below explains the map and badges.</p>\n'+html+'\n'+atlasText;converted=converted.replace(b,token(html));});
converted=converted.replace(/\\begin\{table\}\[!htbp\][\s\S]*?\\end\{table\}/g,b=>token(table(b)));
section=0;const toc=[{title:'The 2027 Proposition',href:'#the-2027-proposition'},{title:'Abstract',href:'#abstract'}];
converted=converted.replace(/\\(section|subsection|subsubsection)(\*)?\{([^}]+)\}/g,(_,type,star,title)=>{
 const level=type==='section'?2:type==='subsection'?3:4,id=slugify(title);
 if(type==='section'){if(!star)section++;toc.push({title,href:'#'+id})}
 return token(`<h${level} id="${id}">${type==='section'&&!star?section+'. ':''}${inline(title)}</h${level}>`);
});
converted=converted.replace(/^%.*$/gm,'').replace(/\\(?:FloatBarrier|phantomsection)/g,'').replace(/\\addcontentsline\{toc\}\{section\}\{[^}]+\}/g,'').replace(/\\label\{[^}]+\}/g,'').replace(/\\nopagebreak\[\d\]/g,'');
converted=converted.split(/\n\s*\n/).map(p=>{p=p.trim();if(!p)return '';const m=p.match(/^@@BLOCK(\d+)@@$/);return m?saved[Number(m[1])]:`<p>${inline(p)}</p>`}).filter(Boolean).join('\n\n');
if(/\\[a-zA-Z]+/.test(converted))throw new Error('Unconverted TeX: '+converted.match(/.{0,40}\\[a-zA-Z]+.{0,80}/g));
const proposition=main.match(/As AI agents move[\s\S]*?including revocation\./)[0];
const abstract=main.match(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/)[1].trim().split(/\n\n/).map(p=>`<p>${inline(p)}</p>`).join('\n');
const refHTML='<h2 id="references">References</h2>\n<ol class="safety-references">'+bib.map((m,i)=>`<li id="ref-${i+1}" data-source-key="${m[1]}">${inline(m[2])}</li>`).join('\n')+'</ol>';
toc.splice(toc.findIndex(t=>t.href==='#company-activities-mapped-to-the-model')+1,0,{title:'AI Safety Atlas',href:'#ai-safety-atlas'});
toc.push({title:'References (98)',href:'#references'},{title:'License and citation',href:'#license-and-citation'},{title:'Questions answered',href:'#questions-answered'});
const qa=[
 ['Which ten companies are selected for the global AI safety outlook?','The alphabetical selection is Alibaba Group / Alibaba Cloud, Amazon / AWS, Anthropic, Google DeepMind / Alphabet, Meta, Microsoft, NTT Group / NTT DATA, NVIDIA, OpenAI and Spherity. It is a purposive qualitative sample of documented activities, not a measured global ranking.'],
 ['What are the five AI safety disciplines?','The paper distinguishes model and system reliability improvement; validation and monitoring; air gapping and isolation; deterministic controllers; and trust chaining and assurance graphs. They span design and qualification, live behavior, bounded execution design and runtime enforcement.'],
 ['What does the AI Safety Atlas show?','The Atlas locates ten companies and ten research organizations across eight countries. Color and shape distinguish the groups; A–D badges show primary and supporting activity. Google DeepMind is placed in the UK, while its parent Alphabet is based in the US.'],
 ['What do Q, E and U assurance levels mean?','Q denotes qualified authority under an applicable legal scheme, E issuer-authenticated evidence, and U self-asserted information. These classify individual claims. A graph can mix them, and the relying party checks issuer role, scope, applicability, validity and status for each claim.'],
 ['How can evidence support a runtime decision without an agent authorizing itself?','An independent resource-owner controller evaluates the exact proposed action against current delegation, policy and the required evidence path. Cryptographic proofs preserve source and integrity; policy separately assesses authority, meaning and applicability. The agent proposes an action, while the protected controller admits or blocks its effect.'],
 ['What is Spherity’s contribution and what is its maturity?','Spherity combines register-backed organizational authority and semantically interoperable assurance graphs with research and integration designs for runtime verification and revocation. Operating credential infrastructure, company-reported wallet deployments, finite and synthetic research tests, and proposed runtime integration have distinct evidence status. The author is affiliated with Spherity.'],
 ['How do stopping and safe resumption work?','An independent local stop or validated fallback must remain available during model, graph, network and remote identity outages. Coordinated containment checks verifiable evidence, responder identity and scoped authority. The hold remains until recovery conditions are verified and resumption is separately authorized.'],
 ['What is The 2027 Proposition?','The paper expects safety to become a defining deployment condition as agents take consequential actions in 2027. Reliability, validation, monitoring, isolation and deterministic intervention must work together, supported by verifiable evidence and current delegated authority. This is an outlook, not an observed 2027 result.']
].map(([question,answer])=>({question,answer}));
const page={publication_template_version:2,layout:'research-respec',css:'/assets/spherity-research-respec.css',extra_css:['/assets/global-ai-safety/article.css'],title:'Top 10 Global AI Safety Companies',citation_title:'Top 10 Global AI Safety Companies: With 10 leading R&D institutes and foundations',seo_title:'Top 10 Global AI Safety Companies — 2026 Research & Atlas',og_title:'Top 10 Global AI Safety Companies',og_description:'Ten companies, ten research organizations and five safety disciplines: explore the AI Safety Atlas and evidence-led runtime assurance framework.',subtitle:'With 10 leading R&D institutes and foundations',description:'Compare ten global AI safety companies and ten research organizations through five disciplines, an AI Safety Atlas and evidence-led runtime assurance.',paper_status:'Spherity Research / Technology Outlook 2026 · Revised edition 2.6',authors:['Dr. Carsten Stöcker'],author_entities:[{name:'Dr. Carsten Stöcker',affiliation:'Spherity GmbH'}],author_affiliations:['Dr. Carsten Stöcker — Spherity GmbH'],affiliation:'Spherity GmbH',date:'2026-11-08',last_modified_at:'2026-11-08',research_cutoff:'2026-11-08',research_cutoff_label:'Evidence reviewed to this date · Revised edition 2.6',lang:'en',permalink:`/${slug}.html`,canonical_url:canonical,latest_version:canonical,pdf_url:`/${slug}.pdf`,associated_media:[{name:'Top 10 Global AI Safety Companies — edition 2.6, 24-page PDF',url:`/${slug}.pdf`,cover_image:'/assets/global-ai-safety/paper-cover.png',cover_image_alt:'First page of the verified edition 2.6, including The 2027 Proposition and abstract.',license:'https://creativecommons.org/licenses/by/4.0/'}],cover_image:'/assets/global-ai-safety/paper-cover.png',cover_image_alt:'Cover of Top 10 Global AI Safety Companies, edition 2.6.',figure_objects:figureObjects,robots:'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',license:'https://creativecommons.org/licenses/by/4.0/',license_scope:'This HTML edition, the publication PDF and the five figures',copyright_notice:'© 2026 Dr. Carsten Stöcker, Spherity GmbH',image:'/assets/preview-global-ai-safety-2026.webp',image_alt:'Global AI safety research with the edition 2.6 paper cover.',image_mime:'image/webp',image_width:1200,image_height:630,image_sitemap:true,sitemap_images:figureObjects.map(f=>({url:f.content_url.replace('.svg','.png'),caption:f.caption,title:f.name})),sitemap_downloads:figureObjects.map(f=>({url:f.content_url.replace('.svg','.pdf')})),keywords:['AI safety','runtime assurance','verifiable assurance graphs','AI agents','AI governance','AI Safety Atlas','agent authorization','business wallets','evidence graphs','revocation','IPCEI-AI','Q/E/U assurance'],answer_summary:'The paper maps ten companies and ten research organizations across complementary AI safety disciplines. It distinguishes improving behavior from controlling external effects, and examines how current identity, authority and evidence can inform an independent runtime decision. The selection is a dated, purposive qualitative study; Spherity’s graph-based runtime path is research and integration design.',key_takeaways:['Five disciplines connect behavior improvement, validation and monitoring, isolation, deterministic control, and trust chaining with assurance graphs.','A–D classify design and qualification, live monitoring, bounded execution design and runtime enforcement. Q/E/U classify individual claims, not entire organizations.','Cryptographic proofs authenticate scoped assertions. Authority, applicability, truth and completeness require separate evidence and policy checks.','Spherity’s register-backed authority and semantic evidence work is grounded in operating identity infrastructure; its graph-based runtime integration remains a research and integration design.','An independent local stop must remain available during outages. Coordinated containment verifies evidence, responder identity and authority; resumption requires recovery and separate authorization.'],about:['AI safety','runtime assurance','verifiable assurance graphs'],mentions:['W3C Verifiable Credentials','RDF','JSON-LD','IPCEI-AI','European Business Wallet','eIDAS','NVIDIA OpenShell'],citations:bib.flatMap(m=>[...m[2].matchAll(/\\url\{([^}]+)\}/g)].map(u=>u[1])),audiences:['AI safety researchers','Industry leaders','System architects','Policy makers'],spatial_coverage:['Worldwide','European Union'],search_research:{status:'pending',source:'Google Trends',source_url:'https://trends.google.com/trends/explore',authority_terms:['runtime assurance','verifiable assurance graphs']},questions_answered:qa,related_publications:[{title:'Top 10 German Technology Companies',url:'/top-german-technology-companies-industrial-ai-agentic-commerce-2026.html',context:'The preceding technology outlook develops the complementary industrial capabilities and cross-company trust context.'},{title:'Governing Safe AI That Acts Across Companies',url:'/governing-ai-that-acts-across-companies.html',context:'The three-paper research series specifies protected execution, continuing assurance and private action-eligibility verification.'},{title:'AI Agent Revocation and Containment',url:'/ai-agent-revocation-containment-multi-agent-systems.html',context:'Examines withdrawal races, status freshness and containment at the last preventable effect.'}],toc_items:toc,tags:['ai-safety','runtime-assurance','verifiable-credentials']};
const oldPath=`docs/${slug}.md`;
page.paper_version='2.6';
page.figure_objects.forEach(f=>{
 f.distributions=f.downloads;
 f.downloads=[{name:f.name+' — standalone PDF',url:f.content_url.replace('.svg','.pdf')}];
});
const manifestPath='docs/assets/global-ai-safety/figure-manifest.json';
if(fs.existsSync(manifestPath)){
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 page.figure_objects.forEach((f,i)=>{f.width=manifest[i].width;f.height=manifest[i].height;f.raster_url=f.content_url.replace('.svg','.png')});
}
page.sitemap_images=figureObjects.map(f=>f.content_url.replace('.svg','.png'));
page.sitemap_downloads=figureObjects.map(f=>f.content_url.replace('.svg','.pdf'));
if(fs.existsSync(oldPath)) {const old=parse(fs.readFileSync(oldPath,'utf8').split('---')[1]);if(old.search_research)page.search_research=old.search_research;}
const reviewPath='research-assets/global-ai-safety/search-review.json';
if(fs.existsSync(reviewPath)) page.search_research=JSON.parse(fs.readFileSync(reviewPath,'utf8'));
const intro=`<p class="safety-edition">A comparative framework for model reliability, bounded execution and verifiable assurance across organizations.</p>\n<div class="safety-actions"><a class="safety-download" href="{{ page.pdf_url | relative_url }}">Download the complete 24-page paper (PDF)</a><a href="#ai-safety-atlas">Explore the AI Safety Atlas ↓</a></div>\n<p>HTML edition of the verified revised edition 2.6. The publication PDF is the authoritative paginated source. All 98 references retain the published numbering.</p>\n<section class="safety-proposition" aria-labelledby="the-2027-proposition"><h2 id="the-2027-proposition">The 2027 Proposition</h2><p>${inline(proposition)}</p></section>\n<section class="abstract-box"><h2 id="abstract">Abstract</h2>${abstract}</section>`;
const copyright='<p class="safety-copyright">© 2026 Dr. Carsten Stöcker, Spherity GmbH. Except where otherwise noted, licensed under <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>. Natural Earth basemap data are public domain.</p>';
fs.writeFileSync(oldPath,'---\n'+stringify(page,{lineWidth:0,defaultStringType:'QUOTE_DOUBLE'})+'---\n\n'+intro+'\n\n'+converted+'\n\n'+refHTML+'\n\n'+copyright+'\n');
fs.mkdirSync('research-assets/global-ai-safety',{recursive:true});
fs.writeFileSync('research-assets/global-ai-safety/citation-map.json',JSON.stringify(numbers,null,2)+'\n');
console.log(`Imported ${bib.length} references, ${figureObjects.length} figures and ${tableNo} tables from edition 2.6.`);
