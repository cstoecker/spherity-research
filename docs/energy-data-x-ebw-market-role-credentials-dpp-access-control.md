---
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "European Business Wallet and Market Role Credentials for DPP Access Control: The energy data-X Reference Case"
seo_title: "European Business Wallet & DPP Access Control | energy data-X"
og_title: "energy data-X: EBW and Market-Role Credentials for DPP Access"
og_description: "A working European reference for legal-person identity, governed market roles, policy engines, and controlled DPP, battery-passport, and BESS data access."
subtitle: "How verifiable company identities, governed market roles and machine-readable policies enable secure access to Digital Product Passports, Battery Passports and European data spaces"
description: "How energy data-X uses European Business Wallets, market-role credentials and policy engines for controlled DPP, battery-passport and BESS data access."

paper_status: "Original journal article · Extended web analysis"
authors:
  - "Jan-Niklas Gößling"
  - "René Hoffmann"
  - "Axel Kießling"
  - "Daniel Rohrbach"
  - "Carsten Stöcker"
author_entities:
  - name: "Jan-Niklas Gößling"
    affiliation: "Amprion GmbH"
  - name: "René Hoffmann"
    affiliation: "Westnetz GmbH"
  - name: "Axel Kießling"
    affiliation: "TenneT TSO GmbH"
  - name: "Daniel Rohrbach"
    affiliation: "Fraunhofer IOSB-AST"
  - name: "Carsten Stöcker"
    affiliation: "Spherity GmbH"
    same_as:
      - "https://www.linkedin.com/in/dr-carsten-st%C3%B6cker-1145871/"
author_affiliations:
  - "Jan-Niklas Gößling — Amprion GmbH"
  - "René Hoffmann — Westnetz GmbH"
  - "Axel Kießling — TenneT TSO GmbH"
  - "Daniel Rohrbach — Fraunhofer IOSB-AST"
  - "Carsten Stöcker — Spherity GmbH"
affiliation: "Amprion GmbH; Westnetz GmbH; TenneT TSO GmbH; Fraunhofer IOSB-AST; Spherity GmbH"
date: "2026-08-11"
last_modified_at: "2026-09-07"
research_cutoff: "2026-08-11"
research_cutoff_label: "Regulatory and project status verified to this date"
lang: "en"

journal_title: "ENERGIEWIRTSCHAFTLICHE TAGESFRAGEN"
volume: "76"
issue: "7-8"
page_start: "19"
page_end: "22"
citation_publication_date: "2026"

permalink: /energy-data-x-ebw-market-role-credentials-dpp-access-control.html
canonical_url: "https://spherity.github.io/spherity-research/energy-data-x-ebw-market-role-credentials-dpp-access-control.html"
latest_version: "https://spherity.github.io/spherity-research/energy-data-x-ebw-market-role-credentials-dpp-access-control.html"
pdf_url: "/energy-data-X-European-Business-Wallet-market-role-credentials-BESS-2026.pdf"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"
license_scope: "The original web analysis on this page"
license_exclusions: "The journal PDF, journal layout, credited source figures, photograph and other third-party material retain their respective rights and are not relicensed by this webpage."

image: "/assets/preview-energy-data-x-ebw-market-role-credentials.webp"
image_mime: "image/webp"
image_alt: "Social preview of the energy data-X article on European Business Wallets, market-role credentials, BESS data exchange, and controlled Digital Product Passport access."
image_width: 1200
image_height: 630
cover_image: "/assets/energy-data-x-ebw-market-role-credentials-cover-v2.jpg"
cover_image_alt: "First page of the published energy data-X journal article in ENERGIEWIRTSCHAFTLICHE TAGESFRAGEN."

answer_summary: "European Business Wallets and market-role credentials address different questions in restricted Digital Product Passport access. Legal-person authentication establishes which organisation is requesting access. A governed market-role credential establishes the capacity in which that organisation acts, who issued the evidence and whether it remains valid. A policy engine then evaluates those verified attributes, credential status, purpose, product scope and machine-readable access rules before a connector or DPP application permits an operation. This distinction matters when information is not public and access depends on statutory authority, a Person with a Legitimate Interest, contractual authority, consent or ecosystem governance. The energy data-X prototype provides a practical reference: authentic sources and authorised issuers supply verifiable evidence to a business wallet, while connector-side policy enforcement turns that evidence into an auditable access decision."
key_takeaways:
  - "Authentication proves the organisation; a governed role credential proves the capacity in which it acts; policy determines what that role may do with a specific asset."
  - "energy data-X implements a federated trust chain from authentic sources and authorised issuers through European Business Wallet concepts to connector-side verification and policy enforcement."
  - "The project demonstrates role-based energy-data exchange and the Imbalance Settlement Quality use case; transfer to DPP, DBP and authority-access models is an architectural application, not proof that every future legal requirement is already satisfied."
  - "Regulation (EU) 2023/1542 separates public, authority-restricted and legitimate-interest battery-passport data, making current status, governed roles and purpose-limited policy central design concerns."
  - "The European Business Wallet remains a legislative proposal as of the research cut-off; its identity, credential, delegation and secure-exchange functions are nevertheless directly relevant to cross-border DPP access architecture."
  - "Existing sector trust such as the German Smart Metering PKI can coexist with wallet-based legal-person and role credentials rather than being displaced."
about:
  - "European Business Wallet"
  - "energy data-X"
  - "Digital Product Passport access control"
  - "Digital Battery Passport"
  - "Market-role credentials"
  - "Battery energy storage systems"
  - "European Energy Data Space"
mentions:
  - "BESS"
  - "Person with a Legitimate Interest"
  - "DPP Registry"
  - "Market Partner ID"
  - "Verifiable credentials"
  - "W3C ODRL"
  - "Policy engine"
  - "Catena-X"
  - "Manufacturing-X"
  - "CIRPASS-2"
  - "Market Surveillance Authorities"
  - "Smart Metering PKI"
  - "Trusted AI"
citations:
  - "https://energydata-x.eu/"
  - "https://github.com/Re4DE"
  - "https://bdew-codes.de/"
  - "https://eur-lex.europa.eu/eli/reg/2023/1542/oj/eng"
  - "https://eur-lex.europa.eu/eli/reg/2024/1781/oj/eng"
  - "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025PC0838"
  - "https://eur-lex.europa.eu/procedure/EN/2025_358"
  - "https://www.consilium.europa.eu/en/press/press-releases/2026/06/09/european-business-wallets-council-adopts-negotiating-position/"
  - "https://www.w3.org/TR/odrl-model/"
  - "https://cirpass2.eu/project-results/"
  - "https://catena-x.net/use-case-cluster/digital-product-passport/"
  - "https://www.plattform-i40.de/IP/Redaktion/EN/Standardartikel/ManufacturingX_Framework.html"
  - "https://digital-strategy.ec.europa.eu/en/policies/digitalisation-energy"
questions_answered:
  - question: "What is energy data-X?"
    answer: "energy data-X is a German cross-sector energy-data ecosystem project. It uses a federated model rather than a central data pool: data remains with participants and is exchanged through connectors under shared identity, trust, catalogue, contract and policy mechanisms. The published case study reports implementation of fine-grained authorisation with European Business Wallet concepts and verifiable credentials."
  - question: "What is a market-role credential?"
    answer: "A market-role credential is verifiable evidence that an identified organisation holds a governed role, such as supplier, grid operator or metering point operator. Its value depends on an authoritative role source, eligibility rules, an authorised issuer, validity and status controls, and runtime verification. It is not merely a self-declared profile field or copied master-data value."
  - question: "Why is authentication alone insufficient for a Digital Product Passport?"
    answer: "Authentication answers who is requesting access. Restricted DPP access also requires evidence of the capacity in which the organisation acts, the purpose and product scope, the current validity of that authority, and the operation allowed by policy. A verified login therefore cannot by itself establish entitlement to commercially sensitive, authority-only or legitimate-interest information."
  - question: "What is a Person with a Legitimate Interest in a battery passport?"
    answer: "Regulation (EU) 2023/1542 reserves specified model-level and individual-battery information for Persons with a Legitimate Interest. Article 77(9) requires an implementing act to define the eligible persons and their rights. At the 11 August 2026 research cut-off, the statutory deadline of 18 August 2026 had not yet passed, so this page does not treat every repair, finance, insurance or lifecycle actor as automatically qualifying."
  - question: "Can a European Business Wallet control DPP access?"
    answer: "A European Business Wallet can present legal-person, representation, delegation and role evidence used in an access decision. It does not itself determine every DPP permission. A policy engine must evaluate the credentials, trusted issuer, status, purpose, jurisdiction, product context and applicable DPP policy, while the connector or DPP API enforces the result."
  - question: "What is the role of W3C ODRL in DPP access control?"
    answer: "W3C Open Digital Rights Language (ODRL) 2.2 expresses permissions, prohibitions, duties and constraints concerning an asset. It can make DPP usage rules machine readable, but it does not authenticate an organisation or prove a market role. Verifiable identity and role evidence supply facts; ODRL-style policy semantics describe how those facts affect permitted use."
  - question: "How does energy data-X relate to the Common European Energy Data Space?"
    answer: "energy data-X is not the Common European Energy Data Space. It is a national and sector reference implementation whose federated connectors, organisational trust, governed roles and machine-readable policies can inform European convergence. The reusable lesson is that cross-border participants must prove both who they are and the regulated or governed capacity in which they act."
  - question: "How can this architecture mitigate DPP cybersecurity risks?"
    answer: "The architecture can mitigate impersonation, unauthorised access, overly broad permissions, stale roles and weak provenance by combining verified legal-person identity, governed role credentials, trusted issuers, status checks, least-privilege policy, connector enforcement and auditable decisions. It does not address every CIRPASS-2 risk; product-data integrity, availability, recovery and lifecycle governance require additional controls."
related_publications:
  - title: "Verifiable, Access-Controlled Digital Product Passports"
    url: "/verifiable-access-controlled-digital-product-passports.html"
    context: "Develops the two-plane DPP and DBP architecture for legal-person identity, policy, evidence graphs, BESS and bounded Industrial AI."
  - title: "Spherity Strategy and Market Positioning Update"
    url: "/spherity-dpp-dbp-strategy-market-positioning.html"
    context: "Places identity-first DPP, DBP and European Business Wallet convergence in Spherity's 2026–2029 strategy."
  - title: "European Business Wallets as the Legal Control Plane for Zero Trust AI Agents"
    url: "/ebw-zero-trust-ai-agents.html"
    context: "Extends legal-person identity, role and delegation evidence from human-directed transactions to governed machine and AI-agent actions."
faq_schema: true

toc_items:
  - title: "Original publication"
    href: "#original-publication"
  - title: "Why governed roles matter"
    href: "#why-governed-roles-matter"
  - title: "energy data-X architecture"
    href: "#energy-data-x-architecture"
  - title: "Market-role governance"
    href: "#market-role-governance"
  - title: "DPP and battery access"
    href: "#dpp-battery-access"
  - title: "EBW and DPP convergence"
    href: "#ebw-dpp-convergence"
  - title: "Credentials and policy"
    href: "#credentials-and-policy"
  - title: "Cybersecurity controls"
    href: "#cybersecurity-controls"
  - title: "European data spaces"
    href: "#european-data-spaces"
  - title: "Implementation guide"
    href: "#implementation-guide"
  - title: "Evidence boundaries"
    href: "#evidence-boundaries"
  - title: "Primary sources"
    href: "#primary-sources"
  - title: "License and citation"
    href: "#license-and-citation"
  - title: "Questions answered"
    href: "#questions-answered"

tags:
  - european-business-wallet
  - ebw
  - energy-data-x
  - digital-product-passport
  - dpp
  - digital-battery-passport
  - dbp
  - battery-passport
  - bess
  - market-role-credentials
  - market-partner-id
  - dpp-access-control
  - persons-with-a-legitimate-interest
  - policy-engine
  - odrl
  - verifiable-credentials
  - data-spaces
  - common-european-energy-data-space
  - catena-x
  - manufacturing-x
  - cirpass-2
  - trusted-ai
---

<div class="paper-download">
  <a href="{{ page.pdf_url | relative_url }}">Read the original four-page journal PDF</a>
  <p>This web page is an extended, source-linked analysis. The attached journal PDF remains the primary source for the implemented energy data-X architecture and the authors' published claims.</p>
</div>

<figure class="paper-figure centered-figure">
  <img src="{{ page.cover_image | relative_url }}"
       alt="{{ page.cover_image_alt }}"
       width="893"
       height="1263">
  <figcaption><strong>Original publication.</strong> First page of the journal article, with the published title “The energy data-X data ecosystem: Cross-sector and BESS data exchange enabled by the European Business Wallet and market role credentials.”</figcaption>
</figure>

<h2 id="original-publication">Original publication and academic attribution</h2>

<p><strong>Published citation.</strong> Gößling, Jan-Niklas; Hoffmann, René; Kießling, Axel; Rohrbach, Daniel; and Stöcker, Carsten (2026). “The energy data-X data ecosystem: Cross-sector and BESS data exchange enabled by the European Business Wallet and market role credentials.” <cite>ENERGIEWIRTSCHAFTLICHE TAGESFRAGEN</cite>, Vol. 76, Issue 7-8, pp. 19–22.</p>

<p>The paper is a five-author industry and academic publication. It is not presented as a single-author Spherity paper. Its primary contribution is an implemented trust architecture for federated energy-data exchange, including legal-person identity, Market Partner IDs, governed market roles, connector-side policy checks and compatibility with existing technical trust infrastructures.</p>

<aside class="evidence-callout" aria-labelledby="status-cutoff-title">
  <h3 id="status-cutoff-title">Evidence and legal-status cut-off: 11 August 2026</h3>
  <p>The original paper is the primary source for energy data-X implementation claims. EU legal statements are checked against EUR-Lex and official institutional sources. Architecture transfers to Digital Product Passports (DPPs), Digital Battery Passports (DBPs), authorities and AI delegation are identified as applications or recommendations where they were not demonstrated by the reported use case.</p>
</aside>

<h2 id="why-governed-roles-matter">Why governed roles matter more than a login</h2>

<p>The difficult part of restricted DPP access is not merely authenticating a user. It is establishing and continuously verifying the governed role and authority under which an organisation acts, then evaluating that evidence against machine-readable access policy.</p>

<div class="table-scroll">
  <table class="academic-table">
    <caption><strong>Five distinct trust questions.</strong> Each control solves a different part of the access decision.</caption>
    <thead><tr><th scope="col">Control</th><th scope="col">Question answered</th><th scope="col">Typical evidence or component</th></tr></thead>
    <tbody>
      <tr><td>Legal-person authentication</td><td>Which organisation is this?</td><td>Register-backed company credential, European Unique Identifier or comparable organisational evidence</td></tr>
      <tr><td>Role verification</td><td>In which governed capacity is it acting?</td><td>Market Partner ID, market-role or professional-role credential</td></tr>
      <tr><td>Authorisation</td><td>What may that role do with this asset?</td><td>Attribute-based or policy-based decision using role, purpose, scope and status</td></tr>
      <tr><td>Policy enforcement</td><td>Is this operation allowed now?</td><td>Connector, DPP API or policy enforcement point</td></tr>
      <tr><td>Provenance</td><td>Which trusted source supports the identity, role or data?</td><td>Authentic source, authorised issuer and auditable credential chain</td></tr>
    </tbody>
  </table>
</div>

<h2 id="energy-data-x-architecture">energy data-X: a working reference architecture for trusted sector data exchange</h2>

<p><a href="https://energydata-x.eu/" rel="external">energy data-X</a> is a German cross-sector energy-data ecosystem project. It builds on the German Energy Agency's <a href="https://github.com/Re4DE" rel="external">Reference System for Data Exchange in the Energy Sector (Re4DE)</a>. The paper reports a federated model: data remains in participants' systems and is exchanged through connectors under common identity, trust, catalogue, contract and policy mechanisms. It is not a central data pool.</p>

<p>The project's official Identity &amp; Trust material identifies Spherity as the lead for that federated service. In the reported implementation, Bundesanzeiger Verlag supplies register-backed company information as verifiable credentials. The paper describes how company identity, European Unique Identifier (EUID), EU Company Certificate (EUCC), Market Partner ID and market-role evidence can be combined and checked by a connector-side policy engine.</p>

<ol class="trust-flow" aria-label="energy data-X trust chain">
  <li><strong>Authentic source</strong><span>Register or governed primary role source</span></li>
  <li><strong>Authorised issuer</strong><span>Company authentication and credential issuance</span></li>
  <li><strong>European Business Wallet</strong><span>Legal-person identity, roles and attestations</span></li>
  <li><strong>Verifiable credential</strong><span>Issuer-bound, status-checkable evidence</span></li>
  <li><strong>Connector</strong><span>Credential request and presentation</span></li>
  <li><strong>Policy engine</strong><span>Contextual verification and decision</span></li>
  <li><strong>Data or service</strong><span>Allow, constrain or deny the operation</span></li>
</ol>

<p>The paper's “Imbalance settlement quality” case links metering data, a supplier or Balance Responsible Party (BRP), forecasting and flexibility provision. Test data passes through connectors, while verifiable identity and role evidence supports fine-grained authorisation. The reported result is evidence that regulated energy processes can be linked through a federated data ecosystem; it is not a claim that all production, legal or cross-border scenarios have been completed.</p>

<h3>Existing technical trust can coexist with wallet trust</h3>

<p>The German Smart Metering Public Key Infrastructure (SM-PKI) remains applicable to mandated sector processes. energy data-X combines that technical trust level with business-wallet credentials. The transferable pattern is:</p>

<p class="decision-expression"><strong>sector or device technical trust + legal-person trust + governed role trust + policy enforcement</strong></p>

<p>This layered model is relevant to industrial systems, BESS, Internet of Things deployments and future machine-to-machine transactions because it avoids forcing one credential system to replace every established sector control.</p>

<h2 id="market-role-governance">Market-role credentials are governed authorisation evidence</h2>

<p>A role credential creates trustworthy authorisation only when governance exists behind it. The <a href="https://bdew-codes.de/" rel="external">BDEW Codes</a> system provides the German electricity-market reference: role-specific Market Partner IDs identify participants in governed market communication. energy data-X is important because it demonstrates how an established sector role model can be exposed as verifiable evidence and evaluated automatically.</p>

<ol class="governance-lifecycle">
  <li><strong>Authoritative source:</strong> a register or sector body maintains the underlying identity or role.</li>
  <li><strong>Eligibility:</strong> documented criteria determine who may hold the role.</li>
  <li><strong>Assignment and issuance:</strong> an authorised issuer binds the role to the identified legal person.</li>
  <li><strong>Validity and runtime verification:</strong> relying systems verify issuer trust, attributes, dates and credential status.</li>
  <li><strong>Monitoring and change:</strong> the authoritative role may change, be suspended or end.</li>
  <li><strong>Status, renewal and audit:</strong> credential status or revocation mechanisms reflect those changes and preserve decision evidence.</li>
</ol>

<p>Management of the underlying Market Partner ID or role and revocation of a corresponding verifiable credential are related but distinct processes. This page does not assert a specific BDEW credential-revocation procedure beyond what the authoritative source documents.</p>

<h2 id="dpp-battery-access">From energy-market roles to DPP and battery-passport access</h2>

<p><a href="https://eur-lex.europa.eu/eli/reg/2023/1542/oj/eng" rel="external">Regulation (EU) 2023/1542</a>, Articles 77 and 78 and Annex XIII, separates public battery-passport information from information reserved for notified bodies, Market Surveillance Authorities and the Commission, and information reserved for Persons with a Legitimate Interest (PLI). It also requires restricted access rights, data authentication, reliability, integrity, security and privacy.</p>

<aside class="evidence-callout" aria-labelledby="pli-status-title">
  <h3 id="pli-status-title">PLI status at the research cut-off</h3>
  <p>Article 77(9) requires the Commission to specify eligible Persons with a Legitimate Interest and their access rights by 18 August 2026. At the 11 August 2026 cut-off, that deadline had not yet passed and no final implementing act was identified in EUR-Lex. The matrix below therefore distinguishes statutory authority access, purposes expressly referenced by the Regulation, and actors whose access may depend on the future implementing act, another law, contract, consent or ecosystem governance.</p>
</aside>

<div class="table-scroll">
  <table class="academic-table role-access-table">
    <caption><strong>Illustrative role-to-access matrix.</strong> “Possible credential” is an architecture proposal, not a claim that EU law mandates a particular credential format.</caption>
    <thead><tr><th scope="col">Actor</th><th scope="col">Typical reason</th><th scope="col">Legal or access category</th><th scope="col">Possible evidence</th><th scope="col">Example data or action</th></tr></thead>
    <tbody>
      <tr><td>Market Surveillance Authority</td><td>Compliance investigation</td><td>Express statutory authority access</td><td>Authority identity, jurisdiction and mandate credential</td><td>Compliance test reports and regulated model data</td></tr>
      <tr><td>Notified body</td><td>Conformity assessment</td><td>Express statutory access</td><td>Notified-body identity and scope credential</td><td>Test reports for the assessed product scope</td></tr>
      <tr><td>European Commission</td><td>Regulatory oversight</td><td>Express statutory access</td><td>Institution and delegated-officer or system mandate</td><td>Authority and PLI information under Annex XIII</td></tr>
      <tr><td>Customs authority</td><td>Border and import controls</td><td>ESPR/DPP Registry and customs-law context; exact data access depends on applicable law and implementation</td><td>Authority, jurisdiction and customs mandate</td><td>Registry status, identifiers and conformity evidence</td></tr>
      <tr><td>Professional repairer or workshop</td><td>Safe repair and spare-part selection</td><td>Potential PLI aligned with repair purpose; final eligibility depends on Article 77(9)</td><td>Professional role, qualification and service mandate</td><td>Parts, dismantling, safety and relevant state information</td></tr>
      <tr><td>Dismantler, recycler or remanufacturer</td><td>Preparation for reuse, remanufacturing or recycling</td><td>Purpose expressly reflected in Article 77(9) criteria; actor status still requires implementing detail</td><td>Facility/operator role and product-handling scope</td><td>Composition, disassembly, safety and lifecycle status</td></tr>
      <tr><td>Second-life operator or marketplace</td><td>Residual-value and suitability assessment</td><td>Potential PLI; may also require contract or consent</td><td>Second-life role plus transaction mandate</td><td>State of health, use history and lifecycle status</td></tr>
      <tr><td>BESS operator or maintenance provider</td><td>Safe operation and maintenance</td><td>Contractual/operational access unless a legal entitlement applies</td><td>Operator or service role, asset scope and delegation</td><td>Maintenance, safety, condition and service history</td></tr>
      <tr><td>Independent aggregator or energy-market participant</td><td>Flexibility and market operation</td><td>Energy-market and contractual governance; not automatically a PLI</td><td>Market Partner ID, market role and asset mandate</td><td>Permitted operational data, not unrestricted passport content</td></tr>
      <tr><td>Safety auditor</td><td>Risk and control assurance</td><td>Legal, contractual or ecosystem authority</td><td>Auditor qualification and engagement scope</td><td>Safety evidence and bounded audit records</td></tr>
      <tr><td>Leasing, finance or insurance provider</td><td>Valuation, underwriting or claims</td><td>Contract, consent or another legal basis; not automatically a PLI</td><td>Service role, customer consent and product scope</td><td>Purpose-limited condition or event evidence</td></tr>
    </tbody>
  </table>
</div>

<h3>Battery and BESS boundaries</h3>

<p>From 18 February 2027, the battery-passport obligation applies to electric-vehicle batteries, light-means-of-transport batteries and industrial batteries above the statutory threshold. It can cover batteries used within commercial, industrial and grid-scale storage. The regulated passport object is the battery, however, not automatically the entire BESS or Grid Booster installation. A system-level BESS evidence model may also include inverters, controls, software, interfaces, operators and service history.</p>

<p>Role-controlled access is particularly important for detailed composition, dismantling and safety information, state of health, negative events, maintenance, second-life assessment, repair, repurposing, remanufacturing and recycling. Product scope, purpose and the current lifecycle status must be evaluated alongside the requester's role.</p>

<h2 id="ebw-dpp-convergence">European Business Wallet + DPP: an emerging European trust architecture</h2>

<p>The European Commission's <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025PC0838" rel="external">COM(2025) 838 final</a> proposes European Business Wallets under procedure <a href="https://eur-lex.europa.eu/procedure/EN/2025_358" rel="external">2025/0358(COD)</a>. As of 11 August 2026, the procedure remains ongoing. The <a href="https://www.consilium.europa.eu/en/press/press-releases/2026/06/09/european-business-wallets-council-adopts-negotiating-position/" rel="external">Council adopted its negotiating position on 9 June 2026</a>; the proposal is not enacted law.</p>

<p>The proposal's relevant primitives are European legal-person identification, trusted documents and attestations, delegation, electronic signatures and seals, and secure cross-border exchange. Those capabilities provide a strong policy bridge to DPP access, but they do not by themselves define a complete DPP-role taxonomy or access-control profile. Sector governance and product legislation still determine who may act and what may be accessed.</p>

<p>This produces a two-plane relationship:</p>

<ul>
  <li><strong>Business-wallet plane:</strong> who the organisation is, who represents it, which governed roles and mandates it can prove, and whether the evidence remains valid.</li>
  <li><strong>DPP/DBP plane:</strong> which product or battery data exists, which access tier applies, and which read, write, update or reuse operation policy permits.</li>
</ul>

<h2 id="credentials-and-policy">Credentials establish facts; policies determine access</h2>

<p>A verifiable credential can prove attributes such as legal-person identity, market role, professional qualification or delegated authority. The <a href="https://www.w3.org/TR/odrl-model/" rel="external">W3C ODRL Information Model 2.2</a> is a W3C Recommendation for expressing permissions, prohibitions, duties and constraints concerning an asset. A policy engine evaluates the credential evidence, context and policy. A connector, DPP API or Policy Enforcement Point applies the decision.</p>

<p class="decision-expression"><strong>Access = verified legal entity AND valid role credential AND authorised issuer AND acceptable status AND permitted purpose AND matching product policy</strong></p>

<p>ODRL does not authenticate an organisation. Identity and role evidence, policy semantics, decision logic and enforcement remain separate controls. Attribute-Based Access Control (ABAC), Policy-Based Access Control (PBAC) and Zero Trust principles can be combined so that every request is evaluated using current evidence rather than a one-time account assignment.</p>

<ol class="trust-flow" aria-label="Transfer from energy market role governance to DPP access control">
  <li><strong>Role register</strong><span>Authentic source for legal or professional capacity</span></li>
  <li><strong>Credential issuer</strong><span>Governed binding of role to legal person</span></li>
  <li><strong>Business wallet</strong><span>Controlled presentation of identity and authority</span></li>
  <li><strong>DPP request</strong><span>Product, action, purpose and jurisdiction context</span></li>
  <li><strong>Policy engine</strong><span>Credential, status and policy evaluation</span></li>
  <li><strong>Access decision</strong><span>PLI, authority, professional or contractual path</span></li>
  <li><strong>DPP/DBP data</strong><span>Purpose-limited read, write, update or reuse</span></li>
</ol>

<h2 id="cybersecurity-controls">Mitigating DPP authentication and authorisation risks identified by CIRPASS-2</h2>

<p><a href="https://cirpass2.eu/project-results/" rel="external">CIRPASS-2 D4.1 and its Risks and Mitigations companion</a> identify risks that can reduce DPP system value or harm stakeholders. energy data-X does not solve the complete DPP threat model. Its trust pattern can, however, address important authentication and authorisation classes.</p>

<div class="table-scroll">
  <table class="academic-table">
    <caption><strong>Risk-to-control mapping.</strong> The controls are architecture applications informed by the energy data-X implementation.</caption>
    <thead><tr><th scope="col">Risk class</th><th scope="col">Relevant control chain</th><th scope="col">Residual requirement</th></tr></thead>
    <tbody>
      <tr><td>Impersonation or weak authentication</td><td>Register-backed legal-person credential, trusted issuer and wallet presentation</td><td>Identity proofing, key protection, phishing resistance and incident response</td></tr>
      <tr><td>Incorrect or unauthorised access</td><td>Governed role credential, product context, least-privilege policy and enforcement</td><td>Correct policy design, testing and exception handling</td></tr>
      <tr><td>Overly broad permissions</td><td>Purpose, action, product, jurisdiction and time constraints</td><td>Data minimisation and periodic entitlement review</td></tr>
      <tr><td>Stale, suspended or invalid roles</td><td>Credential status, expiry, authoritative-source monitoring and runtime verification</td><td>Timely propagation and resilient status services</td></tr>
      <tr><td>Compromised credentials</td><td>Revocation or suspension, wallet security and auditable re-issuance</td><td>Key compromise detection and recovery</td></tr>
      <tr><td>Insufficient provenance</td><td>Authentic source, authorised issuer and decision evidence</td><td>Product-data provenance and transformation evidence</td></tr>
      <tr><td>Weak auditability</td><td>Issuer, credential, policy version, context and decision receipt</td><td>Retention, privacy, evidence integrity and accountable review</td></tr>
    </tbody>
  </table>
</div>

<h2 id="european-data-spaces">Portable trust across European data spaces</h2>

<h3>energy data-X and the Common European Energy Data Space</h3>

<p>energy data-X is not the Common European Energy Data Space (CEEDS). It is a national and sector reference implementation. The Commission's current <a href="https://digital-strategy.ec.europa.eu/en/policies/digitalisation-energy" rel="external">digitalisation-of-energy work</a> emphasises interoperable and open digital solutions, data sovereignty and a pan-European energy data space. At European scale, participants need to prove not only organisational identity but also the regulated or governed capacity in which they act.</p>

<p>The reusable infrastructure is market-role governance, trusted issuers, credential status and policy-based verification. It can support distributed flexibility, smart and bidirectional charging, BESS, grid operation and sector coupling while allowing sector-specific rules to remain authoritative.</p>

<h3>Why this matters for Catena-X</h3>

<p><a href="https://catena-x.net/use-case-cluster/digital-product-passport/" rel="external">Catena-X EcoPass</a> provides a sovereign automotive data-space foundation for Digital Product Passports and is advancing validation, verification, onboarding and governance. Portable, externally governed professional-role credentials can complement participant identity where DPP access depends on a recycler, repairer, remanufacturer, authority or other lifecycle role. This page does not claim that Catena-X currently uses the energy data-X role-credential implementation.</p>

<h3>Why the same trust layer matters for Manufacturing-X</h3>

<p><a href="https://www.plattform-i40.de/IP/Redaktion/EN/Standardartikel/ManufacturingX_Framework.html" rel="external">Manufacturing-X</a> is a cross-industry initiative for sovereign, federated industrial data ecosystems. Cross-sector DPP access needs portable identity and role semantics so authority is not trapped in a single sector IAM silo. energy data-X shows how one regulated sector's role governance can become verifiable input to cross-company data exchange.</p>

<h3>A practical trust architecture for authorities</h3>

<p>A scalable European DPP system needs more than a separate “authority login.” It must determine which authority is requesting access, its jurisdiction and competence, whether an officer or system may act for it, the information category and purpose, and whether that mandate remains valid. Under the Ecodesign for Sustainable Products Regulation, the DPP Registry supports market-surveillance and customs functions. Credential-based authority access is an architecture proposal where legislation does not prescribe the exact implementation.</p>

<h2 id="implementation-guide">Implementation guide for DPP and data-space operators</h2>

<ol>
  <li><strong>Define the legal and product object.</strong> Separate the regulated battery passport from the wider BESS, site or service architecture.</li>
  <li><strong>Map access tiers.</strong> Distinguish public, statutory authority, legitimate-interest, contractual, consent-based and ecosystem-governed access.</li>
  <li><strong>Name authentic sources.</strong> Identify who authoritatively maintains each legal-person, authority, professional or market role.</li>
  <li><strong>Govern issuers and status.</strong> Specify eligibility, issuance, expiry, suspension, revocation, renewal and audit responsibilities.</li>
  <li><strong>Separate identity, role and policy.</strong> Avoid encoding every entitlement in application-local user groups.</li>
  <li><strong>Evaluate at runtime.</strong> Check issuer trust, credential integrity, status, purpose, product scope, jurisdiction and policy version for each sensitive operation.</li>
  <li><strong>Enforce and record.</strong> Apply the decision at the connector or DPP API and retain proportionate, privacy-aware decision evidence.</li>
  <li><strong>Test failure paths.</strong> Include stale roles, unavailable status services, compromised credentials, conflicting policies and revoked mandates.</li>
</ol>

<p>Benefits include less bilateral role administration, reusable organisation onboarding, portable role evidence, dynamic status, policy changes without rebuilding every application, consistent access across DPP providers, stronger auditability, cross-sector interoperability and reduced dependence on proprietary IAM silos.</p>

<aside class="evidence-callout" aria-labelledby="commission-proof-title">
  <h3 id="commission-proof-title">Why this proof of technology matters for EU DPP implementation</h3>
  <p>energy data-X provides practical evidence that authentic sources can feed verifiable company and role evidence, business-wallet concepts can present that evidence, policy engines can evaluate it, and established sector trust can coexist with organisational credentials. European DPP pilots should therefore test role governance, issuance, status and revocation, policy evaluation, authority access, PLI access and audit evidence—not only identifiers, registry submission and data syntax.</p>
</aside>

<h3>Forward path: delegated machines and AI agents</h3>

<p>The paper recognises delegation to employees, machines, services and AI agents, but does not claim that autonomous agent delegation was implemented in the reported energy data-X use case. The logical extension is:</p>

<p class="decision-expression"><strong>Legal Person → Enterprise or Business Wallet → Delegated Mandate → Machine or Agent Identity → Policy → Authorised Action</strong></p>

<p>This becomes relevant when BESS optimisers, flexibility agents or industrial AI services request protected data or execute market actions. Each action then needs a verifiable principal, bounded mandate, applicable market role, policy context and decision evidence.</p>

<h2 id="evidence-boundaries">Evidence boundaries</h2>

<ul>
  <li><strong>Implemented and reported:</strong> federated connectors, credential-based company and market-role evidence, policy-engine checks, compatibility with Smart Metering PKI, and the Imbalance Settlement Quality test case.</li>
  <li><strong>Regulatory fact:</strong> the Batteries Regulation defines differentiated access tiers and requires an Article 77(9) implementing act; the European Business Wallet remains a proposal under the ordinary legislative procedure at the cut-off date.</li>
  <li><strong>Architecture transfer:</strong> using governed role credentials and policy engines for DPP, DBP, PLI, authority and professional access.</li>
  <li><strong>Future research:</strong> cross-border role governance, production-scale DPP authority access, BESS system passports, and delegated machine or AI-agent actions.</li>
</ul>

<h2 id="primary-sources">Primary sources</h2>

<div class="references">
  <p>[1] Gößling, J.-N.; Hoffmann, R.; Kießling, A.; Rohrbach, D.; Stöcker, C. (2026). “The energy data-X data ecosystem: Cross-sector and BESS data exchange enabled by the European Business Wallet and market role credentials.” <cite>ENERGIEWIRTSCHAFTLICHE TAGESFRAGEN</cite> 76, Issue 7-8, pp. 19–22. <a href="{{ page.pdf_url | relative_url }}">Original PDF</a>.</p>
  <p>[2] energy data-X. <a href="https://energydata-x.eu/">Official project website</a> and <a href="https://www.energydata-x.eu/wp-content/uploads/2025/03/OnePager_06_Identity_Trust_03-2025.pdf">Identity &amp; Trust federated-service brief</a>.</p>
  <p>[3] German Energy Agency. <a href="https://github.com/Re4DE">Reference System for Data Exchange in the Energy Sector (Re4DE)</a>.</p>
  <p>[4] European Parliament and Council. <a href="https://eur-lex.europa.eu/eli/reg/2023/1542/oj/eng">Regulation (EU) 2023/1542 concerning batteries and waste batteries</a>, especially Articles 77–78 and Annex XIII.</p>
  <p>[5] European Parliament and Council. <a href="https://eur-lex.europa.eu/eli/reg/2024/1781/oj/eng">Regulation (EU) 2024/1781 establishing the ESPR framework</a>.</p>
  <p>[6] European Commission. <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:52025PC0838">COM(2025) 838 final: proposal on European Business Wallets</a>; <a href="https://eur-lex.europa.eu/procedure/EN/2025_358">procedure 2025/0358(COD)</a>.</p>
  <p>[7] Council of the European Union. <a href="https://www.consilium.europa.eu/en/press/press-releases/2026/06/09/european-business-wallets-council-adopts-negotiating-position/">European business wallets: Council adopts negotiating position</a>, 9 June 2026.</p>
  <p>[8] W3C. <a href="https://www.w3.org/TR/odrl-model/">ODRL Information Model 2.2</a>, W3C Recommendation.</p>
  <p>[9] CIRPASS-2. <a href="https://cirpass2.eu/project-results/">D4.1 Reference Architecture and Risks and Mitigations companion</a>, 10 June 2026.</p>
  <p>[10] Catena-X. <a href="https://catena-x.net/use-case-cluster/digital-product-passport/">Digital Product Passport / EcoPass</a>.</p>
  <p>[11] Plattform Industrie 4.0. <a href="https://www.plattform-i40.de/IP/Redaktion/EN/Standardartikel/ManufacturingX_Framework.html">Manufacturing-X architecture and technological base</a>.</p>
  <p>[12] European Commission. <a href="https://digital-strategy.ec.europa.eu/en/policies/digitalisation-energy">Digitalising the EU energy system</a>.</p>
</div>
