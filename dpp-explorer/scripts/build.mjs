import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { coverageHtml } from './coverage.mjs';
import { createGraphExport } from '../src/graph-export.js';
import { createModel } from '../src/model.js';
import { createRegulatoryModel } from '../src/regulation.js';
import { loadPublishedRelease, PUBLICATION_STATE } from './publication-release.mjs';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = path.dirname(projectRoot);
const sourceRoot = path.join(projectRoot, 'src');
const releaseRoot = path.join(workspaceRoot, 'dpp-research', 'releases', '0.1.0');
const candidateRoot = path.join(workspaceRoot, 'dpp-research', 'candidates', '0.2.0');
const distRoot = path.join(projectRoot, 'dist');
const integrationRoot = path.join(projectRoot, 'integration', 'docs', 'dpp-explorer');
const structuralTypes = new Set(['Jurisdiction', 'Sector', 'Concept']);

export function containedPath(root, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || relativePath.includes('\0') || path.isAbsolute(relativePath)) {
    throw new Error('Expected a non-empty relative path.');
  }
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Path escapes the intended directory: ${relativePath}`);
  }
  return resolved;
}

async function ensureNoSymlinks(root, target) {
  const relative = path.relative(root, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Refusing a path outside the intended directory.');
  }
  let current = root;
  for (const segment of ['', ...relative.split(path.sep).filter(Boolean)]) {
    if (segment) current = path.join(current, segment);
    try {
      if ((await fs.lstat(current)).isSymbolicLink()) throw new Error(`Refusing symbolic link: ${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

async function filesBelow(root, relative = '') {
  const folder = relative ? containedPath(root, relative) : root;
  await ensureNoSymlinks(workspaceRoot, folder);
  const entries = await fs.readdir(folder, { withFileTypes: true });
  const result = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (entry.isSymbolicLink()) throw new Error(`Refusing symbolic link: ${entry.name}`);
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) result.push(...await filesBelow(root, name));
    else if (entry.isFile()) result.push(name);
    else throw new Error(`Unsupported source file: ${name}`);
  }
  return result;
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const human = value => String(value ?? '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
const hash = content => crypto.createHash('sha256').update(content).digest('hex');

function externalLink(url, label) {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Unsupported URL');
    return `<a href="${escapeHtml(parsed.href)}" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
  } catch {
    return escapeHtml(label);
  }
}

export function catalogueHtml(dataset, { filename = 'catalogue.html' } = {}) {
  const update = dataset.metadata.evidence_updates;
  const isCandidate=dataset.metadata.release_status==='candidate';
  const isSuccessor = dataset.metadata.schema_version === '0.2.0';
  const archivePath = `${isCandidate ? 'candidates' : 'releases'}/${dataset.metadata.version}`;
  const edition = isCandidate?`Candidate ${dataset.metadata.version} · schema ${dataset.metadata.schema_version}`:isSuccessor ? `Research release ${dataset.metadata.version}` : update ? `Baseline ${dataset.metadata.version} + evidence update ${update.checked_at}` : `Release ${dataset.metadata.version}`;
  const updateNotice = isSuccessor?`<p><strong>${isCandidate ? 'Candidate evidence edition' : 'Frozen research release'} · evidence cut-off ${escapeHtml(dataset.metadata.evidence_cutoff)}.</strong> Corrections retain before/after history; superseded assertions remain visible below but are excluded from active graph edges. <a href="data/current-change-manifest.json" download>Inspect change history</a>. Original release 0.1.0 is preserved unchanged. Freezing an edition does not confer qualified human review.</p>`:update ? `<p><strong>Dated evidence update: ${escapeHtml(update.checked_at)}.</strong> ${escapeHtml(update.description)} <a href="data/evidence-updates.json" download>Inspect the additive update JSON</a>. The baseline evidence cut-off below still applies to unchanged records.</p>` : '';
  const entities = new Map(dataset.entities.map(entity => [entity.id, entity]));
  const sources = new Map(dataset.sources.map(source => [source.id, source]));
  const records = dataset.entities.filter(entity => !structuralTypes.has(entity.type)).sort((a, b) => a.label.localeCompare(b.label, 'en'));
  const sourceRefs = ids => [...new Set(ids ?? [])].map(id => `<a href="#source-${escapeHtml(id)}">${escapeHtml(sources.get(id)?.title || id)}</a>`).join('; ') || 'No source reference recorded';
  const names = ids => (ids ?? []).map(id => entities.get(id)?.label || id).map(escapeHtml).join(', ') || 'Not specified';
  const limits = values => values?.length ? `<ul class="limits">${values.map(value => `<li>${escapeHtml(value)}</li>`).join('')}</ul>` : '';
  const dateList = dates => dates?.length ? `<ul>${dates.map(date => `<li><strong>${escapeHtml(human(date.kind))}:</strong> ${escapeHtml(date.date || 'Conditional / not fixed')} (${escapeHtml(date.precision)}). ${date.condition ? `${escapeHtml(date.condition)}. ` : ''}${sourceRefs(date.source_ids)}</li>`).join('')}</ul>` : '<p>No dated event recorded.</p>';
  const recordHtml = records.map(entity => {
    const assertions = dataset.assertions.filter(assertion => assertion.subject === entity.id || assertion.object?.entity_id === entity.id);
    const assertionsHtml = assertions.map(assertion => `<li id="assertion-${escapeHtml(entity.id)}-${escapeHtml(assertion.id)}"><p><code>${escapeHtml(assertion.id)}</code>${assertion.curation?` · <strong>Superseded</strong> (${escapeHtml(assertion.curation.reason)})`:''}</p><p><strong>${escapeHtml(human(assertion.predicate))}:</strong> ${escapeHtml(assertion.statement)}</p><p class="meta">${escapeHtml(human(assertion.assertion_type))} · ${escapeHtml(human(assertion.evidence_type))} · Observed ${escapeHtml(assertion.observed_at || 'not recorded')} · ${escapeHtml(human(assertion.review_status))}</p>${assertion.locator ? `<p>Locator: ${escapeHtml(assertion.locator)}</p>` : ''}${assertion.valid_from || assertion.valid_to ? `<p>Recorded validity: ${escapeHtml(assertion.valid_from || 'start unspecified')} to ${escapeHtml(assertion.valid_to || 'end unspecified')}.</p>` : ''}<p>Sources: ${sourceRefs(assertion.source_ids)}</p>${limits(assertion.limitations)}${assertion.interoperability ? `<details><summary>Bounded interoperability evidence</summary><pre>${escapeHtml(JSON.stringify(assertion.interoperability, null, 2))}</pre></details>` : ''}</li>`).join('');
    return `<article id="${escapeHtml(entity.id)}"><p class="eyebrow">${escapeHtml(human(entity.type))}</p><h2>${escapeHtml(entity.label)}</h2><p>${escapeHtml(entity.description)}</p><dl><dt>Record ID</dt><dd><code>${escapeHtml(entity.id)}</code></dd><dt>Recorded status</dt><dd>${escapeHtml(human(entity.status?.value))} · as of ${escapeHtml(entity.status?.as_of)}</dd><dt>Scope qualification</dt><dd>${escapeHtml(entity.status?.scope_note)}</dd><dt>Jurisdictions</dt><dd>${names(entity.jurisdiction_ids)}</dd><dt>Sectors</dt><dd>${names(entity.sector_ids)}</dd><dt>Version</dt><dd>${escapeHtml(entity.version || 'Not specified')}</dd><dt>Evidence</dt><dd>${escapeHtml(human(entity.evidence_status))}</dd><dt>Review</dt><dd>${escapeHtml(human(entity.review_status))}</dd></dl>${limits(entity.limitations)}<p>Record sources: ${sourceRefs(entity.source_ids)}</p><details><summary>Dates, relationships and provenance (${assertions.length} coded assertions)</summary>${dateList(entity.dates)}<ol class="assertions">${assertionsHtml || '<li>No assertion involving this entity is coded in this release.</li>'}</ol></details><p><a href="index.html?view=graph&amp;focus=${encodeURIComponent(entity.id)}">Explore this record in the graph →</a></p></article>`;
  }).join('\n');
  const sourceHtml = dataset.sources.map(source => `<li id="source-${escapeHtml(source.id)}"><h3>${externalLink(source.url, source.title)}</h3><p>${escapeHtml(source.publisher)} · ${escapeHtml(human(source.source_type))} · ${escapeHtml(source.language || 'Language unspecified')}</p><p class="meta"><code>${escapeHtml(source.id)}</code> · Resource identity: ${escapeHtml(source.source_identity_id||source.id)}<br>Access: ${escapeHtml(human(source.access_status))}. Retrieved: ${escapeHtml(source.retrieved_at || 'not recorded in release')}.</p>${limits(source.limitations)}<p>Research dossier: ${(source.dossier_files ?? []).map(file => ['eu-legal-evidence.md','global-jurisdictions-evidence.md','standards-ecosystem-evidence.md','untp-w3c-evidence.md'].includes(file)?`<a href="data/provenance/${encodeURIComponent(file)}">${escapeHtml(file)}</a>`:`${escapeHtml(file)} (retained reference; not redistributed)`).join('; ') || 'Not specified'}</p></li>`).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="${isCandidate ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'}"><link rel="canonical" href="https://spherity.github.io/spherity-research/dpp-explorer/${escapeHtml(filename)}"><link rel="stylesheet" href="../assets/site.css"><title>Global DPP Atlas — Evidence Catalogue, ${escapeHtml(edition)} | Spherity Research</title><meta name="description" content="Source-backed catalogue of Digital Product Passport law, standards and ecosystem records, with dates, access limitations and qualified relationships from a frozen research baseline and clearly dated evidence updates."><style>
:root{color-scheme:light;font:17px/1.6 system-ui,sans-serif;color:#24292f;background:#f6f8fa}*{box-sizing:border-box}body{margin:0}main,header,footer{max-width:1100px;margin:auto;padding:2rem}header{border-bottom:1px solid #ddd5e6}a{color:#0969da;text-underline-offset:3px}a:focus-visible,summary:focus-visible{outline:3px solid #0969da;outline-offset:4px}h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.15}h2{font-size:1.6rem;line-height:1.25}h3{font-size:1.1rem}article{border-top:1px solid #d8d1e1;padding:2rem 0;scroll-margin-top:1rem}.eyebrow,.meta{font-size:.85rem;color:#625771}.eyebrow{letter-spacing:.09em;text-transform:uppercase}nav{display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap}a.contact-spherity{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid #218577;border-radius:8px;background:#7ee4c1;color:#102636;font-size:13px;font-weight:700;line-height:1.3;text-decoration:none;white-space:nowrap}a.contact-spherity:hover{background:#a1efd5}a.contact-spherity:focus-visible{outline:3px solid #218577;outline-offset:3px}.notice{padding:1.25rem;background:#e8f1fc;border-left:4px solid #0969da}.index{columns:2;column-gap:3rem}.index li{break-inside:avoid;margin:.4rem 0}dl{display:grid;grid-template-columns:11rem 1fr;gap:.4rem 1rem}dt{font-weight:650}dd{margin:0}details{border:1px solid #e3ddea;border-radius:8px;padding:.8rem 1rem;margin:1rem 0}summary{cursor:pointer;font-weight:650}.assertions>li{padding:.5rem 0;border-bottom:1px solid #eee}.limits{color:#684b36}.sources>li{margin-bottom:2rem;scroll-margin-top:1rem}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.8rem}footer{border-top:1px solid #ddd5e6;font-size:.85rem}@media(max-width:650px){.index{columns:1}dl{grid-template-columns:1fr;gap:0}dd{margin-bottom:.75rem}main,header,footer{padding:1.2rem}}@media print{details{display:block}details>*{display:block}a{color:inherit}article{break-inside:avoid}}
</style></head><body><header><nav aria-label="Research navigation"><a href="index.html">← Interactive atlas</a><a href="../">Spherity Research</a><a href="../global-digital-product-passport-regulation.html">Research overview</a><a href="#sources">Source register</a><a href="rights.html">Rights and provenance</a><a class="contact-spherity" href="https://www.spherity.com/contact" rel="external">Contact Spherity <span aria-hidden="true">↗</span></a></nav><p class="eyebrow">Global DPP Atlas · ${escapeHtml(edition)}</p><h1>Digital Product Passport evidence catalogue</h1><p>Law, standards and ecosystem records with their recorded sources and limitations. Edition evidence cut-off: <strong>${escapeHtml(dataset.metadata.evidence_cutoff)}</strong>.</p>${updateNotice}</header><main><div class="notice"><strong>Research seed — qualified human review pending.</strong><p>${escapeHtml(dataset.metadata.coverage_statement)}</p>${limits(dataset.metadata.limitations)}<p>Records and relationships retain their research qualifications. A technical standard, a legal obligation and a pilot are different kinds of evidence.</p></div><p>${records.length} substantive records are listed below. Geography and analytical vocabulary scaffolding are excluded. This catalogue contains ${dataset.entities.length} entities, ${dataset.assertions.length} assertions and ${dataset.sources.length} sources${update ? ", including the dated additive update" : " from the frozen release"}.</p><nav aria-label="Research downloads"><a href="data/knowledge-graph.json" download>Download knowledge graph JSON</a><a href="data/current-dataset.json" download>Current evidence dataset JSON</a><a href="data/dataset.json" download>Frozen baseline JSON</a><a href="data/dataset.jsonld" download>Frozen baseline JSON-LD</a><a href="${escapeHtml(archivePath)}/research-protocol.md">Edition research protocol</a><a href="${escapeHtml(archivePath)}/graph-schema.md">Edition graph schema</a><a href="data/current-validation-report.json">Edition validation report</a></nav><h2>Record index</h2><ol class="index">${records.map(entity => `<li><a href="#${escapeHtml(entity.id)}">${escapeHtml(entity.label)}</a></li>`).join('')}</ol>${recordHtml}<section id="sources"><h2>Source register</h2><p>Each source retains its own access status and retrieval date, including sources checked for the dated update. A source link is not a claim that its complete contents were reviewed.</p><ol class="sources">${sourceHtml}</ol></section></main><footer><p>${escapeHtml(dataset.metadata.rights_statement)}</p><p>Generated for evidence edition ${escapeHtml(dataset.metadata.version)}${update ? ` with additive evidence checked ${escapeHtml(update.checked_at)}` : ""}. The frozen baseline is available unchanged. This catalogue does not infer absence of law from missing evidence.</p><a class="contact-spherity" href="https://www.spherity.com/contact" rel="external">Contact Spherity <span aria-hidden="true">↗</span></a></footer></body></html>\n`;
}

export async function build({ checkOnly = false } = {}) {
  await ensureNoSymlinks(workspaceRoot, projectRoot);
  await ensureNoSymlinks(workspaceRoot, releaseRoot);
  const datasetBytes = await fs.readFile(path.join(releaseRoot, 'dataset.json'));
  const baseline = JSON.parse(datasetBytes);
  if (baseline.metadata?.version !== '0.1.0') throw new Error('Expected immutable release 0.1.0.');
  if (!Array.isArray(baseline.entities) || !Array.isArray(baseline.sources) || !Array.isArray(baseline.assertions)) throw new Error('Invalid release structure.');
  const publication = await loadPublishedRelease();
  if (!publication.published) throw new Error('Atlas delivery requires a verified published research release.');
  const {dataset,taxonomy,regulatory:regulatoryReview}=publication;
  const map=publication.views.world_map;
  createRegulatoryModel(createModel(dataset,map,taxonomy),regulatoryReview);
  const sourceFiles = await filesBelow(sourceRoot);
  const provenanceFiles = await filesBelow(path.join(releaseRoot, 'provenance'));
  const archivedFiles = await filesBelow(releaseRoot);
  const releaseFiles = [
    ['dataset.json', 'data/dataset.json'], ['dataset.jsonld', 'data/dataset.jsonld'],
    ['views/world-map.json', 'data/world-map.json'], ['validation-report.json', 'data/validation-report.json'],
    ['research-protocol.md', 'data/research-protocol.md'], ['graph-schema.md', 'data/graph-schema.md'],
    ['context.jsonld', 'data/context.jsonld'], ['manifest.json', 'data/release-manifest.json'],
    ['checksums.sha256', 'data/release-checksums.sha256'],
    ...archivedFiles.map(file => [file, `releases/0.1.0/${file}`]),
    ...provenanceFiles.map(file => [`provenance/${file}`, `data/provenance/${file}`])
  ];
  const planned = new Map();
  for (const file of sourceFiles) planned.set(file, { source: containedPath(sourceRoot, file) });
  for (const [source, destination] of releaseFiles) {
    if (planned.has(destination)) throw new Error(`Source file would overwrite frozen release content: ${destination}`);
    const input = containedPath(releaseRoot, source);
    await ensureNoSymlinks(workspaceRoot, input);
    await fs.access(input);
    planned.set(destination, { source: input });
  }
  if (planned.has('catalogue.html') || planned.has('build-manifest.json')) throw new Error('Generated file collides with a source file.');
  // Current downloads are exact bytes from the verified immutable release.
  const currentFiles = {
    'data/current-dataset.json': 'dataset.json',
    'data/current-dataset.schema.json': 'dataset.schema.json',
    'data/current-dataset.jsonld': 'dataset.jsonld',
    'data/current-world-map.json': 'views/world-map.json',
    'data/current-ecosystems.json': 'views/ecosystems.json',
    'data/current-regulatory-phases.json': 'views/regulatory-phases.json',
    'data/current-regulatory-calendar.json': 'views/regulatory-calendar.json',
    'data/regulatory-calendar.json': 'views/regulatory-calendar.json',
    'data/current-timeline.json': 'views/timeline.json',
    'data/current-standards.json': 'views/standards.json',
    'data/current-review-queue.json': 'views/review-queue.json',
    'data/current-validation-report.json': 'validation-report.json',
    'data/current-change-manifest.json': 'change-manifest.json',
    'data/current-release-manifest.json': 'manifest.json',
    'data/knowledge-graph.json': 'views/graph.json'
  };
  for (const [file, archivedFile] of Object.entries(currentFiles)) {
    if (planned.has(file)) throw new Error('Generated file collides with a source file: ' + file);
    const content = publication.outputs.get(archivedFile);
    if (!content) throw new Error('Published release is missing current download: ' + archivedFile);
    planned.set(file, { content });
  }
  planned.set('data/knowledge-graph-0.1.0.json', {
    content: Buffer.from(JSON.stringify(createGraphExport(baseline, { exportedAt: null, includeSemantic: false }), null, 2) + '\n')
  });
  for (const file of await filesBelow(candidateRoot)) {
    planned.set(`candidates/0.2.0/${file}`, { source: containedPath(candidateRoot, file) });
  }
  for (const [file, content] of publication.outputs) {
    planned.set(`releases/${dataset.metadata.version}/${file}`, { content });
  }
  planned.set('catalogue.html', { content: Buffer.from(catalogueHtml(dataset), 'utf8') });
  const historicalCatalogue=catalogueHtml(baseline,{filename:'catalogue-0.1.0.html'}).replaceAll('data/current-dataset.json','data/dataset.json').replaceAll('data/knowledge-graph.json','data/knowledge-graph-0.1.0.json').replaceAll('data/current-validation-report.json','data/validation-report.json').replaceAll('Edition validation report','Frozen baseline validation report').replaceAll('Edition research protocol','Frozen baseline research protocol').replaceAll('Edition graph schema','Frozen baseline graph schema').replaceAll('index.html?view=','index.html?release=0.1.0&amp;view=').replaceAll('href="index.html"','href="index.html?release=0.1.0"');
  planned.set('catalogue-0.1.0.html',{content:Buffer.from(historicalCatalogue,'utf8')});
  const figureRoot = path.join(workspaceRoot, 'dpp-research/figures/landscape-world-map');
  const coverageRows = JSON.parse(await fs.readFile(path.join(figureRoot, 'coverage-table.json'), 'utf8'));
  const figureCaption = await fs.readFile(path.join(figureRoot, 'caption.md'), 'utf8');
  planned.set('coverage.html', { content: Buffer.from(coverageHtml(coverageRows, figureCaption), 'utf8') });
  const entries = [];
  for (const [file, item] of [...planned.entries()].sort(([a], [b]) => a.localeCompare(b, 'en'))) {
    const content = item.content ?? await fs.readFile(item.source);
    entries.push({ file, bytes: content.length, sha256: hash(content) });
    item.content = content;
  }
  const report = { release: dataset.metadata.version, publication_state:PUBLICATION_STATE, candidate_id:dataset.metadata.candidate_id, schema_version:dataset.metadata.schema_version,evidence_cutoff: dataset.metadata.evidence_cutoff, baseline_version:baseline.metadata.version,dataset_sha256: hash(datasetBytes), evidence_updates: dataset.metadata.evidence_updates, current_dataset_sha256: hash(planned.get('data/current-dataset.json').content), ...publication.validation.counts, files: entries };
  planned.set('build-manifest.json', { content: Buffer.from(`${JSON.stringify(report, null, 2)}\n`) });
  for (const outputRoot of [distRoot, integrationRoot]) {
    await ensureNoSymlinks(projectRoot, outputRoot);
    for (const relative of planned.keys()) await ensureNoSymlinks(projectRoot, containedPath(outputRoot, relative));
  }
  if (!checkOnly) {
    for (const outputRoot of [distRoot, integrationRoot]) {
      for (const [relative, item] of planned) {
        const destination = containedPath(outputRoot, relative);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, item.content);
      }
    }
  }
  return { ...report, check_only: checkOnly, dist: distRoot, integration: integrationRoot };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(argument => argument !== '--check')) {
    console.error('Usage: node scripts/build.mjs [--check]');
    process.exitCode = 1;
  } else {
    try {
      const result = await build({ checkOnly: args.includes('--check') });
      console.log(`${result.check_only ? 'Checked' : 'Built'} research release ${result.release}; evidence through ${result.evidence_cutoff}: ${result.substantive_records} records; ${result.files.length + 1} files.\nDist: ${result.dist}\nGitHub Pages integration: ${result.integration}`);
    } catch (error) {
      console.error(`Build failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
