/**
 * checks/outfits.mjs — M6.3 outfit presets (aggregate; fixture-independent).
 *
 * Verifies services/outfits.mjs:
 *  1. snapshotOutfit captures exactly the equipped clothing of a (staged) view;
 *  2. outfitToStaged — complete-look semantics: preset items stage in, every
 *     other clothing slot stages EMPTY; missing items are reported, not staged;
 *  3. round trip: snapshot the current look → outfitToStaged → normalizeStaged
 *     is a NO-OP (wearing a saved outfit stages no changes);
 *  4. list helpers (add/remove/rename) are pure.
 */

import { snapshotOutfit, makePreset, outfitToStaged, addOutfit, removeOutfit, renameOutfit } from "../../../scripts/services/outfits.mjs";
import { normalizeStaged, buildStagedItems } from "../../../scripts/services/wardrobe-staging.mjs";

const clothing = (id, slot, equipped) => ({
  id, name: `Item ${id}`, type: "clothing", img: null, effects: [], flags: {},
  system: { equipped, type: slot, style: "genericChic", price: { market: 100 } },
});
const skill = (n) => ({ id: n, type: "skill", name: n, system: { level: 2 }, effects: [], flags: {} });

export default function outfitChecks() {
  const checks = [];

  const items = [
    clothing("j1", "jacket", "equipped"),
    clothing("j2", "jacket", "owned"),
    clothing("t1", "top", "equipped"),
    clothing("b1", "bottoms", "owned"),
    skill("Wardrobe & Style"),
  ];

  // 1 — snapshot captures the equipped clothing (and only that).
  checks.push({
    name: "outfits.snapshotOutfit — equipped clothing only",
    actual: snapshotOutfit(items),
    expected: [
      { itemId: "j1", slot: "jacket", name: "Item j1" },
      { itemId: "t1", slot: "top", name: "Item t1" },
    ],
  });

  // 1b — snapshot of a STAGED view follows the preview, not the documents.
  checks.push({
    name: "outfits.snapshotOutfit — staged view snapshots the preview",
    actual: snapshotOutfit(buildStagedItems(items, { jacket: "j2", top: null })),
    expected: [{ itemId: "j2", slot: "jacket", name: "Item j2" }],
  });

  // 2 — complete look: preset items in, every other slot staged empty; missing reported.
  const preset = makePreset({
    id: "o1", name: "Test Look",
    items: [
      { itemId: "j2", slot: "jacket", name: "Item j2" },
      { itemId: "b1", slot: "bottoms", name: "Item b1" },
      { itemId: "gone", slot: "hats", name: "Sold Hat" },
    ],
  });
  const resolved = outfitToStaged(preset, items);
  checks.push({
    name: "outfits.outfitToStaged — complete-look staging + missing report",
    actual: resolved,
    expected: {
      stagedBySlot: {
        top: null, bottoms: "b1", jacket: "j2", footwear: null, hats: null,
        glasses: null, mirrorshades: null, contactLenses: null, jewelry: null,
      },
      missing: [{ itemId: "gone", slot: "hats", name: "Sold Hat" }],
    },
  });

  // 3 — round trip: saving the current look and trying it on stages NOTHING.
  const saved = makePreset({ id: "o2", name: "As Worn", items: snapshotOutfit(items) });
  checks.push({
    name: "outfits.round trip — wearing a saved outfit is a no-op stage",
    actual: normalizeStaged(items, outfitToStaged(saved, items).stagedBySlot),
    expected: {},
  });

  // 4 — list helpers are pure and well-behaved.
  const list = addOutfit([], preset);
  checks.push({
    name: "outfits.list helpers — add/rename/remove",
    actual: {
      added: list.length,
      renamed: renameOutfit(list, "o1", "New Name")[0].name,
      originalUntouched: list[0].name,
      removed: removeOutfit(list, "o1").length,
    },
    expected: { added: 1, renamed: "New Name", originalUntouched: "Test Look", removed: 0 },
  });

  return checks;
}
