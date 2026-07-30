import { access, readFile } from "node:fs/promises";
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

const pngDimensions = async (file) => {
  const buffer = await readFile(file);
  if (
    buffer.length < 24 ||
    buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a"
  ) {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
};

const requiredFiles = [
  "index.html",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "assets/site.css",
  "assets/research-portal.js",
  "assets/spherity_logo_336x336_centered_margins.png",
  "assets/spherity-research-og.png",
  "Spherity_Research_EBW_as_Legal_Control_Plane_for_Zero_Trust_AI_Agents.pdf",
  "ebw-zero-trust-ai-agents.html",
  "Securing-Digital-Identity-Quantum-Vulnerabilities.html",
  "ebw-roadmap.html",
  "threat-escalation-model-germany-eu.html"
];

for (const requiredFile of requiredFiles) {
  if (!(await exists(path.join(siteDirectory, requiredFile)))) {
    errors.push(`Missing required build output: ${requiredFile}`);
  }
}

const config = parseYaml(
  await readFile(path.join(sourceDirectory, "_config.yml"), "utf8")
);
const publications = parseYaml(
  await readFile(path.join(sourceDirectory, "_data", "publications.yml"), "utf8")
);
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
    "image",
    "image_alt",
    "answer_summary",
    "key_takeaways",
    "about",
    "questions_answered"
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

  if (new Date(data.last_modified_at) < new Date(data.date)) {
    errors.push(`${markdownFile}: last_modified_at predates publication date.`);
  }

  const imagePath = sourcePathFromPublicUrl(data.image || "");
  if (!(await exists(imagePath))) {
    errors.push(`${markdownFile}: image does not exist: ${data.image}`);
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
for (const publication of publications) {
  if (publicationTitles.has(publication.title)) {
    errors.push(`Publication catalog: duplicate title "${publication.title}".`);
  }
  publicationTitles.add(publication.title);

  if (!publication.description || !publication.topics?.length || !publication.links?.length) {
    errors.push(`Publication catalog: incomplete entry "${publication.title}".`);
  }

  const primaryLink = publication.links?.[0]?.url;
  if (!primaryLink) continue;

  const matchingPage = researchPages.find(
    ({ data }) => data.permalink === primaryLink
  );
  const directSource = sourcePathFromPublicUrl(primaryLink);
  if (!matchingPage && !(await exists(directSource))) {
    errors.push(
      `Publication catalog: primary link for "${publication.title}" has no source page or file.`
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
      const dimensions = await pngDimensions(imageFile);
      if (
        dimensions &&
        (Number(publication.image_width) !== dimensions.width ||
          Number(publication.image_height) !== dimensions.height)
      ) {
        errors.push(
          `Publication catalog: declared dimensions for ${publication.image} do not match ${dimensions.width}×${dimensions.height}.`
        );
      }
    }
    if (!publication.image_alt) {
      errors.push(`Publication catalog: missing image_alt for "${publication.title}".`);
    }
  }
}

const favicon = path.join(
  sourceDirectory,
  decodeURIComponent(config.favicon.replace(/^\/+/, ""))
);
if (await exists(favicon)) {
  const dimensions = await pngDimensions(favicon);
  if (!dimensions || dimensions.width !== dimensions.height || dimensions.width < 48) {
    errors.push("Configured favicon must be a square PNG at least 48×48 pixels.");
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
}

if (await exists(path.join(siteDirectory, "llms.txt"))) {
  const llms = await readFile(path.join(siteDirectory, "llms.txt"), "utf8");
  for (const publication of publications) {
    const primaryUrl = `${canonicalOrigin}${publication.links[0].url}`;
    if (!llms.includes(primaryUrl)) {
      errors.push(`llms.txt: missing primary publication URL ${primaryUrl}.`);
    }
  }
}

if (await exists(path.join(siteDirectory, "sitemap.xml"))) {
  const sitemap = await readFile(path.join(siteDirectory, "sitemap.xml"), "utf8");
  for (const researchPage of researchPages) {
    if (!sitemap.includes(researchPage.data.canonical_url)) {
      errors.push(`sitemap.xml: missing ${researchPage.data.canonical_url}.`);
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
