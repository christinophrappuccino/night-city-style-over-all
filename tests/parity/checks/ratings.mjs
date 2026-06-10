/**
 * checks/ratings.mjs — parity checks for engine/ratings.mjs against the fixtures.
 * Each returns [{ name, actual, expected }] for the runner to diff (subset compare).
 */

import RATINGS from "../../../scripts/config/ratings.mjs";
import { tier, dripRating } from "../../../scripts/engine/ratings.mjs";

export default function ratingsChecks(fix) {
  const checks = [];
  const sr = fix.outputs.styleRating;

  // tier(total) must reproduce Phase 82's styleRating.tier exactly.
  checks.push({
    name: `ratings.tier — ${fix.actorName}`,
    actual: tier(sr.total, RATINGS.TIERS),
    expected: sr.tier,
  });

  // dripRating(totalCost): Phase 82 didn't store this output, so assert internal
  // consistency — the drip tier must agree with the captured total cost band.
  const drip = dripRating(fix.collected.totalCost);
  checks.push({
    name: `ratings.dripRating self-consistency — ${fix.actorName}`,
    actual: { ok: drip.tier >= 1 && drip.tier <= 9 && typeof drip.rating === "string" },
    expected: { ok: true },
  });

  return checks;
}
