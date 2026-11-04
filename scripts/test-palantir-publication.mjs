import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import test from 'node:test';
import { parse } from 'yaml';
import sharp from 'sharp';
import {loadPalantirImageMetadata} from './lib/palantir-image-metadata.mjs';
import {createImageXmp} from './lib/image-metadata.mjs';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const base='docs/assets/europes-answer-to-palantir/graph-v0.1';
const model=JSON.parse(fs.readFileSync(base+'/graph-model.json','utf8'));
const page=slug=>{const s=fs.readFileSync('docs/'+slug+'.md','utf8');return parse(s.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);};
test('all 39 approved release originals remain archived byte-for-byte',()=>{
 const manifest=JSON.parse(fs.readFileSync('scripts/data/palantir-release-integrity.json','utf8'));
 assert.equal(manifest.length,39);
 for(const f of manifest){const b=fs.readFileSync('research-assets/palantir/v1.0'+f.path);assert.equal(b.length,f.bytes,f.path);assert.equal(digest(b),f.sha256,f.path);}
 const json=manifest.find(f=>f.path.endsWith('/graph-model.json'));assert.equal(digest(fs.readFileSync('docs'+json.path)),json.sha256);
});

test('both papers and all 12 figure PDFs have audited Info/XMP and retain original prefixes',()=>{
 const proof=JSON.parse(fs.readFileSync('scripts/data/palantir-pdf-metadata-provenance.json','utf8'));
 assert.equal(proof.length,14);assert.equal(proof.reduce((n,f)=>n+f.page_count,0),76);
 for(const f of proof){
  const b=fs.readFileSync(f.file),archive=fs.readFileSync('research-assets/palantir/v1.0'+f.file.slice(4));
  assert.equal(digest(b),f.published_sha256,f.file);assert.equal(digest(b.subarray(0,f.source_bytes)),f.source_sha256,f.file);
  assert.ok(b.subarray(0,archive.length).equals(archive));
  assert.ok(f.all_page_pixels_identical&&f.content_streams_identical&&f.geometry_links_bookmarks_identical);
  for(const key of ['title','author','subject','keywords'])assert.ok(f.after_info[key],f.file+': '+key);
  for(const field of ['dc:title','dc:description','dc:creator','dc:subject','dc:rights','dc:publisher','dc:language','dc:identifier','cc:license','xmpRights:UsageTerms']) assert.ok(b.includes(Buffer.from('<'+field)),f.file+': '+field);
 }
});

test('all 30 source/generated images have complete XMP and figure artwork is unchanged',async()=>{
 const metadata=await loadPalantirImageMetadata();assert.equal(Object.keys(metadata).length,30);
 const proof=JSON.parse(fs.readFileSync('scripts/data/palantir-image-metadata-provenance.json','utf8'));
 const strip=svg=>svg.replace(/<title\b[^>]*>[\s\S]*?<\/title>/g,'').replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/g,'').replace(/<metadata\b[^>]*>[\s\S]*?<\/metadata>/g,'');
 for(const [asset,info]of Object.entries(metadata)){
  const generated=asset.startsWith('/assets/pdf-share/');
  const b=fs.readFileSync((generated?'_site':'docs')+asset);
  if(info.format==='image/svg+xml'){
   assert.ok(b.toString().includes(createImageXmp(info)),asset);
   assert.doesNotMatch(b.toString(),/<(?:title|desc)>\.\.\.<\//);
   assert.equal(strip(b.toString()),strip(fs.readFileSync('research-assets/palantir/v1.0'+asset,'utf8')),asset);
  }else assert.equal((await sharp(b).metadata()).xmp?.toString(),createImageXmp(info),asset);
  if(asset.includes('/figures/')){
   const original=fs.readFileSync('research-assets/palantir/v1.0'+asset);
   assert.deepEqual(await sharp(b).raw().toBuffer(),await sharp(original).raw().toBuffer(),asset);
   assert.equal(digest(b),proof.find(p=>p.path===asset).sha256,asset);
  }
 }
});

test('sitemap includes both pages, all 14 PDFs, all 30 images and the unchanged graph model',async()=>{
 const xml=fs.readFileSync('_site/sitemap.xml','utf8');
 const urls=new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]));
 const images=new Set([...xml.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map(m=>m[1]));
 const p=page('europes-answer-to-palantir'),a=page('global-cooperation-sovereign-industrial-ai');
 const origin='https://spherity.github.io/spherity-research';
 for(const url of [p.canonical_url,a.canonical_url,...p.associated_media.map(m=>origin+m.url),...p.sitemap_downloads.map(v=>origin+v)])assert.ok(urls.has(url),url);
 for(const asset of Object.keys(await loadPalantirImageMetadata()))assert.ok(images.has(origin+asset),asset);
 assert.ok(![...urls].some(url=>url.includes('/share/')||url.endsWith('.css')||url.endsWith('.js')||url.includes('/research-assets/')));
});
test('static fallback and embedded model derive exactly from the authoritative model',()=>{
 const html=fs.readFileSync('docs/_includes/robot-evidence-static.html','utf8');
 assert.deepEqual(JSON.parse(html.match(/id="reg-data">([\s\S]*?)<\/script>/)[1]),model);
 assert.equal(model.nodes.length,22);assert.equal(new Set(model.nodes.map(n=>n.id)).size,22);assert.equal(model.edges.length,20);assert.equal(model.groups.length,4);assert.equal(model.domains.length,8);
 for(const n of model.nodes)assert.ok(html.includes('id="record-'+n.id+'"'));
 for(let i=1;i<=20;i++)assert.ok(html.includes('id="relationship-'+i+'"'));
});
test('the topic represents two distinct works and the academic record cites only its paper',()=>{
 const p=page('europes-answer-to-palantir'),a=page('global-cooperation-sovereign-industrial-ai');
 assert.equal(p.schema_type,'WebPage');assert.equal(p.citation_metadata,false);assert.equal(p.research_works.length,2);
 assert.equal(new Set(p.research_works.map(w=>w.pdf_url)).size,2);
 const w=p.research_works.find(w=>w.schema_type==='ScholarlyArticle');assert.equal(w.pdf_url,a.pdf_url);assert.equal(w.id,a.canonical_url+'#article');assert.equal(a.author_entities[0].citation_name,'Carsten Stöcker');
 assert.equal(p.figure_objects.length,12);assert.equal(p.figure_objects.reduce((n,f)=>n+f.placements.length,0),14);
 assert.equal(p.faq_schema,false);assert.equal(a.faq_schema,false);
});
test('rendered topic has crawlable fallbacks, separate work encodings and no mixed Scholar tags',()=>{
 const html=fs.readFileSync('_site/europes-answer-to-palantir.html','utf8');
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 const topic=schemas.find(s=>s['@type']==='WebPage');assert.equal(topic.mainEntity.length,2);assert.equal(topic.encoding.length,0);
 assert.doesNotMatch(html,/name="citation_/);assert.equal(schemas.filter(s=>s['@type']==='MediaObject').length,2);
 assert.equal(schemas.filter(s=>s['@type']==='ScholarlyArticle').length,1);assert.equal(schemas.filter(s=>s['@type']==='Article').length,1);
 assert.doesNotMatch(html,/Do not add a live|Preserve that method limit|C:\\Users|openai:set_globals/);
 for(const n of model.nodes)assert.ok(html.includes('id="record-'+n.id+'"'));
 const academic=fs.readFileSync('_site/global-cooperation-sovereign-industrial-ai.html','utf8');assert.equal([...academic.matchAll(/name="citation_title"/g)].length,1);assert.match(academic,/name="citation_author" content="Carsten Stöcker"/);
 const academicData=page('global-cooperation-sovereign-industrial-ai');
 const academicSchemas=[...academic.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 assert.equal(academicSchemas.find(s=>s['@type']==='ScholarlyArticle').abstract,academicData.abstract);
 assert.ok(academicData.abstract.length>academicData.answer_summary.length*3);
 assert.match(academic,/Accelerated investment should fund redesign and testing/);
});
