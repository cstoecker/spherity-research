import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, existsSync} from 'node:fs';
import {parse} from 'yaml';

const read = file => readFileSync(file, 'utf8');
const frontMatter = file => parse(read(file).match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
const catalog = parse(read('docs/_data/case_studies.yml'));
const page = frontMatter('docs/verifiable-ai-lab-results-evidence-graph.md');
const hub = read('_site/case-studies/index.html');
const article = read('_site/case-studies/verifiable-ai-lab-results.html');
const sitemap = read('_site/sitemap.xml');
const jsonLd = html => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .flatMap(match => {const node = JSON.parse(match[1]); return node['@graph'] || [node];});

test('case catalog routes resolve and are discoverable from homepage and hub', () => {
  assert.ok(catalog.length);
  assert.equal(new Set(catalog.map(item => item.url)).size, catalog.length);
  for (const item of catalog) {
    assert.ok(item.url.startsWith('/case-studies/'));
    assert.ok(existsSync('_site' + item.url));
    assert.ok(hub.includes('/spherity-research' + item.url));
    assert.ok(sitemap.includes('https://spherity.github.io/spherity-research' + item.url));
    assert.ok(item.status && item.summary && item.learning);
  }
  assert.ok(read('_site/index.html').includes('href="/spherity-research/case-studies/"'));
  assert.ok(sitemap.includes('https://spherity.github.io/spherity-research/case-studies/'));
});

test('case collection exposes its own items, not the paper catalog', () => {
  const nodes = jsonLd(hub);
  assert.equal(nodes.filter(n => n['@type'] === 'CollectionPage').length, 1);
  const list = nodes.find(n => n['@type'] === 'ItemList');
  assert.equal(list.numberOfItems, catalog.length);
  assert.deepEqual(list.itemListElement.map(n => n.item.url), catalog.map(n => 'https://spherity.github.io/spherity-research' + n.url));
  assert.ok(!nodes.some(n => n['@type'] === 'ScholarlyArticle'));
});

test('case article has technical article schema, parent breadcrumb and explicit evidence level', () => {
  const nodes = jsonLd(article);
  assert.ok(nodes.some(n => n['@type'] === 'TechArticle'));
  const breadcrumbs = nodes.find(n => n['@type'] === 'BreadcrumbList').itemListElement;
  assert.deepEqual(breadcrumbs.map(n => n.position), [1, 2, 3]);
  assert.equal(breadcrumbs[1].name, 'Case studies');
  assert.equal(breadcrumbs[2].item, page.canonical_url);
  assert.equal(page.case_study_status, 'prototype-and-initial-field-testing');
  assert.match(article, /Proof of concept, working prototype and initial field testing/);
  assert.doesNotMatch(article, /no deployment or measured outcomes/i);
  for (const activity of ['BMW Dangerous Driving', 'AI Lab', 'Semantic vocabulary', 'QI-Digital', 'Sphin-X', 'Catena-X Trusted AI', 'Dairy use case with Siemens']) assert.ok(article.includes(activity), activity);
  assert.match(article, /calculated illustrations, not measured project results/);
  assert.match(article, /expected decisions, not observed results/i);
  assert.match(article, /scientific correctness/i);
  assert.equal(page.pdf_url, '/Spherity-Verifiable-AI-Lab-Analysis-Carousel-v12.pdf');
});

test('companion carousel has its own cover, download metadata and sitemap entry', () => {
  assert.equal(page.associated_media[0].url, page.pdf_url);
  assert.notEqual(page.cover_image, page.image);
  assert.ok(existsSync('_site' + page.pdf_url));
  assert.ok(existsSync('_site' + page.cover_image));
  assert.ok(article.includes('Download the 19-slide carousel PDF (version 12)'));
  assert.ok(article.indexOf('id="carousel-pdf"') < article.indexOf('id="case-at-a-glance"'));
  assert.ok(page.toc_items.some(item => item.href === '#carousel-pdf'));
  assert.ok(sitemap.includes(page.pdf_url));
  assert.ok(existsSync('_site/share/Spherity-Verifiable-AI-Lab-Analysis-Carousel-v12.html'));
  const audit = JSON.parse(read('scripts/data/case-study-pdf-metadata-provenance.json'));
  assert.equal(audit.page_count, 19);
  assert.equal(audit.all_page_pixels_identical, true);
  assert.equal(audit.source_prefix_preserved, true);
  const pdf = readFileSync('docs' + page.pdf_url);
  assert.equal(createHash('sha256').update(pdf).digest('hex'), audit.published_sha256);
  assert.ok(pdf.includes(Buffer.from('x:xmpmeta')));
});

test('all sixteen case figures and their actual download formats are embedded and in the full sitemap', () => {
  assert.equal(page.figure_objects.length, 16);
  for (const figure of page.figure_objects) {
    assert.ok(article.includes(figure.id + '-figure'));
    assert.ok(article.includes(figure.content_url));
    for (const download of figure.distributions) {
      assert.ok(existsSync('_site' + download.url));
      assert.ok(article.includes(download.url));
      assert.ok(sitemap.includes('https://spherity.github.io/spherity-research' + download.url));
    }
    const svg = read('docs' + figure.content_url);
    assert.match(svg, /@font-face/);
    assert.match(svg, /data:font/);
    assert.ok(svg.includes(page.canonical_url));
    assert.match(svg, /creativecommons.org\/licenses\/by\/4.0/);
  }
});

test('educational case separates evidence roles and ends applications with automotive before outlook', () => {
  const source = read('docs/verifiable-ai-lab-results-evidence-graph.md').split(/\r?\n---\r?\n/).slice(1).join('\n');
  const headings = [...source.matchAll(/<h2 id="([^"]+)"/g)].map(m => m[1]);
  assert.equal(headings[headings.indexOf('vehicle-data') + 1], 'outlook');
  for (const term of ['Digital Calibration Request', 'Digital Calibration Certificate', 'verifiable AI Service Passport', 'Verifiable Agent Card', 'conformity assessment', 'consumable', '93.0–99.4%', '96.9–98.7%', '95.45%', 'not fit for production deployment']) assert.ok(source.includes(term), term);
  assert.ok(headings.indexOf('material-assurance') < headings.indexOf('service-passport'));
  assert.ok(headings.indexOf('wallet-recognition') < headings.indexOf('design'));
  assert.equal(new Set(page.figure_objects.map(f => f.id)).size, 16);
  assert.ok(headings.indexOf('spherity-products') < headings.indexOf('vehicle-data'));
  assert.match(source, /All Spherity products are based on open standards/);
  for (const term of ['DPP / VERA', 'EBW / EIDA', 'AI Service Passport (AISP)', 'Agent Identity', 'Trusted AI']) assert.ok(source.includes(term));
});

test('revised first-edition figures remove unqualified scores and conflated assurance', () => {
  for (const f of page.figure_objects.slice(0, 5)) {
    const svg = read('docs' + f.content_url);
    assert.ok(!/confidence 0\.97|conf 0\.91|share 98\.6|type conformity \+ calibration|today: unknown|any VC verifier|TÜV SÜD AI Certificate/.test(svg));
    assert.match(svg, /scope|Scope|profile|Profile/);
  }
});

test('concrete use-case appendix preserves proposed scope and the unchanged companion PDF', () => {
  assert.ok(article.indexOf('id="use-case-appendix"') > article.indexOf('id="outlook"'));
  assert.ok(article.indexOf('id="use-case-appendix"') < article.indexOf('id="references"'));
  for (const id of ['appendix-product-authenticity','appendix-evidence-records','appendix-forensic-workflow','appendix-automotive-workflow']) assert.ok(article.includes(`id="${id}"`));
  assert.match(article, /companion 19-slide PDF is unchanged/);
  assert.match(article, /not a reconstruction of the exact field-test implementation/);
  const appendixFigures=page.figure_objects.slice(12);
  assert.equal(appendixFigures.length,4);
  for (const f of appendixFigures) {
    assert.equal(f.width,1600);
    assert.match(f.caption, /proposed|concrete/i);
    assert.doesNotMatch(read('docs'+f.content_url), /share 98\.6|confidence 0\.97|conf 0\.91|library match 0\.96|TÜV SÜD AI Certificate/);
  }
});

test('homepage, case collection and individual case retain separate social cards with metadata', () => {
  const pages = ['docs/index.md', 'docs/case-studies.md', 'docs/verifiable-ai-lab-results-evidence-graph.md'].map(frontMatter);
  assert.equal(new Set(pages.map(n => n.image)).size, 3);
  for (const item of pages.slice(1)) {
    assert.ok(readFileSync('docs' + item.image).includes(Buffer.from('XMP ')));
    assert.ok(sitemap.includes('https://spherity.github.io/spherity-research' + item.image));
  }
});
