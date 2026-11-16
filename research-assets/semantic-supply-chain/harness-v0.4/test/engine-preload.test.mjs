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
import { engineEnvironment, launchEngine } from "../src/attestation.mjs";

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

test("the actual measured launch drops preloads and reaches the engine ready state", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "ssc-preload-test-"));
  const marker = path.join(dir, "marker");
  const preload = path.join(dir, "preload.mjs");
  const child = path.join(dir, "control.mjs");
  writeFileSync(preload, `import { writeFileSync } from "node:fs"; writeFileSync(${JSON.stringify(marker)}, "ran");`);
  writeFileSync(child, "process.exit(0);");
  const saved = process.env.NODE_OPTIONS;
  const calls = [];
  let engine;
  try {
    process.env.NODE_OPTIONS = `--import=${pathToFileURL(preload).href}`;
    // Positive control: require successful execution, not merely an exit event.
    const status = await new Promise((resolve, reject) => {
      const control = fork(child, [], { env: process.env, execArgv: [], stdio: "ignore" });
      control.once("error", reject);
      control.once("exit", (code, signal) => resolve({ code, signal }));
    });
    assert.deepEqual(status, { code: 0, signal: null });
    assert.equal(existsSync(marker), true, "control: inherited preload executes");
    rmSync(marker);
    // No TPM is needed to reach ready: only record the launch PCR extension.
    engine = await launchEngine({ dir, tcti: "unused", run: (...args) => calls.push(args) }, { stateDir: path.join(dir, "state") });
    assert.ok(Number.isInteger(engine.child.pid));
    assert.equal(engine.child.exitCode, null, "engine is alive after ready");
    assert.equal(engine.child.signalCode, null);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], "tpm2_pcrextend");
    assert.equal(existsSync(marker), false, "actual launch drops inherited preload");
    const reply = await engine.call("probe-unsupported-operation");
    assert.equal(reply.ok, false);
    assert.match(reply.error.text, /unknown operation probe-unsupported-operation/);
  } finally {
    if (saved === undefined) delete process.env.NODE_OPTIONS; else process.env.NODE_OPTIONS = saved;
    if (engine) await engine.stop();
    rmSync(dir, { recursive: true, force: true });
  }
});
