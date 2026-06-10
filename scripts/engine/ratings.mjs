/**
 * ratings.mjs — style score → tier, and wardrobe cost → drip rating.
 *
 * Pure. `tier()` reads the TIERS table from config (Tier-1 data, already GM-editable);
 * `dripRating()` reads its cost→label table from Tunables (no inlined constants).
 *
 * Outputs are MACRO-COMPATIBLE supersets: they carry the exact fields Phase 82
 * produced (so the parity gate matches) plus the explainability envelope (§4.1).
 *
 * Ports: StyleRatingCalculator.getTier, .calculateDripRating.
 * Spec: SC-Module-Architecture-Guide.md §4.1, §18, §19
 */

import { component } from "./explain.mjs";
import { getTunables } from "../config/tunables.mjs";

const TIER_ORDER = ["tier9", "tier8", "tier7", "tier6", "tier5", "tier4", "tier3", "tier2", "tier1"];

/**
 * Map a style score to its tier.
 * @param {number} score   style rating total
 * @param {object} tiers   config TIERS map (tier1..tier9 → {min,name,icon,grade})
 * @returns macro-compatible {key,min,name,icon,grade,number} + {label,blurb,components,tunablesApplied}
 */
export function tier(score, tiers) {
  for (const key of TIER_ORDER) {
    if (score >= tiers[key].min) return buildTier(key, tiers[key], score);
  }
  return buildTier("tier1", tiers.tier1, score);
}

function buildTier(key, t, score) {
  const number = parseInt(key.replace("tier", ""));
  const grade = t.grade || "F";
  return {
    // ---- Phase 82-compatible core (parity compares these)
    key,
    min: t.min,
    name: t.name,
    icon: t.icon,
    grade,
    number,
    // ---- explainability
    label: t.name,
    blurb: `Style score ${score} clears ${t.min} → ${t.name} (grade ${grade}).`,
    components: [
      component("style score", score, "styleRating.total"),
      component(`${key}.min`, t.min, "config.ratings.TIERS"),
    ],
    tunablesApplied: {},
  };
}

/**
 * Map total wardrobe cost (eurobucks) to a "drip" rating.
 * @param {number} totalCost
 * @param {object} [tunables] resolved tunables (defaults to getTunables())
 * @returns macro-compatible {rating,tier,grade} + {value,label,blurb,components,tunablesApplied}
 */
export function dripRating(totalCost, tunables = getTunables()) {
  const table = tunables.ratings.dripTiers;
  const hit = table.find((row) => totalCost >= row.minCost) ?? table[table.length - 1];
  return {
    // ---- Phase 82-compatible core
    rating: hit.rating,
    tier: hit.tier,
    grade: hit.grade,
    // ---- explainability
    value: hit.tier,
    label: hit.rating,
    blurb: `Wardrobe worth ${totalCost}eb → ${hit.rating}.`,
    components: [component("total cost", totalCost, "collected.totalCost")],
    tunablesApplied: { "ratings.dripTiers.minCost": hit.minCost },
  };
}
