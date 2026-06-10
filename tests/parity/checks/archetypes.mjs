/**
 * checks/archetypes.mjs — parity for engine/archetypes.mjs (detectAllArchetypes).
 *
 * Uses the BASE scMods (fix.inputs.scMods) — the variant initialize() feeds
 * detectAllArchetypes (no wound/injury heat; that's heat-only).
 */

import FACTIONS from "../../../scripts/config/factions.mjs";
import { detectAllArchetypes, detectChromeProfile } from "../../../scripts/engine/archetypes.mjs";

export default function archetypeChecks(fix) {
  return [
    {
      name: `archetypes.detectAllArchetypes — ${fix.actorName}`,
      actual: detectAllArchetypes({
        collected: fix.collected,
        cyberwareData: fix.inputs.cyberwareData,
        archetypes: FACTIONS.FACTION_ARCHETYPES,
        socialStats: fix.inputs.socialStats,
        roleData: fix.inputs.roleData,
        roleProfiles: FACTIONS.ROLE_PROFILES,
        scMods: fix.inputs.scMods,
      }),
      expected: fix.outputs.allArchetypes,
    },
    {
      name: `archetypes.detectChromeProfile — ${fix.actorName}`,
      actual: detectChromeProfile(fix.inputs.cyberwareData, FACTIONS.FACTION_ARCHETYPES),
      expected: fix.outputs.chromeProfile,
    },
  ];
}
