import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {glob} from 'glob';
import {parse} from 'yaml';
const imagePattern = /\.(?:svg|png|jpe?g|webp|avif)$/i;
const unescape = v => v.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&quot;', '"');
const publicUrl = (base, asset) => base + asset.split('/').map(encodeURIComponent).join('/');
async function pages(directory) {
  const result=[];
  for(const filename of await glob('**/*.{md,html}', {cwd:directory,ignore:['**/_*/**','downloads/**','dpp-explorer/**','assets/**']})) {
    const source=await readFile(path.join(directory,filename),'utf8');
    const fm=source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if(fm) result.push({filename:filename.replaceAll('\\','/'),...parse(fm[1])});
  }
  return result;
}
const indexable = p => p.publication_state!=='draft' && !/noindex/i.test(p.robots||'');
async function assertAsset(directory,asset) {
  if(!asset.startsWith('/')||asset.includes('..')||/[?#\\]/.test(asset)) throw Error(`Invalid sitemap asset: ${asset}`);
  const file=path.resolve(directory,'.'+asset);
  if(!file.startsWith(path.resolve(directory)+path.sep)||!(await stat(file)).isFile()) throw Error(`Missing sitemap asset: ${asset}`);
}

// Discover publication metadata plus actual inline images and linked formats.
// image_sitemap is legacy metadata, no longer an opt-in gate.
export async function loadSitemapImages(sourceDirectory,siteDirectory,siteUrl) {
  const images=new Map();
  const add=(owner,asset)=>{if(!imagePattern.test(asset))return;if(!images.has(owner))images.set(owner,new Set());images.get(owner).add(asset);};
  for(const page of await pages(sourceDirectory)) {
    if(!indexable(page))continue;
    const owner=page.canonical_url||siteUrl+(page.permalink||(page.filename==='index.md'?'/':'/'+page.filename.replace(/\.md$/,'.html')));
    for(const asset of [...(page.figure_objects||[]).flatMap(f=>[f.content_url,f.raster_url]),page.cover_image,page.image,...(page.associated_media||[]).map(m=>m.cover_image),...(page.sitemap_images||[])].filter(Boolean)) {
      if(asset.startsWith('/assets/'))add(owner,asset);
    }
  }
  const root=new URL(siteUrl+'/');
  for(const filename of await glob('**/*.html',{cwd:siteDirectory,ignore:['share/**','downloads/**','404.html','google*.html','dpp-explorer/{releases,candidates,data,vendor}/**','assets/**']})) {
    const html=await readFile(path.join(siteDirectory,filename),'utf8');
    if(/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))continue;
    const owner=unescape(html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1]||siteUrl+'/'+filename.replaceAll('\\','/').replace(/index\.html$/,''));
    const addReference=value=>{const url=new URL(unescape(value),owner);if(url.origin===root.origin&&url.pathname.startsWith(root.pathname+'assets/'))add(owner,decodeURIComponent(url.pathname.slice(root.pathname.length-1)));};
    for(const m of html.matchAll(/\b(?:src|href|content)=["']([^"']+\.(?:svg|png|jpe?g|webp|avif)(?:\?[^"']*)?)["']/gi)) addReference(m[1]);
    for(const m of html.matchAll(/\bsrcset=["']([^"']+)["']/gi))for(const candidate of m[1].split(','))addReference(candidate.trim().split(/\s+/)[0]);
  }
  // Include original research visuals used to render the page's social card.
  const manifest = await readFile(path.join(sourceDirectory,'_data/social_cards.yml'),'utf8').catch(error=>{if(error.code==='ENOENT')return '[]';throw error;});
  for(const card of parse(manifest)||[]) {
    const owner=siteUrl+card.publication_url;
    if(images.has(owner))for(const asset of [card.visual,card.map_visual].filter(Boolean))if(asset.startsWith('/assets/'))add(owner,asset);
  }
  // Include same-stem formats and explicitly named resolution alternatives.
  const stemOf = file => file.replace(/\.[^.]+$/,'').replace(/-(?:\d+dpi|\d+x\d+)$/i,'');
  const variants=new Map();
  for(const file of await glob('assets/**/*.{svg,png,jpg,jpeg,webp,avif}',{cwd:siteDirectory})) {
    const normalized=file.replaceAll('\\','/');
    const stem='/'+stemOf(normalized);if(!variants.has(stem))variants.set(stem,[]);variants.get(stem).push('/'+normalized);
  }
  const result=new Map();
  for(const [owner,assets] of images) {
    for(const asset of [...assets])for(const variant of variants.get(stemOf(asset))||[])assets.add(variant);
    for(const asset of assets)await assertAsset(siteDirectory,asset);
    result.set(owner,[...assets].sort().map(asset=>publicUrl(siteUrl,asset)));
  }
  return result;
}

export async function loadSitemapDownloads(sourceDirectory,siteDirectory) {
  const result=new Map();
  for(const page of await pages(sourceDirectory)) {
    if(!indexable(page))continue;
    const downloads=[...(page.sitemap_downloads||[]),...(page.figure_objects||[]).flatMap(f=>(f.downloads||[]).map(d=>d.url)),...(page.supplementary_media||[]).map(m=>m.url)];
    for(const asset of new Set(downloads)) {
      if(!/^\/(?:assets\/|downloads\/|[^/]+\.pdf$)/.test(asset)||/\.(?:html|css|js|mjs)$/i.test(asset))throw Error(`Unsupported sitemap download: ${asset}`);
      await assertAsset(siteDirectory,asset);
      const modified=String(page.last_modified_at||page.date).slice(0,10);
      if(!/^\d{4}-\d{2}-\d{2}$/.test(modified))throw Error(`Missing source date for sitemap download: ${asset}`);
      result.set(asset,modified);
    }
  }
  return result;
}
