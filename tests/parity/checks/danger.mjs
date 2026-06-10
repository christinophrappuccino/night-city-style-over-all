/**
 * checks/danger.mjs — parity for engine/danger.mjs (dangerScore).
 */

import FACTIONS from "../../../scripts/config/factions.mjs";
import { dangerScore } from "../../../scripts/engine/danger.mjs";

export default function dangerChecks(fix) {
  // criticalInjuries were captured as names; map to injury objects (all empty for
  // the current test actors — the injury branch is exercised when one has injuries).
  const criticalInjuries = (fix.inputs.criticalInjuries || []).map((name) => ({ name }));

  return [
    {
      name: `danger.dangerScore — ${fix.actorName}`,
      actual: dangerScore({
        actorSystem: fix.inputs.actorSystem,
        criticalInjuries,
        weaponsData: fix.collected.weapons.equipped,
        armorCount: fix.inputs.counts.armorEquipped,
        cyberwareData: fix.inputs.cyberwareData,
        socialStats: fix.inputs.socialStats,
        roleData: fix.inputs.roleData,
        roleProfiles: FACTIONS.ROLE_PROFILES,
        ammoHeat: fix.inputs.heat.ammoHeat,
      }),
      expected: fix.outputs.dangerResult,
    },
  ];
}
