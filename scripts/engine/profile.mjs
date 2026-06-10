/**
 * profile.mjs — style rating + outfit cohesion (the headline "how styled are you").
 *
 * Pure; consumes the normalized `collected` set (Stage 1) rather than the raw actor,
 * which is the pure-engine shape the Wardrobe preview and parity gate both need.
 * Primary weights/scalers/bonuses come from CONFIG (RATING_FORMULA); the constants
 * that were hardcoded in the macro come from Tunables (styleScoring). Outputs are
 * Phase 82-compatible supersets (+ explainability).
 *
 * Ports: StyleRatingCalculator.calculateFullRating, .calculateCohesion,
 *        .calculateSynergy, .getClothingCost, .countAccessories,
 *        .hasCompleteOutfit, .getMaxMatchingCount.
 * Spec: SC-Module-Architecture-Guide.md §29.1 (Stage 3–4), §4.1, §18
 */

import { component } from "./explain.mjs";
import { tier as tierOf } from "./ratings.mjs";
import { getTunables } from "../config/tunables.mjs";

const ACCESSORY_SLOTS = ["hats", "glasses", "mirrorshades", "contactLenses", "jewelry"];
const CORE_SLOTS = ["top", "bottoms", "jacket", "footwear"];

// ── clothing-derived helpers (from collected, lossless) ─────────────────────

const styleCountTotal = (styles) => Object.values(styles).reduce((a, b) => a + b, 0);
const maxStyleCount = (styles) => Math.max(0, ...Object.values(styles), 0);

function countAccessories(collected) {
  return collected.equippedClothing.filter((c) => ACCESSORY_SLOTS.includes(c.slot)).length;
}

/** Synergy 0–10: dominant-style ratio over STYLED equipped clothing. */
function synergy(collected, ss) {
  const total = styleCountTotal(collected.styles);
  if (total === 0) return 0;
  return Math.round((maxStyleCount(collected.styles) / total) * ss.synergyScale);
}

function hasCompleteOutfit(collected) {
  const slots = new Set(collected.equippedClothing.map((c) => c.slot));
  const coreComplete = CORE_SLOTS.every((s) => slots.has(s));
  const accessoryCount = ACCESSORY_SLOTS.filter((s) => slots.has(s)).length;
  return coreComplete && accessoryCount >= 1;
}

// ── full style rating ───────────────────────────────────────────────────────

/**
 * @param {object} p
 * @param {object} p.collected     Stage-1 set (styles, totalCost, equippedClothing)
 * @param {object} p.cyberwareData chrome aggregation (totalCoolMod, fashionware[])
 * @param {object} p.socialStats   {cool, personalGrooming, wardrobeAndStyle, reputation}
 * @param {object} p.roleData      extractRoles() output
 * @param {object} p.formula       RATING_FORMULA (config/ratings)
 * @param {object} p.roleProfiles  ROLE_PROFILES (config/factions); may be null
 * @param {object} p.tiers         TIERS (config/ratings)
 * @param {object} [p.tunables]
 * @returns Phase 82-compatible styleRating {total,tier,breakdown,bonuses,socialModifiers,roleAlignment,roleCostFit} + explainability
 */
export function fullRating({ collected, cyberwareData, socialStats, roleData, formula, roleProfiles, tiers, tunables = getTunables() }) {
  const weights = formula.weights;
  const scalers = formula.scalers;
  const bonuses = formula.bonuses;
  const sm = formula.socialModifiers || { ws_percent_per_level: 3, grooming_percent_per_level: 2, cool_flat_per_point: 2, rep_impact_multiplier: 0.05 };
  const T = tunables.styleScoring;

  const clothingRaw = collected.totalCost;
  const cd = T.clothingDiminish;
  const clothingDiminished =
    Math.min(clothingRaw, cd.fullUpTo) +
    Math.min(Math.max(clothingRaw - cd.fullUpTo, 0), cd.halfBandUpTo - cd.fullUpTo) * cd.halfRate +
    Math.max(clothingRaw - cd.halfBandUpTo, 0) * cd.quarterRate;

  const clothingScore = clothingDiminished / (scalers.clothing_cost_divisor || 25);
  const cyberCoolScore = (cyberwareData?.totalCoolMod || 0) * (scalers.cyberware_cool_multiplier || 1);
  const fashionwareScore = (cyberwareData?.fashionware?.length || 0) * T.fashionwarePointsPerItem * (scalers.fashionware_multiplier || 1);
  const accessoryCount = countAccessories(collected);
  const accessoryScore = accessoryCount * (scalers.accessory_multiplier || 20);
  const synergyVal = synergy(collected, T);
  const synergyScore = synergyVal * (scalers.synergy_multiplier || 15);

  let total =
    clothingScore * weights.clothing_cost +
    cyberCoolScore * weights.cyberware_cool +
    fashionwareScore * weights.fashionware_bonus +
    accessoryScore * weights.accessory_count +
    synergyScore * weights.style_synergy;

  const hasComplete = hasCompleteOutfit(collected);
  const matchingSetCount = maxStyleCount(collected.styles);
  if (hasComplete) total += bonuses.complete_outfit;
  if (matchingSetCount >= T.matchingSetMin) total += bonuses.matching_set;
  if (matchingSetCount >= T.signatureLookMin) total += bonuses.signature_look;

  // Social stat modifiers.
  const ss = socialStats || { cool: 0, personalGrooming: 0, wardrobeAndStyle: 0, reputation: 0 };
  const wsMultiplier = 1 + (ss.wardrobeAndStyle * (sm.ws_percent_per_level || 3)) / 100;
  const pgMultiplier = 1 + (ss.personalGrooming * (sm.grooming_percent_per_level || 2)) / 100;
  const coolFlat = ss.cool * (sm.cool_flat_per_point || 2);
  const preModTotal = Math.round(total);
  total = total * wsMultiplier * pgMultiplier + coolFlat;

  // Role-style alignment.
  const ra = T.roleAlign;
  let roleAlignMult = 1.0;
  let roleAlignLabel = null;
  if (roleData?.hasRole && roleProfiles) {
    const rp = roleProfiles[roleData.primaryRole.key] || roleProfiles.none;
    const rank = roleData.primaryRole.rank;
    const effectiveExpect = { ...rp.styleExpectation };
    if (rank >= 4 && rp.highRankStyleShift) {
      for (const [style, shift] of Object.entries(rp.highRankStyleShift)) {
        effectiveExpect[style] = (effectiveExpect[style] || 0) + shift;
      }
    }
    const totalEquipped = collected.equippedClothing.length; // all equipped clothing
    if (totalEquipped > 0) {
      const playerProfile = {};
      for (const [style, count] of Object.entries(collected.styles)) {
        playerProfile[style] = count / totalEquipped;
      }
      let similarity = 0;
      let comparisons = 0;
      const allStyles = new Set([...Object.keys(effectiveExpect), ...Object.keys(playerProfile)]);
      allStyles.forEach((style) => {
        const ideal = effectiveExpect[style] || 0;
        const actual = playerProfile[style] || 0;
        if (ideal === 0 && actual === 0) return;
        comparisons++;
        if (ideal > 0 && actual > 0) similarity += 1 - Math.abs(ideal - actual);
        else if (ideal > 0 && actual === 0) similarity += 1 - ideal * ra.missingPenaltyFactor;
        else similarity += 1 - actual * ra.offBrandPenaltyFactor;
      });
      const alignPercent = comparisons > 0 ? Math.max(0, Math.min(1, similarity / comparisons)) : ra.noDistributionAlign;
      const rankFactor = Math.min(1, Math.max(0, (rank - 1) / ra.rankDivisor));
      const lowBound = ra.lowBase - rankFactor * ra.lowDrop;
      const highBound = ra.highBase + rankFactor * ra.highRise;
      roleAlignMult = lowBound + alignPercent * (highBound - lowBound);
      roleAlignLabel =
        alignPercent >= ra.labels.perfect ? "PERFECT FIT" :
        alignPercent >= ra.labels.good ? "GOOD FIT" :
        alignPercent >= ra.labels.passable ? "PASSABLE" : "MISMATCH";
    }
  }
  total = Math.round(total * roleAlignMult);

  // Role cost fit.
  const rc = T.roleCost;
  let roleCostAdj = 0;
  let roleCostLabel = null;
  if (roleData?.hasRole && roleProfiles) {
    const rp = roleProfiles[roleData.primaryRole.key] || roleProfiles.none;
    const rank = roleData.primaryRole.rank;
    if (rp.costExpectation) {
      const expectedFloor = rp.costExpectation.base.floor + rank * rp.costExpectation.perRank.floor;
      const expectedSweet = rp.costExpectation.base.sweet + rank * rp.costExpectation.perRank.sweet;
      if (clothingRaw >= expectedSweet) {
        roleCostAdj = Math.round(Math.min(rc.sweetCap, (clothingRaw / expectedSweet) * rc.sweetRate));
        roleCostLabel = "DRESSED THE PART";
      } else if (clothingRaw >= expectedFloor) {
        const range = expectedSweet - expectedFloor;
        roleCostAdj = range > 0 ? Math.round(((clothingRaw - expectedFloor) / range) * rc.acceptableMax) : rc.acceptableFallback;
        roleCostLabel = "ACCEPTABLE";
      } else if (clothingRaw > 0) {
        const deficit = (expectedFloor - clothingRaw) / Math.max(1, expectedFloor);
        roleCostAdj = -Math.round(deficit * rc.underdressedRate);
        roleCostLabel = "UNDERDRESSED";
      }
    }
  }
  total = Math.max(0, total + roleCostAdj);

  const tier = tierOf(total, tiers);

  return {
    total,
    tier,
    breakdown: {
      clothing: { raw: clothingRaw, weighted: Math.round(clothingScore * weights.clothing_cost), weight: weights.clothing_cost },
      cyberware: { raw: cyberwareData?.totalCoolMod || 0, weighted: Math.round(cyberCoolScore * weights.cyberware_cool), weight: weights.cyberware_cool },
      fashionware: { raw: cyberwareData?.fashionware?.length || 0, weighted: Math.round(fashionwareScore * weights.fashionware_bonus), weight: weights.fashionware_bonus },
      accessories: { raw: accessoryCount, weighted: Math.round(accessoryScore * weights.accessory_count), weight: weights.accessory_count },
      synergy: { raw: synergyVal, weighted: Math.round(synergyScore * weights.style_synergy), weight: weights.style_synergy },
    },
    bonuses: {
      complete_outfit: hasComplete ? bonuses.complete_outfit : 0,
      matching_set: matchingSetCount >= T.matchingSetMin ? bonuses.matching_set : 0,
      signature_look: matchingSetCount >= T.signatureLookMin ? bonuses.signature_look : 0,
    },
    socialModifiers: {
      wardrobeAndStyle: { level: ss.wardrobeAndStyle, multiplier: wsMultiplier, bonus: Math.round(preModTotal * wsMultiplier) - preModTotal },
      personalGrooming: { level: ss.personalGrooming, multiplier: pgMultiplier, bonus: Math.round(preModTotal * wsMultiplier * pgMultiplier) - Math.round(preModTotal * wsMultiplier) },
      cool: { value: ss.cool, flat: coolFlat },
      reputation: { value: ss.reputation, impactMultiplier: 1 + ss.reputation * (sm.rep_impact_multiplier || 0.05) },
      preModTotal,
    },
    roleAlignment: {
      multiplier: roleAlignMult,
      label: roleAlignLabel,
      roleName: roleData?.primaryRole?.name || null,
      roleRank: roleData?.primaryRole?.rank || 0,
    },
    roleCostFit: {
      adjustment: roleCostAdj,
      label: roleCostLabel,
      clothingCost: clothingRaw,
    },
    // explainability envelope
    value: total,
    blurb: `Style ${total} (${tier.name}).`,
    components: [
      component("clothing", Math.round(clothingScore * weights.clothing_cost), "cost"),
      component("cyberware cool", Math.round(cyberCoolScore * weights.cyberware_cool), "chrome"),
      component("fashionware", Math.round(fashionwareScore * weights.fashionware_bonus), "chrome"),
      component("accessories", Math.round(accessoryScore * weights.accessory_count), "slots"),
      component("synergy", Math.round(synergyScore * weights.style_synergy), "cohesion"),
    ],
    tunablesApplied: { "styleScoring.clothingDiminish": T.clothingDiminish, "styleScoring.fashionwarePointsPerItem": T.fashionwarePointsPerItem },
  };
}

// ── outfit cohesion ───────────────────────────────────────────────────────────

/**
 * Outfit cohesion: dominant-style ratio over ALL equipped clothing, softened by W&S.
 * @returns Phase 82-compatible {percent,rawPercent,dominantStyle,uniqueStyles,label,wsBoost} + explainability
 */
export function cohesion(collected, socialStats = null, tunables = getTunables()) {
  const C = tunables.styleScoring.cohesion;
  const styles = collected.styles;
  const totalEquipped = collected.equippedClothing.length;

  if (totalEquipped === 0) {
    return { percent: 0, dominantStyle: "None", uniqueStyles: 0, label: "NO OUTFIT", wsBoost: 0, value: 0, blurb: "No outfit.", components: [], tunablesApplied: {} };
  }

  const maxCount = maxStyleCount(styles);
  const dominant = Object.entries(styles).sort((a, b) => b[1] - a[1])[0];
  const rawPercent = Math.round((maxCount / totalEquipped) * 100);
  const uniqueStyles = Object.keys(styles).length;

  const ws = socialStats?.wardrobeAndStyle || 0;
  const wsBoost = ws > 0 ? Math.round((100 - rawPercent) * (ws * C.wsGapReductionPerLevel)) : 0;
  const percent = Math.min(100, rawPercent + wsBoost);

  let label = "CHAOTIC";
  if (percent >= C.signature) label = "SIGNATURE";
  else if (percent >= C.coordinated) label = "COORDINATED";
  else if (percent >= C.mixed) label = "MIXED";

  return {
    percent,
    rawPercent,
    dominantStyle: dominant ? dominant[0] : "None",
    uniqueStyles,
    label,
    wsBoost,
    value: percent,
    blurb: `${percent}% ${label} — ${dominant ? dominant[0] : "none"} dominant.`,
    components: [component("dominant count", maxCount, "styles"), component("equipped clothing", totalEquipped, "collected")],
    tunablesApplied: { "styleScoring.cohesion": C },
  };
}
