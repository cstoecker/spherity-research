# Initial atlas data contract

This working contract governs the first dataset release. The release schema and protocol will be the authoritative definitions.

Create one JSON object with `entities`, `assertions` and `sources` arrays. Use unique lowercase kebab-case IDs. Agent record prefixes are `eu`, `global` and `std`; shared jurisdiction IDs use `jur-` and sectors use `sec-`.

Shared jurisdiction IDs: jur-eu, jur-gb, jur-gb-nir, jur-no, jur-cn, jur-vn, jur-kr, jur-in, jur-jp, jur-ca, jur-us, jur-us-ca, jur-au, jur-sg, jur-br, jur-br-pr, jur-eg, jur-bd, jur-nz, jur-tr, jur-ch, jur-de, jur-global. Root defines these. Do not treat jur-global as a lawmaking jurisdiction.

Additional shared scopes used in this extraction: jur-gb-gbn (Great Britain, distinct from jur-gb for the United Kingdom), jur-kr-26 (Busan) and jur-europe (regional standards scope). Root supplies the remaining EU member-country joins. Geographic records carry the additional `geography` object defined in the generated schema.

Shared sectors: sec-cross-sector, sec-batteries, sec-textiles, sec-construction, sec-toys, sec-detergents, sec-vehicles, sec-packaging, sec-critical-materials, sec-electronics, sec-tyres, sec-energy. Root defines these. Ask root before introducing another shared ID.

Additional sector categories used in this extraction: sec-plastics and sec-solar-pv. Root-defined sectors, concepts and geographic joins may use `research_defined` evidence status and empty source lists when they are explicitly analytical constructs, rather than sourced substantive claims.

## Entities

Required fields: `id`, `type`, `label`, `description`, `version` (string or null), `jurisdiction_ids` (array), `sector_ids` (array), `status` (object with `value`, `as_of` and `scope_note`), `dates` (array), `source_ids` (array), `evidence_status`, `review_status`, `limitations` (array).

Types: LegalInstrument, Provision, Requirement, Policy, Standard, StandardisationProject, Organisation, Committee, Initiative, Specification, Ontology, Implementation, Pilot, Report, CertificationScheme, Concept, Jurisdiction, Sector.

Use concise snake_case status values appropriate to the type. Do not equate technical publication with a legal mandate. Each date has `kind`, `date` (ISO YYYY-MM-DD, YYYY-MM or YYYY, or null), `precision` (day, month, year, conditional, unknown), `condition` (string or null), `source_ids` (array). Dates must retain their type: adopted, published, entered_into_force, applies_from, available, cited_in_oj, planned, started, ends etc. Null dates with a condition are preferable to invented deadlines.

`evidence_status`: dossier_extracted or primary_rechecked. `review_status`: machine_assisted_unreviewed, human_reviewed or adjudicated. Use machine_assisted_unreviewed throughout this seed unless an actual named human has reviewed it. A subagent is not an independent human reviewer.

Entity `jurisdiction_ids` identify territorial scope or explicitly stated programme geography, not headquarters or presumed participant locations. Keep global initiatives global unless a supported narrower relationship is recorded. Describe scope limits.

## Assertions

Required fields: `id`, `subject`, `predicate`, `object`, `statement`, `source_ids`, `locator`, `assertion_type`, `evidence_type`, `review_status`, `observed_at`, `valid_from`, `valid_to`, `limitations`.

Object is either `{ "entity_id": "..." }` or `{ "value": "...", "datatype": "string" }`. Other literal datatypes permitted: date, boolean, number.

Predicates: applies_to, requires, part_of, amends, supersedes, depends_on, has_status, has_milestone, developed_by, targets_sector, operates_in, publishes, uses_as_input, references, normatively_references, maps_to_under_conditions, implements_version, tested_with, reports_result, aligned_with_claim, recognises_authority, cites_standard, enables.

`assertion_type`: source_statement, research_classification, reported_result. `evidence_type`: legal_text, official_guidance, standard_catalogue, specification, project_report, announcement, analysis. `observed_at` is the research observation date; `valid_from` and `valid_to` are ISO day or null and must not be inferred from observation dates.

Include an optional `interoperability` object only for a bounded interoperability claim: `dimensions` (array), `operation`, `systems` (array of strings identifying available versions or explicitly unspecified), `result` (reported_success, pass, partial, fail, inconclusive, not_tested), `independence` (self_report, consortium_report, external_report, independently_reproduced), `test_date` (ISO date or null), `limitations` (array). No fabricated tests. Publication or alignment announcements are not test results.

## Sources

Required fields: `id`, `url`, `title`, `publisher`, `source_type`, `language`, `access_status`, `retrieved_at`, `dossier_files`, `limitations`.

Source types: legal_text, public_authority, standards_body, project_primary, academic, industry_primary, secondary. Access status: dossier_only, opened, search_snippet, unavailable. `retrieved_at` is an ISO day for material actually opened this turn, otherwise null. Language may be und if not established. `dossier_files` are filenames from the existing evidence dossier. Do not mark material as opened just because its URL appears in the dossier. Keep sources linked at each substantive entity and assertion.

Initial release date and evidence cut-off: 2026-10-23. Separate high-impact checks made this turn from inherited dossier evidence. Use source locators and limits rather than copying source text.
