#!/usr/bin/env node
// Creates or updates a Zenodo draft for one cleared registry entry.
//
// Safe by default:
//   - the Zenodo sandbox is used unless --production is given;
//   - a draft is created, files uploaded and checksums verified, but nothing
//     is published unless --publish --confirm <id> are both given;
//   - only entries with status "cleared" (or "deposited" for an existing
//     draft) and every gate passed can be sent.
//
// Usage:
//   ZENODO_SANDBOX_TOKEN=... node scripts/zenodo-deposit.mjs --entry <id>
//   ZENODO_TOKEN=...         node scripts/zenodo-deposit.mjs --entry <id> --production
//   ZENODO_TOKEN=...         node scripts/zenodo-deposit.mjs --entry <id> --production --publish --confirm <id>
//   add --new-version to deposit a new version of the entry's existing concept record.
//   add --dry-run to print the request plan without any network call.
//
// Tokens need the deposit:write and deposit:actions scopes. They are read from
// the environment only and never printed or written to disk.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDeposit,
  depositBlockers,
  depositable,
  fileFacts,
  loadPage,
  loadRegistry,
  validateRegistry,
  validateRegistryEntry
} from "./lib/zenodo-metadata.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

const entryId = option("--entry");
const production = flag("--production");
const publish = flag("--publish");
const newVersion = flag("--new-version");
const dryRun = flag("--dry-run");
const base = production ? "https://zenodo.org/api" : "https://sandbox.zenodo.org/api";
const environment = production ? "production" : "sandbox";
// A generic client name: Zenodo asks for an identifying User-Agent, and no
// personal contact details are sent.
const userAgent = "SpherityResearchArchiver/1.0 (+https://spherity.github.io/spherity-research/)";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!entryId) fail("Missing --entry <id>.");
if (publish && option("--confirm") !== entryId) fail(`Publishing is irreversible. Repeat the id: --confirm ${entryId}`);

const { registry, authors } = await loadRegistry(root);
const registryProblems = validateRegistry(registry);
if (registryProblems.length) fail(`Registry errors:\n- ${registryProblems.join("\n- ")}`);
const entry = registry.entries.find((candidate) => candidate.id === entryId);
if (!entry) fail(`No registry entry ${entryId}.`);
const entryProblems = validateRegistryEntry(entry);
if (entryProblems.length) fail(`${entryId}:\n- ${entryProblems.join("\n- ")}`);
if (!depositable(entry)) fail(`${entryId} has status ${entry.status}; only cleared entries may be deposited.`);
if (newVersion && !entry.zenodo?.record_id) fail("--new-version needs zenodo.record_id of the latest published version.");

const page = await loadPage(root, entry.page);
const { metadata, files, problems } = buildDeposit(entry, page, authors, registry.defaults);
const blockers = [...problems, ...depositBlockers(entry, registry.entries)];
if (blockers.length) fail(`${entryId} cannot be deposited:\n- ${blockers.join("\n- ")}`);
const facts = [];
for (const file of files) facts.push({ ...file, ...(await fileFacts(root, file.source)) });

if (dryRun) {
  console.log(JSON.stringify({ environment, endpoint: base, newVersion, publish, metadata, files: facts }, null, 2));
  process.exit(0);
}

const token = production ? process.env.ZENODO_TOKEN : process.env.ZENODO_SANDBOX_TOKEN;
if (!token) fail(`Set ${production ? "ZENODO_TOKEN" : "ZENODO_SANDBOX_TOKEN"} in the environment.`);

async function call(method, url, body, headers = {}) {
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "User-Agent": userAgent, ...headers },
    body
  });
  const text = await response.text();
  if (!response.ok) fail(`${method} ${url.replace(base, "")} -> ${response.status}: ${text.slice(0, 800)}`);
  return text ? JSON.parse(text) : {};
}
const json = (method, url, value) =>
  call(method, url, value === undefined ? undefined : JSON.stringify(value), { "Content-Type": "application/json" });

// Refuse to create a second draft for the same work by accident.
const ledgerFile = path.join(root, "_zenodo", "ledger", `${environment}.jsonl`);
const previous = await readFile(ledgerFile, "utf8").then(
  (text) => text.split("\n").filter(Boolean).map((line) => JSON.parse(line)).filter((row) => row.id === entryId),
  () => []
);
const openDraft = previous.findLast((row) => !row.doi);
if (openDraft && !entry.zenodo?.deposition_id && !newVersion && !flag("--another-draft")) {
  fail(`A ${environment} draft already exists (deposition ${openDraft.deposition_id}). Record it as zenodo.deposition_id with status: deposited, or pass --another-draft.`);
}

let deposition;
if (newVersion) {
  const parent = await json("POST", `${base}/deposit/depositions/${entry.zenodo.record_id}/actions/newversion`);
  deposition = await json("GET", parent.links.latest_draft);
  // A new version starts with the previous files; replace them completely.
  for (const existing of deposition.files ?? []) {
    await call("DELETE", `${base}/deposit/depositions/${deposition.id}/files/${existing.id}`);
  }
} else if (entry.status === "deposited" && entry.zenodo?.deposition_id) {
  deposition = await json("GET", `${base}/deposit/depositions/${entry.zenodo.deposition_id}`);
} else {
  deposition = await json("POST", `${base}/deposit/depositions`, {});
}

const uploaded = new Set((deposition.files ?? []).map((file) => file.filename));
for (const file of facts) {
  const name = path.basename(file.source);
  if (uploaded.has(name)) continue;
  const result = await call("PUT", `${deposition.links.bucket}/${encodeURIComponent(name)}`, await readFile(path.join(root, file.source)), {
    "Content-Type": "application/octet-stream"
  });
  const checksum = String(result.checksum ?? "").replace(/^md5:/, "");
  if (checksum !== file.md5) fail(`Checksum mismatch for ${name}: local ${file.md5}, Zenodo ${checksum}`);
}

const updated = await json("PUT", `${base}/deposit/depositions/${deposition.id}`, { metadata });
const reserved = updated.metadata?.prereserve_doi?.doi;
let published;
if (publish) published = await json("POST", `${base}/deposit/depositions/${deposition.id}/actions/publish`);

const ledgerEntry = {
  id: entryId,
  environment,
  deposition_id: deposition.id,
  html: updated.links?.html,
  reserved_doi: reserved,
  doi: published?.doi,
  concept_doi: published?.conceptdoi,
  record_id: published?.record_id ?? published?.id,
  files: facts.map(({ url, size, md5, sha256 }) => ({ url, size, md5, sha256 })),
  at: new Date().toISOString()
};
await mkdir(path.dirname(ledgerFile), { recursive: true });
await writeFile(ledgerFile, `${JSON.stringify(ledgerEntry)}\n`, { flag: "a" });

console.log(JSON.stringify(ledgerEntry, null, 2));
console.log(publish
  ? `Published. Copy doi, concept_doi and record_id into zenodo/registry.yml and set status: published.`
  : `Draft ready for review at ${updated.links?.html}. Nothing was published. Reserved DOI: ${reserved ?? "none"}.`);
