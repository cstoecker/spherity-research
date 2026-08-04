import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";

const DEFAULT_SITE_URL = "https://spherity.github.io/spherity-research";

const getArgument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};

const siteDirectory = path.resolve(getArgument("--site-dir", "_site"));
const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");

const xmlEscape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const toPublicPath = (file) => {
  const normalized = file.split(path.sep).join("/");
  if (normalized === "index.html") return "/";
  if (normalized.endsWith("/index.html")) {
    return `/${normalized.slice(0, -"index.html".length)}`;
  }
  return `/${normalized}`;
};

const encodePublicPath = (pathname) =>
  pathname
    .split("/")
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");

const priorityFor = (pathname) => {
  if (pathname === "/") return "1.0";
  if (pathname.endsWith(".html") || pathname.endsWith("/")) return "0.8";
  if (pathname.endsWith(".pdf")) return "0.7";
  return "0.5";
};

const attributeFromTag = (tag, attribute) =>
  tag?.match(new RegExp(`\\b${attribute}=["']([^"']+)["']`, "i"))?.[1];

const metadataFromHtml = (html) => {
  const canonicalTag = html.match(
    /<link\b[^>]*\brel=["']canonical["'][^>]*>/i
  )?.[0];
  const robotsTag = html.match(
    /<meta\b[^>]*\bname=["']robots["'][^>]*>/i
  )?.[0];
  const modifiedTag = html.match(
    /<meta\b[^>]*\bproperty=["']article:modified_time["'][^>]*>/i
  )?.[0];
  const publishedTag = html.match(
    /<meta\b[^>]*\bproperty=["']article:published_time["'][^>]*>/i
  )?.[0];
  const pdfTag = html.match(
    /<meta\b[^>]*\bname=["']citation_pdf_url["'][^>]*>/i
  )?.[0];

  return {
    canonical: attributeFromTag(canonicalTag, "href"),
    robots: attributeFromTag(robotsTag, "content") || "",
    modified: attributeFromTag(modifiedTag, "content"),
    published: attributeFromTag(publishedTag, "content"),
    pdfUrl: attributeFromTag(pdfTag, "content")
  };
};

const assertCanonicalSiteUrl = (location) => {
  const expected = new URL(siteUrl);
  const actual = new URL(location);
  const basePath = expected.pathname.replace(/\/+$/, "");
  if (
    actual.protocol !== "https:" ||
    actual.origin !== expected.origin ||
    (actual.pathname !== `${basePath}/` && !actual.pathname.startsWith(`${basePath}/`))
  ) {
    throw new Error(`Refusing non-canonical sitemap URL: ${location}`);
  }
};

const files = await glob("**/*.{html,pdf}", {
  cwd: siteDirectory,
  nodir: true,
  ignore: ["404.html", "google*.html"],
  windowsPathsNoEscape: true
});

const htmlMetadataByFile = new Map();
const lastModifiedByUrl = new Map();
for (const file of files.filter((candidate) => candidate.toLowerCase().endsWith(".html"))) {
  const html = await readFile(path.join(siteDirectory, file), "utf8");
  const metadata = metadataFromHtml(html);
  htmlMetadataByFile.set(file, metadata);
  const date = metadata.modified || metadata.published;
  if (!date || Number.isNaN(Date.parse(date))) continue;

  const pageUrl = metadata.canonical || `${siteUrl}${encodePublicPath(toPublicPath(file))}`;
  lastModifiedByUrl.set(pageUrl, date.slice(0, 10));
  if (metadata.pdfUrl) lastModifiedByUrl.set(metadata.pdfUrl, date.slice(0, 10));
}

const entriesByLocation = new Map();
for (const file of files) {
  const pathname = encodePublicPath(toPublicPath(file));
  const htmlMetadata = htmlMetadataByFile.get(file);
  if (htmlMetadata && /(?:^|,)\s*noindex\b/i.test(htmlMetadata.robots)) continue;

  const location = htmlMetadata?.canonical || `${siteUrl}${pathname}`;
  assertCanonicalSiteUrl(location);
  if (entriesByLocation.has(location)) {
    throw new Error(
      `Duplicate canonical sitemap URL ${location} from ${entriesByLocation.get(location).file} and ${file}`
    );
  }

  const fileMetadata = await stat(path.join(siteDirectory, file));
  entriesByLocation.set(location, {
    file,
    location,
    modified:
      lastModifiedByUrl.get(location) || fileMetadata.mtime.toISOString().slice(0, 10),
    priority: priorityFor(new URL(location).pathname)
  });
}

const entries = [...entriesByLocation.values()].sort((left, right) =>
  left.location.localeCompare(right.location)
);

if (!entries.some(({ location }) => location === `${siteUrl}/`)) {
  throw new Error(`The sitemap is missing the site root ${siteUrl}/`);
}

const body = entries
  .map(
    ({ location, modified, priority }) => `  <url>
    <loc>${xmlEscape(location)}</loc>
    <lastmod>${modified}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

await writeFile(path.join(siteDirectory, "sitemap.xml"), sitemap, "utf8");
const htmlCount = entries.filter(({ file }) => file.toLowerCase().endsWith(".html")).length;
const pdfCount = entries.filter(({ file }) => file.toLowerCase().endsWith(".pdf")).length;
console.log(
  `Generated sitemap.xml with ${entries.length} canonical URLs (${htmlCount} HTML pages and ${pdfCount} PDFs).`
);
