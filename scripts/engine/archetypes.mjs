/**
 * archetypes.mjs — archetype/faction detection (who Night City reads you as).
 *
 * Pure; consumes the normalized `collected` set + cyberware aggregation + disguise
 * modifiers (scMods). Archetype definitions come from config FACTION_ARCHETYPES; all
 * scoring constants from Tunables (archetypes). Returns the Phase 82 ranked array.
 *
 * Ports: StyleRatingCalculator.detectAllArchetypes, .getRoleTier.
 * Spec: SC-Module-Architecture-Guide.md §29.1 (Stage 4), §4.1, §18
 */

import { getTunables } from "../config/tunables.mjs";

const CHROME_CATEGORIES = ["visible_chrome", "hidden_chrome", "fashionware", "bioware", "borgware", "display_chrome", "combat_chrome"];

/**
 * Dominant chrome category + which archetypes expect it.
 * Port of StyleRatingCalculator.detectChromeProfile.
 * @returns {{category:string, count:number, matchingArchetypes:{key,label}[]}}
 */
export function detectChromeProfile(cyberwareData, archetypes) {
  if (!cyberwareData || !archetypes) return { category: "hidden_chrome", count: 0, matchingArchetypes: [] };
  const chromeCounts = cyberwareData?.profileCounts || null;
  const dominant = CHROME_CATEGORIES
    .map((cat) => ({ cat, count: chromeCounts ? chromeCounts[cat] : cyberwareData[cat]?.length || 0 }))
    .sort((a, b) => b.count - a.count)[0];
  const category = dominant?.count > 0 ? dominant.cat : "none";
  const matchingArchetypes = Object.entries(archetypes)
    .filter(([, a]) => a.chromeProfile === category)
    .map(([k, a]) => ({ key: k, label: a.label }));
  return { category, count: dominant?.count || 0, matchingArchetypes };
}

function roleTier(rank, RT) {
  if (rank >= RT.legendary) return "legendary";
  if (rank >= RT.high) return "high";
  if (rank >= RT.mid) return "mid";
  if (rank >= RT.low) return "low";
  return "none";
}

/**
 * @param {object} p
 * @param {object} p.collected      Stage-1 set (styles, equippedClothing, totalCost, weapons, armor)
 * @param {object} p.cyberwareData  chrome aggregation (profileCounts, totalCount)
 * @param {object} p.archetypes     FACTION_ARCHETYPES (config/factions)
 * @param {object} p.socialStats
 * @param {object} p.roleData
 * @param {object} p.roleProfiles   ROLE_PROFILES (config/factions); may be null
 * @param {object} p.scMods         disguise modifiers (styles/chrome/cost/armor/archetypes/antiStyleSuppress)
 * @param {object} [p.tunables]
 * @returns {object[]} Phase 82 ranked archetype reads
 */
export function detectAllArchetypes({ collected, cyberwareData, archetypes, socialStats = null, roleData = null, roleProfiles = null, scMods = null, tunables = getTunables() }) {
  if (!archetypes) return [];
  const A = tunables.archetypes;

  // Player style distribution (copy styles — scMods mutates).
  const styleCounts = { ...collected.styles };
  let totalEquipped = collected.equippedClothing.length;
  let totalCost = collected.totalCost;

  // scMods virtual styles/cost injection.
  if (scMods?.hasModifiers) {
    for (const [style, count] of Object.entries(scMods.styles)) {
      const delta = Math.round(count);
      if (delta > 0) {
        styleCounts[style] = (styleCounts[style] || 0) + delta;
        totalEquipped += delta;
      } else if (delta < 0) {
        const current = styleCounts[style] || 0;
        const removed = Math.min(current, Math.abs(delta));
        styleCounts[style] = current - removed;
        totalEquipped -= removed;
        if (styleCounts[style] <= 0) delete styleCounts[style];
      }
    }
    if (scMods.cost) totalCost = Math.max(0, totalCost + scMods.cost);
  }

  const playerProfile = {};
  for (const [style, count] of Object.entries(styleCounts)) {
    playerProfile[style] = totalEquipped > 0 ? count / totalEquipped : 0;
  }

  // Dominant chrome (with sc.chrome.* injection).
  const chromeCounts = cyberwareData?.profileCounts || null;
  const chromeEntries = ["visible_chrome", "hidden_chrome", "fashionware", "bioware", "borgware", "display_chrome", "combat_chrome"]
    .map((cat) => {
      let count = chromeCounts ? chromeCounts[cat] : cyberwareData?.[cat]?.length || 0;
      if (scMods?.chrome?.[cat]) count = Math.max(0, count + Math.round(scMods.chrome[cat]));
      return { cat, count };
    })
    .sort((a, b) => b.count - a.count);
  const dominantChrome = chromeEntries[0]?.count > 0 ? chromeEntries[0].cat : "none";

  // Visible armor count (with sc.armor adjustment).
  let armorCount = collected.armor.equipped.length;
  if (scMods?.armor) armorCount = Math.max(0, armorCount + Math.round(scMods.armor));

  const wpnCount = collected.weapons.equipped.length;
  const armCount = collected.armor.equipped.length;

  const results = [];
  for (const [archKey, arch] of Object.entries(archetypes)) {
    let score = 0;

    // 1. Style profile match.
    if (arch.styleProfile && totalEquipped > 0) {
      let similarity = 0;
      const allStyles = new Set([...Object.keys(arch.styleProfile), ...Object.keys(playerProfile)]);
      allStyles.forEach((style) => {
        const ideal = arch.styleProfile[style] || 0;
        const actual = playerProfile[style] || 0;
        const diff = Math.abs(ideal - actual);
        if (ideal > 0 && actual > 0) similarity += 1 - diff;
        else if (ideal > 0 && actual === 0) similarity += 1 - ideal * A.styleMatch.missingPenaltyFactor;
        else if (ideal === 0 && actual > 0) similarity += 1 - actual * A.styleMatch.unexpectedPenaltyFactor;
      });
      const maxSimilarity = allStyles.size;
      score += maxSimilarity > 0 ? (similarity / maxSimilarity) * A.styleMatch.maxPoints : 0;

      // 1b. Primary style gate.
      for (const [style, weight] of Object.entries(arch.styleProfile)) {
        if (weight >= A.primaryGate.weightThreshold && (playerProfile[style] || 0) === 0) {
          score -= weight * A.primaryGate.penaltyMult;
        }
      }

      // 1c. Dominance bonus.
      for (const [style, pct] of Object.entries(playerProfile)) {
        const archExpects = arch.styleProfile[style] || 0;
        const hit = A.dominance.find((d) => pct >= d.pct && archExpects >= d.archExpects);
        if (hit) { score += hit.bonus; break; }
      }

      // 1d. Unexpected style penalty.
      for (const [style, pct] of Object.entries(playerProfile)) {
        if (pct >= A.unexpected.pctThreshold && !arch.styleProfile[style]) score -= pct * A.unexpected.penaltyMult;
      }

      // 1e. Distribution shape bonus.
      const expectedStyles = Object.entries(arch.styleProfile).filter(([, w]) => w >= A.distribution.expectWeight);
      if (expectedStyles.length >= 2) {
        const matched = expectedStyles.filter(([s]) => (playerProfile[s] || 0) >= A.distribution.presentThreshold).length;
        const matchRatio = matched / expectedStyles.length;
        const r = A.distribution.ratios.find((x) => matchRatio >= x.min);
        if (r) score += r.bonus;
      }
    }

    // 2. Anti-style penalty (sc.antiStyle.suppress modulated).
    if (arch.antiStyles) {
      const antiSuppression = scMods?.antiStyleSuppress || 0;
      for (const [style, penalty] of Object.entries(arch.antiStyles)) {
        if (styleCounts[style]) {
          const rawPenalty = penalty * (styleCounts[style] / Math.max(1, totalEquipped));
          score += antiSuppression > 0 ? rawPenalty * (1 - antiSuppression) : rawPenalty;
        }
      }
    }

    // 3. Chrome category match + mismatch.
    const chromeWeight = arch.chromeWeight || A.chrome.defaultWeight;
    const chromeCount = cyberwareData?.totalCount || 0;
    if (arch.chromeProfile && chromeCount > 0) {
      if (arch.chromeProfile === dominantChrome) {
        const styleConfidence = score;
        const chromeBase = Math.min(chromeWeight * 100, A.chrome.matchCap);
        const clothingFactor = Math.min(1, A.chrome.clothingFactorBase + A.chrome.clothingFactorRange * (Math.max(0, styleConfidence) / A.chrome.clothingFactorDivisor));
        score += chromeBase * clothingFactor;
      } else if (dominantChrome !== "none") {
        score += chromeWeight >= A.chrome.mismatch.strongWeight ? A.chrome.mismatch.strongPenalty
          : chromeWeight >= A.chrome.mismatch.midWeight ? A.chrome.mismatch.midPenalty
          : A.chrome.mismatch.weakPenalty;
      }
    }

    // 3b. Chrome quantity.
    if (chromeCount > 0) {
      const expectedChrome = Math.round(chromeWeight * A.chrome.quantity.expectMult) + A.chrome.quantity.expectAdd;
      const excessChrome = Math.max(0, chromeCount - expectedChrome);
      if (excessChrome > 0) score -= excessChrome * A.chrome.quantity.excessPenaltyPer;
    } else if (chromeWeight >= A.chrome.quantity.noChromeWeight) {
      score -= Math.round(chromeWeight * A.chrome.quantity.noChromePenaltyMult);
    }

    // 4. Cost fit.
    if (arch.costExpectation && totalCost > 0) {
      const ce = arch.costExpectation;
      const C = A.cost;
      if (totalCost >= ce.sweet) {
        if (ce.ceiling && totalCost > ce.ceiling) {
          const overRatio = (totalCost - ce.ceiling) / Math.max(1, ce.ceiling);
          score += Math.max(C.ceilingMin, C.ceilingBase - Math.round(overRatio * C.ceilingMult));
        } else {
          score += C.sweetBonus;
        }
      } else if (totalCost >= ce.floor) {
        const range = ce.sweet - ce.floor;
        score += range > 0 ? C.floorPartialBase + Math.round(((totalCost - ce.floor) / range) * C.floorPartialMult) : C.floorPartialFallback;
      } else {
        const deficit = (ce.floor - totalCost) / Math.max(1, ce.floor);
        score -= Math.round(deficit * C.belowFloorMult);
      }
    } else if (arch.costExpectation && totalCost === 0) {
      score -= arch.costExpectation.floor > A.cost.nothingFloorThreshold ? A.cost.nothingPenaltyHigh : A.cost.nothingPenaltyLow;
    }

    // 5. Armor fit.
    if (arch.armorTolerance && armorCount > 0) {
      score += arch.armorTolerance > 0
        ? Math.min(A.armor.posCap, armorCount * (arch.armorTolerance / A.armor.divisor))
        : Math.max(A.armor.negCap, armorCount * (arch.armorTolerance / A.armor.divisor));
    }

    // 6. Role affinity.
    if (roleData && roleData.hasRole && roleProfiles) {
      const primaryProfile = roleProfiles[roleData.primaryRole.key] || roleProfiles.none;
      const tier = roleTier(roleData.primaryRole.rank, A.roleTier);
      const rankScale = A.roleAffinity.tierScale[tier] ?? A.roleAffinity.tierScale.low;
      const aff = primaryProfile.archetypeAffinity;
      const archParent = arch.parent || archKey;
      const inPrimary = aff.primary.includes(archParent) || aff.primary.includes(archKey);
      const inSecondary = aff.secondary.includes(archParent) || aff.secondary.includes(archKey);
      const inConflicting = aff.conflicting.includes(archParent) || aff.conflicting.includes(archKey);

      if (inPrimary) score += Math.round(A.roleAffinity.primary * rankScale);
      else if (inSecondary) score += Math.round(A.roleAffinity.secondary * rankScale);
      else if (inConflicting) score -= Math.round(A.roleAffinity.conflicting * rankScale);

      const wpnTolerance = primaryProfile.weaponTolerance?.baseline || 0;
      const armTolerance = primaryProfile.armorTolerance?.baseline || 0;
      if (inPrimary) {
        if (wpnCount >= wpnTolerance && wpnTolerance > 0) score += Math.round(A.roleAffinity.behavioral.armedBonus * rankScale);
        if (armCount >= armTolerance && armTolerance > 0) score += Math.round(A.roleAffinity.behavioral.armoredBonus * rankScale);
      }
      if (inConflicting && wpnCount > wpnTolerance + 1) score -= Math.round(A.roleAffinity.behavioral.overArmedPenalty * rankScale);
    }

    // sc.archetype.<key> direct injection.
    if (scMods?.archetypes?.[archKey]) score += scMods.archetypes[archKey];

    const confidence = Math.max(0, Math.min(100, Math.round(score)));
    results.push({
      key: archKey,
      label: arch.label,
      confidence,
      description: arch.description,
      styleProfile: arch.styleProfile,
      chromeProfile: arch.chromeProfile,
      chromeWeight: arch.chromeWeight || A.chrome.defaultWeight,
      costExpectation: arch.costExpectation,
      armorTolerance: arch.armorTolerance || 0,
    });
  }

  // W&S sharpens the top read.
  const P = A.postProcess;
  if (socialStats && socialStats.wardrobeAndStyle >= P.wsSharpen.minWS) {
    results.sort((a, b) => b.confidence - a.confidence);
    if (results.length > 0) {
      results[0].confidence = Math.min(100, results[0].confidence + socialStats.wardrobeAndStyle * P.wsSharpen.perLevel);
    }
  }

  // COOL compresses reads toward the mean.
  if (socialStats && socialStats.cool >= P.coolMask.minCool) {
    const avg = results.reduce((sum, r) => sum + r.confidence, 0) / Math.max(1, results.length);
    results.forEach((r) => {
      r.confidence = Math.max(0, Math.min(100, Math.round(r.confidence + (avg - r.confidence) * P.coolMask.factor * ((socialStats.cool - P.coolMask.baseline) / P.coolMask.divisor))));
    });
  }

  results.sort((a, b) => b.confidence - a.confidence);

  // Confidence floor — prepend "Unaffiliated" when the best read is too weak.
  if (results.length === 0 || results[0].confidence < P.confidenceFloor) {
    const U = P.unaffiliated;
    results.unshift({
      key: "unaffiliated",
      label: "Unaffiliated",
      confidence: Math.max(U.base, P.confidenceFloor + (totalEquipped > 0 ? U.withClothing : U.withoutClothing)),
      description: "No strong faction or archetype signal detected. Just another face in the Night City crowd — could be anyone, which in this city might be the smartest play of all.",
      styleProfile: {},
      chromeProfile: "hidden_chrome",
      chromeWeight: 0,
      costExpectation: null,
      armorTolerance: 0,
      isUnaffiliated: true,
    });
  }

  return results;
}
