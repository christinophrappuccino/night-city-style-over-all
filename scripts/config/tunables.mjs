/**
 * tunables.mjs — every formula constant the engine uses (guide §18).
 *
 * NO formula constant is ever inlined in engine code (CLAUDE.md rule 6, §4.1). Each
 * weight / threshold / cap / baseline / DC / curve lives here, grouped per §18.3, so
 * the GM can retune behavior without touching structure (Tuning Panel, M3/M9) and the
 * breakdown UI (§19) can show WHICH value applied via `tunablesApplied`.
 *
 * Extraction happens DURING M2: as each engine module is pulled out of the macro, its
 * literals land in the matching group below (verbatim from stylechecker2_0_Phase82.js,
 * not the guide's rounded examples). Groups marked PENDING fill in with their module.
 *
 * The engine reads via getTunables() so a settings overlay (Config App, M3) can later
 * shadow these defaults without changing call sites.
 *
 * Spec: SC-Module-Architecture-Guide.md §18, §4.1 (Explainability Rule)
 */

/**
 * Default tunables. Shape is stable; values are filled per-module during M2.
 * @type {Record<string, object>}
 */
export const TUNABLES_DEFAULTS = {
  // ── Style scoring (M2.2: profile.mjs) ─────────────────────────────── EXTRACTED
  // NOTE: the primary weights/scalers/bonuses/socialModifiers are CONFIG data
  // (config/ratings.mjs RATING_FORMULA, already GM-editable). These are the
  // constants that were still hardcoded inside calculateFullRating/cohesion/synergy.
  styleScoring: {
    // Diminishing-returns curve on raw clothing cost (eb breakpoints).
    clothingDiminish: { fullUpTo: 1000, halfBandUpTo: 5000, halfRate: 0.5, quarterRate: 0.25 },
    // Flat style points contributed per fashionware piece (before its scaler/weight).
    fashionwarePointsPerItem: 20,
    // Matching-set bonus gates (count of most-common style).
    matchingSetMin: 3,
    signatureLookMin: 5,
    // Synergy: cohesion ratio → 0–10 scale.
    synergyScale: 10,
    // Role-style alignment shaping.
    roleAlign: {
      missingPenaltyFactor: 1.5,  // role expects, player missing → 1 − ideal·1.5
      offBrandPenaltyFactor: 1.3, // player has, role doesn't → 1 − actual·1.3
      noDistributionAlign: 0.5,   // alignment when no comparable styles
      rankDivisor: 8,             // rankFactor = (rank − 1) / 8
      lowBase: 0.90, lowDrop: 0.20,   // lowBound: 0.90 → 0.70
      highBase: 1.10, highRise: 0.10, // highBound: 1.10 → 1.20
      labels: { perfect: 0.75, good: 0.55, passable: 0.40 },
    },
    // Role cost-fit shaping.
    roleCost: {
      sweetCap: 25, sweetRate: 12,        // at/above sweet: min(25, ratio·12)
      acceptableMax: 10, acceptableFallback: 5,
      underdressedRate: 20,               // below floor: −round(deficit·20)
    },
    // Cohesion label gates (percent) + W&S gap-closing.
    cohesion: { signature: 80, coordinated: 60, mixed: 40, wsGapReductionPerLevel: 0.05 },
  },

  // ── Anti-style (M2.x: profile.mjs / disguise.mjs) ─────────────────── PENDING
  antiStyle: {
    // penalty range + per-clash scaling
  },

  // ── Archetype detection (M2.3: archetypes.mjs) ────────────────────── EXTRACTED
  archetypes: {
    styleMatch: { maxPoints: 40, missingPenaltyFactor: 1.5, unexpectedPenaltyFactor: 1.3 },
    primaryGate: { weightThreshold: 0.35, penaltyMult: 20 },
    dominance: [
      { pct: 0.85, archExpects: 0.40, bonus: 12 },
      { pct: 0.70, archExpects: 0.35, bonus: 8 },
      { pct: 0.55, archExpects: 0.30, bonus: 4 },
    ],
    unexpected: { pctThreshold: 0.25, penaltyMult: 8 },
    distribution: { expectWeight: 0.15, presentThreshold: 0.10, ratios: [{ min: 0.75, bonus: 6 }, { min: 0.50, bonus: 3 }] },
    chrome: {
      defaultWeight: 0.15,
      matchCap: 15, clothingFactorBase: 0.3, clothingFactorRange: 0.7, clothingFactorDivisor: 40,
      mismatch: { strongWeight: 0.30, strongPenalty: -8, midWeight: 0.15, midPenalty: -4, weakPenalty: -2 },
      quantity: { expectMult: 30, expectAdd: 2, excessPenaltyPer: 1.5, noChromeWeight: 0.25, noChromePenaltyMult: 12 },
    },
    cost: {
      sweetBonus: 20, ceilingBase: 5, ceilingMult: 10, ceilingMin: -5,
      floorPartialBase: 5, floorPartialMult: 15, floorPartialFallback: 10,
      belowFloorMult: 25, nothingFloorThreshold: 100, nothingPenaltyHigh: 15, nothingPenaltyLow: 5,
    },
    armor: { divisor: 5, posCap: 10, negCap: -10 },
    roleAffinity: {
      tierScale: { legendary: 1.0, high: 0.8, mid: 0.5, low: 0.25 },
      primary: 22, secondary: 12, conflicting: 14,
      behavioral: { armedBonus: 4, armoredBonus: 3, overArmedPenalty: 3 },
    },
    roleTier: { legendary: 10, high: 7, mid: 4, low: 1 },
    postProcess: {
      wsSharpen: { minWS: 5, perLevel: 2 },
      coolMask: { minCool: 7, factor: 0.1, baseline: 6, divisor: 4 },
      confidenceFloor: 20,
      unaffiliated: { base: 25, withClothing: 5, withoutClothing: 15 },
    },
  },

  // ── Ratings (M2.2: ratings.mjs) ───────────────────────────────────── EXTRACTED
  ratings: {
    // calculateDripRating cost→label table (verbatim from Phase 82), highest first.
    dripTiers: [
      { minCost: 50000, rating: "👑 Living Monument", tier: 9, grade: "SSS" },
      { minCost: 20000, rating: "⚡ Dynasty Drip", tier: 8, grade: "SS" },
      { minCost: 10000, rating: "🔥 Top Shelf Trouble", tier: 7, grade: "S+" },
      { minCost: 5000, rating: "🌟 Flex Fiend", tier: 6, grade: "S" },
      { minCost: 2500, rating: "💎 Hustle Couture", tier: 5, grade: "A" },
      { minCost: 1000, rating: "💧 Fresh Off the Rack", tier: 4, grade: "B" },
      { minCost: 300, rating: "🌫️ Mid-tier Mediocre", tier: 3, grade: "C" },
      { minCost: 100, rating: "🚫 Slumming It", tier: 2, grade: "D" },
      { minCost: 0, rating: "❌ Fashion Disaster", tier: 1, grade: "F" },
    ],
  },

  // ── Heat (M2.3: heat.mjs) ─────────────────────────────────────────── EXTRACTED
  // (Per-role weapon/armor/style tolerances live in config ROLE_PROFILES.)
  heat: {
    styleOutlierMultiplier: 30, // styleHeat = |score/sceneAvg − 1| · 30
    weapon: { drawnFirst: 16, drawnEach: 12, carriedFirst: 5, carriedEach: 3, toleratedHeatPerWeapon: 10 },
    chrome: { threshold: 30, ratePerPct: 0.4 }, // (chromePercent − 30) · 0.4
    armor: { minPieces: 2, perExtraPiece: 6 },   // (count − 1) · 6 when count ≥ 2
    rep: { lowRate: 3, midRate: 2, highRate: 1, lowCap: 4, midCap: 8 },
    coolPerPoint: 2,                              // cool · 2 · roleCoolMask
    levels: { blazing: 75, hot: 50, warm: 25 },
    ammo: {
      varieties: {
        rocket: { base: 15, perUnit: 3, cap: 30 },
        grenade: { base: 8, perUnit: 1.5, cap: 20 },
        arrow: { base: 4, perUnit: 0.5, cap: 10 },
      },
      defaultPerVariety: { base: 5, perUnit: 1, cap: 15 },
      totalCap: 40, // AMMO_HEAT_TOTAL_CAP
    },
    // Wound/injury heat folded into scMods.heat for the SELF view (macro initialize(),
    // §12406–12418): blood and visible injuries draw eyes. The terrifying-injury name
    // list is shared with danger (danger.injury.terrifyingNames) — one list, no drift.
    woundInjury: {
      woundTiers: [{ maxPct: 25, heat: 12 }, { maxPct: 50, heat: 8 }, { maxPct: 75, heat: 3 }],
      terrifyingInjuryHeat: 4,
      otherInjuryHeat: 3,
    },
  },

  // ── Danger (M2.3: danger.mjs) ─────────────────────────────────────── EXTRACTED
  danger: {
    weapon: { drawnFirst: 18, drawnEach: 12, holsteredFirst: 5, holsteredEach: 3 },
    armor: { base: 6, perExtra: 4 }, // count ≥ 1 ? 6 + (count − 1)·4
    chrome: { visiblePerPiece: 4, visibleCap: 15, borgFlat: 15 },
    ammo: { rate: 0.8, cap: 15 }, // min(15, round(ammoTotal·0.8))
    body: [{ min: 10, pts: 10 }, { min: 7, pts: 5 }, { min: 5, pts: 2 }],
    humanity: { tiers: [{ maxPct: 20, pts: 15 }, { maxPct: 40, pts: 10 }, { maxPct: 60, pts: 5 }], cyberpsychoFlag: 5 },
    wounds: [{ maxPct: 25, pts: -10 }, { maxPct: 50, pts: 8 }, { maxPct: 75, pts: 3 }],
    injury: {
      terrifying: 6, impaired: -4, scarred: 3, severeBonus: 2,
      stack: [{ min: 4, pts: 10 }, { min: 3, pts: 5 }, { min: 2, pts: 2 }],
      terrifyingNames: ["Dismembered Arm", "Dismembered Hand", "Dismembered Leg", "Lost Eye", "Lost Ear", "Cracked Skull", "Crushed Windpipe"],
      impairedNames: ["Brain Injury", "Concussion", "Spinal Injury", "Collapsed Lung", "Whiplash"],
    },
    stats: { coolRate: 3, repRate: 3 },
    role: {
      highKeys: ["solo", "lawman"], midKeys: ["nomad", "exec"],
      highMult: 1.2, midMult: 1.0, lowMult: 0.85,
      rankScaleBase: 0.7, rankScalePerRank: 0.03, rankCap: 10,
    },
    coolMasking: { threshold: 6, perPointOver5: 2.5 }, // cool ≥ 6 ? round((cool − 5)·2.5) : 0
    tiers: { extreme: 80, high: 55, moderate: 30 },
    colors: { extreme: "#ff00ff", high: "#dc3545", moderate: "#ffc107", low: "#28a745" },
  },

  // ── Disguise (M2.4: disguise.mjs) ─────────────────────────────────── EXTRACTED
  disguise: {
    distribution: {
      maxPoints: 50,
      primaryGate: { weightThreshold: 0.25, penalty: 12 },
      unexpectedDilution: { threshold: 0.35, penaltyMult: 10 },
      status: { good: 80, partial: 40 },
    },
    antiStyle: { cap: 20 },
    chrome: {
      maxPoints: 20,
      noChrome: { hidden_chrome: 0.48, bioware: 0.32 },
      mismatch: { partialRatio: 0.3, partialScore: 0.60, someScore: 0.32 },
      visibility: { heavyRatio: 0.5, heavyPenalty: 12, modRatio: 0.25, modPenalty: 6, flauntPenalty: 8 },
    },
    cost: { overBase: 15, overMult: 10, overMin: 5, betweenBase: 8, betweenMult: 12, betweenFallback: 12, belowMult: 6, sweetScore: 20 },
    armor: { posCap: 10, posDiv: 5, negCap: -5, negDiv: 8 },
    clash: { cap: 15, perStyleMult: 8, rivalWeightThreshold: 0.25, profileThreshold: 0.15 },
    difficulty: { floor: 0.60, base: 1.0, perLevel: 0.10 },
    labels: { convincing: 80, passable: 60, risky: 40, suspicious: 20 },
    defaults: { chromeProfile: "visible_chrome", chromeWeight: 0.20, cost: { floor: 0, sweet: 500, ceiling: null } },
    dc: { base: 10, perConf: 10, wsDiv: 2, groomDiv: 3, coolDiv: 3, repDiv: 2, min: 5 },
    // sc.faction / sc.disguise.dc injection into the GM detection scan (macro
    // §9892–9907): confidence-band relabel thresholds after the faction boost.
    scInjection: { deepCover: 80, convincing: 60, passable: 40, suspicious: 20 },
  },

  // ── Districts (M2.4: districts.mjs) ───────────────────────────────── EXTRACTED
  districts: {
    // Role tension escalates visual danger, never reduces it.
    escalation: { NEUTRAL: 0, FRIENDLY: 1, MIXED: 2, HOSTILE: 3 },
    roleEscalation: { HOSTILE: 3, WARY: 2 }, // else 0
    // District-type threat tolerance table (verbatim from Phase 82).
    threatTolerance: {
      corpo: { chromePenaltyStart: 20, chromePenaltyPer: -0.6, weaponPenalty: -8, armorPenalty: -5, label: "Corporate security flags visible augmentation and weaponry." },
      luxury: { chromePenaltyStart: 15, chromePenaltyPer: -0.8, weaponPenalty: -10, armorPenalty: -6, label: "Elite venues have zero tolerance for visible threats." },
      danger: { chromePenaltyStart: 70, chromePenaltyPer: -0.1, weaponPenalty: 0, armorPenalty: 0, label: "Everyone is armed and chromed. Nobody cares." },
      military: { chromePenaltyStart: 40, chromePenaltyPer: -0.3, weaponPenalty: -4, armorPenalty: 0, label: "Military expects discipline. Non-standard chrome draws scrutiny." },
      industrial: { chromePenaltyStart: 50, chromePenaltyPer: -0.2, weaponPenalty: -3, armorPenalty: -2, label: "Workers are used to chrome. Weapons make people nervous." },
      mixed: { chromePenaltyStart: 40, chromePenaltyPer: -0.3, weaponPenalty: -4, armorPenalty: -2, label: "Average tolerance. Heavy chrome and weapons stand out." },
      wasteland: { chromePenaltyStart: 80, chromePenaltyPer: -0.05, weaponPenalty: 0, armorPenalty: 0, label: "No law, no judgment. Survive however you can." },
      university: { chromePenaltyStart: 25, chromePenaltyPer: -0.5, weaponPenalty: -7, armorPenalty: -4, label: "Students and academics. Heavy chrome and weapons cause panic." },
    },
  },

  // ── Perception (M2.4: perception.mjs) ─────────────────────────────── EXTRACTED
  perception: {
    scanThresholds: { minimal: 12, partial: 15, full: 17 }, // INT+PER+1d10 vs these
    coolShiftDivisor: 3, // counter-scan: +1 threshold per 3 target COOL
  },

  // ── Budget planner (M2.5: recommendations.mjs) ────────────────────── EXTRACTED
  // optimizeBudget's numeric dials. English copy (slot/fixer comments) is content,
  // not a formula constant, so it stays inline in the engine — only the numbers and
  // the style-cost table live here.
  budget: {
    highRankThreshold: 4, // rank ≥ 4 ⇒ isHighRank
    slotCaps: { hats: 1, top: 2, jacket: 1, bottoms: 2, footwear: 1, glasses: 1, jewelry: 4 },
    slotOrder: ["hats", "top", "jacket", "bottoms", "footwear", "glasses", "jewelry"],
    slotLabels: { hats: "Head", top: "Body", jacket: "Jacket", bottoms: "Legs", footwear: "Feet", glasses: "Eyewear", jewelry: "Accessory" },
    slotCostWeight: { jacket: 1.8, top: 1.4, bottoms: 1.2, footwear: 1.0, hats: 0.9, glasses: 0.7, jewelry: 0.5 },
    canCloseCostGapRatio: 0.3, // budget ≥ costDeficit · 0.3 to chase the cost target
    scoreStyle: {
      archBonusMult: 20,         // styleProfile weight · 20
      roleBonusMult: 10,         // styleExpectation weight · 10
      diversityMult: [1.0, 0.6, 0.3, 0.15], // per already-recommended count (capped at idx 3)
      costAlign: {
        highAvg: 200, highDeficit: 1000, highBonus: 8,
        midAvg: 150, midDeficit: 500, midBonus: 5,
        lowAvg: 50, lowDeficit: 2000, lowPenalty: -3,
        slotCeilingBonus: 3,
        overCeilingCheapAvg: 100, overCeilingCheapBonus: 5,
        overCeilingPriceyAvg: 300, overCeilingPriceyPenalty: -5,
      },
    },
    itemPrice: { bigBudget: 5000, midBudget: 2500, smallBudget: 1000 },
    archStyleProfileThreshold: 0.1, // slotHasArch gate on styleProfile weight
    bigSwingThreshold: 15,          // netGain ≥ 15 ⇒ bigSwing
    strongModThreshold: 8,          // best.mod ≥ 8 ⇒ "strong district value"
    weakModThreshold: 5,            // best.mod ≤ 5 ⇒ "not the flashiest"
    badDeltaThreshold: -5,          // oldDelta < −5 ⇒ "reading wrong"
    styleGroupDefaults: { avg: 100, floor: 20, ceiling: 500, icon: "fa-tshirt" },
    fixer: {
      cheapAvg: 100, expensiveAvg: 300,
      premiumSpendMult: 1.2, budgetSpendMult: 0.8,
      bigBudget: 5000, smallBudget: 500,
      priceVsAvgBudgetMult: 0.7, // cost < avg·0.7 ⇒ "budget" priceVsAvg band
    },
    // Style → price band + display label/icon (Phase 82 STYLE_COSTS, verbatim).
    styleCosts: {
      highFashion: { avg: 500, floor: 200, ceiling: 2000, label: "High Fashion", icon: "fa-crown" },
      businesswear: { avg: 300, floor: 100, ceiling: 1000, label: "Businesswear", icon: "fa-briefcase" },
      urbanFlash: { avg: 200, floor: 50, ceiling: 800, label: "Urban Flash", icon: "fa-bolt" },
      genericChic: { avg: 100, floor: 20, ceiling: 500, label: "Generic Chic", icon: "fa-tshirt" },
      leisurewear: { avg: 150, floor: 30, ceiling: 600, label: "Leisurewear", icon: "fa-umbrella-beach" },
      asiaPop: { avg: 200, floor: 50, ceiling: 700, label: "Asia Pop", icon: "fa-yin-yang" },
      bohemian: { avg: 100, floor: 20, ceiling: 400, label: "Bohemian", icon: "fa-peace" },
      nomadLeathers: { avg: 150, floor: 40, ceiling: 600, label: "Nomad Leathers", icon: "fa-campground" },
      gangColors: { avg: 50, floor: 10, ceiling: 300, label: "Gang Colors", icon: "fa-fist-raised" },
      bagLadyChic: { avg: 20, floor: 5, ceiling: 100, label: "Bag Lady Chic", icon: "fa-shopping-bag" },
    },
  },

  // ── Scene aggregation (M2.4: scene.mjs) ───────────────────────────── EXTRACTED
  scene: {
    powerScore: { repWeight: 10, coolWeight: 5, styleWeight: 0.05, threatWeight: 0.03 },
    threat: { weaponPer: 30, armorPer: 20 }, // + cyberwareData.totalThreatMod
  },

  // ── GM dashboard reads (M3: scene-gate.mjs, faction-tension.mjs) ──── EXTRACTED
  gm: {
    // An archetype read only "counts" as a faction affiliation at/above this confidence.
    factionReadConfidenceFloor: 5,
    gate: { factionCheckMinConfidence: 10 }, // factionCheck passes only if topArch ≥ this
    disguise: { familiarityBonus: 3 },       // +perception when the NPC IS the read faction
    tension: { criticalPairs: 3, majorPairs: 2 }, // rival-pair count → severity bands
  },

  // ── Crew analysis (M2.4: crew.mjs) ────────────────────────────────── EXTRACTED
  // Aggregations over already-validated per-member outputs. Per-role tolerances
  // come from config ROLE_PROFILES (via the heat/danger engines crew calls into);
  // everything still hardcoded inside CrewAnalyzer lands here (verbatim Phase 82).
  crew: {
    // getRoleTier(rank) thresholds (same table as archetypes.roleTier).
    roleTier: { legendary: 10, high: 7, mid: 4, low: 1 },

    // -- calculateSynergy --
    synergy: {
      minMembers: 2,
      sharedStyleMinWearers: 2,             // a style is "shared" at ≥2 wearers
      chromeStdDevMult: 10,                 // chromeBalance = max(0, 100 − round(σ·10))
      costStdDevMult: 50,                   // costBalance   = max(0, 100 − round(σ/avg·50))
      weights: { styleOverlap: 0.3, roleDiversity: 0.3, chromeBalance: 0.2, costBalance: 0.2 },
      labels: { legendary: 80, tight: 60, working: 40, loose: 20 },
    },

    // -- calculateRoleCoverage -- tactical-role assignment scoring.
    roleCoverage: {
      idealRoles: ["face", "intimidator", "infiltrator", "blender", "negotiator"],
      // role-rank → scaling of the role's perception contribution.
      rankScale: { legendary: 1.0, high: 0.85, mid: 0.6, low: 0.3 },
      defaultPerception: { intimidationBonus: 0, approachabilityPenalty: 0, recognizability: 0, coolMasking: 1.0 },
      // Per-role perception-derived bonus (× rankScale): keyed coefficients.
      percWeights: {
        face:        { approach: 3, recog: 1.5 },
        intimidator: { intim: 4, recog: 1.5 },
        infiltrator: { recog: -4, coolMaskOver1: 10 },
        blender:     { recog: -3, coolMaskOver1: 8, approachAbs: -1 },
        negotiator:  { approach: 2, intim: 2, recog: 1 },
      },
      // Main role scores from social stats / gear / heat / deviation.
      scoreWeights: {
        face:        { ws: 4, pg: 3, cool: 3, style: 0.02 },
        intimidator: { cool: 4, rep: 5, chrome: 2, weapon: 3 },
        infiltrator: { cool: 3, repInv: 4, heatInv: 0.3 },
        blender:     { devInv: 0.3, pg: 3, ws: 2, repInv: 2 },
        negotiator:  { cool: 4, rep: 3, pg: 3, ws: 2 },
      },
      repInvBase: 10,   // (repInvBase − reputation)
      heatInvBase: 100, // (heatInvBase − heatIndex.value)
      devInvBase: 100,  // (devInvBase − |styleScore − avgStyle|)
    },

    // -- calculateActualRoleComposition --
    composition: {
      allRoles: ["solo", "netrunner", "tech", "medtech", "fixer", "exec", "media", "lawman", "nomad", "rockerboy"],
      overlapMinCount: 2,
    },

    // -- calculateStyleCoherence --
    coherence: {
      minMembers: 2,
      labels: { uniform: 60, coordinated: 40, mixed: 20 },
      blowability: { archetypeWeight: 40, costSpreadWeight: 20, costSpreadCap: 30, coherenceWeight: 0.3, cap: 100 },
      blowLabels: { blownOnSight: 75, obviousCrew: 50, suspicious: 25 },
    },

    // -- calculateCrewHeat --
    heat: {
      weaponBaselinePerHead: 1, weaponExcessMult: 18,
      armorBaselinePerHead: 1, armorExcessMult: 12,
      chromeThreshold: 25, chromeRate: 0.5,
      costDivisor: 800, costCap: 15,
      groupSizeMult: 4, groupSizeCap: 15,
      repMult: 3, coolMult: 1.5,
      levels: { blazing: 75, hot: 50, warm: 25 },
    },

    // -- calculateCrewDanger --
    danger: {
      avgWeight: 0.6, maxWeight: 0.4,
      tiers: { extreme: 80, high: 55, moderate: 30 },
      colors: { extreme: "#ff00ff", high: "#dc3545", moderate: "#ffc107", low: "#28a745" },
    },

    // -- calculateCrewFactionProfile --
    factionProfile: { diverseFactor: 0.75 },

    // -- calculateCrewReputation -- blended score → crew rep tier (highest first).
    reputation: {
      tiers: [
        { min: 1400, name: "Night City Legends", icon: '<i class="fas fa-crown"></i>', number: 7, grade: "S+" },
        { min: 1000, name: "Known Operators", icon: '<i class="fas fa-star"></i>', number: 6, grade: "S" },
        { min: 650, name: "Up-and-Comers", icon: '<i class="fas fa-gem"></i>', number: 5, grade: "A" },
        { min: 400, name: "Street-Level Crew", icon: '<i class="fas fa-fist-raised"></i>', number: 4, grade: "B" },
        { min: 200, name: "Small-Time Punks", icon: '<i class="fas fa-meh"></i>', number: 3, grade: "C" },
        { min: 80, name: "Bottom Feeders", icon: '<i class="fas fa-thumbs-down"></i>', number: 2, grade: "D" },
        { min: 0, name: "Unknown Nobodies", icon: '<i class="fas fa-ghost"></i>', number: 1, grade: "F" },
      ],
    },
  },

  // (brand group: see the M9.1 block further down — an empty duplicate key
  // here used to be silently overwritten by it; removed in M9.2.)

  // ── Color math (M9.1: colors.mjs — NEW, §9.2) ─────────────────────────── NEW
  color: {
    // Neutrals (grays/near-black/near-white) coordinate with everything.
    neutral: { satMax: 0.18, blackMax: 0.12, whiteMin: 0.92 },
    // Hue harmony bands (degrees) + the saturation floor below which a
    // mismatch is merely "muted", never a clash.
    harmony: { analogousMax: 35, complementaryTol: 25, triadTol: 15, clashSatMin: 0.4 },
    accentWeight: 0.5, // an accent color weighs half a primary
    // Coordination → Wardrobe & Style (clash lands here in v1; folding it into
    // the per-archetype anti-style tables rides the scoring presets, M9.4).
    coordination: {
      minColored: 2,            // colored pieces needed before the palette is judged
      wsBonusMax: 2,            // fully coordinated palette → +2 W&S
      clashPenaltyPerPair: 1,   // each clashing pair −1
      wsDeltaClamp: 3,          // |W&S adjustment| ceiling
      fashionwareSynergyBonus: 1, fashionwareSynergyCap: 2, // §9.2 chrome colorway match
    },
    // Palette membership: hue + lightness proximity (neutrals by lightness).
    paletteMatch: { hueTol: 25, lightTol: 0.35, neutralLightTol: 0.18 },
    // Faction colorway → soft affiliation (merged into scMods.factions).
    colorway: { coverageMin: 0.5, minPieces: 2, weight: 10, cap: 10 },
    // District palette fit nudge (positive only).
    districtFit: { minPieces: 2, weight: 8 },
  },

  // ── Brand recognition & counterfeits (M9.1: recognition.mjs — §13.3/§13.4) ── NEW
  recognition: {
    // Observer literacy (INT + bonus) must clear the bar for the brand's band:
    // iconic reads to everyone, known to most, niche to the fashion-literate.
    bar: { iconic: 0, known: 4, niche: 8 },
    // Actively studying a look helps clock labels (§16.2 tiers).
    scanLiteracyBonus: { failed: 0, minimal: 0, partial: 2, full: 4 },
    // §23.2: hidden/internal chrome's brand surfaces only at this scan tier.
    hiddenChromeNeedsTier: "full",
    // Clothing needs at least this much physical visibility (§27 stack) to be clocked.
    visibilityFloor: 0.25,
    // §13.4: active-scan DC to expose a fake; better replicas are harder.
    counterfeit: {
      baseDc: 12,
      replicaDcBonus: { streetKnockoff: 0, premiumReplica: 4 },
      disguisePenaltyPerReveal: 15, // a clocked fake bleeds cover confidence
    },
  },

  // ── Slots & layering (M9.1: visibility.mjs — NEW, §27.6/§29.1 Stage 2) ── NEW
  slots: {
    // Transmission per EFFECTIVE coverage: how much of an inner item's signal
    // passes through ONE covering garment (1 = reads fully, 0 = doesn't read).
    // §27.6 graded model: full hides, major reads weakly, partial (mesh, open
    // vest) still mostly reads.
    transmission: { none: 1, partial: 0.7, major: 0.25, full: 0 },
    // wearMode → effective-coverage shift in coverage STEPS (none<partial<major<full).
    // 0 = as authored (deliberate concealment states); negative opens the garment
    // up (§27.6: an open coat's coverage drops; a lowered mask/hood hides nothing).
    wearModeShift: {
      closed: 0, raised: 0, on: 0, tucked: 0, worn: 0,
      open: -1, slung: -1, loose: -1,
      lowered: -3, off: -3,
    },
    // §27.6 default wearMode by scSlot — the natural, least-concealing worn state
    // (Christian's principle: concealment is always a deliberate toggle).
    defaultWearMode: {
      coat: "open", jacket: "open", cape: "open", cloak: "open",
      hood: "lowered", mask: "lowered", respirator: "lowered", veil: "lowered",
      scarf: "loose", bag: "slung", backpack: "slung",
      glasses: "worn", mirrorshades: "worn",
    },
    // readPriority 0–3 → contribution multiplier (§29.4: a multiplier, not a
    // flag; index = authored value; absent reads as 1 · normal).
    readPriorityMult: [0.5, 1, 1.5, 2.5],
  },

  // ── Formality (M9.1: formality.mjs — NEW, §28) ────────────────────────── NEW
  formality: {
    defaultRegister: 2,            // absent = street (§28)
    // Scene-gate dress code: |outfit − target| in register steps → severity.
    gate: { yellowAt: 1, redAt: 2 },
    // Disguise: confidence − penaltyPerStep per register step beyond tolerance
    // (passing as corpo needs the right REGISTER, not just elegance — §28).
    disguise: { tolerance: 0, penaltyPerStep: 12 },
  },

  // ── The Garden (M7.10: engine/garden.mjs) ─────────────────────────── NEW (§21.4)
  // Engagement is a FUNCTION of heat + reputation + style score (the §21.4 key
  // insight) — a flashy idol racks thousands of likes, a grey man gets crickets.
  // D7: read-only mirror with metrics (the recommendation); the feedback loop
  // (virality → notoriety) is a possible future toggle.
  garden: {
    followers: {
      base: 40,            // a nobody's baseline audience
      repMult: 0.9,        // ×(1 + rep·this)
      styleDivisor: 100, styleMult: 2.2,  // ×(1 + style/divisor·this)
      heatDivisor: 100, heatMult: 0.8,    // ×(1 + heat/divisor·this)
      cap: 250000,
    },
    metrics: {
      likeRate: 0.18,      // likes ≈ followers · rate · jitter
      boostRate: 0.03,
      replyRate: 0.022,
      jitterMin: 0.35, jitterSpan: 1.3,   // jitter ∈ [min, min+span)
    },
    feed: { posts: 8, maxPerCategory: 2, adEvery: 4, maxAgeMinutes: 120 },
    eventCap: 40,          // rolling cap on stored event posts
  },

  // ── Condition dynamics (M7.8: hooks/condition-dynamics.mjs) ───────── NEW (§15, §17)
  // Combat dirties gear: dropping below these HP percentages degrades equipped
  // clothing (never improves it — cleaning is the tailor's job). The style-score
  // penalty for poor condition is M9 scoring work; bloodied ALREADY feeds heat
  // indirectly via the wound fold.
  conditionDynamics: {
    wornAtPct: 50,      // hp ≤ 50% → pristine gear reads worn
    bloodiedAtPct: 25,  // hp ≤ 25% → gear reads bloodied (blood draws eyes)
  },

  // ── Known For (M7.9: services/known-for.mjs) ──────────────────────── NEW (§16.6)
  knownFor: {
    threshold: 5,   // public reads as the same archetype before it sticks
    tallyCap: 20,   // rolling cap so an old reputation can eventually be outgrown
  },

  // ── Trends (M7.7: services/trends.mjs) ────────────────────────────── NEW (§14.4)
  trends: {
    hotMultiplier: 1.25,  // default markup on trending styles
    coldMultiplier: 0.8,  // default discount on out-of-fashion styles
  },

  // ── Tailor (M6.7: services/tailor.mjs) ────────────────────────────── NEW (§15.1)
  // Mechanical wiring per garment modification. Each entry's `effects` is merged
  // into the item's styleData (armor → perceived armor; chrome.fashionware →
  // built-in fashionware read). Modifications with no effects are flavor + future
  // hooks (hiddenPockets → conceal lands with the M7 live layer).
  tailor: {
    modifications: {
      armoredLining:   { label: "Armored lining",   effects: { armor: 1 } },
      hiddenPockets:   { label: "Hidden pockets",   effects: {} },
      techIntegration: { label: "Tech integration", effects: { chrome: { fashionware: 1 } } },
      reinforced:      { label: "Reinforced",       effects: { armor: 1 } },
      distressed:      { label: "Distressed",       effects: { condition: "worn" } },
    },
  },

  // ── Uniforms (M6.5: engine/uniforms.mjs) ──────────────────────────── NEW (§21.2)
  // No macro reference — the soft-signature match is new engine work, designed
  // from guide §21.2. Color/brand axes join the signature in M9.
  uniforms: {
    // Component weights (renormalized over the components a signature defines).
    weights: { styles: 0.6, chrome: 0.25, factionGear: 0.15 },
    // Match percent → grade bands.
    grades: { full: 70, partial: 40 },
    // An authored faction-gear signal of this strength counts as a full gear match.
    factionGearFullValue: 25,
    // Author-by-example derivation (Wardrobe → "Save as uniform").
    derive: { styleThreshold: 0.15, minPiecesFloor: 2, minPiecesRatio: 0.5 },
    // Wearing the target group's uniform IS a disguise toward that group (§21.2).
    disguiseBonus: { full: 15, partial: 8 },
  },

  // ── Faction cascade (M4: item-preview.mjs) ────────────────────────── EXTRACTED
  // Constants governing how a faction signal derives archetype/style/chrome/cost/DC.
  // Verbatim from the macro's collectDisguiseModifiers cascade (§8167–8208). The
  // Item Style Tab's live preview reads these so a tuned cascade previews correctly.
  cascade: {
    styleProfileThreshold: 0.15, // archetype styleProfile weight must clear this to seed a style
    styleProfileDivisor: 25, styleProfileMult: 3, // virtual style = round(value/25 · weight · 3)
    styleModifierDivisor: 25, styleModifierMult: 8, // faction styleModifiers = round(value/25 · mod · 8)
    chromeNudgeDivisor: 20, chromeNudgeMin: 1,      // chrome nudge = max(1, round(value/20))
    costNudgeDivisor: 100,                          // cost nudge = round(costTarget · value/100)
    dcDivisor: 10,                                  // DC bonus = round(value/10)
  },

  // ── Brand cascade (M9.1: cascade.mjs — NEW, no macro reference; §13.2) ── NEW
  // How a registry brand expands into reads. Registry affinities are authored on
  // the guide's scale (§13.1: styleAffinity ~12 = strong); the multipliers convert
  // them to the engine's virtual-point scale. Per-axis caps enforce §29.4: brand
  // defaults + explicit fields stack additively but never compound unbounded.
  // Values tuned by feel on a build (§29.7), not inherited.
  brand: {
    styleMult: 0.25,     // virtual style pts = round(affinity · 0.25) → 12 ≈ 3
    vibeMult: 1,         // brand vibe identity applies as authored
    heatMult: 1,         // heatProfile applies as authored
    costMult: 1,         // perceived-cost nudge = round(tierCost[tier] · 1)
    factionMult: 0.4,    // soft affiliation = round(affinity · 0.4) — weaker than worn colors
    districtMult: 1,     // district-fit nudge applies as authored
    archetypeMult: 1,    // identity nudge applies as authored
    // tier → perceived-cost contribution (eb) — §13.2 "tier drives perceived cost"
    tierCost: { street: 100, massMarket: 400, premium: 1500, luxury: 4000, hauteCouture: 9000 },
    // Per-axis clamp on what ONE item's brand may contribute (symmetric ±).
    caps: { style: 8, vibe: 4, heat: 10, cost: 6000, faction: 12, district: 6, archetype: 8 },
  },

  // ── Vibe profile (M9.1: vibes.mjs — NEW, no macro reference; §22.3) ──── NEW
  // How the aggregated vibe map (items + brands, via the collector) reads as a
  // tone profile. A profile with TRADEOFFS, not a score (§22.3) — these only
  // shape dominance/wording, never a "total".
  vibe: {
    dominantMin: 3,    // a tone needs this many points to count as dominant
    dominantRatio: 0.6, // …and must be within this ratio of the top tone
    faintMax: 1,       // ≤ this reads "faintly X" in the descriptor
    strongMin: 6,      // ≥ this reads "strongly X" in the descriptor
    descriptorMax: 2,  // tones named in the one-line descriptor (§22.4 #4)
  },
};

/**
 * Overlay provider — injected by the Integration layer (main.mjs) so this config
 * module stays Foundry-free. Returns the GM's sparse override object (or null). When
 * unset (node tests, early boot) getTunables() returns the verbatim defaults, so the
 * engine + parity gate are unaffected.
 * @type {null | (() => object|null)}
 */
let _overlayProvider = null;

/** Wire the GM-overrides source (e.g. () => DataStore.get(SETTINGS.TUNABLES)). */
export function setTunablesOverlayProvider(fn) {
  _overlayProvider = typeof fn === "function" ? fn : null;
}

/** Recursive merge: objects deep-merge, everything else (incl. arrays) overwrites. */
function deepMerge(base, over) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object" && !Array.isArray(base[k])) {
      out[k] = deepMerge(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Resolve the active tunables: the defaults with any GM overlay deep-merged on top.
 * Fast path (no provider / empty overlay) returns the defaults object directly.
 * @returns {typeof TUNABLES_DEFAULTS}
 */
export function getTunables() {
  if (!_overlayProvider) return TUNABLES_DEFAULTS;
  let overlay = null;
  try {
    overlay = _overlayProvider();
  } catch {
    return TUNABLES_DEFAULTS; // settings not ready — defaults
  }
  if (!overlay || typeof overlay !== "object" || Object.keys(overlay).length === 0) return TUNABLES_DEFAULTS;
  return deepMerge(TUNABLES_DEFAULTS, overlay);
}

/**
 * Convenience: fetch one group (e.g. getTunableGroup("heat")). Throws on a typo'd
 * group name so a missing dial is a loud failure, not a silent undefined.
 * @param {keyof TUNABLES_DEFAULTS} group
 */
export function getTunableGroup(group) {
  const t = getTunables();
  if (!(group in t)) throw new Error(`Unknown tunables group: ${group}`);
  return t[group];
}
