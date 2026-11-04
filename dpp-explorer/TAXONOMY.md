# Explorer taxonomy for release 0.1.0

**UI overlay version:** `0.1.0-ui.1`  
**Research release:** `0.1.0`  
**Observation date:** 23 October 2026

The overlay in `src/data/ecosystems.json` supplies 20 named navigation groups: 10 standards groups and 10 DPP ecosystem groups. It references existing release entities and sources. It does not modify the frozen research release or add legal assertions to it.

## Meaning of a filter

Every group has `membership_basis: editorial_filter`. Membership means the entity is relevant to exploring that topic. It does not claim organisational membership, conformance, equivalence, interoperability, endorsement or legal applicability. Each record's own type, status, scope, limitations and evidence remain authoritative for interpreting it.

The two filter families provide different entry points. Standards groups include formal standards bodies, committees and specifications, plus a clearly identified comparison group of semantic dictionaries. DPP groups include implementation programmes, projects and supporting guidance. They are research-navigation families rather than a legal classification of organisations.

Overlaps are intentional:

- IDTA and DPP4.0 appear under both the AAS standards topic and the DPP4.0 implementation topic.
- The CIRPASS-2 AAS/RDF report appears under both AAS and CIRPASS-2.
- The bounded Japan–Catena-X carbon-footprint demonstration appears under both Catena-X and Ouranos.

These shared records should be de-duplicated by entity ID in results and counts. Filter combinations should not create implied new edges between all members. A group-level source list explains the navigation context; claim-level evidence still comes from the clicked entity and its assertions.

## Available groups

| Family | Groups |
|---|---|
| Standards | AAS / IDTA; W3C; CEN-CENELEC / JTC 24; ISO/IEC JTC 5; China / SAC SWG 41; GS1; ITU-T; OPC Foundation; semantic dictionaries; UNECE / UN/CEFACT |
| DPP ecosystems | CIRPASS-2; Global Battery Alliance; UNTP; RAIN RFID; Battery Pass / BatteryPass-Ready; Catena-X; WE BUILD; Ouranos / Japan battery platform; IDTA DPP4.0; Manufacturing-X |

The label **CEN-CENELEC** uses the bodies' proper name. **JTC 24** and **ISO/IEC JTC 5** remain different committees. The China group contains the national working group and a standards project; it does not add China's battery law to a standards category. RAIN currently has one non-normative guidance record in the seed, so the filter must not suggest a comprehensive deployment inventory.

## Geographic associations

The frozen dataset already records geographic scope for initiatives. W3C, ISO/IEC JTC 5, UNTP, GBA, GS1, ITU, OPC and RAIN remain global. CEN-CENELEC has a European scope. China and Japan records retain their recorded national associations. EU programme scope is not a list of every pilot location or a claim of a national mandate.

The overlay adds only two associations for the requested AAS-in-Germany exploration:

| Entity | Association | Basis and limit |
|---|---|---|
| Industrial Digital Twin Association | Germany — organisation base | IDTA gives a Frankfurt am Main address on its own DPP4.0 page. Its international activities remain global. |
| IDTA DPP4.0 | Germany — ecosystem activity | Editorial geographic association through the organisation presenting the initiative; not an independently verified deployment location. |

The [primary IDTA DPP4.0 page](https://industrialdigitaltwin.org/dpp4-0) was reopened on 23 October 2026. It describes the AAS basis, identifies IEC 63278 as an international standard, and provides IDTA's Frankfurt address. The separate imprint page appeared in search results, but direct retrieval timed out, so it is not the overlay's evidentiary link.

The IEC 63278 standard itself is not reassigned to Germany. Selecting Germany with AAS therefore exposes the documented organisation/activity associations while preserving the standard's international scope. The interface should label these as **organisation base** or **ecosystem activity**, visually distinguish them from legal scope, and expose the note and source on click.

This overlay does not assert that all global initiatives operate in every country. It must not expand a global scope into country-by-country participation, infer an address for W3C or JTC 5, or use organisation headquarters as a proxy for the jurisdiction of a standard.

## Integration and maintenance

1. Load the immutable release and verify `dataset_version` against it.
2. Validate every `entity_ids`, `source_ids`, `entity_id` and `jurisdiction_id` reference before rendering.
3. Keep editorial group membership separate from qualified research assertions in graph and evidence views.
4. When geographic filtering is enabled, combine the release's associations with the explicitly labelled overlay associations; do not overwrite original scope.
5. Treat an empty result as no matching record in this release, never as proof of no activity or no regulation.
6. Update the overlay version when memberships or associations change. A future research release can incorporate reviewed geographic assertions through its normal protocol.

All release evidence remains machine-assisted and awaiting qualified human review. This navigation layer does not improve that review status. Existing source-access limitations and reported-interoperability boundaries remain visible in the underlying records.
