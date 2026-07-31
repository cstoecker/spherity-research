---
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "Evidence Graphs for Industrial AI"
subtitle: "Data-plane architectures for global supply chains, Industry 4.0, critical infrastructure, and B2G data exchange from a German perspective"
description: "A final perspective on verifiable linked knowledge graphs, provenance, validation, and evidence-path retrieval for regulated Industrial AI."

paper_status: "Spherity Research Perspective"
author: "Dr. Carsten Stöcker"
authors:
  - "Dr. Carsten Stöcker"
affiliation: "Spherity GmbH"
date: "2026-07-09"
last_modified_at: "2026-07-30"
lang: "en"

permalink: /evidence-graphs-industrial-ai-data-plane.html
canonical_url: "https://spherity.github.io/spherity-research/evidence-graphs-industrial-ai-data-plane.html"
latest_version: "https://spherity.github.io/spherity-research/evidence-graphs-industrial-ai-data-plane.html"
pdf_url: "/Spherity_Research_Evidence_Graphs_for_Industrial_AI_Data_Plane_Architectures.pdf"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"

image: "/assets/evidence-graphs-industrial-ai-data-plane-social.png"
image_alt: "Social preview for Evidence Graphs for Industrial AI."
cover_image: "/assets/evidence-graphs-industrial-ai-data-plane-cover.png"
cover_image_alt: "First page of Evidence Graphs for Industrial AI."

answer_summary: "The paper proposes a layered Verifiable Linked Knowledge Graph as the default data-plane architecture for Industrial AI. It combines open-world linked data with explicit validation, provenance, issuer-bound claims, status, freshness, and evidence-path retrieval, while retaining the Asset Administration Shell as an industrial source model and adapter."
key_takeaways:
  - "Industrial AI needs evidence paths that preserve source, transformation, time, issuer, status, uncertainty, and validation context—not only retrieved text."
  - "The proposed data plane combines RDF and OWL semantics with JSON-LD as the default web serialization, SHACL validation, and verifiable data mechanisms."
  - "The Asset Administration Shell remains valuable as an industrial source model, digital-twin container, and interoperability adapter rather than a universal semantic substrate."
  - "Know Your Data and Data Risk Scoring are operational controls for evidence fitness; neither is a general-purpose truth score."
  - "The data plane complements the European Business Wallet legal control plane: evidence quality and legal authority are separate requirements."
about:
  - "Evidence graphs"
  - "Industrial AI"
  - "Verifiable Linked Knowledge Graph"
  - "Data provenance"
  - "Knowledge Graph RAG"
mentions:
  - "JSON-LD"
  - "RDF and OWL"
  - "SHACL"
  - "Asset Administration Shell"
  - "Verifiable Credentials"
  - "Data Integrity"
  - "Know Your Data"
  - "Data Risk Scoring"
  - "European Business Wallet"
  - "EU AI Act"
citations:
  - "https://www.w3.org/TR/json-ld11/"
  - "https://www.w3.org/TR/shacl/"
  - "https://www.w3.org/TR/prov-o/"
  - "https://www.w3.org/TR/vc-data-model-2.0/"
  - "https://www.w3.org/TR/vc-data-integrity/"
  - "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai"
  - "https://csrc.nist.gov/pubs/ai/100/1/final"
  - "https://digital-strategy.ec.europa.eu/en/library/proposal-regulation-establishment-european-business-wallets"
questions_answered:
  - question: "What data-plane architecture does the paper propose for Industrial AI?"
    answer: "It proposes a layered Verifiable Linked Knowledge Graph: open-world linked data with persistent identifiers and typed relations, combined with provenance, issuer-bound claims, cryptographic integrity, status information, explicit validation rules, and evidence-path retrieval."
  - question: "Why is plain JSON or schema-bound XML insufficient as the complete Industrial AI data plane?"
    answer: "Those formats can exchange structured records, but cross-company AI also needs durable semantics, relationship traversal, source attribution, transformation history, temporal validity, contradictions, uncertainty, and machine-checkable evidence paths across heterogeneous systems."
  - question: "Does the proposed architecture replace the Asset Administration Shell?"
    answer: "No. The paper retains the Asset Administration Shell as an Industry 4.0 source model, asset-centric digital-twin container, and interoperability adapter. It argues against treating any single AAS serialization as the universal semantic substrate for AI-first global data exchange."
  - question: "Do cryptographically signed claims prove that industrial data is true?"
    answer: "No. Signatures and verifiable credentials can establish issuer binding, integrity, status, and accountability. They do not independently prove factual correctness, remove uncertainty, or eliminate the need for validation, corroboration, and domain governance."
  - question: "How do the data plane and European Business Wallet control plane work together?"
    answer: "The data plane supplies traceable evidence about products, processes, risks, and operational facts. The control plane supplies legal-person identity, delegated authority, current mandate status, and action accountability. Regulated Industrial AI requires both."
related_publications:
  - title: "European Business Wallets as the Legal Control Plane for Zero Trust AI Agents"
    url: "/ebw-zero-trust-ai-agents.html"
    context: "Provides the complementary legal-authority layer for deciding who an AI agent represents and whether a specific action is permitted."
  - title: "Securing Digital Identity and Verifiable Credential Wallets against Quantum Vulnerabilities"
    url: "/Securing-Digital-Identity-Quantum-Vulnerabilities.html"
    context: "Explains the crypto-agility and post-quantum migration requirements for long-lived identity, credential, and evidence systems."
  - title: "Legal & Operational EBW Roadmap Toward EU-Wide Acceptance"
    url: "/ebw-roadmap.html"
    context: "Maps the legal, standards, conformance, and adoption dependencies for the European Business Wallet layer."

toc_items:
  - title: "About the paper"
    href: "#about-the-paper"
  - title: "Research problem"
    href: "#research-problem"
  - title: "Evidence-graph architecture"
    href: "#evidence-graph-architecture"
  - title: "Data fitness and risk"
    href: "#data-fitness-and-risk"
  - title: "Two complementary trust planes"
    href: "#two-complementary-trust-planes"
  - title: "Boundary conditions"
    href: "#boundary-conditions"
  - title: "How to cite"
    href: "#how-to-cite"
  - title: "Questions answered"
    href: "#questions-answered"

tags:
  - evidence-graphs
  - industrial-ai
  - data-plane
  - knowledge-graphs
  - json-ld
  - shacl
  - data-provenance
  - verifiable-credentials
  - asset-administration-shell
  - know-your-data
  - trusted-ai
---

<div class="paper-download">
  <a href="{{ page.pdf_url | relative_url }}">Download the complete 33-page PDF</a>
  <p>This page is an indexable research summary. The final PDF is the authoritative full text, including the methodology, architecture comparison, limitations, and 69 referenced sources.</p>
</div>

<figure class="paper-figure centered-figure">
  <img src="{{ page.cover_image | relative_url }}"
       alt="{{ page.cover_image_alt }}"
       width="1489"
       height="2105">
  <figcaption><strong>Paper cover.</strong> Evidence Graphs for Industrial AI, prepared July 2026.</figcaption>
</figure>

<h2 id="about-the-paper">About the paper</h2>

Industrial AI is moving from isolated prediction toward evidence-mediated reasoning in supply-chain control, engineering assistance, compliance, risk analysis, critical infrastructure, and business-to-government reporting. The paper asks what data-plane architecture can support that transition when evidence is distributed across organizations, jurisdictions, digital twins, registries, credentials, documents, and operational systems.

Its central proposal is a layered **Verifiable Linked Knowledge Graph (VLKG)**. The graph supplies persistent identifiers, typed relationships, semantic interoperability, and traversable evidence paths. Validation, provenance, issuer binding, status, freshness, and cryptographic integrity then constrain how those relationships can be used as evidence. This is an architecture proposal, not a claim that one serialization or product solves every industrial data problem.

<h2 id="research-problem">Research problem</h2>

Conventional data exchange frequently transports records without preserving enough context for regulated AI decisions. A model may receive a value yet lack a machine-verifiable answer to basic questions: Who issued it? Which asset or legal entity does it concern? Which transformation produced it? During which time window was it valid? Has its status changed? Which rule was used to validate it? Is another source in conflict?

Plain JSON, XML, and schema-bound interfaces remain useful transports. The paper argues that they are insufficient as the complete cross-company evidence layer when an AI system must integrate heterogeneous data, traverse relationships, explain its source path, and distinguish an asserted statement from a validated or corroborated one.

The research compares plain and schema-bound representations, Asset Administration Shell (AAS) serializations, RDF and OWL knowledge graphs, JSON-LD, YAML-LD, CBOR-LD, SHACL validation, and W3C verifiable-data mechanisms. The methodology is qualitative and design-oriented. Public KG-RAG and GraphRAG results are treated as indirect proxy evidence, not as a direct benchmark between AAS JSON/XML and JSON-LD.

<h2 id="evidence-graph-architecture">Evidence-graph architecture</h2>

The proposed default architecture is layered:

1. **Source and adapter layer.** Enterprise systems, AAS environments, product-passport records, sensor platforms, registries, credentials, and documents remain authoritative within their appropriate domains.
2. **Linked semantic layer.** Persistent identifiers and typed relations connect assets, organizations, products, processes, obligations, observations, documents, and claims across source boundaries.
3. **Validation and policy layer.** SHACL shapes and domain rules apply closed-world checks to selected graph views while preserving open-world integration at the wider graph level.
4. **Verifiable evidence layer.** Issuer identity, cryptographic integrity, credential status, validity periods, trust-domain membership, and transformation provenance support accountable reuse.
5. **Retrieval and reasoning layer.** AI systems retrieve evidence paths rather than isolated passages, preserving the sources, relationships, time context, and detected conflicts used to support an answer or action.

JSON-LD is proposed as the default API and web serialization because it can represent linked semantics in a JSON-compatible form. YAML-LD can support human-oriented authoring and CBOR-LD can support constrained environments. RDF and OWL provide the semantic model; SHACL provides explicit validation. These technologies play different roles and are not interchangeable.

The Asset Administration Shell remains important as an Industry 4.0 interoperability architecture, source model, and asset-centric digital-twin container. The paper’s narrower conclusion is that AAS should connect into the evidence graph through mappings and adapters rather than become the single universal substrate for global supply chains, critical infrastructure, B2G reporting, and AI reasoning.

<h2 id="data-fitness-and-risk">Data fitness and risk</h2>

The paper introduces two operational controls:

- **Know Your Data** verifies source identity, provenance, proof, status, validity, policy fit, and transformation lineage before information is accepted as AI evidence.
- **Data Risk Scoring** estimates whether a data object or evidence path is fit for a specific decision context. It can incorporate provenance quality, freshness, validation results, issuer status, conflict indicators, and uncertainty.

Data Risk Scoring is not a universal truth score. A cryptographic proof can show that a known issuer signed an unchanged claim and that its status is current. It cannot, by itself, establish that the claim is factually correct. Evidence quality still depends on measurement practice, domain rules, corroboration, governance, and the consequences of the intended use.

High-frequency raw telemetry also need not be stored directly in the graph. The graph can hold semantic context, derived features, evidence windows, provenance, and links back to the systems that retain the underlying streams.

<h2 id="two-complementary-trust-planes">Two complementary trust planes</h2>

The data-plane architecture complements Spherity’s existing research on European Business Wallets as a legal control plane for Zero Trust AI agents.

| Trust question | Data plane: evidence graphs | Control plane: European Business Wallets |
| --- | --- | --- |
| What must be established? | Which claims, sources, relationships, transformations, and time conditions support a conclusion. | Which legal person an agent represents, what mandate applies, and whether the action is currently permitted. |
| Core evidence | Provenance, validation results, freshness, issuer-bound claims, conflicts, uncertainty, and evidence paths. | Legal-person identity, agent identity, digital mandates, scope, audience, purpose, status, and action receipts. |
| Primary decision | Is this evidence fit for this AI-assisted conclusion or operational context? | Is this actor authorized to perform this material action across an organizational boundary? |
| What it does not prove | That an AI agent was legally authorized to act. | That an AI output is factually correct or sufficiently supported. |

A valid mandate does not prove that an AI output is factually supported. Reliable evidence does not prove that an AI agent was legally authorized to act. Regulated AI systems require both layers.

<h2 id="boundary-conditions">Boundary conditions</h2>

The paper does not report a direct head-to-head performance benchmark between AAS JSON/XML and JSON-LD. The cited KG-RAG and GraphRAG results indicate potential benefits for grounded retrieval, contradiction handling, evidence paths, and token use, but they remain proxy evidence for the proposed industrial architecture.

The proposal also depends on implementation quality, semantic governance, identifier policy, usable validation rules, trustworthy issuers, maintained status infrastructure, privacy controls, and incentives for cross-company adoption. Knowledge graphs cannot resolve organizational disagreement or poor source data merely by representing it. They can make provenance, conflicts, and missing evidence more explicit.

<h2 id="how-to-cite">How to cite</h2>

Stöcker, Carsten. “Evidence Graphs for Industrial AI: Data-plane architectures for global supply chains, Industry 4.0, critical infrastructure, and B2G data exchange from a German perspective.” Spherity GmbH, July 2026.

<div class="paper-download">
  <a href="{{ page.pdf_url | relative_url }}">Read or download the full paper</a>
  <p>The complete PDF contains the comparative architecture analysis, formal concepts, policy context, implementation implications, limitations, and complete reference list.</p>
</div>
