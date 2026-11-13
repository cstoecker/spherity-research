// SPDX-License-Identifier: Apache-2.0
// Explicit-state model checker for the semantic supply chain formal model (SSC-FM v5).
// Exhaustive breadth-first exploration of small instances; every violation is reported with a
// shortest counterexample. Includes "tightness" mutants that MUST be reported as violated, so a
// property that is too weak to notice an off-by-one is itself detected. No dependencies.
//   node mc.mjs            human-readable table
//   node mc.mjs --json     machine-readable results
//   node mc.mjs --check    exit 1 unless every expected case ID is present exactly once with the
//                          expected verdict, and every HOLDS case is non-vacuous (reaches acceptance)
//
// MC-1  distribution of meaning (M8): rollback, freshness, permanence of withdrawal, clock skew
// MC-2  withdrawal as an authority-epoch event (M25), with replay of old metadata
// MC-3  measured semantics and attested decision engines (M24), with reboot and register reset
// MC-4  codec binding envelope (M15): exhaustive case analysis (not a transition system)
// MC-5  status freshness when an online timestamp role wraps older status objects (M8, T5)
// MC-6  premises of replay co-signing (T11′): input, status, closure selection, offline effects;
//       case analysis over the device's choices (after the third independent review, R3-05/R3-06)
//
// Rows marked REDUNDANT remove a single guard and still hold in the small instance: they show that
// the instance cannot demonstrate that guard's necessity, not that the guard is unnecessary.

const results = [];
function explore(id, model, variant, init, step, check, reach = () => false) {
  const key = (s) => JSON.stringify(s);
  const seen = new Set([key(init)]);
  let frontier = [{ s: init, trace: [] }];
  let states = 1;
  let reachable = reach(init);
  while (frontier.length) {
    const next = [];
    for (const { s, trace } of frontier) {
      const v = check(s);
      if (v) return record(id, model, variant, false, states, v, trace, reachable);
      for (const { label, next: n } of step(s)) {
        const k = key(n);
        if (seen.has(k)) continue;
        seen.add(k);
        states++;
        if (!reachable && reach(n)) reachable = true;
        next.push({ s: n, trace: [...trace, label] });
      }
    }
    frontier = next;
  }
  return record(id, model, variant, true, states, null, [], reachable);
}
function record(id, model, variant, holds, states, violation, trace, reachable) {
  const r = { id, model, variant, holds, states, violation, trace, reachable };
  results.push(r);
  return r;
}

// ================================================================ MC-1 (M8)
// Publisher, each tick: publish next version (max 3) | withdraw current | nothing; then it signs
// metadata {ver, status, issued = tick, expires = tick + D}. Network adversary: delivers any
// metadata ever signed, or nothing. Verifier clock: trusted (= tick), skewed (tick ± EPS, chosen
// by the adversary), or fully adversarial (any value <= tick).
// Properties at every use of version v at tick t:
//   P1 no version rollback: v >= every version used before
//   P2 freshness: v current at the publisher at some time in the exact guaranteed window
//      (metadata issued at tick t0 is valid while t0 + D > clock, so t0 >= t - D + 1 - EPS)
//   P3 withdrawal is permanent: v is never used after the verifier accepted metadata withdrawing it
const D = 3, T = 7, VMAX = 3, EPS = 1;
function mc1(id, name, cfg) {
  const init = { t: 0, cur: 1, wd: [], hist: [], pub: [[1, []]], stored: null, maxVer: 0, maxIssued: -1, wdSeen: [], used: [], viol: null };
  const currentAt = (pub, i, v) => pub[i] && pub[i][0] === v && !pub[i][1].includes(v);
  const step = (s) => {
    if (s.t >= T || s.viol) return [];
    const out = [];
    const acts = ["none"];
    if (s.cur < VMAX) acts.push("publish");
    if (!s.wd.includes(s.cur)) acts.push("withdraw");
    for (const pa of acts) {
      let cur = s.cur; const wd = [...s.wd];
      if (pa === "publish") cur++;
      if (pa === "withdraw") wd.push(cur);
      const meta = { ver: cur, status: wd.includes(cur) ? "withdrawn" : "current", issued: s.t, expires: s.t + D };
      const hist = [...s.hist, meta];
      const pub = [...s.pub, [cur, wd]];
      const clocks = cfg.clock === "adversary" ? [...Array(s.t + 1).keys()]
        : cfg.clock === "skew" ? [s.t - EPS, s.t, s.t + EPS].filter((c) => c >= 0) : [s.t];
      for (const di of [null, ...hist.keys()]) for (const clock of clocks) {
        const m = di === null ? null : hist[di];
        let { stored, maxVer, maxIssued } = s; let wdSeen = s.wdSeen;
        if (cfg.stateless) { stored = null; maxVer = 0; maxIssued = -1; wdSeen = []; }
        let use = null;
        if (!cfg.meta) use = 1;
        else {
          const unexpired = (x) => !cfg.expiry || (cfg.lateExpiry ? x.expires >= clock : x.expires > clock);
          const ok = m && unexpired(m)
            && (!cfg.verCounter || m.ver >= maxVer)
            && (!cfg.metaCounter || m.issued >= maxIssued);
          if (ok) {
            stored = m; maxVer = Math.max(maxVer, m.ver); maxIssued = Math.max(maxIssued, m.issued);
            if (m.status === "withdrawn" && !wdSeen.includes(m.ver)) wdSeen = [...wdSeen, m.ver];
          }
          if (stored && unexpired(stored) && stored.status === "current" && !(cfg.permanent && wdSeen.includes(stored.ver))) use = stored.ver;
        }
        const n = { t: s.t + 1, cur, wd, hist, pub, stored, maxVer, maxIssued, wdSeen, used: s.used, viol: null };
        if (use !== null) {
          const lo = s.t + 2 - D - (cfg.window === "D+eps" ? EPS : 0);
          if (s.used.some((u) => u > use)) n.viol = `P1 version rollback: v${use} used at t=${s.t} after v${Math.max(...s.used)}`;
          else if (![...Array(s.t + 2).keys()].filter((i) => i >= lo).some((i) => currentAt(pub, i, use)))
            n.viol = `P2 freshness: v${use} used at t=${s.t}, not current at any time in the guaranteed window`;
          else if (wdSeen.includes(use) || s.wdSeen.includes(use)) n.viol = `P3 withdrawal undone: v${use} used at t=${s.t} after the verifier had accepted its withdrawal`;
          n.used = [...s.used, use];
        }
        out.push({ label: `t=${s.t}: publisher ${pa}; network ${m ? `delivers meta(v${m.ver}, ${m.status}, issued ${m.issued})` : "delivers nothing"}${cfg.clock !== "trusted" ? `; verifier clock ${clock}` : ""}; verifier ${use === null ? "fails closed" : "uses v" + use}`, next: n });
      }
    }
    return out;
  };
  return explore(id, "MC-1 distribution (M8)", name, init, step, (s) => s.viol, (s) => s.used.length > 0);
}
const M8 = { meta: true, expiry: true, metaCounter: true, verCounter: true, permanent: true, clock: "trusted" };
const MC1 = {
  "MC1.pin": ["pin only (no metadata)", { meta: false, clock: "trusted" }],
  "MC1.noexp": ["signed metadata, no expiry, no counter", { meta: true, clock: "trusted" }],
  "MC1.stateless": ["expiry, stateless verifier", { meta: true, expiry: true, stateless: true, clock: "trusted" }],
  "MC1.v09": ["expiry + version counter only (design in claims note v0.9)", { meta: true, expiry: true, verCounter: true, clock: "trusted" }],
  "MC1.m8": ["corrected M8: expiry + metadata counter + version counter + permanent withdrawal", M8],
  "MC1.red-meta": ["REDUNDANT corrected M8 without metadata counter", { ...M8, metaCounter: false }],
  "MC1.red-ver": ["REDUNDANT corrected M8 without version counter", { ...M8, verCounter: false }],
  "MC1.red-perm": ["REDUNDANT corrected M8 without permanent-withdrawal guard", { ...M8, permanent: false }],
  "MC1.advclock": ["corrected M8, clock set by the adversary", { ...M8, clock: "adversary" }],
  "MC1.skewD": ["corrected M8, clock skew ±1, property window D", { ...M8, clock: "skew" }],
  "MC1.skewDe": ["corrected M8, clock skew ±1, property window D + skew", { ...M8, clock: "skew", window: "D+eps" }],
  "MC1.mutant": ["MUTANT corrected M8 with expiry checked one tick late (must be violated)", { ...M8, lateExpiry: true }],
};

// ================================================================ MC-2 (M25)
// Artefact x is withdrawn at a nondeterministic tick tw. The publisher signs metadata each tick
// {issued, status}. The network may deliver any metadata ever signed (replay) or nothing.
// The kernel admits actions whose closure contains x and later commits them; on accepting
// "withdrawn" metadata it advances its authority epoch.
// Properties: S1 no commit at tick >= tw + D - 1 (exact bound of expiring metadata);
//             S2 no commit of a token from an earlier epoch;
//             S3 no commit after the kernel accepted the withdrawal (withdrawal is permanent).
function mc2(id, name, cfg) {
  const T2 = 8, D = 4; // D = 4 leaves room for replay -> admit -> commit inside the window
  const init = { t: 0, tw: null, hist: [], held: null, maxIssued: -1, learned: false, epoch: 0, tokens: [], checked: [], commits: 0, viol: null };
  const step = (s) => {
    if (s.t >= T2 || s.viol) return [];
    const out = [];
    for (const wnow of s.tw === null ? [false, true] : [false]) {
      const tw = wnow ? s.t : s.tw;
      const meta = { issued: s.t, status: tw !== null ? "withdrawn" : "current" };
      const hist = [...s.hist, meta];
      const deliveries = cfg.learn === "push" ? [null, ...(tw !== null ? ["push"] : [])] : [null, ...hist.keys()];
      for (const d of deliveries) {
        let { held, maxIssued, learned, epoch } = s;
        if (d === "push") { if (!learned) { learned = true; epoch++; } }
        else if (d !== null) {
          const m = hist[d];
          if (!cfg.metaCounter || m.issued >= maxIssued) {
            held = m; maxIssued = Math.max(maxIssued, m.issued);
            if (m.status === "withdrawn" && !learned) { learned = true; epoch++; }
            if (m.status === "current" && learned && !cfg.metaCounter && !cfg.keepMemory) learned = false; // view reverts; epoch stays
          }
        }
        const valid = cfg.learn === "push" || cfg.noFailClosed || (held && (cfg.lateFailClosed ? held.issued + D >= s.t : held.issued + D > s.t));
        const viewsCurrent = cfg.learn === "push" ? !learned : held && held.status === "current" && !learned;
        for (const act of ["idle", "admit", "commit"]) {
          const n = { t: s.t + 1, tw, hist, held, maxIssued, learned, epoch, tokens: [...s.tokens], checked: [...s.checked], everLearned: s.everLearned || learned, commits: s.commits, viol: null };
          let label = `t=${s.t}${wnow ? " WITHDRAW x;" : ""} network ${d === null ? "nothing" : d === "push" ? "push" : `meta(${hist[d].status}, issued ${hist[d].issued})`}; epoch ${epoch}${valid ? "" : " (expired: fail closed)"}; agent ${act}`;
          if (act === "admit" && valid && viewsCurrent) n.tokens.push(epoch);
          if (act === "commit" && n.tokens.length) {
            const tok = n.tokens[0];
            let ok;
            if (cfg.commit === "atomic") ok = valid && viewsCurrent && tok === epoch;
            else if (cfg.commit === "nocheck") ok = true;
            else if (cfg.commit === "noepoch") ok = valid && viewsCurrent;
            else { ok = n.checked.includes(tok); if (!ok && valid && viewsCurrent && tok === epoch) { n.checked.push(tok); label += " (checked only)"; } }
            if (ok) {
              n.tokens.shift(); n.commits++; label += ` -> COMMIT (token epoch ${tok})`;
              if (tw !== null && s.t >= tw + D - (cfg.tightProperty ? 2 : 1)) n.viol = `S1 commit at t=${s.t} >= withdrawal ${tw} + D - 1`;
              else if (tok < epoch) n.viol = `S2 commit of a token from epoch ${tok} after the epoch advanced to ${epoch}`;
              else if (s.everLearned || learned) n.viol = `S3 commit at t=${s.t} after the kernel had accepted the withdrawal`;
            }
          }
          out.push({ label, next: n });
        }
      }
    }
    return out;
  };
  return explore(id, "MC-2 withdrawal → authority epoch (M25)", name, init, step, (s) => s.viol, (s) => s.commits > 0);
}
const M25 = { learn: "meta", metaCounter: true, commit: "atomic" };
const MC2 = {
  "MC2.m25": ["corrected M25: metadata counter + withdrawal memory + fail-closed + atomic epoch check", M25],
  "MC2.red-meta": ["REDUNDANT without metadata counter, withdrawal memory kept", { ...M25, metaCounter: false, keepMemory: true }],
  "MC2.nometa": ["without metadata counter and without withdrawal memory (replay undoes the withdrawal)", { ...M25, metaCounter: false }],
  "MC2.red-epoch": ["REDUNDANT commit checks freshness and currentness but not epoch equality", { ...M25, commit: "noepoch" }],
  "MC2.nocheck": ["commit without any check", { ...M25, commit: "nocheck" }],
  "MC2.split": ["check, then commit in a later step", { ...M25, commit: "split" }],
  "MC2.push": ["push notification only", { learn: "push", commit: "atomic" }],
  "MC2.nofc": ["no fail-closed on expired metadata", { ...M25, noFailClosed: true }],
  "MC2.mutant": ["MUTANT fail-closed one tick late (must be violated)", { ...M25, lateFailClosed: true }],
  "MC2.tight": ["MUTANT property one tick tighter than the guarantee (must be violated)", { ...M25, tightProperty: true }],
};

// ================================================================ MC-3 (M24)
// Designs:
//   V1  harness v0.3: receipts produced by the application; bundle loads measured into a
//       resettable PCR; appraisal of the last load event
//   V2  claims note v0.9.1 draft: application receipts; loads and decisions measured into a PCR
//       cleared only by reboot; taint appraisal of the whole log
//   V3  attested engine: the decision engine runs inside the measured boundary and signs receipts
//       with a key whose policy requires the identity register to show exactly the approved
//       engine; the identity register is RESETTABLE (PCR 16/23)
//   V4  as V3, identity register cleared only by reboot (re-measured at boot); the key policy
//       checks only the register value, so any host caller may invoke the key (PCR-only policy)
//   V5  corrected M24 (v0.9.2): as V4, and the key is usable only by the isolated engine runtime
//       (exclusive key use and runtime isolation, e.g. a TEE or an enforced isolated process)
//   V6  alternative: the receipt key is shared (threshold / MPC) between the device and an
//       independent co-signer; the co-signer contributes its share only after authenticating the
//       input and deterministically replaying the decision under the closure the receipt claims
//   V6c as V6, but the co-signer is compromised too (f >= t: no honest replay remains)
// Adversaries: D0 honest device (may reboot); D1 root on the device, outside the measured boot
//   chain: runs modified code, chooses bundles, reboots, resets resettable registers, extends
//   registers through the TPM, fabricates application receipts and decides in its own code.
//   (A compromised measured boot chain is outside the model: no attestation survives it.)
// Property: the relying party accepts a receipt only if that decision ran under a bundle that
//   was approved and not withdrawn at decision time, and that is the closure the receipt names.
function mc3(id, design, adv, prop = (design === "V6" || design === "V6c") ? "outcome" : "exec") {
  const L = 6;
  // outcome of each closure on the fixed authenticated input x: A and S agree on x, W differs
  const EVAL = { A: "GRANT", S: "GRANT", W: "DENY" };
  const appReceipts = design === "V1" || design === "V2";
  const threshold = design === "V6" || design === "V6c";
  const init = { n: 0, run: null, idReg: [], sem: [], active: null, receipts: [], withdrawn: false, viol: null };
  const okNow = (b, s) => b === "A" || (b === "W" && !s.withdrawn);
  const keyUsable = (s) => !appReceipts && !threshold && s.idReg.length === 1 && s.idReg[0] === "E";
  function accepts(s, r) {
    if (design === "V1") {
      const last = [...s.sem].reverse().find((e) => e.t === "load");
      return !!last && okNow(last.b, s) && r.claims === last.b;
    }
    if (design === "V2") {
      const di = s.sem.findIndex((e) => e.t === "decide" && e.id === r.id);
      if (di < 0 || s.sem.filter((e) => e.t === "decide" && e.id === r.id).length > 1) return false;
      const before = s.sem.slice(0, di).reverse().find((e) => e.t === "load");
      return !!before && okNow(before.b, s) && before.b === r.claims && s.sem[di].r === r.claims
        && !s.sem.some((e) => e.t === "load" && !okNow(e.b, s));
    }
    return r.signed && okNow(r.claims, s);
  }
  const step = (s) => {
    if (s.n >= L || s.viol) return [];
    const out = [];
    const nx = (extra) => ({ ...s, n: s.n + 1, ...extra });
    const push = (label, n) => {
      for (const r of n.receipts) {
        if (!accepts(n, r)) continue;
        // exec: the receipt names the closure the decision actually ran under (T11, execution provenance)
        // outcome: the receipt's outcome equals replay of the claimed, approved closure on the input (T11')
        const bad = prop === "exec" ? (!r.good || r.claims !== r.under) : (r.outcome !== EVAL[r.claims] || !okNow(r.claims, n));
        if (bad) { n.viol = prop === "exec" ? `relying party ACCEPTS receipt #${r.id} (claims ${r.claims}), but that decision ran under ${r.under}` : `relying party ACCEPTS receipt #${r.id} (claims ${r.claims}, outcome ${r.outcome}), but replay under ${r.claims} gives ${EVAL[r.claims]}`; break; }
        n.okAccepted = true;
      }
      out.push({ label, next: n });
    };
    // engine start (measured into the identity register)
    push("start approved engine E (measured)", nx({ run: "E", idReg: [...s.idReg, "E"], active: null }));
    if (adv === "D1") push("start modified engine M (measured)", nx({ run: "M", idReg: [...s.idReg, "M"], active: null }));
    // bundle loads by the running engine (measured into the semantic register by the engine/agent)
    if (s.run) for (const b of adv === "D1" ? ["A", "S", "W"] : ["A", "W"]) {
      const measured = s.run === "E" || appReceipts;
      push(`engine loads ${b}${measured ? " (measured)" : " (modified engine, not measured)"}`, nx({ active: b, sem: measured ? [...s.sem, { t: "load", b }] : s.sem }));
    }
    // decisions
    const id = s.receipts.length;
    if (appReceipts && s.run) {
      const unders = adv === "D1" ? ["A", "S", "W"] : [s.active].filter(Boolean);   // D1 may decide in its own code
      const claims = adv === "D1" ? ["A", "S", "W"] : null;
      for (const under of unders) for (const c of claims ?? [under]) {
        const r = { id, under, claims: c, outcome: EVAL[under], signed: false, good: okNow(under, s) };
        push(`application decides #${id} under ${under}, receipt claims ${c}`, nx({ receipts: [...s.receipts, r], sem: design === "V2" ? [...s.sem, { t: "decide", id, r: c }] : s.sem }));
      }
    }
    if (!appReceipts && s.run === "E" && s.active && keyUsable(s)) {
      const r = { id, under: s.active, claims: s.active, outcome: EVAL[s.active], signed: true, good: okNow(s.active, s) };
      push(`engine E decides #${id} under ${s.active}, signed receipt`, nx({ receipts: [...s.receipts, r] }));
    }
    if (!appReceipts && s.run === "M" && keyUsable(s)) {
      const r = { id, under: "S", claims: "A", outcome: "GRANT", signed: true, good: false };
      push(`modified engine M decides #${id} under S, signs a receipt claiming A`, nx({ receipts: [...s.receipts, r] }));
    }
    if (threshold && s.run) {
      // The device (honest engine, or root under D1) proposes a receipt: the closure it actually used
      // (under), the closure it claims, and an outcome. Root may propose any combination.
      // The honest co-signer sees only the claimed closure, the authenticated input and the proposed
      // outcome: it replays the claimed closure, requires it to be approved now, and signs only if the
      // outcomes agree. It cannot observe which closure the device actually ran (review R3-02).
      const options = [];
      if (adv === "D1") { for (const under of ["A", "S", "W"]) for (const claims of ["A", "S", "W"]) for (const outcome of ["GRANT", "DENY"]) options.push([under, claims, outcome]); }
      else if (s.active) options.push([s.active, s.active, EVAL[s.active]]);
      for (const [under, claims, outcome] of options) {
        const coSigns = design === "V6c" || (EVAL[claims] === outcome && okNow(claims, s));
        if (!coSigns) continue;
        const r = { id, under, claims, outcome, signed: true, good: okNow(under, s) };
        push(`device proposes receipt #${id} (ran ${under}, claims ${claims}, outcome ${outcome}); co-signer ${design === "V6c" ? "(compromised) signs" : `replays ${claims} -> ${EVAL[claims]} and signs`}`, nx({ receipts: [...s.receipts, r] }));
      }
    }
    if (adv === "D1" && design === "V4" && keyUsable(s)) {
      const r = { id, under: "S", claims: "A", outcome: "GRANT", signed: true, good: false };
      push(`root invokes the engine key while the register shows E: signs receipt #${id} claiming A for a decision under S`, nx({ receipts: [...s.receipts, r] }));
    }
    if (adv === "D1") {
      push("reboot (registers cleared, measured boot restarts)", nx({ run: null, idReg: [], sem: [], active: null }));
      if (design === "V1" || design === "V3") push("reset resettable register", nx(design === "V1" ? { sem: [] } : { idReg: [] }));
      if (!appReceipts) push("extend fake 'E' into the identity register", nx({ idReg: [...s.idReg, "E"] }));
      else {
        push("extend fake 'load A' into the semantic register", nx({ sem: [...s.sem, { t: "load", b: "A" }] }));
        if (design === "V2") for (const r of s.receipts) push(`extend fake 'decide #${r.id}' claiming A`, nx({ sem: [...s.sem, { t: "decide", id: r.id, r: "A" }] }));
      }
    } else push("reboot", nx({ run: null, idReg: [], sem: [], active: null }));
    if (!s.withdrawn) push("publisher withdraws W", nx({ withdrawn: true }));
    return out;
  };
  const names = { V1: "V1 harness v0.3 (app receipts, resettable PCR, last event)", V2: "V2 first correction (app receipts, decision events, taint)", V3: "V3 attested engine, resettable identity register", V4: "V4 v0.9.1 design: attested engine, non-resettable register, PCR-only key policy", V5: "V5 corrected M24: isolated engine with exclusive key use", V6: "V6 alternative: threshold receipt key; honest co-signer replays the claimed closure and checks the outcome", V6c: "V6c threshold receipt key, co-signer also compromised" };
  const propLabel = threshold ? `; property: ${prop === "exec" ? "execution identity (T11), not claimed by T11\u2032" : "outcome equals replay of the claimed approved closure (T11\u2032)"}` : "";
  return explore(id, "MC-3 measured semantics (M24)", `${names[design]}; ${adv === "D0" ? "honest device" : "root outside the measured boot chain"}${propLabel}`, init, step, (s) => s.viol, (s) => !!s.okAccepted);
}

// ================================================================ MC-4 (M15), case analysis
// Dimensions: manifest scope (top-level contexts and tables, as harness v0.3 | transitive context
// closure, as claims note v0.9.1 | full decoding manifest incl. decoder semantics, codecs and
// options, as v0.9.2 DST-12); verifier drift (none | top-level codes shift | top-level IRIs
// swapped, same terms | transitive context IRIs swapped | registry table swapped | decoder
// semantics or codec version changed); envelope digest rewritten to match the verifier (yes | no);
// archive holds the issuer's manifest (yes | no); signature profile (A: CBOR-LD bytes | B: whole
// envelope | I-RDFC: proof inside the payload binding the RDF graph | I-JCS: JSON only).
// I-RDFC's verdict is ASSUMED from the soundness of graph-binding proofs (T2); this case analysis
// does not test that assumption. Property: ACCEPT => the decoded meaning equals the issuer's.
function mc4(id, profile, scope) {
  let holds = true, cases = 0, trace = [], reachable = false;
  const captured = { none: true, topCodes: true, topIris: true, table: true, transIris: scope !== "top-level", decoderSem: scope === "full" };
  for (const drift of ["none", "topCodes", "topIris", "transIris", "table", "decoderSem"]) for (const rewrite of [false, true]) for (const archive of [false, true]) {
    cases++;
    const localDigestMatchesIssuer = drift === "none" || !captured[drift];
    const field = rewrite ? "local" : "issuer";
    let used;
    if (field === "local" || localDigestMatchesIssuer) used = "local"; else if (archive) used = "issuer"; else continue;
    const meaningSame = used === "issuer" || drift === "none";
    const jsonSame = used === "issuer" || ["none", "topIris", "transIris"].includes(drift);
    const sig = profile === "A" ? true : profile === "B" ? !rewrite : profile === "I-RDFC" ? meaningSame : jsonSame;
    if (sig && meaningSame) reachable = true;
    if (sig && !meaningSame && holds) { holds = false; trace = [`drift ${drift}; envelope ${rewrite ? "rewritten" : "unchanged"}; decoder uses ${used} material; ${profile} signature valid; meaning differs`]; }
  }
  return record(id, "MC-4 codec binding (M15), case analysis", `profile ${profile}${profile === "I-RDFC" ? " (inner proof soundness assumed)" : ""}; manifest ${scope}`, holds, cases, holds ? null : "ACCEPT with a meaning other than the issuer's", trace, reachable);
}

// ================================================================ MC-5 (M8, T5): fresh wrapper, stale status
// The targets (threshold) role signs a status object S each tick {issued, status, expires = issued + DS}.
// The online timestamp role signs a timestamp object {issued, expires = issued + DT, ref: S}; when
// honest it references the latest S. With the timestamp key compromised, the adversary can sign a
// fresh timestamp referencing ANY earlier S. The network delivers any timestamp ever signed, or nothing.
// The verifier keeps a counter on timestamp issue order, requires an unexpired timestamp and, if
// configured, an unexpired S. Property: a use at t is of a version current at some time within the
// claimed bound (timestamp lifetime DT, or status lifetime DS).
function mc5(id, name, cfg) {
  const T5 = 7, DT = 2;
  const DS = cfg.DS;
  const init = { t: 0, wd: false, pub: [false], S: [], TS: [], maxIssued: -1, held: null, used: 0, viol: null };
  const step = (s) => {
    if (s.t >= T5 || s.viol) return [];
    const out = [];
    for (const wnow of s.wd ? [false] : [false, true]) {
      const wd = s.wd || wnow;
      const S = [...s.S, { issued: s.t, status: wd ? "withdrawn" : "current", expires: s.t + DS }];
      const honestTS = { issued: s.t, expires: s.t + DT, ref: S.length - 1 };
      let TS = [...s.TS, honestTS];
      if (cfg.compromised) for (let k = 0; k < S.length - 1; k++) TS.push({ issued: s.t, expires: s.t + DT, ref: k, forged: true });
      const pub = [...s.pub, wd];
      for (const ti of [null, ...TS.keys()]) {
        let { maxIssued, held } = s;
        const ts = ti === null ? null : TS[ti];
        if (ts && ts.expires > s.t && ts.issued >= maxIssued && (!cfg.checkS || S[ts.ref].expires > s.t)) { held = ts; maxIssued = ts.issued; }
        let use = false;
        if (held && held.expires > s.t && (!cfg.checkS || S[held.ref].expires > s.t) && S[held.ref].status === "current") use = true;
        const n = { t: s.t + 1, wd, pub, S, TS: cfg.compromised ? TS.filter((x) => !x.forged || x.issued === s.t).slice(-12) : TS, maxIssued, held, used: s.used + (use ? 1 : 0), viol: null };
        if (use) {
          const bound = cfg.claim === "DT" ? DT : DS;
          const lo = s.t + 2 - bound;
          if (![...Array(s.t + 2).keys()].filter((i) => i >= Math.max(0, lo)).some((i) => !pub[i])) n.viol = `use at t=${s.t} of a version not current within the claimed bound ${cfg.claim}`;
        }
        out.push({ label: `t=${s.t}${wnow ? " WITHDRAW;" : ""} network ${ts ? `timestamp(issued ${ts.issued}${ts.forged ? ", forged" : ""}) -> S(issued ${S[ts.ref].issued}, ${S[ts.ref].status}, expires ${S[ts.ref].expires})` : "nothing"}; verifier ${use ? "USES v1" : "does not use"}`, next: n });
      }
    }
    return out;
  };
  return explore(id, "MC-5 fresh timestamp over stale status (M8, T5)", name, init, step, (s) => s.viol, (s) => s.used > 0);
}

for (const [id, [n, c]] of Object.entries(MC1)) mc1(id, n, c);
for (const [id, [n, c]] of Object.entries(MC2)) mc2(id, n, c);
for (const d of ["V1", "V2", "V3", "V4", "V5", "V6"]) for (const a of ["D0", "D1"]) mc3(`MC3.${d}.${a}`, d, a);
mc3("MC3.V6c.D1", "V6c", "D1");
mc3("MC3.V6x.D1", "V6", "D1", "exec");   // replay validates outcomes, not execution (R3-02)
for (const p of ["A", "B", "I-RDFC", "I-JCS"]) for (const sc of ["top-level", "transitive", "full"]) mc4(`MC4.${p}.${sc}`, p, sc);
mc5("MC5.honest", "honest timestamp key; claimed bound = timestamp lifetime", { DS: 6, claim: "DT" });
mc5("MC5.wrap", "compromised timestamp key; verifier checks the timestamp only; claimed bound = timestamp lifetime", { DS: 6, compromised: true, claim: "DT" });
mc5("MC5.longS", "compromised timestamp key; long-lived status object checked; claimed bound = timestamp lifetime", { DS: 6, compromised: true, checkS: true, claim: "DT" });
mc5("MC5.statusbound", "compromised timestamp key; status object expiry checked; claimed bound = status lifetime", { DS: 2, compromised: true, checkS: true, claim: "DS" });

// ================================================================ MC-6 (T11′): what replay checks, and what it needs
// One decision; the device (root) chooses what it presents to the co-signer. The co-signer replays the
// presented closure on the presented input and status. Each case fixes the world (the truth), the
// co-signer's admissibility checks, and the property. A case is VIOLATED if some device choice yields an
// accepted receipt that breaks the property; it is non-vacuous if some accepted receipt exists.
function mc6case(id, variant, { options, admissible, evaluate, property, describe }) {
  let holds = true, cases = 0, trace = [], reachable = false, violation = null;
  for (const o of options) {
    cases++;
    if (!admissible(o)) continue;
    const outcome = evaluate(o);
    reachable = true;
    const bad = property(o, outcome);
    if (bad && holds) { holds = false; violation = bad; trace = describe(o, outcome); }
  }
  return record(id, "MC-6 replay co-signing premises (T11′), case analysis", variant, holds, cases, violation, trace, reachable);
}
function mc6() {
  // Input: the authenticated source says x = 0 (not eligible); policy: GRANT iff x = 1.
  const inputOpts = [{ x: 0, auth: true }, { x: 1, auth: false }];
  const evalX = (o) => (o.x === 1 ? "GRANT" : "DENY");
  const inputCase = (id, authInput) => mc6case(id, `input: ${authInput ? "co-signer requires input authenticated to its source" : "co-signer replays the presented input as given"}; property: outcome = policy on the true input`, {
    options: inputOpts, admissible: (o) => !authInput || o.auth, evaluate: evalX,
    property: (o, out) => (out !== "DENY" ? `co-signed ${out}, but the authenticated input gives DENY` : null),
    describe: (o, out) => [`device presents x = ${o.x} (${o.auth ? "authenticated" : "unauthenticated"})`, `co-signer replays -> ${out} and signs`, "relying party accepts"] });
  inputCase("MC6.input.asGiven", false);
  inputCase("MC6.input.authenticated", true);
  // Status: the issuer's current status object says withdrawn; a counterfeit says current.
  const statusOpts = [{ st: "withdrawn", auth: true }, { st: "current", auth: false }];
  const statusCase = (id, auth) => mc6case(id, `status: ${auth ? "co-signer verifies the status object's signature" : "co-signer takes the presented status"}; property: outcome = policy under the true status`, {
    options: statusOpts, admissible: (o) => !auth || o.auth, evaluate: (o) => (o.st === "current" ? "GRANT" : "DENY"),
    property: (o, out) => (out !== "DENY" ? `co-signed ${out} although the meaning is withdrawn` : null),
    describe: (o, out) => [`device presents status '${o.st}' (${o.auth ? "authentic" : "counterfeit"})`, `co-signer replays -> ${out} and signs`, "relying party accepts"] });
  statusCase("MC6.status.asGiven", false);
  statusCase("MC6.status.authenticated", true);
  // Older authentic status: at time 2, epoch 1 says withdrawn (issued 1, expires 4); the epoch-0
  // object says current (issued 0, expires 3). Both are authentic and unexpired.
  const now = 2, currentEpoch = 1, window = 2;
  const oldOpts = [{ epoch: 0, st: "current", issued: 0, expires: 3 }, { epoch: 1, st: "withdrawn", issued: 1, expires: 4 }];
  const evalSt = (o) => (o.st === "current" ? "GRANT" : "DENY");
  const oldCase = (id, check, prop) => mc6case(id, `older authentic status: co-signer checks ${check === "epoch" ? "expiry and the current authority epoch, known independently" : "signature and expiry only"}; property: ${prop === "current" ? "outcome = policy under the current status" : `outcome = policy under some authentic status issued within the last ${window} ticks`}`, {
    options: oldOpts, admissible: (o) => o.expires > now && (check !== "epoch" || o.epoch === currentEpoch), evaluate: evalSt,
    property: (o, out) => {
      const allowed = prop === "current" ? ["DENY"] : oldOpts.filter((q) => q.issued >= now - window).map(evalSt);
      return allowed.includes(out) ? null : `co-signed ${out} at time ${now}, but the current status (epoch ${currentEpoch}) is withdrawn`;
    },
    describe: (o, out) => [`device presents the authentic epoch-${o.epoch} object (${o.st}, issued ${o.issued}, expires ${o.expires})`, `co-signer replays -> ${out} and signs`, "relying party accepts"] });
  oldCase("MC6.oldStatus.expiryOnly", "expiry", "current");
  oldCase("MC6.oldStatus.epochBound", "epoch", "current");
  oldCase("MC6.oldStatus.windowClaim", "expiry", "window");
  // Closure selection: strict and lenient closures are both approved; the request authorises strict.
  // On this input strict gives DENY and lenient gives GRANT.
  const evalC = { strict: "DENY", lenient: "GRANT" };
  const closureCase = (id, bound) => mc6case(id, `closure selection: ${bound ? "co-signer requires the closure the request authorises" : "co-signer accepts any approved closure the device names"}; property: outcome = policy under the requested closure`, {
    options: ["strict", "lenient"], admissible: (c) => !bound || c === "strict", evaluate: (c) => evalC[c],
    property: (c, out) => (out !== evalC.strict ? `co-signed ${out} under ${c}; the request authorised strict (${evalC.strict})` : null),
    describe: (c, out) => [`device names the approved closure '${c}'`, `co-signer replays -> ${out} and signs`, "relying party accepts"] });
  closureCase("MC6.closure.deviceChoice", false);
  closureCase("MC6.closure.requestBound", true);
  // Offline co-signer: phases 0..2; the authority withdraws at phase 1; the device wants to act on a
  // GRANT computed at phase 0. Device strategies: the phase at which it triggers the effect (or never).
  const offline = (id, variant, { provisionalEffects, online, property }) => {
    const opts = [0, 1, 2, null];
    let holds = true, trace = [], violation = null, reachable = false, cases = 0;
    for (const at of opts) {
      cases++;
      let receipt = null, effect = null; const log = ["phase 0: device decides GRANT provisionally"];
      for (let ph = 0; ph <= 2; ph++) {
        const withdrawn = ph >= 1;
        if (!receipt && online(ph)) { receipt = { ph, outcome: withdrawn ? "DENY" : "GRANT" }; log.push(`phase ${ph}: co-signer online, replays under the current state -> ${receipt.outcome}, signs`); }
        else if (!receipt) log.push(`phase ${ph}: co-signer offline`);
        if (at === ph && !effect) {
          const gated = receipt && receipt.outcome === "GRANT" && !withdrawn;      // DEC-7 gate at the effect
          if (provisionalEffects || gated) { effect = { ph, withReceipt: !!receipt && receipt.outcome === "GRANT", withdrawn }; log.push(`phase ${ph}: irreversible effect executed${effect.withReceipt ? " with a valid receipt" : " on the provisional decision, no receipt"}${withdrawn ? " after the withdrawal" : ""}`); }
          else log.push(`phase ${ph}: effect requested, refused by the gate`);
        }
      }
      if (receipt) reachable = true;
      const bad = property({ receipt, effect });
      if (bad && holds) { holds = false; violation = bad; trace = log; }
    }
    return record(id, "MC-6 replay co-signing premises (T11′), case analysis", variant, holds, cases, violation, trace, reachable);
  };
  const safety = ({ effect }) => (effect && (!effect.withReceipt || effect.withdrawn) ? "irreversible effect without a valid, current receipt" : null);
  offline("MC6.offline.provisionalEffect", "offline co-signer; effects allowed on provisional decisions; property: no effect without a valid current receipt", { provisionalEffects: true, online: () => false, property: safety });
  offline("MC6.offline.deferEffect", "offline co-signer; effects deferred until a valid receipt and the commit-point check; property: safety (holds with no receipt: an availability failure, not a success)", { provisionalEffects: false, online: () => false, property: safety });
  offline("MC6.offline.deadline", "offline co-signer; effects deferred; property: a definitive receipt by phase 2 (bounded completion)", { provisionalEffects: false, online: () => false, property: ({ receipt }) => (receipt ? null : "no definitive receipt by the deadline (phase 2)") });
  offline("MC6.offline.returnsOnline", "co-signer back online at phase 1; effects deferred; property: safety and a definitive receipt by phase 2", { provisionalEffects: false, online: (ph) => ph >= 1, property: (x) => safety(x) || (x.receipt ? null : "no receipt by the deadline") });
}
mc6();
// cases whose HOLDS verdict is reached without any acceptance by design (reported, not counted as success)
const EXPECTED_NO_ACCEPTANCE = new Set(["MC6.offline.deferEffect"]);

const EXPECTED = {
  "MC1.pin": false, "MC1.noexp": false, "MC1.stateless": false, "MC1.v09": false, "MC1.m8": true,
  "MC1.red-meta": true, "MC1.red-ver": true, "MC1.red-perm": true, "MC1.advclock": false,
  "MC1.skewD": false, "MC1.skewDe": true, "MC1.mutant": false,
  "MC2.m25": true, "MC2.red-meta": true, "MC2.nometa": false, "MC2.red-epoch": true, "MC2.nocheck": false,
  "MC2.split": false, "MC2.push": false, "MC2.nofc": false, "MC2.mutant": false, "MC2.tight": false,
  "MC3.V1.D0": true, "MC3.V1.D1": false, "MC3.V2.D0": true, "MC3.V2.D1": false, "MC3.V3.D0": true, "MC3.V3.D1": false,
  "MC3.V4.D0": true, "MC3.V4.D1": false, "MC3.V5.D0": true, "MC3.V5.D1": true,
  "MC3.V6.D0": true, "MC3.V6.D1": true, "MC3.V6c.D1": false, "MC3.V6x.D1": false,
  "MC4.A.top-level": false, "MC4.A.transitive": false, "MC4.A.full": false,
  "MC4.B.top-level": false, "MC4.B.transitive": false, "MC4.B.full": true,
  "MC4.I-RDFC.top-level": true, "MC4.I-RDFC.transitive": true, "MC4.I-RDFC.full": true,
  "MC4.I-JCS.top-level": false, "MC4.I-JCS.transitive": false, "MC4.I-JCS.full": false,
  "MC5.honest": true, "MC5.wrap": false, "MC5.longS": false, "MC5.statusbound": true,
  "MC6.input.asGiven": false, "MC6.input.authenticated": true, "MC6.status.asGiven": false, "MC6.status.authenticated": true,
  "MC6.oldStatus.expiryOnly": false, "MC6.oldStatus.epochBound": true, "MC6.oldStatus.windowClaim": true,
  "MC6.closure.deviceChoice": false, "MC6.closure.requestBound": true,
  "MC6.offline.provisionalEffect": false, "MC6.offline.deferEffect": true, "MC6.offline.deadline": false, "MC6.offline.returnsOnline": true,
};
if (process.argv.includes("--json")) console.log(JSON.stringify(results, null, 2));
else for (const r of results) {
  console.log(`${r.holds ? "HOLDS    " : "VIOLATED "} [${r.id}] ${r.model} | ${r.variant} | ${r.model.includes("case") ? "cases" : "states"} ${r.states}${r.holds ? (r.reachable ? " | non-vacuous" : EXPECTED_NO_ACCEPTANCE.has(r.id) ? " | no acceptance (by design)" : " | VACUOUS") : ""}`);
  if (!r.holds) { console.log(`           ${r.violation}`); for (const x of r.trace) console.log(`             - ${x}`); }
}
if (process.argv.includes("--check")) {
  const problems = [];
  const ids = results.map((r) => r.id);
  for (const id of new Set(ids)) if (ids.filter((x) => x === id).length > 1) problems.push(`duplicate case ${id}`);
  for (const id of Object.keys(EXPECTED)) if (!ids.includes(id)) problems.push(`missing case ${id}`);
  for (const r of results) {
    if (!(r.id in EXPECTED)) problems.push(`unexpected case ${r.id}`);
    else if (r.holds !== EXPECTED[r.id]) problems.push(`${r.id}: expected ${EXPECTED[r.id] ? "HOLDS" : "VIOLATED"}, got ${r.holds ? "HOLDS" : "VIOLATED"}`);
    if (r.holds && !r.reachable && !EXPECTED_NO_ACCEPTANCE.has(r.id)) problems.push(`${r.id}: holds vacuously (no acceptance reachable)`);
    if (EXPECTED_NO_ACCEPTANCE.has(r.id) && r.reachable) problems.push(`${r.id}: expected no acceptance, but one is reachable`);
  }
  if (problems.length) { console.error(`CHECK FAILED:\n- ${problems.join("\n- ")}`); process.exit(1); }
  console.error(`all ${results.length} cases present once, as expected, and every HOLDS case is non-vacuous (except ${[...EXPECTED_NO_ACCEPTANCE].join(", ")}, which holds with no acceptance by design)`);
}
