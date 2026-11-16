// SPDX-License-Identifier: Apache-2.0
// WE-6 regression: the F5 matrix on the current stack, and the boundary on the pinned v0.3 stack.
import assert from "node:assert/strict";
import test from "node:test";
import { current, EXPECTED_DEFAULT, MATRIX, pinnedV03 } from "../src/f5.mjs";

test("F5 matrix on rdf-canonize 5.0.0 defaults; every list completes with maxWorkFactor 2", async () => {
  for (const [i, values] of MATRIX.entries()) {
    assert.equal((await current(values)).completes, EXPECTED_DEFAULT[i], `[${values}]`);
    assert.equal((await current(values, { maxWorkFactor: 2 })).completes, true, `[${values}] with maxWorkFactor 2`);
  }
});

test("pinned v0.3 stack (rdf-canonize 3.4.0, maxDeepIterations 1): four equal values complete, five fail", async () => {
  assert.equal((await pinnedV03([0, 0, 0, 0])).completes, true);
  assert.equal((await pinnedV03([0, 0, 0, 0, 0])).completes, false);
});
