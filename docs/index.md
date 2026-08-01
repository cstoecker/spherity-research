---
layout: default
title: "Spherity Research"
description: "Spherity research on DPPs, DBPs, European Business Wallets (EBW), AI Service Passports (AISP), Trusted AI, Physical AI, data sharing, and post-quantum trust."
keywords:
  - "Digital Product Passports"
  - "DPP"
  - "Digital Battery Passports"
  - "DBP"
  - "DPP Registry"
  - "Legal-Person Identity"
  - "Product-Linked Identity"
  - "Authorization"
  - "Authorisation"
  - "Evidence Graph"
  - "BESS"
  - "Battery Energy Storage Systems"
  - "Industrial AI"
  - "Supply-Chain Compliance"
  - "Cyber-Physical Products"
  - "Data Sharing"
  - "Data Spaces"
  - "Digital Corridors"
  - "Digital Data Sharing Corridors"
  - "Organizational Identity"
  - "European Business Wallet"
  - "European Business Wallets"
  - "EBW"
  - "Verifiable Credentials"
  - "AI Service Passport"
  - "AI Service Passports"
  - "AISP"
  - "AI Agent Authorization"
  - "Trusted AI"
  - "Physical AI"
  - "Post-Quantum Cryptography"
permalink: /
schema_type: "CollectionPage"
og_type: "website"
robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
last_modified_at: "2026-08-01"
image: "/assets/spherity-research-og.png"
image_alt: "Spherity Research — Identity. Infrastructure. Resilience."
---

<header class="portal-header">
  <div class="portal-shell portal-nav">
    <a class="portal-brand" href="{{ '/' | relative_url }}" aria-label="Spherity Research home">
      <img src="{{ '/assets/spherity-logo-horizontal-800.webp' | relative_url }}"
           alt="Spherity"
           width="800"
           height="239">
    </a>
    <nav aria-label="Primary navigation">
      <a href="#publications">Publications</a>
      <a href="#topics">Topics</a>
      <a class="nav-cta" href="https://www.spherity.com/" rel="external">Spherity.com <span aria-hidden="true">↗</span></a>
    </nav>
  </div>
</header>

<main id="main-content">
  <section class="portal-hero">
    <div class="portal-shell hero-grid">
      <div class="hero-copy">
        <p class="eyebrow"><span></span>Spherity Research</p>
        <h1>Research for the systems we need to trust.</h1>
        <p class="hero-lede">
          Evidence-led work on Digital Product Passports (DPPs), organizational
          identity, verifiable credentials, European Business Wallets (EBW),
          trusted AI, and the cryptographic infrastructure behind the real economy.
        </p>
        <div class="hero-actions">
          <a class="button button-primary" href="#publications">Explore publications <span aria-hidden="true">↓</span></a>
          <a class="button button-ghost" href="https://github.com/spherity/spherity-research">View source on GitHub <span aria-hidden="true">↗</span></a>
          {% include share.html id="homepage-share" title=page.title text=page.description url=page.url %}
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="orbit orbit-one"></div>
        <div class="orbit orbit-two"></div>
        <div class="orbit orbit-three"></div>
        <span class="node node-a"></span>
        <span class="node node-b"></span>
        <span class="node node-c"></span>
        <span class="node node-d"></span>
        <span class="node node-e"></span>
        <div class="hero-signal">
          <span class="signal-value">{{ site.data.publications | size }}</span>
          <span class="signal-label">Current<br>publications</span>
        </div>
      </div>
    </div>
    <div class="portal-shell trust-strip" aria-label="Research focus areas">
      <span>DPP &amp; DBP</span>
      <span>Identity</span>
      <span>Data sharing</span>
      <span>Resilience</span>
      <span>Trusted AI</span>
    </div>
  </section>

  <section class="portal-explainer portal-shell" aria-labelledby="research-answers-title">
    <div>
      <p class="eyebrow eyebrow-dark"><span></span>Research scope</p>
      <h2 id="research-answers-title">What questions does Spherity Research answer?</h2>
    </div>
    <div class="portal-explainer-copy">
      <p>
        Spherity Research examines how organizations and products can establish
        identity, authority, provenance, and trustworthy evidence across
        regulated digital systems. The research agenda includes Digital Product
        Passports (DPPs), Digital Battery Passports (DBPs), trusted data sharing
        across Data Spaces and Digital Data Sharing Corridors, European Business
        Wallet (EBW) policy, Trusted AI, AI-agent authorization, AI Service
        Passports (AISP), Industrial AI evidence graphs, Physical AI,
        post-quantum organizational-identity corridors, and operational
        resilience.
      </p>
      <ul>
        <li><a href="{{ '/verifiable-access-controlled-digital-product-passports.html' | relative_url }}">How can DPP and DBP transactions verify both product evidence and the legal authority to act?</a></li>
        <li><a href="{{ '/evidence-graphs-industrial-ai-data-plane.html' | relative_url }}">How can Industrial AI trace provenance, validation, freshness, and conflicting evidence across organizations?</a></li>
        <li><a href="{{ '/ebw-zero-trust-ai-agents.html' | relative_url }}">How can an enterprise prove an AI agent’s legal authority for a specific action?</a></li>
        <li><a href="{{ '/quantum-resilient-organizational-identity.html' | relative_url }}">How can organizations establish a governed, PQC-resilient digital corridor?</a></li>
        <li><a href="{{ '/Securing-Digital-Identity-Quantum-Vulnerabilities.html' | relative_url }}">Which digital-identity dependencies must migrate for post-quantum readiness?</a></li>
        <li><a href="{{ '/ebw-roadmap.html' | relative_url }}">Which legal and operational gates shape European Business Wallet adoption?</a></li>
        <li><a href="{{ '/threat-escalation-model-germany-eu.html' | relative_url }}">How can Germany and the EU test readiness across coupled technology risks?</a></li>
      </ul>
    </div>
  </section>

  <section class="trust-planes portal-shell" aria-labelledby="trust-planes-title">
    <div class="trust-planes-heading">
      <p class="eyebrow eyebrow-dark"><span></span>Trusted Industrial AI</p>
      <h2 id="trust-planes-title">Two trust planes. One accountable system.</h2>
      <p>Regulated AI needs separate, interoperable evidence for legal authority and for the facts supporting a decision.</p>
    </div>
    <div class="trust-plane-grid">
      <article>
        <span class="trust-plane-number">01 · Control plane</span>
        <h3>Who is authorized to act?</h3>
        <p>European Business Wallets connect legal-person identity, agent identity, bounded mandates, current status, policy decisions, and action receipts.</p>
        <a href="{{ '/ebw-zero-trust-ai-agents.html' | relative_url }}">Read the control-plane paper <span aria-hidden="true">→</span></a>
      </article>
      <article>
        <span class="trust-plane-number">02 · Data plane</span>
        <h3>What evidence supports the action?</h3>
        <p>Evidence graphs connect provenance, validation, freshness, transformations, conflicts, uncertainty, issuer status, and auditable evidence paths.</p>
        <a href="{{ '/evidence-graphs-industrial-ai-data-plane.html' | relative_url }}">Read the data-plane paper <span aria-hidden="true">→</span></a>
      </article>
    </div>
    <p class="trust-planes-boundary">A valid mandate does not prove that an AI output is factually supported. Reliable evidence does not prove that an AI agent was legally authorized to act. Regulated AI systems require both layers.</p>
  </section>

  <section class="corridor-section portal-shell" aria-labelledby="corridor-title">
    <div class="corridor-heading">
      <div>
        <p class="eyebrow eyebrow-dark"><span></span>Quantum-resilient trust</p>
        <h2 id="corridor-title">Organizational identity is infrastructure.</h2>
      </div>
      <p>
        B2B, B2G, G2G, machine, and AI-agent ecosystems depend on proving which
        organization is acting, under which authority, and whether the complete
        trust chain remains valid as cryptography changes.
      </p>
    </div>
    <div class="corridor-path">
      <article>
        <span class="corridor-step">01 · Establish authority</span>
        <h3>Prove the organization and its mandate.</h3>
        <p>Bind legal existence, representation rights, roles, licenses, delegated authority, purpose, and validity periods into reusable organizational credentials.</p>
      </article>
      <article>
        <span class="corridor-step">02 · Map the trust fabric</span>
        <h3>Inventory every dependency that makes the proof reliable.</h3>
        <p>Cover issuers, wallets, verifiers, trust anchors, status, revocation, registries, qVDR functions, DNSSEC, WebPKI, semantics, vendors, and long-term evidence.</p>
      </article>
      <article>
        <span class="corridor-step">03 · Launch a PQC Corridor</span>
        <h3>Migrate a bounded high-value ecosystem together.</h3>
        <p>Align actors, assurance, evidence horizons, trust boundaries, hybrid or post-quantum profiles, downgrade rules, lifecycle controls, and reusable conformance evidence.</p>
      </article>
    </div>
    <div class="corridor-outcome">
      <p>Algorithm replacement alone cannot preserve legal reliance when counterparties, trust anchors, status services, lifecycle controls, and evidence do not migrate coherently.</p>
      <a href="{{ '/quantum-resilient-organizational-identity.html' | relative_url }}">Read the PQC Corridor paper <span aria-hidden="true">→</span></a>
    </div>
  </section>

  <section class="publication-section portal-shell" id="publications" aria-labelledby="publications-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow eyebrow-dark"><span></span>Research library</p>
        <h2 id="publications-title">Current publications</h2>
      </div>
      <p>
        Long-form papers, roadmaps, and visual explainers for decision-makers
        building trustworthy digital ecosystems.
      </p>
    </div>

    <div class="publication-tools" role="search" aria-label="Filter publications">
      <label class="search-field">
        <span class="sr-only">Search publications</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
          <circle cx="11" cy="11" r="7"></circle>
          <path d="m20 20-4-4"></path>
        </svg>
        <input type="search" id="publication-search" placeholder="Search titles, themes, or keywords" autocomplete="off">
      </label>
      <div class="filter-list" role="group" aria-label="Filter by topic">
        <button class="filter-button is-active" type="button" data-filter="all" aria-pressed="true">All</button>
        <button class="filter-button" type="button" data-filter="identity" aria-pressed="false">Identity</button>
        <button class="filter-button" type="button" data-filter="dpp" aria-pressed="false">DPP &amp; DBP</button>
        <button class="filter-button" type="button" data-filter="wallets" aria-pressed="false">Wallets &amp; data sharing</button>
        <button class="filter-button" type="button" data-filter="resilience" aria-pressed="false">Resilience</button>
        <button class="filter-button" type="button" data-filter="ai" aria-pressed="false">Trusted AI</button>
      </div>
    </div>

    <div class="publication-grid" id="publication-grid">
      {% for publication in site.data.publications %}
      {% assign primary_link = publication.links | first %}
      <article class="publication-card{% if publication.featured %} publication-card-featured{% endif %}"
               data-topics="{{ publication.filters }}"
               data-search="{{ publication.search }}">
        <a class="card-media {{ publication.media_class }}"
           href="{{ primary_link.url | relative_url }}"
           aria-label="{{ primary_link.label }}: {{ publication.title }}">
          {% if publication.image %}
          <img src="{{ publication.image | relative_url }}"
               alt="{{ publication.image_alt }}"
               width="{{ publication.image_width }}"
               height="{{ publication.image_height }}"
               loading="{% if publication.featured %}eager{% else %}lazy{% endif %}"
               decoding="async"
               {% if publication.featured %}fetchpriority="high"{% endif %}>
          {% else %}
          <span class="graphic-grid" aria-hidden="true"></span>
          <span class="graphic-kicker">{{ publication.graphic_kicker }}</span>
          <strong>{{ publication.graphic_title }}</strong>
          <span class="graphic-caption">{{ publication.graphic_caption }}</span>
          {% endif %}
          <span class="media-format">{{ publication.format }}</span>
        </a>
        <div class="card-body">
          <div class="card-topline">
            <span class="card-type">{{ publication.type }}</span>
            <time datetime="{{ publication.date_iso }}">{{ publication.date_label }}</time>
          </div>
          <h3>{{ publication.title }}</h3>
          <p>{{ publication.description }}</p>
          <ul class="topic-tags" aria-label="Topics">
            {% for topic in publication.topics %}
            <li>{{ topic }}</li>
            {% endfor %}
          </ul>
          <div class="card-actions{% if publication.links.size > 1 %} card-actions-split{% endif %}">
            {% for link in publication.links %}
            <a class="{% if link.secondary %}secondary-link{% else %}text-link{% endif %}"
               href="{{ link.url | relative_url }}">
              {{ link.label }} {% if link.arrow %}<span aria-hidden="true">{{ link.arrow }}</span>{% endif %}
            </a>
            {% endfor %}
          </div>
        </div>
      </article>
      {% endfor %}
    </div>

    <p class="no-results" id="no-results" role="status" aria-live="polite" hidden>
      No publications match this search. Try a broader topic or clear the search field.
    </p>
  </section>

  <section class="topics-section" id="topics" aria-labelledby="topics-title">
    <div class="portal-shell">
      <div class="section-heading section-heading-light">
        <div>
          <p class="eyebrow"><span></span>Research agenda</p>
          <h2 id="topics-title">One trust layer. Five perspectives.</h2>
        </div>
        <p>
          The agenda connects product data, identity, data sharing, technology,
          law, policy, and operations instead of treating them as separate
          systems.
        </p>
      </div>
      <div class="topic-grid">
        <article>
          <span class="topic-number">01</span>
          <h3>Digital Product Passports</h3>
          <p>Trust architectures for DPPs and Digital Battery Passports (DBPs), including identifiers, provenance, lifecycle claims, access rights, and compliance evidence.</p>
        </article>
        <article>
          <span class="topic-number">02</span>
          <h3>Organizational identity</h3>
          <p>Verifiable legal existence, representation, mandates, and accountability for companies, machines, and autonomous agents.</p>
        </article>
        <article>
          <span class="topic-number">03</span>
          <h3>Business Wallets &amp; Data Sharing</h3>
          <p>Legal and operational infrastructure for trusted cross-border processes, interoperable Data Spaces, and Digital Data Sharing Corridors.</p>
        </article>
        <article>
          <span class="topic-number">04</span>
          <h3>Cryptographic resilience</h3>
          <p>PQC Corridors and crypto-agile migration paths for identity, trust anchors, registries, and long-lived evidence.</p>
        </article>
        <article>
          <span class="topic-number">05</span>
          <h3>Trusted AI</h3>
          <p>Legal authorization and evidence provenance for governed Industrial AI and agentic ecosystems.</p>
        </article>
      </div>
    </div>
  </section>

  <section class="portal-cta">
    <div class="portal-shell cta-inner">
      <div>
        <p class="eyebrow eyebrow-dark"><span></span>Open research</p>
        <h2>Read it. Test it. Build on it.</h2>
      </div>
      <div>
        <p>
          The publication source is maintained openly on GitHub for stable
          linking, transparent revision, and long-term discoverability.
        </p>
        <a class="button button-dark" href="https://github.com/spherity/spherity-research">
          Open the repository <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  </section>
</main>

<footer class="portal-footer">
  <div class="portal-shell footer-inner">
    <img src="{{ '/assets/spherity-logo-horizontal-800.webp' | relative_url }}"
         alt="Spherity"
         width="800"
         height="239"
         loading="lazy"
         decoding="async">
    <div class="footer-license">
      <a href="https://creativecommons.org/licenses/by/4.0/" rel="license external" aria-label="Creative Commons Attribution 4.0 International license">
        <img src="{{ '/assets/cc-by.svg' | relative_url }}"
             alt="Creative Commons Attribution 4.0 International"
             width="88"
             height="31"
             loading="lazy"
             decoding="async">
      </a>
      <p>Except where otherwise noted, this site's research content and data are licensed under <a href="https://creativecommons.org/licenses/by/4.0/" rel="license external">CC BY 4.0</a> by the named author or co-authors.</p>
    </div>
    <p>Source code is available under the <a href="https://github.com/spherity/spherity-research/blob/main/LICENSE">MIT License</a>. Spherity names and logos are excluded.</p>
    <p class="footer-copyright">© 2026 Spherity GmbH</p>
  </div>
</footer>
