/**
 * config/ratings.mjs — seed defaults (guide §5.3).
 *
 * Lifted VERBATIM from stylechecker2_0_Phase82.js
 * StyleDataManager.getDefaultRatingsData(). Do not hand-edit — regenerate via
 * tools/extract-config.mjs if the reference macro changes.
 *
 * Top-level keys: 2.
 */

export const RATINGS = {
      RATING_FORMULA: {
        weights: { clothing_cost: 0.30, cyberware_cool: 0.20, fashionware_bonus: 0.15, accessory_count: 0.10, style_synergy: 0.25 },
        bonuses: { complete_outfit: 50, matching_set: 30, signature_look: 20 },
        scalers: { clothing_cost_divisor: 10, cyberware_cool_multiplier: 3, fashionware_multiplier: 1, accessory_multiplier: 25, synergy_multiplier: 12 },
        socialModifiers: { ws_percent_per_level: 4, grooming_percent_per_level: 3, cool_flat_per_point: 3, rep_impact_multiplier: 0.05 }
      },
      TIERS: {
        tier9: { min: 900, name: "Myth Made Flesh", icon: "fas fa-sun", grade: "SSS" },
        tier8: { min: 700, name: "Walking Dynasty", icon: "fas fa-dragon", grade: "SS" },
        tier7: { min: 525, name: "Legendary Icon", icon: "fas fa-crown", grade: "S+" },
        tier6: { min: 380, name: "Street Legend", icon: "fas fa-star", grade: "S" },
        tier5: { min: 260, name: "Style Maven", icon: "fas fa-gem", grade: "A" },
        tier4: { min: 155, name: "Fashion Forward", icon: "fas fa-bolt", grade: "B" },
        tier3: { min: 75, name: "Average Joe", icon: "fas fa-meh", grade: "C" },
        tier2: { min: 20, name: "Low Effort", icon: "fas fa-thumbs-down", grade: "D" },
        tier1: { min: 0, name: "Disaster Zone", icon: "fas fa-skull", grade: "F" }
      }
    };

export default RATINGS;
