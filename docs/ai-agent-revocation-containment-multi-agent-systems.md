---
publication_template_version: 2
layout: research-respec
css: "/assets/spherity-research-respec.css"
title: "AI Agent Revocation and Containment in Multi-Agent Systems"
citation_title: "Revocation and Containment in AI Agent Networks: Executive Brief and Engineering Implementation Guide"
seo_title: "AI Agent Revocation & Containment in Multi-Agent Systems"
og_title: "Revocation and Containment in AI Agent Networks"
og_description: "Revocation and status propagation in multi-agent systems: an executive brief and two technical papers, not a complete wallet or SSI architecture design."
subtitle: "Revocation and Containment in AI Agent Networks — an executive brief and two technical papers on trusted execution across companies"
description: "AI agent revocation, status propagation and bounded containment in multi-agent systems: three open-access PDFs, not a complete wallet or SSI architecture design."
paper_status: "Spherity Research · Executive Brief and Two-Paper Series"
authors:
  - "Dr. Carsten Stöcker"
author_entities:
  - name: "Dr. Carsten Stöcker"
    affiliation: "Spherity GmbH"
    url: "https://spherity.github.io/spherity-research/#dr-carsten-stoecker"
    orcid: "https://orcid.org/0009-0003-7417-8872"
author_affiliations:
  - "Dr. Carsten Stöcker — Spherity GmbH"
affiliation: "Spherity GmbH"
date: "2026-10-11"
last_modified_at: "2026-10-11"
research_cutoff: "2026-10-10"
research_cutoff_label: "Technical papers and executive brief's standards-review baseline"
lang: "en"
permalink: /ai-agent-revocation-containment-multi-agent-systems.html
canonical_url: "https://spherity.github.io/spherity-research/ai-agent-revocation-containment-multi-agent-systems.html"
latest_version: "https://spherity.github.io/spherity-research/ai-agent-revocation-containment-multi-agent-systems.html"
pdf_url: "/Spherity-Reseach-AI-Agent-Revocation-in-MAS-Executive-Brief.pdf"
associated_media:
  - name: "Revocation and Containment in AI Agent Networks — Executive Brief"
    url: "/Spherity-Reseach-AI-Agent-Revocation-in-MAS-Executive-Brief.pdf"
    cover_image: "/assets/ai-agent-revocation-mas-executive-brief-cover.jpg"
    cover_image_alt: "First page of Revocation and Containment in AI Agent Networks, the executive brief by Dr. Carsten Stöcker."
    license: "https://creativecommons.org/licenses/by/4.0/"
  - name: "Paper 1 — Cascading Trust Failures in AI Agent Networks: A Trust Architecture for Scalable Revocation and Bounded Containment"
    url: "/Spherity-Reseach-AI-Agent-Cascading-Trust-Failures-in-MAS.pdf"
    cover_image: "/assets/ai-agent-revocation-mas-cascading-cover.jpg"
    cover_image_alt: "First page of Cascading Trust Failures in AI Agent Networks by Dr. Carsten Stöcker."
    license: "https://creativecommons.org/licenses/by/4.0/"
  - name: "Paper 2 — Runtime Revocation in Multi-Agent Systems: Protocol Verification and Evaluation of Privacy and Containment"
    url: "/Spherity-Reseach-AI-Agent-Runtime-Revocation-in-MAS.pdf"
    cover_image: "/assets/ai-agent-revocation-mas-runtime-cover.jpg"
    cover_image_alt: "First page of Runtime Revocation in Multi-Agent Systems by Dr. Carsten Stöcker."
    license: "https://creativecommons.org/licenses/by/4.0/"
cover_image: "/assets/ai-agent-revocation-mas-executive-brief-cover.jpg"
cover_image_alt: "Executive brief title page: Revocation and Containment in AI Agent Networks, Dr. Carsten Stöcker, Spherity GmbH."
figure_objects:
  - id: "multi-issuer-agent-network"
    name: "Multi-issuer trust and protected receiving domains in a multi-agent system"
    content_url: "/assets/ai-agent-revocation-mas-multi-issuer.svg"
    alt: "Multiple authority and evidence issuers and status-delivery paths support agent coordination across separately protected receiving domains."
    width: 1632
    height: 1368
    description: "A multi-agent system repeats a local execution boundary for each receiving domain. Peer coordination does not transfer one domain's authority to another. Upstream monitoring agents that detect authority or evidence changes, including behavioural drift, and initiate authorised status changes are not depicted."
    caption: "Multi-issuer agent network. Authority and evidence issuers (A), authenticated status distribution (B) and protected receiving domains (C) are logical roles, not a single global permission service. Peer coordination does not bypass local enforcement. Executive Brief, Figure 1. Source: Dr. Carsten Stöcker / Spherity GmbH."
    creator_type: "Person"
    creator_name: "Dr. Carsten Stöcker"
    creator_url: "https://spherity.github.io/spherity-research/#dr-carsten-stoecker"
    copyright_holder: &figure_rightsholder
      type: "Person"
      name: "Dr. Carsten Stöcker"
      url: "https://spherity.github.io/spherity-research/#dr-carsten-stoecker"
    copyright_notice: "© 2026 Dr. Carsten Stöcker"
    credit_text: "Dr. Carsten Stöcker / Spherity GmbH"
    keywords: ["multi-agent systems", "AI agent identity", "verifiable authority", "multi-issuer trust", "runtime revocation"]
  - id: "three-domain-revocation"
    name: "Three-domain revocation: authority, distribution and resource-side enforcement"
    content_url: "/assets/ai-agent-revocation-three-domains.svg"
    alt: "Authority and evidence in domain A and authenticated status distribution in domain B feed domain C's protected decision and resource-side execution gate."
    width: 1632
    height: 1152
    description: "The receiving domain checks mandate and assurance for the same operation and enforces freshness at the last preventable effect. Status transport is distinct from decision authority."
    caption: "Three-domain boundary. A supplies scoped authority and evidence; B distributes authenticated status; C decides and enforces the covered effect. A delivery acknowledgement is not proof of enforcement or cancellation. Executive Brief, Figure 2. Source: Dr. Carsten Stöcker / Spherity GmbH."
    creator_type: "Person"
    creator_name: "Dr. Carsten Stöcker"
    creator_url: "https://spherity.github.io/spherity-research/#dr-carsten-stoecker"
    copyright_holder: *figure_rightsholder
    copyright_notice: "© 2026 Dr. Carsten Stöcker"
    credit_text: "Dr. Carsten Stöcker / Spherity GmbH"
    keywords: ["AI agent revocation", "protected execution", "resource-side enforcement", "zero trust", "credential status"]
  - id: "decoy-mask-lifecycle"
    name: "Credential-status privacy: genuine entries, decoys and initial masking"
    content_url: "/assets/ai-agent-revocation-decoy-mask-lifecycle.svg"
    alt: "Lifecycle of genuine and decoy status entries with an initial mask and published status observations; privacy depends on what the observer can infer over time."
    width: 1632
    height: 1536
    description: "The experimental lifecycle separates semantic status, secret genuine-versus-decoy allocation and published bits. Public known-active initialization reveals a fixed mask; matching complete observable histories is the relevant privacy condition."
    caption: "Decoy and mask lifecycle. The operator retains the genuine/decoy allocation; published bits combine semantic status with a fixed mask. Known-active public initialization reveals that mask, while snapshot differences expose transitions. Matching complete observable histories—not random appearance—is the relevant privacy condition. Executive Brief, Figure 3, reproduced there from the architecture paper. Source: Dr. Carsten Stöcker / Spherity GmbH."
    creator_type: "Person"
    creator_name: "Dr. Carsten Stöcker"
    creator_url: "https://spherity.github.io/spherity-research/#dr-carsten-stoecker"
    copyright_holder: *figure_rightsholder
    copyright_notice: "© 2026 Dr. Carsten Stöcker"
    credit_text: "Dr. Carsten Stöcker / Spherity GmbH"
    keywords: ["credential revocation privacy", "bitstring status list", "matched decoys", "initial masking", "verifiable credentials"]
  - id: "containment-delay-harm"
    name: "Containment delay and conditional expected cascade harm"
    content_url: "/assets/ai-agent-revocation-containment-harm.svg"
    alt: "Analytical curves show conditional expected harm increasing with containment delay; the second panel compares branching generations rather than elapsed time."
    width: 1632
    height: 1392
    description: "An analytical illustration connects detection and post-detection influence windows to a subcritical cascade certificate. The curve is a conditional expected-harm bound, not measured incident losses or a production timing benchmark."
    caption: "Containment and cascade harm. This analytical illustration assumes one root, unit episode cost, no prior pending harm, a ten-second conditional mean detection bound and influence intensity bounded by 0.04 per second. Supported delays of 2, 10 and 14 seconds give conditional bounds of 1.92, 5 and 25. Panel B shows branching generations, not elapsed time. These are not production measurements. Executive Brief, Figure 4. Source: Dr. Carsten Stöcker / Spherity GmbH."
    creator_type: "Person"
    creator_name: "Dr. Carsten Stöcker"
    creator_url: "https://spherity.github.io/spherity-research/#dr-carsten-stoecker"
    copyright_holder: *figure_rightsholder
    copyright_notice: "© 2026 Dr. Carsten Stöcker"
    credit_text: "Dr. Carsten Stöcker / Spherity GmbH"
    keywords: ["bounded containment", "cascading trust failures", "AI agent risk", "expected harm", "multi-agent systems"]
  - id: "trust-execution-architecture"
    name: "Trust and execution architecture for scalable revocation and bounded containment"
    content_url: "/assets/ai-agent-revocation-trust-execution-architecture.svg"
    alt: "Scoped authority, validated evidence and credential status feed a protected eligibility controller, resource-side gate and persistent operation ledger."
    width: 1632
    height: 1488
    description: "A revocation-focused integration view uses organisational identity and agent mandates as supporting inputs to local policy, current assurance, protected execution and durable accounting for unresolved remote operations. It is not a complete wallet or SSI architecture."
    caption: "Trust and execution architecture. Authority, assurance and authenticated status support a protected local decision; the resource gate controls effects and the operation ledger retains unresolved work. Wallet possession or a remote allow message does not independently authorise execution. Cascading Trust Failures in AI Agent Networks, Figure 1. Source: Dr. Carsten Stöcker / Spherity GmbH."
    creator_type: "Person"
    creator_name: "Dr. Carsten Stöcker"
    creator_url: "https://spherity.github.io/spherity-research/#dr-carsten-stoecker"
    copyright_holder: *figure_rightsholder
    copyright_notice: "© 2026 Dr. Carsten Stöcker"
    credit_text: "Dr. Carsten Stöcker / Spherity GmbH"
    keywords: ["verifiable authority", "AI agent runtime revocation", "trust execution architecture", "Business Wallet", "persistent operation accounting"]
robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"
license_scope: "This research page, the executive brief, both technical papers and the five attributed research figures, except where otherwise noted"
image: "/assets/preview-ai-agent-revocation-containment.webp"
image_alt: "AI Agent Revocation and Containment research social card with the executive brief cover and a label identifying three PDFs."
image_mime: "image/webp"
image_width: 1200
image_height: 630
keywords:
  - "AI agent revocation"
  - "runtime revocation"
  - "status propagation in multi-agent systems"
  - "bounded containment"
  - "cascading trust failures"
  - "AI agents"
  - "agentic AI"
  - "multi-agent systems"
  - "MAS security"
  - "AI agent security"
  - "verifiable authority"
  - "credential revocation"
  - "verifiable credentials"
  - "W3C Bitstring Status List"
  - "zero trust"
  - "protected execution"
  - "credential-status privacy"
  - "Business Wallets"
  - "Ethereum credential status"
  - "Ethereum Virtual Machine"
  - "on-chain status bitstring storage"
  - "L1 and L2 revocation registries"
  - "smart contract revocation registry"
  - "behavioural drift monitoring"
  - "OpenID CAEP"
  - "Trusted AI"
answer_summary: "This series addresses revocation and status propagation in multi-agent systems (MAS), not the design of a complete wallet or self-sovereign identity (SSI) architecture. The receiving resource must reevaluate authority and assurance for the exact operation, enforce freshness at its last preventable effect, and retain unresolved remote work until a valid terminal outcome. The papers develop this revocation and containment architecture using finite protocol models and synthetic workloads; they do not establish production stopping times or universal privacy and safety guarantees."
key_takeaways:
  - "Authority withdrawal, status delivery, local installation and resource enforcement are different events."
  - "A renewed lease cannot make old authoritative evidence fresh, and a timeout does not prove remote cancellation."
  - "Evaluate status privacy, containment and lost legitimate work separately; faster lookup alone is not safer execution."
about: ["AI agent revocation", "Status propagation in multi-agent systems", "Verifiable authority", "Bounded containment"]
mentions: ["W3C Bitstring Status List", "NIST SP 800-207", "OpenID Shared Signals Framework", "OpenID CAEP", "AnonCreds", "FIPS 204", "Business Wallets", "Ethereum", "Ethereum Virtual Machine", "Draft ERC-7506 Trusted Hint Registry"]
citations:
  - "https://www.w3.org/TR/2025/REC-vc-bitstring-status-list-20250515/"
  - "https://csrc.nist.gov/pubs/sp/800/207/final"
  - "https://openid.net/specs/openid-sharedsignals-framework-1_0-final.html"
  - "https://openid.net/specs/openid-caep-1_0-final.html"
  - "https://anoncreds.github.io/anoncreds-spec/"
  - "https://csrc.nist.gov/pubs/fips/204/final"
  - "https://ethereum.org/developers/docs/evm/"
  - "https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html"
  - "https://ethereum.org/developers/docs/scaling/optimistic-rollups/"
  - "https://ethereum.org/developers/docs/smart-contracts/"
  - "https://eips.ethereum.org/EIPS/eip-7506"
  - "https://geth.ethereum.org/docs/interacting-with-geth/rpc/pubsub"
audiences: ["Enterprise AI and platform leaders", "Security and identity architects", "Credential and wallet engineers", "Industrial data-sharing teams", "AI safety researchers"]
spatial_coverage: ["Europe", "Global cross-company ecosystems"]
search_research:
  reviewed_on: "2026-10-11"
  source: "Google Trends"
  source_url: "https://trends.google.com/trends/explore"
  geographies: ["Worldwide", "Germany", "Netherlands", "France"]
  time_ranges: ["Past 12 months", "Past 5 years"]
  search_types: ["Web Search", "News Search"]
  authority_terms: ["AI agent revocation", "runtime revocation", "bounded containment", "cascading trust failures"]
  discovery_terms: ["AI agents", "agentic AI", "multi-agent systems", "zero trust", "verifiable credentials"]
  audience_questions:
    - "Does revoking a credential immediately stop an AI agent's actions?"
    - "How should organisations contain remote work after an agent loses authority?"
  evidence:
    - comparison: "AI agents, multi-agent systems, agentic AI, zero trust, verifiable credentials; all categories"
      input_type: "Search terms, not Topics"
      geography: "Worldwide"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "Observed comparison averages were 53, 2, 26, 11 and 1 respectively. These are sampled normalized indices, not absolute search volumes. Relevant related wording included W3C verifiable credentials and evals for AI agents; unrelated consumer and product queries were rejected."
    - comparison: "The same five English search terms; all categories"
      input_type: "Search terms, not Topics"
      geography: "Germany"
      time_range: "Past 12 months and Past 5 years, reviewed separately"
      search_type: "Web Search"
      result: "The 12-month comparison averages were 27, 1, 13, 5 and 0; the five-year comparison returned 6, 0, 3, 2 and 0. AI agents and agentic AI were stronger adjacent discovery language in each comparison. Zero for a specialist term is not evidence of no demand. Related zero-trust policy questions were relevant; unrelated suggestions were excluded."
    - comparison: "The same five English search terms; all categories"
      input_type: "Search terms, not Topics"
      geography: "Netherlands and France, reviewed separately"
      time_range: "Past 5 years"
      search_type: "Web Search"
      result: "Observed comparison averages were 4, 0, 2, 1 and 0 in the Netherlands, and 12, 0, 6, 4 and 0 in France. Within both comparisons AI agents and agentic AI were stronger than the specialist adjacent terms. Separately normalized country values are not comparable absolute market sizes."
    - comparison: "The same five English search terms; all categories"
      input_type: "Search terms, not Topics"
      geography: "France"
      time_range: "Past 5 years"
      search_type: "News Search"
      result: "The comparison returned 2, 0, 0, 0 and 0, with multiple insufficient-data notices in regional and related-query panels. This weak signal did not justify changing technical terminology or making claims about news demand."
  editorial_decisions:
    - "Lead with AI agent revocation and containment, using multi-agent systems in the title and agentic AI in the body rather than chasing unrelated rising queries."
    - "Preserve specialist authority terms because they express the paper's contribution; Trends does not establish demand for those unmeasured exact phrases or validate technical findings."
    - "Keep English as the single page language. German on-site search aliases support discovery without adding unreviewed translated abstracts or duplicate language metadata."
    - "Include Ethereum, EVM and smart contract revocation registry as secondary implementation terms supported by the paper and primary technical sources, not as measured Google Trends winners or a change to the page's revocation focus."
faq_schema: true
questions_answered:
  - question: "Do these papers design a complete wallet or SSI architecture?"
    answer: "No. The series focuses on revocation and status propagation in multi-agent systems (MAS): how authority withdrawals and status changes reach receiving domains, affect local decisions and constrain further execution. Wallets, organisational identity and verifiable credentials provide context and integration points. The papers do not specify a complete wallet or self-sovereign identity (SSI) architecture."
  - question: "What is AI agent runtime revocation?"
    answer: "Runtime revocation is the withdrawal of authority or supporting evidence while an AI workflow is active. The receiving resource stops unsupported effects after installing the withdrawal, or when required authoritative evidence exceeds its accepted age or validity limit even if no update arrives. Publishing a status change alone does not stop queued or remote work."
  - question: "What is the difference between revocation and containment?"
    answer: "Revocation withdraws a previously accepted basis for action. Containment limits further effects, including work already dispatched to other systems. It requires protected resource gates, enforceable freshness limits and durable accounting until execution or cancellation is established. Neither control can undo an irreversible disclosure that has already occurred."
  - question: "Where are the monitoring agents that detect behavioural drift or changed authority?"
    answer: "They are not depicted in the five figures. Monitoring agents or services can observe authority and evidence changes, including behavioural drift, and trigger revocation or another status change when explicitly authorised by the relevant issuer or governance policy. Otherwise they raise a signal for an authorised decision. Detection, status publication and resource-side enforcement remain distinct; the figures do not validate a particular detector's accuracy or latency."
  - question: "Can Ethereum and EVM smart contracts support AI agent revocation?"
    answer: "Yes. The actual status bitstring can be stored in an EVM smart contract on Ethereum L1 or an EVM-compatible L2, for example as packed 256-bit words. This differs from storing only a digest or Merkle root while keeping the bitstring off-chain. Programmable write controls, shared update ordering and independently validated state can be advantageous across organisations. The draft ERC-7506 Trusted Hint Registry is one possible interface, not a requirement or a complete revocation protocol. Gas, finality, data availability, public history and recovery from missed events require evaluation. Neither Ethereum nor EVM compatibility automatically establishes issuer truth, evidence freshness, confidentiality or stopping at an off-chain resource."
  - question: "Why must mandate and assurance apply to the same operation?"
    answer: "Permission for one action and assurance for a different continuation do not jointly justify execution. Both must cover the same action, duration, continuation and context, including the recipient, resource, payload and bound evidence versions. Changing these elements can require a newly admitted operation."
  - question: "What happens when credential-status updates are unavailable?"
    answer: "A receiver may rely on authenticated local state only within its accepted source-age and validity limits. Freshness is measured from authoritative completeness, not the last download. At the strict expiry limit, affected ordinary effects stop; separately authorised containment and recovery may continue. Stale or missing state is unknown, not proof that a credential was revoked."
  - question: "Why is a timeout not proof that an AI agent's remote operation was cancelled?"
    answer: "The receiver may have executed the operation even if its receipt was lost. Keep the stable operation identity and unresolved exposure through retries, crashes and agent replacement. Close the record only on authenticated, contract-valid terminal evidence; a cancellation request or transport acknowledgement is insufficient."
  - question: "Do decoys, random masks or blockchain guarantee credential-status privacy?"
    answer: "No. Resident local checks can remove per-decision status requests on both mirror and ledger paths. Matched decoys require matching complete observable histories, including incidents and metadata. A fixed mask adds no membership protection when known-active initialization reveals it. Anonymous status proofs can hide a status handle, but their freshness, metadata and recovery costs still need evaluation."
  - question: "What has this research demonstrated, and what remains to be tested?"
    answer: "The series provides conditional mathematical results, finite protocol exploration, deterministic byte fixtures and synthetic revocation and privacy experiments. It does not benchmark a production agent network, certify complete software conformance or demonstrate universal containment. Receiver implementation, realistic timing, continuous issuance privacy and independently calibrated harm assumptions remain to be validated."
related_publications:
  - title: "Governing Safe AI That Acts Across Companies"
    url: "/governing-ai-that-acts-across-companies.html"
    context: "The separate three-paper AI Safety series provides the broader protected-execution, runtime-assurance and private-verification context."
  - title: "Beyond Single-Enterprise Zero Trust: Multi-Trust Architectures"
    url: "/beyond-zero-trust-m-trust-authorised-agentic-actors.html"
    context: "Connects organisational identity, Business Wallets and verifiable authority to cross-domain agent actions."
  - title: "Risk-Bounded Runtime Assurance for Multi-Agent Systems"
    url: "/risk-bounded-runtime-assurance-multi-agent-systems.html"
    context: "Explores ongoing action eligibility, continuation risk and pending effects; this new series focuses on withdrawal and containment."
toc_items:
  - {title: "Download three PDFs", href: "#download-series"}
  - {title: "Executive brief", href: "#executive-brief"}
  - {title: "The two technical papers", href: "#technical-papers"}
  - {title: "1. Multi-issuer agent networks", href: "#multi-issuer-networks"}
  - {title: "2. The receiving boundary", href: "#receiving-boundary"}
  - {title: "3. Status privacy", href: "#status-privacy"}
  - {title: "4. Containment and harm", href: "#containment-and-harm"}
  - {title: "5. Integrated architecture", href: "#integrated-architecture"}
  - {title: "6. Publication and proof options", href: "#architecture-options"}
  - {title: "Ethereum and EVM", href: "#ethereum-evm-revocation"}
  - {title: "Evidence and standards", href: "#evidence-and-standards"}
  - {title: "Pilot and acceptance tests", href: "#pilot-and-tests"}
  - {title: "References", href: "#references"}
  - {title: "License and citation", href: "#license-and-citation"}
  - {title: "Questions answered", href: "#questions-answered"}
tags: [trusted-ai, digital-identity, resilience, multi-agent-systems, revocation]
---

<section class="paper-download-grid" id="download-series" aria-labelledby="download-series-title">
  <div class="paper-download">
    <h2 id="download-series-title">Start with the executive brief</h2>
    <a href="{{ page.pdf_url | relative_url }}">Executive brief · PDF</a>
    <p><strong>Revocation and Containment in AI Agent Networks.</strong> A 16-page leadership and engineering guide, prepared 11 October 2026.</p>
  </div>
  <div class="paper-download">
    <h2>Read the technical papers</h2>
    <ol class="paper-download-links" role="list">
      <li><a href="{{ '/Spherity-Reseach-AI-Agent-Cascading-Trust-Failures-in-MAS.pdf' | relative_url }}">Paper 1: Cascading trust failures · PDF</a></li>
      <li><a href="{{ '/Spherity-Reseach-AI-Agent-Runtime-Revocation-in-MAS.pdf' | relative_url }}">Paper 2: Runtime revocation · PDF</a></li>
    </ol>
    <p>Paper 1 — trust architecture: 76 pages. Paper 2 — protocol verification and evaluation: 73 pages. Both prepared 10 October 2026. All three documents are open access under CC BY 4.0.</p>
  </div>
</section>

<section class="abstract-box" id="executive-brief" markdown="1">
<h2>Executive brief: from revoked credentials to controlled effects</h2>

An AI agent can lose permission while its requests are still queued, its evidence is cached or its work is executing in another company. **Revocation is therefore an end-to-end execution-control problem, not simply a credential-status lookup.** The receiving organisation must verify mandate and assurance for the same complete operation, enforce current dependencies at the last preventable effect and keep unresolved remote work visible until a valid outcome is known.

This Spherity Research series connects verifiable authority, protected execution, finite freshness limits, credential-status privacy and cascading-failure analysis. The executive brief translates the two technical papers into implementation choices for enterprise AI leaders, identity architects and industrial data-sharing teams. The results combine conditional arguments, finite models and synthetic experiments; deployment performance and software conformance require separate evidence.

**Research scope:** the papers focus on **revocation and status propagation in multi-agent systems (MAS)**—how authority withdrawals and status changes reach receiving domains and constrain further execution. They do **not** design a complete wallet or self-sovereign identity (SSI) architecture. Wallets, organisational identity and verifiable credentials appear as context and integration points for the revocation and containment mechanisms.

**Leadership priority:** qualify one receiving resource and its cancellation path before expanding an agent network. Measure prohibited effects, legitimate work lost and unresolved operations separately.

<p class="keywords"><strong>Keywords:</strong> AI agent revocation; runtime revocation; status propagation; multi-agent systems (MAS); bounded containment; verifiable authority; credential-status privacy; cascading trust failures; Trusted AI</p>
</section>

<figure class="paper-figure centered-figure">
  <a href="{{ page.pdf_url | relative_url }}"><img src="{{ page.cover_image | relative_url }}" alt="{{ page.cover_image_alt }}" width="1273" height="1800" loading="lazy" decoding="async"></a>
  <figcaption><strong>Executive brief.</strong> <cite>Revocation and Containment in AI Agent Networks</cite>, Dr. Carsten Stöcker, Spherity GmbH. The entry point to the two technical papers. CC BY 4.0.</figcaption>
</figure>

<h2 id="technical-papers">Two complementary papers: trust architecture, then protocol evidence</h2>

### Paper 1 — Cascading Trust Failures in AI Agent Networks

**A Trust Architecture for Scalable Revocation and Bounded Containment** develops the design principles, conditional bounds and practical trade-offs. It connects authority, status, protected execution and dependency processing to privacy and expected cascade harm. Read it to understand **why stopping conditions depend on receiver control, trustworthy freshness and supported service capacity**, rather than a particular hosting technology. [Download Paper 1]({{ '/Spherity-Reseach-AI-Agent-Cascading-Trust-Failures-in-MAS.pdf' | relative_url }}).

### Paper 2 — Runtime Revocation in Multi-Agent Systems

**Protocol Verification and Evaluation of Privacy and Containment** turns the architecture into protected-protocol models, failure tests and implementation obligations. It examines withdrawal/commit races, parent-age limits on lease renewal, durable remote-operation accounting, privacy observers and synthetic fault comparisons. Read it to understand **which controls must survive concurrency, retries, partitions and overload**, and what the reported tests do and do not establish. [Download Paper 2]({{ '/Spherity-Reseach-AI-Agent-Runtime-Revocation-in-MAS.pdf' | relative_url }}).

**Recommended reading order:** executive brief → Paper 1 (architecture, *Article A* in the brief) → Paper 2 (runtime verification, *Article B* in the brief). This is a new two-paper study, complementary to the separate [Spherity AI Safety three-paper series]({{ '/governing-ai-that-acts-across-companies.html' | relative_url }}).

<h2 id="multi-issuer-networks">1. Multi-issuer agent networks: coordination is not authority</h2>

In a cross-company multi-agent system, one issuer may establish legal-entity identity, another an employee's representation authority, and another a tool's assurance evidence. A receiving company must decide which sources it recognises, for which claims and scope. A valid signature authenticates a statement; it does not make the statement true or grant unlimited reliance.

**Use case: engineering collaboration.** An engineering agent asks a supplier to run a simulation, then proposes releasing a design file to a named subcontractor. The supplier's approval does not authorise the subcontractor's next action or the original company's later disclosure. Each receiving resource evaluates its own complete operation: action, duration, continuation and context, including payload, audience and evidence versions. These are the engineering-file workflows used to motivate the research—not evidence of tested physical-robot stopping behaviour.

<h3 id="monitoring-agents">Monitoring agents are not depicted in the figures</h3>

The five figures focus on revocation, status propagation and controlled execution. **Monitoring agents or services that observe authority and evidence changes—including behavioural drift detection—are not depicted.** In an implementation, such monitors can trigger revocation, suspension or another status change when explicitly authorised by the relevant issuer or governance policy; otherwise they raise a signal for an authorised decision.

An observed anomaly is not automatically proof that a credential is invalid. The monitor's evidence, decision rights and escalation rules must be defined. Detection, publication of the resulting status and enforcement at the receiving resource are separate steps. The diagrams do not establish a particular detector's accuracy, false-positive rate or response time.

{% assign network_figure = page.figure_objects[0] %}
{% include research-figure.html figure=network_figure number=1 %}

The diagram is read as a network of repeated protected boundaries. A and B identify authority/evidence and distribution roles; C identifies a relying and executing domain. One organisation can perform several roles, and a network can contain many instances of each. **An agent-to-agent message does not itself transfer permission to execute.** Explicit delegation must still be accepted and checked by the receiving domain for scope, audience, expiry and current status.

<h2 id="receiving-boundary">2. Runtime revocation at the receiving resource</h2>

The three-domain model separates the source of a claim from its delivery and from the party that controls the effect. A status service can deliver an authenticated withdrawal without becoming a general decision authority. The resource owner retains its own policy decision point (PDP) and policy enforcement point (PEP).

{% assign boundary_figure = page.figure_objects[1] %}
{% include research-figure.html figure=boundary_figure number=2 %}

Three rules turn that separation into an execution contract:

1. **Bind mandate and assurance to the same record.** Permission for one recipient cannot be combined with assurance for a different payload or continuation. A changed immutable record may need new admission.
2. **Check at the last preventable effect.** Once a relevant withdrawal is installed locally, the final dependency and expiry checks must exclude the old supporting evidence before commit. An alternative valid evidence set may still justify the action; blanket rejection of every dependent action is not always correct. Withdrawals still in transit are a separate freshness case.
3. **Preserve authoritative age and pending work.** A recent fetch or new wrapper signature does not refresh the source's completeness watermark. Child leases cannot extend the parent evidence's age cap. Keep a stable logical operation identifier and unresolved accounting across retries and restarts until authenticated execution or cancellation evidence closes the operation.

For example, if the receiver released a file but its receipt was lost, a timeout does not make the exposure disappear. Durable receiver outcomes and cancellation records are needed to prevent retries from causing an additional effect. The research's at-most-once result depends on the receiver's qualified atomicity and recovery contract; a sender-side database alone is insufficient.

<h2 id="status-privacy">3. Credential-status privacy: distinguish local checks, decoys and masks</h2>

Both signed mirrors and ledger-backed replicas can support authenticated local status checks without contacting a status endpoint for every decision. That can reduce one tracking channel, provided refreshes and telemetry do not disclose the activity. It does not by itself hide a credential's stable status handle or every communication pattern.

The proposed decoy and initial-mask profiles address different questions. Decoys reserve positions that do not represent credentials and create cover transitions. Their privacy argument requires genuine and decoy histories to match under the declared observer—including incident shocks, timing, writers, batching and later side information. Matching only average transition rates is not enough.

{% assign privacy_figure = page.figure_objects[2] %}
{% include research-figure.html figure=privacy_figure number=3 %}

**Random appearance is not a privacy guarantee.** If the public initial state is known to be active, it reveals the fixed mask used in this model. The runtime study therefore compares matched histories with and without masking. Random masks also reduce the compression advantage of sparse bitstrings. Byte fixtures measure representation cost, not network latency, safety or anonymity.

[AnonCreds](https://anoncreds.github.io/anoncreds-spec/) offers a different mechanism: proving non-revocation without revealing the revocation index. Such proofs still need binding to the accepted registry state, challenge, audience and operation. They do not make an old authoritative state fresh. The series does not supply an accumulator-performance benchmark, and treats the proposed masked and unissued-decoy profiles as experimental.

<h2 id="containment-and-harm">4. Bounded containment and cascading trust failures</h2>

An agent can influence another agent before either is stopped. The architecture relates conditional propagation and harm assumptions to detection and post-detection influence windows. Shorter **supported** windows can improve the conditional expected-harm bound, but a measured average delay cannot be substituted for a guaranteed influence limit.

{% assign harm_figure = page.figure_objects[3] %}
{% include research-figure.html figure=harm_figure number=4 %}

The illustration shows why capacity is part of trust infrastructure: status distribution is not enough if withdrawal processing waits behind unbounded work. Reserved service, bounded job size and backlog, and a separately supported restrictive fallback are needed to justify an enforcement deadline.

The bound is **expected harm under stated assumptions**, not the maximum loss in every incident. Continuing external failures can add new roots even when secondary propagation is subcritical. If the subcritical certificate is unavailable, that does not prove infinite damage. A file-release gate also cannot contain an agent-messaging channel it does not control.

<h2 id="integrated-architecture">5. Integrating revocation into trust and execution infrastructure</h2>

This revocation-focused view connects organisational identity and agent mandates with assurance evidence, credential status, local relying policy and durable operation accounting. It treats identity and wallet services as supporting inputs and integration points, not as a complete wallet or SSI design. Business Wallets can hold the relevant keys and evidence. Wallet possession alone, however, does not establish the holder's mandate or the eligibility of a particular action.

{% assign architecture_figure = page.figure_objects[4] %}
{% include research-figure.html figure=architecture_figure number=5 %}

**Read the diagram from evidence to effect:** recognise scoped issuers; validate the evidence and current status; decide eligibility for the complete record; enforce at the resource; then retain an accountable outcome or an unresolved operation. The persistent operation ledger is an accounting function and does not require blockchain.

The business objective is useful, accountable delegation across company boundaries. Explicit stopping and recovery contracts can make pilots easier to evaluate, clarify responsibility between identity, platform and resource teams, and expose trade-offs between risk reduction and service continuity. These are design benefits to test—not measured returns on investment or a production-performance claim.

<h2 id="architecture-options">6. Architecture options for status publication and proofs</h2>

No single storage or proof pattern removes the need for recognised issuers, authoritative freshness and resource-side enforcement. **Table 6 from Paper 1** compares alternative publication and proof patterns; it is not a ranking of complete revocation systems. Several options can be combined, such as a Merkle root committed on-chain with proofs and snapshots served by independent mirrors.

<p class="table-scroll-hint" id="publication-patterns-hint">On small screens, scroll the table horizontally to compare all three columns. Keyboard users can focus the table region and use the arrow keys.</p>
<div class="table-scroll" role="region" aria-label="Alternative publication and proof patterns" aria-describedby="publication-patterns-hint" tabindex="0">
  <table class="academic-table">
    <caption><strong>Table 6.</strong> Alternative publication and proof patterns</caption>
    <thead>
      <tr><th scope="col">Pattern</th><th scope="col">Useful property</th><th scope="col">Cost and limitation</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Complete packed state on DLT</td>
        <td>Local authenticated status after synchronization; shared update ordering.</td>
        <td>Writes, consensus delay, public update history and replicated state; no automatic issuer truth or freshness.</td>
      </tr>
      <tr>
        <td>On-chain digest with signed mirrors or IPFS</td>
        <td>Small commitment; large snapshots can use caches and independent replicas.</td>
        <td>Both an accepted commitment and available matching bytes are needed. A CID alone does not retain data.</td>
      </tr>
      <tr>
        <td>Merkle status map</td>
        <td>A bit or word plus a logarithmic authentication path can prove its value under a root.</td>
        <td>Current root, data and proof availability remain necessary. Index-revealing proofs are not anonymous proofs.</td>
      </tr>
      <tr>
        <td>RSA or other accumulator</td>
        <td>Some constructions offer compact membership or non-membership witnesses.</td>
        <td>Witness maintenance, setup and manager assumptions vary. RSA and pairing constructions are not post-quantum.</td>
      </tr>
      <tr>
        <td>L2 publication</td>
        <td>Can amortize transactions and reduce some publication costs.</td>
        <td>Sequencer acceptance, data availability, proof or dispute completion and L1 settlement are different conditions.</td>
      </tr>
      <tr>
        <td>Participant state channel</td>
        <td>Can amortize repeated updates among a fixed group.</td>
        <td>Co-signature and dispute rules complicate public revocation; counterparties must not veto unilateral withdrawal.</td>
      </tr>
    </tbody>
  </table>
</div>

**Source:** Dr. Carsten Stöcker, *Cascading Trust Failures in AI Agent Networks*, [Section 5.4.6, Table 6, page 21]({{ '/Spherity-Reseach-AI-Agent-Cascading-Trust-Failures-in-MAS.pdf' | relative_url }}#page=21). Original table wording and numbering retained; layout adapted for the web. © 2026 Dr. Carsten Stöcker, CC BY 4.0. DLT means distributed ledger technology; IPFS is the InterPlanetary File System; CID is a content identifier; L1 and L2 mean the base chain and a layer-2 system respectively.

<h3 id="ethereum-evm-revocation">Ethereum and EVM smart contracts for credential-status publication</h3>

**Smart-contract blockchains such as Ethereum can be an advantageous implementation option** when independent organisations need programmable update controls, shared ordering and independently validated status. The Ethereum Virtual Machine (EVM) provides deterministic execution of contract state transitions. A suitably designed registry can restrict writes, enforce update rules and expose changes for reconciliation. This is a conditional architectural assessment—not a claim that blockchain is necessary, faster or more private than authenticated signed mirrors. See the [Ethereum EVM documentation](https://ethereum.org/developers/docs/evm/).

**Store the bitstring itself on L1 or L2.** An EVM smart contract can hold the actual packed status bitstring in persistent storage on **Ethereum L1 or an EVM-compatible L2**. One implementation uses an array or mapping of `uint256` or `bytes32` words: each word can represent 256 one-bit status entries, with authorised calls updating the relevant word. This is the table's **complete packed state on DLT** pattern, not merely an on-chain hash of an off-chain bitstring. L2 deployment can be combined with this storage pattern; the two table rows are not mutually exclusive. See [Solidity's storage layout](https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html).

On an L2, the bitstring resides in that L2 contract's state. Rollup commitments and published data connect it to Ethereum; this does **not** mean every expanded L2 storage word is also held directly in an L1 contract's storage. By contrast, a digest-only design leaves the bitstring on a mirror or IPFS and stores its commitment on the chosen chain. Qualify the selected L2's data availability, sequencer and settlement assumptions separately. See [Ethereum's rollup architecture documentation](https://ethereum.org/developers/docs/scaling/optimistic-rollups/).

The paper examines a packed-status profile over the **draft [ERC-7506 Trusted Hint Registry](https://eips.ethereum.org/EIPS/eip-7506)**. The draft supplies namespaces, 32-byte hints, delegated write permissions and change events. Packing status bits, preserving irreversible withdrawals under concurrent writes, defining suspension semantics and mapping W3C bit order remain application-profile obligations. ERC-7506 is not a final standard or a complete revocation protocol; it deliberately leaves governance to the ecosystem.

For a cross-company pilot, qualify four boundaries:

- **Authority and freshness:** pin the accepted chain, contract, issuer and status profile. Consensus does not establish issuer truth or guarantee that every off-chain withdrawal has been published. A block timestamp is not an authoritative completeness watermark. Smart contracts need an authorised input path for external facts; they do not independently detect behavioural drift. See [Ethereum's smart-contract limitations](https://ethereum.org/developers/docs/smart-contracts/#limitations).
- **Timing and cost:** distinguish submission, inclusion, accepted or finalized state, local installation and enforcement. Include transaction fees, capacity, reorganisation policy and node operation in the design. EVM compatibility alone does not establish a network's consensus or finality guarantees.
- **Privacy:** public state, logs, writer activity and timing can disclose information. Permissioned writes do not make public-chain data confidential. Local reads remove a lookup channel only under the stated observation assumptions.
- **Delivery and containment:** change events are notifications, not proof of receipt or execution control. Recover from disconnects and missed events using checkpointed reconciliation and reorganisation handling; keep freshness limits and the final resource gate independent of a live subscription. [Geth's event documentation](https://geth.ethereum.org/docs/interacting-with-geth/rpc/pubsub) explains these delivery limitations.

**Selection rule:** choose Ethereum/EVM where shared programmable state justifies these costs and operational responsibilities. Use signed mirrors, commitments or another pattern where they meet the same verified requirements more simply. The publication layer does not replace the protected receiving boundary, and the papers remain a study of MAS revocation and status propagation—not a full wallet or SSI architecture.

<h2 id="evidence-and-standards">Evidence, standards and the limits of the results</h2>

The executive brief separates four evidence classes:

- **Conditional mathematics:** eligibility, privacy, stopping, accounting and expected-harm arguments depend on their stated authority, timing, mediation and observation assumptions.
- **Finite protocol exploration:** the runtime study reports 477 states for one operation and 6,651 for two, with no monitored baseline violation. Removing key controls yields short counterexamples. This is a small abstraction, not verification of a deployed distributed system.
- **Synthetic experiments:** 6,144 model incidents and 5,000 privacy cohorts exercise stipulated conditions. They do not measure a live agent platform, mirror service or ledger.
- **Reproducible calculations:** byte fixtures and model charts make assumptions inspectable; real hardware calibration, full wire conformance and implementation mapping remain separate tasks.

The following primary sources support the standards context. They do not certify the proposed architecture:

| Standard or specification | Role and implementation boundary |
| --- | --- |
| [NIST SP 800-207: Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) | Resource-focused policy decision and enforcement. The papers add explicit freshness and remote-operation obligations for their agent workflows. |
| [W3C Bitstring Status List v1.0](https://www.w3.org/TR/2025/REC-vc-bitstring-status-list-20250515/) | Recommendation baseline for publishing credential status. Pin encoding, purpose, authority and version; do not present experimental masking as standard conformance. |
| [OpenID Shared Signals Framework 1.0](https://openid.net/specs/openid-sharedsignals-framework-1_0-final.html) and [CAEP 1.0](https://openid.net/specs/openid-caep-1_0-final.html) | Authenticated security-event transport and an access-evaluation profile. Event receipt is not proof of resource-side enforcement or an execution lease. |
| [AnonCreds specification](https://anoncreds.github.io/anoncreds-spec/) | The v1.0 draft describes anonymous credential and non-revocation proof mechanisms. Hidden indices still require freshness, proof binding and an enforceable invalidation strategy. |
| [NIST FIPS 204: ML-DSA](https://csrc.nist.gov/pubs/fips/204/final) | Post-quantum digital signatures. Upgrading object signatures alone does not upgrade transport, proof systems or ledger consensus. |

The PDFs also review emerging W3C drafts and a proposed packed profile over the draft ERC-7506 Trusted Hint Registry. Those proposals must be distinguished from the stable baseline and require their own conformance and failure testing.

<h2 id="pilot-and-tests">Start with one receiver, one effect and explicit acceptance tests</h2>

For an initial pilot, use a named engineering-file release, ordinary unmasked credential status, authenticated snapshots and full evidence reevaluation. Add dependency-index optimisations, alternative hosting or privacy profiles only when they preserve the reference decision and execution boundary.

1. **Security architecture:** pin issuers, algorithms, status purpose, bit order, epoch and decoding limits; reject ambiguous or oversized inputs within bounded work.
2. **Resource team:** mutate payload and recipient after admission; install withdrawals before and after commit; prove that queues and alternative APIs cannot bypass the final gate.
3. **Trust infrastructure team:** drop, duplicate and reorder updates; partition all freshness paths; test expiry and restart without extending authoritative age.
4. **Receiver and storage teams:** crash both sides, retry requests and lose receipts; retain pending operations and durable cancellation outcomes.
5. **Platform operations:** inject bursts, verify the reserved-service assumptions and test the restrictive fallback. Report prohibited effects, legitimate deadline loss and unresolved operations separately.

**Call to action:** select a cross-company workflow with an identifiable resource owner, agree the last preventable effect and acceptable evidence age, and independently test the stop, cancellation and recovery paths before scaling. The author is Spherity's founder; independent implementations and review are important to assessing deployment relevance.

<h2 id="references">Research sources and citations</h2>

1. Stöcker, Carsten (2026-10-11). *Revocation and Containment in AI Agent Networks: Executive Brief and Engineering Implementation Guide.* Spherity GmbH. [Executive Brief PDF]({{ '/Spherity-Reseach-AI-Agent-Revocation-in-MAS-Executive-Brief.pdf' | relative_url }}). CC BY 4.0.
2. Stöcker, Carsten (2026-10-10). *Cascading Trust Failures in AI Agent Networks: A Trust Architecture for Scalable Revocation and Bounded Containment.* Spherity GmbH. [Paper 1 PDF]({{ '/Spherity-Reseach-AI-Agent-Cascading-Trust-Failures-in-MAS.pdf' | relative_url }}). CC BY 4.0.
3. Stöcker, Carsten (2026-10-10). *Runtime Revocation in Multi-Agent Systems: Protocol Verification and Evaluation of Privacy and Containment.* Spherity GmbH. [Paper 2 PDF]({{ '/Spherity-Reseach-AI-Agent-Runtime-Revocation-in-MAS.pdf' | relative_url }}). CC BY 4.0.

Figure explanations follow the executive brief, Sections 3–4, 6 and 10, and the architecture paper's Figure 1. The original filenames are retained so download references remain faithful to the supplied editions. © 2026 Dr. Carsten Stöcker. Reuse is permitted under CC BY 4.0 with attribution, a licence link and an indication of changes, except where otherwise noted.
