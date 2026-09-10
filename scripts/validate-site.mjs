import { access, readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";
import { parse as parseYaml } from "yaml";

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
    for (const [field, minimum] of searchResearchRequirements) {
      const value = searchResearch[field];
      const count = asArray(value).length;
      if (count < minimum) {
        errors.push(
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
      errors.push(`${markdownFile}: search_research.reviewed_on must be a valid date.`);
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
        if (figure?.content_url && !(await exists(sourcePathFromPublicUrl(figure.content_url)))) {
          errors.push(`${label} image does not exist: ${figure.content_url}`);
        }
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

  for (const item of data.toc_items || []) {
    if (
      item.href?.startsWith("#") &&
      item.href !== "#questions-answered" &&
      item.href !== "#license-and-citation" &&
      !content.includes(`id="${item.href.slice(1)}"`)
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
    if (matchingPage?.data.pdf_url !== link.url) {
      errors.push(
        `Publication catalog: PDF link for "${publication.title}" must match pdf_url on its HTML landing page.`
      );
    }
  }
}

if (socialCardsByUrl.size !== publications.length) {
  errors.push(
    `Social cards: found ${socialCardsByUrl.size} manifest entries for ${publications.length} publications.`
  );
}

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

const resolveLocalReference = (reference, htmlFile) => {
  const cleanReference = reference.split("#")[0].split("?")[0];
  if (!cleanReference) return null;
  if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(cleanReference)) return null;

  let publicPath = decodeURIComponent(cleanReference);
  if (publicPath.startsWith(basePath)) publicPath = publicPath.slice(basePath.length);

  if (publicPath.startsWith("/")) {
    publicPath = publicPath.slice(1);
  } else {
    publicPath = path.posix.join(path.posix.dirname(htmlFile), publicPath);
  }

  if (!publicPath || publicPath.endsWith("/")) publicPath += "index.html";
  return path.join(siteDirectory, ...publicPath.split("/"));
};

const generatedCanonicals = new Map();

for (const htmlFile of htmlFiles) {
  const html = await readFile(path.join(siteDirectory, htmlFile), "utf8");

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
    const target = resolveLocalReference(match[1], htmlFile);
    if (target && !(await exists(target))) {
      errors.push(`${htmlFile}: broken local reference ${match[1]}`);
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

  for (const figureScope of html.matchAll(
    /<figure\b[^>]*itemscope[^>]*itemtype=["']https:\/\/schema\.org\/ImageObject["'][^>]*>([\s\S]*?)<\/figure>/gi
  )) {
    const scope = figureScope[1];
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
  if (!/^google[^/]*\.html$/i.test(htmlFile) && htmlFile !== "404.html") {
    const robotsMeta = html.match(
      /<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i
    )?.[1];
    if (!robotsMeta || !/\bindex\b/i.test(robotsMeta) || !/\bfollow\b/i.test(robotsMeta)) {
      errors.push(`${htmlFile}: Google indexing requires index, follow robots metadata.`);
    }
    if (/\bnoindex\b|\bnofollow\b/i.test(robotsMeta || "")) {
      errors.push(`${htmlFile}: public page must not contain noindex or nofollow.`);
    }
  }
  if (canonical) {
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
      ['name="citation_title"', "citation title metadata"],
      ['name="citation_author"', "citation author metadata"],
      ['name="citation_license"', "citation license metadata"],
      ['rel="license"', "machine-readable license link"],
      ['class="research-license"', "paper license and citation block"],
      ["data-share", "share control"],
      ['data-share-link="bluesky"', "Bluesky share action"],
      ['data-share-link="threads"', "Threads share action"],
      ['data-share-link="reddit"', "Reddit share action"],
      ['"@type": "BreadcrumbList"', "BreadcrumbList structured data"],
      ['"@type": "ScholarlyArticle"', "ScholarlyArticle structured data"]
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
    for (const type of ["WebSite", "ScholarlyArticle", "BreadcrumbList", "FAQPage"]) {
      if (!topLevelSchemaTypes.has(type)) {
        errors.push(`${htmlFile}: ${type} must be exposed as a top-level JSON-LD block.`);
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
      (schema) => schema?.["@type"] === "ScholarlyArticle"
    );
    const sourcePage = researchPages.find(({ data }) => data.canonical_url === canonical);
    const sourceAuthorEntities = new Map(
      asArray(sourcePage?.data?.author_entities).map((author) => [author?.name, author])
    );
    const articleAuthors = Array.isArray(articleSchema?.author)
      ? articleSchema.author
      : articleSchema?.author
        ? [articleSchema.author]
        : [];
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
      if (expectedOrcid && !html.includes(`name="citation_author_orcid" content="${expectedOrcid}"`)) {
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
  if (!/^<\?xml[^>]+\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">[\s\S]*<\/urlset>\n?$/.test(sitemap)) {
    errors.push("sitemap.xml: malformed XML sitemap envelope.");
  }
  const sitemapMatches = [
    ...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/gi)
  ];
  const sitemapEntries = new Map(
    sitemapMatches.map((match) => [match[1].replaceAll("&amp;", "&"), match[2]])
  );
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

  const expectedSitemapUrls = new Set();
  const sitemapFiles = await glob("**/*.{html,pdf}", {
    cwd: siteDirectory,
    nodir: true,
    ignore: ["404.html", "google*.html"],
    windowsPathsNoEscape: true
  });
  for (const sitemapFile of sitemapFiles) {
    const normalizedFile = sitemapFile.split(path.sep).join("/");
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
      if (!sitemap.includes(publicationUrl)) {
        errors.push(`sitemap.xml: missing publication URL ${publicationUrl}.`);
      }
    }
  }
}

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Validated ${researchPages.length} research sources, ${htmlFiles.length} HTML pages, ${publications.length} catalog entries, and ${requiredFiles.length} required outputs.`
);
