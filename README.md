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
limits and a conservative non-Linux serif-width allowance also prevent
operating-system font substitutions from passing locally but overflowing in
GitHub Actions. The Gartner-
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
   `associated_media`. Give each media entry its own `cover_image` screenshot
   of that PDF's first page, with `cover_image_alt` describing it. A page-level
   `cover_image` is a fallback only for a single-PDF publication; never reuse
   the full paper's cover for a separate brief or edition.
5. Add an entry to `docs/_data/publications.yml`. Put the canonical HTML page
   first and the PDF download second; use `format: "HTML + PDF"`.
6. Open both links in the local preview and confirm that the HTML page does not
   present itself as the full paper.

If an HTML version is available, list “Read paper” first and “Download PDF”
second in the publication’s `links` block. Search engines should see the HTML
page as the canonical research page and the PDF as an alternate format.

### Share a PDF with its cover preview

A raw `.pdf` URL cannot carry HTML Open Graph or X-card metadata. For a
first-page screenshot preview, share the generated HTML URL at
`/share/<PDF-basename>.html` instead: for example, `/report.pdf` has the
share page `/share/report.html`. The publication header's **Share a PDF with
its cover preview** menu lists these links by document name. The ordinary
**Share** button still shares the canonical research page, and existing PDF
links still open or download the original file.

The build generates one share page per PDF from publication metadata and its
own cover screenshot. These pages provide social metadata and a link to the
original PDF; they do not replace the canonical paper or its download URL.
They declare `noindex, follow`, point their canonical URL to the existing
research page, and are excluded from the sitemap. Do not hand-edit generated
share pages. Keep each `associated_media` name, URL and cover screenshot
accurate, then rebuild and check the resulting preview. Social platforms may
cache old previews and decide whether to display an image; sharing a raw PDF
URL still cannot guarantee its cover preview.

Run `pnpm run pdf-shares` after the site build and before sitemap generation
and optimization. `pnpm run test:preview` runs this automatically. The generator
fits the complete cover screenshot into a 1200 × 630 JPEG at
`_site/assets/pdf-share/<PDF-basename>.jpg`; it leaves source screenshots,
homepage cards and the Gartner-approved card unchanged.

## Add a multi-paper research series

Use one cataloged hub page when an executive brief or overview provides the
best public entry point, then give every technical paper its own canonical
landing page. This preserves a simple homepage while allowing each paper's
distinct question, evidence, figures, PDF and terminology to be indexed.

1. Add the complete, identical `series_name`, `series_description`,
   `series_url` and `series_items` block to the hub and every paper page. Give
   the hub position `0` and assign each paper a stable numeric position.
2. Set `series_position` to the current page's position. The shared layout adds
   the four-way navigation, a three-level breadcrumb on sub-pages and
   `CreativeWorkSeries` structured data. The build fails if the hub or current
   page is missing from the declared series.
3. Put only the hub in `docs/_data/publications.yml` unless readers genuinely
   need every paper as a separate homepage card. Link every PDF from the hub
   and list all of them in the hub's `associated_media`.
4. Add a generated social-card entry for the hub. A technical sub-page may
   also have a dedicated card without becoming a homepage item; such a card
   must declare at least three `topics` in `docs/_data/social_cards.yml`.
5. Give each page its own answer summary, direct questions, evidence boundary,
   related research and search review. Do not copy the hub abstract across all
   pages, because each canonical page must provide distinct reader value.
6. For every published figure, preserve the highest-quality source available,
   add visible caption and alt text, and declare a matching `figure_objects`
   entry. The local preview and build now fail if a figure include loses its
   image source, dimensions, creator or licensing metadata.

## Figure display and visual quality checks

Every SVG figure must be self-contained when displayed in an HTML `img` element.
An SVG that refers to a neighbouring PNG can look correct when opened directly
but appear blank inside a paper page. Embed extracted raster images as
`data:image/...;base64,...` within the SVG, and inline shapes, fonts and styles.
Keep local fragment references such as `#arrowhead`. Attribution hyperlinks and
licensing metadata can still link to external pages. The site validator rejects
external image, shape, font and CSS dependencies in `figure_objects` SVGs.
Embedding a raster image does not make the figure vector artwork; retain the
original resolution and describe its source accurately.

For publication figures with SVG text, embed appropriately licensed fonts or
outline the text from the original PDF so that unavailable fonts cannot alter
labels, line breaks or alignment. Compare the result with the source PDF.
Preserve readable `title` and `desc` elements, alt text and a visible caption
for accessibility when lettering becomes vector outlines. Letters in an
embedded PNG are already rasterized and do not require browser fonts.

Before publication, open every figure through its paper page at desktop and
mobile widths, scroll it into view and confirm that the image has loaded.
Inspect the complete canvas, including borders, arrowheads, connectors and
labels near every edge. Compare it with the source PDF, and correct crop or
viewBox boundaries without dropping content. Check the full-size figure link
as well as the inline version. A successful build or a valid image URL alone
does not establish that a diagram is visible or correctly framed.

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
- Every PDF cover-preview share link opens the matching document's share page
  and uses that PDF's own first-page screenshot; direct download links remain
  unchanged, and generated share pages are absent from the sitemap.
- A cataloged publication page and homepage card use the same generated social
  card; dedicated series sub-page cards match a real research page and declare
  their own topic labels. Approved exceptions remain checksum-identical.
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
