import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {parse} from 'yaml';
import {loadDpp5ImageMetadata} from './lib/dpp5-image-metadata.mjs';
import {createImageXmp} from './lib/image-metadata.mjs';

const slug = 'eu-dpp-registry-w3c-dpp5';
const pagePath = `docs/${slug}.md`;
const page = parse(fs.readFileSync(pagePath, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
const origin = 'https://spherity.github.io/spherity-research';
const variants = ['DPP4.0', 'DPP 4.0', 'DPP5.0', 'DPP 5.0'];
const file = pathname => `docs${pathname}`;
const exists = pathname => fs.existsSync(file(pathname));

test('approved paper and all 15 figure variants remain byte-identical; original cover is archived', () => {
  const assets = JSON.parse(fs.readFileSync('scripts/data/dpp5-source-integrity.json', 'utf8'));
  assert.equal(assets.length, 17);
  for (const asset of assets) assert.equal(
    crypto.createHash('sha256').update(fs.readFileSync(asset.path === file(page.cover_image)
      ? 'research-assets/dpp5/approved/eu-dpp-registry-dpp5-cover.jpg' : asset.path)).digest('hex'), asset.sha256, asset.path);
});

test('generated sharing images retain complete metadata after regeneration', async () => {
  for (const [asset, metadata] of Object.entries(await loadDpp5ImageMetadata())) {
    const bytes = fs.readFileSync((asset.includes('/pdf-share/') ? '_site' : 'docs') + asset);
    const image = await sharp(bytes).metadata();
    assert.equal(image.xmp?.toString(), createImageXmp(metadata), asset);
    if (asset !== page.cover_image) {
      assert.equal(image.width, 1200);
      assert.equal(image.height, 630);
      assert.ok(bytes.length <= 250 * 1024, asset);
    }
  }
  const cover = await sharp(fs.readFileSync(file(page.cover_image))).metadata();
  for (const term of [...variants, 'creativecommons.org/licenses/by/4.0/']) assert.ok(cover.xmp?.toString().includes(term), term);
  assert.deepEqual(await sharp(file(page.cover_image)).raw().toBuffer(),
    await sharp('research-assets/dpp5/approved/eu-dpp-registry-dpp5-cover.jpg').raw().toBuffer(), 'cover pixels changed');
});

test('abstract precedes mobile navigation and comparison tables are keyboard accessible', () => {
  const html = fs.readFileSync(`_site/${slug}.html`, 'utf8');
  assert.equal([...html.matchAll(/id="abstract"/g)].length, 1);
  assert.ok(html.indexOf('<h1') < html.indexOf('id="abstract"'));
  assert.ok(html.indexOf('id="main-content"') < html.indexOf('id="abstract"'));
  assert.ok(html.indexOf('id="abstract"') < html.indexOf('class="mobile-article-nav"'));
  assert.equal([...html.matchAll(/class="academic-table"/g)].length, 8);
  assert.equal([...html.matchAll(/class="table-scroll"[^>]*tabindex="0"/g)].length, 8);
  assert.match(html, /<th scope="col">/);
  const palantir = fs.readFileSync('_site/europes-answer-to-palantir.html', 'utf8');
  assert.doesNotMatch(palantir, /id="abstract"/);
  assert.ok(palantir.indexOf('class="mobile-article-nav"') < palantir.indexOf('id="download-both-papers"'));
});

test('search review records observed comparisons and preserves evidence boundaries', () => {
  const review = JSON.parse(fs.readFileSync('scripts/data/dpp5-search-review.json', 'utf8'));
  assert.equal(review.evidence.length, 9);
  assert.deepEqual(page.search_research.evidence, review.evidence);
  assert.match(review.method, /not absolute search volume/);
  const html = fs.readFileSync(`_site/${slug}.html`, 'utf8');
  assert.match(html, /Spherity research framing/);
  assert.match(html, /not EU regulatory or W3C maturity classifications/);
  assert.match(html, /still a legislative proposal/);
});

// Test the publication-specific requirements alongside the existing Palantir tests.
test('DPP5.0 is one canonical scholarly paper using the shared Jekyll layout', () => {
  assert.equal(page.publication_template_version, 2);
  assert.equal(page.layout, 'research-respec');
  assert.equal(page.css, '/assets/spherity-research-respec.css');
  assert.equal(page.schema_type, 'ScholarlyArticle');
  assert.equal(page.citation_metadata, true);
  assert.equal(page.publication_type, 'paper');
  assert.equal(page.canonical_url, `${origin}/${slug}.html`);
  assert.equal(page.associated_media.length, 1);
  assert.equal(page.associated_media[0].url, page.pdf_url);
  assert.notEqual(page.cover_image, page.image);
  assert.ok(exists(page.cover_image));
  assert.ok(exists(page.image));
  assert.ok(exists(page.pdf_url));
  for (const term of variants) assert.ok(page.keywords.includes(term), term);
});

test('five independent triplets have rights, keywords and actual renderable SVGs', async () => {
  assert.equal(page.figure_objects.length, 5);
  const ids = new Set();
  for (const figure of page.figure_objects) {
    assert.ok(!ids.has(figure.id), `duplicate ID ${figure.id}`);
    ids.add(figure.id);
    assert.ok(figure.alt && figure.caption && figure.description);
    assert.equal(figure.creator_type, 'Person');
    assert.ok(figure.creator_name.includes('Stöcker'));
    assert.equal(figure.license, 'https://creativecommons.org/licenses/by/4.0/');
    for (const kw of variants) assert.ok(figure.keywords.includes(kw), `${figure.id}: ${kw}`);
    const files = [figure.content_url, figure.raster_url, figure.downloads[0].url];
    for (const url of files) assert.ok(exists(url), `${figure.id} missing ${url}`);
    assert.match(figure.content_url, /\.svg$/);
    assert.match(figure.raster_url, /\.png$/);
    assert.match(figure.downloads[0].url, /\.pdf$/);
    const svg = fs.readFileSync(file(figure.content_url), 'utf8');
    const svgMeta = await sharp(Buffer.from(svg)).metadata();
    assert.ok(svgMeta.width > 0 && svgMeta.height > 0, `${figure.id} malformed SVG`);
    assert.match(svg, /<title\b/);
    assert.match(svg, /<desc\b/);
    assert.match(svg, /<metadata\b/);
    assert.doesNotMatch(svg, /<(?:image|use|link)\b[^>]*(?:href|src)=["']https?:\/\//i,
      `${figure.id} has remote rendering dependencies`);
    for (const kw of variants) assert.ok(svg.includes(kw), `${figure.id} SVG missing ${kw}`);
    const pngMeta = await sharp(fs.readFileSync(file(figure.raster_url))).metadata();
    assert.ok(pngMeta.width >= 1400 && pngMeta.height >= 1200, `${figure.id} PNG too small`);
    for (const kw of variants) assert.ok(pngMeta.xmp?.toString().includes(kw), `${figure.id} PNG missing ${kw}`);
    const pdf = fs.readFileSync(file(figure.downloads[0].url));
    assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
    for (const kw of variants) assert.ok(pdf.includes(Buffer.from(kw)), `${figure.id} PDF missing ${kw}`);
    assert.ok(pdf.includes(Buffer.from('creativecommons.org/licenses/by/4.0/')));
  }
});

test('homepage and social-card manifests contain exactly one matching publication', () => {
  const catalog = parse(fs.readFileSync('docs/_data/publications.yml', 'utf8'));
  const entry = catalog.filter(p => (p.links || []).some(l => l.url === `/${slug}.html`));
  assert.equal(entry.length, 1, 'expected one matching homepage catalogue entry');
  assert.equal(entry[0].image, page.image);
  const cards = parse(fs.readFileSync('docs/_data/social_cards.yml', 'utf8'));
  const matching = cards.filter(c => c.publication_url === `/${slug}.html`);
  assert.equal(matching.length, 1);
  assert.equal(matching[0].output, page.image);
  assert.equal(matching[0].style, 'research-grid-v1');
});

test('built Jekyll HTML has canonical scholarly metadata, shared components and 15 figure downloads', () => {
  const html = fs.readFileSync(`_site/${slug}.html`, 'utf8');
  assert.match(html, /class="srespec-page/);
  assert.match(html, /class="answer-summary"/);
  assert.match(html, /class="research-license"/);
  assert.match(html, /class="mobile-article-nav"/);
  assert.match(html, /<link[^>]+rel=["']canonical["']/);
  assert.equal([...html.matchAll(/name="citation_title"/g)].length, 1);
  const imageObjects = [...html.matchAll(/"@type"\s*:\s*"ImageObject"/g)];
  assert.ok(imageObjects.length >= 5);
  for (const figure of page.figure_objects) {
    assert.ok(html.includes(`${figure.id}-figure`));
    for (const url of [figure.content_url, figure.raster_url, figure.downloads[0].url]) {
      assert.ok(html.includes(url), `missing visible asset link ${url}`);
    }
  }
  assert.doesNotMatch(html, /\{%\s*(?:assign|include)/);
});

test('image sitemap and PDF sitemap contain figures while excluding share aliases', () => {
  const sitemap = fs.readFileSync('_site/sitemap.xml', 'utf8');
  assert.equal(page.image_sitemap, true);
  assert.equal(page.sitemap_downloads.length, 5);
  for (const figure of page.figure_objects) {
    for (const url of [figure.content_url, figure.raster_url]) {
      assert.ok(sitemap.includes(origin + url), `missing image sitemap ${url}`);
    }
    assert.ok(sitemap.includes(origin + figure.downloads[0].url), `missing figure PDF sitemap ${figure.id}`);
  }
  assert.ok(sitemap.includes(page.canonical_url));
  assert.doesNotMatch(sitemap, /<loc>[^<]*\/share\//);
});
