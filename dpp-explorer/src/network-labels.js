// Display-only names for the compact network. Keys refer to immutable release
// 0.1.0 entity IDs; the complete label remains on the node for evidence and ARIA.
// Overrides preserve legal article/standard identifiers and distinguish a
// programme, its document family, versioned artifacts, proposals and pilots.
// Short names do not change the research record or assert new equivalences.
export const NETWORK_LABEL_MAX = 34;
export const NETWORK_LABEL_OVERRIDES = Object.freeze({
  // Regulation and policy: keep article references or identifying instrument numbers.
  'eu-batteries-regulation': 'Batteries Reg. (EU) 2023/1542',
  'eu-battery-data-guidance': 'Battery passport data guidance',
  'eu-battery-due-diligence': 'Battery due diligence Art.48',
  'eu-battery-passport-requirement': 'Battery passport Art.77',
  'eu-business-wallet-proposal': 'EU Business Wallets proposal',
  'eu-construction-passport-requirement': 'Construction DPP Arts.22(7),75–80',
  'eu-construction-regulation': 'Construction Reg. (EU) 2024/3110',
  'eu-critical-raw-materials-act': 'Critical Raw Materials Act',
  'eu-detergent-passport-requirement': 'Detergent passport Art.21',
  'eu-detergents-regulation': 'Detergents Reg. (EU) 2026/405',
  'eu-dpp-registry': 'EU DPP Registry',
  'eu-eidas-amendment': 'EU Digital Identity 2024/1183',
  'eu-espr': 'ESPR',
  'eu-espr-art-10': 'ESPR Art.10 · requirements',
  'eu-espr-art-11': 'ESPR Art.11 · technical design',
  'eu-espr-art-12': 'ESPR Art.12 · identifiers',
  'eu-espr-art-13': 'ESPR Art.13 · registry',
  'eu-espr-art-9': 'ESPR Art.9 · product passports',
  'eu-espr-workplan': 'ESPR indicative timeline',
  'eu-gb-dpr-consultation': 'GB product records consultation',
  'eu-northern-ireland-scope': 'Northern Ireland scope statement',
  'eu-norway-espr-status': 'Norway ESPR status statement',
  'eu-packaging-regulation': 'Packaging Reg. (EU) 2025/40',
  'eu-permanent-magnet-information': 'CRMA Art.28 · magnet information',
  'eu-registry-regulation': 'EU registry rules 2026/1778',
  'eu-reusable-packaging-carrier': 'PPWR Art.12 · reusable packaging',
  'eu-toy-passport-requirement': 'Toy passport Arts.19–22',
  'eu-toy-safety-regulation': 'Toy Safety Reg. (EU) 2025/2509',
  'eu-vehicle-circularity-regulation': 'Vehicle Reg. (EU) 2026/1738',
  'eu-vehicle-passport-requirement': 'Vehicle passport Art.13',

  // Country records: retain the geography and the kind of evidence or activity.
  'global-au-circular-economy-inquiry': 'Australia circular economy inquiry',
  'global-br-pr-vehicle-pilot': 'Paraná vehicle passport pilot',
  'global-ca-credential-challenge': 'Canada credentials challenge',
  'global-cn-battery-coding': 'China Order 73 · battery coding',
  'global-cn-digital-id-art12': 'China Order 73 Art.12 · battery ID',
  'global-cn-dpp-general-project': 'China DPP requirements project',
  'global-cn-dpp-working-group': 'SAC/SWG 41 · DPP working group',
  'global-cn-order73': 'China Order 73 · battery tracing',
  'global-eg-textile-pilot-procurement': 'Egypt DPP pilot procurement',
  'global-g7-critical-minerals-roadmap': 'G7 critical minerals roadmap',
  'global-in-battery-aadhaar-draft': 'India Battery Aadhaar draft',
  'global-in-teri-battery-research': 'TERI Battery Aadhaar research',
  'global-jp-battery-platform': 'Japan battery traceability',
  'global-jp-catena-x-cfp-demo': 'Japan/Catena-X carbon demo',
  'global-jp-solar-dpp': 'Japan solar DPP demonstrations',
  'global-kr-battery-id-regime': 'Korea battery ID / history duties',
  'global-kr-busan-pilot': 'Busan battery passport pilot',
  'global-kr-disclosure-proposal': 'Korea battery disclosure proposal',
  'global-sg-sustainability-guidance': 'Singapore sustainability playbook',
  'global-unido-textile-readiness': 'UNIDO textile DPP readiness study',
  'global-us-ca-sb615': 'California SB615 · EV batteries',

  // Standards, vocabularies and programmes: use established names and identifiers.
  'std-battery-longlist-2': 'BatteryPass-Ready attributes v2.0',
  'std-battery-model-2': 'BatteryPass-Ready data model v2.0',
  'std-battery-test': 'BatteryPass-Ready test environment',
  'std-bsdd': 'buildingSMART dictionary (bSDD)',
  'std-cirpass2-aas-rdf': 'AAS/RDF interoperability report',
  'std-cirpass2-architecture': 'CIRPASS-2 D4.1 architecture',
  'std-cirpass2-ontology': 'CIRPASS-2 DPP ontology network',
  'std-cirpass2-test': 'CIRPASS-2 test environment',
  'std-dictionary-referencing': 'DPP dictionary referencing',
  'std-en-18216-2026': 'EN 18216:2026 · data exchange',
  'std-en-18219-2026': 'EN 18219:2026 · identifiers',
  'std-en-18220-2026': 'EN 18220:2026 · data carriers',
  'std-en-18221-2026': 'EN 18221:2026 · data storage',
  'std-en-18222-2026': 'EN 18222:2026 · lifecycle APIs',
  'std-en-18223-2026': 'EN 18223:2026 · interoperability',
  'std-en-18239-2026': 'EN 18239:2026 · access / security',
  'std-en-18246-2026': 'EN 18246:2026 · data integrity',
  'std-gba': 'GBA battery passport programme',
  'std-gs1-digital-link-1-7': 'GS1 Digital Link 1.7.0',
  'std-gs1-epcis-2': 'GS1 EPCIS 2.0',
  'std-idta': 'IDTA',
  'std-iec-63278-1': 'AAS · IEC 63278-1:2023',
  'std-iso-25534-1': 'ISO/IEC AWI 25534-1 · terminology',
  'std-iso-25534-2': 'ISO/IEC AWI 25534-2 · principles',
  'std-iso-jtc5': 'ISO/IEC JTC 5 · DPP',
  'std-itu-l1070': 'ITU-T L.1070 (2023)',
  'std-itu-l1071': 'ITU-T L.1071 (2024)',
  'std-oj-2026-1736': 'EU standards decision 2026/1736',
  'std-opc-30450-1': 'OPC 30450-1 · DPP model v1.0.0',
  'std-rain-dpp-001': 'RAIN-DPP-001 v1.0',

  // UNTP family identity is deliberately distinct from its versioned pilot/schema.
  'std-untp': 'UNTP',
  'std-untp-0-7': 'UNTP 0.7.0 · pilot release',
  'std-untp-dcc': 'UNTP Conformity Credential',
  'std-untp-dia': 'UNTP Digital Identity Anchor',
  'std-untp-dpp-0-8': 'UNTP DPP 0.8.0 · working schema',
  'std-untp-dpp-family': 'UNTP DPP specification family',
  'std-untp-dte': 'UNTP Digital Traceability Events',
  'std-w3c-bw-vocabulary': 'W3C business-wallet vocabulary',
  'std-w3c-did1': 'W3C Decentralized Identifiers 1.0',
  'std-w3c-dpp-bw-tf': 'W3C DPP / wallet task force',
  'std-w3c-dpp-vocabulary': 'W3C DPP vocabulary proposal',
  'std-w3c-recognized': 'W3C Recognized Entities 1.0 draft',
  'std-w3c-ucr': 'W3C DPP / wallet requirements',
  'std-w3c-vc2': 'VC Data Model 2.0',
  'std-w3c-vcwg': 'W3C VC Working Group',
  'std-webuild-blueprint': 'WE BUILD D4.1 architecture',
});

// Compact labels for records introduced by dated evidence additions.
const UPDATE_LABELS=Object.freeze({'std-w3c-dpp-committee-discussion-20260727':'W3C / JTC discussion · July 2026','std-w3c-jsonld11':'W3C JSON-LD 1.1','std-w3c-owl2':'W3C OWL 2','std-w3c-shacl':'W3C SHACL','org-anec':'ANEC','org-astm':'ASTM International','org-dtid':'DTID','org-eclass-ev':'ECLASS e.V.','org-gs1':'GS1','org-opc-federation':'OPC Federation','org-rain-alliance':'RAIN Alliance','org-sbs':'Small Business Standards',"uk-construction-products-reform-white-paper":"UK construction reform","uk-toy-safety-dpp-consultation":"GB toy DPP consultation","global-ch-thg-dpp-proposal":"Swiss DPP proposal","global-no-battery-registry-consultation":"Norway battery registry proposal","global-tw-resource-circulation-act":"Taiwan resource circulation law","global-tw-product-information-art22":"Taiwan product data · Article 22","global-tw-dpp-voluntary-pilot":"Taiwan voluntary DPP pilot"});

/** Return a compact display label without changing the node or its full label. */
export function networkLabel(node) {
  if (node && Object.hasOwn(NETWORK_LABEL_OVERRIDES, node.id)) return NETWORK_LABEL_OVERRIDES[node.id];
  if (node && Object.hasOwn(UPDATE_LABELS,node.id)) return UPDATE_LABELS[node.id];
  const normalize = value => typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
  const full = normalize(node?.label) || normalize(node?.id) || 'Unnamed record';
  const characters = [...full];
  if (characters.length <= NETWORK_LABEL_MAX) return full;
  const prefix = characters.slice(0, NETWORK_LABEL_MAX - 1).join('');
  const boundary = prefix.lastIndexOf(' ');
  const readable = boundary >= Math.floor(NETWORK_LABEL_MAX * .55) ? prefix.slice(0, boundary) : prefix;
  return readable.trimEnd() + '…';
}
