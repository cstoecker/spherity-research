import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';
import {createImageXmp, embedImageXmp, embedSvgMetadata} from './lib/image-metadata.mjs';
import {loadDppImageMetadata} from './lib/dpp-image-metadata.mjs';

const metadata = {
  title: 'Evidence & products', description: 'A scoped diagram <with evidence>.',
  creator: 'Dr. Carsten Stöcker', keywords: ['DPP', 'Evidence'],
  rights: '© 2026 Author. Third-party exclusions apply.',
  source: 'https://example.org/paper.html', credit: 'Author / Research',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  licensePage: 'https://example.org/paper.html#license', metadataDate: '2026-10-25'
};

for (const [format, mime] of [['jpeg','image/jpeg'], ['png','image/png'], ['webp','image/webp']]) {
  test(`${format} XMP is readable, idempotent and does not change decoded pixels`, async () => {
    const original = await sharp({create: {width: 27, height: 19, channels: 4, background: '#48a3b8a0'}}).toFormat(format).toBuffer();
    const tagged = embedImageXmp(original, {...metadata, format: mime});
    assert.deepEqual(await sharp(tagged).raw().toBuffer(), await sharp(original).raw().toBuffer());
    assert.equal((await sharp(tagged).metadata()).xmp.toString(), createImageXmp({...metadata, format: mime}));
    assert.deepEqual(embedImageXmp(tagged, {...metadata, format: mime}), tagged);
    const revised = embedImageXmp(tagged, {...metadata, title: 'Revised', format: mime});
    assert.ok((await sharp(revised).metadata()).xmp.toString().includes('Revised'));
    assert.deepEqual(await sharp(revised).raw().toBuffer(), await sharp(original).raw().toBuffer());
  });
}
test('SVG metadata retains extraction provenance, accessible IDs and all rendered elements', async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24" role="img" aria-labelledby="a b"><title id="a">Old</title><desc id="b">Existing accessible explanation.</desc><metadata>Original source SHA-256: preserved.</metadata><path d="M1 2H31V23H1Z" fill="#234567"/></svg>';
  const tagged = embedSvgMetadata(svg, {...metadata, format:'image/svg+xml'});
  assert.ok(tagged.includes('<title id="a">Evidence &amp; products</title>'));
  assert.ok(tagged.includes('<desc id="b">Existing accessible explanation.</desc>'));
  assert.ok(tagged.includes('<metadata>Original source SHA-256: preserved.</metadata>'));
  assert.deepEqual(await sharp(Buffer.from(tagged)).raw().toBuffer(), await sharp(Buffer.from(svg)).raw().toBuffer());
  assert.equal(embedSvgMetadata(tagged, {...metadata, format:'image/svg+xml'}), tagged);
});
test('DPP source images retain explicit creator, rights, subject and source metadata', async () => {
  for (const [asset, info] of Object.entries(await loadDppImageMetadata())) {
    if (asset.startsWith('/assets/pdf-share/')) continue;
    const buffer = await readFile(`docs${asset}`);
    const xmp = info.format === 'image/svg+xml' ? buffer.toString() : (await sharp(buffer).metadata()).xmp?.toString();
    assert.ok(xmp, `${asset}: embedded XMP required`);
    for (const field of ['dc:title','dc:description','dc:creator','dc:subject','dc:rights','dc:source','cc:license','xmpRights:WebStatement']) assert.ok(xmp.includes(`<${field}`), `${asset}: ${field} required`);
    assert.ok(xmp.includes('Dr. Carsten Stöcker'), `${asset}: named creator required`);
    assert.ok(xmp.includes('https://creativecommons.org/licenses/by/4.0/'), `${asset}: licence required`);
    assert.ok(xmp.includes('logos'), `${asset}: trademark exclusions required`);
  }
});
test('generated DPP PDF sharing preview keeps its own embedded cover metadata', async () => {
  const asset = '/assets/pdf-share/Spherity-Research-Global-DPP-Whitepaper.jpg';
  const info = (await loadDppImageMetadata())[asset];
  const xmp = (await sharp(await readFile(`_site${asset}`)).metadata()).xmp?.toString();
  assert.equal(xmp, createImageXmp(info));
});
