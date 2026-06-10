/**
 * checks/districts.mjs — parity for engine/districts.mjs.
 * threatTolerance is a pure lookup (synthetic, always runs); districtFactionDanger
 * is golden and skips until fixtures carry outputs.districtDanger (the re-run).
 */

import DISTRICTS from "../../../scripts/config/districts.mjs";
import FACTIONS from "../../../scripts/config/factions.mjs";
import { threatTolerance, districtFactionDanger } from "../../../scripts/engine/districts.mjs";

export default function districtChecks(fix) {
  const checks = [];

  // Synthetic: threat tolerance lookup (deterministic table).
  checks.push({
    name: `districts.threatTolerance corpo+fallback — ${fix.actorName}`,
    actual: { corpoStart: threatTolerance("corpo").chromePenaltyStart, unknownFallsToMixed: threatTolerance("nope").chromePenaltyStart },
    expected: { corpoStart: 20, unknownFallsToMixed: 40 },
  });

  // Golden: district faction danger (needs the re-run fields).
  const dd = fix.outputs.districtDanger;
  if (dd) {
    for (const districtKey of fix.inputs.districtKeys || []) {
      checks.push({
        name: `districts.districtFactionDanger ${districtKey} — ${fix.actorName}`,
        actual: districtFactionDanger({
          playerArchetypeKey: fix.inputs.topArchetypeKey,
          district: DISTRICTS[districtKey],
          factions: FACTIONS.FACTIONS,
          roleData: fix.inputs.roleData,
          roleProfiles: FACTIONS.ROLE_PROFILES,
        }),
        expected: dd[districtKey],
      });
    }
  }

  return checks;
}
