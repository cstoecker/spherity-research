---
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "European Business Wallets as the Legal Control Plane for Zero Trust AI Agents"
subtitle: "An action and policy whitepaper on trusted AI and business-wallet infrastructure for regulated agentic systems"
description: "Research on European Business Wallet identity, mandates, revocation, and evidence as a legal control plane for enterprise Zero Trust AI agents."

paper_status: "Spherity Policy Whitepaper"
author: "Dr. Carsten Stöcker"
authors:
  - "Dr. Carsten Stöcker"
affiliation: "Spherity GmbH"
date: "2026-06-01"
last_modified_at: "2026-07-30"
lang: "en"

permalink: /ebw-zero-trust-ai-agents.html
canonical_url: "https://spherity.github.io/spherity-research/ebw-zero-trust-ai-agents.html"
latest_version: "https://spherity.github.io/spherity-research/ebw-zero-trust-ai-agents.html"
pdf_url: "/Spherity_Research_EBW_as_Legal_Control_Plane_for_Zero_Trust_AI_Agents.pdf"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"

image: "/assets/control-plane-social.png"
image_alt: "Social preview for European Business Wallets as the Legal Control Plane for Zero Trust AI Agents."
cover_image: "/assets/Spherity_Research_EBW_as_Legal_Control_Plane_for_Zero_Trust_AI_Agents.png"
cover_image_alt: "First page of European Business Wallets as the Legal Control Plane for Zero Trust AI Agents."

answer_summary: "The whitepaper argues that technical agent identity and runtime security do not prove which legal person authorized an autonomous action. It proposes European Business Wallet identity, digital mandates, status verification, and signed action evidence as a cross-company legal authority layer for Zero Trust AI agents."
key_takeaways:
  - "Workload identity identifies a technical actor; regulated actions also require proof of the accountable legal person and the agent's mandate."
  - "Authorization should be evaluated for each material action using identity, scope, purpose, status, audience, and policy context."
  - "European Business Wallet evidence can complement MCP, A2A, dataspace, and API interaction layers without replacing them."
  - "Revocation, provenance, action receipts, and cryptographic agility are necessary for accountable multi-agent workflows."
about:
  - "European Business Wallet"
  - "Zero Trust Architecture"
  - "AI-agent identity"
  - "Digital mandates"
  - "Legal-person identity"
mentions:
  - "eIDAS 2.0"
  - "Model Context Protocol"
  - "Agent2Agent Protocol"
  - "Dataspace Protocol"
  - "Post-quantum cryptography"
  - "AI Act"
citations:
  - "https://csrc.nist.gov/pubs/sp/800/207/final"
  - "https://csrc.nist.gov/pubs/sp/800/207/a/final"
  - "https://digital-strategy.ec.europa.eu/en/library/proposal-regulation-establishment-european-business-wallets"
  - "https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:32024R1183"
  - "https://www.w3.org/TR/vc-data-model-2.0/"
questions_answered:
  - question: "What authority problem remains after an AI agent has a technical identity?"
    answer: "A certificate or workload identifier can show which software instance acted, but it does not by itself prove which legal person is accountable, whether that organization issued a valid mandate, or whether the mandate covered the exact action at the time it occurred."
  - question: "What does a European Business Wallet add to Zero Trust AI?"
    answer: "The paper maps legal-person identification, electronic attestations, digital mandates, trust and status services, revocation, wallet attestations, and signed evidence to the authorization and audit requirements of regulated autonomous actions."
  - question: "Does the proposed control plane replace MCP, A2A, dataspace connectors, or API gateways?"
    answer: "No. Those technologies remain interaction and enforcement surfaces. The proposed wallet layer supplies external evidence about legal identity, delegated authority, current status, and accountability before a material action is permitted."
  - question: "Does legal authority prove that an AI agent used reliable data?"
    answer: "No. The control plane establishes identity, mandate, scope, status, and accountability for an action. A complementary data plane must establish the provenance, validation, freshness, uncertainty, and evidence path supporting the agent's conclusion."
related_publications:
  - title: "Evidence Graphs for Industrial AI"
    url: "/evidence-graphs-industrial-ai-data-plane.html"
    context: "Provides the complementary data-plane architecture for provenance, validation, freshness, conflicts, and auditable AI evidence paths."
  - title: "Quantum-Resilient Organizational Identity"
    url: "/quantum-resilient-organizational-identity.html"
    context: "Defines the governance, trust-fabric, business-wallet, and PQC Corridor architecture needed to keep organizational and agent authority reliable during cryptographic migration."
  - title: "Securing Digital Identity and Verifiable Credential Wallets against Quantum Vulnerabilities"
    url: "/Securing-Digital-Identity-Quantum-Vulnerabilities.html"
    context: "Extends the authority model with an end-to-end post-quantum migration and crypto-agility analysis."
  - title: "Legal & Operational EBW Roadmap Toward EU-Wide Acceptance"
    url: "/ebw-roadmap.html"
    context: "Places the proposed wallet framework on a conditional legal, standards, conformance, and adoption timeline."
  - title: "AI-Cyber, Quantum Risk, Hybrid Warfare, and Physical AI"
    url: "/threat-escalation-model-germany-eu.html"
    context: "Explains why agent authority and trust evidence belong in a wider operational-readiness model."

toc_items:
  - title: "About the whitepaper"
    href: "#about-the-whitepaper"
  - title: "Reference architecture"
    href: "#reference-architecture"
  - title: "Control-plane comparison"
    href: "#control-plane-comparison"
  - title: "Two complementary trust planes"
    href: "#two-complementary-trust-planes"
  - title: "Boundary conditions"
    href: "#boundary-conditions"
  - title: "License and citation"
    href: "#license-and-citation"
  - title: "Questions answered"
    href: "#questions-answered"

tags:
  - european-business-wallet
  - zero-trust-architecture
  - ai-agent-identity
  - legal-person-identity
  - digital-mandates
  - agentic-commerce
  - trusted-ai
  - post-quantum-cryptography
---

<div class="paper-download">
  <a href="{{ page.pdf_url | relative_url }}">Download the complete 30-page PDF</a>
  <p>This page is an indexable summary. The PDF is the authoritative full text, including the formal model, evidence object, implementation path, and references.</p>
</div>

<figure class="paper-figure centered-figure">
  <img src="{{ page.cover_image | relative_url }}"
       alt="{{ page.cover_image_alt }}"
       width="1626"
       height="1763">
  <figcaption><strong>Whitepaper cover.</strong> European Business Wallets as the Legal Control Plane for Zero Trust AI Agents, published 1 June 2026.</figcaption>
</figure>

<h2 id="about-the-whitepaper">About the whitepaper</h2>

Autonomous enterprise agents can select tools, call application programming interfaces, coordinate with other agents, and initiate business actions. Technical Zero Trust Architecture can authenticate a workload, constrain access, and record activity. The whitepaper examines the additional question that arises when an agent acts across a corporate or public-sector boundary: which legal person is accountable, what authority was delegated, and what evidence proves that the action was permitted?

The paper argues that the European Business Wallet (EBW), as described in the current European Commission proposal and connected to the eIDAS 2.0 trust framework, offers relevant primitives for that authority layer. These include legal-person identification, electronic attestations of attributes, digital mandates, wallet-unit attestations, trust and status services, revocation, automated machine-to-machine interaction, and signed transaction evidence.

The paper is an infrastructure-neutral architecture and policy analysis. It is not legal advice, certification advice, or assurance for a particular deployment. It treats legislative text still under negotiation as a draft policy signal rather than adopted law.

<h2 id="reference-architecture">Reference architecture</h2>

The proposed design separates interaction protocols from authority evidence:

1. An agent selects a tool or target action.
2. A gateway describes the action, parameters, audience, purpose, and policy context.
3. The acting party presents legal-person identity, agent identity, a bounded mandate, and current status evidence.
4. The verifier resolves issuers, trust lists, registries, and revocation information.
5. A policy engine permits, denies, or escalates the individual action.
6. The gateway executes only a permitted action.
7. The system records an action receipt binding the authority evidence, policy decision, status snapshot, parameters, timestamp, and trace identifiers.

Model Context Protocol (MCP), Agent2Agent (A2A), dataspace connectors, and conventional API gateways remain interaction or enforcement layers. The paper positions EBW evidence as the legal and cryptographic authority predicate evaluated before a material action crosses an organizational boundary.

<h2 id="control-plane-comparison">Control-plane comparison</h2>

| Architectural question | Technical agent control alone | EBW-backed legal authority layer proposed in the paper |
| --- | --- | --- |
| Who acted? | Identifies a workload, service account, certificate, or agent instance. | Links the technical actor to an identified legal person and wallet unit. |
| What was authorized? | Commonly applies session, role, service, or gateway policy. | Evaluates a bounded digital mandate for the specific action, audience, purpose, time, and delegation chain. |
| Is authority still current? | Revokes or rotates local credentials and service permissions. | Adds wallet, mandate, attribute, issuer, and governance-status checks to local security controls. |
| What crosses company boundaries? | Relies on bilateral federation or locally configured trust. | Presents verifiable identity and authority evidence that counterparties can validate against shared trust information. |
| What evidence remains? | Produces application, gateway, identity-provider, and security logs. | Adds a signed action receipt that binds legal principal, mandate, status snapshot, policy decision, and action details. |
| How are protocols composed? | Each protocol manages its own identity and authorization integration. | Applies the same external authority predicate across MCP, A2A, dataspace, and API events. |
| How is cryptographic migration handled? | Depends on each local identity and logging component. | Calls for algorithm identifiers, hybrid or post-quantum profiles, rollover policy, and long-term evidence preservation across the authority chain. |

The two columns are complementary rather than mutually exclusive. The proposed EBW layer does not replace workload identity, sandboxing, service meshes, data-loss prevention, runtime monitoring, or incident response.

<h2 id="two-complementary-trust-planes">Two complementary trust planes</h2>

The legal control plane addresses **who may act**: the accountable legal person, the agent identity, the delegated mandate, the action scope, the relying party, the current status, and the evidence retained after execution.

The complementary data-plane architecture in <a href="{{ '/evidence-graphs-industrial-ai-data-plane.html' | relative_url }}">Evidence Graphs for Industrial AI</a> addresses **what evidence supports the action or conclusion**: provenance, source attribution, validation, freshness, transformations, conflicts, uncertainty, and traversable evidence paths.

A valid mandate does not prove that an AI output is factually supported. Reliable evidence does not prove that an AI agent was legally authorized to act. Regulated AI systems require both layers.

<h2 id="boundary-conditions">Boundary conditions</h2>

An EBW-backed authority layer does not establish that a model output is true, eliminate prompt injection, guarantee safe autonomous behavior, or replace human oversight. Its narrower purpose is to make legal identity, delegation, revocation, cross-domain attribution, and audit evidence machine-verifiable. Model quality and runtime security remain separate control domains.

The proposal also depends on final European Business Wallet legislation, implementing rules, standards, trustworthy wallet and credential providers, interoperable status infrastructure, privacy-preserving data minimization, and operational conformance. The paper therefore presents a reference architecture and standardization agenda, not a claim that the complete infrastructure is already available.

<div class="paper-download">
  <a href="{{ page.pdf_url | relative_url }}">Read or download the full paper</a>
  <p>The complete PDF contains the detailed architecture, stakeholder requirements, standardization agenda, formal model, proof sketches, and 28 referenced sources.</p>
</div>
