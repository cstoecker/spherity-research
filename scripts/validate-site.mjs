import { access, readFile, stat } from "node:fs/promises";
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
const errors = [];

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

  return null;
};

const requiredInfrastructureFiles = [
  "index.html",
  "robots.txt",
  "sitemap.xml",
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
const publications = parseYaml(
  await readFile(path.join(sourceDirectory, "_data", "publications.yml"), "utf8")
);
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
const requiredFiles = [
  ...requiredInfrastructureFiles,
  ...requiredPublicationOutputs
];

for (const requiredFile of requiredFiles) {
  if (!(await exists(path.join(siteDirectory, requiredFile)))) {
    errors.push(`Missing required build output: ${requiredFile}`);
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

  for (const script of html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      JSON.parse(script[1]);
    } catch (error) {
      errors.push(`${htmlFile}: invalid JSON-LD (${error.message}).`);
    }
  }

  const canonical = html.match(
    /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i
  )?.[1];
  if (canonical) {
    if (generatedCanonicals.has(canonical)) {
      errors.push(
        `${htmlFile}: duplicate canonical also used by ${generatedCanonicals.get(canonical)}.`
      );
    } else {
      generatedCanonicals.set(canonical, htmlFile);
    }
  }

  if (html.includes('class="research-article"')) {
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
    ['id="research-answers-title"', "question-led research summary"],
    ["publication-card", "publication cards"]
  ];

  for (const [needle, label] of homepageChecks) {
    if (!indexHtml.replace(/\s+/g, "").includes(needle.replace(/\s+/g, ""))) {
      errors.push(`index.html: missing ${label}.`);
    }
  }
}

if (await exists(path.join(siteDirectory, "robots.txt"))) {
  const robots = await readFile(path.join(siteDirectory, "robots.txt"), "utf8");
  if (!/User-agent:\s*\*\s*[\s\S]*Allow:\s*\/(?:\s|$)/i.test(robots)) {
    errors.push("robots.txt: public crawling is not explicitly allowed.");
  }
  for (const crawler of ["OAI-SearchBot", "ClaudeBot", "PerplexityBot"]) {
    if (!new RegExp(`User-agent:\\s*${crawler}\\s*[\\s\\S]*?Allow:\\s*\\/`, "i").test(robots)) {
      errors.push(`robots.txt: ${crawler} is not explicitly allowed.`);
    }
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
  const sitemap = await readFile(path.join(siteDirectory, "sitemap.xml"), "utf8");
  const sitemapEntries = new Map(
    [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/gi)].map(
      (match) => [match[1].replaceAll("&amp;", "&"), match[2]]
    )
  );
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
