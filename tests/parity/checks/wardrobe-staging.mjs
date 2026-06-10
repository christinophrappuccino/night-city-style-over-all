/**
 * checks/wardrobe-staging.mjs — M6 stage/commit model (aggregate; fixture-independent).
 *
 * Verifies services/wardrobe-staging.mjs:
 *  1. buildStagedItems — staged occupant equips, displaced occupant returns to the
 *     closet, real mock documents are never mutated;
 *  2. staged-empty (null) unequips the slot in the preview;
 *  3. normalizeStaged — no-op stages (current occupant / already-empty slot) drop;
 *  4. buildCommitUpdates — minimal batched records, none for no-ops;
 *  5. THE invariant: preview ≡ commit — computeActorReads on the staged list equals
 *     computeActorReads on an actor whose items really are in the committed state.
 */

import { normalizeStaged, buildStagedItems, buildCommitUpdates } from "../../../scripts/services/wardrobe-staging.mjs";
import { computeActorReads } from "../../../scripts/services/style-reads.mjs";

// ── mocks ────────────────────────────────────────────────────────────────────

const clothing = (id, { slot = "jacket", equipped = "owned", style = "genericChic", price = 100, flags = {} } = {}) => ({
  id, name: id, type: "clothing", img: null, effects: [],
  flags,
  system: { equipped, type: slot, style, price: { market: price } },
});
const skill = (n, lvl) => ({ id: n, type: "skill", name: n, system: { level: lvl }, effects: [], flags: {} });

const mockActor = (items) => ({
  id: "a1", name: "Mock", type: "character",
  system: {
    stats: { cool: { value: 6 }, int: { value: 5 }, emp: { value: 5, max: 7 } },
    reputation: { value: 2 },
    derivedStats: { hp: { value: 20, max: 20 }, humanity: { value: 60, max: 70 } },
  },
  items, effects: [],
});

/** The read fields the preview/commit identity is judged on. */
const readCore = (r) => ({
  style: r.styleRating.total,
  cohesion: r.cohesion.percent,
  heat: r.heat.value,
  danger: r.danger.value,
  topArch: r.archetypes[0]?.key ?? null,
  totalCost: r.collected.totalCost,
  scMods: r.scMods.hasModifiers,
});

export default function wardrobeStagingChecks() {
  const checks = [];

  const j1 = clothing("j1", { slot: "jacket", equipped: "equipped", style: "genericChic", price: 100 });
  const j2 = clothing("j2", {
    slot: "jacket", equipped: "owned", style: "asiaPop", price: 2000,
    flags: { "night-city-style-over-all": { styleData: { faction: { tyger_claws: 25 } } } },
  });
  const top1 = clothing("top1", { slot: "top", equipped: "equipped", style: "urbanFlash", price: 50 });
  const ws = skill("Wardrobe & Style", 4);
  const items = [j1, j2, top1, ws];

  // 1 — staged swap: j2 in, j1 out; untouched items pass through by reference.
  const staged = buildStagedItems(items, { jacket: "j2" });
  const stateOf = (list, id) => list.find((i) => i.id === id)?.system?.equipped;
  checks.push({
    name: "wardrobe.buildStagedItems — swap equips staged, displaces occupant, mutates nothing",
    actual: {
      stagedJ2: stateOf(staged, "j2"),
      stagedJ1: stateOf(staged, "j1"),
      topUntouchedRef: staged.find((i) => i.id === "top1") === top1,
      realJ1: j1.system.equipped,
      realJ2: j2.system.equipped,
    },
    expected: { stagedJ2: "equipped", stagedJ1: "owned", topUntouchedRef: true, realJ1: "equipped", realJ2: "owned" },
  });

  // 2 — staged-empty unequips the slot in the preview.
  const bare = buildStagedItems(items, { top: null });
  checks.push({
    name: "wardrobe.buildStagedItems — staged-empty slot",
    actual: { top1: stateOf(bare, "top1"), j1: stateOf(bare, "j1") },
    expected: { top1: "owned", j1: "equipped" },
  });

  // 3 — normalizeStaged drops no-ops, keeps real stages.
  checks.push({
    name: "wardrobe.normalizeStaged — no-op stages drop",
    actual: normalizeStaged(items, { jacket: "j1", top: "top1", hats: null, bottoms: null, footwear: "j2" }),
    // jacket/top stage their current occupants → drop; hats/bottoms stage-empty already-empty slots → drop;
    // footwear keeps its (odd, but explicit) stage.
    expected: { footwear: "j2" },
  });

  // 4 — commit payload: minimal records, no-ops emit none.
  checks.push({
    name: "wardrobe.buildCommitUpdates — batched minimal records",
    actual: buildCommitUpdates(items, { jacket: "j2", top: null }),
    expected: [
      { _id: "j1", "system.equipped": "owned" },
      { _id: "j2", "system.equipped": "equipped" },
      { _id: "top1", "system.equipped": "owned" },
    ],
  });
  checks.push({
    name: "wardrobe.buildCommitUpdates — no-op stage emits nothing",
    actual: buildCommitUpdates(items, { jacket: "j1" }),
    expected: [],
  });

  // 5 — preview ≡ commit: reads from the staged list match reads from an actor
  //     whose items genuinely are in the committed state.
  const previewReads = computeActorReads(mockActor(items), { items: buildStagedItems(items, { jacket: "j2" }) });
  const committedItems = [
    clothing("j1", { slot: "jacket", equipped: "owned", style: "genericChic", price: 100 }),
    clothing("j2", {
      slot: "jacket", equipped: "equipped", style: "asiaPop", price: 2000,
      flags: { "night-city-style-over-all": { styleData: { faction: { tyger_claws: 25 } } } },
    }),
    clothing("top1", { slot: "top", equipped: "equipped", style: "urbanFlash", price: 50 }),
    skill("Wardrobe & Style", 4),
  ];
  const committedReads = computeActorReads(mockActor(committedItems));
  checks.push({
    name: "wardrobe.preview ≡ commit — staged reads match really-committed reads",
    actual: readCore(previewReads),
    expected: readCore(committedReads),
  });

  return checks;
}
