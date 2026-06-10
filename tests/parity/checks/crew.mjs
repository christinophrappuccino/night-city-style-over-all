/**
 * checks/crew.mjs — parity for engine/crew.mjs (analyzeCrew).
 *
 * AGGREGATE check: it needs the whole fixture set, not one actor, so run.mjs invokes
 * it once with the full payload (see AGGREGATE_MODULES there). The crew = every
 * captured actor; the engine result is compared field-by-field against the captured
 * CrewAnalyzer.analyze() output at `data.crewAnalysis`.
 *
 * Dormant until the comprehensive re-run lands `data.crewAnalysis` (the owed capture —
 * see the capture macro's crew block). Returns [] before then so parity stays green.
 */

import FACTIONS from "../../../scripts/config/factions.mjs";
import { analyzeCrew } from "../../../scripts/engine/crew.mjs";

/** Rebuild one crew member's decomposed input from a per-actor fixture. `imgById`
 *  supplies the actor img (an integration-layer pass-through the collected set
 *  doesn't carry) sourced from the golden's member identity fields. */
function memberFromFixture(fix, imgById) {
  return {
    name: fix.actorName,
    img: imgById.get(fix.actorId) ?? null,
    tokenId: null,
    collected: fix.collected,
    cyberwareData: fix.inputs.cyberwareData,
    styleRating: fix.outputs.styleRating,
    cohesion: fix.outputs.cohesion,
    archetypes: fix.outputs.allArchetypes,
    actorSystem: fix.inputs.actorSystem,
    // captured as names; danger.dangerScore reads ci.name.
    criticalInjuries: (fix.inputs.criticalInjuries || []).map((name) => ({ name })),
  };
}

/** Project a member to the scalar fields crew.mjs is responsible for deriving. */
function memberScalars(m) {
  return {
    name: m.name,
    styleScore: m.styleScore,
    chromeCount: m.chromeCount,
    chromePercent: m.chromePercent,
    weaponCount: m.weaponCount,
    drawnCount: m.drawnCount,
    armorCount: m.armorCount,
    clothingCost: m.clothingCost,
    styles: m.styles,
    topArch: { key: m.topArch?.key },
  };
}

export default function crewChecks(data) {
  const expected = data.crewAnalysis;
  if (!expected) return []; // pre-re-run fixture — dormant

  // Map actorId → img from the golden's member identity (pass-through display data).
  const imgById = new Map((expected.members || []).map((m) => [m.actor?.id ?? m.actorId, m.img]));
  const members = data.fixtures.map((fix) => memberFromFixture(fix, imgById));
  const got = analyzeCrew({ members, factionsConfig: FACTIONS });

  const checks = [];
  const aggregations = [
    "synergy", "roleCoverage", "actualRoleComposition", "styleCoherence",
    "crewHeat", "crewDanger", "weakestLink", "standout",
    "crewFactionProfile", "crewBudget", "chromeDisparity", "internalClashes",
    "crewReputation", "districtReadiness",
  ];
  for (const key of aggregations) {
    checks.push({ name: `crew.${key}`, actual: got[key], expected: expected[key] });
  }

  // Members: compare the derived scalars crew.mjs owns (the nested per-member
  // outputs — styleRating/cohesion/archetypes — are validated by their own checks).
  checks.push({
    name: "crew.members (derived scalars)",
    actual: (got.members || []).map(memberScalars),
    expected: (expected.members || []).map(memberScalars),
  });

  return checks;
}
