/**
 * checks/overrides.mjs — M9.3c: GM read overrides (§14.3) (aggregate;
 * fixture-independent).
 *
 * NEW work (no macro reference — designed from §14.3). Verifies the PURE
 * application in engine/overrides.mjs:
 *  1. no record → reads pass through UNTOUCHED (same references);
 *  2. archetype pin — pinned entry leads at confidence 100, label from the
 *     defs, the same key deduped from the computed tail, `pinned` flagged;
 *  3. heat offset — value shifts, band RE-WORDS from the live dials, the
 *     "GM override" component is appended (the §19 breakdown shows the hand);
 *  4. heat force — clamped to 0–100, `overridden` flagged;
 *  5. heatLevel — band words from tunables.heat.levels;
 *  6. hasAnyOverride — empty/sparse records.
 *
 * The disguise/brandTier pins are consumed at their surfaces (observer lens,
 * GM disguise detector) — service-side glue, in-world checks.
 */

import { applyReadOverrides, hasAnyOverride } from "../../../scripts/engine/overrides.mjs";
import { heatLevel } from "../../../scripts/engine/heat.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";

export default function overrideChecks() {
  const checks = [];
  const T = TUNABLES_DEFAULTS;

  const archetypes = [
    { key: "rockerboy", label: "Rockerboy", confidence: 62 },
    { key: "corpo", label: "Corpo", confidence: 41 },
  ];
  const heat = {
    value: 30, level: "WARM", label: "Heat 30 — WARM", blurb: "",
    components: [{ term: "weapons", value: 30, source: "" }],
    tunablesApplied: {},
  };
  const archetypeDefs = { corpo: { label: "Corpo" }, fixer: { label: "Fixer" } };

  // 1 — no record: untouched, same references.
  const none = applyReadOverrides({ archetypes, heat }, null, { archetypeDefs, tunables: T });
  checks.push({
    name: "overrides — no record: reads pass through by reference",
    actual: { sameArch: none.archetypes === archetypes, sameHeat: none.heat === heat },
    expected: { sameArch: true, sameHeat: true },
  });

  // 2 — archetype pin: leads at 100, deduped, labeled from defs, flagged.
  const pinnedArch = applyReadOverrides({ archetypes, heat }, { archetype: "corpo" }, { archetypeDefs, tunables: T });
  checks.push({
    name: "overrides — archetype pin leads at 100, dedupes the computed entry, flags `pinned`",
    actual: {
      keys: pinnedArch.archetypes.map((a) => a.key),
      top: { label: pinnedArch.archetypes[0].label, confidence: pinnedArch.archetypes[0].confidence, pinned: pinnedArch.archetypes[0].pinned },
      heatUntouched: pinnedArch.heat === heat,
    },
    expected: {
      keys: ["corpo", "rockerboy"],
      top: { label: "Corpo", confidence: 100, pinned: true },
      heatUntouched: true,
    },
  });

  // 3 — heat offset: 30 + 25 = 55 → HOT; override component appended.
  const offset = applyReadOverrides({ archetypes, heat }, { heat: { mode: "offset", value: 25 } }, { archetypeDefs, tunables: T });
  checks.push({
    name: "overrides — heat offset shifts the value, re-bands from the dials, appends the GM component",
    actual: {
      value: offset.heat.value, level: offset.heat.level, overridden: offset.heat.overridden,
      lastComponent: { term: offset.heat.components.at(-1).term, value: offset.heat.components.at(-1).value },
      archUntouched: offset.archetypes === archetypes,
    },
    expected: {
      value: 55, level: "HOT", overridden: true,
      lastComponent: { term: "GM override", value: 25 },
      archUntouched: true,
    },
  });

  // 4 — heat force: clamped to the 0–100 scale.
  const forced = applyReadOverrides({ archetypes, heat }, { heat: { mode: "force", value: 120 } }, { archetypeDefs, tunables: T });
  checks.push({
    name: "overrides — heat force clamps to 100 and wears the right band",
    actual: { value: forced.heat.value, level: forced.heat.level, overridden: forced.heat.overridden },
    expected: { value: 100, level: "BLAZING", overridden: true },
  });

  // 5 — heatLevel band words ride tunables.heat.levels.
  checks.push({
    name: "overrides — heatLevel bands from the live dials",
    actual: [heatLevel(0, T), heatLevel(T.heat.levels.warm, T), heatLevel(T.heat.levels.hot, T), heatLevel(T.heat.levels.blazing, T)],
    expected: ["COLD", "WARM", "HOT", "BLAZING"],
  });

  // 6 — hasAnyOverride.
  checks.push({
    name: "overrides — hasAnyOverride: empty no, any single pin yes",
    actual: [hasAnyOverride(null), hasAnyOverride({}), hasAnyOverride({ disguise: "holds" }), hasAnyOverride({ brandTier: "luxury" })],
    expected: [false, false, true, true],
  });

  return checks;
}
