import { access, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";
import { parse as parseYaml } from "yaml";
import { loadPdfShares, publicUrl } from "./lib/pdf-sharing.mjs";
import { loadSitemapDownloads } from "./lib/sitemap-images.mjs";
import { verifyAtlasPublication } from "../dpp-explorer/scripts/publication-release.mjs";

const getArgument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};

const projectDirectory = process.cwd();
const siteDirectory = path.resolve(getArgument("--site-dir", "_site"));
const sourceDirectory = path.resolve(getArgument("--source-dir", "docs"));
const basePath = "/spherity-research";
const canonicalOrigin = "https://spherity.github.io/spherity-research";
const indexNowKey = "ae12be17912040a1bceb67f0efcc1cf3";
const errors = [];
const warnings = [];
const allowDrafts = process.argv.includes("--allow-drafts");
const atlasRoutes = new Set(["dpp-explorer/index.html", "dpp-explorer/catalogue.html", "dpp-explorer/catalogue-0.1.0.html", "dpp-explorer/rights.html", "dpp-explorer/coverage.html"]);
const hasDraftRobots = value => {
  const tokens = String(value || "").toLowerCase().split(/[,\s]+/).filter(Boolean);
  return tokens.includes("noindex") && tokens.includes("follow") && !tokens.includes("index") && !tokens.includes("nofollow");
};
const isDraftAtlas = data => data?.publication_type === "atlas" && data?.schema_type === "CreativeWork" && data?.publication_state === "draft" && hasDraftRobots(data?.robots);
const permitsDraftAtlas = data => allowDrafts && isDraftAtlas(data);
// A completed whitepaper may accompany an explicitly unsealed Atlas candidate.
// This exception applies only to Atlas routes, never to paper publication checks.
const isPaperWithAtlas = data => data?.publication_type === "paper" && data?.schema_type === "ScholarlyArticle" && data?.dpp_paper === true && Boolean(data?.dataset);
const isCandidateAtlasOwner = data => isPaperWithAtlas(data) && data?.atlas_release_state === "candidate";
// These pages predate publication template v2. Any new research-page filename
// must opt into v2, so copying an older paper cannot silently bypass the new
// author-identity and search-research checks.
const legacyPublicationFiles = new Set([
  "cra-capable-digital-product-passports.md",
  "deutschland-ag-2-0-industrial-ai-federated-transformation.md",
  "ebw-roadmap.md",
  "ebw-zero-trust-ai-agents.md",
  "energy-data-x-ebw-market-role-credentials-dpp-access-control.md",
  "europes-fundamental-ai-opportunity.md",
  "evidence-graphs-industrial-ai-data-plane.md",
  "quantum-resilient-organizational-identity.md",
  "Securing-Digital-Identity-Quantum-Vulnerabilities.md",
  "spherity-dpp-dbp-strategy-market-positioning.md",
  "threat-escalation-model-germany-eu.md",
  "top-german-technology-companies-industrial-ai-agentic-commerce-2026.md",
  "trusted-agentic-ai-china-eu-us-comparative-analysis.md",
  "verifiable-access-controlled-digital-product-passports.md"
]);

const exists = async (target) => {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
};

const splitFrontMatter = (source) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: null, content: source, raw: "" };
  return {
    data: parseYaml(match[1]) ?? {},
    content: match[2],
    raw: match[1]
  };
};

const asArray = (value) =>
  Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : [value];

const collectTypedObjects = (value, expectedType, results = []) => {
  if (!value || typeof value !== "object") return results;
  if (Array.isArray(value)) {
    for (const item of value) collectTypedObjects(item, expectedType, results);
    return results;
  }
  if (asArray(value["@type"]).includes(expectedType)) results.push(value);
  for (const nested of Object.values(value)) {
    collectTypedObjects(nested, expectedType, results);
  }
  return results;
};

const isHttpsUrl = (value) => {
  try {
    return new URL(String(value)).protocol === "https:";
  } catch {
    return false;
  }
};

const isValidOrcidUrl = (value) => {
  const match = String(value || "").match(
    /^https:\/\/orcid\.org\/(\d{4})-(\d{4})-(\d{4})-(\d{3}[\dX])$/
  );
  if (!match) return false;
  const identifier = match.slice(1).join("");
  let total = 0;
  for (const character of identifier.slice(0, 15)) {
    total = (total + Number(character)) * 2;
  }
  const remainder = (12 - (total % 11)) % 11;
  const expectedCheckDigit = remainder === 10 ? "X" : String(remainder);
  return identifier.at(-1) === expectedCheckDigit;
};

const sourcePathFromPublicUrl = (url) => {
  const pathname = decodeURIComponent(url.split("#")[0].split("?")[0]);
  return path.join(sourceDirectory, pathname.replace(/^\/+/, ""));
};

// SVGs loaded through <img> cannot fetch their own image, font or style assets.
// Only inspect rendering references: metadata and ordinary <a> links may
// legitimately point to attribution, licensing and source pages.
const svgRenderingDependencies = (source) => {
  const dependencies = new Set();
  const svg = source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(metadata|title|desc)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const embedded = (value) => /^(?:#|data:)/i.test(value.trim());
  const record = (value) => {
    if (!embedded(value)) dependencies.add(value.trim() || "(empty reference)");
  };
  const checkCss = (css) => {
    for (const match of css.matchAll(/url\(\s*(?:(["'])([\s\S]*?)\1|([^)]*?))\s*\)/gi)) {
      record(match[2] ?? match[3]);
    }
    for (const match of css.matchAll(/@import\s+(["'])([\s\S]*?)\1/gi)) {
      record(match[2]);
    }
  };
  const renderingHrefTags = new Set([
    "image", "use", "feimage", "textpath", "mpath", "pattern",
    "lineargradient", "radialgradient", "filter", "font-face-uri"
  ]);
  const cssAttributes = new Set([
    "style", "fill", "stroke", "filter", "clip-path", "mask", "cursor",
    "marker", "marker-start", "marker-mid", "marker-end"
  ]);
  for (const tag of svg.matchAll(/<([A-Za-z][\w:.-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/g)) {
    const name = tag[1].split(":").at(-1).toLowerCase();
    for (const attribute of tag[2].matchAll(/\b([\w:.-]+)\s*=\s*(["'])([\s\S]*?)\2/g)) {
      const attributeName = attribute[1].toLowerCase();
      if (renderingHrefTags.has(name) && /^(?:xlink:)?href$/.test(attributeName)) {
        record(attribute[3]);
      }
      if (cssAttributes.has(attributeName)) checkCss(attribute[3]);
    }
  }
  for (const style of svg.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
    checkCss(style[1].replace(/\/\*[\s\S]*?\*\//g, ""));
  }
  for (const instruction of svg.matchAll(/<\?xml-stylesheet\b[\s\S]*?\?>/gi)) {
    const href = instruction[0].match(/\bhref\s*=\s*(["'])([\s\S]*?)\1/i);
    if (href) record(href[2]);
  }
  return [...dependencies];
};

const imageDimensions = async (file) => {
  const buffer = await readFile(file);
  if (
    buffer.length >= 24 &&
    buffer.toString("hex", 0, 8) === "89504e470d0a1a0a"
  ) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  if (
    buffer.length >= 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    const chunkType = buffer.toString("ascii", 12, 16);
    if (chunkType === "VP8X") {
      return {
        width: buffer.readUIntLE(24, 3) + 1,
        height: buffer.readUIntLE(27, 3) + 1
      };
    }
    if (chunkType === "VP8 ") {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff
      };
    }
    if (chunkType === "VP8L" && buffer[20] === 0x2f) {
      const dimensions = buffer.readUInt32LE(21);
      return {
        width: (dimensions & 0x3fff) + 1,
        height: ((dimensions >> 14) & 0x3fff) + 1
      };
    }
  }

  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    const startOfFrameMarkers = new Set([
      0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
    ]);
    let offset = 2;
    while (offset + 8 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (startOfFrameMarkers.has(marker)) {
        return {
          width: buffer.readUInt16BE(offset + 7),
          height: buffer.readUInt16BE(offset + 5)
        };
      }
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (segmentLength < 2) break;
      offset += segmentLength + 2;
    }
  }

  return null;
};

const requiredInfrastructureFiles = [
  "index.html",
  "robots.txt",
  "sitemap.xml",
  ".well-known/security.txt",
  `${indexNowKey}.txt`,
  "llms.txt",
  "assets/site.css",
  "assets/research-portal.js",
  "assets/cc-by.svg",
  "assets/share-icons/bluesky.svg",
  "assets/share-icons/link.svg",
  "assets/share-icons/linkedin.svg",
  "assets/share-icons/mail.svg",
  "assets/share-icons/reddit.svg",
  "assets/share-icons/share.svg",
  "assets/share-icons/threads.svg",
  "assets/share-icons/x.svg",
  "assets/spherity_logo_336x336_centered_margins.png",
  "assets/spherity-research-og.png"
];

const config = parseYaml(
  await readFile(path.join(sourceDirectory, "_config.yml"), "utf8")
);
if (!Array.isArray(config.include) || !config.include.includes(".well-known")) {
  errors.push('_config.yml: include must contain ".well-known".');
}
const publications = parseYaml(
  await readFile(path.join(sourceDirectory, "_data", "publications.yml"), "utf8")
);
const homepageFaq = parseYaml(
  await readFile(path.join(sourceDirectory, "_data", "homepage_faq.yml"), "utf8")
);
const socialCards = parseYaml(
  await readFile(path.join(sourceDirectory, "_data", "social_cards.yml"), "utf8")
);
const authorProfiles = parseYaml(
  await readFile(path.join(sourceDirectory, "_data", "authors.yml"), "utf8")
);

for (const [name, profile] of Object.entries(authorProfiles || {})) {
  if (!profile?.identity_reviewed) {
    errors.push(`Author registry: ${name} must explicitly record identity_reviewed: true.`);
  }
  if (!profile?.affiliation) {
    errors.push(`Author registry: ${name} is missing an affiliation.`);
  }
  const identityUrls = [profile?.url, ...asArray(profile?.same_as)].filter(Boolean);
  if (identityUrls.length === 0) {
    errors.push(`Author registry: ${name} requires a verified url or same_as identity.`);
  }
  for (const identityUrl of identityUrls) {
    if (!isHttpsUrl(identityUrl)) {
      errors.push(`Author registry: ${name} has a non-HTTPS identity URL: ${identityUrl}.`);
    }
  }
  if (profile?.orcid) {
    if (!isValidOrcidUrl(profile.orcid)) {
      errors.push(`Author registry: ${name} has an invalid ORCID URL or check digit.`);
    }
    if (!asArray(profile.same_as).includes(profile.orcid)) {
      errors.push(`Author registry: ${name} must include its ORCID URL in same_as.`);
    }
  }
}

const publicationTemplateSource = await readFile(
  path.join(projectDirectory, "templates", "publication.md"),
  "utf8"
);
const publicationTemplate = splitFrontMatter(publicationTemplateSource);
const requiredTemplateFields = [
  "publication_template_version",
  "seo_title",
  "og_title",
  "og_description",
  "author_entities",
  "author_affiliations",
  "keywords",
  "associated_media",
  "cover_image",
  "cover_image_alt",
  "image_mime",
  "image_width",
  "image_height",
  "search_research",
  "questions_answered"
];
const searchResearchRequirements = [
  ["reviewed_on", 1],
  ["source", 1],
  ["source_url", 1],
  ["geographies", 2],
  ["time_ranges", 2],
  ["search_types", 1],
  ["authority_terms", 2],
  ["discovery_terms", 3],
  ["audience_questions", 2],
  ["evidence", 1],
  ["editorial_decisions", 2]
];
const searchEvidenceFields = [
  "comparison",
  "input_type",
  "geography",
  "time_range",
  "search_type",
  "result"
];
if (Number(publicationTemplate.data?.publication_template_version) !== 2) {
  errors.push("Publication template: publication_template_version must be 2.");
}
for (const field of requiredTemplateFields) {
  if (publicationTemplate.data?.[field] === undefined) {
    errors.push(`Publication template: missing future-publication field "${field}".`);
  }
}
for (const [field, minimum] of searchResearchRequirements) {
  if (asArray(publicationTemplate.data?.search_research?.[field]).length < minimum) {
    errors.push(
      `Publication template: search_research.${field} requires at least ${minimum} ` +
        `${minimum === 1 ? "entry" : "entries"}.`
    );
  }
}
if (publicationTemplate.data?.search_research?.source !== "Google Trends") {
  errors.push('Publication template: search_research.source must be "Google Trends".');
}
if (
  publicationTemplate.data?.search_research?.source_url !==
  "https://trends.google.com/trends/explore"
) {
  errors.push("Publication template: search_research.source_url must use Google Trends Explore.");
}
if (
  Number(publicationTemplate.data?.image_width) !== 1200 ||
  Number(publicationTemplate.data?.image_height) !== 630
) {
  errors.push("Publication template: social image dimensions must be 1200×630.");
}
const templateKeywords = new Set(
  asArray(publicationTemplate.data?.keywords).map((keyword) =>
    String(keyword).trim().toLocaleLowerCase("en")
  )
);
for (const authorityTerm of asArray(
  publicationTemplate.data?.search_research?.authority_terms
)) {
  if (!templateKeywords.has(String(authorityTerm).trim().toLocaleLowerCase("en"))) {
    errors.push(
      `Publication template: authority term "${authorityTerm}" must also appear in keywords.`
    );
  }
}
for (const [index, author] of asArray(publicationTemplate.data?.author_entities).entries()) {
  const identityUrls = [author?.url, ...asArray(author?.same_as)].filter(Boolean);
  if (!author?.name || !author?.affiliation || identityUrls.length === 0) {
    errors.push(
      `Publication template: author_entities item ${index + 1} requires name, affiliation and identity URL.`
    );
  }
}
for (const [index, evidence] of asArray(
  publicationTemplate.data?.search_research?.evidence
).entries()) {
  for (const field of searchEvidenceFields) {
    if (!evidence?.[field]) {
      errors.push(
        `Publication template: search_research evidence ${index + 1} requires ${field}.`
      );
    }
  }
}
const faqGroups = homepageFaq?.groups || [];
const faqItems = faqGroups.flatMap((group) => group?.items || []);
const faqIds = new Set();

if (faqGroups.length < 3) {
  errors.push("Homepage FAQ: organize questions into at least three reader-oriented groups.");
}

for (const [index, item] of faqItems.entries()) {
  for (const field of ["id", "question", "answer", "link_label", "url"]) {
    if (!item?.[field]) {
      errors.push(`Homepage FAQ: item ${index + 1} is missing ${field}.`);
    }
  }
  if (faqIds.has(item?.id)) {
    errors.push(`Homepage FAQ: duplicate id "${item.id}".`);
  }
  faqIds.add(item?.id);
  if (String(item?.answer || "").length < 100) {
    errors.push(`Homepage FAQ: answer "${item?.question || index + 1}" is too short to stand alone.`);
  }
}
const requiredPublicationOutputs = [
  ...new Set(
    publications.flatMap((publication) =>
      (publication.links || [])
        .map((link) => link?.url)
        .filter(
          (url) =>
            typeof url === "string" &&
            url.startsWith("/") &&
            /\.(?:html|pdf)$/i.test(url)
        )
        .map((url) => decodeURIComponent(url.replace(/^\/+/, "")))
    )
  )
];
const requiredFaqOutputs = [
  ...new Set(
    faqItems
      .map((item) => item?.url)
      .filter(
        (url) =>
          typeof url === "string" &&
          url.startsWith("/") &&
          /\.html$/i.test(url)
      )
      .map((url) => decodeURIComponent(url.replace(/^\/+/, "")))
  )
];
const requiredFiles = [
  ...requiredInfrastructureFiles,
  ...requiredPublicationOutputs,
  ...requiredFaqOutputs
];

for (const requiredFile of requiredFiles) {
  if (!(await exists(path.join(siteDirectory, requiredFile)))) {
    errors.push(`Missing required build output: ${requiredFile}`);
  }
}

if (await exists(path.join(siteDirectory, `${indexNowKey}.txt`))) {
  const indexNowKeyProof = await readFile(
    path.join(siteDirectory, `${indexNowKey}.txt`),
    "utf8"
  );
  if (indexNowKeyProof.trim() !== indexNowKey) {
    errors.push(`${indexNowKey}.txt: IndexNow key proof must contain the key exactly once.`);
  }
  if (indexNowKeyProof.charCodeAt(0) === 0xfeff || indexNowKeyProof.includes("\u00a0")) {
    errors.push(`${indexNowKey}.txt: remove the UTF-8 BOM and non-breaking spaces.`);
  }
}

const markdownFiles = await glob("*.md", {
  cwd: sourceDirectory,
  nodir: true,
  windowsPathsNoEscape: true
});

const researchPages = [];
const uniqueFields = {
  title: new Map(),
  description: new Map(),
  canonical_url: new Map()
};

for (const markdownFile of markdownFiles) {
  const source = await readFile(path.join(sourceDirectory, markdownFile), "utf8");
  const { data, content, raw } = splitFrontMatter(source);

  if (!data) {
    errors.push(`${markdownFile}: missing YAML front matter.`);
    continue;
  }

  if (/Full publication title|YYYY-MM-DD|publication-slug|Write the .* here/i.test(raw)) {
    errors.push(`${markdownFile}: contains authoring-template placeholders.`);
  }

  for (const includeTag of content.matchAll(/{%\s*include\b[^%]*%}/g)) {
    if (/\b\w+(?:\.\w+)*\[[^\]]+\]/.test(includeTag[0])) {
      errors.push(
        `${markdownFile}: Jekyll 3 include parameters cannot use bracket indexing; ` +
          "assign the indexed value to a Liquid variable before the include."
      );
    }
  }

  if (data.layout !== "research-respec") continue;

  const publicationTemplateVersion = Number(data.publication_template_version);
  if (
    (!Number.isFinite(publicationTemplateVersion) || publicationTemplateVersion < 2) &&
    !legacyPublicationFiles.has(markdownFile)
  ) {
    errors.push(
      `${markdownFile}: new research pages must use publication_template_version: 2.`
    );
  }

  researchPages.push({ file: markdownFile, data, content });
  if (data.publication_type === "atlas" || isPaperWithAtlas(data)) {
    if (data.publication_type === "atlas" && data.schema_type !== "CreativeWork") errors.push(`${markdownFile}: atlas landing must declare schema_type: CreativeWork.`);
    if (isCandidateAtlasOwner(data) && !allowDrafts) errors.push(`${markdownFile}: accompanying Atlas candidate is unsealed; use --allow-drafts only for review preview validation.`);
    if (isPaperWithAtlas(data) && !isCandidateAtlasOwner(data)) {
      try {
        await verifyAtlasPublication(data, { repositoryRoot: projectDirectory, siteDirectory });
      } catch (error) {
        errors.push(`${markdownFile}: Atlas publication verification failed: ${error.message}`);
      }
    }
    if (data.publication_state === "draft") {
      if (!isDraftAtlas(data)) errors.push(`${markdownFile}: draft atlas requires noindex, follow and CreativeWork metadata.`);
      else if (!allowDrafts) errors.push(`${markdownFile}: draft atlas is not publication-ready; use --allow-drafts only for review preview validation.`);
    }
    for (const field of ["name", "description", "version", "url", "date_created", "rights_statement", "protocol_url"]) {
      if (!data.dataset?.[field]) errors.push(`${markdownFile}: atlas dataset requires ${field}.`);
    }
    if (asArray(data.dataset?.distributions).length < 2) errors.push(`${markdownFile}: atlas dataset requires at least JSON and JSON-LD distributions.`);
    for (const distribution of asArray(data.dataset?.distributions)) {
      if (!distribution?.name || !distribution?.encoding_format || !distribution?.url) errors.push(`${markdownFile}: every dataset distribution needs name, encoding_format and url.`);
      else if (!distribution.url.includes(`/releases/${data.dataset.version}/`)) errors.push(`${markdownFile}: dataset distribution must use its immutable release URL.`);
    }
  }

  if (data.paper_in_preparation === true) {
    if (!isDraftAtlas(data)) errors.push(`${markdownFile}: an in-preparation paper must remain an explicit noindex atlas draft.`);
    if (!data.paper_placeholder) errors.push(`${markdownFile}: in-preparation paper requires an explicit paper_placeholder download.`);
    if (data.pdf_url || asArray(data.associated_media).length) errors.push(`${markdownFile}: a placeholder must not use paper PDF or associated-media metadata.`);
  }

  const requiredFields = [
    "title",
    "description",
    "paper_status",
    "affiliation",
    "date",
    "last_modified_at",
    "permalink",
    "canonical_url",
    "robots",
    "license",
    "image",
    "image_alt",
    "answer_summary",
    "key_takeaways",
    "about",
    "mentions",
    "citations",
    "questions_answered",
    "related_publications",
    "toc_items",
    "tags"
  ];

  for (const field of requiredFields) {
    const value = data[field];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      errors.push(`${markdownFile}: missing required front matter field "${field}".`);
    }
  }

  if (!data.author && (!Array.isArray(data.authors) || data.authors.length === 0)) {
    errors.push(`${markdownFile}: requires author or authors metadata.`);
  }

  if (Number.isFinite(publicationTemplateVersion) && publicationTemplateVersion >= 2) {
    const versionTwoFields = [
      "seo_title",
      "og_title",
      "og_description",
      "author_entities",
      "author_affiliations",
      "keywords",
      "image_mime",
      "image_width",
      "image_height",
      "search_research"
    ];
    for (const field of versionTwoFields) {
      const value = data[field];
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        errors.push(`${markdownFile}: template v2 requires "${field}".`);
      }
    }

    const authors = asArray(data.authors || data.author);
    const authorEntities = asArray(data.author_entities);
    const entityByName = new Map(authorEntities.map((author) => [author?.name, author]));
    if (authors.length !== authorEntities.length) {
      errors.push(`${markdownFile}: authors and author_entities must contain the same number of people.`);
    }
    if (entityByName.size !== authorEntities.length || new Set(authors).size !== authors.length) {
      errors.push(`${markdownFile}: authors and author_entities must not contain duplicate names.`);
    }
    if (asArray(data.author_affiliations).length !== authors.length) {
      errors.push(`${markdownFile}: author_affiliations must contain one entry for every author.`);
    }
    for (const authorName of authors) {
      const authorEntity = entityByName.get(authorName);
      if (!authorEntity?.affiliation) {
        errors.push(`${markdownFile}: ${authorName} requires an author_entities affiliation.`);
        continue;
      }
      const registeredProfile = authorProfiles?.[authorName];
      if (!registeredProfile?.identity_reviewed) {
        errors.push(
          `${markdownFile}: ${authorName} must have an identity_reviewed profile in ` +
            "docs/_data/authors.yml."
        );
      }
      const identityUrls = [
        authorEntity.url,
        ...asArray(authorEntity.same_as),
        registeredProfile?.url,
        ...asArray(registeredProfile?.same_as)
      ].filter(Boolean);
      if (identityUrls.length === 0) {
        errors.push(
          `${markdownFile}: ${authorName} requires a verified author URL or same_as identity; ` +
            "add it to author_entities or docs/_data/authors.yml."
        );
      }
      for (const identityUrl of identityUrls) {
        if (!isHttpsUrl(identityUrl)) {
          errors.push(`${markdownFile}: ${authorName} has a non-HTTPS identity URL: ${identityUrl}.`);
        }
      }
    }

    const searchResearch = data.search_research || {};
    const searchReviewIssues = permitsDraftAtlas(data) ? warnings : errors;
    if (data.publication_type === "atlas" && searchResearch.status === "pending") searchReviewIssues.push(`${markdownFile}: search_research review is explicitly pending.`);
    for (const [field, minimum] of searchResearchRequirements) {
      const value = searchResearch[field];
      const count = asArray(value).length;
      if (count < minimum) {
        (permitsDraftAtlas(data) && ["reviewed_on", "evidence"].includes(field) ? warnings : errors).push(
          `${markdownFile}: search_research.${field} requires at least ${minimum} ` +
            `${minimum === 1 ? "entry" : "entries"}.`
        );
      }
    }
    if (searchResearch.source !== "Google Trends") {
      errors.push(`${markdownFile}: search_research.source must be "Google Trends".`);
    }
    if (searchResearch.source_url !== "https://trends.google.com/trends/explore") {
      errors.push(`${markdownFile}: search_research.source_url must use the official Google Trends Explore URL.`);
    }
    const searchReviewDate = Date.parse(searchResearch.reviewed_on);
    if (Number.isNaN(searchReviewDate)) {
      (permitsDraftAtlas(data) && !searchResearch.reviewed_on ? warnings : errors).push(`${markdownFile}: search_research.reviewed_on must be a valid date.`);
    } else {
      const lastModifiedDate = Date.parse(data.last_modified_at);
      if (!Number.isNaN(lastModifiedDate) && searchReviewDate > lastModifiedDate) {
        errors.push(
          `${markdownFile}: search_research.reviewed_on cannot be later than last_modified_at.`
        );
      }
    }
    for (const [index, evidence] of asArray(searchResearch.evidence).entries()) {
      for (const field of searchEvidenceFields) {
        if (!evidence?.[field]) {
          errors.push(
            `${markdownFile}: search_research evidence ${index + 1} requires ${field}.`
          );
        }
      }
    }
    const normalizedKeywords = new Set(
      asArray(data.keywords).map((keyword) => String(keyword).trim().toLocaleLowerCase("en"))
    );
    for (const authorityTerm of asArray(searchResearch.authority_terms)) {
      if (!normalizedKeywords.has(String(authorityTerm).trim().toLocaleLowerCase("en"))) {
        errors.push(
          `${markdownFile}: authority term "${authorityTerm}" must also appear in keywords.`
        );
      }
    }
  }

  if (String(data.description || "").length < 100 || String(data.description || "").length > 180) {
    errors.push(`${markdownFile}: description should be 100–180 characters.`);
  }

  if (!Array.isArray(data.key_takeaways) || data.key_takeaways.length < 3) {
    errors.push(`${markdownFile}: requires at least three key takeaways.`);
  }

  if (!Array.isArray(data.questions_answered) || data.questions_answered.length < 2) {
    errors.push(`${markdownFile}: requires at least two direct questions and answers.`);
  } else {
    for (const [index, item] of data.questions_answered.entries()) {
      if (!item?.question || !item?.answer) {
        errors.push(`${markdownFile}: question ${index + 1} requires question and answer text.`);
      }
    }
  }

  const expectedCanonical = `${config.url}${config.baseurl}${data.permalink}`;
  if (data.canonical_url !== expectedCanonical) {
    errors.push(
      `${markdownFile}: canonical_url must equal ${expectedCanonical}.`
    );
  }

  if (data.license !== "https://creativecommons.org/licenses/by/4.0/") {
    errors.push(`${markdownFile}: research content must declare the CC BY 4.0 license URL.`);
  }

  if (new Date(data.last_modified_at) < new Date(data.date)) {
    errors.push(`${markdownFile}: last_modified_at predates publication date.`);
  }

  const imagePath = sourcePathFromPublicUrl(data.image || "");
  if (!(await exists(imagePath))) {
    errors.push(`${markdownFile}: image does not exist: ${data.image}`);
  }

  if (data.pdf_url) {
    if (!(await exists(sourcePathFromPublicUrl(data.pdf_url)))) {
      errors.push(`${markdownFile}: PDF does not exist: ${data.pdf_url}`);
    }

    for (const field of ["cover_image", "cover_image_alt"]) {
      if (!data[field]) {
        errors.push(`${markdownFile}: PDF landing page requires "${field}".`);
      }
    }

    if (data.cover_image && !(await exists(sourcePathFromPublicUrl(data.cover_image)))) {
      errors.push(`${markdownFile}: cover image does not exist: ${data.cover_image}`);
    }

    if (await exists(imagePath)) {
      const dimensions = await imageDimensions(imagePath);
      if (!dimensions || dimensions.width !== 1200 || dimensions.height !== 630) {
        errors.push(
          `${markdownFile}: PDF landing-page social image must be exactly 1200×630 pixels.`
        );
      }
      const imageStats = await stat(imagePath);
      if (imageStats.size > 250 * 1024) {
        errors.push(
          `${markdownFile}: social image is ${Math.ceil(imageStats.size / 1024)} KB; keep it at or below 250 KB.`
        );
      }
    }
  }

  if (data.associated_media !== undefined) {
    if (!Array.isArray(data.associated_media) || data.associated_media.length === 0) {
      errors.push(`${markdownFile}: associated_media must be a non-empty list.`);
    } else {
      const mediaUrls = new Set();
      for (const [index, media] of data.associated_media.entries()) {
        if (!media?.name || !media?.url || !/\.pdf$/i.test(media.url)) {
          errors.push(`${markdownFile}: associated_media item ${index + 1} requires a name and PDF URL.`);
          continue;
        }
        if (mediaUrls.has(media.url)) {
          errors.push(`${markdownFile}: duplicate associated PDF ${media.url}.`);
        }
        mediaUrls.add(media.url);
        if (!(await exists(sourcePathFromPublicUrl(media.url)))) {
          errors.push(`${markdownFile}: associated PDF does not exist: ${media.url}`);
        }
      }
      if (data.pdf_url && !mediaUrls.has(data.pdf_url)) {
        errors.push(`${markdownFile}: associated_media must include the primary pdf_url.`);
      }
    }
  }

  if (data.figure_objects !== undefined) {
    if (!Array.isArray(data.figure_objects) || data.figure_objects.length === 0) {
      errors.push(`${markdownFile}: figure_objects must be a non-empty list.`);
    } else {
      const figureIds = new Set();
      const figureUrls = new Set();
      for (const [index, figure] of data.figure_objects.entries()) {
        const label = `${markdownFile}: figure_objects item ${index + 1}`;
        for (const field of ["id", "name", "content_url", "alt", "width", "height", "description", "caption", "credit_text"]) {
          if (!figure?.[field]) errors.push(`${label} requires "${field}".`);
        }
        if (!Array.isArray(figure?.keywords) || figure.keywords.length < 3) {
          errors.push(`${label} requires at least three discovery keywords.`);
        }
        if (figure?.license !== undefined && (typeof figure.license !== "string" || !isHttpsUrl(figure.license))) {
          errors.push(`${label}: license must be an absolute HTTPS URL.`);
        }
        if (figure?.copyright_holder !== undefined) {
          const holder = figure.copyright_holder;
          if (!holder || typeof holder !== "object" || Array.isArray(holder)) {
            errors.push(`${label}: copyright_holder must be an object with type, name and url.`);
          } else {
            if (!["Person", "Organization"].includes(holder.type)) {
              errors.push(`${label}: copyright_holder.type must be Person or Organization.`);
            }
            if (typeof holder.name !== "string" || !holder.name.trim()) {
              errors.push(`${label}: copyright_holder.name must be a non-empty name.`);
            }
            if (typeof holder.url !== "string" || !isHttpsUrl(holder.url)) {
              errors.push(`${label}: copyright_holder.url must be an absolute HTTPS URL.`);
            }
          }
        }
        if (figure?.id && figureIds.has(figure.id)) {
          errors.push(`${markdownFile}: duplicate figure id ${figure.id}.`);
        }
        if (figure?.content_url && figureUrls.has(figure.content_url)) {
          errors.push(`${markdownFile}: duplicate figure URL ${figure.content_url}.`);
        }
        figureIds.add(figure?.id);
        figureUrls.add(figure?.content_url);
        if (figure?.content_url && !/\.svg$/i.test(figure.content_url)) {
          errors.push(`${label} must reference an SVG image.`);
        }
        if (figure?.content_url) {
          const figurePath = sourcePathFromPublicUrl(figure.content_url);
          if (!(await exists(figurePath))) {
            errors.push(`${label} image does not exist: ${figure.content_url}`);
          } else if (/\.svg$/i.test(figure.content_url)) {
            const dependencies = svgRenderingDependencies(await readFile(figurePath, "utf8"));
            if (dependencies.length) {
              errors.push(
                `${label} (${figure.content_url}) has external SVG rendering dependencies: ` +
                  `${dependencies.join(", ")}. SVG figures must render independently inside <img>; ` +
                  "embed raster images as data:image URLs and inline referenced shapes, styles and fonts."
              );
            }
          }
        }
      }
    }
  }

  if (data.series_items !== undefined) {
    if (!data.series_name || !data.series_url || data.series_position === undefined) {
      errors.push(`${markdownFile}: series pages require series_name, series_url and series_position.`);
    }
    if (!Array.isArray(data.series_items) || data.series_items.length < 2) {
      errors.push(`${markdownFile}: series_items must contain at least two linked works.`);
    } else {
      const seriesUrls = new Set();
      for (const [index, item] of data.series_items.entries()) {
        for (const field of ["position", "label", "title", "url"]) {
          if (item?.[field] === undefined || item?.[field] === "") {
            errors.push(`${markdownFile}: series_items item ${index + 1} requires ${field}.`);
          }
        }
        if (item?.url && seriesUrls.has(item.url)) {
          errors.push(`${markdownFile}: duplicate series URL ${item.url}.`);
        }
        seriesUrls.add(item?.url);
      }
      if (!seriesUrls.has(data.permalink)) {
        errors.push(`${markdownFile}: series_items must include the current permalink.`);
      }
      if (!seriesUrls.has(data.series_url)) {
        errors.push(`${markdownFile}: series_items must include the series hub URL.`);
      }
    }
  }

  if (!content.includes('id="questions-answered"')) {
    const tocHasQuestions = data.toc_items?.some(
      (item) => item.href === "#questions-answered"
    );
    if (!tocHasQuestions) {
      errors.push(`${markdownFile}: table of contents is missing Questions answered.`);
    }
  }

  if (data.questions_answered_zh) {
    if (data.secondary_language !== "zh-Hans") {
      errors.push(`${markdownFile}: Chinese FAQ content requires secondary_language: zh-Hans.`);
    }
    if (!data.abstract_zh) {
      errors.push(`${markdownFile}: Chinese FAQ content requires an abstract_zh value.`);
    }
    if (!Array.isArray(data.questions_answered_zh) || data.questions_answered_zh.length < 1) {
      errors.push(`${markdownFile}: questions_answered_zh must contain at least one question.`);
    }
    const tocHasChineseQuestions = data.toc_items?.some(
      (item) => item.href === "#questions-answered-zh"
    );
    if (!tocHasChineseQuestions) {
      errors.push(`${markdownFile}: table of contents is missing the Chinese FAQ section.`);
    }
  }

  if (data.reference_architecture_zh) {
    if (data.secondary_language !== "zh-Hans") {
      errors.push(`${markdownFile}: Chinese reference architecture requires secondary_language: zh-Hans.`);
    }
    if (!data.questions_answered_zh) {
      errors.push(`${markdownFile}: Chinese reference architecture must follow a Chinese FAQ section.`);
    }
    const layers = data.reference_architecture_zh.layers;
    if (!Array.isArray(layers) || layers.length !== 8) {
      errors.push(`${markdownFile}: reference_architecture_zh must define exactly eight layers.`);
    } else {
      for (const [index, layer] of layers.entries()) {
        for (const field of ["name", "components", "outcome"]) {
          if (!layer?.[field]) {
            errors.push(
              `${markdownFile}: Chinese architecture layer ${index + 1} is missing ${field}.`
            );
          }
        }
      }
    }
    for (const field of ["title", "intro", "caption", "transaction_flow", "scope_note", "terminology_note"]) {
      if (!data.reference_architecture_zh[field]) {
        errors.push(`${markdownFile}: reference_architecture_zh is missing ${field}.`);
      }
    }
    if (
      !Array.isArray(data.reference_architecture_zh.terminology_sources) ||
      data.reference_architecture_zh.terminology_sources.length < 2 ||
      data.reference_architecture_zh.terminology_sources.some(
        (source) => !source?.name || !/^https:\/\//.test(source?.url || "")
      )
    ) {
      errors.push(
        `${markdownFile}: Chinese reference architecture requires at least two named HTTPS terminology sources.`
      );
    }
    const tocHasChineseArchitecture = data.toc_items?.some(
      (item) => item.href === "#reference-architecture-zh"
    );
    if (!tocHasChineseArchitecture) {
      errors.push(`${markdownFile}: table of contents is missing the Chinese reference architecture.`);
    }
  }

  // Layout includes may own valid ToC anchors (for example the paper map hero).
  // Read only this page's contained output; never exempt a target just by name.
  let renderedTocHtml = "";
  if (typeof data.permalink === "string" && data.permalink.startsWith("/")) {
    const relativeOutput = data.permalink.replace(/^\/+/, "").replace(/\/$/, "/index.html") || "index.html";
    const renderedOutput = path.resolve(siteDirectory, ...relativeOutput.split("/"));
    const relativeToSite = path.relative(siteDirectory, renderedOutput);
    if (relativeToSite !== ".." && !relativeToSite.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeToSite) && await exists(renderedOutput)) {
      renderedTocHtml = await readFile(renderedOutput, "utf8");
    }
  }
  const containsTocAnchor = (markup, id) => markup.includes(`id="${id}"`) || markup.includes(`id='${id}'`);
  for (const item of data.toc_items || []) {
    if (
      item.href?.startsWith("#") &&
      item.href !== "#questions-answered" &&
      item.href !== "#questions-answered-zh" &&
      item.href !== "#reference-architecture-zh" &&
      item.href !== "#license-and-citation" &&
      !containsTocAnchor(content, item.href.slice(1)) &&
      !containsTocAnchor(renderedTocHtml, item.href.slice(1))
    ) {
      errors.push(`${markdownFile}: ToC target is missing: ${item.href}`);
    }
  }

  for (const field of Object.keys(uniqueFields)) {
    const value = data[field];
    if (!value) continue;
    if (uniqueFields[field].has(value)) {
      errors.push(
        `${markdownFile}: duplicate ${field} also used by ${uniqueFields[field].get(value)}.`
      );
    } else {
      uniqueFields[field].set(value, markdownFile);
    }
  }
}

const declaredPdfUrls = new Set(
  researchPages.flatMap(({ data }) => {
    if (Array.isArray(data.associated_media)) {
      return data.associated_media.map((media) => media?.url).filter(Boolean);
    }
    return data.pdf_url ? [data.pdf_url] : [];
  })
);
const sourcePdfFiles = await glob("*.pdf", {
  cwd: sourceDirectory,
  nodir: true,
  windowsPathsNoEscape: true
});
for (const pdfFile of sourcePdfFiles) {
  const publicUrl = `/${pdfFile.split(path.sep).join("/")}`;
  if (!declaredPdfUrls.has(publicUrl)) {
    errors.push(`${pdfFile}: PDF has no research landing-page MediaObject declaration.`);
  }
}

const approvedSocialCardUrl = "/spherity-dpp-dbp-strategy-market-positioning.html";
const preservedSocialCardUrls = new Set([
  "/europes-fundamental-ai-opportunity.html",
  "/deutschland-ag-2-0-industrial-ai-federated-transformation.html",
  "/trusted-agentic-ai-china-eu-us-comparative-analysis.html"
]);
const socialCardsByUrl = new Map();
const socialCardOutputs = new Set();
const publicationCatalogUrls = new Set(
  publications.map((publication) => publication.links?.[0]?.url).filter(Boolean)
);
for (const card of asArray(socialCards)) {
  if (!card?.publication_url || socialCardsByUrl.has(card.publication_url)) {
    errors.push(`Social cards: duplicate or missing publication_url ${card?.publication_url || "(missing)"}.`);
    continue;
  }
  socialCardsByUrl.set(card.publication_url, card);
  if (!card.output || socialCardOutputs.has(card.output)) {
    errors.push(`Social cards: duplicate or missing output for ${card.publication_url}.`);
  } else {
    socialCardOutputs.add(card.output);
  }

  if (card.publication_url === approvedSocialCardUrl) {
    if (card.style !== "approved-gartner-2026" || card.mode !== "approved-exception") {
      errors.push("Social cards: the Gartner-approved strategy card must remain an approved exception.");
    }
  } else if (card.style !== "research-grid-v1") {
    errors.push(`${card.publication_url}: social-card style must be research-grid-v1.`);
  }

  if (card.mode === "preserve" && !preservedSocialCardUrls.has(card.publication_url)) {
    errors.push(`${card.publication_url}: only the reviewed legacy cards may use preserve mode.`);
  }
  if (
    !["generated", "preserve", "approved-exception"].includes(card.mode)
  ) {
    errors.push(`${card.publication_url}: unsupported social-card mode ${card.mode}.`);
  }
  if (card.mode === "generated") {
    for (const field of ["format_label", "title_lines", "deck_lines", "byline"]) {
      const value = card[field];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        errors.push(`${card.publication_url}: generated social card requires ${field}.`);
      }
    }
    if (!card.visual && !card.visual_type) {
      errors.push(`${card.publication_url}: generated social card requires visual or visual_type.`);
    }
    if (
      !publicationCatalogUrls.has(card.publication_url) &&
      (!Array.isArray(card.topics) || card.topics.length < 3)
    ) {
      errors.push(
        `${card.publication_url}: non-catalog cards require at least three topic labels.`
      );
    }
    if (card.visual && !(await exists(sourcePathFromPublicUrl(card.visual)))) {
      errors.push(`${card.publication_url}: social-card visual does not exist: ${card.visual}.`);
    }
  }

  if (card.output) {
    const outputPath = sourcePathFromPublicUrl(card.output);
    if (!(await exists(outputPath))) {
      errors.push(`${card.publication_url}: social-card output does not exist: ${card.output}.`);
    } else {
      const dimensions = await imageDimensions(outputPath);
      if (!dimensions || dimensions.width !== 1200 || dimensions.height !== 630) {
        errors.push(`${card.publication_url}: social card must be exactly 1200×630 pixels.`);
      }
      const outputStats = await stat(outputPath);
      if (outputStats.size > 250 * 1024) {
        errors.push(`${card.publication_url}: social card exceeds 250 KB.`);
      }
    }
  }

  for (const asset of asArray(card.protected_assets)) {
    const protectedPath = sourcePathFromPublicUrl(asset?.path || "");
    if (!asset?.path || !asset?.sha256 || !(await exists(protectedPath))) {
      errors.push(`${card.publication_url}: incomplete protected social-card asset declaration.`);
      continue;
    }
    const hash = createHash("sha256").update(await readFile(protectedPath)).digest("hex");
    if (hash !== String(asset.sha256).toLowerCase()) {
      errors.push(`${asset.path}: approved social-card asset changed unexpectedly.`);
    }
  }
}

const publicationTitles = new Set();
const publicationPrimaryLinks = new Map();
for (const publication of publications) {
  if (publicationTitles.has(publication.title)) {
    errors.push(`Publication catalog: duplicate title "${publication.title}".`);
  }
  publicationTitles.add(publication.title);

  const requiredCatalogFields = [
    "title",
    "type",
    "date_label",
    "date_iso",
    "description",
    "topics",
    "filters",
    "search",
    "format",
    "links"
  ];
  for (const field of requiredCatalogFields) {
    const value = publication[field];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      errors.push(
        `Publication catalog: "${publication.title || "untitled entry"}" is missing ${field}.`
      );
    }
  }

  if (
    String(publication.description || "").length < 90 ||
    String(publication.description || "").length > 180
  ) {
    errors.push(
      `Publication catalog: description for "${publication.title}" should be 90–180 characters.`
    );
  }

  if (!Array.isArray(publication.topics) || publication.topics.length < 3) {
    errors.push(
      `Publication catalog: "${publication.title}" requires at least three topic labels.`
    );
  }

  if (Number.isNaN(Date.parse(publication.date_iso))) {
    errors.push(`Publication catalog: invalid date_iso for "${publication.title}".`);
  }

  const primaryLink = publication.links?.[0]?.url;
  if (!primaryLink) continue;

  const socialCard = socialCardsByUrl.get(primaryLink);
  if (!socialCard) {
    errors.push(`Publication catalog: "${publication.title}" has no social-card manifest entry.`);
  } else if (publication.image !== socialCard.output) {
    errors.push(`Publication catalog: "${publication.title}" must use ${socialCard.output}.`);
  }

  if (publicationPrimaryLinks.has(primaryLink)) {
    errors.push(
      `Publication catalog: primary link ${primaryLink} is shared by "${publication.title}" and "${publicationPrimaryLinks.get(primaryLink)}".`
    );
  } else {
    publicationPrimaryLinks.set(primaryLink, publication.title);
  }

  if (!primaryLink.endsWith(".html")) {
    errors.push(
      `Publication catalog: "${publication.title}" must use an indexable HTML landing page as its primary link.`
    );
  }

  const matchingPage = researchPages.find(
    ({ data }) => data.permalink === primaryLink
  );
  if (!matchingPage) {
    errors.push(
      `Publication catalog: primary link for "${publication.title}" has no research landing page.`
    );
  }

  if (matchingPage?.data.publication_type === "atlas" && (publication.publication_type !== "atlas" || publication.publication_state !== matchingPage.data.publication_state)) {
    errors.push(`Publication catalog: atlas type/state must match ${matchingPage.file}.`);
  }

  if (matchingPage && matchingPage.data.title !== publication.title) {
    errors.push(
      `Publication catalog: title differs from ${matchingPage.file}: "${publication.title}".`
    );
  }
  if (
    matchingPage &&
    primaryLink !== approvedSocialCardUrl &&
    matchingPage.data.image !== publication.image
  ) {
    errors.push(
      `Publication catalog: ${matchingPage.file} and its homepage card must use the same social image.`
    );
  }

  if (publication.image) {
    const imageFile = sourcePathFromPublicUrl(publication.image);
    if (!(await exists(imageFile))) {
      errors.push(`Publication catalog: missing image ${publication.image}.`);
    } else {
      const dimensions = await imageDimensions(imageFile);
      if (
        !dimensions ||
        Number(publication.image_width) !== dimensions.width ||
        Number(publication.image_height) !== dimensions.height
      ) {
        errors.push(
          `Publication catalog: declared dimensions for ${publication.image} do not match the image file.`
        );
      }
      const imageStats = await stat(imageFile);
      if (imageStats.size > 250 * 1024) {
        errors.push(
          `Publication catalog: ${publication.image} is ${Math.ceil(imageStats.size / 1024)} KB; homepage previews must not exceed 250 KB.`
        );
      }
    }
    if (!publication.image_alt) {
      errors.push(`Publication catalog: missing image_alt for "${publication.title}".`);
    }
  }

  for (const link of publication.links || []) {
    if (!link?.url?.toLowerCase().endsWith(".pdf")) continue;
    if (!(await exists(sourcePathFromPublicUrl(link.url)))) {
      errors.push(`Publication catalog: missing PDF ${link.url}.`);
    }
    if (!String(publication.format).includes("PDF")) {
      errors.push(
        `Publication catalog: "${publication.title}" links a PDF but its format does not include PDF.`
      );
    }
    if (matchingPage?.data.pdf_url !== link.url && !asArray(matchingPage?.data.associated_media).some(media => media.url === link.url)) {
      errors.push(
        `Publication catalog: PDF link for "${publication.title}" must match a declared PDF on its HTML landing page.`
      );
    }
  }
}

const researchPagePermalinks = new Set(
  researchPages.map(({ data }) => data.permalink).filter(Boolean)
);
const favicon = path.join(
  sourceDirectory,
  decodeURIComponent(config.favicon.replace(/^\/+/, ""))
);
if (await exists(favicon)) {
  const dimensions = await imageDimensions(favicon);
  if (!dimensions || dimensions.width !== dimensions.height || dimensions.width < 48) {
    errors.push("Configured favicon must be a square PNG at least 48×48 pixels.");
  }
}

const configuredLogo = sourcePathFromPublicUrl(config.logo || "");
if (!(await exists(configuredLogo))) {
  errors.push(`Configured logo does not exist: ${config.logo}`);
} else {
  const logoStats = await stat(configuredLogo);
  if (logoStats.size > 100 * 1024) {
    errors.push(
      `Configured site logo is ${Math.ceil(logoStats.size / 1024)} KB; keep it at or below 100 KB.`
    );
  }
}

const configuredSocialImage = sourcePathFromPublicUrl(config.image || "");
if (!(await exists(configuredSocialImage))) {
  errors.push(`Configured homepage social image does not exist: ${config.image}`);
} else {
  const dimensions = await imageDimensions(configuredSocialImage);
  if (!dimensions || dimensions.width !== 1200 || dimensions.height !== 630) {
    errors.push("Configured homepage social image must be exactly 1200×630 pixels.");
  }
  const socialImageStats = await stat(configuredSocialImage);
  if (socialImageStats.size > 250 * 1024) {
    errors.push(
      `Configured homepage social image is ${Math.ceil(socialImageStats.size / 1024)} KB; keep it at or below 250 KB.`
    );
  }
}

const htmlFiles = await glob("**/*.html", {
  cwd: siteDirectory,
  nodir: true,
  windowsPathsNoEscape: true
});

// Only mapped, generated PDF share pages may be noindex aliases. An arbitrary
// file under /share/ must still satisfy the ordinary public-page rules below.
let pdfShares = [];
let figureDownloads = new Map();
let placeholderDownloads = new Map();
try {
  ({ records: pdfShares, figureDownloads, placeholderDownloads } = await loadPdfShares(sourceDirectory));
} catch (error) {
  errors.push(`PDF sharing: ${error.message}`);
}
const pdfSharesByPath = new Map(pdfShares.map((record) => [record.sharePath, record]));
const decodeHtmlAttribute = (value = "") => value.replace(
  /&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,
  (match, entity) => {
    if (entity[0] === "#") {
      const codePoint = entity[1].toLowerCase() === "x"
        ? Number.parseInt(entity.slice(2), 16)
        : Number.parseInt(entity.slice(1), 10);
      return codePoint >= 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
    }
    return { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: "\u00a0" }[entity.toLowerCase()];
  }
);
const htmlTags = (html, tagName) => [...html.matchAll(
  new RegExp(`<${tagName}\\b((?:"[^"]*"|'[^']*'|[^'">])*)>`, "gi")
)].map((match) => Object.fromEntries([...match[1].matchAll(
  /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
)].map((attribute) => [
  attribute[1].toLowerCase(),
  decodeHtmlAttribute(attribute[2] ?? attribute[3] ?? attribute[4])
])));
const sharePublicUrl = (publicPath) => publicUrl(config, publicPath);
const shareOutputPath = (publicPath) => path.join(siteDirectory, ...publicPath.replace(/^\//, "").split("/"));
const anchorUrls = (html, pageUrl) => new Set(htmlTags(html, "a").flatMap(({ href }) => {
  if (!href) return [];
  try {
    return [new URL(href, pageUrl).href];
  } catch {
    return [];
  }
}));

// Standalone tools have static HTML rather than publication front matter.
// Declaring one must still bind its card to a real page and crawler-visible metadata.
for (const [socialCardUrl, card] of socialCardsByUrl) {
  const isPublication = publicationCatalogUrls.has(socialCardUrl) || researchPagePermalinks.has(socialCardUrl);
  if (card.page_type !== undefined && card.page_type !== "website") {
    errors.push(`${socialCardUrl}: unsupported social-card page_type ${card.page_type}.`);
  }
  if (card.page_type !== "website") {
    if (!isPublication) errors.push(`Social cards: ${socialCardUrl} is neither a catalog publication nor a research sub-page or declared website.`);
    continue;
  }
  if (isPublication) errors.push(`${socialCardUrl}: publication cards cannot be classified as standalone websites.`);
  if (card.mode !== "generated") errors.push(`${socialCardUrl}: standalone website cards must be generated.`);
  if (!socialCardUrl.startsWith("/") || socialCardUrl.startsWith("//") || /[\\?#%]/.test(socialCardUrl) || socialCardUrl.split("/").some(part => part === "." || part === "..") || !/(?:\/|\.html)$/.test(socialCardUrl)) {
    errors.push(`${socialCardUrl}: standalone website card requires a local HTML page URL.`);
    continue;
  }
  const pagePath = shareOutputPath(socialCardUrl.endsWith("/") ? `${socialCardUrl}index.html` : socialCardUrl);
  if (!(await exists(pagePath)) || !(await stat(pagePath)).isFile()) {
    errors.push(`${socialCardUrl}: standalone social-card page does not exist in the rendered site.`);
    continue;
  }
  const html = await readFile(pagePath, "utf8");
  const head = (html.replace(/<!--[\s\S]*?-->/g, "").match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || "").replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "");
  const metadata = htmlTags(head, "meta");
  const canonicalUrl = sharePublicUrl(socialCardUrl);
  const imageUrl = card.output ? sharePublicUrl(card.output) : "";
  const canonicals = htmlTags(head, "link").filter(link => link.rel?.toLowerCase() === "canonical");
  if (canonicals.length !== 1 || canonicals[0].href !== canonicalUrl) errors.push(`${socialCardUrl}: standalone website canonical must equal ${canonicalUrl}.`);
  const readMeta = (kind, name) => {
    const matches = metadata.filter(meta => meta[kind]?.toLowerCase() === name);
    if (matches.length !== 1 || !matches[0].content?.trim()) errors.push(`${socialCardUrl}: requires exactly one nonempty static ${name} metadata value.`);
    return matches[0]?.content;
  };
  const imageType = /\.jpe?g$/i.test(card.output || "") ? "image/jpeg" : /\.png$/i.test(card.output || "") ? "image/png" : /\.webp$/i.test(card.output || "") ? "image/webp" : "";
  if (!imageType) errors.push(`${socialCardUrl}: standalone social-card output requires a supported image format.`);
  for (const [name, value] of Object.entries({
    "og:type": "website", "og:url": canonicalUrl, "og:site_name": config.title,
    "og:image": imageUrl, "og:image:secure_url": imageUrl, "og:image:type": imageType,
    "og:image:width": "1200", "og:image:height": "630"
  })) if (readMeta("property", name) !== value) errors.push(`${socialCardUrl}: ${name} must equal ${JSON.stringify(value)}.`);
  if (readMeta("name", "twitter:card") !== "summary_large_image") errors.push(`${socialCardUrl}: Twitter card must be summary_large_image.`);
  if (readMeta("name", "twitter:image") !== imageUrl) errors.push(`${socialCardUrl}: Twitter image must match the social-card output.`);
  for (const field of ["title", "description", "image:alt"]) {
    if (readMeta("property", `og:${field}`) !== readMeta("name", `twitter:${field}`)) errors.push(`${socialCardUrl}: Open Graph and Twitter ${field} must match.`);
  }
  if (card.output) {
    const imagePath = shareOutputPath(card.output);
    if (!(await exists(imagePath))) errors.push(`${socialCardUrl}: social-card image is missing from the rendered site.`);
    else {
      const dimensions = await imageDimensions(imagePath);
      if (dimensions?.width !== 1200 || dimensions?.height !== 630) errors.push(`${socialCardUrl}: rendered social-card image must be 1200×630 pixels.`);
      const bytes = await readFile(imagePath);
      const actualType = bytes.toString("hex", 0, 3) === "ffd8ff" ? "image/jpeg" : bytes.toString("hex", 0, 8) === "89504e470d0a1a0a" ? "image/png" : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : "";
      if (actualType !== imageType) errors.push(`${socialCardUrl}: delivered social-card bytes do not match the declared MIME type.`);
      if (bytes.length > 250 * 1024) errors.push(`${socialCardUrl}: delivered social-card image exceeds 250 KB.`);
    }
  }
}

for (const [pdfPath] of placeholderDownloads) {
  const target = shareOutputPath(pdfPath);
  if (!(await exists(target))) errors.push(`${pdfPath}: missing blank placeholder build output.`);
  else {
    const source = await readFile(path.join(sourceDirectory, pdfPath.slice(1)));
    const delivered = await readFile(target);
    if (!source.equals(delivered) || delivered.toString("ascii", 0, 5) !== "%PDF-") errors.push(`${pdfPath}: placeholder must preserve the source PDF bytes.`);
  }
  if (pdfShares.some(record => record.pdfPath === pdfPath)) errors.push(`${pdfPath}: a blank placeholder must not generate paper sharing pages.`);
}

for (const record of pdfShares) {
  const label = record.sharePath;
  const target = shareOutputPath(record.sharePath);
  if (!(await exists(target))) {
    errors.push(`${label}: missing generated PDF sharing page.`);
    continue;
  }
  const html = await readFile(target, "utf8");
  const shareUrl = sharePublicUrl(record.sharePath);
  const imageUrl = sharePublicUrl(record.imagePath);
  const pdfUrl = sharePublicUrl(record.pdfPath);
  const metadata = htmlTags(html, "meta");
  const checkMeta = (kind, name, expected) => {
    const matches = metadata.filter((meta) => meta[kind]?.toLowerCase() === name);
    if (matches.length !== 1 || matches[0].content !== expected) {
      errors.push(`${label}: requires exactly one ${name} metadata value equal to ${JSON.stringify(expected)}.`);
    }
  };
  for (const [name, value] of Object.entries({
    "og:type": "website",
    "og:title": record.title,
    "og:description": record.description,
    "og:url": shareUrl,
    "og:image": imageUrl,
    "og:image:secure_url": imageUrl,
    "og:image:type": "image/jpeg",
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": record.alt
  })) checkMeta("property", name, value);
  for (const [name, value] of Object.entries({
    "twitter:card": "summary_large_image",
    "twitter:title": record.title,
    "twitter:description": record.description,
    "twitter:image": imageUrl,
    "twitter:image:alt": record.alt
  })) checkMeta("name", name, value);
  checkMeta("name", "description", record.description);
  const robotTags = metadata.filter((meta) => meta.name?.toLowerCase() === "robots");
  const robotTokens = (robotTags[0]?.content || "").toLowerCase().split(/[\s,]+/);
  if (
    robotTags.length !== 1 || !robotTokens.includes("noindex") || !robotTokens.includes("follow") ||
    robotTokens.some((token) => ["index", "nofollow", "none"].includes(token))
  ) errors.push(`${label}: PDF sharing aliases require noindex, follow robots metadata.`);
  const canonicals = htmlTags(html, "link").filter((link) =>
    (link.rel || "").toLowerCase().split(/\s+/).includes("canonical")
  );
  if (canonicals.length !== 1 || canonicals[0].href !== record.canonicalUrl) {
    errors.push(`${label}: canonical must point only to the owning research page ${record.canonicalUrl}.`);
  }
  if (metadata.some((meta) => meta["http-equiv"]?.toLowerCase() === "refresh")) {
    errors.push(`${label}: automatic refresh/redirects are forbidden on crawler-readable sharing pages.`);
  }
  for (const script of htmlTags(html, "script")) {
    if (script.type?.toLowerCase() === "application/ld+json") continue;
    let scriptUrl;
    try { scriptUrl = script.src ? new URL(script.src, shareUrl).href : null; } catch { /* Report below. */ }
    if (scriptUrl !== sharePublicUrl("/assets/pdf-share.js")) {
      errors.push(`${label}: only the dedicated copy-link script is allowed; no inline or third-party redirect scripts.`);
    }
  }
  if (/\bon[a-z]+\s*=|\b(?:href|src)\s*=\s*["']?\s*javascript:/i.test(html)) {
    errors.push(`${label}: inline event handlers and JavaScript URLs are forbidden on sharing pages.`);
  }
  const links = anchorUrls(html, shareUrl);
  if (!links.has(pdfUrl)) errors.push(`${label}: missing direct link to the original PDF ${pdfUrl}.`);
  if (!links.has(record.canonicalUrl)) errors.push(`${label}: missing link to read the canonical research page.`);

  for (const [kind, publicPath] of [["PDF", record.pdfPath], ["research page", record.pagePath], ["cover", record.coverPath]]) {
    if (!(await exists(shareOutputPath(publicPath)))) errors.push(`${label}: missing ${kind} build output ${publicPath}.`);
  }
  const pdfTarget = shareOutputPath(record.pdfPath);
  if (await exists(pdfTarget)) {
    const pdf = await readFile(pdfTarget);
    if (pdf.toString("ascii", 0, 5) !== "%PDF-") errors.push(`${label}: direct PDF URL no longer serves PDF bytes.`);
    const sourcePdf = path.join(sourceDirectory, ...record.pdfPath.replace(/^\//, "").split("/"));
    if (await exists(sourcePdf)) {
      const sourceHash = createHash("sha256").update(await readFile(sourcePdf)).digest("hex");
      if (createHash("sha256").update(pdf).digest("hex") !== sourceHash) {
        errors.push(`${label}: original PDF bytes must be preserved unchanged in the build.`);
      }
    }
  }
  const imageTarget = shareOutputPath(record.imagePath);
  if (!(await exists(imageTarget))) {
    errors.push(`${label}: missing generated sharing JPEG ${record.imagePath}.`);
  } else {
    const image = await readFile(imageTarget);
    if (image[0] !== 0xff || image[1] !== 0xd8 || image.at(-2) !== 0xff || image.at(-1) !== 0xd9) {
      errors.push(`${label}: social image must contain JPEG bytes, not just a .jpg filename.`);
    }
    const dimensions = await imageDimensions(imageTarget);
    if (dimensions?.width !== 1200 || dimensions?.height !== 630) {
      errors.push(`${label}: social image must be exactly 1200×630 pixels.`);
    }
    if (image.length > 250 * 1024) errors.push(`${label}: social image exceeds the 250 KB budget.`);
  }
  for (const reference of record.references) {
    const referenceFile = shareOutputPath(reference.pagePath);
    if (!(await exists(referenceFile))) {
      errors.push(`${label}: missing referring research page ${reference.pagePath}.`);
      continue;
    }
    const researchHtml = await readFile(referenceFile, "utf8");
    if (!anchorUrls(researchHtml, sharePublicUrl(reference.pagePath)).has(shareUrl)) {
      errors.push(`${reference.pagePath}: missing generated PDF sharing link ${record.sharePath}.`);
    }
  }
}

const pdfShareScriptPath = path.join(siteDirectory, "assets", "pdf-share.js");
if (pdfShares.length && await exists(pdfShareScriptPath)) {
  const script = await readFile(pdfShareScriptPath, "utf8");
  if (/\b(?:location|navigate)\b|\b(?:window|top|parent)\s*\.\s*open\s*\(|\beval\s*\(|\bnew\s+Function\b/i.test(script)) {
    errors.push("assets/pdf-share.js: sharing pages must not automatically redirect or execute dynamic code.");
  }
}

const resolveLocalReference = (reference, htmlFile) => {
  const cleanReference = reference.split("#")[0].split("?")[0];
  if (!cleanReference) return null;
  if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(cleanReference)) return null;

  let publicPath = decodeURIComponent(cleanReference).replaceAll("\\", "/");
  if (publicPath.includes("\0")) throw new Error("NUL byte in local reference");
  if (publicPath === basePath || publicPath.startsWith(`${basePath}/`)) publicPath = publicPath.slice(basePath.length);

  if (publicPath.startsWith("/")) {
    publicPath = publicPath.slice(1);
  } else {
    publicPath = path.posix.join(path.posix.dirname(htmlFile.replaceAll("\\", "/")), publicPath);
  }

  if (!publicPath || publicPath.endsWith("/")) publicPath += "index.html";
  const target = path.resolve(siteDirectory, ...publicPath.split("/"));
  const relative = path.relative(siteDirectory, target);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("Local reference escapes the site directory");
  return target;
};

const generatedCanonicals = new Map();
const atlasLandingPage = researchPages.find(({ data }) => (data.publication_type === "atlas" || isPaperWithAtlas(data)) && data.permalink === "/global-digital-product-passport-regulation.html");
const draftAtlasPath = file => atlasRoutes.has(file.split(path.sep).join("/")) && (permitsDraftAtlas(atlasLandingPage?.data) || (allowDrafts && isCandidateAtlasOwner(atlasLandingPage?.data)));

for (const htmlFile of htmlFiles) {
  const html = await readFile(path.join(siteDirectory, htmlFile), "utf8");
  const isPdfShare = pdfSharesByPath.has(`/${htmlFile.split(path.sep).join("/")}`);

  if (html.includes("{{") || html.includes("{%")) {
    errors.push(`${htmlFile}: contains unrendered Liquid markup.`);
  }

  if (/https:\/\/[^\s"']+https:\/\//i.test(html)) {
    errors.push(`${htmlFile}: contains a duplicated absolute URL origin.`);
  }

  for (const imageTag of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=\s*["'][^"']*["']/i.test(imageTag[0])) {
      errors.push(`${htmlFile}: image is missing an alt attribute.`);
    }
  }

  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"'<>]+)["']/gi)) {
    try {
      const target = resolveLocalReference(match[1], htmlFile);
      if (target && !(await exists(target))) errors.push(`${htmlFile}: broken local reference ${match[1]}`);
    } catch (error) {
      errors.push(`${htmlFile}: invalid local reference ${match[1]} (${error.message})`);
    }
  }

  const parsedSchemas = [];
  for (const script of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      parsedSchemas.push(JSON.parse(script[1]));
    } catch (error) {
      errors.push(`${htmlFile}: invalid JSON-LD (${error.message}).`);
    }
  }

  const imageObjects = parsedSchemas.flatMap((schema) =>
    collectTypedObjects(schema, "ImageObject")
  );
  for (const [index, imageObject] of imageObjects.entries()) {
    const label = `${htmlFile}: ImageObject ${index + 1}`;
    const imageContentUrl = imageObject.contentUrl || imageObject.url;
    if (!isHttpsUrl(imageContentUrl)) {
      errors.push(`${label} requires an absolute HTTPS contentUrl or url.`);
    }
    for (const field of ["license", "acquireLicensePage", "creditText", "copyrightNotice"]) {
      if (!imageObject[field]) {
        errors.push(`${label} requires "${field}" for Google image metadata.`);
      }
    }
    for (const field of ["license", "acquireLicensePage"]) {
      if (imageObject[field] && !isHttpsUrl(imageObject[field])) {
        errors.push(`${label} field "${field}" must be an absolute HTTPS URL.`);
      }
    }
    const creatorTypes = asArray(imageObject.creator?.["@type"]);
    if (
      !imageObject.creator ||
      !creatorTypes.some((type) => type === "Person" || type === "Organization") ||
      !imageObject.creator.name
    ) {
      errors.push(`${label} creator must be a named Person or Organization object.`);
    }
  }

  const figureSourcePage = researchPages.find(({ data }) =>
    data.permalink === `/${htmlFile.split(path.sep).join("/")}`
  );
  for (const figure of asArray(figureSourcePage?.data.figure_objects)) {
    const figureUrl = `${config.url}${config.baseurl}${figure.content_url}`;
    const matches = imageObjects.filter((imageObject) => imageObject.contentUrl === figureUrl);
    if (matches.length !== 1) {
      errors.push(`${htmlFile}: figure ${figure.id} requires exactly one matching ImageObject.`);
      continue;
    }
    const [imageObject] = matches;
    const expectedLicense = figure.license || figureSourcePage.data.license || config.content_license;
    if (imageObject.license !== expectedLicense) {
      errors.push(`${htmlFile}: figure ${figure.id} JSON-LD license must match its declared figure/page license.`);
    }
    const expectedNotice = figure.copyright_notice || config.image_copyright_notice || "© 2026 Spherity GmbH";
    if (imageObject.copyrightNotice !== expectedNotice) {
      errors.push(`${htmlFile}: figure ${figure.id} JSON-LD copyright notice must match its declared rights.`);
    }
    if (figure.copyright_holder) {
      const holder = imageObject.copyrightHolder;
      if (
        holder?.["@type"] !== figure.copyright_holder.type ||
        holder?.name !== figure.copyright_holder.name ||
        holder?.url !== figure.copyright_holder.url ||
        holder?.["@id"] === "https://www.spherity.com/#organization"
      ) {
        errors.push(`${htmlFile}: figure ${figure.id} JSON-LD copyright holder must match its declared holder.`);
      }
    } else if (imageObject.copyrightHolder?.["@id"] !== "https://www.spherity.com/#organization") {
      errors.push(`${htmlFile}: figure ${figure.id} must retain the default Spherity copyright holder.`);
    }
  }

  for (const figureScope of html.matchAll(
    /<figure\b[^>]*itemscope[^>]*itemtype=["']https:\/\/schema\.org\/ImageObject["'][^>]*>([\s\S]*?)<\/figure>/gi
  )) {
    const scope = figureScope[1];
    const visibleImage = scope.match(/<img\b[^>]*>/i)?.[0] || "";
    const visibleSource = visibleImage.match(/\bsrc\s*=\s*["']([^"']*)["']/i)?.[1] || "";
    if (!visibleSource || visibleSource === "/" || visibleSource === `${basePath}/`) {
      errors.push(`${htmlFile}: visible ImageObject figure has no rendered image source.`);
    }
    for (const attribute of ["alt", "width", "height"]) {
      if (!new RegExp(`\\b${attribute}\\s*=\\s*["'][^"']+["']`, "i").test(visibleImage)) {
        errors.push(`${htmlFile}: visible ImageObject figure requires a non-empty ${attribute}.`);
      }
    }
    for (const itemprop of ["contentUrl", "license", "acquireLicensePage", "creditText", "copyrightNotice"]) {
      if (!new RegExp(`itemprop=["']${itemprop}["']`, "i").test(scope)) {
        errors.push(`${htmlFile}: visible ImageObject figure is missing ${itemprop} microdata.`);
      }
    }
    if (
      !/itemprop=["']creator["'][^>]*itemscope[^>]*itemtype=["']https:\/\/schema\.org\/(?:Person|Organization)["']/i.test(scope) ||
      !/itemprop=["']name["']/i.test(scope)
    ) {
      errors.push(`${htmlFile}: visible ImageObject figure requires a named Person or Organization creator.`);
    }
  }

  const canonical = html.match(
    /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i
  )?.[1];
  const sourcePageForHtml = researchPages.find(({ data }) => data.canonical_url === canonical);
  const isAtlasLanding = sourcePageForHtml?.data.publication_type === "atlas";
  const isResearchTopic = sourcePageForHtml?.data.publication_type === "research-topic";
  const expectedWorkType = isAtlasLanding ? "CreativeWork" : isResearchTopic ? "WebPage" : "ScholarlyArticle";
  const isKnownAtlasRoute = atlasRoutes.has(htmlFile.split(path.sep).join("/"));
  const isAllowedDraft = permitsDraftAtlas(sourcePageForHtml?.data) || draftAtlasPath(htmlFile);
  if (isKnownAtlasRoute) {
    if (!atlasLandingPage) errors.push(`${htmlFile}: atlas route requires its declared research landing page.`);
    for (const [pattern, label] of [[/<html\b[^>]*lang=["']en["']/i, "English language"], [/<title>[^<]+<\/title>/i, "title"], [/<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i, "description"], [/<main\b/i, "main landmark"]]) {
      if (!pattern.test(html)) errors.push(`${htmlFile}: atlas output requires ${label}.`);
    }
    if ([...html.matchAll(/<h1\b/gi)].length !== 1) errors.push(`${htmlFile}: atlas output requires exactly one H1.`);
    if (parsedSchemas.some(schema => schema?.["@type"] === "ScholarlyArticle")) errors.push(`${htmlFile}: atlas output must not claim ScholarlyArticle.`);
  }
  if (!isPdfShare && !/^google[^/]*\.html$/i.test(htmlFile) && htmlFile !== "404.html") {
    const robotsMeta = html.match(
      /<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i
    )?.[1];
    if (isAllowedDraft && !hasDraftRobots(robotsMeta)) errors.push(`${htmlFile}: allowed draft must retain noindex, follow robots metadata.`);
    if (!isAllowedDraft && (!robotsMeta || !/\bindex\b/i.test(robotsMeta) || !/\bfollow\b/i.test(robotsMeta))) {
      errors.push(`${htmlFile}: Google indexing requires index, follow robots metadata.`);
    }
    if (!isAllowedDraft && /\bnoindex\b|\bnofollow\b/i.test(robotsMeta || "")) {
      errors.push(`${htmlFile}: public page must not contain noindex or nofollow.`);
    }
  }
  if (canonical && !isPdfShare) {
    if (generatedCanonicals.has(canonical)) {
      errors.push(
        `${htmlFile}: duplicate canonical also used by ${generatedCanonicals.get(canonical)}.`
      );
    } else {
      generatedCanonicals.set(canonical, htmlFile);
    }
  }

  if (/<article\b[^>]*class=["'][^"']*\bresearch-article\b[^"']*["'][^>]*>/i.test(html)) {
    const checks = [
      ['class="answer-summary"', "answer-first summary"],
      ['id="questions-answered"', "direct questions and answers"],
      ...(!isAtlasLanding && !isResearchTopic ? [
        ['name="citation_title"', "citation title metadata"],
        ['name="citation_author"', "citation author metadata"],
        ['name="citation_license"', "citation license metadata"]
      ] : []),
      ['rel="license"', "machine-readable license link"],
      ['class="research-license"', "paper license and citation block"],
      ...(!isDraftAtlas(sourcePageForHtml?.data) ? [
        ["data-share", "share control"],
        ['data-share-link="bluesky"', "Bluesky share action"],
        ['data-share-link="threads"', "Threads share action"],
        ['data-share-link="reddit"', "Reddit share action"]
      ] : []),
      ['"@type": "BreadcrumbList"', "BreadcrumbList structured data"],
      [`"@type": "${expectedWorkType}"`, `${expectedWorkType} structured data`]
    ];

    for (const [needle, label] of checks) {
      if (!html.includes(needle)) {
        errors.push(`${htmlFile}: missing ${label}.`);
      }
    }

    const topLevelSchemaTypes = new Set(
      parsedSchemas.flatMap((schema) => {
        const type = schema?.["@type"];
        return Array.isArray(type) ? type : type ? [type] : [];
      })
    );
    for (const type of ["WebSite", expectedWorkType, "BreadcrumbList", ...(sourcePageForHtml?.data.faq_schema === false ? [] : ["FAQPage"]), ...(isAtlasLanding ? ["Dataset"] : [])]) {
      if (!topLevelSchemaTypes.has(type)) {
        errors.push(`${htmlFile}: ${type} must be exposed as a top-level JSON-LD block.`);
      }
    }

    if (isDraftAtlas(sourcePageForHtml?.data) && /<[^>]+\bdata-share(?:-button|-link|-url)?(?:[\s=>])/i.test(html)) errors.push(`${htmlFile}: unpublished atlas draft must not expose public sharing controls.`);

    if (sourcePageForHtml?.data.paper_in_preparation === true) {
      const placeholder = sourcePageForHtml.data.paper_placeholder;
      const registered = placeholderDownloads.get(placeholder?.url);
      const textContent = value => decodeHtmlAttribute(value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
      const visibleText = textContent(html);
      if (!registered || registered.sourceFile !== sourcePageForHtml.file) errors.push(`${htmlFile}: missing registered paper placeholder owned by this page.`);
      else {
        const placeholderUrl = sharePublicUrl(placeholder.url);
        const linked = [...html.matchAll(/<a\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/a>/gi)].some(match => {
          const href = htmlTags(`<a${match[1]}>`, "a")[0]?.href;
          try { return new URL(href, canonical).href === placeholderUrl && /blank|placeholder/i.test(textContent(match[2])); }
          catch { return false; }
        });
        if (!linked) errors.push(`${htmlFile}: requires a clearly labelled link to its blank placeholder PDF.`);
        if (!visibleText.includes(placeholder.label) || !visibleText.includes(placeholder.description) || !/in preparation/i.test(visibleText)) errors.push(`${htmlFile}: placeholder label, description and in-preparation status must be visible.`);
        if (collectTypedObjects(parsedSchemas, "MediaObject").some(media => media.contentUrl === placeholderUrl) || collectTypedObjects(parsedSchemas, "DataDownload").some(media => media.contentUrl === placeholderUrl)) errors.push(`${htmlFile}: blank placeholder must not be described as a published PDF or research dataset distribution.`);
        if (htmlTags(html, "link").some(link => link.rel?.split(/\s+/).includes("alternate") && link.type === "application/pdf")) errors.push(`${htmlFile}: a placeholder must not be a paper PDF alternate.`);
      }
    }

    if (isAtlasLanding || isPaperWithAtlas(sourcePageForHtml?.data)) {
      const datasetSchema = parsedSchemas.find(schema => schema?.["@type"] === "Dataset");
      const workSchema = parsedSchemas.find(schema => schema?.["@type"] === "CreativeWork");
      const expectedDataset = sourcePageForHtml.data.dataset || {};
      if (isAtlasLanding && parsedSchemas.some(schema => schema?.["@type"] === "ScholarlyArticle")) errors.push(`${htmlFile}: atlas must not claim a scholarly paper.`);
      if (datasetSchema?.version !== expectedDataset.version || datasetSchema?.name !== expectedDataset.name || datasetSchema?.description !== expectedDataset.description || datasetSchema?.copyrightNotice !== expectedDataset.rights_statement) errors.push(`${htmlFile}: Dataset metadata must match its explicit source fields and rights.`);
      if (datasetSchema?.license) errors.push(`${htmlFile}: the frozen dataset has no public licence grant and must not inherit the landing-page licence.`);
      const distributions = asArray(datasetSchema?.distribution);
      if (distributions.length !== asArray(expectedDataset.distributions).length) errors.push(`${htmlFile}: Dataset distribution count must match source metadata.`);
      for (const item of expectedDataset.distributions || []) {
        const expectedUrl = item.url?.startsWith("https:") ? item.url : `${canonicalOrigin}${item.url}`;
        if (!distributions.some(d => d["@type"] === "DataDownload" && d.contentUrl === expectedUrl && d.encodingFormat === item.encoding_format && d.name === item.name)) errors.push(`${htmlFile}: missing exact Dataset distribution ${item.url}.`);
      }
      if (isDraftAtlas(sourcePageForHtml.data) && (workSchema?.datePublished || /name=["']citation_(?:title|publication_date|pdf_url)["']|property=["']article:published_time["']/i.test(html))) errors.push(`${htmlFile}: draft atlas must not emit published-paper metadata.`);
    }

    if (html.includes('class="research-series-nav"')) {
      if (!topLevelSchemaTypes.has("CreativeWorkSeries")) {
        errors.push(`${htmlFile}: research series navigation requires CreativeWorkSeries JSON-LD.`);
      }
      const currentSeriesItems = [
        ...html.matchAll(/class=["'][^"']*is-current[^"']*["'][\s\S]*?aria-current=["']page["']/gi)
      ].length;
      if (currentSeriesItems !== 1) {
        errors.push(`${htmlFile}: research series navigation requires exactly one current item.`);
      }
    }

    const questionsSection = html.match(
      /<section\b[^>]*class=["'][^"']*questions-answered[^"']*["'][^>]*>([\s\S]*?)<\/section>/i
    )?.[1];
    const renderedQuestionCount = questionsSection
      ? [...questionsSection.matchAll(/<h3\b/gi)].length
      : 0;
    const faqSchema = parsedSchemas.find((schema) => schema?.["@type"] === "FAQPage");
    if (faqSchema && faqSchema.mainEntity?.length !== renderedQuestionCount) {
      errors.push(
        `${htmlFile}: FAQPage schema contains ${faqSchema.mainEntity?.length || 0} questions; ` +
          `the visible direct-answer section contains ${renderedQuestionCount}.`
      );
    }

    const chineseQuestionsSection = html.match(
      /<section\b[^>]*id=["']questions-answered-zh["'][^>]*>([\s\S]*?)<\/section>/i
    )?.[1];
    const renderedChineseQuestionCount = chineseQuestionsSection
      ? [...chineseQuestionsSection.matchAll(/<h3\b/gi)].length
      : 0;
    const chineseFaqSchema = parsedSchemas.find(
      (schema) => schema?.["@type"] === "FAQPage" && /#questions-answered-zh$/.test(schema?.["@id"] || "")
    );
    if (renderedChineseQuestionCount || chineseFaqSchema) {
      if (!chineseQuestionsSection) {
        errors.push(`${htmlFile}: Chinese FAQ structured data requires a visible Chinese FAQ section.`);
      }
      if (!chineseFaqSchema) {
        errors.push(`${htmlFile}: visible Chinese FAQ content requires FAQPage structured data.`);
      } else {
        if (chineseFaqSchema.inLanguage !== "zh-Hans") {
          errors.push(`${htmlFile}: Chinese FAQPage structured data must declare zh-Hans.`);
        }
        if (chineseFaqSchema.mainEntity?.length !== renderedChineseQuestionCount) {
          errors.push(
            `${htmlFile}: Chinese FAQPage schema contains ${chineseFaqSchema.mainEntity?.length || 0} questions; ` +
              `the visible Chinese FAQ section contains ${renderedChineseQuestionCount}.`
          );
        }
      }
    }

    const chineseArchitectureSection = html.match(
      /<section\b[^>]*id=["']reference-architecture-zh["'][^>]*>([\s\S]*?)<\/section>/i
    )?.[1];
    const chineseArchitectureSchema = parsedSchemas.find(
      (schema) =>
        schema?.["@type"] === "ItemList" &&
        /#reference-architecture-zh$/.test(schema?.["@id"] || "")
    );
    if (chineseArchitectureSection || chineseArchitectureSchema) {
      if (!chineseArchitectureSection) {
        errors.push(
          `${htmlFile}: Chinese architecture structured data requires a visible architecture section.`
        );
      }
      if (!chineseArchitectureSchema) {
        errors.push(
          `${htmlFile}: visible Chinese reference architecture requires ItemList structured data.`
        );
      } else {
        if (chineseArchitectureSchema.inLanguage !== "zh-Hans") {
          errors.push(`${htmlFile}: Chinese architecture ItemList must declare zh-Hans.`);
        }
        if (
          chineseArchitectureSchema.numberOfItems !== 8 ||
          chineseArchitectureSchema.itemListElement?.length !== 8
        ) {
          errors.push(`${htmlFile}: Chinese architecture ItemList must contain exactly eight layers.`);
        }
      }
      const renderedLayerCount = chineseArchitectureSection
        ? [...chineseArchitectureSection.matchAll(/<tbody>[\s\S]*?<\/tbody>/gi)]
            .flatMap((match) => [...match[0].matchAll(/<tr\b/gi)]).length
        : 0;
      if (renderedLayerCount !== 8) {
        errors.push(
          `${htmlFile}: visible Chinese reference architecture contains ${renderedLayerCount} layers; expected 8.`
        );
      }
      if (
        html.indexOf('id="reference-architecture-zh"') <
        html.indexOf('id="questions-answered-zh"')
      ) {
        errors.push(`${htmlFile}: Chinese reference architecture must appear after the Chinese FAQ.`);
      }
    }

    const pdfAlternates = [
      ...html.matchAll(
        /<link\b[^>]*rel=["']alternate["'][^>]*type=["']application\/pdf["'][^>]*href=["']([^"']+)["'][^>]*>/gi
      )
    ].map((match) => match[1]);
    const pdfMediaUrls = new Set(
      parsedSchemas
        .filter((schema) => schema?.["@type"] === "MediaObject")
        .map((schema) => schema.contentUrl)
    );
    const pdfMediaSchemas = parsedSchemas.filter(
      (schema) => schema?.["@type"] === "MediaObject"
    );
    for (const media of pdfMediaSchemas) {
      if (
        !media?.["@id"] ||
        !media?.contentUrl ||
        !/\.pdf$/i.test(media.contentUrl) ||
        media.encodingFormat !== "application/pdf" ||
        media.isAccessibleForFree !== true
      ) {
        errors.push(`${htmlFile}: incomplete PDF MediaObject structured data.`);
      }
      if (media.license && media.copyrightNotice) {
        errors.push(`${htmlFile}: PDF MediaObject must not mix a license with an exclusion notice.`);
      }
    }
    for (const pdfUrl of pdfAlternates) {
      if (!pdfMediaUrls.has(pdfUrl)) {
        errors.push(`${htmlFile}: PDF alternate ${pdfUrl} has no top-level MediaObject schema.`);
      }
    }
    if (pdfAlternates.length !== pdfMediaUrls.size) {
      errors.push(
        `${htmlFile}: PDF alternate links and top-level MediaObject declarations must match one-to-one.`
      );
    }

    const articleSchema = parsedSchemas.find(
      (schema) => schema?.["@type"] === expectedWorkType
    );
    const sourcePage = researchPages.find(({ data }) => data.canonical_url === canonical);
    const sourceAuthorEntities = new Map(
      asArray(sourcePage?.data?.author_entities).map((author) => [author?.name, author])
    );
    if (isResearchTopic) {
      const works = asArray(sourcePage?.data.research_works);
      if (sourcePage.data.schema_type !== 'WebPage' || sourcePage.data.citation_metadata !== false || /name="citation_/i.test(html)) errors.push(htmlFile+': a multi-work topic must use WebPage and omit single-paper citation tags.');
      if (works.length < 2 || new Set(works.map(w=>w.id)).size !== works.length || new Set(works.map(w=>w.pdf_url)).size !== works.length) errors.push(htmlFile+': topic requires distinct work identities and PDFs.');
      for (const work of works) {
        const actual=parsedSchemas.find(s=>s['@id']===work.id);
        if (!actual || !['ScholarlyArticle','Article','Report'].includes(actual['@type']) || actual.name!==work.title || actual.version!==work.version || actual.datePublished!==work.date || actual.encoding?.['@id']!==`${config.url}${config.baseurl}${work.pdf_url}`+'#media-object') errors.push(htmlFile+': incomplete or mismatched research work '+work.id);
        if (!asArray(articleSchema?.mainEntity).some(e=>e['@id']===work.id)) errors.push(htmlFile+': topic must link each work as a main entity.');
        if (!html.includes(work.title)) errors.push(htmlFile+': work title must be visible.');
      }
      if (asArray(articleSchema?.encoding).length) errors.push(htmlFile+': distinct papers are not encodings of the topic page.');
    }
    const articleAuthors = Array.isArray(articleSchema?.author)
      ? articleSchema.author
      : articleSchema?.author
        ? [articleSchema.author]
        : [];
    if (isAtlasLanding) {
      const expectedNames = asArray(sourcePage?.data?.author_entities).map(author => author.name);
      if (articleAuthors.length !== expectedNames.length || !expectedNames.every(name => articleAuthors.some(author => author?.name === name && author?.["@type"] === "Person"))) errors.push(`${htmlFile}: atlas curator identities must match its source author_entities.`);
    }
    for (const author of articleAuthors) {
      const registeredProfile = authorProfiles?.[author?.name];
      if (!registeredProfile) continue;
      const sourceAuthor = sourceAuthorEntities.get(author.name);
      const expectedSameAs = [
        ...new Set([
          ...asArray(sourceAuthor?.same_as),
          ...asArray(registeredProfile.same_as)
        ])
      ];
      const expectedUrl = sourceAuthor?.url || registeredProfile.url;
      const expectedOrcid = sourceAuthor?.orcid || registeredProfile.orcid;
      const sameAs = Array.isArray(author.sameAs)
        ? author.sameAs
        : author.sameAs
          ? [author.sameAs]
          : [];
      for (const expectedIdentityUrl of expectedSameAs) {
        if (!sameAs.includes(expectedIdentityUrl)) {
          errors.push(
            `${htmlFile}: author ${author.name} must include ${expectedIdentityUrl} in sameAs.`
          );
        }
      }
      if (expectedUrl && author.url !== expectedUrl) {
        errors.push(
          `${htmlFile}: author ${author.name} must use the expected author.url ${expectedUrl}.`
        );
      }
      if (expectedOrcid && author.identifier !== expectedOrcid) {
        errors.push(
          `${htmlFile}: author ${author.name} must expose ${expectedOrcid} as its ORCID identifier.`
        );
      }
      if (!isAtlasLanding && !isResearchTopic && expectedOrcid && !html.includes(`name="citation_author_orcid" content="${expectedOrcid}"`)) {
        errors.push(
          `${htmlFile}: author ${author.name} must expose ${expectedOrcid} in citation metadata.`
        );
      }
    }
    const articleMediaReferences = [
      ...(Array.isArray(articleSchema?.encoding)
        ? articleSchema.encoding
        : articleSchema?.encoding
          ? [articleSchema.encoding]
          : []),
      ...(Array.isArray(articleSchema?.associatedMedia)
        ? articleSchema.associatedMedia
        : articleSchema?.associatedMedia
          ? [articleSchema.associatedMedia]
          : [])
    ];
    const referencedMediaIds = new Set(
      articleMediaReferences.map((media) => media?.["@id"]).filter(Boolean)
    );
    for (const media of pdfMediaSchemas) {
      if (!referencedMediaIds.has(media["@id"])) {
        errors.push(`${htmlFile}: PDF MediaObject is not linked from the ScholarlyArticle.`);
      }
    }

    const articleHtml = html.match(
      /<article\b[^>]*class=["'][^"']*research-article[^"']*["'][^>]*>([\s\S]*?)<\/article>/i
    )?.[1];
    if (articleHtml) {
      const headings = [...articleHtml.matchAll(/<h([1-6])\b/gi)].map(
        (match) => Number(match[1])
      );
      if (headings.filter((level) => level === 1).length !== 1) {
        errors.push(`${htmlFile}: research article must contain exactly one H1.`);
      }
      for (let index = 1; index < headings.length; index += 1) {
        if (headings[index] > headings[index - 1] + 1) {
          errors.push(`${htmlFile}: heading hierarchy skips a level.`);
          break;
        }
      }
    }
  }
}

if (await exists(path.join(siteDirectory, "index.html"))) {
  const indexHtml = await readFile(path.join(siteDirectory, "index.html"), "utf8");
  const homepageChecks = [
    ['name="description"', "meta description"],
    ['rel="canonical"', "canonical URL"],
    ['rel="icon"', "favicon"],
    ['sizes="336x336"', "square favicon dimensions"],
    ['property="og:image"', "Open Graph image"],
    ['name="twitter:card"', "Twitter card"],
    ['"@type":"CollectionPage"', "CollectionPage structured data"],
    ['id="publication-search"', "publication search"],
    ["data-share", "share control"],
    ['data-share-link="bluesky"', "Bluesky share action"],
    ['data-share-link="threads"', "Threads share action"],
    ['data-share-link="reddit"', "Reddit share action"],
    ["assets/cc-by.svg", "CC BY 4.0 vector badge"],
    ['id="research-scope-title"', "research scope summary"],
    ['id="faq-title"', "visible research FAQ"],
    ['"@type":"FAQPage"', "FAQPage structured data"],
    ['"@type":"ResearchProject"', "ResearchProject structured data"],
    ["publication-card", "publication cards"]
  ];

  for (const [needle, label] of homepageChecks) {
    if (!indexHtml.replace(/\s+/g, "").includes(needle.replace(/\s+/g, ""))) {
      errors.push(`index.html: missing ${label}.`);
    }
  }

  const homepageSchemas = [];
  for (const script of indexHtml.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      homepageSchemas.push(JSON.parse(script[1]));
    } catch {
      // The generic JSON-LD validation above reports the parse error with its details.
    }
  }

  const topLevelSchemaTypes = new Set(
    homepageSchemas.flatMap((schema) => {
      const type = schema?.["@type"];
      return Array.isArray(type) ? type : type ? [type] : [];
    })
  );
  for (const type of ["WebSite", "CollectionPage", "ResearchProject", "ItemList", "FAQPage"]) {
    if (!topLevelSchemaTypes.has(type)) {
      errors.push(`index.html: ${type} must be exposed as a top-level JSON-LD block.`);
    }
  }

  const homepageWebsite = homepageSchemas.find((schema) => schema?.["@type"] === "WebSite");
  const homepageAuthorProfile = authorProfiles?.["Dr. Carsten Stöcker"];
  const homepageAuthorSameAs = Array.isArray(homepageWebsite?.author?.sameAs)
    ? homepageWebsite.author.sameAs
    : homepageWebsite?.author?.sameAs
      ? [homepageWebsite.author.sameAs]
      : [];
  if (homepageWebsite?.author?.url !== homepageAuthorProfile?.url) {
    errors.push("index.html: Carsten Stöcker must retain the homepage profile as author.url.");
  }
  if (
    homepageAuthorProfile?.orcid &&
    homepageWebsite?.author?.identifier !== homepageAuthorProfile.orcid
  ) {
    errors.push("index.html: Carsten Stöcker must expose the registered ORCID identifier.");
  }
  for (const expectedIdentityUrl of asArray(homepageAuthorProfile?.same_as)) {
    if (!homepageAuthorSameAs.includes(expectedIdentityUrl)) {
      errors.push(`index.html: Carsten Stöcker must include ${expectedIdentityUrl} in sameAs.`);
    }
  }

  const faqSchema = homepageSchemas.find((schema) => schema?.["@type"] === "FAQPage");
  if (faqSchema && faqSchema.mainEntity?.length !== faqItems.length) {
    errors.push(
      `index.html: FAQPage schema contains ${faqSchema.mainEntity?.length || 0} questions; expected ${faqItems.length}.`
    );
  }

  const renderedFaqItems = [...indexHtml.matchAll(/class=["'][^"']*faq-item[^"']*["']/gi)].length;
  if (renderedFaqItems !== faqItems.length) {
    errors.push(
      `index.html: rendered ${renderedFaqItems} FAQ answers; expected ${faqItems.length}.`
    );
  }

  const homepageSectionOrder = [
    'id="research-scope"',
    'id="publications"',
    'class="market-position-spotlight',
    'id="dpp-dbp"',
    'class="trust-planes',
    'class="corridor-section',
    'id="faq"'
  ];
  let previousPosition = -1;
  for (const marker of homepageSectionOrder) {
    const markerPosition = indexHtml.indexOf(marker);
    if (markerPosition < 0 || markerPosition <= previousPosition) {
      errors.push("index.html: homepage editorial sections are missing or out of order.");
      break;
    }
    previousPosition = markerPosition;
  }
}

if (await exists(path.join(siteDirectory, "robots.txt"))) {
  const robots = await readFile(path.join(siteDirectory, "robots.txt"), "utf8");
  const normalizedRobots = robots.replace(/\r\n/g, "\n");
  if (robots.charCodeAt(0) === 0xfeff || robots.includes("\u00a0")) {
    errors.push("robots.txt: remove the UTF-8 BOM and non-breaking spaces.");
  }
  if (!/^User-agent:\s*\*\s*\nAllow:\s*\/$/im.test(normalizedRobots)) {
    errors.push("robots.txt: public crawling is not explicitly allowed.");
  }
  const requiredCrawlerAgents = [
    "Googlebot",
    "Googlebot-Image",
    "Googlebot-Video",
    "Googlebot-News",
    "Google-InspectionTool",
    "GoogleOther",
    "Google-CloudVertexBot",
    "Google-Extended",
    "Bingbot",
    "DuckDuckBot",
    "Baiduspider",
    "YandexBot",
    "Slurp",
    "Applebot",
    "Bravebot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "Claude-SearchBot",
    "Claude-User",
    "ClaudeBot",
    "PerplexityBot",
    "Perplexity-User",
    "GPTBot",
    "CCBot",
    "Amazonbot",
    "Meta-ExternalAgent",
    "AI2Bot",
    "cohere-ai",
    "InternetArchiveBot",
    "SemanticScholarBot",
    "Twitterbot",
    "facebookexternalhit",
    "LinkedInBot",
    "Discordbot",
    "Slackbot-LinkExpanding",
    "redditbot"
  ];
  for (const crawler of requiredCrawlerAgents) {
    const escapedCrawler = crawler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const allowedGroup = new RegExp(
      `^User-agent:\\s*${escapedCrawler}\\s*\\nAllow:\\s*\\/$`,
      "im"
    );
    if (!allowedGroup.test(normalizedRobots)) {
      errors.push(`robots.txt: ${crawler} is not explicitly allowed.`);
    }
  }
  const wildcardPosition = normalizedRobots.indexOf("User-agent: *");
  const agentAfterWildcard = normalizedRobots
    .slice(wildcardPosition + "User-agent: *".length)
    .match(/^User-agent:/im);
  if (wildcardPosition < 0 || agentAfterWildcard) {
    errors.push("robots.txt: the wildcard crawler group must remain the final User-agent group.");
  }
  if (!/^Sitemap:\s*https:\/\/spherity\.github\.io\/spherity-research\/sitemap\.xml$/im.test(normalizedRobots)) {
    errors.push("robots.txt: the canonical absolute sitemap URL is missing.");
  }
}

if (await exists(path.join(siteDirectory, ".well-known", "security.txt"))) {
  const security = await readFile(
    path.join(siteDirectory, ".well-known", "security.txt"),
    "utf8"
  );
  if (security.charCodeAt(0) === 0xfeff || security.includes("\u00a0")) {
    errors.push("security.txt: remove the UTF-8 BOM and non-breaking spaces.");
  }
  if (!/^Contact:\s+mailto:security@spherity\.com$/im.test(security)) {
    errors.push("security.txt: missing the security contact URI.");
  }
  const expires = security.match(/^Expires:\s+(.+)$/im)?.[1]?.trim();
  if (!expires || Number.isNaN(Date.parse(expires)) || Date.parse(expires) <= Date.now()) {
    errors.push("security.txt: Expires must be a valid future RFC 3339 date.");
  }
  const expectedCanonical = `${canonicalOrigin}/.well-known/security.txt`;
  if (!security.includes(`Canonical: ${expectedCanonical}`)) {
    errors.push(`security.txt: missing canonical URI ${expectedCanonical}.`);
  }
  if (!/^Preferred-Languages:\s+en,\s*de$/im.test(security)) {
    errors.push("security.txt: preferred languages must declare en and de.");
  }
  if (!security.endsWith("\n")) {
    errors.push("security.txt: file must end with a newline.");
  }
  for (const requiredField of ["Contact", "Expires", "Preferred-Languages", "Canonical"]) {
    const occurrences = [...security.matchAll(new RegExp(`^${requiredField}:`, "gim"))].length;
    if (occurrences !== 1) {
      errors.push(`security.txt: ${requiredField} must appear exactly once.`);
    }
  }
}

const deployWorkflowPath = path.join(projectDirectory, ".github", "workflows", "deploy.yml");
if (await exists(deployWorkflowPath)) {
  const deployWorkflow = await readFile(deployWorkflowPath, "utf8");
  if (
    !/uses:\s*actions\/upload-pages-artifact@[^\n]+[\s\S]{0,500}?include-hidden-files:\s*true/i.test(
      deployWorkflow
    )
  ) {
    errors.push(
      "deploy.yml: upload-pages-artifact must include hidden files so .well-known/security.txt is deployed."
    );
  }
}

if (await exists(path.join(siteDirectory, "llms.txt"))) {
  const llms = await readFile(path.join(siteDirectory, "llms.txt"), "utf8");
  for (const publication of publications) {
    for (const [index, link] of (publication.links || []).entries()) {
      if (!link?.url || (index !== 0 && !/\.pdf$/i.test(link.url))) continue;
      const publicationUrl = `${canonicalOrigin}${link.url}`;
      if (!llms.includes(publicationUrl)) {
        errors.push(`llms.txt: missing publication URL ${publicationUrl}.`);
      }
    }
  }
  if (!llms.includes("https://creativecommons.org/licenses/by/4.0/")) {
    errors.push("llms.txt: missing the research-content license URL.");
  }
}

for (const [asset, maximumKilobytes] of [
  ["assets/site.css", 60],
  ["assets/spherity-research-respec.css", 60],
  ["assets/research-portal.js", 25]
]) {
  const target = path.join(siteDirectory, asset);
  if (!(await exists(target))) continue;
  const assetStats = await stat(target);
  if (assetStats.size > maximumKilobytes * 1024) {
    errors.push(`${asset}: exceeds the ${maximumKilobytes} KB performance budget.`);
  }
}

if (await exists(path.join(siteDirectory, "assets/research-portal.js"))) {
  const script = await readFile(path.join(siteDirectory, "assets/research-portal.js"), "utf8");
  if (/document\.write|core-js|polyfill\.io/i.test(script)) {
    errors.push("research-portal.js: avoid document.write and broad legacy polyfills.");
  }
}

if (await exists(path.join(siteDirectory, "sitemap.xml"))) {
  const sitemapBuffer = await readFile(path.join(siteDirectory, "sitemap.xml"));
  const sitemap = sitemapBuffer.toString("utf8");
  if (sitemapBuffer.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) {
    errors.push("sitemap.xml: UTF-8 BOM must not precede the XML declaration.");
  }
  if (!sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    errors.push("sitemap.xml: the XML declaration must start at byte zero.");
  }
  if (sitemap.includes("\u00a0")) {
    errors.push("sitemap.xml: replace non-breaking spaces with ordinary whitespace.");
  }
  if (!/^<\?xml[^>]+\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"(?: xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1")?>[\s\S]*<\/urlset>\n?$/.test(sitemap)) {
    errors.push("sitemap.xml: malformed XML sitemap envelope.");
  }
  if (sitemap.includes('<image:image>') && !sitemap.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) {
    errors.push("sitemap.xml: image entries require the Google image sitemap namespace.");
  }
  for (const [, imageLocation] of sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) {
    if (!imageLocation.startsWith(`${canonicalOrigin}/assets/`) || !/\.(?:svg|png|jpe?g|webp|avif)$/i.test(imageLocation)) {
      errors.push(`sitemap.xml: invalid publication image URL ${imageLocation}.`);
    }
  }
  const sitemapMatches = [
    ...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/gi)
  ];
  const sitemapEntries = new Map(
    sitemapMatches.map((match) => [match[1].replaceAll("&amp;", "&"), match[2]])
  );
  for (const record of pdfShares) {
    if (sitemapEntries.has(sharePublicUrl(record.sharePath))) {
      errors.push(`sitemap.xml: noindex PDF sharing page must be excluded: ${record.sharePath}.`);
    }
  }
  if (sitemapMatches.length !== sitemapEntries.size) {
    errors.push("sitemap.xml: duplicate <loc> entries are not allowed.");
  }
  for (const [location, lastModified] of sitemapEntries) {
    if (!location.startsWith(`${canonicalOrigin}/`)) {
      errors.push(`sitemap.xml: non-canonical or non-HTTPS URL ${location}.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastModified) || Number.isNaN(Date.parse(lastModified))) {
      errors.push(`sitemap.xml: invalid lastmod ${lastModified} for ${location}.`);
    }
  }

  const sitemapDownloads = await loadSitemapDownloads(sourceDirectory, siteDirectory);
  const expectedSitemapUrls = new Set([...sitemapDownloads.keys()].map(asset => canonicalOrigin + asset));
  const sitemapFiles = await glob("**/*.{html,pdf}", {
    cwd: siteDirectory,
    nodir: true,
    ignore: ["404.html", "google*.html"],
    windowsPathsNoEscape: true
  });
  for (const sitemapFile of sitemapFiles) {
    const normalizedFile = sitemapFile.split(path.sep).join("/");
    if ((figureDownloads.has(`/${normalizedFile}`) && !sitemapDownloads.has(`/${normalizedFile}`)) || placeholderDownloads.has(`/${normalizedFile}`)) continue;
    let expectedUrl = `${canonicalOrigin}/${normalizedFile}`;
    if (normalizedFile === "index.html") expectedUrl = `${canonicalOrigin}/`;
    if (normalizedFile.endsWith("/index.html")) {
      expectedUrl = `${canonicalOrigin}/${normalizedFile.slice(0, -"index.html".length)}`;
    }
    if (normalizedFile.toLowerCase().endsWith(".html")) {
      const html = await readFile(path.join(siteDirectory, sitemapFile), "utf8");
      const robotsMeta = html.match(
        /<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i
      )?.[1];
      if (/\bnoindex\b/i.test(robotsMeta || "")) continue;
      expectedUrl =
        html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ||
        expectedUrl;
    }
    expectedSitemapUrls.add(expectedUrl);
  }

  for (const expectedUrl of expectedSitemapUrls) {
    if (!sitemapEntries.has(expectedUrl)) {
      errors.push(`sitemap.xml: missing indexable build output ${expectedUrl}.`);
    }
  }
  for (const sitemapUrl of sitemapEntries.keys()) {
    if (!expectedSitemapUrls.has(sitemapUrl)) {
      errors.push(`sitemap.xml: unexpected or non-indexable URL ${sitemapUrl}.`);
    }
  }
  if (sitemapEntries.size !== expectedSitemapUrls.size) {
    errors.push(
      `sitemap.xml: expected ${expectedSitemapUrls.size} complete URLs but found ${sitemapEntries.size}.`
    );
  }
  for (const researchPage of researchPages) {
    if (permitsDraftAtlas(researchPage.data)) {
      if (sitemapEntries.has(researchPage.data.canonical_url)) errors.push(`sitemap.xml: draft atlas must be excluded: ${researchPage.data.canonical_url}.`);
      continue;
    }
    if (!sitemap.includes(researchPage.data.canonical_url)) {
      errors.push(`sitemap.xml: missing ${researchPage.data.canonical_url}.`);
    }
    const sitemapLastModified = sitemapEntries.get(researchPage.data.canonical_url);
    if (sitemapLastModified !== String(researchPage.data.last_modified_at)) {
      errors.push(
        `sitemap.xml: ${researchPage.data.canonical_url} lastmod must equal ${researchPage.data.last_modified_at}.`
      );
    }
  }
  for (const publication of publications) {
    for (const link of publication.links || []) {
      if (!link?.url || !/\.(?:html|pdf)$/i.test(link.url)) continue;
      const publicationUrl = `${canonicalOrigin}${link.url}`;
      const linkedPage = researchPages.find(({ data }) => data.permalink === link.url);
      if (permitsDraftAtlas(linkedPage?.data) || draftAtlasPath(link.url.replace(/^\//, ""))) {
        if (sitemapEntries.has(publicationUrl)) errors.push(`sitemap.xml: draft atlas must be excluded: ${publicationUrl}.`);
        continue;
      }
      if (!sitemap.includes(publicationUrl)) {
        errors.push(`sitemap.xml: missing publication URL ${publicationUrl}.`);
      }
    }
  }
}

if (warnings.length) {
  console.warn(`Draft atlas publication review pending (${warnings.length} issue(s)); these remain failures in strict production validation:`);
  warnings.forEach(warning => console.warn(`- ${warning}`));
}

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Validated ${researchPages.length} research sources, ${htmlFiles.length} HTML pages, ${pdfShares.length} PDF sharing pages, ${publications.length} catalog entries, and ${requiredFiles.length} required outputs.`
);
