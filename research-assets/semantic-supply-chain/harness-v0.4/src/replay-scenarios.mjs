// SPDX-License-Identifier: Apache-2.0
// WE-3 R: replay-validated receipts, scenario by scenario (H14). Each scenario states the outcome
// the theory predicts; the test suite asserts it and we3-replay-receipts.mjs prints the table.
// Scenarios mirror the model-checking cases MC-3 V6/V6x/V6c and MC-6.

import { typedId, DIGEST } from "./crypto.mjs";
import { issueLfsc } from "./lfsc.mjs";
import { contextFile, staticLoader, W3C_CONTEXTS } from "./loader.mjs";
import { acceptReceipt, CoSigner, decide, Device, newParty, produceReceipt, ProtectedActuator, signRequest, signStatus } from "./replay-receipts.mjs";

const V2 = "https://www.w3.org/ns/credentials/v2";
const ENERGY = "https://contexts.example/energy-roles/v1";
const loader = () => staticLoader({ ...W3C_CONTEXTS, [ENERGY]: contextFile("energy-roles-v1.jsonld") });
const STRICT = typedId(DIGEST.semanticClosure, "energy-roles/v1 + restricted-data-access/strict");
const LENIENT = typedId(DIGEST.semanticClosure, "energy-roles/v1 + restricted-data-access/lenient-2025");
const UNREPLAYABLE = typedId(DIGEST.semanticClosure, "energy-roles/v1 + restricted-data-access/engine-not-archived");
const role = (doc) => doc.credentialSubject?.marketRole;

export async function replayScenarios() {
  const issuer = newParty("issuer");
  const issuerDid = `did:key:${issuer.id}`;
  const vm = `${issuerDid}#${issuer.id}`;
  const credentialFor = (marketRole, id) => issueLfsc({
    "@context": [V2, ENERGY], id, type: ["VerifiableCredential", "MarketRoleCredential"], issuer: issuerDid,
    validFrom: "2026-11-10T00:00:00Z", credentialSubject: { id: "did:example:grid-operator-42", marketRole, dataAccessScope: "BatteryPassportRestrictedData" }
  }, { signer: { ...issuer.keys }, verificationMethod: vm, loader: loader() });
  const tso = await credentialFor("TransmissionSystemOperator", "urn:uuid:tso-1");
  const dso = await credentialFor("DistributionSystemOperator", "urn:uuid:dso-1");
  const closures = new Map([
    [STRICT, { name: "strict", rule: (d) => role(d) === "TransmissionSystemOperator" }],
    [LENIENT, { name: "lenient (approved 2025 policy)", rule: (d) => ["TransmissionSystemOperator", "DistributionSystemOperator"].includes(role(d)) }]
  ]);
  const rp = newParty("relying party"), statusIssuer = newParty("status issuer"), forger = newParty("forger");
  const deviceParty = newParty("device engine"), coParty = newParty("co-signer");
  let epoch = 1;
  let clock = 10;
  const verifier = { loader: loader(), allowedContexts: new Set([V2, ENERGY]), issuers: new Map([[issuerDid, new Set([vm])]]) };
  const coSigner = (extra = {}) => new CoSigner({ party: coParty, verifier, closures, approvedClosures: new Set([STRICT, LENIENT, UNREPLAYABLE]), statusIssuer, currentEpoch: () => epoch, clock: () => clock, ...extra });
  const device = new Device({ party: deviceParty });
  const request = (extra = {}) => signRequest(rp, { audience: "rp:battery-passport-portal", purpose: "data-access", action: "read:BatteryPassportRestrictedData", scope: "battery:DE-7731", authorisedClosure: STRICT, ...extra });
  const status = (credential, state = "current", e = 1, issued = 9, by = statusIssuer) => signStatus(by, { credential: credential.id, state, epoch: e, issued, expires: issued + 5 });
  const proposal = (credential, { req = request(), st = status(credential), claimedClosure = STRICT, outcome, time = clock, decisionId = "d-" + Math.random().toString(36).slice(2, 8) } = {}) => ({
    request: req, input: credential, status: st, claimedClosure, time, decisionId,
    outcome: outcome ?? decide(closures, claimedClosure, { document: credential }, st.body)
  });
  const rows = [];
  const run = async (id, name, expected, fn) => {
    let actual, detail;
    try { ({ actual, detail } = await fn()); } catch (error) { actual = "error"; detail = error.message; }
    rows.push({ id, name, expected, actual, detail, ok: actual === expected });
  };
  const fullRun = async (p, { cs = coSigner(), consumed = new Set(), required } = {}) => {
    const produced = await produceReceipt({ device, coSigner: cs, proposal: p, rp });
    if (!produced.ok) return { actual: "refused by co-signer", detail: produced.reason };
    const acc = acceptReceipt(produced.receipt, { request: p.request, deviceParty, coSignerParty: coParty, consumed, requiredAdmissibility: required });
    return acc.accepted ? { actual: `accepted ${acc.outcome}`, detail: `receipt binds ${acc.fields.admissibilityPolicy}` } : { actual: "rejected by relying party", detail: acc.reason };
  };

  await run("R1", "honest device, TSO credential, strict closure", "accepted GRANT", () => fullRun(proposal(tso)));
  await run("R2", "honest device, DSO credential, strict closure", "accepted DENY", () => fullRun(proposal(dso)));
  await run("R3", "outcome lie: device proposes GRANT where replay gives DENY", "refused by co-signer", () => fullRun(proposal(dso, { outcome: "GRANT" })));
  await run("R4", "input lie (MC-6 input): device edits the credential to TSO", "refused by co-signer", async () => {
    const forged = structuredClone(dso); forged.credentialSubject.marketRole = "TransmissionSystemOperator";
    return fullRun(proposal(forged));
  });
  await run("R5", "counterfeit status (MC-6 status): 'current' object signed by a forger", "refused by co-signer", () => fullRun(proposal(tso, { st: status(tso, "current", 1, 9, forger) })));
  await run("R6", "older authentic status (MC-6 oldStatus, epoch-bound co-signer): epoch-0 'current' after withdrawal in epoch 1", "refused by co-signer", () => fullRun(proposal(tso, { st: status(tso, "current", 0, 8) })));
  await run("R7", "same, co-signer with a declared 2-tick window: receipt says window:2; RP requiring current status rejects it", "rejected by relying party", () => fullRun(proposal(tso, { st: status(tso, "current", 0, 8) }), { cs: coSigner({ admissibility: "window", windowTicks: 2 }) }));
  await run("R8", "same, RP that accepts the declared window policy", "accepted GRANT", () => fullRun(proposal(tso, { st: status(tso, "current", 0, 8) }), { cs: coSigner({ admissibility: "window", windowTicks: 2 }), required: "window:2" }));
  await run("R9", "device-chosen approved closure (MC-6 closure): DSO under the lenient closure, request authorises strict", "refused by co-signer", () => fullRun(proposal(dso, { claimedClosure: LENIENT })));
  await run("R10", "execution not established (MC-3 V6x): device ran the lenient closure on a TSO credential, claims strict; outcomes agree", "accepted GRANT", () => fullRun(proposal(tso, { claimedClosure: STRICT, outcome: decide(closures, LENIENT, { document: tso }, status(tso).body) })));
  await run("R11", "compromised co-signer (MC-3 V6c): signs a DSO GRANT under the strict closure", "accepted GRANT", () => fullRun(proposal(dso, { outcome: "GRANT" }), { cs: coSigner({ honest: false }) }));
  await run("R12", "unknown outcome: approved closure whose executable rule the co-signer cannot reconstruct", "refused by co-signer", () =>
    fullRun(proposal(tso, { req: request({ authorisedClosure: UNREPLAYABLE }), claimedClosure: UNREPLAYABLE, outcome: "GRANT" })));
  await run("R13", "claimed time outside the declared clock tolerance", "refused by co-signer", () => fullRun(proposal(tso, { time: clock + 5 })));
  await run("R14", "field substitution after signing: outcome changed in the message", "rejected by relying party", async () => {
    const p = proposal(dso);
    const produced = await produceReceipt({ device, coSigner: coSigner(), proposal: p, rp });
    produced.receipt.message = produced.receipt.message.replace('"DENY"', '"GRANT"');
    const acc = acceptReceipt(produced.receipt, { request: p.request, deviceParty, coSignerParty: coParty, consumed: new Set() });
    return acc.accepted ? { actual: "accepted", detail: "" } : { actual: "rejected by relying party", detail: acc.reason };
  });
  await run("R15", "confused session: approval for message A presented with the bytes of message B", "refused by co-signer", async () => {
    const cs = coSigner();
    const a = await cs.approve(proposal(dso), { rp, groupKey: "g", keyEpoch: 1 });
    const b = await cs.approve(proposal(tso), { rp, groupKey: "g", keyEpoch: 1 });
    cs.approvals.delete(b.approval.digest); // B's approval withdrawn; only A's remains
    const share = cs.sign(b.message.bytes);
    return share.ok ? { actual: "signed", detail: "" } : { actual: "refused by co-signer", detail: share.reason };
  });
  await run("R16", "challenge replayed to the same relying party", "rejected by relying party", async () => {
    const p = proposal(tso);
    const produced = await produceReceipt({ device, coSigner: coSigner(), proposal: p, rp });
    const consumed = new Set();
    acceptReceipt(produced.receipt, { request: p.request, deviceParty, coSignerParty: coParty, consumed });
    const again = acceptReceipt(produced.receipt, { request: p.request, deviceParty, coSignerParty: coParty, consumed });
    return again.accepted ? { actual: "accepted", detail: "" } : { actual: "rejected by relying party", detail: again.reason };
  });
  await run("R17", "receipt presented for another action with the same challenge", "rejected by relying party", async () => {
    const p = proposal(tso);
    const produced = await produceReceipt({ device, coSigner: coSigner(), proposal: p, rp });
    const otherRequest = request({ action: "write:BatteryPassportRestrictedData", challenge: p.request.body.challenge });
    const acc = acceptReceipt(produced.receipt, { request: otherRequest, deviceParty, coSignerParty: coParty, consumed: new Set() });
    return acc.accepted ? { actual: "accepted", detail: "" } : { actual: "rejected by relying party", detail: acc.reason };
  });
  // Offline co-signer and the effect gate (MC-6 offline, DEC-7).
  const actuator = new ProtectedActuator({ currentEpoch: () => epoch, clock: () => clock });
  await run("R18", "co-signer offline; device tries to act on its provisional GRANT", "effect refused", async () => {
    const r = actuator.execute("release restricted data", { provisional: true });
    return { actual: r.executed ? "effect executed" : "effect refused", detail: r.reason };
  });
  await run("R19", "co-signer offline: no receipt, the action stays unavailable (safe, not a success)", "refused by co-signer", () => fullRun(proposal(tso), { cs: coSigner({ online: false }) }));
  await run("R20", "co-signer back online: receipt produced and the effect passes the commit-point check", "effect executed", async () => {
    const p = proposal(tso);
    const produced = await produceReceipt({ device, coSigner: coSigner(), proposal: p, rp });
    const acceptance = acceptReceipt(produced.receipt, { request: p.request, deviceParty, coSignerParty: coParty, consumed: new Set() });
    const r = actuator.execute(p.request.body.action, { acceptance, decidedAtEpoch: epoch });
    return { actual: r.executed ? "effect executed" : "effect refused", detail: r.reason ?? "receipt accepted, epoch current" };
  });
  await run("R21", "authority epoch advances between receipt and effect", "effect refused", async () => {
    const p = proposal(tso);
    const produced = await produceReceipt({ device, coSigner: coSigner(), proposal: p, rp });
    const acceptance = acceptReceipt(produced.receipt, { request: p.request, deviceParty, coSignerParty: coParty, consumed: new Set() });
    const decidedAt = epoch;
    epoch = 2; // withdrawal advances the epoch (M25)
    const r = actuator.execute(p.request.body.action, { acceptance, decidedAtEpoch: decidedAt });
    epoch = 1;
    return { actual: r.executed ? "effect executed" : "effect refused", detail: r.reason };
  });
  return rows;
}
