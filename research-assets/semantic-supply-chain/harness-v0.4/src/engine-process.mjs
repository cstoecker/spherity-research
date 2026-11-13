// SPDX-License-Identifier: Apache-2.0
// M24 decision engine for WE-3 (harness v0.4.0): the process that decides and signs receipts.
//
// The test exercises receipt construction, policy-gated signing and appraisal under an idealised
// boundary, in which the test adversary has no access to authorisation secrets, protected memory
// or bypass paths. Ordinary host root is not excluded by such process boundaries, so isolation is
// not demonstrated; that requires a TEE or a confidential VM.
//
// Role (Appendix C, M24; theorem T11; MC-3 V5). The launcher in attestation.mjs hashes this file
// and every local module it imports, extends the result into the non-resettable PCR 15 as a typed
// engine-launch event, and starts exactly those bytes as a separate OS process. The engine then:
//  - creates its receipt key in the TPM, under a policy that requires PCR 15 to show this engine
//    AND an authorisation value that the engine generates and never hands out (exclusive key use);
//  - for each request, takes its own copy of input and closure (the snapshot), decides from that
//    copy alone, and signs a receipt binding the relying party's challenge, the decision
//    identifier, the outcome and the typed semantic-closure and decision-context digests;
//  - extends a typed bundle-load event into the resettable PCR 23, for monitoring only (M23).
//
// Why no package imports: decision logic loaded from node_modules would run unmeasured. The engine
// therefore implements only the small term-resolution subset its rule needs, and answers "unknown"
// outside it. Its one local import, ./crypto.mjs, uses only node:crypto and is measured with it.
//
// The pure functions exported here (receipt encoding, digests, the rule, the TPM policy steps) are
// shared with the relying party and with the test adversary, who runs the same code outside the
// engine. The engine itself runs only when this file is the main module of a process.

import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DIGEST, sri, typedId } from "./crypto.mjs";

export const ENGINE_ID = "ssc-decision-engine/0.4.0";
export const RULE_ID = "ssc:rule/energy-data-access/v1";
export const ENGINE_PCR = 15; // PC Client PCR 0-15: not resettable at any locality (WE-3 D1)
export const MONITOR_PCR = 23; // resettable at locality 0: bundle-load monitoring only (WE-3 D2)

// Attributes of both engine keys:
// - fixedtpm|fixedparent|sensitivedataorigin: generated inside the TPM and never exportable;
// - userwithauth CLEAR: signing (USER role) is possible only through the policy session. With it
//   set, the authorisation value alone (for the PCR-only key: the empty value) would sign without
//   the PCR condition;
// - adminwithpolicy CLEAR: certification (ADMIN role) takes the authorisation value, so only the
//   engine can have its exclusive key certified;
// - noda: the authorisation value is 256 random bits, so dictionary-attack lockout adds nothing,
//   whereas the host's failed attempts (WE-3 C) would otherwise lock every DA-protected object
//   (swtpm allows 3 failures).
export const KEY_ATTRIBUTES = "fixedtpm|fixedparent|sensitivedataorigin|sign|noda";

// Typed tags for objects that crypto.mjs's DIGEST registry does not list, with the same injective
// encoding as typedDigest. The receipt deliberately does not reuse DIGEST.receipt: that tag names
// the T11′ replay-validated receipt, which claims less (the outcome, not the execution), and a
// receipt of one kind must never verify as a receipt of the other.
export const TAG = Object.freeze({
  receipt: "ssc:attested-decision-receipt/v1",
  engineCode: "ssc:engine-code/v1",
  engineLaunch: "ssc:engine-launch/v1",
  bundleLoad: "ssc:semantic-bundle/v1"
});

const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
const u64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(n)); return b; };
/** u32(len(tag)) || tag || for each part: u64(len(part)) || part, as in crypto.mjs typedDigest. */
export function taggedEncoding(tag, ...parts) {
  const chunks = [u32(Buffer.byteLength(tag)), Buffer.from(tag, "utf8")];
  for (const part of parts) {
    const bytes = Buffer.isBuffer(part) ? part : Buffer.from(String(part), "utf8");
    chunks.push(u64(bytes.length), bytes);
  }
  return Buffer.concat(chunks);
}
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest();
export const taggedDigest = (tag, ...parts) => sha256(taggedEncoding(tag, ...parts));
export const bundleEventDigest = ({ bundleId, version, contextManifest }) =>
  taggedDigest(TAG.bundleLoad, bundleId, version, contextManifest);

// ---- Receipt --------------------------------------------------------------------------------

export const RECEIPT_FIELDS = Object.freeze(["audience", "challenge", "decisionId", "outcome", "semanticClosure", "decisionContext"]);

/**
 * The exact bytes the engine key signs. tpm2_sign hashes them with SHA-256, so the signed digest
 * is the typed receipt digest. A missing or additional field is an error: a relying party must
 * never act on a field that the signature does not cover.
 */
export function receiptMessage(receipt) {
  const keys = Object.keys(receipt ?? {}).sort().join();
  if (receipt?.type !== TAG.receipt || keys !== [...RECEIPT_FIELDS, "type"].sort().join()) {
    throw new Error("not an attested-decision receipt (type or field set differs)");
  }
  for (const field of RECEIPT_FIELDS) {
    if (typeof receipt[field] !== "string" || receipt[field] === "") throw new Error(`receipt field ${field} must be a non-empty string`);
  }
  return taggedEncoding(TAG.receipt, ...RECEIPT_FIELDS.map((field) => receipt[field]));
}

// ---- Closure and decision-context digests (Appendix D.1.3, D.1.5) ----------------------------

const toBytes = (value) => (typeof value === "string" ? Buffer.from(value, "base64") : Buffer.from(value));

/**
 * Context manifest: every context the decision reads, as {id, digestSRI} sorted by id. The JSON is
 * byte-identical to the JCS form lfsc.mjs commits to (keys in code-point order, string values
 * only), so both modules give the same dependencies the same digest.
 */
export function contextManifestOf(closure) {
  const dependencies = closure.map(({ url, bytes }) => ({ digestSRI: sri(bytes), id: url }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (new Set(dependencies.map(({ id }) => id)).size !== dependencies.length) throw new Error("closure lists a context URL twice");
  return typedId(DIGEST.contextManifest, JSON.stringify(dependencies));
}
// The rule dereferences no vocabulary documents, so the vocabulary closure V is empty. The
// interpretation component names the engine, its rule and the term-resolution subset it implements.
const VOCABULARY_MANIFEST = "[]";
const INTERPRETATION = `${ENGINE_ID} ${RULE_ID} term-resolution-subset/v1`;
export const semanticClosureOf = (closure) =>
  typedId(DIGEST.semanticClosure, contextManifestOf(closure), VOCABULARY_MANIFEST, INTERPRETATION);
/** The rule reads no clock, status or registry, so those members of Σ_ctx are omitted (T14). */
export const decisionContextOf = (inputDigest, semanticClosure) =>
  typedId(DIGEST.decisionContext, inputDigest, semanticClosure, RULE_ID, ENGINE_ID);

/**
 * The engine's own copy of exactly the bytes it decides on. Every digest and the decision read only
 * this copy, computed in one synchronous step, so nothing can change between hashing and deciding.
 * Over IPC the engine receives serialised copies and the host holds no reference into engine
 * memory; protecting that memory from host root is part of what the idealised boundary assumes.
 */
export function snapshotOf({ input, closure }) {
  if (!Array.isArray(closure)) throw new Error("closure must be a list of {url, bytes}");
  const inputBytes = toBytes(input);
  const contexts = Object.freeze(closure.map(({ url, bytes }) => Object.freeze({ url: String(url), bytes: toBytes(bytes) })));
  return Object.freeze({
    inputBytes,
    inputDigest: sri(inputBytes, "sha256"),
    closure: contexts,
    contextManifest: contextManifestOf(contexts),
    semanticClosure: semanticClosureOf(contexts)
  });
}

// ---- Decision rule --------------------------------------------------------------------------

const SCOPE_PROPERTY = "https://vocab.example/energy#dataAccessScope";
const OUTCOME_OF_SCOPE = new Map([
  ["https://vocab.example/battery#PublicData", "public"],
  ["https://vocab.example/battery#RestrictedData", "restricted"]
]);

/**
 * Which Battery Passport data does this market-role credential open: "public", "restricted" or
 * "unknown"? Terms are resolved only through the contexts in the snapshot: flat term definitions,
 * later contexts overriding earlier ones except for protected terms. Anything outside that subset
 * (a context missing from the closure, an undefined term, a redefined protected term, a property
 * that is not the rule's property) yields "unknown", never a guess. Input authenticity (the proof)
 * is checked upstream (WE-1, LFSC-G); this rule decides what an authentic input means.
 */
export function evaluateRule(snapshot) {
  let credential;
  try {
    credential = JSON.parse(snapshot.inputBytes.toString("utf8"));
  } catch {
    return "unknown";
  }
  const bytesOf = new Map(snapshot.closure.map(({ url, bytes }) => [url, bytes]));
  const terms = new Map();
  for (const url of [credential?.["@context"]].flat()) {
    if (typeof url !== "string" || !bytesOf.has(url)) return "unknown";
    let context;
    try {
      context = JSON.parse(bytesOf.get(url).toString("utf8"))["@context"];
    } catch {
      return "unknown";
    }
    if (!context || typeof context !== "object" || Array.isArray(context)) return "unknown";
    for (const [term, definition] of Object.entries(context)) {
      if (term.startsWith("@")) continue;
      const earlier = terms.get(term);
      if (earlier?.isProtected && JSON.stringify(earlier.definition) !== JSON.stringify(definition)) return "unknown";
      terms.set(term, { definition, isProtected: context["@protected"] === true || definition?.["@protected"] === true });
    }
  }
  const iriOf = (term) => {
    const definition = terms.get(term)?.definition;
    return typeof definition === "string" ? definition : definition?.["@id"];
  };
  const property = terms.get("dataAccessScope")?.definition;
  if (property?.["@id"] !== SCOPE_PROPERTY || property?.["@type"] !== "@vocab") return "unknown";
  const value = credential.credentialSubject?.dataAccessScope;
  return (typeof value === "string" && OUTCOME_OF_SCOPE.get(iriOf(value))) || "unknown";
}

// ---- TPM access through tpm2-tools ------------------------------------------------------------

const RC_NAMES = new Map([
  [0x084, "TPM_RC_VALUE"], [0x08e, "TPM_RC_AUTH_FAIL"], [0x09d, "TPM_RC_POLICY_FAIL"], [0x0a2, "TPM_RC_BAD_AUTH"],
  [0x100, "TPM_RC_INITIALIZE"], [0x12f, "TPM_RC_AUTH_UNAVAILABLE"], [0x14c, "TPM_RC_NV_DEFINED"],
  [0x907, "TPM_RC_LOCALITY"], [0x928, "TPM_RC_PCR_CHANGED"]
]);

/** Response code and message of a failed tpm2-tools call, from its stderr. */
export function tpmErrorOf(stderr) {
  const text = String(stderr);
  const match = /Esys_\w+\(0x([0-9A-Fa-f]+)\) - ([^\n]+)/.exec(text) ?? /ErrorCode \(0x([0-9A-Fa-f]+)\)/.exec(text);
  if (!match) return { code: null, name: "tool error", text: text.trim().split("\n").filter((line) => line.startsWith("ERROR")).pop() ?? text.trim() };
  const rc = parseInt(match[1], 16);
  // Format-one codes carry a handle, session or parameter number in bits 8-11; the error is in 0-5.
  const base = rc >>> 16 ? null : rc & 0x080 ? 0x080 | (rc & 0x03f) : rc;
  return { code: `0x${rc.toString(16)}`, name: RC_NAMES.get(base) ?? (base === null ? "TSS error" : "TPM_RC"), text: match[2] ?? "" };
}

export class TpmToolError extends Error {
  constructor(tool, stderr) {
    const tpm = { tool, ...tpmErrorOf(stderr) };
    super(`${tool}: ${tpm.name}${tpm.code ? ` (${tpm.code})` : ""} ${tpm.text}`.trim());
    this.tpm = tpm;
  }
}

/**
 * tpm2-tools bound to one TPM and one working directory. Authorisation values go through stdin
 * ("file:-"), never through argv, where any local process could read them.
 */
export function tpmTools({ tcti, dir }) {
  const env = { ...process.env, TPM2TOOLS_TCTI: tcti };
  const run = (tool, args, input) => {
    try {
      return execFileSync(tool, args, { env, cwd: dir, input: input ?? Buffer.alloc(0), encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    } catch (error) {
      throw new TpmToolError(tool, error.stderr || error.message);
    }
  };
  const tryRun = (tool, args, input) => {
    try {
      return { ok: true, stdout: run(tool, args, input) };
    } catch (error) {
      if (error instanceof TpmToolError) return { ok: false, error: error.tpm };
      throw error;
    }
  };
  return { tcti, dir, run, tryRun, file: (name) => path.join(dir, name) };
}

const flush = (tools, context) => tools.tryRun("tpm2_flushcontext", [context]);

/** Read one SHA-256 PCR as 32 bytes. */
export function readPcr(tools, index) {
  tools.run("tpm2_pcrread", [`sha256:${index}`, "-o", "pcr-read.bin"]);
  return readFileSync(tools.file("pcr-read.bin"));
}

/**
 * Policy digest from a trial session: PolicyPCR over PCR 15 = pcrValue, then, for the exclusive
 * key, PolicyAuthValue. The value need not be in the TPM ("-f" supplies it), so a relying party can
 * compute the digest it expects for the approved engine.
 */
export function trialPolicy(tools, pcrValue, { withAuthValue }) {
  writeFileSync(tools.file("expected-pcr.bin"), pcrValue);
  tools.run("tpm2_startauthsession", ["-S", "trial.ctx"]); // a trial session is the default
  try {
    tools.run("tpm2_policypcr", ["-S", "trial.ctx", "-l", `sha256:${ENGINE_PCR}`, "-f", "expected-pcr.bin", "-L", "policy.bin"]);
    if (withAuthValue) tools.run("tpm2_policyauthvalue", ["-S", "trial.ctx", "-L", "policy.bin"]);
  } finally {
    flush(tools, "trial.ctx");
  }
  return readFileSync(tools.file("policy.bin"));
}

/**
 * Create an ECDSA P-256 signing key under `parent` with the given policy, persist it at `handle`
 * and return its TPM2B_PUBLIC. A salted session encrypts the command parameters, because
 * TPM2_Create carries the new key's authorisation value in its sensitive parameter.
 */
export function createKey(tools, { parent, handle, policy, authValue, attributes = KEY_ATTRIBUTES }) {
  writeFileSync(tools.file("create-policy.bin"), policy);
  tools.run("tpm2_startauthsession", ["--hmac-session", "-c", parent, "-S", "encrypt.ctx"]);
  try {
    tools.run("tpm2_sessionconfig", ["encrypt.ctx", "--enable-decrypt"]);
    tools.run("tpm2_create", ["-C", parent, "-S", "encrypt.ctx", "-G", "ecc256:ecdsa-sha256", "-g", "sha256", "-a", attributes,
      "-L", "create-policy.bin", ...(authValue ? ["-p", "file:-"] : []), "-u", "key.pub", "-r", "key.priv"], authValue);
  } finally {
    flush(tools, "encrypt.ctx");
  }
  tools.run("tpm2_load", ["-C", parent, "-u", "key.pub", "-r", "key.priv", "-c", "key.ctx"]);
  try {
    if (handle) tools.run("tpm2_evictcontrol", ["-C", "o", "-c", "key.ctx", handle]);
  } finally {
    if (handle) tools.tryRun("tpm2_flushcontext", ["-t"]);
  }
  return readFileSync(tools.file("key.pub"));
}

/**
 * TPM2_Certify of `key` (a handle or context file) by the attestation key. The ADMIN role is
 * authorised by an HMAC session keyed with the key's authorisation value (empty for the PCR-only
 * key), so the value itself is not sent. tpm2_certify 5.6 has no qualifying-data option (it sends
 * the fixed bytes 00ff55aa), so the statement is not bound to a relying-party nonce; it attests a
 * static key name, which needs no freshness.
 */
export function certifyKey(tools, { key, ak, authValue }) {
  tools.run("tpm2_startauthsession", ["--hmac-session", "-S", "certify.ctx"]);
  try {
    tools.run("tpm2_certify", ["-c", key, "-C", ak, "-P", "session:certify.ctx+file:-", "-g", "sha256",
      "-o", "attest.bin", "-s", "attest.sig", "-f", "plain"], authValue ?? Buffer.alloc(0));
  } finally {
    flush(tools, "certify.ctx");
  }
  return { attest: readFileSync(tools.file("attest.bin")), signature: readFileSync(tools.file("attest.sig")) };
}

/**
 * Sign `message` (tpm2_sign hashes it with SHA-256) with the key at `handle` through a policy
 * session that runs the given steps. PolicyPCR binds the session to PCR 15 as it is now; the TPM
 * checks the resulting digest against the key's policy at TPM2_Sign. PolicyAuthValue adds the
 * requirement of an HMAC keyed with the key's authorisation value, which itself never crosses the
 * TPM interface. The test adversary uses the same function, with no or a guessed value.
 */
export function policySign(tools, { handle, message, steps, authValue }) {
  writeFileSync(tools.file("message.bin"), message);
  rmSync(tools.file("signature.der"), { force: true });
  tools.run("tpm2_startauthsession", ["--policy-session", "-S", "policy.ctx"]);
  try {
    if (steps.includes("pcr")) tools.run("tpm2_policypcr", ["-S", "policy.ctx", "-l", `sha256:${ENGINE_PCR}`]);
    if (steps.includes("authvalue")) tools.run("tpm2_policyauthvalue", ["-S", "policy.ctx"]);
    tools.run("tpm2_sign", ["-c", handle, "-g", "sha256", "-f", "plain", "-p", authValue ? "session:policy.ctx+file:-" : "session:policy.ctx",
      "-o", "signature.der", "message.bin"], authValue);
  } finally {
    flush(tools, "policy.ctx");
  }
  return readFileSync(tools.file("signature.der"));
}

// ---- The engine process -----------------------------------------------------------------------

function runEngine(stateDir) {
  const work = path.join(stateDir, "work");
  mkdirSync(work, { recursive: true, mode: 0o700 });
  const tools = tpmTools({ tcti: process.env.TPM2TOOLS_TCTI, dir: work });
  // Engine-private storage of key handles and authorisation values. It stands in for TEE sealed
  // storage: after a restart the engine regains use of its key (MON-2), but only once PCR 15 again
  // shows the approved engine. Under the idealised boundary nothing else reads this file.
  const stateFile = path.join(stateDir, "engine-state.json");
  const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, "utf8")) : { keys: {} };
  const save = () => writeFileSync(stateFile, JSON.stringify(state), { mode: 0o600 });
  const b64 = (bytes) => Buffer.from(bytes).toString("base64");

  const handlers = {
    /** Create both receipt keys, bound to PCR 15 as it is now (this engine's measured launch). */
    enrol({ parent, ak, handles }) {
      const pcrValue = readPcr(tools, ENGINE_PCR);
      const authValue = randomBytes(32);
      const certified = (handle, publicArea, value) => {
        const { attest, signature } = certifyKey(tools, { key: handle, ak, authValue: value });
        return { handle, public: b64(publicArea), attest: b64(attest), signature: b64(signature) };
      };
      // A modified engine that enrols gets keys bound to its own measurement, which the relying
      // party does not approve (WE-3 E2).
      const pcrOnlyPublic = createKey(tools, { parent, handle: handles.pcrOnly, policy: trialPolicy(tools, pcrValue, { withAuthValue: false }) });
      const exclusivePublic = createKey(tools, { parent, handle: handles.exclusive, policy: trialPolicy(tools, pcrValue, { withAuthValue: true }), authValue });
      state.keys = { pcrOnly: { handle: handles.pcrOnly }, exclusive: { handle: handles.exclusive, authValue: authValue.toString("hex") } };
      save();
      return {
        pcrValue: pcrValue.toString("hex"),
        certifications: { pcrOnly: certified(handles.pcrOnly, pcrOnlyPublic), exclusive: certified(handles.exclusive, exclusivePublic, authValue) }
      };
    },

    /** Snapshot, monitor, decide, sign. */
    decide(request) {
      const key = state.keys[request.key ?? "exclusive"];
      if (!key) throw new Error("engine has no enrolled key of that kind");
      const snapshot = snapshotOf(request);
      // Monitoring only (M23): a typed bundle-load event in the resettable PCR 23. It records what
      // was loaded for fleet drift monitoring; it does not bind any decision (WE-3 D2).
      const monitoringEvent = { bundleId: String(request.bundle?.id), version: String(request.bundle?.version), contextManifest: snapshot.contextManifest };
      const eventDigest = bundleEventDigest(monitoringEvent).toString("hex");
      tools.run("tpm2_pcrextend", [`${MONITOR_PCR}:sha256=${eventDigest}`]);
      const outcome = evaluateRule(snapshot);
      // The receipt names the closure this decision ran under: the snapshot's own digest.
      const namedClosure = snapshot.semanticClosure;
      const receipt = {
        type: TAG.receipt,
        audience: request.audience,
        challenge: request.challenge,
        decisionId: request.decisionId,
        outcome,
        semanticClosure: namedClosure,
        decisionContext: decisionContextOf(snapshot.inputDigest, namedClosure)
      };
      const authValue = key.authValue ? Buffer.from(key.authValue, "hex") : undefined;
      const signature = policySign(tools, { handle: key.handle, message: receiptMessage(receipt), steps: authValue ? ["pcr", "authvalue"] : ["pcr"], authValue });
      return { receipt, signature: b64(signature), monitoringEvent: { ...monitoringEvent, digest: eventDigest } };
    }
  };

  process.on("message", (message) => {
    let reply;
    try {
      const handler = Object.hasOwn(handlers, message?.op) ? handlers[message.op] : null;
      if (!handler) throw new Error(`unknown operation ${message?.op}`);
      reply = { id: message.id, ok: true, ...handler(message) };
    } catch (error) {
      reply = { id: message?.id, ok: false, error: error.tpm ?? { name: "engine error", text: error.message } };
    }
    process.send(reply);
  });
  // The engine ends with its launcher (and with a simulated reboot).
  process.on("disconnect", () => process.exit(0));
  process.send({ ready: true, pid: process.pid });
}

const isMain = (() => {
  try {
    return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (isMain) {
  if (!process.send || !process.argv[2]) throw new Error("the engine runs as a forked child with an IPC channel and a state directory");
  runEngine(process.argv[2]);
}
