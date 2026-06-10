/**
 * districts.mjs — district fit: faction danger for an archetype, and district-type
 * threat tolerance.
 *
 * Pure; consumes a district config object + the factions registry + role data.
 * Constants (escalation maps, the threat-tolerance table) come from Tunables.
 *
 * Ports: StyleRatingCalculator.calculateDistrictFactionDanger, .getDistrictThreatTolerance.
 * Spec: SC-Module-Architecture-Guide.md §29.1 (Stage 5), §4.1, §18
 */

import { getTunables } from "../config/tunables.mjs";

/** District-type threat tolerance (chrome/weapon/armor penalties). */
export function threatTolerance(distType, tunables = getTunables()) {
  const table = tunables.districts.threatTolerance;
  return table[distType] || table.mixed;
}

/**
 * How the current outfit reads in a district: per-style impact + keep/remove/add
 * suggestions. Pure; consumes the collected style histogram (style→count) and the
 * district's modifier table. Port of StyleRatingCalculator.analyzeForDistrict.
 * @param {Object<string,number>} styles  collected.styles (equipped clothing per style)
 * @param {object} district               district config (has .modifiers)
 * @returns {{currentScore, potentialScore, keep, remove, add, breakdown}}
 */
export function districtStyleFit(styles = {}, district = {}) {
  const modifiers = district.modifiers || {};
  let currentScore = 0;
  const breakdown = [];
  for (const [style, count] of Object.entries(styles)) {
    if (modifiers[style]) {
      const impact = modifiers[style] * count;
      currentScore += impact;
      breakdown.push({ style, count, modifier: modifiers[style], impact });
    }
  }
  const positiveStyles = Object.entries(modifiers).filter(([, m]) => m > 0).sort((a, b) => b[1] - a[1]);
  return {
    currentScore,
    potentialScore: currentScore + (positiveStyles[0] ? positiveStyles[0][1] * 2 : 0),
    keep: breakdown.filter((b) => b.impact > 0),
    remove: breakdown.filter((b) => b.impact < 0),
    add: positiveStyles.slice(0, 3).map(([style, mod]) => ({ style, modifier: mod })),
    breakdown,
  };
}

/**
 * Faction danger for a player archetype within a district. Visual danger
 * (archetype vs district factions) can be escalated by role tension, never reduced.
 * @param {object} p
 * @param {string} p.playerArchetypeKey
 * @param {object} p.district       district config (factions, type)
 * @param {object} p.factions       FACTIONS registry
 * @param {object} [p.roleData]
 * @param {object} [p.roleProfiles]
 * @param {object} [p.tunables]
 * @returns Phase 82 {level, visualLevel, controlling, warnings, friendlies, roleTension}
 */
export function districtFactionDanger({ playerArchetypeKey, district, factions, roleData = null, roleProfiles = null, tunables = getTunables() }) {
  if (!district.factions || !factions) {
    return { level: "NEUTRAL", controlling: [], warnings: [], friendlies: [], roleTension: null };
  }
  const DT = tunables.districts;

  // Layer 1 — visual danger (archetype-based).
  const playerFactions = Object.keys(factions).filter((k) => factions[k].archetype === playerArchetypeKey);
  const controlling = (district.factions.controlling || []).map((k) => factions[k]?.label || k);
  const hostileMatches = playerFactions.filter((f) => (district.factions.hostile || []).includes(f));
  const friendlyMatches = playerFactions.filter((f) => (district.factions.friendly || []).includes(f) || (district.factions.controlling || []).includes(f));

  let visualLevel = "NEUTRAL";
  if (hostileMatches.length > 0 && friendlyMatches.length === 0) visualLevel = "HOSTILE";
  else if (friendlyMatches.length > 0 && hostileMatches.length === 0) visualLevel = "FRIENDLY";
  else if (hostileMatches.length > 0 && friendlyMatches.length > 0) visualLevel = "MIXED";

  // Layer 2 — identity danger (role-based).
  let roleTension = null;
  if (roleData?.hasRole && roleProfiles) {
    const rp = roleProfiles[roleData.primaryRole?.key] || roleProfiles.none;
    const ft = rp?.factionTension;
    if (ft) {
      const allDistrictFactionKeys = [
        ...(district.factions.controlling || []),
        ...(district.factions.friendly || []),
        ...(district.factions.hostile || []),
      ];
      const roleHostile = [];
      const roleWary = [];
      const roleRespected = [];
      const matchesPattern = (archetypeStr, patterns) =>
        patterns.some((p) => (p.endsWith("_") ? archetypeStr.startsWith(p) : archetypeStr === p));

      allDistrictFactionKeys.forEach((fKey) => {
        const fArch = factions[fKey]?.archetype || "";
        const fLabel = factions[fKey]?.label || fKey;
        const isControllingOrHostile = (district.factions.controlling || []).includes(fKey) || (district.factions.hostile || []).includes(fKey);
        const isControllingOrFriendly = (district.factions.controlling || []).includes(fKey) || (district.factions.friendly || []).includes(fKey);
        if (isControllingOrHostile && matchesPattern(fArch, ft.hostile)) roleHostile.push(fLabel);
        else if (isControllingOrHostile && matchesPattern(fArch, ft.wary)) roleWary.push(fLabel);
        if (isControllingOrFriendly && matchesPattern(fArch, ft.respected)) roleRespected.push(fLabel);
      });

      if (roleHostile.length > 0 || roleWary.length > 0 || roleRespected.length > 0) {
        let roleLevel = "NONE";
        if (roleHostile.length > 0) roleLevel = "HOSTILE";
        else if (roleWary.length > 0 && roleRespected.length === 0) roleLevel = "WARY";
        else if (roleWary.length > 0 && roleRespected.length > 0) roleLevel = "MIXED";
        else if (roleRespected.length > 0) roleLevel = "RESPECTED";
        roleTension = { level: roleLevel, roleName: roleData.primaryRole.name, hostile: roleHostile, wary: roleWary, respected: roleRespected };
      }
    }
  }

  // Composite — role escalates, never reduces.
  let finalLevel = visualLevel;
  if (roleTension) {
    const roleEscalation = DT.roleEscalation[roleTension.level] ?? 0;
    if (roleEscalation > DT.escalation[visualLevel]) {
      finalLevel = roleEscalation === 3 ? "HOSTILE" : "MIXED";
    }
  }

  return {
    level: finalLevel,
    visualLevel,
    controlling,
    warnings: hostileMatches.map((f) => factions[f]?.label || f),
    friendlies: friendlyMatches.map((f) => factions[f]?.label || f),
    roleTension,
  };
}
