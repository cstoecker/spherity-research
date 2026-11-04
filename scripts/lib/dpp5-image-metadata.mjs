import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {parse} from 'yaml';

export const dpp5PaperPath = '/eu-dpp-registry-w3c-dpp5.html';
export async function loadDpp5ImageMetadata(sourceDirectory = 'docs') {
  const source = await readFile(path.join(sourceDirectory, 'eu-dpp-registry-w3c-dpp5.md'), 'utf8');
  const page = parse(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
  const base = {
    creator: page.authors[0], credit: `${page.authors[0]} / ${page.affiliation}`,
    rights: `© 2026 ${page.authors[0]}, ${page.affiliation}. CC BY 4.0 for original research. ${page.license_exclusions}`,
    license: page.license, licensePage: `${page.canonical_url}#license-and-citation`,
    source: page.canonical_url, metadataDate: page.last_modified_at, keywords: page.keywords
  };
  return {
    [page.cover_image]: {...base, title: `${page.title} — paper cover`,
      description: page.cover_image_alt, format: 'image/jpeg',
      source: new URL(page.pdf_url.slice(1), new URL('.', page.canonical_url)).href},
    [page.image]: {...base, title: `${page.title} — research preview`,
      description: page.image_alt, format: 'image/webp',
      creator: page.affiliation, credit: 'Spherity Research / Spherity GmbH',
      rights: `© 2026 Spherity GmbH. CC BY 4.0 for original research. ${page.license_exclusions}`},
    ['/assets/pdf-share/' + path.basename(page.pdf_url, '.pdf') + '.jpg']: {
      ...base, title: `${page.title} — PDF sharing preview`,
      description: page.cover_image_alt, format: 'image/jpeg',
      source: new URL(page.pdf_url.slice(1), new URL('.', page.canonical_url)).href
    }
  };
}
