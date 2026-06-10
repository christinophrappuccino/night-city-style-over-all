/**
 * wardrobe-staging.mjs — the Wardrobe's stage/commit model (M6, guide §7.3).
 *
 * The Wardrobe never edits documents while you browse: it builds a HYPOTHETICAL
 * item list ("staged set") and runs it through the engine seam
 * (`computeActorReads(actor, {items})`) for the live preview — zero writes. Commit
 * is one batched `updateEmbeddedDocuments` payload built here.
 *
 * Staging model: ONE item per CPR clothing slot. `stagedBySlot` is a plain object
 * `{ <slot>: itemId | null }` — an itemId stages that item into the slot
 * (displacing whatever is equipped there); `null` stages the slot empty. Slots
 * absent from the map are untouched.
 *
 * Pure: items in, shims/updates out, all CPR paths via the adapter. Node-testable
 * with plain mock items — no Foundry, no documents mutated.
 */

import * as cpr from "../data/cpr-adapter.mjs";

/** Items shadowed by a staged slot keep their identity but swap equip state. */
function withEquipState(item, state) {
  const system = cpr.getSystemData(item);
  system.equipped = state;
  return {
    id: item.id, name: item.name, img: item.img, type: item.type,
    effects: item.effects, flags: item.flags,
    system,
    _staged: true,
  };
}

const isClothing = (item) => item.type === cpr.ITEM_TYPE.CLOTHING;

/**
 * Drop no-op staged entries: staging the item that is already the slot's equipped
 * occupant (and the only one), or staging-empty an already-empty slot.
 * @returns {object} a cleaned copy of stagedBySlot
 */
export function normalizeStaged(items, stagedBySlot = {}) {
  const out = {};
  for (const [slot, stagedId] of Object.entries(stagedBySlot)) {
    const inSlot = items.filter((i) => isClothing(i) && cpr.getClothingSlot(i) === slot);
    const equipped = inSlot.filter((i) => cpr.isEquipped(i));
    const isNoop = stagedId === null
      ? equipped.length === 0
      : equipped.length === 1 && equipped[0].id === stagedId;
    if (!isNoop) out[slot] = stagedId;
  }
  return out;
}

/**
 * Build the hypothetical item list for a staged set (the preview input).
 * Non-clothing items and unstaged slots pass through untouched (same documents);
 * staged slots get equip-state shims.
 * @param {object[]} items        the actor's real items
 * @param {object} stagedBySlot   { <slot>: itemId|null }
 * @returns {object[]}
 */
export function buildStagedItems(items, stagedBySlot = {}) {
  const slots = Object.keys(stagedBySlot);
  if (!slots.length) return items;
  return items.map((item) => {
    if (!isClothing(item)) return item;
    const slot = cpr.getClothingSlot(item);
    if (!(slot in stagedBySlot)) return item;
    const stagedId = stagedBySlot[slot];
    if (item.id === stagedId) {
      return cpr.isEquipped(item) ? item : withEquipState(item, cpr.EQUIP.EQUIPPED);
    }
    // Displaced occupant (or staged-empty slot): goes back to the closet.
    return cpr.isEquipped(item) ? withEquipState(item, cpr.EQUIP.OWNED) : item;
  });
}

/**
 * Build the batched commit payload (`actor.updateEmbeddedDocuments("Item", …)`)
 * that makes the real equip states match the staged set. Only records for items
 * whose state actually changes are emitted.
 * @param {object[]} items        the actor's real items
 * @param {object} stagedBySlot   { <slot>: itemId|null }
 * @returns {object[]} update records [{_id, "system.equipped"}]
 */
export function buildCommitUpdates(items, stagedBySlot = {}) {
  const updates = [];
  for (const [slot, stagedId] of Object.entries(stagedBySlot)) {
    for (const item of items) {
      if (!isClothing(item) || cpr.getClothingSlot(item) !== slot) continue;
      if (item.id === stagedId) {
        if (!cpr.isEquipped(item)) updates.push(cpr.equipUpdateRecord(item, cpr.EQUIP.EQUIPPED));
      } else if (cpr.isEquipped(item)) {
        updates.push(cpr.equipUpdateRecord(item, cpr.EQUIP.OWNED));
      }
    }
  }
  return updates;
}
