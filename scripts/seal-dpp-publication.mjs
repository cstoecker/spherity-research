import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCandidate, candidateJsonLd, validateCandidate } from '../dpp-explorer/scripts/candidate-release.mjs';
import { createGraphExport } from '../dpp-explorer/src/graph-export.js';
import { PUBLICATION_STATE, PUBLICATION_VERSION, sha256, loadPublishedRelease } from '../dpp-explorer/scripts/publication-release.mjs';

// Explicit, one-time publication preparation. Ordinary site builds only verify
// the committed release; they never re-seal or overwrite either archive.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const encode = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const target = path.join(root, `dpp-research/releases/${PUBLICATION_VERSION}`);
const pointerPath = path.join(root, 'dpp-explorer/publication.json');
if (process.argv.slice(2).join(' ') !== '--write') throw new Error('Usage: node scripts/seal-dpp-publication.mjs --write (fails if this release exists)');
for (const location of [target, pointerPath]) {
  if (await fs.stat(location).catch(error => { if (error.code !== 'ENOENT') throw error; return null; })) throw new Error(`Refusing to overwrite an existing publication: ${location}`);
}
const candidate = await loadCandidate();
const candidateDirectory = 'dpp-research/candidates/0.2.0';
for (const [name, expected] of candidate.outputs) {
  const actual = await fs.readFile(path.join(root, candidateDirectory, name));
  if (!actual.equals(expected)) throw new Error(`Candidate inputs no longer reproduce the archived candidate: ${name}`);
}
const rights = 'Original data, annotations and compilation in Global DPP Atlas research release 0.2.0 are © 2026 Dr. Carsten Stöcker and licensed under Creative Commons Attribution 4.0 International (https://creativecommons.org/licenses/by/4.0/). Attribute the author, release version and canonical Atlas, link the licence and indicate changes. Third-party standards, laws, quotations and other source materials retain their original terms; this grant covers no rights the author does not hold. Software, fonts, geographic boundaries and trademarks retain their separate terms. The frozen 0.1.0 release and the original 0.2.0 candidate retain their historical rights statements.';
const publication = {
  state: PUBLICATION_STATE, version: PUBLICATION_VERSION, prepared_at: new Date().toISOString(),
  evidence_cutoff: candidate.dataset.metadata.evidence_cutoff,
  release_class: 'research_seed', seal_scope: 'technical_integrity_only',
  seal_explanation: 'Fixes the exact bytes of this research snapshot. It is not independent human review, legal verification, peer review or interoperability certification.',
  independent_review_completed: false, review_status: 'machine_assisted_unreviewed',
  human_reviewed_assertions: 0,
  license: 'https://creativecommons.org/licenses/by/4.0/',
  license_scope: 'original_data_annotations_and_compilation',
  copyright_holder: 'Dr. Carsten Stöcker',
  rights_statement: rights,
  license_decision: 'CC BY 4.0 expressly selected by the author for the new Atlas release during PR #31 preparation on 25 October 2026; not inferred from the manuscript licence.',
  third_party_exclusions: ['Standards and normative texts', 'Laws, source quotations and other third-party materials', 'Software and bundled fonts', 'Natural Earth geometry retains its public-domain status', 'Spherity names, logos and trademarks'],
  canonical_url: 'https://spherity.github.io/spherity-research/dpp-explorer/',
  paper_url: 'https://spherity.github.io/spherity-research/global-digital-product-passport-regulation.html',
  citation: 'Stöcker, C. (2026). Global DPP Atlas: research snapshot 0.2.0. Spherity Research. Evidence cutoff 25 October 2026. Machine-assisted; qualified human review pending.',
  candidate_origin: {
    directory: candidateDirectory,
    candidate_id: candidate.dataset.metadata.candidate_id,
    manifest_sha256: sha256(candidate.outputs.get('manifest.json')),
    checksums_sha256: sha256(candidate.outputs.get('checksums.sha256')),
    dataset_sha256: sha256(candidate.outputs.get('dataset.json')),
    evidence_changes_on_promotion: 0
  },
  preserved_baseline: {
    version: '0.1.0', directory: 'dpp-research/releases/0.1.0',
    manifest_sha256: sha256(await fs.readFile(path.join(root, 'dpp-research/releases/0.1.0/manifest.json'))),
    interpretation: 'The paper continues to cite this original evidence baseline; its bytes, licence statement and qualifications are unchanged.'
  },
  review_boundary: [
    'No independent human, legal or scientific review is claimed by this publication transition.',
    'All 268 entities and 364 assertions retain their exact candidate review statuses, sources, dates, limitations and correction history.',
    'A source link or opened catalogue does not imply full normative-text review.',
    'No live registry transaction or independent interoperability experiment was performed.',
    'Protocol requirements for a second qualified review before findings are finalised remain outstanding.'
  ]
};
const dataset = structuredClone(candidate.dataset);
dataset.metadata.title = 'Global DPP Atlas — research snapshot 0.2.0';
dataset.metadata.release_status = 'research_seed';
dataset.metadata.rights_statement = rights;
dataset.metadata.limitations = dataset.metadata.limitations.map(value => value === 'Unsealed candidate release: computational validation is not independent human review.' ? 'Technically sealed research snapshot: computational validation is not independent human review.' : value);
const schema = structuredClone(candidate.schema);
schema.title = 'Global DPP Atlas research dataset schema 0.2.0';
schema.$defs.Metadata.properties.candidate_id.description = 'Identifier of the preserved candidate from which this research snapshot originated.';
const validation = validateCandidate(dataset, schema, candidate.changeManifest, candidate.calendar);
const graph = createGraphExport(dataset, { exportedAt: null, regulatoryProfiles: candidate.regulatory });
const jsonld = candidateJsonLd(dataset);
jsonld['@graph'][0]['@id'] = `${dataset.metadata.namespace}release:${PUBLICATION_VERSION}`;
jsonld['@graph'][0]['prov:wasDerivedFrom'] = [{ '@id': `${dataset.metadata.namespace}candidate:${dataset.metadata.candidate_id}` }];
jsonld['@graph'][0]['dct:license'] = { '@id': publication.license };
jsonld['@graph'][0]['dct:rights'] = rights;
const outputs = new Map(candidate.outputs);
outputs.delete('manifest.json'); outputs.delete('checksums.sha256');
for (const [name, value] of [['dataset.json', dataset], ['dataset.schema.json', schema], ['dataset.jsonld', jsonld], ['validation-report.json', validation], ['views/graph.json', graph], ['publication.json', publication]]) outputs.set(name, encode(value));
outputs.set('README.md', Buffer.from(`# Global DPP Atlas research snapshot ${PUBLICATION_VERSION}\n\nEvidence cutoff: ${publication.evidence_cutoff}. Technically sealed research seed; qualified human review remains pending. The seal fixes bytes and does not certify the research.\n\n${validation.counts.substantive_records} substantive records, ${validation.counts.graph_edges} active graph edges, ${validation.counts.assertions} assertions (${validation.counts.active_assertions} active), ${validation.counts.sources} source observations.\n\nThe 0.2.0 candidate and 0.1.0 baseline remain unchanged. Publication promotion changes metadata, rights and packaging only; no entity, assertion or source is revised. Candidate IDs identify provenance, not the current publication state. The paper's frozen results continue to cite 0.1.0.\n\n## Reuse\n\n${rights}\n\n## Evidence boundary\n\nAll claims await qualified human review. No live registry transaction, EDC execution or independent interoperability reproduction was performed. Calendar targets remain distinct from operative obligations. See publication.json for the licence decision, technical seal scope and source-candidate hashes; change-manifest.json retains substantive correction history.\n`));
outputs.set('research-protocol.md', Buffer.from(candidate.outputs.get('research-protocol.md').toString().replace('# Candidate research protocol 0.2.0', '# Research snapshot protocol 0.2.0') + `\n## Publication amendment · 25 October 2026\n\nThe candidate is preserved as origin evidence. Research snapshot 0.2.0 is technically sealed for reproducibility with no changes to its entities, assertions or sources. All machine-assisted review qualifications remain. The predecessor protocol's second qualified human review remains a prerequisite for treating findings as independently reviewed; that review is not asserted here.\n\n${rights}\n\nThis amendment resolves the original-data licensing decision for the new release only. It does not change the historical baseline or candidate licences or grant rights to third-party content.\n`));
outputs.set('graph-schema.md', Buffer.from(candidate.outputs.get('graph-schema.md').toString().replace('# Candidate graph schema 0.2.0', '# Research snapshot graph schema 0.2.0') + '\nPublication state is separate from evidence review. The research_seed status retains graph wrapper 1.1.0, qualified assertions, supersession history and zero independently human-reviewed assertions.\n'));
const manifest = {
  ...candidate.manifest, title: dataset.metadata.title, release_status: 'research_seed',
  sealed: true, seal_scope: 'technical_integrity_only', prepared_at: publication.prepared_at,
  publication_record: 'publication.json', counts: validation.counts,
  source_candidate_manifest_sha256: publication.candidate_origin.manifest_sha256,
  change_summary: 'Publication packaging and explicit original-data CC BY 4.0 licence; no entity, assertion or source changes. Qualified human review remains pending.',
  files: Object.fromEntries([...outputs].map(([name, bytes]) => [name, sha256(bytes)]))
};
outputs.set('manifest.json', encode(manifest));
outputs.set('checksums.sha256', Buffer.from([...outputs].map(([name, bytes]) => `${sha256(bytes)}  ${name}`).join('\n') + '\n'));
// Target is a fixed new directory within this checkout. Never overwrite a seal.
await fs.mkdir(target, { recursive: false });
for (const [name, bytes] of outputs) {
  const destination = path.join(target, name);
  if (!destination.startsWith(target + path.sep)) throw new Error('Release output escaped its directory');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, bytes, { flag: 'wx' });
}
await fs.writeFile(pointerPath, encode({ state: PUBLICATION_STATE, version: PUBLICATION_VERSION, release_directory: `dpp-research/releases/${PUBLICATION_VERSION}`, manifest_sha256: sha256(outputs.get('manifest.json')), dataset_sha256: sha256(outputs.get('dataset.json')) }), { flag: 'wx' });
const verified = await loadPublishedRelease();
console.log(`Sealed and verified research snapshot ${verified.manifest.version}: ${verified.outputs.size} files; ${verified.validation.counts.substantive_records} records; independent human review remains pending.`);
