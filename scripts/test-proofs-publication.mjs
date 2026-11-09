import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import {parse} from 'yaml';
import sharp from 'sharp';
import {loadProofsImageMetadata} from './lib/proofs-image-metadata.mjs';
import {createImageXmp} from './lib/image-metadata.mjs';

const slug = 'proofs-over-statements-evidence-graphs';
const origin = 'https://spherity.github.io/spherity-research';
const source = fs.readFileSync(`docs/${slug}.md`, 'utf8');
const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
const page = parse(frontmatter);
const html = fs.readFileSync(`_site/${slug}.html`, 'utf8');
const release = JSON.parse(fs.readFileSync('research-assets/proofs-over-statements/release-integrity.json', 'utf8'));
const assets = JSON.parse(fs.readFileSync('docs/assets/proofs-over-statements/assets-manifest.json', 'utf8'));
const catalog = JSON.parse(fs.readFileSync('docs/assets/proofs-over-statements-file-catalog.json', 'utf8'));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const entities = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”',hellip:'…',copy:'©'};
const decode = text => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code) => code[0] === '#'
  ? String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))) : entities[code] ?? whole);
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
  .map(match => [match[1].toLowerCase(), decode(match[2] ?? match[3] ?? match[4])]));
const tags = (document, tag) => [...document.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map(match => attributes(match[0]));
const links = document => new Set(tags(document, 'a').map(tag => tag.href));
const schemasIn = document => [...document.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(match => attributes(match[1]).type === 'application/ld+json').flatMap(match => {
    const schema = JSON.parse(match[2]);
    return schema['@graph'] || [schema];
  });
const schemas = schemasIn(html);
const normalize = text => decode(text).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
const visible = normalize(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' '));
const publicHref = url => '/spherity-research' + url;
const metadata = (document, name) => tags(document, 'meta').find(tag => tag.name === name || tag.property === name)?.content;
const canonical = document => tags(document, 'link').find(tag => tag.rel === 'canonical')?.href;

function checkFile(record, directory = 'docs') {
  const bytes = fs.readFileSync(directory + record.url);
  assert.equal(digest(bytes), record.sha256, `${directory}${record.url}: SHA-256`);
  const expectedBytes = record.bytes ?? parseInt(record.content_size, 10);
  assert.equal(bytes.length, expectedBytes, `${directory}${record.url}: byte length`);
  return bytes;
}

test('both final PDFs and the publication ZIP retain their exact approved release bytes', () => {
  const expected = {
    '/Stoecker-2026-Proofs-over-Statements-v1.3.pdf': '3363a92e1a91ba34c52f2278b16dfefee9f3f5fa2fbe1ad12edaba3aa27c11b9',
    '/Stoecker-2026-Proofs-over-Statements-v1.3-executive-brief.pdf': '581bdb961005a649db5b71ef2c4c1220a159292bbc4855adf4ffdac2834ae264',
    '/downloads/Stoecker-2026-Proofs-over-Statements-v1.3-publication-package-2026-11-09.zip': '8c3a33c5a48a9d11b4c4a90604a6c97539c69348122fc601a500f652e800273d'
  };
  assert.equal(release.version, '1.3');
  assert.equal(release.documents.length, 3);
  assert.deepEqual(new Set(release.documents.map(file => file.url)), new Set(Object.keys(expected)));
  for (const file of release.documents) {
    assert.equal(file.sha256, expected[file.url]);
    const bytes = checkFile(file);
    checkFile(file, '_site');
    assert.ok(file.encoding_format === 'application/pdf' ? bytes.subarray(0,5).toString() === '%PDF-' : bytes.subarray(0,2).toString() === 'PK');
    assert.ok(links(html).has(publicHref(file.url)), `${file.url}: visible final download`);
  }
});

test('all 38 public verification files are unchanged and retain their passing test reports', () => {
  assert.equal(release.example_files.length, 38);
  assert.equal(new Set(release.example_files.map(file => file.url)).size, 38);
  for (const file of release.example_files) {
    checkFile(file);
    checkFile(file, '_site');
    assert.doesNotMatch(file.url, /(?:node_modules|generate\.mjs|private-key)/i);
  }
  const exampleRoot = 'docs/downloads/proofs-over-statements-v1.3/examples/';
  const results = JSON.parse(fs.readFileSync(exampleRoot+'verification-results.json', 'utf8'));
  const audit = JSON.parse(fs.readFileSync(exampleRoot+'audit-spec-results.json', 'utf8'));
  assert.equal(results.result, 'PASS');
  assert.equal(results.acceptedCases, 4);
  assert.equal(results.rejectedCases, 13);
  assert.equal(audit.result, 'PASS');
  assert.equal(Object.values(audit.assertions).length, 9);
  assert.ok(Object.values(audit.assertions).every(Boolean));
  assert.equal(audit.negativeChecks.length, 8);
  const key = JSON.parse(fs.readFileSync(exampleRoot+'outer-public-jwk.json', 'utf8'));
  assert.equal(key.kty, 'EC');
  assert.equal(key.d, undefined);
});

test('all 13 figures have complete SVG/PNG/PDF downloads, exact hashes and matching structured data', async () => {
  assert.equal(assets.figures.length, 13);
  assert.equal(page.figure_objects.length, 13);
  assert.equal(assets.figures.filter(figure => figure.document === 'full').length, 8);
  assert.equal(assets.figures.filter(figure => figure.document === 'brief').length, 5);
  const renderedImages = tags(html, 'img');
  const renderedLinks = links(html);
  const figureIds = new Set(tags(html, 'figure').map(tag => tag.id));
  for (const record of assets.figures) {
    const figure = page.figure_objects.find(item => item.id === record.id);
    assert.ok(figure, record.id);
    assert.equal(figure.distributions.length, 3);
    assert.deepEqual(new Set(figure.distributions.map(item => item.encoding_format)), new Set(['image/svg+xml','image/png','application/pdf']));
    assert.ok(figureIds.has(`${figure.id}-figure`), figure.id);
    assert.ok(renderedImages.some(image => image.src === publicHref(figure.content_url) && image.alt === figure.alt));
    const matching = schemas.filter(schema => schema['@id'] === `${origin}${figure.content_url}#image-object`);
    assert.equal(matching.length, 1);
    const image = matching[0];
    assert.equal(image['@type'], 'ImageObject');
    assert.equal(image.name, figure.name);
    assert.equal(image.caption, figure.caption);
    assert.equal(image.creator.name, figure.creator_name);
    assert.equal(image.copyrightNotice, figure.copyright_notice);
    assert.equal(image.license, 'https://creativecommons.org/licenses/by/4.0/');
    assert.equal(image.width, figure.width);
    assert.equal(image.height, figure.height);
    assert.equal(image.encoding.length, 3);
    for (const file of record.downloads) {
      const bytes = checkFile(file);
      checkFile(file, '_site');
      assert.ok(renderedLinks.has(publicHref(file.url)), file.url);
      assert.ok(image.encoding.some(item => item.contentUrl === `${origin}${file.url}` && item.encodingFormat === file.encoding_format));
      if (file.format === 'SVG') {
        const svg = bytes.toString();
        assert.match(svg, /<title\b/);
        assert.match(svg, /<desc\b/);
        assert.match(svg, /<path\b/);
        assert.doesNotMatch(svg, /<(?:image|text)\b/);
      } else if (file.format === 'PNG') {
        const info = await sharp(bytes).metadata();
        assert.equal(info.width, record.png_width);
        assert.equal(info.height, record.png_height);
      } else assert.equal(bytes.subarray(0,5).toString(), '%PDF-');
    }
  }
});

test('the file catalog describes and authenticates every document, figure, cover and example', () => {
  assert.equal(catalog.canonical_url, page.canonical_url);
  assert.equal(catalog.version, '1.3');
  const expected = [...release.documents, ...release.example_files, ...assets.figures.flatMap(figure => figure.downloads), ...assets.covers];
  assert.equal(catalog.files.length, expected.length);
  assert.deepEqual(new Set(catalog.files.map(file => file.url)), new Set(expected.map(file => file.url)));
  for (const file of catalog.files) {
    assert.ok(file.name && file.description && file.encoding_format && file.sha256, file.url);
    checkFile(file);
    checkFile(file, '_site');
  }
});

test('the two PDF sharing pages keep distinct covers and canonical noindex metadata', async () => {
  assert.equal(page.associated_media.length, 2);
  assert.equal(new Set(page.associated_media.map(media => media.cover_image)).size, 2);
  const expectedImages = await loadProofsImageMetadata();
  for (const media of page.associated_media) {
    const basename = path.posix.basename(media.url, '.pdf');
    const share = fs.readFileSync(`_site/share/${basename}.html`, 'utf8');
    assert.equal(canonical(share), page.canonical_url);
    assert.match(metadata(share, 'robots'), /noindex/);
    assert.match(metadata(share, 'robots'), /follow/);
    assert.ok(links(share).has(publicHref(media.url)));
    const previewPath = `/assets/pdf-share/${basename}.jpg`;
    assert.equal(metadata(share, 'og:image'), `${origin}${previewPath}`);
    const image = await sharp('_site'+previewPath).metadata();
    assert.equal(image.width, 1200);
    assert.equal(image.height, 630);
    assert.equal(image.xmp.toString(), createImageXmp(expectedImages[previewPath]));
    assert.equal(expectedImages[previewPath].source, `${origin}${media.url}`);
    const cover = assets.covers.find(item => item.url === media.cover_image);
    assert.ok(cover);
    checkFile(cover);
    const original = await sharp('docs'+media.cover_image).metadata();
    assert.ok(original.height > original.width, 'Complete portrait cover is retained.');
  }
  const social = await sharp('_site'+page.image).metadata();
  assert.equal(social.xmp.toString(), createImageXmp(expectedImages[page.image]));
});

test('bibliographic metadata names the final paper, author, version and rights accurately', () => {
  assert.equal(canonical(html), page.canonical_url);
  assert.equal(metadata(html, 'citation_title'), 'Proofs over Statements in Verifiable Evidence Graphs for the European Business Wallet');
  assert.equal(metadata(html, 'citation_pdf_url'), `${origin}${page.pdf_url}`);
  assert.equal(metadata(html, 'citation_author'), 'Dr. Carsten Stöcker');
  assert.equal(metadata(html, 'citation_publication_date'), '2026-11-09');
  assert.equal(metadata(html, 'description'), page.description);
  assert.equal(metadata(html, 'og:title'), page.og_title);
  assert.equal(metadata(html, 'twitter:title'), page.og_title);
  assert.ok(normalize(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)[1]).includes(page.seo_title));
  const article = schemas.find(schema => schema['@id'] === `${page.canonical_url}#article`);
  assert.ok(article);
  assert.equal(article.version, '1.3');
  assert.equal(article.license, 'https://creativecommons.org/licenses/by/4.0/');
  assert.equal(article.copyrightNotice, page.copyright_notice);
  assert.ok(visible.includes('Carsten Stöcker'));
  assert.ok(visible.includes('CC BY 4.0'));
  const yaml11 = parse(frontmatter, {version:'1.1'});
  for (const field of ['date','last_modified_at','research_cutoff']) assert.equal(typeof yaml11[field], 'string', `${field}: quote ISO dates for Jekyll`);
});

test('all eight FAQ answers are visible and exactly match FAQPage structured data', () => {
  assert.equal(page.questions_answered.length, 8);
  const faq = schemas.filter(schema => schema['@type'] === 'FAQPage');
  assert.equal(faq.length, 1);
  assert.equal(faq[0].mainEntity.length, 8);
  for (const item of page.questions_answered) {
    assert.ok(visible.includes(normalize(item.question)), item.question);
    assert.ok(visible.includes(normalize(item.answer)), item.question);
    assert.ok(faq[0].mainEntity.some(question => question.name === item.question && question.acceptedAnswer.text === item.answer));
  }
  for (const scope of ['not full service latencies','another admissible path','no supporting dataset or methodology','not an independent RDF implementation']) {
    assert.ok(visible.toLowerCase().includes(scope.toLowerCase()), scope);
  }
});

test('homepage, machine-readable index and sitemap expose the final publication and figures', () => {
  const publications = parse(fs.readFileSync('docs/_data/publications.yml', 'utf8'));
  const publication = publications.filter(item => item.links?.some(link => link.url === page.permalink));
  assert.equal(publication.length, 1);
  assert.equal(publication[0].links[0].url, page.permalink);
  const homepageLinks = links(fs.readFileSync('_site/index.html', 'utf8'));
  assert.ok(homepageLinks.has(publicHref(page.permalink)));
  for (const file of release.documents) assert.ok(homepageLinks.has(publicHref(file.url)), file.url);
  const llms = fs.readFileSync('_site/llms.txt', 'utf8');
  assert.ok(llms.includes(page.canonical_url));
  for (const media of page.associated_media) assert.ok(llms.includes(`${origin}${media.url}`));
  const sitemap = fs.readFileSync('_site/sitemap.xml', 'utf8');
  const urls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decode(match[1])));
  const images = new Set([...sitemap.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map(match => decode(match[1])));
  assert.ok(urls.has(page.canonical_url));
  for (const media of page.associated_media) {
    assert.ok(urls.has(`${origin}${media.url}`));
    assert.ok(!urls.has(`${origin}/share/${path.posix.basename(media.url,'.pdf')}.html`));
  }
  for (const figure of page.figure_objects) {
    assert.ok(images.has(`${origin}${figure.content_url}`));
    assert.ok(images.has(`${origin}${figure.raster_url}`));
    for (const distribution of figure.distributions.filter(item => item.encoding_format === 'application/pdf')) assert.ok(urls.has(`${origin}${distribution.url}`));
  }
  for (const asset of [page.image, ...page.associated_media.map(media => media.cover_image)]) assert.ok(images.has(`${origin}${asset}`));
});

test('supplemental downloads expose exact hashes and preserve file-specific licence boundaries', () => {
  assert.ok(page.supplementary_media.length >= 6);
  for (const file of page.supplementary_media) {
    const matching = schemas.filter(schema => schema['@id'] === `${origin}${file.url}#media-object`);
    assert.equal(matching.length, 1, file.url);
    const media = matching[0];
    assert.equal(media['@type'], 'MediaObject');
    assert.equal(media.contentUrl, `${origin}${file.url}`);
    assert.equal(media.encodingFormat, file.encoding_format);
    assert.equal(media.sha256, file.sha256);
    assert.equal(media.contentSize, file.content_size);
    assert.equal(media.usageInfo, file.usage_info);
    assert.equal(media.isPartOf['@id'], `${page.canonical_url}#article`);
    checkFile(file, '_site');
    assert.ok(links(html).has(publicHref(file.url)), file.url);
    if (file.encoding_format === 'application/zip') assert.equal(Object.hasOwn(media,'license'), false);
  }
});

test('publication links never refer to earlier manuscript editions or local build paths', () => {
  const finalFiles = new Set([...release.documents, ...release.example_files].map(file => publicHref(file.url)));
  for (const link of links(html)) {
    if (/Stoecker-2026-Proofs-over-Statements.*\.(?:pdf|zip)(?:[?#].*)?$/i.test(link)) {
      assert.ok(finalFiles.has(link), `Unexpected or stale publication download: ${link}`);
    }
    assert.doesNotMatch(link || '', /(?:C:\\Users|file:\/\/|localhost|127\.0\.0\.1)/i);
  }
  assert.doesNotMatch(source, /Stoecker-2026-Proofs-over-Statements-v(?:1\.2|8\.2)/);
});
