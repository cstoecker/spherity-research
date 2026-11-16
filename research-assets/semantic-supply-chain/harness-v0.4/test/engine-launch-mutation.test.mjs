// SPDX-License-Identifier: Apache-2.0
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("engine launch regression detects inherited environment and failed startup mutants", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const original = readFileSync(path.join(root, "src/attestation.mjs"), "utf8");
  const mutations = [
    ["env: engineEnvironment(tpm.tcti), execArgv:", "env: { ...process.env, TPM2TOOLS_TCTI: tpm.tcti }, execArgv:", /actual launch drops inherited preload/],
    ['fork(path.join(launchDir, modules[0].name)', 'fork(path.join(launchDir, "missing.mjs")', /before it was ready/]
  ];
  for (const [from, to, expected] of mutations) {
    const dir = mkdtempSync(path.join(tmpdir(), "ssc-launch-mutant-"));
    try {
      assert.equal(original.split(from).length, 2, "mutation must change exactly one launch guard");
      cpSync(path.join(root, "src"), path.join(dir, "src"), { recursive: true });
      // Keep the original test's ../src import relationship.
      cpSync(path.join(root, "test"), path.join(dir, "test"), { recursive: true });
      writeFileSync(path.join(dir, "src/attestation.mjs"), original.replace(from, to));
      const env = { ...process.env };
      delete env.NODE_TEST_CONTEXT; // run the isolated test runner, not a recursive test context
      const run = spawnSync(process.execPath, ["--test", path.join(dir, "test/engine-preload.test.mjs")], { encoding: "utf8", timeout: 15_000, env });
      assert.equal(run.error, undefined, run.error?.message);
      assert.equal(run.status, 1, `mutant survived: ${from}\n${run.stdout}\n${run.stderr}`);
      assert.match(run.stdout + run.stderr, expected);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});
