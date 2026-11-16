// SPDX-License-Identifier: Apache-2.0
// H14: replay-validated receipts (T11′), two-signature stand-in. Every scenario must produce the
// outcome the theory predicts (MC-3 V6/V6x/V6c, MC-6).
import assert from "node:assert/strict";
import test from "node:test";
import { replayScenarios } from "../src/replay-scenarios.mjs";

test("replay-validated receipts: every scenario as predicted", async () => {
  const rows = await replayScenarios();
  assert.equal(rows.length, 21);
  for (const r of rows) assert.equal(r.actual, r.expected, `${r.id} ${r.name}: ${r.detail}`);
});
