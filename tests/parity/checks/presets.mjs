/**
 * checks/presets.mjs — M9.4a: scoring presets (§18.4 D6=B) + the full-panel
 * helpers (aggregate; fixture-independent).
 *
 * NEW work (no macro reference). Presets are tier-2 VALUE bundles only; these
 * checks pin:
 *  1. validity — every preset overlay path resolves to a numeric tunable and
 *     differs from its default (a typo'd path or no-op value fails loudly);
 *  2. matchPreset derivation — empty overlay = phase82; an exact preset copy
 *     names the preset; any edit forks to custom (null);
 *  3. flattenTunables — numeric leaves only, arrays are structural (nothing
 *     under ratings.dripTiers), and the inventory is genuinely FULL;
 *  4. mergeKnobEdits — saving from a partial view PRESERVES unrendered preset
 *     overrides, removes returned-to-default paths (prunes empty branches),
 *     and never mutates its input. (The pre-M9.4 _saveTuning rebuilt the
 *     overlay from rendered inputs only — a preset-wiping bug.)
 */

import {
  SCORING_PRESETS,
  matchPreset,
  flattenTunables,
  mergeKnobEdits,
  validatePresets,
  getByPath,
} from "../../../scripts/config/presets.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";

export default function presetChecks() {
  const checks = [];

  // 1 — every preset path is a real numeric tunable with a non-default value.
  checks.push({
    name: "presets.validate — all overlay paths real, numeric, non-default",
    actual: { problems: validatePresets(TUNABLES_DEFAULTS), count: SCORING_PRESETS.length },
    expected: { problems: [], count: 4 },
  });

  // 2 — derivation: empty = phase82; exact copy = the preset; any edit = custom.
  const strict = SCORING_PRESETS.find((p) => p.key === "strict");
  const forked = JSON.parse(JSON.stringify(strict.overlay));
  forked.heat.levels.warm = 21; // one dial off the preset
  checks.push({
    name: "presets.match — empty→phase82, exact→named, edited→custom",
    actual: {
      empty: matchPreset({}),
      nullish: matchPreset(null),
      exact: matchPreset(JSON.parse(JSON.stringify(strict.overlay))),
      forked: matchPreset(forked),
    },
    expected: { empty: "phase82", nullish: "phase82", exact: "strict", forked: null },
  });

  // 3 — the full-panel inventory: numeric leaves only, arrays skipped, genuinely full.
  const flat = flattenTunables(TUNABLES_DEFAULTS);
  checks.push({
    name: "presets.flatten — numeric-only, arrays structural, full coverage",
    actual: {
      bigEnough: flat.length > 150,
      allNumbers: flat.every((k) => typeof k.value === "number"),
      noArrayInnards: !flat.some((k) => k.path.startsWith("ratings.dripTiers") || k.path.startsWith("archetypes.dominance")),
      spotCheck: flat.find((k) => k.path === "heat.levels.warm")?.value,
    },
    expected: { bigEnough: true, allNumbers: true, noArrayInnards: true, spotCheck: 25 },
  });

  // 4 — merge semantics: a save from the Common view must not wipe a preset.
  const before = JSON.parse(JSON.stringify(strict.overlay));
  const merged = mergeKnobEdits(
    before,
    [
      { path: "heat.levels.warm", value: 22 },          // edit a preset dial
      { path: "danger.tiers.moderate", value: 30 },     // return one to its default → drop
      { path: "crew.synergy.labels.tight", value: 60 }, // untouched default stays absent
    ],
    TUNABLES_DEFAULTS
  );
  checks.push({
    name: "presets.merge — preserves unrendered overrides, drops at-default, immutably",
    actual: {
      editApplied: getByPath(merged, "heat.levels.warm"),
      unrenderedSurvives: getByPath(merged, "recognition.bar.known"), // strict sets 3; not in the edit set
      returnedDropped: getByPath(merged, "danger.tiers.moderate"),
      atDefaultAbsent: getByPath(merged, "crew.synergy.labels.tight"),
      inputUntouched: getByPath(before, "heat.levels.warm"),
    },
    expected: {
      editApplied: 22,
      unrenderedSurvives: 3,
      returnedDropped: undefined,
      atDefaultAbsent: undefined,
      inputUntouched: 20,
    },
  });

  // 4b — pruning: removing the only override in a branch removes the branch.
  const pruned = mergeKnobEdits(
    { formality: { disguise: { penaltyPerStep: 16 } } },
    [{ path: "formality.disguise.penaltyPerStep", value: 12 }], // back to default
    TUNABLES_DEFAULTS
  );
  checks.push({
    name: "presets.merge — empty branches pruned after a return-to-default",
    actual: { keys: Object.keys(pruned) },
    expected: { keys: [] },
  });

  return checks;
}
