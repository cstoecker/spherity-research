import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { loadPdfShares } from './lib/pdf-sharing.mjs';
import { PUBLICATION_STATE, PUBLICATION_VERSION, verifyAtlasPublication } from '../dpp-explorer/scripts/publication-release.mjs';
import { glob } from 'glob';
import sharp from 'sharp';
import { parse as parseYaml } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, '_site');
const atlas = path.join(site, 'dpp-explorer');
const sourceRelease = path.join(root, 'dpp-research/releases/0.1.0');
const read = file => readFile(file, 'utf8');
const json = async file => JSON.parse(await read(file));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const schemas = html => [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => JSON.parse(m[1]));

test('every archived release byte matches the frozen manifest and metadata', async () => {
  const manifest = await json(path.join(sourceRelease, 'manifest.json'));
  for (const [file, expected] of Object.entries(manifest.files)) {
    assert.equal(hash(await readFile(path.join(atlas, 'releases/0.1.0', file))), expected, file);
  }
  for (const file of ['manifest.json', 'checksums.sha256']) {
    assert.deepEqual(await readFile(path.join(atlas, 'releases/0.1.0', file)), await readFile(path.join(sourceRelease, file)), file);
  }
  assert.deepEqual(await readFile(path.join(atlas, 'data/dataset.json')), await readFile(path.join(sourceRelease, 'dataset.json')));
});

test('the delivered current Atlas points to its sealed, qualified research release without altering the candidate', async () => {
  const release = await verifyAtlasPublication({
    atlas_release_state: PUBLICATION_STATE,
    atlas_release_version: PUBLICATION_VERSION
  }, { repositoryRoot: root, siteDirectory: site });
  assert.equal(release.dataset.metadata.release_status, 'research_seed');
  assert.equal(release.manifest.seal_scope, 'technical_integrity_only');
  assert.equal(release.dataset.metadata.review_status, 'machine_assisted_unreviewed');
  assert.equal(release.validation.human_reviewed_assertions, 0);
  assert.equal(release.publication.independent_review_completed, false);
  assert.equal(release.publication.license, 'https://creativecommons.org/licenses/by/4.0/');
  const candidate = await json(path.join(root, 'dpp-research/candidates/0.2.0/dataset.json'));
  const candidateManifest = await json(path.join(root, 'dpp-research/candidates/0.2.0/manifest.json'));
  assert.equal(candidate.metadata.release_status, 'candidate');
  assert.equal(candidateManifest.sealed, false);
  for (const collection of ['entities', 'assertions', 'sources']) assert.deepEqual(release.dataset[collection], candidate[collection]);
  for (const [name, expected] of release.outputs) {
    assert.deepEqual(await readFile(path.join(atlas, 'releases', PUBLICATION_VERSION, name)), expected, name);
  }
});

test('delivered atlas still matches its manifest after site optimization', async () => {
  const manifest = await json(path.join(atlas, 'build-manifest.json'));
  for (const entry of manifest.files) {
    const bytes = await readFile(path.join(atlas, entry.file));
    assert.equal(hash(bytes), entry.sha256, entry.file);
    assert.equal(bytes.length, entry.bytes, entry.file);
  }
});

test('finished whitepaper metadata preserves the separate frozen dataset rights', async () => {
  const html = await read(path.join(site, 'global-digital-product-passport-regulation.html'));
  const data = schemas(html);
  const paper = data.find(s => s['@type'] === 'ScholarlyArticle');
  assert.ok(paper?.datePublished);
  const dataset = data.find(s => s['@type'] === 'Dataset');
  assert.equal(dataset?.version, '0.1.0');
  assert.ok(dataset?.name && dataset?.description && dataset?.copyrightNotice);
  assert.ok(!Object.hasOwn(dataset, 'license'), 'Frozen data must not inherit manuscript CC BY');
  for (const file of dataset.distribution) assert.match(file.contentUrl, /\/dpp-explorer\/releases\/0\.1\.0\//);
  assert.match(html, /name=["']citation_pdf_url["']/);
  assert.match(html, /name=["']citation_title["']/);
  assert.match(html, /Manuscript prepared/);
  assert.match(html, /Not peer reviewed/);
  assert.doesNotMatch(html, /Paper in preparation|blank PDF placeholder|Research curator/);
});

test('existing research pages retain their scholarly metadata', async () => {
  const html = await read(path.join(site, 'verifiable-access-controlled-digital-product-passports.html'));
  const article = schemas(html).find(s => s['@type'] === 'ScholarlyArticle');
  assert.ok(article?.datePublished);
  assert.match(html, /name=["']citation_title["']/);
  assert.match(html, /name=["']citation_pdf_url["']/);
});

test('static catalogue retains every substantive record and source anchor', async () => {
  const dataset = await json(path.join(sourceRelease, 'dataset.json'));
  const html = await read(path.join(atlas, 'catalogue.html'));
  const scaffold = new Set(['Jurisdiction', 'Sector', 'Concept']);
  const records = dataset.entities.filter(e => !scaffold.has(e.type));
  assert.equal(records.length, 128);
  for (const record of records) assert.ok(html.includes(`id="${record.id}"`), record.id);
  for (const source of dataset.sources) assert.ok(html.includes(`id="source-${source.id}"`), source.id);
});

test('static figure assets and all 52 geographic rows survive integration', async () => {
  const figures = path.join(root, 'dpp-research/figures/landscape-world-map');
  const delivered = path.join(site, 'assets/dpp-global/figures/0.1.0');
  for (const file of ['dpp-world-map.svg', 'dpp-world-map.pdf', 'dpp-world-map-a4-proof.pdf', 'coverage-table.json', 'caption.md', 'provenance.json', 'FONT-LICENSE.txt']) {
    assert.deepEqual(await readFile(path.join(delivered, file)), await readFile(path.join(figures, file)), file);
  }
  const rows = await json(path.join(figures, 'coverage-table.json'));
  const html = await read(path.join(atlas, 'coverage.html'));
  assert.equal(rows.length, 52);
  const baselineTable = html.match(/<table id="baseline-coverage">[\s\S]*?<\/table>/)?.[0];
  assert.ok(baselineTable, 'The frozen figure table remains separately identifiable');
  assert.equal([...baselineTable.matchAll(/scope="row"/g)].length, 52);
  const review = html.match(/<section id="latest-review">[\s\S]*?<\/section>/)?.[0];
  assert.ok(review, 'The dated coverage review appears alongside the frozen table');
  assert.equal([...review.matchAll(/scope="row"/g)].length, 4);
  for (const id of ['jur-gb', 'jur-ch', 'jur-no', 'jur-tw']) assert.ok(review.includes(`jurisdiction=${id}`));
  for (const row of rows) assert.ok(html.includes(`jurisdiction=${row.id}`), row.id);
  assert.match(html, /Malta and Singapore/);
  assert.match(html, /Great Britain and Northern Ireland/);
});

test('new pages resolve local assets and internal links beneath the repository base path', async () => {
  const pages = ['global-digital-product-passport-regulation.html', 'dpp-explorer/index.html', 'dpp-explorer/catalogue.html', 'dpp-explorer/catalogue-0.1.0.html', 'dpp-explorer/rights.html', 'dpp-explorer/coverage.html'];
  const origin = 'https://spherity.github.io';
  const base = '/spherity-research/';
  for (const page of pages) {
    const html = await read(path.join(site, page));
    for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)) {
      const value = match[1].replaceAll('&amp;', '&');
      if (/^(?:mailto:|data:|javascript:)/.test(value)) continue;
      const url = new URL(value, `${origin}${base}${page}`);
      if (url.origin !== origin) continue;
      assert.ok(url.pathname.startsWith(base), `${page}: escaped base path ${value}`);
      const relative = decodeURIComponent(url.pathname.slice(base.length));
      let file = path.join(site, relative);
      const info = await stat(file).catch(() => null);
      assert.ok(info, `${page}: missing local target ${value}`);
      if (info.isDirectory()) file = path.join(file, 'index.html');
      assert.ok((await stat(file)).isFile(), `${page}: missing index ${value}`);
      if (url.hash && file.endsWith('.html')) {
        const target = await read(file);
        const anchor = decodeURIComponent(url.hash.slice(1));
        assert.ok(target.includes(`id="${anchor}"`) || target.includes(`id='${anchor}'`), `${page}: missing anchor ${value}`);
      }
    }
  }
});

test('the delivered Atlas has its own crawler-visible large-image card and a real matching JPEG', async () => {
  const cards = parseYaml(await read(path.join(root, 'docs/_data/social_cards.yml')));
  const card = cards.find(entry => entry.publication_url === '/dpp-explorer/');
  assert.ok(card, 'The Atlas must declare its own social card rather than reuse the paper card');
  assert.equal(card.page_type, 'website');
  assert.equal(card.output, '/assets/social/global-dpp-atlas.jpg');
  const config = parseYaml(await read(path.join(root, 'docs/_config.yml')));
  const origin = `${config.url}${config.baseurl}`;
  const canonical = `${origin}/dpp-explorer/`;
  const imageUrl = `${origin}${card.output}`;
  const html = await read(path.join(atlas, 'index.html'));
  const head = html.replace(/<!--[\s\S]*?-->/g, '').match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]?.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  assert.ok(head, 'Social crawlers must receive metadata in the initial HTML head');
  const tags = name => [...head.matchAll(new RegExp(`<${name}\\b([^>]+)>`, 'gi'))].map(match => Object.fromEntries(
    [...match[1].matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
      .map(attribute => [attribute[1].toLowerCase(), (attribute[2] ?? attribute[3] ?? attribute[4]).replaceAll('&amp;', '&')])
  ));
  const metadata = tags('meta');
  const meta = (kind, name) => {
    const matches = metadata.filter(tag => tag[kind] === name);
    assert.equal(matches.length, 1, `${name} must occur once in the initial HTML`);
    assert.ok(matches[0].content?.trim(), `${name} must not be empty`);
    return matches[0].content;
  };
  assert.deepEqual(tags('link').filter(tag => tag.rel === 'canonical').map(tag => tag.href), [canonical]);
  assert.equal(meta('property', 'og:type'), 'website');
  assert.equal(meta('property', 'og:url'), canonical);
  assert.equal(meta('property', 'og:site_name'), config.title);
  assert.match(meta('property', 'og:title'), /^Global DPP Atlas/);
  assert.match(meta('property', 'og:description'), /world map and knowledge graph/);
  assert.equal(meta('property', 'og:image'), imageUrl);
  assert.equal(meta('property', 'og:image:secure_url'), imageUrl);
  assert.equal(meta('property', 'og:image:type'), 'image/jpeg');
  assert.equal(meta('property', 'og:image:width'), '1200');
  assert.equal(meta('property', 'og:image:height'), '630');
  assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
  assert.equal(meta('name', 'twitter:image'), imageUrl);
  for (const field of ['title', 'description', 'image:alt']) {
    assert.equal(meta('name', `twitter:${field}`), meta('property', `og:${field}`));
  }
  const image = await readFile(path.join(site, card.output.slice(1)));
  const info = await sharp(image).metadata();
  assert.equal(info.format, 'jpeg', 'Declared MIME type must match the delivered image bytes');
  assert.equal(info.width, 1200);
  assert.equal(info.height, 630);
  assert.ok(image.length <= 250 * 1024, 'Card must fit the site social-image budget');
  assert.deepEqual(image, await readFile(path.join(root, 'docs', card.output.slice(1))), 'Build must deliver the reviewed card');
});

test('the finished paper and all five canonical Atlas pages are discoverable without indexing archive aliases', async () => {
  const sitemap = await read(path.join(site, 'sitemap.xml'));
  const paper = await read(path.join(site,'global-digital-product-passport-regulation.html'));
  assert.match(paper,/name=["']robots["'][^>]*content=["']index,\s*follow/);
  assert.match(sitemap,/global-digital-product-passport-regulation\.html/);
  assert.match(sitemap,/Spherity-Research-Global-DPP-Whitepaper\.pdf/);
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  const canonical = 'https://spherity.github.io/spherity-research/dpp-explorer/';
  const routes = [
    ['dpp-explorer/index.html', ''],
    ['dpp-explorer/rights.html', 'rights.html'],
    ['dpp-explorer/coverage.html', 'coverage.html'],
    ['dpp-explorer/catalogue.html', 'catalogue.html'],
    ['dpp-explorer/catalogue-0.1.0.html', 'catalogue-0.1.0.html']
  ];
  for (const [page, route] of routes) {
    const html=await read(path.join(site,page));
    assert.match(html,/name=["']robots["'][^>]*content=["']index,\s*follow/);
    assert.doesNotMatch(html,/name=["']robots["'][^>]*content=["'][^"']*noindex/);
    const tag=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i)?.[0];
    assert.equal(tag?.match(/href=["']([^"']+)["']/)?.[1], `${canonical}${route}`, page);
    assert.equal(locations.filter(location => location === `${canonical}${route}`).length, 1, page);
  }
  assert.deepEqual(locations.filter(location => location.startsWith(canonical)).sort(), routes.map(([, route]) => `${canonical}${route}`).sort());
  assert.doesNotMatch(sitemap, /dpp-explorer\/(?:releases|candidates|data|vendor)\/|assets\/dpp-global|\/share\//);
});

test('raw research downloads do not acquire unreviewed HTML aliases during the site build', async () => {
  const aliases = await glob([
    'dpp-explorer/{releases,candidates,data,vendor}/**/*.html',
    'assets/dpp-global/**/*.html'
  ], { cwd: site, nodir: true });
  assert.deepEqual(aliases, [], 'Archive Markdown must remain a download, not a generated HTML page');
});

test('the sitemap rejects archive HTML aliases without hiding canonical Atlas pages or changing downloads', async context => {
  const temporaryRoot = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(temporaryRoot, 'spherity-sitemap-test-'));
  context.after(async () => {
    assert.equal(path.dirname(directory), temporaryRoot);
    assert.ok(path.basename(directory).startsWith('spherity-sitemap-test-'));
    await rm(directory, { recursive: true, force: true });
  });
  const files = {
    '_config.yml': 'url: https://example.org\nbaseurl: /research\n',
    'paper.md': '---\ntitle: Paper\ndescription: Research fixture\npermalink: /paper.html\ncanonical_url: https://example.org/research/paper.html\npdf_url: /Paper.pdf\ncover_image: /cover.jpg\n---\nPaper\n',
    'cover.jpg': 'Cover fixture; sitemap generation does not decode image bytes',
    'index.html': '<html><head><title>Research</title></head><body>Research</body></html>',
    'dpp-explorer/index.html': '<html><head><meta name="robots" content="index, follow"></head></html>',
    'dpp-explorer/catalogue.html': '<html><head><meta name="robots" content="noindex, follow"></head></html>',
    'dpp-explorer/releases/0.1.0/index.html': '<h1>Generated README alias</h1>',
    'dpp-explorer/candidates/0.2.0/research-protocol.html': '<h1>Generated protocol alias</h1>',
    'dpp-explorer/data/provenance/evidence.html': '<h1>Generated evidence alias</h1>',
    'dpp-explorer/vendor/NATURAL-EARTH-LICENSE.html': '<h1>Generated license alias</h1>',
    'assets/dpp-global/figures/0.1.0/caption.html': '<h1>Generated caption alias</h1>',
    'dpp-explorer/releases/0.1.0/README.md': '# Frozen research download\n',
    'dpp-explorer/releases/0.1.0/dataset.json': '{"version":"0.1.0"}\n',
    'Paper.pdf': '%PDF-1.7\nUnchanged download fixture\n%%EOF\n'
  };
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(directory, file)), { recursive: true });
    await writeFile(path.join(directory, file), content);
  }
  await promisify(execFile)(process.execPath, [path.join(root, 'scripts/generate-sitemap.mjs'),
    '--site-dir', directory, '--source-dir', directory], {
    cwd: root, env: { ...process.env, SITE_URL: 'https://example.org/research' }
  });
  const sitemap = await read(path.join(directory, 'sitemap.xml'));
  assert.match(sitemap, /<loc>https:\/\/example\.org\/research\/dpp-explorer\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/example\.org\/research\/Paper\.pdf<\/loc>/);
  assert.doesNotMatch(sitemap, /catalogue|releases|candidates|provenance|vendor|assets\/dpp-global/);
  for (const [file, content] of Object.entries(files)) {
    assert.equal(await read(path.join(directory, file)), content, `${file} must remain unchanged`);
  }
});

test('metadata-enriched manuscript preserves the supplied PDF and has its own cover-sharing page', async () => {
  const pdfPath='/Spherity-Research-Global-DPP-Whitepaper.pdf';
  const {records,placeholderDownloads}=await loadPdfShares(path.join(root,'docs'));
  assert.ok(records.some(r=>r.pdfPath===pdfPath));
  assert.ok(!placeholderDownloads.has('/assets/dpp-global/Global-DPP-Standards-Paper-Placeholder.pdf'));
  const bytes=await readFile(path.join(site,pdfPath.slice(1)));
  const provenance=await json(path.join(root,'scripts/data/dpp-pdf-metadata-provenance.json'));
  const paper=provenance.files.find(file=>file.file===`docs${pdfPath}`);
  assert.ok(paper, 'The authorized metadata revision must retain source provenance');
  assert.equal(paper.source_sha256,'92e535b89ba11b2c3ca2d20835d06dfad0c8a1401d6e00084c54607aa3fc3d87');
  assert.equal(hash(bytes.subarray(0,paper.source_bytes)),paper.source_sha256);
  assert.equal(hash(bytes),paper.output_sha256);
  const html=await read(path.join(site,'global-digital-product-passport-regulation.html'));
  assert.match(html,/Read the paper/);assert.match(html,/Download PDF/);
  assert.doesNotMatch(html,/Global-DPP-Standards-Paper-Placeholder/);
  assert.ok((await stat(path.join(site,'share/Spherity-Research-Global-DPP-Whitepaper.html'))).isFile());
  assert.ok((await stat(path.join(site,'assets/pdf-share/Spherity-Research-Global-DPP-Whitepaper.jpg'))).isFile());
});

test('all published DPP PDFs match audited metadata revisions and preserve every original byte', async () => {
  const provenance=await json(path.join(root,'scripts/data/dpp-pdf-metadata-provenance.json'));
  assert.equal(provenance.version,1);
  const expectedFiles=[
    'docs/Spherity-Research-Global-DPP-Whitepaper.pdf',
    ...['fig01_world_map','fig02_regulatory_calendar','fig03_registry_services','fig04_wallet_evidence','fig05_interoperability_evidence','fig06_product_ai_continuum','fig07_convergence_scenarios']
      .map(name=>`docs/assets/dpp-global/whitepaper-v1/${name}.pdf`)
  ];
  assert.deepEqual(provenance.files.map(file=>file.file).sort(),expectedFiles.sort());
  for (const file of provenance.files) {
    const source=await readFile(path.join(root,file.file));
    const delivered=await readFile(path.join(site,file.file.slice('docs/'.length)));
    assert.deepEqual(delivered,source,`${file.file}: delivery must retain embedded metadata`);
    assert.equal(source.length,file.output_bytes,file.file);
    assert.equal(hash(source),file.output_sha256,`${file.file}: audited revision changed`);
    assert.equal(hash(source.subarray(0,file.source_bytes)),file.source_sha256,`${file.file}: original PDF prefix changed`);
    assert.ok(source.length>file.source_bytes,`${file.file}: metadata must be an incremental update`);
    assert.equal(file.info.author,'Dr. Carsten Stöcker');
    assert.ok(file.info.title && file.info.subject && file.info.keywords);
    assert.equal(file.rights.License,'https://creativecommons.org/licenses/by/4.0/');
  }
});

test('all seven paper figures, all thirteen timeline rows and checkpoint boundaries are visible',async()=>{
  const html=await read(path.join(site,'global-digital-product-passport-regulation.html'));
  const figures=['fig01_world_map','fig02_regulatory_calendar','fig03_registry_services','fig04_wallet_evidence','fig05_interoperability_evidence','fig06_product_ai_continuum','fig07_convergence_scenarios'];
  for(const figure of figures){
    assert.ok(html.includes(`id="dpp-${figure}-figure"`),figure);
    assert.ok(html.includes(`${figure}.svg`));
    assert.ok(html.includes(`${figure}.pdf`));
  }
  const table=html.match(/<table class="dpp-timeline-table">[\s\S]*?<\/table>/)?.[0];
  assert.ok(table);assert.equal([...table.matchAll(/<tbody>[\s\S]*?<\/tbody>/g)][0][0].match(/<tr>/g).length,13);
  for(const date of ['2027-04-25','2027-10-25','2028-10-25'])assert.ok(html.includes(`datetime="${date}"`));
  assert.match(table,/11 September 2026/);assert.match(html,/2029/);
  assert.equal([...html.matchAll(/class="dpp-checkpoint-caveat"/g)].length,4);
});

test('the paper page puts its interactive map before the detailed research metadata', async () => {
  const html = await read(path.join(site, 'global-digital-product-passport-regulation.html'));
  const frame = [...html.matchAll(/<iframe\b[^>]*>/gi)].find(match => /src=["'][^"']*\/dpp-explorer\/\?/.test(match[0]));
  assert.ok(frame, 'The landing page must contain the embedded map');
  const frameUrl = new URL(frame[0].match(/src=["']([^"']+)["']/)[1].replaceAll('&amp;', '&'), 'https://example.test');
  assert.equal(frameUrl.searchParams.get('embed'), 'map');
  assert.equal(frameUrl.searchParams.get('mapMode'), 'regulation', 'Paper preview must open the reviewed regulatory phase map');
  assert.match(frame[0], /title=["'][^"']+["']/);
  assert.match(frame[0], /loading=["']eager["']/);
  const metadataPosition = html.indexOf('class="srespec-meta"');
  assert.ok(metadataPosition > frame.index, 'Map must appear before the long version and curator metadata');
  assert.match(html, /href=["'][^"']*\/dpp-explorer\/coverage\.html["']/);
  const mapLinks = [...html.matchAll(/href=["']([^"']*\/dpp-explorer\/\?[^"']+)["']/g)].map(match => new URL(match[1].replaceAll('&amp;', '&'), 'https://example.test'));
  assert.ok(mapLinks.some(url => url.searchParams.get('view') === 'map' && url.searchParams.get('mapMode') === 'regulation'), 'Full-map link must preserve the regulation lens');
});

test('current graph download matches the displayed evidence and preserves the JTC5 provenance', async () => {
  const dataset = await json(path.join(atlas,'data/current-dataset.json'));
  const exported = await json(path.join(atlas,'data/knowledge-graph.json'));
  const catalogue = await read(path.join(atlas,'catalogue.html'));
  const scaffold = new Set(['Jurisdiction','Sector','Concept']);
  const records = dataset.entities.filter(e=>!scaffold.has(e.type));
  const ids = new Set(records.map(e=>e.id));
  const assertions = dataset.assertions.filter(a=>a.curation?.status!=='superseded'&&ids.has(a.subject)&&ids.has(a.object?.entity_id));
  assert.deepEqual(exported.nodes,records);
  assert.deepEqual(exported.edges.map(e=>e.id),assertions.map(e=>e.id));
  assert.equal(exported.scope.counts.nodes,records.length);
  assert.ok(records.length>150,'Published snapshot incorporates the whitepaper evidence');
  assert.equal(exported.scope.counts.edges,assertions.length);
  assert.equal(exported.scope.counts.assertions,dataset.assertions.length);
  assert.equal(exported.scope.counts.sources,dataset.sources.length);
  assert.equal(exported.scope.counts.context_entities,dataset.entities.length-records.length);
  for (const target of ['std-w3c-vc2','std-w3c-did1']) assert.ok(exported.edges.some(edge=>edge.source==='std-en-18219-2026'&&edge.target===target&&edge.predicate==='normatively_references'));
  assert.ok(exported.edges.some(edge=>edge.source==='std-w3c-dpp-committee-discussion-20260727'&&edge.target==='std-iso-jtc5'&&edge.predicate==='references'));
  assert.ok(!exported.edges.some(edge=>edge.predicate==='liaison_with'&&/std-w3c-/.test(edge.source+edge.target)));
  const jtcEdges = exported.edges.filter(e=>e.source==='std-iso-jtc5'||e.target==='std-iso-jtc5');
  assert.equal(jtcEdges.length,13);
  assert.equal(jtcEdges.filter(e=>e.predicate==='liaison_with').length,9);
  assert.ok(jtcEdges.some(e=>e.predicate==='coordinates_with'&&e.target==='std-cen-jtc24'));
  assert.ok(!jtcEdges.some(e=>e.source==='std-eclass'||e.target==='std-eclass'));
  assert.equal(exported.metadata.evidence_cutoff,'2026-10-25');
  assert.equal(exported.metadata.release_status,'research_seed');
  assert.equal(exported.metadata.review_status,'machine_assisted_unreviewed');
  assert.equal(exported.metadata.evidence_updates.checked_at,'2026-10-25');
  for(const e of records)assert.ok(catalogue.includes(`id="${e.id}"`),e.id);
  for(const source of dataset.sources)assert.ok(catalogue.includes(`id="source-${source.id}"`),source.id);
  const app = await read(path.join(atlas,'app.js'));
  assert.match(app,/loadAtlasData/);
  const atlasData = await read(path.join(atlas,'atlas-data.js'));
  assert.match(atlasData,/data\/current-dataset\.json/);
  assert.match(atlasData,/data\/dataset\.json/);
  const html = await read(path.join(atlas,'index.html'));
  assert.match(html,/id="graph-download-all"[^>]*href="data\/knowledge-graph\.json"[^>]*download/);
  assert.match(html,/id="graph-download-view"/);
});
