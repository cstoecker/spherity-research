import { access, readFile, realpath, stat } from "node:fs/promises";
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
  const figureDownloads = new Map();
  const placeholderDownloads = new Map();
  for (const sourceFile of (await glob("*.md", { cwd: root })).sort()) {
    const source = await readFile(path.join(root, sourceFile), "utf8");
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!frontmatter) continue;
    const page = parseYaml(frontmatter[1]);
    if (page?.paper_placeholder !== undefined) {
      const placeholder = page.paper_placeholder;
      const robots = String(page.robots || "").toLowerCase().split(/[,\s]+/).filter(Boolean);
      if (page.paper_in_preparation !== true || page.publication_state !== "draft" || !robots.includes("noindex") || robots.includes("index")) {
        throw new Error(`${sourceFile}: a paper placeholder requires paper_in_preparation: true, publication_state: draft and noindex robots.`);
      }
      if (page.pdf_url || page.associated_media?.length) {
        throw new Error(`${sourceFile}: a paper placeholder cannot declare published-paper PDF media.`);
      }
      if (!placeholder || typeof placeholder.label !== "string" || !placeholder.label.trim() || typeof placeholder.description !== "string" || !placeholder.description.trim()) {
        throw new Error(`${sourceFile}: paper_placeholder requires a label and description identifying its incomplete status.`);
      }
      const pdfPath = localPath(placeholder.url, `${sourceFile} placeholder PDF`, [".pdf"]);
      const pagePath = localPath(page.permalink, `${sourceFile} placeholder owner`, [".html"]);
      if (page.canonical_url !== publicUrl(config, pagePath)) throw new Error(`${sourceFile}: placeholder canonical URL must match its HTML owner.`);
      const pdfFile = path.join(root, pdfPath.slice(1));
      let resolvedRoot, resolvedPdf, pdfInfo, pdfBytes;
      try {
        [resolvedRoot, resolvedPdf, pdfInfo, pdfBytes] = await Promise.all([realpath(root), realpath(pdfFile), stat(pdfFile), readFile(pdfFile)]);
      } catch {
        throw new Error(`${sourceFile}: missing placeholder PDF ${pdfPath}.`);
      }
      const relative = path.relative(resolvedRoot, resolvedPdf);
      if (!pdfInfo.isFile() || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`${sourceFile}: placeholder PDF must be a file contained in the source directory.`);
      if (pdfBytes.toString("ascii", 0, 5) !== "%PDF-") throw new Error(`${sourceFile}: placeholder must contain PDF bytes.`);
      if ([...placeholderDownloads.keys()].some(value => value.toLowerCase() === pdfPath.toLowerCase())) throw new Error(`${sourceFile}: duplicate placeholder PDF ownership for ${pdfPath}.`);
      placeholderDownloads.set(pdfPath, { sourceFile, pagePath, label: placeholder.label, description: placeholder.description });
    }
    for (const figure of page?.figure_objects || []) {
      for (const download of figure.downloads || []) {
        if (!figure.id || !figure.content_url || !download.name) {
          throw new Error(`${sourceFile}: supplemental figure PDFs require a figure id, image and download name.`);
        }
        const figurePath = localPath(figure.content_url, `${sourceFile} figure`, ['.svg', '.png', '.jpg', '.jpeg', '.webp']);
        const pdfPath = localPath(download.url, `${sourceFile} figure PDF`, ['.pdf']);
        for (const asset of [figurePath, pdfPath]) {
          try { await access(path.join(root, asset.slice(1))); }
          catch { throw new Error(`${sourceFile}: missing supplemental figure asset ${asset}`); }
        }
        figureDownloads.set(pdfPath, { sourceFile, figureId: figure.id, name: download.name });
      }
    }
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

  for (const pdfPath of placeholderDownloads.keys()) {
    if ([...candidates.keys(), ...figureDownloads.keys()].some(value => value.toLowerCase() === pdfPath.toLowerCase())) {
      throw new Error(`${pdfPath}: a placeholder PDF cannot also be a paper or supplemental figure.`);
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
    const pdfPath = `/${file.replaceAll("\\", "/")}`;
    if (candidates.has(pdfPath) && figureDownloads.has(pdfPath)) {
      throw new Error(`${file}: a PDF cannot be both a paper and a supplemental figure.`);
    }
    if (!candidates.has(pdfPath) && !figureDownloads.has(pdfPath) && !placeholderDownloads.has(pdfPath)) {
      throw new Error(`${file}: PDF has no paper page / screenshot sharing mapping.`);
    }
  }
  return { config, records: records.sort((a, b) => a.pdfPath.localeCompare(b.pdfPath)), figureDownloads, placeholderDownloads };
}
