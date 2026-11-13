// SPDX-License-Identifier: Apache-2.0
// WE-7: compliance evidence for a customs release decision (M31, T19). Writes results/we7.txt and .json.
import { writeFileSync } from "node:fs";
import { complianceScenarios } from "./src/compliance-scenarios.mjs";

const header = [
  "WE-7: compliance evidence (M31, T19), harness v0.4.0",
  "",
  "SYNTHETIC worked example: a low-value consignment of portable Li-ion battery packs at a customs risk engine.",
  "Parties, identifiers, methods and substance limits are illustrative; the key-claim set is inspired by, but",
  "is not, the legal H7 data set. Coverage sources: one testing laboratory (complete-list responses and an",
  "absence attestation) and one status service. Regime A: full disclosure of the sufficient key-claim set,",
  "evaluated once by the relying party. Regime B: commit-and-certify with a salted commitment, a signed",
  "certificate core, an external timestamp, a verified deposit with a custodian, scope-checked reliance,",
  "lifecycle, a selection log and a dispute report. SD: selective disclosure, for comparison.",
  ""
];
const rows = await complianceScenarios();
const lines = rows.map((r) => `${r.ok ? "as predicted" : "UNEXPECTED  "} ${r.id.padEnd(4)} [${r.regime}] ${r.name}\n${" ".repeat(18)}-> ${r.actual} (${r.detail})`);
const text = [...header, ...lines, "", `${rows.filter((r) => r.ok).length} of ${rows.length} scenarios as predicted`,
  "", "Reading: coverage, not the disclosure format, decides whether omitted adverse evidence is caught (A2 vs A3,",
  "B3 vs B4). A matching replay shows a consistent computation, not complete evidence (B3). Without coverage,",
  "two worlds that differ only in evidence the verifier cannot see give the same output (S2)."].join("\n");
console.log(text);
writeFileSync(new URL("./results/we7.txt", import.meta.url), text + "\n");
writeFileSync(new URL("./results/we7.json", import.meta.url), JSON.stringify({ harness: "0.4.0", example: "WE-7", scenarios: rows }, null, 2) + "\n");
if (!rows.every((r) => r.ok)) process.exit(1);
