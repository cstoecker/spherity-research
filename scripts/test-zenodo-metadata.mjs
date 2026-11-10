import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  GATES,
  buildDeposit,
  depositBlockers,
  isValidOrcid,
  toZenodoName,
  validateRegistry,
  validateRegistryEntry
} from "./lib/zenodo-metadata.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = promisify(execFile);
const passed = Object.fromEntries(Object.keys(GATES).map((gate) => [gate, "pass"]));

test("the committed registry and every referenced page and PDF validate", async () => {
  const { stdout } = await run(process.execPath, [path.join(root, "scripts/zenodo-metadata.mjs"), "--check"], { cwd: root });
  assert.match(stdout, /Zenodo registry: \d+ works validated/);
});

test("ORCID check digits are verified", () => {
  assert.equal(isValidOrcid("0009-0003-7417-8872"), true);
  assert.equal(isValidOrcid("0000-0001-7276-354X"), true);
  assert.equal(isValidOrcid("0009-0003-7417-8873"), false);
  assert.equal(isValidOrcid("https://orcid.org/0009-0003-7417-8872"), false);
});

test("creator names drop honorifics and use family-name-first order", () => {
  assert.equal(toZenodoName("Dr. Carsten Stöcker"), "Stöcker, Carsten");
  assert.equal(toZenodoName("Prof. Dr. Ingrid Vasiliu-Feltes"), "Vasiliu-Feltes, Ingrid");
  assert.equal(toZenodoName("Jan-Niklas Gößling"), "Gößling, Jan-Niklas");
});

test("an entry cannot be cleared while any gate is open", () => {
  const entry = { id: "x", page: "docs/x.md", status: "cleared", gates: { ...passed, rights: "open" } };
  assert.ok(validateRegistryEntry(entry).some((problem) => problem.includes("requires every gate")));
  assert.deepEqual(validateRegistryEntry({ ...entry, gates: passed }), []);
});

test("held and excluded entries must say why; published entries need a DOI", () => {
  const gates = passed;
  assert.ok(validateRegistryEntry({ id: "h", status: "hold", gates }).some((p) => p.includes("reason")));
  assert.ok(validateRegistryEntry({ id: "p", page: "docs/p.md", status: "published", gates }).some((p) => p.includes("zenodo.doi")));
  assert.deepEqual(validateRegistryEntry({ id: "p", page: "docs/p.md", status: "published", gates, zenodo: { doi: "10.5281/zenodo.1" } }), []);
});

test("works sharing one topic page need their own files, title and abstract", () => {
  const a = { id: "a", page: "docs/t.md", status: "candidate", gates: passed };
  const b = { id: "b", page: "docs/t.md", status: "candidate", gates: passed, files: ["/b.pdf"], title: "B" };
  assert.ok(validateRegistry({ entries: [a, b] }).some((problem) => problem.startsWith("a:")));
  assert.ok(depositBlockers(b, [a, b]).length > 0);
  assert.deepEqual(depositBlockers({ ...b, description: "Own abstract" }, [a, b]), []);
});

test("metadata is derived from front matter and the author registry", () => {
  const page = {
    citation_title: "A Paper",
    title: "Short",
    date: "2026-09-09",
    abstract: "Answer <first> & evidence.",
    canonical_url: "https://spherity.github.io/spherity-research/a.html",
    license: "https://creativecommons.org/licenses/by/4.0/",
    authors: ["Dr. Carsten Stöcker"],
    pdf_url: "/a.pdf",
    about: ["Trusted AI"],
    research_cutoff: "2026-09-08"
  };
  const authors = {
    "Dr. Carsten Stöcker": { canonical_name: "Dr. Carsten Stöcker", affiliation: "Spherity GmbH", orcid: "https://orcid.org/0009-0003-7417-8872" }
  };
  const { metadata, files, problems } = buildDeposit({ id: "a" }, page, authors, { publication_type: "workingpaper" });
  assert.deepEqual(problems, []);
  assert.equal(metadata.title, "A Paper");
  assert.deepEqual(metadata.creators, [{ name: "Stöcker, Carsten", affiliation: "Spherity GmbH", orcid: "0009-0003-7417-8872" }]);
  assert.equal(metadata.license, "cc-by-4.0");
  assert.equal(metadata.prereserve_doi, true);
  assert.match(metadata.description, /Answer &lt;first&gt; &amp; evidence\./);
  assert.deepEqual(metadata.related_identifiers[0], { relation: "isVariantFormOf", identifier: page.canonical_url, resource_type: "publication" });
  assert.match(metadata.notes, /2026-09-08/);
  assert.deepEqual(files, [{ url: "/a.pdf", source: path.join("docs", "a.pdf") }]);
});

test("a non-CC-BY page is not silently deposited under CC BY", () => {
  const { problems } = buildDeposit({ id: "a" }, { title: "T", date: "2026-01-01", abstract: "x", authors: ["X Y"], affiliation: "Org", pdf_url: "/a.pdf", license: "https://example.org/all-rights-reserved" }, {});
  assert.ok(problems.some((problem) => problem.includes("licence")));
});
