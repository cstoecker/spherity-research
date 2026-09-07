import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import { parse as parseYaml } from "yaml";

const projectDirectory = process.cwd();
const sourceDirectory = path.join(projectDirectory, "docs");
const manifestPath = path.join(sourceDirectory, "_data", "social_cards.yml");
const publicationsPath = path.join(sourceDirectory, "_data", "publications.yml");

const manifest = parseYaml(await readFile(manifestPath, "utf8"));
const publications = parseYaml(await readFile(publicationsPath, "utf8"));
const publicationsByUrl = new Map(
  publications.map((publication) => [publication.links?.[0]?.url, publication])
);
const checkOnly = process.argv.includes("--check");

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;
const LEFT_TEXT_X = 72;
const LEFT_SAFE_RIGHT = 720;
const VISUAL_X = 780;
const VISUAL_WIDTH = 360;
const BYLINE_Y = 486;
const TOPIC_Y = 520;
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

const prepareCardLayout = async (card, publication) => {
  const titleSize = Number(card.title_size || 48);
  const titleLineHeight = Math.round(titleSize * 1.16);
  const subtitleSize = Number(card.subtitle_size || 30);
  const subtitleLineHeight = Math.round(subtitleSize * 1.2);
  const titleY = 194;
  const titleBottom = titleY + (card.title_lines.length - 1) * titleLineHeight;
  const subtitleY = titleBottom + 48;
  const subtitleBottom = subtitleY + Math.max(0, (card.subtitle_lines?.length || 0) - 1) * subtitleLineHeight;
  const deckY = (card.subtitle_lines?.length ? subtitleBottom : titleBottom) + 45;
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

const renderGeneratedCard = async (card, publication, layout) => {
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
  const baseSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
      <defs>
        <clipPath id="left-safe-area">
          <rect x="64" y="108" width="${LEFT_SAFE_RIGHT - 64}" height="450" />
        </clipPath>
      </defs>
      <rect width="1200" height="630" fill="#071b2a"/>
      <rect width="1200" height="10" fill="#4f98c7"/>
      <rect width="16" height="630" fill="#7be0bd"/>
      <g stroke="#1c3446" stroke-width="1" opacity="0.8">
        ${Array.from({ length: 12 }, (_, index) => `<line x1="${97 + index * 96}" y1="10" x2="${97 + index * 96}" y2="630"/>`).join("")}
        ${Array.from({ length: 6 }, (_, index) => `<line x1="16" y1="${97 + index * 96}" x2="1200" y2="${97 + index * 96}"/>`).join("")}
      </g>
      <rect x="800" y="70" width="360" height="510" fill="#02080d" opacity="0.9"/>
      <rect x="780" y="50" width="360" height="510" fill="#ffffff"/>
      <style>
        .brand { font: 700 18px Arial, sans-serif; letter-spacing: .5px; fill: #7be0bd; }
        .format { font: 700 15px Arial, sans-serif; letter-spacing: .7px; fill: #b9c6ce; }
        .title { font-family: Georgia, serif; font-size: ${titleSize}px; font-weight: 700; fill: #f7f9fa; }
        .subtitle { font: ${subtitleSize}px Georgia, serif; fill: #f7f9fa; }
        .deck { font: 20px Arial, sans-serif; fill: #bcc7ce; }
        .byline { font: 16px Arial, sans-serif; fill: #b9c6ce; }
        .pill { font-family: Arial, sans-serif; font-weight: 700; fill: #102333; }
      </style>
      <line x1="72" y1="76" x2="120" y2="76" stroke="#7be0bd" stroke-width="2"/>
      <text class="brand" x="135" y="82">SPHERITY RESEARCH</text>
      <g clip-path="url(#left-safe-area)">
        <text class="format" x="72" y="132">${escapeXml(card.format_label)}</text>
        ${textLines({ lines: card.title_lines, x: 72, y: titleY, lineHeight: titleLineHeight, className: "title" })}
        ${textLines({ lines: card.subtitle_lines, x: 72, y: subtitleY, lineHeight: subtitleLineHeight, className: "subtitle" })}
        ${textLines({ lines: card.deck_lines, x: 72, y: deckY, lineHeight: 28, className: "deck" })}
        <text class="byline" x="72" y="${BYLINE_Y}">${escapeXml(card.byline)}</text>
        ${pills.markup}
      </g>
    </svg>`);

  const visual = card.visual_type === "risk-orbits"
    ? riskOrbits()
    : card.visual_type === "ebw-timeline"
      ? ebwTimeline()
      : await readFile(publicFile(card.visual));
  const visualBuffer = await sharp(visual)
    .resize(VISUAL_WIDTH, 510, {
      fit: card.visual_fit || "contain",
      position: "centre",
      background: "#ffffff"
    })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();

  return sharp(baseSvg)
    .composite([{ input: visualBuffer, left: VISUAL_X, top: 50 }])
    .webp({ quality: 88, effort: 6 })
    .toBuffer();
};

const generatedCards = [];
const preflightErrors = [];

for (const card of manifest) {
  const publication = publicationsByUrl.get(card.publication_url);
  if (!publication) throw new Error(`No publication catalog entry for ${card.publication_url}.`);
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
  if (checkOnly) {
    console.log(`Validated safe area for ${card.publication_url}.`);
    continue;
  }

  const outputPath = publicFile(card.output);
  const rendered = await renderGeneratedCard(card, publication, layout);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, rendered);
  console.log(`Generated ${path.relative(projectDirectory, outputPath)}.`);
}
