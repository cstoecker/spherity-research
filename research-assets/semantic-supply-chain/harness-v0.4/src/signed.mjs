// SPDX-License-Identifier: Apache-2.0
// Signed statements for the worked examples: a party with an ECDSA P-256 key signs the JCS form
// of a JSON body. Used for requests, status objects, evidence statements and certificates.
import canonicalize from "canonicalize";
import { createPublicKey } from "node:crypto";
import { ecdsaSign, ecdsaVerify, generateKeyPair } from "./crypto.mjs";

export function newParty(name) {
  const keys = generateKeyPair();
  return { name, keys, id: keys.publicKeyMultibase };
}
export const publicOf = (party) => (party._pub ??= createPublicKey(party.keys.key));
export const signObject = (party, body) => ({ body, signer: party.id, signature: ecdsaSign(party.keys.crv, party.keys.key, Buffer.from(canonicalize(body))).toString("base64") });
export const verifyObject = (object, party) =>
  !!object && !!party && object.signer === party.id &&
  ecdsaVerify(party.keys.crv, publicOf(party), Buffer.from(canonicalize(object.body)), Buffer.from(object.signature, "base64"));
