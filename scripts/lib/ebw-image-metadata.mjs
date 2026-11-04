import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {parse} from 'yaml';

export const ebwPaperPath = '/ebw-roadmap.html';
export async function loadEbwImageMetadata(sourceDirectory = 'docs') {
  const source = await readFile(path.join(sourceDirectory, 'ebw-roadmap.md'), 'utf8');
  const page = parse(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
  const baseUrl = new URL('.', page.canonical_url);
  const base = {
    creator: page.authors[0], credit: `${page.authors[0]} / ${page.affiliation}`,
    rights: `© 2026 ${page.authors[0]}, ${page.affiliation}. CC BY 4.0. ${page.license_exclusions}`,
    license: page.license, licensePage: `${page.canonical_url}#license-and-citation`,
    source: page.canonical_url, metadataDate: String(page.last_modified_at).slice(0, 10)
  };
  const assets = Object.fromEntries(page.figure_objects.map(figure => [figure.content_url, {
    ...base, title: figure.name, description: `${figure.description} ${figure.caption}`,
    creator: figure.creator_name, credit: figure.credit_text, keywords: figure.keywords,
    format: 'image/svg+xml'
  }]));
  for (const figure of page.figure_objects) {
    if (figure.raster_url) assets[figure.raster_url] = {...assets[figure.content_url],
      format: 'image/png', source: new URL(figure.content_url.slice(1), baseUrl).href};
  }
  // Cover and paper-card metadata describe the actual research, not a launch graphic.
  const researchKeywords = ['European Business Wallet', 'EBW regulation', 'EUDI Wallet', 'Conditional roadmap', 'Cyber-resilience', 'Trusted AI'];
  assets[page.cover_image] = {...base, title: `${page.citation_title} — cover`,
    description: page.cover_image_alt, keywords: researchKeywords,
    source: new URL(page.pdf_url.slice(1), baseUrl).href, format: 'image/jpeg'};
  assets[page.image] = {...base, creator: page.affiliation, credit: 'Spherity Research / Spherity GmbH',
    title: `${page.title} — research preview`, description: page.image_alt,
    keywords: researchKeywords, format: 'image/webp'};
  assets['/assets/pdf-share/Spherity-Research-European-Business-Wallet-Regulation-And-Roadmap.jpg'] = {
    ...assets[page.cover_image], title: `${page.citation_title} — PDF sharing preview`,
    description: 'Complete first-page screenshot of the European Business Wallet research manuscript, fitted without cropping.'
  };
  return assets;
}
