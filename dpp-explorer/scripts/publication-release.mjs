import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateCandidate } from './candidate-release.mjs';
import { createGraphExport } from '../src/graph-export.js';

export const PUBLICATION_STATE = 'released_research_snapshot';
export const PUBLICATION_VERSION = '0.2.0';
const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const json = value => JSON.parse(value.toString('utf8'));
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };

function contained(root, name) {
  requireValue(typeof name === 'string' && name.length > 0 && !name.includes('\\') && !name.includes('\0'), 'Invalid release path');
  const resolved = path.resolve(root, name);
  const relative = path.relative(root, resolved);
  requireValue(relative && !relative.startsWith('..') && !path.isAbsolute(relative), `Release path escapes its archive: ${name}`);
  return resolved;
}

async function readRegular(root, name) {
  const target = contained(root, name);
  let current = root;
  for (const component of path.relative(root, target).split(path.sep)) {
    current = path.join(current, component);
    requireValue(!(await fs.lstat(current)).isSymbolicLink(), `Release symlink is not permitted: ${name}`);
  }
  requireValue((await fs.stat(target)).isFile(), `Release file is missing: ${name}`);
  return fs.readFile(target);
}

/** Verify a committed technical seal. It never grants scientific/human review. */
export async function loadPublishedRelease({ repositoryRoot = defaultRoot } = {}) {
  const pointer = json(await readRegular(repositoryRoot, 'dpp-explorer/publication.json'));
  requireValue(pointer.state === PUBLICATION_STATE && pointer.version === PUBLICATION_VERSION, 'Unsupported Atlas publication state/version');
  requireValue(pointer.release_directory === `dpp-research/releases/${pointer.version}`, 'Publication must identify its immutable release directory');
  const releaseRoot = contained(repositoryRoot, pointer.release_directory);
  requireValue(!(await fs.lstat(releaseRoot)).isSymbolicLink(), 'Release directory must not be a symlink');
  const manifestBytes = await readRegular(releaseRoot, 'manifest.json');
  requireValue(sha256(manifestBytes) === pointer.manifest_sha256, 'Published release manifest checksum mismatch');
  const manifest = json(manifestBytes);
  requireValue(manifest.version === pointer.version && manifest.sealed === true && manifest.release_status === 'research_seed', 'Atlas publication requires a sealed research-seed release');
  requireValue(manifest.seal_scope === 'technical_integrity_only' && manifest.review_status === 'machine_assisted_unreviewed', 'Technical sealing must not imply completed human review');
  requireValue(manifest.hash_algorithm === 'sha256' && manifest.files && Object.keys(manifest.files).length > 0, 'Missing release checksum inventory');
  const outputs = new Map();
  for (const [name, expected] of Object.entries(manifest.files)) {
    requireValue(/^[a-f0-9]{64}$/.test(expected), `Invalid release digest: ${name}`);
    const bytes = await readRegular(releaseRoot, name);
    requireValue(sha256(bytes) === expected, `Published release checksum mismatch: ${name}`);
    outputs.set(name, bytes);
  }
  outputs.set('manifest.json', manifestBytes);
  const checksumBytes = await readRegular(releaseRoot, 'checksums.sha256');
  const expectedChecksums = [...outputs].map(([name, bytes]) => `${sha256(bytes)}  ${name}`).join('\n') + '\n';
  requireValue(checksumBytes.equals(Buffer.from(expectedChecksums)), 'Release checksums inventory mismatch');
  outputs.set('checksums.sha256', checksumBytes);
  const readJson = name => { requireValue(outputs.has(name), `Missing required release artifact: ${name}`); return json(outputs.get(name)); };
  const dataset = readJson('dataset.json');
  const schema = readJson('dataset.schema.json');
  const changeManifest = readJson('change-manifest.json');
  const calendar = readJson('views/regulatory-calendar.json');
  const publication = readJson('publication.json');
  requireValue(dataset.metadata.version === pointer.version && dataset.metadata.release_status === 'research_seed', 'Dataset does not match published research release');
  requireValue(dataset.metadata.review_status === 'machine_assisted_unreviewed', 'Dataset review status must remain qualified');
  requireValue(publication.license === 'https://creativecommons.org/licenses/by/4.0/' && publication.license_scope === 'original_data_annotations_and_compilation', 'Missing explicit Atlas data licence');
  requireValue(publication.state === PUBLICATION_STATE && publication.version === pointer.version && publication.independent_review_completed === false, 'Invalid publication qualification');
  requireValue(publication.review_status === 'machine_assisted_unreviewed' && publication.human_reviewed_assertions === 0 && publication.release_class === 'research_seed' && publication.seal_scope === 'technical_integrity_only', 'Publication must preserve its unreviewed research-seed qualification');
  requireValue(publication.third_party_exclusions?.length > 0 && dataset.metadata.rights_statement === publication.rights_statement, 'Dataset/publication rights mismatch');
  requireValue(sha256(outputs.get('dataset.json')) === pointer.dataset_sha256, 'Published dataset does not match its pinned digest');
  const validation = validateCandidate(dataset, schema, changeManifest, calendar);
  const storedValidation = readJson('validation-report.json');
  requireValue(storedValidation.status === 'passed' && storedValidation.human_reviewed_assertions === 0 && same(storedValidation.counts, validation.counts) && same(manifest.counts, validation.counts), 'Release validation/counts mismatch');
  const regulatory = readJson('views/regulatory-phases.json');
  const graph = readJson('views/graph.json');
  requireValue(same(graph, createGraphExport(dataset, { exportedAt: null, regulatoryProfiles: regulatory })), 'Published graph does not match qualified release evidence');
  const predecessor = publication.candidate_origin;
  requireValue(predecessor?.directory === 'dpp-research/candidates/0.2.0', 'Missing candidate provenance');
  const candidateManifestBytes = await readRegular(repositoryRoot, `${predecessor.directory}/manifest.json`);
  requireValue(sha256(candidateManifestBytes) === predecessor.manifest_sha256, 'Original candidate manifest changed');
  const candidateManifest = json(candidateManifestBytes);
  requireValue(sha256(await readRegular(repositoryRoot, `${predecessor.directory}/checksums.sha256`)) === predecessor.checksums_sha256, 'Original candidate checksums inventory changed');
  for (const [name, digest] of Object.entries(candidateManifest.files)) {
    requireValue(sha256(await readRegular(repositoryRoot, `${predecessor.directory}/${name}`)) === digest, `Original candidate checksum mismatch: ${name}`);
  }
  const candidateDatasetBytes = await readRegular(repositoryRoot, `${predecessor.directory}/dataset.json`);
  requireValue(sha256(candidateDatasetBytes) === predecessor.dataset_sha256, 'Original candidate dataset pin mismatch');
  const candidateDataset = json(candidateDatasetBytes);
  for (const kind of ['entities', 'assertions', 'sources']) requireValue(same(dataset[kind], candidateDataset[kind]), `Publication must not silently revise candidate ${kind}`);
  const baseline = publication.preserved_baseline;
  requireValue(baseline?.version === '0.1.0' && baseline.directory === 'dpp-research/releases/0.1.0', 'Missing preserved baseline provenance');
  const baselineManifestBytes = await readRegular(repositoryRoot, `${baseline.directory}/manifest.json`);
  requireValue(sha256(baselineManifestBytes) === baseline.manifest_sha256, 'Preserved baseline manifest checksum mismatch');
  for (const [name, digest] of Object.entries(json(baselineManifestBytes).files)) {
    requireValue(sha256(await readRegular(repositoryRoot, `${baseline.directory}/${name}`)) === digest, `Preserved baseline checksum mismatch: ${name}`);
  }
  return {
    published: true, publication, pointer, releaseRoot, dataset, schema, changeManifest, validation: storedValidation,
    updates: readJson('inputs/retained-website-updates.json'),
    views: { world_map: readJson('views/world-map.json'), timeline: readJson('views/timeline.json'), standards: readJson('views/standards.json'), review_queue: readJson('views/review-queue.json'), interoperability: readJson('views/interoperability.json'), interoperability_matrix: readJson('views/interoperability-matrix.json') },
    taxonomy: readJson('views/ecosystems.json'), regulatory, calendar, graph, manifest, outputs
  };
}

/** A page flag alone cannot promote a candidate or bypass the release seal. */
export async function verifyAtlasPublication(owner, { repositoryRoot = defaultRoot, siteDirectory } = {}) {
  requireValue(owner.atlas_release_state === PUBLICATION_STATE && owner.atlas_release_version === PUBLICATION_VERSION, 'Atlas owner must declare its verified research release state and version');
  const release = await loadPublishedRelease({ repositoryRoot });
  if (siteDirectory) {
    const atlasRoot = path.join(siteDirectory, 'dpp-explorer');
    for (const [name, expected] of release.outputs) {
      const bytes = await readRegular(atlasRoot, `releases/${release.manifest.version}/${name}`);
      requireValue(bytes.equals(expected), `Delivered immutable release differs: ${name}`);
    }
    for (const [target, original] of [['current-dataset.json', 'dataset.json'], ['current-release-manifest.json', 'manifest.json'], ['knowledge-graph.json', 'views/graph.json']]) {
      requireValue((await readRegular(atlasRoot, `data/${target}`)).equals(release.outputs.get(original)), `Current Atlas pointer differs from sealed release: ${target}`);
    }
  }
  return release;
}
