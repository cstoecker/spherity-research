# Global DPP Atlas release 0.1.0

Evidence cut-off: 2026-10-23. Initial research seed; all claims await human review.

203 entities, 224 assertions and 112 source records (112 distinct URLs).

- dataset.json is the canonical exchange file; dataset.schema.json defines its structure.
- dataset.jsonld retains qualified claims and source provenance.
- views/world-map.json supplies geographic joins and multiple records per jurisdiction.
- views/graph.json supplies nodes and qualified/derived edges.
- views/standards.json includes initiatives, specifications and citation links.
- views/timeline.json preserves conditional dates.
- tables/ contains CSV exports; figure-inputs.json indexes reproducible figure data.
- competency-questions.json contains actual query outputs, not independent human answer validation.
- screening-log.json retains pending source candidates.
- validation-report.json records computational checks only.
- manifest.json and checksums.sha256 identify exact bytes.

No website, DOI, legal review or ecosystem conformance certification is implied. See the protocol and schema notes for interpretation. Boundary geometry is supplied separately when the map is built.
