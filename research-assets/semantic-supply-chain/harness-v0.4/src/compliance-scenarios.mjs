// SPDX-License-Identifier: Apache-2.0
// WE-7: compliance evidence, scenario by scenario (H15). Regime A (full disclosure of the
// sufficient key-claim set) and regime B (commit-and-certify), the twelve negative tests, and the
// selective-disclosure counterexample. Each scenario states the outcome the theory predicts.
// SYNTHETIC: parties, identifiers, methods and limits are illustrative.

import { acceptCertificate, certify, Custodian, DECISION_CLASS, dictionaryTest, disputeReport, evaluate, KEY_CLAIMS, POLICY_V1, POLICY_V2, SelectionLog } from "./compliance.mjs";
import { digest } from "./crypto.mjs";
import { newParty, signObject, verifyObject } from "./signed.mjs";

export async function complianceScenarios() {
  const p = Object.fromEntries(["importer", "manufacturer", "lab", "forger", "status", "accreditationBody", "authority", "certifier", "tsa", "custodian", "logOperator"].map((n) => [n, newParty(n)]));
  const T = 100; // certification and decision time (days)
  const PRODUCT = "urn:gtin:04012345000017";
  const record = (batch) => signObject(p.manufacturer, { type: "ProductRecord", id: `urn:product-record:PB-100:${batch}`, product: PRODUCT, batch, chemistry: "Li-ion", manufacturer: "did:example:manufacturer-7" });
  const report = (id, batch, date, results, method = "M-XRF-3", by = p.lab) => signObject(by, { type: "TestReport", id, product: PRODUCT, batch, date, method, sample: "5 units", results });
  const absence = (reportId, batch) => signObject(p.lab, { type: "AbsenceAttestation", id: `${reportId}:absence`, report: reportId, product: PRODUCT, batch, substances: ["Hg", "Cd", "Pb"], method: "M-XRF-3", statement: "no result above the limit, for the tested sample and substances" });
  // Laboratory source: every report it issued, per batch (the authoritative population).
  const labReports = {
    B7: [report("urn:report:lab1:2026-0412", "B7", 80, { Hg: 0.5, Cd: 3, Pb: 35 }), report("urn:report:lab1:2026-0533", "B7", 95, { Hg: 0.4, Cd: 2, Pb: 160 })], // later failed retest
    B8: [report("urn:report:lab1:2026-0501", "B8", 90, { Hg: 0.2, Cd: 1, Pb: 60 })],
    B9: [report("urn:report:lab1:2026-0520", "B9", 92, { Hg: 0.1, Cd: 1, Pb: 10 }, "M-ICP-9")] // method outside the accreditation
  };
  const lab = {
    completeList: (batch, issuedAt = T) => signObject(p.lab, { type: "CompleteListResponse", product: PRODUCT, batch, reports: labReports[batch].map((r) => r.body.id), complete: true, issuedAt }),
    fetch: (ids) => Object.values(labReports).flat().filter((r) => ids.includes(r.body.id))
  };
  const statusOf = (overrides = {}, issuedAt = T) => signObject(p.status, { type: "StatusSnapshot", issuedAt, entries: { ...Object.fromEntries(Object.values(labReports).flat().map((r) => [r.body.id, "current"])), ...overrides } });
  const accreditation = signObject(p.accreditationBody, { type: "AccreditationList", labs: { [p.lab.id]: { methods: ["M-XRF-3"], validFrom: 0, validUntil: 365 } } });
  const profile = signObject(p.authority, { type: "CoverageProfile", id: "urn:profile:battery-release/1", decision: DECISION_CLASS, keyClaims: KEY_CLAIMS, sources: { testReports: p.lab.id, status: p.status.id }, maxCoverageAge: 2, absence: ["AbsenceAttestation"] });
  if (!verifyObject(profile, p.authority) || !verifyObject(accreditation, p.accreditationBody)) throw new Error("setup: profile or accreditation not authentic");
  const declaration = (consignmentId, batch, testReport) => signObject(p.importer, { consignmentId, hsCode: "8507.60", declaredValue: "EUR 140", product: `urn:product-record:PB-100:${batch}`, batch, manufacturer: "did:example:manufacturer-7", chemistry: "Li-ion", testReport, conformityDeclaration: `urn:doc:PB-100:${batch}` });
  const ctx = (extra = {}) => ({ parties: { importer: p.importer, manufacturer: p.manufacturer, lab: p.lab, status: p.status }, accreditation, profile: profile.body, time: T, ...extra });
  // What the holder supplies, and what the verifier obtains itself from the profile's sources (regime A).
  const holderEvidence = (consignmentId, batch, testReport, supplied) => ({
    declaration: declaration(consignmentId, batch, testReport),
    statements: new Map([[`urn:product-record:PB-100:${batch}`, record(batch)], ...supplied.map((s) => [s.body.id, s])])
  });
  const withCoverage = (ev, batch, { listAt = T, statusOverrides = {} } = {}) => {
    const completeList = lab.completeList(batch, listAt);
    const statements = new Map(ev.statements);
    for (const r of lab.fetch(completeList.body.reports)) if (!statements.has(r.body.id)) statements.set(r.body.id, r); // obtained from the source, not the holder
    return { ...ev, statements, coverage: { completeList, status: statusOf(statusOverrides) } };
  };
  const R = { B7a: labReports.B7[0], B7b: labReports.B7[1], B8: labReports.B8[0], B9: labReports.B9[0] };
  const evB8 = holderEvidence("urn:consignment:C2", "B8", R.B8.body.id, [R.B8, absence(R.B8.body.id, "B8")]);
  const evB7 = holderEvidence("urn:consignment:C1", "B7", R.B7a.body.id, [R.B7a, absence(R.B7a.body.id, "B7")]); // holder omits the failed retest

  const rows = [];
  const run = async (id, regime, name, expected, fn) => {
    let actual, detail;
    try { ({ actual, detail } = await fn()); } catch (error) { actual = "error"; detail = error.message; }
    rows.push({ id, regime, name, expected, actual, detail, ok: actual === expected });
  };
  const decide = (policy, ev, extra) => { const r = evaluate(policy, ev, ctx(extra)); return { actual: r.outcome, detail: r.reason }; };

  // ---- regime A: full disclosure of K, the relying party evaluates once -------------------
  await run("A1", "A", "batch B8, sufficient key claims, coverage contract applied", "GRANT", () => decide(POLICY_V1, withCoverage(evB8, "B8")));
  await run("A2", "A", "N1: holder omits the failed retest of batch B7; coverage obtains it from the laboratory", "DENY", () => decide(POLICY_V1, withCoverage(evB7, "B7")));
  await run("A3", "A", "N1: same omission, no coverage (holder-supplied evidence only)", "GRANT", () => decide(POLICY_V1, { ...evB7, coverage: { status: statusOf() } }, { mode: "holder-only" }));
  await run("A4", "A", "N2: complete-list response older than the profile's maximum age", "UNKNOWN", () => decide(POLICY_V1, withCoverage(evB8, "B8", { listAt: T - 10 })));
  await run("A5", "A", "N3: test report re-signed by an unaccredited key (source validation)", "UNKNOWN", () => {
    const ev = withCoverage(evB8, "B8");
    ev.statements.set(R.B8.body.id, report(R.B8.body.id, "B8", 90, { Hg: 0.2, Cd: 1, Pb: 60 }, "M-XRF-3", p.forger));
    return decide(POLICY_V1, ev);
  });
  await run("A6", "A", "N4: test method outside the laboratory's accreditation", "UNKNOWN", () => decide(POLICY_V1, withCoverage(holderEvidence("urn:consignment:C3", "B9", R.B9.body.id, [R.B9, absence(R.B9.body.id, "B9")]), "B9")));
  await run("A7", "A", "N5: the declared test report is revoked at the status service", "DENY", () => decide(POLICY_V1, withCoverage(evB8, "B8", { statusOverrides: { [R.B8.body.id]: "revoked" } })));
  await run("A8", "A", "declaration outside the closed key-claim profile (an extra claim)", "UNKNOWN", () => {
    const ev = withCoverage(evB8, "B8");
    ev.declaration = signObject(p.importer, { ...ev.declaration.body, note: "extra" });
    return decide(POLICY_V1, ev);
  });

  // ---- regime B: commit-and-certify -----------------------------------------------------------
  const custodian = new Custodian(p.custodian);
  const certifiers = new Map([[p.certifier.id, { party: p.certifier, decisionClasses: [DECISION_CLASS] }]]);
  const statusService = { entries: new Map() };
  const log = new SelectionLog(p.logOperator);
  const scopeFor = (batch) => ({ subject: `${PRODUCT}#${batch}`, action: DECISION_CLASS, purpose: "import-control", audience: "customs:authority-DE", validFrom: T, validUntil: T + 30 });
  const requestFor = (batch, extra = {}) => ({ subject: `${PRODUCT}#${batch}`, action: DECISION_CLASS, purpose: "import-control", audience: "customs:authority-DE", time: T + 1, ...extra });
  const issue = async (certificateId, policy, ev, batch, { mode = "contract" } = {}) => {
    const covered = mode === "contract" ? withCoverage(ev, batch) : { ...ev, coverage: { status: statusOf() } };
    const out = await certify({ certifier: p.certifier, tsa: p.tsa, custodian, policy, ev: { declaration: covered.declaration, statements: covered.statements }, coverage: covered.coverage, ctx: ctx({ mode }), scope: scopeFor(batch), certificateId, authorization: "urn:accreditation:certifier-7" });
    if (out.ok) statusService.entries.set(out.certificate.signed.body.statusEntry, "current");
    return out;
  };
  const accept = (cert, batch, extra = {}) => {
    const r = acceptCertificate(cert, { request: requestFor(batch, extra.request), certifiers, tsa: p.tsa, custodian, statusService, currentPolicy: extra.policy ?? POLICY_V1, selectionLog: log, epoch: 1 });
    return { actual: r.accepted ? (r.authorises ? "accepted, authorises" : `accepted, ${r.outcome}`) : "rejected", detail: r.reason ?? `certificate outcome ${r.outcome}` };
  };
  const policies = new Map([[POLICY_V1.digest, POLICY_V1], [POLICY_V2.digest, POLICY_V2]]);
  const c1 = await issue("urn:cert:0001", POLICY_V1, evB8, "B8");
  log.select(`${PRODUCT}#B8`, 1, "urn:cert:0001");
  await run("B1", "B", "certificate for batch B8, presented for the same scope", "accepted, authorises", () => accept(c1.certificate, "B8"));
  await run("B2", "B", "dispute: open the archive, recompute the commitment, replay", "opening valid, outcome equal", async () => {
    const d = await disputeReport(c1.certificate, { custodian, certifiers, ctx: ctx(), policies });
    return { actual: `opening ${d.opening}, outcome ${d.outcomeEqual ? "equal" : "different"}`, detail: d.note };
  });
  await run("B3", "B", "N1: certifier without the coverage contract certifies the omission; replay agrees", "certified GRANT, replay matches", async () => {
    const c = await issue("urn:cert:0002", POLICY_V1, evB7, "B7", { mode: "holder-only" });
    const d = await disputeReport(c.certificate, { custodian, certifiers, ctx: ctx({ mode: "holder-only" }), policies });
    return { actual: `certified ${c.certificate.signed.body.outcome}, replay ${d.outcomeEqual ? "matches" : "differs"}`, detail: "replay cannot reveal evidence that was never in the graph" };
  });
  await run("B4", "B", "with the coverage contract the same batch is not certifiable as compliant", "DENY certified", async () => {
    const c = await issue("urn:cert:0003", POLICY_V1, evB7, "B7");
    return { actual: `${c.certificate.signed.body.outcome} certified`, detail: c.result.reason };
  });
  await run("B5", "B", "N6: certificate for batch B8 presented for batch B7 (scope substitution)", "rejected", () => accept(c1.certificate, "B7"));
  await run("B6", "B", "N7: policy-only correction (v1 to v2, closure unchanged): current reliance suspended", "rejected", () => accept(c1.certificate, "B8", { policy: POLICY_V2 }));
  await run("B7", "B", "N7: re-evaluation under policy v2 (stricter lead limit)", "DENY", async () => {
    const r = evaluate(POLICY_V2, withCoverage(evB8, "B8"), ctx());
    return { actual: r.outcome, detail: r.reason };
  });
  await run("B8", "B", "N10: a second certificate for the same scope and epoch", "rejected", async () => {
    const c = await issue("urn:cert:0004", POLICY_V1, evB8, "B8");
    return accept(c.certificate, "B8");
  });
  await run("B9", "B", "certificate revoked at its status entry", "rejected", async () => {
    const c = await issue("urn:cert:0005", POLICY_V1, evB8, "B8");
    log.select(`${PRODUCT}#B8`, 2, "urn:cert:0005");
    statusService.entries.set(c.certificate.signed.body.statusEntry, "revoked");
    const r = acceptCertificate(c.certificate, { request: requestFor("B8"), certifiers, tsa: p.tsa, custodian, statusService, currentPolicy: POLICY_V1, selectionLog: log, epoch: 2 });
    return { actual: r.accepted ? "accepted" : "rejected", detail: r.reason };
  });
  await run("B10", "B", "certificate core altered after timestamping", "rejected", () => {
    const forged = structuredClone(c1.certificate);
    forged.signed.body.scope.validUntil = T + 400;
    return accept(forged, "B8");
  });
  await run("B11", "B", "N9: archived evidence altered at the custodian", "opening invalid", async () => {
    const c = await issue("urn:cert:0006", POLICY_V1, evB8, "B8");
    custodian.tamper("urn:cert:0006", (a) => { const r = a.evidence.statements.get(R.B8.body.id); r.body.results.Pb = 20; });
    const d = await disputeReport(c.certificate, { custodian, certifiers, ctx: ctx(), policies });
    return { actual: `opening ${d.opening}`, detail: `${d.detail}; attribution: ${d.attribution}` };
  });
  await run("B12", "B", "N8: custodian loses the archive key", "opening unavailable", async () => {
    const lost = new Custodian(p.custodian);
    const c = await certify({ certifier: p.certifier, tsa: p.tsa, custodian: lost, policy: POLICY_V1, ev: { declaration: evB8.declaration, statements: withCoverage(evB8, "B8").statements }, coverage: withCoverage(evB8, "B8").coverage, ctx: ctx(), scope: scopeFor("B8"), certificateId: "urn:cert:0007", authorization: "urn:accreditation:certifier-7" });
    lost.loseKey();
    const d = await disputeReport(c.certificate, { custodian: lost, certifiers, ctx: ctx(), policies });
    return { actual: `opening ${d.opening}`, detail: `${d.detail}; attribution: ${d.attribution}` };
  });
  await run("B13", "B", "N11: dictionary over two candidate graphs (R3-12): plain digest vs salted binding", "plain identifies, salted 0", async () => {
    const alt = holderEvidence("urn:consignment:C2", "B8", R.B8.body.id, [report(R.B8.body.id, "B8", 90, { Hg: 0.2, Cd: 1, Pb: 59 }), absence(R.B8.body.id, "B8")]);
    const r = await dictionaryTest([evB8, alt], evB8, withCoverage(evB8, "B8").coverage, { time: T });
    return { actual: `plain ${r.plainDigestIdentifiesGraph ? "identifies" : "does not identify"}, salted ${r.saltedBindingMatches}`, detail: `${r.candidates} candidates` };
  });

  // ---- selective disclosure: the counterexample and the indistinguishable worlds (T19.1, T19.2) ----
  await run("S1", "SD", "N12: two authentic views of batch B7 under a policy with an exception", "views disagree", () => {
    const view1 = evaluate(POLICY_V1, { ...evB7, coverage: { status: statusOf() } }, ctx({ mode: "holder-only" }));
    const both = { ...evB7, statements: new Map([...evB7.statements, [R.B7b.body.id, R.B7b]]) };
    const view2 = evaluate(POLICY_V1, { ...both, coverage: { status: statusOf() } }, ctx({ mode: "holder-only" }));
    return { actual: view1.outcome !== view2.outcome ? "views disagree" : "views agree", detail: `{R1}: ${view1.outcome}; {R1, R2}: ${view2.outcome}` };
  });
  await run("S2", "SD", "N12: worlds that differ only in an unseen report give the same transcript and the same output", "same output, wrong in one world", () => {
    // World 0: the laboratory issued only R1. World 1: it also issued the failed retest R2. The holder presents {R1} in both.
    const transcript = canonicalTranscript(evB7);
    const out0 = evaluate(POLICY_V1, { ...evB7, coverage: { status: statusOf() } }, ctx({ mode: "holder-only" })).outcome;
    const out1 = evaluate(POLICY_V1, { ...evB7, coverage: { status: statusOf() } }, ctx({ mode: "holder-only" })).outcome;
    const truth1 = evaluate(POLICY_V1, withCoverage(evB7, "B7"), ctx()).outcome;
    return { actual: out0 === out1 && out1 !== truth1 ? "same output, wrong in one world" : "outputs differ", detail: `identical transcript (${transcript.slice(0, 16)}…); output ${out0} in both worlds; correct decision in world 1: ${truth1}` };
  });
  return rows;
}

/** What the verifier observes from the holder: the declaration and the supplied statements. */
function canonicalTranscript(ev) {
  return digest("sha256", JSON.stringify([ev.declaration, [...ev.statements.entries()]])).toString("hex");
}
