import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {parse} from 'yaml';

export const dppPaperPath = '/global-digital-product-passport-regulation.html';
export async function loadDppImageMetadata(sourceDirectory = 'docs') {
  const source = await readFile(path.join(sourceDirectory, 'global-digital-product-passport-regulation.md'), 'utf8');
  const page = parse(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
  const origin = new URL('.', page.canonical_url).href;
  const base = {
    creator: page.authors[0],
    credit: `${page.authors[0]} / Spherity GmbH`,
    rights: `© 2026 ${page.authors[0]}. CC BY 4.0, except where otherwise noted. ${page.license_exclusions}`,
    license: page.license,
    licensePage: `${page.canonical_url}#license-and-citation`,
    source: page.canonical_url,
    metadataDate: String(page.last_modified_at).slice(0, 10),
    keywords: page.keywords
  };
  const assets = Object.fromEntries(page.figure_objects.map(figure => [figure.content_url, {
    ...base, title: figure.name, description: `${figure.description} ${figure.caption}`,
    creator: figure.creator_name, credit: figure.credit_text,
    keywords: figure.keywords, format: 'image/svg+xml',
    source: new URL(figure.downloads[0].url.replace(/^\//, ''), origin).href
  }]));
  assets[page.cover_image] = {...base, title: `${page.citation_title} — cover`, description: page.cover_image_alt, source: new URL(page.pdf_url.replace(/^\//, ''), origin).href, format: 'image/jpeg'};
  assets[page.image] = {...base, title: `${page.title} — paper and world Atlas`, description: page.image_alt, format: 'image/webp'};
  const map = {...base, title: 'Selected DPP regulatory phases, 25 October 2026', description: 'Country colours represent specifically sourced measures, not national readiness. Stripes indicate territorial scope. Grey means unassessed; Great Britain and Northern Ireland require separate details. Natural Earth geometry is public domain.', keywords: ['Digital Product Passport', 'DPP regulation', 'World map', 'Regulatory phases', 'Global DPP Atlas'], format: 'image/svg+xml'};
  assets['/assets/dpp-global/whitepaper-v1/regulatory-social-map.svg'] = map;
  assets['/assets/dpp-global/whitepaper-v1/regulatory-social-map.png'] = {...map, format: 'image/png'};
  assets['/assets/social/global-dpp-atlas.jpg'] = {
    ...base, title: 'Global DPP Atlas — interactive world map and knowledge graph',
    description: 'Global DPP Atlas with a world map of selected DPP regulatory phases and Spherity Research branding. Colours describe specific sourced measures, not national readiness. Natural Earth geometry is public domain.',
    source: new URL('dpp-explorer/', origin).href,
    keywords: map.keywords, format: 'image/jpeg'
  };
  assets['/assets/pdf-share/Spherity-Research-Global-DPP-Whitepaper.jpg'] = {...assets[page.cover_image], title: `${page.citation_title} — PDF sharing preview`, description: 'Complete first-page screenshot of the whitepaper, fitted within a sharing card without cropping.'};
  return assets;
}
