/**
 * checks/quick-dress.mjs — M6.4 NPC quick-dress planner (aggregate; fixture-independent).
 *
 * Verifies services/quick-dress.mjs (the pure parts):
 *  1. planQuickDress — reuses owned same-name+slot pieces (no duplicate imports on
 *     repeat dressing), imports resolvable sources, reports unresolvable as missing,
 *     unequips the rest (complete look), and never double-claims one owned item;
 *  2. planUpdateRecords — equips only not-yet-equipped reuses, unequips the rest;
 *  3. snapshotTemplateEntries — staged-view snapshot pulls uuid/img from the REAL docs.
 */

import { planQuickDress, planUpdateRecords, snapshotTemplateEntries } from "../../../scripts/services/quick-dress.mjs";
import { buildStagedItems } from "../../../scripts/services/wardrobe-staging.mjs";

const clothing = (id, name, slot, equipped, extra = {}) => ({
  id, name, type: "clothing", img: extra.img ?? null, uuid: extra.uuid, effects: [], flags: {},
  system: { equipped, type: slot, style: "genericChic", price: { market: 100 } },
});

export default function quickDressChecks() {
  const checks = [];

  // Target NPC: owns the jacket the template wants (unequipped), wears a hat the
  // template doesn't include, owns an unrelated top.
  const targetJacket = clothing("tj", "Tyger Jacket", "jacket", "owned");
  const targetHat = clothing("th", "Old Hat", "hats", "equipped");
  const targetTop = clothing("tt", "Plain Top", "top", "owned");
  const target = [targetJacket, targetHat, targetTop];

  const TEMPLATE = [
    { uuid: "World.Item.jacket", slot: "jacket", name: "Tyger Jacket" },   // owned → reuse
    { uuid: "World.Item.pants", slot: "bottoms", name: "Tyger Pants" },    // unowned, resolves → import
    { uuid: "World.Item.gone", slot: "glasses", name: "Lost Shades" },     // unresolvable → missing
  ];
  const sourcePants = clothing("sp", "Tyger Pants", "bottoms", "owned");
  const resolved = new Map([
    ["World.Item.jacket", clothing("sj", "Tyger Jacket", "jacket", "owned")],
    ["World.Item.pants", sourcePants],
    ["World.Item.gone", null],
  ]);

  const plan = planQuickDress(TEMPLATE, target, resolved);
  checks.push({
    name: "quick-dress.planQuickDress — reuse/import/missing/unequip",
    actual: {
      reuse: plan.reuse.map((r) => r.item.id),
      importNames: plan.importItems.map((i) => i.name),
      missingNames: plan.missing.map((m) => m.name),
      unequip: plan.unequip.map((i) => i.id),
    },
    expected: {
      reuse: ["tj"],              // owned jacket reused — NOT imported again
      importNames: ["Tyger Pants"],
      missingNames: ["Lost Shades"],
      unequip: ["th"],            // the old hat comes off; unequipped top untouched
    },
  });

  // 2 — update records: equip the reused jacket (it was owned), unequip the hat.
  checks.push({
    name: "quick-dress.planUpdateRecords — minimal equip/unequip batch",
    actual: planUpdateRecords(plan),
    expected: [
      { _id: "tj", "system.equipped": "equipped" },
      { _id: "th", "system.equipped": "owned" },
    ],
  });

  // 2b — a reused piece that is ALREADY equipped emits no record.
  const wornTarget = [clothing("tj2", "Tyger Jacket", "jacket", "equipped")];
  const plan2 = planQuickDress([TEMPLATE[0]], wornTarget, resolved);
  checks.push({
    name: "quick-dress.planUpdateRecords — already-dressed NPC is a no-op",
    actual: planUpdateRecords(plan2),
    expected: [],
  });

  // 3 — staged-view snapshot resolves uuid/img from the real documents.
  const realItems = [
    clothing("a", "Kabuki Coat", "jacket", "owned", { uuid: "Actor.x.Item.a", img: "coat.png" }),
    clothing("b", "Worn Boots", "footwear", "equipped", { uuid: "Actor.x.Item.b", img: "boots.png" }),
  ];
  const stagedView = buildStagedItems(realItems, { jacket: "a", footwear: null });
  checks.push({
    name: "quick-dress.snapshotTemplateEntries — staged view, real uuids",
    actual: snapshotTemplateEntries(stagedView, realItems),
    expected: [{ uuid: "Actor.x.Item.a", slot: "jacket", name: "Kabuki Coat", img: "coat.png" }],
  });

  return checks;
}
