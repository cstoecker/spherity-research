// SPDX-License-Identifier: Apache-2.0
// M24 alternative: replay-validated receipts (H14; theorem T11′; requirements MON-6, MON-7, DEC-1,
// DEC-7, PRF-6; model-checking cases MC-3 V6/V6x/V6c and MC-6).
//
// What this establishes, and what it does not: an accepted receipt's OUTCOME equals the
// deterministic evaluation of its committed, admissible context. It does NOT establish which
// closure the device actually executed (MC-3 V6x), nor the truth of device-only observations,
// nor that a signature is ever produced (liveness).
//
// TWO-SIGNATURE STAND-IN: the receipt carries two independent ECDSA P-256 signatures (device
// engine and co-signer) over identical message bytes; the relying party requires both. This is a
// 2-of-2 instance of T11′ (security reduces to the unforgeability of the honest co-signer's key).
// It does not implement or test FROST (RFC 9591) group keys, key generation, nonce rounds or
// robustness; a FROST variant is planned as a separate release.

import canonicalize from "canonicalize";
import { randomBytes } from "node:crypto";
import { DIGEST, ecdsaSign, ecdsaVerify, typedDigest, typedId } from "./crypto.mjs";
import { newParty, publicOf, signObject, verifyObject } from "./signed.mjs";
import { verifyLfsc } from "./lfsc.mjs";

export const RECEIPT_PROFILE = "ssc-replay-receipt/v1";
const FIELDS = ["profile", "groupKey", "keyEpoch", "challenge", "audience", "purpose", "decisionId", "action", "scope",
  "outcome", "inputDigest", "semanticClosure", "decisionContext", "admissibilityPolicy"];

/** One injective encoding: a fixed-position JCS array, hashed under its own digest type. */
export function encodeMessage(fields) {
  for (const f of FIELDS) if (fields[f] === undefined) throw new Error(`receipt field missing: ${f}`);
  const bytes = Buffer.from(canonicalize([RECEIPT_PROFILE, ...FIELDS.map((f) => fields[f])]), "utf8");
  return { bytes, digest: typedDigest(DIGEST.receipt, bytes) };
}
export const groupKeyId = (publicKeys, epoch) => typedId(DIGEST.groupKey, canonicalize({ keys: [...publicKeys].sort(), epoch }));

// ---- signed helper objects (request, status) ---------------------------------------------
export { newParty };
/** A relying party's signed request: challenge, audience, purpose, action and the closure it authorises. */
export const signRequest = (rp, body) => signObject(rp, { ...body, challenge: body.challenge ?? randomBytes(16).toString("hex") });
/** A status issuer's signed status object for a credential, under an authority epoch. */
export const signStatus = (statusIssuer, body) => signObject(statusIssuer, body);

// ---- the deterministic decision ------------------------------------------------------------
/**
 * Closures are identified by their semantic-closure digest; each maps to a deterministic rule.
 * decide() returns GRANT, DENY or UNKNOWN; UNKNOWN never authorises a share.
 */
export function decide(closures, closureId, view, status) {
  const closure = closures.get(closureId);
  if (!closure || !view || !status) return "UNKNOWN";
  if (status.state !== "current") return "DENY";
  return closure.rule(view.document) ? "GRANT" : "DENY";
}

// ---- co-signer ------------------------------------------------------------------------------
/**
 * MON-6: the co-signer authorises only the exact canonical message whose committed input and
 * context it has authenticated, found admissible under independently anchored state, and replayed
 * to the proposed definitive outcome.
 */
export class CoSigner {
  constructor({ party, verifier, closures, approvedClosures, statusIssuer, currentEpoch, admissibility = "current-status", windowTicks = 0, clock, tolerance = 2, online = true, honest = true }) {
    Object.assign(this, { party, verifier, closures, approvedClosures, statusIssuer, currentEpoch, admissibility, windowTicks, clock, tolerance, online, honest });
    this.approvals = new Map(); // message digest (hex) -> approval
  }

  /** Validate a proposal and approve the exact message bytes it yields. */
  async approve(proposal, { rp, groupKey, keyEpoch }) {
    if (!this.online) return { ok: false, reason: "co-signer unreachable" };
    const refuse = (reason) => ({ ok: false, reason });
    if (this.honest) {
      // 1. The request is the relying party's, for this audience, and fresh.
      if (!verifyObject(proposal.request, rp)) return refuse("request not authenticated");
      const req = proposal.request.body;
      // 2. Input authenticated to its source (the credential's issuer), independently of the device.
      const input = await verifyLfsc(proposal.input, this.verifier);
      if (!input.verified) return refuse(`input not authenticated: ${input.reason}`);
      // 3. Admissibility under independently anchored state.
      if (proposal.claimedClosure !== req.authorisedClosure) return refuse("closure is not the one the request authorises");
      if (!this.approvedClosures.has(proposal.claimedClosure)) return refuse("closure not approved or withdrawn");
      if (!verifyObject(proposal.status, this.statusIssuer)) return refuse("status object not authenticated");
      const st = proposal.status.body;
      if (st.credential !== input.view.document.id) return refuse("status object is for another credential");
      const t = this.clock();
      if (st.expires <= t) return refuse("status object expired");
      if (this.admissibility === "current-status" && st.epoch !== this.currentEpoch()) return refuse(`status object is from epoch ${st.epoch}, current epoch is ${this.currentEpoch()}`);
      if (this.admissibility === "window" && st.issued < t - this.windowTicks) return refuse("status object older than the declared window");
      if (Math.abs(proposal.time - t) > this.tolerance) return refuse("claimed decision time outside the declared clock tolerance");
      // 4. Deterministic replay of the claimed closure; definitive outcomes only.
      const replayed = decide(this.closures, proposal.claimedClosure, input.view, st);
      if (replayed === "UNKNOWN") return refuse("replay indeterminate: no share for unknown");
      if (replayed !== proposal.outcome) return refuse(`replay under the claimed closure gives ${replayed}, proposal says ${proposal.outcome}`);
    }
    // 5. The co-signer itself computes the message from the validated fields.
    const req = proposal.request.body;
    const fields = {
      profile: RECEIPT_PROFILE, groupKey, keyEpoch, challenge: req.challenge, audience: req.audience, purpose: req.purpose,
      decisionId: proposal.decisionId, action: req.action, scope: req.scope, outcome: proposal.outcome,
      inputDigest: typedId(DIGEST.input, canonicalize(proposal.input)),
      semanticClosure: proposal.claimedClosure,
      decisionContext: typedId(DIGEST.decisionContext, canonicalize({ status: proposal.status, time: proposal.time, closure: proposal.claimedClosure, request: proposal.request })),
      admissibilityPolicy: this.admissibility === "window" ? `window:${this.windowTicks}` : "current-status"
    };
    const message = encodeMessage(fields);
    const approval = { digest: message.digest.toString("hex"), fields };
    this.approvals.set(approval.digest, approval);
    return { ok: true, approval, message };
  }

  /** Sign only bytes whose digest was approved: approval is keyed to the exact message. */
  sign(messageBytes) {
    const d = typedDigest(DIGEST.receipt, messageBytes).toString("hex");
    if (this.honest && !this.approvals.has(d)) return { ok: false, reason: "no approval for these exact bytes" };
    this.approvals.delete(d);
    return { ok: true, signature: ecdsaSign(this.party.keys.crv, this.party.keys.key, messageBytes).toString("base64") };
  }
}

// ---- device -----------------------------------------------------------------------------------
export class Device {
  constructor({ party }) { this.party = party; }
  signShare(messageBytes) { return ecdsaSign(this.party.keys.crv, this.party.keys.key, messageBytes).toString("base64"); }
}

/** Run the two-signature protocol for one proposal. */
export async function produceReceipt({ device, coSigner, proposal, rp, keyEpoch = 1 }) {
  const groupKey = groupKeyId([device.party.id, coSigner.party.id], keyEpoch);
  const approved = await coSigner.approve(proposal, { rp, groupKey, keyEpoch });
  if (!approved.ok) return { ok: false, reason: approved.reason };
  const share = coSigner.sign(approved.message.bytes);
  if (!share.ok) return { ok: false, reason: share.reason };
  return { ok: true, receipt: { message: approved.message.bytes.toString("utf8"), signatures: { device: device.signShare(approved.message.bytes), coSigner: share.signature }, keys: { device: device.party.id, coSigner: coSigner.party.id } } };
}

// ---- relying party ------------------------------------------------------------------------------
/**
 * Verify both signatures over identical bytes, the binding to this relying party's request, the
 * admissibility policy it requires, and single use of the challenge.
 */
export function acceptReceipt(receipt, { request, deviceParty, coSignerParty, keyEpoch = 1, consumed, requiredAdmissibility = "current-status" }) {
  const bytes = Buffer.from(receipt.message, "utf8");
  if (receipt.keys.device !== deviceParty.id || receipt.keys.coSigner !== coSignerParty.id) return { accepted: false, reason: "unexpected keys" };
  for (const [who, party] of [["device", deviceParty], ["coSigner", coSignerParty]]) {
    if (!ecdsaVerify(party.keys.crv, publicOf(party), bytes, Buffer.from(receipt.signatures[who], "base64"))) return { accepted: false, reason: `${who} signature invalid` };
  }
  let fields;
  try { const parsed = JSON.parse(receipt.message); fields = Object.fromEntries(FIELDS.map((f, i) => [f, parsed[i + 1]])); if (parsed[0] !== RECEIPT_PROFILE) throw new Error(); } catch { return { accepted: false, reason: "receipt message malformed" }; }
  if (fields.groupKey !== groupKeyId([deviceParty.id, coSignerParty.id], keyEpoch)) return { accepted: false, reason: "group key or epoch mismatch" };
  const req = request.body;
  for (const f of ["challenge", "audience", "purpose", "action", "scope"]) if (fields[f] !== req[f]) return { accepted: false, reason: `receipt ${f} does not match the request` };
  if (fields.semanticClosure !== req.authorisedClosure) return { accepted: false, reason: "receipt names another closure" };
  if (fields.admissibilityPolicy !== requiredAdmissibility) return { accepted: false, reason: `receipt admissibility ${fields.admissibilityPolicy}, required ${requiredAdmissibility}` };
  if (consumed.has(fields.challenge)) return { accepted: false, reason: "challenge already used" };
  consumed.add(fields.challenge);
  return { accepted: true, outcome: fields.outcome, fields };
}

/**
 * DEC-7: a protected effect happens only with an accepted GRANT receipt, and only if the authority
 * epoch is still current at the effect's linearisation point. Provisional decisions never pass.
 */
export class ProtectedActuator {
  constructor({ currentEpoch }) { this.currentEpoch = currentEpoch; this.effects = []; }
  execute(action, { acceptance, decidedAtEpoch, provisional = false }) {
    if (provisional) return { executed: false, reason: "provisional decision: effect deferred until a valid receipt" };
    if (!acceptance?.accepted) return { executed: false, reason: "no accepted receipt" };
    if (acceptance.outcome !== "GRANT") return { executed: false, reason: `receipt outcome ${acceptance.outcome}` };
    if (decidedAtEpoch !== this.currentEpoch()) return { executed: false, reason: "authority epoch changed since the decision" };
    this.effects.push(action);
    return { executed: true };
  }
}
