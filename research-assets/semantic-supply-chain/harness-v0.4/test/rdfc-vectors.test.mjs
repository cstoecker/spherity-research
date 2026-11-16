// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { staticLoader, W3C_CONTEXTS } from "../src/loader.mjs";
import { verifyProof } from "../src/suites.mjs";

for (const curve of ["p256", "p384"]) {
  const file = new URL(`./vector-ecdsa-rdfc-2019-${curve}.json`, import.meta.url);
  const { signed } = JSON.parse(readFileSync(file));
  test(`W3C ecdsa-rdfc-2019 ${curve} test vector verifies`, async () => {
    const result = await verifyProof(signed, { loader: staticLoader(W3C_CONTEXTS) });
    assert.equal(result.verified, true);
  });
}
