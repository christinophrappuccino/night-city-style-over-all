/**
 * checks/live-layer.mjs — M7.8 condition dynamics + M7.9 Known For (aggregate).
 *
 * Verifies the pure cores:
 *  1. conditionForHpPct / planConditionDegradation — thresholds, never-improve,
 *     equipped-clothing-only, flag-condition respected (dual-read);
 *  2. tallyRead — threshold sticks the reputation, cap halves the tally (so an
 *     old reputation can be outgrown), unknown archetypes ignored.
 */

import { conditionForHpPct, planConditionDegradation } from "../../../scripts/services/condition.mjs";
import { tallyRead } from "../../../scripts/services/known-for.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";

const T = TUNABLES_DEFAULTS;

const clothing = (id, equipped, condition) => ({
  id, name: id, type: "clothing", effects: [],
  flags: condition ? { "night-city-style-over-all": { styleData: { condition } } } : {},
  system: { equipped, type: "jacket", style: "genericChic", price: { market: 100 } },
});

export default function liveLayerChecks() {
  const checks = [];

  // 1 — thresholds.
  checks.push({
    name: "condition.conditionForHpPct — bands",
    actual: {
      healthy: conditionForHpPct(80, T),
      hurt: conditionForHpPct(50, T),
      bad: conditionForHpPct(25, T),
      worse: conditionForHpPct(10, T),
    },
    expected: { healthy: null, hurt: "worn", bad: "bloodied", worse: "bloodied" },
  });

  // 1b — the plan: only equipped clothing, never improves, respects authored state.
  const items = [
    clothing("fresh", "equipped", undefined),       // pristine → degrades
    clothing("alreadyWorn", "equipped", "worn"),    // worn → degrades only at bloodied
    clothing("ruined", "equipped", "bloodied"),     // can't get worse
    clothing("closeted", "owned", undefined),       // not worn → untouched
  ];
  const at50 = planConditionDegradation({ hpPct: 50, items, tunables: T });
  const at20 = planConditionDegradation({ hpPct: 20, items, tunables: T });
  checks.push({
    name: "condition.planConditionDegradation — equipped-only, never improves",
    actual: {
      at50: at50.map((p) => `${p.item.id}:${p.from}→${p.to}`),
      at20: at20.map((p) => `${p.item.id}:${p.from}→${p.to}`),
    },
    expected: {
      at50: ["fresh:pristine→worn"],
      at20: ["fresh:pristine→bloodied", "alreadyWorn:worn→bloodied"],
    },
  });

  // 2 — Known For tally: threshold sticks it; cap halves; unknown ignored.
  let rec = null;
  const gang = { key: "gang_organized", label: "Organized Gang" };
  for (let i = 0; i < T.knownFor.threshold; i++) rec = tallyRead(rec, gang, T);
  const stuck = { key: rec.key, count: rec.tally.gang_organized };

  rec = tallyRead(rec, { key: "unknown", label: "???" }, T); // ignored
  const afterUnknown = rec.tally.gang_organized;

  // run the tally to the cap → everything halves.
  let capped = null;
  for (let i = 0; i < T.knownFor.tallyCap + 1; i++) capped = tallyRead(capped, gang, T);
  checks.push({
    name: "known-for.tallyRead — threshold, unknown skip, rolling cap",
    actual: {
      stuckKey: stuck.key,
      stuckCount: stuck.count,
      afterUnknown,
      cappedCount: capped.tally.gang_organized,
      cappedStillKnown: capped.key,
    },
    expected: {
      stuckKey: "gang_organized",
      stuckCount: T.knownFor.threshold,
      afterUnknown: T.knownFor.threshold,
      cappedCount: Math.floor((T.knownFor.tallyCap + 1) / 2),
      cappedStillKnown: "gang_organized",
    },
  });

  return checks;
}
