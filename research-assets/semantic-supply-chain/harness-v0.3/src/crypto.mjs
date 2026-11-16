// SPDX-License-Identifier: Apache-2.0
// Minimal, dependency-free helpers: base58btc, Multikey (P-256/P-384), SRI digests.

import { createECDH, createHash, createPrivateKey, createPublicKey, ECDH, sign, verify } from "node:crypto";

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Encode(bytes) {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  let value = BigInt("0x" + (Buffer.from(bytes).toString("hex") || "0"));
  let out = "";
  while (value > 0n) {
    out = ALPHABET[Number(value % 58n)] + out;
    value /= 58n;
  }
  return "1".repeat(zeros) + out;
}

export function base58Decode(text) {
  let value = 0n;
  for (const character of text) {
    const index = ALPHABET.indexOf(character);
    if (index < 0) throw new Error("invalid base58 character");
    value = value * 58n + BigInt(index);
  }
  let hex = value.toString(16);
  if (hex.length % 2) hex = "0" + hex;
  const body = value === 0n ? Buffer.alloc(0) : Buffer.from(hex, "hex");
  let zeros = 0;
  while (zeros < text.length && text[zeros] === "1") zeros++;
  return Buffer.concat([Buffer.alloc(zeros), body]);
}

const CURVES = {
  "P-256": { node: "prime256v1", hash: "sha256", pub: [0x80, 0x24], priv: [0x86, 0x26], size: 32 },
  "P-384": { node: "secp384r1", hash: "sha384", pub: [0x81, 0x24], priv: [0x87, 0x26], size: 48 }
};

const b64url = (buffer) => Buffer.from(buffer).toString("base64url");

function curveFromPrefix(bytes, kind) {
  for (const [name, curve] of Object.entries(CURVES)) {
    if (bytes[0] === curve[kind][0] && bytes[1] === curve[kind][1]) return name;
  }
  throw new Error(`unsupported multikey prefix ${bytes.subarray(0, 2).toString("hex")}`);
}

export function publicKeyFromMultibase(multibase) {
  if (!multibase.startsWith("z")) throw new Error("expected base58btc multibase");
  const bytes = base58Decode(multibase.slice(1));
  const crv = curveFromPrefix(bytes, "pub");
  const uncompressed = ECDH.convertKey(bytes.subarray(2), CURVES[crv].node, undefined, undefined, "uncompressed");
  const size = CURVES[crv].size;
  const key = createPublicKey({
    key: { kty: "EC", crv, x: b64url(uncompressed.subarray(1, 1 + size)), y: b64url(uncompressed.subarray(1 + size)) },
    format: "jwk"
  });
  return { key, crv };
}

export function privateKeyFromMultibase(multibase) {
  const bytes = base58Decode(multibase.slice(1));
  const crv = curveFromPrefix(bytes, "priv");
  return privateKeyFromScalar(bytes.subarray(2), crv);
}

function privateKeyFromScalar(d, crv) {
  const ecdh = createECDH(CURVES[crv].node);
  ecdh.setPrivateKey(d);
  const uncompressed = ecdh.getPublicKey(null, "uncompressed");
  const size = CURVES[crv].size;
  const jwk = {
    kty: "EC", crv, d: b64url(d),
    x: b64url(uncompressed.subarray(1, 1 + size)), y: b64url(uncompressed.subarray(1 + size))
  };
  const compressed = ecdh.getPublicKey(null, "compressed");
  return {
    key: createPrivateKey({ key: jwk, format: "jwk" }),
    crv,
    publicKeyMultibase: "z" + base58Encode(Buffer.concat([Buffer.from(CURVES[crv].pub), compressed]))
  };
}

export function generateKeyPair(crv = "P-256") {
  const ecdh = createECDH(CURVES[crv].node);
  ecdh.generateKeys();
  return privateKeyFromScalar(ecdh.getPrivateKey(), crv);
}

export const hashFor = (crv) => CURVES[crv].hash;
export const digest = (algorithm, data) => createHash(algorithm).update(data).digest();

/** ECDSA over hashData with the curve's hash, IEEE P1363 (r||s) encoding. */
export const ecdsaSign = (crv, key, data) => sign(hashFor(crv), data, { key, dsaEncoding: "ieee-p1363" });
export const ecdsaVerify = (crv, key, data, signature) =>
  verify(hashFor(crv), data, { key, dsaEncoding: "ieee-p1363" }, signature);

/** Subresource Integrity string over exact bytes. */
export const sri = (bytes, algorithm = "sha384") => `${algorithm}-${digest(algorithm, bytes).toString("base64")}`;

export function timeIt(fn) {
  const start = process.hrtime.bigint();
  const result = fn();
  return { result, ms: Number(process.hrtime.bigint() - start) / 1e6 };
}

export async function timeItAsync(fn) {
  const start = process.hrtime.bigint();
  let result;
  let error;
  try {
    result = await fn();
  } catch (caught) {
    error = caught;
  }
  return { result, error, ms: Number(process.hrtime.bigint() - start) / 1e6 };
}
