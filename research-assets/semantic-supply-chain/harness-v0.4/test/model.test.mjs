// SPDX-License-Identifier: Apache-2.0
// The SSC-FM model checker runs as part of the test suite (H6). --check fails unless every
// expected case is present exactly once with its expected verdict and every HOLDS case is
// non-vacuous (or explicitly marked as holding with no acceptance by design).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("model checker: all expected cases, verdicts as predicted, non-vacuous", () => {
  const mc = fileURLToPath(new URL("../model/mc.mjs", import.meta.url));
  const run = spawnSync(process.execPath, [mc, "--check"], { encoding: "utf8", timeout: 300_000 });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stderr, /all \d+ cases present once, as expected/);
});
