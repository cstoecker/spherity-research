---
layout: default
title: "Spherity Research"
description: "Independent research from Spherity GmbH on decentralized identity, European Business Wallets, verifiable credentials, trusted AI, and post-quantum resilience."
permalink: /
schema_type: "CollectionPage"
og_type: "website"
robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
image: "/assets/spherity-research-og.png"
image_alt: "Spherity Research — Identity. Infrastructure. Resilience."
---

<header class="portal-header">
  <div class="portal-shell portal-nav">
    <a class="portal-brand" href="{{ '/' | relative_url }}" aria-label="Spherity Research home">
      <img src="{{ '/assets/Spherity-logo-horiz-blue-rgb.png' | relative_url }}"
           alt="Spherity"
           width="8000"
           height="2391">
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
          Evidence-led work on organizational identity, verifiable credentials,
          European Business Wallets, trusted AI, and the cryptographic
          infrastructure behind the real economy.
        </p>
        <div class="hero-actions">
          <a class="button button-primary" href="#publications">Explore publications <span aria-hidden="true">↓</span></a>
          <a class="button button-ghost" href="https://github.com/spherity/spherity-research">View source on GitHub <span aria-hidden="true">↗</span></a>
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
          <span class="signal-value">04</span>
          <span class="signal-label">Current<br>publications</span>
        </div>
      </div>
    </div>
    <div class="portal-shell trust-strip" aria-label="Research focus areas">
      <span>Identity</span>
      <span>Infrastructure</span>
      <span>Resilience</span>
      <span>Policy</span>
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
      <div class="filter-list" aria-label="Filter by topic">
        <button class="filter-button is-active" type="button" data-filter="all" aria-pressed="true">All</button>
        <button class="filter-button" type="button" data-filter="identity" aria-pressed="false">Identity</button>
        <button class="filter-button" type="button" data-filter="wallets" aria-pressed="false">Business wallets</button>
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

    <p class="no-results" id="no-results" hidden>
      No publications match this search. Try a broader topic or clear the search field.
    </p>
  </section>

  <section class="topics-section" id="topics" aria-labelledby="topics-title">
    <div class="portal-shell">
      <div class="section-heading section-heading-light">
        <div>
          <p class="eyebrow"><span></span>Research agenda</p>
          <h2 id="topics-title">One trust layer. Four perspectives.</h2>
        </div>
        <p>
          The research connects technology, law, policy, and operations instead
          of treating them as separate systems.
        </p>
      </div>
      <div class="topic-grid">
        <article>
          <span class="topic-number">01</span>
          <h3>Organizational identity</h3>
          <p>Verifiable authority for companies, products, machines, and autonomous agents.</p>
        </article>
        <article>
          <span class="topic-number">02</span>
          <h3>Business wallets</h3>
          <p>Legal and operational infrastructure for trusted cross-border business processes.</p>
        </article>
        <article>
          <span class="topic-number">03</span>
          <h3>Cryptographic resilience</h3>
          <p>Migration paths for identity and trust systems in a post-quantum world.</p>
        </article>
        <article>
          <span class="topic-number">04</span>
          <h3>Trusted AI</h3>
          <p>Identity, authorization, and evidence for governed agentic ecosystems.</p>
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
    <img src="{{ '/assets/Spherity-logo-horiz-blue-rgb.png' | relative_url }}"
         alt="Spherity"
         width="8000"
         height="2391">
    <p>Independent research on identity, infrastructure, and resilience.</p>
    <p>© 2026 Spherity GmbH</p>
  </div>
</footer>

<script src="{{ '/assets/research-portal.js' | relative_url }}" defer></script>
