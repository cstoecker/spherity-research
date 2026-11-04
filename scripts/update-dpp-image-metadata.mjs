import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {embedImageXmp, embedSvgMetadata} from './lib/image-metadata.mjs';
import {loadDppImageMetadata} from './lib/dpp-image-metadata.mjs';

const sourceDirectory = path.resolve('docs');
for (const [asset, metadata] of Object.entries(await loadDppImageMetadata(sourceDirectory))) {
  if (asset.startsWith('/assets/pdf-share/')) continue; // Generated after site build.
  const filename = path.join(sourceDirectory, asset.slice(1));
  const original = await readFile(filename);
  const updated = metadata.format === 'image/svg+xml' ? Buffer.from(embedSvgMetadata(original.toString(), metadata)) : embedImageXmp(original, metadata);
  if (!original.equals(updated)) await writeFile(filename, updated);
  console.log(`Embedded metadata: ${asset}`);
}
