import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const getArgument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
};

const sitemapFile = path.resolve(getArgument("--sitemap", "_site/sitemap.xml"));
const dryRun = process.argv.includes("--dry-run");
const siteUrl = (process.env.SITE_URL || "https://spherity.github.io/spherity-research").replace(/\/+$/, "");
const key = String(process.env.INDEXNOW_KEY || "").trim();

if (!key) {
  console.log("INDEXNOW_KEY is not configured; skipping IndexNow notification.");
  process.exit(0);
}

if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) {
  console.error("INDEXNOW_KEY must contain 8–128 letters, digits, underscores, or hyphens.");
  process.exit(1);
}

const sitemap = await readFile(sitemapFile, "utf8");
const urls = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)]
  .map((match) =>
    match[1]
      .trim()
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&apos;", "'")
  )
  .filter((url) => url.startsWith(`${siteUrl}/`) || url === siteUrl);

if (!urls.length) {
  console.error(`No ${siteUrl} URLs were found in ${sitemapFile}.`);
  process.exit(1);
}

const endpoint = "https://api.indexnow.org/indexnow";
const payload = {
  host: new URL(siteUrl).host,
  key,
  keyLocation: `${siteUrl}/${key}.txt`,
  urlList: [...new Set(urls)]
};

if (dryRun) {
  console.log(`IndexNow dry run: validated ${payload.urlList.length} sitemap URLs for ${payload.host}.`);
  process.exit(0);
}

let lastError;
for (let attempt = 1; attempt <= 3; attempt += 1) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000)
    });

    if ([200, 202].includes(response.status)) {
      console.log(`IndexNow accepted ${payload.urlList.length} URLs (HTTP ${response.status}).`);
      process.exit(0);
    }

    const body = (await response.text()).slice(0, 500);
    lastError = new Error(`HTTP ${response.status}${body ? `: ${body}` : ""}`);
    if (response.status < 429 || response.status >= 500) break;
  } catch (error) {
    lastError = error;
  }

  if (attempt < 3) {
    await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
  }
}

console.warn(
  `IndexNow notification did not complete after deployment: ${lastError?.message || "unknown error"}. The sitemap remains public and can be retried on the next run.`
);
