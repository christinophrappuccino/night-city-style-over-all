/**
 * crew.mjs — crew-level analysis (how a group of characters reads together).
 *
 * Pure; consumes an array of per-member decomposed inputs (each member's collected
 * set + cyberware aggregation + the already-validated per-member outputs styleRating
 * / cohesion / archetypes + actorSystem/criticalInjuries for danger). It never reads
 * a raw actor — `collect()` is the only actor→data bridge. The two context-dependent
 * aggregations recompute through the existing engines: role coverage calls heat
 * (sceneAvg = crew avg style, so it cannot be precomputed per-member) and crew danger
 * calls danger. Everything else is aggregation over member fields.
 *
 * Per-role tolerances live in config ROLE_PROFILES (reached via the heat/danger
 * engines); the remaining constants come from Tunables (crew). Output is the Phase 82
 * CrewAnalyzer.analyze() shape plus the explainability envelope on the root.
 *
 * Ports: CrewAnalyzer (macro ~8868–9537) — its 13 aggregation methods.
 * Spec: SC-Module-Architecture-Guide.md §29.1, §4.1, §18
 */

import { getTunables } from "../config/tunables.mjs";
import { heatIndex, ammoHeat } from "./heat.mjs";
import { dangerScore } from "./danger.mjs";
import { dripRating } from "./ratings.mjs";

const DEFAULT_TIER = { key: "tier1", number: 1, name: "Unknown", icon: "?", grade: "F" };
const DEFAULT_TOP_ARCH = { key: "unknown", label: "Unknown", confidence: 0 };

function roleTier(rank, RT) {
  if (rank >= RT.legendary) return "legendary";
  if (rank >= RT.high) return "high";
  if (rank >= RT.mid) return "mid";
  if (rank >= RT.low) return "low";
  return "none";
}

const stdDev = (vals) => {
  if (!vals.length) return 0;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length);
};

// ── member derivation ──────────────────────────────────────────────────────

/**
 * Build the per-member aggregation record (the macro's `memberData` entry) from one
 * decomposed input. Mirrors CrewAnalyzer.analyze()'s map, but reads `collected`
 * instead of the raw actor and takes styleRating/cohesion/archetypes precomputed.
 */
function buildMember(m) {
  const collected = m.collected;
  const styleRating = m.styleRating || null;
  const cyberData = m.cyberwareData || null;
  const archetypes = m.archetypes || [];
  const topArch = archetypes[0] || { ...DEFAULT_TOP_ARCH };

  // Styles: count of equipped clothing per style (matches _getStyles).
  const styles = { ...collected.styles };
  const clothingCost = collected.totalCost;
  const weaponCount = collected.weapons.equipped.length;
  const drawnCount = collected.weapons.equipped.filter((w) => w.state === "drawn").length;
  const armorCount = collected.armor.equipped.length;

  return {
    tokenId: m.tokenId ?? null,
    name: m.name,
    img: m.img ?? null,
    cyberData,
    styleRating,
    cohesion: m.cohesion ?? null,
    archetypes,
    topArch,
    styles,
    clothingCost,
    weaponCount,
    drawnCount,
    armorCount,
    chromeCount: cyberData?.totalCount || 0,
    chromePercent: cyberData?.chromePercent || 0,
    styleScore: styleRating?.total || 0,
    tier: styleRating?.tier || { ...DEFAULT_TIER },
    socialStats: collected.socialStats,
    roleData: collected.roleData,
    // carried for the context-dependent recomputations (not echoed by the macro,
    // but harmless extras under subset compare).
    _threatAmmo: collected.threatAmmo,
    _weaponsData: collected.weapons.equipped,
    _actorSystem: m.actorSystem ?? null,
    _criticalInjuries: m.criticalInjuries ?? [],
  };
}

// ── the analyzer ────────────────────────────────────────────────────────────

/**
 * @param {object} p
 * @param {object[]} p.members        decomposed per-member inputs (see buildMember)
 * @param {object} p.factionsConfig   { FACTIONS, FACTION_ARCHETYPES, ROLE_PROFILES }
 * @param {object} [p.tunables]
 * @returns Phase 82 CrewAnalyzer.analyze() output + explainability envelope
 */
export function analyzeCrew({ members = [], factionsConfig = null, tunables = getTunables() }) {
  const C = tunables.crew;
  const roleProfiles = factionsConfig?.ROLE_PROFILES || null;
  const md = members.filter(Boolean).map(buildMember);

  if (md.length === 0) {
    const empty = emptyAnalysis();
    return { ...empty, value: 0, label: "NO CREW", blurb: "No crew members.", tunablesApplied: {} };
  }

  const analysis = {
    members: md.map(stripInternal),
    synergy: calculateSynergy(md, C),
    roleCoverage: calculateRoleCoverage(md, roleProfiles, C, tunables),
    actualRoleComposition: calculateActualRoleComposition(md, C),
    styleCoherence: calculateStyleCoherence(md, C),
    crewHeat: calculateCrewHeat(md, C),
    crewDanger: calculateCrewDanger(md, roleProfiles, C, tunables),
    weakestLink: findWeakestLink(md),
    standout: findStandout(md),
    crewFactionProfile: calculateCrewFactionProfile(md, factionsConfig, C),
    crewBudget: calculateCrewBudget(md, tunables),
    chromeDisparity: calculateChromeDisparity(md),
    internalClashes: detectInternalClashes(md, factionsConfig),
    crewReputation: calculateCrewReputation(md, C),
    districtReadiness: { memberCount: md.length },
  };

  return {
    ...analysis,
    // explainability envelope on the root.
    value: analysis.synergy.score,
    label: `Crew — ${analysis.synergy.label}`,
    blurb: `${md.length} member(s); synergy ${analysis.synergy.score}/100 (${analysis.synergy.label}), heat ${analysis.crewHeat.value}, danger ${analysis.crewDanger.value}.`,
    tunablesApplied: { "crew.synergy.weights": C.synergy.weights, "crew.heat.levels": C.heat.levels, "crew.danger.tiers": C.danger.tiers },
  };
}

/** Drop the engine-internal pass-through fields from a member record. */
function stripInternal(m) {
  const { _threatAmmo, _weaponsData, _actorSystem, _criticalInjuries, ...rest } = m;
  return rest;
}

// ── SYNERGY ─────────────────────────────────────────────────────────────────

function calculateSynergy(md, C) {
  const S = C.synergy;
  if (md.length < S.minMembers) {
    return { score: 0, max: 100, label: md.length === 1 ? "SOLO — Need 2+ members" : "N/A", factors: { styleOverlap: 0, roleDiversity: 0, chromeBalance: 0, costBalance: 0 } };
  }

  // Style overlap — how many styles ≥2 members share.
  const allStyles = {};
  md.forEach((m) => { Object.keys(m.styles).forEach((s) => { allStyles[s] = (allStyles[s] || 0) + 1; }); });
  const sharedStyles = Object.values(allStyles).filter((v) => v >= S.sharedStyleMinWearers).length;
  const totalUniqueStyles = Object.keys(allStyles).length;
  const styleOverlap = totalUniqueStyles > 0 ? Math.round((sharedStyles / totalUniqueStyles) * 100) : 0;

  // Role diversity — unique archetypes.
  const archetypeSet = new Set(md.map((m) => m.topArch.key).filter((k) => k !== "unknown" && k !== "unaffiliated"));
  const roleDiversity = Math.round((archetypeSet.size / Math.max(1, md.length)) * 100);

  // Chrome balance — std deviation of chrome counts.
  const chromeStdDev = stdDev(md.map((m) => m.chromeCount));
  const chromeBalance = Math.max(0, 100 - Math.round(chromeStdDev * S.chromeStdDevMult));

  // Cost balance — relative std deviation of clothing cost.
  const costs = md.map((m) => m.clothingCost);
  const costAvg = costs.reduce((a, b) => a + b, 0) / costs.length;
  const costStdDev = stdDev(costs);
  const costBalance = Math.max(0, 100 - Math.round((costStdDev / Math.max(1, costAvg)) * S.costStdDevMult));

  const w = S.weights;
  const score = Math.round(styleOverlap * w.styleOverlap + roleDiversity * w.roleDiversity + chromeBalance * w.chromeBalance + costBalance * w.costBalance);
  const L = S.labels;
  let label = "DYSFUNCTIONAL";
  if (score >= L.legendary) label = "LEGENDARY SYNERGY";
  else if (score >= L.tight) label = "TIGHT UNIT";
  else if (score >= L.working) label = "WORKING CREW";
  else if (score >= L.loose) label = "LOOSE ALLIANCE";

  return { score, max: 100, label, factors: { styleOverlap, roleDiversity, chromeBalance, costBalance } };
}

// ── ROLE COVERAGE ─────────────────────────────────────────────────────────────

function calculateRoleCoverage(md, roleProfiles, C, tunables) {
  const RC = C.roleCoverage;
  const idealRoles = RC.idealRoles;
  if (md.length === 0) return { idealRoles, filled: {}, covered: [], missing: idealRoles, doubled: [], assignments: [], coveragePercent: 0 };

  const avgStyle = md.reduce((s, m) => s + m.styleScore, 0) / md.length;

  const scored = md.map((m) => {
    const ss = m.socialStats || { cool: 0, personalGrooming: 0, wardrobeAndStyle: 0, reputation: 0 };
    const memberAmmoHeat = ammoHeat(m._threatAmmo, tunables);
    const heat = heatIndex({
      styleScore: m.styleScore, sceneAvg: avgStyle, weaponsEquipped: m.weaponCount,
      chromePercent: m.chromePercent, armorEquipped: m.armorCount, socialStats: ss,
      roleData: m.roleData, roleProfiles, scMods: null, ammoHeat: memberAmmoHeat,
      drawnWeapons: m.drawnCount || 0, tunables,
    });
    const deviation = Math.abs(m.styleScore - avgStyle);

    // Role perception bonuses.
    const rd = m.roleData;
    const rp = rd?.hasRole && roleProfiles ? (roleProfiles[rd.primaryRole?.key] || roleProfiles.none) : null;
    const perc = rp?.perception || RC.defaultPerception;
    const rankScale = rd?.hasRole
      ? (() => {
          const t = roleTier(rd.primaryRole.rank, C.roleTier);
          return t === "legendary" ? RC.rankScale.legendary : t === "high" ? RC.rankScale.high : t === "mid" ? RC.rankScale.mid : RC.rankScale.low;
        })()
      : 0;

    const pw = RC.percWeights;
    const roleFace = Math.round((perc.approachabilityPenalty * pw.face.approach + perc.recognizability * pw.face.recog) * rankScale);
    const roleIntim = Math.round((perc.intimidationBonus * pw.intimidator.intim + perc.recognizability * pw.intimidator.recog) * rankScale);
    const roleInfilt = Math.round((perc.recognizability * pw.infiltrator.recog + (perc.coolMasking - 1) * pw.infiltrator.coolMaskOver1) * rankScale);
    const roleBlend = Math.round((perc.recognizability * pw.blender.recog + (perc.coolMasking - 1) * pw.blender.coolMaskOver1 + Math.abs(perc.approachabilityPenalty) * pw.blender.approachAbs) * rankScale);
    const roleNegot = Math.round((perc.approachabilityPenalty * pw.negotiator.approach + perc.intimidationBonus * pw.negotiator.intim + perc.recognizability * pw.negotiator.recog) * rankScale);

    const sw = RC.scoreWeights;
    return {
      name: m.name,
      archetype: m.topArch?.label || "???",
      roleName: rd?.hasRole ? rd.primaryRole.name : null,
      scores: {
        face: ss.wardrobeAndStyle * sw.face.ws + ss.personalGrooming * sw.face.pg + ss.cool * sw.face.cool + m.styleScore * sw.face.style + roleFace,
        intimidator: ss.cool * sw.intimidator.cool + ss.reputation * sw.intimidator.rep + m.chromeCount * sw.intimidator.chrome + m.weaponCount * sw.intimidator.weapon + roleIntim,
        infiltrator: ss.cool * sw.infiltrator.cool + (RC.repInvBase - ss.reputation) * sw.infiltrator.repInv + (RC.heatInvBase - (heat.value || 0)) * sw.infiltrator.heatInv + roleInfilt,
        blender: (RC.devInvBase - deviation) * sw.blender.devInv + ss.personalGrooming * sw.blender.pg + ss.wardrobeAndStyle * sw.blender.ws + (RC.repInvBase - ss.reputation) * sw.blender.repInv + roleBlend,
        negotiator: ss.cool * sw.negotiator.cool + ss.reputation * sw.negotiator.rep + ss.personalGrooming * sw.negotiator.pg + ss.wardrobeAndStyle * sw.negotiator.ws + roleNegot,
      },
    };
  });

  const filled = {};
  const assignments = [];
  const assigned = new Set();

  // Step 1: best scorer per role.
  const bestPerRole = {};
  idealRoles.forEach((role) => { bestPerRole[role] = [...scored].sort((a, b) => b.scores[role] - a.scores[role]); });

  // Detect conflicts: same person #1 in multiple roles.
  const claims = {};
  idealRoles.forEach((role) => {
    const topName = bestPerRole[role][0]?.name;
    if (topName) { if (!claims[topName]) claims[topName] = []; claims[topName].push(role); }
  });

  // Resolve: keep the role with the greatest margin over #2.
  const resolved = {};
  for (const [name, roles] of Object.entries(claims)) {
    if (roles.length === 1) {
      resolved[roles[0]] = name;
    } else {
      let bestMargin = -Infinity;
      let keepRole = roles[0];
      roles.forEach((role) => {
        const sorted = bestPerRole[role];
        const margin = sorted[0].scores[role] - (sorted[1]?.scores[role] || 0);
        if (margin > bestMargin) { bestMargin = margin; keepRole = role; }
      });
      resolved[keepRole] = name;
    }
  }

  for (const [role, name] of Object.entries(resolved)) {
    filled[role] = [name];
    assigned.add(name);
    const member = scored.find((s) => s.name === name);
    assignments.push({ name, archetype: member.archetype, role, confidence: Math.round(member.scores[role]) });
  }

  // Step 2: fill remaining roles with best available unassigned member.
  idealRoles.forEach((role) => {
    if (filled[role]) return;
    const best = bestPerRole[role].find((s) => !assigned.has(s.name));
    if (best) {
      filled[role] = [best.name];
      assigned.add(best.name);
      assignments.push({ name: best.name, archetype: best.archetype, role, confidence: Math.round(best.scores[role]) });
    }
  });

  // Step 3: remaining unassigned members → their strongest role.
  scored.filter((s) => !assigned.has(s.name)).forEach((s) => {
    const bestRole = idealRoles.reduce((best, role) => (s.scores[role] > s.scores[best] ? role : best), idealRoles[0]);
    if (!filled[bestRole]) filled[bestRole] = [];
    filled[bestRole].push(s.name);
    assignments.push({ name: s.name, archetype: s.archetype, role: bestRole, confidence: Math.round(s.scores[bestRole]) });
  });

  const covered = idealRoles.filter((r) => filled[r] && filled[r].length > 0);
  const missing = idealRoles.filter((r) => !filled[r] || filled[r].length === 0);
  const doubled = Object.entries(filled).filter(([, members]) => members.length > 1).map(([r, members]) => ({ role: r, members, count: members.length }));
  return { idealRoles, filled, covered, missing, doubled, assignments, coveragePercent: Math.round((covered.length / idealRoles.length) * 100) };
}

// ── ACTUAL ROLE COMPOSITION ─────────────────────────────────────────────────

function calculateActualRoleComposition(md, C) {
  const CC = C.composition;
  const roleCounts = {};
  const roleDetails = [];

  for (const m of md) {
    if (m.roleData?.hasRole) {
      const primary = m.roleData.primaryRole;
      for (const role of m.roleData.roles) {
        roleCounts[role.key] = (roleCounts[role.key] || 0) + 1;
        // Macro used reference identity (role === primaryRole); that survives in
        // live use (primaryRole IS roles[0]) but not JSON round-trips, so match by
        // stable id too — equivalent for unique item ids, serialization-safe.
        const isPrimary = role === primary || (role.id != null && role.id === primary?.id);
        roleDetails.push({ name: m.name, role: role.name, roleKey: role.key, rank: role.rank, isPrimary });
      }
    }
  }

  const missingRoles = CC.allRoles.filter((r) => !roleCounts[r]);
  const overlaps = Object.entries(roleCounts).filter(([, v]) => v >= CC.overlapMinCount).map(([k, v]) => ({ role: k, count: v }));
  return { roleCounts, roleDetails, missingRoles, overlaps, hasData: roleDetails.length > 0 };
}

// ── STYLE COHERENCE ───────────────────────────────────────────────────────────

function calculateStyleCoherence(md, C) {
  const CO = C.coherence;
  if (md.length < CO.minMembers) {
    const soloStyles = {};
    if (md.length === 1) Object.entries(md[0].styles).forEach(([s, c]) => { soloStyles[s] = c; });
    const sorted = Object.entries(soloStyles).sort((a, b) => b[1] - a[1]);
    const dominantStyle = sorted[0] ? sorted[0][0] : "None";
    const totalItems = Object.values(soloStyles).reduce((a, b) => a + b, 0);
    const dominantCount = sorted[0] ? sorted[0][1] : 0;
    const soloPercent = totalItems > 0 ? Math.round((dominantCount / totalItems) * 100) : 0;
    return {
      score: soloPercent, label: md.length === 1 ? "SOLO" : "N/A",
      dominantStyle, allStyles: sorted, blowability: 0, blowLabel: "N/A",
      memberFit: md.length === 1 ? [{ name: md[0].name, img: md[0].img, fitPercent: soloPercent, hasStyle: dominantCount > 0, items: dominantCount, total: totalItems }] : [],
      styleDistribution: sorted.map(([s, c]) => ({ style: s, count: c, percent: totalItems > 0 ? Math.round((c / totalItems) * 100) : 0 })),
      memberStyles: md.length === 1 ? [{ name: md[0].name, styles: sorted.map(([s, c]) => ({ style: s, count: c, percent: totalItems > 0 ? Math.round((c / totalItems) * 100) : 0 })) }] : [],
      sharedStyles: [], uniqueStyles: sorted.map(([s]) => s), totalItems,
    };
  }

  const globalStyles = {};
  let totalItems = 0;
  md.forEach((m) => { Object.entries(m.styles).forEach(([s, c]) => { globalStyles[s] = (globalStyles[s] || 0) + c; totalItems += c; }); });

  const sorted = Object.entries(globalStyles).sort((a, b) => b[1] - a[1]);
  const dominantStyle = sorted[0] ? sorted[0][0] : "None";
  const dominantCount = sorted[0] ? sorted[0][1] : 0;
  const coherencePercent = totalItems > 0 ? Math.round((dominantCount / totalItems) * 100) : 0;

  const memberFit = md.map((m) => {
    const hasStyle = m.styles[dominantStyle] || 0;
    const totalMemberItems = Object.values(m.styles).reduce((a, b) => a + b, 0);
    const fitPercent = totalMemberItems > 0 ? Math.round((hasStyle / totalMemberItems) * 100) : 0;
    return { name: m.name, img: m.img, fitPercent, hasStyle: hasStyle > 0, items: hasStyle, total: totalMemberItems };
  });

  const styleDistribution = sorted.map(([s, c]) => ({ style: s, count: c, percent: totalItems > 0 ? Math.round((c / totalItems) * 100) : 0 }));

  const memberStyles = md.map((m) => {
    const mTotal = Object.values(m.styles).reduce((a, b) => a + b, 0);
    const mSorted = Object.entries(m.styles).sort((a, b) => b[1] - a[1]);
    return { name: m.name, img: m.img, styles: mSorted.map(([s, c]) => ({ style: s, count: c, percent: mTotal > 0 ? Math.round((c / mTotal) * 100) : 0 })), totalItems: mTotal };
  });

  const styleWearers = {};
  md.forEach((m) => { Object.keys(m.styles).forEach((s) => { if (!styleWearers[s]) styleWearers[s] = []; styleWearers[s].push(m.name); }); });
  const sharedStyles = Object.entries(styleWearers).filter(([, w]) => w.length >= 2).map(([s, w]) => ({ style: s, wearers: w }));
  const uniqueStyles = Object.entries(styleWearers).filter(([, w]) => w.length === 1).map(([s, w]) => ({ style: s, wearer: w[0] }));

  const B = CO.blowability;
  const uniqueArchetypes = new Set(md.map((m) => m.topArch.key)).size;
  const avgCost = md.reduce((s, m) => s + m.clothingCost, 0) / md.length;
  const costSpread = Math.max(...md.map((m) => m.clothingCost)) - Math.min(...md.map((m) => m.clothingCost));
  let blowability = 0;
  blowability += (uniqueArchetypes / md.length) * B.archetypeWeight;
  blowability += Math.min(B.costSpreadCap, (costSpread / Math.max(1, avgCost)) * B.costSpreadWeight);
  blowability += (100 - coherencePercent) * B.coherenceWeight;
  blowability = Math.min(B.cap, Math.round(blowability));
  const BL = CO.blowLabels;
  let blowLabel = "INVISIBLE";
  if (blowability >= BL.blownOnSight) blowLabel = "BLOWN ON SIGHT";
  else if (blowability >= BL.obviousCrew) blowLabel = "OBVIOUS CREW";
  else if (blowability >= BL.suspicious) blowLabel = "SUSPICIOUS";

  const L = CO.labels;
  let label = "CHAOTIC";
  if (coherencePercent >= L.uniform) label = "UNIFORM";
  else if (coherencePercent >= L.coordinated) label = "COORDINATED";
  else if (coherencePercent >= L.mixed) label = "MIXED";

  return { score: coherencePercent, label, dominantStyle, memberFit, allStyles: sorted, blowability, blowLabel, styleDistribution, memberStyles, sharedStyles, uniqueStyles, totalItems };
}

// ── CREW HEAT ─────────────────────────────────────────────────────────────────

function calculateCrewHeat(md, C) {
  const H = C.heat;
  const memberCount = Math.max(1, md.length);
  const totalWeapons = md.reduce((s, m) => s + m.weaponCount, 0);
  const totalArmor = md.reduce((s, m) => s + m.armorCount, 0);
  const avgChrome = md.reduce((s, m) => s + m.chromePercent, 0) / memberCount;
  const totalCost = md.reduce((s, m) => s + m.clothingCost, 0);

  const weaponsPerHead = totalWeapons / memberCount;
  const armorPerHead = totalArmor / memberCount;

  let heat = 0;
  heat += Math.max(0, weaponsPerHead - H.weaponBaselinePerHead) * H.weaponExcessMult;
  heat += Math.max(0, armorPerHead - H.armorBaselinePerHead) * H.armorExcessMult;
  heat += Math.max(0, (avgChrome - H.chromeThreshold) * H.chromeRate);
  heat += Math.min(H.costCap, totalCost / H.costDivisor);
  heat += Math.min(H.groupSizeCap, (memberCount - 1) * H.groupSizeMult);

  const avgRep = md.reduce((s, m) => s + (m.socialStats?.reputation || 0), 0) / memberCount;
  heat += avgRep * H.repMult;
  const avgCool = md.reduce((s, m) => s + (m.socialStats?.cool || 0), 0) / memberCount;
  heat -= avgCool * H.coolMult;

  heat = Math.min(100, Math.max(0, Math.round(heat)));

  const L = H.levels;
  let level = "COLD";
  if (heat >= L.blazing) level = "BLAZING";
  else if (heat >= L.hot) level = "HOT";
  else if (heat >= L.warm) level = "WARM";

  return { value: heat, level, totalWeapons, totalArmor, avgChrome: Math.round(avgChrome) };
}

// ── CREW DANGER ───────────────────────────────────────────────────────────────

function calculateCrewDanger(md, roleProfiles, C, tunables) {
  const D = C.danger;
  const memberCount = Math.max(1, md.length);

  const memberDangers = md.map((m) => {
    const memberAmmoHeat = ammoHeat(m._threatAmmo, tunables);
    const result = dangerScore({
      actorSystem: m._actorSystem, criticalInjuries: m._criticalInjuries, weaponsData: m._weaponsData,
      armorCount: m.armorCount, cyberwareData: m.cyberData, socialStats: m.socialStats,
      roleData: m.roleData, roleProfiles, ammoHeat: memberAmmoHeat, tunables,
    });
    return { name: m.name, value: result.value, tier: result.tier, color: result.color, tooltip: result.tooltip };
  });

  const avgDanger = Math.round(memberDangers.reduce((s, d) => s + d.value, 0) / memberCount);
  const maxDanger = memberDangers.reduce((max, d) => (d.value > max.value ? d : max), memberDangers[0]);
  const minDanger = memberDangers.reduce((min, d) => (d.value < min.value ? d : min), memberDangers[0]);

  const crewValue = Math.min(100, Math.round(avgDanger * D.avgWeight + (maxDanger?.value || 0) * D.maxWeight));
  const T = D.tiers;
  const tier = crewValue >= T.extreme ? "EXTREME" : crewValue >= T.high ? "HIGH" : crewValue >= T.moderate ? "MODERATE" : "LOW";
  const col = D.colors;
  const color = crewValue >= T.extreme ? col.extreme : crewValue >= T.high ? col.high : crewValue >= T.moderate ? col.moderate : col.low;

  return { value: crewValue, tier, color, avgDanger, maxThreat: maxDanger, minThreat: minDanger, members: memberDangers };
}

// ── WEAKEST LINK / STANDOUT ───────────────────────────────────────────────────

function findWeakestLink(md) {
  if (md.length < 2) return null;
  const sorted = [...md].sort((a, b) => a.styleScore - b.styleScore);
  const weakest = sorted[0];
  const avgScore = md.reduce((s, m) => s + m.styleScore, 0) / md.length;
  const deficit = Math.round(avgScore - weakest.styleScore);
  return { name: weakest.name, img: weakest.img, score: weakest.styleScore, avgScore: Math.round(avgScore), deficit, archetype: weakest.topArch.label };
}

function findStandout(md) {
  if (md.length < 2) return null;
  const avgScore = md.reduce((s, m) => s + m.styleScore, 0) / md.length;
  const avgChrome = md.reduce((s, m) => s + m.chromeCount, 0) / md.length;

  let maxDeviation = 0;
  let standout = null;
  let reason = "";
  md.forEach((m) => {
    const styleDev = Math.abs(m.styleScore - avgScore) / Math.max(1, avgScore);
    const chromeDev = Math.abs(m.chromeCount - avgChrome) / Math.max(1, avgChrome);
    const totalDev = styleDev + chromeDev;
    if (totalDev > maxDeviation) {
      maxDeviation = totalDev;
      standout = m;
      if (styleDev > chromeDev) reason = m.styleScore > avgScore ? "Overdressed for the crew" : "Underdressed for the crew";
      else reason = m.chromeCount > avgChrome ? "Way more chromed than crew avg" : "Way less chromed than crew avg";
    }
  });

  return standout ? { name: standout.name, img: standout.img, score: standout.styleScore, chrome: standout.chromeCount, reason, deviation: Math.round(maxDeviation * 100) } : null;
}

// ── FACTION PROFILE ───────────────────────────────────────────────────────────

function calculateCrewFactionProfile(md, factionsConfig, C) {
  const archCounts = {};
  md.forEach((m) => { const key = m.topArch.key; if (key !== "unknown") archCounts[key] = (archCounts[key] || 0) + 1; });
  const sorted = Object.entries(archCounts).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0];
  const dominantPercent = dominant ? Math.round((dominant[1] / md.length) * 100) : 0;

  let hostileFactions = [];
  if (dominant && factionsConfig) {
    const factionEntries = Object.entries(factionsConfig.FACTIONS).filter(([, f]) => f.archetype === dominant[0]);
    factionEntries.forEach(([, fData]) => {
      (fData.rivals || []).forEach((r) => {
        const rival = factionsConfig.FACTIONS[r];
        if (rival && !hostileFactions.find((h) => h.key === r)) hostileFactions.push({ key: r, label: rival.label });
      });
    });
  }

  return {
    distribution: sorted.map(([k, c]) => ({ key: k, label: factionsConfig?.FACTION_ARCHETYPES?.[k]?.label || k, count: c, percent: Math.round((c / md.length) * 100) })),
    dominant: dominant ? { key: dominant[0], label: factionsConfig?.FACTION_ARCHETYPES?.[dominant[0]]?.label || dominant[0], count: dominant[1], percent: dominantPercent } : null,
    hostileFactions,
    isUniform: sorted.length === 1 && md.length > 1,
    isDiverse: sorted.length >= Math.max(2, Math.floor(md.length * C.factionProfile.diverseFactor)),
  };
}

// ── BUDGET ────────────────────────────────────────────────────────────────────

function calculateCrewBudget(md, tunables) {
  const costs = md.map((m) => ({ name: m.name, img: m.img, cost: m.clothingCost, tier: m.tier }));
  const total = costs.reduce((s, c) => s + c.cost, 0);
  const avg = md.length > 0 ? Math.round(total / md.length) : 0;
  costs.sort((a, b) => b.cost - a.cost);
  return { members: costs, total, avg, dripRating: dripRating(avg, tunables), bigSpender: costs[0] || null, cheapskate: costs[costs.length - 1] || null };
}

// ── CHROME DISPARITY ──────────────────────────────────────────────────────────

const CHROME_DISPARITY_CATS = ["visible_chrome", "hidden_chrome", "fashionware", "bioware", "borgware", "display_chrome", "combat_chrome"];

function dominantChromeCategory(cyberData) {
  if (!cyberData) return "none";
  const pc = cyberData.profileCounts || {};
  return CHROME_DISPARITY_CATS.map((cat) => ({ cat, count: pc[cat] || cyberData[cat]?.length || 0 })).sort((a, b) => b.count - a.count)[0]?.cat || "none";
}

function calculateChromeDisparity(md) {
  const chromes = md.map((m) => ({ name: m.name, img: m.img, count: m.chromeCount, percent: m.chromePercent, topCategory: dominantChromeCategory(m.cyberData) }));
  const avg = md.length > 0 ? chromes.reduce((s, c) => s + c.count, 0) / md.length : 0;
  const max = Math.max(0, ...chromes.map((c) => c.count));
  const min = Math.min(Infinity, ...chromes.map((c) => c.count));
  chromes.sort((a, b) => b.count - a.count);
  return { members: chromes, avg: Math.round(avg * 10) / 10, max, min: min === Infinity ? 0 : min, spread: max - (min === Infinity ? 0 : min) };
}

// ── INTERNAL CLASHES ──────────────────────────────────────────────────────────

function detectInternalClashes(md, factionsConfig) {
  if (!factionsConfig || md.length < 2) return { clashes: [] };
  const clashes = [];

  for (let i = 0; i < md.length; i++) {
    for (let j = i + 1; j < md.length; j++) {
      const a = md[i], b = md[j];
      if (a.topArch.key === "unknown" || b.topArch.key === "unknown" || a.topArch.key === "unaffiliated" || b.topArch.key === "unaffiliated") continue;
      if (a.topArch.key === b.topArch.key) continue;

      const aFactions = Object.entries(factionsConfig.FACTIONS).filter(([, f]) => f.archetype === a.topArch.key);
      const bFactions = Object.entries(factionsConfig.FACTIONS).filter(([, f]) => f.archetype === b.topArch.key);

      const rivalPairs = [];
      aFactions.forEach(([aKey, aF]) => {
        bFactions.forEach(([bKey, bF]) => {
          if ((aF.rivals || []).includes(bKey) || (bF.rivals || []).includes(aKey)) rivalPairs.push({ a: aF.label || aKey, b: bF.label || bKey });
        });
      });

      if (rivalPairs.length > 0) {
        clashes.push({
          memberA: { name: a.name, img: a.img, archetype: a.topArch.label },
          memberB: { name: b.name, img: b.img, archetype: b.topArch.label },
          rivalPairs: rivalPairs.filter((v, idx, arr) => arr.findIndex((x) => x.a === v.a && x.b === v.b) === idx),
        });
      }
    }
  }
  return { clashes };
}

// ── REPUTATION ────────────────────────────────────────────────────────────────

function calculateCrewReputation(md, C) {
  const totalScore = md.reduce((s, m) => s + m.styleScore, 0);
  const avgScore = md.length > 0 ? Math.round(totalScore / md.length) : 0;
  // Blended: average quality × √size — rewards quality AND quantity with diminishing
  // returns on headcount.
  const blendedScore = md.length > 0 ? Math.round(avgScore * Math.sqrt(md.length)) : 0;
  const tiers = C.reputation.tiers;
  const tier = tiers.find((t) => blendedScore >= t.min) || tiers[tiers.length - 1];
  return { totalScore, blendedScore, tier, avgScore };
}

// ── EMPTY ─────────────────────────────────────────────────────────────────────

function emptyAnalysis() {
  return {
    members: [],
    synergy: { score: 0, max: 100, label: "NO CREW", factors: {} },
    roleCoverage: { idealRoles: [], filled: {}, covered: [], missing: [], doubled: [], assignments: [], coveragePercent: 0 },
    styleCoherence: { score: 0, label: "N/A", dominantStyle: "None", memberFit: [], allStyles: [], blowability: 0, blowLabel: "N/A" },
    crewHeat: { value: 0, level: "COLD", totalWeapons: 0, totalArmor: 0, avgChrome: 0 },
    crewDanger: { value: 0, tier: "LOW", color: "#28a745", avgDanger: 0, maxThreat: null, minThreat: null, members: [] },
    weakestLink: null,
    standout: null,
    crewFactionProfile: { distribution: [], dominant: null, hostileFactions: [], isUniform: false, isDiverse: false },
    crewBudget: { members: [], total: 0, avg: 0, dripRating: { rating: "❌ No Budget", tier: 1 }, bigSpender: null, cheapskate: null },
    chromeDisparity: { members: [], avg: 0, max: 0, min: 0, spread: 0 },
    internalClashes: { clashes: [] },
    crewReputation: { totalScore: 0, tier: { name: "Unknown Nobodies", icon: '<i class="fas fa-ghost"></i>', number: 1 }, avgScore: 0 },
    districtReadiness: { memberCount: 0 },
  };
}
