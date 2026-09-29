import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { stringify as stringifyYaml } from "yaml";
import { loadPdfShares, publicUrl } from "./lib/pdf-sharing.mjs";

const siteConfig = { url: "https://example.org", baseurl: "/research" };
const page = (overrides = {}) => ({
  layout: "research-respec",
  title: "A test research paper",
  description: "A description of the research paper used to test PDF sharing metadata.",
  permalink: "/paper.html",
  canonical_url: "https://example.org/research/paper.html",
  pdf_url: "/Paper.pdf",
  cover_image: "/assets/paper-cover.jpg",
  ...overrides
});

const fixture = async (context, { pages = { "paper.md": page() }, files = {} } = {}) => {
  const temporaryRoot = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(temporaryRoot, "spherity-pdf-sharing-test-"));
  context.after(async () => {
    // Never allow a cleanup target outside this test's uniquely created directory.
    assert.equal(path.dirname(directory), temporaryRoot);
    assert.ok(path.basename(directory).startsWith("spherity-pdf-sharing-test-"));
    await rm(directory, { recursive: true, force: true });
  });
  const contents = {
    "_config.yml": stringifyYaml(siteConfig),
    "Paper.pdf": "%PDF-1.7\nFixture PDF bytes\n%%EOF\n",
    "assets/paper-cover.jpg": "fixture cover (the mapper does not decode image bytes)",
    ...files
  };
  for (const [filename, data] of Object.entries(pages)) {
    contents[filename] = `---\n${stringifyYaml(data)}---\n\n# Research\n\nSubstantial research content.\n`;
  }
  for (const [filename, content] of Object.entries(contents)) {
    const target = path.join(directory, filename);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return directory;
};

test("a single PDF falls back to the page cover and keeps the original research canonical", async (context) => {
  const directory = await fixture(context);
  const { config, records } = await loadPdfShares(directory);
  assert.equal(records.length, 1);
  const [record] = records;
  assert.equal(record.pdfPath, "/Paper.pdf");
  assert.equal(record.coverPath, "/assets/paper-cover.jpg");
  assert.equal(record.pagePath, "/paper.html");
  assert.equal(record.sharePath, "/share/Paper.html");
  assert.equal(record.imagePath, "/assets/pdf-share/Paper.jpg");
  assert.equal(record.canonicalUrl, page().canonical_url);
  assert.equal(record.title, page().title);
  assert.equal(record.description, page().description);
  assert.equal(record.alt, `First page of ${page().title}.`);
  assert.deepEqual(record.references.map((reference) => reference.pagePath), ["/paper.html"]);
  assert.equal(publicUrl(config, record.sharePath), "https://example.org/research/share/Paper.html");
});

test("single associated media uses its own name and description with the page cover fallback", async (context) => {
  const directory = await fixture(context, {
    pages: { "paper.md": page({
      associated_media: [{ url: "/Paper.pdf", name: "The PDF edition", description: "The PDF description." }]
    }) }
  });
  const { records } = await loadPdfShares(directory);
  assert.equal(records.length, 1);
  assert.equal(records[0].title, "The PDF edition");
  assert.equal(records[0].description, "The PDF description.");
  assert.equal(records[0].coverPath, "/assets/paper-cover.jpg");
});

test("document-specific cover alt text is preserved for social metadata", async (context) => {
  const directory = await fixture(context, {
    pages: { "paper.md": page({
      cover_image_alt: "Page-level cover description.",
      associated_media: [{ url: "/Paper.pdf", cover_image_alt: "Document-specific first-page description." }]
    }) }
  });
  const { records } = await loadPdfShares(directory);
  assert.equal(records[0].alt, "Document-specific first-page description.");
});

test("multiple PDFs require an explicit cover for every associated media entry", async (context) => {
  const directory = await fixture(context, {
    pages: { "paper.md": page({
      associated_media: [
        { url: "/Paper.pdf", cover_image: "/assets/paper-cover.jpg" },
        { url: "/Brief.pdf", name: "Brief" }
      ]
    }) },
    files: { "Brief.pdf": "%PDF-1.7\nBrief" }
  });
  await assert.rejects(loadPdfShares(directory), /cover/i);
});

test("multiple PDFs map independently to their explicitly assigned covers", async (context) => {
  const directory = await fixture(context, {
    pages: { "paper.md": page({
      associated_media: [
        { url: "/Paper.pdf", cover_image: "/assets/paper-cover.jpg" },
        { url: "/Brief.pdf", name: "Brief", cover_image: "/assets/brief-cover.png" }
      ]
    }) },
    files: { "Brief.pdf": "%PDF-1.7\nBrief", "assets/brief-cover.png": "fixture brief cover" }
  });
  const { records } = await loadPdfShares(directory);
  assert.equal(records.length, 2);
  assert.equal(records.find((record) => record.pdfPath === "/Paper.pdf").coverPath, "/assets/paper-cover.jpg");
  assert.equal(records.find((record) => record.pdfPath === "/Brief.pdf").coverPath, "/assets/brief-cover.png");
});

test("the page's own pdf_url wins ownership over a hub's associated-media reference", async (context) => {
  const directory = await fixture(context, {
    pages: {
      "paper.md": page(),
      "a-hub.md": page({
        title: "Series overview",
        permalink: "/hub.html",
        canonical_url: "https://example.org/research/hub.html",
        pdf_url: "/Brief.pdf",
        cover_image: "/assets/brief-cover.png",
        associated_media: [
          { url: "/Brief.pdf", name: "Series brief", cover_image: "/assets/brief-cover.png" },
          { url: "/Paper.pdf", name: "Hub label must not replace the owning title", cover_image: "/assets/paper-cover.jpg" }
        ]
      })
    },
    files: { "Brief.pdf": "%PDF-1.7\nBrief", "assets/brief-cover.png": "fixture brief cover" }
  });
  const { records } = await loadPdfShares(directory);
  const owned = records.find((record) => record.pdfPath === "/Paper.pdf");
  assert.equal(records.length, 2);
  assert.equal(owned.pagePath, "/paper.html");
  assert.equal(owned.canonicalUrl, page().canonical_url);
  assert.equal(owned.title, page().title);
  assert.deepEqual(owned.references.map((reference) => reference.pagePath).sort(), ["/hub.html", "/paper.html"]);
});

test("conflicting covers for the same PDF fail instead of silently choosing one", async (context) => {
  const directory = await fixture(context, {
    pages: {
      "paper.md": page(),
      "hub.md": page({
        permalink: "/hub.html",
        canonical_url: "https://example.org/research/hub.html",
        pdf_url: undefined,
        associated_media: [{ url: "/Paper.pdf", cover_image: "/assets/wrong-cover.jpg" }]
      })
    },
    files: { "assets/wrong-cover.jpg": "wrong cover fixture" }
  });
  await assert.rejects(loadPdfShares(directory), /conflict|cover/i);
});

test("every PDF under the source directory must have a front-matter mapping", async (context) => {
  const directory = await fixture(context, { files: { "Unmapped.pdf": "%PDF-1.7\nUnmapped" } });
  await assert.rejects(loadPdfShares(directory), /unmapped|mapping|Unmapped\.pdf/i);
});

test("missing declared covers fail rather than substituting a generic social image", async (context) => {
  const directory = await fixture(context, { pages: { "paper.md": page({ cover_image: "/assets/missing.jpg" }) } });
  await assert.rejects(loadPdfShares(directory), /missing|exist|ENOENT/i);
});

for (const maliciousPath of [
  "/../Paper.pdf",
  "/%2e%2e/Paper.pdf",
  "/%252e%252e/Paper.pdf",
  "/assets/../../Paper.pdf",
  "/assets%2f..%2f..%2fPaper.pdf",
  "/assets\\..\\Paper.pdf",
  "https://evil.example/Paper.pdf",
  "//evil.example/Paper.pdf"
]) {
  test(`PDF paths reject traversal or remote URL: ${maliciousPath}`, async (context) => {
    const directory = await fixture(context, { pages: { "paper.md": page({ pdf_url: maliciousPath }) } });
    await assert.rejects(loadPdfShares(directory));
  });
}

test("cover paths reject encoded traversal independently of the PDF path", async (context) => {
  const directory = await fixture(context, {
    pages: { "paper.md": page({ cover_image: "/assets/%2e%2e/%2e%2e/cover.jpg" }) }
  });
  await assert.rejects(loadPdfShares(directory));
});

test("public share URLs preserve the configured base path and encode filenames", () => {
  assert.equal(
    publicUrl(siteConfig, "/share/A paper – résumé.html"),
    "https://example.org/research/share/A%20paper%20%E2%80%93%20r%C3%A9sum%C3%A9.html"
  );
});
