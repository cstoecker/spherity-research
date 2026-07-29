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

Every pull request is built and checked for broken local links, missing assets,
unrendered template code, incomplete social metadata, and missing image
descriptions. A merge to `main` creates a fresh sitemap and deploys the verified
site through GitHub Pages.

## Add a new HTML research paper

1. Copy `templates/publication.md` to `docs/publication-slug.md`.
2. Replace every example value in the front matter at the top of the new file.
3. Add the paper text below the front matter. Keep every heading `id` aligned
   with its matching entry in `toc_items`.
4. Export a landscape thumbnail, ideally 1200 × 630 pixels, and save it in
   `docs/assets/` using a short, descriptive filename.
5. Add one entry to `docs/_data/publications.yml`. Copy a nearby entry and
   update its title, description, topics, image, dates, search terms, and links.
6. Run the local checks described below, then open a pull request.

Use meaningful alt text that explains the thumbnail’s content. Do not begin
with “image of.” Keep the search description specific and roughly 150–160
characters.

## Add a PDF publication

1. Put the final PDF in `docs/`. Use a stable, descriptive filename; avoid
   replacing a published filename unless the document is a true revision.
2. Add its 1200 × 630 thumbnail or cover image to `docs/assets/`.
3. Add an entry to `docs/_data/publications.yml` with `format: "PDF"`.
4. Set the primary link to the PDF path. The sitemap generator discovers the
   PDF automatically after the site build.
5. Open the PDF link in the local preview and confirm that it downloads or opens
   correctly.

If an HTML version is available, list “Read paper” first and “Download PDF”
second in the publication’s `links` block. Search engines should see the HTML
page as the canonical research page and the PDF as an alternate format.

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

## Publication review checklist

- Title, author, publication date, and abstract are final.
- Canonical URL and filename are stable.
- Thumbnail is legible at small size and has useful alt text.
- HTML and PDF links work in the staging site.
- Open Graph and X previews use the intended image.
- The page works at mobile, tablet, and desktop widths.
- Heading order is logical and tables are usable by keyboard.
- No draft notes, placeholders, or private references remain.
- The automated build, sitemap, and validation checks pass.
