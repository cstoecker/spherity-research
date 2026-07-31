# Spherity Research AEO/GEO implementation

This document records the evidence-led answer-engine and generative-search
architecture applied on 30 July 2026. It is an editorial and technical guide,
not a promise of rankings, snippets, AI citations, or inclusion in training
data.

## Audit decisions

| Area | Status before this change | Decision | Implementation |
| --- | --- | --- | --- |
| Canonicals, sitemap, robots, Open Graph, X cards, favicon | Complete | Keep | Existing layouts, config, and sitemap generation |
| Organization, WebSite, CollectionPage, ScholarlyArticle JSON-LD | Complete | Improve | One connected graph with stable IDs, citations, topics, images, authors, and breadcrumbs in `docs/_layouts/default.html` |
| Publication authorship, dates, status, and references | Complete | Improve | Visible provenance retained and citation metadata added |
| Answer-first summaries and key findings | Inconsistent | Add | Data-driven blocks in `docs/_layouts/research-respec.html` |
| Direct questions and answers | Missing | Add | Visible, publication-supported answers; no FAQPage markup |
| Internal research relationships | Limited | Add | Contextual related-publication cards on every research page |
| PDF discoverability | PDF only | Add | Faithful HTML summaries for both control-plane and data-plane papers; PDFs remain authoritative |
| Trusted AI architecture | Control plane only | Expand | Interlink legal authority and verifiable evidence as separate, complementary trust planes |
| Quantum-resilient organizational identity | Attack analysis only | Expand | Add the distinct multi-author governance paper and relate it to the existing attack taxonomy without duplicate entries |
| PQC Corridor implementation | Limited homepage explanation | Add | Explain organizational authority, trust-fabric inventories, bounded corridor governance, migration controls, and evidence-led scaling |
| Machine-readable publication index | Missing | Add | Catalog-generated `docs/llms.txt`; no ranking claim |
| Contributor safeguards | Good baseline | Improve | Source, catalog, schema, citation, heading, image, sitemap, and answer-content checks |
| Topic hubs for DPP/DBP, DSCSA, data spaces, and sector pages | Insufficient source material | Defer | Add only after approved original research supports a substantial page |
| “Market leader” and similar superlatives | Unsupported | Defer | Require independent, citable evidence and author approval |
| Training-crawler permissions | Governance decision | Keep | No change without explicit approval |

## Site architecture

```text
/
├── research homepage and publication library
├── evidence-graphs-industrial-ai-data-plane.html
│   └── authoritative 33-page PDF
├── ebw-zero-trust-ai-agents.html
│   └── authoritative 30-page PDF
├── quantum-resilient-organizational-identity.html
│   └── authoritative 26-page PDF
├── ebw-roadmap.html
├── Securing-Digital-Identity-Quantum-Vulnerabilities.html
├── threat-escalation-model-germany-eu.html
│   └── interactive threat-model visual
├── llms.txt
├── sitemap.xml
└── robots.txt
```

Each research page links to the other publications only where the relationship
is explained. The homepage links to all canonical HTML research pages, and the
catalog remains the single source for publication discovery.

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
