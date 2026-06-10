/**
 * config/scene-gates.mjs — seed defaults (guide §5.3).
 *
 * Lifted VERBATIM from stylechecker2_0_Phase82.js
 * StyleDataManager.getDefaultSceneGatesData(). Do not hand-edit — regenerate via
 * tools/extract-config.mjs if the reference macro changes.
 *
 * Top-level keys: 1.
 */

export const SCENE_GATES = {
      gates: {
        "afterlife": {
          name: "The Afterlife",
          icon: "fa-skull-crossbones",
          description: "Legendary fixer bar. Only edgerunners with rep get in.",
          criteria: {
            minStyleScore: 300,
            maxStyleScore: null,
            requiredStyles: [],
            bannedStyles: ["businesswear"],
            factionCheck: null,
            hostileFactions: ["ncpd", "netwatch"],
            visibleChromePolicy: "preferred",
            visibleWeaponsPolicy: "tolerated",
            concealedWeaponsPolicy: "allowed",
            minTier: 3,
            maxVisibleChrome: null,
            minVisibleChrome: null,
            dressCode: null,
            minCool: 4,
            minRep: 3,
            maxRep: null,
            minGrooming: null,
            minWS: null,
            notes: "Edgerunner look expected. Corpos get side-eye. Need rep to get past Rogue's bouncers."
          }
        },
        "corpo_restaurant": {
          name: "Corpo Plaza Restaurant",
          icon: "fa-utensils",
          description: "High-end executive dining. Formal only.",
          criteria: {
            minStyleScore: 500,
            maxStyleScore: null,
            requiredStyles: ["highFashion", "businesswear"],
            bannedStyles: ["gangColors", "nomadLeathers", "bagLadyChic"],
            factionCheck: null,
            hostileFactions: ["maelstrom", "scavengers", "wraiths"],
            visibleChromePolicy: "banned",
            visibleWeaponsPolicy: "banned",
            concealedWeaponsPolicy: "tolerated",
            minTier: 5,
            maxVisibleChrome: 0,
            minVisibleChrome: null,
            dressCode: "formal",
            minCool: null,
            minRep: null,
            maxRep: null,
            minGrooming: 4,
            minWS: 3,
            notes: "No visible chrome, no visible weapons, formal wear required. Grooming and style knowledge expected."
          }
        },
        "totentanz": {
          name: "Totentanz",
          icon: "fa-fire-alt",
          description: "Maelstrom territory. Chrome is king.",
          criteria: {
            minStyleScore: null,
            maxStyleScore: 2000,
            requiredStyles: [],
            bannedStyles: ["highFashion", "businesswear"],
            factionCheck: "maelstrom",
            hostileFactions: ["arasaka", "militech", "ncpd"],
            visibleChromePolicy: "required",
            visibleWeaponsPolicy: "tolerated",
            concealedWeaponsPolicy: "allowed",
            minTier: null,
            maxVisibleChrome: null,
            minVisibleChrome: 2,
            dressCode: null,
            minCool: null,
            minRep: null,
            maxRep: 6,
            minGrooming: null,
            minWS: null,
            notes: "Visible chrome preferred. Corpo looks get hostility. High-rep targets draw unwanted attention."
          }
        },
        "tyger_dojo": {
          name: "Tyger Claw Dojo",
          icon: "fa-torii-gate",
          description: "Tyger Claw territory. Wrong colors mean confrontation.",
          criteria: {
            minStyleScore: null,
            maxStyleScore: null,
            requiredStyles: ["asiaPop"],
            bannedStyles: ["gangColors"],
            factionCheck: "tyger_claws",
            hostileFactions: ["maelstrom", "sixth_street", "wraiths"],
            visibleChromePolicy: "tolerated",
            visibleWeaponsPolicy: "banned",
            concealedWeaponsPolicy: "tolerated",
            minTier: null,
            maxVisibleChrome: null,
            minVisibleChrome: null,
            dressCode: null,
            minCool: 3,
            minRep: null,
            maxRep: null,
            minGrooming: null,
            minWS: null,
            notes: "Faction check active. Wrong affiliation = confrontation. Keep your composure."
          }
        },
        "lizzie_bar": {
          name: "Lizzie's Bar",
          icon: "fa-heart",
          description: "Mox territory. Safe space vibes.",
          criteria: {
            minStyleScore: null,
            maxStyleScore: null,
            requiredStyles: [],
            bannedStyles: [],
            factionCheck: null,
            hostileFactions: ["tyger_claws", "scavengers"],
            visibleChromePolicy: "tolerated",
            visibleWeaponsPolicy: "banned",
            concealedWeaponsPolicy: "tolerated",
            minTier: null,
            maxVisibleChrome: null,
            minVisibleChrome: null,
            dressCode: null,
            minCool: null,
            minRep: null,
            maxRep: null,
            minGrooming: null,
            minWS: null,
            notes: "Weapons at the door. Hostile factions get bounced."
          }
        }
      }
    };

export default SCENE_GATES;
