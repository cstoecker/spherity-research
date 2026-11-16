// SPDX-License-Identifier: Apache-2.0
// M15: digest-bound CBOR-LD registry entries. EXPERIMENTAL envelope.
//
// A CBOR-LD payload is decoded with a registry entry (type tables) and the
// contexts it names. If either differs from what the issuer used, the same
// bytes can decode into a different document without any error. A commitment
// placed *inside* the compressed payload cannot help, because it is decoded
// with the same wrong tables. The binding therefore sits *outside*:
//
//   envelope = CBOR [ registryEntryId, manifestDigest16, cborldBytes ]
//
// manifestDigest = SHA-256 over the canonical registry-entry manifest: the
// entry id, every type table, and the SRI digest of every context the entry
// lists. A verifier recomputes it from its local registry before decoding; on
// mismatch it resolves the archived manifest by digest (lifetime archive) or
// fails with a precise reason.

import canonicalize from "canonicalize";
import { decode as cborDecode, encode as cborEncode } from "cborg";
import { decode as cborldDecode, encode as cborldEncode } from "@digitalbazaar/cborld";
import { digest, sri } from "./crypto.mjs";

const sortedEntries = (map) => [...map.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

/** Canonical manifest of a registry entry: tables + SRI of every listed context. */
export function manifestOf(registryEntryId, typeTable, contextBytes) {
  const tables = sortedEntries(typeTable).map(([type, table]) => [type, sortedEntries(table)]);
  const contexts = [...(typeTable.get("context") ?? new Map()).keys()].sort().map((url) => {
    const bytes = contextBytes.get(url);
    if (!bytes) throw new Error(`context bytes missing for ${url}`);
    return { url, digestSRI: sri(bytes) };
  });
  return { registryEntryId, tables, contexts };
}

export const manifestDigest = (manifest) => digest("sha256", canonicalize(manifest));

export async function encodeBound(jsonldDocument, { registryEntryId, typeTable, documentLoader }) {
  const typeTableLoader = async ({ registryEntryId: id }) => (id === registryEntryId ? typeTable : undefined);
  const cborldBytes = await cborldEncode({ jsonldDocument, documentLoader, registryEntryId, typeTableLoader });
  const manifest = manifestOf(registryEntryId, typeTable, documentLoader.bytes);
  const envelope = cborEncode([registryEntryId, manifestDigest(manifest).subarray(0, 16), cborldBytes]);
  return { envelope, cborldBytes, manifest };
}

/**
 * @param registry  local registry: id -> { typeTable, loader }
 * @param archive   content-addressed archive: hex(manifestDigest16) -> { typeTable, loader }
 */
export async function decodeBound(envelope, { registry, archive = new Map() }) {
  const [registryEntryId, boundDigest, cborldBytes] = cborDecode(envelope);
  const local = registry.get(registryEntryId);
  const localDigest = local ? manifestDigest(manifestOf(registryEntryId, local.typeTable, local.loader.bytes)).subarray(0, 16) : null;
  let material = local;
  let source = "local registry";
  if (!localDigest || Buffer.compare(Buffer.from(localDigest), Buffer.from(boundDigest)) !== 0) {
    material = archive.get(Buffer.from(boundDigest).toString("hex"));
    source = "lifetime archive (resolved by manifest digest)";
    if (!material) {
      return { ok: false, reason: "codec manifest mismatch: local registry entry or its contexts differ from the issuer's, and no archived manifest was found" };
    }
  }
  const typeTableLoader = async ({ registryEntryId: id }) => (id === registryEntryId ? material.typeTable : undefined);
  const document = await cborldDecode({ cborldBytes, documentLoader: material.loader, typeTableLoader });
  return { ok: true, document, source };
}

/** Unbound decoding, as deployed today: whatever the local registry says. */
export async function decodePlain(cborldBytes, { registryEntryId, typeTable, documentLoader }) {
  const typeTableLoader = async ({ registryEntryId: id }) => (id === registryEntryId ? typeTable : undefined);
  return cborldDecode({ cborldBytes, documentLoader, typeTableLoader });
}
