import { cp, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from '../dpp-explorer/scripts/build.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseRoot = path.join(root, 'dpp-research/releases/0.1.0');
const manifest = JSON.parse(await readFile(path.join(releaseRoot, 'manifest.json'), 'utf8'));
for (const [file, expected] of Object.entries(manifest.files)) {
  const bytes = await readFile(path.join(releaseRoot, file));
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected) throw new Error(`Frozen release checksum mismatch: ${file}`);
}
const result = await build();
await cp(result.dist, path.join(root, 'docs/dpp-explorer'), { recursive: true });
console.log(`Prepared DPP atlas ${result.release}; verified ${Object.keys(manifest.files).length} immutable source files.`);
