# Spherity Research

Spherity Research is the public library for Spherity GmbH publications on
organizational identity, verifiable credentials, European Business Wallets,
trusted AI, digital trust infrastructure, and post-quantum resilience.

Live site: <https://spherity.github.io/spherity-research/>

## How the publication site works

The website source lives in `docs/` and is rendered by Jekyll on GitHub Pages.
The publication cards on the homepage are generated from one catalog:
`docs/_data/publications.yml`. This prevents homepage content and publication
metadata from drifting apart.

Social-card art direction is recorded in `docs/_data/social_cards.yml` and
rendered by `scripts/generate-social-cards.mjs`. The shared 1200 × 630 research
grid style is regenerated before local checks and deployment. A mandatory
preflight measures every title, subtitle, description, byline, and topic row
against the left-column safe area; generation and deployment fail if text
enters the 60-pixel gutter before the document visual. Portable line-length
limits also prevent operating-system font substitutions from passing locally
but overflowing in GitHub Actions. The Gartner-
approved strategy card is a checksum-protected exception and must not be
changed without a new approval.

Verified author identities are maintained in `docs/_data/authors.yml`. The
shared page layout reuses those profiles on future papers, while a publication
can supply an author-specific `url` or `same_as` value when necessary. Reviewed
ORCID identifiers are emitted in `sameAs`, JSON-LD identifiers, and scholarly
citation metadata; the build validates the ORCID format and check digit.

Every pull request is built and checked for broken local links, missing assets,
unrendered template code, incomplete SEO/AEO/GEO metadata, invalid JSON-LD,
inconsistent catalog data, missing answer content, absent PDF landing pages,
unreviewed version 2 search research, author-identity omissions, and oversized
homepage previews. A merge to `main` creates a fresh sitemap and
deploys the verified site through GitHub Pages. The workflow enforces these
requirements deterministically; it does not use AI to rewrite research claims
or silently change approved copy. See `AEO-GEO-IMPLEMENTATION.md` for the
evidence and editorial policy.

## Add a new HTML research paper

1. Copy `templates/publication.md` to `docs/publication-slug.md`.
2. Complete the Google Trends and semantic-language review described in
   `SEO-AEO-GEO-RESEARCH.md`, then replace every example value in the version 2
   front matter.
3. Add every author to `author_entities` and to the reviewed
   `docs/_data/authors.yml` registry. A publication may provide a verified HTTPS
   `url` or `same_as` override, but it does not replace the registry review.
4. Add the paper text below the front matter. Keep every heading `id` aligned
   with its matching entry in `toc_items`.
5. Add a `research-grid-v1` entry to `docs/_data/social_cards.yml`, using short,
   pre-wrapped title and description lines plus a suitable paper cover or
   code-native subject visual. Run `pnpm run social-cards`; it measures the
   complete left column, rejects overflow into the document gutter, and exports
   the WebP card at 1200 × 630 pixels.
6. Add one entry to `docs/_data/publications.yml`. Copy a nearby entry and
   update its title, description, topics, image, dates, search terms, and links.
7. Add a homepage FAQ entry only when the paper answers a distinct research
   question that is not already represented.
8. Run the local checks described below, then open a pull request.

Use meaningful alt text that explains the thumbnail’s content. Do not begin
with “image of.” Keep the search description specific and roughly 150–160
characters.

## Add a PDF publication

1. Put the final PDF in `docs/`. Use a stable, descriptive filename; avoid
   replacing a published filename unless the document is a true revision.
2. Add its 1200 × 630 WebP thumbnail or cover image (maximum 250 KB) to
   `docs/assets/`.
3. Create a concise HTML landing page that faithfully states the paper's
   answer, authorship, findings, boundaries, and citation.
4. Declare the primary PDF in `pdf_url` and every PDF edition in
   `associated_media`; add the first-page cover image and descriptive alt text.
5. Add an entry to `docs/_data/publications.yml`. Put the canonical HTML page
   first and the PDF download second; use `format: "HTML + PDF"`.
6. Open both links in the local preview and confirm that the HTML page does not
   present itself as the full paper.

If an HTML version is available, list “Read paper” first and “Download PDF”
second in the publication’s `links` block. Search engines should see the HTML
page as the canonical research page and the PDF as an alternate format.

## SEO, AEO and GEO research

Every publication created from template version 2 records a structured search
review in its `search_research` front-matter block. Follow
[`SEO-AEO-GEO-RESEARCH.md`](SEO-AEO-GEO-RESEARCH.md) to compare exact terms and
topics across appropriate geographies, 12-month and five-year periods, and Web
or News search. Google Trends is used as relative language evidence, not as
absolute volume or an automated content generator.

The build verifies that the review is complete and that the chosen authority
terms appear in the publication metadata. It intentionally does not scrape
Google Trends during deployment, because niche results can be sampled,
normalized, insufficient and unstable. Search Console remains the source for
post-publication query and indexing evidence.

## Local preview

Prerequisites:

- Ruby and Bundler
- Node.js 24 or newer
- pnpm 11

Install the Jekyll dependencies used by GitHub Pages, then install the small
Node.js validation tool:

```bash
gem install bundler jekyll
pnpm install
```

Start the authoring server:

```bash
pnpm start
```

Open the local URL printed by Jekyll. For a production-style preview:

```bash
pnpm run build
pnpm run sitemap
pnpm run optimize
pnpm run check
pnpm run preview
```

If Ruby is not available, the repository also includes a lightweight Node.js
preview renderer for layout and browser checks:

```bash
pnpm run test:preview
pnpm run preview
```

The production workflow still uses GitHub Pages’ official Jekyll builder.

Test at least these viewports:

- Mobile: 390 × 844
- Tablet: 768 × 1024
- Desktop: 1440 × 900

Confirm that publication content appears before the table of contents on mobile,
the filter controls work with keyboard and touch input, tables scroll without
breaking the page, and every publication link opens the intended HTML or PDF.

## Fork and preview safely

1. Fork `spherity/spherity-research` on GitHub.
2. In the fork, open **Settings → Pages** and choose **GitHub Actions** as the
   source.
3. Create a branch for the publication or design change.
4. Push the branch and open a pull request into the fork’s `main` branch. The
   build checks run without deploying.
5. Merge into the fork’s `main` branch to publish the staging site at
   `https://YOUR-USERNAME.github.io/spherity-research/`.
6. Review that staging URL on desktop and a physical phone before opening a
   pull request against the Spherity repository.

All internal URLs are generated with Jekyll’s repository-aware URL filters, so
the same build works for the Spherity organization and personal forks.

## Update the production site

1. Open a pull request from the tested branch or fork into
   `spherity/spherity-research:main`.
2. In the pull request description, include the publication title, canonical
   URL, author approval, thumbnail confirmation, and staging URL.
3. Wait for the build-and-validation check to pass.
4. Request editorial review for the abstract, metadata, and links.
5. Merge the pull request. The deployment job publishes the verified build to
   GitHub Pages.
6. Confirm the new URL in `sitemap.xml`, then request indexing in Google Search
   Console if the publication is time-sensitive.

GitHub’s current artifact-based Pages deployment is used instead of committing
generated files to a `gh-pages` branch. It keeps compiled output out of source
history and deploys only the build that passed validation.

### Optional IndexNow notification

The deployment can notify participating IndexNow search engines after the new
Pages version is live. Generate a random key (a 32-character hexadecimal value
is suitable), then add it in **Repository Settings → Secrets and variables →
Actions** as a repository secret named `INDEXNOW_KEY`. The workflow publishes
the required key proof at `/<key>.txt` and submits URLs extracted from the
locally generated `_site/sitemap.xml` only after a successful deployment.

If the secret is absent, deployment still succeeds and the notification is
skipped. IndexNow is a discovery signal, not an indexing guarantee, and it does
not directly notify ChatGPT or replace Google Search Console. Google discovery
continues through `sitemap.xml`, internal links, and Search Console.

## Publication review checklist

- Title, author, publication date, modification date, and abstract are final.
- The answer summary, takeaways, and direct answers are traceable to the paper.
- Regulations and standards are labelled accurately as adopted, proposed, or
  projected.
- Canonical URL and filename are stable.
- Thumbnail is legible at small size and has useful alt text.
- HTML and PDF links work in the staging site.
- Open Graph and X previews use the intended image.
- The publication page and homepage catalog use the same generated social card;
  approved exceptions remain checksum-identical.
- Every social-card text line and topic row clears the document visual by the
  enforced 60-pixel safety gutter; no text is clipped or hidden behind imagery.
- Version 2 search research records the Google Trends filters, findings,
  authority terms, discovery terms, and resulting editorial decisions.
- Every author has an `identity_reviewed` profile in `docs/_data/authors.yml`;
  any publication-specific HTTPS `url`/`same_as` override is also verified.
- The page works at mobile, tablet, and desktop widths.
- Heading order is logical and tables are usable by keyboard.
- No draft notes, placeholders, or private references remain.
- The automated build, sitemap, and validation checks pass.

## License

Except where otherwise noted, the written research content, whitepapers,
research data, diagrams, visual explainers, and policy roadmaps in this
repository are licensed under the [Creative Commons Attribution 4.0
International License](https://creativecommons.org/licenses/by/4.0/) (CC BY
4.0). Copyright remains with the author or co-authors named on each
publication. Reuse must provide appropriate attribution, a link to the
canonical work and license, and an indication of changes.

[![Creative Commons Attribution 4.0 International License](docs/assets/cc-by.svg)](https://creativecommons.org/licenses/by/4.0/)

Source code, build scripts, templates, stylesheets, and configuration files are
licensed under the [MIT License](LICENSE). See
[LICENSE-CONTENT.md](LICENSE-CONTENT.md) for the complete repository licensing
scope and attribution guidance. Spherity names and logos are not licensed for
reuse.
