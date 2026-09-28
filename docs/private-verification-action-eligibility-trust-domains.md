---
publication_template_version: 2
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "Private Verification of Action Eligibility across Trust Domains"
seo_title: "Private Verification for Cross-Domain AI Agents"
og_title: "Private Verification across Trust Domains | AI Safety Paper 3"
og_description: "A protocol for verifying exact AI-agent action eligibility, prohibitions and adverse evidence across trust domains with controlled disclosure."
subtitle: "AI Safety: Evidence Semantics and Controlled Execution for Cross Organisation Agents"
description: "A protocol for verifying exact AI-agent action eligibility, prohibitions and adverse evidence across trust domains with controlled disclosure."

paper_status: "Spherity AI Safety Series — Paper 3 of 3"
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

date: "2026-09-28"
last_modified_at: "2026-09-28"
research_cutoff: "2026-09-28"
research_cutoff_label: "Research, protocols and implementation evidence reviewed to this date"
lang: "en"

permalink: /private-verification-action-eligibility-trust-domains.html
canonical_url: "https://spherity.github.io/spherity-research/private-verification-action-eligibility-trust-domains.html"
latest_version: "https://spherity.github.io/spherity-research/private-verification-action-eligibility-trust-domains.html"

pdf_url: "/Spherity-AI-Safety-Series-Paper-3-Private-Verification.pdf"
associated_media:
  - name: "Private Verification of Action Eligibility — Paper 3 PDF"
    url: "/Spherity-AI-Safety-Series-Paper-3-Private-Verification.pdf"
    license: "https://creativecommons.org/licenses/by/4.0/"
cover_image: "/assets/ai-safety-paper-3-private-verification-cover.jpg"
cover_image_alt: "First page of Private Verification of Action Eligibility across Trust Domains."

figure_objects:
  - id: "cross-domain-control-architecture"
    name: "Cross-domain architecture for private action-eligibility verification"
    content_url: "/assets/ai-safety-paper-3-cross-domain-control-architecture.svg"
    alt: "Two trust domains separate private eligibility evaluation, protected admission and local effect enforcement while sharing bounded evidence and records."
    width: 2100
    height: 2295
    description: "The Paper 3 architecture preserves local authority in each domain while joining typed evidence, private eligibility evaluation, protected admission and outcome records."
    caption: "Two trust domains retain separate pure eligibility evaluation, protected admission and effect enforcement. Joint assurance preserves continuation and episode state while local authority remains sovereign. Dashed lines carry evidence and records; solid paths carry protected control and effects. Source: Spherity GmbH."
    credit_text: "Source: Spherity GmbH"
    keywords:
      - "Private action eligibility"
      - "Cross-domain AI agents"
      - "Verifiable trust chain"
      - "Protected admission"
  - id: "revocation-containment-protocol"
    name: "Revocation, containment and verified closure protocol"
    content_url: "/assets/ai-safety-paper-3-revocation-containment-protocol.svg"
    alt: "An adverse evidence update blocks future AI-agent admissions while earlier remote effects remain pending until containment and verified closure."
    width: 2102
    height: 1106
    description: "A sequence model distinguishing future-action revocation from containment and verified closure of an already admitted remote effect."
    caption: "An adverse update can block future admission while an earlier remote effect remains pending. Revocation is therefore distinct from containment, kill-switch action and verified closure. Source: Spherity GmbH."
    credit_text: "Source: Spherity GmbH"
    keywords:
      - "AI agent revocation"
      - "Containment protocol"
      - "Pending effects"
      - "Verified closure"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"
license_scope: "This research page and the linked Paper 3 PDF"

image: "/assets/preview-private-verification-action-eligibility-trust-domains.webp"
image_alt: "AI Safety Paper 3 preview for private verification of action eligibility across trust domains."
image_mime: "image/webp"
image_width: 1200
image_height: 630

keywords:
  - "Private verification of action eligibility"
  - "Cross-domain AI agents"
  - "Evidence semantics"
  - "Private verification"
  - "Action eligibility"
  - "AI safety"
  - "AI agents"
  - "Trust domains"
  - "Controlled execution"
  - "Verifiable credentials"
  - "ODRL"
  - "A2A protocol"
  - "Model Context Protocol"
  - "Adverse evidence"
  - "Revocation and containment"
  - "Verifiable authority"
  - "Spherity AI Safety Series"

answer_summary: "The paper defines typed claims, recognition rules and a deterministic eligibility evaluator that binds an exact AI-agent operation to a versioned evidence view, including prohibitions and adverse findings. A separate protected admission controller and resource-specific effect adapter preserve local authority, replay safety, pending effects and containment across trust domains."
key_takeaways:
  - "Eligibility must bind the exact operation, continuation and evidence version; a general identity or capability claim is insufficient."
  - "Typed claims and explicit recognition rules prevent semantic mapping or delegation from silently expanding issuer scope."
  - "Revocation blocks future admissions but does not erase an effect already in flight; containment and verified closure need their own protocol."
  - "The paper validates reference logic and scenarios but does not present a deployed privacy-proof system or measured operational safety rate."
about:
  - "Private verification of AI-agent action eligibility"
  - "Cross-domain evidence semantics"
  - "Controlled execution across trust domains"
mentions:
  - "Verifiable credentials"
  - "ODRL policy"
  - "A2A protocol"
  - "Model Context Protocol"
  - "OpenClaw"
citations:
  - "https://www.w3.org/TR/vc-data-model-2.0/"
  - "https://www.w3.org/TR/odrl-model/"
  - "https://a2a-protocol.org/v1.0.0/specification/"
  - "https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization"
  - "https://www.rfc-editor.org/rfc/rfc9334.html"
  - "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng"
  - "https://doi.org/10.6028/NIST.AI.100-1"
audiences:
  - "AI safety, identity and privacy researchers"
  - "Cross-company AI-agent platform architects"
  - "Data-space, DPP and enterprise authorization teams"
spatial_coverage:
  - "European Union"
  - "Global"

series_name: "Governing AI That Acts Across Companies"
series_description: "A four-part AI Safety series connecting incentive-compatible protected execution, runtime assurance and private cross-domain verification."
series_url: "/governing-ai-that-acts-across-companies.html"
series_position: 3
series_items:
  - position: 0
    label: "Executive brief"
    title: "Governing AI That Acts Across Companies"
    url: "/governing-ai-that-acts-across-companies.html"
  - position: 1
    label: "Paper 1"
    title: "Program Equilibria and Protected Execution"
    url: "/resource-bounded-program-equilibria-ai-safety.html"
  - position: 2
    label: "Paper 2"
    title: "Risk-Bounded Runtime Assurance"
    url: "/risk-bounded-runtime-assurance-multi-agent-systems.html"
  - position: 3
    label: "Paper 3"
    title: "Private Verification across Trust Domains"
    url: "/private-verification-action-eligibility-trust-domains.html"

search_research:
  reviewed_on: "2026-09-28"
  source: "Google Trends"
  source_url: "https://trends.google.com/trends/explore"
  geographies:
    - "Germany"
    - "Worldwide"
  time_ranges:
    - "Past 12 months"
    - "Past 5 years"
  search_types:
    - "Web Search"
  authority_terms:
    - "Private verification of action eligibility"
    - "Cross-domain AI agents"
    - "Evidence semantics"
  discovery_terms:
    - "AI safety"
    - "AI agents"
    - "Agentic AI"
    - "Verifiable credentials"
  audience_questions:
    - "How can an AI agent prove exact action eligibility without exposing all underlying evidence?"
    - "How should revocation and containment work when a remote effect is already pending?"
  evidence:
    - comparison: "AI safety, agentic AI, AI governance, AI alignment and autonomous AI agents"
      input_type: "Search terms"
      geography: "Germany"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "AI safety, agentic AI and AI governance provide the strongest discovery language; private verification and action eligibility remain specialist authority terms."
  editorial_decisions:
    - "Use private verification and action eligibility in the title because they identify the paper's distinct protocol contribution."
    - "Pair the specialist terms with AI safety, AI agents and verifiable credentials for broader semantic discovery without implying a deployed zero-knowledge proof system."

questions_answered:
  - question: "What does private verification of action eligibility establish?"
    answer: "It establishes that a specific actor, operation and continuation satisfy a versioned set of recognized claims, prohibitions and adverse-evidence rules for a relying domain, while allowing the proof interface to disclose less than the full source evidence."
  - question: "Why must eligibility evaluation be separate from protected admission?"
    answer: "A pure evaluator can determine whether submitted evidence satisfies a policy, but only a serialized protected controller can prevent replay, reserve resources, bind the exact effect and update state atomically. Both layers are required."
  - question: "Does revocation stop an effect that is already pending?"
    answer: "Not by itself. Revocation can block future admission, while an earlier remote effect may still require a containment request, kill-switch action, compensating control and independently verified closure."
related_publications:
  - title: "Governing AI That Acts Across Companies"
    url: "/governing-ai-that-acts-across-companies.html"
    context: "The executive brief explains why private cross-domain verification is a leadership and deployment capability."
  - title: "Program Equilibria and Protected Execution"
    url: "/resource-bounded-program-equilibria-ai-safety.html"
    context: "Paper 1 supplies the deterministic protected controller pattern used at the resource boundary."
  - title: "Risk-Bounded Runtime Assurance"
    url: "/risk-bounded-runtime-assurance-multi-agent-systems.html"
    context: "Paper 2 provides the persistent episode and assurance state that eligibility decisions consume."
  - title: "Beyond Single-Enterprise ZTA"
    url: "/beyond-zero-trust-m-trust-authorised-agentic-actors.html"
    context: "Develops the wider M-Trust and verifiable-authority architecture for agentic networks."
  - title: "Verifiable, Access-Controlled Digital Product Passports"
    url: "/verifiable-access-controlled-digital-product-passports.html"
    context: "Applies organizational authority and evidence controls to cross-company product-data transactions."

toc_items:
  - title: "Download Paper 3"
    href: "#download-paper"
  - title: "Abstract"
    href: "#abstract"
  - title: "Cross-domain problem"
    href: "#cross-domain-problem"
  - title: "Eligibility semantics"
    href: "#eligibility-semantics"
  - title: "Reference architecture"
    href: "#reference-architecture"
  - title: "Revocation and containment"
    href: "#revocation-containment"
  - title: "Use cases and standards"
    href: "#use-cases-standards"
  - title: "Evidence and limits"
    href: "#evidence-limits"
  - title: "References"
    href: "#references"
  - title: "License and citation"
    href: "#license-and-citation"
  - title: "Questions answered"
    href: "#questions-answered"

tags:
  - trusted-ai
  - identity
  - resilience
  - ai-safety
  - private-verification
  - verifiable-credentials
---

<section class="paper-download-grid" id="download-paper" aria-labelledby="download-paper-title">
  <div class="paper-download">
    <h2 id="download-paper-title">Download Paper 3</h2>
    <a href="{{ page.pdf_url | relative_url }}">Download the full paper</a>
    <p>The typed evidence model, private eligibility protocol, deterministic evaluator, protected controller and cross-domain scenarios.</p>
  </div>
  <div class="paper-download">
    <h2>Start with the executive brief</h2>
    <a href="{{ '/Spherity-AI-Safety-Three-Paper-Series-Executive-Brief.pdf' | relative_url }}">Download the executive brief</a>
    <p>Read the leadership case and how all three technical papers form one AI Safety control chain.</p>
  </div>
</section>

<figure class="paper-figure centered-figure">
  <a href="{{ page.pdf_url | relative_url }}"><img src="{{ page.cover_image | relative_url }}" alt="{{ page.cover_image_alt }}" width="1241" height="1754"></a>
  <figcaption><strong>AI Safety Series — Paper 3.</strong> Private verification, evidence semantics and controlled execution for cross-organization agents. Published under CC BY 4.0.</figcaption>
</figure>

<section class="abstract-box" id="abstract" markdown="1">
<h2>Abstract</h2>

This paper develops a protocol for verifying exact AI-agent action eligibility across trust domains while limiting disclosure of underlying evidence. A versioned evidence view includes positive claims, prohibitions and adverse findings. Typed claims and explicit recognition rules preserve issuer scope across delegation and semantic mapping. A pure deterministic evaluator decides eligibility; a separate serialized admission controller prevents replay, reserves resources and binds the exact operation; and resource-specific adapters enforce the covered effect. Persistent logical operation identifiers and pending-effect state preserve accountability through cancellation, renewal and worker replacement.

<p class="keywords"><strong>Keywords:</strong> private verification; action eligibility; AI agents; trust domains; evidence semantics; verifiable credentials; controlled execution; revocation</p>
</section>

<h2 id="cross-domain-problem">The cross-domain problem</h2>

An agent may need to act in a domain that does not operate its identity provider, evidence registry or policy engine. The relying organization must decide whether to recognize foreign claims, how to interpret delegation, which adverse findings override positive evidence and how to enforce its own resource policy. Simply forwarding a credential bundle can disclose too much and still fail to establish exact action eligibility.

The paper therefore treats eligibility as a scoped statement about one actor, operation, evidence version and continuation. The relying domain remains sovereign: it chooses recognition rules and performs local protected admission even when source evidence originates elsewhere.

<h2 id="eligibility-semantics">Typed claims, recognition rules and exact-operation binding</h2>

Claims are typed by issuer, subject, scope, purpose, validity and evidence semantics. Recognition rules specify how a relying domain accepts or maps each claim. Prohibitions and adverse findings are first-class inputs rather than inconvenient exceptions hidden outside the proof.

The evaluator is pure and deterministic: the same evidence view and policy version produce the same eligibility decision. That makes it testable and auditable. It does not create an external effect. The admission controller separately serializes requests, checks operation IDs, reserves resources and commits the exact payload.

<h2 id="reference-architecture">Reference architecture for cross-domain controlled execution</h2>

{% assign cross_domain_figure = page.figure_objects[0] %}
{% include research-figure.html figure=cross_domain_figure number=1 %}

Each domain retains three distinct functions: eligibility evaluation, protected admission and resource-specific effect enforcement. Joint assurance can carry continuation and episode state across the boundary, but it does not eliminate local authority. Outcome records flow back into the evidence view so later actions can account for what actually occurred.

This pattern applies to B2B procurement agents, data-space access, Digital Product Passport disclosures, cross-provider agent tools and industrial workflows where no single organization controls the complete trust chain.

<h2 id="revocation-containment">Revocation, containment and verified closure</h2>

{% assign containment_figure = page.figure_objects[1] %}
{% include research-figure.html figure=containment_figure number=2 %}

An adverse update can immediately block future admissions. It cannot retroactively cancel an effect that another system has already accepted. Cross-domain safety therefore needs explicit containment messages, local kill-switch or compensation logic, durable pending-effect identifiers and evidence of verified closure.

This is especially important for long-running tools, shipments, data releases and physical operations. The protocol must distinguish *no longer eligible to start* from *confirmed to have stopped*.

<h2 id="use-cases-standards">Use cases and standards alignment</h2>

- **Enterprise agent tools:** a corporate agent proves mandate and policy-conforming purpose before a remote tool accepts a bounded operation.
- **Data spaces and DPPs:** a relying party checks organizational role, purpose and product-related entitlement without exposing unrelated credentials.
- **OpenClaw-style orchestration:** tool access is mediated by exact operation IDs, bounded scope and durable action receipts rather than a broad bearer token.
- **Industrial and financial workflows:** adverse evidence, revocation and pending effects remain visible across organizational boundaries.

The paper proposes an A2A extension using [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model-2.0/) and a bounded [ODRL](https://www.w3.org/TR/odrl-model/) profile. It also relates the design to the [A2A protocol](https://a2a-protocol.org/v1.0.0/specification/), [Model Context Protocol authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) and remote-attestation architecture. These references provide interoperability building blocks; they do not by themselves implement the complete safety protocol.

<h2 id="evidence-limits">Evaluation evidence and limits</h2>

The reported controller exploration covers 16,020 states and 60,238 transitions against nine invariants. Eight omission variants yield counterexamples, and 29 plaintext reference-gate scenarios exercise positive and adverse evidence paths.

The work does not report a deployed privacy-proof implementation, measured operational safety probabilities or general AI alignment. Cryptographic proof-system selection, performance, revocation distribution, policy governance and production adversarial testing remain implementation responsibilities.

<h2 id="references">Selected references</h2>

1. W3C, [Verifiable Credentials Data Model v2.0](https://www.w3.org/TR/vc-data-model-2.0/).
2. W3C, [ODRL Information Model 2.2](https://www.w3.org/TR/odrl-model/).
3. A2A Project, [Agent2Agent Protocol Specification](https://a2a-protocol.org/v1.0.0/specification/).
4. Model Context Protocol, [Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization).
5. IETF, [RFC 9334: Remote ATtestation procedureS Architecture](https://www.rfc-editor.org/rfc/rfc9334.html).
6. European Union, [Artificial Intelligence Act](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng).
7. NIST, [Artificial Intelligence Risk Management Framework](https://doi.org/10.6028/NIST.AI.100-1).

<h2 id="how-to-cite">How to cite Paper 3</h2>

Stöcker, Carsten (2026). *Private Verification of Action Eligibility across Trust Domains: AI Safety—Evidence Semantics and Controlled Execution for Cross Organisation Agents.* Spherity GmbH. <https://spherity.github.io/spherity-research/private-verification-action-eligibility-trust-domains.html>. Licensed CC BY 4.0.
