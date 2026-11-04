# Global DPP Atlas knowledge graph schema

**Schema 0.1.0.** The machine-readable JSON Schema is generated from the strict models used to validate the dataset. This note defines meaning and query boundaries.

## Identity and structure

The canonical exchange file has metadata, entities, assertions and sources. IDs are stable kebab-case strings. RDF export identifies them with `urn:spherity:dpp-atlas:`; these are research identifiers, not claims that a public web resolver exists. Jurisdictions, sectors and concepts are shared reference entities. Versions of an evolving technical artifact must remain distinguishable; subsequent materially different editions receive distinct entities linked with a qualified supersession claim.

| Entity family | Examples | Boundary |
|---|---|---|
| LegalInstrument, Provision, Requirement, Policy | ESPR, Article 9, battery passport duty, policy consultation | Enabling powers, duties and policy activity retain different statuses. |
| Standard, StandardisationProject, Specification, Ontology | EN edition, ISO work item, UNTP version, CIRPASS ontology | Publication, legal citation and implementation are separate claims. |
| Organisation, Committee, Initiative | W3C task force, CEN committee, CIRPASS-2 | Hosting or participation does not establish domestic law. |
| Implementation, Pilot, Report, CertificationScheme | A platform, bounded demonstration, results report, scheme | Reported operation does not establish universal compatibility. |
| Jurisdiction, Sector, Concept | EU, Northern Ireland, batteries, delegated authority | Geographic and analytical classifications do not create obligations. |

Entity summaries contain a dated status, scope note, dated events, references, review status and limitations. The status vocabulary is exposed with the release so applications can inspect the actual values; it is not collapsed into a universal maturity scale. Some legal details remain in prose descriptions in this initial release. Fine-grained actor/action/exception crosswalks require further coding before comparative equivalence tests.

## Qualified assertions

An assertion contains subject, predicate and either an entity object or a typed literal. It also contains a readable statement, sources, locator, claim type, evidence type, observation date, optional validity interval, review state and limitations. `source_statement`, `research_classification` and `reported_result` distinguish what a source says from the researcher's categorisation and attributed outcomes.

| Predicate group | Predicates | Interpretation |
|---|---|---|
| Scope and duties | applies_to, requires, targets_sector, operates_in | Read with the assertion's product, territorial and conditional qualifications. |
| Legal and temporal relations | part_of, amends, supersedes, depends_on, has_status, has_milestone | A milestone may be planned or conditional; inspect its type. |
| Institutional and technical links | developed_by, publishes, uses_as_input, references, normatively_references, enables | Normative references require stronger evidence than an indicative catalogue list. |
| Convergence and tests | maps_to_under_conditions, implements_version, tested_with, reports_result, aligned_with_claim | An alignment announcement does not become a tested_with relationship. |
| Legal recognition and citation | recognises_authority, cites_standard | Recognition and presumption of conformity must retain their legal scope. |

The JSON-LD export reifies claims as RDF Statements and provenance entities. It deliberately retains evidence and review qualifiers rather than emitting all seed assertions as unconditional domain triples. Graph views use these same assertion IDs as edges. Product and jurisdiction associations recorded directly in entity summaries are exported as explicitly derived display edges, with their entity-level sources and a separate `edge_kind`.

## Time and evidence

Event dates retain kind, precision, trigger and supporting sources. Conditional dates are null with a trigger expression. Entity status `as_of` and assertion `observed_at` describe the research observation, not automatic legal commencement. Optional `valid_from` and `valid_to` are populated only where supported. Point-in-time records and edition history are the implemented seed model; complete bitemporal query semantics are future work.

Source records distinguish material reopened during this extraction from inherited dossier entries, snippets and unavailable pages. `primary_rechecked` means supporting primary material was reopened, not that every entity field was independently reviewed. All seed records remain machine-assisted and human-unreviewed. Exact source URLs and locators permit follow-up; the release does not imply that web pages have been archived.

Interoperability evidence identifies dimensions, operation, systems and available versions, test date, reporting independence and outcome. `reported_success` differs from a locally measured `pass`. No evidence object means no coded test evidence, not failure. No inference rule upgrades published standards or common vocabulary usage into interoperability.

## Geographic joins and derived outputs

Country joins use ISO alpha-3 codes from the [UN geographic coding table](https://unstats.un.org/unsd/methodology/m49/overview/). EU scope joins use the [EU country directory](https://european-union.europa.eu/principles-countries-history/eu-countries_en). Boundary geometry is deliberately external to the seed; select and license a suitable boundary dataset when building the map. Subnational joins require compatible boundary identifiers. Great Britain must not be painted using the whole UK polygon.

The map export preserves multiple records and legal statuses per jurisdiction. EU legal-scope records can be presented on member-country rows through explicit membership provenance. This is scope inheritance for display, not a claim that national implementation was reviewed. European or global standards initiatives are listed separately. Unlisted jurisdictions are not assessed. Regional pilot records remain regional and are not turned into national mandates.

Timeline rows expose event kinds and conditional triggers. Graph edges retain assertion IDs and sources. Standards tables retain versions, publication status and OJ citation assertions separately. Interoperability matrices include explicit `not_assessed` cells for dimensions without coded evidence, without assigning a failed outcome. Figure-input summaries report corpus counts only; they are not worldwide prevalence estimates.

## Standards alignment and limits

Use [PROV-O](https://www.w3.org/TR/prov-o/) for derivation relationships and [DCAT 3](https://www.w3.org/TR/vocab-dcat-3/) for the release's dataset identity and version. The local vocabulary defines the domain relationships. Structural validation uses a generated [JSON Schema 2020-12](https://json-schema.org/draft/2020-12) and the same strict Pydantic models. Referential, calendar and evidence checks supplement schema validation.

This is an evidence-register schema, not a replacement DPP product ontology. CIRPASS-2, UNTP and W3C work are represented as research objects; using their names does not claim conformance with their schemas. No SHACL or ontology-equivalence validation is claimed in this release. The model supports adding tested mappings later without treating current descriptive links as semantic equivalence.
