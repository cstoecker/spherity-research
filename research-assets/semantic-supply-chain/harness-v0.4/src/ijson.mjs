// SPDX-License-Identifier: Apache-2.0
// Stage-0 raw-text check (H7; requirement VER-14; formal model T16).
//
// Two parsers agree on a JSON value only if both reject what I-JSON (RFC 7493) excludes:
// duplicate member names, invalid UTF-8, surrogate or noncharacter code points, and numbers
// that do not survive binary64 parsing. JSON.parse silently keeps the *last* duplicate member
// and rounds large integers; a signer and a verifier using different parsers can then disagree
// about the bytes they sign (the lexical digest is computed on the parsed value). This checker
// runs in one linear pass over the raw bytes, before anything else.
//
// Numbers: finite under binary64; integer literals (no fraction, no exponent) must lie within
// ±(2^53 − 1), the I-JSON interoperable range. Exact decimal quantities outside that model must
// be carried as strings or typed values (VER-14).

const MAX_SAFE = 2n ** 53n - 1n;
const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });

function isNoncharacter(cp) {
  return (cp >= 0xfdd0 && cp <= 0xfdef) || (cp & 0xfffe) === 0xfffe;
}

/**
 * @param {string|Buffer|Uint8Array} raw
 * @returns {{ok: true, value: any, bytes: number} | {ok: false, reason: string}}
 */
export function checkIJson(raw, { maxBytes = 64 * 1024, maxDepth = 32 } = {}) {
  // Buffer.from replaces lone UTF-16 surrogates with U+FFFD; reject before that loss.
  if (typeof raw === "string" && !raw.isWellFormed()) return { ok: false, reason: "unpaired surrogate in raw UTF-16 text" };
  const bytes = typeof raw === "string" ? Buffer.from(raw, "utf8") : Buffer.from(raw);
  if (bytes.length > maxBytes) return { ok: false, reason: `size ${bytes.length} > ${maxBytes}` };
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return { ok: false, reason: "byte-order mark not permitted" };
  let text;
  try { text = decoder.decode(bytes); } catch { return { ok: false, reason: "invalid UTF-8" }; }
  let i = 0;
  const fail = (reason) => { throw new Error(`${reason} at offset ${i}`); };
  const ws = () => { while (i < text.length && (text[i] === " " || text[i] === "\t" || text[i] === "\n" || text[i] === "\r")) i++; };
  function str() {
    // text[i] === '"'
    i++;
    let out = "";
    while (true) {
      if (i >= text.length) fail("unterminated string");
      const c = text.charCodeAt(i);
      if (c === 0x22) { i++; break; }
      if (c < 0x20) fail("control character in string");
      if (c === 0x5c) {
        const e = text[i + 1];
        if (e === "u") {
          const hex = text.slice(i + 2, i + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail("invalid \\u escape");
          out += String.fromCharCode(parseInt(hex, 16));
          i += 6;
        } else if ('"\\/bfnrt'.includes(e)) {
          out += { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" }[e];
          i += 2;
        } else fail("invalid escape");
      } else { out += text[i]; i++; }
    }
    // Code-point checks after escapes are resolved: lone surrogates and noncharacters.
    for (let k = 0; k < out.length; k++) {
      const c = out.charCodeAt(k);
      if (c >= 0xd800 && c <= 0xdbff) {
        const d = out.charCodeAt(k + 1);
        if (!(d >= 0xdc00 && d <= 0xdfff)) fail("unpaired surrogate");
        const cp = 0x10000 + ((c - 0xd800) << 10) + (d - 0xdc00);
        if (isNoncharacter(cp)) fail("noncharacter code point");
        k++;
      } else if (c >= 0xdc00 && c <= 0xdfff) fail("unpaired surrogate");
      else if (isNoncharacter(c)) fail("noncharacter code point");
    }
    return out;
  }
  function num() {
    const pattern = /-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/y;
    pattern.lastIndex = i;
    const m = pattern.exec(text);
    if (!m) fail("invalid number");
    i += m[0].length;
    const value = Number(m[0]);
    if (!Number.isFinite(value)) fail("number outside binary64");
    if (!m[2] && !m[3]) {
      const big = BigInt(m[0]);
      if (big > MAX_SAFE || big < -MAX_SAFE) fail("integer outside the I-JSON range ±(2^53−1); use a string or typed value");
    }
  }
  function value(depth) {
    if (depth > maxDepth) fail(`depth > ${maxDepth}`);
    ws();
    const c = text[i];
    if (c === "{") {
      i++; ws();
      const names = new Set();
      if (text[i] === "}") { i++; return; }
      while (true) {
        ws();
        if (text[i] !== '"') fail("expected member name");
        const name = str();
        if (names.has(name)) fail(`duplicate member name "${name}"`);
        names.add(name);
        ws();
        if (text[i] !== ":") fail("expected ':'");
        i++;
        value(depth + 1);
        ws();
        if (text[i] === ",") { i++; continue; }
        if (text[i] === "}") { i++; return; }
        fail("expected ',' or '}'");
      }
    }
    if (c === "[") {
      i++; ws();
      if (text[i] === "]") { i++; return; }
      while (true) {
        value(depth + 1);
        ws();
        if (text[i] === ",") { i++; continue; }
        if (text[i] === "]") { i++; return; }
        fail("expected ',' or ']'");
      }
    }
    if (c === '"') { str(); return; }
    if (c === "-" || (c >= "0" && c <= "9")) { num(); return; }
    for (const lit of ["true", "false", "null"]) if (text.startsWith(lit, i)) { i += lit.length; return; }
    fail("unexpected token");
  }
  try {
    value(0);
    ws();
    if (i !== text.length) fail("trailing data");
  } catch (error) {
    return { ok: false, reason: error.message };
  }
  return { ok: true, value: JSON.parse(text), bytes: bytes.length };
}
