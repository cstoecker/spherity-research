---
publication_template_version: 2
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "Securing the Semantic Supply Chain"
citation_title: "Securing the Semantic Supply Chain: Meaning as a Foundation of Trust Infrastructure"
seo_title: "Securing the Semantic Supply Chain: Verifiable Credentials and JSON-LD"
og_title: "Securing the Semantic Supply Chain: Meaning as Trust Infrastructure"
og_description: "Why a valid signature does not prove what a verifiable credential means, and how release engineering for JSON-LD contexts, vocabularies and rulebooks secures it."
subtitle: "Meaning as a Foundation of Trust Infrastructure"
description: "How the meaning of verifiable credentials and JSON-LD reaches verifiers, where it fails, and 30 mechanisms and 91 requirements to secure it. Brief, article, supplements."
abstract: "Verifiable credentials are becoming legal and economic infrastructure. With a trusted binding between the signing key and the issuer, a signature authenticates the signed content; it does not by itself fix what that content means to the party that reads it. Meaning reaches a verifier through a supply chain of its own: JSON-LD contexts, vocabularies, ontologies, validation shapes, crosswalks, rulebooks, Type Metadata and codec tables. Each can be substituted, rolled back, frozen, shown differently to different verifiers, or withdrawn without verifiers noticing. W3C Data Integrity already requires approved contexts, or equivalent protections, at each verifier. We show what this leaves open and propose mechanisms to close it.\n\nIn laboratory tests with an open harness on production libraries, changing mutable, decision-relevant context bytes that the verifier did not authenticate independently changed a credential's meaning without invalidating signatures over its JSON text (JCS) or over an envelope. On one CBOR-LD library, a synthetic compact label became unreadable after a routine vocabulary update and, under a profile that signs the compressed bytes, decoded to a different meaning with a valid signature. Unauthenticated input imposed seconds of computation before the signature check when canonicalisation had no work limit; the tested canonicalisation library's default limit stops such input but rejects some legitimate credentials. A formal model of the semantic supply chain states the core results with proof sketches and model-checks the stateful mechanisms in 66 cases on small instances.\n\nFrom these results we derive 30 mechanisms, among them release engineering for meaning, lexical-first proofs that commit to the semantic graph, codec binding for long-lived carriers, receipts that record the meaning a decision applied, attested decision engines whose receipts the proposed profile requires to be attributable to an accountable legal person, and a profile for compliance evidence. We propose 91 requirements as a baseline for a high-assurance profile of W3C VCDM 2.0; no W3C group has adopted them. The problem is not specific to W3C VCDM: SD-JWT VC and ISO mdoc take their meaning from rulebooks and Type Metadata, and we give a first mapping, by design reasoning, of which mechanisms would transfer; none is specified or tested for those formats. The results bind meaning, not its truth; hardware isolation is simulated, not demonstrated, and enrolment for attribution is specified, not implemented."

paper_status: "Spherity Research · Executive Brief + Research Article + Supplements · Version 1.0"
paper_version: "1.0"
doi: "10.5281/zenodo.24293613"
authors:
  - "Dr. Carsten Stöcker"
author_entities:
  - name: "Dr. Carsten Stöcker"
    affiliation: "Spherity GmbH"
    url: "https://spherity.github.io/spherity-research/#dr-carsten-stoecker"
    orcid: "https://orcid.org/0009-0003-7417-8872"
    same_as:
      - "https://www.linkedin.com/in/dr-carsten-st%C3%B6cker-1145871/"
      - "https://orcid.org/0009-0003-7417-8872"
author_affiliations:
  - "Dr. Carsten Stöcker — Spherity GmbH"
affiliation: "Spherity GmbH"
date: "2026-11-16"
last_modified_at: "2026-11-16"
research_cutoff: "2026-11-15"
research_cutoff_label: "Standards, regulation and implementation evidence reviewed to this date"
lang: "en"

permalink: /securing-semantic-supply-chain.html
canonical_url: "https://spherity.github.io/spherity-research/securing-semantic-supply-chain.html"
latest_version: "https://spherity.github.io/spherity-research/securing-semantic-supply-chain.html"
pdf_url: "/Spherity-Research-Semantic-Supply-Chain-Article.pdf"
executive_brief_pdf_url: "/Spherity-Research-Semantic-Supply-Chain-Executive-Brief.pdf"
associated_media:
  - name: "Securing the Semantic Supply Chain — Executive Brief"
    url: "/Spherity-Research-Semantic-Supply-Chain-Executive-Brief.pdf"
    cover_image: "/assets/securing-semantic-supply-chain/v1.0/executive-brief-cover.jpg"
    cover_image_alt: "First page of the executive brief Securing the Semantic Supply Chain by Dr. Carsten Stöcker, version 1.0."
    license: "https://creativecommons.org/licenses/by/4.0/"
  - name: "Securing the Semantic Supply Chain — Research Article"
    url: "/Spherity-Research-Semantic-Supply-Chain-Article.pdf"
    cover_image: "/assets/securing-semantic-supply-chain/v1.0/article-cover.jpg"
    cover_image_alt: "First page of the research article Securing the Semantic Supply Chain: Meaning as a Foundation of Trust Infrastructure, version 1.0."
    license: "https://creativecommons.org/licenses/by/4.0/"
  - name: "Supplement S1 — Mechanism disclosures and claim register"
    url: "/Spherity-Research-Semantic-Supply-Chain-S1-Mechanisms.pdf"
    cover_image: "/assets/securing-semantic-supply-chain/v1.0/s1-mechanisms-cover.jpg"
    cover_image_alt: "First page of Supplement S1, mechanism disclosures and claim register."
    license: "https://creativecommons.org/licenses/by/4.0/"
  - name: "Supplement S2 — Requirements"
    url: "/Spherity-Research-Semantic-Supply-Chain-S2-Requirements.pdf"
    cover_image: "/assets/securing-semantic-supply-chain/v1.0/s2-requirements-cover.jpg"
    cover_image_alt: "First page of Supplement S2, the 91 proposed requirements, in landscape format."
    license: "https://creativecommons.org/licenses/by/4.0/"
  - name: "Supplement S3 — Formal model, proof sketches and model checking"
    url: "/Spherity-Research-Semantic-Supply-Chain-S3-Formal-Model.pdf"
    cover_image: "/assets/securing-semantic-supply-chain/v1.0/s3-formal-model-cover.jpg"
    cover_image_alt: "First page of Supplement S3, formal model, proof sketches and model checking."
    license: "https://creativecommons.org/licenses/by/4.0/"
  - name: "Supplement S4 — Prior-art ledger"
    url: "/Spherity-Research-Semantic-Supply-Chain-S4-Prior-Art.pdf"
    cover_image: "/assets/securing-semantic-supply-chain/v1.0/s4-prior-art-cover.jpg"
    cover_image_alt: "First page of Supplement S4, the prior-art ledger."
    license: "https://creativecommons.org/licenses/by/4.0/"
  - name: "Supplement S5 — Review and reproducibility record"
    url: "/Spherity-Research-Semantic-Supply-Chain-S5-Review-Record.pdf"
    cover_image: "/assets/securing-semantic-supply-chain/v1.0/s5-review-record-cover.jpg"
    cover_image_alt: "First page of Supplement S5, the review and reproducibility record."
    license: "https://creativecommons.org/licenses/by/4.0/"
cover_image: "/assets/securing-semantic-supply-chain/v1.0/executive-brief-cover.jpg"
cover_image_alt: "First page of the executive brief Securing the Semantic Supply Chain by Dr. Carsten Stöcker, version 1.0."

figure_objects:
  - id: "same-signature-two-meanings"
    name: "Same signature, two meanings"
    content_url: "/assets/securing-semantic-supply-chain/v1.0/figure-1-same-signature.svg"
    alt: "One signed credential read with two different context documents at the same URL: once as a distribution system operator with public data access, once as a transmission system operator with restricted access; the signature is valid in both readings."
    width: 1240
    height: 592
    description: "The central finding of the article: when a signature covers the credential's JSON text or an envelope, but not the context document behind its URL, a substituted context changes what the same signed bytes mean."
    caption: "Same signature, two meanings. One credential, signed once with JCS or an envelope signature, is read under the issuer's context as a distribution system operator with public data access, and under a substituted context at the same URL as a transmission system operator with restricted access (worked example WE-1). This requires context bytes that the verifier does not authenticate independently; RDFC proofs and checked pins detect it. Source: Dr. Carsten Stöcker, Spherity GmbH, article Figure 1."
    credit_text: "Dr. Carsten Stöcker, Spherity GmbH"
    copyright_notice: "© 2026 Dr. Carsten Stöcker"
    copyright_holder: {type: "Person", name: "Dr. Carsten Stöcker", url: "https://spherity.github.io/spherity-research/#dr-carsten-stoecker"}
    keywords:
      - "verifiable credentials"
      - "JSON-LD context substitution"
      - "semantic integrity"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"
license_scope: "This research page, the executive brief, the research article and supplements S1–S5"

image: "/assets/preview-securing-semantic-supply-chain.webp"
image_alt: "Securing the Semantic Supply Chain research preview with the executive brief cover."
image_mime: "image/webp"
image_width: 1200
image_height: 630

keywords:
  - "semantic supply chain"
  - "verifiable credentials"
  - "JSON-LD"
  - "semantic integrity"
  - "W3C verifiable credentials"
  - "W3C VCDM 2.0"
  - "Data Integrity"
  - "RDF canonicalisation"
  - "CBOR-LD"
  - "digital product passport"
  - "battery passport"
  - "EUDI wallet"
  - "European Business Wallet"
  - "know your business (KYB)"
  - "knowledge graph"
  - "data provenance"
  - "software supply chain security"
  - "formal model"
  - "defensive publication"
  - "Dr. Carsten Stöcker"

answer_summary: "A signature authenticates a credential's content only with a trusted binding between key and issuer; it does not fix what the content means. That meaning comes from JSON-LD contexts, vocabularies, rulebooks and code tables, a supply chain of its own that W3C Data Integrity protects only at one verifier at one moment. The article demonstrates in laboratory tests on production libraries where this fails, models it formally, and proposes 30 mechanisms and 91 requirements, none of them adopted by a standards body yet."
key_takeaways:
  - "With signatures over the JSON text (JCS) or over an envelope, a changed context document can change a credential's meaning while the signature stays valid; this was demonstrated on two implementations in one laboratory use case, not in a deployed system."
  - "Meaning needs the discipline that software already has: authorised publishers, signed and logged releases, freshness, rollback protection, withdrawal and decisions that record the meaning they applied."
  - "The problem is not specific to W3C credentials: SD-JWT VC and ISO mdoc take their meaning from Type Metadata and rulebooks, mapped here by design reasoning only."
  - "The results bind meaning, not its truth; hardware isolation is simulated, not demonstrated, and attribution of decisions to an accountable legal person is specified, not implemented."
about:
  - "Semantic supply chain security for verifiable credentials"
  - "W3C Verifiable Credentials Data Model 2.0 and JSON-LD"
  - "Semantic integrity of trust infrastructure"
mentions:
  - "W3C Data Integrity"
  - "RDF Dataset Canonicalization (RDFC-1.0)"
  - "CBOR-LD"
  - "SD-JWT VC"
  - "ISO mdoc"
  - "EU Digital Identity Wallet"
  - "European Business Wallet"
  - "Battery Regulation (EU) 2023/1542"
  - "Ecodesign for Sustainable Products Regulation (ESPR)"
  - "AI Act"
  - "WE BUILD"
citations:
  - "https://doi.org/10.5281/zenodo.24293613"
  - "https://doi.org/10.5281/zenodo.24281131"
  - "https://www.w3.org/TR/vc-data-model-2.0/"
  - "https://www.w3.org/TR/vc-data-integrity/"
  - "https://www.w3.org/TR/rdf-canon/"
  - "https://www.w3.org/TR/cbor-ld/"
  - "https://arxiv.org/abs/2611.04461"
  - "https://w3id.org/ebwv"
audiences:
  - "Standards bodies and specification editors"
  - "Issuers, verifiers and wallet providers"
  - "Regulators, supervisors and those who define compliance data"
  - "Security researchers and implementers"
spatial_coverage:
  - "European Union"
  - "Global"

series_label: "Research programme"
series_name: "Securing Meaning in Trust Infrastructure"
series_description: "A research programme on the semantic supply chain of verifiable credentials: how meaning is produced, released, verified and withdrawn, from W3C credentials to knowledge graphs and AI agents."
series_url: "/securing-meaning-in-trust-infrastructure.html"
series_position: 1
series_items:
  - position: 0
    label: "Programme overview"
    title: "Securing Meaning in Trust Infrastructure"
    url: "/securing-meaning-in-trust-infrastructure.html"
  - position: 1
    label: "Paper A"
    title: "Securing the Semantic Supply Chain"
    url: "/securing-semantic-supply-chain.html"

search_research:
  reviewed_on: "2026-11-16"
  source: "Google Trends"
  source_url: "https://trends.google.com/trends/explore"
  geographies:
    - "Worldwide"
    - "Germany"
    - "France"
    - "Netherlands"
  time_ranges:
    - "Past 12 months"
    - "Past 5 years"
  search_types:
    - "Web Search"
    - "News Search"
  authority_terms:
    - "semantic supply chain"
    - "verifiable credentials"
    - "JSON-LD"
    - "semantic integrity"
  discovery_terms:
    - "W3C verifiable credentials"
    - "battery passport"
    - "digital product passport"
    - "EUDI wallet"
    - "knowledge graph"
    - "data provenance"
    - "know your business (KYB)"
  audience_questions:
    - "What is a semantic supply chain, and how do verifiable credentials and JSON-LD relate to it?"
    - "How does semantic integrity relate to software supply chain security?"
    - "How does securing the semantic supply chain apply to digital product passports and battery passports?"
    - "What role do verifiable credentials play in EUDI wallets and business wallets?"
  evidence:
    - comparison: "verifiable credentials, JSON-LD, semantic supply chain, semantic integrity, software supply chain security"
      input_type: "Search terms"
      geography: "Worldwide"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "Means of the weekly indices (52 complete weeks): JSON-LD 47.67, verifiable credentials 30.56, software supply chain security 28.15, semantic supply chain 4.31, semantic integrity 2.54. Over five years the two semantic terms show zero in 201 and 212 of 261 weeks; in Germany they are near or below the reporting threshold."
    - comparison: "digital product passport, battery passport, European Business Wallet, EUDI wallet, verifiable credentials"
      input_type: "Search terms"
      geography: "Germany"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "Battery passport 24.15, EUDI wallet 19.15, digital product passport 16.44, verifiable credentials 2.21, European Business Wallet 0.33; EUDI wallet averaged 25.15 in the last 13 complete weeks against 9.62 in the first 13. Worldwide the order is battery passport, digital product passport, verifiable credentials, EUDI wallet, European Business Wallet; France and the Netherlands are sparse beyond the two passport terms."
    - comparison: "digitaler Produktpass, Batteriepass, EUDI Wallet, Business Wallet, verifiable credentials"
      input_type: "Search terms"
      geography: "Germany"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "Business Wallet 39.79, EUDI Wallet 30.69, digitaler Produktpass 6.94, verifiable credentials 3.50, Batteriepass 0.19 (zero in 50 of 52 weeks); EUDI Wallet has the stronger recent signal (40.23 against 20.23 in the last 13 weeks). Business Wallet is broad wording and not equivalent to European Business Wallet."
    - comparison: "GraphRAG, knowledge graph, AI agent identity, data provenance, verifiable credentials; and KYB, know your business, beneficial owner, KYC, verifiable credentials"
      input_type: "Search terms"
      geography: "Worldwide"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "Knowledge graph 48.71, GraphRAG 10.77, data provenance 7.58, AI agent identity 5.81, verifiable credentials 4.73; in News Search AI agent identity leads but the data is sparse and episodic. KYC dominates its comparison (58.15) ahead of KYB (6.19), beneficial owner (2.23) and know your business (1.83)."
    - comparison: "Related queries for verifiable credentials and for digital product passport (Top and Rising)"
      input_type: "Search terms"
      geography: "Worldwide"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "Relevant Top queries: w3c verifiable credentials, verifiable digital credentials, digital product passport eu, espr, dpp. No relevant Rising query for either seed; unrelated Breakout entries were excluded."
  editorial_decisions:
    - "Keep the paper's specialist vocabulary (semantic supply chain, verifiable credentials, JSON-LD, semantic integrity) as authority terms and in the title, although the two semantic terms are below or near the reporting threshold."
    - "Add JSON-LD and verifiable credentials to the search title, because they carry the strongest measured interest among the authority terms and describe the paper accurately."
    - "Use battery passport, digital product passport and EUDI wallet as discovery language only where the article discusses them (UC1, the DPP Registry, EUDI attestations), and keep European Business Wallet despite its low displayed interest because it is substantively relevant."
    - "Use know your business (KYB) and knowledge graph with their context; do not promote KYC or GraphRAG into titles because their measured interest does not establish demand for this subject."
    - "Add W3C verifiable credentials, verifiable digital credentials, DPP and digital product passport EU as on-site search synonyms, from the observed Top queries; claim no rising trend."

questions_answered:
  - question: "What is the semantic supply chain of a verifiable credential?"
    answer: "It is the chain through which a credential's meaning reaches the system that reads it: JSON-LD contexts, vocabularies, ontologies, validation shapes, crosswalks, rulebooks, Type Metadata and codec tables. Each is published by someone, changes over time and is copied, cached and replaced outside the signed bytes, so it can be substituted, rolled back, frozen, shown differently to different verifiers or withdrawn without them noticing."
  - question: "Does a valid signature prove what a credential means?"
    answer: "Not by itself. With a trusted binding between key and issuer, a signature authenticates the signed content. With JCS-based Data Integrity or JOSE/COSE envelopes it covers the JSON text or bytes, not the context documents behind their URLs. The article demonstrates on two implementations, in one laboratory use case, that a substituted context changes the meaning while the signature stays valid; deployments that authenticate their context pins are not shown to be affected."
  - question: "What do the W3C standards already require?"
    answer: "W3C Data Integrity 1.0 requires applications that consume documents secured with it to validate the JSON-LD contexts against approved values, or to apply equivalent protections. That protects one verifier at one moment. Who approves a meaning, how updates and withdrawals reach every verifier, and how a decision can later show which meaning it applied are left open."
  - question: "How does this apply to digital product passports and battery passports?"
    answer: "Battery passports are required from 18 February 2027 for LMT, industrial (above 2 kWh) and EV batteries, and parts of them are restricted to persons with a legitimate interest. If access is decided with role credentials, an access decision is only as good as the meaning of the role and the data scope at the moment of the decision, and a compact label read for 15 years or more must still decode as it was meant. Role credentials are the article's proposal, not an architecture the Regulation prescribes."
  - question: "What does the article propose, and what has been adopted?"
    answer: "It proposes 30 mechanisms, from release engineering for meaning to lexical-first proofs, codec binding, decision receipts and a compliance-evidence profile, and 91 requirements as a baseline for a high-assurance profile of W3C VCDM 2.0. A W3C Community Group for such a profile was proposed on 11 November 2026 and launched on 12 November 2026; neither it nor any other W3C group has adopted the requirements."
  - question: "What does this research not establish?"
    answer: "It binds meaning, not its truth. It does not show that the attack taxonomy is complete, does not demonstrate hardware isolation (it is simulated on a software TPM), does not implement attribution enrolment, and maps SD-JWT VC, ISO mdoc and EUDI rulebooks by design reasoning only. Timings come from one machine and one software stack, and the AI-model reviews recorded in S5 are not peer review."

related_publications:
  - title: "Proofs over Statements: Verifiable Evidence Graphs"
    url: "/proofs-over-statements-evidence-graphs.html"
    context: "The foundation of this article: it assumes pinned contexts and an authenticated context closure, which this article shows how to produce, release and withdraw."
  - title: "EU DPP Registry, W3C Standards and DPP5.0"
    url: "/eu-dpp-registry-w3c-dpp5.html"
    context: "Describes the W3C semantic stack of the EU DPP Registry whose published artefacts this article analyses as semantic artefacts."
  - title: "European Business Wallet and Market Role Credentials for DPP Access Control"
    url: "/energy-data-x-ebw-market-role-credentials-dpp-access-control.html"
    context: "The reference case behind use case UC1: market-role credentials deciding access to restricted battery-passport data."
  - title: "European Business Wallets as the Legal Control Plane for Zero Trust AI Agents"
    url: "/ebw-zero-trust-ai-agents.html"
    context: "Explains mandates and action receipts for AI agents, which this article extends with withdrawal of meaning and decision receipts."

toc_items:
  - title: "Downloads and citation"
    href: "#downloads"
  - title: "Abstract"
    href: "#abstract"
  - title: "Signed is not the same as meant"
    href: "#signed-is-not-meant"
  - title: "Five findings"
    href: "#five-findings"
  - title: "Mechanisms and requirements"
    href: "#mechanisms-and-requirements"
  - title: "Use cases"
    href: "#use-cases"
  - title: "Evidence and boundaries"
    href: "#evidence-boundaries"
  - title: "Software and reproducibility"
    href: "#software-and-reproducibility"
  - title: "Supplements and data"
    href: "#supplements"
  - title: "References"
    href: "#references"
  - title: "License and citation"
    href: "#license-and-citation"
  - title: "Questions answered"
    href: "#questions-answered"

tags:
  - verifiable-credentials
  - identity
  - european-business-wallet
  - digital-product-passport
  - trusted-ai
  - knowledge-graphs
---

<section class="paper-download-grid" id="downloads" aria-labelledby="downloads-title">
  <div class="paper-download">
    <h2 id="downloads-title">Read the executive brief</h2>
    <a href="{{ page.executive_brief_pdf_url | relative_url }}">Download the executive brief (PDF, 8 pages)</a>
    <p><strong>For decision makers.</strong> Why meaning is now a trust and liability problem, three short stories, five results and what each role should do.</p>
  </div>
  <div class="paper-download">
    <h2>Read the research article</h2>
    <a href="{{ page.pdf_url | relative_url }}">Download the research article (PDF, 45 pages)</a>
    <p><strong>Version 1.0, 16 November 2026.</strong> Archived on Zenodo with supplements S1–S5 and two CSV files.</p>
    <ol class="paper-download-links" role="list">
      <li><a href="https://doi.org/{{ page.doi }}">Zenodo record: doi:{{ page.doi }}</a></li>
      <li><a href="#supplements">Supplements S1–S5 on this page</a></li>
    </ol>
  </div>
</section>

<figure class="paper-figure centered-figure">
  <a href="{{ page.executive_brief_pdf_url | relative_url }}"><img src="{{ page.cover_image | relative_url }}" alt="{{ page.cover_image_alt }}" width="1241" height="1754" loading="lazy" decoding="async"></a>
  <figcaption><strong>Executive brief.</strong> The plain-language edition for decision makers. Published under CC BY 4.0.</figcaption>
</figure>

<section class="abstract-box" markdown="1">
<h2 id="abstract">Abstract</h2>

{{ page.abstract }}

<p class="keywords"><strong>Keywords:</strong> verifiable credentials; semantic integrity; JSON-LD; RDF canonicalisation; Data Integrity; supply-chain security; formal model; European Digital Identity Wallet; digital product passport; attested decisions</p>
</section>

<h2 id="signed-is-not-meant">Signed is not the same as meant</h2>

An energy-sector credential states that a grid operator is a *distribution* system operator with access to *public* battery-passport data. A battery manufacturer's portal checks the credential and grants access. The credential names its vocabulary by a URL. If the document behind that URL is changed, for instance by a compromised server, a cache or a careless update, the same signed bytes now say *transmission* system operator and *restricted* data. The signature check still says "valid". Nobody broke a key or revoked anything, yet authority changed.

{% assign same_signature_figure = page.figure_objects[0] %}
{% include research-figure.html figure=same_signature_figure number=1 %}

The result is conditional. It requires a signing method that does not cover the context's content (JCS-based Data Integrity or JOSE/COSE envelopes) and mutable, decision-relevant context bytes that the verifier does not authenticate independently. It was reproduced on production libraries, on two independent implementations, in one use case; it does not imply that deployments with authenticated context pins are affected.

W3C Data Integrity already requires approved contexts, or equivalent protections, at each verifier. That protects one verifier at one moment. Who approves a meaning, how an update or a withdrawal reaches every verifier, and how a decision can later show which meaning it applied are left open. Meaning therefore needs the discipline that software and keys already have: authorised publishers, reproducible builds, signed release, freshness, rollback protection, transparency, withdrawal, attestation and audit.

<h2 id="five-findings">Five findings on production libraries</h2>

1. **F1, signed is not meant.** Substituting the document behind a context URL keeps a JCS or envelope signature valid and changes the credential's meaning (worked example WE-1).
2. **F2, undefined signed terms.** A JCS-signed member that no context defines stays validly signed and is silently dropped from the RDF view; Data Integrity 1.0 requires software that performs this processing to reject such a loss.
3. **F3, process-wide context caching.** One JavaScript library caches resolved contexts process-wide by URL, so a second loader holding a different copy is not asked, on one cache path.
4. **F4, pre-authentication canonicalisation cost.** In a measurement with harness v0.3.0 on one machine, a 22 kB document cost a verifier that canonicalises without a work bound more than 20 seconds before any signature check; `rdf-canonize` 4.0.0 and later abort such input by default.
5. **F5, lists with repeated values.** Under the default limit of the tested libraries, some RDF lists with repeated interior values cannot be canonicalised, so legitimate credentials containing them cannot be verified with RDFC under default settings. These are tested outcomes for one list family on two stacks.

The article also models the semantic supply chain formally (SSC-FM): theorems T1–T19 and T11′ are stated with proof sketches, and the stateful mechanisms are model-checked in 66 cases on small instances.

<h2 id="mechanisms-and-requirements">Thirty mechanisms and 91 requirements</h2>

The mechanisms follow the lifecycle of meaning in seven stages, from governance to monitoring. Among them: semantic release engineering with update roles and transparency logs (M1–M9); codec binding with a lifetime archive for compact, long-lived carriers such as CBOR-LD labels (M15); lexical-first, semantic-committed proofs (M17, experimental); receipts that record the meaning a decision applied (M22); attested or replay-validated decision engines (M24); withdrawal of meaning as an authority-epoch event (M25); and a compliance-evidence profile in which the presenting party has no choice over evidence that affects the outcome (M31). Unless stated otherwise a mechanism is at evidence level E1, design rationale.

The 91 requirements (31 new, 40 refined, 20 baseline) are proposed as a baseline for a high-assurance profile of W3C VCDM 2.0. A W3C Community Group for such a profile was proposed on 11 November 2026 and launched on 12 November 2026; no W3C group has adopted the requirements. The requirements are also available as CSV ([Supplement S2](#supplements)).

<h2 id="use-cases">Use cases</h2>

- **UC1 Battery passport, market-role access and the battery label.** Access to restricted passport data decided with market-role credentials, and labels that must decode in 2040 as they were meant in 2026 (a projection, not an observation).
- **UC2 E-commerce shipment at the border.** Risk targeting over many vocabularies, crosswalks and dated code changes such as HS 2028.
- **UC3 Edge verifier.** Offline windows, rollback protection and the question which meaning a device actually applied.
- **UC4 AI agent acting on a mandate and an evidence graph.** Per-action verification, replayable decisions and authority that changes when a meaning is withdrawn.
- **UC5 Verifiable knowledge graphs for AI.** Open problems, without a proposed mechanism.
- **UC6 Verifiable business-partner records (KYBP).** Legal representatives, powers, control structure and beneficial owners modelled in the WE BUILD European Business Wallet Vocabulary v0.1; the application to onboarding, master data, anti-money-laundering checks and export controls is the article's analysis, on paper only.

The use cases motivate the requirements; none was deployed or trialled for this work.

<h2 id="evidence-boundaries">Evidence and boundaries</h2>

The results bind meaning, not its truth: a well-governed vocabulary can still describe the world wrongly, and an authorised publisher can still release harmful but authorised meaning. Hardware isolation is simulated on a software TPM, not demonstrated; attribution of decisions to an accountable legal person is specified, not implemented. The mapping to SD-JWT VC, ISO mdoc and EUDI rulebooks is design reasoning only. All timings come from harness v0.3.0 on one machine and one software stack; the corrected v0.4.0 paths are evidenced by functional tests. The formal results are proof sketches and bounded model checks, not mechanised proofs. The material went through seven rounds of adversarial review by AI models and a pre-publication review by two AI models; these reviews are not peer review.

Legal and standards statuses are given as of 14–15 November 2026. The work is published as a defensive publication; no patent has been or will be filed on the mechanisms it describes.

<h2 id="software-and-reproducibility">Software and reproducibility</h2>

All empirical results come from the open semantic supply chain harness, Apache-2.0 with third-party notices.

- **Harness v0.4.0** (16 November 2026): [doi:10.5281/zenodo.24281131](https://doi.org/10.5281/zenodo.24281131) and the GitHub release [`ssc-harness-v0.4.0`](https://github.com/cstoecker/spherity-research/releases/tag/ssc-harness-v0.4.0). From a clean extract it passes 136 tests and runs the 66-case model checker; its checksum manifest carries an RFC 3161 timestamp.
- **Harness v0.3.0** (12 November 2026): [doi:10.5281/zenodo.24168347](https://doi.org/10.5281/zenodo.24168347), the archive of the historical timings reported in the article.
- **All versions:** [doi:10.5281/zenodo.24168346](https://doi.org/10.5281/zenodo.24168346) always resolves to the latest version.

<h2 id="supplements">Supplements and data</h2>

The supplements are part of the publication and carry the full record. Numbers in square brackets in them refer to the article's reference list.

| Supplement | Content | Download |
|---|---|---|
| S1 | Mechanism disclosures M1–M31 with variants, and the full claim register | [PDF, 29 pp.]({{ '/Spherity-Research-Semantic-Supply-Chain-S1-Mechanisms.pdf' | relative_url }})<br>[CSV register]({{ '/Spherity-Research-Semantic-Supply-Chain-S1-claim-register.csv' | relative_url }}) |
| S2 | The 91 requirements with profile mapping | [PDF, 32 pp.]({{ '/Spherity-Research-Semantic-Supply-Chain-S2-Requirements.pdf' | relative_url }})<br>[CSV requirements]({{ '/Spherity-Research-Semantic-Supply-Chain-S2-requirements.csv' | relative_url }}) |
| S3 | Formal model SSC-FM v5.2, theorems with proof sketches, model checking | [PDF, 28 pp.]({{ '/Spherity-Research-Semantic-Supply-Chain-S3-Formal-Model.pdf' | relative_url }}) |
| S4 | Prior-art ledger and novelty records | [PDF, 14 pp.]({{ '/Spherity-Research-Semantic-Supply-Chain-S4-Prior-Art.pdf' | relative_url }}) |
| S5 | Method, review and reproducibility record | [PDF, 23 pp.]({{ '/Spherity-Research-Semantic-Supply-Chain-S5-Review-Record.pdf' | relative_url }}) |

This paper is part of the research programme [Securing Meaning in Trust Infrastructure]({{ '/securing-meaning-in-trust-infrastructure.html' | relative_url }}), which also lists the planned work: a high-assurance profile for W3C VCDM 2.0, verifiable knowledge graphs for AI and key management for AI agents.

<h2 id="references">Selected references</h2>

1. C. Stöcker, *Securing the Semantic Supply Chain: Meaning as a Foundation of Trust Infrastructure*, version 1.0, Spherity Research, 16 November 2026. [doi:10.5281/zenodo.24293613](https://doi.org/10.5281/zenodo.24293613).
2. C. Stöcker, [*Proofs over Statements in Verifiable Evidence Graphs for the European Business Wallet*]({{ '/proofs-over-statements-evidence-graphs.html' | relative_url }}), v1.3, Spherity Research, 9 November 2026.
3. N. Fujie, S. Suzuki, [*A Security Analysis of Verifiable Credential Verification Pipelines*](https://arxiv.org/abs/2611.04461), arXiv:2611.04461, v2, 8 November 2026.
4. W3C, [*Verifiable Credentials Data Model v2.0*](https://www.w3.org/TR/vc-data-model-2.0/) and [*Verifiable Credential Data Integrity 1.0*](https://www.w3.org/TR/vc-data-integrity/), Recommendations, 15 May 2025; [*RDF Dataset Canonicalization (RDFC-1.0)*](https://www.w3.org/TR/rdf-canon/), Recommendation, 21 May 2024; [*CBOR-LD 1.0*](https://www.w3.org/TR/cbor-ld/), Working Draft, 9 November 2026.
5. WE BUILD Consortium, WP4 Semantics group, [*European Business Wallet Vocabulary*](https://w3id.org/ebwv), v0.1, 2 November 2026.
6. C. Stöcker, *Semantic supply chain harness*, v0.4.0, 16 November 2026. [doi:10.5281/zenodo.24281131](https://doi.org/10.5281/zenodo.24281131).

The article's full reference list has 27 entries.
