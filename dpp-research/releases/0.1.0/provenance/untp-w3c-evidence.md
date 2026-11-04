# UNTP, UNECE, W3C and business wallets: evidence notes

Research cut-off and access date: **23 October 2026**. This is a targeted research baseline, not a claim to exhaustive coverage. Live specifications can change; version labels below describe the pages inspected on this date. Statements about proposed architectures describe their specifications, not independently measured deployment.

## UN policy, business requirements and technical protocol are separate objects

| Object | Observed status | Evidence and useful locator |
|---|---|---|
| UNECE Recommendation No. 49, *Transparency at Scale — Fostering Sustainable Value Chains* | Adopted at the 31st UN/CEFACT Plenary, 3–4 July 2025. Policy recommendation, not directly binding national DPP legislation. A publication page dated April 2026 is a separate publication event. | [UNECE 2025 newsletter](https://unece.org/sites/default/files/2025-10/Newsletter_Jan-Sep2025.pdf), section on Recommendation 49; [publication page](https://unece.org/trade/documents/2026/04/recommendation-ndeg-49-transparency-scale-fostering-sustainable-value). |
| UN/CEFACT project P1143, DPP Overview and Fundamental Principles | Public-review notice dated 11 August 2026; review ran until 12 October 2026. Review closure does not establish final approval. | [UN/CEFACT official homepage](https://unece.org/trade/uncefact), Highlights; [official UN/CEFACT announcement](https://www.linkedin.com/posts/uncefact_uncefact-unece-digitalproductpassport-activity-7493212202959564801-ES5q). Official indexed text retrieved; direct UNECE page fetch returned 403. |
| P1143 deliverable | Business Requirements Specification, DPP Part 1: Overview and Fundamental Principles, Public Draft 1.0. The official announcement describes terminology, interoperability, data categories, circularity strategies and governance at several institutional levels. | Same announcement. The detailed draft itself was not obtained; preserve this limitation if citing substantive clauses. |
| UN Transparency Protocol (UNTP) | Technical interoperability specification developed through UN/CEFACT; practical implementation of Recommendation 49. | [About UNTP](https://untp.unece.org/docs/about/), opening and Recommendation 49 sections. |

Do not merge these nodes with ISO/IEC JTC 5 or infer that a UN recommendation makes UNTP legally compulsory. The UNTP references page calls the DPP BRS and an ISO project related deliverables; its ISO part title differs from the current ISO catalogue. Use ISO's own catalogue for the authoritative project number, title and stage. [UNTP related standards](https://untp.unece.org/docs/about/References/).

## UNTP maturity and implementation model

**Release evidence.** The canonical [versions page](https://untp.unece.org/versions/) lists **0.7.0 as maintained and suitable for pilots**, Work in Progress as testing, and 0.6.0 as unmaintained. It does not list a production 1.0 release. The current [DPP specification](https://untp.unece.org/docs/specification/product-passport/) labels its schemas 0.8.0 and describes the working schema as a candidate for 1.0.0. Report these as different states, not competing estimates of one released version. Older mirrors contain elapsed September release targets; an elapsed target is not proof of release. The original [GitHub repository](https://github.com/uncefact/spec-untp) was archived on 24 April 2026 and points to UNICC GitLab.

**Architecture.** UNTP specifies a decentralised exchange model without a central product-data store. It accommodates existing business systems, identifiers and different data carriers. Its architecture seeks independent adoption by supply-chain actors and supports confidentiality choices. These are design properties; they do not establish universal interoperability or coverage of every national requirement. [UNTP architecture](https://untp.unece.org/docs/specification/Architecture/), Overview and Principles.

**Evidence objects.** The technical suite distinguishes product passports, facility records, conformity credentials, traceability events, identity resolution and identity anchors. A corporate-record component is also present in the working documentation, with its scope still under review. This separation is useful when studying who asserts a product claim, who assesses it, and which site or company it concerns. [Technical specifications](https://untp.unece.org/docs/specification/), Credential Specifications.

**Product versus evidence.** The DPP working model distinguishes product information from its credential envelope. Claims can reference criteria, regulations and standards, and link to independent assessment evidence. Its model supports different identification granularities and links to lifecycle information. These are UNTP capabilities, not a substitute for the dataset required by a particular law. [DPP specification](https://untp.unece.org/docs/specification/product-passport/), Logical Model and Implementation Guidance.

**Identity versus authority.** A Digital Identity Anchor can link an issuer's digital identifier to an authoritative registration. The working specification describes a relationship to W3C Recognized Entities and distinguishes registration, scope and assurance. Both the UNTP profile and its W3C dependency require version tracking. [Digital Identity Anchor](https://untp.unece.org/docs/specification/DigitalIdentityAnchor/), Overview and Relationship to W3C Recognized Entities.

**Ecosystem evidence.** UNTP documentation describes registers for community activations, conformity schemes, identifier schemes and software implementers. These offer candidate sources for a later ecosystem inventory. A named example, listed participant or intended validation mechanism must not be treated as independently demonstrated production adoption or legal certification. [UNTP registers](https://untp.unece.org/docs/implementations/), four-register overview and governance description.

## W3C DPP and Business Wallet Task Force

The official name is **VC DPP & Business Wallet**, a task force of the **W3C Verifiable Credentials Working Group**, shortname `vc-dbw`. The official page lists Carolynn Bernier and Carsten Stöcker as facilitators, and Ivan Herman as staff contact. This is useful institutional metadata; it should not be confused with the separate legal procedure for European Business Wallets. [W3C task-force page](https://www.w3.org/groups/tf/vc-dbw/).

The VC Working Group charter runs from 11 March 2026 to 31 March 2028. Its **tentative deliverables** include DPP vocabularies and business-wallet vocabularies. It names CIRPASS-2 and UNTP DPP as inputs for product work, and WE BUILD and UNTP Digital Identity Anchor as inputs for wallet work. Adoption onto the Recommendation track is conditional; listing in a charter is not publication as a W3C Recommendation. [2026 VCWG charter](https://www.w3.org/2026/03/vc-wg-charter.html), Tentative Deliverables.

| Artifact | Status observed | Research relevance |
|---|---|---|
| [Task-force repository](https://w3c.github.io/vc-dpp-bw/) | Developing four documents with provisional titles | Product vocabulary, wallet vocabulary, vocabulary use cases and requirements, and DPP usage guidance. |
| [Vocabulary for digital product passport](https://w3c.github.io/vc-dpp-bw/dpp/index.html) | Page explicitly says unofficial proposal; retrieved content is a scaffold | Do not cite it as a completed normative product ontology. |
| [Vocabulary use cases and requirements](https://w3c.github.io/vc-dpp-bw/ucr/) | Work in progress, explicitly not formally reviewed or endorsed by the WG | Covers organisational identity, representation, authority, credential portability and supply-chain scenarios. Counts and categories are evolving; do not freeze their apparent totals without a commit snapshot. |
| [DPPs Secured by Verifiable Credentials](https://w3c.github.io/vc-dpp-bw/dpp-ucr/index.html) | Exploratory guidance | Investigates VC-based DPP implementation and the role of verifiable presentations. |
| [VC Data Model 2.0](https://www.w3.org/TR/2025/REC-vc-data-model-2.0-20250515/) | W3C Recommendation, 15 May 2025 | Established credential data-model foundation; not a DPP regulation or complete DPP dataset. |
| [Recognized Entities 1.0](https://www.w3.org/TR/2026/WD-vc-recognized-entities-1.0-20260906/) | Working Draft, 6 September 2026; status explicitly experimental and unsuitable for production deployment | Describes recognition of entities and actions, including product-conformity and cross-border-trade examples. |

The [7 October 2026 DPP meeting minutes](https://w3c.github.io/vc-wg/minutes/2026-10-07-dpp.html) demonstrate active discussion of business identity, conformity assessment, authority credentials and recognition scope. Meeting discussion is evidence of development activity, not consensus, a normative decision, or a reliable statement of the law governing accreditation.

A material boundary for the research: cryptographic verification does **not** establish factual truth or legal sufficiency. The VC Recommendation distinguishes checking credential integrity/authenticity and applicable status from validating its claims under a verifier's policies. [VC Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/), section 1.1 and definition of verification. Consequently, later graph work should preserve issuer identity, authority, evidence, assurance method and applicable legal criterion separately.

## WE BUILD and the wallet connection

The Commission identifies WE BUILD as a large-scale pilot focused on business and payment interactions. [Commission large-scale pilots overview](https://ec.europa.eu/digital-building-blocks/sites/pages/viewpage.action?navigatingVersions=true&pageId=920064578).

The consortium's D4.1 blueprint describes business, supply-chain and payment/banking use cases. Section 4.5 explicitly includes DPPs and backend-to-backend exchanges. It is a pilot architecture, and parts of its trust infrastructure are simulated or pre-production. This demonstrates an architectural connection between business identity and product information; it does not establish an enacted EU requirement to put every DPP in a business wallet. [WE BUILD architecture blueprint](https://webuild-consortium.github.io/wp4-architecture/blueprint/blueprint.html), sections 1.2, 4.4 and 4.5. See the separate EU legal evidence file for the status of the European Business Wallet proposal.

## Implications to retain for later scoping

These are research interpretations, not claims that the standards prescribe the eventual paper's graph:

- Model the **institution, project, specification, version, implementation and legal instrument** separately.
- Distinguish `usesAsInput`, `implements`, `profiles`, `alignsWith`, `testedWith` and `legallyRecognisedUnder`; these relationships require different evidence.
- Keep a regulatory landscape graph separate from product-level evidence graphs, while allowing explicit links between requirements, standards, data fields and evidence types.
- Represent identity, delegated authority, conformity-assessment competence and product claims as different facts.
- Geographic headquarters, pilot locations, legal applicability and supply-chain exposure are different map layers. UNTP and W3C have global scope and should not be coloured as domestic laws in their host countries.
- Preserve source date, access date, artifact version, claim status and uncertainty. Never advance a draft to final merely because a planned date has passed.

## Cross-border policy context and further geographic leads

OECD's October 2026 research on digital readiness examines interoperability, legal recognition, business confidentiality, data quality and the risk of increasing the burden on smaller or developing-country suppliers. It supports treating legal recognition and technical exchange as separate research dimensions. It is analytical evidence, not the authoritative source for individual DPP laws. [OECD, Digital readiness may enable efficient traceability at scale](https://www.oecd.org/en/publications/better-borders-for-trade-traceability-and-enforcement_b5dea5f5-en/full-report/digital-readiness-may-enable-efficient-traceability-at-scale_eaf0933a.html).

Türkiye's Ministry of Trade published information on the EU Registry launch on 1 September 2026 and maintains DPP preparation resources. This establishes official export-readiness activity, not enactment of a domestic passport mandate. [Ministry announcement](https://ticaret.gov.tr/dis-iliskiler/yesil-mutabakat/duyurular/dijital-urun-pasaportu-digital-product-passport-dpp-kayit-sisteminin-kullanima-acilmasina-iliskin-aciklama). Switzerland's KBOB issued a DPP foundations paper, version 1.01 dated 12 January 2026, explicitly presenting its assessment at publication. This is a construction-sector public-authority guidance lead; statutory applicability requires separate investigation. [KBOB paper](https://www.kbob.admin.ch/dam/de/sd-web/XtU2aKG2mRws/20250701_Grundlagenpapier%20DPP_V1.01_DES.pdf).
