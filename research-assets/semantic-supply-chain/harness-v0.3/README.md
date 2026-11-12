# Semantic supply chain harness (v0.3.0, 12 November 2026)

> **Status: research release accompanying a paper in preparation.** It is published as a dated, public record of the findings and mechanisms it contains. Spherity publishes its research and does not file patents. `ecdsa-lfsc-2026` and the M15 envelope are experimental formats, not standards. Cite via `CITATION.cff`.

Worked examples for the paper *Securing the Semantic Supply Chain* (working title; Spherity Research, in preparation). Apache-2.0.

| WE | Question | Supports |
|---|---|---|
| **WE-1** | Does a valid signature prove what a credential means? | Findings F1–F3; M17 |
| **WE-2** | Does a CBOR-LD label still mean what was printed after the vocabulary changes? | M15 |
| **WE-3** | Can a relying party tell, remotely, which meaning an edge verifier ran? | M24, M25 |
| **WE-4** | What can an attacker with no key make a verifier spend? | Finding F4; M17, M18 |
| **WE-5** | Is a verification decision the same tomorrow, on a busier machine? | M19 |

The work builds on Fujie, Suzuki et al. (arXiv:2611.04461, arXiv:2611.03493) and on *Proofs over Statements* v1.3 (Stöcker, 2026), which supplies the theory these examples demonstrate: Lemma L1, Assumption A1 and Definition 5.1. Pinned versions: `jsonld` 8.3.3, `rdf-canonize` 3.4.0, `@digitalbazaar/cborld` 8.1.0. Cross-checks against `jsonld` 9.0.0 / `rdf-canonize` 5.0.0, PyLD and Digital Bazaar's official `ecdsa-jcs-2019` are in `crosscheck/` and `results/factcheck-2026-11-10.md`.

## Run

```bash
npm install
npm test        # 21 tests, including the W3C test vectors (the TPM test skips without swtpm)
npm run we1
npm run we2
npm run we3     # needs swtpm and tpm2-tools (e.g. apt-get install swtpm swtpm-tools tpm2-tools)
npm run we4     # about a minute
npm run we5
```

The cryptosuites in `src/suites.mjs` are written from the W3C *Data Integrity ECDSA Cryptosuites v1.0* Recommendation and verify its test vectors for `ecdsa-jcs-2019` and `ecdsa-rdfc-2019` on P-256 and P-384. For P-384, `ecdsa-rdfc-2019` needs SHA-384 inside RDFC-1.0.

## LFSC-G: what the experimental `ecdsa-lfsc-2026` does

The proof signs **only the proof configuration**. That configuration carries:
- a **lexical digest**: SHA-256 of the JCS form of the credential;
- a **semantic commitment**: SHA-256 of the RDFC-1.0 canonical N-Quads, plus the SRI digest of every context.

Verification at ingestion runs in three stages:
1. **Stage 0:** a linear pre-scan (M18) with no JSON-LD processing.
2. **Stage 1:** check the lexical digest and the signature, still with no JSON-LD.
3. **Stage 2:** check the context digests, then run bounded RDFC and compare the result with the commitment.

Results are cached per proof, commitment and authority epoch.

**Graph-native re-verification** (`verifyFromQuads`) needs only the stored quads and the stored configuration: no JSON bytes and no context documents. That is per-fact verifiability as defined in *Proofs over Statements*, Definition 5.1.

An unknown cryptosuite identifier makes legacy verifiers reject the proof rather than skip the semantic check.

## WE-1: a valid signature does not prove the meaning

Reference case: a market-role credential grants a *Distribution System Operator* access to *public* Battery Passport data. A second copy of its context under the same URL maps the terms to *Transmission System Operator* and *restricted* data.

| # | Scenario | Result |
|---|---|---|
| A | `ecdsa-jcs-2019`, context as issued | valid; DSO, public |
| **B** | `ecdsa-jcs-2019`, context substituted | **valid; TSO, restricted** |
| C | `ecdsa-rdfc-2019`, context substituted | invalid (detected) |
| **D** | `application/vc+jwt` envelope, context substituted | **valid; TSO, restricted** |
| E | JCS + `relatedResource` digest checked by the verifier | detected |
| F1/F2 | LFSC-G, honest / substituted | accepted / rejected at stage 2 (context digest) |
| G | JCS-signed claim defined in no context | valid; the claim is dropped from the RDF view |
| H | Two loaders with different `static` copies of one URL in one process | the second loader is never asked |
| I | Context URL `http://169.254.169.254/...` | naive processing requests it; LFSC-G stage 0 rejects it first |

B and G were also reproduced with Digital Bazaar's official `ecdsa-jcs-2019` and `jsonld` 9.0.0.

Attribution:
- **B and D** demonstrate *Proofs over Statements* L1(a) and Fujie and Suzuki §VI-A.
- **G** is the JCS-path corollary of Data Integrity 1.0 §2.4.3.
- **H** is known behaviour: jsonld.js #502, #537, and PR #552, unmerged.

## WE-2: CBOR-LD labels depend on codec tables and context bytes

The credential is encoded as CBOR-LD (registry entry 100: 314 bytes; with the M15 envelope: 337 bytes). The verifier later holds a routinely updated context (one term added under the same URL) or a substituted registry entry.

| # | Scenario | Result |
|---|---|---|
| S1 | Baseline | decodes; proof valid |
| **S2** | Signed label (Data Integrity proof before encoding, as in VC Barcodes) after the routine update | **unreadable**: decode error ("improperly formatted bytes") that does not name the cause; the label stays unusable |
| **S3** | Compact profile signing the CBOR-LD bytes, after the same update | **signature valid; decodes without error into a different document**: `credentialSubject` becomes `credentialStatus`, `issuer` becomes `evidence`, the type becomes `DistributionSystemOperator`, the access scope becomes **restricted** |
| S4 | Registry entry substituted (context codes swapped) | decode error |
| S5 | **M15** bound envelope; context updated; no archive | rejected **before decoding**: codec manifest mismatch |
| S6 | **M15** + lifetime archive resolved by manifest digest | decodes the original meaning; proof valid |
| S7 | **M15**; registry entry substituted | rejected before decoding |

Why the binding sits outside the payload: semantic compression assigns term codes from the contexts, so a changed context reassigns them. A commitment *inside* the compressed payload would be decoded with the same wrong codes. Whether drift causes an error (S2) or a silent change (S3) depends on the payload content, so neither outcome is safe.

## WE-3: measured semantics (software TPM)

An edge verifier (gateway, battery management system or charge point) runs a common JCS-only verification stack, so its own verdict cannot reveal which meaning it applied (WE-1 B).

When the device loads a semantic bundle, it extends **PCR 23** with the digest of a `semantic-bundle` event that names the bundle's closure digest (the SRI of every context). A relying party sends a nonce. The TPM quote (ECDSA P-256 attestation key) binds the PCR value, the nonce and the digest of the device's verification receipt. The relying party then:
1. checks the quote;
2. replays the event log;
3. compares the attested closure with its approved, non-withdrawn closures and with the closure named in the receipt.

| # | Scenario | Device's own verdict | Meaning applied | Relying party |
|---|---|---|---|---|
| A | Approved bundle | valid | public data | **accept** |
| B | Context substituted on the device (same URL) | **valid** | **restricted data** | **reject**: attested closure not approved |
| C | Compromised device forges its event log and receipt to claim the approved closure | valid | restricted data | **reject**: log does not replay to the quoted PCR |
| D | Old genuine quote replayed against a fresh challenge | valid | public data | **reject**: quote invalid for this nonce and receipt |
| E | Publisher withdrew the bundle (semantic advisory); device not updated | valid | public data | **reject**: attested closure withdrawn |

Limits:
- A **software TPM** demonstrates the protocol, not hardware trust: there is no endorsement-key certificate chain to a manufacturer root.
- The device's own measurement agent is trusted to extend the PCR when it loads a bundle. On hardware, Linux IMA (`CRITICAL_DATA`) or TEE runtime measurement registers take that role.
- Hardware validation on a gateway and on a BMS or charge-point controller remains planned.

## WE-4: cost before authentication

Attacker documents carry forged proofs. Single environment (4 vCPU cloud container, Node v22), p50.

| Input | Naive verifier, no limit | Naive, `maxDeepIterations` 1 | LFSC-G rejection |
|---|---|---|---|
| complete graph K₈ (1.7 kB) | 1.2 s | aborts, ~5 ms | 0.02–0.03 ms |
| symmetric binary tree, 255 nodes (11 kB) | 2.4 s | aborts, ~10 ms | 0.02–0.05 ms |
| symmetric binary tree, 511 nodes (22 kB) | > 20 s | aborts, ~20 ms | 0.03–0.11 ms |
| labelled tree, 1,500 nodes (benign) | ~60 ms | completes | rejected by size bound (0.25 ms) or blank-node rule |

Legitimate market-role credential, p50 over 200 runs:

| Verification | Time |
|---|---|
| `ecdsa-rdfc-2019` | 1.94 ms |
| `ecdsa-jcs-2019` | 0.20 ms |
| **LFSC-G, first verification** | **1.09 ms** |
| **LFSC-G, graph-native from stored quads** | **0.18 ms** |
| LFSC-G, cached | 0.25 ms |

Version qualification: `rdf-canonize` ≥ 4.0.0 (default `maxWorkFactor = 1`, used by `jsonld` 9.0.0) aborts all attack families by default. `jsonld` 8.x and PyLD do not; PyLD is the slowest tested stack (see the fact-check). The blank-node rule (M18) does not depend on library version.

## WE-5: wall-clock limits are not replayable

A **legitimate** credential (600 blank nodes with unique literals) is canonicalised 21 times on an idle host, then 21 times under CPU contention (8 busy threads on 4 CPUs).

| Host | p50 | Time limit 14.8 ms (1.5 × idle median) | Operation bound (`maxDeepIterations` 1) |
|---|---|---|---|
| idle | 9.9 ms | 21/21 accepted | 21/21 accepted |
| loaded | 29 ms | **0/21 accepted** | 21/21 accepted |

A generous time limit would pass this input. But every wall-clock threshold has a load at which the verdict flips, and a limit tight enough to stop denial of service is also tight enough to reject legitimate credentials on a busy or slower machine. M19: decide *invalid* only on deterministic operation bounds; let a time limit yield *unknown* (liveness), never *invalid*.

## Limitations

- One machine and one JavaScript stack for the main runs; cross-stack checks cover F1, F2 and F4.
- The pre-scan reads simple context definitions for `@list` terms. A signed compiled context (M5) would make it exact.
- `ecdsa-lfsc-2026` and the M15 envelope are experimental formats, not standards.
- WE-5 emulates a slower machine through contention on one host.
- WE-3 uses a software TPM; see its own limits above.

## Files

- `src/suites.mjs`: `ecdsa-jcs-2019`, `ecdsa-rdfc-2019`, ES256 `vc+jwt`
- `src/lfsc.mjs`: LFSC-G issuer, verifier and graph-native re-verification (M17)
- `src/prescan.mjs`: pre-scan with list-term awareness (M18)
- `src/cborld-binding.mjs`: M15 bound envelope, manifest, archive resolution
- `src/attestation.mjs`: M24 measured semantics with swtpm and tpm2-tools (PCR extend, quote, appraisal)
- `src/poison.mjs`, `src/naive-worker.mjs`: attack families and the time-capped naive verifier
- `src/loader.mjs`: static allowlisted loader that records requests
- `we1`–`we5` scripts, `results/` (raw outputs, fact-check), `crosscheck/`
