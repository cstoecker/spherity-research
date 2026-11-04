import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Liquid } from "liquidjs";

const origin = "https://spherity.github.io/spherity-research";
const authorUrl = `${origin}/#dr-carsten-stoecker`;
const pageLicense = "https://creativecommons.org/licenses/by/4.0/";
const layout = await readFile(new URL("../docs/_layouts/default.html", import.meta.url), "utf8");
const figureInclude = await readFile(new URL("../docs/_includes/research-figure.html", import.meta.url), "utf8");
const figureBlock = layout.match(
  /{% if page\.figure_objects %}\s*{% for figure in page\.figure_objects %}([\s\S]*?){% endfor %}\s*{% endif %}/
)?.[1];
assert.ok(figureBlock, "The shared layout must retain its per-figure JSON-LD block.");

const engine = new Liquid();
engine.registerFilter("jsonify", (value) => JSON.stringify(value));
engine.registerFilter("absolute_url", (value) => `${origin}${value}`);
engine.registerFilter("relative_url", (value) => `/spherity-research${value}`);
engine.registerFilter("date_to_xmlschema", (value) => new Date(value).toISOString());

const fixture = (overrides = {}) => ({
  id: "rights-test",
  name: "Rights regression figure",
  content_url: "/assets/rights-test.svg",
  alt: "A diagram with explicit creator and copyright holder metadata.",
  width: 1200,
  height: 800,
  description: "A fixture used to verify the shared figure rights representations.",
  caption: "Rights regression fixture.",
  keywords: ["Runtime revocation", "Multi-agent systems", "Copyright"],
  ...overrides
});

const render = async (figure) => {
  const context = {
    figure,
    include: { figure },
    page: { lang: "en", license: pageLicense, canonical_url: `${origin}/test.html` },
    site: {
      content_license: pageLicense,
      image_creator_name: "Spherity GmbH",
      image_creator_url: "https://www.spherity.com/",
      image_copyright_notice: "© 2026 Spherity GmbH"
    },
    canonical_url: `${origin}/test.html`,
    content_license: pageLicense,
    image_acquire_license_page: `${origin}/test.html#license-and-citation`
  };
  const jsonHtml = await engine.parseAndRender(figureBlock, context);
  const json = JSON.parse(jsonHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]);
  const visible = await engine.parseAndRender(figureInclude, context);
  return { json, visible };
};

test("an explicit author copyright holder survives figure JSON-LD without corporate attribution", async () => {
  const { json, visible } = await render(fixture({
    creator_type: "Person",
    creator_name: "Dr. Carsten Stöcker",
    creator_url: authorUrl,
    credit_text: "Source: Dr. Carsten Stöcker / Spherity Research",
    copyright_notice: "© 2026 Dr. Carsten Stöcker",
    copyright_holder: { type: "Person", name: "Dr. Carsten Stöcker", url: authorUrl }
  }));
  assert.deepEqual(json.copyrightHolder, { "@type": "Person", name: "Dr. Carsten Stöcker", url: authorUrl });
  assert.deepEqual(json.creator, { "@type": "Person", name: "Dr. Carsten Stöcker", url: authorUrl });
  assert.equal(json.copyrightNotice, "© 2026 Dr. Carsten Stöcker");
  assert.equal(json.license, pageLicense);
  assert.match(visible, /itemprop="copyrightNotice" content="© 2026 Dr\. Carsten Stöcker"/);
  assert.match(visible, /itemprop="creator" itemscope itemtype="https:\/\/schema\.org\/Person"/);
  assert.ok(!visible.includes("© 2026 Spherity GmbH"));
});

test("figures without an override retain the existing corporate holder and creator", async () => {
  const { json, visible } = await render(fixture());
  assert.deepEqual(json.copyrightHolder, { "@id": "https://www.spherity.com/#organization" });
  assert.deepEqual(json.creator, { "@type": "Organization", name: "Spherity GmbH", url: "https://www.spherity.com/" });
  assert.equal(json.copyrightNotice, "© 2026 Spherity GmbH");
  assert.equal(json.license, pageLicense);
  assert.equal(json.encodingFormat, "image/svg+xml");
  assert.match(visible, /itemprop="copyrightNotice" content="© 2026 Spherity GmbH"/);
});

test("a per-figure license is identical in JSON-LD and visible figure microdata", async () => {
  const figureLicense = "https://creativecommons.org/licenses/by-sa/4.0/";
  const { json, visible } = await render(fixture({ license: figureLicense }));
  assert.equal(json.license, figureLicense);
  assert.ok(visible.includes(`itemprop="license" href="${figureLicense}"`));
});

test("an explicit organization holder may differ from the creator", async () => {
  const { json } = await render(fixture({
    creator_type: "Person",
    creator_name: "Dr. Carsten Stöcker",
    creator_url: authorUrl,
    copyright_holder: { type: "Organization", name: "Example rights holder", url: "https://example.org/" }
  }));
  assert.deepEqual(json.copyrightHolder, { "@type": "Organization", name: "Example rights holder", url: "https://example.org/" });
  assert.equal(json.creator["@type"], "Person");
});
