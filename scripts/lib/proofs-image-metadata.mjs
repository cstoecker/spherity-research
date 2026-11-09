import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {parse} from 'yaml';

export const proofsPaperPath = '/proofs-over-statements-evidence-graphs.html';

export function createProofsImageMetadata(page) {
  const author = page.authors[0];
  const baseUrl = new URL('.', page.canonical_url);
  const exclusions = page.license_exclusions || 'Third-party material retains its own terms. Spherity names and logos are excluded.';
  const base = {
    creator: author, credit: `${author} / ${page.affiliation}`,
    rights: `© 2026 ${author}, ${page.affiliation}. CC BY 4.0 for original research. ${exclusions}`,
    license: page.license, licensePage: `${page.canonical_url}#license-and-citation`,
    source: page.canonical_url, metadataDate: String(page.last_modified_at).slice(0, 10),
    keywords: page.keywords
  };
  const assets = {};
  for (const media of page.associated_media || []) {
    const metadata = {
      ...base, title: `${media.name} — first-page cover`,
      description: media.cover_image_alt, format: 'image/jpeg',
      source: new URL(media.url.slice(1), baseUrl).href
    };
    assets[media.cover_image] = metadata;
    assets[`/assets/pdf-share/${path.basename(media.url, '.pdf')}.jpg`] = {
      ...metadata, title: `${media.name} — PDF sharing preview`,
      description: `Complete first-page screenshot of ${media.name}, fitted without cropping.`
    };
  }
  assets[page.image] = {
    ...base, title: `${page.title} — research preview`, description: page.image_alt,
    creator: page.affiliation, credit: 'Spherity Research / Spherity GmbH', format: 'image/webp'
  };
  return assets;
}

export async function loadProofsImageMetadata(sourceDirectory = 'docs') {
  const source = await readFile(path.join(sourceDirectory, 'proofs-over-statements-evidence-graphs.md'), 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) throw new Error('Proofs over Statements page requires YAML front matter.');
  return createProofsImageMetadata(parse(frontmatter[1]));
}
