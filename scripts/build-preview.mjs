import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { glob } from "glob";
import { Liquid } from "liquidjs";
import { marked } from "marked";
import { parse as parseYaml } from "yaml";

const projectDirectory = process.cwd();
const sourceDirectory = path.join(projectDirectory, "docs");
const outputDirectory = path.join(projectDirectory, "_site");

const splitFrontMatter = (source) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: source };
  return { data: parseYaml(match[1]) ?? {}, content: match[2] };
};

const config = parseYaml(await readFile(path.join(sourceDirectory, "_config.yml"), "utf8"));
const publications = parseYaml(
  await readFile(path.join(sourceDirectory, "_data", "publications.yml"), "utf8")
);

const site = {
  ...config,
  data: { publications },
  time: new Date(),
  url: config.url,
  baseurl: config.baseurl
};

const liquid = new Liquid({
  root: [path.join(sourceDirectory, "_layouts"), sourceDirectory],
  extname: ".html",
  strictFilters: false,
  strictVariables: false
});

const withBaseUrl = (value = "") => {
  if (/^[a-z]+:\/\//i.test(String(value))) return String(value);
  const clean = String(value).startsWith("/") ? String(value) : `/${value}`;
  return `${site.baseurl || ""}${clean}`.replace(/\/{2,}/g, "/");
};

liquid.registerFilter("relative_url", withBaseUrl);
liquid.registerFilter("absolute_url", (value = "") => `${site.url}${withBaseUrl(value)}`);
liquid.registerFilter("jsonify", (value) => JSON.stringify(value));
liquid.registerFilter("date_to_xmlschema", (value) => new Date(value).toISOString());
liquid.registerFilter("date", (value, format) => {
  const date = new Date(value);
  if (format === "%Y-%m-%d") return date.toISOString().slice(0, 10);
  return date.toISOString();
});

marked.use({
  gfm: true,
  breaks: false
});

const renderLayout = async (layoutName, page, content) => {
  const layoutSource = await readFile(
    path.join(sourceDirectory, "_layouts", `${layoutName}.html`),
    "utf8"
  );
  const layout = splitFrontMatter(layoutSource);
  const rendered = await liquid.parseAndRender(layout.content, { page, site, content });

  if (layout.data.layout) {
    return renderLayout(layout.data.layout, page, rendered);
  }
  return rendered;
};

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(path.join(sourceDirectory, "assets"), path.join(outputDirectory, "assets"), {
  recursive: true
});

const passthroughFiles = await glob("*.{html,pdf}", {
  cwd: sourceDirectory,
  nodir: true,
  windowsPathsNoEscape: true
});

for (const file of passthroughFiles) {
  await cp(path.join(sourceDirectory, file), path.join(outputDirectory, file));
}

const markdownFiles = await glob("*.md", {
  cwd: sourceDirectory,
  nodir: true,
  windowsPathsNoEscape: true
});

for (const file of markdownFiles) {
  const source = await readFile(path.join(sourceDirectory, file), "utf8");
  const { data, content } = splitFrontMatter(source);
  const permalink = data.permalink || `/${file.replace(/\.md$/i, ".html")}`;
  const page = { ...data, url: permalink };
  const liquidContent = await liquid.parseAndRender(content, { page, site });
  const htmlContent =
    data.schema_type === "CollectionPage" ? liquidContent : marked.parse(liquidContent);
  const output = data.layout
    ? await renderLayout(data.layout, page, htmlContent)
    : htmlContent;

  const outputRelativePath =
    permalink === "/"
      ? "index.html"
      : permalink.replace(/^\/+/, "").replace(/\/$/, "/index.html");
  const outputPath = path.join(outputDirectory, ...outputRelativePath.split("/"));
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, "utf8");
}

for (const file of ["robots.txt", "sitemap.xml", "llms.txt"]) {
  const source = await readFile(path.join(sourceDirectory, file), "utf8");
  const { content } = splitFrontMatter(source);
  const output = await liquid.parseAndRender(content, { site, page: { url: `/${file}` } });
  await writeFile(path.join(outputDirectory, file), output, "utf8");
}

console.log(`Built local preview with ${markdownFiles.length} rendered Markdown pages.`);
