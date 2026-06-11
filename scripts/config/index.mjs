/**
 * config/index.mjs — config registry.
 *
 * Single place that ties each world-settings config key (constants.SETTINGS.*) to
 * its seed default and the legacy journal name Migration 001 imports from. The
 * data-store registers a setting per entry; the migration walks this same list.
 *
 * Each config is stored in settings as an envelope: { schema, data }. The `schema`
 * is per-config so blobs migrate independently (guide §5.3); `data` is the verbatim
 * shape the journals hold today (district map, factions blob, etc.).
 *
 * NOTE: CONFIG_ARCHETYPES has no entry — the reference macro has no archetypes
 * journal/default (archetype data lives under factions.FACTION_ARCHETYPES and is
 * engine-derived). GM-authored archetype config is a later milestone.
 *
 * Spec: SC-Module-Architecture-Guide.md §4.2, §5.3, §5.4
 */

import { SETTINGS } from "../constants.mjs";

import DISTRICTS from "./districts.mjs";
import COMMENTS from "./comments.mjs";
import CYBERWARE from "./cyberware.mjs";
import RATINGS from "./ratings.mjs";
import FACTIONS from "./factions.mjs";
import CREWS from "./crews.mjs";
import SCENE_GATES from "./scene-gates.mjs";
import STYLE_TEMPLATES from "./style-templates.mjs";
import UNIFORMS from "./uniforms.mjs";
import SHOPS from "./shops.mjs";
import TRENDS from "./trends.mjs";
import GARDEN from "./garden.mjs";
import BRANDS from "./brands.mjs";

/**
 * @typedef {Object} ConfigEntry
 * @property {string} key      settings key (SETTINGS.*)
 * @property {string} journal  legacy JournalEntry name the macro used (Migration 001 source)
 * @property {number} schema   per-config schema version stamped into the envelope
 * @property {object} seed     verbatim default data blob
 */

/** @type {ConfigEntry[]} */
export const CONFIGS = [
  { key: SETTINGS.CONFIG_DISTRICTS,   journal: "Style Checker - Districts Data",   schema: 1, seed: DISTRICTS },
  { key: SETTINGS.CONFIG_FACTIONS,    journal: "Style Checker - Factions Config",  schema: 1, seed: FACTIONS },
  { key: SETTINGS.CONFIG_RATINGS,     journal: "Style Checker - Style Ratings",    schema: 1, seed: RATINGS },
  { key: SETTINGS.CONFIG_CYBERWARE,   journal: "Style Checker - Cyberware Config", schema: 1, seed: CYBERWARE },
  { key: SETTINGS.CONFIG_COMMENTS,    journal: "Style Checker - Social Comments",  schema: 1, seed: COMMENTS },
  { key: SETTINGS.CONFIG_CREWS,       journal: "Style Checker - Crew Config",      schema: 1, seed: CREWS },
  { key: SETTINGS.CONFIG_SCENE_GATES, journal: "Style Checker - Scene Gates",      schema: 1, seed: SCENE_GATES },
  // No legacy journals exist for these — Migration 001 skips absent journals.
  { key: SETTINGS.CONFIG_STYLE_TEMPLATES, journal: "Style Checker - Style Templates", schema: 1, seed: STYLE_TEMPLATES },
  { key: SETTINGS.CONFIG_UNIFORMS,        journal: "Style Checker - Uniforms",        schema: 1, seed: UNIFORMS },
  { key: SETTINGS.CONFIG_SHOPS,           journal: "Style Checker - Shops",           schema: 1, seed: SHOPS },
  { key: SETTINGS.CONFIG_TRENDS,          journal: "Style Checker - Trends",          schema: 1, seed: TRENDS },
  { key: SETTINGS.CONFIG_GARDEN,          journal: "Style Checker - Garden",          schema: 1, seed: GARDEN },
  { key: SETTINGS.CONFIG_BRANDS,          journal: "Style Checker - Brands",          schema: 1, seed: BRANDS },
];

/** Lookup a config entry by its settings key. */
export function getConfigEntry(key) {
  return CONFIGS.find((c) => c.key === key);
}
