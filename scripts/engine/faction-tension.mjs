/**
 * faction-tension.mjs — scene-level rival detection: which characters present read as
 * rival factions, plus per-PC district hostility.
 *
 * Pure; consumes per-token reads + optional district + the factions registry. Returns
 * the Phase 82 {tensions, warnings, district}. Severity bands + the faction-read
 * confidence floor come from Tunables (gm). District hostility reuses districts.mjs.
 *
 * Ports: GMDashboardApp.scanFactionTensions.
 * Spec: SC-Module-Architecture-Guide.md §29.1 (Stage 5), §4.1, §18
 */

import { getTunables } from "../config/tunables.mjs";
import { districtFactionDanger } from "./districts.mjs";

/** Faction keys an archetype read maps to, above the confidence floor. */
function factionKeysFor(archetypes, factions, floor) {
  const keys = new Set();
  archetypes.slice(0, 3).forEach((arch) => {
    if ((arch.confidence ?? 0) < floor) return;
    Object.entries(factions).forEach(([fKey, fData]) => { if (fData.archetype === arch.key) keys.add(fKey); });
  });
  return [...keys];
}

/**
 * @param {object} p
 * @param {object[]} p.tokens  per-token reads { name, img, isPC, topArch{key,label}, archetypes, roleData }
 * @param {object} [p.district] district config (for per-PC hostility); may be null
 * @param {object} p.factions  FACTIONS registry
 * @param {object} [p.roleProfiles]
 * @param {object} [p.tunables]
 * @returns {{tensions, warnings, district}}
 */
export function scanFactionTensions({ tokens = [], district = null, factions = null, roleProfiles = null, tunables = getTunables() }) {
  if (!factions || tokens.length === 0) return { tensions: [], warnings: [], district: district?.name || "No District Selected" };
  const T = tunables.gm;

  const tf = tokens.map((t) => ({
    name: t.name, img: t.img, isPC: t.isPC, topArch: t.topArch, roleData: t.roleData,
    factionKeys: factionKeysFor(t.archetypes || [], factions, T.factionReadConfidenceFloor),
  }));

  // Pairwise rival detection.
  const tensions = [];
  for (let i = 0; i < tf.length; i++) {
    for (let j = i + 1; j < tf.length; j++) {
      const a = tf[i], b = tf[j];
      const rivalPairs = [];
      a.factionKeys.forEach((aKey) => {
        const aF = factions[aKey];
        b.factionKeys.forEach((bKey) => {
          if (aKey === bKey) return;
          const bF = factions[bKey];
          if ((aF?.rivals || []).includes(bKey) || (bF?.rivals || []).includes(aKey)) rivalPairs.push({ a: aF?.label || aKey, b: bF?.label || bKey });
        });
      });
      if (rivalPairs.length > 0) {
        const deduped = rivalPairs.filter((v, idx, arr) => arr.findIndex((x) => x.a === v.a && x.b === v.b) === idx);
        tensions.push({
          tokenA: { name: a.name, img: a.img, isPC: a.isPC, arch: a.topArch.label },
          tokenB: { name: b.name, img: b.img, isPC: b.isPC, arch: b.topArch.label },
          rivalPairs: deduped,
          severity: rivalPairs.length >= T.tension.criticalPairs ? "critical" : rivalPairs.length >= T.tension.majorPairs ? "major" : "minor",
        });
      }
    }
  }

  // Per-PC district hostility.
  const warnings = [];
  if (district?.factions) {
    tf.forEach((t) => {
      if (!t.isPC) return;
      const danger = districtFactionDanger({ playerArchetypeKey: t.topArch.key, district, factions, roleData: t.roleData, roleProfiles });
      if (danger.level === "HOSTILE" || danger.level === "MIXED") {
        warnings.push({ name: t.name, arch: t.topArch.label, level: danger.level, controlling: danger.controlling, detail: danger.warnings, roleTension: danger.roleTension });
      }
    });
  }

  return { tensions, warnings, district: district?.name || "No District Selected" };
}
