---
publication_template_version: 2
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "Risk-Bounded Runtime Assurance for Dynamic Multi-Agent Systems under Partial Observation"
seo_title: "Runtime Assurance for Dynamic Multi-Agent Systems"
og_title: "Risk-Bounded Runtime Assurance | AI Safety Paper 2"
og_description: "A runtime supervisor for AI-agent actions under partial observation, current mandates, assurance leases, worker churn and episode risk."
subtitle: "AI Safety: Verifiable Identity and Evidence for Bounded Cross-Organisation Autonomy"
description: "A runtime supervisor for AI-agent actions under partial observation, current mandates, assurance leases, worker churn and persistent episode risk."

paper_status: "Spherity AI Safety Series — Paper 2 of 3"
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
research_cutoff_label: "Research and implementation evidence reviewed to this date"
lang: "en"

permalink: /risk-bounded-runtime-assurance-multi-agent-systems.html
canonical_url: "https://spherity.github.io/spherity-research/risk-bounded-runtime-assurance-multi-agent-systems.html"
latest_version: "https://spherity.github.io/spherity-research/risk-bounded-runtime-assurance-multi-agent-systems.html"

pdf_url: "/Spherity-AI-Safety-Series-Paper-2-Runtime-Assurance.pdf"
associated_media:
  - name: "Risk-Bounded Runtime Assurance — Paper 2 PDF"
    url: "/Spherity-AI-Safety-Series-Paper-2-Runtime-Assurance.pdf"
    cover_image: "/assets/ai-safety-paper-2-runtime-assurance-cover.jpg"
    license: "https://creativecommons.org/licenses/by/4.0/"
cover_image: "/assets/ai-safety-paper-2-runtime-assurance-cover.jpg"
cover_image_alt: "First page of Risk-Bounded Runtime Assurance for Dynamic Multi-Agent Systems under Partial Observation."

figure_objects:
  - id: "authority-assurance-execution"
    name: "Current authority and action-bound assurance before execution"
    content_url: "/assets/ai-safety-paper-2-authority-assurance-execution.svg"
    alt: "A protected gateway admits an AI-agent action only when both current mandate and action-bound assurance are valid."
    width: 2412
    height: 1692
    description: "The Paper 2 control pattern joins current organizational authority with action-specific runtime assurance at the protected execution gateway."
    caption: "Current mandate and action-bound assurance meet at a protected execution gateway. Identity or a proof alone does not establish the hidden operating state; both eligibility inputs must be current for the exact action. Source: Spherity GmbH."
    credit_text: "Source: Spherity GmbH"
    keywords:
      - "Runtime assurance"
      - "Current mandate"
      - "Action-bound assurance"
      - "Protected execution gateway"
  - id: "hidden-state-belief"
    name: "Hidden operating state and supervisor belief"
    content_url: "/assets/ai-safety-paper-2-hidden-state-belief.svg"
    alt: "A partially observed supervisor maintains a belief over hidden operating conditions and the probability of undetected prior harm."
    width: 2412
    height: 1620
    description: "A conceptual model distinguishing hidden operating conditions from the supervisor's evidence-based belief and undetected-harm account."
    caption: "The real operating condition is partly hidden, while the supervisor acts on an evidence-based belief and a bound for undetected prior harm. A quiet or signed report can update belief but cannot reveal hidden state by itself. Source: Spherity GmbH."
    credit_text: "Source: Spherity GmbH"
    keywords:
      - "Partial observation"
      - "Belief state"
      - "Undetected harm probability"
      - "AI assurance lease"
  - id: "deployment-responsibilities"
    name: "Runtime-assurance responsibilities across deployment patterns"
    content_url: "/assets/ai-safety-paper-2-deployment-responsibilities.svg"
    alt: "Provider-managed, independently operated and hybrid cloud-edge AI deployments assign assurance, enforcement and response duties differently."
    width: 2412
    height: 2520
    description: "A deployment comparison showing where protected eligibility gates, episode accounting, oversight and local response belong across three operating models."
    caption: "Provider-managed, independently operated and hybrid cloud-edge deployments place responsibility in different locations. Each protected effect still needs an eligibility gate, persistent episode accounting, oversight and a local response path. Source: Spherity GmbH."
    credit_text: "Source: Spherity GmbH"
    keywords:
      - "AI deployment responsibility"
      - "Cloud-edge AI assurance"
      - "Cross-company AI operations"
      - "Kill switch governance"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"
license_scope: "This research page and the linked Paper 2 PDF"

image: "/assets/preview-risk-bounded-runtime-assurance-multi-agent-systems.webp"
image_alt: "AI Safety Paper 2 preview for risk-bounded runtime assurance in dynamic multi-agent systems."
image_mime: "image/webp"
image_width: 1200
image_height: 630

keywords:
  - "Risk-bounded runtime assurance"
  - "Dynamic multi-agent systems"
  - "Action-bound assurance leases"
  - "Runtime assurance"
  - "AI safety"
  - "AI agents"
  - "Partial observation"
  - "Episode risk accounting"
  - "Persistent risk budget"
  - "Worker churn"
  - "Pending effects"
  - "Verifiable identity"
  - "Cross-organisation autonomy"
  - "Agentic AI"
  - "AI governance"
  - "Spherity AI Safety Series"

answer_summary: "The paper defines a protected runtime supervisor that admits an AI-agent action only when current mandate and an action-bound assurance lease both hold. Under stated calibration and model-coverage assumptions, a persistent episode account bounds first-harm probability even as agents join, retire or are replaced and effects remain pending."
key_takeaways:
  - "Current authority and runtime assurance are complementary: neither can substitute for the other at the execution boundary."
  - "Episode risk, shared dependencies and pending effects must persist across worker replacement; resetting a worker must not reset responsibility."
  - "Assurance leases bind evidence, action, time, model state and continuation allowance instead of granting open-ended approval."
  - "The theorem is conditional on calibration and model coverage and is not a measured field-safety guarantee."
about:
  - "Risk-bounded runtime assurance"
  - "Dynamic multi-agent systems"
  - "Bounded cross-organization autonomy"
mentions:
  - "Partial observation"
  - "Action-bound assurance leases"
  - "Episode risk accounting"
  - "Cloud-edge AI"
citations:
  - "https://doi.org/10.6028/NIST.AI.100-1"
  - "https://doi.org/10.6028/NIST.SP.800-207"
  - "https://www.rfc-editor.org/rfc/rfc9334.html"
  - "https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/"
  - "https://www.w3.org/TR/vc-data-model-2.0/"
  - "https://www.w3.org/TR/did-core/"
audiences:
  - "AI safety and assurance researchers"
  - "AI platform, cloud and edge architects"
  - "Enterprise risk, security and operations leaders"
spatial_coverage:
  - "European Union"
  - "Global"

series_name: "Governing AI That Acts Across Companies"
series_description: "A four-part AI Safety series connecting incentive-compatible protected execution, runtime assurance and private cross-domain verification."
series_url: "/governing-ai-that-acts-across-companies.html"
series_position: 2
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
    - "Risk-bounded runtime assurance"
    - "Action-bound assurance leases"
    - "Episode risk accounting"
  discovery_terms:
    - "AI safety"
    - "AI agents"
    - "Multi-agent systems"
    - "AI governance"
  audience_questions:
    - "How can runtime assurance bound AI-agent risk under partial observation?"
    - "How should assurance state survive agent replacement and delayed effects?"
  evidence:
    - comparison: "AI safety, AI agents, runtime assurance, multi-agent systems and zero trust"
      input_type: "Search terms"
      geography: "Germany"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "Runtime assurance was below the Trends reporting threshold, so AI safety and AI agents provide discovery while the exact technical term remains the authority target."
  editorial_decisions:
    - "Use runtime assurance prominently because it is the paper's established technical category even where public search volume is low."
    - "Pair the authority term with AI safety, AI agents and multi-agent systems to explain the contribution to broader audiences."

questions_answered:
  - question: "What is risk-bounded runtime assurance for AI agents?"
    answer: "It is a protected admission process that evaluates current authority, action-specific evidence, a partially observed operating state and remaining episode risk before permitting an external effect, then updates the persistent account from outcomes."
  - question: "Why must episode risk survive worker replacement?"
    answer: "Replacing an agent process does not remove earlier exposure, shared dependencies or effects that are still pending. Resetting the risk account with the worker would let a system spend the same continuation allowance repeatedly."
  - question: "Does the paper prove that a deployed multi-agent system is safe?"
    answer: "No. The first-harm bound is conditional on calibration, model-bank coverage, protected enforcement and other stated assumptions. The synthetic evaluation tests the controller logic but does not replace field measurement or general alignment evidence."
related_publications:
  - title: "Governing AI That Acts Across Companies"
    url: "/governing-ai-that-acts-across-companies.html"
    context: "The executive brief places runtime assurance within a leadership and first-mover strategy."
  - title: "Program Equilibria and Protected Execution"
    url: "/resource-bounded-program-equilibria-ai-safety.html"
    context: "Paper 1 establishes the deterministic protected execution boundary on which Paper 2 builds."
  - title: "Private Verification across Trust Domains"
    url: "/private-verification-action-eligibility-trust-domains.html"
    context: "Paper 3 makes evidence and action eligibility portable across organizational trust domains."
  - title: "PACE for Physical AI"
    url: "/physical-ai-compliance-evidence-pace.html"
    context: "Applies verifiable safety, cyber and AI evidence to configuration-bound Physical AI assurance."

toc_items:
  - title: "Download Paper 2"
    href: "#download-paper"
  - title: "Abstract"
    href: "#abstract"
  - title: "Runtime assurance problem"
    href: "#runtime-problem"
  - title: "Authority and assurance"
    href: "#authority-assurance"
  - title: "Partial observation"
    href: "#partial-observation"
  - title: "Persistent episode risk"
    href: "#episode-risk"
  - title: "Deployment patterns"
    href: "#deployment-patterns"
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
  - runtime-assurance
  - multi-agent-systems
---

<section class="paper-download-grid" id="download-paper" aria-labelledby="download-paper-title">
  <div class="paper-download">
    <h2 id="download-paper-title">Download Paper 2</h2>
    <a href="{{ page.pdf_url | relative_url }}">Download the full paper</a>
    <p>The runtime supervisor, assurance leases, first-harm theorem, synthetic scenarios, state exploration and omission counterexamples.</p>
  </div>
  <div class="paper-download">
    <h2>Start with the executive brief</h2>
    <a href="{{ '/Spherity-AI-Safety-Three-Paper-Series-Executive-Brief.pdf' | relative_url }}">Download the executive brief</a>
    <p>Read the leadership case and how all three technical papers form one AI Safety control chain.</p>
  </div>
</section>

<figure class="paper-figure centered-figure">
  <a href="{{ page.pdf_url | relative_url }}"><img src="{{ page.cover_image | relative_url }}" alt="{{ page.cover_image_alt }}" width="1241" height="1754"></a>
  <figcaption><strong>AI Safety Series — Paper 2.</strong> Risk-bounded runtime assurance for dynamic multi-agent systems under partial observation. Published under CC BY 4.0.</figcaption>
</figure>

<section class="abstract-box" id="abstract" markdown="1">
<h2>Abstract</h2>

This paper develops a protected runtime supervisor for dynamic multi-agent systems operating with incomplete information. The supervisor admits an external action only when the actor holds a current mandate and an action-bound assurance lease remains valid for the exact proposal. It retains evidence, shared dependencies, pending effects and a persistent episode-risk account as workers join, retire or are replaced. Under explicit calibration and model-coverage assumptions, the paper derives a bound on first-harm probability and tests the controller with synthetic scenarios, state exploration and omission counterexamples.

<p class="keywords"><strong>Keywords:</strong> runtime assurance; AI safety; multi-agent systems; partial observation; assurance lease; episode risk; verifiable identity; bounded autonomy</p>
</section>

<h2 id="runtime-problem">The runtime assurance problem</h2>

Authorization can be valid while operating evidence becomes stale. A model can be capable while the environment moves outside its assessed envelope. A worker can be replaced while its earlier actions remain pending. Static approval therefore cannot govern a dynamic cross-company episode.

The proposed supervisor treats every protected external action as a new admission decision. It evaluates the current mandate, the evidence view, the action, remaining risk allowance and unresolved outcomes. This is a stateful control problem, not a one-time model certification.

<h2 id="authority-assurance">Current authority plus action-bound assurance</h2>

{% assign authority_figure = page.figure_objects[0] %}
{% include research-figure.html figure=authority_figure number=1 %}

A valid mandate answers who may act and within which scope. An assurance lease answers whether a specified action remains justified under current evidence, time, model state and continuation allowance. The protected gateway requires both. This prevents an identity credential from being mistaken for safety evidence, and prevents an assurance result from granting legal or organizational authority.

<h2 id="partial-observation">Partial observation and hidden operating conditions</h2>

{% assign belief_figure = page.figure_objects[1] %}
{% include research-figure.html figure=belief_figure number=2 %}

The supervisor cannot observe every relevant condition directly. It maintains a belief over a finite model bank and separately accounts for the possibility that harm has already occurred without detection. Signed reports improve provenance but do not make the hidden state observable. Silence is evidence only under an explicitly calibrated observation model.

This distinction matters for remote industrial systems, independent model providers and cross-company data releases. The assurance layer must state what a signal can establish, how quickly evidence becomes stale and what conservative response applies when coverage is uncertain.

<h2 id="episode-risk">Persistent episode risk, pending effects and worker churn</h2>

The episode account permanently debits the continuation bound associated with admitted actions. It also retains dependencies and pending effects until verified closure. A worker may retire, crash or be replaced, but its contribution to episode exposure remains. That property prevents identity rotation or process churn from resetting the safety budget.

Suitable operational controls include action-specific leases, bounded time-to-live, idempotent operation IDs, verified effect closure, independent incident signals and a kill switch whose authority, scope and latency are tested rather than assumed.

<h2 id="deployment-patterns">Deployment responsibilities and use cases</h2>

{% assign deployment_figure = page.figure_objects[2] %}
{% include research-figure.html figure=deployment_figure number=10 %}

- **Provider-managed systems** place more assurance and resource control within the platform, but customers still need clear acceptance criteria and outcome evidence.
- **Independently operated systems** require portable identity, evidence and incident semantics because no single provider owns the full control loop.
- **Hybrid cloud-edge systems** must coordinate remote models and local protected effects; the edge cannot outsource immediate response to an unavailable cloud service.
- **Cross-company data release** can treat disclosure as an external effect, requiring mandate, purpose, evidence and episode constraints before release.

The architecture assigns responsibility instead of centralizing all authority. Each resource owner maintains a protected local decision while the episode account preserves shared constraints and evidence.

<h2 id="evidence-limits">Evaluation evidence and limits</h2>

The paper evaluates 432 synthetic scenarios comprising 120,060 terminal histories. The maximum reported first-harm rate is 3.73% against a 5% test threshold. A controller abstraction reaches 24,448 states, and twelve omission variants produce counterexamples.

These are design-validation results, not field calibration. They depend on the modeled state space, observation semantics, calibration quality, independence assumptions and complete mediation of relevant effects. Unmodeled dynamics, correlated evidence failures and physical hazards require separate treatment.

<h2 id="references">Selected references</h2>

1. NIST, [Artificial Intelligence Risk Management Framework (AI RMF 1.0)](https://doi.org/10.6028/NIST.AI.100-1).
2. NIST, [Zero Trust Architecture, SP 800-207](https://doi.org/10.6028/NIST.SP.800-207).
3. IETF, [RFC 9334: Remote ATtestation procedureS Architecture](https://www.rfc-editor.org/rfc/rfc9334.html).
4. SPIFFE, [SPIFFE Concepts](https://spiffe.io/docs/latest/spiffe-about/spiffe-concepts/).
5. W3C, [Verifiable Credentials Data Model v2.0](https://www.w3.org/TR/vc-data-model-2.0/).
6. W3C, [Decentralized Identifiers v1.0](https://www.w3.org/TR/did-core/).

<h2 id="how-to-cite">How to cite Paper 2</h2>

Stöcker, Carsten (2026). *Risk-Bounded Runtime Assurance for Dynamic Multi-Agent Systems under Partial Observation: AI Safety—Verifiable Identity and Evidence for Bounded Cross-Organisation Autonomy.* Spherity GmbH. <https://spherity.github.io/spherity-research/risk-bounded-runtime-assurance-multi-agent-systems.html>. Licensed CC BY 4.0.
