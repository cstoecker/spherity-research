---
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "Verifiable, Access-Controlled Digital Product Passports"
subtitle: "Control-Plane Governance, Evidence-Graph Data Planes, Battery and BESS Applications, Industrial AI, and the Convergence with European Business Wallets"
description: "A two-plane architecture for verifiable, access-controlled Digital Product Passports, battery passports, BESS evidence, and European Business Wallets."

paper_status: "Final Spherity Research Article"
authors:
  - "Carsten Stöcker"
affiliation: "Spherity GmbH, Germany"
date: "2026-08-01"
last_modified_at: "2026-08-01"
lang: "en"

permalink: /verifiable-access-controlled-digital-product-passports.html
canonical_url: "https://spherity.github.io/spherity-research/verifiable-access-controlled-digital-product-passports.html"
latest_version: "https://spherity.github.io/spherity-research/verifiable-access-controlled-digital-product-passports.html"
pdf_url: "/Spherity_Research_DPP_Verifiable_Access_Controlled_Digital_Product_Passports.pdf"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"

image: "/assets/dpp-verifiable-access-controlled-social.png"
image_alt: "Social preview for Verifiable, Access-Controlled Digital Product Passports."
cover_image: "/assets/dpp-verifiable-access-controlled-cover.png"
cover_image_alt: "First page of Verifiable, Access-Controlled Digital Product Passports."

answer_summary: "Trustworthy Digital Product Passport and Digital Battery Passport transactions require two coupled planes: a control plane for legal-person identity, market role, mandate, policy, authorization, and decision; and a data plane for decentralized, provenance-bearing product evidence. The paper connects DPP Registry functions, European Business Wallets, verifiable credentials, evidence graphs, battery and BESS use cases, and bounded Industrial AI into one implementation architecture."
key_takeaways:
  - "A product identifier or signed record does not prove that the legal person changing or viewing a passport is authorized for that action."
  - "The control plane binds legal-person identity, market role, delegated mandate, current status, purpose, policy, and auditable decisions to each DPP or DBP transaction."
  - "The data plane keeps detailed product evidence decentralized while preserving issuer binding, provenance, transformations, validation, lifecycle events, conflicts, and freshness in an evidence graph."
  - "The operational DPP Registry anchors registration, identifiers, metadata, access management, and APIs; it does not need to centralize all product content."
  - "The complete mapping of all 52 CIRPASS-2 lifecycle risks shows that signatures and authentication address only part of the DPP threat model."
  - "Digital Battery Passports for traction batteries and proposed system-level BESS passports require different boundaries, actors, lifecycle evidence, and assurance rules."
  - "A future European Business Wallet can reduce duplicate organizational onboarding, while sector-specific governance must still determine market roles and permitted actions."
about:
  - "Digital Product Passport"
  - "Digital Battery Passport"
  - "DPP Registry"
  - "Product-linked identity"
  - "Evidence graphs"
  - "Battery energy storage systems"
  - "Industrial AI"
mentions:
  - "European Business Wallet"
  - "EBW"
  - "Legal-person identity"
  - "Verifiable credentials"
  - "Authorization"
  - "CIRPASS-2 Risk Study"
  - "BESS"
  - "Trusted AI"
  - "Supply-chain compliance"
  - "Cyber-physical products"
  - "AI Service Passport"
  - "Physical AI"
citations:
  - "https://zenodo.org/records/20670585"
  - "https://cirpass2.eu/project-results/"
  - "https://single-market-economy.ec.europa.eu/news/digital-product-passport-registry-now-live-2026-07-20_en"
  - "https://eur-lex.europa.eu/eli/reg/2024/1781/oj/eng"
  - "https://eur-lex.europa.eu/eli/reg/2023/1542/oj/eng"
  - "https://digital-strategy.ec.europa.eu/en/library/proposal-regulation-establishment-european-business-wallets"
  - "https://energydata-x.eu/"
  - "https://www.w3.org/TR/vc-data-model-2.0/"
questions_answered:
  - question: "What makes a Digital Product Passport verifiable and access controlled?"
    answer: "A verifiable, access-controlled DPP combines product-linked identifiers and signed evidence with legal-person identity, role, mandate, policy, current status, purpose limitation, and an auditable authorization decision. Product evidence alone cannot establish who is permitted to read, create, update, or delete it."
  - question: "What is the difference between the DPP control plane and data plane?"
    answer: "The control plane decides who may perform which action, for what purpose, under which market role and mandate. The data plane carries decentralized product data, signed attestations, provenance, lifecycle events, validation results, conflicts, and evidence paths. They interoperate but preserve distinct responsibilities."
  - question: "Does the DPP Registry store the complete product passport?"
    answer: "The operational DPP Registry anchors registration, product and operator identifiers, essential metadata, access management, and APIs. Detailed product content can remain decentralized at economic operators, data intermediaries, or other governed sources, reducing concentration risk and preserving source accountability."
  - question: "How can a European Business Wallet support DPP and DBP transactions?"
    answer: "A future European Business Wallet can present reusable organizational identity, representation, mandate, and sector credentials, reducing duplicate onboarding. The wallet does not replace sector governance: DPP and DBP policy engines must still evaluate market role, product scope, purpose, jurisdiction, and current authorization."
  - question: "Why does the CIRPASS-2 Risk Study matter for DPP architecture?"
    answer: "The CIRPASS-2 version 1.1 risk study identifies 52 risks across creation, storage, retrieval, update, and deletion. The paper maps every risk to control-plane and data-plane mitigations, demonstrating that identity, least-privilege access, revocation, resilience, provenance, and accountable updates are required alongside signatures."
  - question: "How do Digital Battery Passports differ from BESS passports?"
    answer: "The regulated Digital Battery Passport applies to specified battery categories, including relevant traction batteries. A proposed BESS passport describes a system composed of batteries, inverters, controls, software, interfaces, operators, and lifecycle services, so its identity boundary and evidence model are system-level rather than battery-only."
  - question: "How do evidence graphs support Trusted AI and Industrial AI?"
    answer: "Evidence graphs link claims to issuers, sources, transformations, validation results, timestamps, conflicts, uncertainty, and lifecycle events. Bounded AI agents can use those paths to retrieve and assess product evidence without silently replacing authoritative sources or inventing unsupported authority."
related_publications:
  - title: "Spherity Strategy and Market Positioning Update"
    url: "/spherity-dpp-dbp-strategy-market-positioning.html"
    context: "Connects the detailed two-plane DPP architecture to Spherity's Gartner Pioneers position, battery-first execution, and 2026–2029 strategy."
  - title: "Evidence Graphs for Industrial AI"
    url: "/evidence-graphs-industrial-ai-data-plane.html"
    context: "Provides the complementary data-plane model for provenance, validation, freshness, conflicting evidence, and auditable evidence paths."
  - title: "European Business Wallets as the Legal Control Plane for Zero Trust AI Agents"
    url: "/ebw-zero-trust-ai-agents.html"
    context: "Develops the complementary control-plane model for legal-person identity, delegated authority, policy-bound credentials, and action evidence."
  - title: "Quantum-Resilient Organizational Identity"
    url: "/quantum-resilient-organizational-identity.html"
    context: "Extends organizational identity and governed trust infrastructure into repeatable PQC-resilient digital corridors."

toc_items:
  - title: "About the paper"
    href: "#about-the-paper"
  - title: "Two coupled trust planes"
    href: "#two-coupled-trust-planes"
  - title: "Identity and authorization"
    href: "#identity-and-authorization"
  - title: "CIRPASS-2 risk study"
    href: "#cirpass-2-risk-study"
  - title: "DBP and BESS"
    href: "#dbp-and-bess"
  - title: "DPP Registry and EBW"
    href: "#dpp-registry-and-ebw"
  - title: "Evidence graphs and Trusted AI"
    href: "#evidence-graphs-and-trusted-ai"
  - title: "Implementation priorities"
    href: "#implementation-priorities"
  - title: "Boundary conditions"
    href: "#boundary-conditions"
  - title: "License and citation"
    href: "#license-and-citation"
  - title: "Questions answered"
    href: "#questions-answered"

tags:
  - digital-product-passport
  - dpp
  - digital-battery-passport
  - dbp
  - dpp-registry
  - european-business-wallet
  - ebw
  - legal-person-identity
  - product-linked-identity
  - verifiable-credentials
  - authorization
  - authorisation
  - evidence-graph
  - bess
  - trusted-ai
  - industrial-ai
  - supply-chain-compliance
  - cyber-physical-products
  - cirpass-2
---

<div class="paper-download">
  <a href="{{ page.pdf_url | relative_url }}">Download the complete 50-page PDF</a>
  <p>This page is an indexable research summary. The final PDF is the authoritative full text, including the two-plane architecture, two 2×2 matrices, the complete 52-risk CIRPASS-2 mapping, the traction-battery DBP and BESS reference architectures, implementation roadmap, and full references.</p>
</div>

<figure class="paper-figure centered-figure">
  <img src="{{ page.cover_image | relative_url }}"
       alt="{{ page.cover_image_alt }}"
       width="1241"
       height="1754">
  <figcaption><strong>Paper cover.</strong> Verifiable, Access-Controlled Digital Product Passports, final publication, August 2026.</figcaption>
</figure>

<h2 id="about-the-paper">About the paper</h2>

Digital Product Passports are often described as product records reached through a data carrier. That description is necessary but incomplete. A scalable industrial DPP ecosystem must also establish **which legal person is acting, in which market role, under whose mandate, for which purpose, and with which right to read or change specific evidence**.

This paper develops an implementation architecture for Digital Product Passports (DPPs) and Digital Battery Passports (DBPs) that separates—but tightly couples—authorization and evidence. It applies the model to traction batteries, battery energy storage systems (BESS), the operational DPP Registry, European Business Wallets (EBWs), Industrial AI, and cyber-physical products. The evidence cut-off is 31 July 2026.

The core proposition is direct: trustworthy DPP and DBP transactions require a control plane for legal-person identity, role, mandate, trust, policy, and decision, plus a data plane for decentralized, provenance-bearing product evidence.

<h2 id="two-coupled-trust-planes">Two coupled trust planes</h2>

| Architecture layer | Primary question | Core functions | Evidence produced |
| --- | --- | --- | --- |
| **Control plane** | Who is authorized to perform this action? | Legal-person identity, representation, market role, delegated mandate, credential status, purpose, policy evaluation, least privilege, revocation, and decision logging. | Verifiable authorization request, policy decision, relied-upon credentials, status checks, and action receipt. |
| **Data plane** | What product evidence supports the transaction? | Product identifiers, signed attestations, provenance, transformations, lifecycle events, validation, freshness, conflicts, uncertainty, and evidence-graph traversal. | Issuer-bound product claims and auditable paths back to authoritative sources. |

The two planes prevent a common category error. Reliable product evidence does not prove that an actor was authorized to create, update, retrieve, or delete it. A valid organizational credential does not prove that a battery characteristic, repair event, carbon value, or safety claim is true. A trustworthy DPP transaction must validate both conditions.

<h2 id="identity-and-authorization">Legal-person identity, product-linked identity, and authorization</h2>

The control plane begins with the legal person, not with a login account. It binds the organization to a representative, service, device, machine, or AI agent and then evaluates the role and mandate that apply to a particular product, action, purpose, jurisdiction, and time window.

Product-linked identity connects that organizational authority to the DPP or DBP subject. A verifier must be able to determine:

- which legal person issued or changed a claim;
- which market role, license, accreditation, or representation right it held;
- whether the mandate covered the specific product and action;
- whether the credential, key, role, and authorization remained current; and
- which evidence and policy produced the decision.

Verifiable credentials make identity and role evidence portable. Policy engines make that evidence actionable. Status, revocation, purpose limitation, and decision receipts keep authorization current and auditable rather than treating identity proofing as a one-time onboarding event.

<h2 id="cirpass-2-risk-study">CIRPASS-2 lifecycle risks require more than signatures</h2>

The paper maps all 52 risks in the **CIRPASS-2 D4.1 Risks and Mitigations study, version 1.1** across DPP creation, storage, retrieval, update, and deletion. The mapping shows why authentication and digital signatures are necessary but insufficient: false actors, information leakage, service discontinuity, unauthorized or inaccurate updates, weak revocation, false end-of-life claims, and missing provenance require coordinated control-plane and data-plane measures.

<div class="paper-download">
  <a href="https://zenodo.org/records/20670585" rel="external">Read the CIRPASS-2 Risk Study on Zenodo</a>
  <p>The paper cites and extends this risk analysis with a complete lifecycle mapping to legal-person identity, least-privilege authorization, revocation, resilience, accountable updates, provenance-aware validation, and evidence-graph controls.</p>
</div>

The study is therefore used as an architectural test set rather than as a decorative reference. Each lifecycle risk is assigned to the plane—or combination of planes—that can prevent, detect, contain, or evidence the failure.

<h2 id="dbp-and-bess">Digital Battery Passports and BESS passports</h2>

The EU Batteries Regulation makes the Digital Battery Passport a concrete near-term implementation domain for relevant battery categories. The DBP has a defined battery identity and must connect technical, sustainability, due-diligence, performance, lifecycle, and end-of-life evidence to accountable economic operators.

A battery energy storage system is a different identity boundary. A BESS combines batteries with inverters, controllers, software, communications, safety functions, grid interfaces, operators, and maintenance services. A proposed system-level BESS passport should therefore reference component passports while adding evidence about system configuration, commissioning, operational responsibility, software state, incidents, performance, and changes over time.

Treating a BESS passport as a copy of a traction-battery DBP would lose system context. Treating it as an ungoverned data lake would lose provenance and accountability. The two-plane model supports both component and system views without collapsing their separate legal, technical, and lifecycle responsibilities.

<h2 id="dpp-registry-and-ebw">DPP Registry and European Business Wallet convergence</h2>

The operational DPP Registry provides a common registration and discovery layer for product and operator identifiers, essential metadata, access management, and APIs. Detailed product content can remain decentralized with the responsible economic operators and governed data sources. This division reduces concentration risk and keeps accountability close to the issuer of each claim.

A future European Business Wallet can complement the Registry by presenting reusable legal-person identity, representation, mandate, and sector credentials. It can reduce duplicate onboarding across DPP, DBP, customs, conformity, repair, recycling, and market-surveillance workflows. The EBW is treated as a forward-looking target state at the paper's evidence cut-off, not as enacted infrastructure.

Sector governance remains essential. A wallet proves and presents evidence; it does not independently decide that a repairer, recycler, market-surveillance authority, manufacturer, importer, or AI agent may perform a specific action on a specific passport. That decision belongs to the DPP or DBP authorization policy and its accountable governance framework.

<h2 id="evidence-graphs-and-trusted-ai">Evidence graphs for Trusted AI and Industrial AI</h2>

The data plane represents product knowledge as verifiable evidence paths rather than as isolated fields. Each material claim can point to its source, issuer, signature, transformation, validation result, observation time, applicable policy, conflict, uncertainty, and superseding event. Evidence graphs make the provenance of a conclusion inspectable across organizational boundaries.

This architecture supports bounded Industrial AI. An agent may retrieve, compare, or validate DPP evidence, but it should not silently become an authoritative source, invent a missing market role, or conceal conflicting claims. The control plane governs the agent's authority; the evidence graph constrains and explains the facts on which it operates. Together they provide a basis for Trusted AI in supply-chain compliance and cyber-physical products.

The paper extends the same logic toward AI Service Passports and hybrid physical-agentic products while clearly separating current legal duties from research proposals.

<h2 id="implementation-priorities">Implementation priorities</h2>

1. **Define the product and system identity boundaries.** Separate a component, battery, BESS, vehicle, machine, and service when their issuers, responsibilities, or lifecycle evidence differ.
2. **Model market roles and mandates.** Name which legal persons may create, retrieve, update, attest, validate, suspend, or delete which evidence and for what purpose.
3. **Bind organizational and product identity.** Use verifiable, status-aware credentials and stable product identifiers to connect actors to bounded product actions.
4. **Keep detailed evidence decentralized.** Use the DPP Registry for registration and discovery while preserving issuer-bound evidence at governed sources.
5. **Build evidence graphs, not untraceable aggregates.** Preserve source, signature, transformation, time, validation, conflict, and uncertainty as first-class objects.
6. **Test against the full CIRPASS-2 lifecycle risk set.** Cover creation, storage, retrieval, update, and deletion, including continuity and recovery.
7. **Pilot with battery and BESS workflows.** Exercise component-to-system relationships, operational changes, safety evidence, maintenance, reuse, and end-of-life handover.
8. **Constrain AI agents explicitly.** Separate the authority to act from the evidence used to decide and record both as auditable outputs.

<h2 id="boundary-conditions">Boundary conditions</h2>

The paper distinguishes deployed infrastructure and enacted law from proposed or emerging concepts. The DPP Registry is operational at the evidence cut-off. The European Business Wallet, system-level BESS passport, AI Service Passport, and some cross-sector authorization patterns are treated as forward-looking design targets whose legal and governance status may change.

The architecture does not assume that cryptographic proof makes a claim true, that one registry should centralize all product data, or that one wallet can replace sector policy. It also does not treat AI output as authoritative evidence merely because it is linked to a passport. Trust remains an end-to-end property of accountable actors, current authority, governed policy, resilient operations, and provenance-bearing evidence.

<div class="paper-download">
  <a href="{{ page.pdf_url | relative_url }}">Read or download the full paper</a>
  <p>The complete publication contains the legal and operational baseline, formal matrices, market-role governance, energy data-X use case, full CIRPASS-2 mapping, DBP and BESS reference architectures, implementation roadmap, research agenda, and bibliography.</p>
</div>
