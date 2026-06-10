/**
 * engine-config.mjs — Integration-layer config provider for the engine.
 *
 * The engine functions are pure and take their config (RATING_FORMULA, TIERS,
 * FACTIONS/FACTION_ARCHETYPES/ROLE_PROFILES, cyberware tables, districts) as plain
 * arguments. This service assembles those from the world settings (the source of
 * truth, guide §3 D3) via DataStore, falling back to the bundled seed when settings
 * aren't available yet (early boot, non-Foundry test context, or a never-written key).
 *
 * It lives in services/ — it touches game.settings (through DataStore), so it is NOT
 * engine code; the engine stays game-free. Apps call getEngineConfig() and hand the
 * result to the pipeline (services/style-reads.mjs).
 *
 * Spec: SC-Module-Architecture-Guide.md §4.1, §4.2, §5.3
 */

import { SETTINGS } from "../constants.mjs";
import { DataStore } from "../data/data-store.mjs";

import RATINGS_SEED from "../config/ratings.mjs";
import FACTIONS_SEED from "../config/factions.mjs";
import CYBERWARE_SEED from "../config/cyberware.mjs";
import DISTRICTS_SEED from "../config/districts.mjs";
import SCENE_GATES_SEED from "../config/scene-gates.mjs";

/** DataStore.get(key) with a hard seed fallback (settings unregistered / absent). */
function live(key, seed) {
  try {
    const data = DataStore.get(key);
    return data ?? seed;
  } catch {
    return seed; // game.settings not ready (boot / node) — use the bundled seed
  }
}

/**
 * Assemble the engine-ready config bundle from settings (seed fallback).
 * @returns {{ratings, factions, cyberware, districts, sceneGates}}
 *   ratings    = { RATING_FORMULA, TIERS }
 *   factions   = { FACTIONS, FACTION_ARCHETYPES, ROLE_PROFILES }
 *   cyberware  = { CYBERWARE_CATEGORIES, CYBERWARE_VISIBILITY, HUMANITY_CONFIG }
 *   districts  = { <KEY>: { name, modifiers, … } }
 *   sceneGates = { gates: { <KEY>: { name, icon, criteria, … } } }
 */
export function getEngineConfig() {
  return {
    ratings: live(SETTINGS.CONFIG_RATINGS, RATINGS_SEED),
    factions: live(SETTINGS.CONFIG_FACTIONS, FACTIONS_SEED),
    cyberware: live(SETTINGS.CONFIG_CYBERWARE, CYBERWARE_SEED),
    districts: live(SETTINGS.CONFIG_DISTRICTS, DISTRICTS_SEED),
    sceneGates: live(SETTINGS.CONFIG_SCENE_GATES, SCENE_GATES_SEED),
  };
}
