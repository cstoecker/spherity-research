// A dated research overlay. It does not modify release 0.1.0 or add graph edges.
const freeze = value => { if(value && typeof value === 'object'){Object.values(value).forEach(freeze);Object.freeze(value);} return value; };
export const SEMANTIC_REVIEW = freeze({version:'0.1.0-semantics.1',checkedAt:'2026-10-25',status:'Primary-source assessment · independent review pending'});
export const SEMANTIC_PROFILES = freeze({
  'std-eclass': {
    summary:'Closed checks: ECLASS TS111 closes specific RDF validation shapes. Use licence: vocabulary reuse follows ECLASS terms, with free, paid and exempt cases. Neither means all ECLASS reasoning is closed-world.',
    badges:[
      {id:'closed-validation',label:'Closed checks',symbol:'□',tone:'validation',description:'Specific ECLASS RDF instance-validation shapes restrict additional properties and aspects.'},
      {id:'use-licence',label:'Use licence',symbol:'§',tone:'licensed',description:'ECLASS vocabulary use is governed by publisher terms; conditions depend on the use case.'}
    ],
    findings:[
      {dimension:'Validation',title:'Closed shapes in a specific profile',basis:'Direct source statement',text:'TS111 v1.0, section 5.1, sets sh:closed true for Application Class and Aspect shapes. Polymorphic Blocks use permitted-property checks. This is a local validation boundary, not a claim that every ECLASS application assumes all missing facts are false.',sourceIds:['eclass-ts111','shacl']},
      {dimension:'Vocabulary reuse',title:'Publisher licence terms apply',basis:'Direct source statement',text:'ECLASS content has its own use terms. The publisher distinguishes paid and free licences; its terms also specify exceptions. The marker does not mean that every reference to an ECLASS identifier requires payment.',sourceIds:['eclass-terms','eclass-terms-pdf']},
      {dimension:'Representation',title:'RDF and closed validation can coexist',basis:'Direct source statement',text:'ECLASS also specifies an RDF/OWL representation. TS110 permits extensions to most value lists, subject to stated exceptions. A governed dictionary, an RDF representation, closed validation and licensing are separate properties.',sourceIds:['eclass-ts110']}
    ],
    limits:'The release node has no ECLASS version pinned. These markers describe the named TS110/TS111 specifications and current publisher terms, not every historical release or implementation. No licensing conclusion is propagated to AAS or to connected records.',
    sources:[
      {id:'eclass-ts111',title:'ECLASS TS111 v1.0 — RDF Part 2: validation',url:'https://eclass.eu/fileadmin/Redaktion/Bilder/Wiki-Inhalte/Covers_Technical_Specifications/ECLASS-Technical-Specification-111_RDF_Spec_Part_2_V1.0.0.pdf#page=36',locator:'31 March 2025 · §5.1, printed pp. 35–36'},
      {id:'shacl',title:'W3C SHACL — closed constraint',url:'https://www.w3.org/TR/shacl/#ClosedConstraintComponent',locator:'ClosedConstraintComponent; closure must be explicitly specified'},
      {id:'eclass-terms',title:'ECLASS — current Terms of Use',url:'https://eclass.eu/en/eclass-standard/terms-of-use',locator:'Live publisher page checked 25 October 2026'},
      {id:'eclass-terms-pdf',title:'ECLASS Terms of Use v4.3',url:'https://eclass.eu/fileadmin/Redaktion/pdf-Dateien/Sonstige_Dateien/ECLASS_terms-of-use_4-3.pdf',locator:'22 March 2022 · §§3–4; linked from the current terms page'},
      {id:'eclass-ts110',title:'ECLASS TS110 v1.0 — RDF Part 1',url:'https://eclass.eu/fileadmin/Redaktion/pdf-Dateien/Wiki/ECLASS-Technical-Specification-110_RDF_Spec_Part_1_V1.0.0.pdf#page=56',locator:'22 April 2024 · §6.7.4, printed p. 55'}
    ]
  },
  'std-w3c-vc2': {
    summary:'Open world: VC 2.0 explicitly describes an open-world extensibility model. Verifiers can still apply schemas and acceptance rules. This badge is about the data model, not unrestricted reuse or disclosure.',
    badges:[{id:'open-world',label:'Open world',symbol:'∞',tone:'open',description:'VC 2.0 explicitly supports an open-world model for extending graphs and vocabularies.'}],
    findings:[
      {dimension:'Data model',title:'Open-world extensibility',basis:'Direct source statement',text:'VC 2.0 section 5.2 explicitly describes an open-world assumption for extending graphs and vocabularies. Additional information can be supplied by different parties. This applies to the credential data model, not to every W3C group or standard.',sourceIds:['vc2-extensibility']},
      {dimension:'Validation',title:'Schemas and acceptance rules remain possible',basis:'Direct source statement',text:'Section 4.11 supports credential schemas. An open-world model does not oblige a verifier to accept every extension or replace application-specific validation.',sourceIds:['vc2-schemas']},
      {dimension:'Reuse',title:'No licence badge assigned',basis:'Not assessed in this overlay',text:'Open-world describes information modeling, not the licence for every vocabulary used in a credential or access rights to its evidence.',sourceIds:[]}
    ],
    limits:'Specific to the VC Data Model 2.0 Recommendation. No badge is inherited by a task force, an application, UNTP release, or another connected record merely because it uses or discusses credentials.',
    sources:[
      {id:'vc2-extensibility',title:'W3C VC Data Model 2.0 — extensibility',url:'https://www.w3.org/TR/2025/REC-vc-data-model-2.0-20250515/#extensibility',locator:'15 May 2025 Recommendation · §5.2'},
      {id:'vc2-schemas',title:'W3C VC Data Model 2.0 — data schemas',url:'https://www.w3.org/TR/2025/REC-vc-data-model-2.0-20250515/#data-schemas',locator:'15 May 2025 Recommendation · §4.11'}
    ]
  },
  'std-cirpass2-ontology': {
    summary:'Open world: interpreted from the documented OWL ontology basis. Closed checks: some battery validation profiles constrain values with finite lists. These layers coexist; the marks do not imply all shapes or imported vocabularies share the same constraints or licence.',
    badges:[
      {id:'open-world',label:'Open world',symbol:'∞',tone:'open',description:'Assessment inferred from the documented OWL ontology basis; separate validation profiles can be stricter.'},
      {id:'closed-validation',label:'Closed lists',symbol:'□',tone:'validation',description:'Documented battery-sector SHACL profiles include finite allowed-value lists; not a claim that every network shape is closed.'}
    ],
    findings:[
      {dimension:'Ontology',title:'Open-world ontology basis',basis:'Inference from documented OWL use',text:'The project documents OWL ontology modules and imports. OWL uses an open-world assumption: an unrecorded fact need not be false. The badge applies to that modeling basis; it is not an interoperability or deployment test.',sourceIds:['cirpass-docs','cirpass-battery','owl-primer']},
      {dimension:'Validation',title:'Selected profiles close permitted values',basis:'Direct source statement',text:'Battery modeling conventions separate OWL definitions from SHACL constraints and describe closed value lists using sh:in. These constraints apply to selected validation profiles, not all properties or every ontology in the network.',sourceIds:['cirpass-battery']},
      {dimension:'Reuse',title:'Check each component’s licence',basis:'Limited repository observation',text:'The inspected publisher repositories display Apache-2.0. This does not establish the reuse terms of every imported vocabulary, so no network-wide licence badge is assigned.',sourceIds:['cirpass-docs','cirpass-battery']}
    ],
    limits:'Unversioned, exploratory ontology network. Publisher repository documentation was inspected on 25 October 2026; the hosted documentation was unavailable. This assessment does not retroactively qualify every artifact in the frozen seed.',
    sources:[
      {id:'cirpass-docs',title:'CIRPASS-2 — published ontology documentation source',url:'https://github.com/CIRPASS-2/ontologies-docs/blob/main/index.html',locator:'Ontology versus application-profile/SHACL responsibilities; live main branch'},
      {id:'cirpass-battery',title:'CIRPASS-2 battery ontology — modeling conventions',url:'https://github.com/CIRPASS-2/ontologies-battery#modelling-conventions',locator:'OWL definitions, SHACL validation and sh:in value lists; live main branch'},
      {id:'owl-primer',title:'W3C OWL 2 Primer — open-world assumption',url:'https://www.w3.org/TR/owl2-primer/#What_is_OWL_2.3F',locator:'11 December 2012 Recommendation · §2'}
    ]
  }
});
const EMPTY = Object.freeze([]);
export function semanticProfile(id){return Object.hasOwn(SEMANTIC_PROFILES,id)?SEMANTIC_PROFILES[id]:null;}
export function semanticBadges(id){return semanticProfile(id)?.badges||EMPTY;}
export function semanticSummary(id){return semanticProfile(id)?.summary||'';}
