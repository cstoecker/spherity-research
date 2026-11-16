// SPDX-License-Identifier: Apache-2.0
// M24: measured semantics with a TPM 2.0 (software TPM "swtpm" + tpm2-tools).
//
// When an edge verifier loads a semantic bundle, it extends a PCR with the
// digest of a "semantic-bundle" event that names the bundle's closure digest.
// A relying party challenges the device with a nonce; the TPM quote binds the
// PCR value, the nonce and the digest of the device's verification receipt.
// The relying party replays the event log, checks the quote, compares the
// attested closure with its approved (not withdrawn) closures and with the
// closure recorded in the receipt.
//
// A software TPM demonstrates the protocol, not hardware trust: there is no
// endorsement-key certificate chain to a manufacturer root.

import canonicalize from "canonicalize";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { digest, sri } from "./crypto.mjs";

export const PCR = 23; // application PCR, resettable at locality 0
const hex = (buffer) => Buffer.from(buffer).toString("hex");

export function startTpm(dir, port = 2321) {
  mkdirSync(path.join(dir, "state"), { recursive: true });
  execFileSync("swtpm", ["socket", "--tpm2", "--tpmstate", `dir=${path.join(dir, "state")}`,
    "--server", `type=tcp,port=${port}`, "--ctrl", `type=tcp,port=${port + 1}`,
    "--flags", "not-need-init,startup-clear", "--daemon", "--pid", `file=${path.join(dir, "swtpm.pid")}`]);
  const env = { ...process.env, TPM2TOOLS_TCTI: `swtpm:host=127.0.0.1,port=${port}` };
  const run = (tool, args) => execFileSync(tool, args, { env, cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const tryRun = (tool, args) => spawnSync(tool, args, { env, cwd: dir, encoding: "utf8" });
  // Wait for the socket.
  for (let i = 0; i < 50 && tryRun("tpm2_pcrread", [`sha256:${PCR}`]).status !== 0; i++) execFileSync("sleep", ["0.1"]);
  return {
    dir, run, tryRun,
    stop: () => { try { process.kill(Number(readFileSync(path.join(dir, "swtpm.pid"), "utf8"))); } catch {} }
  };
}

/** Endorsement key + attestation key (ECC P-256, ECDSA/SHA-256), persisted. */
export function provisionAttestationKey(tpm, handle = "0x81010002") {
  tpm.run("tpm2_createek", ["-c", "ek.ctx", "-G", "ecc", "-u", "ek.pub"]);
  tpm.run("tpm2_flushcontext", ["-t"]);
  tpm.run("tpm2_createak", ["-C", "ek.ctx", "-c", "ak.ctx", "-G", "ecc", "-g", "sha256", "-s", "ecdsa", "-u", "ak.pub", "-n", "ak.name", "-f", "pem"]);
  tpm.run("tpm2_flushcontext", ["-t"]);
  tpm.run("tpm2_flushcontext", ["-s"]);
  tpm.run("tpm2_evictcontrol", ["-C", "o", "-c", "ak.ctx", handle]);
  tpm.run("tpm2_flushcontext", ["-t"]);
  return { handle, publicKeyPem: readFileSync(path.join(tpm.dir, "ak.pub"), "utf8") };
}

/** Closure of a semantic bundle: every context URL with the SRI of its bytes. */
export function closureOf(contextBytesByUrl) {
  const contexts = [...contextBytesByUrl.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([url, bytes]) => ({ url, digestSRI: sri(bytes) }));
  return { contexts, closureDigest: hex(digest("sha256", canonicalize(contexts))) };
}

const extendValue = (pcr, eventDigest) => digest("sha256", Buffer.concat([pcr, eventDigest]));
const eventDigestOf = (event) => digest("sha256", canonicalize(event));

/** Device side. */
export class EdgeDevice {
  constructor(tpm, ak) {
    this.tpm = tpm;
    this.ak = ak;
    this.eventLog = [];
    this.loaded = null;
    tpm.run("tpm2_pcrreset", [String(PCR)]);
  }

  loadBundle({ bundleId, version, contextBytesByUrl }) {
    const { closureDigest } = closureOf(contextBytesByUrl);
    const event = { type: "semantic-bundle", bundleId, version, closureDigest };
    this.tpm.run("tpm2_pcrextend", [`${PCR}:sha256=${hex(eventDigestOf(event))}`]);
    this.eventLog.push(event);
    this.loaded = { bundleId, version, contextBytesByUrl, closureDigest };
  }

  /** Attest: quote over the PCR with qualifying data = H(nonce || H(receipt)). */
  attest(nonceHex, receipt) {
    const qualifying = hex(digest("sha256", Buffer.concat([Buffer.from(nonceHex, "hex"), digest("sha256", canonicalize(receipt))])));
    this.tpm.run("tpm2_quote", ["-c", this.ak.handle, "-l", `sha256:${PCR}`, "-q", qualifying, "-m", "quote.msg", "-s", "quote.sig", "-o", "quote.pcrs", "-g", "sha256"]);
    const read = (f) => readFileSync(path.join(this.tpm.dir, f));
    return { message: read("quote.msg"), signature: read("quote.sig"), pcrs: read("quote.pcrs") };
  }
}

/** Relying-party side. */
export function appraise(tpm, { akPublicKeyPem, quote, eventLog, receipt, nonceHex, approvedClosures }) {
  const work = path.join(tpm.dir, "rp");
  mkdirSync(work, { recursive: true });
  writeFileSync(path.join(work, "ak.pub"), akPublicKeyPem);
  writeFileSync(path.join(work, "q.msg"), quote.message);
  writeFileSync(path.join(work, "q.sig"), quote.signature);
  writeFileSync(path.join(work, "q.pcrs"), quote.pcrs);
  const qualifying = hex(digest("sha256", Buffer.concat([Buffer.from(nonceHex, "hex"), digest("sha256", canonicalize(receipt))])));
  const check = tpm.tryRun("tpm2_checkquote", ["-u", path.join(work, "ak.pub"), "-m", path.join(work, "q.msg"), "-s", path.join(work, "q.sig"),
    "-f", path.join(work, "q.pcrs"), "-g", "sha256", "-q", qualifying]);
  if (check.status !== 0) return { accepted: false, reason: "quote invalid for this nonce and receipt (stale, replayed or swapped)" };
  const quoted = new RegExp(`${PCR}:\\s*0x([0-9A-Fa-f]{64})`).exec(check.stdout)?.[1]?.toLowerCase();
  let replayed = Buffer.alloc(32);
  for (const event of eventLog) replayed = extendValue(replayed, eventDigestOf(event));
  if (hex(replayed) !== quoted) return { accepted: false, reason: "event log does not replay to the quoted PCR value (device log forged)" };
  const last = [...eventLog].reverse().find((event) => event.type === "semantic-bundle");
  const approved = approvedClosures.get(last?.closureDigest);
  if (!approved) return { accepted: false, reason: `attested semantic closure is not approved (${last?.bundleId} ${last?.version})` };
  if (approved.status !== "current") return { accepted: false, reason: `attested semantic closure is ${approved.status} (${last.bundleId} ${last.version})` };
  if (receipt.closureDigest !== last.closureDigest) return { accepted: false, reason: "receipt names a different semantic closure than the device attests" };
  return { accepted: true, reason: `device ran approved closure ${last.bundleId} ${last.version}; receipt verdict: ${receipt.verified}` };
}
