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

const files = await glob("**/*.{html,pdf}", {
  cwd: siteDirectory,
  nodir: true,
  ignore: ["404.html", "google*.html"],
  windowsPathsNoEscape: true
});

const lastModifiedByUrl = new Map();
for (const file of files.filter((candidate) => candidate.toLowerCase().endsWith(".html"))) {
  const html = await readFile(path.join(siteDirectory, file), "utf8");
  const modified = html.match(
    /<meta\b[^>]*property=["']article:modified_time["'][^>]*content=["']([^"']+)["'][^>]*>/i
  )?.[1];
  const published = html.match(
    /<meta\b[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["'][^>]*>/i
  )?.[1];
  const date = modified || published;
  if (!date || Number.isNaN(Date.parse(date))) continue;

  lastModifiedByUrl.set(`${siteUrl}${encodePublicPath(toPublicPath(file))}`, date.slice(0, 10));
  const pdfUrl = html.match(
    /<meta\b[^>]*name=["']citation_pdf_url["'][^>]*content=["']([^"']+)["'][^>]*>/i
  )?.[1];
  if (pdfUrl) lastModifiedByUrl.set(pdfUrl, date.slice(0, 10));
}

const entries = await Promise.all(
  files
    .sort((left, right) => toPublicPath(left).localeCompare(toPublicPath(right)))
    .map(async (file) => {
      const pathname = encodePublicPath(toPublicPath(file));
      const metadata = await stat(path.join(siteDirectory, file));
      const location = `${siteUrl}${pathname}`;
      return {
        location,
        modified: lastModifiedByUrl.get(location) || metadata.mtime.toISOString().slice(0, 10),
        priority: priorityFor(pathname)
      };
    })
);

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
console.log(`Generated sitemap.xml with ${entries.length} public URLs.`);
