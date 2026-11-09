import {dpp5PaperPath, loadDpp5ImageMetadata} from "./lib/dpp5-image-metadata.mjs";
import {prepareHomepageCard, renderHomepageCard} from "./lib/homepage-social-card.mjs";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import { parse as parseYaml } from "yaml";
import { embedImageXmp } from "./lib/image-metadata.mjs";
import { dppPaperPath, loadDppImageMetadata } from "./lib/dpp-image-metadata.mjs";
import { ebwPaperPath, loadEbwImageMetadata } from "./lib/ebw-image-metadata.mjs";
import { palantirPages, loadPalantirImageMetadata } from "./lib/palantir-image-metadata.mjs";
import { proofsPaperPath, loadProofsImageMetadata } from "./lib/proofs-image-metadata.mjs";

const projectDirectory = process.cwd();
const sourceDirectory = path.join(projectDirectory, "docs");
const manifestPath = path.join(sourceDirectory, "_data", "social_cards.yml");
const publicationsPath = path.join(sourceDirectory, "_data", "publications.yml");

const manifest = parseYaml(await readFile(manifestPath, "utf8"));
const dppImageMetadata = manifest.some(card => card.publication_url === dppPaperPath)
  ? await loadDppImageMetadata(sourceDirectory) : {};
const imageMetadata = {...dppImageMetadata, ...(manifest.some(card => card.publication_url === dpp5PaperPath) ? await loadDpp5ImageMetadata(sourceDirectory) : {}), ...(manifest.some(card => card.publication_url === ebwPaperPath)
  ? await loadEbwImageMetadata(sourceDirectory) : {}), ...(manifest.some(card => palantirPages.includes(card.publication_url))
  ? await loadPalantirImageMetadata(sourceDirectory) : {}), ...(manifest.some(card => card.publication_url === proofsPaperPath)
  ? await loadProofsImageMetadata(sourceDirectory) : {})};
const publications = parseYaml(await readFile(publicationsPath, "utf8"));
const publicationsByUrl = new Map(
  publications.map((publication) => [publication.links?.[0]?.url, publication])
);
const checkOnly = process.argv.includes("--check");
const selectedUrl = process.argv.find(arg => arg.startsWith("--only="))?.slice(7);
if (selectedUrl && !manifest.some(card => card.publication_url === selectedUrl)) {
  throw new Error(`No social card is registered for ${selectedUrl}.`);
}

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const LEFT_TEXT_X = 72;
const LEFT_SAFE_RIGHT = 720;
const VISUAL_X = 780;
const VISUAL_WIDTH = 360;
const BYLINE_Y = 486;
const TOPIC_Y = 520;
const MAP_CARD = {
  map: { x: 72, y: 316, width: 648, height: 258 },
  paper: { x: 780, y: 50, width: 360, height: 510 },
  brandY: 82,
  formatY: 132,
  titleY: 194,
  deckGap: 45,
  bylineY: 592,
  label: { x: 105, y: 445, size: 20 }
};
const ATLAS_CARD = {
  textRight: 328,
  map: { x: 370, y: 138, width: 782, height: 398 },
  panel: { x: 350, y: 118, width: 822, height: 438 }
};
const textWidthCache = new Map();

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const publicFile = (url) =>
  path.join(sourceDirectory, decodeURIComponent(String(url)).replace(/^\/+/, ""));

const measureTextWidth = async (
  value,
  { family, size, weight = 400, letterSpacing = 0 }
) => {
  const key = JSON.stringify([value, family, size, weight, letterSpacing]);
  if (textWidthCache.has(key)) return textWidthCache.get(key);

  const baseline = Math.ceil(size * 1.6);
  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="2400" height="${baseline + 24}">
      <text x="4" y="${baseline}" fill="#ffffff"
        font-family="${escapeXml(family)}" font-size="${size}px"
        font-weight="${weight}" letter-spacing="${letterSpacing}px">${escapeXml(value)}</text>
    </svg>`);
  const measured = await sharp(svg).trim().png().toBuffer();
  const metadata = await sharp(measured).metadata();
  const width = metadata.width || 0;
  textWidthCache.set(key, width);
  return width;
};

const textLines = ({ lines, x, y, lineHeight, className }) => {
  if (!Array.isArray(lines) || lines.length === 0) return "";
  return `<text class="${className}" x="${x}" y="${y}">${lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("")}</text>`;
};

const topicPills = async (topics) => {
  let x = 72;
  const pills = [];
  for (const topic of topics.slice(0, 3)) {
    const fontSize = topic.length > 21 ? 13 : 14;
    const textWidth = await measureTextWidth(topic, {
      family: "Arial, sans-serif",
      size: fontSize,
      weight: 700
    });
    const width = Math.max(68, Math.ceil(textWidth + 28));
    pills.push(`<rect x="${x}" y="${TOPIC_Y}" width="${width}" height="38" rx="19" fill="#f4f7f8" />
      <text x="${x + width / 2}" y="544" text-anchor="middle" class="pill" style="font-size:${fontSize}px">${escapeXml(topic)}</text>`);
    x += width + 10;
  }
  return { markup: pills.join(""), right: x - 10 };
};

const prepareAtlasLayout = async (card) => {
  const problems = [];
  const titleSize = Number(card.title_size || 50);
  const linesFit = async (label, lines, size, right, family = "Arial, sans-serif", weight = 400) => {
    for (const line of lines || []) {
      const measured = await measureTextWidth(line, {family, size, weight});
      const allowance = process.platform !== "linux" && family.startsWith("Georgia") ? 1.16 : 1;
      const textRight = 72 + Math.ceil(measured * allowance);
      if (textRight > right) problems.push(`${label} “${line}” reaches portable x=${textRight}px; maximum is x=${right}px.`);
    }
  };
  await linesFit("Title", card.title_lines, titleSize, ATLAS_CARD.textRight, "Georgia, serif", 700);
  await linesFit("Format", [card.format_label], 13, ATLAS_CARD.textRight, "Arial, sans-serif", 700);
  await linesFit("Description", card.deck_lines, 20, ATLAS_CARD.textRight);
  await linesFit("Topic", card.topics, 17, ATLAS_CARD.textRight - 18, "Arial, sans-serif", 700);
  await linesFit("Byline", [card.byline], 16, 720);
  await linesFit("Scope note", [card.scope_note], 14, 72 + ATLAS_CARD.map.width);
  await linesFit("Call to action", [card.call_to_action], 18, 72 + 350, "Arial, sans-serif", 700);
  if (card.title_lines.length !== 2 || titleSize > 50 || card.deck_lines.length > 2 || card.topics.length !== 3) {
    problems.push("Atlas cards require two title lines, at most two description lines and three topics within their vertical safe areas.");
  }
  if (!card.scope_note || !card.call_to_action || !card.output.endsWith('.jpg')) {
    problems.push("Atlas cards require a scope note, call to action and JPEG output.");
  }
  const visual = await sharp(await readFile(publicFile(card.visual))).metadata();
  if (!visual.width || !visual.height) problems.push("Atlas map must have readable dimensions.");
  if (problems.length) throw new Error(`${card.publication_url}: social-card layout preflight failed:\n- ${problems.join('\n- ')}`);
  return {titleSize};
};

const prepareCardLayout = async (card, publication) => {
  if (card.layout === "research-collection") return prepareHomepageCard(card, measureTextWidth);
  if (card.layout === "atlas-map") return prepareAtlasLayout(card);
  const titleSize = Number(card.title_size || 48);
  const titleLineHeight = Math.round(titleSize * 1.16);
  const subtitleSize = Number(card.subtitle_size || 30);
  const subtitleLineHeight = Math.round(subtitleSize * 1.2);
  const titleY = card.map_visual ? MAP_CARD.titleY : 194;
  const titleBottom = titleY + (card.title_lines.length - 1) * titleLineHeight;
  const subtitleY = titleBottom + 48;
  const subtitleBottom = subtitleY + Math.max(0, (card.subtitle_lines?.length || 0) - 1) * subtitleLineHeight;
  const deckY = (card.subtitle_lines?.length ? subtitleBottom : titleBottom) + (card.map_visual ? MAP_CARD.deckGap : 45);
  const deckBottom = deckY + Math.max(0, (card.deck_lines?.length || 0) - 1) * 28;
  const pills = await topicPills(publication.topics || []);
  const problems = [];

  const assertLinesFit = async (label, lines, style, portableCharacterLimit) => {
    for (const line of lines || []) {
      const width = await measureTextWidth(line, style);
      const fallbackFactor =
        process.platform !== "linux" && style.family.startsWith("Georgia") ? 1.16 : 1;
      const right = LEFT_TEXT_X + Math.ceil(width * fallbackFactor);
      if (right > LEFT_SAFE_RIGHT) {
        problems.push(
          `${label} “${line}” reaches portable x=${right}px; maximum is x=${LEFT_SAFE_RIGHT}px`
        );
      }
      const characterCount = Array.from(line).length;
      if (portableCharacterLimit && characterCount > portableCharacterLimit) {
        problems.push(
          `${label} “${line}” contains ${characterCount} characters; portable limit is ${portableCharacterLimit}`
        );
      }
    }
  };

  await assertLinesFit("Format label", [card.format_label], {
    family: "Arial, sans-serif",
    size: 15,
    weight: 700,
    letterSpacing: 0.7
  }, 50);
  await assertLinesFit("Title line", card.title_lines, {
    family: "Georgia, serif",
    size: titleSize,
    weight: 700
  }, 30);
  await assertLinesFit("Subtitle line", card.subtitle_lines, {
    family: "Georgia, serif",
    size: subtitleSize
  }, 42);
  await assertLinesFit("Description line", card.deck_lines, {
    family: "Arial, sans-serif",
    size: 20
  }, 48);
  await assertLinesFit("Byline", [card.byline], {
    family: "Arial, sans-serif",
    size: 16
  }, 64);

  if (pills.right > LEFT_SAFE_RIGHT) {
    problems.push(
      `Topic row reaches x=${pills.right}px; maximum is x=${LEFT_SAFE_RIGHT}px`
    );
  }
  if (deckBottom > BYLINE_Y - 42) {
    problems.push(
      `Description ends at y=${deckBottom}px; it must retain 42px before the byline`
    );
  }
  if (TOPIC_Y + 38 > CARD_HEIGHT - 64) {
    problems.push("Topic row falls outside the lower safe area.");
  }

  if (card.map_visual) {
    const { map, paper, label } = MAP_CARD;
    if (Math.max(titleBottom, card.subtitle_lines?.length ? subtitleBottom : 0, deckBottom) > map.y - 16) {
      problems.push("Map-card text must retain at least 16px above the map.");
    }
    if (paper.x - Math.max(map.x + map.width, LEFT_SAFE_RIGHT) < 60) {
      problems.push("The map and text must retain the 60px gutter before the paper.");
    }
    if (map.y + map.height > MAP_CARD.bylineY - 18 || paper.x + paper.width > CARD_WIDTH - 40 || paper.y + paper.height > CARD_HEIGHT - 40) {
      problems.push("Map-card imagery must remain within its safe area and clear the byline.");
    }
    if (!card.map_label) problems.push("Map cards require their visible vertical map label.");
    const labelWidth = await measureTextWidth(card.map_label || "", {family:"Arial, sans-serif",size:label.size,weight:700,letterSpacing:1.4});
    const mapMetadata = await sharp(await readFile(publicFile(card.map_visual))).metadata();
    const mapScale = Math.min(map.width / mapMetadata.width, map.height / mapMetadata.height);
    const whiteMargin = (map.width - mapMetadata.width * mapScale) / 2;
    if (label.x - label.size < map.x + 8 || label.x + 8 > map.x + whiteMargin || label.y - labelWidth / 2 < map.y + 16 || label.y + labelWidth / 2 > map.y + map.height - 16) {
      problems.push("Rotated map label must fit within the map's white left margin without covering the map or legend.");
    }
  }
  if (problems.length) {
    throw new Error(
      `${card.publication_url}: social-card layout preflight failed:\n- ${problems.join("\n- ")}\n` +
      "Adjust line breaks or font size before generating the card."
    );
  }

  return {
    titleSize,
    titleLineHeight,
    subtitleSize,
    subtitleLineHeight,
    titleY,
    titleBottom,
    subtitleY,
    subtitleBottom,
    deckY,
    deckBottom,
    pills
  };
};

const riskOrbits = () => Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="360" height="510" viewBox="0 0 360 510">
    <rect width="360" height="510" fill="#0c2234"/>
    <g fill="none" stroke="#37658b" stroke-width="1.5" opacity="0.9">
      <ellipse cx="180" cy="255" rx="145" ry="78" transform="rotate(23 180 255)"/>
      <ellipse cx="180" cy="255" rx="145" ry="78" transform="rotate(78 180 255)"/>
      <ellipse cx="180" cy="255" rx="145" ry="78" transform="rotate(138 180 255)"/>
      <circle cx="180" cy="255" r="68" stroke="#71808d"/>
    </g>
    <g fill="#7be0bd" stroke="#dffbf1" stroke-width="2">
      <circle cx="84" cy="167" r="7"/><circle cx="279" cy="184" r="7"/><circle cx="223" cy="387" r="7"/>
    </g>
    <g fill="#65b7f4" stroke="#e1f2ff" stroke-width="2">
      <circle cx="71" cy="325" r="7"/><circle cx="265" cy="337" r="7"/><circle cx="222" cy="102" r="7"/>
    </g>
    <text x="180" y="235" text-anchor="middle" fill="#f7f9fa" font-family="Georgia, serif" font-size="35">AI × CYBER</text>
    <text x="180" y="276" text-anchor="middle" fill="#f7f9fa" font-family="Georgia, serif" font-size="35">× QUANTUM</text>
    <text x="180" y="310" text-anchor="middle" fill="#7be0bd" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="2">SYSTEMIC RISK</text>
  </svg>`);

const ebwTimeline = () => Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="360" height="510" viewBox="0 0 360 510">
    <rect width="360" height="510" fill="#f8fafb"/>
    <text x="30" y="58" fill="#0e5f65" font-family="Arial, sans-serif" font-size="17" font-weight="700">EUROPEAN BUSINESS WALLET</text>
    <text x="30" y="91" fill="#102333" font-family="Georgia, serif" font-size="25" font-weight="700">Roadmap to EU-wide</text>
    <text x="30" y="121" fill="#102333" font-family="Georgia, serif" font-size="25" font-weight="700">acceptance</text>
    <line x1="44" y1="237" x2="316" y2="237" stroke="#176c72" stroke-width="5"/>
    <g font-family="Arial, sans-serif" text-anchor="middle">
      <g transform="translate(52 237)"><circle r="14" fill="#7be0bd" stroke="#0e5f65" stroke-width="3"/><text y="-30" fill="#102333" font-size="19" font-weight="700">2026</text></g>
      <g transform="translate(137 237)"><circle r="14" fill="#65b7f4" stroke="#225c86" stroke-width="3"/><text y="-30" fill="#102333" font-size="19" font-weight="700">2027</text></g>
      <g transform="translate(222 237)"><circle r="14" fill="#7be0bd" stroke="#0e5f65" stroke-width="3"/><text y="-30" fill="#102333" font-size="19" font-weight="700">2028</text></g>
      <g transform="translate(307 237)"><circle r="14" fill="#65b7f4" stroke="#225c86" stroke-width="3"/><text y="-30" fill="#102333" font-size="19" font-weight="700">2029</text></g>
    </g>
    <g font-family="Arial, sans-serif" font-size="16" fill="#354b5a">
      <rect x="30" y="307" width="300" height="52" rx="8" fill="#eef3f5" stroke="#cbd6dc"/><text x="49" y="339">Policy · standards · conformance</text>
      <rect x="30" y="373" width="300" height="52" rx="8" fill="#eef3f5" stroke="#cbd6dc"/><text x="49" y="405">Pilots · adoption · operations</text>
    </g>
    <text x="30" y="470" fill="#0e5f65" font-family="Arial, sans-serif" font-size="14" font-weight="700" letter-spacing="1.5">LEGAL + OPERATIONAL GATES</text>
  </svg>`);

const renderAtlasCard = async (card, layout) => {
  const {map, panel} = ATLAS_CARD;
  const base = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#071b2a"/>
    <rect width="1200" height="10" fill="#4f98c7"/><rect width="16" height="630" fill="#7be0bd"/>
    <g stroke="#1c3446" stroke-width="1" opacity=".8">
      ${Array.from({length:12}, (_, i) => `<path d="M${97+i*96} 10V630"/>`).join('')}
      ${Array.from({length:6}, (_, i) => `<path d="M16 ${97+i*96}H1200"/>`).join('')}
    </g>
    <style>
      .title{font-family:Georgia,serif;font-size:${layout.titleSize}px;font-weight:700;fill:#f7f9fa}
      .deck{font:20px Arial,sans-serif;fill:#c6d2da}
    </style>
    <path d="M72 65H120" stroke="#7be0bd" stroke-width="2"/>
    <text x="135" y="71" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing=".5" fill="#7be0bd">SPHERITY RESEARCH</text>
    <text x="72" y="119" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#b9c6ce">${escapeXml(card.format_label)}</text>
    ${textLines({lines:card.title_lines,x:72,y:190,lineHeight:58,className:'title'})}
    ${textLines({lines:card.deck_lines,x:72,y:303,lineHeight:28,className:'deck'})}
    ${card.topics.map((topic,i)=>`<rect x="72" y="${373+i*46}" width="256" height="34" rx="17" fill="#142e40" stroke="#3d596b"/><text x="90" y="${396+i*46}" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#e8f2f6">${escapeXml(topic)}</text>`).join('')}
    <rect x="${panel.x+8}" y="${panel.y+8}" width="${panel.width}" height="${panel.height}" rx="14" fill="#02080d" opacity=".6"/>
    <rect x="${panel.x}" y="${panel.y}" width="${panel.width}" height="${panel.height}" rx="14" fill="#fff"/>
    <text x="${map.x}" y="578" font-family="Arial,sans-serif" font-size="14" fill="#bdccd5">${escapeXml(card.scope_note)}</text>
    <text x="72" y="609" font-family="Arial,sans-serif" font-size="16" fill="#b9c6ce">${escapeXml(card.byline)}</text>
    <text x="1152" y="609" text-anchor="end" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#7be0bd">${escapeXml(card.call_to_action)}</text>
  </svg>`);
  const mapPixels = await sharp(await readFile(publicFile(card.visual)))
    .resize(map.width, map.height, {fit:'contain',background:'#fff'}).flatten({background:'#fff'}).png().toBuffer();
  return sharp(base).composite([{input:mapPixels,left:map.x,top:map.y}])
    .jpeg({quality:90,chromaSubsampling:'4:4:4'}).toBuffer();
};

const renderGeneratedCard = async (card, publication, layout) => {
  if (card.layout === "research-collection") return renderHomepageCard(card);
  if (card.layout === "atlas-map") return renderAtlasCard(card, layout);
  const {
    titleSize,
    titleLineHeight,
    subtitleSize,
    subtitleLineHeight,
    titleY,
    titleBottom,
    subtitleY,
    subtitleBottom,
    deckY,
    pills
  } = layout;
  const mapCard = Boolean(card.map_visual);
  const paper = mapCard ? MAP_CARD.paper : {x:VISUAL_X,y:50,width:VISUAL_WIDTH,height:510};
  const brandY = mapCard ? MAP_CARD.brandY : 82;
  const baseSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
      <defs>
        <clipPath id="left-safe-area">
          <rect x="64" y="108" width="${LEFT_SAFE_RIGHT - 64}" height="${mapCard ? 505 : 450}" />
        </clipPath>
      </defs>
      <rect width="1200" height="630" fill="#071b2a"/>
      <rect width="1200" height="10" fill="#4f98c7"/>
      <rect width="16" height="630" fill="#7be0bd"/>
      <g stroke="#1c3446" stroke-width="1" opacity="0.8">
        ${Array.from({ length: 12 }, (_, index) => `<line x1="${97 + index * 96}" y1="10" x2="${97 + index * 96}" y2="630"/>`).join("")}
        ${Array.from({ length: 6 }, (_, index) => `<line x1="16" y1="${97 + index * 96}" x2="1200" y2="${97 + index * 96}"/>`).join("")}
      </g>
      <rect x="${paper.x + 20}" y="${paper.y + 20}" width="${paper.width}" height="${paper.height}" fill="#02080d" opacity="0.9"/>
      <rect x="${paper.x}" y="${paper.y}" width="${paper.width}" height="${paper.height}" fill="#ffffff"/>
      <style>
        .brand { font: 700 18px Arial, sans-serif; letter-spacing: .5px; fill: #7be0bd; }
        .format { font: 700 15px Arial, sans-serif; letter-spacing: .7px; fill: #b9c6ce; }
        .title { font-family: Georgia, serif; font-size: ${titleSize}px; font-weight: 700; fill: #f7f9fa; }
        .subtitle { font: ${subtitleSize}px Georgia, serif; fill: #f7f9fa; }
        .deck { font: 20px Arial, sans-serif; fill: #bcc7ce; }
        .byline { font: 16px Arial, sans-serif; fill: #b9c6ce; }
        .pill { font-family: Arial, sans-serif; font-weight: 700; fill: #102333; }
      </style>
      <line x1="72" y1="${brandY - 6}" x2="120" y2="${brandY - 6}" stroke="#7be0bd" stroke-width="2"/>
      <text class="brand" x="135" y="${brandY}">SPHERITY RESEARCH</text>
      <g clip-path="url(#left-safe-area)">
        <text class="format" x="72" y="${mapCard ? MAP_CARD.formatY : 132}">${escapeXml(card.format_label)}</text>
        ${textLines({ lines: card.title_lines, x: 72, y: titleY, lineHeight: titleLineHeight, className: "title" })}
        ${textLines({ lines: card.subtitle_lines, x: 72, y: subtitleY, lineHeight: subtitleLineHeight, className: "subtitle" })}
        ${textLines({ lines: card.deck_lines, x: 72, y: deckY, lineHeight: 28, className: "deck" })}
        <text class="byline" x="72" y="${mapCard ? MAP_CARD.bylineY : BYLINE_Y}">${escapeXml(card.byline)}</text>
        ${mapCard ? "" : pills.markup}
      </g>
    </svg>`);

  const visual = card.visual_type === "risk-orbits"
    ? riskOrbits()
    : card.visual_type === "ebw-timeline"
      ? ebwTimeline()
      : await readFile(publicFile(card.visual));
  const visualBuffer = await sharp(visual)
    .resize(paper.width, paper.height, {
      fit: card.visual_fit || "contain",
      position: "centre",
      background: "#ffffff"
    })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();

  const composite = [{ input: visualBuffer, left: paper.x, top: paper.y }];
  if (mapCard) {
    // Keep the original composition; place the label within the white fit padding.
    const { map, label } = MAP_CARD;
    const mapVisual = await sharp(await readFile(publicFile(card.map_visual))).resize(map.width, map.height, {fit:"contain",background:"#ffffff"}).flatten({background:"#ffffff"}).png().toBuffer();
    const labelSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${map.width}" height="${map.height}"><text fill="#000000" font-family="Arial, sans-serif" font-weight="700" font-size="${label.size}" letter-spacing="1.4" text-anchor="middle" transform="translate(${label.x-map.x} ${label.y-map.y}) rotate(-90)">${escapeXml(card.map_label)}</text></svg>`);
    const labelledMap = await sharp(mapVisual).composite([{input:labelSvg,left:0,top:0}]).png().toBuffer();
    composite.push({input:labelledMap,left:map.x,top:map.y});
  }
  return sharp(baseSvg)
    .composite(composite)
    .webp({ quality: 88, effort: 6 })
    .toBuffer();
};

const generatedCards = [];
const preflightErrors = [];

for (const card of manifest) {
  const publication = publicationsByUrl.get(card.publication_url) || {
    topics: card.topics || [],
    image: card.output
  };
  if (!publicationsByUrl.has(card.publication_url) && publication.topics.length === 0) {
    throw new Error(
      `${card.publication_url}: a non-catalog series page requires social-card topics.`
    );
  }
  if (publication.image && publication.image !== card.output) {
    throw new Error(`${card.publication_url}: catalog image must match ${card.output}.`);
  }

  if (card.mode === "approved-exception") {
    for (const asset of card.protected_assets || []) {
      const buffer = await readFile(publicFile(asset.path));
      const hash = createHash("sha256").update(buffer).digest("hex");
      if (hash !== asset.sha256) {
        throw new Error(`${asset.path}: approved social-card asset changed unexpectedly.`);
      }
    }
    continue;
  }
  if (card.mode === "preserve") continue;

  try {
    const layout = await prepareCardLayout(card, publication);
    generatedCards.push({ card, publication, layout });
  } catch (error) {
    preflightErrors.push(error instanceof Error ? error.message : String(error));
  }
}

if (preflightErrors.length) {
  throw new Error(
    `Social-card preflight found ${preflightErrors.length} invalid card(s):\n\n${preflightErrors.join("\n\n")}`
  );
}

for (const { card, publication, layout } of generatedCards) {
  if (selectedUrl && card.publication_url !== selectedUrl) continue;
  if (checkOnly) {
    console.log(`Validated safe area for ${card.publication_url}.`);
    continue;
  }

  const outputPath = publicFile(card.output);
  const pixels = await renderGeneratedCard(card, publication, layout);
  const rendered = imageMetadata[card.output]
    ? embedImageXmp(pixels, imageMetadata[card.output]) : pixels;
  // Preserve unchanged assets (and avoid needless writes to files open in a
  // Windows preview). Preflight and rendering still run before this comparison.
  const previous = await readFile(outputPath).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (previous?.equals(rendered)) {
    console.log(`Unchanged ${path.relative(projectDirectory, outputPath)}.`);
    continue;
  }
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, rendered);
  console.log(`Generated ${path.relative(projectDirectory, outputPath)}.`);
}
