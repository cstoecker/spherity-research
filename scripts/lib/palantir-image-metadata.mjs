import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {parse} from 'yaml';

export const palantirPages = ['/europes-answer-to-palantir.html', '/global-cooperation-sovereign-industrial-ai.html'];
export async function loadPalantirPage(sourceDirectory = 'docs', slug = 'europes-answer-to-palantir') {
  const source = await readFile(path.join(sourceDirectory, slug + '.md'), 'utf8');
  return parse(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
}
export async function loadPalantirImageMetadata(sourceDirectory = 'docs') {
  const page = await loadPalantirPage(sourceDirectory);
  const academic = await loadPalantirPage(sourceDirectory, 'global-cooperation-sovereign-industrial-ai');
  const baseUrl = new URL('.', page.canonical_url);
  const base = {
    creator: page.authors[0], credit: `${page.authors[0]} / ${page.affiliation}`,
    rights: `© 2026 ${page.authors[0]}, ${page.affiliation}. CC BY 4.0 except where otherwise noted. Referenced third-party material retains its own terms.`,
    license: page.license, licensePage: `${page.canonical_url}#license-and-citation`,
    source: page.canonical_url, metadataDate: '2026-11-01'
  };
  const assets = {};
  for (const figure of page.figure_objects) {
    const metadata = {...base, title: figure.name, description: `${figure.description} ${figure.caption}`,
      creator: figure.creator_name, credit: figure.credit_text, keywords: figure.keywords,
      source: `${page.canonical_url}#${figure.id}-figure`};
    assets[figure.content_url] = {...metadata, format: 'image/svg+xml'};
    assets[figure.raster_url] = {...metadata, format: 'image/png'};
  }
  for (const media of page.associated_media) {
    const work = page.research_works.find(work => work.pdf_url === media.url);
    const metadata = {...base, title: `${work.title} — version ${work.version} cover`,
      description: media.cover_image_alt, keywords: page.keywords, format: 'image/jpeg',
      source: new URL(media.url.slice(1), baseUrl).href};
    assets[media.cover_image] = metadata;
    assets['/assets/pdf-share/' + path.basename(media.url, '.pdf') + '.jpg'] = {
      ...metadata, title: `${work.title} — PDF sharing preview`,
      description: `Complete first-page screenshot of ${work.title}, version ${work.version}, fitted without cropping.`
    };
  }
  for (const entry of [page, academic]) assets[entry.image] = {...base,
    title: `${entry.title} — research preview`, description: entry.image_alt,
    source: entry.canonical_url, keywords: entry.keywords, format: 'image/webp',
    creator: page.affiliation, credit: 'Spherity Research / Spherity GmbH'};
  return assets;
}
