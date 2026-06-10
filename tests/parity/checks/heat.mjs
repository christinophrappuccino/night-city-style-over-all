/**
 * checks/heat.mjs — parity for engine/heat.mjs (heatIndex, ammoHeat).
 */

import FACTIONS from "../../../scripts/config/factions.mjs";
import { heatIndex, ammoHeat } from "../../../scripts/engine/heat.mjs";

export default function heatChecks(fix) {
  const checks = [];
  const h = fix.inputs.heat;

  // ammoHeat from the collected threat-ammo set must match the captured value.
  checks.push({
    name: `heat.ammoHeat — ${fix.actorName}`,
    actual: ammoHeat(fix.collected.threatAmmo),
    expected: h.ammoHeat,
  });

  // Full heat index from the exact captured inputs.
  const got = heatIndex({
    styleScore: fix.inputs.scene.yourStyleScore,
    sceneAvg: fix.inputs.scene.averageStyleScore,
    weaponsEquipped: fix.inputs.counts.weaponsEquipped,
    chromePercent: fix.inputs.chromePercent,
    armorEquipped: fix.inputs.counts.armorEquipped,
    socialStats: fix.inputs.socialStats,
    roleData: fix.inputs.roleData,
    roleProfiles: FACTIONS.ROLE_PROFILES,
    scMods: h.scMods,
    ammoHeat: h.ammoHeat,
    drawnWeapons: h.drawnWeapons,
  });

  // The app post-processes the tooltip to annotate concealed ordnance (macro
  // initialize() lines 12341–12347) — a presentation concern outside the engine.
  // Compare the tooltip only when the app left it untouched; always compare numbers.
  const hasConcealedOrdnance = (fix.collected.threatAmmo?.concealed?.length ?? 0) > 0;
  const expected = { ...fix.outputs.heatIndex };
  if (hasConcealedOrdnance) delete expected.tooltip;

  checks.push({ name: `heat.heatIndex — ${fix.actorName}`, actual: got, expected });

  return checks;
}
