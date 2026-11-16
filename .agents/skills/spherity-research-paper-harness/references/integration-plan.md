# Integration plan: Securing the Semantic Supply Chain + harness

Snapshot prepared 16 November 2026 from branch `claude/elegant-babbage-pe1vwn`
(head `af63ac5`) of `cstoecker/spherity-research`, the live site and the
Zenodo registry. Re-check every value before use. The tagged release and
`zenodo/registry.yml` win over this file.

## 1. What exists

### Site (Jekyll on GitHub Pages)

- Source `docs/`, layouts `default.html` (all metadata and JSON-LD) and
  `research-respec.html` (paper UI). Generated output is `_site/`.
- Catalog `docs/_data/publications.yml` → homepage cards, filters, search.
  Filters are fixed: `ai identity wallets infrastructure dpp` (shown as
  Identity, DPP & DBP, Wallets & data sharing, Resilience, Trusted AI).
- Supported now: `associated_media` (PDF editions with their own covers),
  `supplementary_media` (downloads with `sha256`, `content_size`, `license`,
  `usage_info`; see the Proofs page), `figure_objects`, series blocks,
  `research_works` (PDF-only, author hard-coded), `dataset` (one Dataset
  node, used once), `paper_in_preparation` + `paper_placeholder`, and
  `publication_state: draft`.
- Missing: DOI fields, `citation_doi`, any schema.org `SoftwareSourceCode`,
  and a visible "code and reproducibility" section. The live homepage (checked
  16 Nov 2026) shows no DOI, Zenodo or software section.
- The page `license` must be CC BY 4.0 (validator). The repository's code is
  MIT. The harness is Apache-2.0 (`LICENSE-CONTENT.md` on the branch records
  that exception).
- `research-assets/` is outside `docs/` and is not published on the site. This
  is correct for the harness: GitHub tag + Zenodo are its distribution.

### Repositories and sync

- Fork `cstoecker/spherity-research`: `main` = `2e3cb70` (PR #45).
- Production `spherity/spherity-research:main` was recorded at `ea0d7d5`
  (PR #50, 14 Nov 2026) and contains case studies that fork `main` lacks. The
  live site shows a "Case studies" section. **The working branch must be
  synced with organisation `main` before a production PR.** This session's
  GitHub access may cover only the fork; if so, the user has to sync the
  fork (GitHub "Sync fork") or grant access.
- The harness branch `claude/elegant-babbage-pe1vwn` forked from `eb82992`
  (PR #38). It is **not** based on fork `main`: it lacks #39 (the DPP5 page as
  published), #41 and the AI safety pages, #44 (Proofs over Statements v1.3,
  its PDFs, `scripts/test-proofs-publication.mjs`) and #45
  (`docs/_includes/research-download-metadata.html`, full sitemap
  discovery). The branch's own DPP5 commits are a parallel version of #39.
  A plain diff against `main` therefore shows those files as "deleted". A
  merge keeps them; a reset or cherry-pick onto the branch would lose them.
- The working branch also carries the DPP5 review data, the Zenodo tooling
  (`scripts/zenodo-*.mjs`, `scripts/lib/zenodo-metadata.mjs`,
  `scripts/test-zenodo-metadata.mjs`) and the authoring skill. Expect
  conflicts with organisation `main` in `package.json` (`check`,
  `check:atlas-preview`), `publications.yml`, `social_cards.yml` and
  `research-respec.html` (`abstract_before_toc`).

### Harness (research software)

| | v0.3.0 | v0.4.0 (current) |
|---|---|---|
| Path | `research-assets/semantic-supply-chain/harness-v0.3` | `.../harness-v0.4` |
| Tag | `ssc-harness-v0.3.0` (on `ddf09f1`) | `ssc-harness-v0.4.0` (on `2ee3f966`) |
| Version DOI | `10.5281/zenodo.24168347` | `10.5281/zenodo.24281131` |
| Concept DOI | `10.5281/zenodo.24168346` | same |
| Release asset SHA-256 | `ca797514…f3ee76` | `0efbbca1…7bee3f89` (`harness-v0.4.0-source.zip`) |
| RFC 3161 timestamp | FreeTSA, 2026-11-12 12:12:09 GMT | FreeTSA, 2026-11-16 12:25:22 GMT |
| Content | WE-1 to WE-5 | WE-1 to WE-7, WE-3 R, model checker (66 cases), 136 tests |
| Status of numbers | historical measurements of earlier designs | corrections after review rounds 4–7 |

- Licence Apache-2.0, plus W3C Software and Document License for bundled
  contexts and vectors (see `NOTICE`). Node ≥ 22. WE-3 needs `swtpm` and
  `tpm2-tools`. TPM tests skip without them.
- `CITATION.cff` and the Zenodo `related_identifiers` point to the **fork**
  (`github.com/cstoecker/...`). Those tags must stay reachable even if the
  harness later moves to the organisation repository.
- Boundaries stated in the release: hardware isolation is simulated, not
  demonstrated; WE-7 is synthetic; measurements come from one 4-vCPU
  environment; `ecdsa-lfsc-2026`, the M15 envelope, admission certificates,
  replay receipts and the evidence-graph certificate are experimental
  formats, not standards; the model checker covers the checked instances,
  not every size.
- The v0.4.0 README refers to the paper by section numbers of manuscript
  v0.9.13 (§2.5, §5, Appendix D.0). The v1.0 draft numbers its empirical
  section §4. The tagged README cannot change. The page must cite the paper's
  own v1.0 numbering and must not copy section references from the README.

### Papers

| Work | State (16 Nov 2026) | Registry entry |
|---|---|---|
| Securing the Semantic Supply Chain: Meaning as a Foundation of Trust Infrastructure — full article v1.0 and 7-page executive brief | Built in the other session's **scratchpad** (`PaperA-v1.0-Executive-Brief.pdf`, `PaperA-v1.0-brief.zip`); not committed; not published | `planned-semantic-supply-chain-assurance`, `hold`, confidentiality/co-authors/rights open |
| HAIP-W3C companion profile paper | In preparation; community contributors to review | `planned-haip-w3c-profile`, `hold` |
| Agent key-management / safety-kernel paper | In preparation; third-party project context excluded | `planned-agent-key-management-safety-kernel`, `hold` |

Scratchpads are deleted when a session ends. Save the manuscript sources,
LaTeX and PDFs somewhere durable (the user's chosen location; not the public
repository until the release decision).

## 2. Target design

```
Homepage card (publications.yml, filters: ai identity infrastructure)
  └─ /securing-semantic-supply-chain.html   (canonical paper page, CC BY 4.0)
       ├─ associated_media: full paper PDF, executive brief PDF (own covers)
       ├─ figure_objects: paper figures
       ├─ #code-and-reproducibility  (new include research-software.html)
       │    ├─ WE → question → claim/mechanism table
       │    ├─ v0.4.0: DOI, concept DOI, tag, SHA-256, timestamp, npm test
       │    └─ v0.3.0: historical, DOI, what its numbers mean
       ├─ supplementary_media (optional): claim register JSON/CSV,
       │    selected results/*.json copied byte-identically from the tag
       ├─ JSON-LD: ScholarlyArticle ──isBasedOn──▶ SoftwareSourceCode (v0.4.0)
       │                              ◀──subjectOf──
       └─ related_publications: Proofs over Statements, evidence graphs, …
Proofs over Statements page → related_publications += new paper (narrow edit)
zenodo/registry.yml → paper entry with page:, isSupplementedBy harness concept DOI
```

There is no separate harness web page at first. Add one only when a second
paper depends on the same harness, or the user asks for one.

### Front-matter sketch (new keys marked NEW)

```yaml
publication_template_version: 2
layout: research-respec
title: "Securing the Semantic Supply Chain"
citation_title: "Securing the Semantic Supply Chain: Meaning as a Foundation of Trust Infrastructure"
permalink: /securing-semantic-supply-chain.html        # confirm slug with the user
pdf_url: "/Stoecker-2026-Securing-the-Semantic-Supply-Chain-v1.0.pdf"
associated_media: [full paper, executive brief]        # each with own cover_image
# doi: "10.5281/zenodo.N"        # NEW — set only after the Zenodo record is published
# concept_doi: "10.5281/zenodo.N" # NEW
software_companions:                                     # NEW
  - id: ssc-harness
    name: "Semantic supply chain harness"
    version: "0.4.0"
    date_published: "2026-11-16"
    zenodo_entry: ssc-harness-v0-4-0                     # test cross-checks registry
    doi: "10.5281/zenodo.24281131"
    concept_doi: "10.5281/zenodo.24168346"
    code_repository: "https://github.com/cstoecker/spherity-research/tree/ssc-harness-v0.4.0/research-assets/semantic-supply-chain/harness-v0.4"
    release_url: "https://github.com/cstoecker/spherity-research/releases/tag/ssc-harness-v0.4.0"
    archive_name: "harness-v0.4.0-source.zip"
    archive_sha256: "0efbbca122a052246b4b59afb6102f105be47bdda3421815f67b512c7bee3f89"
    timestamp: { authority: "FreeTSA", time: "2026-11-16T12:25:22Z" }
    license: "https://www.apache.org/licenses/LICENSE-2.0"
    programming_language: "JavaScript"
    runtime_platform: "Node.js 22 or later"
    run: ["npm ci", "npm test"]
    tests: 136
    worked_examples:
      - { id: WE-1, question: "Does a valid signature prove what a credential means?", supports: "…" }
      # … from the tagged README table, using the paper's v1.0 claim IDs
    boundaries:
      - "Hardware isolation is simulated on a software TPM, not demonstrated."
      - "WE-7 is a synthetic compliance-evidence example."
      - "Measurements come from a single 4-vCPU environment and are not portable bounds."
      - "ecdsa-lfsc-2026 and the other new formats are experimental, not standards."
    previous_versions:
      - { version: "0.3.0", doi: "10.5281/zenodo.24168347", note: "Historical measurements of the earlier designs; not evidence for the v0.4.0 corrections." }
```

Keep `software_companions` values identical to the registry and the tagged
`CITATION.cff`. The new test enforces this.

## 3. Work packages and order

| # | Package | Kind | Depends on | Release |
|---|---|---|---|---|
| A | Sync the working branch with organisation `main`; resolve conflicts | git | access to the org repository | none |
| B | DOI support in the shared layouts + test; first use on the existing QROI Zenodo preprint | shared layout | A | own PR; CI Jekyll must pass |
| C | `research-software.html` include, `SoftwareSourceCode` JSON-LD, validator rules, test | shared layout | A | can share a PR with B |
| D | Paper page, PDFs + covers, figures, social card, catalog entry, Trends review, claim-register supplement | content | B, C, final PDFs, gates | user decision |
| E | Cross-links (Proofs page), registry paper entry, `zenodo:check` | content/data | D | with D |
| F | Staging on the fork → production PR → Zenodo paper record → `doi` on page | release | D, E, explicit request | irreversible steps |

B and C can be built, tested and reviewed while the paper is still being
finalised. They do not disclose the paper.

## 4. Decisions to ask the user (once; skip any already answered)

1. **Canonical home of the harness.** Keep it in the fork (where the tags,
   CITATION.cff and Zenodo already point), upstream `research-assets/` into
   `spherity/spherity-research`, or move it to a dedicated repository. In
   every case, existing tags and DOIs stay valid; the website links the DOI
   first.
2. **Publication state of the paper.** Publish v1.0 final, or an explicit
   in-preparation page (placeholder PDF), or nothing until all gates pass.
   The registry gates are still open: confidentiality, co-authors and rights.
3. **Paper DOI.** Reserve a Zenodo DOI and print it on the title page before
   the final PDF (recommended by `zenodo/README.md`).
4. **Homepage prominence.** One card for the paper (default), not a separate
   card for the harness.
5. **On-site downloads.** Link DOI + release only (default), or also publish
   the claim register and selected `results/*.json` as hashed supplements.
6. **Slug and PDF filenames.** Proposed `/securing-semantic-supply-chain.html`
   and `Stoecker-2026-Securing-the-Semantic-Supply-Chain-v1.0[-executive-brief].pdf`,
   following the Proofs naming.
