/**
 * disguise.mjs — disguise confidence (can you pass as faction X?) + disguise DC.
 *
 * Pure; consumes the normalized `collected` set + cyberware aggregation. Faction
 * profiles resolve from config (archetype base + faction overrides via the
 * resolveEffective* helpers); scoring constants come from Tunables (disguise).
 * Output is the Phase 82 shape (incl. the advice strings) + explainability.
 *
 * Ports: StyleRatingCalculator.calculateDisguiseConfidence, .calculateDisguiseDC,
 *        .resolveEffectiveProfile/Chrome/Cost/Armor.
 * Spec: SC-Module-Architecture-Guide.md §29.1 (Stage 5), §4.1, §18
 */

import { getTunables } from "../config/tunables.mjs";

const CHROME_CATEGORIES = ["visible_chrome", "hidden_chrome", "fashionware", "bioware", "borgware", "display_chrome", "combat_chrome"];
const human = (cat) => cat.replace(/_/g, " ");

// ── faction-mod resolution (archetype base + faction overrides) ─────────────

export function resolveEffectiveProfile(archetypeKey, factionKey, archetypes, factions) {
  const archetype = archetypes[archetypeKey];
  if (!archetype?.styleProfile) return {};
  const profile = { ...archetype.styleProfile };
  const mods = factions[factionKey]?.styleModifiers;
  if (!mods) return profile;
  for (const [style, delta] of Object.entries(mods)) profile[style] = (profile[style] || 0) + delta;
  for (const key of Object.keys(profile)) if (profile[key] <= 0) delete profile[key];
  const total = Object.values(profile).reduce((sum, v) => sum + v, 0);
  if (total > 0 && Math.abs(total - 1) > 0.001) {
    for (const key of Object.keys(profile)) profile[key] = Math.round((profile[key] / total) * 10000) / 10000;
  }
  return profile;
}

export function resolveEffectiveChrome(archetypeKey, factionKey, archetypes, factions, defaults) {
  const archetype = archetypes[archetypeKey];
  if (!archetype) return { profile: defaults.chromeProfile, weight: defaults.chromeWeight };
  const faction = factions[factionKey];
  return {
    profile: faction?.chromeOverride || archetype.chromeProfile || "hidden_chrome",
    weight: Math.max(0, Math.min(1, (archetype.chromeWeight || defaults.chromeWeight) + (faction?.chromeWeightMod || 0))),
  };
}

export function resolveEffectiveCost(archetypeKey, factionKey, archetypes, factions, defaults) {
  const archetype = archetypes[archetypeKey];
  if (!archetype?.costExpectation) return { ...defaults.cost };
  const override = factions[factionKey]?.costOverride;
  if (!override) return archetype.costExpectation;
  return {
    floor: override.floor ?? archetype.costExpectation.floor,
    sweet: override.sweet ?? archetype.costExpectation.sweet,
    ceiling: override.ceiling ?? archetype.costExpectation.ceiling,
  };
}

export function resolveEffectiveArmor(archetypeKey, factionKey, archetypes, factions) {
  const archetype = archetypes[archetypeKey];
  if (!archetype) return 0;
  return (archetype.armorTolerance || 0) + (factions[factionKey]?.armorMod || 0);
}

// ── disguise confidence ─────────────────────────────────────────────────────

/**
 * @param {object} p
 * @param {object} p.collected        Stage-1 set (styles, equippedClothing, totalCost, armor)
 * @param {object} p.cyberwareData
 * @param {string} p.targetFactionKey
 * @param {object} p.factions          FACTIONS (config)
 * @param {object} p.archetypes        FACTION_ARCHETYPES (config)
 * @param {object} [p.tunables]
 * @returns Phase 82 disguise result + explainability
 */
export function confidence({ collected, cyberwareData, targetFactionKey, factions, archetypes, tunables = getTunables() }) {
  const D = tunables.disguise;
  const emptyResult = { confidence: 0, label: "BLOWN", styleMatch: 0, totalRequired: 0, chromeMatch: false, clashPenalty: 0, disguiseDifficulty: 0, need: [], remove: [], breakdown: {} };
  const faction = factions[targetFactionKey];
  if (!faction) return emptyResult;
  const archetype = archetypes[faction.archetype];
  if (!archetype) return emptyResult;

  const profileStyles = resolveEffectiveProfile(faction.archetype, targetFactionKey, archetypes, factions);
  const effectiveChrome = resolveEffectiveChrome(faction.archetype, targetFactionKey, archetypes, factions, D.defaults);
  const effectiveCost = resolveEffectiveCost(faction.archetype, targetFactionKey, archetypes, factions, D.defaults);
  const effectiveArmorTol = resolveEffectiveArmor(faction.archetype, targetFactionKey, archetypes, factions);
  const profileKeys = Object.keys(profileStyles);

  // Player distribution from collected.
  const playerStyles = { ...collected.styles };
  const totalEquipped = collected.equippedClothing.length;
  const totalCost = collected.totalCost;
  const playerProfile = {};
  for (const [style, count] of Object.entries(playerStyles)) {
    playerProfile[style] = totalEquipped > 0 ? count / totalEquipped : 0;
  }

  // --- STYLE DISTRIBUTION MATCH ---
  const DIST = D.distribution;
  let distributionScore = 0;
  const styleBreakdown = [];
  const need = [];
  let weightedMatchSum = 0;
  let totalWeight = 0;
  profileKeys.forEach((style) => {
    const ideal = profileStyles[style] || 0;
    const actual = playerProfile[style] || 0;
    if (ideal <= 0) return;
    const matchQuality = Math.min(1.0, actual / ideal);
    weightedMatchSum += matchQuality * ideal;
    totalWeight += ideal;
    const matchPct = Math.min(100, Math.round(matchQuality * 100));
    styleBreakdown.push({
      style,
      idealPct: Math.round(ideal * 100),
      actualPct: Math.round(actual * 100),
      matchPct,
      count: playerStyles[style] || 0,
      status: matchPct >= DIST.status.good ? "good" : matchPct >= DIST.status.partial ? "partial" : "missing",
    });
    if (matchPct < DIST.status.partial) need.push(style);
  });
  distributionScore = totalWeight > 0 ? (weightedMatchSum / totalWeight) * DIST.maxPoints : 0;

  const primaryExpected = profileKeys.reduce((best, s) => ((profileStyles[s] || 0) > (profileStyles[best] || 0) ? s : best), profileKeys[0]);
  if (primaryExpected && (profileStyles[primaryExpected] || 0) >= DIST.primaryGate.weightThreshold && (playerProfile[primaryExpected] || 0) === 0) {
    distributionScore = Math.max(0, distributionScore - DIST.primaryGate.penalty);
  }
  const unexpectedWeight = Object.entries(playerProfile).filter(([style]) => !profileStyles[style]).reduce((sum, [, pct]) => sum + pct, 0);
  if (unexpectedWeight > DIST.unexpectedDilution.threshold) {
    distributionScore = Math.max(0, distributionScore - Math.round(unexpectedWeight * DIST.unexpectedDilution.penaltyMult));
  }
  styleBreakdown.sort((a, b) => a.matchPct - b.matchPct);

  // --- ANTI-STYLE PENALTY ---
  let antiStylePenalty = 0;
  const antiStyleHits = [];
  if (archetype.antiStyles) {
    for (const [style, penalty] of Object.entries(archetype.antiStyles)) {
      if (playerStyles[style]) {
        const hit = Math.abs(penalty) * (playerStyles[style] / Math.max(1, totalEquipped));
        antiStylePenalty = Math.min(D.antiStyle.cap, antiStylePenalty + hit);
        antiStyleHits.push({ style, count: playerStyles[style], penalty: Math.round(hit) });
      }
    }
  }

  // --- CHROME ANALYSIS ---
  const CH = D.chrome;
  const chromeCounts = cyberwareData?.profileCounts || null;
  const chromeSorted = CHROME_CATEGORIES
    .map((cat) => ({ cat, count: chromeCounts ? chromeCounts[cat] : cyberwareData?.[cat]?.length || 0 }))
    .sort((a, b) => b.count - a.count);
  const totalChrome = chromeSorted.reduce((sum, c) => sum + c.count, 0);
  const dominantChrome = chromeSorted[0]?.count > 0 ? chromeSorted[0].cat : "none";
  const targetChrome = effectiveChrome.profile;
  const chromeMatch = dominantChrome === targetChrome;
  const chromeDetail = {};
  CHROME_CATEGORIES.forEach((cat) => { chromeDetail[cat] = chromeCounts ? chromeCounts[cat] : cyberwareData?.[cat]?.length || 0; });

  const chromeMaxPoints = CH.maxPoints;
  let chromeScore = 0;
  const chromeIssues = [];
  const chromeAdvice = [];
  if (totalChrome === 0) {
    if (targetChrome === "hidden_chrome") {
      chromeScore = Math.round(chromeMaxPoints * CH.noChrome.hidden_chrome);
      chromeAdvice.push("No chrome detected — passable for hidden chrome factions since their implants aren't visible either");
    } else if (targetChrome === "bioware") {
      chromeScore = Math.round(chromeMaxPoints * CH.noChrome.bioware);
      chromeAdvice.push("No chrome detected — bioware is subtle but total lack of enhancement may seem off");
    } else {
      chromeScore = 0;
      chromeIssues.push(`${human(targetChrome)} expected but you're running clean — conspicuous`);
      chromeAdvice.push(`Install some ${human(targetChrome)} to sell the look`);
    }
  } else if (chromeMatch) {
    chromeScore = chromeMaxPoints;
  } else {
    const targetCount = chromeDetail[targetChrome] || 0;
    const targetRatio = totalChrome > 0 ? targetCount / totalChrome : 0;
    if (targetRatio >= CH.mismatch.partialRatio) {
      chromeScore = Math.round(chromeMaxPoints * CH.mismatch.partialScore);
      chromeIssues.push(`You have some ${human(targetChrome)} but your ${human(dominantChrome)} dominates`);
      chromeAdvice.push(`Add more ${human(targetChrome)} or reduce ${human(dominantChrome)}`);
    } else if (targetCount > 0) {
      chromeScore = Math.round(chromeMaxPoints * CH.mismatch.someScore);
      chromeIssues.push(`Only ${targetCount} ${human(targetChrome)} piece${targetCount > 1 ? "s" : ""} — not enough`);
      chromeAdvice.push(`Need more ${human(targetChrome)} to be convincing`);
    } else {
      chromeScore = 0;
      chromeIssues.push(`Zero ${human(targetChrome)} — ${human(dominantChrome)} reads wrong`);
      chromeAdvice.push(`Install ${human(targetChrome)} to have any chance`);
    }
  }

  let chromeVisibilityPenalty = 0;
  const totalVisibleChrome = (chromeDetail.visible_chrome || 0) + (chromeDetail.borgware || 0);
  if (totalChrome > 0 && targetChrome !== "visible_chrome" && targetChrome !== "borgware" && totalVisibleChrome > 0) {
    const visRatio = totalVisibleChrome / totalChrome;
    if (visRatio > CH.visibility.heavyRatio) {
      chromeVisibilityPenalty = CH.visibility.heavyPenalty;
      chromeIssues.push("Heavy visible chrome impossible to hide — made on sight");
    } else if (visRatio > CH.visibility.modRatio) {
      chromeVisibilityPenalty = CH.visibility.modPenalty;
      chromeIssues.push("Visible chrome stands out for a concealed-chrome faction");
    }
  }
  if (totalChrome > 0 && (targetChrome === "visible_chrome" || targetChrome === "borgware") && totalVisibleChrome === 0) {
    chromeVisibilityPenalty = CH.visibility.flauntPenalty;
    chromeIssues.push("Target faction flaunts chrome — your hidden setup looks wrong");
    chromeAdvice.push("Need obvious, external chrome to fit in");
  }
  chromeScore = Math.max(0, chromeScore - chromeVisibilityPenalty);

  // --- COST FIT ---
  const CO = D.cost;
  let costScore = 0;
  let costStatus = "unknown";
  const ce = effectiveCost;
  if (ce.floor !== undefined) {
    if (totalCost >= (ce.sweet || 0)) {
      if (ce.ceiling && totalCost > ce.ceiling) {
        const overRatio = Math.min(1, (totalCost - ce.ceiling) / Math.max(1, ce.ceiling));
        costScore = Math.max(CO.overMin, CO.overBase - Math.round(overRatio * CO.overMult));
        costStatus = "over";
      } else {
        costScore = CO.sweetScore;
        costStatus = "ideal";
      }
    } else if (totalCost >= (ce.floor || 0)) {
      const range = (ce.sweet || 0) - (ce.floor || 0);
      costScore = range > 0 ? CO.betweenBase + Math.round(((totalCost - ce.floor) / range) * CO.betweenMult) : CO.betweenFallback;
      costStatus = "acceptable";
    } else if (totalCost > 0) {
      const floorRatio = totalCost / Math.max(1, ce.floor);
      costScore = Math.round(floorRatio * CO.belowMult);
      costStatus = "too_cheap";
    } else {
      costScore = 0;
      costStatus = "too_cheap";
    }
  }

  // --- ARMOR FIT ---
  const AR = D.armor;
  let armorScore = 0;
  const armorCount = collected.armor.equipped.length;
  if (effectiveArmorTol && armorCount > 0) {
    armorScore = effectiveArmorTol > 0
      ? Math.min(AR.posCap, armorCount * (effectiveArmorTol / AR.posDiv))
      : Math.max(AR.negCap, armorCount * (effectiveArmorTol / AR.negDiv));
  }

  // --- RIVAL STYLE CLASH ---
  const CL = D.clash;
  let clashPenalty = 0;
  const remove = [];
  const rivalArchetypes = new Set();
  (faction.rivals || []).forEach((r) => { if (factions[r]) rivalArchetypes.add(factions[r].archetype); });
  for (const [archKey, archData] of Object.entries(archetypes)) {
    if (rivalArchetypes.has(archKey)) {
      const rivalStyles = archData.styleProfile ? Object.keys(archData.styleProfile) : [];
      rivalStyles.forEach((s) => {
        if (playerStyles[s] && (archData.styleProfile[s] || 0) > CL.rivalWeightThreshold) {
          if (!profileStyles[s] || profileStyles[s] < CL.profileThreshold) {
            clashPenalty = Math.min(CL.cap, clashPenalty + playerStyles[s] * CL.perStyleMult);
            remove.push(s);
          }
        }
      });
    }
  }

  // --- DIFFICULTY & FINAL ---
  const difficultyMult = Math.max(D.difficulty.floor, D.difficulty.base - (faction.disguiseDifficulty - 1) * D.difficulty.perLevel);
  const rawScore = distributionScore + chromeScore + costScore + armorScore - antiStylePenalty - clashPenalty;
  let conf = Math.round(rawScore * difficultyMult);
  conf = Math.max(0, Math.min(100, conf));

  let label = "BLOWN";
  if (conf >= D.labels.convincing) label = "CONVINCING";
  else if (conf >= D.labels.passable) label = "PASSABLE";
  else if (conf >= D.labels.risky) label = "RISKY";
  else if (conf >= D.labels.suspicious) label = "SUSPICIOUS";

  return {
    confidence: conf,
    label,
    styleMatch: styleBreakdown.filter((s) => s.status === "good").length,
    totalRequired: profileKeys.length,
    chromeMatch,
    chromeScore,
    clashPenalty: Math.min(CL.cap, Math.round(clashPenalty)),
    disguiseDifficulty: faction.disguiseDifficulty,
    difficultyMult,
    need,
    remove: [...new Set(remove)],
    breakdown: {
      distribution: Math.round(distributionScore),
      chrome: chromeScore,
      chromeMax: chromeMaxPoints,
      cost: costScore,
      costStatus,
      totalCost,
      costExpectation: effectiveCost,
      antiStyle: Math.round(antiStylePenalty),
      antiStyleHits,
      clash: Math.round(clashPenalty),
      difficultyMult,
      rawScore: Math.round(rawScore),
      armor: Math.round(armorScore),
      armorTolerance: effectiveArmorTol,
      styleBreakdown,
      chromeDetail,
      dominantChrome,
      targetChrome,
      totalChrome,
      chromeVisibilityPenalty: chromeVisibilityPenalty || 0,
      chromeIssues: chromeIssues || [],
      chromeAdvice: chromeAdvice || [],
    },
    // explainability
    value: conf,
    blurb: `Reads as ${label.toLowerCase()} (${conf}%) ${faction.label ?? targetFactionKey}.`,
    tunablesApplied: { "disguise.labels": D.labels, "disguise.difficulty": D.difficulty },
  };
}

// ── disguise DC ───────────────────────────────────────────────────────────────

/** Disguise DC from base confidence + social stats. */
export function dc(baseConfidence, socialStats = null, tunables = getTunables()) {
  const D = tunables.disguise.dc;
  const ss = socialStats || { cool: 0, personalGrooming: 0, wardrobeAndStyle: 0, reputation: 0 };
  const baseDC = D.base + Math.round(baseConfidence / D.perConf);
  const wsBonus = Math.floor(ss.wardrobeAndStyle / D.wsDiv);
  const groomBonus = Math.floor(ss.personalGrooming / D.groomDiv);
  const coolBonus = Math.floor(ss.cool / D.coolDiv);
  const repPenalty = Math.floor(ss.reputation / D.repDiv);
  const finalDC = Math.max(D.min, baseDC + wsBonus + groomBonus + coolBonus - repPenalty);
  return {
    dc: finalDC,
    baseDC,
    wsBonus,
    groomBonus,
    coolBonus,
    repPenalty,
    breakdown: `Base ${baseDC}${wsBonus ? " + W&S " + wsBonus : ""}${groomBonus ? " + Groom " + groomBonus : ""}${coolBonus ? " + COOL " + coolBonus : ""}${repPenalty ? " - Rep " + repPenalty : ""} = DC ${finalDC}`,
  };
}

/**
 * Apply an actor's sc-key / styleData modifiers to a computed disguise read —
 * port of the macro's GM detection-scan injections (§9892–9907):
 *  · `sc.faction.<target>` boosts confidence toward THAT faction (clamped 0–100),
 *    relabelling on the scInjection bands (DEEP COVER … BLOWN);
 *  · `sc.disguise.dc` raises the DC the viewer must beat.
 * No-ops (returns the inputs untouched) when scMods carries nothing relevant.
 *
 * @param {object} p
 * @param {number} p.confidence        confidence() result value (0–100)
 * @param {string} p.label             confidence() label
 * @param {number} p.dcTarget          dc() result value
 * @param {object} p.scMods            collectScMods() output (may be null)
 * @param {string} p.targetFactionKey  the faction being impersonated
 * @param {object} [p.tunables]
 * @returns {{confidence, label, dcTarget, factionBoost, dcBoost, applied}}
 */
export function applyScModsToDisguise({ confidence: conf, label, dcTarget, scMods, targetFactionKey, tunables = getTunables() }) {
  const factionBoost = scMods?.factions?.[targetFactionKey] || 0;
  const dcBoost = scMods?.disguiseDC || 0;
  if (!factionBoost && !dcBoost) return { confidence: conf, label, dcTarget, factionBoost: 0, dcBoost: 0, applied: false };

  let confidence = conf;
  if (factionBoost) {
    confidence = Math.max(0, Math.min(100, conf + factionBoost));
    label = confidenceBand(confidence, tunables);
  }
  return { confidence, label, dcTarget: dcTarget + dcBoost, factionBoost, dcBoost, applied: true };
}

/** Detection-scan confidence band (the macro's §9895 vocabulary; scInjection tunables). */
export function confidenceBand(confidence, tunables = getTunables()) {
  const B = tunables.disguise.scInjection;
  return confidence >= B.deepCover ? "DEEP COVER"
    : confidence >= B.convincing ? "CONVINCING"
    : confidence >= B.passable ? "PASSABLE"
    : confidence >= B.suspicious ? "SUSPICIOUS" : "BLOWN";
}

/**
 * Wearing the target group's uniform IS a disguise toward that group (§21.2, M6.5):
 * a graded soft-uniform match adds a tunable confidence bonus (re-banded). No-ops
 * on "none"/missing matches.
 * @param {object} p
 * @param {number} p.confidence
 * @param {string} p.label
 * @param {object|null} p.uniformMatch  matchSoftUniform() result (or null)
 * @param {object} [p.tunables]
 * @returns {{confidence, label, uniformBonus, grade, applied}}
 */
export function applyUniformToDisguise({ confidence: conf, label, uniformMatch, tunables = getTunables() }) {
  const grade = uniformMatch?.grade;
  const bonus = grade === "full" || grade === "partial" ? tunables.uniforms.disguiseBonus[grade] : 0;
  if (!bonus) return { confidence: conf, label, uniformBonus: 0, grade: grade ?? "none", applied: false };
  const confidence = Math.max(0, Math.min(100, conf + bonus));
  return { confidence, label: confidenceBand(confidence, tunables), uniformBonus: bonus, grade, applied: true };
}

/**
 * Fold the dress register into a disguise confidence (§28, M9.1): passing wants
 * the right REGISTER, not just the right style — a corpo cover in streetwear
 * loses confidence per register step off the expectation. Mirrors
 * applyUniformToDisguise; no-op when the cover has no register expectation.
 * @param {object} p
 * @param {number} p.confidence        confidence() output value
 * @param {string} p.label             its band label
 * @param {number} p.register          the outfit's dress register (engine/formality.mjs)
 * @param {number|null} [p.expectedRegister] the cover's expected register
 * @param {object} [p.tunables]
 * @returns {{confidence, label, formalityPenalty, steps, applied}}
 */
export function applyFormalityToDisguise({ confidence: conf, label, register, expectedRegister = null, tunables = getTunables() }) {
  const F = tunables.formality.disguise;
  if (expectedRegister == null) return { confidence: conf, label, formalityPenalty: 0, steps: 0, applied: false };
  const steps = Math.max(0, Math.abs(register - expectedRegister) - F.tolerance);
  if (!steps) return { confidence: conf, label, formalityPenalty: 0, steps, applied: false };
  const formalityPenalty = steps * F.penaltyPerStep;
  const confidence = Math.max(0, Math.min(100, conf - formalityPenalty));
  return { confidence, label: confidenceBand(confidence, tunables), formalityPenalty, steps, applied: true };
}

/**
 * Resolve whether a viewer sees through a disguise: (perception + familiarity) vs DC.
 * Port of GMDashboardApp.evaluateDisguise's detection step (the confidence/DC math
 * lives in confidence()/dc(); this is just the final check).
 * @param {object} p
 * @param {number} p.dcTarget          the disguise DC the viewer must beat
 * @param {number} p.viewerPerception  the NPC's perception
 * @param {boolean} [p.isFamiliarFaction] NPC belongs to the faction the target reads as → +bonus
 * @param {object} [p.tunables]
 * @returns {{detected, margin, familiarityBonus, dcTarget}}
 */
export function disguiseDetection({ dcTarget, viewerPerception, isFamiliarFaction = false, tunables = getTunables() }) {
  const familiarityBonus = isFamiliarFaction ? tunables.gm.disguise.familiarityBonus : 0;
  const effective = viewerPerception + familiarityBonus;
  return { detected: effective >= dcTarget, margin: effective - dcTarget, familiarityBonus, dcTarget };
}
