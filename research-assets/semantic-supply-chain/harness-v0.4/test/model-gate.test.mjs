// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

test('MC6 commit-point withdrawal guard is necessary for a prior GRANT receipt', () => {
  const source=readFileSync(new URL('../model/mc.mjs',import.meta.url),'utf8');
  assert.match(source,/MC6\.offline\.onlineBeforeWithdrawal/,'include a GRANT receipt that precedes withdrawal');
  const guard='receipt.outcome === "GRANT" && !withdrawn;';
  assert.equal(source.split(guard).length,2,'mutate exactly one effect gate');
  const dir=mkdtempSync(path.join(tmpdir(),'ssc-mc6-'));
  try {
    const file=path.join(dir,'mc.mjs');
    writeFileSync(file,source.replace(guard,'receipt.outcome === "GRANT";'));
    const run=spawnSync(process.execPath,[file,'--check'],{encoding:'utf8',timeout:300_000});
    assert.equal(run.status,1,run.stderr);
    assert.match(run.stderr,/MC6\.offline\.onlineBeforeWithdrawal: expected HOLDS, got VIOLATED/);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
