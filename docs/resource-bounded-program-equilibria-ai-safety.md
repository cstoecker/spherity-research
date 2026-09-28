---
publication_template_version: 2
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "Resource Bounded Program Equilibria under Cryptographic Commitments and Revocable Authority"
seo_title: "Program Equilibria and Protected AI Execution"
og_title: "Program Equilibria and Protected Execution | AI Safety Paper 1"
og_description: "A formal and executable design for incentive-compatible AI-agent interaction under current authority, shared budgets and exact-action controls."
subtitle: "AI Safety: Safeguarding Multi-Agent Interactions through Deterministic State Controllers"
description: "A formal and executable design for incentive-compatible AI-agent interaction under current authority, aggregate budgets and exact-action controls."

paper_status: "Spherity AI Safety Series — Paper 1 of 3"
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

permalink: /resource-bounded-program-equilibria-ai-safety.html
canonical_url: "https://spherity.github.io/spherity-research/resource-bounded-program-equilibria-ai-safety.html"
latest_version: "https://spherity.github.io/spherity-research/resource-bounded-program-equilibria-ai-safety.html"

pdf_url: "/Spherity-AI-Safety-Series-Paper-1-Program-Equilibria.pdf"
associated_media:
  - name: "Resource Bounded Program Equilibria — Paper 1 PDF"
    url: "/Spherity-AI-Safety-Series-Paper-1-Program-Equilibria.pdf"
    license: "https://creativecommons.org/licenses/by/4.0/"
cover_image: "/assets/ai-safety-paper-1-program-equilibria-cover.jpg"
cover_image_alt: "First page of Resource Bounded Program Equilibria under Cryptographic Commitments and Revocable Authority."

figure_objects:
  - id: "protected-execution-controller"
    name: "Protected execution controller for exact AI-agent actions"
    content_url: "/assets/ai-safety-paper-1-protected-execution-controller.svg"
    alt: "Agent proposals pass through policy, proof and protected controller checks before a covered resource executes the exact approved action."
    width: 2340
    height: 2214
    description: "The Paper 1 reference architecture separates proposal generation from protected verification, authority checks, reservation, commit and exact covered effects."
    caption: "Proposal generation is separated from controlled execution. The protected controller checks the exact action, evidence, current authority, delegation scope and resources before reservation and commit. The covered resource has no bypass around the protected path. Source: Spherity GmbH."
    credit_text: "Source: Spherity GmbH"
    keywords:
      - "Protected AI execution"
      - "Deterministic state controller"
      - "Exact-action binding"
      - "AI agent authority"
  - id: "five-controller-guards"
    name: "Five controller guards for shared resource allocation"
    content_url: "/assets/ai-safety-paper-1-five-controller-guards.svg"
    alt: "Five guards check aggregate reservation, authority epoch, version, operation identifier and exact action payload for a shared booking."
    width: 2340
    height: 2196
    description: "A worked shared-budget example showing how five independent guards prevent overspend, stale authority, replay and action substitution."
    caption: "Five controller guards protect a shared resource: aggregate reservation, current authority epoch, controller version, unused logical operation identifier and exact action payload. Removing any one guard produces a concrete counterexample in the evaluated model. Source: Spherity GmbH."
    credit_text: "Source: Spherity GmbH"
    keywords:
      - "Aggregate budget control"
      - "Revocable authority"
      - "Replay prevention"
      - "Program equilibrium"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"
license_scope: "This research page and the linked Paper 1 PDF"

image: "/assets/preview-resource-bounded-program-equilibria-ai-safety.webp"
image_alt: "AI Safety Paper 1 preview for resource-bounded program equilibria and protected execution."
image_mime: "image/webp"
image_width: 1200
image_height: 630

keywords:
  - "Resource-bounded program equilibria"
  - "Protected execution"
  - "Deterministic state controllers"
  - "Program equilibrium"
  - "AI safety"
  - "AI agents"
  - "Multi-agent systems"
  - "Cryptographic commitments"
  - "Revocable authority"
  - "Exact-action binding"
  - "Aggregate budget control"
  - "Delegation scope"
  - "Replay prevention"
  - "Agentic AI"
  - "AI governance"
  - "Spherity AI Safety Series"

answer_summary: "The paper defines a finite resource-bounded program game and a protected deterministic controller that separates incentives from current authority, evidence and external effects. Under explicit assumptions, it gives an exact unilateral-deviation criterion and verifies that epoch, version, action, delegation, replay and aggregate-budget guards are jointly necessary for the modeled execution path."
key_takeaways:
  - "A strategically stable agent program still needs an external protected controller because equilibrium does not establish current authority or safe effects."
  - "Reservations must count against aggregate budgets before effects commit; per-action checks alone allow parallel overspend."
  - "Authority epochs, controller versions, logical operation identifiers and exact payload binding prevent stale approval, replay and action substitution."
  - "The evaluation covers specified finite games and mediated digital effects, not general alignment or physical-world safety."
about:
  - "Resource-bounded program equilibria"
  - "Protected AI-agent execution"
  - "Revocable authority and shared budgets"
mentions:
  - "Cryptographic commitments"
  - "Deterministic state controllers"
  - "Multi-agent systems"
  - "Compute-resource booking"
citations:
  - "https://arxiv.org/abs/0809.0024"
  - "https://doi.org/10.6028/NIST.SP.800-207"
  - "https://www.w3.org/TR/vc-data-model-2.0/"
audiences:
  - "AI safety and multi-agent researchers"
  - "AI platform and security architects"
  - "Enterprise authorization and control teams"
spatial_coverage:
  - "European Union"
  - "Global"

series_name: "Governing AI That Acts Across Companies"
series_description: "A four-part AI Safety series connecting incentive-compatible protected execution, runtime assurance and private cross-domain verification."
series_url: "/governing-ai-that-acts-across-companies.html"
series_position: 1
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
    - "Resource-bounded program equilibria"
    - "Protected execution"
    - "Deterministic state controllers"
  discovery_terms:
    - "AI safety"
    - "AI agents"
    - "Multi-agent systems"
    - "Agentic AI"
  audience_questions:
    - "How can AI-agent incentives be combined with revocable authority and shared resource limits?"
    - "Which controller checks prevent replay, stale authority and aggregate overspend?"
  evidence:
    - comparison: "AI safety, AI agents, runtime assurance, multi-agent systems and zero trust"
      input_type: "Search terms"
      geography: "Germany"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "AI safety and AI agents supplied the strongest discovery language; multi-agent systems was low-volume and retained for technical precision."
  editorial_decisions:
    - "Lead with program equilibria and protected execution because they describe the paper's distinct contribution."
    - "Connect the specialist terms to AI safety, AI agents and multi-agent systems for understandable discovery without overstating scope."

questions_answered:
  - question: "What is a resource-bounded program equilibrium?"
    answer: "It is a modeled interaction in which programs choose actions under explicit computational and implementation costs, and no participant benefits from an allowed unilateral program deviation under the stated game, commitment and authority assumptions."
  - question: "Why is a protected controller needed if the programs are in equilibrium?"
    answer: "Equilibrium describes incentives inside the specified game; it does not prove that authority is current, evidence is valid, aggregate resources remain available or the executed payload matches the approved action. The protected controller enforces those external conditions."
  - question: "Which guards are essential in the shared-resource example?"
    answer: "The model requires aggregate reservation, current authority epoch, controller version, unused logical operation identifier and exact action-payload checks. Omission testing produces a specific violation when each guard is removed."
related_publications:
  - title: "Governing AI That Acts Across Companies"
    url: "/governing-ai-that-acts-across-companies.html"
    context: "The executive brief explains how Paper 1 fits the wider leadership and cross-company AI safety programme."
  - title: "Risk-Bounded Runtime Assurance"
    url: "/risk-bounded-runtime-assurance-multi-agent-systems.html"
    context: "Paper 2 extends protected admission with ongoing assurance under partial observation and worker churn."
  - title: "Private Verification across Trust Domains"
    url: "/private-verification-action-eligibility-trust-domains.html"
    context: "Paper 3 makes exact eligibility portable across domains while limiting evidence disclosure."
  - title: "European Business Wallets as a Zero-Trust Control Plane for AI Agents"
    url: "/ebw-zero-trust-ai-agents.html"
    context: "Provides the organizational identity and mandate layer for enterprise AI-agent authorization."

toc_items:
  - title: "Download Paper 1"
    href: "#download-paper"
  - title: "Abstract"
    href: "#abstract"
  - title: "Core result"
    href: "#core-result"
  - title: "Protected execution"
    href: "#protected-execution"
  - title: "Shared compute use case"
    href: "#shared-compute"
  - title: "Five controller guards"
    href: "#five-guards"
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
  - multi-agent-systems
  - protected-execution
---

<section class="paper-download-grid" id="download-paper" aria-labelledby="download-paper-title">
  <div class="paper-download">
    <h2 id="download-paper-title">Download Paper 1</h2>
    <a href="{{ page.pdf_url | relative_url }}">Download the full paper</a>
    <p>The formal model, exact deviation criterion, deterministic controller, exhaustive test space and omission counterexamples.</p>
  </div>
  <div class="paper-download">
    <h2>Start with the executive brief</h2>
    <a href="{{ '/Spherity-AI-Safety-Three-Paper-Series-Executive-Brief.pdf' | relative_url }}">Download the executive brief</a>
    <p>Read the leadership case and how all three technical papers form one AI Safety control chain.</p>
  </div>
</section>

<figure class="paper-figure centered-figure">
  <a href="{{ page.pdf_url | relative_url }}"><img src="{{ page.cover_image | relative_url }}" alt="{{ page.cover_image_alt }}" width="1241" height="1754"></a>
  <figcaption><strong>AI Safety Series — Paper 1.</strong> Formal and executable safeguards for resource-bounded multi-agent interaction. Published under CC BY 4.0.</figcaption>
</figure>

<section class="abstract-box" id="abstract" markdown="1">
<h2>Abstract</h2>

This paper studies finite resource-bounded program games mediated by a protected deterministic execution controller. It separates four questions that are often conflated: whether a program has an incentive to deviate, whether its authority is current, whether its evidence is acceptable, and whether a proposed external effect remains within shared resource limits. The paper derives an exact unilateral-deviation criterion that includes implementation costs and revocation, then verifies controller properties for current authority, aggregate budget, exact action, delegation scope and replay resistance.

<p class="keywords"><strong>Keywords:</strong> resource-bounded program equilibrium; protected execution; deterministic controller; AI agents; shared budgets; revocable authority; exact-action binding</p>
</section>

<h2 id="core-result">Core result: incentives and execution are different safety claims</h2>

Program equilibrium asks whether an agent benefits by switching to another available program under the modeled payoffs and costs. Protected execution asks whether a particular external effect is currently authorized, evidenced and affordable. A safe architecture must answer both questions independently.

The paper's exact criterion makes implementation cost and revocation visible in the deviation calculation. That improves analytical clarity, but it remains conditional on the specified finite game and available deviations. The controller then provides a separate stateful boundary that agents cannot bypass.

<h2 id="protected-execution">Protected execution architecture</h2>

The agent proposes an action. A narrow policy kernel and optional proof mechanism produce evidence for that exact proposal. A protected verifier/controller checks authority, delegation scope, version, operation identity and aggregate resources before reservation and commit. The covered resource executes only the committed payload and returns an outcome record.

{% assign protected_controller_figure = page.figure_objects[0] %}
{% include research-figure.html figure=protected_controller_figure number=1 %}

This separation makes the trust boundary explicit. A persuasive agent message, a valid signature or a successful proof is not itself permission to create an external effect. Permission exists only when the protected state transition accepts the exact action under the current state.

<h2 id="shared-compute">Use case: two organizations jointly book constrained compute</h2>

Consider two engineering organizations whose agents jointly reserve a limited compute pool. Each request may be individually below a threshold while simultaneous requests exceed the shared budget. The controller therefore reserves capacity before commit and counts pending reservations against the same aggregate limit. If a request fails, is canceled or its authority changes, the state machine governs release rather than trusting the requesting agent to clean up.

The same pattern applies to test facilities, shared procurement limits, emissions budgets, API quotas and other resources where cross-company concurrency can create an aggregate violation.

<h2 id="five-guards">Five controller guards and why each matters</h2>

{% assign guard_figure = page.figure_objects[1] %}
{% include research-figure.html figure=guard_figure number=4 %}

The evaluated controller uses five independent protections:

1. **Aggregate reservation** counts committed and pending use before admitting another action.
2. **Current authority epoch** invalidates approvals from an earlier mandate state.
3. **Controller version** prevents evidence created for an obsolete policy or implementation from being replayed.
4. **Unused logical operation ID** makes retries idempotent and blocks duplicate effects.
5. **Exact payload binding** prevents a proof or approval for one action from authorizing a substituted action.

The paper removes each control in turn and gives a concrete counterexample. This is important engineering evidence: it shows not only that the full design passes its modeled invariants, but also why a superficially simpler design fails.

<h2 id="evidence-limits">Evaluation evidence and limits</h2>

The analysis checks 38,880 parameter combinations. Controller abstractions contain 1,427 and 1,819 reachable states in the reported configurations, and five omission variants yield explicit violations. These results support the stated finite model and controller logic.

They do not establish general AI alignment, policy correctness, physical safety, robustness to every implementation defect or safe behavior outside the controller's mediated effects. Deployment requires independent implementation review, adversarial testing, operational monitoring and careful definition of which resources truly have no bypass.

<h2 id="references">Selected references</h2>

1. Halpern and Pass, [Algorithmic Rationality: Game Theory with Costly Computation](https://arxiv.org/abs/0809.0024).
2. NIST, [Zero Trust Architecture, SP 800-207](https://doi.org/10.6028/NIST.SP.800-207).
3. W3C, [Verifiable Credentials Data Model v2.0](https://www.w3.org/TR/vc-data-model-2.0/).

<h2 id="how-to-cite">How to cite Paper 1</h2>

Stöcker, Carsten (2026). *Resource Bounded Program Equilibria under Cryptographic Commitments and Revocable Authority: AI Safety—Safeguarding Multi-Agent Interactions through Deterministic State Controllers.* Spherity GmbH. <https://spherity.github.io/spherity-research/resource-bounded-program-equilibria-ai-safety.html>. Licensed CC BY 4.0.
