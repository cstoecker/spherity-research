---
publication_template_version: 2
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "Governing AI That Acts Across Companies"
seo_title: "AI Safety for Agents Acting Across Companies"
og_title: "Governing AI That Acts Across Companies | AI Safety Series"
og_description: "A four-part Spherity research series on protected execution, runtime assurance and private verification for safe cross-company AI agents."
subtitle: "How responsible leaders build first-mover advantage through AI safety and alignment"
description: "An executive brief and three-paper series on protected execution, runtime assurance and private verification for cross-company AI agents."

paper_status: "Spherity AI Safety Series — Executive Brief"
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
research_cutoff_label: "Research, incidents, standards and implementation evidence reviewed to this date"
lang: "en"

permalink: /governing-ai-that-acts-across-companies.html
canonical_url: "https://spherity.github.io/spherity-research/governing-ai-that-acts-across-companies.html"
latest_version: "https://spherity.github.io/spherity-research/governing-ai-that-acts-across-companies.html"

pdf_url: "/Spherity-AI-Safety-Three-Paper-Series-Executive-Brief.pdf"
associated_media:
  - name: "Governing AI That Acts Across Companies — Executive Brief"
    url: "/Spherity-AI-Safety-Three-Paper-Series-Executive-Brief.pdf"
    license: "https://creativecommons.org/licenses/by/4.0/"
  - name: "Paper 1 — Resource Bounded Program Equilibria"
    url: "/Spherity-AI-Safety-Series-Paper-1-Program-Equilibria.pdf"
    license: "https://creativecommons.org/licenses/by/4.0/"
  - name: "Paper 2 — Runtime Assurance"
    url: "/Spherity-AI-Safety-Series-Paper-2-Runtime-Assurance.pdf"
    license: "https://creativecommons.org/licenses/by/4.0/"
  - name: "Paper 3 — Private Verification"
    url: "/Spherity-AI-Safety-Series-Paper-3-Private-Verification.pdf"
    license: "https://creativecommons.org/licenses/by/4.0/"
cover_image: "/assets/ai-safety-series-executive-brief-cover.jpg"
cover_image_alt: "First page of the Spherity executive brief Governing AI That Acts Across Companies."

figure_objects:
  - id: "shared-job-protected-boundaries"
    name: "Shared cross-company AI job with protected resource boundaries"
    content_url: "/assets/ai-safety-executive-shared-job-protected-boundaries.svg"
    alt: "Two organizations use separate protected controllers for a shared AI job, with agreed scope, a joint safety plan and controlled outcome records."
    width: 936
    height: 712
    description: "A cross-company AI safety reference model showing how proposals, evidence, local protected controllers, resource boundaries and joint assurance interact."
    caption: "One shared job and two protected resource boundaries. Each LLM proposes; its protected controller checks evidence, approves against current state and enforces at the resource. Dashed lines carry agreed scope and the joint safety plan. Green arrows show controlled effects and outcome records. The joint assurance model must cover both organizations; two local approvals alone do not establish joint safety. Source: Spherity GmbH."
    credit_text: "Source: Spherity GmbH"
    keywords:
      - "Cross-company AI safety"
      - "Protected execution controller"
      - "Joint assurance model"
      - "AI agent governance"
  - id: "managed-agent-swarm-platform"
    name: "Managed agent-swarm platform with protected episode controls"
    content_url: "/assets/ai-safety-executive-managed-agent-swarm-platform.svg"
    alt: "A managed platform routes bounded agent-worker proposals through protected authority, budget, risk and pending-effect controls."
    width: 936
    height: 764
    description: "A proposed platform design for bounded AI-agent episodes, protected admission, resource enforcement, tenant isolation and outcome feedback."
    caption: "A proposed managed-platform design for one customer episode. Agents propose within a bounded worker pool. Protected controls retain current authority, shared spending, episode risk and pending effects across worker replacement. The provider enforces its own resource boundary; a customer or partner retains local acceptance and enforcement. Outcome records return to protected state. Other tenants remain isolated, while provider-wide incident review addresses shared dependencies. The figure illustrates responsibilities, not a validated platform-wide safety guarantee. Source: Spherity GmbH."
    credit_text: "Source: Spherity GmbH"
    keywords:
      - "Agent swarm safety"
      - "Runtime assurance"
      - "Episode risk accounting"
      - "Multi-tenant AI platform"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"
license_scope: "This research page, the executive brief and all three linked AI Safety series papers"

image: "/assets/preview-governing-ai-that-acts-across-companies.webp"
image_alt: "Spherity AI Safety series preview for Governing AI That Acts Across Companies, showing the executive brief cover."
image_mime: "image/webp"
image_width: 1200
image_height: 630

keywords:
  - "AI safety"
  - "AI agents"
  - "Cross-company AI agents"
  - "Operational AI alignment"
  - "Protected execution"
  - "Runtime assurance"
  - "Private verification"
  - "Action eligibility"
  - "Agent swarms"
  - "Multi-agent systems"
  - "Agentic AI"
  - "AI governance"
  - "Responsible AI leadership"
  - "Verifiable authority"
  - "Trust domains"
  - "AI safety first-mover advantage"
  - "Spherity AI Safety Series"
  - "Dr. Carsten Stöcker"

answer_summary: "AI systems acting across companies need more than model-level alignment: protected execution must bind each effect to current authority, shared limits, runtime evidence and accountable resource controls. This series connects incentive design, continuous assurance and privacy-preserving eligibility checks while stating where its formal and synthetic evidence does not establish general AI safety."
key_takeaways:
  - "Authority, evidence, aggregate limits and exact actions must be checked at protected resource boundaries, not left to agent prompts or voluntary compliance."
  - "Runtime assurance must retain episode risk, shared dependencies and pending effects when agents join, retire or are replaced."
  - "Cross-domain verification can prove action eligibility with scoped evidence while limiting unnecessary disclosure and preserving local enforcement sovereignty."
  - "The business advantage is qualified delegation: leaders can authorize more useful action sooner where evidence and controls justify it."
about:
  - "AI safety"
  - "Cross-company AI agents"
  - "Protected execution and runtime assurance"
mentions:
  - "Agent swarms"
  - "Multi-agent systems"
  - "Private verification"
  - "AI governance"
  - "First-mover advantage"
citations:
  - "https://doi.org/10.6028/NIST.AI.100-1"
  - "https://doi.org/10.6028/NIST.SP.800-207"
  - "https://www.w3.org/TR/vc-data-model-2.0/"
  - "https://www.w3.org/TR/odrl-model/"
  - "https://openai.com/index/hugging-face-incident-and-the-road-ahead/"
  - "https://www.anthropic.com/research/alignment-assessment-cybersecurity-incidents"
audiences:
  - "Board members and senior executives"
  - "AI safety, security and risk leaders"
  - "Platform, industrial and public-sector technology teams"
  - "Researchers and policy makers"
spatial_coverage:
  - "European Union"
  - "Global"

series_name: "Governing AI That Acts Across Companies"
series_description: "A four-part AI Safety series connecting incentive-compatible protected execution, runtime assurance and private cross-domain verification."
series_url: "/governing-ai-that-acts-across-companies.html"
series_position: 0
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
    - "Cross-company AI agents"
    - "Operational AI alignment"
    - "Protected execution"
    - "Private verification"
  discovery_terms:
    - "AI safety"
    - "AI agents"
    - "Agentic AI"
    - "AI governance"
  audience_questions:
    - "How can companies safely authorize AI agents to act across organizational boundaries?"
    - "What controls preserve risk limits when agents are replaced during an episode?"
    - "How can an agent prove action eligibility without disclosing unnecessary evidence?"
  evidence:
    - comparison: "AI safety, AI agents, runtime assurance, multi-agent systems and zero trust"
      input_type: "Search terms"
      geography: "Germany"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "Relative averages were AI agents 28, AI safety 26, zero trust 5, multi-agent systems 1 and runtime assurance below the reporting threshold."
    - comparison: "AI safety, agentic AI, AI governance, AI alignment and autonomous AI agents"
      input_type: "Search terms"
      geography: "Germany"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "Relative averages were AI safety 30, agentic AI 15, AI governance 12, AI alignment 2 and autonomous AI agents 1; related rising interest included the International AI Safety Report 2026."
  editorial_decisions:
    - "Use AI safety and AI agents in the title, summary and discovery metadata because they provide the strongest understandable entry points."
    - "Retain protected execution, runtime assurance, action eligibility and private verification as precise Spherity authority terms even where Trends reports little or no volume."
    - "Use agentic AI and AI governance as secondary bridges without replacing the papers' more exact technical language."

questions_answered:
  - question: "How can organizations govern AI agents that act across companies?"
    answer: "They can place protected decision and enforcement points at each resource boundary, require current authority and action-bound evidence, preserve shared limits and pending effects across agent changes, and return durable outcome records to the assurance state."
  - question: "Why is AI safety a leadership and business issue rather than only a model issue?"
    answer: "Leaders decide which authority, budgets, data and physical or digital effects AI may control. Reusable safeguards can qualify systems for demanding work sooner, while weak controls can scale misaligned objectives, deception and systemic harm across organizational boundaries."
  - question: "What does this series prove—and what does it not prove?"
    answer: "The papers provide conditional formal results, executable controller checks, finite-state exploration, synthetic scenarios and omission counterexamples under stated assumptions. They do not prove general alignment, policy adequacy, field calibration, unmodeled physical safety or safe behavior outside the mediated effects."
  - question: "What is the practical sequence across the three papers?"
    answer: "Paper 1 establishes incentive-compatible protected execution; Paper 2 adds risk-bounded runtime assurance under partial observation; Paper 3 adds privacy-preserving action-eligibility verification and controlled execution across trust domains."
related_publications:
  - title: "Beyond Single-Enterprise ZTA"
    url: "/beyond-zero-trust-m-trust-authorised-agentic-actors.html"
    context: "Extends Zero Trust with portable authority and cross-domain evidence for authorised agentic actors."
  - title: "PACE for Physical AI"
    url: "/physical-ai-compliance-evidence-pace.html"
    context: "Connects verifiable safety, cyber and AI evidence to configuration-bound Physical AI assurance."
  - title: "From Trustworthy AI to Trusted, Operational Agentic Systems"
    url: "/trusted-agentic-ai-china-eu-us-comparative-analysis.html"
    context: "Compares the trust infrastructure required for operational agentic AI across China, Europe and the United States."
  - title: "European Business Wallets as a Zero-Trust Control Plane for AI Agents"
    url: "/ebw-zero-trust-ai-agents.html"
    context: "Explains verifiable enterprise authority, mandates and action receipts for cross-company agent activity."

toc_items:
  - title: "Download the series"
    href: "#download-series"
  - title: "Executive brief"
    href: "#executive-brief"
  - title: "Why this matters"
    href: "#why-ai-safety-matters"
  - title: "Three-paper research sequence"
    href: "#three-paper-sequence"
  - title: "Industrial cooperation use case"
    href: "#industrial-cooperation"
  - title: "Managed agent-swarm use case"
    href: "#managed-agent-swarm"
  - title: "Leadership action"
    href: "#leadership-action"
  - title: "Evidence and boundaries"
    href: "#evidence-boundaries"
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
  - ai-agents
  - runtime-assurance
  - private-verification
---

<section class="paper-download-grid" id="download-series" aria-labelledby="download-series-title">
  <div class="paper-download">
    <h2 id="download-series-title">Download the executive brief</h2>
    <a href="{{ page.pdf_url | relative_url }}">Download the executive brief</a>
    <p><strong>Governing AI That Acts Across Companies.</strong> The leadership argument, two operating use cases and the integrated three-paper research programme.</p>
  </div>
  <div class="paper-download">
    <h2>Read the three technical papers</h2>
    <ol class="paper-download-links" role="list">
      <li><a href="{{ '/resource-bounded-program-equilibria-ai-safety.html' | relative_url }}">Paper 1: protected execution</a></li>
      <li><a href="{{ '/risk-bounded-runtime-assurance-multi-agent-systems.html' | relative_url }}">Paper 2: runtime assurance</a></li>
      <li><a href="{{ '/private-verification-action-eligibility-trust-domains.html' | relative_url }}">Paper 3: private verification</a></li>
    </ol>
  </div>
</section>

<figure class="paper-figure centered-figure">
  <a href="{{ page.pdf_url | relative_url }}"><img src="{{ page.cover_image | relative_url }}" alt="{{ page.cover_image_alt }}" width="1241" height="1754"></a>
  <figcaption><strong>Executive brief.</strong> A leadership guide to the Spherity AI Safety series and its operational controls. Published under CC BY 4.0.</figcaption>
</figure>

<section class="abstract-box" id="executive-brief" markdown="1">
<h2>Executive brief</h2>

AI safety and alignment become operational governance questions when AI receives authority to spend, release data, change software, book scarce resources or coordinate physical work across companies. Agent swarms can divide work and expand productive capacity, but the same coordination can propagate misaligned goals, deceptive behavior and correlated failure.

This four-part series proposes a layered response: incentive-compatible programs are mediated by deterministic protected controllers; runtime supervisors admit actions only when current mandate and action-bound assurance remain valid; and cross-domain verifiers can establish exact action eligibility without exposing every underlying record. The evidence is deliberately bounded. Formal proofs depend on stated models, while synthetic testing, state exploration and omission counterexamples challenge implementation assumptions rather than certify general alignment.

<p class="keywords"><strong>Keywords:</strong> AI safety; AI agents; agent swarms; protected execution; runtime assurance; private verification; operational alignment; cross-company AI governance</p>
</section>

<h2 id="why-ai-safety-matters">Why AI safety across companies matters now</h2>

Model behavior is only one part of the risk. A capable agent may still act under an expired mandate, exceed a shared budget through parallel actions, reuse stale evidence, conceal an adverse finding or lose accountability when a worker is replaced. Cross-company activity adds distinct trust roots, legal duties, data-access rules and resource owners. The system therefore needs controls that survive organizational boundaries and remain authoritative when the agent itself is not.

The strategic opportunity is **qualified delegation**. Organizations that can show why an action was eligible, which evidence was current, who authorized it, which limit it consumed and what outcome occurred can safely automate higher-value work sooner. That creates a defensible first-mover advantage without treating speed as permission to weaken controls.

<h2 id="three-paper-sequence">The three-paper research sequence</h2>

1. **[Program Equilibria and Protected Execution]({{ '/resource-bounded-program-equilibria-ai-safety.html' | relative_url }})** asks when a resource-bounded agent has no profitable unilateral deviation and how a protected controller can enforce exact action, current authority, delegation scope and aggregate budgets.
2. **[Risk-Bounded Runtime Assurance]({{ '/risk-bounded-runtime-assurance-multi-agent-systems.html' | relative_url }})** asks how a supervisor can preserve a quantified continuation-risk bound under partial observation, worker churn, shared dependencies and delayed effects.
3. **[Private Verification across Trust Domains]({{ '/private-verification-action-eligibility-trust-domains.html' | relative_url }})** asks how relying domains can verify exact action eligibility, prohibitions and adverse evidence without turning all underlying records into public data.

Together, the papers form a control chain from **incentives**, through **ongoing assurance**, to **cross-domain eligibility and enforcement**. None of the layers should be mistaken for a complete solution by itself.

<h2 id="industrial-cooperation">Use case 1: industrial cooperation across two protected boundaries</h2>

Two engineering organizations may ask separate AI systems to coordinate a shared task, such as allocating compute, scheduling a test facility or preparing a joint technical package. Each organization retains its own authority and resource boundary, while the joint plan defines shared scope, budget and assurance obligations. Local approvals alone are insufficient because risk can arise from the combined sequence of actions.

{% assign shared_job_figure = page.figure_objects[0] %}
{% include research-figure.html figure=shared_job_figure number=1 %}

The practical pattern is proposal first, protected decision second, controlled effect third, and durable outcome evidence last. This keeps the agent useful while making the resource owner—not the model—the final authority for an external effect.

<h2 id="managed-agent-swarm">Use case 2: a managed agent-swarm platform</h2>

A platform may replace or resize agent workers during a customer episode. Safety state cannot disappear with the worker. The protected episode account must retain current authority, shared spending, continuation risk, pending effects and incident context across replacement. Tenant isolation addresses one boundary; provider-wide review is still needed for shared dependencies and systemic failures.

{% assign swarm_platform_figure = page.figure_objects[1] %}
{% include research-figure.html figure=swarm_platform_figure number=2 %}

This architecture supports bounded autonomy rather than unlimited autonomy. It allows the platform and customer to place enforcement where each controls the relevant resource, while maintaining an auditable chain of decisions and outcomes.

<h2 id="leadership-action">Leadership action: build safety as reusable execution infrastructure</h2>

Boards and executive teams should define which external effects AI may control, require owners for authority and risk budgets, fund independent assurance, and create intervention paths that remain available when systems are operating at machine speed. Product and platform leaders should turn these decisions into reusable control services rather than bespoke review for every workflow.

The near-term CTA is concrete: select one cross-company action with material value and bounded consequences; model its authority, evidence, limits, pending effects and failure paths; implement protected admission at the resource boundary; and compare decision quality, throughput, intervention latency and evidence reuse against the current process.

<h2 id="evidence-boundaries">Evidence, tests and boundaries</h2>

The technical papers use mathematical models, machine-checked or executable logic, exhaustive finite-state exploration, synthetic scenarios and counterexamples created by removing controls. These methods are valuable because they make assumptions inspectable and show which invariants fail when a guard is omitted. They do not establish that a policy is ethically or legally adequate, that a model is generally aligned, that field calibration is correct, or that unmodeled physical effects are safe.

Deployment therefore requires staged validation, monitoring, independent challenge and incident learning. The series is a vendor-neutral reference contribution, not a conformity certificate or guarantee of safe outcomes.

<h2 id="references">Selected references</h2>

1. NIST, [Artificial Intelligence Risk Management Framework (AI RMF 1.0)](https://doi.org/10.6028/NIST.AI.100-1).
2. NIST, [Zero Trust Architecture, SP 800-207](https://doi.org/10.6028/NIST.SP.800-207).
3. W3C, [Verifiable Credentials Data Model v2.0](https://www.w3.org/TR/vc-data-model-2.0/).
4. W3C, [ODRL Information Model 2.2](https://www.w3.org/TR/odrl-model/).
5. OpenAI, [Hugging Face incident and the road ahead](https://openai.com/index/hugging-face-incident-and-the-road-ahead/).
6. Anthropic, [Alignment assessment of cybersecurity incidents](https://www.anthropic.com/research/alignment-assessment-cybersecurity-incidents).

<h2 id="how-to-cite">How to cite the series</h2>

Stöcker, Carsten (2026). *Governing AI That Acts Across Companies: How Responsible Leaders Build First Mover Advantage through AI Safety and Alignment.* Spherity GmbH. <https://spherity.github.io/spherity-research/governing-ai-that-acts-across-companies.html>. Licensed CC BY 4.0.
