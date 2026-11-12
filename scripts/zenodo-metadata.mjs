#!/usr/bin/env node
// Validates zenodo/registry.yml and builds reviewable Zenodo metadata.
// No network access. Usage:
//   node scripts/zenodo-metadata.mjs            report every entry
//   node scripts/zenodo-metadata.mjs --write    also write _zenodo/<id>.json for review
//   node scripts/zenodo-metadata.mjs --entry <id> [--write]
//   node scripts/zenodo-metadata.mjs --check    exit 1 on registry or metadata errors

import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GATES,
  buildDeposit,
  depositBlockers,
  fileFacts,
  loadPage,
  loadRegistry,
  validateRegistry,
  validateRegistryEntry
} from "./lib/zenodo-metadata.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const write = args.includes("--write");
const check = args.includes("--check");
const only = args.includes("--entry") ? args[args.indexOf("--entry") + 1] : undefined;

const { registry, authors } = await loadRegistry(root);
const errors = validateRegistry(registry).map((problem) => `registry: ${problem}`);
const entries = (registry.entries ?? []).filter((entry) => !only || entry.id === only);
if (only && !entries.length) {
  console.error(`No registry entry ${only}`);
  process.exit(1);
}

const fileOwners = new Map();
const rows = [];
for (const entry of entries) {
  for (const problem of validateRegistryEntry(entry)) errors.push(`${entry.id}: ${problem}`);
  if (!entry.page && entry.upload_type !== "software") {
    rows.push({ id: entry.id, status: entry.status, open: openGates(entry), files: 0, note: entry.reason ?? "" });
    continue;
  }
  if (entry.page) {
    try {
      await access(path.join(root, entry.page));
    } catch {
      errors.push(`${entry.id}: page ${entry.page} does not exist`);
      continue;
    }
  }
  const page = entry.page ? await loadPage(root, entry.page) : {};
  const deposit = buildDeposit(entry, page, authors, registry.defaults);
  const facts = [];
  for (const file of deposit.files) {
    const owner = fileOwners.get(file.url);
    if (owner) errors.push(`${entry.id}: ${file.url} is already deposited by ${owner}`);
    fileOwners.set(file.url, entry.id);
    try {
      facts.push({ ...file, ...(await fileFacts(root, file.source)) });
    } catch {
      // Build products (for example a release archive under _zenodo/) may not
      // exist yet; they only block an entry that is about to be deposited.
      if (["cleared", "deposited"].includes(entry.status)) errors.push(`${entry.id}: file ${file.source} does not exist`);
    }
  }
  const blocking = [...deposit.problems, ...depositBlockers(entry, registry.entries)];
  // Missing files or metadata only block entries that are about to be deposited.
  if (["cleared", "deposited"].includes(entry.status)) {
    for (const problem of blocking) errors.push(`${entry.id}: ${problem}`);
  }
  rows.push({
    id: entry.id,
    status: entry.status,
    open: openGates(entry),
    files: facts.length,
    note: [...blocking, entry.reason].filter(Boolean).join("; ")
  });
  if (write) {
    const output = path.join(root, "_zenodo", `${entry.id}.json`);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify({ id: entry.id, status: entry.status, gates: entry.gates, metadata: deposit.metadata, files: facts, blocking }, null, 2)}\n`);
  }
}

function openGates(entry) {
  return Object.keys(GATES).filter((gate) => !["pass", "n/a"].includes(entry.gates?.[gate])).join(",") || "-";
}

if (!check) {
  const width = Math.max(...rows.map((row) => row.id.length), 4);
  console.log(`${"work".padEnd(width)}  ${"status".padEnd(15)}  ${"open gates".padEnd(40)}  pdfs  notes`);
  for (const row of rows) {
    console.log(`${row.id.padEnd(width)}  ${row.status.padEnd(15)}  ${row.open.padEnd(40)}  ${String(row.files).padStart(4)}  ${row.note}`);
  }
  const counts = rows.reduce((total, row) => ({ ...total, [row.status]: (total[row.status] ?? 0) + 1 }), {});
  console.log(`\n${rows.length} works: ${Object.entries(counts).map(([status, count]) => `${count} ${status}`).join(", ")}`);
  if (write) console.log("Review files written to _zenodo/ (not committed).");
}

if (errors.length) {
  console.error(`\n${errors.length} error(s):\n${errors.map((error) => `  - ${error}`).join("\n")}`);
  process.exit(1);
}
if (check) console.log(`Zenodo registry: ${rows.length} works validated.`);
