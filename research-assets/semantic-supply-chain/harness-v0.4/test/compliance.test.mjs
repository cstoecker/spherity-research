// SPDX-License-Identifier: Apache-2.0
// H15 / WE-7: compliance evidence, regimes A and B, negative tests N1–N12, and the selective
// disclosure counterexample. Every scenario must produce the outcome the theory predicts.
import assert from "node:assert/strict";
import test from "node:test";
import { complianceScenarios } from "../src/compliance-scenarios.mjs";

test("compliance evidence (M31): every scenario as predicted", async () => {
  const rows = await complianceScenarios();
  assert.equal(rows.length, 23);
  for (const r of rows) assert.equal(r.actual, r.expected, `${r.id} ${r.name}: ${r.detail}`);
});
