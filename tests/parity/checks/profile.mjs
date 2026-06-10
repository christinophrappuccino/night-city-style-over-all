/**
 * checks/profile.mjs — parity for engine/profile.mjs (fullRating, cohesion).
 */

import RATINGS from "../../../scripts/config/ratings.mjs";
import FACTIONS from "../../../scripts/config/factions.mjs";
import { fullRating, cohesion } from "../../../scripts/engine/profile.mjs";

/**
 * Phase 82's captured `collected` predates collect.mjs's lossless `equippedClothing`
 * list. Reconstruct it from `parts` (exact when no same-slot duplicates exist — the
 * native field rides the next capture). Use the captured list if already present.
 */
function withEquippedClothing(collected) {
  if (collected.equippedClothing) return collected;
  const equippedClothing = Object.entries(collected.parts)
    .filter(([, p]) => p.worn)
    .map(([slot, p]) => ({ id: p.id, name: p.name, slot, style: p.style, cost: p.cost }));
  return { ...collected, equippedClothing };
}

export default function profileChecks(fix) {
  const checks = [];
  const collected = withEquippedClothing(fix.collected);

  checks.push({
    name: `profile.fullRating — ${fix.actorName}`,
    actual: fullRating({
      collected,
      cyberwareData: fix.inputs.cyberwareData,
      socialStats: fix.inputs.socialStats,
      roleData: fix.inputs.roleData,
      formula: RATINGS.RATING_FORMULA,
      roleProfiles: FACTIONS.ROLE_PROFILES,
      tiers: RATINGS.TIERS,
    }),
    expected: fix.outputs.styleRating,
  });

  checks.push({
    name: `profile.cohesion — ${fix.actorName}`,
    actual: cohesion(collected, fix.inputs.socialStats),
    expected: fix.outputs.cohesion,
  });

  return checks;
}
