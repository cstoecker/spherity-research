// Builds Zenodo deposit metadata from the reviewed publication sources.
//
// The website front matter and the author registry stay the single source of
// truth. zenodo/registry.yml adds only the archival decisions that the website
// does not hold: which works are deposited, their release gates, resource type
// and the DOIs returned by Zenodo. Nothing in this module uses the network.

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";

export const SITE_ORIGIN = "https://spherity.github.io/spherity-research";

export const STATUSES = Object.freeze([
  "candidate", // eligible in principle; gates still open
  "cleared", // every gate passed; may be deposited and published
  "deposited", // a draft exists on Zenodo; not yet published
  "published", // version of record has a DOI
  "existing-record", // already on Zenodo through another route; link, do not re-deposit
  "hold", // a decision is pending outside this repository
  "excluded" // must not be deposited (reason required)
]);

export const GATES = Object.freeze({
  confidentiality: "No NDA, consortium-internal or otherwise confidential material is contained or derivable.",
  disclosure: "Public disclosure is intended: any patent or consortium IP decision is taken before an irreversible deposit.",
  coauthors: "Every named co-author has approved the deposit, the author order and the licence.",
  rights: "CC BY 4.0 can be granted for every page of every file, including figures, quotations and logos.",
  metadata_review: "A person has reviewed the generated metadata (and a sandbox preview) against the PDF."
});

export const GATE_VALUES = Object.freeze(["pass", "n/a", "open", "fail"]);

export const PUBLICATION_TYPES = Object.freeze([
  "workingpaper",
  "preprint",
  "report",
  "technicalnote",
  "deliverable",
  "article",
  "other"
]);

// Zenodo's legacy deposit API relation vocabulary (developers.zenodo.org).
export const RELATIONS = Object.freeze([
  "isCitedBy", "cites", "isSupplementTo", "isSupplementedBy", "isContinuedBy", "continues",
  "isDescribedBy", "describes", "hasMetadata", "isMetadataFor", "isNewVersionOf",
  "isPreviousVersionOf", "isPartOf", "hasPart", "isReferencedBy", "references",
  "isDocumentedBy", "documents", "isCompiledBy", "compiles", "isVariantFormOf",
  "isOriginalFormof", "isIdenticalTo", "isAlternateIdentifier", "isReviewedBy", "reviews",
  "isDerivedFrom", "isSourceOf", "requires", "isRequiredBy", "isObsoletedBy", "obsoletes"
]);

const HONORIFICS = /^(?:(?:Prof|Dr|Dipl|Ing|rer|nat|med|Eng|Ling|Mag)\.\s*)+/i;
const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/;

export function isValidOrcid(value) {
  const match = /^(\d{4})-(\d{4})-(\d{4})-(\d{3}[\dX])$/.exec(value ?? "");
  if (!match) return false;
  const digits = match.slice(1).join("");
  let total = 0;
  for (const character of digits.slice(0, -1)) total = (total + Number(character)) * 2;
  const remainder = (12 - (total % 11)) % 11;
  return digits.at(-1) === (remainder === 10 ? "X" : String(remainder));
}

export function bareOrcid(value) {
  return value ? String(value).replace(/^https?:\/\/orcid\.org\//, "") : undefined;
}

/** "Prof. Dr. Ingrid Vasiliu-Feltes" -> "Vasiliu-Feltes, Ingrid" */
export function toZenodoName(displayName) {
  const plain = String(displayName).replace(HONORIFICS, "").trim();
  const parts = plain.split(/\s+/);
  if (parts.length < 2) return plain;
  const family = parts.pop();
  return `${family}, ${parts.join(" ")}`;
}

export function readFrontMatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return undefined;
  // Jekyll uses YAML 1.1; quoted dates stay strings either way.
  return parseYaml(match[1], { version: "1.1" });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function pagePdfUrls(page) {
  const urls = [page.pdf_url, page.executive_brief_pdf_url, ...asArray(page.associated_media).map((item) => item?.url)];
  return [...new Set(urls.filter((url) => typeof url === "string" && url.toLowerCase().endsWith(".pdf")))];
}

export function resolveCreators(page, authorRegistry, override) {
  if (override?.length) return override.map((creator) => ({ ...creator }));
  const entities = asArray(page.author_entities);
  const names = entities.length ? entities.map((entity) => entity.name) : asArray(page.authors ?? page.author);
  return names.map((name) => {
    const entity = entities.find((candidate) => candidate.name === name) ?? {};
    const profile = authorRegistry[name] ?? {};
    const creator = {
      name: toZenodoName(profile.canonical_name ?? name),
      affiliation: entity.affiliation ?? profile.affiliation ?? page.affiliation
    };
    const orcid = bareOrcid(entity.orcid ?? profile.orcid);
    if (orcid) creator.orcid = orcid;
    return creator;
  });
}

function canonicalUrl(page) {
  if (page.canonical_url) return page.canonical_url;
  if (page.permalink) return `${SITE_ORIGIN}${page.permalink}`;
  return undefined;
}

function licenseId(page) {
  const license = String(page.license ?? "https://creativecommons.org/licenses/by/4.0/");
  if (/creativecommons\.org\/licenses\/by\/4\.0/.test(license)) return "cc-by-4.0";
  return undefined;
}

const LICENSE_IDS = Object.freeze(["cc-by-4.0", "apache-2.0", "mit"]);

/** Repository-relative file entries; "/..." means a published docs/ URL. */
function resolveFiles(entryFiles) {
  return asArray(entryFiles).map((url) => ({
    url,
    source: url.startsWith("/") ? path.join("docs", url.replace(/^\//, "")) : url
  }));
}

/**
 * Software records (upload_type "software") carry their metadata in the
 * registry entry, because they have no website page.
 */
export function buildSoftwareDeposit(entry, authorRegistry) {
  const problems = [];
  const creators = asArray(entry.creators).map((name) => {
    const profile = authorRegistry[name] ?? {};
    const creator = { name: toZenodoName(profile.canonical_name ?? name), affiliation: profile.affiliation };
    const orcid = bareOrcid(profile.orcid);
    if (orcid) creator.orcid = orcid;
    if (!creator.affiliation) problems.push(`missing affiliation for ${creator.name}`);
    return creator;
  });
  if (!creators.length) problems.push("no creators");
  for (const field of ["title", "description", "version", "publication_date", "license"]) {
    if (!entry[field]) problems.push(`software entry needs ${field}`);
  }
  if (entry.license && !LICENSE_IDS.includes(entry.license)) problems.push(`unsupported licence ${entry.license}`);
  const related = asArray(entry.related_identifiers).map((item) => ({ ...item }));
  for (const item of related) if (!RELATIONS.includes(item.relation)) problems.push(`unknown relation ${item.relation}`);
  const metadata = {
    upload_type: "software",
    title: entry.title,
    creators,
    description: `<p>${escapeHtml(String(entry.description ?? "").trim())}</p>`,
    publication_date: entry.publication_date,
    version: String(entry.version ?? ""),
    access_right: "open",
    license: entry.license,
    language: "eng",
    keywords: asArray(entry.keywords).map(String).slice(0, 15),
    related_identifiers: related,
    prereserve_doi: true
  };
  if (entry.notes_for_zenodo) metadata.notes = entry.notes_for_zenodo;
  const files = resolveFiles(entry.files);
  if (!files.length) problems.push("no files to deposit");
  return { metadata, files, problems };
}

/**
 * Returns { metadata, files, problems } for one registry entry.
 * `problems` lists blocking issues; metadata is still returned for review.
 */
export function buildDeposit(entry, page, authorRegistry, defaults = {}) {
  if (entry.upload_type === "software") return buildSoftwareDeposit(entry, authorRegistry);
  const problems = [];
  const creators = resolveCreators(page, authorRegistry, entry.creators);
  if (!creators.length) problems.push("no creators could be resolved");
  for (const creator of creators) {
    if (creator.orcid && !isValidOrcid(creator.orcid)) problems.push(`invalid ORCID for ${creator.name}`);
    if (!creator.affiliation) problems.push(`missing affiliation for ${creator.name}`);
  }

  const description = entry.description ?? page.abstract ?? page.answer_summary ?? page.description;
  if (!description) problems.push("no abstract, answer_summary or description");

  const license = entry.license ?? licenseId(page);
  if (!license) problems.push("page licence is not CC BY 4.0; set an explicit Zenodo licence id after review");

  const publicationType = entry.publication_type ?? defaults.publication_type ?? "workingpaper";
  if (!PUBLICATION_TYPES.includes(publicationType)) problems.push(`unsupported publication_type ${publicationType}`);

  const related = [];
  const canonical = canonicalUrl(page);
  if (canonical) related.push({ relation: "isVariantFormOf", identifier: canonical, resource_type: "publication" });
  if (page.series_url && page.series_position !== 0) {
    related.push({ relation: "isPartOf", identifier: new URL(page.series_url.replace(/^\//, ""), `${SITE_ORIGIN}/`).href });
  }
  for (const item of asArray(entry.related_identifiers)) related.push({ ...item });
  for (const item of related) {
    if (!RELATIONS.includes(item.relation)) problems.push(`unknown relation ${item.relation}`);
  }

  const keywords = asArray(entry.keywords ?? page.about ?? page.keywords).map(String).slice(0, 15);
  const descriptionHtml = `<p>${escapeHtml(String(description).trim())}</p>` +
    (canonical ? `<p>Canonical HTML edition: <a href="${escapeHtml(canonical)}">${escapeHtml(canonical)}</a></p>` : "");

  const metadata = {
    upload_type: "publication",
    publication_type: publicationType,
    title: String(entry.title ?? page.citation_title ?? page.title).replace(/\s+/g, " ").trim(),
    creators,
    description: descriptionHtml,
    publication_date: entry.publication_date ?? page.date,
    access_right: "open",
    license,
    language: entry.language ?? (page.lang === "de" ? "deu" : "eng"),
    keywords,
    related_identifiers: related,
    prereserve_doi: true
  };
  const version = entry.version ?? page.version ?? page.paper_version;
  if (version) metadata.version = String(version);
  const notes = entry.notes_for_zenodo ?? (page.research_cutoff
    ? `Standards, regulation and implementation evidence reviewed to ${page.research_cutoff}. Research proposals are distinguished from adopted law and demonstrated capabilities in the text.`
    : undefined);
  if (notes) metadata.notes = notes;
  const communities = asArray(entry.communities ?? defaults.communities);
  if (communities.length) metadata.communities = communities.map((identifier) => ({ identifier }));
  if (entry.grants?.length) metadata.grants = entry.grants.map((id) => ({ id }));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.publication_date ?? "")) problems.push("publication_date must be an ISO date");

  const files = resolveFiles(entry.files ?? pagePdfUrls(page));
  if (!files.length) problems.push("no PDF file to deposit; publish a PDF edition first or exclude the entry");

  return { metadata, files, problems };
}

export function validateRegistryEntry(entry) {
  const problems = [];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.id ?? "")) problems.push("id must be a lowercase slug");
  if (!STATUSES.includes(entry.status)) problems.push(`unknown status ${entry.status}`);
  const gates = entry.gates ?? {};
  for (const gate of Object.keys(GATES)) {
    if (!GATE_VALUES.includes(gates[gate])) problems.push(`gate ${gate} must be one of ${GATE_VALUES.join(", ")}`);
  }
  for (const gate of Object.keys(gates)) {
    if (!(gate in GATES)) problems.push(`unknown gate ${gate}`);
  }
  const allPassed = Object.keys(GATES).every((gate) => ["pass", "n/a"].includes(gates[gate]));
  if (["cleared", "deposited", "published"].includes(entry.status) && !allPassed) {
    problems.push(`status ${entry.status} requires every gate to be pass or n/a`);
  }
  if (entry.status === "excluded" && !entry.reason) problems.push("excluded entries need a reason");
  if (entry.status === "hold" && !entry.reason) problems.push("held entries need a reason");
  if (["published", "existing-record"].includes(entry.status) && !DOI_PATTERN.test(entry.zenodo?.doi ?? "")) {
    problems.push(`status ${entry.status} requires zenodo.doi`);
  }
  if (entry.zenodo?.concept_doi && !DOI_PATTERN.test(entry.zenodo.concept_doi)) problems.push("invalid zenodo.concept_doi");
  if (!entry.page && entry.upload_type !== "software" && !["excluded", "hold"].includes(entry.status)) problems.push("page is required");
  return problems;
}

/** Registry-wide rules that a single entry cannot check. */
export function validateRegistry(registry) {
  const problems = [];
  const entries = registry?.entries ?? [];
  const ids = new Set();
  const filesSeen = new Map();
  const pageUse = new Map();
  for (const entry of entries) {
    if (ids.has(entry.id)) problems.push(`duplicate id ${entry.id}`);
    ids.add(entry.id);
    for (const file of asArray(entry.files)) {
      if (filesSeen.has(file)) problems.push(`${file} is listed by both ${filesSeen.get(file)} and ${entry.id}`);
      filesSeen.set(file, entry.id);
    }
    if (entry.page) pageUse.set(entry.page, [...(pageUse.get(entry.page) ?? []), entry]);
  }
  // Several works on one topic page would otherwise inherit the same abstract.
  for (const [page, users] of pageUse) {
    if (users.length < 2) continue;
    for (const entry of users) {
      if (!entry.files) problems.push(`${entry.id}: ${page} is shared, so list this work's files explicitly`);
      if (!entry.title) problems.push(`${entry.id}: ${page} is shared, so give this work its own title`);
    }
  }
  return problems;
}

/** Blocking problems that apply only when a deposit is attempted. */
export function depositBlockers(entry, others = []) {
  const blockers = [];
  const shared = others.filter((other) => other !== entry && other.page && other.page === entry.page);
  if (shared.length && !entry.description) {
    blockers.push(`${entry.page} is shared with ${shared.map((other) => other.id).join(", ")}; add this work's own abstract as description`);
  }
  return blockers;
}

export async function loadRegistry(root) {
  const registry = parseYaml(await readFile(path.join(root, "zenodo/registry.yml"), "utf8"), { version: "1.1" });
  const authors = parseYaml(await readFile(path.join(root, "docs/_data/authors.yml"), "utf8"), { version: "1.1" });
  return { registry, authors };
}

export async function loadPage(root, pagePath) {
  return readFrontMatter(await readFile(path.join(root, pagePath), "utf8"));
}

export async function fileFacts(root, relativePath) {
  const absolute = path.join(root, relativePath);
  const bytes = await readFile(absolute);
  const info = await stat(absolute);
  return {
    size: info.size,
    md5: createHash("md5").update(bytes).digest("hex"),
    sha256: createHash("sha256").update(bytes).digest("hex")
  };
}

export function depositable(entry) {
  return entry.status === "cleared" || entry.status === "deposited";
}
