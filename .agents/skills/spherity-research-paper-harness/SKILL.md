---
name: spherity-research-paper-harness
description: Integrate a Spherity Research paper with its research software (harness), Zenodo DOIs and reproducibility evidence into the Jekyll site — DOI citation metadata, a code-and-reproducibility section, SoftwareSourceCode JSON-LD, catalog card, cross-links and the paper/harness release order. Use when a paper ships with code (currently "Securing the Semantic Supply Chain" and the semantic supply chain harness), not for drafting content (spherity-research-authoring), generic page publishing (spherity-research-publishing) or Word-to-LaTeX production.
---

# Spherity Research: paper + harness integration

A paper with a harness is one citable argument with two records: the paper
(CC BY 4.0) and the software that produces its evidence (Apache-2.0). The
website is the canonical readable edition. Zenodo holds the versions of record.
The GitHub tag holds the exact source. This skill connects the three without
copying bytes or claims between them.

This skill adds to the existing skills. It does not replace them:

- Page mechanics, template, figures, social cards, sitemap and checks:
  [spherity-research-publishing](../spherity-research-publishing/SKILL.md).
- Claims, prior-art gate, confidentiality and disclosure:
  [spherity-research-authoring](../spherity-research-authoring/SKILL.md).
- Deposits, gates and DOIs: [zenodo/README.md](../../../zenodo/README.md) and
  [zenodo/registry.yml](../../../zenodo/registry.yml).

Read those first. The current instance — the semantic supply chain paper and
harness v0.3.0/v0.4.0, with recorded facts, a front-matter sketch and the
open decisions — is in
[references/integration-plan.md](references/integration-plan.md). Read it for
that work, and re-check every recorded value against the repository.

## Non-negotiables

1. **No release without an explicit request.** Preparing a page, a branch or
   a Zenodo draft does not authorise a push to `main`, a PR to
   `spherity/spherity-research`, a deployment, IndexNow or a Zenodo publish.
   A Zenodo publish is irreversible.
2. **A paper page is a new disclosure; the harness is not.** The harness
   versions already published on GitHub and Zenodo can be linked freely. The
   paper text, claim register and any not-yet-released code are disclosed
   when committed to this public repository. Pass the authoring and Zenodo
   gates (confidentiality, co-authors, rights) first. Never publish
   consortium, IPCEI, NDA or customer material, or project and partner names
   from confidential documents.
3. **One source of truth per fact.** Versions, DOIs, hashes, test counts and
   dates come from the tagged release (`README.md`, `CITATION.cff`,
   `SHA256SUMS`, `results/`) and `zenodo/registry.yml`. Never take them from
   memory, chat summaries or an earlier draft. Add a test that fails when the
   page disagrees with those sources.
4. **Keep versions apart.** State which harness version produced each number.
   Measurements of an earlier version are historical and are not evidence for
   a later version's corrections. Keep that distinction on the page, in the
   catalog and in the structured data.
5. **Carry the evidence boundary.** Every place that summarises a harness
   result (answer summary, takeaways, FAQ, card text, JSON-LD description)
   also keeps its limits: for example, simulated rather than demonstrated
   hardware isolation, synthetic scenarios, single-environment measurements,
   and experimental formats that are not standards. A signature or a passing
   test is not proof of truth, safety or compliance.
6. **Do not rewrite released bytes.** Do not edit tagged harness files,
   published PDFs or Zenodo files. A correction is a new version: a new tag,
   a new Zenodo version under the same concept DOI, and a dated page
   revision.
7. **Do not weaken checks.** Do not skip, relax or delete validation to make
   a page pass. Extend the validators instead.

## Step 0 — Establish the state before editing

1. Run `git status`, `git branch -vv`, `git remote -v` and
   `git log --oneline -5`. Preserve existing work.
2. Find the branch's merge base with fork `main` and with the production
   repository's `main` (`git merge-base`). Do not assume the branch is
   current. On 16 Nov 2026 the harness branch forked at `eb82992` (PR #38).
   It lacked the official DPP5 page (#39), the AI safety work (#41), Proofs
   over Statements v1.3 (#44) and the sitemap work (#45), including
   `research-download-metadata.html`. Fork `main` itself lacked the
   organisation's case studies (#46–#50). Integrate the harness work onto
   current organisation `main` before building a page on it: merge, never
   delete files that `main` added, and resolve conflicts in
   `docs/_data/publications.yml`, `docs/_data/social_cards.yml`,
   `package.json` (`check` scripts), the shared layouts and any duplicated
   DPP5 files (keep the published `main` version unless the user decides
   otherwise). If the organisation repository is unreachable from the
   session, say so; do not assume parity.
   Some files this skill links to (the authoring skill, `zenodo/`) exist only
   on the harness branch until that merge.
3. Confirm the harness tag and release exist (`git ls-remote --tags origin`)
   and that `zenodo/registry.yml` records the same version, DOI and archive
   SHA-256 as the release README and `CITATION.cff`.
4. Locate the manuscript sources and final PDFs. Session scratchpads are
   temporary. If the only copy of a manuscript is in a scratchpad, tell the
   user, and save it somewhere durable before building on it. Do not commit
   an unreleased manuscript to the public repository without the user's
   go-ahead.

## Step 1 — Site-wide DOI support (shared layouts; small, separate PR)

`zenodo/README.md` lists this as not yet implemented. Do it once for all
papers, before or separate from the paper page:

- Front matter: `doi` (version DOI, bare form `10.5281/zenodo.N`) and
  optional `concept_doi`. Validate the `10.NNNN/...` syntax in
  `scripts/validate-site.mjs`.
- `docs/_layouts/default.html`: emit `<meta name="citation_doi">` inside the
  existing citation block; add a schema.org `identifier` `PropertyValue`
  (`propertyID: "DOI"`) and `https://doi.org/<doi>` to `sameAs` on the
  article node.
- `docs/_layouts/research-respec.html` / `research-license.html`: show a
  visible DOI and a "Cite as" line in the licence-and-citation section.
- First use: the existing Zenodo record of Quantum-Resilient Organizational
  Identity (`existing-record` in the registry). Do not link a DOI to a PDF
  that is not byte-identical to the deposited file. When in doubt, call it
  "the Zenodo preprint (v1)" instead of presenting it as the same file.
- A test (pattern: `scripts/test-citation-metadata.mjs`) renders a page with
  and without `doi` and checks the meta tag, JSON-LD and visible text.
- Shared layout change: inspect representative unaffected pages too, and do
  not claim success until the production Jekyll build in CI passes.
  `pnpm run test:preview` alone is not proof.

## Step 2 — Software-companion block (new include, no new page type)

Do not extend `research-works-metadata.html`: it hard-codes a PDF encoding
and an author. Add a dedicated include, for example
`docs/_includes/research-software.html`, rendered when `software_companions`
is set:

- **Visible section** `#code-and-reproducibility`: the question each worked
  example answers, the version, its licence (Apache-2.0, with third-party
  notices), the version DOI and concept DOI, GitHub tag/release, the archive
  SHA-256, the RFC 3161 timestamp, how to run it (`npm ci`, `npm test`), the
  test count, and the evidence boundaries. Use a table for the WE-to-claim
  mapping. Keep it short; link the release README for the detail.
- **JSON-LD** `SoftwareSourceCode`: `name`, `version`, `license`,
  `codeRepository` (tag URL), `identifier` (DOI), `sameAs` (doi.org and the
  release), `programmingLanguage`, `runtimePlatform`, `author` (registry
  identity with ORCID), `dateCreated`/`datePublished`, `subjectOf` → the
  article `@id`; on the article, `isBasedOn` → the software `@id`. Previous
  versions are listed as `hasVersion`/historical links, not as current.
- The page licence stays CC BY 4.0 (the validator requires it). State the
  software licence per companion, never as the page licence.
- Machine-readable results (for example `results/*.json`) or a claim
  register (JSON/CSV) may be published as `supplementary_media` entries with
  `sha256`, `content_size`, `license` and `usage_info`, following the Proofs
  page. Copy only bytes that match the tag. Do not mirror the whole harness
  archive into `docs/`: link the DOI and the release instead, unless the user
  asks for an on-site download (then it must be byte-identical, with the
  recorded SHA-256).
- Test (pattern: `scripts/test-proofs-publication.mjs`), wired into the
  `check` and `check:atlas-preview` scripts. It checks that the page's
  version, DOI, concept DOI and SHA-256 equal `zenodo/registry.yml` and the
  tagged `CITATION.cff`, that the JSON-LD parses, that the visible section
  states the boundaries, and that each `supplementary_media` hash matches the
  file.

## Step 3 — The paper page

Follow spherity-research-publishing with `templates/publication.md`
(template v2). Specific to papers with a harness:

- `associated_media`: full paper and executive brief, each with its own
  first-page screenshot. `pdf_url` = full paper.
- `answer_summary`, `key_takeaways`, `questions_answered`: each empirical
  statement names its worked example and harness version and keeps its
  boundary. Separate adopted law (with its application date), proposals,
  standards, drafts and Spherity proposals, with an "as of" date.
- HTML overview per the authoring skill: answer summary, three to five
  takeaways, the regulation-to-architecture table, and a short claim-register
  summary (IDs, type, evidence level). The PDF carries the full register,
  prior-art ledger and references.
- `related_publications`: the Spherity papers the paper builds on (at least
  Proofs over Statements; others such as evidence graphs, the EBW control
  plane and revocation where the paper cites them). One sentence each; do
  not restate them.
- Search research: the template's full Google Trends review applies. The
  Proofs-paper exception (proceed without public mention if Trends fails)
  does not carry over. If Trends is inaccessible, record that the review is
  incomplete and treat the page as draft work until it is resolved or the
  user decides otherwise.
- Figures: original vector sources, `figure_objects`, self-contained SVGs,
  assign-then-include Liquid pattern.
- Social card through `docs/_data/social_cards.yml` and the generator. Do
  not change the homepage collection card.
- Catalog entry in `docs/_data/publications.yml`: reuse existing `filters`
  IDs (no new "software" filter). In `format`, name the harness (for example
  "HTML + 2 PDFs + open harness (Apache-2.0)"). Add a link to
  `#code-and-reproducibility` on the paper page. If the validator accepts
  external catalog links, a concept-DOI link may follow it; otherwise keep
  the DOI on the page.
- An unfinished paper may go live only as an explicit in-preparation page
  (`paper_in_preparation: true` with the required `paper_placeholder`), and
  only if the user asks for it. Never present a draft as the final paper.

## Step 4 — Cross-links and registry

- Add the new paper to the `related_publications` of the papers it extends
  (narrow edit; do not revise their claims).
- `zenodo/registry.yml`: turn the planned entry into a real entry with
  `page:` once the page exists. Keep all gates honest. Add
  `isSupplementedBy` → harness concept DOI on the paper. On the harness
  record, an `isSupplementTo` → paper DOI relation can be added later as a
  metadata edit; Zenodo files stay fixed. Check what the current Zenodo
  interface allows before promising it.
- `pnpm run zenodo:check` must pass.
- After the merge in Step 0, add one routing line for this skill to
  `AGENTS.md`, next to the publishing and authoring skills.

## Step 5 — Verify and hand off

- `pnpm install --frozen-lockfile`, then `pnpm run test` (Jekyll available)
  or `pnpm run test:preview` (disclose that this is not the production build).
- `pnpm run zenodo:check`.
- In the harness folder, `npm ci && npm test` only when the claim on the
  page depends on rerunning it now. Otherwise cite the recorded run in
  `results/` and say so.
- Visual check at 390 × 844, 768 × 1024 and 1440 × 900: the code section,
  tables, DOI/Cite-as line, every figure (all four edges), PDF downloads and
  share pages.
- Inspect the rendered JSON-LD: one article node, one software node per
  companion, consistent `@id`s, no duplicates.
- Check the full sitemap includes the page, figures and supplementary files,
  and excludes share pages.
- Report changes, tests, visual checks, unverified items and the open
  decisions separately.

## Release order (only on explicit request)

1. Merge into the fork's `main` → staging at
   `https://cstoecker.github.io/spherity-research/`. Review it.
2. For the paper DOI: reserve it in a Zenodo draft, put it on the title page,
   produce the final PDF, then put the identical bytes on the site. A
   reserved DOI does not resolve until the record is published, so leave the
   page's `doi` field unset until then.
3. PR into `spherity/spherity-research:main`. A merge deploys and can trigger
   IndexNow. Then verify the live page, PDFs (hashes), harness DOIs and
   sitemap.
4. Publish the paper's Zenodo record from the same bytes (`--publish
   --confirm <id>`). Confirm the DOI resolves, record it in the registry, set
   `doi` on the page, and release that small change the same way.
