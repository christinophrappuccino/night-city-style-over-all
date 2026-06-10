/**
 * quick-dress.mjs — NPC Quick-Dress templates (M6.4, guide §14.5).
 *
 * "Dress this mook as a Tyger Claw foot soldier" — one click, a fully-styled NPC.
 * A template is a WORLD-level outfit (CONFIG_STYLE_TEMPLATES, GM-authored from the
 * Wardrobe) whose pieces are item references by UUID. Applying it to a target:
 *
 *   · REUSES a piece the target already owns (same name + slot — repeated
 *     quick-dressing never piles up duplicate items);
 *   · IMPORTS unowned pieces (embedded copies of the source items, equipped);
 *   · UNEQUIPS everything else (complete-look semantics, same as outfit presets);
 *   · reports unresolvable references as `missing` (template survives item deletion).
 *
 * Unlike player outfits this writes directly (after a confirm) — the §14.5 spec is
 * one-click prep, not preview. `planQuickDress` is PURE (decomposed inputs, returns
 * the plan); `applyQuickDress` is the thin async executor (fromUuid + two batched
 * document calls).
 *
 * Spec: SC-Module-Architecture-Guide.md §14.5, §7.4, §21.5 (M6).
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { SETTINGS } from "../constants.mjs";
import { DataStore } from "../data/data-store.mjs";
import { snapshotOutfit } from "./outfits.mjs";

/**
 * Decide how a template lands on a target's items. Pure.
 *
 * @param {object[]} templateEntries  [{uuid, slot, name, img}]
 * @param {object[]} targetItems      the target actor's current items
 * @param {Map<string, object|null>} resolvedSources  uuid → source item doc (null if unresolvable)
 * @returns {{ reuse: object[], importItems: object[], unequip: object[], missing: object[] }}
 *   reuse:       [{item, slot}] target items to equip as-is
 *   importItems: [{source, slot, name}] source docs to copy onto the target, equipped
 *   unequip:     [item] target clothing currently equipped but not part of the look
 *   missing:     [{uuid, slot, name}] entries that resolve nowhere
 */
export function planQuickDress(templateEntries, targetItems, resolvedSources) {
  const reuse = [];
  const importItems = [];
  const missing = [];
  const clothes = targetItems.filter((i) => i.type === cpr.ITEM_TYPE.CLOTHING);
  const claimed = new Set(); // a target item satisfies at most one entry

  for (const entry of templateEntries ?? []) {
    const owned = clothes.find(
      (i) => !claimed.has(i.id) && i.name === entry.name && cpr.getClothingSlot(i) === entry.slot
    );
    if (owned) {
      claimed.add(owned.id);
      reuse.push({ item: owned, slot: entry.slot });
      continue;
    }
    const source = resolvedSources.get(entry.uuid) ?? null;
    if (source) importItems.push({ source, slot: entry.slot, name: entry.name });
    else missing.push({ uuid: entry.uuid, slot: entry.slot, name: entry.name });
  }

  // Complete look: anything equipped that isn't part of the new look comes off.
  const unequip = clothes.filter((i) => cpr.isEquipped(i) && !claimed.has(i.id));

  return { reuse, importItems, unequip, missing };
}

/** Equip/unequip update records for the plan's reuse + unequip sets. */
export function planUpdateRecords(plan) {
  return [
    ...plan.reuse.filter(({ item }) => !cpr.isEquipped(item)).map(({ item }) => cpr.equipUpdateRecord(item, cpr.EQUIP.EQUIPPED)),
    ...plan.unequip.map((item) => cpr.equipUpdateRecord(item, cpr.EQUIP.OWNED)),
  ];
}

/**
 * Apply a template to an actor: resolve sources, plan, then ONE create batch +
 * ONE update batch. Returns the plan (for reporting).
 * @param {object} actor    target CPR actor
 * @param {object} template { id, name, items: [{uuid, slot, name}] }
 */
export async function applyQuickDress(actor, template) {
  const resolved = new Map();
  for (const entry of template?.items ?? []) {
    if (!resolved.has(entry.uuid)) resolved.set(entry.uuid, await fromUuid(entry.uuid).catch(() => null));
  }

  const plan = planQuickDress(template?.items ?? [], cpr.getItems(actor), resolved);

  const createData = plan.importItems.map(({ source }) => {
    const data = source.toObject();
    delete data._id;
    data.system = { ...data.system, equipped: cpr.EQUIP.EQUIPPED };
    return data;
  });
  if (createData.length) await actor.createEmbeddedDocuments("Item", createData);

  const updates = planUpdateRecords(plan);
  if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);

  return plan;
}

// ── template registry (world setting) ────────────────────────────────────────

/** All saved quick-dress templates. */
export function getStyleTemplates() {
  return DataStore.get(SETTINGS.CONFIG_STYLE_TEMPLATES)?.templates ?? [];
}

/** Persist the full template list (array replaces wholesale — write-safe). */
export function setStyleTemplates(templates) {
  return DataStore.set(SETTINGS.CONFIG_STYLE_TEMPLATES, { templates });
}

/**
 * Snapshot an item list's equipped clothing into template entries (uuid-based).
 * `items` may be a STAGED view (shims carry no document uuid) — pass `realItems`
 * so the uuid comes from the actual document. Embedded sources keep working
 * same-world; compendium refs become the portable path once catalog packs land (M8).
 */
export function snapshotTemplateEntries(items, realItems = items) {
  const byId = new Map(realItems.map((i) => [i.id, i]));
  return snapshotOutfit(items).map((e) => {
    const real = byId.get(e.itemId);
    return { uuid: real?.uuid ?? e.itemId, slot: e.slot, name: e.name, img: real?.img ?? null };
  });
}
