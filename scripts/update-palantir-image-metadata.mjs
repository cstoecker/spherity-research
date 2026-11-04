import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {embedImageXmp, embedSvgMetadata} from './lib/image-metadata.mjs';
import {loadPalantirImageMetadata} from './lib/palantir-image-metadata.mjs';

const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const archive = 'research-assets/palantir/v1.0';
const manifest = JSON.parse(await fs.readFile('scripts/data/palantir-release-integrity.json', 'utf8'));
// Preserve the approved releases separately from metadata-enriched web copies.
for (const file of manifest) {
  const target = archive + file.path;
  let original;
  try { original = await fs.readFile(target); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    original = await fs.readFile('docs' + file.path);
    if (digest(original) !== file.sha256) throw Error('Source is no longer the approved release: ' + file.path);
    await fs.mkdir(path.dirname(target), {recursive: true});
    await fs.writeFile(target, original, {flag: 'wx'});
  }
  if (digest(original) !== file.sha256) throw Error('Archive integrity failure: ' + file.path);
}
const proof = [];
for (const [asset, metadata] of Object.entries(await loadPalantirImageMetadata())) {
  if (asset.startsWith('/assets/pdf-share/')) continue;
  const original = await fs.readFile('docs' + asset);
  const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const updated = metadata.format === 'image/svg+xml'
    ? Buffer.from(embedSvgMetadata(original.toString().replace(/(<desc\b[^>]*>)[\s\S]*?(<\/desc>)/,
      (_, a, b) => a + xml(metadata.description) + b), metadata, 'palantir-publication-metadata'))
    : embedImageXmp(original, metadata);
  const before = await sharp(original).raw().toBuffer();
  const after = await sharp(updated).raw().toBuffer();
  if (!before.equals(after)) throw Error('Artwork changed: ' + asset);
  if (!original.equals(updated)) await fs.writeFile('docs' + asset, updated);
  proof.push({path: asset, sha256: digest(updated), bytes: updated.length, decoded_pixels_sha256: digest(after), pixels_identical: true});
}
await fs.writeFile('scripts/data/palantir-image-metadata-provenance.json', JSON.stringify(proof, null, 2) + '\n');
console.log(`Embedded and verified metadata in ${proof.length} source images; original releases archived unchanged.`);
