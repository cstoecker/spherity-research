// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import canonicalize from "canonicalize";
import { digest } from "../src/crypto.mjs";
import { verifyProof } from "../src/suites.mjs";

for (const curve of ["p256", "p384"]) {
  const vector = JSON.parse(readFileSync(new URL(`./vector-ecdsa-jcs-2019-${curve}.json`, import.meta.url)));
  test(`W3C ecdsa-jcs-2019 ${curve} test vector verifies`, async () => {
    const result = await verifyProof(vector.signed);
    assert.equal(result.verified, true);
  });
  test(`W3C ecdsa-jcs-2019 ${curve} transformed-document hash matches`, () => {
    const unsecured = structuredClone(vector.signed);
    delete unsecured.proof;
    const algorithm = curve === "p256" ? "sha256" : "sha384";
    assert.equal(digest(algorithm, canonicalize(unsecured)).toString("hex"), vector.expected.transformedDocumentHash);
  });
  test(`W3C ecdsa-jcs-2019 ${curve} vector fails after one-byte change`, async () => {
    const tampered = structuredClone(vector.signed);
    tampered.credentialSubject.alumniOf += "!";
    assert.equal((await verifyProof(tampered)).verified, false);
  });
}
