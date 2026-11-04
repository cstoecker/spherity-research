"""Strict data models; generate JSON Schema from the same models used to validate."""
from __future__ import annotations
from datetime import date as Date
from typing import Annotated, Literal, Union
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator

Id = Annotated[str, StringConstraints(pattern=r'^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$')]
Text = Annotated[str, StringConstraints(min_length=1)]
Day = Annotated[str, StringConstraints(pattern=r'^\d{4}-\d{2}-\d{2}$')]
Review = Literal['machine_assisted_unreviewed', 'human_reviewed', 'adjudicated']
EntityType = Literal['LegalInstrument','Provision','Requirement','Policy','Standard','StandardisationProject','Organisation','Committee','Initiative','Specification','Ontology','Implementation','Pilot','Report','CertificationScheme','Concept','Jurisdiction','Sector']
Predicate = Literal['applies_to','requires','part_of','amends','supersedes','depends_on','has_status','has_milestone','developed_by','targets_sector','operates_in','publishes','uses_as_input','references','normatively_references','maps_to_under_conditions','implements_version','tested_with','reports_result','aligned_with_claim','recognises_authority','cites_standard','enables']

class StrictModel(BaseModel):
    model_config = ConfigDict(extra='forbid', strict=True)

class Status(StrictModel):
    value: Annotated[str, StringConstraints(pattern=r'^[a-z][a-z0-9_]*$')]
    as_of: Day
    scope_note: Text

class EventDate(StrictModel):
    kind: Annotated[str, StringConstraints(pattern=r'^[a-z][a-z0-9_]*$')]
    date: str | None
    precision: Literal['day','month','year','conditional','unknown']
    condition: str | None
    source_ids: list[Id]

    @model_validator(mode='after')
    def accurate_precision(self):
        import re
        patterns = {'day':r'\d{4}-\d{2}-\d{2}', 'month':r'\d{4}-\d{2}', 'year':r'\d{4}'}
        if self.precision in patterns:
            if not self.date or not re.fullmatch(patterns[self.precision], self.date):
                raise ValueError('date must match stated precision')
            Date.fromisoformat(self.date + {'day':'','month':'-01','year':'-01-01'}[self.precision])
        elif self.date is not None:
            raise ValueError('conditional/unknown dates must remain null')
        if self.precision == 'conditional' and not self.condition:
            raise ValueError('conditional date needs a trigger expression')
        return self

class Geography(StrictModel):
    kind: Literal['country','territory','subnational','supranational','region','global']
    iso_alpha2: str | None
    iso_alpha3: str | None
    iso_3166_2: str | None
    map_code: Text
    parent_id: Id | None
    member_ids: list[Id]
    join_note: Text

class Entity(StrictModel):
    id: Id
    type: EntityType
    label: Text
    description: Text
    version: str | None
    jurisdiction_ids: list[Id]
    sector_ids: list[Id]
    status: Status
    dates: list[EventDate]
    source_ids: list[Id]
    evidence_status: Literal['dossier_extracted','primary_rechecked','research_defined']
    review_status: Review
    limitations: list[str]
    geography: Geography | None = None

class EntityObject(StrictModel):
    entity_id: Id

class LiteralObject(StrictModel):
    value: str | bool | int | float
    datatype: Literal['string','date','boolean','number']

    @model_validator(mode='after')
    def literal_type(self):
        if self.datatype in ('string','date') and not isinstance(self.value, str):
            raise ValueError('string/date requires string')
        if self.datatype == 'date': Date.fromisoformat(self.value)
        if self.datatype == 'boolean' and type(self.value) is not bool:
            raise ValueError('boolean requires boolean')
        if self.datatype == 'number' and (type(self.value) not in (int,float)):
            raise ValueError('number requires number')
        return self

class Interoperability(StrictModel):
    dimensions: list[Text] = Field(min_length=1)
    operation: Text
    systems: list[Text] = Field(min_length=1)
    result: Literal['reported_success','pass','partial','fail','inconclusive','not_tested']
    independence: Literal['self_report','consortium_report','external_report','independently_reproduced']
    test_date: Day | None
    limitations: list[str]

class Assertion(StrictModel):
    id: Id
    subject: Id
    predicate: Predicate
    object: Union[EntityObject, LiteralObject]
    statement: Text
    source_ids: list[Id] = Field(min_length=1)
    locator: Text
    assertion_type: Literal['source_statement','research_classification','reported_result']
    evidence_type: Literal['legal_text','official_guidance','standard_catalogue','specification','project_report','announcement','analysis']
    review_status: Review
    observed_at: Day
    valid_from: Day | None
    valid_to: Day | None
    limitations: list[str]
    interoperability: Interoperability | None = None

class Source(StrictModel):
    id: Id
    url: Annotated[str, StringConstraints(pattern=r'^https?://[^\s]+$')]
    title: Text
    publisher: Text
    source_type: Literal['legal_text','public_authority','standards_body','project_primary','academic','industry_primary','secondary']
    language: Text
    access_status: Literal['dossier_only','opened','search_snippet','unavailable']
    retrieved_at: Day | None
    dossier_files: list[str]
    limitations: list[str]

    @model_validator(mode='after')
    def retrieval_record(self):
        if self.access_status == 'opened' and self.retrieved_at is None:
            raise ValueError('opened source needs actual retrieval date')
        if self.access_status == 'dossier_only' and self.retrieved_at is not None:
            raise ValueError('dossier-only source cannot claim a new retrieval')
        return self

class Metadata(StrictModel):
    title: Text
    version: Annotated[str, StringConstraints(pattern=r'^\d+\.\d+\.\d+$')]
    schema_version: Text
    protocol_version: Text
    release_date: Day
    evidence_cutoff: Day
    namespace: Text
    release_status: Literal['research_seed','reviewed_release']
    review_status: Review
    coverage_statement: Text
    rights_statement: Text
    limitations: list[str]

class Dataset(StrictModel):
    metadata: Metadata
    entities: list[Entity]
    assertions: list[Assertion]
    sources: list[Source]

def schema():
    doc = Dataset.model_json_schema()
    doc['$schema'] = 'https://json-schema.org/draft/2020-12/schema'
    doc['$id'] = 'urn:spherity:dpp-atlas:schema:0.1.0'
    doc['title'] = 'Global DPP Atlas dataset schema 0.1.0'
    doc['description'] = 'Structural schema. Referential, temporal and evidence constraints are additionally enforced by validate.py.'
    return doc
