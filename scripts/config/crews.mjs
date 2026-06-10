/**
 * config/crews.mjs — seed defaults (guide §5.3).
 *
 * Lifted VERBATIM from stylechecker2_0_Phase82.js
 * StyleDataManager.getDefaultCrewData(). Do not hand-edit — regenerate via
 * tools/extract-config.mjs if the reference macro changes.
 *
 * Top-level keys: 3.
 */

export const CREWS = {
          crews: {
              "default": {
                  name: "Main Crew",
                  icon: "fa-users",
                  members: [],
                  created: new Date().toISOString()
              }
          },
          activeCrew: "default",
          REPUTATION_TIERS: {
            tier9: { min: 2000, name: "Myth Made Flesh", icon: "fas fa-sun", grade: "SSS" },
            tier8: { min: 1500, name: "Walking Dynasty", icon: "fas fa-dragon", grade: "SS" },
            tier7: { min: 1000, name: "Legendary Icon", icon: "fas fa-crown", grade: "S+" },
            tier6: { min: 750, name: "Street Legend", icon: "fas fa-star", grade: "S" },
            tier5: { min: 500, name: "Style Maven", icon: "fas fa-gem", grade: "A" },
            tier4: { min: 300, name: "Fashion Forward", icon: "fas fa-bolt", grade: "B" },
            tier3: { min: 150, name: "Average Joe", icon: "fas fa-meh", grade: "C" },
            tier2: { min: 50, name: "Low Effort", icon: "fas fa-thumbs-down", grade: "D" },
            tier1: { min: 0, name: "Disaster Zone", icon: "fas fa-skull", grade: "F" }
          }
      };

export default CREWS;
