import {readFile, writeFile} from 'node:fs/promises';
import {embedImageXmp, embedSvgMetadata} from './lib/image-metadata.mjs';
import {loadEbwImageMetadata} from './lib/ebw-image-metadata.mjs';

for (const [asset, metadata] of Object.entries(await loadEbwImageMetadata())) {
  if (asset.startsWith('/assets/pdf-share/')) continue;
  const filename = `docs${asset}`;
  const original = await readFile(filename);
  const updated = metadata.format === 'image/svg+xml'
    ? Buffer.from(embedSvgMetadata(original.toString(), metadata, 'ebw-publication-metadata'))
    : embedImageXmp(original, metadata);
  if (!original.equals(updated)) await writeFile(filename, updated);
  console.log(`Verified embedded metadata: ${asset}`);
}
