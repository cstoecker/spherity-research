---
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "AI-Cyber, Quantum Risk, Hybrid Warfare, and Physical AI"
subtitle: "A threat escalation and operational readiness model for Germany and Europe"
description: "Policy model for Germany and the EU linking AI-enabled cyber operations, hybrid warfare, quantum risk, trust infrastructure, and operational readiness."

paper_status: "Spherity Research Paper"
author: "Dr. Carsten Stöcker"
authors:
  - "Dr. Carsten Stöcker"
affiliation: "Spherity GmbH"
date: "2026-05-18"
last_modified_at: "2026-07-30"
lang: "en"

permalink: /threat-escalation-model-germany-eu.html
canonical_url: "https://spherity.github.io/spherity-research/threat-escalation-model-germany-eu.html"
latest_version: "https://spherity.github.io/spherity-research/threat-escalation-model-germany-eu.html"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"

logo: "/assets/spherity-logo-horizontal-800.webp"
image: "/assets/spherity-research-og.png"
image_alt: "Spherity Research — Identity. Infrastructure. Resilience."

answer_summary: "The paper finds that Germany and the European Union have broad legal and strategic coverage but lack a sufficiently integrated, tested operating model for escalation across AI-enabled cyber operations, hybrid warfare, quantum risk, digital trust, and cyber-physical systems."
key_takeaways:
  - "Cross-domain failures can amplify one another faster than sector-specific governance can respond."
  - "Legal coverage is not equivalent to operational readiness; scenarios require owners, thresholds, exercises, and measurable closure."
  - "Identity, authorization, revocation, provenance, and cryptographic agility form a shared trust layer across public administration, industry, software, machines, and AI agents."
  - "The proposed operating model uses integrated scenarios and 12/24/36-month roadmaps rather than an undifferentiated policy wish list."
about:
  - "AI-enabled cyber operations"
  - "Hybrid warfare"
  - "Post-quantum cryptography"
  - "Cyber-physical resilience"
  - "Operational readiness"
mentions:
  - "European Union"
  - "Germany"
  - "AI Act"
  - "NIS2 Directive"
  - "Cyber Resilience Act"
  - "eIDAS 2.0"
citations:
  - "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai"
  - "https://digital-strategy.ec.europa.eu/en/policies/nis2-directive"
  - "https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act"
  - "https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards"
questions_answered:
  - question: "Why should AI-cyber, hybrid warfare, quantum risk, and Physical AI be planned together?"
    answer: "Because a single incident can move across domains: compromised identity can enable a cyber intrusion, manipulated information can deepen a trust crisis, fragile cryptography can undermine evidence, and compromised autonomous systems can translate digital failure into physical harm."
  - question: "What does operational readiness mean in this model?"
    answer: "Operational readiness means that institutions have defined owners, measurable indicators, trigger thresholds, secure authority controls, rehearsed escalation paths, cross-domain exercises, and a process for closing after-action findings."
  - question: "Why is trust infrastructure a cross-cutting security layer?"
    answer: "Identity, authentication, authorization, signatures, credentials, revocation, provenance, software signing, timestamps, and audit evidence determine who acted, with what authority, under which rules, and whether that action can be trusted after an incident."
related_publications:
  - title: "European Business Wallets as the Legal Control Plane for Zero Trust AI Agents"
    url: "/ebw-zero-trust-ai-agents.html"
    context: "Defines an authority and evidence layer for high-impact autonomous actions across organizations."
  - title: "Securing Digital Identity and Verifiable Credential Wallets against Quantum Vulnerabilities"
    url: "/Securing-Digital-Identity-Quantum-Vulnerabilities.html"
    context: "Provides the detailed attack taxonomy and migration model for the cryptographic trust layer."
  - title: "Legal & Operational EBW Roadmap Toward EU-Wide Acceptance"
    url: "/ebw-roadmap.html"
    context: "Maps a proposed European legal-person identity framework to standards, pilots, conformance, and adoption gates."

toc_items:
  - title: "Abstract"
    href: "#abstract"
  - title: "Central thesis"
    href: "#central-thesis"
  - title: "Key policy messages"
    href: "#key-policy-messages"
  - title: "1. Introduction and contribution"
    href: "#1-introduction-and-contribution"
  - title: "2. Scope, definitions, and method"
    href: "#2-scope-definitions-and-method"
  - title: "3. Integrated threat escalation model"
    href: "#3-integrated-threat-escalation-model"
  - title: "4. Threat domain analysis"
    href: "#4-threat-domain-analysis"
  - title: "5. Interdependencies and amplification effects"
    href: "#5-interdependencies-and-amplification-effects"
  - title: "6. Scenario planning model"
    href: "#6-scenario-planning-model"
  - title: "7. Comparative policy maturity analysis"
    href: "#7-comparative-policy-maturity-analysis"
  - title: "8. Germany case study"
    href: "#8-germany-case-study"
  - title: "9. Policy recommendations"
    href: "#9-policy-recommendations"
  - title: "10. Discussion"
    href: "#10-discussion-uncertainty-safeguards-and-evidence-gaps"
  - title: "11. Outlook"
    href: "#11-outlook"
  - title: "References"
    href: "#references"
  - title: "Appendix A"
    href: "#appendix-a-maturity-scoring-rubric"
  - title: "Appendix B"
    href: "#appendix-b-suggested-readiness-metrics"
  - title: "Questions answered"
    href: "#questions-answered"

tags:
  - ai-cyber
  - frontier-ai
  - post-quantum-cryptography
  - hybrid-warfare
  - cyber-security
  - physical-ai
  - cyber-physical-resilience
  - digital-sovereignty
  - trust-infrastructure
  - germany
  - european-union
  - scenario-planning
  - national-security
  - operational-readiness
---

<section class="abstract-box" markdown="1">
<h2 id="abstract">Abstract</h2>

Germany and the European Union face a threat environment that is increasingly systemic rather than sectoral. Cyber-security, AI governance, digital identity, post-quantum cryptography, hybrid warfare, financial resilience, Physical AI, public communication, and industrial policy are still often handled through separate policy tracks. This separation is no longer sufficient. AI can reduce the cost and time required for cyber operations, influence activity, vulnerability triage, and defensive automation. Hybrid warfare can combine cyber attacks, disinformation, sabotage, economic pressure, and strategic ambiguity. Quantum computing creates a long-term risk to the cryptographic trust layer on which secure communications, digital signatures, identity, software updates, and legal evidence depend. Physical AI can translate digital compromise into physical harm. Frontier AI, including prospective superintelligent AI, remains uncertain. It is treated here as a high-impact horizon risk, not as a claim about current systems.

The paper develops an integrated threat escalation and operational readiness model, applies it to Germany and the EU, and compares policy maturity across Germany, the EU, the United States, China, Japan, South Korea, and Canada. The core finding is that Germany and the EU have many relevant laws and strategies, but still lack a sufficiently operational cross-domain escalation model with measurable implementation discipline. The EU legal stack is broad: it includes the AI Act, NIS2, the Cyber Resilience Act, DORA, eIDAS 2.0, the Digital Services Act, the Data Act, the Machinery Regulation, the revised Product Liability Directive, the CER Directive, the Cyber Solidarity Act, and the Chips Act. Yet legal coverage is not the same as tested readiness.

This version strengthens the model by adding democratic safeguards early, distinguishing rights-preserving digital sovereignty from state and industrial digital control, mapping laws to operational controls, adding trigger thresholds and owners to the scenarios, replacing fine-grained maturity scores with half-step scores and confidence levels, and presenting a 12/24/36-month roadmap for Germany and the EU.

<p class="keywords">
  <strong>Keywords:</strong> AI-cyber; post-quantum cryptography; hybrid warfare; Physical AI; cyber-physical resilience; digital sovereignty; Germany; European Union; threat escalation; scenario planning; operational readiness; trust infrastructure; critical infrastructure; digital identity; frontier AI; superintelligent AI.
</p>
</section>
<h2 id="central-thesis">Central thesis</h2>

<div class="paper-thesis">
  <strong>Central thesis.</strong> Germany and the EU should treat AI-enabled cyber operations, hybrid warfare, post-quantum cryptography, digital identity, software supply chains, Physical AI, cyber-physical autonomy, and frontier AI including the emergence of superintelligent AI as one coupled escalation problem. The next systemic crisis is unlikely to be caused by one isolated technology. It is more likely to arise from interacting failures across digital trust, public administration, finance, industrial systems, critical infrastructure, public communication, and security policy. The policy priority is therefore not only new law. It is tested readiness: cross-domain scenarios, measurable implementation dashboards, secure trust infrastructure, and rehearsed escalation paths.
</div>

<h2 id="key-policy-messages">Key policy messages</h2>

The following table summarises the main policy messages for German and EU decision-makers. It also adds ownership and a first measurable indicator for each message. This is important because the paper’s main concern is implementation, not only policy recognition.

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 1.</strong> Key policy messages, ownership, and first measurable indicators.</caption>
<thead>
<tr>
<th scope="col">No.</th>
<th scope="col">Message</th>
<th scope="col">Policy implication</th>
<th scope="col">Primary owner</th>
<th scope="col">First measurable indicator</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>The relevant threat unit is no longer a single technology.</td>
<td>The highest policy risk comes from coupled escalation across AI-enabled cyber operations, hybrid warfare, cryptographic fragility, identity failure, cyber-physical systems, and social destabilisation.</td>
<td>National Security Council; Federal Chancellery; EU crisis and cyber bodies.</td>
<td>One annual cross-domain exercise covering cyber, public communication, finance, public administration, and critical infrastructure.</td>
</tr>
<tr>
<td>2</td>
<td>Trust infrastructure is national security infrastructure.</td>
<td>Identity, authentication, authorisation, certificates, signatures, credentials, revocation, logs, software signing, and provenance must be treated as critical controls for people, organisations, products, machines, and AI agents.</td>
<td>BMI, BMDS, BSI, sector regulators, eIDAS trust-service ecosystem, EU AI Office, ENISA.</td>
<td>Percentage of critical systems with phishing-resistant authentication, verifiable authority, tested revocation, and tamper-evident audit logs.</td>
</tr>
<tr>
<td>3</td>
<td>Trust infrastructure must be standards-neutral and rights-preserving.</td>
<td>Implementation should be based on open standards, interoperability, procurement neutrality, independent certification, privacy-by-design, and clear redress. This avoids a vendor-specific or surveillance-heavy interpretation.</td>
<td>BMDS, BSI, Datenschutzkonferenz, EU standardisation bodies, public procurement authorities.</td>
<td>Public architecture principles covering openness, interoperability, data minimisation, auditability, and anti-lock-in requirements.</td>
</tr>
<tr>
<td>4</td>
<td>Germany has improved strategic coordination, but execution remains the test.</td>
<td>The National Security Council created in 2025 is a material institutional improvement. It should now be used for cross-domain exercises, implementation dashboards, and escalation planning, not only strategic coordination.</td>
<td>Federal Chancellery and National Security Council.</td>
<td>Published exercise plan and after-action process for AI-cyber, PQC, hybrid threats, and cyber-physical incidents.</td>
</tr>
<tr>
<td>5</td>
<td>PQC migration is not a cryptography project.</td>
<td>It is a multi-year migration of protocols, certificates, hardware security modules, identity systems, software supply chains, embedded systems, operational technology, procurement rules, and legal evidence systems.</td>
<td>BSI, BMDS, BMI, BaFin, Bundesnetzagentur, sector regulators, critical infrastructure operators.</td>
<td>Percentage of critical systems with a cryptographic inventory and prioritised PQC migration plan.</td>
</tr>
<tr>
<td>6</td>
<td>AI-cyber capability is moving from expert tooling to institutional risk.</td>
<td>Public evaluations show that advanced AI systems can assist with complex cyber tasks. This does not prove unconstrained autonomous cyber offence at scale, but it changes the economics of vulnerability discovery, phishing, triage, and defence.</td>
<td>BSI, German AI evaluation function, ENISA, EU AI Office, critical-sector regulators.</td>
<td>Coverage of AI-cyber red-team exercises in public administration, finance, critical infrastructure, and key suppliers.</td>
</tr>
<tr>
<td>7</td>
<td>The EU is stronger in law than in operational integration.</td>
<td>The AI Act, NIS2, CRA, DORA, eIDAS 2.0, DSA, Data Act, Machinery Regulation, Product Liability Directive, CER Directive, Cyber Solidarity Act, and Chips Act form a broad legal architecture. They do not yet amount to a single readiness architecture.</td>
<td>European Commission, ENISA, EU AI Office, Member States, national regulators.</td>
<td>EU control map linking each legal instrument to operational controls, reporting duties, exercises, dashboards, and readiness metrics.</td>
</tr>
<tr>
<td>8</td>
<td>Digital sovereignty must be split into two dimensions.</td>
<td>State and industrial digital control is not the same as rights-preserving digital sovereignty. A European model must strengthen both operational capacity and individual agency under rule-of-law safeguards.</td>
<td>EU institutions, national governments, data protection authorities, parliaments.</td>
<td>Separate maturity scores for state/industrial control and rights-preserving digital sovereignty.</td>
</tr>
<tr>
<td>9</td>
<td>Germany should move from strategies to tested readiness.</td>
<td>The policy priority should shift from recognising threats to measuring resilience: patch time, PQC migration status, authentication coverage, AI red-team coverage, cyber-physical stress tests, supplier assurance, and crisis communication exercises.</td>
<td>National Security Council, BSI, BMDS, Länder, municipalities, sector regulators.</td>
<td>National resilience dashboard with public and classified tiers.</td>
</tr>
</tbody>
</table>
</div>
<h2 id="1-introduction-and-contribution">1. Introduction and contribution</h2>

Germany and the European Union have entered a phase in which technological and geopolitical risks no longer arrive as discrete policy files. Cyber-security is connected to democratic trust. AI governance is connected to cyber operations, industrial policy, labour markets, and defence. Quantum computing is connected to identity, legal evidence, software updates, secure communications, and financial infrastructure. Physical AI is connected to cyber-physical safety, industrial continuity, logistics, public security, and warfare. These links create escalation paths that are faster than ordinary legislative, procurement, and budget cycles.

The policy system has recognised many parts of the problem. The EU AI Act entered into force on 1 August 2024, with a staged application timetable [1]. The Commission’s 2026 AI Act page also reflects the AI Omnibus simplification process. After the political agreement of 7 May 2026, high-risk AI rules for systems in areas such as biometrics, critical infrastructure, education, employment, migration, asylum, and border control are scheduled to apply from 2 December 2027, while high-risk AI rules for systems embedded into regulated products are scheduled to apply from 2 August 2028 [1]. The Cyber Resilience Act entered into force on 10 December 2024, with main obligations applying later and reporting duties starting earlier [2]. NIS2 required Member States to transpose cyber-security rules by 17 October 2024 [3]. DORA has applied to the financial sector since 17 January 2025 [4]. The revised eIDAS framework and the EU Digital Identity Wallet programme are being implemented, and the Commission has proposed European Business Wallets for companies [5, 6]. The Digital Services Act creates systemic-risk duties for very large online platforms and search engines, including risks related to electoral processes and civic discourse [44]. The Data Act has applied since 12 September 2025 and is relevant to connected products, industrial machinery, data access, and cloud/data-service governance [45]. The Machinery Regulation and the revised Product Liability Directive update EU rules for connected machinery, software-driven products, and digital liability [7, 8].

This is a strong legislative record. Yet legal coverage is not the same as operational readiness. The main problem is not that Germany and the EU lack strategies or legal texts. The problem is that escalation pathways between domains remain underdeveloped in policy planning. A cyber attack on a municipality may become a public trust crisis. A breach of a software supplier may become an industrial production shock. A deepfake released during a data leak may undermine confidence in an election. A quantum-relevant breakthrough may call into question signatures, certificates, software updates, legal evidence, and long-term confidentiality. A compromised robot, drone, vehicle, or industrial control system may create physical harm. A future highly capable AI system may compress the time available for all of these responses.

This paper proposes a threat escalation and operational readiness model for policy makers, senior civil servants, parliamentary staff, national security experts, cyber-security teams, AI governance teams, industrial policy teams, and strategic foresight units in Germany and the EU. It is not a technical manual. It is a policy model for understanding how threat domains interact, how they amplify, and how implementation maturity can be measured.

The paper makes six contributions. First, it defines a five-layer escalation model from individual sovereignty to frontier systemic risk. Second, it treats AI-enabled cyber capabilities, quantum risk, hybrid warfare, and Physical AI as coupled domains rather than separate policy areas. Third, it develops nine structured scenarios with trigger thresholds, lead owners, first-response actions, and readiness metrics. Fourth, it maps EU legal instruments to operational controls. Fifth, it compares policy maturity across Germany, the EU, the United States, China, Japan, South Korea, and Canada using half-step scores, evidence notes, and confidence levels. Sixth, it proposes a 12/24/36-month roadmap for Germany and the EU.

The argument is critical but not alarmist. It does not claim that superintelligent AI currently exists, nor that quantum computers are already breaking public-key cryptography at scale. It does not attribute unsupported capabilities to named AI systems. It does claim that capability trends are significant enough to require a policy reset. The relevant policy failure would not be a failure to predict one exact future event. It would be a failure to build institutional capacity for cross-domain escalation before the next crisis tests it.
<h2 id="2-scope-definitions-and-method">2. Scope, definitions, and method</h2>

<h3 id="2-1-scope">2.1 Scope</h3>

The scope is technology-driven and technology-amplified systemic risk. The paper includes risks to democratic sovereignty, national security, cyber-security, critical infrastructure, industrial competitiveness, economic stability, financial systems, public safety, social cohesion, warfare, supply chains, labour markets, public administration, European strategic autonomy, digital trust infrastructure, AI governance, and cyber-physical systems.

Six threat domains are in scope: human privacy and digital sovereignty; hybrid warfare and cyber threats; advanced AI-enabled cyber capabilities; quantum threats to digital trust infrastructure; frontier AI, including prospective superintelligent AI as a horizon-risk category; and Physical AI and cyber-physical autonomy. These domains are selected because they are both high-impact and increasingly interdependent.

Several important risks are outside the main scope. Climate change, general energy security, pandemics, migration policy, demographic change, broad fiscal policy, and general education policy are not treated as independent risk fields. They may appear where they interact directly with the threat model. This exclusion is not a judgement on their importance. It is a scope decision. The paper focuses on technology-driven escalation and the governance gap around it.

<h3 id="2-2-definitions">2.2 Definitions</h3>

<strong>Rights-preserving digital sovereignty</strong> means the ability of persons, companies, public authorities, and democratic institutions to act with agency in digital environments while preserving privacy, informational self-determination, rule of law, accountability, redress, and meaningful choice. At the individual level, it includes control over identity, data exposure, consent, authentication, and the ability to distinguish authentic from manipulated communication. At the organisational level, it includes verifiable identity, mandate management, auditability, data minimisation, and portability.

<strong>State and industrial digital control</strong> means the ability of public authorities and strategic industries to maintain control over critical digital dependencies, including cloud, chips, software, cryptography, data, AI models, hardware, operational technology, cyber-physical systems, and supply chains. It is a capacity concept. It is not automatically rights-preserving. For this reason, Section 7 scores state/industrial control separately from rights-preserving digital sovereignty.

<strong>Trust infrastructure</strong> means the technical and organisational layer that allows a digital society to know who acted, with what authority, on which data, through which system, and under which rules. It includes identity, authentication, authorisation, digital signatures, certificates, credentials, revocation, audit logs, timestamps, software signing, provenance, and evidence preservation. In a European model, trust infrastructure should be standards-neutral, interoperable, independently certifiable, procurement-neutral, privacy-preserving, and resistant to vendor lock-in.

<strong>AI-enabled cyber capabilities</strong> are AI systems that support software analysis, vulnerability discovery, exploit support, phishing, social engineering, reconnaissance, attack planning, defensive detection, incident response, or vulnerability management. The paper uses Claude Mythos Preview as a specific public example only where published evaluations exist. It does not assume undisclosed proprietary capabilities. Claims about named systems are limited to published evaluations and are framed as evidence about capability trends, not as proof of unconstrained real-world autonomous offence [9, 10].

<strong>Frontier AI</strong> means highly capable general-purpose AI systems near the leading edge of available capability. <strong>Superintelligent AI</strong> is used only as a horizon-risk category for AI systems that would exceed human-level performance across a broad set of strategically relevant cognitive tasks. The paper does not claim that such systems currently exist. It treats the category as relevant because advanced AI capability growth could reduce institutional response time, concentrate strategic advantage, and shift the balance between public authorities and private or hostile actors [11, 12].

<strong>Physical AI</strong> means AI systems that act in, sense, or control the physical world. It includes robots, drones, autonomous vehicles, industrial machines, logistics systems, medical robots, smart grids, cyber-physical infrastructure, and automated factories.

<strong>AI agents</strong> are AI systems that can plan, call tools, access systems, initiate transactions, or act on behalf of a person, company, public authority, machine, or software service. In high-risk contexts, agents require verifiable authority, scope limits, time limits, revocation, audit logs, and liability mapping.

<h3 id="2-3-democratic-safeguards-and-boundary-conditions">2.3 Democratic safeguards and boundary conditions</h3>

This paper treats security as a democratic resilience function, not as a reason to weaken democratic rights. A broad threat model can create a risk of over-securitisation if it is used to justify intrusive surveillance, vague emergency powers, or disproportionate restrictions on speech. That would undermine the same democratic sovereignty the model is meant to protect.

Any German or EU response should therefore satisfy eight boundary conditions:

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 2.</strong> Democratic safeguards for cross-domain readiness.</caption>
<thead>
<tr>
<th scope="col">Safeguard</th>
<th scope="col">Operational meaning</th>
</tr>
</thead>
<tbody>
<tr>
<td>Clear legal basis</td>
<td>Security measures must be grounded in law, with defined purpose, scope, authority, and review process.</td>
</tr>
<tr>
<td>Proportionality</td>
<td>Controls should match the severity and likelihood of the risk. Routine risks should not justify emergency powers.</td>
</tr>
<tr>
<td>Parliamentary and judicial oversight</td>
<td>Powerful monitoring, attribution, and crisis-response measures require independent checks.</td>
</tr>
<tr>
<td>Transparency where possible</td>
<td>Public metrics, architecture principles, and after-action summaries should be published where this does not create operational risk.</td>
</tr>
<tr>
<td>Privacy-preserving design</td>
<td>Identity, wallet, agent-authority, and crisis-communication systems should minimise data exposure and avoid unnecessary centralisation.</td>
</tr>
<tr>
<td>Redress and contestability</td>
<td>Citizens and companies need channels to challenge wrong identity, authority, content, risk, or enforcement decisions.</td>
</tr>
<tr>
<td>Sunset clauses for extraordinary powers</td>
<td>Temporary crisis powers should expire unless renewed through a clear democratic process.</td>
</tr>
<tr>
<td>Open standards and procurement neutrality</td>
<td>Trust infrastructure should avoid vendor lock-in and should be based on interoperable, auditable, standards-based components.</td>
</tr>
</tbody>
</table>
</div>

These safeguards also answer a likely objection to the paper: that it securitises too many policy areas. The intended response is narrower. The paper argues that certain policy areas become security-relevant when they are part of escalation chains. It does not argue that all social, economic, or speech policy should be run as security policy.

<h3 id="2-4-evidence-hierarchy-and-limits">2.4 Evidence hierarchy and limits</h3>

The evidence hierarchy is deliberately conservative. Primary sources are preferred: official EU, German, NATO, NIST, CISA, BSI, ENISA, Europol, EEAS, central bank, national AI safety institute, and national government documents. Peer-reviewed academic research and high-quality policy research are used where available. Vendor sources are used only for claims about the vendor’s own published system or evaluation and only where those claims are framed cautiously.

Table 3 defines the evidence-confidence labels used in the maturity assessment.

<div class="table-scroll">
<table class="academic-table maturity-table">
<caption><strong>Table 3.</strong> Evidence-confidence labels.</caption>
<thead>
<tr>
<th scope="col">Confidence</th>
<th scope="col">Typical evidence</th>
<th scope="col">Limit</th>
</tr>
</thead>
<tbody>
<tr>
<td>High</td>
<td>Binding law, official standards, official institutional mandates, published application dates, public budgets, formal roadmaps.</td>
<td>Public legal existence still does not prove operational effectiveness.</td>
</tr>
<tr>
<td>Medium</td>
<td>Official strategies, agency reports, public evaluations, sector threat reports, visible exercises, credible expert assessments.</td>
<td>Implementation quality may be uneven or not publicly visible.</td>
</tr>
<tr>
<td>Low</td>
<td>Capability forecasts, frontier AI extrapolations, quantum timelines, classified-readiness estimates, vendor-only claims.</td>
<td>Useful for horizon scanning, but not sufficient for strong operational claims.</td>
</tr>
</tbody>
</table>
</div>

Three limits are important. First, public evidence about frontier AI capabilities is incomplete. Evaluations are often controlled, benchmark-dependent, and not always a direct proxy for operational real-world performance. Second, public evidence about national preparedness is uneven. A state may have classified programmes that are not visible. Conversely, a public strategy may overstate operational readiness. Third, the maturity scoring in Section 7 is structured expert judgement, not statistical measurement. It is intended to make assumptions visible and comparable.

<h3 id="2-5-method">2.5 Method</h3>

The method has five steps. First, the paper defines an integrated five-layer threat escalation model. Second, it analyses six threat domains and their policy relevance. Third, it identifies amplification effects between domains and maps relevant EU laws to operational controls. Fourth, it uses nine scenarios to test escalation chains. Fifth, it applies a comparative maturity model to seven jurisdictions.

The maturity model uses six levels: Level 0 means no meaningful recognition; Level 1 means discussion and expert debate; Level 2 means strategies and political statements; Level 3 means laws, standards, and assigned institutions; Level 4 means funded implementation programmes; and Level 5 means operational readiness, testing, and continuous adaptation. Scores are reported in half steps only. This avoids false precision. Each jurisdiction also receives a confidence label and an evidence note. A jurisdiction can score strongly on law while remaining weak in implementation. This distinction is central to the analysis.

The maturity model is based on public evidence. It does not claim to measure classified programmes, internal crisis plans, or unpublished budgets. Where public evidence is weak, the score is lower confidence even if the jurisdiction may have stronger hidden capacity.
<h2 id="3-integrated-threat-escalation-model">3. Integrated threat escalation model</h2>

The proposed model has five layers. It begins with individual and societal sovereignty and ends with frontier systemic risk. The model is not a ladder in which every incident moves step by step. It is a map of escalation paths and feedback loops. An incident can begin at any layer and propagate to others.

Table 4 sets out the five-layer threat escalation stack and the policy question attached to each layer.

<div class="table-scroll">
<table class="academic-table taxonomy-table">
<caption><strong>Table 4.</strong> Five-layer threat escalation stack.</caption>
<thead>
<tr>
<th scope="col">Layer</th>
<th scope="col">Primary object at risk</th>
<th scope="col">Main threat logic</th>
<th scope="col">Policy question</th>
</tr>
</thead>
<tbody>
<tr>
<td>1. Individual and societal sovereignty</td>
<td>Privacy, identity, autonomy, public opinion, democratic discourse</td>
<td>Profiling, manipulation, identity abuse, deepfakes, surveillance, social engineering</td>
<td>Can citizens and organisations act freely and trust information?</td>
</tr>
<tr>
<td>2. Institutional and economic systems</td>
<td>Government services, companies, hospitals, banks, universities, utilities, insurers</td>
<td>Ransomware, data theft, AI-enabled intrusion, fraud, supply-chain compromise</td>
<td>Can institutions function under digital pressure?</td>
</tr>
<tr>
<td>3. Critical infrastructure and cyber-physical systems</td>
<td>Energy, transport, telecom, logistics, healthcare, water, manufacturing, robotics</td>
<td>Operational technology compromise, cyber-physical sabotage, unsafe autonomy</td>
<td>Can essential services continue during attack or failure?</td>
</tr>
<tr>
<td>4. Geopolitical and military escalation</td>
<td>State stability, deterrence, elections, defence, foreign policy</td>
<td>Hybrid warfare, sabotage, espionage, coercion, cyber conflict, autonomous systems</td>
<td>Can the state respond without escalation loss or democratic harm?</td>
</tr>
<tr>
<td>5. Frontier systemic risk</td>
<td>Digital trust layer, institutional control, financial confidence, human agency</td>
<td>Quantum disruption, frontier AI, autonomous physical systems, cascading failure</td>
<td>Can political systems govern high-impact capability shifts in time?</td>
</tr>
</tbody>
</table>
</div>

Four feedback loops are especially relevant for Germany and the EU.

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 5.</strong> Illustrative escalation feedback loops.</caption>
<thead>
<tr>
<th scope="col">Feedback loop</th>
<th scope="col">Why it matters</th>
<th scope="col">Readiness test</th>
</tr>
</thead>
<tbody>
<tr>
<td>Privacy loss → targeted phishing → public-service compromise → public trust crisis</td>
<td>Personal and organisational data improve attack credibility and can turn a technical incident into a political incident.</td>
<td>Can compromised credentials be revoked quickly, and can citizens verify official communication?</td>
</tr>
<tr>
<td>Software supplier breach → industrial shutdown → shortage rumours → financial or political stress</td>
<td>Industrial dependencies can become hybrid-war pressure points when cyber incidents are paired with public narratives.</td>
<td>Are critical suppliers mapped, segmented, and included in exercises?</td>
</tr>
<tr>
<td>Quantum trust shock → certificate distrust → software update uncertainty → public-sector paralysis</td>
<td>Cryptographic trust is a shared dependency. A trust shock can affect many sectors at once.</td>
<td>Do critical systems have cryptographic inventories, crypto-agility, and PQC migration plans?</td>
</tr>
<tr>
<td>Robotic or OT compromise → physical harm → liability dispute → loss of confidence in automation</td>
<td>Physical AI and operational technology convert digital failure into safety, insurance, and regulatory risk.</td>
<td>Are cyber-physical stress tests, kill-switch tests, and authority logs run regularly?</td>
</tr>
</tbody>
</table>
</div>

<h3 id="3-1-escalation-mechanisms">3.1 Escalation mechanisms</h3>

Five mechanisms explain why these layers interact.

First, <strong>speed amplification</strong>. AI can shorten the time between vulnerability discovery, exploit support, phishing design, translation, and attack execution. Recent public evaluations by the UK AI Security Institute and the UK National Cyber Security Centre indicate that frontier AI systems are becoming more capable on cyber tasks, although these evaluations remain task-specific and should not be read as full real-world autonomy [9, 13, 14].

Second, <strong>scope amplification</strong>. A digital society is made of shared dependencies. Cloud platforms, identity providers, certificate authorities, code repositories, software libraries, chip supply chains, model providers, and operational technology vendors can connect many institutions. A compromise in one dependency may affect many sectors.

Third, <strong>trust erosion</strong>. Cyber incidents increasingly become political events. A real breach can be mixed with forged documents. A service outage can be framed as government collapse. An authentic video can be dismissed as synthetic. The result is not only false belief. It is uncertainty and delay.

Fourth, <strong>physical translation</strong>. Robotics, operational technology, connected vehicles, medical devices, drones, and automated logistics convert software failure into safety risk. EU machinery and product liability reforms acknowledge this direction by updating rules for connected machinery, digital elements, software, and product safety [7, 8].

Fifth, <strong>response-time compression</strong>. Cryptographic migration, public procurement, industrial retrofitting, federal coordination, judicial oversight, and legislation take years. AI capability shifts and adversarial operations can move faster. When response time is compressed, governance itself becomes the bottleneck.

<h3 id="3-2-why-state-capacity-is-the-bottleneck">3.2 Why state capacity is the bottleneck</h3>

The limiting factor is often not the absence of knowledge. It is the ability of the state to act. A state must detect weak signals, assess technical meaning, assign ownership, fund mitigation, update procurement, work with industry, test response, communicate with the public, and adapt. Each of these steps can fail.

Germany’s creation of a National Security Council in August 2025 is therefore relevant. The Federal Government describes the council as a body that pools national security expertise, bridges internal, external, economic, digital, civil, and military security, and contributes to crisis simulations and security-policy exercises [15]. This is a positive institutional development. The question is whether it will be used to integrate AI-cyber, PQC, trust infrastructure, hybrid warfare, Physical AI, finance, public administration, and industrial resilience into a single readiness model.
<h2 id="4-threat-domain-analysis">4. Threat domain analysis</h2>

<h3 id="4-1-human-privacy-and-rights-preserving-digital-sovereignty">4.1 Human privacy and rights-preserving digital sovereignty</h3>

Human privacy and rights-preserving digital sovereignty are the base layer of democratic resilience. The issue is not only whether personal data are protected. It is whether citizens and organisations can maintain agency in an environment of profiling, behavioural prediction, synthetic media, identity theft, personalised persuasion, and automated social engineering.

OECD.AI identifies AI-related risks that are already materialising, including manipulation, polarisation, privacy infringement, bias, discrimination, and surveillance [16]. These risks are often treated as fundamental-rights issues. They are also security issues. A population that can be profiled and targeted at scale is easier to manipulate. A company whose executives, suppliers, and employees are exposed through data brokers is easier to phish. A public authority whose staff identity credentials are weak is easier to impersonate. A democracy whose citizens no longer trust authentic public communication is less resilient during crisis.

The link between privacy and national security is therefore direct. Personal data, behavioural data, location data, biometric data, social graphs, and organisational data are inputs to cyber operations and hybrid influence campaigns. They support reconnaissance, credibility, timing, target selection, and coercion. This does not mean that privacy should be subordinated to security. It means that privacy protection, data minimisation, secure identity, and verifiable communication are security controls as well as rights controls.

Digital sovereignty also applies to legal persons and public authorities. Companies need verifiable identity, representation rights, mandate management, revocation, logging, and audit. Public authorities need trusted digital channels to communicate with citizens. This is why the European Digital Identity Wallet and the proposed European Business Wallet are relevant to security, not only to administrative convenience [5, 6]. If properly designed, they can become part of a European trust infrastructure for citizens, companies, public bodies, products, machines, and AI agents.

The policy risk is that privacy, identity, and digital trust are treated as compliance files rather than resilience functions. That would be a category error. Privacy and identity are strategic controls. They must, however, be implemented with privacy-preserving architecture and independent oversight.

<h3 id="4-2-hybrid-warfare-and-cyber-threats">4.2 Hybrid warfare and cyber threats</h3>

Hybrid warfare combines military and non-military means, overt and covert methods, information manipulation, cyber operations, economic pressure, sabotage, espionage, and legal ambiguity. NATO and the Council of the EU both define hybrid threats as coordinated combinations of such instruments [17, 18]. This matters because cyber-security incidents can be used as components of wider political operations.

Germany is a high-value target for hybrid pressure. It is a leading EU economy, a NATO member, a major industrial exporter, a central actor in European policy, and a visible participant in Ukraine-related security debates. It is also a federal state with complex administrative structures and many critical supply chains. A hybrid adversary does not need to defeat Germany militarily to impose costs. It can create uncertainty, slow decisions, undermine trust, trigger public fear, and amplify domestic division.

Cyber threats remain severe. BSI’s 2025 report describes the German IT security situation as tense and highlights the need for resilience [19]. ENISA’s threat landscape work shows continued cyber pressure across Europe, including ransomware and public-administration exposure [20, 21]. Europol’s IOCTA 2025 explains how cybercriminals trade illegal access, data, and services in a commodified ecosystem [22]. These trends create an operating environment in which state, proxy, and criminal actors can interact.

The Digital Services Act is directly relevant to this threat domain. It requires very large online platforms and search engines to identify, analyse, and mitigate systemic risks related to electoral processes and civic discourse while protecting freedom of expression [44]. This does not solve disinformation by itself. It creates a legal basis for platform-risk governance that should be connected to cyber incident response, election protection, and public crisis communication.

Hybrid warfare exploits real weaknesses. A ransomware attack on a municipality can be framed as evidence of state failure. A leak from a political party can be mixed with forged content. A supply-chain compromise can be timed with disinformation about shortages. A cyber attack on a hospital can be used to generate fear. The operational link is therefore not cyber plus information. It is cyber as a trigger for social and political effects.

Germany’s industrial structure increases the stakes. SMEs are central to the German economy. IfM Bonn reports that in 2023 about 3.44 million German enterprises were SMEs, accounting for 99.2 percent of enterprises with turnover or employees, and that SMEs employed about 19.1 million people, or 53.1 percent of total employment [23]. Many SMEs are part of advanced industrial supply chains. Their cyber-security weaknesses can become systemic vulnerabilities.

<h3 id="4-3-advanced-ai-enabled-cyber-capabilities">4.3 Advanced AI-enabled cyber capabilities</h3>

AI-enabled cyber capability is no longer a speculative concern. It is becoming a policy-relevant capability class. AI systems can assist with code analysis, vulnerability discovery, exploit reasoning, phishing, translation, reconnaissance, privilege-escalation support, attack planning, and incident response. They can also support defence through log analysis, vulnerability prioritisation, code review, malware analysis, anomaly detection, and incident triage.

The key policy question is asymmetry. Defenders must protect broad, old, interconnected, and often poorly documented infrastructures. Attackers may need only one successful path. If AI reduces the skill barrier, shortens the reconnaissance cycle, improves phishing credibility, or automates parts of exploit development, it changes the economics of cyber conflict.

Recent public evidence should be read carefully. The UK AI Security Institute and Anthropic have published material on Claude Mythos Preview and its cyber-task performance [9, 10]. The UK AI Security Institute reported continued improvement in capture-the-flag challenges and significant improvement on multi-step cyber-attack simulations [9]. This does not prove that such systems can autonomously conduct real-world attacks under all defensive conditions. It does show that frontier AI cyber capabilities are improving in controlled evaluations. The UK National Cyber Security Centre has also warned cyber defenders to prepare for frontier AI because attacker and defender capabilities are changing quickly [14].

The defensive opportunity is also significant. AI can help defenders identify vulnerable code, detect anomalies, summarise logs, automate incident documentation, prioritise patches, and support under-resourced security teams. This is especially relevant for public administration and SMEs. The danger is that defensive institutions may adopt such tools more slowly than attackers, because procurement, certification, legal review, privacy assessment, and budget processes can delay adoption. The risk is not AI itself. The risk is asymmetric adoption under weak governance.

<h3 id="4-4-quantum-threat-to-digital-trust-infrastructure">4.4 Quantum threat to digital trust infrastructure</h3>

Quantum computing is a long-horizon but urgent risk for digital trust. A sufficiently capable cryptographically relevant quantum computer would threaten widely used public-key cryptography. This affects secure communications, digital signatures, identity systems, certificates, software updates, wallets, blockchain systems, long-lived records, defence communications, financial systems, and legal evidence.

NIST finalised the first three post-quantum cryptography standards in August 2024 [24]. This was a major step, but standardisation is not migration. CISA, NSA, NIST, and BSI guidance emphasises inventory, cryptographic discovery, supplier engagement, planning, and crypto-agility [25, 26]. NATO’s Quantum Technologies Strategy also frames quantum technologies as relevant to cyber-security and defence, with both offensive and defensive implications [27].

The most immediate quantum risk is not necessarily that encrypted traffic is being decrypted today. It is harvest-now-decrypt-later. Adversaries can collect encrypted data now and decrypt it later if quantum capability becomes available. This matters for state secrets, diplomatic communications, health records, defence data, industrial intellectual property, legal archives, trade secrets, financial data, and identity credentials.

PQC migration is not a cryptographic algorithm swap. It is a migration of trust infrastructure. It affects protocols, certificates, HSMs, key management, software libraries, firmware, wallets, eID systems, software signing, embedded devices, industrial control systems, procurement rules, compliance frameworks, audit trails, and legal evidence preservation. Public institutions must know where cryptography is used, which assets need long-term confidentiality, which systems are crypto-agile, which suppliers can support PQC, and which migration priorities are highest.

The policy danger for Germany and Europe is underestimating the operational scale. If migration begins only after a credible quantum shock, the time window may be too short. PQC is therefore a national resilience programme, not only a technical standard.

<h3 id="4-5-frontier-ai-and-prospective-superintelligent-ai">4.5 Frontier AI and prospective superintelligent AI</h3>

Frontier AI is an observable policy challenge. Prospective superintelligent AI is a horizon-risk category with high impact and high uncertainty. The two should not be conflated. Current policy should focus on measurable frontier AI risks while keeping enough institutional foresight to handle more extreme capability shifts.

The International AI Safety Report synthesises risks from general-purpose AI, including misuse, malfunction, systemic effects, and governance challenges [11]. Its 2025 update notes continuing capability advances and risk implications in areas such as cyber attacks, biological risks, monitoring, and controllability [12]. These are not only future concerns. Some are already relevant to cyber-security, public communication, privacy, and institutional decision-making.

Three horizons are useful. Near-term risks include automated persuasion, AI-assisted cyber operations, synthetic media, data leakage, privacy erosion, dependence on a small number of model providers, and labour-market stress. Medium-term risks include AI systems that support scientific discovery, weapons-relevant research, cyber operations, strategic deception, autonomous agents, and policy manipulation. Long-term frontier risks include loss of meaningful human control, systems with strategic planning capacities, rapid capability jumps, misaligned objectives, and institutional inability to respond at the required speed.

The policy issue is governance lag. AI systems can improve through model scaling, reasoning techniques, tool use, agentic scaffolding, and deployment integration. Political institutions move through consultation, legislation, transposition, procurement, judicial review, and budget cycles. A capability that changes in months can meet a governance system that acts in years.

NIST’s Center for AI Standards and Innovation focuses on demonstrable risks such as cybersecurity, biosecurity, and chemical weapons [28]. NIST has also launched an AI Agent Standards Initiative for interoperability and security [29]. This is the right direction: advanced AI governance must become operational. It must include evaluation, incident reporting, secure deployment, agent authority controls, model supply-chain security, red-teaming, and public-sector expertise.

For Germany and the EU, the key question is not whether superintelligent AI will arrive by a particular date. The question is whether institutions can detect, test, constrain, and respond to rapidly changing AI capability. A policy system that waits for certainty will respond too late.

<h3 id="4-6-physical-ai-and-cyber-physical-autonomy">4.6 Physical AI and cyber-physical autonomy</h3>

Physical AI refers to AI systems that act in, sense, or control the physical world. It includes industrial robots, drones, autonomous vehicles, warehouse systems, logistics systems, medical robots, automated factories, smart grids, defence systems, and connected infrastructure. A frontier version of this risk would involve highly capable AI systems controlling or coordinating physical systems with substantial autonomy.

The risk is the transition from digital harm to physical harm. A compromised text model can mislead. A compromised robot, drone, industrial control loop, medical device, vehicle, port system, or energy component can injure people, stop production, damage equipment, or trigger escalation.

EU law is moving toward this reality. The Machinery Regulation applies from 20 January 2027 and modernises machinery safety rules [7]. The revised Product Liability Directive updates liability for defective products in a digital environment and covers software-related product risks [8]. The AI Omnibus political agreement also clarifies the interplay between the AI Act and EU product safety laws, including the Machinery Regulation [1]. These instruments matter, but they are not enough. Physical AI requires secure updates, authority management, sensor integrity, model provenance, cyber-security, safety cases, human override, incident reporting, and supply-chain assurance.

Germany’s exposure is high because of its industrial base. Automotive, machinery, chemicals, energy, ports, logistics, healthcare, and automated manufacturing all depend on cyber-physical systems. A cyber-physical incident can create production loss, safety risk, insurance exposure, export disruption, and political consequences. The failure mode is not only a robot accident. It is a cascade across suppliers, logistics, public communication, and market confidence.

Physical AI therefore requires a security architecture that connects cyber-security, safety regulation, product liability, operational technology, AI assurance, and industrial policy. It also requires new authority models. An AI agent or robotic system that acts for a company, a public authority, or a machine must have verifiable authority, scope, time limits, revocation, and auditability.
<h2 id="5-interdependencies-and-amplification-effects">5. Interdependencies and amplification effects</h2>

The threat domains do not merely coexist. They amplify each other. This is the central reason why separate policy treatment is insufficient. Table 6 summarises the most important directed couplings, their time horizon, confidence level, and a leading indicator that can be measured.

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 6.</strong> Directed interdependency matrix with indicators.</caption>
<thead>
<tr>
<th scope="col">Directed coupling</th>
<th scope="col">Amplification effect</th>
<th scope="col">Time horizon</th>
<th scope="col">Confidence</th>
<th scope="col">Leading indicator</th>
</tr>
</thead>
<tbody>
<tr>
<td>AI-enabled cyber → cyber-security</td>
<td>Faster code analysis, vulnerability discovery, exploit support, phishing, translation, reconnaissance, and attack-path generation.</td>
<td>Now</td>
<td>High</td>
<td>AI-cyber red-team findings; phishing success rates; exploit-triage speed.</td>
</tr>
<tr>
<td>Cyber-security → hybrid warfare</td>
<td>A real breach or outage becomes material for disinformation, blame, coercion, or public trust erosion.</td>
<td>Now</td>
<td>High</td>
<td>Number of major incidents with coordinated information manipulation indicators.</td>
</tr>
<tr>
<td>AI → hybrid warfare</td>
<td>Synthetic media, bots, multilingual propaganda, narrative testing, micro-targeting, and automated persuasion reduce the cost of influence operations.</td>
<td>Now</td>
<td>High</td>
<td>Detection time for synthetic media and time to publish verified public correction.</td>
</tr>
<tr>
<td>Privacy loss → cyber and influence</td>
<td>Data brokers, leaks, and profiling improve targeting for phishing, coercion, and manipulation.</td>
<td>Now</td>
<td>High</td>
<td>Exposure of staff, suppliers, executives, and public officials in data-broker and leak datasets.</td>
</tr>
<tr>
<td>Quantum → trust infrastructure</td>
<td>Cryptographic fragility affects identity, digital signatures, certificates, software updates, secure communication, archives, and legal evidence.</td>
<td>Medium to long term, but migration must start now</td>
<td>Medium</td>
<td>Percentage of critical systems with cryptographic inventory and PQC migration plan.</td>
</tr>
<tr>
<td>AI + quantum → response-time compression</td>
<td>AI increases cyber tempo while quantum risk creates structural migration pressure.</td>
<td>Medium term</td>
<td>Medium</td>
<td>Percentage of critical systems with crypto-agile architecture and tested hybrid migration path.</td>
</tr>
<tr>
<td>Physical AI → physical harm</td>
<td>Digital compromise can affect factories, vehicles, drones, hospitals, warehouses, ports, rail, and energy systems.</td>
<td>Now to medium term</td>
<td>Medium-high</td>
<td>Number and quality of cyber-physical stress tests by sector.</td>
</tr>
<tr>
<td>Supply-chain dependency → all domains</td>
<td>Cloud, chips, models, software libraries, certificate authorities, identity providers, robotics components, and data services create shared failure modes.</td>
<td>Now</td>
<td>High</td>
<td>Dependency concentration index for critical digital functions.</td>
</tr>
<tr>
<td>Data access and provenance → AI and industrial resilience</td>
<td>Connected-product and industrial data can improve resilience, but weak provenance can corrupt AI systems, compliance processes, and supply-chain decisions.</td>
<td>Now to medium term</td>
<td>Medium</td>
<td>Percentage of high-risk systems with data lineage, access-rights records, and provenance controls.</td>
</tr>
<tr>
<td>Labour and economic shocks → social stability</td>
<td>Job displacement, disinformation, financial stress, and public service disruption can reinforce each other.</td>
<td>Medium term</td>
<td>Medium</td>
<td>Regional labour-market stress indicators linked to disinformation monitoring and public communication plans.</td>
</tr>
<tr>
<td>Weak state capacity → all domains</td>
<td>Slow procurement, unclear ownership, limited expert capacity, and fragmented federal structures create delayed response.</td>
<td>Now</td>
<td>High</td>
<td>Percentage of after-action recommendations closed within assigned deadlines.</td>
</tr>
</tbody>
</table>
</div>

<h3 id="5-1-trust-infrastructure-as-the-missing-cross-cutting-layer">5.1 Trust infrastructure as the missing cross-cutting layer</h3>

The most important missing component in many policy debates is trust infrastructure. Cyber-security policy often focuses on systems, networks, and incident reporting. AI policy often focuses on risk classes, transparency, and model obligations. Digital identity policy often focuses on service access. Quantum policy often focuses on algorithms. Robotics safety focuses on machinery and liability. These are all necessary, but the shared control layer is trust.

Without strong trust infrastructure, the state cannot reliably authenticate public communication, companies cannot verify representation rights, software updates cannot be trusted, AI agents cannot be bounded, machines cannot prove authority, and logs cannot support accountability. The result is a broad attack surface for false authority.

For Germany and the EU, this creates a positive policy opportunity. eIDAS 2.0, the EU Digital Identity Wallet, the proposed European Business Wallet, NIS2, CRA, DORA, the DSA, the Data Act, and PQC migration can be integrated into one operational trust architecture. This architecture should include natural persons, legal persons, public authorities, products, devices, machines, software services, and AI agents.

This architecture must be standards-neutral and rights-preserving. It should rely on open standards where possible, avoid single-vendor dependency, support independent certification, preserve privacy through selective disclosure and data minimisation, and provide clear redress. These design requirements are not optional. They are needed to avoid both vendor capture and surveillance creep.

<h3 id="5-2-software-data-model-and-agent-supply-chains">5.2 Software, data, model, and agent supply chains</h3>

Four supply chains require more direct attention.

The <strong>software supply chain</strong> includes open-source dependencies, build systems, package repositories, signing keys, CI/CD systems, software bills of materials, dependency confusion, compromised maintainers, and update channels. The Cyber Resilience Act is relevant because it creates mandatory cyber-security requirements for products with digital elements [2]. Yet product regulation alone will not secure all software dependencies used inside public administration or industrial control systems.

The <strong>data supply chain</strong> includes the origin, integrity, permission status, lineage, quality, access rights, and change history of data used in AI systems, public administration, compliance systems, connected products, and supply chains. The Data Act is relevant because it creates cross-sector rules for access to and use of data from connected devices, including cars and industrial machinery [45]. Without data provenance, AI systems can amplify corrupted or unauthorised information.

The <strong>model supply chain</strong> includes foundation models, fine-tuned models, model weights, datasets, toolchains, agents, plugins, evaluation reports, deployment environments, runtime monitoring, and model update channels. Model provenance should become a normal part of high-risk AI procurement and operation.

The <strong>agent supply chain</strong> is newer. AI agents acting for humans, companies, public authorities, or machines need verifiable authority, scope, time limits, revocation, auditability, liability mapping, and policy enforcement. This is the frontier identity problem. It should be solved before agentic AI becomes deeply embedded in administration, finance, logistics, and industrial systems.

<h3 id="5-3-eu-legal-stack-to-operational-controls">5.3 EU legal stack to operational controls</h3>

A likely objection is that the EU already has laws covering most of the domains in this paper. That objection is partly correct. The EU does have a broad legal stack. The remaining gap is conversion into operational controls, exercises, dashboards, procurement requirements, and tested resilience. Table 7 maps key legal instruments to the operational controls they should drive.

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 7.</strong> From EU legal instruments to operational readiness controls.</caption>
<thead>
<tr>
<th scope="col">Legal instrument</th>
<th scope="col">Primary relevance</th>
<th scope="col">Operational control</th>
<th scope="col">Readiness indicator</th>
</tr>
</thead>
<tbody>
<tr>
<td>AI Act</td>
<td>High-risk AI, GPAI, AI governance, transparency, market supervision.</td>
<td>AI risk management, technical documentation, human oversight, incident reporting, model evaluation, agent controls in high-risk contexts.</td>
<td>Percentage of high-risk AI systems with tested risk controls, model provenance, and incident process.</td>
</tr>
<tr>
<td>NIS2</td>
<td>Cyber-security of essential and important entities.</td>
<td>Risk management, incident reporting, management accountability, supplier security, minimum cyber controls.</td>
<td>Coverage of NIS2 entities with tested incident response and reporting drills.</td>
</tr>
<tr>
<td>Cyber Resilience Act</td>
<td>Products with digital elements.</td>
<td>Secure-by-design, vulnerability handling, secure updates, product security lifecycle, incident reporting.</td>
<td>Percentage of critical products with SBOM, secure update process, vulnerability disclosure, and signing controls.</td>
</tr>
<tr>
<td>DORA</td>
<td>Financial-sector ICT resilience.</td>
<td>ICT risk management, threat-led penetration testing, third-party risk, incident reporting, resilience exercises.</td>
<td>Coverage of critical financial entities and ICT providers in threat-led testing and joint crisis exercises.</td>
</tr>
<tr>
<td>eIDAS 2.0, EUDI and Business Wallet</td>
<td>Digital identity, wallets, trust services, signatures, credentials.</td>
<td>Strong identity, qualified trust services, wallet trust frameworks, revocation, selective disclosure, cross-border assurance.</td>
<td>Wallet and trust-service coverage for citizens, public authorities, legal persons, and high-value services.</td>
</tr>
<tr>
<td>European Business Wallet proposal</td>
<td>Legal-person identity, company wallets, representation rights.</td>
<td>Verifiable business identity, mandate management, B2B/B2G authentication, company-authority proofs.</td>
<td>Percentage of high-risk B2B/B2G transactions with verified legal identity and representation rights.</td>
</tr>
<tr>
<td>Digital Services Act</td>
<td>Systemic online risks, election integrity, platform accountability, illegal content.</td>
<td>Risk assessment, mitigation, crisis cooperation, transparency, election-risk procedures, trusted flaggers.</td>
<td>Time from synthetic-media detection to verified correction during election or crisis exercises.</td>
</tr>
<tr>
<td>Data Act</td>
<td>Connected-product data, industrial data access, cloud/data-service switching.</td>
<td>Data access controls, data provenance, portability, fair contractual terms, cloud switching, industrial data governance.</td>
<td>Percentage of critical connected-product and industrial systems with data lineage and access-rights records.</td>
</tr>
<tr>
<td>Machinery Regulation</td>
<td>Safety of machinery, including connected and software-enabled machinery.</td>
<td>Cyber-physical safety cases, secure updates, human override, sensor integrity, market surveillance.</td>
<td>Number of cyber-physical stress tests and safety-control validation exercises by sector.</td>
</tr>
<tr>
<td>Product Liability Directive</td>
<td>Liability for defective products, including software-related defects.</td>
<td>Evidence preservation, incident logs, update traceability, software defect accountability.</td>
<td>Percentage of critical product classes with incident evidence and update traceability requirements.</td>
</tr>
<tr>
<td>CER Directive</td>
<td>Resilience of critical entities.</td>
<td>Risk assessment, continuity planning, dependency mapping, physical security, cross-sector resilience.</td>
<td>Coverage of critical entities with tested continuity and dependency plans.</td>
</tr>
<tr>
<td>Cyber Solidarity Act and EU Cyber Blueprint</td>
<td>EU preparedness, detection, response, and cyber crisis management.</td>
<td>Cross-border exercises, cyber reserve, crisis coordination, role clarity, lessons learned.</td>
<td>Number of cross-border exercises and closure rate for after-action recommendations.</td>
</tr>
<tr>
<td>Chips Act</td>
<td>Semiconductor supply, strategic industrial capacity.</td>
<td>Supply-chain mapping, secure chip capacity, resilience planning, dependency reduction.</td>
<td>Dependency concentration index for critical semiconductor functions.</td>
</tr>
</tbody>
</table>
</div>

The table illustrates the main point: the EU legal stack is necessary but not sufficient. A readiness stack must add ownership, metrics, exercises, procurement rules, and feedback from real incidents.
<h2 id="6-scenario-planning-model">6. Scenario planning model</h2>

The scenarios below are not predictions. They are planning instruments. Each scenario tests whether current institutions can respond to escalation across domains. The most important question is not whether a scenario will happen exactly as described. It is whether Germany and the EU have the authority, data, exercises, technical controls, and communication channels required to respond if a similar chain begins.

Table 8 presents the scenario register used for policy stress testing. Each scenario includes a trigger threshold, a likely lead owner, first-response actions, and a readiness metric. The lead owner is indicative. A real incident may require shared leadership across federal, Länder, municipal, EU, sectoral, and private actors.

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 8.</strong> Scenario register with triggers, owners, first actions, and metrics.</caption>
<thead>
<tr>
<th scope="col">Scenario</th>
<th scope="col">Trigger threshold</th>
<th scope="col">Indicative lead owner</th>
<th scope="col">First 24 hours</th>
<th scope="col">First 7 days</th>
<th scope="col">Primary readiness metric</th>
</tr>
</thead>
<tbody>
<tr>
<td>1. AI-enabled cyber escalation against public administration</td>
<td>Confirmed compromise of municipal, Länder, or federal identity, service, or data platform, plus signs of AI-assisted phishing or synthetic public-service messages.</td>
<td>BSI with affected Länder, municipalities, IT service providers, IT Planning Council, and BMDS/BMI.</td>
<td>Revoke compromised credentials; isolate affected services; activate verified citizen communication; preserve evidence; coordinate federal-Länder incident bridge.</td>
<td>Restore priority services; notify affected persons; publish trusted status updates; analyse attack path; close exposed identity and backup gaps.</td>
<td>Time to revoke credentials, publish verified status, and restore priority services.</td>
</tr>
<tr>
<td>2. Hybrid warfare against democratic decision-making</td>
<td>Coordinated release of deepfakes, leaks, cyber incidents, bot activity, or intimidation during an election, referendum, coalition negotiation, or major policy vote.</td>
<td>BMI, election authorities, BSI, BfV, Federal Chancellery, Länder, platform coordinators, and EU DSA coordination channels.</td>
<td>Authenticate official information; preserve evidence; issue narrow public corrections; coordinate with platforms; protect election bodies and party infrastructure.</td>
<td>Assess attribution confidence; brief parliament where appropriate; publish transparency notes; harden election systems; monitor escalation and public-order risk.</td>
<td>Time from detection to verified public correction and platform mitigation.</td>
</tr>
<tr>
<td>3. Quantum shock to trust infrastructure</td>
<td>Credible signal of faster-than-expected cryptanalytic capability, state-level quantum progress, or practical break affecting a widely used cryptographic primitive.</td>
<td>National Security Council, BSI, BaFin, Bundesbank, BMDS, BMI, defence structures, and EU/NATO counterparts.</td>
<td>Convene cryptographic crisis cell; assess affected primitives; freeze non-essential certificate changes if needed; prioritise systems with long-lived secrets.</td>
<td>Publish technical guidance; accelerate hybrid/PQC migration for priority systems; require supplier disclosure; update procurement and trusted-service requirements.</td>
<td>Percentage of critical systems with cryptographic inventory, crypto-agility, and tested migration path.</td>
</tr>
<tr>
<td>4. Cyber-physical disruption in German industry</td>
<td>Attack on OT, robotics, logistics, connected production, or a critical supplier causes production loss, safety risk, or cross-sector supply disruption.</td>
<td>BSI, BMWK, sector regulator, affected operator, Länder crisis structures, and relevant ISACs.</td>
<td>Separate IT/OT networks; stop unsafe processes; activate manual fallback; notify supply-chain partners; preserve forensic data.</td>
<td>Restart safely; validate machine integrity; publish supply-chain status; test supplier substitution; update segmentation and remote-access controls.</td>
<td>Recovery time for safe production and number of critical suppliers covered by stress tests.</td>
</tr>
<tr>
<td>5. Physical AI safety and security incident</td>
<td>Robot, drone, vehicle, medical system, or automated machine causes physical harm after cyber compromise, model failure, data error, sensor manipulation, or weak override.</td>
<td>Sector safety regulator, market surveillance authority, BSI, operator, manufacturer, and where needed police/civil protection.</td>
<td>Stop affected systems; secure logs; protect persons; verify override and update controls; notify regulator and affected parties.</td>
<td>Determine safety and cyber root cause; issue recall or patch guidance; assess liability evidence; update safety case and incident-reporting rules.</td>
<td>Time to stop unsafe operation and percentage of systems with tested override, secure update, and audit logs.</td>
</tr>
<tr>
<td>6. Financial and supply-chain confidence shock</td>
<td>AI-cyber campaign targets a bank, payment provider, logistics platform, cloud provider, or major supplier while rumours spread about insolvency, shortages, or payment failure.</td>
<td>BaFin, Bundesbank, BSI, BMF, affected entities, payment operators, and EU financial supervisors.</td>
<td>Assess liquidity and ICT impact; stabilise payment operations; issue verified communication; coordinate with market and platform actors.</td>
<td>Run DORA incident process; test third-party continuity; update fraud and rumour controls; brief affected sectors and parliament where appropriate.</td>
<td>Payment-service recovery time and time to publish verified financial-stability communication.</td>
</tr>
<tr>
<td>7. Labour-market and societal destabilisation</td>
<td>Rapid AI automation affects visible sectors or regions, while coordinated information campaigns exploit job-loss fear, regional inequality, or mistrust in institutions.</td>
<td>BMAS, BMWK, BMDS, Länder, Federal Employment Agency, social partners, and public communication units.</td>
<td>Publish credible labour-market facts; counter false claims; identify affected regions and sectors; activate local stakeholder channels.</td>
<td>Offer targeted transition measures; monitor public-order and disinformation signals; prepare parliamentary briefing; update regional resilience support.</td>
<td>Time to publish trusted labour-market data and coverage of targeted regional transition support.</td>
</tr>
<tr>
<td>8. Frontier AI governance failure</td>
<td>Advanced AI system exceeds expected cyber, persuasion, autonomy, scientific, or agentic capability thresholds faster than oversight can react.</td>
<td>German AI evaluation function, BSI, EU AI Office, National Security Council, sector regulators, and international AI safety partners.</td>
<td>Convene technical assessment; restrict high-risk deployments if legally justified; require incident data; coordinate with provider and EU counterparts.</td>
<td>Run independent evaluation; update thresholds; issue deployment guidance; assess misuse channels; brief oversight bodies.</td>
<td>Time from capability signal to independent evaluation and deployment decision.</td>
</tr>
<tr>
<td>9. Frontier Physical AI escalation</td>
<td>Highly autonomous physical systems coordinate across industrial, defence, logistics, or infrastructure settings; failure, misuse, or adversarial manipulation creates cross-sector physical risk.</td>
<td>National Security Council, BSI, BMVg, BMI, civil protection, sector regulators, and EU/NATO counterparts.</td>
<td>Limit command autonomy; verify human override; isolate affected systems; establish civil-defence coordination; preserve command and authority logs.</td>
<td>Test safe restart; review authority model; update command limits; coordinate international risk communication; revise procurement rules.</td>
<td>Percentage of high-risk physical AI systems with verified authority, command limits, human override, and audit logs.</td>
</tr>
</tbody>
</table>
</div>

<h3 id="6-1-scenario-exercise-requirements">6.1 Scenario exercise requirements</h3>

Each scenario should be converted into an exercise package. A useful package contains the following elements:

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 9.</strong> Minimum requirements for cross-domain exercises.</caption>
<thead>
<tr>
<th scope="col">Element</th>
<th scope="col">Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td>Trigger threshold</td>
<td>Defines when the exercise begins and prevents delay through unclear ownership.</td>
</tr>
<tr>
<td>Lead owner and deputies</td>
<td>Prevents coordination failure when the first lead is unavailable or not competent for a sub-domain.</td>
</tr>
<tr>
<td>Legal authority map</td>
<td>Clarifies what can be done under ordinary law, what requires emergency powers, and what needs judicial or parliamentary review.</td>
</tr>
<tr>
<td>Technical evidence package</td>
<td>Tests whether agencies can interpret logs, identity evidence, model outputs, certificates, software provenance, and OT telemetry.</td>
</tr>
<tr>
<td>Public communication script</td>
<td>Tests verified channels, uncertainty language, correction procedures, and coordination with media and platforms.</td>
</tr>
<tr>
<td>Private-sector interface</td>
<td>Tests cooperation with cloud providers, banks, platforms, suppliers, trusted services, cyber-security vendors, and operators.</td>
</tr>
<tr>
<td>Metric dashboard</td>
<td>Measures restoration time, revocation time, patch time, PQC status, red-team coverage, and public communication speed.</td>
</tr>
<tr>
<td>After-action process</td>
<td>Assigns findings, owners, deadlines, budget implications, and parliamentary reporting where appropriate.</td>
</tr>
</tbody>
</table>
</div>

<h3 id="6-2-lessons-across-scenarios">6.2 Lessons across scenarios</h3>

Four lessons recur across all scenarios.

First, identity and authorisation are decisive. Many escalation chains start with compromised credentials, false authority, unclear delegation, or weak revocation. This applies to people, legal persons, software updates, machines, and AI agents.

Second, public communication is a security function. A crisis will not wait for perfect attribution. Governments need verified channels, pre-agreed procedures, and trusted messengers before the incident occurs.

Third, resilience must be tested in combined exercises. Separate cyber drills, media drills, financial drills, and civil-protection exercises miss the coupling between domains. Scenario exercises should combine public administration, BSI, intelligence, defence, regulators, municipalities, banks, platforms, media, and critical infrastructure operators.

Fourth, escalation planning needs metrics. Policy makers should not ask only whether a law exists. They should ask how many critical systems use phishing-resistant authentication, how many have tested backups, how many have PQC inventories, how fast critical vulnerabilities are patched, how many cyber-physical stress tests were run, and whether crisis communication channels have been tested.
<h2 id="7-comparative-policy-maturity-analysis">7. Comparative policy maturity analysis</h2>

The comparative maturity model is a structured judgement based on public evidence. It does not claim that all internal government programmes are visible. It compares recognition, institutional ownership, expert capacity, legal action, funding, operational implementation, industrial mobilisation, international coordination, and readiness testing.

Scores use the following scale: 0 means no meaningful recognition; 1 means discussion and expert debate; 2 means strategies and political statements; 3 means laws, standards, and assigned institutions; 4 means funded implementation programmes; and 5 means operational readiness, testing, and continuous adaptation. Scores are reported in half steps only. This reduces false precision. The table also adds a confidence label, evidence note, and uncertainty note.

Two sovereignty dimensions are separated. <strong>State and industrial digital control</strong> measures a jurisdiction’s ability to direct, secure, and mobilise digital infrastructure and industrial capacity. <strong>Rights-preserving digital sovereignty</strong> measures whether digital control is compatible with privacy, individual agency, redress, rule of law, and democratic safeguards. This distinction is necessary because a state can be strong in control but weak in rights protection.

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 10.</strong> Comparative policy maturity scoring, 0–5, half-step scale.</caption>
<thead>
<tr>
<th scope="col">Jurisdiction</th>
<th scope="col">AI safety</th>
<th scope="col">AI cyber</th>
<th scope="col">Hybrid readiness</th>
<th scope="col">PQC</th>
<th scope="col">Physical AI</th>
<th scope="col">Frontier AI</th>
<th scope="col">State/industrial digital control</th>
<th scope="col">Rights-preserving digital sovereignty</th>
<th scope="col">Implementation</th>
<th scope="col">Confidence</th>
<th scope="col">Main public evidence</th>
<th scope="col">Main uncertainty</th>
</tr>
</thead>
<tbody>
<tr>
<td>Germany</td>
<td>2.5</td>
<td>2.5</td>
<td>3.0</td>
<td>2.5</td>
<td>2.5</td>
<td>2.0</td>
<td>3.0</td>
<td>3.0</td>
<td>2.5</td>
<td>Medium</td>
<td>National Security Strategy; National Security Council; BSI role; NIS2 implementation; BSI PQC guidance; BMDS creation [15, 26, 30, 31, 33].</td>
<td>Limited public evidence of national PQC dashboard, AI-cyber evaluation capacity, and cross-domain stress testing.</td>
</tr>
<tr>
<td>European Union</td>
<td>3.5</td>
<td>3.0</td>
<td>3.5</td>
<td>3.0</td>
<td>3.5</td>
<td>2.5</td>
<td>3.5</td>
<td>4.0</td>
<td>3.0</td>
<td>Medium</td>
<td>AI Act, NIS2, CRA, DORA, eIDAS 2.0, DSA, Data Act, CER, Cyber Solidarity Act, Machinery Regulation, Product Liability Directive [1-8, 35, 44-46].</td>
<td>Member State implementation is uneven; legal stack is stronger than operational integration.</td>
</tr>
<tr>
<td>United States</td>
<td>3.5</td>
<td>4.0</td>
<td>3.5</td>
<td>4.0</td>
<td>3.0</td>
<td>3.0</td>
<td>3.5</td>
<td>3.0</td>
<td>4.0</td>
<td>Medium-high</td>
<td>NIST PQC standards; CISA/NSA/NIST PQC guidance; NIST CAISI; cyber strategy implementation plan; large national security and private-sector capability [24, 25, 28, 36].</td>
<td>Horizontal AI regulation remains fragmented; capability and rule-setting are split across agencies and states.</td>
</tr>
<tr>
<td>China</td>
<td>2.5</td>
<td>3.5</td>
<td>4.0</td>
<td>3.0</td>
<td>4.0</td>
<td>2.0</td>
<td>5.0</td>
<td>1.0</td>
<td>4.0</td>
<td>Low-medium</td>
<td>High state mobilisation; AI, cyber, quantum, robotics, and data-control policy; generative AI interim measures with national security and social stability requirements [37].</td>
<td>Public transparency is limited; rights-preserving safeguards are weak by European standards; classified capacity is opaque.</td>
</tr>
<tr>
<td>Japan</td>
<td>3.5</td>
<td>3.5</td>
<td>3.5</td>
<td>3.0</td>
<td>3.0</td>
<td>2.5</td>
<td>3.0</td>
<td>3.0</td>
<td>3.5</td>
<td>Medium</td>
<td>Japan AI Safety Institute; AI safety status reporting; cyber and industrial policy capacity [38, 39].</td>
<td>Operational scaling across public administration, industry, and defence remains the test.</td>
</tr>
<tr>
<td>South Korea</td>
<td>3.5</td>
<td>3.5</td>
<td>3.5</td>
<td>3.5</td>
<td>3.5</td>
<td>2.5</td>
<td>3.5</td>
<td>2.5</td>
<td>3.5</td>
<td>Medium</td>
<td>AI Basic Act, AI Safety Institute basis, strong technology base, high cyber-security pressure, semiconductor and industrial capacity [40].</td>
<td>Implementation detail, legal certainty, and rights-based safeguards are still developing.</td>
</tr>
<tr>
<td>Canada</td>
<td>3.5</td>
<td>3.0</td>
<td>3.0</td>
<td>4.0</td>
<td>2.5</td>
<td>3.0</td>
<td>3.0</td>
<td>3.5</td>
<td>3.0</td>
<td>Medium</td>
<td>Federal PQC roadmap for non-classified systems; Canadian AI Safety Institute; cyber-security guidance [41, 42].</td>
<td>Smaller scale, incomplete AI legislative settlement, and limited global market-shaping power compared with the EU or US.</td>
</tr>
</tbody>
</table>
</div>

<h3 id="7-1-germany">7.1 Germany</h3>

Germany has moved from recognition toward institutional coordination. The National Security Strategy introduced the language of integrated security [30]. The National Security Council, created in 2025, is a significant improvement because it can bridge internal, external, economic, digital, civil, and military security [15]. The Federal Ministry for Digital Transformation and Government Modernisation also gives digital state modernisation a clearer institutional home [31].

The weakness is still operational integration. Germany transposed NIS2 late. The Commission had issued a reasoned opinion to Germany and other Member States in May 2025 for failure to notify full transposition [32], and the German implementation law entered into force on 6 December 2025 [33]. This sequence matters because it shows that even recognised cyber-security obligations can lag in implementation. Germany also lacks a visible national PQC migration dashboard for all critical sectors, a public frontier AI evaluation centre equivalent in profile to the UK or Japanese AI safety institutes, and regular public evidence of cross-domain cyber-physical stress testing.

Germany’s score is therefore not a judgement that Germany lacks expertise. It is a judgement that expertise, institutions, and laws are not yet connected into a visible operational readiness system.

<h3 id="7-2-european-union">7.2 European Union</h3>

The EU is strongest in law and rule-setting. The AI Act, NIS2, CRA, DORA, eIDAS 2.0, the DSA, the Data Act, the Machinery Regulation, Product Liability Directive, the Chips Act, the Cyber Solidarity Act, and the CER Directive cover large parts of the threat landscape [1-8, 34, 35, 44-46]. This is a major achievement. The problem is that the legal stack has not yet become an operational readiness stack. Member State implementation varies. Exercises, dashboards, PQC migration, cyber-physical testing, and AI-cyber evaluation remain uneven.

The EU’s policy advantage is that it can connect legal authority, market access, standards, certification, public procurement, and cross-border crisis mechanisms. Its disadvantage is the complexity of coordination across institutions and Member States. The EU should therefore use regulation less as an end point and more as a framework for measurable implementation.

<h3 id="7-3-united-states">7.3 United States</h3>

The United States has strong agency capacity in NIST, CISA, the intelligence community, national laboratories, and defence. NIST finalised PQC standards in 2024 [24]. CISA, NSA, and NIST have issued migration and inventory guidance [25]. NIST’s CAISI has a public role in evaluating frontier AI systems for demonstrable risks such as cyber-security and biosecurity [28]. The United States also has cyber strategy implementation plans and a strong private-sector security ecosystem [36].

The US gap is regulatory fragmentation. Federal AI law remains less comprehensive than the EU AI Act. The US has strong technical and operational capacity, but weaker horizontal legal uniformity.

<h3 id="7-4-china">7.4 China</h3>

China has high state mobilisation capacity, strong industrial policy, and a broad conception of digital sovereignty as state control over data, platforms, infrastructure, and technology. China’s interim measures for generative AI include national security and social stability requirements [37]. China also invests heavily in AI, quantum, robotics, chips, and cyber capabilities.

The limitation is not mobilisation. It is transparency and rights-based governance. China’s model is not a European model. It may be operationally forceful, but it does not provide the democratic legitimacy, privacy protection, or rule-of-law safeguards required in Germany and the EU. This is why the table separates state/industrial digital control from rights-preserving digital sovereignty.

<h3 id="7-5-japan-south-korea-and-canada">7.5 Japan, South Korea, and Canada</h3>

Japan has built a clear AI safety institution. The Japan AI Safety Institute was launched in February 2024 to examine AI safety evaluation methods and related issues, and its national status material describes a coordinated structure involving ministries and government-affiliated organisations [38, 39]. Japan’s challenge is scaling operational implementation across industry, government, and defence.

South Korea has a strong technology base, a high-threat cyber environment, and a comprehensive AI Basic Act that establishes a framework for AI competitiveness and trust, including legal grounds for an AI safety institute and national coordination functions [40]. Its challenge is implementing the regime without creating uncertainty for firms, while maintaining readiness under persistent state-linked cyber pressure.

Canada has a strong PQC roadmap for federal non-classified systems and launched a Canadian AI Safety Institute in 2024 [41, 42]. Its challenge is scale and legal completion. Canada has credible guidance, but less global market power than the EU or United States and less centralised state mobilisation than China.
<h2 id="8-germany-case-study">8. Germany case study</h2>

<h3 id="8-1-strategic-exposure">8.1 Strategic exposure</h3>

Germany is structurally exposed to the integrated threat landscape. Its industrial base, export dependency, automotive and machinery sectors, chemical industry, energy-transition infrastructure, logistics networks, and federal administrative structure create both strength and vulnerability. The same features that make Germany economically important also create a large attack surface.

The SME structure is central. SMEs are numerous, employ more than half of German workers, and are deeply embedded in supply chains [23]. They often supply large enterprises, public bodies, and critical sectors. This makes SME cyber-security a systemic issue. A small supplier may be a weak cyber node but a critical industrial node.

Germany’s federal system is legitimate and constitutionally important. But it can create implementation complexity in cyber-security, digital administration, incident reporting, public communication, and emergency response. Municipalities are often the front line of public service delivery and therefore attractive targets. ENISA’s public administration threat work is directly relevant to this problem [21].

Germany’s public administration digitisation remains a weakness. The eGovernment MONITOR 2024 reported a material usage gap in Germany compared with peer countries [43]. This is not merely an administrative inconvenience. Weak digital administration can mean legacy systems, fragmented identity, duplicated data, manual processes, inconsistent security, and slow recovery.

<h3 id="8-2-institutional-fragmentation-and-recent-improvement">8.2 Institutional fragmentation and recent improvement</h3>

Germany’s responsibilities are distributed across the Federal Chancellery, National Security Council, BMI, BMVg, BMDS, BMWK, BMBF, BSI, BfV, BND, Bundeswehr Cyber- und Informationsraum, BaFin, Bundesnetzagentur, Länder, municipalities, sector regulators, and EU-level institutions. This is a normal feature of complex government. The problem is that escalation chains cross these boundaries faster than institutions can coordinate.

The IT Planning Council is also central. It coordinates federal and state government work on information technology and the digitalisation of administrative services and is described as the central political steering body for Germany’s digital public administration [47]. It should be part of the readiness model because many crisis paths pass through shared public-sector platforms, identity systems, administrative portals, registers, and municipal IT service providers.

The National Security Council is a crucial development. The Federal Government states that the council bridges internal, external, economic, digital, civil, and military security and contributes to crisis simulations and security-policy exercises [15]. This provides an institutional basis for the integrated model proposed in this paper.

However, the council’s existence does not solve the problem automatically. It must be connected to technical readiness metrics, scenario exercises, PQC migration, AI-cyber evaluation, cyber-physical stress tests, trust infrastructure, the IT Planning Council, Länder implementation channels, municipal IT service providers, and crisis communication. Otherwise, it may improve strategic discussion without closing the implementation gap.

<h3 id="8-3-priority-mismatch">8.3 Priority mismatch</h3>

Germany recognises many threats, but the relative priority of comprehensive scenario planning and implementation remains misaligned with escalation risk. Five mismatches stand out.

First, AI-enabled cyber risk is not yet treated as a national readiness programme. BSI, security agencies, and industry recognise cyber threats, but Germany lacks a public national AI-cyber test infrastructure with the visibility and operational focus needed for frontier capability evaluation.

Second, PQC migration is treated too much as a specialist cryptographic topic. BSI guidance is valuable [26], but the policy scale should be national trust infrastructure migration.

Third, digital identity and authorisation are not yet treated as a unified sovereignty layer for citizens, legal persons, public authorities, products, machines, and AI agents. eIDAS 2.0 and the European Business Wallet proposal create a basis, but Germany must integrate these with security policy [5, 6].

Fourth, Physical AI and cyber-physical risk remain too separated from AI policy. AI safety, machinery safety, product liability, operational technology, and cyber-security must be planned together.

Fifth, federal digital administration and crisis resilience are still too disconnected. The IT Planning Council, BMDS, BSI, Länder, municipalities, public IT service providers, and critical-sector operators need shared readiness metrics and joint exercises.

<h3 id="8-4-capability-execution-gap">8.4 Capability and execution gap</h3>

Table 11 summarises Germany’s capability gaps and execution improvement domains across core areas that need to be prioritised by the government.

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 11.</strong> Germany execution gap.</caption>
<thead>
<tr>
<th scope="col">Area</th>
<th scope="col">Recognition</th>
<th scope="col">Policy basis</th>
<th scope="col">Execution gap</th>
<th scope="col">Risk</th>
<th scope="col">First corrective action</th>
</tr>
</thead>
<tbody>
<tr>
<td>Cyber-security</td>
<td>High</td>
<td>BSI, NIS2 implementation, KRITIS, sector obligations</td>
<td>Implementation differs across sectors and federal levels.</td>
<td>Uneven readiness and delayed response.</td>
<td>Mandate common minimum controls and incident exercises for federal, Länder, municipal, and critical-sector interfaces.</td>
</tr>
<tr>
<td>Public administration</td>
<td>High</td>
<td>BMDS, OZG programmes, IT Planning Council, digital government reforms</td>
<td>Legacy systems, usage gap, fragmented identity, duplicated data, and uneven municipal capacity.</td>
<td>Service failure and low public trust.</td>
<td>Define a public-administration resilience baseline with tested recovery times and verified crisis channels.</td>
</tr>
<tr>
<td>PQC migration</td>
<td>Medium</td>
<td>BSI guidance and international standards</td>
<td>No visible national critical-sector migration dashboard.</td>
<td>Future cryptographic shock.</td>
<td>Require cryptographic inventories and migration plans for government, finance, trusted services, and critical infrastructure.</td>
</tr>
<tr>
<td>AI-enabled cyber</td>
<td>Medium</td>
<td>EU AI Act, BSI awareness, international AI safety work</td>
<td>Limited public German frontier AI-cyber evaluation capacity.</td>
<td>Attack tempo outpaces defence.</td>
<td>Create or assign a German AI-cyber evaluation function with BSI and EU AI Office interfaces.</td>
</tr>
<tr>
<td>Hybrid warfare</td>
<td>High</td>
<td>National Security Council, BfV, BND, BMVg, foreign-policy structures, DSA interfaces</td>
<td>Limited public evidence of integrated exercises across cyber, finance, media, platforms, and municipalities.</td>
<td>Public trust shock.</td>
<td>Run annual hybrid exercises with synthetic media, public-service outage, leak, and financial-confidence modules.</td>
</tr>
<tr>
<td>Physical AI</td>
<td>Medium</td>
<td>EU Machinery Regulation and Product Liability Directive</td>
<td>Limited cyber-physical stress testing at national scale.</td>
<td>Physical harm and production loss.</td>
<td>Start sector stress tests for automotive, machinery, energy, logistics, healthcare, and ports.</td>
</tr>
<tr>
<td>Trust infrastructure</td>
<td>Medium</td>
<td>eIDAS 2.0, EUDI Wallet, Business Wallet proposal, trust services, PQC guidance</td>
<td>Fragmented identity, authorisation, revocation, and logging across domains.</td>
<td>False authority and audit failure.</td>
<td>Publish a standards-neutral trust infrastructure architecture for persons, legal persons, machines, products, services, and AI agents.</td>
</tr>
<tr>
<td>Frontier AI</td>
<td>Low-medium</td>
<td>EU AI Act, research activity, international AI safety institutes</td>
<td>No clear German frontier capability monitoring function with security mandate.</td>
<td>Governance lag.</td>
<td>Define national capability thresholds, evaluation access, escalation duties, and international coordination paths.</td>
</tr>
</tbody>
</table>
</div>

<h3 id="8-5-case-study-finding">8.5 Case-study finding</h3>

Germany’s problem is not lack of institutions. It is the difficulty of turning many institutions into one operational response model. The National Security Council, BSI, BMDS, IT Planning Council, defence structures, intelligence agencies, BaFin, Bundesnetzagentur, Länder, municipalities, public IT service providers, and EU interfaces can form the basis of an integrated model. But this requires a practical operating system: scenarios, dashboards, rehearsed escalation paths, procurement rules, authority controls, and public communication protocols.

The editorial judgement is that Germany has moved from strategic under-recognition to strategic recognition. It has not yet reached integrated readiness.
<h2 id="9-policy-recommendations">9. Policy recommendations</h2>

The recommendations below are organised as an operating model and a 12/24/36-month roadmap. This avoids the main weakness of broad policy lists: too many good ideas without sequence, ownership, or measurable output.

<h3 id="9-1-operating-model-for-germany">9.1 Operating model for Germany</h3>

Germany should establish an <strong>Integrated Threat Escalation Cell</strong> under the National Security Council. The cell should not duplicate existing agencies. It should own cross-domain scenarios, early-warning indicators, escalation playbooks, implementation dashboards, and annual exercises. It should link BMI, BMVg, BMDS, BMWK, BMBF, BSI, BfV, BND, BaFin, Bundesnetzagentur, Länder, municipalities, the IT Planning Council, sector regulators, public IT service providers, and industry.

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 12.</strong> Operating model for an Integrated Threat Escalation Cell.</caption>
<thead>
<tr>
<th scope="col">Function</th>
<th scope="col">Main tasks</th>
<th scope="col">Core interfaces</th>
<th scope="col">Output</th>
</tr>
</thead>
<tbody>
<tr>
<td>Scenario and escalation planning</td>
<td>Maintain cross-domain scenarios; define triggers; assign lead owners; run exercises; track after-action closure.</td>
<td>National Security Council, BSI, Länder, municipalities, civil protection, sector regulators.</td>
<td>Annual exercise plan and after-action dashboard.</td>
</tr>
<tr>
<td>AI-cyber and frontier AI evaluation</td>
<td>Assess AI-assisted cyber capability, agent risk, model supply-chain risk, persuasion risk, and deployment thresholds.</td>
<td>BSI, EU AI Office, ENISA, research institutes, UK AISI, NIST CAISI, J-AISI, Canadian AISI.</td>
<td>Capability threshold reports and red-team requirements.</td>
</tr>
<tr>
<td>PQC and trust infrastructure</td>
<td>Coordinate cryptographic inventories, PQC migration, identity, signatures, certificates, revocation, wallets, software signing, and legal evidence.</td>
<td>BSI, BMDS, BMI, BaFin, Bundesbank, trust-service providers, critical infrastructure, public procurement.</td>
<td>National PQC and trust infrastructure migration dashboard.</td>
</tr>
<tr>
<td>Hybrid crisis communication</td>
<td>Prepare verified public communication, synthetic-media response, platform interfaces, election-risk procedures, and public-trust metrics.</td>
<td>Federal Chancellery, BMI, Länder, election bodies, DSA coordinators, media, platforms.</td>
<td>Verified crisis-channel playbook and correction-time metrics.</td>
</tr>
<tr>
<td>Cyber-physical and Physical AI resilience</td>
<td>Coordinate OT, robotics, autonomous systems, safety cases, secure updates, human override, and sector stress tests.</td>
<td>BMWK, BSI, safety regulators, market surveillance, automotive, machinery, energy, logistics, healthcare.</td>
<td>Sector stress-test programme and safety/security evidence model.</td>
</tr>
<tr>
<td>Public administration and SME resilience</td>
<td>Connect federal, Länder, municipal, public IT service provider, and SME resilience programmes.</td>
<td>BMDS, IT Planning Council, Länder CIOs, municipalities, chambers, large enterprises, public IT providers.</td>
<td>Public-administration and supplier resilience baseline.</td>
</tr>
</tbody>
</table>
</div>

<h3 id="9-2-germany-roadmap">9.2 Germany roadmap: first 36 months</h3>

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 13.</strong> 12/24/36-month roadmap for Germany.</caption>
<thead>
<tr>
<th scope="col">Timeframe</th>
<th scope="col">Action</th>
<th scope="col">Owner</th>
<th scope="col">Measurable output</th>
</tr>
</thead>
<tbody>
<tr>
<td>0–12 months</td>
<td>Establish the Integrated Threat Escalation Cell under the National Security Council.</td>
<td>Federal Chancellery and National Security Council.</td>
<td>Mandate, membership, exercise calendar, dashboard scope, and reporting line approved.</td>
</tr>
<tr>
<td>0–12 months</td>
<td>Launch a national resilience metrics dashboard with public and classified tiers.</td>
<td>National Security Council, BSI, BMDS, BMI, sector regulators.</td>
<td>Initial metrics for patch time, MFA coverage, PQC inventory, backup recovery, cyber-physical tests, and crisis communication.</td>
</tr>
<tr>
<td>0–12 months</td>
<td>Start mandatory PQC inventory for government, finance, trusted services, critical infrastructure, and defence-relevant suppliers.</td>
<td>BSI, BMDS, BaFin, Bundesbank, BMI, BMVg.</td>
<td>Cryptographic inventory coverage and priority migration list.</td>
</tr>
<tr>
<td>0–12 months</td>
<td>Mandate phishing-resistant MFA and rapid revocation for priority public systems.</td>
<td>BMDS, BMI, BSI, Länder, IT Planning Council.</td>
<td>Coverage percentage for priority systems and tested revocation time.</td>
</tr>
<tr>
<td>0–12 months</td>
<td>Run one national AI-enabled hybrid crisis exercise.</td>
<td>National Security Council, BSI, BMI, Länder, municipalities, BaFin, platforms, media partners.</td>
<td>After-action report with assigned owners, deadlines, and budget implications.</td>
</tr>
<tr>
<td>12–24 months</td>
<td>Build or assign German AI-cyber and frontier AI evaluation capacity.</td>
<td>BSI, BMDS, BMBF, EU AI Office interface.</td>
<td>Evaluation protocols, secure test environment, red-team partner network, and reporting thresholds.</td>
</tr>
<tr>
<td>12–24 months</td>
<td>Expand PQC migration planning to public administration, finance, critical infrastructure, trusted services, key suppliers, and software-signing systems.</td>
<td>BSI, sector regulators, public procurement authorities.</td>
<td>Sector migration plans and procurement clauses for PQC and crypto-agility.</td>
</tr>
<tr>
<td>12–24 months</td>
<td>Run sector cyber-physical stress tests.</td>
<td>BMWK, BSI, sector regulators, industry associations.</td>
<td>Stress tests in automotive, machinery, energy, logistics, healthcare, ports, and rail.</td>
</tr>
<tr>
<td>12–24 months</td>
<td>Create SME supplier resilience support.</td>
<td>BMWK, BSI, chambers, large enterprises, Länder.</td>
<td>Cyber-security, identity assurance, incident response, secure software, and PQC-readiness support for critical SME suppliers.</td>
</tr>
<tr>
<td>24–36 months</td>
<td>Implement AI agent authority controls in high-risk public and private workflows.</td>
<td>BMDS, BSI, sector regulators, EU AI Office, public procurement authorities.</td>
<td>Verifiable authority, scope, expiry, revocation, audit logs, and liability mapping for high-risk agents.</td>
</tr>
<tr>
<td>24–36 months</td>
<td>Connect EUDI Wallet, Business Wallet, machine identity, software signing, and PQC into a trust infrastructure architecture.</td>
<td>BMDS, BMI, BSI, trust-service ecosystem, EU interfaces.</td>
<td>Reference architecture and first production pilots across public administration and critical B2B/B2G workflows.</td>
</tr>
<tr>
<td>24–36 months</td>
<td>Publish annual readiness scores and close after-action findings.</td>
<td>National Security Council, BSI, BMDS, sector regulators.</td>
<td>Annual readiness report with score changes, evidence notes, and closure rate for findings.</td>
</tr>
</tbody>
</table>
</div>

<h3 id="9-3-eu-roadmap">9.3 EU roadmap: first 36 months</h3>

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 14.</strong> 12/24/36-month roadmap for the European Union.</caption>
<thead>
<tr>
<th scope="col">Timeframe</th>
<th scope="col">Action</th>
<th scope="col">Owner</th>
<th scope="col">Measurable output</th>
</tr>
</thead>
<tbody>
<tr>
<td>0–12 months</td>
<td>Convert the EU legal stack into an operational readiness map.</td>
<td>European Commission, ENISA, EU AI Office, Member States.</td>
<td>Control map for AI Act, NIS2, CRA, DORA, eIDAS 2.0, DSA, Data Act, CER, Machinery Regulation, Product Liability Directive, Cyber Solidarity Act, and Chips Act.</td>
</tr>
<tr>
<td>0–12 months</td>
<td>Define EU-level minimum readiness metrics.</td>
<td>Commission, ENISA, EU AI Office, Member States, sector regulators.</td>
<td>Common metrics for incident response, patching, identity, PQC, cyber-physical testing, AI-cyber red teaming, and crisis communication.</td>
</tr>
<tr>
<td>0–12 months</td>
<td>Strengthen ENISA’s support role in AI-cyber and cyber-physical readiness.</td>
<td>European Commission, ENISA, Member States.</td>
<td>AI-cyber threat assessment support, exercise templates, and critical-sector testing guidance.</td>
</tr>
<tr>
<td>12–24 months</td>
<td>Create EU-level PQC migration coordination.</td>
<td>European Commission, ENISA, national cyber agencies, standards bodies.</td>
<td>Coordinated inventories, supplier requirements, procurement standards, crypto-agility guidance, and migration milestones.</td>
</tr>
<tr>
<td>12–24 months</td>
<td>Use the EUDI Wallet and European Business Wallet as security infrastructure.</td>
<td>European Commission, Member States, trust-service ecosystem.</td>
<td>Cross-border identity, representation rights, mandate management, revocation, and logging for high-risk public and business workflows.</td>
</tr>
<tr>
<td>12–24 months</td>
<td>Establish EU-wide AI agent authorisation requirements for high-risk contexts.</td>
<td>EU AI Office, Commission, ENISA, national regulators.</td>
<td>Authority, scope, expiry, revocation, auditability, and liability-mapping requirements.</td>
</tr>
<tr>
<td>24–36 months</td>
<td>Create a European Physical AI risk observatory.</td>
<td>Commission, ENISA, JRC, market surveillance authorities, defence/civil-protection interfaces.</td>
<td>Incident taxonomy, stress-test guidance, secure update requirements, and cyber-physical risk reporting.</td>
</tr>
<tr>
<td>24–36 months</td>
<td>Run cross-border crisis exercises.</td>
<td>Commission, ENISA, Member States, EU financial and cyber bodies.</td>
<td>Exercises covering cyber attacks, disinformation, financial confidence shocks, PQC migration failure, robotic incidents, energy/logistics disruption, and public administration outages.</td>
</tr>
<tr>
<td>24–36 months</td>
<td>Fund secure European industrial capacity.</td>
<td>Commission, Member States, industrial alliances, public procurement authorities.</td>
<td>Investment priorities for secure AI, cryptography, identity infrastructure, robotics security, chips, software supply-chain assurance, and cloud resilience.</td>
</tr>
</tbody>
</table>
</div>

<h3 id="9-4-procurement-and-implementation-rules">9.4 Procurement and implementation rules</h3>

Public procurement should become a readiness instrument. Germany and the EU should require the following controls in high-risk public and critical-sector procurement:

- phishing-resistant authentication and rapid revocation;
- PQC readiness, crypto-agility, and cryptographic inventories;
- secure update mechanisms and software signing;
- SBOMs and vulnerability disclosure;
- secure-by-design evidence and incident reporting duties;
- model provenance and model supply-chain auditability;
- AI agent authority controls;
- data provenance and access-rights records;
- backup recovery testing;
- cyber-physical safety and security evidence;
- open standards, interoperability, and anti-lock-in requirements.

Procurement reform is especially important for SMEs. Germany should fund SME cyber-security, supplier identity assurance, PQC readiness, secure software practices, incident response, and participation in sector exercises. Large enterprises should be required to include critical SME suppliers in resilience planning.

<h3 id="9-5-democratic-legitimacy">9.5 Democratic legitimacy</h3>

All security measures should respect proportionality, privacy, rule of law, judicial oversight, transparency, and redress. Europe’s strategic advantage is legitimate governance, not only technical control. This means that readiness dashboards and exercises should include not only technical metrics but also safeguard metrics: legal basis, oversight, data minimisation, redress, and independent audit.
<h2 id="10-discussion-uncertainty-safeguards-and-evidence-gaps">10. Discussion: uncertainty, objections, safeguards, and evidence gaps</h2>

<h3 id="10-1-uncertainty">10.1 Uncertainty</h3>

Several risks are observable now: ransomware, cyber espionage, software supply-chain compromise, identity abuse, disinformation, synthetic media, data brokerage, and public administration exposure. Other risks remain uncertain: the timeline to cryptographically relevant quantum computers, the emergence of superintelligent AI, and the degree of autonomy in future physical AI systems.

Uncertainty does not justify inaction. It changes the policy response. For uncertain high-impact risks, the correct response is monitoring, inventories, stress tests, thresholds, flexible procurement, reversible safeguards, and international coordination. The objective is not prediction. It is preparedness.

<h3 id="10-2-likely-objections-and-responses">10.2 Likely objections and responses</h3>

Table 15 addresses the most likely objections to the model.

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table 15.</strong> Likely objections and how the model responds.</caption>
<thead>
<tr>
<th scope="col">Objection</th>
<th scope="col">Risk in the objection</th>
<th scope="col">Response in this paper</th>
</tr>
</thead>
<tbody>
<tr>
<td>The paper securitises too many policy areas.</td>
<td>A broad threat model could justify disproportionate monitoring, emergency powers, or limits on speech.</td>
<td>The model applies only where policy areas are part of escalation chains. Section 2.3 sets democratic boundary conditions: legal basis, proportionality, oversight, transparency where possible, privacy-preserving design, redress, sunset clauses, and open standards.</td>
</tr>
<tr>
<td>The maturity scores are subjective.</td>
<td>Scores may create false precision or overstate public evidence.</td>
<td>Scores are half-step expert judgements, not statistical measures. Table 10 adds confidence labels, public evidence notes, and uncertainty notes. Classified capacity is explicitly outside the scoring claim.</td>
</tr>
<tr>
<td>Superintelligent AI is speculative.</td>
<td>A speculative title or framing may distract from current AI-cyber, identity, PQC, and cyber-physical risks.</td>
<td>The main framing is changed to AI-cyber, quantum risk, hybrid warfare, and Physical AI. Superintelligent AI is treated only as a frontier horizon-risk category. Current policy actions focus on measurable frontier AI risks.</td>
</tr>
<tr>
<td>Trust infrastructure sounds like a vendor agenda.</td>
<td>The argument may be perceived as aligned with one market category or provider type.</td>
<td>The paper frames trust infrastructure as standards-neutral, interoperable, independently certifiable, procurement-neutral, privacy-preserving, and anti-lock-in. It also includes non-identity controls: patching, segmentation, backups, secure procurement, OT stress tests, and crisis communication.</td>
</tr>
<tr>
<td>The EU already has laws covering this.</td>
<td>The legal stack is real and should not be ignored.</td>
<td>The paper acknowledges the legal stack and maps it to controls in Table 7. The remaining gap is operational: ownership, metrics, exercises, dashboards, procurement rules, and feedback from incidents.</td>
</tr>
</tbody>
</table>
</div>

<h3 id="10-3-risk-of-overreaction">10.3 Risk of overreaction</h3>

Security policy can harm democracy if it becomes too broad, secretive, or intrusive. Measures against disinformation can threaten speech if poorly designed. Surveillance can weaken privacy. Emergency powers can become normalised. AI monitoring can create new forms of control. Cyber-security regulation can impose costs on SMEs without improving resilience.

A European response must therefore be rights-preserving. It should include legal basis, proportionality, independent oversight, parliamentary scrutiny, transparency where possible, privacy-preserving technologies, clear liability, redress, and sunset clauses for emergency measures. It should also include practical SME support so that resilience duties do not become unfunded mandates.

<h3 id="10-4-risk-of-underreaction">10.4 Risk of underreaction</h3>

The larger risk for Germany is underreaction through fragmentation. A state can publish many strategies and still fail to act in time. It can have expert agencies but no shared escalation model. It can pass laws but not test implementation. It can invest in innovation but not in resilience. It can modernise public administration but ignore identity and cyber-security. It can discuss AI safety but fail to build evaluation capacity.

Underreaction often looks like normal process. Deadlines slip. Procurement remains outdated. Budgets remain sectoral. Exercises are postponed. Dashboards are missing. Responsibilities are unclear. This is why implementation discipline is the main policy recommendation.

<h3 id="10-5-evidence-gaps">10.5 Evidence gaps</h3>

Important evidence gaps remain. Public data on national PQC migration status are weak. AI-cyber capability evaluations are still young and not fully standardised. Cyber-physical stress-test data are limited. Model supply-chain risk lacks mature metrics. AI agent authority control is underdeveloped. SME cyber-security readiness is hard to measure. Public communication resilience is rarely tested openly. Dependency concentration across cloud, chips, models, identity, certificate authorities, software repositories, and data services is not mapped with enough policy precision.

These gaps should become research and policy priorities. A useful research agenda would include PQC migration measurement, AI-cyber benchmark validity, cyber-physical incident taxonomy, supply-chain dependency mapping, agentic AI authority systems, crisis communication under synthetic media conditions, and democratic safeguards for hybrid-threat response.
<h2 id="11-outlook">11. Outlook</h2>

The evidence supports the central thesis. Germany and the EU face an escalating threat landscape in which AI, cyber operations, hybrid warfare, quantum risk, Physical AI, supply-chain dependency, financial confidence, labour-market stress, and social destabilisation interact. The highest risk is not one technology. It is the coupling between them.

The policy problem is not the absence of individual laws or strategies. Germany and the EU have many relevant instruments. The EU has a broad regulatory architecture covering AI, cyber-security, digital identity, platforms, data, finance, products, machinery, critical entities, and cyber crisis management. Germany has created a National Security Council and a dedicated digital transformation ministry. BSI, ENISA, Europol, BaFin, Bundesnetzagentur, defence structures, intelligence agencies, the IT Planning Council, public IT service providers, and EU bodies all have relevant roles. The gap is operational: integrated escalation planning, measurable implementation, cross-domain exercises, and trust infrastructure.

The central policy lesson is direct. Privacy is not separate from security. Cyber-security is not separate from hybrid warfare. AI safety is not separate from cyber operations. PQC is not separate from digital identity. Physical AI safety is not separate from cyber-physical resilience. Digital trust is not separate from democratic sovereignty.

Germany and the EU need a model that is layered, cross-domain, scenario-based, measurable, and rights-preserving. The model should treat trust infrastructure as a foundation of democratic and economic resilience. It should connect AI, cyber, quantum, Physical AI, finance, public administration, industry, and defence. It should measure deployment rather than intent. It should also mobilise high-talent technical, policy, and operational resources with real execution authority.

The question for policy makers is not whether every scenario in this paper will occur. The question is whether current institutions can detect and contain escalation before it becomes systemic. On the public evidence available, Germany and the EU are improving. They are not yet ready enough.
<section class="references" markdown="1">
<h2 id="references">References</h2>

**[1]** European Commission. "AI Act." Shaping Europe’s Digital Future, updated 2026. [https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai)

**[2]** European Commission. "Cyber Resilience Act." Shaping Europe’s Digital Future, updated 2026. [https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act](https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act)

**[3]** European Commission. "NIS2 Directive: securing network and information systems." Shaping Europe’s Digital Future, updated 2026. [https://digital-strategy.ec.europa.eu/en/policies/nis2-directive](https://digital-strategy.ec.europa.eu/en/policies/nis2-directive)

**[4]** EIOPA. "Digital Operational Resilience Act (DORA)." Updated 2026. [https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en](https://www.eiopa.europa.eu/digital-operational-resilience-act-dora_en)

**[5]** European Commission. "EU Digital Identity Wallet Home." Updated 2026. [https://ec.europa.eu/digital-building-blocks/sites/spaces/EUDIGITALIDENTITYWALLET/](https://ec.europa.eu/digital-building-blocks/sites/spaces/EUDIGITALIDENTITYWALLET/)

**[6]** European Commission. "Proposal for a Regulation on the establishment of European Business Wallets." 19 November 2025. [https://digital-strategy.ec.europa.eu/en/library/proposal-regulation-establishment-european-business-wallets](https://digital-strategy.ec.europa.eu/en/library/proposal-regulation-establishment-european-business-wallets)

**[7]** European Union. Regulation (EU) 2023/1230 on machinery. 14 June 2023. [https://eur-lex.europa.eu/eli/reg/2023/1230/oj/eng](https://eur-lex.europa.eu/eli/reg/2023/1230/oj/eng)

**[8]** European Union. Directive (EU) 2024/2853 on liability for defective products. 23 October 2024. [https://eur-lex.europa.eu/eli/dir/2024/2853/oj/eng](https://eur-lex.europa.eu/eli/dir/2024/2853/oj/eng)

**[9]** UK AI Security Institute. "Our evaluation of Claude Mythos Preview’s cyber capabilities." 13 April 2026. [https://www.aisi.gov.uk/blog/our-evaluation-of-claude-mythos-previews-cyber-capabilities](https://www.aisi.gov.uk/blog/our-evaluation-of-claude-mythos-previews-cyber-capabilities)

**[10]** Anthropic. "Assessing Claude Mythos Preview’s cybersecurity capabilities." 2026. [https://red.anthropic.com/2026/mythos-preview/](https://red.anthropic.com/2026/mythos-preview/)

**[11]** International AI Safety Report. "International AI Safety Report 2025." 29 January 2025. [https://internationalaisafetyreport.org/publication/international-ai-safety-report-2025](https://internationalaisafetyreport.org/publication/international-ai-safety-report-2025)

**[12]** International AI Safety Report. "International AI Safety Report 2025: First Key Update." 2025. [https://arxiv.org/abs/2510.13653](https://arxiv.org/abs/2510.13653)

**[13]** UK AI Security Institute. "Frontier AI Trends Report." 2025/2026. [https://www.aisi.gov.uk/frontier-ai-trends-report](https://www.aisi.gov.uk/frontier-ai-trends-report)

**[14]** UK National Cyber Security Centre. "Why cyber defenders need to be ready for frontier AI." 2026. [https://www.ncsc.gov.uk/blogs/why-cyber-defenders-need-to-be-ready-for-frontier-ai](https://www.ncsc.gov.uk/blogs/why-cyber-defenders-need-to-be-ready-for-frontier-ai)

**[15]** Federal Government of Germany. "The National Security Council." 24 March 2026. [https://www.bundesregierung.de/breg-en/news/national-security-council-2415704](https://www.bundesregierung.de/breg-en/news/national-security-council-2415704)

**[16]** OECD.AI. "Risk and Accountability Overview." Updated 2026. [https://oecd.ai/en/site/risk-accountability](https://oecd.ai/en/site/risk-accountability)

**[17]** NATO. "Countering hybrid threats." Updated 2026. [https://www.nato.int/en/what-we-do/deterrence-and-defence/countering-hybrid-threats](https://www.nato.int/en/what-we-do/deterrence-and-defence/countering-hybrid-threats)

**[18]** Council of the European Union. "Hybrid threats." Updated 2026. [https://www.consilium.europa.eu/en/policies/hybrid-threats/](https://www.consilium.europa.eu/en/policies/hybrid-threats/)

**[19]** Bundesamt für Sicherheit in der Informationstechnik (BSI). "Die Lage der IT-Sicherheit in Deutschland 2025." 2025. [https://www.bsi.bund.de/DE/Service-Navi/Publikationen/Lagebericht/lagebericht_node.html](https://www.bsi.bund.de/DE/Service-Navi/Publikationen/Lagebericht/lagebericht_node.html)

**[20]** ENISA. "ENISA Threat Landscape 2025." 2025. [https://www.enisa.europa.eu/publications/enisa-threat-landscape-2025](https://www.enisa.europa.eu/publications/enisa-threat-landscape-2025)

**[21]** ENISA. "Sectorial Threat Landscape: Public Administration." 2025. [https://www.enisa.europa.eu/publications/enisa-sectorial-threat-landscape-public-administration](https://www.enisa.europa.eu/publications/enisa-sectorial-threat-landscape-public-administration)

**[22]** Europol. "IOCTA 2025: Steal, deal and repeat - how cybercriminals trade and exploit your data." 2025. [https://www.europol.europa.eu/publication-events/main-reports/steal-deal-and-repeat-how-cybercriminals-trade-and-exploit-your-data](https://www.europol.europa.eu/publication-events/main-reports/steal-deal-and-repeat-how-cybercriminals-trade-and-exploit-your-data)

**[23]** IfM Bonn. "Macro-economic significance of SMEs - Germany." Updated 2025. [https://www.ifm-bonn.org/en/statistics/overview-mittelstand/macro-economic-significance-of-smes/deutschland](https://www.ifm-bonn.org/en/statistics/overview-mittelstand/macro-economic-significance-of-smes/deutschland)

**[24]** NIST. "NIST Releases First 3 Finalized Post-Quantum Encryption Standards." 13 August 2024. [https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards)

**[25]** CISA, NSA, and NIST. "Quantum-Readiness: Migration to Post-Quantum Cryptography." 21 August 2023; NIST NCCoE. "Migration to Post-Quantum Cryptography." [https://media.defense.gov/2023/Aug/21/2003284212/-1/-1/0/CSI-QUANTUM-READINESS.PDF](https://media.defense.gov/2023/Aug/21/2003284212/-1/-1/0/CSI-QUANTUM-READINESS.PDF); [https://www.nccoe.nist.gov/applied-cryptography/migration-to-pqc](https://www.nccoe.nist.gov/applied-cryptography/migration-to-pqc)

**[26]** BSI. "Migration zu Post-Quanten-Kryptografie: Handlungsempfehlungen." Technical guidance. [https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/Krypto/Post-Quanten-Kryptografie.pdf?__blob=publicationFile&v=1](https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/Krypto/Post-Quanten-Kryptografie.pdf?__blob=publicationFile&v=1)

**[27]** NATO. "Summary of NATO’s Quantum Technologies Strategy." 16 January 2024. [https://www.nato.int/en/about-us/official-texts-and-resources/official-texts/2024/01/16/summary-of-natos-quantum-technologies-strategy](https://www.nato.int/en/about-us/official-texts-and-resources/official-texts/2024/01/16/summary-of-natos-quantum-technologies-strategy)

**[28]** NIST. "Center for AI Standards and Innovation (CAISI)." Updated 2026. [https://www.nist.gov/caisi](https://www.nist.gov/caisi)

**[29]** NIST. "AI Agent Standards Initiative." 2026. [https://www.nist.gov/news-events/news/2026/02/announcing-ai-agent-standards-initiative-interoperable-and-secure](https://www.nist.gov/news-events/news/2026/02/announcing-ai-agent-standards-initiative-interoperable-and-secure)

**[30]** Federal Government of Germany. "National Security Strategy: Integrated Security for Germany." 2023. [https://www.nationalesicherheitsstrategie.de/](https://www.nationalesicherheitsstrategie.de/)

**[31]** Federal Government of Germany. "Federal Ministry for Digital Transformation and Government Modernisation." Updated 2026. [https://www.bundesregierung.de/breg-en/federal-government/ministries/ministry-for-digitalisation-and-state-modernisation](https://www.bundesregierung.de/breg-en/federal-government/ministries/ministry-for-digitalisation-and-state-modernisation)

**[32]** European Commission. "Commission calls on 19 Member States to fully transpose the NIS2 Directive." 7 May 2025. [https://digital-strategy.ec.europa.eu/en/news/commission-calls-19-member-states-fully-transpose-nis2-directive](https://digital-strategy.ec.europa.eu/en/news/commission-calls-19-member-states-fully-transpose-nis2-directive)

**[33]** Federal Government of Germany. "Umsetzung der NIS-2-Richtlinie beschlossen." 8 December 2025. [https://www.bundesregierung.de/breg-de/aktuelles/nis-2-richtlinie-deutschland-2373174](https://www.bundesregierung.de/breg-de/aktuelles/nis-2-richtlinie-deutschland-2373174)

**[34]** European Commission. "European Chips Act." Updated 2026. [https://digital-strategy.ec.europa.eu/en/policies/european-chips-act](https://digital-strategy.ec.europa.eu/en/policies/european-chips-act)

**[35]** European Union. Directive (EU) 2022/2557 on the resilience of critical entities. 14 December 2022. [https://eur-lex.europa.eu/eli/dir/2022/2557/oj/eng](https://eur-lex.europa.eu/eli/dir/2022/2557/oj/eng)

**[36]** White House. "National Cybersecurity Strategy Implementation Plan." Version 2, May 2024. [https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/05/National-Cybersecurity-Strategy-Implementation-Plan-Version-2.pdf](https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/05/National-Cybersecurity-Strategy-Implementation-Plan-Version-2.pdf)

**[37]** Cyberspace Administration of China and partner agencies. "Interim Measures for the Management of Generative Artificial Intelligence Services." 2023. English translation by China Aerospace Studies Institute. [https://www.airuniversity.af.edu/Portals/10/CASI/documents/Translations/2023-08-07%20ITOW%20Interim%20Measures%20for%20the%20Management%20of%20Generative%20Artificial%20Intelligence%20Services.pdf](https://www.airuniversity.af.edu/Portals/10/CASI/documents/Translations/2023-08-07%20ITOW%20Interim%20Measures%20for%20the%20Management%20of%20Generative%20Artificial%20Intelligence%20Services.pdf)

**[38]** Japan Ministry of Economy, Trade and Industry. "Launch of AI Safety Institute." 14 February 2024. [https://www.meti.go.jp/english/press/2024/0214_001.html](https://www.meti.go.jp/english/press/2024/0214_001.html)

**[39]** Japan AI Safety Institute. "National Status Report on AI Safety in Japan 2024." 2025. [https://aisi.go.jp/assets/pdf/j-aisi_report_2024_en.pdf](https://aisi.go.jp/assets/pdf/j-aisi_report_2024_en.pdf)

**[40]** Ministry of Science and ICT, Republic of Korea. "Korea's AI Basic Act." 2025. [https://www.msit.go.kr/eng/bbs/view.do?bbsSeqNo=42&mId=4&mPid=2&nttSeqNo=1071&pageIndex=&sCode=eng&searchOpt=ALL&searchTxt=](https://www.msit.go.kr/eng/bbs/view.do?bbsSeqNo=42&mId=4&mPid=2&nttSeqNo=1071&pageIndex=&sCode=eng&searchOpt=ALL&searchTxt=)

**[41]** Canadian Centre for Cyber Security. "Roadmap for the migration to post-quantum cryptography for the Government of Canada." 24 June 2025. [https://www.cyber.gc.ca/en/guidance/roadmap-migration-post-quantum-cryptography-government-canada-itsm40001](https://www.cyber.gc.ca/en/guidance/roadmap-migration-post-quantum-cryptography-government-canada-itsm40001)

**[42]** Government of Canada. "Canada launches Canadian Artificial Intelligence Safety Institute." 12 November 2024. [https://www.canada.ca/en/innovation-science-economic-development/news/2024/11/canada-launches-canadian-artificial-intelligence-safety-institute.html](https://www.canada.ca/en/innovation-science-economic-development/news/2024/11/canada-launches-canadian-artificial-intelligence-safety-institute.html)

**[43]** Initiative D21 and Technical University of Munich. "eGovernment MONITOR 2024." 2024. [https://initiatived21.de/download/261166/eGovMon2024_eng_250404.pdf](https://initiatived21.de/download/261166/eGovMon2024_eng_250404.pdf)

**[44]** European Commission. "The impact of the Digital Services Act on digital platforms." Updated 2026. [https://digital-strategy.ec.europa.eu/en/policies/dsa-impact-platforms](https://digital-strategy.ec.europa.eu/en/policies/dsa-impact-platforms)

**[45]** European Commission. "Data Act." Shaping Europe’s Digital Future, updated 2026. [https://digital-strategy.ec.europa.eu/en/policies/data-act](https://digital-strategy.ec.europa.eu/en/policies/data-act)

**[46]** European Commission. "EU cybersecurity policies." Shaping Europe’s Digital Future, updated 2026. [https://digital-strategy.ec.europa.eu/en/policies/cybersecurity-policies](https://digital-strategy.ec.europa.eu/en/policies/cybersecurity-policies)

**[47]** German IT Planning Council. "About the German IT Planning Council." Updated 2026. [https://www.it-planungsrat.de/en/](https://www.it-planungsrat.de/en/)

</section>

<h2 id="appendix-a-maturity-scoring-rubric">Appendix A. Maturity scoring rubric</h2>

The maturity scoring rubric below makes the comparative assessment transparent. Scores are structured expert judgement based on public evidence. They are not statistical measures. Scores should be reported in half steps only: 0, 0.5, 1.0, 1.5, and so on. Confidence labels should be reported separately.

<div class="table-scroll">
<table class="academic-table maturity-table">
<caption><strong>Table A1.</strong> Maturity scoring rubric.</caption>
<thead>
<tr>
<th scope="col">Score</th>
<th scope="col">Level</th>
<th scope="col">Observable criteria</th>
</tr>
</thead>
<tbody>
<tr>
<td>0</td>
<td>No meaningful recognition</td>
<td>Threat not named in public strategy, no responsible institution, no implementation signal.</td>
</tr>
<tr>
<td>1</td>
<td>Discussion and expert debate</td>
<td>Threat appears in expert debate or isolated papers, but not in binding policy.</td>
</tr>
<tr>
<td>2</td>
<td>Strategy and political recognition</td>
<td>Threat appears in strategies, speeches, policy papers, or non-binding programmes.</td>
</tr>
<tr>
<td>3</td>
<td>Law, standards, and assigned institutions</td>
<td>Binding rules, standards, regulators, agencies, or formal mandates exist.</td>
</tr>
<tr>
<td>4</td>
<td>Funded implementation</td>
<td>Budgets, programmes, migration plans, pilots, and sector implementation are visible.</td>
</tr>
<tr>
<td>5</td>
<td>Operational readiness and adaptation</td>
<td>Regular exercises, audits, stress tests, dashboards, red-teaming, incident feedback, and continuous adaptation.</td>
</tr>
</tbody>
</table>
</div>

<div class="table-scroll">
<table class="academic-table maturity-table">
<caption><strong>Table A2.</strong> Confidence labels for maturity scores.</caption>
<thead>
<tr>
<th scope="col">Confidence</th>
<th scope="col">When to use</th>
<th scope="col">Examples of evidence</th>
</tr>
</thead>
<tbody>
<tr>
<td>High</td>
<td>The public evidence is direct, current, and operationally specific.</td>
<td>Binding law, official standards, public budgets, dashboards, formal exercises, public audits, published roadmaps.</td>
</tr>
<tr>
<td>Medium</td>
<td>The public evidence is credible but partly indirect or uneven across sectors.</td>
<td>Strategies, agency reports, official institutions, expert evaluations, visible pilots, sector guidance.</td>
</tr>
<tr>
<td>Low</td>
<td>The public evidence is incomplete, classified, forecast-based, or mainly inferential.</td>
<td>Capability forecasts, vendor claims, classified-readiness estimates, frontier AI extrapolations, quantum timelines.</td>
</tr>
</tbody>
</table>
</div>

Every maturity score should be accompanied by four short notes: the main evidence type, the main implementation signal, the main uncertainty, and the reason for the confidence label. This prevents false precision and makes the judgement contestable.

<h2 id="appendix-b-suggested-readiness-metrics">Appendix B. Suggested readiness metrics</h2>

Table B1 translates the paper’s recommendations into operational metrics that can be used in dashboards, audits, and scenario exercises.

<div class="table-scroll">
<table class="academic-table recommendation-table">
<caption><strong>Table B1.</strong> Suggested readiness metrics.</caption>
<thead>
<tr>
<th scope="col">Metric area</th>
<th scope="col">Suggested metric</th>
<th scope="col">Purpose</th>
</tr>
</thead>
<tbody>
<tr>
<td>Vulnerability management</td>
<td>Median and 95th percentile time to patch critical vulnerabilities in public administration and critical infrastructure.</td>
<td>Measures whether exposure windows are shrinking.</td>
</tr>
<tr>
<td>Authentication</td>
<td>Percentage of critical systems with phishing-resistant multi-factor authentication.</td>
<td>Measures resistance to credential-driven escalation.</td>
</tr>
<tr>
<td>Credential and authority revocation</td>
<td>Mean and 95th percentile time to revoke compromised credentials, certificates, mandates, and AI-agent authority tokens.</td>
<td>Measures whether false authority can be contained quickly.</td>
</tr>
<tr>
<td>PQC readiness</td>
<td>Percentage of critical systems with complete cryptographic inventory, crypto-agility assessment, and PQC migration plan.</td>
<td>Measures readiness for cryptographic transition.</td>
</tr>
<tr>
<td>Long-lived confidentiality</td>
<td>Percentage of high-value data assets classified by required confidentiality lifetime and harvest-now-decrypt-later exposure.</td>
<td>Measures prioritisation for PQC migration.</td>
</tr>
<tr>
<td>Supplier assurance</td>
<td>Percentage of critical suppliers with verified legal identity, representation rights, software signing, and incident reporting obligations.</td>
<td>Measures supply-chain trust maturity.</td>
</tr>
<tr>
<td>Cyber-physical resilience</td>
<td>Number and quality of annual cyber-physical stress tests by sector.</td>
<td>Measures tested readiness for physical translation of digital compromise.</td>
</tr>
<tr>
<td>Physical AI safety controls</td>
<td>Percentage of high-risk physical AI systems with tested override, secure update, sensor-integrity checks, and audit logs.</td>
<td>Measures safety/security control maturity for autonomous physical systems.</td>
</tr>
<tr>
<td>AI-cyber readiness</td>
<td>Number and coverage of AI-cyber red-team exercises.</td>
<td>Measures preparedness for AI-assisted attack and defence.</td>
</tr>
<tr>
<td>Public service recovery</td>
<td>Recovery time objective and tested recovery time for essential public services.</td>
<td>Measures resilience of citizen-facing services.</td>
</tr>
<tr>
<td>Backup integrity</td>
<td>Backup integrity test frequency and success rate.</td>
<td>Measures ransomware recovery reliability.</td>
</tr>
<tr>
<td>Software supply chain</td>
<td>SBOM coverage for products and public-sector software deployments, plus percentage of updates with verified signing and provenance.</td>
<td>Measures visibility into software dependencies and update trust.</td>
</tr>
<tr>
<td>Data supply chain</td>
<td>Percentage of high-risk systems with data lineage, access-rights records, provenance controls, and change history.</td>
<td>Measures whether AI, compliance, and industrial systems can trust input data.</td>
</tr>
<tr>
<td>Model supply chain</td>
<td>Model provenance and model supply-chain audit coverage for high-risk AI systems.</td>
<td>Measures control over high-risk AI components and updates.</td>
</tr>
<tr>
<td>AI agent authority</td>
<td>Percentage of high-risk AI agents with verifiable authority, scope limits, time limits, revocation, audit logs, and liability mapping.</td>
<td>Measures bounded delegation and accountability.</td>
</tr>
<tr>
<td>Crisis communication</td>
<td>Time from incident detection to verified public communication across federal, Länder, municipal, media, platform, and financial-sector actors.</td>
<td>Measures readiness under synthetic media and uncertainty.</td>
</tr>
<tr>
<td>Exercise discipline</td>
<td>Percentage of after-action recommendations closed by assigned deadline.</td>
<td>Measures whether exercises lead to real implementation.</td>
</tr>
<tr>
<td>Concentration risk</td>
<td>Dependency concentration index for cloud, chips, identity providers, certificate authorities, AI models, software repositories, and data services.</td>
<td>Measures shared dependency and systemic failure risk.</td>
</tr>
<tr>
<td>Democratic safeguards</td>
<td>Percentage of high-impact readiness measures with documented legal basis, proportionality review, oversight path, data-minimisation assessment, and redress mechanism.</td>
<td>Measures whether security readiness remains rights-preserving.</td>
</tr>
</tbody>
</table>
</div>
