# Zenodo deposits for Spherity Research

The website (`docs/`) stays the canonical, readable edition of each paper.
Zenodo holds the **version of record**: a fixed PDF with a DOI, linked to the
authors' ORCID records and preserved independently of this repository.

| | Website | Zenodo |
|---|---|---|
| Role | Canonical HTML, discovery, revisions | Version of record, citation, preservation |
| Mutability | Editable | Files fixed after publication; changes need a new version |
| Identifier | Page URL | Version DOI plus a concept DOI for all versions |
| Trigger | Each publication or revision | A dated release (v1.0, v1.1, ...) that passed every gate |

## What counts as a work

Deposit one record per **citable work**, not per web page.

- A long paper and its executive brief that share one argument form one record
  with both PDFs (for example, PACE or the CRA-capable DPP).
- A brief and papers that stand alone get separate records, each with
  its own title and abstract (for example, the three revocation documents).
- Series papers point to the series hub with `isPartOf`. Every record points
  to its canonical HTML page with `isVariantFormOf`.
- A work that already has a DOI is registered as `existing-record` and is
  never deposited again. Quantum-Resilient Organizational Identity is already
  on Zenodo (`10.5281/zenodo.20474401`).

## Release gates

A published Zenodo record cannot be deleted in normal operation, and its files
cannot be replaced. Each entry in [`registry.yml`](registry.yml) therefore
carries five gates. Each gate must be `pass` or `n/a` before the entry can be
set to `cleared`. The scripts enforce this.

1. **Confidentiality.** The deposit contains no consortium-internal, NDA or
   customer material, and none can be derived from it. Project
   deliverables, funded-project solution designs and co-authored confidential
   papers are never deposited as such. Publish a separately written research
   paper built only from public sources, and only after any approval the
   consortium or funding agreement requires.
2. **Disclosure.** Depositing a work, or committing it to this public
   repository, is a public disclosure. European patent law applies absolute
   novelty (EPC Art. 54) with no general grace period, so decide on any patent
   filing before the first public appearance. The US grace period does not help
   in Europe. Defensive publication is a legitimate choice, but it must be a
   deliberate decision.
3. **Co-authors.** Every co-author approves the deposit, the author order and
   CC BY 4.0. Add their ORCID iDs to `docs/_data/authors.yml` after
   verification. Open items: Bo Harald, and the energy data-X co-authors.
4. **Rights.** CC BY 4.0 must be grantable for every page. Check third-party
   figures, screenshots, logos and quotations, including Gartner material,
   whose usage policy is not a CC BY licence.
5. **Metadata review.** A person compares the generated metadata and a
   sandbox preview against the PDF: title, authors, date, abstract and licence.

## ORCID linkage

Zenodo registers DOIs with DataCite. A DOI appears on an ORCID record only if
the record owner allows it.

1. Sign in to Zenodo with ORCID, or link ORCID in the Zenodo account settings.
2. Allow DataCite to update the ORCID record automatically (DataCite Commons →
   sign in with ORCID → enable ORCID auto-update), or add works manually in
   ORCID through *Add works → Search & link → DataCite*. On 10 November 2026
   the public ORCID record `0009-0003-7417-8872` listed **no works**, not even
   the existing Zenodo preprint. Check the current DataCite and ORCID screens
   when you set this up.
3. Every creator with a verified ORCID is sent with its iD. Each co-author must
   authorise DataCite on their own record.

## Metadata mapping

`scripts/lib/zenodo-metadata.mjs` derives metadata from the page front matter
and the author registry. It does not keep a second copy of the paper's
metadata.

| Zenodo field | Source |
|---|---|
| title | registry `title`, else `citation_title`, else `title` |
| creators | `author_entities` / `authors` + `docs/_data/authors.yml` (family name first, ORCID check digit validated) |
| description | registry `description`, else `abstract`, else `answer_summary`; plus a link to the canonical HTML |
| publication_date, version, language | `date`, `version` / `paper_version`, `lang` |
| keywords | `about` (at most 15) |
| license | `cc-by-4.0` only when the page licence is CC BY 4.0; anything else stops the deposit |
| related_identifiers | canonical page (`isVariantFormOf`), series hub (`isPartOf`), registry extras |
| notes | the paper's research cut-off date |
| publication_type | registry, default `workingpaper`; `report` for roadmaps and reference cases; `preprint` only for journal submissions |

A DOI is pre-reserved for every draft. For new manuscripts, put the reserved DOI
on the title page before uploading. Do not edit the bytes of PDFs that are
already published.

National IPCEI funding is not listed in Zenodo's grant database. If a funding
agreement requires an acknowledgement, put it in the manuscript and in
registry `notes_for_zenodo`. Do not invent a grant identifier.

## Commands

```bash
pnpm run zenodo:metadata          # status table; review JSON written to _zenodo/
pnpm run zenodo:check             # registry, pages, PDFs and metadata tests (offline)
node scripts/zenodo-deposit.mjs --entry <id> --dry-run
ZENODO_SANDBOX_TOKEN=... node scripts/zenodo-deposit.mjs --entry <id>
ZENODO_TOKEN=... node scripts/zenodo-deposit.mjs --entry <id> --production
ZENODO_TOKEN=... node scripts/zenodo-deposit.mjs --entry <id> --production --publish --confirm <id>
```

Create tokens at *Zenodo → Applications → Personal access tokens*, with the
`deposit:write` and `deposit:actions` scopes. Use a separate token for
sandbox.zenodo.org. Keep tokens in the environment only.

Release sequence for one work:

1. Set every gate. Then set `status: cleared`.
2. Make a sandbox deposit and review it. Set `metadata_review: pass`.
3. Make a production draft. Record `zenodo.deposition_id` and set
   `status: deposited`.
4. Publish with `--publish --confirm <id>`. Copy `doi`, `concept_doi` and
   `record_id` into the registry and set `status: published`.
5. For a true revision, run `--new-version`. The concept DOI stays the same.

## Claim registers (optional, for new research)

From now on, papers state their contributions as numbered claims. Each claim
has a type, a novelty class, an evidence level, its closest prior art and its
limits. A claim register can be deposited as a small dataset linked to the
paper (`isSupplementTo`). This gives individual claims stable, citable IDs.
It is the same disclosure as the paper, so it passes the same gates. It
records priority. It does not establish validity.

## Not yet implemented

The website does not yet show DOIs. A follow-up change should add a `doi` field
to the front matter. That field would emit `citation_doi`, a schema.org
`identifier` / `sameAs` to `https://doi.org/...` and a "Cite as" line. The
change must be checked with the production Jekyll build, because it touches the
shared layouts.
