/**
 * checks/recommendations.mjs — parity for engine/recommendations.mjs (optimizeBudget).
 *
 * Per-actor and golden: rebuilds the exact planner inputs (district + role/archetype
 * profiles, resolved from the captured keys) and diffs the full plan — allocations,
 * slotRecs (including the generated copy), totals, and cost summary.
 *
 * Dormant until the re-run lands fix.outputs.budgetPlan + fix.inputs.budgetMeta.
 */

import DISTRICTS from "../../../scripts/config/districts.mjs";
import FACTIONS from "../../../scripts/config/factions.mjs";
import { optimizeBudget } from "../../../scripts/engine/recommendations.mjs";

export default function recommendationChecks(fix) {
  const plan = fix.outputs.budgetPlan;
  const meta = fix.inputs.budgetMeta;
  if (!plan || !meta) return []; // pre-re-run fixture

  const roleProfile = meta.roleKey ? FACTIONS.ROLE_PROFILES[meta.roleKey] || null : null;
  const targetArch = meta.archKey ? FACTIONS.FACTION_ARCHETYPES[meta.archKey] || null : null;
  const districtData = DISTRICTS[meta.districtKey];

  const checks = [];
  for (const b of meta.budgets || []) {
    checks.push({
      name: `recommendations.optimizeBudget €$${b} @${meta.districtKey} — ${fix.actorName}`,
      actual: optimizeBudget({
        budget: b, districtData, roleProfile, rank: meta.rank || 0, targetArch, collected: fix.collected,
      }),
      expected: plan[b],
    });
  }
  return checks;
}
