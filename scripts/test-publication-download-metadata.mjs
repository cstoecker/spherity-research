import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {Liquid} from 'liquidjs';
import sharp from 'sharp';
import {createProofsImageMetadata, proofsPaperPath} from './lib/proofs-image-metadata.mjs';
import {embedImageXmp, createImageXmp} from './lib/image-metadata.mjs';

const template = await readFile(new URL('../docs/_includes/research-download-metadata.html', import.meta.url), 'utf8');
const origin = 'https://spherity.github.io/spherity-research';
const engine = new Liquid();
engine.registerFilter('absolute_url', value => /^https?:\/\//.test(value) ? value : `${origin}${value}`);
engine.registerFilter('jsonify', value => JSON.stringify(value));
const parse = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
const render = page => engine.parseAndRender(template, {page});
const canonical = `${origin}/proofs-over-statements-evidence-graphs.html`;
const download = {
  name: 'Publication package — "Proofs over Statements"',
  description: 'Full paper, brief & examples; author\'s "final" release.',
  url: '/downloads/proofs-publication.zip',
  encoding_format: 'application/zip',
  content_size: '16991435 bytes',
  sha256: '8c3a33c5a48a9d11b4c4a90604a6c97539c69348122fc601a500f652e800273d',
  usage_info: `${canonical}#license-and-citation`,
  copyright_notice: '© 2026 Carsten Stöcker, Spherity GmbH. Third-party terms remain applicable.',
  date_modified: '2026-11-09'
};
const basePage = {canonical_url: canonical, authors: ['Dr. Carsten Stöcker'], supplementary_media: [download]};

test('an absent or empty supplemental-download list emits no metadata', async () => {
  for (const supplementary_media of [undefined, []]) {
    assert.equal((await render({canonical_url:canonical, supplementary_media})).trim(), '');
  }
});

test('ZIP metadata retains its exact URL, MIME type, size, hash and article relationship', async () => {
  const [media] = parse(await render(basePage));
  assert.equal(media['@type'], 'MediaObject');
  assert.equal(media['@context'], 'https://schema.org');
  assert.equal(media.contentUrl, `${origin}${download.url}`);
  assert.equal(media.url, media.contentUrl);
  assert.equal(media['@id'], `${media.contentUrl}#media-object`);
  assert.equal(media.encodingFormat, download.encoding_format);
  assert.equal(media.contentSize, download.content_size);
  assert.equal(media.sha256, download.sha256);
  assert.equal(media.isPartOf['@id'], `${canonical}#article`);
  assert.equal(media.dateModified, '2026-11-09');
  assert.deepEqual(media.creator, [{'@type':'Person', name:'Dr. Carsten Stöcker'}]);
  assert.equal(media.isAccessibleForFree, true);
});

test('quoted and non-ASCII text survives JSON serialization without HTML escaping', async () => {
  const [media] = parse(await render(basePage));
  assert.equal(media.name, download.name);
  assert.equal(media.description, download.description);
  assert.equal(media.copyrightNotice, download.copyright_notice);
  assert.equal(media.usageInfo, download.usage_info);
});

test('usage information resolves once with the preview builder absolute_url filter', async () => {
  const previewEngine = new Liquid();
  previewEngine.registerFilter('absolute_url', value => `${origin}${value}`);
  previewEngine.registerFilter('jsonify', value => JSON.stringify(value));
  for (const usage_info of [download.usage_info, '/proofs-over-statements-evidence-graphs.html#license-and-citation']) {
    const [media] = parse(await previewEngine.parseAndRender(template, {
      page: {...basePage, supplementary_media: [{...download, usage_info}]}
    }));
    assert.equal(media.usageInfo, download.usage_info);
  }
});

test('a ZIP does not inherit the paper license or suppress its third-party usage notice', async () => {
  const [media] = parse(await render({...basePage, license:'https://creativecommons.org/licenses/by/4.0/'}));
  assert.equal(Object.hasOwn(media, 'license'), false);
  assert.equal(media.usageInfo, download.usage_info);
  assert.equal(media.copyrightNotice, download.copyright_notice);
});

test('explicit per-file rights and author identities are preserved', async () => {
  const page = {...basePage, author_entities:[{name:'Carsten Stöcker',url:`${origin}/#dr-carsten-stoecker`},{name:'Co-author "Example"'}],
    supplementary_media:[{...download,license:'https://creativecommons.org/licenses/by/4.0/'}]};
  const [media] = parse(await render(page));
  assert.equal(media.license, page.supplementary_media[0].license);
  assert.deepEqual(media.creator, [{'@type':'Person',name:'Carsten Stöcker',url:`${origin}/#dr-carsten-stoecker`},
    {'@type':'Person',name:'Co-author "Example"'}]);
});

test('multiple downloads stay distinct and a relative page URL supplies the fallback canonical', async () => {
  const page = {...basePage, canonical_url:undefined,url:'/example.html', supplementary_media:[download,{...download,url:'/downloads/examples.zip',name:'Credential examples'}]};
  const media = parse(await render(page));
  assert.equal(media.length, 2);
  assert.notEqual(media[0]['@id'], media[1]['@id']);
  assert.equal(media[1].contentUrl, `${origin}/downloads/examples.zip`);
  assert.equal(media[0].isPartOf['@id'], `${origin}/example.html#article`);
});

test('publication preview metadata keeps the full and brief covers distinct and targets only this publication', () => {
  const metadata = createProofsImageMetadata({
    title:'Proofs over Statements', canonical_url:canonical, authors:['Dr. Carsten Stöcker'],
    affiliation:'Spherity GmbH', license:'https://creativecommons.org/licenses/by/4.0/',
    last_modified_at:'2026-11-09', keywords:['JSON-LD','Data Integrity'],
    image:'/assets/proofs-over-statements-social.webp', image_alt:'Research preview of evidence graphs.',
    associated_media:[
      {name:'Full paper',url:'/Stoecker-2026-Proofs-over-Statements-v1.3.pdf',cover_image:'/assets/proofs-over-statements/full-paper-cover.jpg',cover_image_alt:'Full paper first page.'},
      {name:'Executive brief',url:'/Stoecker-2026-Proofs-over-Statements-v1.3-executive-brief.pdf',cover_image:'/assets/proofs-over-statements/executive-brief-cover.jpg',cover_image_alt:'Executive brief first page.'}
    ]
  });
  assert.equal(proofsPaperPath, '/proofs-over-statements-evidence-graphs.html');
  assert.equal(Object.keys(metadata).length, 5);
  const full = metadata['/assets/pdf-share/Stoecker-2026-Proofs-over-Statements-v1.3.jpg'];
  const brief = metadata['/assets/pdf-share/Stoecker-2026-Proofs-over-Statements-v1.3-executive-brief.jpg'];
  assert.equal(full.source, `${origin}/Stoecker-2026-Proofs-over-Statements-v1.3.pdf`);
  assert.equal(brief.source, `${origin}/Stoecker-2026-Proofs-over-Statements-v1.3-executive-brief.pdf`);
  assert.match(full.title, /Full paper/);
  assert.match(brief.title, /Executive brief/);
  assert.notEqual(full.description, brief.description);
  assert.ok(full.rights.includes('Third-party material retains its own terms'));
  assert.equal(metadata['/assets/proofs-over-statements-social.webp'].source, canonical);
  assert.equal(metadata['/assets/unrelated-social.webp'], undefined);
});

test('social/share metadata can be embedded without changing image pixels', async () => {
  const info = {title:'Proofs over Statements',description:'A publication preview.',creator:'Carsten Stöcker',
    credit:'Carsten Stöcker / Spherity GmbH',rights:'© 2026 Carsten Stöcker, Spherity GmbH.',
    license:'https://creativecommons.org/licenses/by/4.0/',licensePage:`${canonical}#license-and-citation`,
    source:canonical,metadataDate:'2026-11-09',keywords:['JSON-LD','Data Integrity']};
  for (const [format,mime] of [['webp','image/webp'],['jpeg','image/jpeg']]) {
    const original = await sharp({create:{width:20,height:10,channels:3,background:'#2e5473'}}).toFormat(format).toBuffer();
    const tagged = embedImageXmp(original,{...info,format:mime});
    assert.deepEqual(await sharp(original).raw().toBuffer(),await sharp(tagged).raw().toBuffer());
    assert.equal((await sharp(tagged).metadata()).xmp.toString(),createImageXmp({...info,format:mime}));
  }
});
