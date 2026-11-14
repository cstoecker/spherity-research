// SPDX-License-Identifier: Apache-2.0
// M24 attested decisions (harness v0.4.0, WE-3) on a software TPM (swtpm + tpm2-tools): measured
// launch of an isolated decision engine, a certified engine key under two policies, relying-party
// appraisal, and the attack scenarios.
//
// The test exercises receipt construction, policy-gated signing and appraisal under an idealised
// boundary, in which the test adversary has no access to authorisation secrets, protected memory
// or bypass paths. Ordinary host root is not excluded by such process boundaries, so isolation is
// not demonstrated; that requires a TEE or a confidential VM.
//
// Why v0.4 differs from v0.3 (Appendix C, M24 correction; theorem T11; MC-3):
// - v0.3 (X6, MC-3 V1): receipts came from the application, bundle events went to the resettable
//   PCR 23 and appraisal checked only the last event. A device with TPM access reset PCR 23,
//   re-extended only the approved event and was accepted.
// - A key whose policy only requires PCR 15 to show the approved engine (MC-3 V4) can be used by
//   any host caller while the register shows that value, to sign a false receipt. WE-3 B
//   reproduces this.
// - v0.4 (MC-3 V5): the launcher measures the engine into the non-resettable PCR 15 and starts it
//   as a separate process. Only the engine holds the authorisation value of its receipt key, whose
//   policy is PolicyPCR(PCR 15 = approved engine) AND PolicyAuthValue. The relying party pins a key
//   that the attestation key certified, after checking its name, attributes and policy digest. It
//   then appraises each receipt: signature, fresh single-use challenge, decision identifier,
//   decision context, and an approved, not withdrawn closure.
// - Bundle loads are still measured into PCR 23, for monitoring only (M23).
//
// Limits:
// - Software TPM: there is no endorsement-key certificate chain; the attestation key is trusted
//   at provisioning.
// - Certification proves a key's policy, not who holds its authorisation value. That the approved
//   engine created the enrolled key and alone holds the value is the enrolment assumption of the
//   idealised boundary (WE-3 E3).
// - PCR 15 is an append-only chain. A second launch without a TPM reset moves it off the approved
//   value, so here an engine restart implies a reboot. Authorising sets of engine states with
//   PolicyAuthorize, with rollback protection and revocation (MON-5), is not simulated.
// - The Node runtime and tpm2-tools are not measured; only the engine's own modules are.

import { execFileSync, fork } from "node:child_process";
import { createPublicKey, randomBytes, randomUUID, verify } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sri } from "./crypto.mjs";
import {
  bundleEventDigest, certifyKey, createKey, decisionContextOf, ENGINE_ID, ENGINE_PCR, evaluateRule, KEY_ATTRIBUTES, MONITOR_PCR,
  policySign, readPcr, receiptMessage, semanticClosureOf, sha256, snapshotOf, TAG, taggedDigest, tpmTools, TpmToolError, trialPolicy
} from "./engine-process.mjs";

export const IDEALISED_BOUNDARY = "The test exercises receipt construction, policy-gated signing and appraisal under an idealised boundary, " +
  "in which the test adversary has no access to authorisation secrets, protected memory or bypass paths. Ordinary host root is not " +
  "excluded by such process boundaries, so isolation is not demonstrated; that requires a TEE or a confidential VM.";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const sleepMs = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const b64 = (bytes) => Buffer.from(bytes).toString("base64");

// ---- Software TPM -------------------------------------------------------------------------------

export function startTpm(dir, port = 2321) {
  mkdirSync(path.join(dir, "state"), { recursive: true });
  const pidFile = path.join(dir, "swtpm.pid");
  execFileSync("swtpm", ["socket", "--tpm2", "--tpmstate", `dir=${path.join(dir, "state")}`,
    "--server", `type=tcp,port=${port}`, "--ctrl", `type=tcp,port=${port + 1}`,
    "--flags", "not-need-init,startup-clear", "--daemon", "--pid", `file=${pidFile}`]);
  const tools = tpmTools({ tcti: `swtpm:host=127.0.0.1,port=${port}`, dir });
  for (let i = 0; i < 50 && !tools.tryRun("tpm2_pcrread", [`sha256:${ENGINE_PCR}`]).ok; i++) sleepMs(100);
  return {
    ...tools,
    port,
    /**
     * TPM reset as at power-on: _TPM_Init over swtpm's control channel, then TPM2_Startup(CLEAR).
     * Persistent objects survive; PCRs and sessions do not. On a software TPM the host owns this
     * channel; on hardware a reset restarts the platform and its measured boot.
     */
    reboot() {
      execFileSync("swtpm_ioctl", ["--tcp", `127.0.0.1:${port + 1}`, "-i"], { stdio: "ignore" });
      tools.run("tpm2_startup", ["-c"]);
    },
    stop() {
      let pid;
      try {
        pid = Number(readFileSync(pidFile, "utf8"));
        process.kill(pid, "SIGTERM");
      } catch {
        return;
      }
      for (let i = 0; i < 40; i++) {
        try {
          process.kill(pid, 0);
        } catch {
          return;
        }
        sleepMs(50);
      }
      try { process.kill(pid, "SIGKILL"); } catch {}
    }
  };
}

/** Endorsement key + attestation key (ECC P-256, ECDSA/SHA-256), persisted (as in v0.3). */
export function provisionAttestationKey(tpm, handle = "0x81010002") {
  tpm.run("tpm2_createek", ["-c", "ek.ctx", "-G", "ecc", "-u", "ek.pub"]);
  tpm.run("tpm2_flushcontext", ["-t"]);
  tpm.run("tpm2_createak", ["-C", "ek.ctx", "-c", "ak.ctx", "-G", "ecc", "-g", "sha256", "-s", "ecdsa", "-u", "ak.pub", "-n", "ak.name", "-f", "pem"]);
  tpm.run("tpm2_flushcontext", ["-t"]);
  tpm.run("tpm2_flushcontext", ["-s"]);
  tpm.run("tpm2_evictcontrol", ["-C", "o", "-c", "ak.ctx", handle]);
  tpm.run("tpm2_flushcontext", ["-t"]);
  return { handle, publicKeyPem: readFileSync(tpm.file("ak.pub"), "utf8") };
}

/** Storage primary key in the owner hierarchy, parent of the engine keys, persisted. */
export function provisionStorageKey(tpm, handle = "0x81000001") {
  tpm.run("tpm2_createprimary", ["-C", "o", "-g", "sha256", "-G", "ecc", "-c", "srk.ctx"]);
  tpm.run("tpm2_evictcontrol", ["-C", "o", "-c", "srk.ctx", handle]);
  tpm.run("tpm2_flushcontext", ["-t"]);
  return handle;
}

// ---- Measured launch ----------------------------------------------------------------------------

const ENGINE_ENTRY = "engine-process.mjs";

/**
 * The engine's code: its entry module and every local module it imports, in discovery order. The
 * engine may import only node: built-ins and modules beside it; anything else would be decision
 * code that the launch measurement does not cover, so the launcher refuses it.
 */
export function engineModules(entry = ENGINE_ENTRY) {
  const modules = [];
  const visit = (name) => {
    if (modules.some((module) => module.name === name)) return;
    const bytes = readFileSync(path.join(SRC, name));
    modules.push({ name, bytes });
    const text = bytes.toString("utf8");
    if (/\bimport\s*\(|\brequire\s*\(|\bcreateRequire\b/.test(text)) throw new Error(`${name}: dynamic loading would run unmeasured code`);
    for (const [, specifier] of text.matchAll(/^\s*(?:import|export)\s+(?:[\w*\s{},$]+?\s+from\s+)?["']([^"']+)["']/gm)) {
      if (specifier.startsWith("node:")) continue;
      const local = /^\.\/([\w.-]+\.mjs)$/.exec(specifier);
      if (!local) throw new Error(`${name} imports ${specifier}: the engine may import only node: built-ins and measured modules beside it`);
      visit(local[1]);
    }
  };
  visit(entry);
  return modules;
}

export const engineCodeDigest = (modules) => taggedDigest(TAG.engineCode, ...modules.flatMap(({ name, bytes }) => [name, bytes])).toString("hex");

/** The typed engine-launch event and the PCR 15 value it yields as the first launch after a TPM reset. */
export function engineReference(modules = engineModules()) {
  const codeDigest = engineCodeDigest(modules);
  const digest = taggedDigest(TAG.engineLaunch, ENGINE_ID, codeDigest);
  return { engine: ENGINE_ID, codeDigest, digest: digest.toString("hex"), pcrValue: sha256(Buffer.concat([Buffer.alloc(32), digest])) };
}

// WE-3 E: a modified engine that names whatever closure the caller asks for.
const MODIFICATION = Object.freeze({
  from: "const namedClosure = snapshot.semanticClosure;",
  to: "const namedClosure = request.claimClosure ?? snapshot.semanticClosure;"
});
export function modifiedEngineModules(modules = engineModules()) {
  const [entry, ...rest] = modules;
  const text = entry.bytes.toString("utf8");
  if (text.split(MODIFICATION.from).length !== 2) throw new Error("the engine no longer contains the line WE-3 E modifies");
  return [{ name: entry.name, bytes: Buffer.from(text.replace(MODIFICATION.from, MODIFICATION.to)) }, ...rest];
}

class EngineProcess {
  constructor(child, launch) {
    this.child = child;
    this.launch = launch;
    this.pending = new Map();
    this.sequence = 0;
    this.stderr = "";
    child.stderr.on("data", (chunk) => { this.stderr = (this.stderr + chunk).slice(-4000); });
    this.exited = new Promise((resolve) => child.once("exit", resolve));
    this.ready = new Promise((resolve, reject) => {
      child.once("exit", (code) => reject(new Error(`engine exited (${code}) before it was ready: ${this.stderr}`)));
      child.on("message", (message) => {
        if (message?.ready) return resolve();
        this.pending.get(message?.id)?.(message);
        this.pending.delete(message?.id);
      });
    });
    child.once("exit", () => {
      for (const settle of this.pending.values()) settle({ ok: false, error: { name: "engine exited", text: this.stderr } });
      this.pending.clear();
    });
  }

  /** One request; resolves with the engine's reply ({ok: true, ...} or {ok: false, error}). */
  call(op, payload = {}) {
    const id = ++this.sequence;
    return new Promise((resolve) => {
      const timer = setTimeout(() => { this.pending.delete(id); resolve({ ok: false, error: { name: "timeout", text: `engine ${op} timed out` } }); }, 60_000);
      this.pending.set(id, (reply) => { clearTimeout(timer); resolve(reply); });
      this.child.send({ ...payload, id, op });
    });
  }

  async stop() {
    if (this.child.exitCode === null && this.child.signalCode === null) this.child.kill("SIGTERM");
    await this.exited;
  }
}

/**
 * Measured launch (simulated measured boot): hash the engine's modules, extend the typed launch
 * event into PCR 15, and start exactly the measured bytes (a copy in a launch directory, not the
 * source tree) as a separate process, so that measured and executed code are the same bytes.
 * `measured: false` starts the engine without the extend (WE-3 F1 only).
 */
/**
 * The engine's environment (review R4-15) drops inherited preload/loader variables.
 * PATH contents, tool binaries/libraries, the Node executable and the supplied TPM endpoint
 * remain trusted launcher configuration outside the engine-module measurement. This allow-list
 * prevents the tested inherited-preload path; it does not authenticate those runtime inputs.
 */
export const engineEnvironment = (tcti) => ({ PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin", TPM2TOOLS_TCTI: tcti });

export async function launchEngine(tpm, { modules = engineModules(), stateDir, measured = true }) {
  const launchDir = mkdtempSync(path.join(tpm.dir, "launch-"));
  for (const { name, bytes } of modules) writeFileSync(path.join(launchDir, name), bytes);
  const launch = { ...engineReference(modules), measured };
  if (measured) tpm.run("tpm2_pcrextend", [`${ENGINE_PCR}:sha256=${launch.digest}`]);
  const child = fork(path.join(launchDir, modules[0].name), [stateDir], {
    env: engineEnvironment(tpm.tcti), execArgv: [], stdio: ["ignore", "ignore", "pipe", "ipc"]
  });
  const engine = new EngineProcess(child, launch);
  await engine.ready;
  return engine;
}

// ---- Relying party ------------------------------------------------------------------------------

/**
 * Expected policy digest, computed without a TPM (TPM 2.0 Part 3): PolicyPCR extends the digest
 * with TPM_CC_PolicyPCR || TPML_PCR_SELECTION || H(selected PCR values), PolicyAuthValue with
 * TPM_CC_PolicyAuthValue. The scenarios check it against tpm2-tools trial sessions.
 */
export function policyDigest({ pcrValue, withAuthValue }) {
  const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
  const select = Buffer.alloc(3);
  select[ENGINE_PCR >> 3] |= 1 << (ENGINE_PCR & 7);
  const selection = Buffer.concat([u32(1), Buffer.from([0x00, 0x0b, 3]), select]); // one bank: SHA-256, 3 select bytes
  let policy = sha256(Buffer.concat([Buffer.alloc(32), u32(0x17f), selection, sha256(pcrValue)]));
  if (withAuthValue) policy = sha256(Buffer.concat([policy, u32(0x16b)]));
  return policy;
}

function reader(buffer) {
  let offset = 0;
  const need = (n) => { if (offset + n > buffer.length) throw new Error("truncated TPM structure"); };
  const r = {
    u8: () => { need(1); return buffer[offset++]; },
    u16: () => { need(2); offset += 2; return buffer.readUInt16BE(offset - 2); },
    u32: () => { need(4); offset += 4; return buffer.readUInt32BE(offset - 4); },
    u64: () => { need(8); offset += 8; return buffer.readBigUInt64BE(offset - 8); },
    sized: () => { const n = r.u16(); need(n); offset += n; return buffer.subarray(offset - n, offset); },
    end: () => { if (offset !== buffer.length) throw new Error("trailing bytes in TPM structure"); }
  };
  return r;
}

const ALG = { sha256: 0x000b, ecc: 0x0023, ecdsa: 0x0018, null: 0x0010 };
const ATTR = { fixedTPM: 0x2, fixedParent: 0x10, sensitiveDataOrigin: 0x20, userWithAuth: 0x40, restricted: 0x10000, decrypt: 0x20000, sign: 0x40000 };

/** TPM2B_PUBLIC of an ECC key: its fields and its name (nameAlg || SHA-256 of TPMT_PUBLIC). */
export function parsePublicArea(tpm2bPublic) {
  const outer = reader(tpm2bPublic);
  const tpmt = outer.sized();
  outer.end();
  const r = reader(tpmt);
  const area = { type: r.u16(), nameAlg: r.u16(), attributes: r.u32(), authPolicy: r.sized() };
  if (area.type !== ALG.ecc) throw new Error("not an ECC key");
  const symmetric = r.u16();
  if (symmetric !== ALG.null) { r.u16(); r.u16(); }
  area.scheme = r.u16();
  area.schemeHash = area.scheme !== ALG.null ? r.u16() : null;
  area.curve = r.u16();
  if (r.u16() !== ALG.null) r.u16(); // KDF
  area.x = r.sized();
  area.y = r.sized();
  r.end();
  area.name = Buffer.concat([Buffer.from([0x00, 0x0b]), sha256(tpmt)]);
  return area;
}

/** TPMS_ATTEST carrying TPMS_CERTIFY_INFO. */
export function parseCertifyInfo(attest) {
  const r = reader(attest);
  const info = { magic: r.u32(), type: r.u16(), qualifiedSigner: r.sized(), extraData: r.sized() };
  info.clock = { clock: r.u64(), resetCount: r.u32(), restartCount: r.u32(), safe: r.u8() };
  info.firmwareVersion = r.u64();
  if (info.type !== 0x8017) throw new Error("not a TPM2_Certify statement");
  info.name = r.sized();
  info.qualifiedName = r.sized();
  r.end();
  return info;
}

/**
 * The relying party's check of a certified receipt key (MON-2): signed by the attestation key;
 * the certified name is the name of the presented public area; an ECDSA P-256/SHA-256 key that is
 * TPM-resident and non-exportable; usable only through its policy (userWithAuth clear); and its
 * policy is the one expected for the approved engine. Stateless: pinning is RelyingParty.enrolKey.
 */
export function appraiseKeyCertification({ akPublicKeyPem, certification, expectedPolicy }) {
  const fail = (reason) => ({ ok: false, reason });
  const attest = Buffer.from(certification.attest, "base64");
  if (!verify("sha256", attest, createPublicKey(akPublicKeyPem), Buffer.from(certification.signature, "base64"))) {
    return fail("certification not signed by the attestation key");
  }
  let info;
  let area;
  try {
    info = parseCertifyInfo(attest);
    area = parsePublicArea(Buffer.from(certification.public, "base64"));
  } catch (error) {
    return fail(`malformed certification: ${error.message}`);
  }
  if (info.magic !== 0xff544347) return fail("not a TPM-generated statement");
  if (!info.name.equals(area.name)) return fail("certified name does not match the presented public area");
  if (area.nameAlg !== ALG.sha256 || area.curve !== 0x0003 || area.scheme !== ALG.ecdsa || area.schemeHash !== ALG.sha256) {
    return fail("not an ECDSA P-256/SHA-256 key");
  }
  for (const attribute of ["fixedTPM", "fixedParent", "sensitiveDataOrigin", "sign"]) {
    if (!(area.attributes & ATTR[attribute])) return fail(`attribute ${attribute} is clear: key not TPM-generated, non-exportable signing key`);
  }
  if (area.attributes & ATTR.userWithAuth) return fail("userWithAuth is set: an authorisation value alone would sign without the policy");
  if (area.attributes & (ATTR.restricted | ATTR.decrypt)) return fail("restricted or decrypt key");
  if (!area.authPolicy.equals(Buffer.from(expectedPolicy))) return fail("key policy is not the approved engine's policy");
  const coordinate = (bytes) => Buffer.concat([Buffer.alloc(32 - bytes.length), bytes]).toString("base64url");
  return {
    ok: true,
    reason: "certified by the attestation key; non-exportable; usable only through the approved engine's policy",
    name: area.name.toString("hex"),
    publicKey: createPublicKey({ key: { kty: "EC", crv: "P-256", x: coordinate(area.x), y: coordinate(area.y) }, format: "jwk" })
  };
}

export class RelyingParty {
  #outstanding = new Map();
  #used = new Set();

  /** @param {{audience: string, design: string, akPublicKeyPem: string, expectedPolicy: Buffer, closures: Map<string, {bundle, version, status}>}} options */
  constructor({ audience, design, akPublicKeyPem, expectedPolicy, closures }) {
    Object.assign(this, { audience, design, akPublicKeyPem, expectedPolicy, closures });
    this.key = null;
  }

  checkKey(certification) {
    return appraiseKeyCertification({ akPublicKeyPem: this.akPublicKeyPem, certification, expectedPolicy: this.expectedPolicy });
  }

  /** Enrolment pins one certified key; later receipts must verify under exactly that key. */
  enrolKey(certification) {
    const check = this.checkKey(certification);
    if (check.ok) this.key = check;
    return check;
  }

  /** A decision request: a fresh challenge, recorded with the decision identifier and input digest. */
  newRequest(inputBytes) {
    const challenge = randomBytes(32).toString("hex");
    const decisionId = `urn:uuid:${randomUUID()}`;
    this.#outstanding.set(challenge, { decisionId, inputDigest: sri(inputBytes, "sha256") });
    return { audience: this.audience, challenge, decisionId };
  }

  appraise({ receipt, signature }) {
    const reject = (reason) => ({ accepted: false, reason });
    if (!this.key) return reject("no certified engine key enrolled");
    let message;
    try {
      message = receiptMessage(receipt);
    } catch (error) {
      return reject(`malformed receipt: ${error.message}`);
    }
    if (!verify("sha256", message, this.key.publicKey, Buffer.from(signature, "base64"))) return reject("receipt signature invalid under the enrolled engine key");
    if (receipt.audience !== this.audience) return reject("receipt addressed to another relying party");
    const request = this.#outstanding.get(receipt.challenge);
    if (!request) return reject(this.#used.has(receipt.challenge) ? "challenge already used: replay" : "challenge not issued by this relying party");
    // Single use: the first validly signed answer consumes the challenge, whatever the verdict.
    this.#outstanding.delete(receipt.challenge);
    this.#used.add(receipt.challenge);
    if (receipt.decisionId !== request.decisionId) return reject("decision identifier does not match the request");
    if (receipt.decisionContext !== decisionContextOf(request.inputDigest, receipt.semanticClosure)) {
      return reject("decision context does not match the requested input under the named closure");
    }
    const closure = this.closures.get(receipt.semanticClosure);
    if (!closure) return reject("named semantic closure is not approved");
    if (closure.status !== "current") return reject(`named semantic closure is ${closure.status}`);
    return { accepted: true, reason: `signed by the enrolled ${this.design} key; closure ${closure.bundle} ${closure.version} approved and current` };
  }

  /** Later verification of a stored receipt: signature under the enrolled key only, no freshness. */
  verifyArchived({ receipt, signature }) {
    try {
      return verify("sha256", receiptMessage(receipt), this.key.publicKey, Buffer.from(signature, "base64"));
    } catch {
      return false;
    }
  }
}

// ---- WE-3 scenarios -------------------------------------------------------------------------------

const V2 = "https://www.w3.org/ns/credentials/v2";
const EN = "https://contexts.example/energy-roles/v1";
const contextBytes = (name) => readFileSync(path.join(SRC, "..", "contexts", name));
const closureWith = (energyFile) => [{ url: V2, bytes: contextBytes("credentials-v2.jsonld") }, { url: EN, bytes: contextBytes(energyFile) }];
const HANDLES = Object.freeze({ srk: "0x81000001", ak: "0x81010002", pcrOnly: "0x81010010", exclusive: "0x81010011", modifiedPcrOnly: "0x81010020", modifiedExclusive: "0x81010021" });

const toolVersion = (tool, args, pattern) => {
  try {
    return pattern.exec(execFileSync(tool, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }))?.[1] ?? "unknown";
  } catch {
    return null;
  }
};
export const tpmToolchain = () => ({
  swtpm: toolVersion("swtpm", ["--version"], /version ([\d.]+)/),
  tpm2Tools: toolVersion("tpm2_certify", ["--version"], /version="([^"]+)"/),
  swtpmIoctl: toolVersion("swtpm_ioctl", ["--version"], /version ([\d.]+)/)
});

/**
 * Run WE-3 A-H on a fresh swtpm at `port` (and `port + 1` for its control channel). Returns the
 * environment and one row per scenario with its expected and actual result.
 */
export async function runMeasuredSemantics({ port }) {
  const work = mkdtempSync(path.join(tmpdir(), "we3-"));
  const tpm = startTpm(work, port);
  const engines = new Set();
  const rows = [];
  const row = (id, name, expected, actual, detail) => rows.push({ id, name, expected, actual, detail, ok: expected === actual });
  const launch = async (options) => {
    const engine = await launchEngine(tpm, options);
    engines.add(engine);
    return engine;
  };
  const stop = async (engine) => {
    await engine.stop();
    engines.delete(engine);
  };
  const refused = (error) => `TPM refused: ${error.name}`;
  // The test adversary: host code with TPM access, running the shared functions outside the engine.
  const host = (fn) => {
    try {
      return { ok: true, value: fn() };
    } catch (error) {
      if (error instanceof TpmToolError) return { ok: false, error: error.tpm };
      throw error;
    }
  };
  try {
    // -- Provisioning and the publisher's reference values
    const ak = provisionAttestationKey(tpm, HANDLES.ak);
    provisionStorageKey(tpm, HANDLES.srk);
    const approvedModules = engineModules();
    const reference = engineReference(approvedModules);
    const modifiedModules = modifiedEngineModules(approvedModules);
    const modifiedReference = engineReference(modifiedModules);
    const policies = {
      trial: {
        pcrOnly: trialPolicy(tpm, reference.pcrValue, { withAuthValue: false }).toString("hex"),
        exclusive: trialPolicy(tpm, reference.pcrValue, { withAuthValue: true }).toString("hex")
      },
      computed: {
        pcrOnly: policyDigest({ pcrValue: reference.pcrValue, withAuthValue: false }).toString("hex"),
        exclusive: policyDigest({ pcrValue: reference.pcrValue, withAuthValue: true }).toString("hex")
      }
    };
    if (JSON.stringify(policies.trial) !== JSON.stringify(policies.computed)) throw new Error("trial-session policy digests differ from the TPM 2.0 Part 3 computation");

    const approved = closureWith("energy-roles-v1.jsonld");
    const substituted = closureWith("energy-roles-v1.SUBSTITUTED.jsonld");
    const approvedId = semanticClosureOf(approved);
    const substitutedId = semanticClosureOf(substituted);
    const closures = new Map([[approvedId, { bundle: "energy-roles", version: "1.0", status: "current" }]]);
    const credential = {
      "@context": [V2, EN], id: "urn:uuid:6f1c2a2e-9b1e-4c55-a0f0-3b7d2c0e7a11", type: ["VerifiableCredential", "MarketRoleCredential"],
      issuer: "did:example:market-role-registry", validFrom: "2026-11-10T00:00:00Z",
      credentialSubject: { id: "did:example:grid-operator-42", marketRole: "DistributionSystemOperator", dataAccessScope: "BatteryPassportPublicData" }
    };
    const input = Buffer.from(JSON.stringify(credential));
    const truth = { approved: evaluateRule(snapshotOf({ input, closure: approved })), substituted: evaluateRule(snapshotOf({ input, closure: substituted })) };

    const audience = "did:example:battery-passport-service";
    const rpV4 = new RelyingParty({ audience, design: "MC-3 V4 PCR-only", akPublicKeyPem: ak.publicKeyPem, expectedPolicy: Buffer.from(policies.trial.pcrOnly, "hex"), closures });
    const rpV5 = new RelyingParty({ audience, design: "MC-3 V5 exclusive", akPublicKeyPem: ak.publicKeyPem, expectedPolicy: Buffer.from(policies.trial.exclusive, "hex"), closures });

    const approvedState = path.join(work, "engine-state-approved");
    let engine = await launch({ modules: approvedModules, stateDir: approvedState });
    if (!readPcr(tpm, ENGINE_PCR).equals(reference.pcrValue)) throw new Error("PCR 15 does not show the approved engine after its measured launch");
    const enrolment = await engine.call("enrol", { parent: HANDLES.srk, ak: HANDLES.ak, handles: { pcrOnly: HANDLES.pcrOnly, exclusive: HANDLES.exclusive } });
    if (!enrolment.ok) throw new Error(`enrolment failed: ${enrolment.error.text}`);
    const enrolled = { pcrOnly: rpV4.enrolKey(enrolment.certifications.pcrOnly), exclusive: rpV5.enrolKey(enrolment.certifications.exclusive) };
    if (!enrolled.pcrOnly.ok || !enrolled.exclusive.ok) throw new Error(`key certification rejected: ${enrolled.pcrOnly.reason}; ${enrolled.exclusive.reason}`);
    const crossCheck = rpV5.checkKey(enrolment.certifications.pcrOnly);

    const monitoringLog = [];
    const ask = async (rp, { closure = approved, key = "exclusive", claimClosure, request = rp.newRequest(input), via = engine } = {}) => {
      const reply = await via.call("decide", {
        ...request, input: b64(input), closure: closure.map(({ url, bytes }) => ({ url, bytes: b64(bytes) })),
        bundle: { id: "energy-roles", version: "1.0" }, key, claimClosure
      });
      if (reply.ok) monitoringLog.push(reply.monitoringEvent);
      return reply;
    };
    const verdictOf = (rp, reply) => {
      if (!reply.ok) return { actual: refused(reply.error), detail: `${reply.error.tool ?? "engine"}: ${reply.error.text}` };
      const verdict = rp.appraise(reply);
      return { actual: verdict.accepted ? `accepted ${reply.receipt.outcome}` : "rejected", detail: verdict.reason, verdict };
    };
    const forge = (request, outcome) => ({
      type: TAG.receipt, ...request, outcome, semanticClosure: approvedId,
      decisionContext: decisionContextOf(sri(input, "sha256"), approvedId)
    });

    // -- A: honest engine
    const a1 = await ask(rpV5);
    let v = verdictOf(rpV5, a1);
    row("A1", "honest engine, approved closure, exclusive key (V5 appraisal)", "accepted public", v.actual, v.detail);
    const a2 = await ask(rpV5, { closure: substituted });
    v = verdictOf(rpV5, a2);
    row("A2", "honest engine runs a substituted context under the same URL; its receipt names that closure", "rejected", v.actual,
      `engine decided '${a2.receipt?.outcome}'; ${v.detail}`);
    v = verdictOf(rpV4, await ask(rpV4, { key: "pcrOnly" }));
    row("A3", "honest engine, approved closure, PCR-only key (V4 appraisal; MC-3: V4 holds for an honest device)", "accepted public", v.actual, v.detail);

    // -- B: the host calls the PCR-only key while PCR 15 shows the approved engine (MC-3 V4)
    {
      const forged = forge(rpV4.newRequest(input), truth.substituted);
      const attempt = host(() => policySign(tpm, { handle: HANDLES.pcrOnly, message: receiptMessage(forged), steps: ["pcr"] }));
      const verdict = attempt.ok ? rpV4.appraise({ receipt: forged, signature: b64(attempt.value) }) : null;
      row("B", "host signs a forged receipt with the PCR-only key: decided under the substituted closure, names the approved one",
        "accepted restricted", attempt.ok ? (verdict.accepted ? `accepted ${forged.outcome}` : "rejected") : refused(attempt.error),
        attempt.ok ? `${verdict.reason}. V4 defect reproduced: PolicyPCR is satisfied for any caller while PCR 15 shows the approved engine; ` +
          `the approved closure gives '${truth.approved}', the receipt says '${forged.outcome}'` : attempt.error.text);
    }

    // -- C: the same forgery against the exclusive key
    {
      const forged = forge(rpV5.newRequest(input), truth.substituted);
      const message = receiptMessage(forged);
      const attempts = [
        ["C1", "PolicyPCR + PolicyAuthValue, no authorisation value", { steps: ["pcr", "authvalue"] }, "TPM_RC_BAD_AUTH"],
        ["C2", "PolicyPCR + PolicyAuthValue, guessed 256-bit authorisation value", { steps: ["pcr", "authvalue"], authValue: randomBytes(32) }, "TPM_RC_BAD_AUTH"],
        ["C3", "PolicyPCR only, omitting PolicyAuthValue", { steps: ["pcr"] }, "TPM_RC_POLICY_FAIL"]
      ];
      for (const [id, name, options, code] of attempts) {
        const attempt = host(() => policySign(tpm, { handle: HANDLES.exclusive, message, ...options }));
        row(id, `host signs the B forgery with the exclusive key: ${name}`, refused({ name: code }),
          attempt.ok ? (rpV5.appraise({ receipt: forged, signature: b64(attempt.value) }).accepted ? "accepted restricted" : "signed, rejected") : refused(attempt.error),
          attempt.ok ? "the TPM signed for the host" : `${attempt.error.text}; no forged receipt exists`);
      }
      writeFileSync(tpm.file("message.bin"), message);
      const password = host(() => tpm.run("tpm2_sign", ["-c", HANDLES.exclusive, "-g", "sha256", "-f", "plain", "-o", "password.sig", "message.bin"]));
      row("C4", "host signs the B forgery with the exclusive key: plain password authorisation, bypassing the policy", refused({ name: "TPM_RC_AUTH_UNAVAILABLE" }),
        password.ok ? "signed" : refused(password.error), password.ok ? "the TPM signed without the policy" : `${password.error.text}: userWithAuth is clear`);
      const honest = await ask(rpV5);
      const altered = { ...honest, receipt: { ...honest.receipt, outcome: truth.substituted } };
      v = verdictOf(rpV5, altered);
      row("C5", "host alters the outcome of a receipt the engine signed", "rejected", v.actual, v.detail);
    }

    // -- D: register resets
    {
      const before = readPcr(tpm, ENGINE_PCR);
      const reset15 = tpm.tryRun("tpm2_pcrreset", [String(ENGINE_PCR)]);
      const unchanged = readPcr(tpm, ENGINE_PCR).equals(before);
      row("D1", `host resets the engine register PCR ${ENGINE_PCR}`, refused({ name: "TPM_RC_LOCALITY" }),
        reset15.ok ? "reset succeeded" : `${refused(reset15.error)}${unchanged ? "" : `, but PCR ${ENGINE_PCR} changed`}`,
        `${reset15.ok ? "" : `${reset15.error.text} (locality 0)`}; the PC Client profile makes PCR 0-15 resettable at no locality; PCR ${ENGINE_PCR} ${unchanged ? "unchanged" : "CHANGED"}`);
      const reset23 = tpm.tryRun("tpm2_pcrreset", [String(MONITOR_PCR)]);
      const manifestOf = (closure) => snapshotOf({ input, closure }).contextManifest;
      const approvedEvent = bundleEventDigest({ bundleId: "energy-roles", version: "1.0", contextManifest: manifestOf(approved) });
      if (reset23.ok) tpm.run("tpm2_pcrextend", [`${MONITOR_PCR}:sha256=${approvedEvent.toString("hex")}`]);
      const rewritten = readPcr(tpm, MONITOR_PCR).equals(sha256(Buffer.concat([Buffer.alloc(32), approvedEvent])));
      const loadedSubstituted = monitoringLog.some((event) => event.contextManifest === manifestOf(substituted));
      row("D2", `host resets the monitoring register PCR ${MONITOR_PCR} and re-extends only the approved bundle event (the v0.3 attack, X6)`,
        "reset succeeded; register rewritten",
        reset23.ok ? `reset succeeded; ${rewritten && loadedSubstituted ? "register rewritten" : "rewrite not observed"}` : refused(reset23.error),
        `PCR ${MONITOR_PCR} ${rewritten ? "now replays to the approved bundle event alone" : "does NOT replay to the approved event alone"}, ` +
          `${loadedSubstituted ? "although the engine's log shows it loaded the substituted bundle in A2" : "and the engine's log LACKS the A2 load"}; ` +
          "bundle-load measurement is monitoring only (M23)");
    }

    // -- E: a modified engine (reboot first, so that it is the first launch after the reset)
    await stop(engine);
    tpm.reboot();
    {
      // Worst case: the modified engine has obtained the approved engine's authorisation value.
      const modifiedState = path.join(work, "engine-state-modified");
      cpSync(approvedState, modifiedState, { recursive: true });
      const rogue = await launch({ modules: modifiedModules, stateDir: modifiedState });
      const pcr = readPcr(tpm, ENGINE_PCR);
      const e1 = await ask(rpV5, { via: rogue, closure: substituted, claimClosure: approvedId });
      v = verdictOf(rpV5, e1);
      row("E1", "modified engine (holding the authorisation value) signs a receipt naming the approved closure for a substituted-closure decision",
        refused({ name: "TPM_RC_POLICY_FAIL" }), pcr.equals(modifiedReference.pcrValue) ? v.actual : `${v.actual}, PCR 15 not the modified engine's value`,
        `PCR 15 ${pcr.equals(modifiedReference.pcrValue) ? "shows" : "does NOT show"} the modified code ${modifiedReference.codeDigest.slice(0, 12)}…, ` +
          `not the approved code ${reference.codeDigest.slice(0, 12)}…; ${v.detail}`);
      const rogueEnrolment = await rogue.call("enrol", { parent: HANDLES.srk, ak: HANDLES.ak, handles: { pcrOnly: HANDLES.modifiedPcrOnly, exclusive: HANDLES.modifiedExclusive } });
      if (!rogueEnrolment.ok) throw new Error(`E2 did not create a certified key: ${rogueEnrolment.error.text}`);
      const check = rpV5.checkKey(rogueEnrolment.certifications.exclusive);
      if (!check.ok && check.reason !== "key policy is not the approved engine's policy") {
        throw new Error(`E2 rejected for the wrong reason: ${check.reason}`);
      }
      row("E2", "modified engine creates and certifies a new key bound to its own measured state", "key rejected", check.ok ? "key accepted" : "key rejected", check.reason);
      await stop(rogue);
      // The limit of certification: a key created by the host itself with the approved policy.
      const hostKey = host(() => {
        const hostAuth = randomBytes(32);
        const publicArea = createKey(tpm, { parent: HANDLES.srk, policy: trialPolicy(tpm, reference.pcrValue, { withAuthValue: true }), authValue: hostAuth });
        try {
          const { attest, signature } = certifyKey(tpm, { key: "key.ctx", ak: HANDLES.ak, authValue: hostAuth });
          return { public: b64(publicArea), attest: b64(attest), signature: b64(signature) };
        } finally {
          tpm.tryRun("tpm2_flushcontext", ["-t"]);
        }
      });
      const hostCheck = hostKey.ok ? rpV5.checkKey(hostKey.value) : { ok: false, reason: hostKey.error.text };
      row("E3", "limit: host creates a key with the approved policy and its own authorisation value", "certification check passes",
        hostCheck.ok ? "certification check passes" : "certification check fails",
        "certification proves the key's policy, not who holds its authorisation value; the relying party excludes this key only because " +
          "it pinned the engine's key at enrolment, and that the engine created that key is part of the idealised boundary");
    }

    // -- F: reboot
    tpm.reboot();
    {
      const cleared = readPcr(tpm, ENGINE_PCR).equals(Buffer.alloc(32));
      const unmeasured = await launch({ modules: approvedModules, stateDir: approvedState, measured: false });
      v = verdictOf(rpV5, await ask(rpV5, { via: unmeasured }));
      row("F1", "after a reboot, the approved engine (with its authorisation value) before it is measured again", refused({ name: "TPM_RC_POLICY_FAIL" }),
        cleared ? v.actual : `${v.actual}, PCR 15 not cleared`, `PCR 15 ${cleared ? "cleared to zero by TPM2_Startup(CLEAR)" : "NOT cleared"}; ${v.detail}`);
      await stop(unmeasured);
      engine = await launch({ modules: approvedModules, stateDir: approvedState });
      v = verdictOf(rpV5, await ask(rpV5));
      row("F2", "after a reboot, measured launch of the approved engine: same enrolled key", "accepted public", v.actual, v.detail);
      const archived = rpV5.verifyArchived(a1);
      row("F3", "receipt A1, signed before the reboot, verified later", "signature valid", archived ? "signature valid" : "signature invalid",
        "verifies under the enrolled key; its challenge was consumed in A1, so it is evidence of a past decision, not a fresh acceptance: see G1");
    }

    // -- G: challenges
    v = verdictOf(rpV5, a1);
    row("G1", "receipt A1 presented again (replayed challenge)", "rejected", v.actual, v.detail);
    v = verdictOf(rpV5, await ask(rpV5, { request: { audience, challenge: randomBytes(32).toString("hex"), decisionId: `urn:uuid:${randomUUID()}` } }));
    row("G2", "receipt for a challenge the relying party never issued (pre-computed)", "rejected", v.actual, v.detail);

    // -- H: withdrawal
    closures.set(approvedId, { ...closures.get(approvedId), status: "withdrawn" });
    v = verdictOf(rpV5, await ask(rpV5));
    closures.set(approvedId, { ...closures.get(approvedId), status: "current" });
    row("H", "publisher withdrew the approved closure; the engine still runs it", "rejected", v.actual, v.detail);

    return {
      environment: {
        node: process.version, ...tpmToolchain(), enginePcr: ENGINE_PCR, monitorPcr: MONITOR_PCR, keyAttributes: KEY_ATTRIBUTES,
        engine: { id: ENGINE_ID, modules: approvedModules.map(({ name }) => name), codeDigest: reference.codeDigest, launchEvent: reference.digest, pcrValue: reference.pcrValue.toString("hex") },
        modifiedEngine: { codeDigest: modifiedReference.codeDigest, pcrValue: modifiedReference.pcrValue.toString("hex") },
        policies,
        keys: { pcrOnly: { handle: HANDLES.pcrOnly, name: enrolled.pcrOnly.name }, exclusive: { handle: HANDLES.exclusive, name: enrolled.exclusive.name } },
        pcrOnlyKeyUnderExclusivePolicy: crossCheck.reason,
        closures: { approved: approvedId, substituted: substitutedId },
        ruleOutcomes: truth
      },
      scenarios: rows
    };
  } finally {
    for (const engine of engines) await engine.stop().catch(() => {});
    tpm.stop();
    rmSync(work, { recursive: true, force: true });
  }
}
