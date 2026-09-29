import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import { parse as parseYaml } from "yaml";

// Share pages are an HTML alternative, never a replacement for a cited PDF URL.
export const publicUrl = (config, pathname) =>
  `${config.url.replace(/\/+$/, "")}${(config.baseurl || "").replace(/\/+$/, "")}${pathname
    .split("/").map((part) => encodeURIComponent(part)).join("/")}`;

const localPath = (value, label, extensions) => {
  if (typeof value !== "string") throw new Error(`${label}: missing local path.`);
  const decoded = decodeURIComponent(value);
  if (!decoded.startsWith("/") || decoded.startsWith("//") ||
      /[\\?#%\x00-\x1f]/.test(decoded) ||
      decoded.split("/").some((part) => part === "." || part === "..") ||
      !extensions.includes(path.posix.extname(decoded).toLowerCase())) {
    throw new Error(`${label}: unsafe or unsupported local path ${value}`);
  }
  return decoded;
};

export async function loadPdfShares(sourceDirectory = "docs") {
  const root = path.resolve(sourceDirectory);
  const config = parseYaml(await readFile(path.join(root, "_config.yml"), "utf8"));
  if (!/^https:\/\//.test(config.url || "")) throw new Error("PDF sharing requires an HTTPS site.url.");
  const candidates = new Map();
  for (const sourceFile of (await glob("*.md", { cwd: root })).sort()) {
    const source = await readFile(path.join(root, sourceFile), "utf8");
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!frontmatter) continue;
    const page = parseYaml(frontmatter[1]);
    if (!page?.pdf_url && !page?.associated_media?.length) continue;
    const pagePath = localPath(page.permalink, `${sourceFile} permalink`, [".html"]);
    const canonicalUrl = publicUrl(config, pagePath);
    if (page.canonical_url !== canonicalUrl) {
      throw new Error(`${sourceFile}: canonical URL must match its published HTML path.`);
    }
    const media = page.associated_media?.length ? page.associated_media : [{
      name: page.pdf_title || page.title, url: page.pdf_url,
      cover_image: page.cover_image
    }];
    const primaryPdf = page.pdf_url ? localPath(page.pdf_url, `${sourceFile} pdf_url`, [".pdf"]) : null;
    if (primaryPdf && !media.some((item) => localPath(item.url, `${sourceFile} media`, [".pdf"]) === primaryPdf)) {
      throw new Error(`${sourceFile}: associated_media omits pdf_url.`);
    }
    for (const item of media) {
      const pdfPath = localPath(item.url, `${sourceFile} PDF`, [".pdf"]);
      const coverPath = localPath(item.cover_image || (media.length === 1 ? page.cover_image : null),
        `${sourceFile}: ${pdfPath} cover_image`, [".png", ".jpg", ".jpeg", ".webp"]);
      for (const assetPath of [pdfPath, coverPath]) {
        try { await access(path.join(root, assetPath.slice(1))); }
        catch { throw new Error(`${sourceFile}: missing PDF sharing asset ${assetPath}`); }
      }
      const title = item.name || page.title;
      const description = item.description || page.description;
      if (!title || !description) throw new Error(`${sourceFile}: PDF sharing requires a title and description.`);
      const entry = {
        pdfPath, coverPath, pagePath, canonicalUrl, title, description,
        alt: item.cover_image_alt || (coverPath === page.cover_image ? page.cover_image_alt : null) || `First page of ${title}.`,
        authors: page.authors || [page.author || config.author?.name].filter(Boolean),
        lang: page.lang || "en", sourceFile, primary: primaryPdf === pdfPath
      };
      const previous = candidates.get(pdfPath) || [];
      if (previous.some((candidate) => candidate.coverPath !== coverPath)) {
        throw new Error(`${pdfPath}: conflicting cover_image mappings across paper pages.`);
      }
      candidates.set(pdfPath, [...previous, entry]);
    }
  }

  const records = [];
  const outputPaths = new Set();
  for (const [pdfPath, entries] of candidates) {
    const primaries = entries.filter((entry) => entry.primary);
    if (primaries.length > 1 || (!primaries.length && entries.length > 1)) {
      throw new Error(`${pdfPath}: ambiguous primary paper page for PDF sharing.`);
    }
    const owner = primaries[0] || entries[0];
    const basename = path.posix.basename(pdfPath).replace(/\.pdf$/i, "");
    const sharePath = `/share/${basename}.html`;
    if (outputPaths.has(sharePath.toLowerCase())) throw new Error(`${pdfPath}: duplicate PDF sharing filename.`);
    outputPaths.add(sharePath.toLowerCase());
    records.push({ ...owner, sharePath, imagePath: `/assets/pdf-share/${basename}.jpg`,
      references: entries.map(({ pagePath, sourceFile }) => ({ pagePath, sourceFile })) });
  }
  for (const file of await glob("**/*.pdf", { cwd: root, nocase: true, windowsPathsNoEscape: true })) {
    if (!candidates.has(`/${file.replaceAll("\\", "/")}`)) {
      throw new Error(`${file}: PDF has no paper page / screenshot sharing mapping.`);
    }
  }
  return { config, records: records.sort((a, b) => a.pdfPath.localeCompare(b.pdfPath)) };
}
