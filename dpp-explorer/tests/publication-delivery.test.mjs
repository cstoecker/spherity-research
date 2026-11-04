import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { catalogueHtml } from '../scripts/build.mjs';
import { coverageHtml } from '../scripts/coverage.mjs';

const readJson = async relative => JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'));
const canonical = html => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const robots = html => html.match(/<meta name="robots" content="([^"]+)"/)?.[1];

test('research release catalogues have distinct canonical URLs and retain evidence qualifications', async () => {
  const snapshot = await readJson('../../dpp-research/candidates/0.2.0/dataset.json');
  snapshot.metadata.release_status = 'research_seed';
  const current = catalogueHtml(snapshot);
  assert.equal(canonical(current), 'https://spherity.github.io/spherity-research/dpp-explorer/catalogue.html');
  assert.match(robots(current), /^index, follow/);
  assert.match(current, /Research release 0\.2\.0/);
  assert.match(current, /releases\/0\.2\.0\/research-protocol\.md/);
  assert.match(current, /releases\/0\.2\.0\/graph-schema\.md/);
  assert.match(current, /qualified human review pending/);
  assert.match(current, /Superseded/);
  assert.match(current, /Machine assisted unreviewed/i);
  assert.doesNotMatch(current, /Candidate research protocol|Candidate validation report/);

  const baseline = await readJson('../../dpp-research/releases/0.1.0/dataset.json');
  const historical = catalogueHtml(baseline, { filename: 'catalogue-0.1.0.html' });
  assert.equal(canonical(historical), 'https://spherity.github.io/spherity-research/dpp-explorer/catalogue-0.1.0.html');
  assert.match(robots(historical), /^index, follow/);
  assert.match(historical, /releases\/0\.1\.0\/research-protocol\.md/);
  assert.notEqual(canonical(current), canonical(historical));
});

test('an unsealed candidate catalogue remains explicitly unindexed', async () => {
  const candidate = await readJson('../../dpp-research/candidates/0.2.0/dataset.json');
  const html = catalogueHtml(candidate);
  assert.equal(robots(html), 'noindex, follow');
  assert.match(html, /candidates\/0\.2\.0\/research-protocol\.md/);
  assert.match(html, /Candidate 0\.2\.0/);
});

test('published coverage metadata preserves the complete frozen table and review limitations', async () => {
  const rows = await readJson('../../dpp-research/figures/landscape-world-map/coverage-table.json');
  const caption = await readFile(new URL('../../dpp-research/figures/landscape-world-map/caption.md', import.meta.url), 'utf8');
  const html = coverageHtml(rows, caption);
  assert.equal(canonical(html), 'https://spherity.github.io/spherity-research/dpp-explorer/coverage.html');
  assert.match(robots(html), /^index, follow/);
  assert.match(html, /All 52 geographic rows/);
  for (const row of rows) assert.ok(html.includes(`jurisdiction=${encodeURIComponent(row.id)}`));
  assert.match(html, /All substantive claims remain pending qualified human review/);
  assert.doesNotMatch(html, /Final manuscript LaTeX compilation/);
});
