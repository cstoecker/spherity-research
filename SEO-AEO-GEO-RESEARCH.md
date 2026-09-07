# SEO, AEO and GEO research workflow

This workflow is the required search-language review for publications created
from `templates/publication.md` version 2. It improves discoverability without
letting fluctuating search data rewrite the research, overstate findings or
replace editorial judgment.

## Principles

1. **Separate authority terms from discovery terms.** Authority terms are the
   specialist concepts Spherity Research intends to define and own, such as
   “CRA-capable Digital Product Passport” or “Trust as a Production Factor.”
   They remain in the title, answer summary, keywords or FAQ when technically
   accurate, even if current search volume is low. Discovery terms are familiar
   adjacent phrases that help readers find the work, such as “Cyber Resilience
   Act compliance,” “industrial AI” or “digital identity.”
2. **Use Trends as relative evidence, not absolute volume.** Google Trends uses
   sampled, normalized values from 0 to 100. A value of zero can mean that a
   specialist query is below the reporting threshold; it does not prove that no
   one searches for it.
3. **Compare like with like.** Use the same geography, period, category and
   search type within a comparison. Record whether each input is an exact search
   term or a Google Trends topic. Prefer a topic for established cross-language
   concepts and exact terms for new or proprietary phrases.
4. **Preserve evidence boundaries.** Trends can inform wording and audience
   questions. It cannot validate technical, legal, market-positioning or policy
   claims.

Official references:

- [FAQ about Google Trends data](https://support.google.com/trends/answer/4365533?hl=en)
- [Compare search terms and topics](https://support.google.com/trends/answer/17309543)
- [Compare Trends search terms](https://support.google.com/trends/answer/4359550?hl=en)
- [Export, embed and cite Trends data](https://support.google.com/trends/answer/4365538?hl=en)

## Required review for each new publication

### 1. Define the semantic strategy first

Before opening Google Trends, identify:

- two to five authority terms supported directly by the paper;
- three to eight established discovery terms;
- the primary audiences and questions they are likely to ask;
- English and relevant German-language variants;
- relevant regulations, standards, sectors, technologies and geographies.

Do not select terminology only because it is popular. The title and abstract
must remain faithful to the publication.

### 2. Run two comparison horizons

Use [Google Trends Explore](https://trends.google.com/trends/explore) and record:

- past 12 months for current language and emerging interest;
- past five years for persistence, seasonality and event-driven spikes;
- Germany as the primary market where relevant;
- two or more relevant European comparison markets;
- worldwide interest for globally framed research;
- Web Search and, for policy or corporate topics, News Search.

For multilingual work, compare exact English and German phrases separately.
When a recognized Google Trends topic exists, compare it with the exact phrase
rather than silently substituting one for the other.

### 3. Review related and rising queries

Record useful related or rising queries only when they match the paper’s actual
scope. Reject ambiguous, consumer-oriented or sensational wording that would
misrepresent the research. If the data is insufficient, record that result and
use authoritative terminology plus established adjacent concepts.

### 4. Translate findings into page decisions

Apply the evidence deliberately:

- `title` and `seo_title`: primary authority concept plus one clear discovery
  phrase when natural;
- `description` and `og_description`: direct answer, audience value and material
  evidence boundary;
- `keywords`: authority terms, acronyms, recognized variants, standards,
  regulations, use cases and geographies;
- `answer_summary`: a self-contained answer that an answer engine can quote
  without losing qualifications;
- `questions_answered`: real audience questions with complete visible answers;
- `about`, `mentions`, `audiences` and `spatial_coverage`: structured semantic
  context;
- publication catalog `search`: spelling variants, acronyms and German/English
  discovery language used by the on-site search.

Avoid keyword repetition, artificial headings and claims such as “trending” or
“most searched” unless the retained comparison directly supports them.

### 5. Record the review in front matter

Complete the `search_research` block in the version 2 publication template. The
build requires the review date, official source, geographies, time ranges,
search types, authority terms, discovery terms, audience questions, evidence
notes and editorial decisions. Every authority term must also appear in the
page’s `keywords` list.

Do not commit personal Google account information, cookies or private exports.
If a chart or CSV is published, attribute it to Google Trends and record the
filters needed to reproduce the comparison.

## Why CI validates the record but does not query Google Trends

The public Google Trends interface is an editorial research tool. Google’s
official BigQuery Trends dataset exposes top and rising queries, not a stable
arbitrary-term API suitable for every niche publication. A deployment-time
network query would make releases fragile and could change results after
editorial approval.

The deterministic build therefore checks that the documented review was
completed and that its authority terms reached the published metadata. It does
not scrape Google Trends, invent search volume or automatically rewrite copy.

## Recurring review

Revisit search language when a publication is materially revised, a regulation
or standard changes, or Search Console reveals a durable query pattern. Use
Google Search Console for actual impressions, clicks and indexed-query evidence;
use Google Trends for relative language and interest context. Neither source
guarantees ranking, rich results or citation by an AI system.
