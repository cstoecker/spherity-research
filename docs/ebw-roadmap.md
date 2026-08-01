---
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "Legal & Operational EBW Roadmap Toward EU-Wide Acceptance"
subtitle: "European Business Wallet roadmap under eIDAS 2.0, with legal, operational, conformance, and adoption milestones toward EU-wide acceptance by 2029"
description: "Roadmap for European Business Wallet adoption, covering the proposed EU regulation, standards, pilots, conformance, dependencies, and projected rollout."

paper_status: "Spherity Research Paper"
author: "Dr. Carsten Stöcker, Ronald Koenig, Ricky Thiermann, Dr. Martin Westerkamp"
authors:
  - "Dr. Carsten Stöcker"
  - "Ronald Koenig"
  - "Ricky Thiermann"
  - "Dr. Martin Westerkamp"
affiliation: "Spherity GmbH"
date: "2026-05-18"
last_modified_at: "2026-07-30"
lang: "en"

permalink: /ebw-roadmap.html
canonical_url: "https://spherity.github.io/spherity-research/ebw-roadmap.html"
latest_version: "https://spherity.github.io/spherity-research/ebw-roadmap.html"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"

image: "/assets/Europen%20Business%20Wallet%20%28EBW%29%20Roadmap%20-%20Spherity%20GmbH.png"
image_alt: "European Business Wallet roadmap timeline showing legal, regulatory, standardisation, conformance, pilot, and adoption milestones from 2026 to 2029."

answer_summary: "The roadmap treats European Business Wallet adoption as a gated legal and operational transition. The Commission proposal starts the legislative path, while standards, conformance, authentic-source credentials, pilots, national implementation, and wallet availability determine when cross-border use can work at scale."
key_takeaways:
  - "The European Business Wallet remains a European Commission proposal; projected dates must be read as scenarios until the legislative text is adopted."
  - "EU-wide acceptance depends on legislation, technical standards, conformance capacity, national integration, wallet availability, and authoritative business credentials."
  - "Early pilots can test mature identity, attribute, mandate, and interoperability components before mandatory acceptance."
  - "The paper projects a 2028–2029 acceptance window, conditional on the final entry-into-force date and the proposed implementation period."
about:
  - "European Business Wallet"
  - "Legal-person identity"
  - "Cross-border business identity"
  - "Digital trust infrastructure"
mentions:
  - "eIDAS 2.0"
  - "European Digital Identity Wallet"
  - "Digital Product Passport"
  - "Data spaces"
  - "Trusted AI"
citations:
  - "https://digital-strategy.ec.europa.eu/en/library/proposal-regulation-establishment-european-business-wallets"
  - "https://digital-strategy.ec.europa.eu/en/policies/business-wallets"
  - "https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX:32024R1183"
questions_answered:
  - question: "What is the European Business Wallet?"
    answer: "In the European Commission proposal, the European Business Wallet is a harmonised digital solution for businesses and public-sector bodies to identify, authenticate, exchange data, manage attributes, and perform legally relevant digital interactions across the European Union."
  - question: "When could European Business Wallet acceptance become mandatory?"
    answer: "The paper projects a 2028–2029 window, but the operative date depends on adoption and entry into force of the final regulation. The roadmap therefore presents conditional milestones rather than an enacted deadline."
  - question: "Why pilot EBW-ready services before the final regulation?"
    answer: "Pilots can test mature identity, credential, mandate, trust-service, and interoperability components, produce implementation evidence, and expose conformance or integration gaps before the mandatory phase."
related_publications:
  - title: "European Business Wallets as the Legal Control Plane for Zero Trust AI Agents"
    url: "/ebw-zero-trust-ai-agents.html"
    context: "Examines how legal-person identity and digital mandates can govern autonomous enterprise actions."
  - title: "Securing Digital Identity and Verifiable Credential Wallets against Quantum Vulnerabilities"
    url: "/Securing-Digital-Identity-Quantum-Vulnerabilities.html"
    context: "Explains the crypto-agility and end-to-end trust dependencies that wallet ecosystems must migrate."
  - title: "AI-Cyber, Quantum Risk, Hybrid Warfare, and Physical AI"
    url: "/threat-escalation-model-germany-eu.html"
    context: "Connects identity and trust infrastructure to wider German and EU operational readiness."

toc_items:
  - title: "Abstract"
    href: "#abstract"
  - title: "1. Fast-track adoption"
    href: "#fast-track-adoption-and-early-ebw-ready-solutions"
  - title: "2. Key use cases"
    href: "#key-use-cases-of-the-ebw"
  - title: "3. Key milestones"
    href: "#key-milestones-to-mandatory-ebw-acceptance"
  - title: "4. Roadmap summary table"
    href: "#roadmap-summary-table"
  - title: "5. Council Presidency timeline"
    href: "#rotating-presidencies-of-the-council-of-the-european-union-timeline"
  - title: "6. Key risks and dependencies"
    href: "#key-risks-and-dependencies"
  - title: "References"
    href: "#references"
  - title: "License and citation"
    href: "#license-and-citation"
  - title: "Questions answered"
    href: "#questions-answered"

tags:
  - european-business-wallet
  - ebw
  - eidas-2
  - legal-person-identity
  - verifiable-credentials
  - qualified-attestations
  - data-spaces
  - digital-product-passports
  - trusted-ai
  - compliance
---





<p class="keywords">
  <strong>Keywords:</strong> European Business Wallet; EBW; eIDAS 2.0; legal person identity; verifiable credentials; qualified attributes; B2G access; data spaces; KYC; KYB; KYS; Trusted AI; digital product passport; supply chain compliance; eSeals; trusted infrastructure; Architecture Reference Framework; EBW-ready; fast-track adoption; EU digital identity; EBW regulation; qualified attestation; conformity assessment; eGovernment interoperability; business case; roadmap.
</p>

<section class="abstract-box" markdown="1">
<h2 id="abstract">Abstract</h2>

The [European Business Wallet (EBW)](https://digital-strategy.ec.europa.eu/en/policies/business-wallets), proposed by the [European Commission on 19 November 2025 (COM(2025) 838)](https://digital-strategy.ec.europa.eu/en/library/proposal-regulation-establishment-european-business-wallets), is a key element of the EU’s digital trust infrastructure under eIDAS 2.0. It introduces a secure and standardised wallet for legal persons, enabling trusted identification, authentication, qualified signatures and seals, and access to digital services across borders.

The EBW enables legally valid digital interaction with public and private actors. It supports automation, compliance, and interoperability across key sectors while unlocking a significant macro-economic business case and cyber-security improvements. 

This roadmap outlines the legal, technical, and operational milestones required for full EU-wide acceptance by 2028–2029 and highlights early adoption opportunities starting already in 2026.

</section>

<figure class="paper-figure centered-figure">
  <img src="{{ '/assets/Europen%20Business%20Wallet%20%28EBW%29%20Roadmap%20-%20Spherity%20GmbH.png' | relative_url }}"
       alt="European Business Wallet roadmap timeline showing legal, regulatory, standardisation, conformance, pilot, and adoption milestones from 2026 to 2029.">
  <figcaption>
    <strong>Figure 1.</strong> European Business Wallet roadmap timeline. The figure shows legal,
    regulatory, standardisation, conformance, pilot, and operational milestones from 2026 to 2029,
    including eIDAS 2.0 adoption, the EBW regulation, ETSI and CEN-CENELEC standardisation,
    Architecture Reference Framework updates, Large-Scale Pilots, WE BUILD, Qualified Trust
    Service Providers, and phased public-sector and industry rollout across EU Member States.
    Source: Spherity GmbH.
  </figcaption>
</figure>



<h2 id="fast-track-adoption-and-early-ebw-ready-solutions">1. Fast-Track Adoption and Early EBW-Ready Solutions</h2>

To [unlock business value](https://medium.com/spherity/digital-identity-real-world-impact-the-industrial-upside-of-the-european-business-wallet-eubw-d9e0c4e96aae) early, industry actors and some government bodies are expected to start field deployment of **EBW-ready solutions** from 2026 onwards. These solutions will build on existing **eIDAS 2.0 trust infrastructure**, qualified attributes, and interoperable credential formats. Stakeholders are encouraged **not to wait** until final regulations and standards are complete, but to pilot and adopt early solutions where legal and technical elements are mature. This fast-track path supports real-world use, accelerates market feedback, and de-risks future compliance.

<h2 id="key-use-cases-of-the-ebw">2. Key Use Cases of the EBW</h2>

* **Financial Services**: Enables reusable KYC/KYB data, supports PSD2 and strong authentication, automates B2G reporting obligations, and simplifies onboarding and compliance.

* **Professional Services**: Provides firm identity, qualified eSeals, mandate credentials, and trusted filings for auditors, law firms, tax advisors, health care professionals, and notaries.

* **Industry 4.0**: Links machine identities to corporate credentials, supports provenance, quality, and compliance in automated environments.

* **Supply Chain and ESG**: Delivers digital product passports (DPPs), supplier declarations, and ESG disclosures using verifiable credentials.

* **Data Space Ecosystems**: Acts as a trusted gateway for legal entity onboarding and access control in Gaia-X, Manufacturing-X, and other EU Data Spaces.

* **Critical Infrastructures**: Enables verified access for legal entities in energy, telecom, water, and transport systems; supports NIS2 security frameworks.

* **Trusted AI**: Supports traceable and verifiable information about AI system developers, providers, and operators in compliance with the AI Act; establishes Power of Attorney (PoA) for agent delegation and the AI Service Passport (AISP), enables registration in High-Risk AI registries and audit chains using EBW credentials, positioning Europe with a modern trust infrastructure in the global race for secure, regulated industrial AI.

* **B2G Reporting and Registry Access**: Provides standardised authentication for EU portals such as EPRL, DPP registries, Customs, AgriFood Subsidies & Reporting (CAP Process), Tendering & Procurement, High-Risk AI registry, NIS2, and MiFIR/MiFID II.

* **G2G Integration**: Supports trusted data exchange between authorities across Member States, enabling mutual recognition of business attributes and once-only reporting.

The EBW is essential for digital sovereignty, process automation, and compliance in the EU’s digital economy. Fast-track adoption by public and private stakeholders in 2026 will be key to demonstrating readiness, shaping standards, and ensuring operational maturity well before mandatory deadlines.

<h2 id="key-milestones-to-mandatory-ebw-acceptance">3. Key Milestones to Mandatory EBW Acceptance</h2>

The road to having all EU Member States mandatorily accepting EBW involves several key milestones across the legal adoption, technical readiness, and conformance/certification domains. Below we outline the critical path milestones, along with dependencies, uncertainties, and what constitutes a “gate” that must be cleared for the next phase:

* **Commission Proposal Published (Q4 2025)** – *Completed*. Marked the start of the legislative journey. This milestone set forth the vision and allowed preparatory work (impact assessments, initial standardization efforts) to proceed in parallel. Dependency: None (starting point). Uncertainty: Low – already done.
* **Political Agreement on Regulation (Projected Q4 2026)**: The point at which Parliament and Council reach a provisional agreement (trilogue deal) on the EBW regulation’s text. This is a legal milestone – once achieved, the final adoption is almost certain. Dependencies: Sufficient consensus in Council (possibly unanimity if legal basis touches national IDs, but likely QMV under single market) and simple majority in Parliament. Uncertainty: Medium – timeline depends on political priorities and any contentious issues (e.g. data protection concerns or Member State readiness worries). If negotiations drag, this could slip to 2027. Gating events: Parliamentary first reading vote, Council general approach – if either is delayed, the overall timeline shifts.
* **Formal Adoption & Publication (Projected Q1–Q2 2027)**: After legal-linguistic revisions, the regulation would be formally adopted and published in the Official Journal. Milestone: Publication = T0 for implementation timelines. Dependency: The previous political agreement. Uncertainty: Medium – exact quarter depends on legislative speed. If adoption happens earlier (mid-2026), publication could be late 2026. If late 2026 deal, publication early 2027. Gate: The 20-day wait post-publication after which the law is in force.
* **Entry into Force (T0 + 20 days)**: The regulation becomes law across the EU. This triggers official work on implementation. Notably, Article X of the EBW proposal likely sets the application date for obligations: based on Commission info, Member States have 24 months from this date to comply. So, we start the clock for mandatory acceptance. Dependency: Publication date. Uncertainty: None on the 20-day rule itself.
* **Establishment of National Implementation Projects (2027)**: Once the law is in force, each Member State will need to integrate EBW acceptance into their digital infrastructure. A milestone here is when Member States designate responsible bodies (e.g. a Ministry or Agency) and allocate budget for EBW implementation (adapting portals, training staff, etc.). Some Member States, like Germany, have already mobilized stakeholders – e.g. Germany gathered 75+ organizations in late 2025 to plan wallet readiness by 2027. Dependency: Political will and clarity of requirements (some may wait for final ARF/standards). Uncertainty: Medium – proactive countries vs. those waiting. Gate: This is more a soft milestone; delay here could jeopardize meeting the 2-year deadline.
* **Standards Finalization (2026–2027)**: On the technical side, by mid-2026 to mid-2027 we expect finalization of critical standards and ARF updates. Milestones include: ETSI publication of TS/EN for QAA providers (e.g. TS 119 472) – needed for audit schemes; CEN or ETSI final guidance on wallet security (if a Protection Profile or similar is used in certification); the EBW Architecture Reference Framework published (target ~2027 as discussed). Dependency: These depend on the timely work of standard bodies and the EDICG toolbox group. Uncertainty: Medium – delays in standards (or divergence between standards and the Commission’s needs) could force iterative changes to implementing acts (the Commission has noted it may update IRs annually as needed when new standards are ready). Gate: The availability of standards is a conformance gate – wallet providers and trust service providers need them to build compliant systems.
* **Pilot and Testing Phase (2026–2028)**: Leading up to mandatory acceptance, pilots will validate the system. The EU Large-Scale Pilots (like POTENTIAL, Atlantis, EWC, etc.) concluded in 2025 for the EBW wallet in EWC and WE BUILD LSPs; new or extended pilots focusing on legal entities (for example, a “Business Wallet Pilot” possibly under the Digital Europe Programme or national sandboxes) may run during 2026–27. A milestone could be a Multi-Country Pilot in 2027 where companies from several Member States use EBW in a controlled scenario (e.g. a cross-border public procurement). Dependency: Technical readiness of pilot systems (could use pre-standard tech). Uncertainty: Medium – success of pilots can influence confidence and identify last-minute issues. Gate: A conformance testing event in 2028 may be required – akin to a plugtest – that acts as a gate: if interoperability issues are found, either standards or implementations must be fixed before go-live.
* **Wallet Provider Accreditation Begins (by 2027)**: To meet the 2028 deadline, wallet providers (likely a mix of state-operated and private) should start the conformity assessment process by late 2027. A milestone is the first EBW wallet solution certified under the scheme (possibly by a national cyber-security agency or accredited CAB). For example, a Member State’s pilot wallet might undergo assessment in 2027. Dependency: The certification scheme (CIR 2024/2981) is already in force, but possibly updated criteria for legal-person features might be issued by the Commission or Cooperation Group. Uncertainty: Medium – if certification criteria are too immature or CABs not ready, this could delay availability of approved wallets. Gate: At least one compliant wallet needs to exist for businesses to use – a delay here directly impacts rollout.
* **Qualified Attestation Providers Onboarded (2027–2028)**: Another operational milestone: authentic sources (business registers, etc.) and other attribute providers start issuing digital credentials for companies. For EBW to be useful, businesses need verifiable data to put in it. By 2028, we expect each Member State’s business registry to either become a Qualified Attestation of Attributes provider or partner with one, so that, e.g., a certificate of incorporation can be obtained in wallet-friendly format. Dependency: Legal basis in EBW reg plus standards like ETSI TS for QAA. Also, cooperation of national authorities (possibly requiring changes in national laws to allow digital issuance). Uncertainty: Medium-high – some states might lag on this front. Gate: If key credentials (like company registration, tax ID, etc.) aren’t widely available as EAAs, the EBW’s utility is limited, even if the wallet tech is ready.
* **Mandatory Acceptance Date (T0 + 24m, projected 2028–29)**: This is the hard legal milestone: two years after entry into force, all public sector bodies in the EU (from European Commission down to local municipalities) must accept the EBW for any of its “core functions”. That includes identification, authentication, signature/seal, data exchange, etc., as defined in the regulation. By this date, every Member State must ensure its e-government front-ends can interface with wallets – likely via the EBW Wallet standards (i.e. accepting verifiable 'Business Identity Credentials' such LPIDs or EUCCs). Dependency: Everything prior (legal adoption, standards, implementation, testing) feeds into this. Uncertainty: Moderate – the date itself is fixed by law once the regulation is in force, but the state of readiness can vary. The regulation might allow some “transitory measures” beyond this date for legacy systems, but non-compliance could lead to infringement procedures. Gate: This is effectively the final gate – after it, the system is considered live EU-wide.
* **First Evaluation and Possible Adjustments (2030 and beyond)**: Though beyond the immediate scope, typically a regulation will require the Commission to report on its application after e.g. 3 or 4 years. We can foresee a 2030 review where the Commission evaluates EBW uptake (are companies actually using it?), interoperability issues, and possibly introduce amendments or new implementing acts. Also, by 2030 the market must accept EBW credentials (e.g. banks must accept an EBW-delivered KYC attribute by law if relevant). If adoption by private services is sluggish, the EU could consider further mandates at that point. Dependency: Post-implementation experience. Uncertainty: High (policy changes based on political context then). Gate: Not a prerequisite for initial success, but a check-point for long-term success.

<h2 id="roadmap-summary-table">4. Roadmap Summary Table</h2>

To encapsulate these milestones with timing and dependencies, see the Milestone Table below, followed by an illustrative infographic concept.

| **Milestone**                               | **Date/Target**                  | **Description & Significance**                                                                                                                                                                                                                        | **Dependencies/Notes**                                                                                                                                                                                                                                           |
| ------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Commission EBW Proposal (COM(2025) 838)** | 19 Nov 2025 (Done)               | Commission proposed the EBW Regulation, defining scope (legal persons) and core functions. Begins legislative process and stakeholder consultations.                                                                                                  | Published alongside Digital Omnibus package. Stakeholder feedback positive, shaping Parliament/Council debate. |
| **EU Parliament & Council Negotiations**    | Q1–Q4 2026 (ongoing)             | Parliament committee and Council working party review the proposal, suggest amendments. Likely political agreement by late 2026. Started under **Cyprus** Presidency.                                                                                                                      | *Dependency:* Stable EU political environment, priority in legislative agenda. Current Parliament (2024) and Commission must carry it forward.  |
| **Trilogue Agreement**                      | Late 2026 (est.)                 | Provisional deal between Parliament, Council, Commission on final EBW text. Key details (timelines, obligations) finalized under **Irish** Presidency.                                                                                                                           | *Gate:* Must resolve any issues (e.g. data protection, scope). If delayed, pushes subsequent milestones.  |
| **Formal Adoption & Publication**        | ~Q1 2027 (est.)                  | EBW Regulation formally adopted by EU co-legislators and published in the Official Journal (OJ, i.e. becomes Regulation (EU) 2027/XXXX).                                                                                                                       | Could be late 2026 if negotiations quick. Publication date = start of countdown for entry into force.          |
| **Entry into Force of EBW Regulation (T0)**      | ~Q1–Q2 2027                      | 20 days after OJ publication, the regulation is in force. Legal obligations (like developing technical specs, notifying schemes) kick in. Under **Lithuania** Presidency.                                                                                                            | Marks T0 for implementation timeline. EBW legal basis now available for further actions.     |
| **EU Cooperation Group Toolbox Update**     | 2026–2027                        | European Digital Identity Cooperation Group (EDICG) updates the **Architecture Reference Framework (ARF)** to include EBW specifics. Also drafts any new implementing acts as mandated by EBW regulation.                                             | *Dependency:* Final legal text clarity. Likely draft ARF v3.0 by 2027 aligned with EBW law. Ongoing standardization input.    |
| **Standards Finalized (ETSI/CEN)**          | by mid-2027                      | Critical technical standards for EBW are published: e.g. **ETSI TS for Qualified Attestation of Attributes**, **ETSI TS for wallet interfaces (remote signing)**, any CEN guidelines for business attributes.                                         | *Dependency:* eIDAS expert input, piloting results. These standards feed into updated Implementing Acts or certification criteria if needed.        |
| **National Implementation Kick-off**        | mid-2027                         | Member States designate authorities and budget for EBW integration. Begin upgrading e-government systems to accept wallets (e.g. integrating OIDC/VC verification in portals).                                                                        | Some countries (DE, FR) already started in 2025. Others might wait until now. EU funding (DEP, RRF) likely supports this.        |
| **Pilot Programs & Testing**                | 2026–2027                        | Targeted pilots demonstrating EBW in action (e.g. Industry 4.0 & Supply Chain Data Spaces, cross-border procurement using pilot wallets, B2G Portal pilots). Interoperability **conformance testing event** by late 2027 to iron out issues.                                                                      | *Dependency:* Availability of prototype wallets and credentials. Informal WE BUILD reference wallet (2025) developed by Spherity to demonstrate EBW key features and processews. Outcome: “works at scale” as a EBW-ready soltuin by end-2026.   |
| **Wallet Solutions Development**            | 2026–2028                        | Governments and providers develop EBW solutions. By 2027, at least one reference open-source or national wallet for businesses is in beta.                                                                                                            | Many personal EUDI wallet solutions (e.g. Germany’s ID-Wallet) could be extended for EBW. Close coordination via eIDAS Sandbox if applicable.                 |
| **Conformity Assessment Framework Ready**   | ~2027                            | Accreditation of Conformity Assessment Bodies (CABs) for wallet certification (under CIR 2024/2981) is operational. CABs have criteria (possibly CC profiles) to certify wallets including EBW features.                                              | *Dependency:* Schemes and criteria likely defined by Cooperation Group. CAB training and accreditation through national authorities (e.g. ANSSI, BSI, etc.). Potential uncertainty if criteria need updates for multi-user wallets.   |
| **Qualified Attribute Providers Onboard**   | 2027–2028                        | Business registries, tax authorities, etc. implement systems to issue **verifiable credentials (EAAs/QEAAs)** for company data. By 2028, core credentials (registration, VAT, licenses) available in digital signed form in most Member States.       | *Dependency:* Standards (data models), legal permission for digital issuance at national level. Some Member States may piggy-back on existing eIDAS nodes or SDG once-only infrastructure.       |
| **First Final EBW Wallet Certified**              | mid-2028 (goal)                  | A milestone when a wallet (or module) achieves full certification under EU scheme – confirming it meets all security, functionality, interoperability requirements.                                                                                   | Could be a Member State wallet or private sector solution. This builds trust and allows broad deployment (similar significance as first eIDAS eID notified in 2018).   |
| **EBW Go-Live: Mandatory Acceptance**       | T0 + 24 months:<br>**2028–2029**, *T0 = Entry into Force* | **All EU public administrations must accept EBW** for identification, signatures, data exchange by this date. EBW services officially go live EU-wide. Businesses can interact with any authority via the wallet, with legal guarantee of acceptance. | If entry into force was early 2027, this lands early 2029. Some Member States might quietly aim for late 2028 to be safe. *Gate:* The EU-wide interoperability infrastructure (e.g. trusted lists of wallets, discovery services) must be up and running by now. |
| **Widespread Industry Adoption**            | 2028–2030                        | Private sector uptake grows. Banks, large companies, data space platforms begin accepting and using EBW credentials for KYC, supply chain, etc. (Not legally mandated by EBW Reg, but likely driven by efficiency gains).                             | *Dependency:* Network effect – once governments accept, companies start using for G2B and then extend to B2B. Possibly further EU initiatives or national laws could push sectors (e.g. finance) to recognize EBW by 2030 if voluntary uptake is slow.           |
| **Post-Implementation Review**              | ~2030                            | Commission evaluates EBW’s impact, reports to Parliament/Council. Could propose adjustments if goals not met (e.g. if SMEs aren’t benefiting, or to mandate private-sector acceptance if needed).                                                     | *Dependency:* Sufficient data on usage and impact by then. This review is required typically ~3 years after application. It will inform any “EBW 2.0”.  |

<h2 id="rotating-presidencies-of-the-council-of-the-european-union-timeline">5. Rotating Presidencies of the Council of the European Union Timeline</h2>

List of the rotating Presidencies of the Council of the European Union (six-month terms) from 2025 until the end of 2030. The order is based on official rotation decisions and confirmed lists from the EU Info website and official EU Council rotation order.

| Year | Jan–Jun Presidency        | Jul–Dec Presidency        |
|------|---------------------------|---------------------------|
| *2025* | *Poland*                    | *Denmark*             |
| 2026 | **Cyprus**                    | Ireland                   |
| 2027 | Lithuania                 | Greece                    |
| 2028 | Italy                     | Latvia                    |
| 2029 | Luxembourg                | Netherlands               |
| 2030 | Slovakia                  | Malta                     |

<h2 id="key-risks-and-dependencies">6. Key Risks and Dependencies</h2>

Throughout these milestones, certain dependencies and risks stand out:

* **Political Risk**: A delay in legislative adoption (e.g. due to other political crises or lower priority) could push everything back, compressing the implementation window. The 2024 European elections and subsequent Commission changeover add uncertainty – if a new Commission had different priorities, EBW could be slowed (though given it’s already proposed under von der Leyen II, it likely has continuity).
* **Technical Risk**: If standardization outputs are delayed or if the chosen standards prove unimplementable at scale, that could cause a scramble. For instance, if ETSI cannot finalize QAA standards by 2026, Member States might each do their own for a while, causing fragmentation. The “agile” approach of annually revising implementing acts is a double-edged sword: it allows quick fixes, but also means implementers face moving targets.
* **Operational Readiness**: Not all Member States are equally advanced in digital ID. Some might struggle to meet the 2-year deadline. For example, connecting hundreds of local authorities’ IT systems to accept EBW might be challenging. The regulation’s transitional clause hints they can use “existing similar systems” during a transition – this may be invoked by laggards, creating an uncertainty band of perhaps +1 year in some regions. A critical dependency here is the availability of funding and technical assistance (the Digital Europe Programme and Recovery Funds could be tapped to help nations implement EBW; without that, some might fall behind).
* **Conformance and Trust**: A major gating factor is trust: businesses will only adopt the wallet if they trust its security and legal validity. Thus the conformity assessment processes (wallet certification, provider accreditation) must be fully operational before go-live. CABs need to be trained for wallet audits (which is new territory). Petteri Ihalainen (a conformity assessment expert) noted that CABs are eyeing the “tsunami of new business” from eIDAS 2 (wallet certification), but also that no certification system existed yet (as of late 2025) for wallets beyond an Austrian pilot, making it “impossible for a CAB to make a strategic decision right now”. This indicates that by 2026, the Cooperation Group must establish the Common Criteria profiles or equivalent so CABs worldwide can prepare. Any delay in that is a direct risk to the timeline.

<section class="references" markdown="1">
<h2 id="references">References</h2>

1. European Commission (Press Release) — “[Simpler EU digital rules and new digital wallets to save billions for businesses and boost innovation](https://digital-strategy.ec.europa.eu/en/news/simpler-eu-digital-rules-and-new-digital-wallets-save-billions-businesses-and-boost-innovation),” 19 Nov 2025.
2. European Commission (Digibyte) — “[Commission proposes European Business Wallets to simplify business operations and enhance competitiveness across the EU](https://digital-strategy.ec.europa.eu/en/news/commission-proposes-european-business-wallets-simplify-business-operations-and-enhance),” 19 Nov 2025.
3. European Commission (Q&A) — “[Digital Package — European Business Wallets](https://digital-strategy.ec.europa.eu/en/faqs/digital-package),” 19 Nov 2025.
4. European Commission (Fact Sheet) — “[The European Business Wallets in a nutshell](https://digital-strategy.ec.europa.eu/en/library/european-business-wallets-nutshell),” 19 Nov 2025.
5. European Commission Policy & Legislation — “[Proposal for a Regulation on the establishment of European Business Wallets](https://digital-strategy.ec.europa.eu/en/library/proposal-regulation-establishment-european-business-wallets),” 19 Nov 2025.
6. Carsten Stöcker, Spherity GmbH, “[The European Business Wallet: A Strategic Pillar for Digital Identity and Industrial Competitiveness in the EU](https://medium.com/spherity/the-european-business-wallet-a-strategic-pillar-for-digital-identity-and-industrial-3f9983f7b299),” Medium, 2025.  
7. Carsten Stöcker, Spherity GmbH, “[Digital Identity, Real World Impact: The Industrial Upside of the European Business Wallet (EBW)](https://medium.com/@cstoecker/digital-identity-real-world-impact-the-industrial-upside-of-the-european-business-wallet-eubw-d9e0c4e96aae),” Medium, 2025.  

</section>
