import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import test from 'node:test';
import sharp from 'sharp';
import {loadEbwImageMetadata} from './lib/ebw-image-metadata.mjs';
import {createImageXmp} from './lib/image-metadata.mjs';

const origin = 'https://spherity.github.io/spherity-research';
const html = await readFile('_site/ebw-roadmap.html', 'utf8');
const json = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/g)]
  .flatMap(match => { const block = JSON.parse(match[1]); return block['@graph'] || [block]; });

test('launch is a qualified company plan linked to the research and wallet service, not an invented release event', () => {
  const launch = json.find(node => node['@id'] === `${origin}/ebw-roadmap.html#launch-plan`);
  const service = json.find(node => node['@type'] === 'Service');
  assert.equal(launch.creativeWorkStatus, 'Planned general availability');
  assert.equal(launch.temporalCoverage, '2027-01-01/2027-03-31');
  assert.match(launch.name, /Bundesanzeiger Verlag.*planned Q1 2027/);
  assert.match(launch.description, /BSI-certified infrastructure/);
  assert.match(launch.description, /exact launch day has not been announced/);
  assert.equal(launch.about['@id'], service['@id']);
  assert.equal(service.provider['@id'], 'https://www.spherity.com/#organization');
  assert.ok(json.find(node => node['@type'] === 'ScholarlyArticle').hasPart.some(part => part['@id'] === launch['@id']));
  assert.ok(!json.some(node => node['@type'] === 'Event'));
  for (const node of [launch, service]) for (const field of ['releaseDate', 'startDate', 'offers', 'hasCertification']) assert.equal(node[field], undefined);
  assert.match(html, /id=["']?ebw-ready-wallet-launch["']?/);
  const faq = json.find(node => node['@type'] === 'FAQPage');
  const answer = faq.mainEntity.find(item => /launch with Bundesanzeiger/.test(item.name)).acceptedAnswer.text;
  assert.match(answer, /Q1 2027.*BSI-certified infrastructure/);
  assert.match(answer, /exact launch day has not been announced/);
});

test('roadmap stays a distinct discoverable research image with coherent rights and dimensions', async () => {
  const figure = json.find(node => node['@type'] === 'ImageObject' && node.contentUrl?.endsWith('Roadmap.svg'));
  assert.equal(figure.width, 2540); assert.equal(figure.height, 1500);
  assert.equal(figure.creator.name, 'Dr. Carsten Stöcker');
  assert.equal(figure.encodingFormat, 'image/svg+xml');
  for (const field of ['name','description','caption','license','acquireLicensePage','creditText','copyrightNotice']) assert.ok(figure[field]);
  // A research timeline must not acquire a launch date that is absent from the figure.
  assert.doesNotMatch(JSON.stringify(figure), /Q1 2027 launch|general availability/);
  const sitemap = await readFile('_site/sitemap.xml', 'utf8');
  const pageEntry = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].find(match => match[1].includes(`<loc>${origin}/ebw-roadmap.html</loc>`))?.[1];
  assert.ok(pageEntry.includes(`<image:loc>${figure.contentUrl}</image:loc>`));
  assert.equal((pageEntry.match(/<image:image>/g) || []).length, 4);
  assert.ok(pageEntry.includes(figure.contentUrl.replace(/\.svg$/, '.png')));
});

test('EBW image metadata survives social-card and PDF-sharing generation', async () => {
  for (const [asset, info] of Object.entries(await loadEbwImageMetadata())) {
    const file = await readFile(`${asset.startsWith('/assets/pdf-share/') ? '_site' : 'docs'}${asset}`);
    const packet = createImageXmp(info);
    if (info.format === 'image/svg+xml') {
      assert.ok(file.toString().includes(packet));
      assert.match(file.toString(), /viewBox="-70 -70 2540 1500"/);
    } else assert.equal((await sharp(file).metadata()).xmp.toString(), packet);
  }
});

test('PDF metadata correction preserves the supplied manuscript bytes and verified page appearance', async () => {
  const proof = JSON.parse(await readFile('scripts/data/ebw-pdf-metadata-provenance.json', 'utf8'));
  const pdf = await readFile(proof.file);
  const hash = data => createHash('sha256').update(data).digest('hex');
  assert.equal(hash(pdf.subarray(0, proof.source_bytes)), proof.source_sha256);
  assert.equal(hash(pdf), proof.published_sha256);
  assert.equal(proof.page_count, 26);
  assert.equal(proof.all_page_pixels_identical, true);
  assert.equal(proof.content_streams_identical, true);
  assert.equal(proof.geometry_links_bookmarks_identical, true);
  assert.equal(proof.after_info.author, 'Dr. Carsten Stöcker');
});
