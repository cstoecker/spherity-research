# Semantic supply chain harness (v0.4.0, 13 November 2026)

> **Status: research release accompanying a paper in preparation.** It is published as a dated, public record of the findings and mechanisms it contains. Spherity publishes its research and does not file patents. `ecdsa-lfsc-2026`, the M15 envelope, the admission certificate, replay-validated receipts and the evidence-graph certificate are experimental formats, not standards. Cite via `CITATION.cff`.

Worked examples and the formal model's checker for the paper *Securing the Semantic Supply Chain: Meaning as a Foundation of Trust Infrastructure* (Spherity Research, claims note v0.9.4, in preparation). Apache-2.0.

| WE | Question | Supports |
|---|---|---|
| **WE-1** | Does a valid signature prove what a credential means? | F1–F3; M17 |
| **WE-2** | Does a CBOR-LD label still mean what was printed after the vocabulary changes? | M15 |
| **WE-3** | Can a relying party tell, remotely, which meaning an edge device applied? (software-TPM simulation) | M24, M25 |
| **WE-3 R** | What does a threshold receipt key with a replaying co-signer establish? | M24 alternative (T11′) |
| **WE-4** | What can an attacker with no key make a verifier spend? | F4; M17, M18 |
| **WE-5** | Is a verification decision the same tomorrow, on a busier machine? | M19 |
| **WE-6** | Do RDF lists with repeated values canonicalise? (two library stacks) | F5; M18 |
| **WE-7** | Can a compliance decision rest on evidence the holder selected? | M31 (T19) |

## What changed from v0.3.0

v0.4.0 implements the corrections that three independent reviews of the formal model forced (paper §2.5, Appendix D.0). Measurements of v0.3.0 concern the earlier designs and are not evidence for these corrections (paper §5).

| # | Change | Finding it closes |
|---|---|---|
| H1 | **Admission grammar and signed admission certificate** replace the lexical pre-scan as the M18 defence (`src/admission.mjs`) | X1, X9: the v0.3 scan misses blank-node sources |
| H2 | **Processing-aware dependency closure**: every document the processor dereferences at issuance is declared and digest-pinned; undeclared dependencies fail | X2, X12: contexts nested in scoped definitions or in document data |
| H3 | **Full decoding manifest** for CBOR-LD labels; envelope signature (profile B) or RDFC inner proof (profile I-RDFC); 256-bit digest | X4, X7, X8 |
| H4 | **WE-3 v0.4**: decision engine as a separate process with an exclusive, policy-gated TPM key, certified by the attestation key; simulation of isolation, not a demonstration | X6; MC-3 V4 |
| H5 | **WE-6**: the F5 list matrix on the current and the pinned v0.3 stack | F5 |
| H6, H17 | The model checker (`model/mc.mjs`, 65 cases) runs in `npm test` | — |
| H7 | **Raw-text I-JSON check** at stage 0 (duplicate names, integer range, surrogates, noncharacters) | T16; VER-14 |
| H9 | **Issuer-key binding** at ingestion and in graph-native re-verification | X10; VER-15 |
| H10 | **Proof value checked for format and length before decoding** | X11 |
| H11 | **Cache contract**: dependency bytes checked before any cache lookup; key includes verifier configuration, issuer authorisation and epoch; a hit returns the immutable authenticated view; bounded negative cache | X13 |
| H12 | No acceptance before stage 2 ("light" mode removed) | R2-16 |
| H13 | **Typed digests** with domain separation (`src/crypto.mjs`) | R2-05 |
| H14 | **WE-3 R**: replay-validated receipts, two-signature stand-in | T11′; MC-3 V6/V6x/V6c; MC-6 |
| H15 | **WE-7**: compliance evidence, regimes A and B, twelve negative tests | T19; DEC-8 to DEC-15 |

**Stack.** `jsonld` 9.0.0 and `rdf-canonize` 5.0.0 (v0.3.0 pinned `jsonld` 8.3.3 / `rdf-canonize` 3.4.0, kept as `jsonld-v8` for WE-6). Note for anyone migrating: **jsonld 9 expects canonicalisation options under `canonizeOptions`; bound and digest options given at the top level, as v0.3.0 did, are silently ignored.** v0.3.0's code on jsonld 9 therefore loses its explicit bound and its SHA-384 setting without an error (the W3C P-384 `ecdsa-rdfc-2019` vector then fails). `src/suites.mjs` passes them correctly.

## Run

```bash
npm install
npm test        # all suites, including the W3C vectors and the model checker; TPM tests skip without swtpm
npm run we1
npm run we2
npm run we3     # needs swtpm and tpm2-tools (for example apt-get install swtpm swtpm-tools tpm2-tools)
npm run we3r
npm run we4     # a few minutes
npm run we5
npm run we6
npm run we7
npm run model   # the SSC-FM model checker, all 65 cases with counterexamples
```

## LFSC-G 0.4: what the experimental `ecdsa-lfsc-2026` does

The proof signs **only the proof configuration** (profile `lfsc-g/0.4`). That configuration carries:
- a **lexical digest**: typed digest of the JCS form of the credential;
- a **semantic commitment**: typed digest of the RDFC-1.0 canonical N-Quads; the processor, its version and options; and the **processing-aware dependency closure**, every document the JSON-LD processor dereferenced at issuance with the SHA-384 digest of its bytes, plus a typed context-manifest digest over that list.

Verification at ingestion:
1. **Stage 0**, no JSON-LD: the raw-text I-JSON check (when given bytes), then admission against a signed certificate (`src/admission.mjs`). The v0.3 lexical pre-scan remains available for comparison only.
2. **Stage 1**, no JSON-LD: proof value format and length, **the key must belong to the issuer the credential names and be authorised for it**, lexical digest, signature.
3. **Stage 2**: the dependency bytes the verifier holds now are checked against the declaration; canonicalisation runs with a loader that serves **only** declared dependencies; the result is compared with the commitment. A success returns the **immutable authenticated view** (document and N-Quads). Validity periods are checked on that view at every use.

Graph-native re-verification (`verifyFromQuads`) needs the stored quads, the stored configuration and the authenticated issuer; it re-verifies the **whole committed dataset**. Single facts would need a separate membership scheme.

What it binds: layer L2 (the RDF dataset) against an honest issuer, or the issuer's signed commitment against a malicious one (theorem T2). Not L3: what the IRIs mean is bound by closure manifests and receipts (M3, M22).

## Admission (M18 v0.4)

`analyse(topLevel, bytes)` checks every term definition in the complete closure, scoped contexts and the contexts they reference included, against the grammar `ssc-admission/v1`:
- **Closure refused** if any term, prefix or `@vocab` maps to a blank node, if `id` and `type` are not the aliases of `@id` and `@type`, or if a context uses `@base`, `@import`, `@propagate`, `@direction` or `@language`.
- **A term is admitted** only if every definition of it, in every admitted scope, is a plain IRI or `{@id, @type ∈ {@id, @vocab, datatype IRI}, @container ∈ {absent, @set}}`. `@list`, `@graph`, `@index`, `@json`, `@reverse` and `@nest` terms are excluded. A scoped context that redefines `id` or `type` excludes its carrier.

`certify` signs the analysis as an admission certificate. `createAdmission(certificate)` checks it once, including that the verifier's own context bytes match the certified closure, and returns a linear document check:
- the top-level `@context` is exactly as certified;
- every node object has an absolute, non-blank `id`;
- every key is an admitted term;
- there are no other keywords, value objects or nested arrays.

Tests cover:
- the blank-node sources the formal reviews found;
- a soundness cross-check: every document the grammar accepts expands without blank nodes, over fixed cases and 400 random documents.

The certifier is trusted until a separately specified checker exists (theorem T9.2).

## WE-1: a valid signature does not prove the meaning

Reference case: a market-role credential grants a *Distribution System Operator* access to *public* Battery Passport data. A second copy of its context under the same URL maps the terms to *Transmission System Operator* and *restricted* data. Results on `jsonld` 9.0.0: see `results/we1.txt`.

| # | Scenario | Result |
|---|---|---|
| A | `ecdsa-jcs-2019`, context as issued | valid; DSO, public |
| **B** | `ecdsa-jcs-2019`, context substituted | **valid; TSO, restricted** |
| C | `ecdsa-rdfc-2019`, context substituted | invalid (detected) |
| **D** | `application/vc+jwt` envelope, context substituted | **valid; TSO, restricted** |
| E | JCS + `relatedResource` digest checked by the verifier | detected |
| F1/F2 | LFSC-G 0.4, honest / substituted | accepted / rejected at stage 2 (dependency digest mismatch) |
| G | JCS-signed claim defined in no context | valid; the claim is dropped from the RDF view |
| H | Two loaders with different `static` copies of one URL in one process | the second loader is never asked (reproduces on `jsonld` 9.0.0) |
| I | Context URL `http://169.254.169.254/...` | naive processing requests it; LFSC-G stage 0 rejects it first |

## WE-2: CBOR-LD labels and the full decoding manifest

The credential is encoded as CBOR-LD (registry entry 100). A verifier later holds a routinely updated context, a substituted registry entry, a substituted transitive context, or a different decoder.

The v0.4 envelope `["ssc-m15/v2", profile, registryEntryId, manifestDigest, cborldBytes, verificationMethod, signature]` binds a **full decoding manifest** with a 256-bit typed digest. The manifest lists:
- the registry entry and type tables;
- the decoder name and version, and its keyword and URL-codec tables, read from the installed build;
- every context the encoder's loader requested, transitive and imported ones included, each with the digest of its bytes;
- the decoding options.

Two profiles are accepted:
- **B:** the issuer signs the envelope, which is checked before decoding.
- **I-RDFC:** an `ecdsa-rdfc-2019` proof is signed before encoding and checked after decoding with pinned contexts.

Profiles **A** (a signature over the CBOR-LD bytes only) and **I-JCS** are rejected by policy. The script shows the attacks they would allow.

The verifier works in this order:
1. it compares the manifest digest before decoding;
2. it decodes with a loader that serves only manifest-listed, digest-matching bytes;
3. it checks that the authenticating key is the issuer's;
4. it hands on the RDF graph under the pinned contexts as the output to consume.

| # | Scenario | Result |
|---|---|---|
| S1 | Baseline, no binding | proof valid |
| **S2** | Signed label (proof before encoding, as in VC Barcodes) after a routine context update | **unreadable**: "Improperly formatted bytes", which does not name the cause |
| **S3** | Signature over the CBOR-LD bytes, after the same update | **signature valid; scope becomes restricted** |
| S4 | Registry entry substituted, no binding | decode error |
| S5 / S6 | v0.4 I-RDFC label, context updated; without / with the lifetime archive | rejected before decoding / accepted from the archive, public |
| S7 | Registry entry substituted; the issuer's manifest is published | rejected before decoding; names both swapped context codes |
| S8 / S9 | Profile B / I-RDFC, honest | accepted, public |
| **S10** | **X4:** profile A with a rewritten envelope | rejected by policy; if accepted, signature valid and **restricted** |
| S11 | X4 against profile B | rejected: envelope signature invalid |
| **S12** | **X8:** profile I-JCS with a rewritten envelope | rejected by policy; if accepted, JCS proof valid and **restricted** |
| S13 | X8 against profile I-RDFC | rejected: inner proof invalid |
| **S14** | **X7:** substituted transitive context, v0.3 manifest scope, unpinned decoding | signature valid; **restricted** |
| S15–S17 | X7 against v0.4: no archive / issuer's manifest published / archive | rejected / rejected naming the context / accepted from the archive |
| S18 | Signed manifest with top-level contexts only | rejected during decoding: the transitive context is not in the manifest |
| S19 | Different decoder version (simulated), archive present | rejected before decoding; the archive restores data, not decoder code |
| S20 | Extra URL codec under the same version (simulated) | rejected; names `urlCodecs` |

**Sizes:**

| Label | Bytes |
|---|---|
| CBOR-LD with its inner RDFC proof | 314 |
| v0.3 envelope | 337 (+23) |
| **v0.4 I-RDFC envelope** | **374 (+60)** |
| CBOR-LD without a proof, the B payload | 129 |
| **v0.4 B envelope** | **356 (+227)** |

The I-RDFC overhead breaks down as 17 bytes for the 256-bit digest over v0.3, and 20 bytes for the text tag, profile name and empty fields; integer codes would save about 16. For B the parts are:
- the digest, 34 bytes;
- the signature, 66 bytes;
- the did:key verification method, 109 bytes, where a compact key reference would save about 70;
- framing, 18 bytes.

These supersede the v0.3 figures.

Why the binding sits outside the payload: semantic compression assigns term codes from the contexts, so a changed context reassigns them. A commitment inside the compressed payload would be decoded with the same wrong codes.

## WE-3: attested decisions, simulated on a software TPM

> **Idealised boundary.** The test exercises receipt construction, policy-gated signing and appraisal under an idealised boundary, in which the test adversary has no access to authorisation secrets, protected memory or bypass paths. Ordinary host root is not excluded by such process boundaries, so isolation is not demonstrated; that requires a TEE or a confidential VM.

The corrected design (theorem T11; MC-3 V5) runs the decision engine (`src/engine-process.mjs`) as a separate OS process.

**Measured launch.** A launcher computes the digest of the engine code: the entry file plus `src/crypto.mjs`, its only local import. Package imports and dynamic loading are refused. The launcher extends a typed launch event into the **non-resettable PCR 15** and then starts exactly the measured bytes.

**The engine's key.** The engine creates its receipt key in the TPM under the policy `PolicyPCR(PCR 15 = approved engine) ∧ PolicyAuthValue`. The authorisation value is generated by the engine and held only by it. For comparison, a second key has the v0.9.1 policy, which requires the PCR value only.

The **attestation key certifies** the engine key (`tpm2_certify`). The relying party checks:
- the key's name and attributes;
- its policy digest against the value expected for the approved engine;
- that `userwithauth` is clear, because if it is set the secret alone signs without the PCR condition.

**Receipts.** Each receipt binds:
- the relying party's challenge, the audience and the decision identifier;
- the outcome;
- the typed semantic-closure and decision-context digests.

Bundle loads are still extended into the resettable PCR 23, for **monitoring only** (M23).

| # | Scenario | Result |
|---|---|---|
| A1 | Honest engine, approved closure, exclusive key | accepted, public |
| A2 | Honest engine runs the substituted closure and names it | rejected: closure not approved |
| A3 | Honest engine, PCR-only key (v0.9.1 appraisal) | accepted, public |
| **B** | **Host signs a forged receipt with the PCR-only key** while PCR 15 shows the approved engine | **accepted, restricted**: the V4 defect, reproduced |
| C1–C4 | Host tries the exclusive key: no secret, a guessed secret, without `PolicyAuthValue`, with a plain password | refused by the TPM (`TPM_RC_BAD_AUTH`, `TPM_RC_POLICY_FAIL`, `TPM_RC_AUTH_UNAVAILABLE`) |
| C5 | Host changes the outcome of a signed receipt | rejected: signature |
| D1 / D2 | Reset PCR 15 / reset PCR 23 and re-extend only the approved event | refused (`TPM_RC_LOCALITY`) / succeeds, which is why v0.3 failed (X6); here PCR 23 is monitoring only |
| E1 / E2 | Modified engine, even holding the secret / certifying a new key | `TPM_RC_POLICY_FAIL` / key rejected: policy mismatch |
| **E3** | **Host creates its own key with the approved policy** | **the certificate check passes**: a key certificate shows the policy, not who holds the secret (see below) |
| F1–F3 | Reboot before re-measurement / after measured relaunch / receipt from before the reboot | `TPM_RC_POLICY_FAIL` / accepted with the same pinned key / still verifies |
| G1 / G2 | Replayed challenge / a challenge the relying party never issued | rejected |
| H | Publisher withdrew the closure; the engine still runs it | rejected |

**Limits:**
- **Enrolment (E3).** The relying party must pin the engine's key at enrolment, through evidence the host cannot produce, such as a TEE attestation that the key was generated inside the engine. Here that pinning is part of the idealised boundary. This premise is now explicit in T11.
- **What is not measured or simulated:**
  - the Node runtime and tpm2-tools are not measured;
  - authorised engine upgrades with rollback protection (`PolicyAuthorize`, MON-5) are not simulated, and an engine restart requires a reboot because PCR 15 only accumulates;
  - a reboot is a TPM reset over swtpm's control channel.
- **`tpm2_certify` 5.6** sends fixed qualifying data, so certification is not bound to a fresh challenge. It certifies an unchanging key name.
- **No hardware trust.** A software TPM has no endorsement-key chain to a manufacturer.

The keys use `noda`, because swtpm locks out after three failed authorisations; with a 256-bit secret, lockout adds no protection. Secrets travel on stdin, encrypted at creation and HMAC-protected in use.

## WE-3 R: replay-validated receipts (M24 alternative)

A receipt key shared between the device engine and an independent co-signer. The co-signer:
- authenticates the input, verifying the LFSC credential itself;
- checks admissibility against independently anchored state:
  - the closure the relying party's signed request authorises;
  - the current authority epoch for status;
  - a declared clock tolerance;
- replays the decision deterministically;
- approves only the exact canonical receipt bytes.

**Two-signature stand-in:** the device and the co-signer each sign identical bytes (ECDSA P-256), and the relying party requires both. This is a 2-of-2 instance of T11′. It does **not** implement or test FROST (RFC 9591) group keys, key generation, nonce rounds or robustness. A FROST variant is planned as a separate release.

**What an accepted receipt establishes:** its *outcome* equals deterministic replay of its committed, admissible context. It does **not** establish which closure the device executed (scenario R10), the truth of device-only observations, or that a signature is ever produced.

| # | Scenario | Result |
|---|---|---|
| R1–R2 | Honest device, TSO / DSO credential, strict closure | accepted GRANT / accepted DENY |
| R3 | Device proposes GRANT where replay gives DENY | refused by the co-signer |
| R4 | Credential edited to TSO | refused: input not authenticated |
| R5 | Status object signed by a forger | refused |
| R6 | Older authentic status (epoch 0) after withdrawal in epoch 1 | refused: not the current epoch |
| R7–R8 | Same, co-signer with a declared 2-tick window | receipt says `window:2`; a relying party requiring current status rejects it, one that accepts the window accepts |
| R9 | Device names another approved closure than the request authorises | refused |
| R10 | Device ran the lenient closure, claims strict; the outcomes agree | **accepted**: replay validates outcomes, not execution (MC-3 V6x) |
| R11 | Compromised co-signer signs a lie | **accepted**: documents the premise f < t (MC-3 V6c) |
| R12 | Co-signer cannot reconstruct the claimed closure's rule | refused: no share for *unknown* |
| R13 | Claimed time outside the clock tolerance | refused |
| R14 | Outcome changed in the message after signing | rejected: signature |
| R15 | Approval for message A, bytes of message B | refused: approval is keyed to the exact bytes |
| R16–R17 | Challenge replayed; receipt for another action | rejected |
| R18–R21 | Offline co-signer and the effect gate (DEC-7) | provisional effect refused; no receipt while offline (unavailable, not a success); effect once online; refused after the authority epoch advanced |

## WE-4: cost before authentication

Attacker documents carry forged proofs. Single environment (4 vCPU cloud container, Node 22), p50; `jsonld` 9.0.0 / `rdf-canonize` 5.0.0. Full table: `results/we4.json`.

| Input | Naive verifier, no limit | Naive, default bound (`maxWorkFactor` 1) | LFSC-G 0.4 rejection |
|---|---|---|---|
| complete graph K₈ (1.7 kB) | 1.8 s | aborts, ~5 ms | 0.04–0.21 ms |
| symmetric binary tree, 255 nodes (11 kB) | 3.6 s | aborts, ~15 ms | 0.04–0.46 ms |
| symmetric binary tree, 511 nodes (22 kB) | > 20 s | aborts, ~32 ms | 0.05–1.2 ms |
| labelled tree, 1,500 nodes (benign, 79 kB) | ~87 ms | completes (~82 ms) | rejected by size bound (2.4 ms) or the blank-node rule (0.06 ms) |

The three LFSC figures are: the document as sent (stage 0, context not allowlisted), the same graph with allowlisted contexts (stage 0, blank nodes), and the same graph without blank nodes and with a forged LFSC 0.4 proof (stage 1, the key is not authorised for the named issuer).

Legitimate market-role credential, p50 over 200 runs:

| Verification | v0.4.0 | v0.3.0 |
|---|---|---|
| `ecdsa-rdfc-2019` | 2.16 ms | 1.94 ms |
| `ecdsa-jcs-2019` | 0.21 ms | 0.20 ms |
| **LFSC-G, first verification** | **1.50 ms** | 1.09 ms |
| **LFSC-G, graph-native from stored quads** | **0.28 ms** | 0.18 ms |
| LFSC-G, cached | 0.44 ms | 0.25 ms |

The corrections cost time on the honest path. The dependency digests are now checked on every verification, **before** any cache lookup, which is what closes X13. The issuer binding and the pinned loader add a little more. All figures are single-environment.

## WE-5: wall-clock limits are not replayable

A **legitimate** credential (600 blank nodes with unique literals) is canonicalised 21 times on an idle host, then 21 times under CPU contention (8 busy threads on 4 CPUs). Time limit: 1.5 × the idle median. Operation bound: `maxDeepIterations` 1.

| Host | p50 | Time-limit policy | Operation-bound policy |
|---|---|---|---|
| idle | 16.7 ms | 21/21 accepted | 21/21 accepted |
| loaded | 31 ms | **7/21 accepted** | 21/21 accepted |

(v0.3.0 on `rdf-canonize` 3.4.0: 0/21 under load. The share flips with the load; any wall-clock threshold has a load at which the verdict changes.)

M19: decide *invalid* only on deterministic operation bounds; let a time limit yield *unknown*, never *invalid*.

## WE-6: RDF lists with repeated values (F5)

Generated graph: a named subject, one `@list` property, literal items, the default graph. These are measured outcomes, not a general criterion. Full output: `results/we6.txt`.

| List | 5.0.0 default | `maxWorkFactor` 2 | v0.3 stack (3.4.0, `maxDeepIterations` 1) |
|---|---|---|---|
| `[1,2,2,3]`, `[0,0,0,1]`, `[0,1,1,0]`, `[1,2,3,3,4,5]`, `[0,0,0,0]` | fails, budget 2 | completes | completes |
| `[1,2,1,2,1,2]` | fails, budget 4 | completes | completes |
| `[0,0,0,0,0]` | fails, budget 3 | completes | fails |
| `[1,2,3,1]`, `[1,2,3,2,4]`, `[0,1,0,1,0]`, `[1,2,1,2]`, `[0,0,0]` | completes | completes | completes |

**Why some lists fail and others complete.** In `rdf-canonize` 5.0.0 the default budget is the number of blank nodes that share a first-degree hash, and every entry into N-degree hashing consumes one unit. In a list cell's incident quads, the cell itself is `_:a` and every other blank node is `_:z`. Interior cells with equal values therefore share a hash. Whether the run completes depends on whether their neighbours are already distinguished.

Further results:
- **v0.3 stack:** four equal values complete, five fail.
- **Unbounded runs:** 200 equal values take about 1.0 s.
- **Admission:** under the v0.4 grammar `@list` terms are excluded, so F5 cannot arise in admitted input.

## WE-7: compliance evidence (M31)

**SYNTHETIC worked example:** a low-value consignment of portable Li-ion battery packs presented to a customs risk engine.
- Parties, identifiers, test methods and substance limits are illustrative.
- The key-claim set (nine claims) is inspired by, but is not, the legal H7 data set.
- Coverage comes from two sources, both authenticated independently of the holder through a signed coverage profile:
  - one testing laboratory, providing complete-list responses and an absence attestation;
  - one status service.

**Regime A** is full disclosure of the sufficient key-claim set, evaluated once by the relying party.

**Regime B** is commit-and-certify:
- a salted, domain-separated commitment over the RDFC-1.0 canonical evidence graph;
- a signed certificate core binding outcome, scope, closure, policy, a coverage reference and a private-context binding through the commitment only;
- an external timestamp over the core;
- a custodian that verifies the deposit by opening and replaying it before acknowledging;
- scope-checked reliance;
- a lifecycle that suspends reliance on a policy-only change;
- a selection log for one authoritative certificate per scope and epoch;
- a dispute report that separates its findings.

| # | Scenario | Result |
|---|---|---|
| A1 | Batch B8, coverage contract | GRANT |
| A2 / A3 | **N1:** the holder omits the failed retest of batch B7. With coverage / without | **DENY** (the retest is obtained from the laboratory) / **GRANT** (wrong) |
| A4 | **N2:** stale complete-list response | UNKNOWN |
| A5 | **N3:** report re-signed by an unaccredited key | UNKNOWN (source validation) |
| A6 | **N4:** method outside the accreditation | UNKNOWN |
| A7 | **N5:** declared report revoked | DENY |
| A8 | Extra claim outside the closed profile | UNKNOWN |
| B1–B2 | Certificate for B8; dispute | accepted, authorises; opening valid, outcome equal |
| B3 / B4 | **N1** in regime B: certifier without / with coverage | GRANT certified and **replay matches** (replay cannot reveal what was never in the graph) / DENY certified |
| B5 | **N6:** certificate for B8 presented for B7 | rejected (scope) |
| B6–B7 | **N7:** policy-only correction v1 → v2 | reliance suspended; re-evaluation gives DENY |
| B8 | **N10:** a second certificate for the same scope and epoch | rejected (selection log) |
| B9–B10 | Certificate revoked; core altered | rejected |
| B11 | **N9:** archived evidence altered | opening invalid; attribution not determined |
| B12 | **N8:** custodian loses the archive key | opening unavailable; attribution not determined |
| B13 | **N11:** dictionary over candidate graphs (R3-12) | a plain digest identifies the graph; the salted binding matches none |
| S1 | **N12:** two authentic views under a policy with an exception | the views disagree (GRANT / DENY) |
| S2 | **N12:** two worlds differing only in a report the verifier cannot see | same transcript, same output, wrong in one world |

**Reading.** Coverage, not the disclosure format, decides whether omitted adverse evidence is caught (A2 vs A3, B3 vs B4). A matching replay shows a consistent computation, not complete evidence (B3).

**What WE-7 does not show:** that real data sets suffice for real decisions, a real laboratory or registry, legal admissibility, or performance at scale.

## The model checker

`model/mc.mjs` (SSC-FM v5.2): explicit-state exploration of small instances with shortest counterexamples, case analyses for M15 and for the premises of replay co-signing, and tightness mutants.
- `--check` fails unless every expected case is present exactly once with its verdict.
- Every HOLDS case must be non-vacuous. The one exception is a declared case that holds with no acceptance by design: deferring effects while the co-signer is offline is safe but unavailable.
- 65 cases (MC-1 to MC-6). "Holds" covers the instance checked, not every size; the general statements are the paper's theorems.

## Limitations

- One machine and one JavaScript stack for the main runs; WE-6 adds the pinned v0.3 stack.
- WE-3 is a simulation on a software TPM: isolation is assumed, not demonstrated (see WE-3).
- WE-3 R uses two independent signatures, not a threshold scheme.
- WE-7 is synthetic.
- The admission certifier is trusted.
- WE-5 emulates a slower machine through contention on one host.

## Files

- `src/suites.mjs`: `ecdsa-jcs-2019`, `ecdsa-rdfc-2019`, ES256 `vc+jwt`, canonicalisation bounds.
- `src/lfsc.mjs`: LFSC-G 0.4 issuer, verifier and graph-native re-verification (M17).
- `src/ijson.mjs`: the raw-text I-JSON check (VER-14).
- `src/admission.mjs`: admission grammar, analyser, certificate and document check (M18).
- `src/prescan.mjs`: the v0.3 lexical pre-scan, kept for comparison.
- `src/loader.mjs`: the static loader that records requests, and the pinned loader for declared dependencies.
- `src/cborld-binding.mjs`: M15 decoding manifest, envelope profiles, archive.
- `src/attestation.mjs`, `src/engine-process.mjs`: M24 simulation with swtpm and tpm2-tools.
- `src/replay-receipts.mjs`, `src/replay-scenarios.mjs`: replay-validated receipts (T11′).
- `src/compliance.mjs`, `src/compliance-scenarios.mjs`: compliance evidence (M31).
- `src/f5.mjs`: the F5 matrix on two stacks.
- `src/crypto.mjs`: base58btc, Multikey, SRI, typed digests.
- `src/signed.mjs`: signed statements.
- `src/poison.mjs`, `src/naive-worker.mjs`: attack families and the time-capped naive verifier.
- `model/mc.mjs`: the model checker.
- `we1`–`we7` scripts.
- `results/`: raw outputs.
- `crosscheck/`: the v0.3 cross-checks.
