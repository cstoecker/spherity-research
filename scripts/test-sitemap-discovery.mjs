import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import {parse} from 'yaml';
import {loadSitemapImages,loadSitemapDownloads} from './lib/sitemap-images.mjs';
const base='https://example.org/research';
async function fixture(t) {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'spherity-sitemap-'));
  t.after(async()=>{assert.ok(path.basename(dir).startsWith('spherity-sitemap-'));assert.equal(path.dirname(dir),os.tmpdir());await fs.rm(dir,{recursive:true,force:true});});
  const write=async(name,text='asset')=>{const target=path.join(dir,name);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,text);};
  return {dir,write};
}
test('new publications include figure formats and supplementary files without opt-in flags',async t=>{
  const {dir,write}=await fixture(t);
  await write('source/paper.md','---\npermalink: /paper.html\nlast_modified_at: 2026-11-09\nfigure_objects:\n  - content_url: /assets/diagram.svg\n    downloads:\n      - url: /assets/diagram.pdf\nsupplementary_media:\n  - url: /downloads/examples.zip\n---\n');
  for(const file of ['diagram.svg','diagram.png','diagram-300dpi.png','diagram.pdf'])await write('site/assets/'+file);
  await write('site/downloads/examples.zip');
  const images=await loadSitemapImages(path.join(dir,'source'),path.join(dir,'site'),base);
  assert.deepEqual(images.get(base+'/paper.html'),[base+'/assets/diagram-300dpi.png',base+'/assets/diagram.png',base+'/assets/diagram.svg']);
  const downloads=await loadSitemapDownloads(path.join(dir,'source'),path.join(dir,'site'));
  assert.deepEqual([...downloads.keys()].sort(),['/assets/diagram.pdf','/downloads/examples.zip']);
});
test('nested inline images, encoded paths and srcset are found; noindex share aliases are excluded',async t=>{
  const {dir,write}=await fixture(t);await fs.mkdir(path.join(dir,'source'));
  for(const file of ['map.svg','map.png','large map.png'])await write('site/assets/'+file);
  await write('site/nested/index.html',`<link rel="canonical" href="${base}/nested/"><img src="../assets/map.svg" srcset="../assets/map.png 1x, ../assets/large%20map.png 2x">`);
  await write('site/share/private.html',`<meta name="robots" content="noindex, follow"><img src="../assets/missing.png">`);
  const images=await loadSitemapImages(path.join(dir,'source'),path.join(dir,'site'),base);
  assert.equal(images.size,1);assert.equal(images.get(base+'/nested/').length,3);
  assert.ok(images.get(base+'/nested/').includes(base+'/assets/large%20map.png'));
});
test('draft figures stay excluded and a missing published figure fails generation',async t=>{
  const {dir,write}=await fixture(t);await fs.mkdir(path.join(dir,'site'));
  await write('source/draft.md','---\npublication_state: draft\nimage: /assets/not-built.png\n---\n');
  assert.equal((await loadSitemapImages(path.join(dir,'source'),path.join(dir,'site'),base)).size,0);
  await write('source/released.md','---\npermalink: /released.html\nimage: /assets/not-built.png\n---\n');
  await assert.rejects(()=>loadSitemapImages(path.join(dir,'source'),path.join(dir,'site'),base));
});
test('homepage card is dedicated to the collection, with matching generated metadata',async()=>{
  const front=await fs.readFile('docs/index.md','utf8');const page=parse(front.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
  const catalog=parse(await fs.readFile('docs/_data/publications.yml','utf8'));
  assert.equal(page.image,'/assets/spherity-research-home.webp');
  assert.ok(!catalog.some(p=>p.image===page.image),'Homepage must not reuse a paper card');
  const image=await sharp('docs'+page.image).metadata();assert.equal(image.width,1200);assert.equal(image.height,630);
  assert.ok(image.xmp.toString().includes('Spherity Research — open research collection'));
  assert.ok((await fs.stat('docs'+page.image)).size<=250*1024);
  const html=await fs.readFile('_site/index.html','utf8');
  for(const field of ['og:image','twitter:image'])assert.match(html,new RegExp('(?:property|name)="'+field+'" content="https://spherity.github.io/spherity-research'+page.image+'"'));
});
