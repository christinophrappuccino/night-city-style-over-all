/* ============================================================================
 *  NIGHT CITY: STYLE OVER ALL — M2.5 IN-WORLD INTEGRATION GATE
 * ----------------------------------------------------------------------------
 *  Validates the two Stage-1 collectors that read REAL cyberpunk-red-core
 *  documents — engine/collect.mjs and engine/cyberware.mjs — against the
 *  play-tested Phase 82 outputs on live actors. The node parity gate already
 *  covers the pure compute modules; THIS closes the loop on the actor→data
 *  bridge, which a hand-built fixture can't fully exercise (real DataModels,
 *  effects, concealable mixins, role/skill items, …).
 *
 *  HOW TO RUN
 *  1. Open your in-world "Style Checker Phase 82" macro (script editor) — the
 *     compute classes (StyleCheckerApp, StyleDataManager, CyberwareAnalyzer) live
 *     in its scope, so this must run there.
 *  2. PASTE this whole block at the END of that macro (after selector.render(true);).
 *  3. Select the tokens to check (or none → all player-owned actors). Execute.
 *  4. Read the console: every line should say ✅. Any ✗ prints the diffing paths.
 *     It changes nothing in the world — it only reads and compares.
 * ========================================================================== */
(async () => {
  const MODULE = "night-city-style-over-all";
  const base = `/modules/${MODULE}/scripts`;

  // Live-load the engine collectors (ESM served by Foundry).
  let collect, analyzeCyberware;
  try {
    ({ collect } = await import(`${base}/engine/collect.mjs`));
    ({ analyzeCyberware } = await import(`${base}/engine/cyberware.mjs`));
  } catch (e) {
    console.error("M2.5: failed to import engine modules — is the module enabled?", e);
    ui.notifications.error("M2.5 integration check: engine import failed (see console).");
    return;
  }

  const cyberwareConfig = await StyleDataManager.getCyberwareConfig();

  // expected ⊆ actual deep compare (ignores functions + Foundry docs; abs eps on floats).
  const EPS = 1e-9;
  const isDoc = (v) => v && typeof v === "object" && (v.documentName || (v.id && v.collection));
  const diff = (actual, expected, path, out) => {
    if (expected === null || typeof expected !== "object") {
      if (typeof expected === "function") return;
      const eq = actual === expected || (typeof actual === "number" && typeof expected === "number" && Math.abs(actual - expected) <= EPS + EPS * Math.max(Math.abs(actual), Math.abs(expected)));
      if (!eq) out.push({ path: path || "(root)", expected, actual });
      return;
    }
    if (isDoc(expected)) return; // don't recurse into document refs
    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) { out.push({ path, expected: `array[${expected.length}]`, actual: typeof actual }); return; }
      if (actual.length !== expected.length) out.push({ path: `${path}.length`, expected: expected.length, actual: actual.length });
      expected.forEach((v, i) => diff(actual?.[i], v, `${path}[${i}]`, out));
      return;
    }
    if (actual === null || typeof actual !== "object") { out.push({ path, expected: "object", actual }); return; }
    for (const k of Object.keys(expected)) diff(actual[k], expected[k], path ? `${path}.${k}` : k, out);
  };

  const report = (name, diffs) => {
    if (!diffs.length) { console.log(`  ✅ ${name}`); return true; }
    console.log(`  ✗ ${name}`);
    for (const d of diffs.slice(0, 8)) console.log(`      ${d.path}: expected ${JSON.stringify(d.expected)}, got ${JSON.stringify(d.actual)}`);
    if (diffs.length > 8) console.log(`      …and ${diffs.length - 8} more`);
    return false;
  };

  const selected = canvas?.tokens?.controlled?.map((t) => t.actor).filter(Boolean) ?? [];
  const targets = selected.length ? selected : game.actors.filter((a) => a.hasPlayerOwner);
  if (!targets.length) { ui.notifications.error("M2.5: no targets. Select tokens or own a character."); return; }

  console.log(`%cM2.5 integration gate — ${targets.length} actor(s)`, "font-weight:bold");
  let pass = 0, fail = 0;

  for (const actor of targets) {
    try {
      const app = new StyleCheckerApp(actor);
      await app.initialize(); // ungated self-path — fills app.data, app.cyberwareData

      // collect(actor) ⊇ app.data (the macro's collectStyleData). Compare the
      // normalized fields both share; the engine carries extras (equippedClothing,
      // effectiveStats) the macro doesn't.
      const collected = collect(actor);
      const expectCollect = {
        parts: app.data.parts,
        totalCost: app.data.totalCost,
        weapons: app.data.weapons,
        armor: app.data.armor,
        threatAmmo: app.data.threatAmmo,
        styles: app.data.styles,
        socialStats: app.socialStats,
        roleData: app.roleData,
      };
      const cDiffs = []; diff(collected, expectCollect, "", cDiffs);
      report(`collect — ${actor.name}`, cDiffs) ? pass++ : fail++;

      // analyzeCyberware(actor) ⊇ app.cyberwareData.
      const cyber = analyzeCyberware(actor, cyberwareConfig);
      const cyDiffs = []; diff(cyber, app.cyberwareData, "", cyDiffs);
      report(`analyzeCyberware — ${actor.name}`, cyDiffs) ? pass++ : fail++;

      app.close?.();
    } catch (e) {
      console.error(`M2.5 check threw for ${actor?.name}:`, e);
      fail++;
    }
  }

  const total = pass + fail;
  const msg = `M2.5 integration gate: ${pass}/${total} passed${fail ? `, ${fail} FAILED` : " — GREEN"}.`;
  console.log(`%c${msg}`, `font-weight:bold;color:${fail ? "#dc3545" : "#28a745"}`);
  fail ? ui.notifications.warn(msg) : ui.notifications.info(msg);
})();
