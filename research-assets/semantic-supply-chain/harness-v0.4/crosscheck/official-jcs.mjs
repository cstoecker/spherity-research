import { readFileSync } from "node:fs";
import { DataIntegrityProof } from "@digitalbazaar/data-integrity";
import { createSignCryptosuite, createVerifyCryptosuite } from "@digitalbazaar/ecdsa-jcs-2019-cryptosuite";
import * as EcdsaMultikey from "@digitalbazaar/ecdsa-multikey";
import jsigs from "jsonld-signatures";
import jsonld from "jsonld";
import multikeyContext from "@digitalbazaar/multikey-context";
const { purposes: { AssertionProofPurpose } } = jsigs;
const ctx = (f) => JSON.parse(readFileSync(new URL("../contexts/" + f, import.meta.url), "utf8"));
const V2 = "https://www.w3.org/ns/credentials/v2", EN = "https://contexts.example/energy-roles/v1";
const keyPair = await EcdsaMultikey.generate({ curve: "P-256" });
const controller = "did:example:issuer";
keyPair.controller = controller; keyPair.id = controller + "#key-1";
const pub = await keyPair.export({ publicKey: true, includeContext: true });
const controllerDoc = { "@context": ["https://www.w3.org/ns/did/v1", multikeyContext.constants.CONTEXT_URL], id: controller, assertionMethod: [pub], verificationMethod: [pub] };
function loader(energyFile) {
  const docs = { [V2]: ctx("credentials-v2.jsonld"), [EN]: ctx(energyFile),
    [multikeyContext.constants.CONTEXT_URL]: multikeyContext.CONTEXT,
    "https://www.w3.org/ns/did/v1": { "@context": { "@protected": true, id: "@id", type: "@type",
      assertionMethod: { "@id": "https://w3id.org/security#assertionMethod", "@type": "@id", "@container": "@set" },
      verificationMethod: { "@id": "https://w3id.org/security#verificationMethod", "@type": "@id" } } },
    [controller]: controllerDoc, [keyPair.id]: pub };
  return async (url) => { const d = docs[url] ?? docs[url.split("#")[0]]; if (!d) throw new Error("not allowed " + url); return { contextUrl: null, documentUrl: url, document: url === keyPair.id ? pub : d }; };
}
const cred = { "@context": [V2, EN], id: "urn:uuid:1", type: ["VerifiableCredential"], issuer: controller, validFrom: "2026-11-10T00:00:00Z",
  credentialSubject: { id: "did:example:s", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData" } };
const signed = await jsigs.sign(cred, { suite: new DataIntegrityProof({ signer: keyPair.signer(), cryptosuite: createSignCryptosuite() }), purpose: new AssertionProofPurpose(), documentLoader: loader("energy-roles-v1.jsonld") });
const verifySuite = new DataIntegrityProof({ cryptosuite: createVerifyCryptosuite() });
for (const [label, file] of [["honest", "energy-roles-v1.jsonld"], ["substituted", "energy-roles-v1.SUBSTITUTED.jsonld"]]) {
  const r = await jsigs.verify(signed, { suite: verifySuite, purpose: new AssertionProofPurpose(), documentLoader: loader(file) });
  const e = await jsonld.expand(signed, { documentLoader: loader(file) });
  const s = e[0]["https://www.w3.org/2018/credentials#credentialSubject"][0];
  console.log(label.padEnd(12), "verified:", r.verified, r.error ? String(r.error).slice(0, 120) : "", "| scope:", s["https://vocab.example/energy#dataAccessScope"]?.[0]?.["@id"]);
}
