import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";

const getArgument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};

const siteDirectory = path.resolve(getArgument("--site-dir", "_site"));
const basePath = "/spherity-research";
const errors = [];

const exists = async (target) => {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
};

const requiredFiles = [
  "index.html",
  "robots.txt",
  "sitemap.xml",
  "assets/site.css",
  "assets/research-portal.js",
  "assets/spherity_logo_336x336_centered_margins.png",
  "assets/spherity-research-og.png",
  "Spherity_Research_EBW_as_Legal_Control_Plane_for_Zero_Trust_AI_Agents.pdf",
  "Securing-Digital-Identity-Quantum-Vulnerabilities.html",
  "ebw-roadmap.html",
  "threat-escalation-model-germany-eu.html"
];

for (const requiredFile of requiredFiles) {
  if (!(await exists(path.join(siteDirectory, requiredFile)))) {
    errors.push(`Missing required build output: ${requiredFile}`);
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
    ["publication-card", "publication cards"]
  ];

  for (const [needle, label] of homepageChecks) {
    if (!indexHtml.replace(/\s+/g, "").includes(needle.replace(/\s+/g, ""))) {
      errors.push(`index.html: missing ${label}.`);
    }
  }
}

if (errors.length) {
  console.error(`Site validation failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML pages and ${requiredFiles.length} required outputs.`);
