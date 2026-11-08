import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {parse} from 'yaml';
import sharp from 'sharp';

const slug='top-10-global-ai-safety-companies-2026';
const source=fs.readFileSync(`docs/${slug}.md`,'utf8');
const page=parse(source.match(/^---\n([\s\S]*?)\n---/)[1]);
const html=fs.readFileSync(`_site/${slug}.html`,'utf8');
const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const reference='research-assets/global-ai-safety/reference/';
const bibliography=fs.readFileSync(reference+'references.tex','utf8');
const keys=[...bibliography.matchAll(/\\bibitem\{([^}]+)\}/g)].map(m=>m[1]);
const entityChars={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”',hellip:'…',bull:'•',copy:'©'};
const decodeHTML=s=>s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,(m,key)=>key[0]==='#'?String.fromCodePoint(key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1))):entityChars[key]??m);
const plain=s=>decodeHTML(s.replace(/<[^>]*>/g,' ')).replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/\s+/g,' ').trim();

test('the unchanged 24-page edition, 98 reference identities and published citation order are preserved',()=>{
 const provenance=JSON.parse(fs.readFileSync('research-assets/global-ai-safety/provenance.json','utf8'));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(`docs/${slug}.pdf`)).digest('hex'),provenance.source_pdf_sha256);
 assert.equal(provenance.source_pdf_pages,24);
 assert.equal(keys.length,98);
 keys.forEach((key,i)=>assert.match(html,new RegExp(`id=["']?ref-${i+1}["']? data-source-key=["']?${key}["']?[ >]`)));
 const numberedRefs=[...html.matchAll(/id=["']?ref-(\d+)["']?[ >]/g)].map(m=>Number(m[1]));
 assert.deepEqual(numberedRefs,Array.from({length:98},(_,i)=>i+1));
 const map=JSON.parse(fs.readFileSync('research-assets/global-ai-safety/citation-map.json','utf8'));
 assert.deepEqual(keys.map(k=>map[k]),Array.from({length:98},(_,i)=>i+1));
 assert.equal(map.src29,26);assert.equal(map.src98,24);assert.equal(map.src96,60);assert.equal(map.src95,98);
});

test('substantive source prose survives HTML conversion, including evidence qualifications',()=>{
 const manuscript=fs.readFileSync(reference+'body.tex','utf8').replaceAll('\r','');
 const rendered=plain(html);
 let checked=0;
 for(const p of manuscript.split(/\n\s*\n/)){
  if(!/^[A-Z]/.test(p.trim())||p.includes(' & ')||p.includes('\\begin'))continue;
  for(const fragment of p.split(/\\(?:cite|ref)\{[^}]*\}/)){
   const expected=plain(fragment.replace(/\\(?:textbf|textit|mbox)\{([^{}]*)\}/g,'$1').replaceAll('\\&','&').replaceAll('~',' ').replaceAll('--','–').replaceAll('``','“').replaceAll("''",'”'));
   if(expected.length<65||expected.includes('\\'))continue;
   assert.ok(rendered.includes(expected),expected.slice(0,140));checked++;
  }
 }
 assert.ok(checked>70,`Only ${checked} manuscript fragments checked`);
 for(const term of ['The 2027 Proposition','IPCEI-AI','company-reported','Research and integration design','independent local stop','semantically interoperable assurance graphs'])assert.ok(rendered.toLowerCase().includes(term.toLowerCase()),term);
});

test('five figure triplets are genuine, dimensioned and linked in scholarly structured data',async()=>{
 assert.equal(page.figure_objects.length,5);
 for(const f of page.figure_objects){
  const svg=fs.readFileSync('docs'+f.content_url,'utf8');
  assert.ok(!/<image[\s>]/.test(svg));assert.match(svg,/<title>/);assert.match(svg,/<desc>/);
  assert.match(svg,new RegExp(`viewBox="0 0 ${f.width} ${f.height}"`));
  const png=await sharp('docs'+f.raster_url).metadata();assert.ok(png.width>=f.width);
  assert.equal(f.distributions.length,3);
  const schema=schemas.find(s=>s['@id']?.endsWith(f.content_url+'#image-object'));
  assert.ok(schema);assert.equal(schema.encoding.length,3);
  assert.equal(schema.copyrightNotice,'© 2026 Dr. Carsten Stöcker, Spherity GmbH');
  assert.equal(schema.creator.name,'Dr. Carsten Stöcker');
  for(const d of f.distributions){
   assert.ok(fs.existsSync('docs'+d.url));
   assert.ok(schema.encoding.some(e=>e.contentUrl.endsWith(d.url)&&e.encodingFormat===d.encoding_format));
   assert.ok(html.includes('/spherity-research'+d.url));
  }
 }
 const article=schemas.find(s=>s['@type']==='ScholarlyArticle');
 assert.equal(article.version,'2.6');assert.equal(article.copyrightNotice,page.copyright_notice);
 assert.equal(article.hasPart.length,5);
 assert.ok(!html.includes('&lt;a href='),'Figure downloads must be links, not escaped code');
});

test('homepage discovery, native tables, source bibliography and all figure formats are indexed',()=>{
 const catalog=parse(fs.readFileSync('docs/_data/publications.yml','utf8'));
 assert.equal(catalog.filter(p=>p.links.some(l=>l.url===page.permalink)).length,1);
 assert.ok(fs.readFileSync('_site/index.html','utf8').includes(page.permalink));
 assert.equal((html.match(/<table\b/g)||[]).length,5);
 assert.equal((html.match(/<caption\b/g)||[]).length,5);
 assert.ok(html.includes('scope=col')||html.includes('scope="col"'));
 const sitemap=fs.readFileSync('_site/sitemap.xml','utf8');
 for(const url of [page.canonical_url,page.pdf_url,...page.figure_objects.flatMap(f=>f.distributions.map(d=>d.url))]) assert.ok(sitemap.includes(url),url);
 assert.ok(!sitemap.includes('/share/'+slug+'.html'));
});
