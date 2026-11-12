import { readFileSync } from "node:fs";
import jsonld from "jsonld";
import { JsonLdDocumentLoader } from "jsonld-document-loader";
const ctx = (f) => JSON.parse(readFileSync(new URL("../contexts/" + f, import.meta.url), "utf8"));
const V2 = "https://www.w3.org/ns/credentials/v2", EN = "https://contexts.example/energy-roles/v1";
function build(energyFile) {
  const l = new JsonLdDocumentLoader();
  l.addStatic(V2, ctx("credentials-v2.jsonld"));
  l.addStatic(EN, ctx(energyFile));
  const base = l.build(); const seen = [];
  const loader = async (url) => { seen.push(url); return base(url); };
  loader.seen = seen; return loader;
}
const cred = { "@context": [V2, EN], id: "urn:uuid:1", type: ["VerifiableCredential"], issuer: "did:example:i", validFrom: "2026-11-10T00:00:00Z",
  credentialSubject: { id: "did:example:s", dataAccessScope: "BatteryPassportPublicData" } };
const scope = (e) => e[0]["https://www.w3.org/2018/credentials#credentialSubject"][0]["https://vocab.example/energy#dataAccessScope"][0]["@id"];
const tenantA = build("energy-roles-v1.jsonld"); // e.g. another tenant / older allowlist
const tenantB = build("energy-roles-v1.SUBSTITUTED.jsonld");
console.log("jsonld", (await import("jsonld/package.json", { with: { type: "json" } })).default.version);
console.log("A (substituted copy):", scope(await jsonld.expand(cred, { documentLoader: tenantA })), "asked:", tenantA.seen);
console.log("B (honest copy):     ", scope(await jsonld.expand(cred, { documentLoader: tenantB })), "asked:", tenantB.seen);
// Reverse order in a fresh process is the control; here also check that a private resolver isolates:
