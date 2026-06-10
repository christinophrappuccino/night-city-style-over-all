/**
 * outfits.mjs — outfit presets (M6.3, guide §7.4).
 *
 * A preset is a named snapshot of a complete look, stored on the actor flag
 * (FLAGS.OUTFITS, an array — arrays replace wholesale on update, so plain
 * setOutfits writes are safe):
 *
 *   { id, name, icon, note, items: [{ itemId, slot, name }] }
 *
 * `name` on each entry is a superset of the §7.4 schema — kept so a missing item
 * (sold, deleted) can be reported by name at apply-time instead of by id.
 *
 * Semantics: an outfit is a COMPLETE look. Applying one stages its items into
 * their slots AND stages every other clothing slot empty — wearing "Kabuki Night
 * Out" means wearing exactly that, not that plus whatever was already on. Apply
 * rides the Wardrobe's stage → preview → commit flow (§7.3), so nothing is
 * written until the player hits Apply.
 *
 * Pure: items in, staging maps out, all CPR paths via the adapter. The actual
 * flag read/write lives in data/flags.mjs; the Wardrobe app calls both.
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { CLOTHING_SLOTS } from "../engine/collect.mjs";

/**
 * Snapshot the equipped clothing of an item list (real or staged view) into
 * preset entries — what you see is what you save.
 * @param {object[]} items
 * @returns {{itemId:string, slot:string, name:string}[]}
 */
export function snapshotOutfit(items) {
  const out = [];
  for (const item of items) {
    if (item.type !== cpr.ITEM_TYPE.CLOTHING || !cpr.isEquipped(item)) continue;
    const slot = cpr.getClothingSlot(item);
    if (!slot) continue;
    out.push({ itemId: item.id, slot, name: item.name });
  }
  return out;
}

/**
 * Build a new preset object. `id` comes from the caller (foundry.utils.randomID
 * in the app; anything unique in tests) so this stays pure.
 */
export function makePreset({ id, name, items, icon = null, note = "" }) {
  return { id, name, icon, note, items };
}

/**
 * Resolve a preset against the actor's current items into a Wardrobe staging map.
 * Complete-look semantics: every clothing slot is staged — the preset's items in,
 * all other slots empty. Entries whose item no longer exists (or is no longer
 * clothing in that slot) are reported in `missing`.
 *
 * @param {object} preset        { items: [{itemId, slot, name}] }
 * @param {object[]} items       the actor's current items
 * @returns {{ stagedBySlot: object, missing: {itemId, slot, name}[] }}
 */
export function outfitToStaged(preset, items) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const stagedBySlot = {};
  for (const slot of CLOTHING_SLOTS) stagedBySlot[slot] = null;

  const missing = [];
  for (const entry of preset?.items ?? []) {
    const item = byId.get(entry.itemId);
    const resolvable =
      item && item.type === cpr.ITEM_TYPE.CLOTHING && cpr.getClothingSlot(item) === entry.slot;
    if (resolvable) stagedBySlot[entry.slot] = entry.itemId;
    else missing.push(entry);
  }
  return { stagedBySlot, missing };
}

/** List helpers — pure array ops the app persists via setOutfits. */
export const addOutfit = (outfits, preset) => [...(outfits ?? []), preset];
export const removeOutfit = (outfits, id) => (outfits ?? []).filter((o) => o.id !== id);
export const renameOutfit = (outfits, id, name) =>
  (outfits ?? []).map((o) => (o.id === id ? { ...o, name } : o));
