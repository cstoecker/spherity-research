# Fact-check of the harness findings (10 November 2026)

Scripts: `crosscheck/` (pinned: jsonld 9.0.0, rdf-canonize 5.0.0, jsonld-document-loader 2.3.0, jsonld-signatures 11.6.0, @digitalbazaar/data-integrity 2.5.0, @digitalbazaar/ecdsa-jcs-2019-cryptosuite 1.0.0, @digitalbazaar/ecdsa-multikey 1.8.0). PyLD from PyPI (no version pin recorded; current release on 10 Nov 2026). Single 4-vCPU cloud container.

## 1. JCS / enveloping meaning gap — CONFIRMED, independent implementation

Digital Bazaar's official `ecdsa-jcs-2019` cryptosuite with `jsonld-signatures` and `jsonld` 9.0.0: the credential verifies with the honest context **and** with the substituted context. The RDF view changes from `battery#PublicData` to `battery#RestrictedData`. The verifier did not apply Data Integrity §4.6 context validation by default. The gap was argued in arXiv:2611.04461 §VI-A; this is a demonstration of it.

## 2. Pre-authentication canonicalisation cost — CONFIRMED, with version qualification

Canonicalisation only, from N-Quads (`toRDF` costs 2–60 ms and is not the driver):

| Input | rdf-canonize 3.4.0 (used by jsonld 8.x) | rdf-canonize 5.0.0 default | 5.0.0, maxWorkFactor=3 | PyLD |
|---|---|---|---|---|
| complete K₇ | 196 ms | abort, 4 ms | abort, 25 ms | 527 ms |
| complete K₈ | 1,342 ms | abort, 8 ms | abort, 46 ms | 5,194 ms |
| binary tree 127 | 371 ms | abort, 10 ms | 379 ms | 1,498 ms |
| binary tree 255 | 2,746 ms | abort, 15 ms | 2,705 ms | 18,412 ms |
| binary tree 511 | > 25 s | abort, 23 ms | > 25 s | > 25 s |
| labelled tree 1,500 (benign) | 61 ms | 71 ms, ok | 60 ms, ok | 721 ms |

- rdf-canonize introduced a default work bound (`maxWorkFactor = 1`) in **4.0.0 (16 Nov 2023)**. jsonld.js 8.x (up to 8.3.3, Dec 2024) depends on rdf-canonize ^3.4.0 and therefore has **no default bound**. jsonld.js **9.0.0 (21 Nov 2025)** uses rdf-canonize 5.0.0 and **is protected by default**.
- PyLD has no bound; it is the slowest stack tested.
- The symmetric binary tree is acyclic. Its cost grows roughly cubically (×6.7–7.4 per doubling), not exponentially. arXiv:2611.04461 reports that an acyclic forest of 1,500 blank nodes stays cheap; our result does not contradict it, because their forest is not symmetric. It refines their conclusion: symmetry, not cycles, drives cost.
- Our earlier wording "DoS family" stands for unbounded or relaxed stacks only.

## 3. Process-wide resolved-context cache — CONFIRMED, but KNOWN

With jsonld 9.0.0 and `jsonld-document-loader` 2.3.0, two loaders hold different `static` copies of one URL. The second loader is never asked, and the first copy wins in both orders.

This is known to the maintainers:
- issue #502 (2022, a functional failure);
- issue #537 (open, `@import` and the cache);
- **PR #552 "Use a per-`documentLoader` resolved context cache"**, opened and approved on 31 May 2024 and still unmerged on 10 Nov 2026.

The discussion treats it as a test-suite edge case and does not mention security. Our contribution is the security framing: cross-tenant contamination, ignored allowlist updates, and the case for keying caches by (URL, digest). It is not a new discovery.

## 4. Undefined signed terms (dual view) — CONFIRMED, partly KNOWN

With the official stack, a JCS-signed credential containing an undefined term verifies. JSON consumers see four subject entries; JSON-LD expansion yields three.

Data Integrity 1.0 §2.4.3 ("Securing Data Losslessly") already documents silent dropping of undefined terms and requires errors for JSON-LD transformations during securing. JCS performs no such transformation, so the loss moves to the RDF consumer after verification. Classification: application of a known issue to the JCS path, not a new finding.

## Effect on claims

| Claim | Before | After fact-check |
|---|---|---|
| C27 LFSC | novel combination, E4 | unchanged; gap now demonstrated with an independent implementation |
| C29 blank-node-free profile | novel combination | unchanged; still needed: jsonld 8.x, PyLD and relaxed work factors remain exposed, and the default bound is a heuristic |
| C32 dual view | finding + control | **application of a known issue (DI §2.4.3)** + control |
| C33 cache | finding + control | **known behaviour (jsonld.js #502, #537, PR #552)**; contribution is the security framing + digest-keyed cache |
| C34 symmetric acyclic trees | finding (extends [F1]) | finding, **limited to stacks without a work bound (rdf-canonize < 4, PyLD) or with relaxed bounds**; cubic growth |
