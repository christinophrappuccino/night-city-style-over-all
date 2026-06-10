/**
 * checks/trends.mjs — M7.7 fashion-trend math (aggregate; fixture-independent).
 *
 * Verifies services/trends.mjs pure core:
 *  1. trendMultiplier — inactive trends ignored, unknown styles ×1, multiple
 *     active trends MULTIPLY, hot/cold both apply;
 *  2. describeTrend — human summary;
 *  3. activeTrends — filter.
 */

import { trendMultiplier, activeTrends, describeTrend } from "../../../scripts/services/trends.mjs";

export default function trendChecks() {
  const checks = [];

  const TRENDS = [
    { id: "a", name: "Kabuki Glam", active: true, styles: { asiaPop: 1.25, businesswear: 0.8 } },
    { id: "b", name: "Silk Shortage", active: true, styles: { asiaPop: 1.1 } },
    { id: "c", name: "Last Season", active: false, styles: { asiaPop: 99 } }, // inactive — must not apply
  ];

  checks.push({
    name: "trends.trendMultiplier — stacking, cold, unknown, inactive, null",
    actual: {
      hotStacked: trendMultiplier("asiaPop", TRENDS),        // 1.25 × 1.1
      cold: trendMultiplier("businesswear", TRENDS),
      unknown: trendMultiplier("nomadLeathers", TRENDS),
      noStyle: trendMultiplier(null, TRENDS),
      noTrends: trendMultiplier("asiaPop", []),
    },
    expected: { hotStacked: 1.375, cold: 0.8, unknown: 1, noStyle: 1, noTrends: 1 },
  });

  checks.push({
    name: "trends.activeTrends + describeTrend",
    actual: {
      activeIds: activeTrends(TRENDS).map((t) => t.id),
      desc: describeTrend(TRENDS[0]),
    },
    expected: {
      activeIds: ["a", "b"],
      desc: "Asia Pop ×1.25 · Businesswear ×0.8",
    },
  });

  return checks;
}
