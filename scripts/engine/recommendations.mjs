/**
 * recommendations.mjs — the budget-aware wardrobe planner ("what should I buy for
 * this district?").
 *
 * Pure; consumes the normalized `collected` set (for the current outfit) plus the
 * district modifier table and the target role/archetype profiles. Numeric dials live
 * in Tunables (budget); the human-facing slot/fixer copy is content and stays inline.
 *
 * The two-round greedy allocator and its cost-target math are a faithful port of
 * Phase 82 — including the quirk that getItemPrice() reads the live `remaining` /
 * `slotRecs` accumulators by closure (so the per-slot budget shrinks as the plan
 * fills). Output is the macro shape {allocations, slotRecs, totalSpent, totalScore,
 * remaining, costSummary} plus the explainability envelope.
 *
 * Ports: RecommendationEngine.optimizeBudget (macro ~11277–12018).
 * Spec: SC-Module-Architecture-Guide.md §29.1, §4.1, §18.1
 */

import { getTunables } from "../config/tunables.mjs";

/** Humanize a camelCase style key ("highFashion" → "High Fashion"). */
export const formatStyleName = (style) =>
  style ? style.replace(/([A-Z])/g, " $1").trim().replace(/^./, (s) => s.toUpperCase()) : "Unknown";

/**
 * @param {object} p
 * @param {number} p.budget        eurobucks available to spend
 * @param {object} p.districtData  { name, modifiers } — per-style district modifier table
 * @param {object} p.roleProfile   ROLE_PROFILES entry (costExpectation/styleExpectation/label); may be null
 * @param {number} p.rank          primary role rank
 * @param {object} p.targetArch    FACTION_ARCHETYPES entry (costExpectation/styleProfile); may be null
 * @param {object} p.collected     Stage-1 set (equippedClothing, totalCost)
 * @param {object} [p.tunables]
 * @returns Phase 82 {allocations, slotRecs, totalSpent, totalScore, remaining, costSummary} + explainability
 */
export function optimizeBudget({ budget, districtData, roleProfile = null, rank = 0, targetArch = null, collected = null, tunables = getTunables() }) {
  const B = tunables.budget;
  const mods = districtData?.modifiers || {};
  const costs = B.styleCosts;
  const dName = districtData?.name || "this district";
  const roleName = roleProfile?.label || null;
  const isHighRank = rank >= B.highRankThreshold;

  const SLOT_CAPS = B.slotCaps;
  const SLOT_ORDER = B.slotOrder;
  const SLOT_LABELS = B.slotLabels;
  const SLOT_COST_WEIGHT = B.slotCostWeight;

  // Current outfit, per slot (from collected — collect() already filters to equipped).
  const equippedBySlot = {};
  const ownedStyles = {};
  let currentTotalCost = 0;
  for (const item of collected?.equippedClothing || []) {
    const slotType = String(item.slot ?? "");
    const style = item.style || null;
    const itemCost = item.cost || 0;
    if (!slotType) continue;
    if (!equippedBySlot[slotType]) equippedBySlot[slotType] = [];
    equippedBySlot[slotType].push({ name: item.name, style, cost: itemCost });
    currentTotalCost += itemCost;
    if (style) ownedStyles[style] = (ownedStyles[style] || 0) + 1;
  }

  // ── COST TARGET ──────────────────────────────────────────────────────────
  const archCost = targetArch?.costExpectation || null;
  const archFloor = archCost?.floor ?? 0;
  const archSweet = archCost?.sweet ?? 0;
  const archCeiling = archCost?.ceiling ?? null;

  const roleCost = roleProfile?.costExpectation || null;
  let roleFloor = 0, roleSweet = 0;
  if (roleCost) {
    roleFloor = (roleCost.base?.floor || 0) + rank * (roleCost.perRank?.floor || 0);
    roleSweet = (roleCost.base?.sweet || 0) + rank * (roleCost.perRank?.sweet || 0);
  }

  const targetFloor = Math.max(archFloor, roleFloor);
  const targetSweet = Math.max(archSweet, roleSweet);
  const targetCeiling = archCeiling; // only archetypes carry a ceiling

  const costDeficit = Math.max(0, targetSweet - currentTotalCost);
  const isAboveSweet = currentTotalCost >= targetSweet;
  const isAboveCeiling = targetCeiling && currentTotalCost > targetCeiling;

  // Actionable slots (empty / hurting / neutral) for per-slot cost targeting.
  const actionableSlots = SLOT_ORDER.filter((slot) => {
    const eq = equippedBySlot[slot] || [];
    if (eq.length === 0) return true;
    const worst = eq.reduce((w, i) => {
      const d = i.style && mods[i.style] ? mods[i.style] : 0;
      return d < w ? d : w;
    }, 999);
    return worst <= 0;
  });
  const numActionable = Math.max(1, actionableSlots.length);

  const totalWeight = SLOT_ORDER.reduce((sum, s) => sum + (SLOT_COST_WEIGHT[s] || 1.0), 0);
  const getSlotCostTarget = (slot) => {
    if (isAboveSweet || costDeficit <= 0) return null;
    const weight = SLOT_COST_WEIGHT[slot] || 1.0;
    return Math.round((costDeficit * weight) / totalWeight);
  };

  // ── mutable allocator state (closures below read these live) ──────────────
  const styleRecommendedCount = {};
  let runningNewCost = 0;
  let remaining = budget;
  const slotRecs = [];
  let totalSpent = 0;
  let totalScore = 0;

  // ── STYLE SCORING (cost-aware) ────────────────────────────────────────────
  const SC = B.scoreStyle;
  const canCloseCostGap = budget >= costDeficit * B.canCloseCostGapRatio;

  const scoreStyle = (styleKey, slot = null) => {
    const mod = mods[styleKey] || 0;
    if (mod <= 0) return -999;
    const sc = costs[styleKey];
    if (!sc) return -999;
    const valuePerEb = mod / sc.avg;

    let archBonus = 0;
    if (targetArch?.styleProfile?.[styleKey]) archBonus = targetArch.styleProfile[styleKey] * SC.archBonusMult;

    let roleBonus = 0;
    if (roleProfile?.styleExpectation?.[styleKey]) {
      const effectiveExpect = roleProfile.styleExpectation[styleKey] + (rank >= B.highRankThreshold && roleProfile.highRankStyleShift?.[styleKey] ? roleProfile.highRankStyleShift[styleKey] : 0);
      roleBonus = effectiveExpect * SC.roleBonusMult;
    }

    const alreadyRecd = styleRecommendedCount[styleKey] || 0;
    const diversityMult = SC.diversityMult[Math.min(alreadyRecd, SC.diversityMult.length - 1)];

    let costAlignBonus = 0;
    const ca = SC.costAlign;
    if (canCloseCostGap && targetSweet > 0 && !isAboveSweet) {
      const projectedTotal = currentTotalCost + runningNewCost;
      const remainingDeficit = Math.max(0, targetSweet - projectedTotal);
      if (remainingDeficit > 0) {
        if (sc.avg >= ca.highAvg && remainingDeficit > ca.highDeficit) costAlignBonus = ca.highBonus;
        else if (sc.avg >= ca.midAvg && remainingDeficit > ca.midDeficit) costAlignBonus = ca.midBonus;
        else if (sc.avg <= ca.lowAvg && remainingDeficit > ca.lowDeficit) costAlignBonus = ca.lowPenalty;
        if (slot && getSlotCostTarget(slot) && sc.ceiling >= getSlotCostTarget(slot)) costAlignBonus += ca.slotCeilingBonus;
      }
    } else if (isAboveCeiling) {
      if (sc.avg <= ca.overCeilingCheapAvg) costAlignBonus = ca.overCeilingCheapBonus;
      else if (sc.avg >= ca.overCeilingPriceyAvg) costAlignBonus = ca.overCeilingPriceyPenalty;
    }

    return (valuePerEb + archBonus + roleBonus + costAlignBonus) * diversityMult;
  };

  const pickBestStyle = (slot = null) =>
    Object.entries(mods)
      .filter(([s, m]) => m > 0 && costs[s])
      .map(([s, m]) => ({ style: s, score: scoreStyle(s, slot), mod: m }))
      .sort((a, b) => b.score - a.score)[0] || null;

  const getItemPrice = (styleKey, slot) => {
    const sc = costs[styleKey];
    if (!sc) return 100;

    const slotTarget = getSlotCostTarget(slot);
    const projectedTotal = currentTotalCost + runningNewCost;
    const remainingDeficit = Math.max(0, targetSweet - projectedTotal);

    if (!canCloseCostGap || isAboveSweet || !slotTarget || remainingDeficit <= 0) {
      if (isAboveCeiling) return sc.floor;
      if (budget >= B.itemPrice.bigBudget) return Math.round((sc.avg + sc.ceiling) / 2);
      if (budget >= B.itemPrice.midBudget) return sc.avg;
      if (budget >= B.itemPrice.smallBudget) return Math.round((sc.avg + sc.floor) / 2);
      return sc.floor;
    }

    const clamped = Math.max(sc.floor, Math.min(sc.ceiling, slotTarget));
    const budgetPerSlot = Math.round(remaining / Math.max(1, numActionable - slotRecs.length));
    return Math.min(clamped, budgetPerSlot);
  };

  // ── slot assessments ──────────────────────────────────────────────────────
  const slotAssessments = SLOT_ORDER.map((slot) => {
    const equipped = equippedBySlot[slot] || [];
    const cap = SLOT_CAPS[slot];
    const label = SLOT_LABELS[slot];
    const empty = equipped.length === 0;
    const openSlots = Math.max(0, cap - equipped.length);
    const items = equipped.map((eq) => ({ ...eq, distDelta: eq.style && mods[eq.style] ? mods[eq.style] : 0 }));
    const worstItem = items.length > 0 ? items.reduce((w, i) => (i.distDelta < w.distDelta ? i : w), items[0]) : null;
    let priority;
    if (empty) priority = 0;
    else if (worstItem && worstItem.distDelta < 0) priority = 1;
    else if (worstItem && worstItem.distDelta === 0) priority = 2;
    else priority = 3;
    return { slot, label, cap, equipped: items, empty, openSlots, worstItem, priority };
  });
  slotAssessments.sort((a, b) => a.priority - b.priority);

  // ── ROUND 1: fix the outfit ───────────────────────────────────────────────
  for (const sa of slotAssessments) {
    if (remaining <= 0) break;
    if (sa.priority >= 3) continue;

    const best = pickBestStyle(sa.slot);
    if (!best) continue;

    const sc = costs[best.style];
    const itemPrice = getItemPrice(best.style, sa.slot);
    if (remaining < sc.floor) continue;
    const actualCost = Math.min(itemPrice, remaining);
    if (actualCost < sc.floor) continue;

    const action = sa.empty ? "buy" : sa.worstItem && sa.worstItem.distDelta < 0 ? "swap" : "upgrade";
    const pointsGain = best.mod;
    const oldDelta = action !== "buy" ? sa.worstItem?.distDelta || 0 : 0;
    const netGain = action !== "buy" ? pointsGain - oldDelta : pointsGain;

    const projectedTotal = currentTotalCost + runningNewCost + actualCost;
    const slotTarget = getSlotCostTarget(sa.slot);
    const costContext = {
      itemPrice: actualCost,
      slotTarget,
      projectedTotal,
      targetSweet,
      targetFloor,
      targetCeiling,
      currentTotalCost,
      costDeficit,
      isBelowFloor: projectedTotal < targetFloor,
      isApproachingSweet: projectedTotal >= targetFloor && projectedTotal < targetSweet,
      isAtSweet: projectedTotal >= targetSweet && (!targetCeiling || projectedTotal <= targetCeiling),
      isOverCeiling: targetCeiling && projectedTotal > targetCeiling,
      isPremiumPick: actualCost > sc.avg,
      isBudgetPick: actualCost < sc.avg,
      priceVsAvg: actualCost > sc.avg ? "premium" : actualCost < sc.avg * B.fixer.priceVsAvgBudgetMult ? "budget" : "standard",
    };

    const slotHasArch = !!(targetArch?.styleProfile?.[best.style] && targetArch.styleProfile[best.style] >= B.archStyleProfileThreshold);
    const slotHasRole = !!roleProfile?.styleExpectation?.[best.style];
    const oldStyleLabel = action !== "buy" && sa.worstItem?.style ? formatStyleName(sa.worstItem.style) : null;
    const newStyleLabel = sc.label;
    const swingPoints = netGain;
    const bigSwing = swingPoints >= B.bigSwingThreshold;
    const slotIsAccessory = sa.slot === "jewelry";
    const slotIsOuterwear = sa.slot === "jacket";
    const slotIsHead = sa.slot === "hats";
    const slotIsEyewear = sa.slot === "glasses";
    const slotIsBody = sa.slot === "top";
    const slotIsLegs = sa.slot === "bottoms";
    const slotIsFeet = sa.slot === "footwear";

    let slotComment = "";
    if (action === "buy") {
      if (slotHasArch && slotHasRole && costContext.isPremiumPick) {
        slotComment = `Empty ${sa.label.toLowerCase()} is a gap people read instantly. ${newStyleLabel} fills it, matches your role and archetype, and at €$${actualCost} it pulls your total wardrobe cost toward the range someone like you is expected to carry.`;
      } else if (slotHasArch && slotHasRole) {
        if (slotIsHead) slotComment = `No hat means no silhouette. ${newStyleLabel} headwear anchors your whole look — it's the first thing people clock and it nails both your role and archetype.`;
        else if (slotIsOuterwear) slotComment = `A missing jacket is a missing statement piece. ${newStyleLabel} outerwear carries the heaviest visual weight and it aligns with both your role and your archetype read.`;
        else if (slotIsBody) slotComment = `Walking around ${dName} with nothing on your torso slot is a dead giveaway you didn't plan your outfit. ${newStyleLabel} here covers the most visible real estate and serves double duty.`;
        else if (slotIsAccessory) slotComment = `Empty accessory slot is wasted potential — it's the easiest add that nobody questions. ${newStyleLabel} here quietly reinforces both your role and archetype without drawing attention.`;
        else if (slotIsEyewear) slotComment = `No eyewear means people see your face before your style. ${newStyleLabel} frames change how your whole upper half reads — and they match your role and archetype.`;
        else slotComment = `Empty ${sa.label.toLowerCase()} is leaving points on the table. ${newStyleLabel} fills it and matches both your role and archetype — maximum impact per eddie.`;
      } else if (slotHasArch) {
        if (costContext.isBelowFloor && costContext.isPremiumPick) slotComment = `Your total wardrobe cost is below what your archetype demands. Going premium on ${newStyleLabel} for your ${sa.label.toLowerCase()} does two jobs — sells the archetype read AND closes the cost gap that sharp eyes would catch.`;
        else if (slotIsHead) slotComment = `Head is what people see first from across the street. Empty means no opening statement. ${newStyleLabel} up top immediately sells the archetype you're going for.`;
        else if (slotIsOuterwear) slotComment = `Jacket is the loudest piece in any outfit — it's what people describe when they talk about you later. ${newStyleLabel} here stamps your archetype on the most memorable slot.`;
        else if (slotIsAccessory) slotComment = `Accessories are details, and details are what separate a costume from a look that feels real. ${newStyleLabel} here adds archetype depth without being obvious about it.`;
        else if (slotIsEyewear) slotComment = `Eyewear reshapes how people read your entire face. ${newStyleLabel} frames push the archetype harder than most full clothing pieces at a fraction of the visual real estate.`;
        else if (slotIsLegs) slotComment = `Nobody thinks about what someone's wearing below the waist — which is exactly why it matters. ${newStyleLabel} pants quietly reinforce the archetype the rest of your outfit is projecting.`;
        else slotComment = `Empty ${sa.label.toLowerCase()} is a gap in your archetype read. ${newStyleLabel} patches it — one less thing that doesn't match the image you're projecting.`;
      } else if (slotHasRole) {
        if (slotIsOuterwear && isHighRank) slotComment = `A Rank ${rank} ${roleName || "professional"} with no jacket? That's like a solo without shades — technically functional, visibly wrong. ${newStyleLabel} outerwear fixes the most obvious gap in your professional read.`;
        else if (slotIsBody && costContext.isBelowFloor) slotComment = `Your outfit's total cost is too low for your role at Rank ${rank}. ${newStyleLabel} for your torso at €$${actualCost} gets you closer to the range people expect — and fills the most visible empty slot.`;
        else if (slotIsHead && isHighRank) slotComment = `At your rank, every slot should be intentional. Missing headwear reads as careless, not casual. ${newStyleLabel} up top tells people you planned this look.`;
        else if (slotIsAccessory) slotComment = `Small detail, but people in your line of work are expected to have the accessories to match. ${newStyleLabel} here is the kind of piece that makes someone think "yeah, they do this for a living."`;
        else slotComment = `People expect someone in your role to have this slot covered. ${newStyleLabel} fills it — one less tell that you're not what you look like.`;
      } else {
        if (costContext.isBelowFloor && costContext.isPremiumPick && slotIsOuterwear) slotComment = `Empty jacket slot AND your wardrobe cost is way under target. Going premium ${newStyleLabel} here kills two birds — fills the loudest gap AND pushes your cost into the range your look needs to be believable.`;
        else if (slotIsOuterwear) slotComment = `Empty jacket slot is the loudest gap you can have. It's the first thing any local notices — like showing up to ${dName} without finishing getting dressed. ${newStyleLabel} is the best value fix.`;
        else if (slotIsHead && best.mod >= B.strongModThreshold) slotComment = `Your head is bare and this district rewards ${newStyleLabel} headwear heavily — +${best.mod} per item. Fastest points you'll earn today for the least effort.`;
        else if (slotIsAccessory && best.mod <= B.weakModThreshold) slotComment = `Not the flashiest fill, but an empty slot is a zero and ${newStyleLabel} turns it into a positive. Small numbers add up when you're trying to blend in.`;
        else if (slotIsFeet) slotComment = `Nobody looks at shoes first — but everybody notices when something's off about them. ${newStyleLabel} footwear keeps the bottom half consistent with the rest of your read.`;
        else if (bigSwing) slotComment = `This empty slot is your biggest opportunity — ${newStyleLabel} here nets you +${best.mod} points in ${dName}. Best bang for your eddies in the whole plan.`;
        else if (costContext.isBudgetPick) slotComment = `Budget fill — ${newStyleLabel} at €$${actualCost} covers this slot without eating into the eddies you need for higher-priority pieces. Sometimes the smart buy is the cheap one.`;
        else slotComment = `Empty slot is leaving points on the table. ${newStyleLabel} is the best value fill for ${dName} right now.`;
      }
    } else if (action === "swap") {
      if (bigSwing && slotIsOuterwear && costContext.isPremiumPick) slotComment = `Your ${oldStyleLabel} jacket is the single worst piece in your wardrobe for ${dName}. Swapping to premium ${newStyleLabel} at €$${actualCost} fixes your biggest penalty AND bumps your total cost toward where your look needs to be. Highest-impact move in the whole plan.`;
      else if (bigSwing && slotIsOuterwear) slotComment = `Your ${oldStyleLabel} jacket is the single worst piece in your wardrobe for ${dName}. It's not just wrong — at ${oldDelta}/item it's actively announcing you don't belong here. ${newStyleLabel} flips that into a positive. This is your highest-impact move.`;
      else if (bigSwing && slotIsHead) slotComment = `That ${oldStyleLabel} headwear is bleeding you ${Math.abs(oldDelta)} points every time someone looks at you. Head is the first read — swapping to ${newStyleLabel} fixes the most visible problem in your outfit.`;
      else if (bigSwing && slotHasArch) slotComment = `Your ${oldStyleLabel} ${sa.label.toLowerCase()} doesn't just hurt your district score — it actively fights the archetype you're trying to project. ${newStyleLabel} turns a double negative into a double positive.`;
      else if (bigSwing && slotHasRole && isHighRank) slotComment = `At Rank ${rank}, wearing ${oldStyleLabel} in ${dName} is a liability someone will notice. ${newStyleLabel} is what people at your level are expected to wear and it scores +${best.mod} here. No-brainer swap.`;
      else if (bigSwing) slotComment = `${oldStyleLabel} is costing you ${Math.abs(oldDelta)} points per item — that's one of the biggest penalties in your outfit. ${newStyleLabel} turns this slot from your worst performer into a contributor.`;
      else if (oldDelta < B.badDeltaThreshold && slotIsBody && costContext.isPremiumPick) slotComment = `Your torso piece is reading wrong and costing too little. Premium ${newStyleLabel} at €$${actualCost} fixes the style AND pushes your wardrobe cost closer to target. The street reads price and style together — both need to match.`;
      else if (oldDelta < B.badDeltaThreshold && slotIsBody) slotComment = `Your torso piece is reading wrong for ${dName}. It's your most visible slot after the jacket — swapping the ${oldStyleLabel} for ${newStyleLabel} cleans up the core of your silhouette.`;
      else if (oldDelta < B.badDeltaThreshold && slotIsEyewear) slotComment = `${oldStyleLabel} eyewear in ${dName} draws the wrong kind of attention — people notice frames before features. ${newStyleLabel} lets your face blend instead of broadcast.`;
      else if (oldDelta < B.badDeltaThreshold && slotIsAccessory) slotComment = `That ${oldStyleLabel} accessory is a subtle penalty that adds up. Small item, small swap, but the points matter when you're trying to clear a threshold.`;
      else if (oldDelta < B.badDeltaThreshold && slotIsLegs) slotComment = `Nobody thinks about pants until the pants are wrong. Your ${oldStyleLabel} legs are wrong for ${dName}. ${newStyleLabel} makes this slot invisible again — which is exactly what you want.`;
      else if (oldDelta < B.badDeltaThreshold && slotIsFeet) slotComment = `${oldStyleLabel} shoes in ${dName} are a tell. Locals read footwear as an authenticity check — wrong shoes and the whole outfit falls apart. ${newStyleLabel} fixes the foundation.`;
      else if (slotHasArch && slotHasRole) slotComment = `${oldStyleLabel} doesn't read right here. ${newStyleLabel} serves your role AND your archetype — this swap does triple duty: removes a penalty, adds district points, and strengthens your profile.`;
      else if (slotHasArch) slotComment = `Swapping ${oldStyleLabel} for ${newStyleLabel} doesn't just fix the district score — it pulls your archetype read in the right direction. Two problems solved with one purchase.`;
      else if (slotHasRole) slotComment = `${oldStyleLabel} doesn't match what people expect from your role in ${dName}. ${newStyleLabel} does. Simple swap, immediate credibility boost.`;
      else slotComment = `${oldStyleLabel} doesn't read right here. ${newStyleLabel} turns a negative into a positive — that's a net +${swingPoints} point swing from one change.`;
    } else if (action === "upgrade") {
      if (slotHasArch && slotHasRole && slotIsOuterwear && costContext.isPremiumPick) slotComment = `Your jacket isn't hurting but it's doing nothing — wasted potential on the most impactful slot. Premium ${newStyleLabel} at €$${actualCost} earns district points, locks in your role and archetype, and brings your total wardrobe cost up to where it needs to be.`;
      else if (slotHasArch && slotHasRole && slotIsOuterwear) slotComment = `Your jacket isn't hurting but it's doing nothing — wasted potential on the most impactful slot. ${newStyleLabel} outerwear earns district points AND locks in both your role and archetype read.`;
      else if (slotHasArch && slotIsOuterwear) slotComment = `Neutral jacket is a missed opportunity. ${newStyleLabel} here puts your loudest clothing slot to work for your archetype instead of just taking up space.`;
      else if (slotHasArch && slotIsHead) slotComment = `Your current headwear isn't earning anything. ${newStyleLabel} turns it into an archetype signal — the first thing people read about you starts working in your favor.`;
      else if (slotHasArch && slotIsBody) slotComment = `That torso piece is dead weight — not helping, not hurting, just there. ${newStyleLabel} puts your most visible slot to work reinforcing the archetype you're projecting.`;
      else if (slotHasRole && isHighRank && costContext.isPremiumPick) slotComment = `At Rank ${rank}, neutral slots are a luxury you can't afford. Premium ${newStyleLabel} at €$${actualCost} sends the right signal for your role AND closes the gap between your current cost and what people expect to see.`;
      else if (slotHasRole && isHighRank) slotComment = `At Rank ${rank}, neutral slots are a luxury you can't afford — every piece should be intentional. ${newStyleLabel} here is what people expect from someone at your level in ${dName}.`;
      else if (slotHasRole) slotComment = `This piece isn't doing anything for you. ${newStyleLabel} makes it read as part of your professional identity instead of just another garment filling space.`;
      else if (slotHasArch) slotComment = `Current piece is neutral — not helping, not hurting. ${newStyleLabel} turns it into an archetype asset. Every slot that reinforces the read makes the overall disguise harder to question.`;
      else if (costContext.isBelowFloor && costContext.isPremiumPick) slotComment = `This slot's earning nothing and your wardrobe cost is below the floor. Premium ${newStyleLabel} at €$${actualCost} fixes both — turns a dead slot into a contributor and pushes your total closer to credible.`;
      else if (slotIsOuterwear) slotComment = `Your jacket isn't earning anything in ${dName}. That's your loudest slot doing nothing. ${newStyleLabel} puts it to work — +${best.mod} points from one swap.`;
      else if (slotIsHead) slotComment = `Neutral headwear is invisible headwear — nobody reads it, so it's not contributing. ${newStyleLabel} makes it register. +${best.mod} points for a simple swap.`;
      else if (slotIsAccessory) slotComment = `Accessory doing nothing is fine for most people, but you're optimizing. ${newStyleLabel} here quietly adds to your score without changing your visible silhouette.`;
      else if (slotIsEyewear) slotComment = `Neutral eyewear is a missed opportunity — frames are high-visibility, low-effort. ${newStyleLabel} makes this tiny piece of real estate earn its keep.`;
      else if (slotIsLegs) slotComment = `Current pants aren't working for or against you. ${newStyleLabel} turns them into a quiet contributor — not flashy, but the math doesn't care about flashy.`;
      else if (slotIsFeet) slotComment = `Footwear earning ±0 means you're walking through ${dName} without your shoes helping you blend. ${newStyleLabel} fixes that for the cost of one swap.`;
      else if (best.mod >= B.strongModThreshold) slotComment = `Dead weight slot with a strong replacement available. ${newStyleLabel} is worth +${best.mod} per item here — that's too much to leave on the table.`;
      else slotComment = `Not costing you, but not earning either. ${newStyleLabel} puts this slot to work — every point counts when you're building a district-optimized wardrobe.`;
    }

    slotRecs.push({
      slot: sa.slot, slotLabel: sa.label, action, style: best.style, styleLabel: sc.label,
      cost: actualCost, pointsGain, oldStyle: action !== "buy" ? sa.worstItem?.style : null,
      oldName: action !== "buy" ? sa.worstItem?.name : null, oldDelta, netGain, round: 1,
      hasArch: slotHasArch, hasRole: slotHasRole, slotComment, costContext,
    });

    remaining -= actualCost;
    totalSpent += actualCost;
    totalScore += netGain;
    runningNewCost += actualCost;
    styleRecommendedCount[best.style] = (styleRecommendedCount[best.style] || 0) + 1;
  }

  // ── ROUND 2: deepen (extra capacity in multi-slots) ───────────────────────
  const multiSlots = slotAssessments.filter((sa) => sa.openSlots > 0 && sa.cap > 1);
  for (const sa of multiSlots) {
    if (remaining <= 0) break;
    const alreadyRecd = slotRecs.filter((r) => r.slot === sa.slot).length;
    const extraCap = sa.cap - sa.equipped.length - alreadyRecd;
    if (extraCap <= 0) continue;

    for (let i = 0; i < extraCap; i++) {
      if (remaining <= 0) break;
      const best = pickBestStyle(sa.slot);
      if (!best) break;

      const sc = costs[best.style];
      const itemPrice = getItemPrice(best.style, sa.slot);
      if (remaining < sc.floor) break;
      const actualCost = Math.min(itemPrice, remaining);
      if (actualCost < sc.floor) break;

      const addHasArch = !!(targetArch?.styleProfile?.[best.style] && targetArch.styleProfile[best.style] >= B.archStyleProfileThreshold);
      const addHasRole = !!roleProfile?.styleExpectation?.[best.style];
      const addSlotIsAccessory = sa.slot === "jewelry";
      const addSlotIsBody = sa.slot === "top";
      const addSlotIsLegs = sa.slot === "bottoms";
      const existingRecForSlot = slotRecs.filter((r) => r.slot === sa.slot).length;

      const projectedTotal = currentTotalCost + runningNewCost + actualCost;
      const addCostContext = { itemPrice: actualCost, projectedTotal, targetSweet, isPremiumPick: actualCost > sc.avg, isBelowFloor: projectedTotal < targetFloor };

      let addComment = "";
      if (addSlotIsAccessory) {
        if (addHasArch && addHasRole && existingRecForSlot >= 2) addComment = `Third accessory and it still serves both your role and archetype. Most people stop at one — stacking three says you live this look, you didn't just buy it this morning.`;
        else if (addHasArch && addHasRole) addComment = `Extra accessory that reinforces both your role and your archetype — accessories are the easiest way to layer identity signals without changing your core outfit.`;
        else if (addHasArch && existingRecForSlot >= 2) addComment = `Another archetype-aligned accessory. At this depth, the read goes from "coincidence" to "this is clearly who they are." Details sell the disguise.`;
        else if (addHasArch) addComment = `Extra accessory that reinforces your archetype. Accessories are low-commitment but high-signal — people subconsciously register them even when they can't name what they're noticing.`;
        else if (addHasRole) addComment = `Role-appropriate accessory adds professional credibility without being flashy. The kind of piece that makes someone assume you belong here rather than question it.`;
        else if (addCostContext.isBelowFloor && addCostContext.isPremiumPick) addComment = `Premium accessory to close the cost gap. Your wardrobe total is still under the floor — stacking value in the accessory slot is the least conspicuous way to bump it without changing your visible outfit.`;
        else if (existingRecForSlot >= 2) addComment = `Third accessory pickup — at this point you're building depth, not just coverage. Each additional piece makes the overall read feel more lived-in and less assembled.`;
        else if (best.mod >= B.strongModThreshold) addComment = `Strong district value on this accessory slot. You've got room to stack here and the points-per-eddie make it worth filling before you save the rest.`;
        else if (budget >= B.fixer.bigBudget) addComment = `Budget's got room for another accessory. Not the splashiest purchase but accessories are where leftover eddies go to die productively — steady points, no risk.`;
        else addComment = `Another accessory slot open. ${sc.label} earns you more district points for cheap — accessories are the highest capacity slot, might as well use it.`;
      } else if (addSlotIsBody) {
        if (addHasArch && addCostContext.isPremiumPick) addComment = `Layering a premium second body piece in ${sc.label}. Two torso items in archetype-aligned style at this price point says conviction AND closes the cost gap your look needs.`;
        else if (addHasArch) addComment = `Layering a second body piece in ${sc.label}. Two torso items in the same archetype style creates a deliberate, stacked look that reads as conviction, not accident.`;
        else if (addHasRole) addComment = `Second body layer deepens your professional read. Think undershirt plus overshirt — it's the kind of layering that says "this person dresses with intention."`;
        else addComment = `Room for a second torso piece. ${sc.label} here adds depth to your core silhouette — it's the difference between "wearing a shirt" and "wearing an outfit."`;
      } else if (addSlotIsLegs) {
        if (addHasArch) addComment = `Second legs piece — think skirt over leggings or layered bottoms. ${sc.label} reinforces the archetype from the waist down, which is where lazy profilers stop looking.`;
        else addComment = `Layering a second legs piece. ${sc.label} here rounds out the lower half of your silhouette — it's subtle but it completes the visual story.`;
      } else {
        addComment = `Layering a second piece into your ${sa.label.toLowerCase()} slot. Extra ${sc.label} deepens the read and earns +${best.mod} more district points.`;
      }

      slotRecs.push({
        slot: sa.slot, slotLabel: sa.label, action: "add", style: best.style, styleLabel: sc.label,
        cost: actualCost, pointsGain: best.mod, oldStyle: null, oldName: null, oldDelta: 0,
        netGain: best.mod, round: 2, hasArch: addHasArch, hasRole: addHasRole, slotComment: addComment, costContext: addCostContext,
      });

      remaining -= actualCost;
      totalSpent += actualCost;
      totalScore += best.mod;
      runningNewCost += actualCost;
      styleRecommendedCount[best.style] = (styleRecommendedCount[best.style] || 0) + 1;
    }
  }

  // ── grouped allocations for the shopping-list UI ──────────────────────────
  const SGD = B.styleGroupDefaults;
  const styleGroups = {};
  slotRecs.forEach((rec) => {
    if (!styleGroups[rec.style]) {
      const sc = costs[rec.style];
      styleGroups[rec.style] = {
        style: rec.style, label: rec.styleLabel, icon: sc?.icon || SGD.icon,
        avg: sc?.avg || SGD.avg, floor: sc?.floor || SGD.floor, ceiling: sc?.ceiling || SGD.ceiling,
        mod: mods[rec.style] || 0, count: 0, spent: 0, scoreGain: 0, slots: [],
        hasArch: rec.hasArch, hasRole: rec.hasRole, owned: ownedStyles[rec.style] || 0, actions: [],
      };
    }
    const g = styleGroups[rec.style];
    g.count += 1;
    g.spent += rec.cost;
    g.scoreGain += rec.netGain;
    g.slots.push(rec.slotLabel);
    g.actions.push(rec.action);
    if (rec.hasArch) g.hasArch = true;
    if (rec.hasRole) g.hasRole = true;
  });

  const allocations = Object.values(styleGroups).sort((a, b) => b.scoreGain - a.scoreGain);
  allocations.forEach((a, i) => { a.priority = i === 0 ? "primary" : "secondary"; });

  // ── cost summary ──────────────────────────────────────────────────────────
  const finalProjectedCost = currentTotalCost + runningNewCost;
  const costStatus = targetCeiling && finalProjectedCost > targetCeiling ? "over_ceiling"
    : finalProjectedCost >= targetSweet ? "at_sweet"
    : finalProjectedCost >= targetFloor ? "approaching"
    : targetFloor > 0 ? "below_floor"
    : "no_target";

  const F = B.fixer;
  const isBigBudget = budget >= F.bigBudget;
  const isSmallBudget = budget <= F.smallBudget;
  const totalStyles = allocations.length;

  // ── fixer notes (style-grouped, cost-aware) ───────────────────────────────
  allocations.forEach((a, idx) => {
    const isPrimary = idx === 0;
    const isLast = idx === totalStyles - 1;
    const slotList = a.slots.join(", ");
    const hadNone = a.owned === 0;
    const hadSome = a.owned >= 1;
    const isCheap = a.avg <= F.cheapAvg;
    const isExpensive = a.avg >= F.expensiveAvg;
    const singleBuy = a.count === 1;
    const hasSwapAction = a.actions.includes("swap");
    const avgSpentPerItem = a.count > 0 ? Math.round(a.spent / a.count) : a.avg;
    const isPremiumSpend = avgSpentPerItem > a.avg * F.premiumSpendMult;
    const isBudgetSpend = avgSpentPerItem < a.avg * F.budgetSpendMult;

    if (a.hasArch && a.hasRole) {
      a.fixerType = "archetype";
      if (hadNone && isPrimary && isPremiumSpend) a.fixerComment = `This is the move right here. ${a.label} is what people in your line of work are expected to wear, AND it matches the archetype you're trying to project in ${dName}. You own none of it — going premium at ~€$${avgSpentPerItem}/piece because your wardrobe cost needs to match the image. A ${roleName || "professional"} walking around ${dName} without any ${a.label} looks wrong on a level people feel before they think, and wearing cheap versions of it is almost worse.`;
      else if (hadNone && isPrimary) a.fixerComment = `This is the move right here. ${a.label} is what people in your line of work are expected to wear, AND it matches the archetype you're trying to project in ${dName}. You own none of it. Filling your ${slotList} ${a.count === 1 ? "slot" : "slots"} with it immediately fixes a gap people are reading whether you know it or not.`;
      else if (hadNone && isPremiumSpend) a.fixerComment = `${a.label} does double duty — role and archetype — and you've got zero in your wardrobe. At €$${avgSpentPerItem}/piece the planner's pushing premium because your total outfit cost needs to be in the range people expect for someone projecting this identity. Cheap ${a.label} would fix the style read but break the cost read.`;
      else if (hadNone) a.fixerComment = `${a.label} does double duty — role and archetype — and you've got zero in your wardrobe. Picking up ${a.count === 1 ? "a piece" : a.count + " pieces"} for your ${slotList} plugs a gap that would otherwise take two separate purchases to fix.`;
      else if (isHighRank && isPremiumSpend) a.fixerComment = `For a Rank ${rank} ${roleName || "operator"}, ${a.label} checks every box — role-appropriate, archetype-aligned, positive in ${dName}. Going premium at ~€$${avgSpentPerItem}/piece because at your level people don't just profile your style, they estimate the price tag. Both need to match.`;
      else if (isHighRank) a.fixerComment = `For a Rank ${rank} ${roleName || "operator"}, ${a.label} checks every box — role-appropriate, archetype-aligned, positive in ${dName}. At your level people are profiling you before you open your mouth. This is the kind of piece that makes that profiling work in your favor.`;
      else if (hadSome && hasSwapAction) a.fixerComment = `More ${a.label} deepens both your role read and your archetype projection — and you're swapping out something that was hurting you in the process. Going into your ${slotList} — double upgrade, fixing a penalty and adding a positive in one move.`;
      else a.fixerComment = `More ${a.label} deepens both your role read and your archetype projection in ${dName}. Going into your ${slotList} — this pushes past "maybe" into "obviously." The difference between getting a second look and not getting looked at twice.`;
    } else if (a.hasArch) {
      a.fixerType = "archetype";
      if (hadNone && a.count >= 2 && isPremiumSpend) a.fixerComment = `Zero ${a.label} in your wardrobe and it's core to the archetype you're going for. People in ${dName} have a sixth sense for this — they see the rest of your outfit and something feels off. Filling your ${slotList} with premium pieces at ~€$${avgSpentPerItem} each because the archetype expects a certain cost level. Cheap ${a.label} patches the style read but the price tag still whispers "fake."`;
      else if (hadNone && a.count >= 2) a.fixerComment = `Zero ${a.label} in your wardrobe and it's core to the archetype you're going for. People in ${dName} have a sixth sense for this — they see the rest of your outfit and something feels off. Filling your ${slotList} with it patches that hole fast.`;
      else if (hadNone && singleBuy && isExpensive) a.fixerComment = `One piece of ${a.label} at €$${a.spent} is a statement buy — it's expensive, but it anchors your archetype read in ${dName} in a way that three cheap alternatives wouldn't. Sometimes one perfect piece does more work than a bag full of okay ones. The street reads quality at a glance.`;
      else if (hadNone) a.fixerComment = `You don't own a single piece of ${a.label} and you're trying to project an archetype that lives in it. Even one piece in your ${slotList} starts fixing how people read your silhouette in ${dName}.`;
      else if (isHighRank && hasSwapAction) a.fixerComment = `At Rank ${rank}, your archetype read needs to be airtight. Swapping in ${a.label} for your ${slotList} removes the ambiguity that gets high-profile operators second-guessed — and takes out a piece that was actively hurting you.`;
      else if (isHighRank) a.fixerComment = `At Rank ${rank}, your archetype read needs to be airtight. Adding ${a.label} to your ${slotList} removes the ambiguity that gets high-profile operators second-guessed — or worse, made for something they're not.`;
      else if (hadSome && isPremiumSpend && costStatus === "below_floor") a.fixerComment = `${a.label} sharpens your archetype read in ${dName} and the premium price point (~€$${avgSpentPerItem}/piece) is intentional — your wardrobe's total cost is still under the floor for what your archetype expects. Every piece here does double duty: style points and cost credibility.`;
      else if (hadSome) a.fixerComment = `${a.label} sharpens your archetype read in ${dName}. Going into your ${slotList} — moves the needle from "maybe they are" into "yeah, definitely." The street profiles fast and this gives them the visual shorthand they're looking for.`;
      else a.fixerComment = `${a.label} is core to the archetype you're projecting. In ${dName}, that matters — people profile fast and they're looking for the visual shorthand. This gives it to them.`;
    } else if (a.hasRole) {
      a.fixerType = "default";
      if (hadNone && isHighRank && isPremiumSpend) a.fixerComment = `A Rank ${rank} ${roleName || "professional"} with zero ${a.label}? That's a gap. People in ${dName} have a mental picture of what someone at your level wears — and it's not cheap. Premium picks at ~€$${avgSpentPerItem}/piece because your rank demands it. Filling ${slotList} closes the style gap and pushes your wardrobe cost toward the range a Rank ${rank} is expected to carry.`;
      else if (hadNone && isHighRank) a.fixerComment = `A Rank ${rank} ${roleName || "professional"} with zero ${a.label}? That's a gap. People in ${dName} have a mental picture of what someone at your level wears. Every missing piece from that picture is a data point that says "something's off." Filling ${slotList} fixes that.`;
      else if (hadNone && costStatus === "below_floor") a.fixerComment = `People in ${dName} expect someone doing your kind of work to wear ${a.label}. You showing up without any is a tell, and your wardrobe cost is below the floor — both are flags. This fixes the style gap and adds cost credibility. Going into your ${slotList}.`;
      else if (hadNone) a.fixerComment = `People in ${dName} expect someone doing your kind of work to wear ${a.label}. You showing up without any is a tell — not a screaming alarm, but the kind of thing a sharp-eyed fixer or a bored cop notices. Going into your ${slotList}.`;
      else if (isPremiumSpend && costStatus === "below_floor") a.fixerComment = `${a.label} fits what ${dName} expects from your role — and going premium at ~€$${avgSpentPerItem}/piece because your wardrobe total is still too low. People at your rank carry a certain price tag. The style is right; now the cost needs to match.`;
      else a.fixerComment = `${a.label} fits what ${dName} expects from your role. Adding it to your ${slotList} deepens the impression from "person who happens to dress right" to "obviously a ${roleName || "professional"}." Perception is lazy — give it what it expects.`;
    } else if (hadNone) {
      a.fixerType = "new";
      if (a.count >= 2 && isPremiumSpend) a.fixerComment = `Nothing in ${a.label} right now and you're picking up ${a.count} premium pieces for your ${slotList}. The street reads monoculture as either broke or obsessive — mixing in a new style at a higher price point says you move through different circles AND you can afford the neighborhood. Social camouflage with a cost boost.`;
      else if (a.count >= 2) a.fixerComment = `Nothing in ${a.label} right now and you're picking up ${a.count} pieces for your ${slotList}. The street reads monoculture as either broke or obsessive. Mixing in a new style says you move through different circles. That's not just fashion points — that's social camouflage.`;
      else if (isBudgetSpend && isSmallBudget) a.fixerComment = `No ${a.label} in your wardrobe and the budget's tight, so we're going floor-price for your ${slotList}. Cheap? Yeah. But a €$${a.spent} piece of the right style beats an expensive piece of the wrong style in ${dName}. Points don't care about price tags.`;
      else if (singleBuy && isExpensive) a.fixerComment = `One piece of ${a.label} at €$${a.spent} — premium single buy for your ${slotList}. One perfect piece does more work than three mediocre ones. The street reads quality at a glance, and this is the kind of item that shifts an outfit from "assembled" to "curated."`;
      else a.fixerComment = `No ${a.label} in your wardrobe at all. Even ${a.count === 1 ? "one piece" : a.count + " pieces"} in your ${slotList} changes your silhouette in ${dName} — not a costume change, but enough that the locals' pattern-matching picks up something new. Variety is its own kind of armor.`;
    } else if (isCheap) {
      a.fixerType = "budget";
      if (isSmallBudget && hadSome) a.fixerComment = `On a tight budget, ${a.label} is your best friend. Going into your ${slotList} for pocket change — what it lacks in flash it makes up in efficiency. Stretch the budget where it counts and save the big purchases for when they'll matter.`;
      else if (isBigBudget && costStatus === "at_sweet") a.fixerComment = `You've already hit your cost sweet spot, so cheap ${a.label} for your ${slotList} is the smart play — more district points without pushing your wardrobe cost over the ceiling. No point spending premium when the numbers are already where they need to be.`;
      else if (isBigBudget && costStatus === "over_ceiling") a.fixerComment = `Your wardrobe cost is already over the ceiling for your archetype — going budget on ${a.label} keeps the district points coming without making the cost problem worse. Sometimes looking too expensive is as bad as looking too cheap.`;
      else if (isBigBudget) a.fixerComment = `Yeah, you've got the eddies for premium, but ${a.label} at this price point still earns real district points in ${dName}. A cheap ${slotList.toLowerCase()} piece next to your expensive gear creates contrast that actually makes you look richer. The street reads the mix.`;
      else if (hasSwapAction) a.fixerComment = `${a.label} is cheap and you're swapping out something that was hurting you in ${dName}. Even at budget prices, turning a negative into a positive is always worth it — the point swing matters more than the price tag.`;
      else a.fixerComment = `${a.label} is cheap and still earns district points in ${dName}. Going into your ${slotList} — not everything needs to scream money, some pieces just need to not scream "wrong neighborhood."`;
    } else {
      a.fixerType = "default";
      if (isPrimary && hadNone && isPremiumSpend) a.fixerComment = `Top recommendation and you own none. Premium ${a.label} at ~€$${avgSpentPerItem}/piece for your ${slotList} — this is the single biggest gap in your wardrobe for ${dName}, and the price point is calibrated to close the cost deficit your look is carrying. Every day you walk through here without it you're leaving points AND credibility on the table.`;
      else if (isPrimary && hadNone) a.fixerComment = `Top recommendation and you own none. ${a.label} in your ${slotList} is the single biggest gap in your wardrobe for ${dName} right now. Every day you walk through here without it you're leaving points on the table.`;
      else if (isPrimary && hadSome) a.fixerComment = `${a.label} is the highest-value style in ${dName} per eddie spent. Going into your ${slotList} — you've got some already, more deepens an impression that's already working for you. When the district modifier is this strong, leaning in is common sense.`;
      else if (isLast && isBudgetSpend) a.fixerComment = `Last on the list — budget ${a.label} for your ${slotList}. Not the piece anyone notices individually, but the one that squeezes the last available points out of your eddies. The difference between a good wardrobe and a great one is usually three moves like this.`;
      else if (isLast) a.fixerComment = `Last on the list — ${a.label} for your ${slotList}. Not the piece anyone notices individually, but the one that makes the whole outfit feel complete. The difference between a good wardrobe and a great one is usually three moves like this.`;
      else if (isPremiumSpend && costStatus === "below_floor") a.fixerComment = `Going premium on ${a.label} for your ${slotList} because your wardrobe cost is still below the floor. The style reads well in ${dName} — but at standard pricing it wouldn't do enough to close the cost gap. At ~€$${avgSpentPerItem}/piece, it earns district points and cost credibility simultaneously.`;
      else if (hasSwapAction && hadSome) a.fixerComment = `Swapping in more ${a.label} for your ${slotList}. You've got some already and it's reading well — this takes out a piece that was hurting you and replaces it with something that earns. Net gain on both style and district fit.`;
      else if (hadSome) a.fixerComment = `Adding ${a.label} to your ${slotList}. You've got some already — more of it in ${dName} shifts the read from "incidental" to "intentional." The street interprets intentional as someone who knows the neighborhood.`;
      else a.fixerComment = `${a.label} for your ${slotList} — plays well in ${dName} and fits the budget. Rounds out the wardrobe with something that says "local" instead of "outsider."`;
    }
  });

  const costSummary = {
    currentTotal: currentTotalCost,
    projectedTotal: finalProjectedCost,
    targetFloor,
    targetSweet,
    targetCeiling,
    costStatus,
    costDeficit: Math.max(0, targetSweet - finalProjectedCost),
    isBelowFloor: finalProjectedCost < targetFloor,
    isAtSweet: costStatus === "at_sweet",
    isOverCeiling: costStatus === "over_ceiling",
  };

  return {
    // ---- Phase 82-compatible core
    allocations, slotRecs, totalSpent, totalScore, remaining, costSummary,
    // ---- explainability envelope
    value: totalScore,
    label: `Plan: ${slotRecs.length} buy(s), +${totalScore} pts, €$${totalSpent}`,
    blurb: `${slotRecs.length} recommendation(s) for ${dName}: +${totalScore} district points for €$${totalSpent} (€$${remaining} left).`,
    tunablesApplied: { "budget.slotCostWeight": B.slotCostWeight, "budget.itemPrice": B.itemPrice },
  };
}
