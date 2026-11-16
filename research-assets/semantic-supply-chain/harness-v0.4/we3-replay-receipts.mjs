// SPDX-License-Identifier: Apache-2.0
// WE-3 R: replay-validated receipts (M24 alternative, theorem T11′), two-signature stand-in.
// Prints the scenario table and writes results/we3r.txt and results/we3r.json.
import { writeFileSync } from "node:fs";
import { replayScenarios } from "./src/replay-scenarios.mjs";

const header = [
  "WE-3 R: replay-validated receipts (M24 alternative, T11′), harness v0.4.0",
  "",
  "Two-signature stand-in: device engine and co-signer each sign identical receipt bytes (ECDSA P-256);",
  "the relying party requires both. This is a 2-of-2 instance of T11′. It does NOT implement or test",
  "FROST (RFC 9591) group keys, key generation, nonce rounds or robustness. What an accepted receipt",
  "establishes: its OUTCOME equals deterministic replay of its committed, admissible context. It does",
  "NOT establish which closure the device executed (R10), nor device-only observations, nor liveness.",
  ""
];
const rows = await replayScenarios();
const lines = rows.map((r) => `${r.ok ? "as predicted" : "UNEXPECTED  "} ${r.id.padEnd(4)} ${r.name}\n${" ".repeat(18)}-> ${r.actual} (${r.detail})`);
const all = rows.every((r) => r.ok);
const text = [...header, ...lines, "", `${rows.filter((r) => r.ok).length} of ${rows.length} scenarios as predicted`].join("\n");
console.log(text);
writeFileSync(new URL("./results/we3r.txt", import.meta.url), text + "\n");
writeFileSync(new URL("./results/we3r.json", import.meta.url), JSON.stringify({ harness: "0.4.0", example: "WE-3 R", scenarios: rows }, null, 2) + "\n");
if (!all) process.exit(1);
