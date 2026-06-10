/**
 * checks/disguise.mjs — parity for engine/disguise.mjs (confidence + dc),
 * across the 4 target factions captured per actor (nccs, militech, arasaka, biotechnica).
 */

import FACTIONS from "../../../scripts/config/factions.mjs";
import { confidence, dc } from "../../../scripts/engine/disguise.mjs";

export default function disguiseChecks(fix) {
  const checks = [];
  for (const [factionKey, expected] of Object.entries(fix.outputs.disguise)) {
    const got = confidence({
      collected: fix.collected,
      cyberwareData: fix.inputs.cyberwareData,
      targetFactionKey: factionKey,
      factions: FACTIONS.FACTIONS,
      archetypes: FACTIONS.FACTION_ARCHETYPES,
    });
    checks.push({ name: `disguise.confidence ${factionKey} — ${fix.actorName}`, actual: got, expected: expected.confidence });
    checks.push({
      name: `disguise.dc ${factionKey} — ${fix.actorName}`,
      actual: dc(got.confidence, fix.inputs.socialStats),
      expected: expected.dc,
    });
  }
  return checks;
}
