/* ============================================================================
 *  NIGHT CITY: STYLE OVER ALL — M2 PARITY CAPTURE
 * ----------------------------------------------------------------------------
 *  Run ONCE to freeze Phase 82's computed numbers into JSON fixtures. The new
 *  engine is then tested against these fixtures (golden-snapshot parity gate).
 *
 *  HOW TO RUN
 *  1. Open your in-world "Style Checker Phase 82" macro in Foundry (the script
 *     editor). The compute classes (StyleCheckerApp, StyleRatingCalculator, …)
 *     are defined in that macro's scope, so this capture must run there too.
 *  2. PASTE this entire block at the very END of that macro, AFTER the existing
 *     `selector.render(true);` line. (You can delete it again afterwards — it
 *     changes nothing in the world; it only reads and downloads a file.)
 *  3. Select the tokens of the actors you want to capture (optional). If none
 *     are selected, it captures all player-owned actors.
 *  4. Execute the macro. A file `sc-parity-fixtures.json` downloads. Place it at
 *     modules/night-city-style-over-all/tests/fixtures/sc-parity-fixtures.json
 *  5. Tell me it's saved — the engine parity tests read it from there.
 *
 *  NOTE: capture runs the ungated SELF view (full information, no perception
 *  gating, no dice) — that is the deterministic baseline the engine must match.
 * ========================================================================== */
(async () => {
  const FIXTURE_SCHEMA = 1;

  // ---- pick targets --------------------------------------------------------
  const selected = canvas?.tokens?.controlled?.map((t) => t.actor).filter(Boolean) ?? [];
  const targets = selected.length
    ? selected
    : game.actors.filter((a) => a.hasPlayerOwner);
  if (!targets.length) {
    ui.notifications.error("Parity capture: no targets. Select tokens or own a character.");
    return;
  }

  // ---- safe serialize: strip Foundry docs, collapse only TRUE cycles -------
  // Tracks the ancestor path (not all-seen), so legitimately shared references
  // in a DAG (e.g. factionAffinity === allArchetypes[0]) serialize in full —
  // only a value that is its own ancestor becomes "[circular]".
  const safe = (root) => {
    const clone = (v, ancestors) => {
      if (v === null || typeof v !== "object") {
        return typeof v === "function" ? undefined : v;
      }
      if (ancestors.has(v)) return "[circular]"; // genuine cycle
      // Collapse any Foundry Document to a thin reference.
      if (v.documentName || (v.id && v.collection)) {
        return { _doc: v.documentName ?? "Document", id: v.id, name: v.name, type: v.type };
      }
      ancestors.add(v);
      let out;
      if (Array.isArray(v)) {
        out = v.map((x) => clone(x, ancestors));
      } else {
        out = {};
        for (const k of Object.keys(v)) {
          const cv = clone(v[k], ancestors);
          if (cv !== undefined) out[k] = cv;
        }
      }
      ancestors.delete(v); // pop — sibling/shared refs serialize fully
      return out;
    };
    return clone(root, new Set());
  };

  // ---- configs for the disguise sub-capture --------------------------------
  const factionsConfig = await StyleDataManager.getFactions();
  const FACTIONS = factionsConfig?.FACTIONS ?? {};
  const FACTION_ARCHETYPES = factionsConfig?.FACTION_ARCHETYPES ?? {};
  const ROLE_PROFILES = factionsConfig?.ROLE_PROFILES ?? null;
  // Configs CrewAnalyzer needs (crew sub-capture, below).
  const cyberwareConfig = await StyleDataManager.getCyberwareConfig();
  const ratingsConfig = await StyleDataManager.getRatingsConfig();
  // Exercise the disguise path against a handful of target factions.
  const disguiseTargets = Object.keys(FACTIONS).slice(0, 4);
  // District fit: exercise a handful of districts per actor.
  const districtsConfig = await StyleDataManager.getDistricts();
  const districtTargets = Object.keys(districtsConfig).slice(0, 4);

  const fixtures = [];

  for (const actor of targets) {
    try {
      const app = new StyleCheckerApp(actor);
      await app.initialize(); // ungated self-path: computes & stores everything

      // Disguise is computed in the GM tool, not initialize — capture it directly.
      const disguise = {};
      for (const factionKey of disguiseTargets) {
        const conf = StyleRatingCalculator.calculateDisguiseConfidence(
          actor, app.cyberwareData, factionKey, FACTIONS, FACTION_ARCHETYPES
        );
        const dc = StyleRatingCalculator.calculateDisguiseDC(conf?.confidence ?? 0, app.socialStats);
        disguise[factionKey] = { confidence: safe(conf), dc: safe(dc) };
      }

      // Lossless equipped-clothing list (parts dedupes per slot; this preserves
      // same-slot duplicates so profile counts stay exact). Mirrors collect.mjs.
      const equippedClothing = (actor.items ?? [])
        .filter((i) => i.type === "clothing" && i.system?.equipped === "equipped")
        .map((i) => ({
          id: i.id, name: i.name, slot: i.system?.type,
          style: i.system?.style, cost: i.system?.price?.market || 0,
        }));

      // Exact inputs for heat & danger (replicating initialize()'s self-path).
      const ammoHeat = StyleRatingCalculator.calculateAmmoHeat(app.data.threatAmmo);
      const drawnWeapons = (app.data?.weapons?.equipped ?? []).filter((w) => w.state === "drawn").length;
      const hpMax = actor?.system?.derivedStats?.hp?.max || 1;
      const hpCur = actor?.system?.derivedStats?.hp?.value ?? hpMax;
      const hpPct = (hpCur / Math.max(1, hpMax)) * 100;
      const woundHeat = hpPct <= 25 ? 12 : hpPct <= 50 ? 8 : hpPct <= 75 ? 3 : 0;
      const critItems = (actor?.items ?? []).filter((i) => i.type === "criticalInjury");
      let injuryHeat = 0;
      critItems.forEach((ci) => {
        injuryHeat += StyleRatingCalculator.INJURY_TERRIFYING?.includes(ci.name) ? 4 : 3;
      });
      const heatScMods = StyleRatingCalculator.collectDisguiseModifiers(actor, factionsConfig);
      if (woundHeat + injuryHeat > 0) heatScMods.heat = (heatScMods.heat || 0) + woundHeat + injuryHeat;

      // District fit — calculated for a few districts using the actor's top archetype.
      const topArchetypeKey = app.factionAffinity?.key || app.allArchetypes?.[0]?.key || "unknown";
      const districtDanger = {};
      for (const dk of districtTargets) {
        districtDanger[dk] = safe(StyleRatingCalculator.calculateDistrictFactionDanger(
          topArchetypeKey, districtsConfig[dk], FACTIONS, app.roleData, ROLE_PROFILES
        ));
      }

      // Budget planner — exercise optimizeBudget at a small/large budget against the
      // first district, using the actor's role + top archetype. The engine test
      // (checks/recommendations.mjs) rebuilds these inputs from the captured keys.
      const budgetDistrictKey = districtTargets[0];
      const budgetRoleKey = app.roleData?.primaryRole?.key || null;
      const budgetRank = app.roleData?.primaryRole?.rank || 0;
      const budgetArchKey = app.factionAffinity?.key || app.allArchetypes?.[0]?.key || null;
      const budgetRoleProfile = budgetRoleKey ? (ROLE_PROFILES?.[budgetRoleKey] || null) : null;
      const budgetTargetArch = budgetArchKey ? (FACTION_ARCHETYPES?.[budgetArchKey] || null) : null;
      const budgets = [500, 5000];
      const budgetPlan = {};
      for (const b of budgets) {
        budgetPlan[b] = safe(RecommendationEngine.optimizeBudget(
          b, districtsConfig[budgetDistrictKey], budgetRoleProfile, budgetRank, budgetTargetArch, actor
        ));
      }
      const budgetMeta = { districtKey: budgetDistrictKey, roleKey: budgetRoleKey, rank: budgetRank, archKey: budgetArchKey, budgets };

      // Raw items the cyberware analyzer reads — projected to plain objects so they
      // survive safe() (which would otherwise collapse Item documents to thin refs)
      // and let engine/cyberware.mjs be node-tested against inputs.cyberwareData.
      const cyberItems = (actor.items ?? [])
        .filter((i) => ["cyberware", "gear", "item", "drug"].includes(i.type))
        .map((i) => ({
          id: i.id, name: i.name, type: i.type, img: i.img ?? null,
          system: {
            type: i.system?.type,
            isInstalled: i.system?.isInstalled,
            isFoundational: i.system?.isFoundational,
            core: i.system?.core,
            humanityLoss: i.system?.humanityLoss ? { total: i.system.humanityLoss.total, base: i.system.humanityLoss.base } : undefined,
            concealable: i.system?.concealable ? { isConcealed: i.system.concealable.isConcealed } : undefined,
            equipped: i.system?.equipped,
            description: (i.system?.description && typeof i.system.description === "object") ? { value: i.system.description.value } : i.system?.description,
            amount: i.system?.amount,
            quantity: i.system?.quantity,
          },
          effects: (i.effects?.contents ?? Array.from(i.effects ?? [])).map((e) => ({
            disabled: e.disabled,
            changes: (e.changes ?? []).map((c) => ({ key: c.key, value: c.value })),
          })),
        }));

      fixtures.push(safe({
        actorId: actor.id,
        actorName: actor.name,

        // ---- shared inputs (so each engine fn can be unit-tested in isolation)
        inputs: {
          socialStats: app.socialStats,
          roleData: app.roleData,
          cyberwareData: app.cyberwareData,
          scMods: app.scMods,
          scene: {
            yourStyleScore: app.sceneAnalysis?.yourStyleScore,
            averageStyleScore: app.sceneAnalysis?.averageStyleScore,
          },
          counts: {
            weaponsEquipped: app.data?.weapons?.equipped?.length ?? 0,
            armorEquipped: app.data?.armor?.equipped?.length ?? 0,
            drawnWeapons,
          },
          chromePercent: app.cyberwareData?.chromePercent,

          // Exact heat inputs: scMods here INCLUDES wound/injury heat (the variant
          // initialize() actually feeds calculateHeatIndex — distinct from .scMods).
          heat: { ammoHeat, drawnWeapons, woundHeat, injuryHeat, scMods: heatScMods },

          // Exact danger inputs: prepared actor system (stats/derivedStats) + injuries.
          actorSystem: actor.system,
          criticalInjuries: critItems.map((c) => c.name),

          // District-fit inputs.
          topArchetypeKey,
          districtKeys: districtTargets,

          // Budget-planner inputs (keys the engine test resolves against config).
          budgetMeta,

          // Raw items for the cyberware-analyzer node parity check.
          cyberItems,

          // Original canvas token order (token ids) — lets scene reproduce the
          // threatLevel tie-break exactly (allCharacters is power-sorted).
          sceneTokenOrder: app.sceneAnalyzer?.sceneTokens?.map((t) => t.id) ?? null,
        },

        // ---- outputs the engine must reproduce
        outputs: {
          styleRating: app.styleRating,
          cohesion: app.cohesion,
          heatIndex: app.heatIndex,
          dangerResult: app.dangerResult,
          allArchetypes: app.allArchetypes,
          factionAffinity: app.factionAffinity,
          chromeProfile: app.chromeProfile,
          wardrobeReserve: app.wardrobeReserve,
          disguise,
          sceneAnalysis: app.sceneAnalysis,
          districtDanger,
          budgetPlan,
        },

        // ---- full collectStyleData output (+ lossless equippedClothing), for
        //      collect.mjs integration parity and exact profile counts.
        collected: { ...app.data, equippedClothing },
      }));

      app.close?.();
      console.log(`✅ parity captured: ${actor.name}`);
    } catch (e) {
      console.error(`❌ parity capture failed for ${actor?.name}:`, e);
      ui.notifications.warn(`Parity capture failed for ${actor?.name} — see console.`);
    }
  }

  // ---- crew sub-capture: the whole target set analyzed as one crew ----------
  // The engine (engine/crew.mjs) is tested against this via tests/parity/checks/crew.mjs,
  // which rebuilds the same members from the per-actor fixtures and compares.
  let crewAnalysis = null;
  try {
    const crewMembers = targets.map((a) => ({ actor: a, tokenId: null, name: a.name, img: a.img }));
    if (crewMembers.length > 0 && factionsConfig) {
      const analyzer = new CrewAnalyzer(crewMembers, cyberwareConfig, ratingsConfig, factionsConfig);
      crewAnalysis = safe(analyzer.analyze());
      console.log(`✅ crew captured: ${crewMembers.length} member(s)`);
    }
  } catch (e) {
    console.error("❌ crew capture failed:", e);
    ui.notifications.warn("Crew parity capture failed — see console.");
  }

  const payload = {
    schema: FIXTURE_SCHEMA,
    capturedFrom: "stylechecker2_0_Phase82",
    capturedAt: new Date().toISOString(),
    foundry: game.version,
    system: `${game.system.id}@${game.system.version}`,
    count: fixtures.length,
    fixtures,
    crewAnalysis,
  };

  const json = JSON.stringify(payload, null, 2);
  saveDataToFile(json, "application/json", "sc-parity-fixtures.json");
  console.log(`🎯 Parity fixtures captured for ${fixtures.length} actor(s). File downloaded.`);
  ui.notifications.info(`Parity: captured ${fixtures.length} actor(s) → sc-parity-fixtures.json`);
})();
