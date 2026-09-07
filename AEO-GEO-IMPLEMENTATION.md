# Spherity Research AEO/GEO implementation

This document records the evidence-led answer-engine and generative-search
architecture, updated on 7 September 2026. It is an editorial and technical guide,
not a promise of rankings, snippets, AI citations, or inclusion in training
data.

## Audit decisions

| Area | Status before this change | Decision | Implementation |
| --- | --- | --- | --- |
| Canonicals, sitemap, robots, Open Graph, X cards, favicon | Complete | Keep | Existing layouts, config, and sitemap generation |
| Organization, WebSite, CollectionPage, ResearchProject, ItemList, ScholarlyArticle JSON-LD | Complete | Enforce | Separate top-level JSON-LD objects with stable IDs, citations, topics, images, authors, PDFs, and breadcrumbs in `docs/_layouts/default.html` |
| Publication authorship, dates, status, and references | Complete | Improve | Visible provenance retained and citation metadata added |
| Answer-first summaries and key findings | Inconsistent | Add | Data-driven blocks in `docs/_layouts/research-respec.html` |
| Direct questions and answers | Complete | Enforce | Visible, publication-supported answers and matching top-level FAQPage markup generated from the same data |
| Internal research relationships | Limited | Add | Contextual related-publication cards on every research page |
| PDF discoverability | PDF only | Add | Faithful HTML summaries for both control-plane and data-plane papers; PDFs remain authoritative |
| Trusted AI architecture | Control plane only | Expand | Interlink legal authority and verifiable evidence as separate, complementary trust planes |
| Quantum-resilient organizational identity | Attack analysis only | Expand | Add the distinct multi-author governance paper and relate it to the existing attack taxonomy without duplicate entries |
| PQC Corridor implementation | Limited homepage explanation | Add | Explain organizational authority, trust-fabric inventories, bounded corridor governance, migration controls, and evidence-led scaling |
| Machine-readable publication index | Complete | Enforce | Catalog- and page-generated `docs/llms.txt`; no ranking claim |
| Author identity | Complete for verified profiles | Enforce | Central `docs/_data/authors.yml` registry supplies author `url`, LinkedIn and ORCID identities; new template publications require reviewed profiles and valid ORCID check digits where supplied |
| Search-language research | Previously informal | Add | Version 2 template records Google Trends comparisons, authority terms, discovery terms, audience questions, evidence notes, and editorial decisions |
| Contributor safeguards | Complete | Enforce | Source, template, catalog, author, schema, citation, FAQ, heading, image, PDF, sitemap, and search-research checks |
| Social-preview consistency | Mixed legacy designs | Enforce | Shared research-grid generator, 1200 × 630 output, measured left-column safe-area preflight, a 60-pixel document gutter, catalog/page alignment, size checks, and a checksum-protected Gartner-approved exception |
| Topical discovery for DPP/DBP, data spaces, Trusted AI, resilience, and identity | Complete | Enforce | Homepage filters, research-scope sections, FAQ answers, publication relationships, catalog metadata, and authority keywords provide evidence-backed discovery without thin doorway pages |
| “Market leader” and similar superlatives | Unsupported | Defer | Require independent, citable evidence and author approval |
| Training-crawler permissions | Governance decision | Keep | No change without explicit approval |

## Site architecture

```text
/
├── research homepage and publication library
│   ├── WebSite, CollectionPage, ResearchProject, ItemList, and FAQPage data
│   └── publication cards generated from _data/publications.yml
├── *.html canonical research landing pages
│   ├── answer summary, key takeaways, visible questions, and related evidence
│   ├── ScholarlyArticle, BreadcrumbList, FAQPage, and author identity data
│   └── alternate PDF links and MediaObject data where applicable
├── *.pdf authoritative paper editions
├── llms.txt generated from the publication catalog and research pages
├── sitemap.xml generated from every indexable HTML and PDF output
└── robots.txt and .well-known/security.txt
```

Each research page links to the other publications only where the relationship
is explained. The homepage links to all canonical HTML research pages, and the
catalog remains the single source for publication discovery.

## Reusable publication and author architecture

New publications start from `templates/publication.md` version 2. The template
captures search and social titles, explicit authors and affiliations, verified
author identities, PDF editions, cover and social images, keywords, audiences,
spatial coverage, answer-first content, citations, direct questions, and related
research.

The validator records the existing pre-v2 paper filenames as a legacy baseline.
Any new research-page filename must declare template version 2, so copying an
older page cannot accidentally bypass the stronger checks.

Known author identities live in `docs/_data/authors.yml`. The shared layout uses
the registry consistently across every paper. Every new author must be added to
the registry with `identity_reviewed: true`; a paper may provide a verified
HTTPS `url` or `same_as` override for publication-specific identity context.
The build checks the rendered identity data rather than trusting source fields
alone.

The publication template does not automatically invent abstracts, FAQs,
keywords, identity links, citations, or market claims. Those remain editorial
decisions grounded in the publication and its authoritative sources.

## Google Trends and search-language research

The version 2 publishing workflow follows `SEO-AEO-GEO-RESEARCH.md`. It compares
exact search terms and recognized topics across suitable geographies, past
12-month and five-year periods, and Web or News search. The review distinguishes
specialist authority terms from familiar discovery language and records related
or rising queries only when they match the paper's scope.

Google Trends values are sampled and normalized, and specialist terms can fall
below the reporting threshold. A low or zero result therefore does not remove a
technically important authority term. The build validates the recorded review
and requires authority terms to reach the published `keywords`; it does not
query or scrape Google Trends during deployment. This keeps releases
deterministic and prevents changing data from silently rewriting approved copy.

## Entity and topic model

| Primary entity | Related authority or risk | Supported operational context |
| --- | --- | --- |
| Evidence graphs and Verifiable Linked Knowledge Graphs | Provenance; SHACL validation; issuer status; freshness; uncertainty | Traceable evidence paths for Industrial AI, supply chains, critical infrastructure, and B2G exchange |
| Asset Administration Shell and linked data | Heterogeneous industrial sources; semantic mapping; transformation lineage | AAS as source model and adapter within a wider evidence graph |
| Quantum-resilient organizational identity | Public-key trust-fabric risk; cryptographic agility; long evidence horizons | Legal existence, representation, delegated mandates, business wallets, and accountable automated actors |
| PQC Corridors | Network-effect bottleneck; downgrade risk; trust-anchor and lifecycle dependencies | Bounded migration of B2B, B2G, G2G, M2M, supply-chain, critical-infrastructure, and agent-to-agent trust |
| European Business Wallet and legal-person identity | Current European Commission EBW proposal; eIDAS 2.0 trust framework | Cross-company identity, mandates, authorization, and evidence |
| AI-agent identity and delegated authority | Zero Trust Architecture; revocation; policy enforcement | Accountable regulated agent actions |
| Post-quantum identity and crypto-agility | NIST post-quantum standards; Harvest Now, Decrypt Later risk | Migration of wallets, credentials, and trust infrastructure |
| AI, cyber, quantum, hybrid, and physical threats | German and European resilience requirements | Escalation analysis and operational readiness |

The implementation treats the two Trusted AI research planes as complementary:
the data plane establishes the provenance and fitness of supporting evidence,
while the control plane establishes legal-person identity and bounded authority
for an action. Neither plane proves the other. The implementation also does not
imply that the EBW proposal is adopted law or that wallet infrastructure
replaces runtime security, model assurance, human oversight, or incident
response.

## Editorial and contributor rules

- State the primary answer near the beginning and preserve the paper’s caveats.
- Use three or more traceable takeaways and at least two defensible direct
  questions for substantial HTML research pages.
- Expand acronyms on first use and use canonical terminology consistently.
- Prefer primary sources for law, regulation, standards, and specifications.
- Distinguish adopted law, proposals, standards, research conclusions,
  capabilities, and recommendations.
- Do not publish customer, deployment, certification, leadership, or regulatory
  claims without approved evidence.
- Use a canonical HTML landing page for a PDF when a concise faithful summary
  adds discovery value; never represent the landing page as the full paper.

## Measurement after deployment

Use Google Search Console to monitor indexed canonical pages, sitemap processing,
queries, impressions, clicks, countries, devices, and rich-result or indexing
issues. Compare publication-level trends over at least 8–12 weeks rather than
interpreting short-term volatility.

Where analytics lawfully captures referrers, segment visits from AI-search and
answer-engine domains, then measure engaged sessions, PDF downloads, citations,
and qualified follow-on actions. Treat referrer data as incomplete because many
AI clients suppress or rewrite referral information.
