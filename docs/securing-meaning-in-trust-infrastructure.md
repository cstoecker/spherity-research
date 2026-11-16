---
publication_template_version: 2
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "Securing Meaning in Trust Infrastructure"
seo_title: "Securing Meaning in Trust Infrastructure: Verifiable Credentials Research"
og_title: "Securing Meaning in Trust Infrastructure"
og_description: "A Spherity research programme on the semantic supply chain of verifiable credentials: how meaning is produced, released, verified and withdrawn, from W3C credentials to knowledge graphs and AI agents."
subtitle: "A research programme on the semantic supply chain of verifiable credentials, knowledge graphs and AI agents"
description: "Spherity research programme on securing the meaning of verifiable credentials and JSON-LD: papers, open harness, W3C profile work and planned research on graphs and AI agents."

paper_status: "Spherity Research Programme · Overview"
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

permalink: /securing-meaning-in-trust-infrastructure.html
canonical_url: "https://spherity.github.io/spherity-research/securing-meaning-in-trust-infrastructure.html"
latest_version: "https://spherity.github.io/spherity-research/securing-meaning-in-trust-infrastructure.html"
associated_media:
  - name: "Securing the Semantic Supply Chain — Research Article"
    url: "/Spherity-Research-Semantic-Supply-Chain-Article.pdf"
    cover_image: "/assets/securing-semantic-supply-chain/v1.0/article-cover.jpg"
    cover_image_alt: "First page of the research article Securing the Semantic Supply Chain: Meaning as a Foundation of Trust Infrastructure, version 1.0."
    license: "https://creativecommons.org/licenses/by/4.0/"
cover_image: "/assets/securing-semantic-supply-chain/v1.0/executive-brief-cover.jpg"
cover_image_alt: "First page of the executive brief Securing the Semantic Supply Chain by Dr. Carsten Stöcker, version 1.0."

figure_objects:
  - id: "semantic-supply-chain-lifecycle"
    name: "The lifecycle of meaning and its attack classes"
    content_url: "/assets/securing-semantic-supply-chain/v1.0/figure-3-lifecycle-attack-classes.svg"
    alt: "Seven stages of the semantic supply chain, from govern to monitor, with their requirement groups, and seventeen attack classes A to Q with the objectives each violates; only the verify-and-use stage is partly covered by context validation at one verifier."
    width: 1240
    height: 613
    description: "The research programme's frame: meaning passes through seven lifecycle stages, each with its own failure modes, and today's context validation covers part of one stage at one verifier."
    caption: "The seven stages of the semantic supply chain with their requirement groups, and the attack classes A–Q with the objectives each violates. The shaded stage, verify and use, is the one that context validation in W3C Data Integrity partly covers, at one verifier. Source: Dr. Carsten Stöcker, Spherity GmbH, Securing the Semantic Supply Chain, Figure 3."
    credit_text: "Dr. Carsten Stöcker, Spherity GmbH"
    copyright_notice: "© 2026 Dr. Carsten Stöcker"
    copyright_holder: {type: "Person", name: "Dr. Carsten Stöcker", url: "https://spherity.github.io/spherity-research/#dr-carsten-stoecker"}
    keywords:
      - "semantic supply chain"
      - "attack classes"
      - "verifiable credentials lifecycle"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"
license_scope: "This research programme page"

image: "/assets/preview-securing-meaning-in-trust-infrastructure.webp"
image_alt: "Securing Meaning in Trust Infrastructure research programme preview with the executive brief cover."
image_mime: "image/webp"
image_width: 1200
image_height: 630

keywords:
  - "semantic supply chain"
  - "verifiable credentials"
  - "JSON-LD"
  - "semantic integrity"
  - "trust infrastructure"
  - "W3C verifiable credentials"
  - "high-assurance profile"
  - "knowledge graph"
  - "data provenance"
  - "AI agents"
  - "digital product passport"
  - "battery passport"
  - "EUDI wallet"
  - "European Business Wallet"
  - "software supply chain security"
  - "Dr. Carsten Stöcker"

answer_summary: "Verifiable credentials, product passports and AI agents rely on meaning that arrives outside the signed bytes, through JSON-LD contexts, vocabularies, rulebooks and code tables. This programme studies how that meaning is produced, released, verified and withdrawn, and proposes controls for it. Its first paper, Securing the Semantic Supply Chain (version 1.0, doi:10.5281/zenodo.24293613), is published with an open test harness; further papers are planned and none of the proposed requirements has been adopted by a standards body."
key_takeaways:
  - "A valid signature is not a valid meaning: the definitions that give a credential its meaning form a supply chain of their own, protected today only at one verifier at one moment."
  - "Paper A provides the threat model, five findings on production libraries, a formal model, 30 mechanisms and 91 proposed requirements, with an open harness archived on Zenodo."
  - "The next steps concentrate on a high-assurance profile for W3C VCDM 2.0 across RDF, JSON-LD, CBOR-LD and YAML-LD, verifiable knowledge graphs for AI and key management for AI agents."
about:
  - "Semantic supply chain security"
  - "Verifiable credentials and JSON-LD"
  - "Trust infrastructure research programme"
mentions:
  - "W3C Verifiable Credentials Data Model 2.0"
  - "W3C Data Integrity"
  - "High Assurance Profile for W3C VCDM 2.0 Community Group"
  - "EU Digital Identity Wallet"
  - "European Business Wallet"
  - "Digital product passport"
  - "Knowledge graphs"
  - "AI agents"
citations:
  - "https://doi.org/10.5281/zenodo.24293613"
  - "https://doi.org/10.5281/zenodo.24281131"
  - "https://www.w3.org/TR/vc-data-model-2.0/"
  - "https://www.w3.org/TR/vc-data-integrity/"
  - "https://www.w3.org/community/vc-haip/"
audiences:
  - "Standards bodies and specification editors"
  - "Issuers, verifiers and wallet providers"
  - "Regulators and supervisors"
  - "Researchers and implementers"
spatial_coverage:
  - "European Union"
  - "Global"

series_label: "Research programme"
series_name: "Securing Meaning in Trust Infrastructure"
series_description: "A research programme on the semantic supply chain of verifiable credentials: how meaning is produced, released, verified and withdrawn, from W3C credentials to knowledge graphs and AI agents."
series_url: "/securing-meaning-in-trust-infrastructure.html"
series_position: 0
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
    - "trust infrastructure"
  discovery_terms:
    - "JSON-LD"
    - "W3C verifiable credentials"
    - "knowledge graph"
    - "AI agents"
    - "digital product passport"
  audience_questions:
    - "What does it take to secure the meaning of verifiable credentials, not only their signatures?"
    - "Which research and software exist on the semantic supply chain, and what comes next?"
    - "How do knowledge graphs and AI agents depend on the meaning of signed data?"
  evidence:
    - comparison: "verifiable credentials, JSON-LD, semantic supply chain, semantic integrity, software supply chain security"
      input_type: "Search terms"
      geography: "Worldwide"
      time_range: "Past 5 years"
      search_type: "Web Search"
      result: "Means of the weekly indices (261 complete weeks): JSON-LD 15.62, software supply chain security 9.19, verifiable credentials 9.18, semantic supply chain 0.99, semantic integrity 0.56; the two semantic terms show zero in 201 and 212 weeks. The largest readings occur in 2025–2026."
    - comparison: "GraphRAG, knowledge graph, AI agent identity, data provenance, verifiable credentials"
      input_type: "Search terms"
      geography: "Worldwide"
      time_range: "Past 5 years"
      search_type: "Web Search"
      result: "Knowledge graph 15.82 (nonzero throughout), GraphRAG 3.32, data provenance 1.80, AI agent identity 1.31, verifiable credentials 1.22; knowledge graph is the broadest measured discovery phrase in this set."
    - comparison: "Topic Verifiable credentials against the search term verifiable credentials"
      input_type: "Topic and search term"
      geography: "Worldwide"
      time_range: "Past 5 years"
      search_type: "Web Search"
      result: "Topic mean 31.84 against 12.95 for the search term; the topic measures the broader concept and is kept separate from the keyword comparisons."
  editorial_decisions:
    - "Name the programme by its subject, Securing Meaning in Trust Infrastructure, and keep semantic supply chain and verifiable credentials as authority terms even where Trends reports little interest for the semantic terms."
    - "Use JSON-LD, W3C verifiable credentials and knowledge graph as discovery language, because they carry measurable interest and describe the programme's actual scope; do not promise AI or product-passport results that the papers do not contain."
    - "Leave application keywords (battery passport, EUDI wallet, KYB) mainly to the paper page, where they are explained in context."

questions_answered:
  - question: "What is the research programme Securing Meaning in Trust Infrastructure about?"
    answer: "It studies the semantic supply chain of verifiable credentials: the JSON-LD contexts, vocabularies, rulebooks and code tables that give signed data its meaning, how they are produced, released, verified and withdrawn, where today's stacks fail, and which mechanisms and requirements would secure them."
  - question: "What has been published so far?"
    answer: "Paper A, Securing the Semantic Supply Chain: Meaning as a Foundation of Trust Infrastructure, version 1.0 of 16 November 2026, with an executive brief and supplements S1–S5 (doi:10.5281/zenodo.24293613), and the open semantic supply chain harness v0.4.0 (doi:10.5281/zenodo.24281131)."
  - question: "What comes next?"
    answer: "Planned are a high-assurance profile for W3C VCDM 2.0 in which every admitted serialisation (JSON-LD, CBOR-LD, YAML-LD as authoring source) binds to one RDF dataset, verifiable knowledge graphs for AI, and key management for AI agents. None of this planned work is part of Paper A's claims."
  - question: "Has a standards body adopted the proposed requirements?"
    answer: "No. The 91 requirements are a proposal to the W3C Community Group for a High Assurance Profile for W3C VCDM 2.0, which was proposed on 11 November 2026 and launched on 12 November 2026; no W3C group has adopted them."

related_publications:
  - title: "Proofs over Statements: Verifiable Evidence Graphs"
    url: "/proofs-over-statements-evidence-graphs.html"
    context: "The foundation of this programme: what a verifier must hold to trust a statement in an evidence graph, assuming pinned contexts that Paper A shows how to secure."
  - title: "EU DPP Registry, W3C Standards and DPP5.0"
    url: "/eu-dpp-registry-w3c-dpp5.html"
    context: "The W3C semantic stack of the EU DPP Registry, one of the semantic artefact publishers this programme studies."
  - title: "European Business Wallets as the Legal Control Plane for Zero Trust AI Agents"
    url: "/ebw-zero-trust-ai-agents.html"
    context: "Mandates and action receipts for AI agents, which the planned agent key management work builds on."
  - title: "Evidence Graphs for Industrial AI"
    url: "/evidence-graphs-industrial-ai-data-plane.html"
    context: "Evidence graphs as the data plane for industrial AI, the setting of the planned verifiable knowledge graph work."

toc_items:
  - title: "The question"
    href: "#the-question"
  - title: "Paper A"
    href: "#paper-a"
  - title: "Software and reproducibility"
    href: "#software"
  - title: "Standards work"
    href: "#standards-work"
  - title: "What comes next"
    href: "#what-comes-next"
  - title: "Foundations"
    href: "#foundations"
  - title: "License and citation"
    href: "#license-and-citation"
  - title: "Questions answered"
    href: "#questions-answered"

tags:
  - verifiable-credentials
  - identity
  - trusted-ai
  - knowledge-graphs
  - european-business-wallet
  - digital-product-passport
---

<section class="paper-download-grid" id="download-series" aria-labelledby="download-series-title">
  <div class="paper-download">
    <h2 id="download-series-title">Start with the executive brief</h2>
    <a href="{{ '/Spherity-Research-Semantic-Supply-Chain-Executive-Brief.pdf' | relative_url }}">Download the executive brief (PDF, 8 pages)</a>
    <p><strong>Securing the Semantic Supply Chain.</strong> Why a valid signature is not a valid meaning, and what each role should do.</p>
  </div>
  <div class="paper-download">
    <h2>Read Paper A</h2>
    <ol class="paper-download-links" role="list">
      <li><a href="{{ '/securing-semantic-supply-chain.html' | relative_url }}">Paper A: Securing the Semantic Supply Chain</a></li>
      <li><a href="{{ '/Spherity-Research-Semantic-Supply-Chain-Article.pdf' | relative_url }}">Research article (PDF, 45 pages)</a></li>
      <li><a href="https://doi.org/10.5281/zenodo.24293613">Zenodo record with supplements S1–S5</a></li>
    </ol>
  </div>
</section>

<h2 id="the-question">The question</h2>

Verifiable credentials are becoming legal and economic infrastructure: battery and product passports, wallets for people and businesses, customs data and the evidence that AI agents act on. A signature proves who issued a credential and that its signed content is unchanged, given a trusted binding between key and issuer. It does not prove what the credential means to the system that reads it.

That meaning comes from elsewhere: JSON-LD contexts, vocabularies, ontologies, validation shapes, rulebooks, Type Metadata and code tables. They are published by someone, change over time, and are copied, cached and replaced outside the signed bytes. Together they form a **semantic supply chain**. This programme asks how that chain can be secured with the discipline that software and keys already have: authorised publishers, signed releases, freshness, rollback protection, withdrawal and decisions that record which meaning they applied.

{% assign lifecycle_figure = page.figure_objects[0] %}
{% include research-figure.html figure=lifecycle_figure number=1 %}

<h2 id="paper-a">Paper A: Securing the Semantic Supply Chain</h2>

[**Securing the Semantic Supply Chain: Meaning as a Foundation of Trust Infrastructure**]({{ '/securing-semantic-supply-chain.html' | relative_url }}), version 1.0, 16 November 2026, [doi:10.5281/zenodo.24293613](https://doi.org/10.5281/zenodo.24293613). The paper gives the threat model of the semantic supply chain, five findings on production libraries, a formal model with proof sketches and 66 model-checked cases, 30 mechanisms and 91 proposed requirements, and six use cases from battery passports to verifiable business-partner records. It is published with an executive brief and supplements S1–S5 on mechanisms, requirements, the formal model, prior art and the review record.

Its results bind meaning, not its truth. Hardware isolation is simulated, not demonstrated, and the use cases motivate the requirements without having been deployed.

<h2 id="software">Software and reproducibility</h2>

The empirical results come from the open **semantic supply chain harness** (Apache-2.0 with third-party notices): worked examples on production libraries, the model checker and the tests. Version 0.4.0 of 16 November 2026 passes 136 tests from a clean extract and is archived at [doi:10.5281/zenodo.24281131](https://doi.org/10.5281/zenodo.24281131); [doi:10.5281/zenodo.24168346](https://doi.org/10.5281/zenodo.24168346) always resolves to the latest version. Source and release: [`ssc-harness-v0.4.0`](https://github.com/cstoecker/spherity-research/releases/tag/ssc-harness-v0.4.0).

<h2 id="standards-work">Standards work</h2>

The 91 requirements of Paper A are offered as a proposed baseline to the W3C [High Assurance Profile for W3C VCDM 2.0 Community Group](https://www.w3.org/community/vc-haip/), which was proposed on 11 November 2026 and launched on 12 November 2026. No W3C group has adopted them. The requirements are available as CSV with the paper's supplements.

<h2 id="what-comes-next">What comes next</h2>

The following work is planned. It builds on Paper A's formal model, requirements and harness; none of it is part of Paper A's claims.

1. **A high-assurance profile for W3C VCDM 2.0.** Conformance requirements per class, anchored on the credential's RDF dataset: every admitted serialisation binds to that one dataset, with JSON-LD as the form that is exchanged and verified, CBOR-LD for compact, long-lived carriers and YAML-LD as an authoring source only.
2. **Verifiable knowledge graphs for AI.** Committed graphs with provenance per fact, a pinned semantic closure including the entailment regime, incremental commitments, proofs for single facts and retrieved subgraphs, and withdrawal that reaches derived facts, caches and embeddings.
3. **Key management for AI agents,** in preparation.

New papers will appear in this series as they are published.

<h2 id="foundations">Foundations</h2>

The programme builds on [**Proofs over Statements: Verifiable Evidence Graphs**]({{ '/proofs-over-statements-evidence-graphs.html' | relative_url }}), which shows what a verifier must hold to trust a statement in an evidence graph and assumes pinned contexts and an authenticated context closure. Paper A supplies those assumptions. Related Spherity research on the EU DPP Registry, European Business Wallets and evidence graphs for industrial AI is listed below.
