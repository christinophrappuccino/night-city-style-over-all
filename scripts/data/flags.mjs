/**
 * flags.mjs — typed get/set helpers for item & actor flags under this module.
 *
 * Item metadata (styleData) and actor data (outfits, prefs) live in the module's
 * flag scope — never in CPR's own fields, never patching the system (CLAUDE.md
 * rules 3–5). The flag scope IS the module id (locked).
 *
 * Read helpers are pure field access (safe in engine/collect via the data layer);
 * write helpers are async and touch the document API.
 *
 * Spec: SC-Module-Architecture-Guide.md §5.2, §27
 */

import { MODULE_ID, FLAGS } from "../constants.mjs";

// ---- generic ---------------------------------------------------------------

/** Read a module flag off any document (pure; reads the flags object directly). */
export function getFlag(doc, key) {
  return doc?.flags?.[MODULE_ID]?.[key];
}

/** Write a module flag (async; uses the document API). */
export function setFlag(doc, key, value) {
  return doc.setFlag(MODULE_ID, key, value);
}

/** Remove a module flag (async). */
export function unsetFlag(doc, key) {
  return doc.unsetFlag(MODULE_ID, key);
}

// ---- item styleData (§5.2) -------------------------------------------------

/** The styleData metadata blob on an item, or undefined if none authored. */
export const getStyleData = (item) => getFlag(item, FLAGS.STYLE_DATA);

/** True if the item carries a styleData flag — D4: its sc.* AEs are then ignored. */
export const hasStyleData = (item) => getStyleData(item) !== undefined;

export const setStyleData = (item, data) => setFlag(item, FLAGS.STYLE_DATA, data);

const isPlainObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);

/**
 * Foundry's Document#update MERGES object data — keys deleted from a working copy
 * silently survive in the database (the M5 "Deadwoods still appears" bug). This
 * injects `-=key: null` deletion markers for every key the persisted blob has that
 * the new payload no longer does, recursing into nested maps. Pure.
 */
export function withDeletionMarkers(persisted, next) {
  if (!isPlainObject(persisted)) return next;
  const out = { ...next };
  for (const [k, v] of Object.entries(persisted)) {
    if (!(k in out)) out[`-=${k}`] = null;
    else if (isPlainObject(v) && isPlainObject(out[k])) out[k] = withDeletionMarkers(v, out[k]);
  }
  return out;
}

/**
 * THE safe partial-write for styleData: diffs against what's stored and performs
 * deletions properly. Every styleData writer (Item Style Tab, tailor, …) goes
 * through here — never through a bare update.
 */
export function updateStyleData(item, next, { render = false } = {}) {
  const payload = withDeletionMarkers(getStyleData(item), next);
  return item.update({ [`flags.${MODULE_ID}.${FLAGS.STYLE_DATA}`]: payload }, { render });
}

// ---- actor data ------------------------------------------------------------

/** Saved outfit presets on an actor (array; §7.4). */
export const getOutfits = (actor) => getFlag(actor, FLAGS.OUTFITS) ?? [];
export const setOutfits = (actor, outfits) => setFlag(actor, FLAGS.OUTFITS, outfits);

/** Per-character SC preferences. */
export const getActorPrefs = (actor) => getFlag(actor, FLAGS.ACTOR_PREFS) ?? {};
export const setActorPrefs = (actor, prefs) => setFlag(actor, FLAGS.ACTOR_PREFS, prefs);

/**
 * GM read overrides (§14.3, M9.3c): pin a read on THIS actor regardless of gear.
 * Shape: { archetype?: key, heat?: {mode:"offset"|"force", value:number},
 *          disguise?: "holds"|"blown", brandTier?: tierKey }. Absent = computed.
 * Setting an empty object clears the flag entirely.
 */
export const getOverrides = (actor) => getFlag(actor, FLAGS.OVERRIDES) ?? null;
export const setOverrides = (actor, overrides) =>
  overrides && Object.keys(overrides).length
    ? setFlag(actor, FLAGS.OVERRIDES, overrides)
    : unsetFlag(actor, FLAGS.OVERRIDES);

// ---- scene style tags (§14.8, M7) -------------------------------------------

/** A scene's style tags: { district?: key, gate?: key }. */
export const getSceneStyle = (scene) => getFlag(scene, FLAGS.SCENE_STYLE) ?? {};
export const setSceneStyle = (scene, tags) => setFlag(scene, FLAGS.SCENE_STYLE, tags);

/** The ACTIVE scene's style tags (the table's current district/gate context). */
export function activeSceneStyle() {
  const scene = game.scenes?.active ?? canvas?.scene ?? null;
  return scene ? { scene, ...getSceneStyle(scene) } : { scene: null };
}
