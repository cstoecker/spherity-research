import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { loadPdfShares, publicUrl } from "./lib/pdf-sharing.mjs";

const option = (key, fallback) => {
  const index = process.argv.indexOf(key);
  return index >= 0 ? process.argv[index + 1] : fallback;
};
const sourceDirectory = path.resolve(option("--source-dir", "docs"));
const siteDirectory = path.resolve(option("--site-dir", "_site"));
const { config, records } = await loadPdfShares(sourceDirectory);
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const relativeUrl = (value) => `${config.baseurl || ""}${value.split("/").map(encodeURIComponent).join("/")}`;

await access(path.join(siteDirectory, "index.html")); // Always run after the site build.
await mkdir(path.join(siteDirectory, "share"), { recursive: true });
await mkdir(path.join(siteDirectory, "assets", "pdf-share"), { recursive: true });
for (const record of records) {
  const sourceCover = path.join(sourceDirectory, record.coverPath.slice(1));
  const cover = await sharp(sourceCover).flatten({ background: "#ffffff" })
    .resize({ width: 1040, height: 590, fit: "inside" }).png().toBuffer({ resolveWithObject: true });
  const left = Math.floor((1200 - cover.info.width) / 2);
  const top = Math.floor((630 - cover.info.height) / 2);
  // Letterbox, rather than crop, so titles, page edges and all author names survive.
  // No font rendering: the existing first-page screenshot is the complete artwork.
  const border = await sharp({ create: { width: cover.info.width + 4, height: cover.info.height + 4,
    channels: 3, background: "#ced8df" } }).png().toBuffer();
  const image = await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#eef3f6" } })
    .composite([{ input: border, left: left - 2, top: top - 2 }, { input: cover.data, left, top }])
    .jpeg({ quality: 90, mozjpeg: true }).toBuffer();
  if (image.length > 250 * 1024) throw new Error(`${record.pdfPath}: screenshot preview exceeds 250 KB.`);
  await writeFile(path.join(siteDirectory, record.imagePath.slice(1)), image);
  const coverMetadata = await sharp(sourceCover).metadata();
  const shareUrl = publicUrl(config, record.sharePath);
  const imageUrl = publicUrl(config, record.imagePath);
  const pdfUrl = relativeUrl(record.pdfPath);
  const html = `<!doctype html>
<html lang="${escape(record.lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(record.title)} | Spherity Research</title>
  <meta name="description" content="${escape(record.description)}">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${escape(record.canonicalUrl)}">
  <link rel="alternate" type="application/pdf" href="${escape(publicUrl(config, record.pdfPath))}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Spherity Research">
  <meta property="og:title" content="${escape(record.title)}">
  <meta property="og:description" content="${escape(record.description)}">
  <meta property="og:url" content="${escape(shareUrl)}">
  <meta property="og:image" content="${escape(imageUrl)}">
  <meta property="og:image:secure_url" content="${escape(imageUrl)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escape(record.alt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(record.title)}">
  <meta name="twitter:description" content="${escape(record.description)}">
  <meta name="twitter:image" content="${escape(imageUrl)}">
  <meta name="twitter:image:alt" content="${escape(record.alt)}">
  <link rel="icon" type="image/png" href="${escape(relativeUrl(config.favicon || "/assets/spherity_logo_336x336_centered_margins.png"))}">
  <link rel="stylesheet" href="${escape(relativeUrl("/assets/pdf-share.css"))}">
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <header><a href="${escape(relativeUrl("/"))}">Spherity Research</a><span>Paper download &amp; sharing</span></header>
  <main id="main-content">
    <div class="paper-details">
      <p class="eyebrow">Research publication · PDF</p>
      <h1>${escape(record.title)}</h1>
      <p class="authors">${escape(record.authors.join(" · "))}</p>
      <p>${escape(record.description)}</p>
      <nav class="actions" aria-label="Read this publication">
        <a class="button primary" href="${escape(pdfUrl)}">Read PDF <span aria-hidden="true">↗</span></a>
        <a class="button" href="${escape(relativeUrl(record.pagePath))}">Research page</a>
      </nav>
      <section class="sharing" aria-labelledby="sharing-title">
        <h2 id="sharing-title">Share this PDF with a cover preview</h2>
        <p>Use this page’s link on social media. Direct PDF links may appear without a preview image.</p>
        <label for="sharing-url">Sharing link</label>
        <input id="sharing-url" type="url" readonly value="${escape(shareUrl)}">
        <div class="actions">
          <button class="button" type="button" id="copy-share-link">Copy sharing link</button>
          <a class="button" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener noreferrer">Share on LinkedIn</a>
        </div>
        <p id="copy-feedback" role="status" aria-live="polite"></p>
      </section>
      <p class="rights">For the full summary, references, licensing and citation details, visit the <a href="${escape(relativeUrl(record.pagePath))}#license-and-citation">research page</a>. Third-party material retains its respective rights.</p>
    </div>
    <figure>
      <a href="${escape(pdfUrl)}" aria-label="${escape(`Read ${record.title} as a PDF`)}">
        <img src="${escape(relativeUrl(record.coverPath))}" alt="${escape(record.alt)}" width="${coverMetadata.width}" height="${coverMetadata.height}" fetchpriority="high">
      </a>
      <figcaption>First-page screenshot of the PDF. Select the image to read the document.</figcaption>
    </figure>
  </main>
  <script src="${escape(relativeUrl("/assets/pdf-share.js"))}" defer></script>
</body>
</html>
`;
  // Never overwrite an existing source page; this directory is generated only.
  try {
    await access(path.join(sourceDirectory, record.sharePath.slice(1)));
    throw new Error(`${record.sharePath}: conflicts with an authored source page.`);
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  await writeFile(path.join(siteDirectory, record.sharePath.slice(1)), html, "utf8");
}
console.log(`Generated ${records.length} PDF sharing pages with uncropped 1200×630 JPEG cover previews. Original PDFs and paper cards are unchanged.`);
