/**
 * style-reads.mjs — the engine pipeline orchestrator (the spine, guide §29.1).
 *
 * One place that runs an actor through the §29.1 stages in order and returns the
 * bundle of explainable reads every app renders. The engine modules stay pure; this
 * service wires them together with the live config (engine-config) and the actor's
 * CPR documents (via cpr-adapter). Keeping the order here — rather than letting each
 * app assemble its own — is the rule that stops features computing reads their own way.
 *
 * Scope (M3 self-view): the reads that need only the actor (+ an optional room for the
 * heat outlier). The observer lens, disguise-vs-faction, and district fit need extra
 * context and ride the GM/observed views (later M3/M7).
 *
 * Spec: SC-Module-Architecture-Guide.md §29.1, §4.1
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { collect } from "../engine/collect.mjs";
import { analyzeCyberware } from "../engine/cyberware.mjs";
import { fullRating, cohesion } from "../engine/profile.mjs";
import { dripRating } from "../engine/ratings.mjs";
import { heatIndex, ammoHeat, woundInjuryHeat } from "../engine/heat.mjs";
import { dangerScore } from "../engine/danger.mjs";
import { detectAllArchetypes, detectChromeProfile } from "../engine/archetypes.mjs";
import { deriveSceneToken, aggregateScene } from "../engine/scene.mjs";
import { collectScMods } from "../engine/cascade.mjs";
import { vibeProfile } from "../engine/vibes.mjs";
import { resolveVisibility } from "../engine/visibility.mjs";
import { dressRegister } from "../engine/formality.mjs";
import { getTunables } from "../config/tunables.mjs";
import { getEngineConfig } from "./engine-config.mjs";

/** Actor → aggregated sc-key / styleData read-modifiers (dual-read, cascade applied). */
function actorScMods(actor, config, items, tunables = getTunables(), factors = undefined) {
  return collectScMods(
    { items, actorEffects: cpr.getActorEffects(actor) },
    config.factions ?? {},
    tunables.cascade ?? {},
    config.brands ?? {},
    tunables.brand ?? {},
    { factors }
  );
}

/**
 * Run one actor through the self-view pipeline.
 * @param {object} actor CPR actor document
 * @param {object} [opts]
 * @param {object[]} [opts.sceneActors] actors present in the room (for the heat outlier);
 *   defaults to just this actor (solo baseline — outlier 0).
 * @param {object} [opts.config] pre-fetched engine config (defaults to getEngineConfig()).
 * @param {object[]} [opts.items] hypothetical-set override (Wardrobe stage preview, §7.3):
 *   the FULL item list to evaluate instead of the actor's real one. Zero writes.
 * @param {"self"|"observed"} [opts.view] §29.2 two-mode switch (M9.1). "self"
 *   (default) scales styleData/sc.* contributions by readPriority only (full
 *   set); "observed" also applies physical visibility — covered items stop
 *   reading (§27.3). NOTE: the CPR-native genre counts (collect) and the
 *   perception lens are not yet view-gated; they ride the observer work.
 * @returns {object} { actor, collected, cyberwareData, styleRating, cohesion, dripRating,
 *   scene, heat, danger, archetypes, chromeProfile, scMods, vibes, visibility,
 *   view, woundInjuryHeat }
 */
export function computeActorReads(actor, { sceneActors, config = getEngineConfig(), items, view = "self" } = {}) {
  const roleProfiles = config.factions?.ROLE_PROFILES ?? null;
  const archetypeDefs = config.factions?.FACTION_ARCHETYPES ?? {};
  const itemList = items ?? cpr.getItems(actor);
  const tunables = getTunables();

  // Stage 1–2 — collect + physical visibility (§29.1; M9.1: visibility.mjs).
  const visibility = resolveVisibility({ items: itemList }, tunables.slots ?? {});
  const factorView = view === "observed" ? "observed" : "self";
  const factors = Object.fromEntries(
    Object.entries(visibility.factors).map(([id, f]) => [id, f[factorView]])
  );

  const collected = collect(actor, { items: itemList });
  const cyberwareData = analyzeCyberware(actor, config.cyberware, { items: itemList });
  const socialStats = collected.socialStats;
  const roleData = collected.roleData;
  const scMods = actorScMods(actor, config, itemList, tunables, factors);
  const criticalInjuries = itemList.filter((i) => i.type === cpr.ITEM_TYPE.CRITICAL_INJURY);

  // Stage 3–4 — characterization.
  const styleRating = fullRating({
    collected, cyberwareData, socialStats, roleData,
    formula: config.ratings.RATING_FORMULA, roleProfiles, tiers: config.ratings.TIERS,
  });
  const coh = cohesion(collected, socialStats);
  const archetypes = detectAllArchetypes({
    collected, cyberwareData, archetypes: archetypeDefs, socialStats, roleData, roleProfiles,
    scMods: scMods.hasModifiers ? scMods : null,
  });
  const chromeProfile = detectChromeProfile(cyberwareData, archetypeDefs);

  // Scene (room) — only needed for heat's style-outlier term.
  const room = (sceneActors?.length ? sceneActors : [actor]).filter(Boolean);
  const tokens = room.map((a) => {
    const sameActor = a.id === actor.id;
    return deriveSceneToken({
      id: a.id, name: a.name, actorId: a.id,
      collected: sameActor ? collected : collect(a),
      cyberwareData: sameActor ? cyberwareData : analyzeCyberware(a, config.cyberware),
    });
  });
  const scene = aggregateScene({ tokens, currentActorId: actor.id });

  // Stage 5 — consequences (self-view subset: heat + danger).
  const aHeat = ammoHeat(collected.threatAmmo);
  const drawnWeapons = collected.weapons.equipped.filter((w) => w.state === "drawn").length;
  // Heat variant of scMods: wound/injury heat folds into .heat (macro §12406–12423).
  // Archetypes & co. keep the BASE scMods — the fold is heat-only.
  const wiHeat = woundInjuryHeat({
    hp: cpr.getHP(actor),
    criticalInjuryNames: criticalInjuries.map((ci) => ci.name),
    terrifyingNames: tunables.danger.injury.terrifyingNames,
    tunables,
  });
  const heatScMods = wiHeat.value > 0 ? { ...scMods, heat: (scMods.heat || 0) + wiHeat.value } : scMods;
  const heat = heatIndex({
    styleScore: styleRating.total, sceneAvg: scene.averageStyleScore,
    weaponsEquipped: collected.weapons.equipped.length, chromePercent: cyberwareData.chromePercent,
    armorEquipped: collected.armor.equipped.length, socialStats, roleData, roleProfiles,
    scMods: heatScMods.hasModifiers || heatScMods.heat ? heatScMods : null,
    ammoHeat: aHeat, drawnWeapons,
  });
  const danger = dangerScore({
    actorSystem: actor.system, criticalInjuries, weaponsData: collected.weapons.equipped,
    armorCount: collected.armor.equipped.length, cyberwareData, socialStats, roleData, roleProfiles,
    ammoHeat: aHeat,
  });

  // Vibe profile (§22.3, M9.1) — parallel, additive tone pass over the aggregated
  // vibe map (items + brand identities). Never feeds archetype detection.
  const vibes = vibeProfile(scMods, tunables.vibe ?? {});

  // Dress register (§28, M9.1) — same read factors, so a covered gown doesn't
  // set the observed register. Consumed by scene gates + the disguise hook.
  const formality = dressRegister({ items: itemList, factors }, tunables.formality ?? {});

  return {
    actor,
    collected,
    cyberwareData,
    styleRating,
    cohesion: coh,
    dripRating: dripRating(collected.totalCost),
    scene,
    heat,
    danger,
    archetypes,
    chromeProfile,
    scMods,
    vibes,
    formality,
    visibility,
    view,
    woundInjuryHeat: wiHeat,
  };
}

const DEFAULT_TOP_ARCH = { key: "unknown", label: "Unknown", confidence: 0 };

/**
 * Build per-token reads for the GM dashboard (readouts, scene gate, disguise, tension).
 * One pass through the pipeline per actor; the room is the whole set (heat outlier).
 * @param {object[]} actors
 * @param {object} [config]
 * @returns {object[]} tokenData records
 */
export function computeSceneTokens(actors, config = getEngineConfig()) {
  const list = (actors || []).filter(Boolean);
  return list.map((actor) => {
    const r = computeActorReads(actor, { sceneActors: list, config });
    const cw = r.cyberwareData;
    const topArch = r.archetypes[0] || { ...DEFAULT_TOP_ARCH };
    return {
      actorId: actor.id,
      name: actor.name,
      img: actor.img,
      isPC: !!actor.hasPlayerOwner,
      styleScore: r.styleRating.total,
      tier: r.styleRating.tier,
      styles: r.collected.styles,
      weapons: { visible: r.collected.weapons.equipped, concealed: r.collected.weapons.concealed },
      visibleChromeCount: (cw.visible_chrome?.length || 0) + (cw.borgware?.length || 0),
      archetypes: r.archetypes,
      topArch,
      socialStats: r.collected.socialStats,
      roleData: r.collected.roleData,
      collected: r.collected,
      cyberwareData: cw,
      heat: r.heat,
      danger: r.danger,
      cohesion: r.cohesion,
      drip: r.dripRating,
      scMods: r.scMods,
      vibes: r.vibes,
      formality: r.formality,
    };
  });
}

/**
 * Build one `analyzeCrew` member input from an actor (reuses the pipeline). Maps a
 * party of actors to crew-member records for engine/crew.mjs.
 * @param {object} actor
 * @param {object} [config] pre-fetched engine config (share across the party)
 * @returns crew-member input (collected + cyberwareData + styleRating/cohesion/archetypes + actorSystem/criticalInjuries)
 */
export function buildCrewMemberInput(actor, config = getEngineConfig()) {
  const r = computeActorReads(actor, { config });
  return {
    name: actor.name,
    img: actor.img,
    tokenId: null,
    collected: r.collected,
    cyberwareData: r.cyberwareData,
    styleRating: r.styleRating,
    cohesion: r.cohesion,
    archetypes: r.archetypes,
    actorSystem: actor.system,
    criticalInjuries: cpr.getItemsOfType(actor, cpr.ITEM_TYPE.CRITICAL_INJURY),
  };
}
