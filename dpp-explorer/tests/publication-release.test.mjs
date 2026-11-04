import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPublishedRelease, verifyAtlasPublication, PUBLICATION_STATE, PUBLICATION_VERSION, sha256 } from '../scripts/publication-release.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const releaseDirectory = `dpp-research/releases/${PUBLICATION_VERSION}`;
const candidateDirectory = 'dpp-research/candidates/0.2.0';
const baselineDirectory = 'dpp-research/releases/0.1.0';
const owner = { atlas_release_state: PUBLICATION_STATE, atlas_release_version: PUBLICATION_VERSION };
const json = async file => JSON.parse(await readFile(file, 'utf8'));
const encode = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');

async function write(file, bytes) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

async function fixture(context) {
  const temporaryRoot = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(temporaryRoot, 'spherity-publication-test-'));
  context.after(async () => {
    // Only remove this test's known, absolute temporary directory.
    assert.equal(path.dirname(directory), temporaryRoot);
    assert.ok(path.basename(directory).startsWith('spherity-publication-test-'));
    await rm(directory, { recursive: true, force: true });
  });
  for (const relative of [releaseDirectory, candidateDirectory, baselineDirectory, 'dpp-explorer/publication.json']) {
    const target = path.join(directory, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await cp(path.join(repository, relative), target, { recursive: true });
  }
  return { repositoryRoot: directory, releaseRoot: path.join(directory, releaseDirectory), siteDirectory: path.join(directory, '_site') };
}

async function editJson(file, mutate) {
  const value = await json(file);
  mutate(value);
  await write(file, encode(value));
}

// Recompute every technical checksum after intentional fixture tampering. This
// proves the semantic/publication gates cannot be bypassed by merely repinning.
async function repin(fixture, mutateManifest = () => {}) {
  const manifestFile = path.join(fixture.releaseRoot, 'manifest.json');
  const manifest = await json(manifestFile);
  for (const name of Object.keys(manifest.files)) {
    manifest.files[name] = sha256(await readFile(path.join(fixture.releaseRoot, name)));
  }
  mutateManifest(manifest);
  const bytes = encode(manifest);
  await write(manifestFile, bytes);
  await write(path.join(fixture.releaseRoot, 'checksums.sha256'),
    [...Object.entries(manifest.files).map(([name, digest]) => `${digest}  ${name}`), `${sha256(bytes)}  manifest.json`].join('\n') + '\n');
  await editJson(path.join(fixture.repositoryRoot, 'dpp-explorer/publication.json'), pointer => {
    pointer.manifest_sha256 = sha256(bytes);
    pointer.dataset_sha256 = manifest.files['dataset.json'];
  });
}

async function deliver(fixture) {
  const release = await loadPublishedRelease(fixture);
  const atlas = path.join(fixture.siteDirectory, 'dpp-explorer');
  for (const [name, bytes] of release.outputs) await write(path.join(atlas, 'releases', PUBLICATION_VERSION, name), bytes);
  for (const [target, source] of [
    ['current-dataset.json', 'dataset.json'],
    ['current-release-manifest.json', 'manifest.json'],
    ['knowledge-graph.json', 'views/graph.json']
  ]) await write(path.join(atlas, 'data', target), release.outputs.get(source));
  return release;
}

test('the committed publication loads as a technically sealed, explicitly licensed research snapshot', async context => {
  const copy = await fixture(context);
  const release = await loadPublishedRelease(copy);
  assert.equal(release.published, true);
  assert.equal(release.manifest.sealed, true);
  assert.equal(release.manifest.seal_scope, 'technical_integrity_only');
  assert.equal(release.dataset.metadata.release_status, 'research_seed');
  assert.equal(release.dataset.metadata.review_status, 'machine_assisted_unreviewed');
  assert.equal(release.publication.independent_review_completed, false);
  assert.equal(release.publication.license, 'https://creativecommons.org/licenses/by/4.0/');
  assert.equal(release.validation.human_reviewed_assertions, 0);
  assert.ok(release.dataset.assertions.every(row => row.review_status === 'machine_assisted_unreviewed'));
  const candidate = await json(path.join(copy.repositoryRoot, candidateDirectory, 'dataset.json'));
  for (const collection of ['entities', 'assertions', 'sources']) assert.deepEqual(release.dataset[collection], candidate[collection]);
  const delivered = await deliver(copy);
  assert.deepEqual((await verifyAtlasPublication(owner, copy)).dataset, delivered.dataset);
});

test('a missing archive manifest cannot be replaced by an owner publication flag', async context => {
  const copy = await fixture(context);
  await rm(path.join(copy.releaseRoot, 'manifest.json'));
  await assert.rejects(loadPublishedRelease(copy), { code: 'ENOENT' });
  await assert.rejects(verifyAtlasPublication(owner, copy), { code: 'ENOENT' });
});

test('changed archive bytes and a changed pinned manifest digest fail before publication', async context => {
  const copy = await fixture(context);
  const datasetFile = path.join(copy.releaseRoot, 'dataset.json');
  const original = await readFile(datasetFile);
  await write(datasetFile, Buffer.concat([original, Buffer.from(' ')]));
  await assert.rejects(loadPublishedRelease(copy), /Published release checksum mismatch: dataset\.json/);
  await write(datasetFile, original);
  await editJson(path.join(copy.repositoryRoot, 'dpp-explorer/publication.json'), pointer => { pointer.manifest_sha256 = '0'.repeat(64); });
  await assert.rejects(loadPublishedRelease(copy), /manifest checksum mismatch/);
});

test('an unsealed or false publication manifest stays blocked even when its checksums are repinned', async context => {
  for (const [name, mutate, message] of [
    ['unsealed', manifest => { manifest.sealed = false; }, /requires a sealed research-seed release/],
    ['candidate status', manifest => { manifest.release_status = 'candidate'; }, /requires a sealed research-seed release/],
    ['nontechnical seal', manifest => { manifest.seal_scope = 'scientific_review'; }, /must not imply completed human review/]
  ]) await context.test(name, async child => {
    const copy = await fixture(child);
    await repin(copy, mutate);
    await assert.rejects(loadPublishedRelease(copy), message);
  });
});

test('publication pointer, owner, manifest and dataset versions must agree', async context => {
  for (const [name, file, mutate, message] of [
    ['pointer state', 'pointer', value => { value.state = 'candidate'; }, /Unsupported Atlas publication state\/version/],
    ['pointer version', 'pointer', value => { value.version = '0.1.0'; }, /Unsupported Atlas publication state\/version/],
    ['archive path', 'pointer', value => { value.release_directory = candidateDirectory; }, /immutable release directory/],
    ['manifest version', 'manifest', value => { value.version = '0.1.0'; }, /requires a sealed research-seed release/],
    ['dataset version', 'dataset.json', value => { value.metadata.version = '0.1.0'; }, /Dataset does not match published research release/],
    ['publication state', 'publication.json', value => { value.state = 'candidate'; }, /Invalid publication qualification/]
  ]) await context.test(name, async child => {
    const copy = await fixture(child);
    if (file === 'pointer') await editJson(path.join(copy.repositoryRoot, 'dpp-explorer/publication.json'), mutate);
    else if (file === 'manifest') await repin(copy, mutate);
    else { await editJson(path.join(copy.releaseRoot, file), mutate); await repin(copy); }
    await assert.rejects(loadPublishedRelease(copy), message);
  });
  const copy = await fixture(context);
  for (const invalidOwner of [{ ...owner, atlas_release_state: 'candidate' }, { ...owner, atlas_release_version: '0.1.0' }, {}]) {
    await assert.rejects(verifyAtlasPublication(invalidOwner, copy), /owner must declare its verified research release/);
  }
});

test('technical sealing cannot invent completed human review at any evidence level', async context => {
  for (const [name, file, mutate, message] of [
    ['manifest', 'manifest', value => { value.review_status = 'human_reviewed'; }, /must not imply completed human review/],
    ['dataset', 'dataset.json', value => { value.metadata.review_status = 'human_reviewed'; }, /Dataset review status must remain qualified/],
    ['entity', 'dataset.json', value => { value.entities[0].review_status = 'human_reviewed'; }, /Human review cannot be conferred/],
    ['assertion', 'dataset.json', value => { value.assertions[0].review_status = 'human_reviewed'; }, /Unsubstantiated human review/],
    ['validation report', 'validation-report.json', value => { value.human_reviewed_assertions = 1; }, /validation\/counts mismatch/],
    ['publication', 'publication.json', value => { value.independent_review_completed = true; }, /Invalid publication qualification/],
    ['publication review status', 'publication.json', value => { value.review_status = 'human_reviewed'; }, /must preserve its unreviewed research-seed qualification/],
    ['publication review count', 'publication.json', value => { value.human_reviewed_assertions = 1; }, /must preserve its unreviewed research-seed qualification/],
    ['publication release class', 'publication.json', value => { value.release_class = 'validated_release'; }, /must preserve its unreviewed research-seed qualification/],
    ['publication seal scope', 'publication.json', value => { value.seal_scope = 'scientific_review'; }, /must preserve its unreviewed research-seed qualification/]
  ]) await context.test(name, async child => {
    const copy = await fixture(child);
    if (file === 'manifest') await repin(copy, mutate);
    else { await editJson(path.join(copy.releaseRoot, file), mutate); await repin(copy); }
    await assert.rejects(loadPublishedRelease(copy), message);
  });
});

test('candidate provenance must remain byte-exact after publication', async context => {
  const copy = await fixture(context);
  const candidateDataset = path.join(copy.repositoryRoot, candidateDirectory, 'dataset.json');
  await write(candidateDataset, Buffer.concat([await readFile(candidateDataset), Buffer.from(' ')]));
  await assert.rejects(loadPublishedRelease(copy), /Original candidate checksum mismatch: dataset\.json/);
});

test('candidate checksums and dataset pins remain enforced after repinning the publication', async context => {
  await context.test('changed original checksums inventory', async child => {
    const copy = await fixture(child);
    const target = path.join(copy.repositoryRoot, candidateDirectory, 'checksums.sha256');
    await write(target, Buffer.concat([await readFile(target), Buffer.from(' ')]));
    await assert.rejects(loadPublishedRelease(copy), /candidate.*checksum/i);
  });
  for (const field of ['checksums_sha256', 'dataset_sha256']) await context.test(`incorrect ${field}`, async child => {
    const copy = await fixture(child);
    await editJson(path.join(copy.releaseRoot, 'publication.json'), publication => { publication.candidate_origin[field] = '0'.repeat(64); });
    await repin(copy);
    await assert.rejects(loadPublishedRelease(copy), /candidate.*(?:checksum|dataset)/i);
  });
});

test('the frozen baseline manifest and every covered artifact must remain byte-exact', async context => {
  for (const name of ['manifest.json', 'dataset.json', 'views/world-map.json']) await context.test(name, async child => {
    const copy = await fixture(child);
    const target = path.join(copy.repositoryRoot, baselineDirectory, name);
    await write(target, Buffer.concat([await readFile(target), Buffer.from(' ')]));
    await assert.rejects(loadPublishedRelease(copy), /baseline.*(?:manifest|checksum)/i);
  });
});

test('repinning a publication cannot remove or replace its preserved baseline reference', async context => {
  for (const [name, mutate] of [
    ['incorrect digest', value => { value.manifest_sha256 = '0'.repeat(64); }],
    ['incorrect directory', value => { value.directory = releaseDirectory; }],
    ['incorrect version', value => { value.version = PUBLICATION_VERSION; }]
  ]) await context.test(name, async child => {
    const copy = await fixture(child);
    await editJson(path.join(copy.releaseRoot, 'publication.json'), publication => mutate(publication.preserved_baseline));
    await repin(copy);
    await assert.rejects(loadPublishedRelease(copy), /baseline/i);
  });
});

test('delivery verification rejects changed immutable archive bytes', async context => {
  const copy = await fixture(context);
  await deliver(copy);
  const target = path.join(copy.siteDirectory, 'dpp-explorer/releases', PUBLICATION_VERSION, 'dataset.json');
  await write(target, Buffer.concat([await readFile(target), Buffer.from(' ')]));
  await assert.rejects(verifyAtlasPublication(owner, copy), /Delivered immutable release differs: dataset\.json/);
});

test('all current delivery pointers must exactly match the sealed archive', async context => {
  const copy = await fixture(context);
  await deliver(copy);
  for (const name of ['current-dataset.json', 'current-release-manifest.json', 'knowledge-graph.json']) {
    const target = path.join(copy.siteDirectory, 'dpp-explorer/data', name);
    const original = await readFile(target);
    await write(target, Buffer.concat([original, Buffer.from(' ')]));
    await assert.rejects(verifyAtlasPublication(owner, copy), error => {
      assert.equal(error.message, `Current Atlas pointer differs from sealed release: ${name}`);
      return true;
    });
    await write(target, original);
  }
});
