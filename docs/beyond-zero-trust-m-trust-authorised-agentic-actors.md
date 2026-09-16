---
publication_template_version: 2
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "Beyond Single-Enterprise ZTA: Multi-Trust Architectures for Authorised Agentic Actors in Open, Cross-Domain Ecosystems"
seo_title: "Beyond Zero Trust: M-Trust for Authorised AI Agents"
og_title: "Beyond Zero Trust: M-Trust and Verifiable Authority for AI Agents"
og_description: "A cross-domain architecture for AI agent security that connects M-Trust, Business Wallets, verifiable authority, policy enforcement and action evidence."
subtitle: "Extending Zero Trust with M-Trust, Business Wallets and verifiable authority for cross-domain agentic networks"
description: "A cross-domain architecture for AI agent security that extends Zero Trust with M-Trust, Business Wallets, verifiable authority and signed action evidence."

paper_status: "Spherity Research Paper"
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

date: "2026-09-16"
last_modified_at: "2026-09-16"
research_cutoff: "2026-09-16"
research_cutoff_label: "Sources, standards and market developments reviewed to this date"
lang: "en"
secondary_language: "zh-Hans"
abstract_zh: >-
  AI 智能体能够选择工具、交换数据、发起交易，并在单一企业边界之外协同运行。NIST 零信任架构为资源与会话安全提供了必要基础，但其本身并不能证明企业智能体背后的法人实体、完整的授权委托链、AI 服务的当前状态，或跨域决策所依据的证据。本文对 GSMA 大中华区《面向未来智能体网络的信任范式演进（征求意见稿）》的中英文版本进行定性架构分析和标准差距分析，将 M-Trust 视为仍在讨论中的研究方向，而非强制性标准，并分析其三个维度：多方信任、基于智能体意图感知的信任和跨域信任。本文进一步提出，如何将企业数字钱包、法人身份、任务范围受限的智能体授权委托、AI 服务护照、W3C 可验证凭证、去中心化标识符、由验证方自主执行的策略、签名行动回执以及后量子迁移机制结合起来，使 B2B 和 B2G 智能体行动可归责、可验证且可审计。研究最终提出一种“临时跨域信任”参考架构：来源域继续治理其声明与凭证；依赖方（验证方）则针对特定目的、受众和时间窗口，组合最新的身份、授权、证据与上下文，并依据本地策略作出和执行授权决策。

permalink: /beyond-zero-trust-m-trust-authorised-agentic-actors.html
canonical_url: "https://spherity.github.io/spherity-research/beyond-zero-trust-m-trust-authorised-agentic-actors.html"
latest_version: "https://spherity.github.io/spherity-research/beyond-zero-trust-m-trust-authorised-agentic-actors.html"

pdf_url: "/Spherity-Beyond-Single-Enterprise-ZTA-Multi-Trust-Architectures-for-Authorised-Agentic-Actors.pdf"
associated_media:
  - name: "Beyond Single-Enterprise ZTA — Full Research PDF"
    url: "/Spherity-Beyond-Single-Enterprise-ZTA-Multi-Trust-Architectures-for-Authorised-Agentic-Actors.pdf"
    license: "https://creativecommons.org/licenses/by/4.0/"
cover_image: "/assets/beyond-zero-trust-m-trust-agentic-ai-cover.jpg"
cover_image_alt: "First page of Beyond Single-Enterprise ZTA by Dr. Carsten Stöcker, on M-Trust and verifiable authority for agentic actors."

figure_objects:
  - id: "zero-trust-m-trust-verifiable-authority"
    name: "Progression from Zero Trust through M-Trust to verifiable authority for B2B agentic networks"
    content_url: "/assets/beyond-zero-trust-m-trust-verifiable-authority.svg"
    alt: "Architecture progression from a Zero Trust foundation through M-Trust's multi-party, intent-aware and cross-domain dimensions to Business Wallet identity, agent delegation, AI service evidence, policy enforcement and signed receipts."
    width: 1800
    height: 1120
    description: "A Spherity reference architecture showing how Zero Trust, M-Trust and verifiable authority combine in a continuous collection, decision, enforcement and runtime-feedback loop for authorised enterprise AI agents."
    caption: "Progression from Zero Trust through M-Trust to verifiable authority for B2B use cases. Zero Trust supplies identity-centric security, least privilege, continuous verification and dynamic risk control. M-Trust adds multi-party, agentic intent-aware and cross-domain trust. The verifiable-authority layer adds Business Wallet and legal-person identity, Agent Wallet and Power of Attorney, AI Service Passport evidence, local policy enforcement and signed action receipts. Source: Author’s synthesis based on NIST SP 800-207, the GSMA Greater China M-Trust draft and Spherity research."
    credit_text: "Dr. Carsten Stöcker / Spherity GmbH"
    creator_name: "Dr. Carsten Stöcker"
    creator_type: "Person"
    creator_url: "https://spherity.github.io/spherity-research/#dr-carsten-stoecker"
    copyright_notice: "© 2026 Dr. Carsten Stöcker, Spherity GmbH"
    license: "https://creativecommons.org/licenses/by/4.0/"
    keywords:
      - "Zero Trust for AI agents"
      - "M-Trust architecture"
      - "Verifiable authority"
      - "AI agent security"
      - "Business Wallet"
      - "Cross-domain trust"
      - "Agentic AI authorization"

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"
license_scope: "This open research publication package—including the research page, linked PDF and Spherity reference figure—"

image: "/assets/preview-beyond-zero-trust-m-trust-agentic-ai.webp"
image_alt: "Beyond Single-Enterprise Zero Trust research preview on M-Trust and verifiable authority for authorised AI agents."
image_mime: "image/webp"
image_width: 1200
image_height: 630

answer_summary: "Single-enterprise Zero Trust is necessary but insufficient when AI agents act across organizations, sectors and jurisdictions. The paper connects M-Trust’s multi-party, intent-aware and cross-domain model with Business Wallets, legal-person identity, task-bounded delegation, verifiable AI evidence, local policy enforcement and signed action receipts."
key_takeaways:
  - "Zero Trust protects enterprise resources and sessions; cross-domain agentic action additionally requires portable evidence of the accountable person, mandate, AI service, context and policy decision."
  - "B2C and B2B share a bounded-delegation pattern, but enterprise transactions require legal-person identity, representative authority, organizational approval rules and a complete delegation chain."
  - "M-Trust contributes multi-party evaluation, agentic intent-aware trust and cross-domain trust; Spherity’s proposed layer adds the legal and evidentiary semantics needed for attributable action."
  - "A verifier creates transient trust for one purpose, audience and time window; source domains retain authority over their claims and the relying domain retains the authorization decision."
about:
  - "Zero Trust Architecture"
  - "M-Trust"
  - "AI agent security"
  - "Verifiable authority"
  - "Authorised agentic actors"
  - "Cross-domain trust"
  - "Business Wallets"
mentions:
  - "NIST SP 800-207"
  - "GSMA Greater China"
  - "Agentic AI"
  - "B2C agentic commerce"
  - "B2B and B2G AI agents"
  - "Legal-person identity"
  - "Agent Power of Attorney"
  - "AI Service Passport"
  - "Verifiable Credentials"
  - "Decentralized Identifiers"
  - "Data Spaces"
  - "Manufacturing-X"
  - "Digital Product Passports"
  - "Trusted AI"
  - "Post-quantum cryptography"
citations:
  - "https://csrc.nist.gov/pubs/sp/800/207/final"
  - "https://www.gsma.com/about-us/regions/greater-china/gsma_resources/trust-paradigm-evolution-for-agentic-networks%EF%BC%88draft-for-comments%EF%BC%89/"
  - "https://www.bruegel.org/analysis/chinas-artificial-intelligence-goals-and-strategic-choices-europe"
  - "https://www.gsma.com/solutions-and-impact/technologies/networks/gsma_resources/the-value-of-mobile-ai-whitepaper/"
  - "https://claude.com/blog/zero-trust-for-ai-agents"
  - "https://www.webuildconsortium.eu/trusted-identities-for-ai-agents-an-opportunity-for-europe"
  - "https://www.plattform-i40.de/IP/Redaktion/EN/Standardartikel/ManufacturingX_Framework.html"
  - "https://www.gleif.org/organizational-identity/research-publications/2026-08-13_agentic_ai_in_payments_v1.0-1.pdf"
  - "https://www.w3.org/TR/did-core/"
  - "https://www.w3.org/TR/vc-data-model-2.0/"
audiences:
  - "Enterprise security, identity and AI-governance leaders"
  - "Data-space, DPP and industrial ecosystem architects"
  - "Telecommunications, payments and critical-infrastructure decision makers"
  - "Policy makers, standards bodies and applied researchers"
spatial_coverage:
  - "European Union"
  - "China"
  - "United States"
  - "Worldwide"

search_research:
  reviewed_on: "2026-09-16"
  source: "Google Trends"
  source_url: "https://trends.google.com/trends/explore"
  geographies:
    - "Worldwide"
    - "Germany"
  time_ranges:
    - "Past 12 months"
    - "Past 5 years"
  search_types:
    - "Web Search"
  authority_terms:
    - "M-Trust architecture"
    - "Verifiable authority"
    - "Authorised agentic actors"
  discovery_terms:
    - "AI agents"
    - "AI agent security"
    - "Agentic AI"
    - "Zero Trust"
    - "Business Wallet"
    - "Data spaces"
  audience_questions:
    - "How should Zero Trust Architecture extend when AI agents act across organizations?"
    - "How can an enterprise prove which legal person and mandate stand behind an AI agent action?"
    - "What are the three M-Trust dimensions and how do they apply to B2B agentic networks?"
  evidence:
    - comparison: "Agentic AI, AI agents, zero trust, zero trust AI and M-Trust"
      input_type: "Search terms"
      geography: "Worldwide"
      time_range: "Past 12 months and past 5 years"
      search_type: "Web Search"
      result: "AI agents showed the strongest relative interest, followed by agentic AI; zero trust remained an established adjacent term. M-Trust did not have sufficient reported data, so it is retained as a precise authority term rather than used as the primary discovery phrase."
    - comparison: "AI agent security, agentic AI security, AI agent identity, AI agent authorization and verifiable authority"
      input_type: "Search terms"
      geography: "Worldwide"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "AI agent security produced the clearest discovery signal, while AI agent identity and authorization were smaller. Verifiable authority was below the reporting threshold but remains central to the paper’s contribution."
    - comparison: "Agentic AI, AI agents, zero trust, AI agent security and M-Trust"
      input_type: "Search terms"
      geography: "Germany"
      time_range: "Past 12 months"
      search_type: "Web Search"
      result: "AI agents led the comparison in Germany, followed by agentic AI; zero trust remained visible, while the specialist terms AI agent security and M-Trust had limited or insufficient data."
  editorial_decisions:
    - "Lead metadata with Zero Trust, AI agents and AI agent security because they have recognizable search demand and accurately frame the paper’s security problem."
    - "Retain M-Trust, verifiable authority and authorised agentic actors as specialist authority terms even where Google Trends reports insufficient volume."
    - "Use Business Wallets, data spaces, Digital Product Passports and Trusted AI as implementation contexts, not as substitutes for the paper’s core cross-domain authorization thesis."
    - "Treat Google Trends as a normalized editorial signal, not as absolute search volume or evidence of market size."

questions_answered:
  - question: "Why is single-enterprise Zero Trust insufficient for cross-domain AI agents?"
    answer: "Zero Trust can verify a subject, device and request before access to an enterprise resource. A cross-domain AI agent also requires portable evidence of the accountable natural or legal person, the delegation chain, task scope, AI-service state, source-domain claims and the policy decision that permits the action."
  - question: "What are the three M-Trust dimensions?"
    answer: "Multi-party trust combines several evaluators and trust inputs. Agentic intent-aware trust evaluates purpose, context, risk and task scope. Cross-domain trust carries portable evidence across heterogeneous trust roots while each verifier applies its own policy."
  - question: "How do B2C and B2B agent authorization differ?"
    answer: "A B2C chain links a natural person’s authenticated instruction to an agent, transaction and receipt. B2B and B2G additionally require legal-person identity, representative authority, organizational approval rules, governed credentials and a complete task-bounded delegation chain."
  - question: "What is verifiable authority for an enterprise AI agent?"
    answer: "It is evidence that links the agent or workload to an accountable legal person, an authorized representative, a current mandate, explicit limits, applicable organizational policy and the resulting action receipt. It complements technical agent identity rather than replacing it."
  - question: "How does the architecture apply to data spaces, DPPs and Trusted AI?"
    answer: "A Business Wallet supplies organizational identity and mandates; Agent Wallets and credentials establish bounded agency; DPP, DBP and data-space evidence supports the requested decision; an AI Service Passport and runtime evidence describe the deployed AI service; local policy and enforcement remain verifier-sovereign."
  - question: "Which architecture patterns converge across GSMA M-Trust, WE BUILD, Manufacturing-X, Anthropic and Spherity for enterprise agent identity and B2B use cases?"
    answer: "They converge on a recurring pattern: strong agent or workload identity; task-scoped and context-aware authorization; independently verifiable evidence; enforcement outside the model's reasoning; continuous status and risk evaluation; and auditable outcomes. GSMA M-Trust frames multi-party, intent-aware and cross-domain trust; Anthropic emphasizes enterprise agent security controls; WE BUILD contributes wallet-based trusted identity, mandates and provable intent; Manufacturing-X contributes federated industrial governance, connectors and data-sovereignty controls; and Spherity connects these layers to legal-person identity, Business and Agent Wallets, task-bounded Powers of Attorney, AI Service Passports, evidence graphs, verifier-sovereign policy and signed action receipts. This is architectural convergence, not a claim of formal standards alignment, endorsement or demonstrated interoperability."
  - question: "Is M-Trust already a standard?"
    answer: "No. The reviewed GSMA Greater China publication is a draft reference architecture and research direction. This paper evaluates it, identifies standards gaps and proposes an aligned Spherity architecture; it does not claim that M-Trust is a mandatory standard or established regional consensus."
questions_answered_zh:
  - question: "为什么单一企业零信任架构不足以支持跨域 AI 智能体？"
    answer: "零信任可以在访问企业资源之前验证主体、设备和请求。跨域 AI 智能体还需要提供可移植证据，以证明应承担责任的自然人或法人、完整的授权委托链、任务范围、AI 服务状态、来源域声明，以及允许该行动的策略决策。"
  - question: "M-Trust 的三个信任维度是什么？"
    answer: "多方信任结合多个评估方、信任输入、背书和风险信号。基于智能体意图感知的信任根据任务目的、上下文、风险和范围进行授权。跨域信任则在异构信任根之间传递可移植证据，同时由每个验证方依据自身策略作出决定。"
  - question: "B2C 与 B2B 智能体授权有何不同？"
    answer: "B2C 授权链将自然人的已认证指令与智能体、交易和回执连接起来。B2B 和 B2G 还需要法人身份、代表权限、组织内部审批规则、受治理的角色凭证，以及完整且受任务范围约束的授权委托链。"
  - question: "企业 AI 智能体的“可验证授权”是什么？"
    answer: "可验证授权是一组可独立验证的证据，用于将智能体或工作负载与承担责任的法人、获授权代表、当前有效的授权委托、明确限制、适用的组织策略以及最终行动回执连接起来。它补充技术性智能体身份，而不是取代技术性身份。"
  - question: "该架构如何应用于数据空间、数字产品护照和可信人工智能？"
    answer: "企业数字钱包提供组织身份和授权委托；智能体钱包与凭证建立受限的行动权限；数字产品护照、数字电池护照和数据空间证据支持具体决策；AI 服务护照与运行时证据描述所部署 AI 服务的当前状态；最终授权与策略执行仍由依赖方（验证方）自主控制。"
  - question: "GSMA M-Trust、WE BUILD、Manufacturing-X、Anthropic 和 Spherity 在企业智能体身份及 B2B 用例方面汇聚出哪些架构模式？"
    answer: "这些工作汇聚出一组反复出现的架构模式：强智能体或工作负载身份；任务范围受限且上下文感知的授权；可独立验证的证据；位于模型推理之外的策略执行；持续的状态与风险评估；以及可审计的结果。GSMA M-Trust 描述多方、意图感知和跨域信任；Anthropic 强调企业智能体安全控制；WE BUILD 提供基于钱包的可信身份、授权委托和可证明意图；Manufacturing-X 提供联邦式工业治理、连接器和数据主权控制；Spherity 则把这些层与法人身份、企业钱包和智能体钱包、任务范围受限的授权委托、AI 服务护照、证据图谱、验证方自主策略及签名行动回执连接起来。这种关系表示架构模式的趋同，并不表示正式标准已对齐、相关机构相互背书或系统已经实现互操作。"
  - question: "M-Trust 已经是正式标准吗？"
    answer: "不是。本文审阅的 GSMA 大中华区材料是一份征求意见稿、参考架构和研究方向。本文对其进行评估、识别标准差距并提出与之相关的 Spherity 架构，但不声称 M-Trust 已成为强制性标准，也不声称它代表已经形成的区域共识。"
faq_schema: true
related_publications:
  - title: "European Business Wallets as the Legal Control Plane for Zero Trust AI Agents"
    url: "/ebw-zero-trust-ai-agents.html"
    context: "Develops the legal-person identity, delegated-authority and policy-bound action layer used in this paper’s B2B architecture."
  - title: "From Trustworthy AI to Trusted, Operational Agentic Systems"
    url: "/trusted-agentic-ai-china-eu-us-comparative-analysis.html"
    context: "Compares deployment capability across China, Europe and the United States and develops the AI Service Passport, runtime evidence and action-receipt model."
  - title: "Evidence Graphs for Industrial AI"
    url: "/evidence-graphs-industrial-ai-data-plane.html"
    context: "Explains the verifiable evidence-graph data plane that complements the authority control plane."
  - title: "Verifiable, Access-Controlled Digital Product Passports"
    url: "/verifiable-access-controlled-digital-product-passports.html"
    context: "Applies organizational authority and product-linked evidence to DPP and DBP transactions."

toc_items:
  - title: "Download the paper"
    href: "#download-the-paper"
  - title: "Abstract"
    href: "#abstract"
  - title: "中文摘要"
    href: "#abstract-zh"
  - title: "Beyond single-enterprise ZTA"
    href: "#beyond-single-enterprise-zta"
  - title: "B2C and B2B authority"
    href: "#b2c-and-b2b"
  - title: "M-Trust dimensions"
    href: "#m-trust-dimensions"
  - title: "Use cases"
    href: "#use-cases"
  - title: "Comparative results"
    href: "#comparative-results"
  - title: "Standards and trust chains"
    href: "#standards-and-trust-chains"
  - title: "Wallets and authority"
    href: "#wallets-and-authority"
  - title: "Data spaces, DPP and Trusted AI"
    href: "#applications"
  - title: "Reference architecture"
    href: "#reference-architecture"
  - title: "Sources and boundaries"
    href: "#sources-and-boundaries"
  - title: "References"
    href: "#references"
  - title: "License and citation"
    href: "#license-and-citation"
  - title: "Questions answered"
    href: "#questions-answered"
  - title: "中文常见问题"
    href: "#questions-answered-zh"

tags:
  - zero-trust
  - m-trust
  - ai-agent-security
  - agentic-ai
  - digital-identity
  - business-wallet
  - verifiable-authority
  - verifiable-credentials
  - data-spaces
  - digital-product-passports
  - trusted-ai
  - post-quantum-cryptography
keywords:
  - "M-Trust architecture"
  - "Verifiable authority"
  - "Authorised agentic actors"
  - "Beyond Zero Trust"
  - "Beyond Single-Enterprise ZTA"
  - "Zero Trust Architecture"
  - "Zero Trust for AI agents"
  - "AI agent security"
  - "Agentic AI security"
  - "AI agents"
  - "Agentic AI"
  - "Multi-Trust Architecture"
  - "Multi-party trust"
  - "Agentic Intent-aware trust"
  - "Cross-domain trust"
  - "Verifiable Trust Chain"
  - "Business Wallet"
  - "European Business Wallet"
  - "Organizational Identity"
  - "Organisational Identity"
  - "Legal-person identity"
  - "Agent Power of Attorney"
  - "AI Service Passport"
  - "AISP"
  - "Verifiable Credentials"
  - "Decentralized Identifiers"
  - "W3C DID"
  - "W3C VC 2.0"
  - "Policy Decision Point"
  - "Policy Enforcement Point"
  - "Signed Action Receipt"
  - "Transient Cross-Domain Trust"
  - "B2C agentic commerce"
  - "B2B AI agents"
  - "B2G AI agents"
  - "Data Spaces"
  - "Manufacturing-X"
  - "Digital Product Passport"
  - "DPP"
  - "Trusted AI"
  - "Post-quantum cryptography"
  - "PQC"
  - "GSMA Greater China"
  - "NIST SP 800-207"
  - "Carsten Stöcker"
  - "Spherity GmbH"
  - "AI 智能体安全"
  - "AI Agent 安全"
  - "零信任架构"
  - "面向 AI 智能体的零信任"
  - "M-Trust 多元信任架构"
  - "多方信任"
  - "基于智能体意图感知的信任"
  - "跨域信任"
  - "企业智能体身份"
  - "B2B AI 智能体"
  - "可验证授权"
  - "企业数字钱包"
  - "法人身份"
  - "智能体授权委托"
  - "AI 服务护照"
  - "可验证凭证"
  - "去中心化标识符"
  - "数据空间"
  - "数字产品护照"
  - "可信人工智能"
---

<section class="paper-download-grid" id="download-the-paper" aria-labelledby="download-the-paper-title">
  <div class="paper-download">
    <h2 id="download-the-paper-title">Download the full research paper</h2>
    <a href="{{ page.pdf_url | relative_url }}">Download the PDF</a>
    <p><strong>44 pages · open access · CC BY 4.0.</strong> The complete architecture, standards-gap analysis, B2C and B2B comparison, use cases, geopolitical discussion and implementation roadmap.</p>
  </div>
  <div class="paper-download">
    <h2>Read the reference architecture</h2>
    <a href="#reference-architecture">Go to the eight-layer architecture</a>
    <p>A concise path from legal-person identity and task-bounded delegation to verifier policy, controlled action and signed accountability evidence.</p>
  </div>
</section>

<figure class="paper-figure centered-figure">
  <a href="{{ page.pdf_url | relative_url }}" aria-label="Open the full Beyond Single-Enterprise ZTA research paper PDF">
    <img src="{{ page.cover_image | relative_url }}"
         alt="{{ page.cover_image_alt }}"
         width="1241"
         height="1754">
  </a>
  <figcaption><strong>Open-access research paper.</strong> An architectural and geopolitical analysis of the GSMA Greater China M-Trust draft, with a Spherity reference architecture for verifiable cross-domain agent actions. Published under CC BY 4.0.</figcaption>
</figure>

<section class="abstract-box" markdown="1">
<h2 id="abstract">Abstract</h2>

AI agents can select tools, exchange data, initiate transactions and coordinate beyond a single enterprise. NIST Zero Trust Architecture provides the essential resource and session security foundation, but it does not by itself establish the legal person behind an enterprise agent, the complete delegation chain, the current state of the AI service or the cross-domain evidence used in a decision.

This paper applies a qualitative architecture and standards-gap analysis to the English- and Chinese-language drafts of GSMA Greater China’s <em>Trust Paradigm Evolution for Agentic Networks</em>. It treats M-Trust as a draft research direction—not a mandatory standard—and evaluates its three dimensions: Multi-party trust, Agentic Intent-aware trust and Cross-domain trust. It then proposes how Business Wallets, legal-person identity, Agent Powers of Attorney, AI Service Passports, W3C Verifiable Credentials, Decentralized Identifiers, verifier-sovereign policy, signed action receipts and post-quantum migration can turn that model into attributable B2B and B2G action.

The result is a reference architecture for **transient cross-domain trust**: source domains retain governance over their claims, while the relying verifier composes current identity, authority, evidence and context for one purpose, audience and time window.

<p class="keywords"><strong>Keywords:</strong> Zero Trust for AI agents; M-Trust; AI agent security; verifiable authority; Business Wallets; legal-person identity; cross-domain trust; agentic AI; data spaces; Digital Product Passports; Trusted AI</p>
</section>

<section class="abstract-box translated-abstract" lang="zh-Hans" aria-labelledby="abstract-zh" markdown="1">
<h2 id="abstract-zh">中文摘要</h2>

**中文标题：** 超越单一企业零信任架构：面向开放跨域生态系统中授权智能体的多元信任架构

AI 智能体能够选择工具、交换数据、发起交易，并在单一企业边界之外协同运行。NIST 零信任架构为资源与会话安全提供了必要基础，但其本身并不能证明企业智能体背后的法人实体、完整的授权委托链、AI 服务的当前状态，或跨域决策所依据的证据。

本文对 GSMA 大中华区《面向未来智能体网络的信任范式演进（征求意见稿）》的中英文版本进行定性架构分析和标准差距分析。本文将 M-Trust 视为仍在讨论中的研究方向，而非强制性标准，并分析其三个维度：**多方信任**、**基于智能体意图感知的信任**和**跨域信任**。本文进一步提出，如何将企业数字钱包、法人身份、任务范围受限的智能体授权委托、AI 服务护照、W3C 可验证凭证、去中心化标识符、由验证方自主执行的策略、签名行动回执以及后量子迁移机制结合起来，使 B2B 和 B2G 智能体行动可归责、可验证且可审计。

研究最终提出一种**临时跨域信任**参考架构：来源域继续治理其声明与凭证；依赖方（验证方）则针对特定目的、受众和时间窗口，组合最新的身份、授权、证据与上下文，并依据本地策略作出和执行授权决策。

<p class="keywords"><strong>中文关键词：</strong> AI 智能体安全；AI Agent 安全；零信任架构；面向 AI 智能体的零信任；M-Trust 多元信任架构；多方信任；基于智能体意图感知的信任；跨域信任；企业智能体身份；B2B AI 智能体；可验证授权；企业数字钱包；法人身份；智能体授权委托；AI 服务护照；可验证凭证；去中心化标识符；数据空间；数字产品护照；可信人工智能</p>
</section>

<h2 id="beyond-single-enterprise-zta">Beyond single-enterprise Zero Trust Architecture</h2>

[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) moves security away from implicit trust based on network location and focuses authorization on users, devices, assets and resources. That remains the foundation: every request must be evaluated, least privilege enforced and runtime state monitored.

The problem changes when an agent crosses organizational boundaries. A relying party may recognize the agent’s workload identity and still lack answers to the questions that determine accountable action:

- Which natural or legal person is responsible?
- Who delegated authority, through which representation chain?
- What purpose, value limit, tools, data and time window does the mandate cover?
- Which version and assurance state of the AI service is acting?
- Which source-domain credentials and evidence are current?
- Which local policy allowed execution, and what receipt preserves the decision?

The paper’s central proposition is therefore:

<p class="decision-expression"><strong>Trusted agentic execution requires verifiable authority + verifiable evidence + local policy enforcement + bounded autonomy.</strong></p>

This is not a replacement for Zero Trust. It is a cross-domain extension that carries attributable authority and evidence into the resource decision.

<h2 id="b2c-and-b2b">B2C and B2B authority: a shared pattern with different legal roots</h2>

Consumer agents and enterprise agents both need scoped delegation, but they do not present equivalent identity or governance evidence.

| Branch | Accountable principal | Evidence chain | Additional decision requirements |
| --- | --- | --- | --- |
| **B2C agentic commerce** | A natural person | Natural person → authenticated wallet or account → scoped intent or delegation → agent → cart or payment action → receipt | User authentication, agent identity, freshness and scope of the instruction, transaction-specific confirmation, status and consumer/payment rules. |
| **B2B/B2G agentic action** | A legal person | Legal person → authorised representative or governed system → organizational approval → task-bounded mandate → agent or workload → controlled action → signed receipt | Company identity, representation authority, internal approval policy, governed role credentials, complete delegation chain, AI-service evidence and local verifier policy. |

Google AP2, Mastercard Verifiable Intent, Visa Trusted Agent Protocol, Amazon Buy for Me and Apple App Intents/StoreKit illustrate different B2C mechanisms. They do not form one uniform protocol or legal regime. The paper uses **verifiable intent** as an analytical category for evidence that links a person’s instruction to an agent and resulting action; applicable law determines legal effect.

For B2B and B2G, a technical agent identity proves which workload controls a key. It does not prove which company stands behind the workload or whether the company authorized this action. That gap motivates reusable organizational identity, representation and mandate credentials.

<h2 id="m-trust-dimensions">The three M-Trust dimensions—and how Spherity operationalises them</h2>

The GSMA Greater China draft proposes M-Trust as an extension of Zero Trust for autonomous, multi-party and cross-domain environments. Its contribution is a systems model, while the Spherity research asks which legal, credential, wallet, registry and evidence components are needed for cross-company execution.

| M-Trust dimension | Core idea | Example | Spherity-aligned implementation |
| --- | --- | --- | --- |
| **Multi-party trust** | Several evaluators, trust inputs, endorsements and risk signals contribute to the decision. | A data-space transaction depends on company-register identity, sector role, conformity evidence and counterparty risk. | Authoritative issuers, trust lists and registries, verifiable data registries, multi-issuer credential presentations and evidence graphs. |
| **Agentic Intent-aware trust** | Purpose, task, context, requested resource, risk and execution state constrain authorization. | An energy agent may read one dataset for balancing a named asset but may not change another operator’s control settings. | A task-bounded Power of Attorney, declared purpose, tool and value limits, AI Service Passport state, runtime context, policy decision point and enforcement point. |
| **Cross-domain trust** | Portable evidence crosses heterogeneous roots of trust without forcing one universal hierarchy. | A manufacturer presents company identity, market role and product evidence to an independently governed customer or regulator. | Business and Agent Wallets, W3C Verifiable Credentials and presentations, DIDs, credential status, semantic profiles and verifier-sovereign policy. |

{% assign m_trust_reference_figure = page.figure_objects | first %}
{% include research-figure.html figure=m_trust_reference_figure number=1 %}

The lower loop in Figure 1 is continuous: collect and evaluate identity, authority, evidence and risk; compute effective scope under local policy; enforce the bounded action outside the agent’s own reasoning; and feed back status, drift, incidents and outcomes. New threat intelligence, a revoked credential, an updated model risk profile or a runtime anomaly can therefore change the decision state during a task.

<h2 id="use-cases">Use cases for authorised agentic actors</h2>

The paper tests the architecture across telecom, commerce, industrial and regulated-data contexts.

1. **Cross-domain telecom resources.** An agent requests scheduling, bandwidth, encryption or monitoring across operators. A human or legal-person credential, agent identity and task mandate establish authority; local operators still enforce their own policy.
2. **Temporary multi-agent teams.** Agents from several domains form a short-lived team for access, security or demand coordination. Portable credentials create transient trust, and permissions are reclaimed when the task ends.
3. **Cross-operator high-definition services.** A workflow narrows authority as it advances from scheduling to resource use, producing signed evidence at material steps.
4. **Roaming vehicle and mobile agents.** SIM/eSIM, hardware roots and workload identity establish technical provenance; organizational credentials establish accountable legal authority.
5. **B2C agentic commerce.** A natural person’s authenticated, scoped instruction is bound to an agent, cart or payment action and receipt, subject to applicable consumer and payment law.
6. **Energy and industrial data spaces.** A Business Wallet presents company and market-role credentials, while a connector evaluates purpose, mandate and data-use policy before releasing BESS, grid or supply-chain data.
7. **Digital Product Passports.** An enterprise agent retrieves or updates product evidence only when both product-linked facts and organizational authority are verifiable.
8. **Trusted AI and Physical AI.** A relying party checks the agent’s mandate, AI Service Passport, TEVV and runtime evidence before a gateway permits a bounded digital or cyber-physical action.

<h2 id="comparative-results">Comparative results: convergence without a single regional standard</h2>

The reviewed sources converge on recurring control patterns but emphasize different layers. The comparison does not claim regional consensus or equivalent maturity.

| Source or ecosystem | Strongest contribution | Material gap relative to the target architecture |
| --- | --- | --- |
| **GSMA Greater China M-Trust draft** | Multi-party evaluation, intent-aware authorization, cross-domain trust, continuous decision loop and telecom use cases. | Leaves W3C VC profiles, Business Wallets, legally grounded delegation and concrete PQC profiles unspecified. |
| **United States B2C initiatives** | Signed intent, agent recognition, cart/payment confirmation and platform enforcement. | Portability, legal effect, organizational authority and common cross-provider status remain uneven. |
| **Anthropic Zero Trust for AI Agents** | Cryptographically rooted agent identity, task-scoped permissions, sandboxing, memory and input/output controls, and enterprise security operations. | Does not by itself supply portable legal-person identity and cross-company mandate chains. |
| **WE BUILD non-paper** | European wallets, verifiable credentials, trusted identities, mandates and provable intent for AI agents. | Profiles, adoption governance and interoperable production implementations still need development and validation. |
| **Manufacturing-X and sector data spaces** | Federated industrial governance, Identity & Trust functions, connectors, roles and governed data exchange. | Shared agent-mandate, evidence-graph and cross-ecosystem cryptographic profiles remain development priorities. |
| **Spherity joint-research proposal** | LPID → PoA → AISP; Business and Agent Wallets; verifier policy; evidence graphs; signed receipts; crypto-agile, cross-domain corridors. | Requires published profiles, conformance tests, reference implementations and cross-jurisdiction pilots. |

<h2 id="standards-and-trust-chains">Standards requirements and verifiable trust chains</h2>

The target architecture does not rely on one technology or ledger. It requires interoperable primitive classes with clear governance:

- **Identity and credentials:** [W3C DID Core](https://www.w3.org/TR/did-core/), [W3C Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/), governed issuer discovery, semantic profiles, current status and revocation.
- **Cross-domain exchange:** Data Spaces Support Centre guidance, the Dataspace Protocol and Decentralized Claims Protocol, with connector-side policy and contractual governance.
- **Organizational authority:** authoritative company registers, European Business Wallet or equivalent organizational-wallet profiles, vLEI for complementary global entity and role interoperability, and task-bounded Powers of Attorney.
- **AI assurance:** AI Service Passport, TEVV evidence, model or agent version, intended use, incidents, monitoring and runtime status.
- **Cryptographic resilience:** crypto-agility across issuers, wallets, verifiers, DIDs, status services, registries, channels and archived evidence; post-quantum migration profiles must be agreed and tested rather than inferred from the M-Trust draft.
- **Accountability:** signed action receipts containing evidence references, policy version, status snapshot, execution result and timestamp.

The paper expresses the trust chain as:

<p class="decision-expression"><strong>authoritative source → legal person → authorised representative → agent or workload → task mandate → verifier policy → controlled action → signed receipt</strong></p>

Each arrow must be independently checkable, current and semantically understood by the relying party. A signature proves integrity and control of a key; it does not alone prove legal identity, authority, compliance or fitness for purpose.

<h2 id="wallets-and-authority">Business Wallets, organizational identity and verifiable authority</h2>

The proposed B2B model separates four questions that are often collapsed:

1. **Who is the organization?** A Legal-Person Identity (LPID) credential is rooted in an authoritative company register or an accepted cross-jurisdiction identity framework.
2. **Who may delegate?** A representative, role or governed system must have current authority under the organization’s rules and applicable law.
3. **What may the agent do?** A task-bounded Power of Attorney or capability specifies purpose, resource, tool, value, time, geography, delegation depth and termination conditions.
4. **What evidence supports execution now?** The verifier evaluates AI Service Passport, TEVV, runtime, product, data-space and transaction evidence under its own policy.

A Business Wallet can carry organizational identity and governed credentials. An Agent Wallet or workload identity can hold the task capability and present the required evidence. The relying verifier resolves issuer and credential status and computes the effective permission as the intersection of all applicable limits. This preserves **verifier sovereignty**: no wallet, credential or external agent decides access on behalf of the relying domain.

<h2 id="applications">Applications in Data Spaces, Digital Product Passports and Trusted AI</h2>

The architecture is reusable because the legal-person root and delegation chain can stay stable while sector evidence remains under its own governance.

- **Data Spaces:** company identity, membership, sector roles and contract-policy evidence feed connector decisions. The source domain controls its credentials; the recipient controls authorization.
- **Digital Product Passports and Battery Passports:** product identifiers, provenance, lifecycle claims, SBOM/VEX and conformity evidence form the data plane. Legal-person identity, mandate and access policy form the control plane.
- **Manufacturing-X:** federated Identity & Trust, data-space connectors and industry rulebooks provide an implementation environment for enterprise-agent authorization and evidence exchange.
- **Trusted AI:** LPID → PoA → AISP connects accountable organization, authority to act and AI-service assurance. Runtime status, incidents, drift and action receipts keep the decision current and reconstructable.
- **Critical infrastructure and Physical AI:** the enforcement point remains external to the agent and applies the smallest permitted capability. Safety, operational and regulatory controls remain authoritative in their own domains.

<h2 id="reference-architecture">Reference Architecture for Verifiable Agentic Networks</h2>

The proposed architecture contains eight layers. Each answers a distinct trust question and supplies inputs to the decision and enforcement loop.

| Layer | Core components | Required outcome |
| --- | --- | --- |
| **1. Governance and trust** | Laws, domain rulebooks, reciprocal recognition, trust registries, issuer accreditation and semantic governance | Recognized authority across autonomous trust domains. |
| **2. Organizational identity** | Business Wallet, register-backed company identity, vLEI, roles, licences, electronic signatures and seals | Verifiable legal person and representation across jurisdictions. |
| **3. Agent identity and delegation** | Agent Wallet, DID or workload identity, Power of Attorney and task capability | Bounded technical agency linked to accountable authority. |
| **4. AI service assurance** | AI Service Passport, TEVV, risk profile, incidents and monitoring | Verifiable system provenance and current assurance state. |
| **5. Data and product evidence** | Data spaces, DPP/DBP systems, provenance, semantic validation and evidence graph | A verifiable basis for the requested decision. |
| **6. Decision and enforcement** | M-Trust evaluation, policy decision point, policy enforcement point, connector or gateway | Local, context-aware and transient cross-domain authorization. |
| **7. Registry and cryptographic resilience** | VDR or governed registry, optional ledger, trusted execution, attestation, crypto-agility and PQC corridors | Current shared state, durable integrity, authenticity and confidentiality. |
| **8. Accountability evidence** | Signed action receipt, timestamp, policy version, evidence and status snapshot | Reconstructable decision and execution history. |

An end-to-end transaction follows seven steps: the agent proposes a specific action; the gateway requests authority and assurance evidence; the Agent Wallet presents identity and mandate; the verifier resolves issuers, status, semantics and evidence references; policy computes effective authority and transient trust; the enforcement point executes only the bounded capability; and the gateway produces a signed receipt and updates continuous monitoring.

The architecture’s scope is deliberately bounded. It is a design and standards proposal, not evidence of production performance, legal qualification, interoperability or political coordination. Those claims require profiles, reference implementations, conformance results and pilots across jurisdictions.

<h2 id="sources-and-boundaries">Research method, evidence boundary and Google Trends</h2>

The paper uses a qualitative architecture and standards-gap analysis. It distinguishes **documented design**, **architectural inference** and **normative proposal**. The English- and Chinese-language M-Trust drafts were compared for identity, credential, ledger, classical-cryptography and post-quantum content; comparative sources were reviewed for B2C intent, enterprise agent security, European wallet identity, industrial data-space governance and cross-jurisdiction organizational authority.

Google Trends was reviewed on 16 September 2026 as an editorial input. Worldwide and German Web Search comparisons showed the strongest relative interest around **AI agents**, **AI agent security**, **agentic AI** and **zero trust**. **M-Trust** and **verifiable authority** had insufficient or very low reported interest. The page therefore uses the higher-demand language for discovery while retaining the specialist terms because they precisely name the paper’s contribution. Google Trends values are normalized relative-interest signals, not absolute search volumes or evidence of market size.

<h2 id="references">Selected primary references</h2>

1. Rose, S.; Borchert, O.; Mitchell, S.; Connelly, S. (2020). [<em>NIST SP 800-207: Zero Trust Architecture</em>](https://csrc.nist.gov/pubs/sp/800/207/final). National Institute of Standards and Technology.
2. GSMA Greater China (2026). [<em>Trust Paradigm Evolution for Agentic Networks — Draft for Comments</em>](https://www.gsma.com/about-us/regions/greater-china/gsma_resources/trust-paradigm-evolution-for-agentic-networks%EF%BC%88draft-for-comments%EF%BC%89/). English- and Chinese-language drafts reviewed.
3. García-Herrero, A.; Storella, T. (2026). [“China’s artificial intelligence goals and strategic choices for Europe”](https://www.bruegel.org/analysis/chinas-artificial-intelligence-goals-and-strategic-choices-europe). Bruegel, 10 September 2026.
4. GSMA Greater China (2026). [<em>The Value of Mobile AI</em>](https://www.gsma.com/solutions-and-impact/technologies/networks/gsma_resources/the-value-of-mobile-ai-whitepaper/). Chinese-language white paper.
5. Anthropic (2026). [“Zero Trust for AI Agents: A Security Framework for Deploying Autonomous AI Agents in the Enterprise”](https://claude.com/blog/zero-trust-for-ai-agents), 27 May 2026.
6. Magård, D.; Busch, P.; Hannemann, D.; Scalongne, W.; Fjelkner, B.; Parikh, S.; Stöcker, C.; Bailly, L. (2026). [<em>Trusted Identities for AI Agents: An Opportunity for Europe</em>](https://www.webuildconsortium.eu/trusted-identities-for-ai-agents-an-opportunity-for-europe). WE BUILD non-paper, 27 February 2026.
7. Plattform Industrie 4.0 (2026). [<em>Manufacturing-X Framework</em>](https://www.plattform-i40.de/IP/Redaktion/EN/Standardartikel/ManufacturingX_Framework.html). Federal Ministry for Economic Affairs and Energy.
8. GLEIF and contributing authors (2026). [<em>Agentic AI in Payments: Establishing Interoperable Trust and Control</em>](https://www.gleif.org/organizational-identity/research-publications/2026-08-13_agentic_ai_in_payments_v1.0-1.pdf). Working Paper Series, version 1.0.
9. W3C (2022). [<em>Decentralized Identifiers (DIDs) v1.0</em>](https://www.w3.org/TR/did-core/).
10. W3C (2025). [<em>Verifiable Credentials Data Model v2.0</em>](https://www.w3.org/TR/vc-data-model-2.0/).

The PDF contains the complete 52-source bibliography, including post-quantum standards, EBSI and eIDAS ledger provisions, Dataspace Protocol and Decentralized Claims Protocol, B2C payment and commerce initiatives, Catena-X, European Business Wallet sources and related Spherity Research.

<h2 id="citation">How to cite this work</h2>

Stöcker, Carsten (2026). “Beyond Single-Enterprise ZTA: Multi-Trust Architectures for Authorised Agentic Actors in Open, Cross-Domain Ecosystems.” Spherity GmbH. <https://spherity.github.io/spherity-research/beyond-zero-trust-m-trust-authorised-agentic-actors.html>. Licensed CC BY 4.0.
