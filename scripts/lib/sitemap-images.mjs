import {readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {glob} from 'glob';
import {parse} from 'yaml';

// Opt-in keeps the change scoped to publications whose image rights were reviewed.
export async function loadSitemapImages(sourceDirectory, siteDirectory, siteUrl) {
  const result = new Map();
  for (const filename of await glob('*.md', {cwd: sourceDirectory})) {
    const source = await readFile(path.join(sourceDirectory, filename), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) continue;
    const page = parse(frontmatter[1]);
    if (!page.image_sitemap || page.publication_state === 'draft' || /noindex/i.test(page.robots || '')) continue;
    const images = [...new Set([...(page.figure_objects || []).flatMap(figure => [figure.content_url, figure.raster_url]), page.cover_image, page.image,
      ...(page.associated_media || []).map(media => media.cover_image), ...(page.sitemap_images || [])].filter(Boolean))];
    const urls = [];
    for (const asset of images) {
      if (!/^\/assets\/[^?#]+\.(?:svg|png|jpe?g|webp|avif)$/i.test(asset)) throw new Error(`Unsupported sitemap image: ${asset}`);
      const local = path.resolve(siteDirectory, `.${asset}`);
      if (!local.startsWith(path.resolve(siteDirectory) + path.sep) || !(await stat(local)).isFile()) throw new Error(`Missing sitemap image: ${asset}`);
      urls.push(`${siteUrl}${asset.split('/').map(encodeURIComponent).join('/')}`);
    }
    result.set(page.canonical_url || `${siteUrl}${page.permalink}`, urls);
  }
  return result;
}

// Explicit opt-in for standalone figure PDFs and research-data downloads.
// Sharing aliases, runtime scripts and stylesheets are not index destinations.
export async function loadSitemapDownloads(sourceDirectory, siteDirectory) {
  const result = new Map();
  for (const filename of await glob('*.md', {cwd: sourceDirectory})) {
    const source = await readFile(path.join(sourceDirectory, filename), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frontmatter) continue;
    const page = parse(frontmatter[1]);
    if (page.publication_state === 'draft' || /noindex/i.test(page.robots || '')) continue;
    for (const asset of page.sitemap_downloads || []) {
      if (!/^\/(?:assets\/[\w./-]+\.(?:pdf|json)|[\w.-]+\.pdf)$/i.test(asset) || asset.includes('..')) throw new Error(`Unsupported sitemap download: ${asset}`);
      const local = path.resolve(siteDirectory, `.${asset}`);
      if (!local.startsWith(path.resolve(siteDirectory) + path.sep) || !(await stat(local)).isFile()) throw new Error(`Missing sitemap download: ${asset}`);
      const modified = String(page.last_modified_at || page.date).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(modified)) throw new Error(`Missing source date for sitemap download: ${asset}`);
      result.set(asset, modified);
    }
  }
  return result;
}
