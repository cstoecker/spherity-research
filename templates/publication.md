---
publication_template_version: 2
layout: research-respec
css: "/assets/spherity-research-respec.css"

title: "Full publication title"
seo_title: "Concise search title using the primary authority term"
og_title: "Clear social title aligned with the publication"
og_description: "A self-contained social description that communicates the question, evidence and value."
subtitle: "One-sentence subtitle"
description: "A specific 100–180 character summary that states the subject, method and practical value of this publication."

paper_status: "Spherity Research Paper"
authors:
  - "Author name"
author_entities:
  - name: "Author name"
    affiliation: "Author organization"
    # Add this author to docs/_data/authors.yml with identity_reviewed: true.
    # These fields may override that reviewed profile for this publication.
    url: "https://authoritative.example/author-profile"
    same_as:
      - "https://www.linkedin.com/in/verified-author-profile/"
author_affiliations:
  - "Author name — Author organization"
affiliation: "Author organization"

date: "YYYY-MM-DD"
last_modified_at: "YYYY-MM-DD"
research_cutoff: "YYYY-MM-DD"
research_cutoff_label: "Evidence, regulation and market facts verified to this date"
lang: "en"

permalink: /publication-slug.html
canonical_url: "https://spherity.github.io/spherity-research/publication-slug.html"
latest_version: "https://spherity.github.io/spherity-research/publication-slug.html"

# Keep this block for a PDF publication. For multiple editions, list every PDF
# in associated_media and use the long/full version as pdf_url.
pdf_url: "/publication-slug.pdf"
associated_media:
  - name: "Full publication title — PDF"
    url: "/publication-slug.pdf"
    license: "https://creativecommons.org/licenses/by/4.0/"
cover_image: "/assets/publication-slug-cover.jpg"
cover_image_alt: "First page of Full publication title."

robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
license: "https://creativecommons.org/licenses/by/4.0/"
license_scope: "This research page and the linked publication PDF"

image: "/assets/publication-slug-social.webp"
image_alt: "Plain-language description of the publication social preview."
image_mime: "image/webp"
image_width: 1200
image_height: 630

keywords:
  - "Specialist term this research should establish"
  - "Second specialist authority term"
  - "Established discovery term"
  - "Relevant regulation or standard"
  - "Relevant industry or policy use case"
  - "Relevant geographic term"
  - "Relevant implementation term"
  - "Relevant audience term"

answer_summary: "In two or three sentences, answer the publication's primary question and state its evidence boundary."
key_takeaways:
  - "First evidence-supported takeaway."
  - "Second evidence-supported takeaway."
  - "Third evidence-supported takeaway."
about:
  - "Primary entity or subject"
mentions:
  - "Relevant regulation, standard, threat or use case"
citations:
  - "https://authoritative.example/source"
audiences:
  - "Primary decision-making audience"
  - "Primary implementation audience"
spatial_coverage:
  - "European Union"

# Google Trends is an editorial research input, not an automated ranking
# decision. Preserve specialist authority terms even when Trends reports zero
# because low-volume queries may be below its reporting threshold.
search_research:
  reviewed_on: "YYYY-MM-DD"
  source: "Google Trends"
  source_url: "https://trends.google.com/trends/explore"
  geographies:
    - "Germany"
    - "Relevant European comparison markets"
    - "Worldwide"
  time_ranges:
    - "Past 12 months"
    - "Past 5 years"
  search_types:
    - "Web Search"
    - "News Search"
  authority_terms:
    - "Specialist term this research should establish"
    - "Second specialist authority term"
  discovery_terms:
    - "Established adjacent search phrase"
    - "Second established discovery phrase"
    - "Relevant German-language or audience phrase"
  audience_questions:
    - "Question a policy, industry or research reader is likely to ask"
    - "Question the publication can answer directly and accurately"
  evidence:
    - comparison: "Terms or topics compared with geography, period and search type"
      input_type: "Search terms, Topics, or a documented comparison of both"
      geography: "Germany"
      time_range: "Past 5 years"
      search_type: "Web Search"
      result: "Record the relative pattern, related/rising queries or insufficient-data finding without inventing volume."
  editorial_decisions:
    - "Explain which familiar wording was added for discovery."
    - "Explain which specialist authority wording was retained and why."

questions_answered:
  - question: "What precise question does this publication answer?"
    answer: "Give a concise, self-contained answer that is supported by the publication."
  - question: "What is the main implementation or policy implication?"
    answer: "Answer directly and preserve every qualification in the underlying research."
related_publications:
  - title: "Related Spherity publication"
    url: "/related-publication.html"
    context: "Explain the evidence-based relationship in one sentence."

toc_items:
  - title: "Abstract"
    href: "#abstract"
  - title: "1. Introduction"
    href: "#1-introduction"
  - title: "2. Findings"
    href: "#2-findings"
  - title: "References"
    href: "#references"
  - title: "License and citation"
    href: "#license-and-citation"
  - title: "Questions answered"
    href: "#questions-answered"

tags:
  - digital-identity
  - verifiable-credentials
---

<section class="abstract-box" markdown="1">
<h2 id="abstract">Abstract</h2>

Write the evidence-led abstract here. State whether regulations or standards are adopted, proposed or projected.

<p class="keywords"><strong>Keywords:</strong> keyword one; keyword two; keyword three</p>
</section>

<h2 id="1-introduction">1. Introduction</h2>

Write the introduction here.

<h2 id="2-findings">2. Findings</h2>

Write the findings here and link claims to authoritative sources or the paper's reference list.

<h2 id="references">References</h2>

Add numbered references here.
