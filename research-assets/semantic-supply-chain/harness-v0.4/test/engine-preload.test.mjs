// SPDX-License-Identifier: Apache-2.0
// R4-15: code preloaded through the launcher's environment must not run inside the measured engine.
// The engine is forked with an allow-listed environment (engineEnvironment) and no execArgv, so a
// NODE_OPTIONS preload, NODE_PATH or LD_PRELOAD set for the launcher never reaches it.
import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { engineEnvironment } from "../src/attestation.mjs";

test("engine environment is an allow-list: no NODE_OPTIONS, NODE_PATH or LD_PRELOAD", () => {
  const saved = { ...process.env };
  try {
    process.env.NODE_OPTIONS = "--import=file:///tmp/unmeasured.mjs";
    process.env.NODE_PATH = "/tmp/elsewhere";
    process.env.LD_PRELOAD = "/tmp/unmeasured.so";
    const env = engineEnvironment("swtpm:host=127.0.0.1,port=2341");
    assert.deepEqual(Object.keys(env).sort(), ["PATH", "TPM2TOOLS_TCTI"]);
  } finally {
    for (const k of ["NODE_OPTIONS", "NODE_PATH", "LD_PRELOAD"]) if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
  }
});

test("a NODE_OPTIONS preload set for the launcher does not run in a child forked as the engine is", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "ssc-preload-test-"));
  const marker = path.join(dir, "marker");
  const preload = path.join(dir, "preload.mjs");
  const child = path.join(dir, "child.mjs");
  writeFileSync(preload, `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(marker)}, "ran");`);
  writeFileSync(child, "process.exit(0);");
  const saved = process.env.NODE_OPTIONS;
  try {
    process.env.NODE_OPTIONS = `--import=${pathToFileURL(preload).href}`;
    // Control: with the inherited environment the preload does run, so the test can detect it.
    await new Promise((resolve) => fork(child, [], { env: process.env, execArgv: [], stdio: "ignore" }).on("exit", resolve));
    assert.equal(existsSync(marker), true, "control: an inherited NODE_OPTIONS preload runs");
    rmSync(marker);
    await new Promise((resolve) => fork(child, [], { env: engineEnvironment("unused"), execArgv: [], stdio: "ignore" }).on("exit", resolve));
    assert.equal(existsSync(marker), false, "the allow-listed engine environment drops the preload");
  } finally {
    if (saved === undefined) delete process.env.NODE_OPTIONS; else process.env.NODE_OPTIONS = saved;
    rmSync(dir, { recursive: true, force: true });
  }
});
