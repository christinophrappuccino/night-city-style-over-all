/**
 * config/districts.mjs — seed defaults (guide §5.3).
 *
 * Lifted VERBATIM from stylechecker2_0_Phase82.js
 * StyleDataManager.getDefaultDistrictsData(). Do not hand-edit — regenerate via
 * tools/extract-config.mjs if the reference macro changes.
 *
 * M9.1 EXCEPTION: `palette` fields (§9.2 district palette hints — on-palette
 * outfits nudge district fit) are a post-macro schema extension authored by
 * hand on select districts. If this file is ever regenerated, re-apply them
 * (git diff shows where). DataStore deep-merges them into existing worlds.
 *
 * Top-level keys: 25.
 */

export const DISTRICTS = {

    // ═══════════════════════════════════════
    // THE ISLAND - Heart of Night City
    // ═══════════════════════════════════════

    "LITTLE_EUROPE": {
      "name": "Little Europe",
      "type": "mixed",
      "factions": {
        "controlling": ["ncpd"],
        "friendly": ["sixth_street", "eurotrashers"],
        "hostile": ["maelstrom", "undertow"]
      },
      "modifiers": {
        "highFashion": 15,
        "businesswear": 20,
        "genericChic": 10,
        "bohemian": 15,
        "gangColors": -20,
        "bagLadyChic": -15,
        "nomadLeathers": -15
      },
      "flavorText": {
        "good": "Old brick and new glass — your look splits the difference just right. The locals approve.",
        "bad": "This neighborhood can't decide what it wants to be, and neither can your outfit. You stick out on both sides of the divide."
      },
      "statModifiers": { "repWeight": 1.0, "coolWeight": 1.2, "groomingWeight": 1.3 }
    },

    "UPPER_MARINA": {
      "name": "Upper Marina",
      "type": "mixed",
      "factions": {
        "controlling": ["ncpd"],
        "friendly": ["street_queens", "prime_time_players"],
        "hostile": ["maelstrom"]
      },
      "modifiers": {
        "urbanFlash": 20,
        "highFashion": 15,
        "genericChic": 10,
        "bohemian": 10,
        "nomadLeathers": 5,
        "gangColors": -10,
        "bagLadyChic": -15
      },
      "flavorText": {
        "good": "Dock salt and neon — you look like you belong at The Afterlife's front door. Rogue would approve.",
        "bad": "This is edgerunner country, choom. Your look says 'mark' louder than a neon sign on a foggy night."
      },
      "statModifiers": { "repWeight": 1.5, "coolWeight": 1.3, "groomingWeight": 0.8 }
    },

    "DOWNTOWN": {
      "name": "Downtown",
      "type": "corpo",
      "factions": {
        "controlling": ["whitewater_security"],
        "friendly": ["eastern_tigers", "skiv_family"],
        "hostile": ["undertow", "scavvers"]
      },
      "modifiers": {
        "businesswear": 30,
        "highFashion": 25,
        "genericChic": 10,
        "leisurewear": 5,
        "gangColors": -30,
        "bagLadyChic": -40,
        "nomadLeathers": -25,
        "urbanFlash": -10
      },
      "flavorText": {
        "good": "Whitewater's mercs give you the once-over and decide you belong. The Chamber of Commerce is rebuilding this district in chrome and glass, and you fit the vision.",
        "bad": "Whitewater Security's already running your face. This is the shiny new Night City — no room for street trash in the brochure."
      },
      "statModifiers": { "repWeight": 0.5, "coolWeight": 1.5, "groomingWeight": 1.8 }
    },

    "HOT_ZONE": {
      "name": "The Hot Zone",
      "type": "danger",
      "factions": {
        "controlling": ["maelstrom", "scavvers"],
        "friendly": ["reckoners", "lightning_cats"],
        "hostile": ["ncpd", "militech", "trauma_team"]
      },
      "modifiers": {
        "gangColors": 35,
        "nomadLeathers": 25,
        "bagLadyChic": 30,
        "urbanFlash": 10,
        "highFashion": -45,
        "businesswear": -45,
        "leisurewear": -30,
        "genericChic": -10
      },
      "flavorText": {
        "good": "Twisted rebar and rad-dust — you look like you crawled out of the rubble and liked it. The Totentanz regulars barely glance your way.",
        "bad": "Corporate Center died in '23, choom. Whatever you're wearing screams 'I wandered into the wrong post-apocalypse.' Maelstrom's already sizing up your chrome."
      },
      "statModifiers": { "repWeight": 2.0, "coolWeight": 1.5, "groomingWeight": 0.2 }
    },

    "LITTLE_CHINA": {
      "name": "Little China",
      "type": "mixed",
      "factions": {
        "controlling": ["gold_dragons"],
        "friendly": ["weng_fang_tong"],
        "hostile": ["red_chrome_legion"]
      },
      "modifiers": {
        "asiaPop": 25,
        "genericChic": 15,
        "urbanFlash": 10,
        "bagLadyChic": 10,
        "highFashion": -15,
        "businesswear": -10,
        "nomadLeathers": -10
      },
      "flavorText": {
        "good": "The Gold Dragons' patrols let you pass without a second look. Guăngbō Tower's lights reflect off your threads — you read the neighborhood right.",
        "bad": "David Ling Po's people are watching. Wrong vibe for a community fighting its way out of the combat zones. Outsider energy."
      },
      "statModifiers": { "repWeight": 1.0, "coolWeight": 1.0, "groomingWeight": 0.8 }
    },

    "UNIVERSITY_DISTRICT": {
      "name": "University District",
      "type": "mixed",
      "factions": {
        "controlling": ["ncu_security"],
        "friendly": ["philharmonic_vampyres", "princesses_of_justice"],
        "hostile": ["kill_krashers", "iron_sights"]
      },
      "modifiers": {
        "bohemian": 25,
        "genericChic": 20,
        "bagLadyChic": 15,
        "urbanFlash": 10,
        "businesswear": -15,
        "highFashion": -10,
        "gangColors": -10
      },
      "flavorText": {
        "good": "NCU campus vibes — your look says 'I might attend class' or at least 'I know someone who does.' The Vampyres nod from the symphony hall steps.",
        "bad": "Too polished for the students, too rough for the faculty. Campus security's got eyes on you from behind the fortified walls."
      },
      "statModifiers": { "repWeight": 0.8, "coolWeight": 1.0, "groomingWeight": 1.0 }
    },

    "THE_GLEN": {
      "name": "The Glen",
      "type": "corpo",
      "factions": {
        "controlling": ["ncpd", "night_corp"],
        "friendly": ["weng_fang_tong"],
        "hostile": ["deadwoods", "kill_krashers", "reckoners"]
      },
      "modifiers": {
        "businesswear": 30,
        "highFashion": 25,
        "genericChic": 15,
        "leisurewear": 10,
        "gangColors": -35,
        "bagLadyChic": -40,
        "nomadLeathers": -25,
        "urbanFlash": -5
      },
      "flavorText": {
        "good": "City Hall, the banks, the power brokers — you move through The Glen like you've got a meeting with the City Manager. Merrill Asukaga's lobby staff don't blink.",
        "bad": "The administrative heart of Night City, and you look like you're here to rob it. NCPD Precinct #1 is right around the corner."
      },
      "statModifiers": { "repWeight": 0.5, "coolWeight": 1.5, "groomingWeight": 2.0 }
    },

    "OLD_JAPANTOWN": {
      "name": "Old Japantown",
      "type": "danger",
      "factions": {
        "controlling": ["tyger_claws", "kimen_gumi"],
        "friendly": ["kanzaki_family"],
        "hostile": ["maelstrom", "red_chrome_legion", "iron_sights"]
      },
      "modifiers": {
        "asiaPop": 30,
        "urbanFlash": 15,
        "gangColors": 15,
        "genericChic": 5,
        "bagLadyChic": 10,
        "highFashion": -20,
        "businesswear": -25,
        "leisurewear": -15
      },
      "flavorText": {
        "good": "Islands of civilization in a sea of chaos — and you look like you belong on the islands. The Kimen-Gumi patrols wave you through. Sake at Mrs. Suzuki's tonight.",
        "bad": "Tyger Claws run what's left of the old Japanese quarter, and they don't like surprises. Your outfit's screaming outsider in a neighborhood that eats outsiders."
      },
      "statModifiers": { "repWeight": 1.5, "coolWeight": 1.2, "groomingWeight": 0.5 }
    },

    "SOUTH_NIGHT_CITY": {
      "name": "South Night City",
      "type": "danger",
      "factions": {
        "controlling": ["scythe_security"],
        "friendly": ["tyger_claws", "kill_krashers", "the_enhanced"],
        "hostile": ["ncpd", "zoners"]
      },
      "modifiers": {
        "gangColors": 30,
        "urbanFlash": 15,
        "bagLadyChic": 20,
        "genericChic": 10,
        "nomadLeathers": 10,
        "highFashion": -35,
        "businesswear": -35,
        "leisurewear": -20
      },
      "flavorText": {
        "good": "Scythe Security doesn't bother with you — that means you look like you can handle yourself. In South NC, that's the highest compliment.",
        "bad": "Bozos, Reckoners, Kill Krashers, and a City Manager who's pocketing your safety budget. Your outfit says 'victim' in six different gang languages."
      },
      "statModifiers": { "repWeight": 1.5, "coolWeight": 1.5, "groomingWeight": 0.3 }
    },

    "PORT_OF_NIGHT_CITY": {
      "name": "Port of Night City",
      "type": "industrial",
      "factions": {
        "controlling": ["thelas"],
        "friendly": ["consortium", "deadwoods"],
        "hostile": ["maelstrom", "scavvers"]
      },
      "modifiers": {
        "nomadLeathers": 30,
        "genericChic": 20,
        "bagLadyChic": 15,
        "gangColors": 5,
        "highFashion": -30,
        "businesswear": -20,
        "leisurewear": -20,
        "asiaPop": -10
      },
      "flavorText": {
        "good": "Salt air and diesel — the Thelas Marines size you up and let you pass. You look like someone who knows which end of a cargo hook to grab.",
        "bad": "The Port belongs to the Thelas nomads. You look like cargo, not crew. Calypso's people are deciding if you're worth the hassle."
      },
      "statModifiers": { "repWeight": 1.2, "coolWeight": 1.0, "groomingWeight": 0.5 }
    },

    "RECLAMATION_ZONE": {
      "name": "Reclamation Zone",
      "type": "mixed",
      "factions": {
        "controlling": ["los_perros_guardianes"],
        "friendly": ["tombstone_preservers"],
        "hostile": ["scavvers", "kill_krashers"]
      },
      "modifiers": {
        "nomadLeathers": 25,
        "genericChic": 20,
        "bagLadyChic": 10,
        "urbanFlash": 5,
        "highFashion": -20,
        "businesswear": -15,
        "gangColors": -10
      },
      "flavorText": {
        "good": "The reclaimers rebuilt this district with their own hands. Your practical look says you might do the same. Los Perros nod as the transit bus rolls past.",
        "bad": "Santos Dorado's people turned nomad grit into public infrastructure. Your look says you're here to take, not to build."
      },
      "statModifiers": { "repWeight": 1.0, "coolWeight": 0.8, "groomingWeight": 0.7 }
    },

    "OLD_COMBAT_ZONE": {
      "name": "Old Combat Zone",
      "type": "danger",
      "factions": {
        "controlling": ["edgerunners_inc"],
        "friendly": ["the_faded", "shroomers"],
        "hostile": ["iron_sights", "scavvers"]
      },
      "modifiers": {
        "gangColors": 30,
        "bagLadyChic": 30,
        "nomadLeathers": 20,
        "urbanFlash": 15,
        "genericChic": 10,
        "highFashion": -45,
        "businesswear": -45,
        "leisurewear": -30
      },
      "flavorText": {
        "good": "The worst combat zone Night City ever produced — and you look like you're here to help reclaim it. Brick Coleman's crew gives you the edgerunner nod.",
        "bad": "Iron Sights, Scavvers, and whatever crawled out of The Underground. You look like a lost tourist in a warzone. The Faded are already deciding your fate."
      },
      "palette": ["#7f4f24", "#582f0e", "#333333", "#8c8c8c"],
      "statModifiers": { "repWeight": 2.0, "coolWeight": 1.5, "groomingWeight": 0.2 }
    },

    // ═══════════════════════════════════════
    // NORTHSIDE - Megabuildings & Military
    // ═══════════════════════════════════════

    "NORCAL_MILITARY_BASE": {
      "name": "NorCal Military Base",
      "type": "military",
      "factions": {
        "controlling": ["militech", "norcal_military"],
        "friendly": [],
        "hostile": ["maelstrom", "scavvers", "tyger_claws"]
      },
      "modifiers": {
        "businesswear": 25,
        "genericChic": 20,
        "nomadLeathers": 10,
        "gangColors": -45,
        "bagLadyChic": -40,
        "highFashion": -15,
        "urbanFlash": -25,
        "asiaPop": -20,
        "bohemian": -30
      },
      "flavorText": {
        "good": "Functional and forgettable — exactly what the NorCal Military Police like to see. The Militech liaison doesn't even look up from their datapad.",
        "bad": "General Giovanni runs a tight operation. Whatever you're wearing just got you flagged for enhanced screening. This isn't a district — it's a fortress."
      },
      "statModifiers": { "repWeight": 0.3, "coolWeight": 1.5, "groomingWeight": 1.5 }
    },

    "WATSON_DEVELOPMENT": {
      "name": "Watson Development",
      "type": "mixed",
      "factions": {
        "controlling": ["ncpd"],
        "friendly": ["tyger_claws", "kanzaki_family"],
        "hostile": ["arzin_tynon", "wild_things"]
      },
      "modifiers": {
        "asiaPop": 25,
        "businesswear": 15,
        "urbanFlash": 15,
        "genericChic": 10,
        "highFashion": -5,
        "bagLadyChic": -15,
        "nomadLeathers": -10
      },
      "flavorText": {
        "good": "The NCCS built this district on Japanese corporate eddies, and your look meshes with the neon-lit megabuildings. Lucius Rhyne's labor victory gave this place new energy.",
        "bad": "Watson's caught between corporate development and tent city desperation. Your outfit picked the wrong side of that line."
      },
      "statModifiers": { "repWeight": 1.0, "coolWeight": 1.0, "groomingWeight": 1.0 }
    },

    "KABUKI": {
      "name": "Kabuki",
      "type": "mixed",
      "factions": {
        "controlling": ["tyger_claws", "kimen_gumi"],
        "friendly": ["g3"],
        "hostile": ["kanzaki_family", "maelstrom"]
      },
      "modifiers": {
        "asiaPop": 35,
        "urbanFlash": 20,
        "highFashion": 10,
        "genericChic": 5,
        "gangColors": 5,
        "bagLadyChic": -20,
        "nomadLeathers": -20,
        "businesswear": -5
      },
      "flavorText": {
        "good": "The Nakagawa Theater glows behind you — Kabuki is the brain and heart of the NCCS, and your look speaks the right language. Even G3's anime-obsessed psychos leave you alone.",
        "bad": "Kabuki is Tyger Claw territory, pure and simple. The Kimen-Gumi provide security and they remember every face that doesn't fit."
      },
      "palette": ["#ff2a6d", "#05d9e8", "#ff0033"],
      "statModifiers": { "repWeight": 1.0, "coolWeight": 1.2, "groomingWeight": 1.2 }
    },

    // ═══════════════════════════════════════
    // MAINLAND - The Overpacked Suburbs
    // ═══════════════════════════════════════

    "NEW_WESTBROOK": {
      "name": "New Westbrook",
      "type": "mixed",
      "factions": {
        "controlling": ["ncpd"],
        "friendly": ["prime_time_players", "street_queens", "tombstone_preservers"],
        "hostile": ["arzin_tynon", "scavvers"]
      },
      "modifiers": {
        "highFashion": 15,
        "urbanFlash": 20,
        "leisurewear": 15,
        "genericChic": 10,
        "bohemian": 10,
        "gangColors": -15,
        "bagLadyChic": -20,
        "nomadLeathers": -15
      },
      "flavorText": {
        "good": "Glitz meets tent city — New Westbrook is a contradiction, and your outfit threads the needle. Network 54's cameras might catch a good angle of you.",
        "bad": "WorldSat compounds and battle royale film sets on one side, desperate squatters on the other. You don't fit either world."
      },
      "statModifiers": { "repWeight": 1.0, "coolWeight": 1.2, "groomingWeight": 1.2 }
    },

    "CHARTER_HILL": {
      "name": "Charter Hill",
      "type": "luxury",
      "factions": {
        "controlling": ["militech"],
        "friendly": ["tombstone_preservers", "prime_time_players"],
        "hostile": ["tyger_claws", "scavvers"]
      },
      "modifiers": {
        "highFashion": 25,
        "businesswear": 25,
        "leisurewear": 15,
        "genericChic": 5,
        "gangColors": -35,
        "bagLadyChic": -40,
        "nomadLeathers": -25,
        "urbanFlash": -10
      },
      "flavorText": {
        "good": "Militech security gives you the professional once-over and waves you through. Charter Hill's aspiring corpos see a peer. The view of the Exec Zone shimmers above.",
        "bad": "Upper middle management lives here, dreaming of the Exec Zone. Your look says you took a wrong turn off the highway. Militech's drones are already tracking."
      },
      "statModifiers": { "repWeight": 0.5, "coolWeight": 1.3, "groomingWeight": 1.8 }
    },

    "EXEC_ZONE": {
      "name": "Exec Zone",
      "type": "luxury",
      "factions": {
        "controlling": ["lazarus"],
        "friendly": [],
        "hostile": ["maelstrom", "scavvers", "iron_sights", "kill_krashers"]
      },
      "modifiers": {
        "highFashion": 35,
        "businesswear": 30,
        "leisurewear": 15,
        "gangColors": -50,
        "bagLadyChic": -50,
        "nomadLeathers": -40,
        "urbanFlash": -20,
        "genericChic": -15,
        "asiaPop": -10,
        "bohemian": -10
      },
      "flavorText": {
        "good": "Lazarus security — the best eddies can buy — scans you and finds nothing objectionable. Inside these walls, only the truly elite breathe easy. You fit.",
        "bad": "The most secure district in Night City, and you look like the threat it was built to keep out. Lazarus operatives are already converging."
      },
      "palette": ["#1c2541", "#3a506b", "#c0c0c0", "#0a0a0a"],
      "statModifiers": { "repWeight": 0.3, "coolWeight": 1.5, "groomingWeight": 2.5 }
    },

    "HEYWOOD_DOCKS": {
      "name": "Heywood Docks",
      "type": "industrial",
      "factions": {
        "controlling": ["sk_security"],
        "friendly": ["skiv_family", "deadwoods"],
        "hostile": ["scavvers", "maelstrom"]
      },
      "modifiers": {
        "genericChic": 20,
        "nomadLeathers": 15,
        "businesswear": 10,
        "urbanFlash": 5,
        "bagLadyChic": -10,
        "highFashion": -20,
        "gangColors": -10
      },
      "flavorText": {
        "good": "SK Security runs the docks tight — corporate ships in, nomad ships out. Your look says you've got business here, and business is what they understand.",
        "bad": "The Skiv Family runs the underside of these docks. Your outfit's broadcasting the wrong frequency for a place where bodies wash up quietly."
      },
      "statModifiers": { "repWeight": 1.0, "coolWeight": 1.0, "groomingWeight": 0.8 }
    },

    "NORTH_HEYWOOD": {
      "name": "North Heywood",
      "type": "mixed",
      "factions": {
        "controlling": ["sixth_street"],
        "friendly": ["inquisitors", "the_muses"],
        "hostile": ["maelstrom", "the_enhanced", "toecutters"]
      },
      "modifiers": {
        "nomadLeathers": 15,
        "gangColors": 20,
        "genericChic": 20,
        "urbanFlash": 10,
        "highFashion": -20,
        "businesswear": -10,
        "asiaPop": -15,
        "leisurewear": -10
      },
      "flavorText": {
        "good": "6th Street runs security here — vets and blue-collar pride. Dynalar workers nod on their commute. You look like one of the neighborhood.",
        "bad": "Working-class Heywood doesn't have time for flash or pretension. The Armory's right around the corner, and 6th Street patrols don't suffer fools."
      },
      "statModifiers": { "repWeight": 1.2, "coolWeight": 1.0, "groomingWeight": 0.7 }
    },

    "HEYWOOD_INDUSTRIAL": {
      "name": "Heywood Industrial Zone",
      "type": "industrial",
      "factions": {
        "controlling": ["ncpd"],
        "friendly": ["consortium", "deadwoods"],
        "hostile": ["the_enhanced", "scavvers"]
      },
      "modifiers": {
        "genericChic": 20,
        "nomadLeathers": 20,
        "bagLadyChic": 15,
        "gangColors": 10,
        "highFashion": -30,
        "businesswear": -15,
        "leisurewear": -20,
        "asiaPop": -10
      },
      "flavorText": {
        "good": "Warehouses, factories, and derelict cargo ships. Fixie's Couriers weave past on their bikes. You look like you've got a shift to pull or a deal to close.",
        "bad": "Zhirafa drones overhead, Consortium muscle on the ground. Your outfit's drawing attention in a zone where attention gets expensive fast."
      },
      "statModifiers": { "repWeight": 1.0, "coolWeight": 0.8, "groomingWeight": 0.5 }
    },

    "SANTO_DOMINGO": {
      "name": "Santo Domingo",
      "type": "mixed",
      "factions": {
        "controlling": ["aldecaldos"],
        "friendly": ["steel_vaqueros", "el_norte_cartel"],
        "hostile": ["kill_krashers", "rat_kings"]
      },
      "modifiers": {
        "nomadLeathers": 30,
        "gangColors": 15,
        "genericChic": 15,
        "bagLadyChic": 10,
        "urbanFlash": 5,
        "highFashion": -25,
        "businesswear": -20,
        "leisurewear": -15,
        "asiaPop": -15
      },
      "flavorText": {
        "good": "The Aldecaldo camp sits at the base of the Petrochem dam — family, loyalty, and road dust. Your look belongs. Theresa Valentino's people barely glance up.",
        "bad": "Nomad territory with cartel connections. Your outfit screams outsider in a community built on family bonds. The Steel Vaqueros are sizing you up."
      },
      "statModifiers": { "repWeight": 1.5, "coolWeight": 1.0, "groomingWeight": 0.4 }
    },

    // ═══════════════════════════════════════
    // SOUTHSIDE - Vacation Meets Wasteland
    // ═══════════════════════════════════════

    "PACIFICA_PLAYGROUND": {
      "name": "Pacifica Playground",
      "type": "mixed",
      "factions": {
        "controlling": ["militech"],
        "friendly": ["sixth_street", "piranhas"],
        "hostile": ["voodoo_boys", "mudang_gumi"]
      },
      "modifiers": {
        "leisurewear": 25,
        "urbanFlash": 20,
        "highFashion": 10,
        "genericChic": 10,
        "gangColors": -10,
        "bagLadyChic": -25,
        "nomadLeathers": -15,
        "businesswear": -10
      },
      "flavorText": {
        "good": "Playland by the Sea sparkles behind Militech's security cordon. Tourist flash mixed with corporate polish — you fit right into Night City's premiere attraction.",
        "bad": "Between the Piranhas' parties and the Voodoo Boys' drug corners, Pacifica's a minefield. Your look picked the wrong postcard."
      },
      "statModifiers": { "repWeight": 0.8, "coolWeight": 1.0, "groomingWeight": 1.2 }
    },

    "RANCHO_CORONADO": {
      "name": "Rancho Coronado",
      "type": "danger",
      "factions": {
        "controlling": [],
        "friendly": ["sixth_street", "steel_vaqueros", "albino_alligators"],
        "hostile": ["voodoo_boys", "dirty_hippies"]
      },
      "modifiers": {
        "bagLadyChic": 30,
        "nomadLeathers": 25,
        "gangColors": 20,
        "genericChic": 15,
        "highFashion": -40,
        "businesswear": -35,
        "leisurewear": -20,
        "asiaPop": -15
      },
      "flavorText": {
        "good": "No City Manager, no real cops, no rules. Your outfit says you brought your own. The Albino Alligators salute you with a popped collar and a grin.",
        "bad": "Night City's forgotten edge. No governance, no services, no mercy. You look like someone who expected civilization. There isn't any out here."
      },
      "statModifiers": { "repWeight": 1.5, "coolWeight": 1.2, "groomingWeight": 0.2 }
    },

    // ═══════════════════════════════════════
    // BEYOND THE CITY
    // ═══════════════════════════════════════

    "BADLANDS": {
      "name": "The Badlands",
      "type": "wasteland",
      "factions": {
        "controlling": ["aldecaldos"],
        "friendly": ["steel_vaqueros", "sixth_street"],
        "hostile": ["raffen_shiv", "militech"]
      },
      "modifiers": {
        "nomadLeathers": 40,
        "bagLadyChic": 25,
        "gangColors": 5,
        "highFashion": -45,
        "businesswear": -40,
        "asiaPop": -25,
        "leisurewear": -30,
        "urbanFlash": -20
      },
      "flavorText": {
        "good": "Dust-worn and road-ready. The nomad camps see one of their own — or at least someone smart enough to dress like one. Woodchipper's night market awaits.",
        "bad": "Corpo threads in the wasteland? The Raffen Shiv will strip you for parts before sundown. Out here, your outfit is a death sentence."
      },
      "statModifiers": { "repWeight": 2.0, "coolWeight": 1.0, "groomingWeight": 0.2 }
    }
  };

export default DISTRICTS;
