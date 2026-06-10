/**
 * config/factions.mjs — seed defaults (guide §5.3).
 *
 * Lifted VERBATIM from stylechecker2_0_Phase82.js
 * StyleDataManager.getDefaultFactionsData(). Do not hand-edit — regenerate via
 * tools/extract-config.mjs if the reference macro changes.
 *
 * Top-level keys: 3.
 */

export const FACTIONS = {
    FACTION_ARCHETYPES: {
        // ═══════════════════════════════════════
        // CORPO — 3 Sub-Archetypes
        // ═══════════════════════════════════════
        // The corps are weakened but not dead. Post-4th War corporate culture has
        // fragmented into distinct operational modes: suits who run the offices,
        // security forces who protect them, and shadowy agents who do the real work.

        corpo_suit: {
          label: "Corporate Suit",
          parent: "corpo",
          description: "Middle management, acquisitions, PR, logistics. The 4th War thinned the herd but someone still has to push paper and close deals. Boardroom polish, hidden augmentation, wardrobe that says 'I survived the restructuring.'",
          styleProfile: {
            businesswear: 0.50,
            highFashion: 0.20,
            genericChic: 0.20,
            leisurewear: 0.10
          },
          antiStyles: {
            bagLadyChic: -30,
            gangColors: -25,
            nomadLeathers: -20,
            urbanFlash: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.10,
          costExpectation: { floor: 1500, sweet: 4000, ceiling: null },
          armorTolerance: -10
        },

        corpo_security: {
          label: "Corporate Security Operative",
          parent: "corpo",
          description: "Militech field agents, NCCS enforcement details, corporate extraction teams. Tactical gear under business-casual layers. These are the people corps send when a problem needs to disappear without making the evening news.",
          styleProfile: {
            businesswear: 0.30,
            urbanFlash: 0.25,
            genericChic: 0.25,
            nomadLeathers: 0.20
          },
          antiStyles: {
            bagLadyChic: -25,
            bohemian: -20,
            highFashion: -15,
            asiaPop: -10
          },
          chromeProfile: "combat_chrome",
          chromeWeight: 0.25,
          costExpectation: { floor: 1000, sweet: 3000, ceiling: 6000 },
          armorTolerance: 20
        },

        corpo_agent: {
          label: "Corporate Agent",
          parent: "corpo",
          description: "The invisible hand. Intel operatives, corporate spies, deniable assets. Expensive enough to move in exec circles, plain enough to disappear into a crowd. Their chrome is the kind you don't see until it's too late.",
          styleProfile: {
            genericChic: 0.35,
            businesswear: 0.30,
            highFashion: 0.20,
            leisurewear: 0.15
          },
          antiStyles: {
            gangColors: -30,
            bagLadyChic: -25,
            nomadLeathers: -15,
            urbanFlash: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.20,
          costExpectation: { floor: 2000, sweet: 5000, ceiling: null },
          armorTolerance: -10
        },


        // ═══════════════════════════════════════
        // EXEC — 2 Sub-Archetypes
        // ═══════════════════════════════════════
        // The apex predators. These are the people who came out of the 4th Corporate
        // War richer. The socialites throw the parties; the power brokers own the buildings.

        exec_socialite: {
          label: "Executive Socialite",
          parent: "exec",
          description: "Club Atlantis regulars, charity gala hosts, the faces corporations put on magazine covers. Fashion-forward, fashionware-enhanced, and completely untouchable. Their outfit costs more than most people's apartments.",
          styleProfile: {
            highFashion: 0.60,
            leisurewear: 0.20,
            businesswear: 0.15,
            asiaPop: 0.05
          },
          antiStyles: {
            bagLadyChic: -40,
            gangColors: -35,
            nomadLeathers: -30,
            genericChic: -20,
            urbanFlash: -10
          },
          chromeProfile: "fashionware",
          chromeWeight: 0.15,
          costExpectation: { floor: 5000, sweet: 12000, ceiling: null },
          armorTolerance: -35
        },

        exec_power: {
          label: "Executive Power Broker",
          parent: "exec",
          description: "Board members, majority shareholders, the names on the buildings. They don't need to dress flashy — everyone already knows who they are. Tailored businesswear, discreet chrome, Lazarus on speed-dial.",
          styleProfile: {
            businesswear: 0.45,
            highFashion: 0.40,
            leisurewear: 0.15
          },
          antiStyles: {
            bagLadyChic: -40,
            gangColors: -35,
            nomadLeathers: -30,
            urbanFlash: -15,
            genericChic: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.05,
          costExpectation: { floor: 6000, sweet: 15000, ceiling: null },
          armorTolerance: -10
        },


        // ═══════════════════════════════════════
        // GANG — 8 Sub-Archetypes
        // ═══════════════════════════════════════
        // Night City has 40+ gangs in 2045. They don't all look the same.
        // Boosters live for chrome and combat. Posers live for identity.
        // Organized crime runs like a business. Cults run on belief.

        gang_booster: {
          label: "Gang Booster",
          parent: "gang",
          description: "Chrome-heavy combat gangers. Maelstrom, Iron Sights, Kill Krashers — these are the ones who solve every problem with violence and visible augmentation. Gang colors worn loud, armor welcome, subtlety optional.",
          styleProfile: {
            gangColors: 0.45,
            urbanFlash: 0.30,
            nomadLeathers: 0.15,
            genericChic: 0.10
          },
          antiStyles: {
            businesswear: -30,
            highFashion: -25,
            bohemian: -15,
            leisurewear: -10
          },
          chromeProfile: "combat_chrome",
          chromeWeight: 0.40,
          costExpectation: { floor: 100, sweet: 800, ceiling: 2500 },
          armorTolerance: 15
        },

        gang_poser: {
          label: "Poser Gang",
          parent: "gang",
          description: "Identity is the weapon. Bozos in permanent clown biosculpts, Voodoo Boys channeling Hollywood voodoo chic, Philharmonic Vampyres in full gothic regalia. The look IS the gang — fashionware and commitment over combat chrome.",
          styleProfile: {
            urbanFlash: 0.35,
            asiaPop: 0.25,
            bohemian: 0.20,
            gangColors: 0.20
          },
          antiStyles: {
            businesswear: -25,
            genericChic: -15,
            nomadLeathers: -10
          },
          chromeProfile: "fashionware",
          chromeWeight: 0.30,
          costExpectation: { floor: 200, sweet: 1200, ceiling: 3500 },
          armorTolerance: -10
        },

        gang_organized: {
          label: "Organized Crime",
          parent: "gang",
          description: "Tyger Claws in silk and katanas, Gold Dragons running Little China like a sovereign state, Eastern Tigers moving product through the port. Structured, territorial, and dressed sharp enough to do business while carrying a sword.",
          styleProfile: {
            gangColors: 0.30,
            asiaPop: 0.30,
            urbanFlash: 0.20,
            businesswear: 0.20
          },
          antiStyles: {
            bagLadyChic: -20,
            bohemian: -15,
            nomadLeathers: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.20,
          costExpectation: { floor: 500, sweet: 2000, ceiling: 5000 },
          armorTolerance: 5
        },

        gang_cult: {
          label: "Gang Cult",
          parent: "gang",
          description: "Ideology over territory. Doomsday preachers, apocalyptic nihilists, spiritual zealots — the belief system IS the gang. Reckoners performing the Harvest of Souls, fringe sects recruiting from the desperate. The look serves the faith, not the other way around.",
          styleProfile: {
            gangColors: 0.30,
            bagLadyChic: 0.30,
            bohemian: 0.25,
            urbanFlash: 0.15
          },
          antiStyles: {
            businesswear: -20,
            highFashion: -20,
            leisurewear: -15
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.15,
          costExpectation: { floor: 50, sweet: 500, ceiling: 2000 },
          armorTolerance: 10
        },

        gang_cult_purity: {
          label: "Anti-Chrome Cult",
          parent: "gang",
          description: "Chrome is corruption. Flesh is sacred. The Inquisitors and their imitators rip implants from the unwilling, preaching salvation through pain and purity. Austere clothes, zero visible augmentation, and the unshakable conviction that the chromed masses are damned. Their aesthetic is deliberate poverty — stripped down, scrubbed clean, violently organic.",
          styleProfile: {
            bagLadyChic: 0.35,
            bohemian: 0.30,
            gangColors: 0.20,
            genericChic: 0.15
          },
          antiStyles: {
            highFashion: -30,
            businesswear: -25,
            urbanFlash: -15,
            leisurewear: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.02,
          costExpectation: { floor: 20, sweet: 300, ceiling: 1200 },
          armorTolerance: 5
        },

        gang_cult_chrome: {
          label: "Chrome Cult",
          parent: "gang",
          description: "Cyberpsychosis isn't a disease — it's evolution. The Enhanced and their fellow travelers worship augmentation as transcendence, pushing their bodies past every safety threshold the ripperdocs recommend. Maximum chrome, maximum visibility, minimum regard for humanity loss. They see the chrome-mad as prophets, not patients.",
          styleProfile: {
            gangColors: 0.35,
            urbanFlash: 0.35,
            genericChic: 0.20,
            bagLadyChic: 0.10
          },
          antiStyles: {
            highFashion: -25,
            businesswear: -25,
            bohemian: -20,
            leisurewear: -15
          },
          chromeProfile: "combat_chrome",
          chromeWeight: 0.45,
          costExpectation: { floor: 100, sweet: 600, ceiling: null },
          armorTolerance: 15
        },
        gang_militia: {
          label: "Gang Militia",
          parent: "gang",
          description: "6th Street patriots, Steel Patriots, territorial defense gangs who think they're soldiers. Flag patches, unit insignia, military surplus over gang colors. They hold blocks like platoons and call it 'community defense.' The line between neighborhood watch and armed occupation depends on which side of the barricade you're standing on.",
          styleProfile: {
            gangColors: 0.35,
            nomadLeathers: 0.25,
            genericChic: 0.25,
            urbanFlash: 0.15
          },
          antiStyles: {
            highFashion: -25,
            businesswear: -20,
            bohemian: -15,
            asiaPop: -10
          },
          chromeProfile: "combat_chrome",
          chromeWeight: 0.20,
          costExpectation: { floor: 200, sweet: 600, ceiling: 2000 },
          armorTolerance: 20
        },

        gang_boss: {
          label: "Crime Lord",
          parent: "gang",
          description: "The top of the food chain. Tyger Claw oyabun in tailored silk with clan tattoos visible at the collar, Valentino captain in a custom suit with gold-plated iron, Maelstrom boss who cleaned up enough to negotiate territory deals over expensive whiskey. Gang colors meet corporate money — the outfit says 'I own this block and I can afford to prove it.'",
          styleProfile: {
            gangColors: 0.30,
            highFashion: 0.30,
            businesswear: 0.25,
            urbanFlash: 0.15
          },
          antiStyles: {
            bagLadyChic: -35,
            bohemian: -25,
            nomadLeathers: -15,
            leisurewear: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.15,
          costExpectation: { floor: 3000, sweet: 8000, ceiling: null },
          armorTolerance: -5
        },


        // ═══════════════════════════════════════
        // NOMAD — 4 Sub-Archetypes
        // ═══════════════════════════════════════
        // The nomad nations are the backbone of post-War logistics. But there's
        // a world of difference between a family caravan and a Raffen raiding party.

        nomad_clan: {
          label: "Nomad Clan Member",
          parent: "nomad",
          description: "Aldecaldos, Thelas, Steel Vaqueros — the family nations that kept the world running when the cities burned. Road-worn leathers with family patches, practical bioware, vehicles maintained better than most people's lives.",
          styleProfile: {
            nomadLeathers: 0.55,
            genericChic: 0.20,
            bagLadyChic: 0.15,
            gangColors: 0.10
          },
          antiStyles: {
            highFashion: -30,
            businesswear: -25,
            leisurewear: -15,
            asiaPop: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.20,
          costExpectation: { floor: 100, sweet: 600, ceiling: 2500 },
          armorTolerance: 15
        },

        nomad_raider: {
          label: "Nomad Raider",
          parent: "nomad",
          description: "Raffen Shiv, Toecutters, and every other pack of road pirates preying on the highways. Scavenged gear, stolen chrome, and a look that says 'I'll kill you for your fuel.' The nomad nations' disowned children.",
          styleProfile: {
            nomadLeathers: 0.35,
            bagLadyChic: 0.35,
            gangColors: 0.20,
            urbanFlash: 0.10
          },
          antiStyles: {
            highFashion: -35,
            businesswear: -30,
            leisurewear: -25
          },
          chromeProfile: "combat_chrome",
          chromeWeight: 0.25,
          costExpectation: { floor: 0, sweet: 300, ceiling: 1500 },
          armorTolerance: 20
        },

        nomad_trader: {
          label: "Nomad Trader",
          parent: "nomad",
          description: "Caravan traders, supply chain specialists, nomad fixers who move between the clans and the cities. Clean enough to do business in Watson, road-tough enough to survive the Badlands. The bridge between two worlds.",
          styleProfile: {
            nomadLeathers: 0.35,
            genericChic: 0.30,
            businesswear: 0.20,
            bagLadyChic: 0.15
          },
          antiStyles: {
            highFashion: -20,
            gangColors: -15,
            urbanFlash: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.15,
          costExpectation: { floor: 300, sweet: 1200, ceiling: 3500 },
          armorTolerance: 5
        },

        nomad_corpo: {
          label: "Corporate Fleet",
          parent: "nomad",
          description: "The nomad who took the corporate contract. Petrochem pipeline escort, Militech convoy driver, SovOil tanker runner. Still wears the leathers, still drives the rig, but the patches say Petrochem instead of a clan name. The clan thinks they sold out. The corp thinks they're disposable. They're making more money than either side admits.",
          styleProfile: {
            nomadLeathers: 0.35,
            businesswear: 0.30,
            genericChic: 0.20,
            urbanFlash: 0.15
          },
          antiStyles: {
            highFashion: -20,
            bohemian: -15,
            bagLadyChic: -10,
            asiaPop: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.20,
          costExpectation: { floor: 800, sweet: 2500, ceiling: 5000 },
          armorTolerance: 10
        },

        // ═══════════════════════════════════════
        // TECHIE — 6 Sub-Archetypes
        // ═══════════════════════════════════════
        // The old NET is dead. The new breed runs local architecture, builds custom
        // hardware, or works corporate R&D labs. Different workshop, different wardrobe.

        techie_netrunner: {
          label: "Netrunner",
          parent: "techie",
          description: "Post-DataKrash netrunners jacking into local architecture, running daemon programs against Black ICE. Interface plugs, neural links, and clothes that don't get in the way of a twelve-hour hack session. Wires over silk, function over form.",
          styleProfile: {
            genericChic: 0.35,
            urbanFlash: 0.30,
            bagLadyChic: 0.20,
            asiaPop: 0.15
          },
          antiStyles: {
            highFashion: -20,
            businesswear: -15,
            nomadLeathers: -10,
            leisurewear: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.35,
          costExpectation: { floor: 100, sweet: 600, ceiling: 2000 },
          armorTolerance: -15
        },

        techie_maker: {
          label: "Techie Maker",
          parent: "techie",
          description: "Inventors, fabricators, jury-riggers. Workshop dwellers covered in solder burns and machine oil. They build the gear everyone else depends on — weapons, vehicles, cyberware, explosives. Form follows function, and the function is creation.",
          styleProfile: {
            bagLadyChic: 0.35,
            genericChic: 0.35,
            nomadLeathers: 0.20,
            urbanFlash: 0.10
          },
          antiStyles: {
            highFashion: -25,
            leisurewear: -15,
            businesswear: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.25,
          costExpectation: { floor: 50, sweet: 400, ceiling: 1500 },
          armorTolerance: 0
        },

        techie_corpo: {
          label: "Corporate Technician",
          parent: "techie",
          description: "R&D labs, corporate server farms, the people who keep Night Corp's reconstruction algorithms running or Raven Microcybernetics' prototypes on schedule. Technical skill wrapped in business-casual packaging.",
          styleProfile: {
            businesswear: 0.35,
            genericChic: 0.35,
            urbanFlash: 0.15,
            leisurewear: 0.15
          },
          antiStyles: {
            gangColors: -20,
            bagLadyChic: -15,
            nomadLeathers: -10,
            bohemian: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.20,
          costExpectation: { floor: 500, sweet: 1500, ceiling: 4000 },
          armorTolerance: -15
        },

        techie_scrapper: {
          label: "Junkyard Engineer",
          parent: "techie",
          description: "Builds weapons from garbage and calls it innovation. Combat Zone workshops, scrapyard salvage operations, the person who can make a working SMG from a toaster and spite. Covered in grease, solder burns, and the kind of confidence that comes from knowing exactly how everything around you works — and how to break it.",
          styleProfile: {
            bagLadyChic: 0.40,
            nomadLeathers: 0.25,
            genericChic: 0.20,
            urbanFlash: 0.15
          },
          antiStyles: {
            highFashion: -30,
            businesswear: -25,
            leisurewear: -15,
            asiaPop: -10
          },
          chromeProfile: "visible_chrome",
          chromeWeight: 0.30,
          costExpectation: { floor: 50, sweet: 350, ceiling: 1200 },
          armorTolerance: 10
        },

        techie_hacker: {
          label: "Black Hat Hacker",
          parent: "techie",
          description: "Interface plugs at the temple, custom deck in a holster that cost more than the rest of the outfit combined, data cables braided into the jacket lining. The illegal side of the NET — intrusion specialists, data thieves, ICE crackers for hire. Half their wardrobe exists to hold hardware. The other half exists to look good on camera when they inevitably end up on someone's security feed.",
          styleProfile: {
            urbanFlash: 0.35,
            genericChic: 0.25,
            asiaPop: 0.25,
            bagLadyChic: 0.15
          },
          antiStyles: {
            businesswear: -20,
            highFashion: -15,
            nomadLeathers: -10,
            leisurewear: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.40,
          costExpectation: { floor: 300, sweet: 1000, ceiling: 3000 },
          armorTolerance: -15
        },

        techie_corponet: {
          label: "Corporate Netrunner",
          parent: "techie",
          description: "Arasaka ICE architects, Militech cyberwarfare division, the people who build the walls that keep street runners out. Same skills as a black hat, wrapped in corp-casual packaging with expensive interface hardware and subtle neural port jewelry. Climate-controlled offices instead of basement server racks. The NET is the same — the paycheck isn't.",
          styleProfile: {
            businesswear: 0.35,
            genericChic: 0.30,
            urbanFlash: 0.20,
            asiaPop: 0.15
          },
          antiStyles: {
            bagLadyChic: -25,
            gangColors: -20,
            nomadLeathers: -15,
            bohemian: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.35,
          costExpectation: { floor: 1500, sweet: 4000, ceiling: null },
          armorTolerance: -15
        },

        // ═══════════════════════════════════════
        // MEDIA — 3 Sub-Archetypes
        // ═══════════════════════════════════════
        // Truth is the most dangerous weapon in the Time of the Red.
        // But the delivery method matters as much as the message.

        media_anchor: {
          label: "Media Anchor",
          parent: "media",
          description: "Network 54 on-camera talent, prime-time faces, polished talking heads. Every hair sculpted, every outfit screen-tested. Fashionware tuned to broadcast perfectly under studio lights. They read the news — whether it's real or not.",
          styleProfile: {
            highFashion: 0.45,
            leisurewear: 0.25,
            businesswear: 0.20,
            genericChic: 0.10
          },
          antiStyles: {
            bagLadyChic: -35,
            gangColors: -25,
            nomadLeathers: -20,
            urbanFlash: -10
          },
          chromeProfile: "fashionware",
          chromeWeight: 0.25,
          costExpectation: { floor: 2000, sweet: 5000, ceiling: null },
          armorTolerance: -35
        },

        media_gonzo: {
          label: "Gonzo Journalist",
          parent: "media",
          description: "Street-level reporters, screamsheet stringers, war correspondents who run toward the gunfire. Equipment shoved into every pocket, press badge that may or may not be real, dressed to survive a riot and file copy from the back of a stolen car.",
          styleProfile: {
            urbanFlash: 0.30,
            genericChic: 0.25,
            bohemian: 0.25,
            bagLadyChic: 0.20
          },
          antiStyles: {
            highFashion: -15,
            businesswear: -10,
            leisurewear: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.20,
          costExpectation: { floor: 200, sweet: 1000, ceiling: 3000 },
          armorTolerance: 5
        },

        media_pirate: {
          label: "Pirate Media",
          parent: "media",
          description: "Underground broadcasters, data-bloggers, pirate radio operators. They run their signal through jury-rigged local NET architecture and dress like they live in their studio — because they do. The truth doesn't need production value.",
          styleProfile: {
            bohemian: 0.35,
            bagLadyChic: 0.25,
            urbanFlash: 0.25,
            genericChic: 0.15
          },
          antiStyles: {
            businesswear: -20,
            highFashion: -15,
            leisurewear: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.30,
          costExpectation: { floor: 50, sweet: 500, ceiling: 2000 },
          armorTolerance: -5
        },


        // ═══════════════════════════════════════
        // SOLO — 5 Sub-Archetypes
        // ═══════════════════════════════════════
        // The 4th Corporate War made thousands of killers and gave them nothing
        // to do afterward. Now they freelance — but not all freelancing looks the same.

        solo_merc: {
          label: "Solo Mercenary",
          parent: "solo",
          description: "Professional edgerunners. Contract killers, extraction specialists, the people Fixers call when the job needs a trigger finger. Visible combat chrome, tactical wear that says 'I'm working,' and enough firepower to make a point.",
          styleProfile: {
            urbanFlash: 0.35,
            nomadLeathers: 0.25,
            gangColors: 0.20,
            genericChic: 0.20
          },
          antiStyles: {
            highFashion: -15,
            bohemian: -20,
            leisurewear: -20
          },
          chromeProfile: "combat_chrome",
          chromeWeight: 0.35,
          costExpectation: { floor: 500, sweet: 2000, ceiling: null },
          armorTolerance: 25
        },

        solo_bodyguard: {
          label: "Solo Bodyguard",
          parent: "solo",
          description: "Corporate protection details, exec escorts, VIP security. They need to look professional enough to stand next to a boardroom and lethal enough that nobody tests them. Business-adjacent wardrobe with combat chrome underneath.",
          styleProfile: {
            businesswear: 0.35,
            genericChic: 0.25,
            urbanFlash: 0.25,
            nomadLeathers: 0.15
          },
          antiStyles: {
            bagLadyChic: -25,
            bohemian: -20,
            gangColors: -15
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.25,
          costExpectation: { floor: 1000, sweet: 3000, ceiling: 6000 },
          armorTolerance: 10
        },

        solo_veteran: {
          label: "4th War Veteran",
          parent: "solo",
          description: "They survived the 4th Corporate War and the scars — physical and chrome — never healed. Military bearing, surplus gear mixed with whatever works, and augmentation that was cutting-edge a decade ago. They don't dress to impress. They dress to survive.",
          styleProfile: {
            nomadLeathers: 0.35,
            genericChic: 0.30,
            urbanFlash: 0.20,
            bagLadyChic: 0.15
          },
          antiStyles: {
            highFashion: -25,
            bohemian: -20,
            leisurewear: -15,
            asiaPop: -10
          },
          chromeProfile: "combat_chrome",
          chromeWeight: 0.30,
          costExpectation: { floor: 200, sweet: 1000, ceiling: 3000 },
          armorTolerance: 20
        },

        solo_assassin: {
          label: "Solo Assassin",
          parent: "solo",
          description: "The high-end contractor. Arasaka sends them when they want deniability and elegance in the same package. They blend into a cocktail party, leave through the kitchen, and the target doesn't make the morning news. Expensive taste, hidden chrome, and the kind of calm that makes Fixers nervous.",
          styleProfile: {
            businesswear: 0.30,
            highFashion: 0.25,
            genericChic: 0.25,
            urbanFlash: 0.20
          },
          antiStyles: {
            bagLadyChic: -30,
            gangColors: -25,
            nomadLeathers: -15,
            bohemian: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.30,
          costExpectation: { floor: 2000, sweet: 3500, ceiling: 8000 },
          armorTolerance: -5
        },

        solo_corpo: {
          label: "Corporate Operative",
          parent: "solo",
          description: "Arasaka wet-work specialists, Militech counter-terrorism agents, Lazarus Group extraction teams. Not security guards — those are corpo_security. Not freelance muscle — those are solo_merc. These are the corporate killers who arrive in tailored suits with suppressed weapons and leave before anyone realizes what happened. The person corpo_agent calls when negotiation fails.",
          styleProfile: {
            businesswear: 0.40,
            highFashion: 0.25,
            genericChic: 0.20,
            urbanFlash: 0.15
          },
          antiStyles: {
            bagLadyChic: -35,
            gangColors: -25,
            nomadLeathers: -20,
            bohemian: -15
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.35,
          costExpectation: { floor: 2500, sweet: 6000, ceiling: null },
          armorTolerance: -10
        },

        // ═══════════════════════════════════════
        // FIXER — 5 Sub-Archetypes
        // ═══════════════════════════════════════
        // Every deal in Night City passes through a Fixer.
        // The question is what level of deal — and what level of danger.

        fixer_broker: {
          label: "Power Broker",
          parent: "fixer",
          description: "Afterlife regulars, high-end deal makers, the ones who move contracts worth more than most districts. Expensive enough to be trusted, connected enough to be feared. They dress like execs but carry themselves like predators.",
          styleProfile: {
            highFashion: 0.30,
            businesswear: 0.30,
            genericChic: 0.20,
            leisurewear: 0.20
          },
          antiStyles: {
            bagLadyChic: -30,
            gangColors: -20,
            nomadLeathers: -15
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.10,
          costExpectation: { floor: 2000, sweet: 5000, ceiling: 10000 },
          armorTolerance: -20
        },

        fixer_street: {
          label: "Street Fixer",
          parent: "fixer",
          description: "Neighborhood connectors, small-time operators, the people who know a guy who knows a guy. They move in the spaces between gangs and corps, dressed clean but not flashy, visible but not memorable. The grease in Night City's gears.",
          styleProfile: {
            genericChic: 0.35,
            urbanFlash: 0.25,
            businesswear: 0.20,
            gangColors: 0.20
          },
          antiStyles: {
            highFashion: -15,
            bagLadyChic: -15,
            nomadLeathers: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.10,
          costExpectation: { floor: 500, sweet: 1500, ceiling: 4000 },
          armorTolerance: -5
        },

        fixer_syndicate: {
          label: "Syndicate Operator",
          parent: "fixer",
          description: "Organized crime logistics — Consortium money laundering, El Norte supply chains, Weng Fang Tong gambling operations. They dress for the business they run, which is usually illegal but always professional. Sharp, calm, connected.",
          styleProfile: {
            businesswear: 0.30,
            asiaPop: 0.25,
            genericChic: 0.25,
            highFashion: 0.20
          },
          antiStyles: {
            bagLadyChic: -25,
            nomadLeathers: -20,
            bohemian: -15
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.15,
          costExpectation: { floor: 1000, sweet: 3500, ceiling: 8000 },
          armorTolerance: -10
        },

        fixer_smuggler: {
          label: "Smuggler",
          parent: "fixer",
          description: "The hands-on logistics specialist. Brokers arrange the deal. Fences move the product. Smugglers physically carry it through the checkpoint, across the Badlands, past the NCPD cordon. Nomad-adjacent aesthetic with enough street cred to move between worlds and enough pockets to hide the merchandise.",
          styleProfile: {
            nomadLeathers: 0.30,
            genericChic: 0.30,
            urbanFlash: 0.25,
            bagLadyChic: 0.15
          },
          antiStyles: {
            highFashion: -20,
            businesswear: -15,
            leisurewear: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.15,
          costExpectation: { floor: 300, sweet: 800, ceiling: 2500 },
          armorTolerance: 10
        },

        fixer_corpo: {
          label: "Corporate Handler",
          parent: "fixer",
          description: "The internal fixer who never left the tower. Corporate headhunters, asset managers, the people who 'arrange things' inside the machine. They don't make deals in bars — they make them in conference rooms with NDAs and armed security outside the door. HR meets espionage meets logistics. Different from an Exec who commands — Handlers connect, facilitate, and take their cut.",
          styleProfile: {
            businesswear: 0.40,
            highFashion: 0.30,
            genericChic: 0.15,
            leisurewear: 0.15
          },
          antiStyles: {
            bagLadyChic: -35,
            gangColors: -30,
            nomadLeathers: -20,
            bohemian: -15
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.10,
          costExpectation: { floor: 3000, sweet: 7000, ceiling: null },
          armorTolerance: -20
        },

        // ═══════════════════════════════════════
        // ROCKERBOY — 5 Sub-Archetypes
        // ═══════════════════════════════════════
        // Johnny Silverhand is dead, but charismatic leadership takes many forms.
        // Some rock stadiums, some rock basements, some rock barricades.

        rocker_rebel: {
          label: "Rebel Rocker",
          parent: "rockerboy",
          description: "Anti-corpo firebrands carrying Silverhand's torch. Street rallies, protest music, weaponized charisma aimed at whatever power structure deserves it this week. Bohemian flash with enough edge to start a riot.",
          styleProfile: {
            bohemian: 0.40,
            urbanFlash: 0.30,
            gangColors: 0.15,
            genericChic: 0.15
          },
          antiStyles: {
            businesswear: -35,
            highFashion: -15,
            leisurewear: -10
          },
          chromeProfile: "fashionware",
          chromeWeight: 0.20,
          costExpectation: { floor: 300, sweet: 1500, ceiling: 4000 },
          armorTolerance: -15
        },

        rocker_idol: {
          label: "Pop Idol",
          parent: "rockerboy",
          description: "Manufactured stars, club headliners, the faces on billboards and braindance ads. High fashion meets stage presence — Asia Pop influence, cutting-edge fashionware, and a look designed to sell records and break hearts.",
          styleProfile: {
            highFashion: 0.35,
            asiaPop: 0.30,
            urbanFlash: 0.20,
            leisurewear: 0.15
          },
          antiStyles: {
            bagLadyChic: -30,
            nomadLeathers: -20,
            genericChic: -10
          },
          chromeProfile: "fashionware",
          chromeWeight: 0.30,
          costExpectation: { floor: 1000, sweet: 4000, ceiling: 8000 },
          armorTolerance: -25
        },

        rocker_underground: {
          label: "Underground Scene",
          parent: "rockerboy",
          description: "Basement shows, warehouse raves, Totentanz regulars. The music scene that doesn't make the news but defines the culture. Urban flash mixed with whatever makes a statement — DIY aesthetics, loud chrome, louder attitude.",
          styleProfile: {
            urbanFlash: 0.40,
            bohemian: 0.25,
            gangColors: 0.20,
            asiaPop: 0.15
          },
          antiStyles: {
            businesswear: -25,
            highFashion: -10,
            genericChic: -10
          },
          chromeProfile: "display_chrome",
          chromeWeight: 0.25,
          costExpectation: { floor: 200, sweet: 1000, ceiling: 3500 },
          armorTolerance: -5
        },

        rocker_activist: {
          label: "Protest Singer",
          parent: "rockerboy",
          description: "The rockerboy who uses music as a political weapon. Protest marches, underground rallies, anti-corpo anthems broadcast from pirate radio stations. Gang colors worn as solidarity, bohemian aesthetic as rejection of corporate culture. More Johnny Silverhand's ideology than his look — the message IS the style.",
          styleProfile: {
            gangColors: 0.35,
            bohemian: 0.30,
            urbanFlash: 0.20,
            genericChic: 0.15
          },
          antiStyles: {
            businesswear: -35,
            highFashion: -30,
            leisurewear: -15
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.15,
          costExpectation: { floor: 200, sweet: 800, ceiling: 2500 },
          armorTolerance: 5
        },

        rocker_corporate: {
          label: "Brand Rocker",
          parent: "rockerboy",
          description: "The rockerboy who took the corpo deal. Energy drink sponsorships, branded concert tours, corpo event appearances. High fashion meets stage presence, every outfit worth more than a Combat Zone apartment. Hated by the underground, loved by the mainstream, visible everywhere. The tension between art and commerce is their entire identity.",
          styleProfile: {
            highFashion: 0.35,
            urbanFlash: 0.30,
            leisurewear: 0.20,
            asiaPop: 0.15
          },
          antiStyles: {
            bagLadyChic: -35,
            nomadLeathers: -20,
            gangColors: -15,
            genericChic: -10
          },
          chromeProfile: "fashionware",
          chromeWeight: 0.25,
          costExpectation: { floor: 2000, sweet: 5000, ceiling: null },
          armorTolerance: -20
        },

        // ═══════════════════════════════════════
        // LAWMAN — 3 Sub-Archetypes
        // ═══════════════════════════════════════
        // The badge means something different depending on who's paying for it.

        lawman_beat: {
          label: "NCPD Beat Cop",
          parent: "lawman",
          description: "Standard Night City Police Department patrol officers. Underpaid, undermanned, and covering the districts that can't afford better. Practical gear, standard-issue chrome, and a strong preference for not dying before pension kicks in.",
          styleProfile: {
            genericChic: 0.40,
            businesswear: 0.30,
            urbanFlash: 0.15,
            nomadLeathers: 0.15
          },
          antiStyles: {
            gangColors: -30,
            bohemian: -20,
            bagLadyChic: -15,
            highFashion: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.15,
          costExpectation: { floor: 300, sweet: 1200, ceiling: 3500 },
          armorTolerance: 20
        },

        lawman_deputy: {
          label: "Deputized Security",
          parent: "lawman",
          description: "Kimen-Gumi in Old Japantown, Whitewater in Downtown, Scythe in South Night City — private security forces operating with district authority. Better equipped than NCPD, answering to whoever pays the contract. Corporate law with a badge.",
          styleProfile: {
            businesswear: 0.35,
            genericChic: 0.30,
            urbanFlash: 0.20,
            nomadLeathers: 0.15
          },
          antiStyles: {
            gangColors: -25,
            bagLadyChic: -20,
            bohemian: -15,
            highFashion: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.20,
          costExpectation: { floor: 500, sweet: 1800, ceiling: 4500 },
          armorTolerance: 15
        },

        lawman_trauma: {
          label: "Trauma Team",
          parent: "lawman",
          description: "The most elite emergency response in Night City. Armed medics in full tactical gear who extract paying clients from any situation — gunfight, building collapse, cyberpsycho incident. Medical chrome and military hardware, dressed to save lives by force.",
          styleProfile: {
            genericChic: 0.35,
            businesswear: 0.30,
            urbanFlash: 0.20,
            nomadLeathers: 0.15
          },
          antiStyles: {
            gangColors: -25,
            bohemian: -20,
            bagLadyChic: -15,
            highFashion: -10,
            asiaPop: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.25,
          costExpectation: { floor: 1000, sweet: 3000, ceiling: 6000 },
          armorTolerance: 25
        },


        // ═══════════════════════════════════════
        // MEDTECH — 4 Sub-Archetypes
        // ═══════════════════════════════════════
        // Everyone in Night City is augmented. Someone has to keep the chrome running.

        medtech_ripper: {
          label: "Street Ripperdoc",
          parent: "medtech",
          description: "Back-alley chrome installers, no-questions-asked surgeons, the people you visit when you can't afford Trauma Team. Workshop chic with surgical precision — scrubs over street clothes, bioware they installed themselves, and a clientele that pays in cash.",
          styleProfile: {
            bagLadyChic: 0.30,
            genericChic: 0.40,
            urbanFlash: 0.15,
            nomadLeathers: 0.15
          },
          antiStyles: {
            highFashion: -20,
            businesswear: -15,
            gangColors: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.25,
          costExpectation: { floor: 200, sweet: 800, ceiling: 2500 },
          armorTolerance: -5
        },

        medtech_clinic: {
          label: "Clinical Medtech",
          parent: "medtech",
          description: "Licensed practitioners, corporate medical staff, hospital surgeons. Clean facilities, proper equipment, and a wardrobe that says 'I went to medical school — probably.' Businesswear under the lab coat, bioware for surgical precision.",
          styleProfile: {
            businesswear: 0.40,
            genericChic: 0.30,
            leisurewear: 0.20,
            highFashion: 0.10
          },
          antiStyles: {
            gangColors: -25,
            nomadLeathers: -15,
            urbanFlash: -10,
            bagLadyChic: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.15,
          costExpectation: { floor: 800, sweet: 2500, ceiling: 5000 },
          armorTolerance: -15
        },

        medtech_combat: {
          label: "Combat Medic",
          parent: "medtech",
          description: "Battlefield medics, nomad healers, edgerunner team medtechs who patch you up mid-firefight. Half solo, half surgeon — tactical gear with medical loadout, bioware for steady hands, and chrome that helps them keep you alive while someone's shooting at both of you.",
          styleProfile: {
            genericChic: 0.30,
            nomadLeathers: 0.30,
            urbanFlash: 0.25,
            bagLadyChic: 0.15
          },
          antiStyles: {
            highFashion: -20,
            leisurewear: -15,
            businesswear: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.25,
          costExpectation: { floor: 400, sweet: 1500, ceiling: 3500 },
          armorTolerance: 15
        },

        medtech_trauma: {
          label: "Trauma Team Operative",
          parent: "medtech",
          description: "Militarized paramedics. Trauma Team platinum response — armed AV extraction, combat triage under fire, and a corporate mandate that says 'keep the client alive, bill them later.' Tactical gear meets medical equipment, bioware for surgical precision in a firefight. They dress like soldiers because that's what the job requires.",
          styleProfile: {
            urbanFlash: 0.30,
            businesswear: 0.25,
            genericChic: 0.25,
            nomadLeathers: 0.20
          },
          antiStyles: {
            bagLadyChic: -25,
            bohemian: -20,
            gangColors: -15,
            asiaPop: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.20,
          costExpectation: { floor: 1500, sweet: 3000, ceiling: 6000 },
          armorTolerance: 15
        },


        // ═══════════════════════════════════════
        // STREETRAT — 4 Sub-Archetypes
        // ═══════════════════════════════════════
        // The bottom of Night City's food chain. But even at the bottom,
        // there are different ways to survive.

        streetrat_scavver: {
          label: "Scavenger",
          parent: "streetrat",
          description: "Night City's bottom feeders. Stripping chrome from corpses, recycling parts from abandoned buildings, selling whatever they find to whoever's buying. Dressed in whatever they scavenged today, augmented with whatever they pulled yesterday.",
          styleProfile: {
            bagLadyChic: 0.55,
            genericChic: 0.25,
            gangColors: 0.10,
            urbanFlash: 0.10
          },
          antiStyles: {
            highFashion: -40,
            businesswear: -35,
            leisurewear: -25,
            bohemian: -10
          },
          chromeProfile: "display_chrome",
          chromeWeight: 0.15,
          costExpectation: { floor: 0, sweet: 150, ceiling: 800 },
          armorTolerance: 5
        },

        streetrat_squatter: {
          label: "Combat Zone Squatter",
          parent: "streetrat",
          description: "Territorial survivors holding ground in the old combat zones, Hot Zone edges, and abandoned districts. They might not have much, but they'll fight for what they have. Scrapped-together outfits with gang-adjacent signaling and improvised armor.",
          styleProfile: {
            bagLadyChic: 0.40,
            gangColors: 0.25,
            genericChic: 0.20,
            nomadLeathers: 0.15
          },
          antiStyles: {
            highFashion: -35,
            businesswear: -30,
            leisurewear: -20
          },
          chromeProfile: "combat_chrome",
          chromeWeight: 0.20,
          costExpectation: { floor: 0, sweet: 250, ceiling: 1200 },
          armorTolerance: 10
        },

        streetrat_urchin: {
          label: "Street Urchin",
          parent: "streetrat",
          description: "Yogangs, kid crews, young survivors running in packs through Night City's cracks. Resourceful, fast, invisible to anyone looking for a threat. Oversized scavenged clothes, minimal chrome, and a talent for being underestimated.",
          styleProfile: {
            bagLadyChic: 0.40,
            genericChic: 0.30,
            urbanFlash: 0.20,
            asiaPop: 0.10
          },
          antiStyles: {
            highFashion: -35,
            businesswear: -35,
            leisurewear: -20,
            nomadLeathers: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.05,
          costExpectation: { floor: 0, sweet: 100, ceiling: 600 },
          armorTolerance: 0
        },

        streetrat_hustler: {
          label: "Street Hustler",
          parent: "streetrat",
          description: "Stolen flash on a scav's budget. Knockoff mirrorshades, thrift-store neon jacket, one piece of real chrome they can't afford to maintain. The gap between ambition and reality — aspiring to street cred, too broke to pull it off. Running small cons, moving small product, dreaming big while wearing someone else's castoffs. Every Combat Zone has a hundred of these.",
          styleProfile: {
            urbanFlash: 0.40,
            bagLadyChic: 0.30,
            genericChic: 0.20,
            gangColors: 0.10
          },
          antiStyles: {
            highFashion: -30,
            businesswear: -25,
            bohemian: -10,
            leisurewear: -10
          },
          chromeProfile: "display_chrome",
          chromeWeight: 0.20,
          costExpectation: { floor: 50, sweet: 400, ceiling: 1500 },
          armorTolerance: 0
        },

        // ═══════════════════════════════════════
        // EDGERUNNER — 1 Sub-Archetype
        // ═══════════════════════════════════════
        // The catch-all for armed, chromed professionals who don't fly
        // faction colors. Night City's gig economy workforce — they
        // dress forgettable because the chrome does the talking.

        edgerunner_freelance: {
          label: "Freelance Edgerunner",
          parent: "edgerunner",
          description: "Gig workers of the combat economy. No crew, no colors, no loyalty beyond the next paycheck. Generic clothes that won't get remembered by witnesses, chrome that gets the job done. Night City's most common dangerous person — the one you don't see coming because they look like everyone else.",
          styleProfile: {
            genericChic: 0.45,
            urbanFlash: 0.25,
            nomadLeathers: 0.15,
            bagLadyChic: 0.15
          },
          antiStyles: {
            highFashion: -20,
            businesswear: -15,
            asiaPop: -5
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.30,
          costExpectation: { floor: 100, sweet: 500, ceiling: 2000 },
          armorTolerance: 10
        },

        // ═══════════════════════════════════════
        // CHROMER — 1 Sub-Archetype
        // ═══════════════════════════════════════
        // Chrome addicts who prioritize metal over everything else.
        // Not Maelstrom — they lack the ideology. Just people who
        // keep going back to the ripperdoc until the money runs out.

        chromer_junkie: {
          label: "Chrome Junkie",
          parent: "chromer",
          description: "Ripperdoc frequent flyers. Every spare eddie goes under the knife — new optics, another reflex boost, maybe a limb upgrade just because it was on sale. The clothes are afterthoughts; the chrome is the identity. One bad week from cyberpsychosis, two bad weeks from Maelstrom recruitment.",
          styleProfile: {
            genericChic: 0.35,
            bagLadyChic: 0.35,
            urbanFlash: 0.20,
            nomadLeathers: 0.10
          },
          antiStyles: {
            highFashion: -25,
            businesswear: -25,
            leisurewear: -10
          },
          chromeProfile: "display_chrome",
          chromeWeight: 0.35,
          costExpectation: { floor: 0, sweet: 300, ceiling: 1000 },
          armorTolerance: 5
        },

        // ═══════════════════════════════════════
        // OPERATIVE — 1 Sub-Archetype
        // ═══════════════════════════════════════
        // The grey man. Deliberately unreadable, aggressively average
        // appearance hiding serious internal hardware. Could be corpo
        // deep cover, a retired solo, or someone who knows exactly
        // how faction detection works and built against it.

        operative_sleeper: {
          label: "Corporate Sleeper",
          parent: "operative",
          description: "Grey men. The wardrobe is deliberately generic — nothing memorable, nothing traceable. Underneath, they're running enough hidden chrome to level a city block. Could be deep-cover corpo assets, retired intelligence operatives, or edgerunners smart enough to know that the best disguise is being nobody at all.",
          styleProfile: {
            genericChic: 0.50,
            businesswear: 0.25,
            leisurewear: 0.15,
            urbanFlash: 0.10
          },
          antiStyles: {
            gangColors: -30,
            bagLadyChic: -20,
            nomadLeathers: -15
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.30,
          costExpectation: { floor: 300, sweet: 1000, ceiling: 3000 },
          armorTolerance: -5
        },

        // ═══════════════════════════════════════
        // CIVILIAN — 5 Sub-Archetypes
        // ═══════════════════════════════════════
        // The other 80% of Night City. Not everyone is an edgerunner, a corpo,
        // or a ganger. Someone has to run the noodle stands, drive the cabs,
        // file the paperwork, and try to survive another day without a headline.

        civilian_worker: {
          label: "Blue-Collar Worker",
          parent: "civilian",
          description: "Factory hands, dock workers, construction crews rebuilding Night City one block at a time. Generic clothes that can take a beating, steel-toed boots, maybe a hi-vis vest if the foreman's watching. They built the city everyone else fights over.",
          styleProfile: {
            genericChic: 0.55,
            bagLadyChic: 0.25,
            nomadLeathers: 0.15,
            urbanFlash: 0.05
          },
          antiStyles: {
            highFashion: -30,
            businesswear: -15,
            asiaPop: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.05,
          costExpectation: { floor: 50, sweet: 200, ceiling: 800 },
          armorTolerance: 5
        },

        civilian_resident: {
          label: "Night City Resident",
          parent: "civilian",
          description: "Apartment dwellers, commuters, the people filling the megabuilding elevators every morning. Generic clothing with just enough personal flair to feel human. Not making a statement — just making it to tomorrow.",
          styleProfile: {
            genericChic: 0.60,
            leisurewear: 0.20,
            bohemian: 0.10,
            asiaPop: 0.10
          },
          antiStyles: {
            gangColors: -20,
            nomadLeathers: -15,
            highFashion: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.05,
          costExpectation: { floor: 100, sweet: 400, ceiling: 1500 },
          armorTolerance: -15
        },

        civilian_student: {
          label: "Night City Student",
          parent: "civilian",
          description: "NCU undergrads, trade school apprentices, the next generation trying to learn their way out of the combat zones. Asia Pop trends mixed with whatever they can afford, campus fashion filtered through Night City survival instincts.",
          styleProfile: {
            asiaPop: 0.35,
            genericChic: 0.30,
            urbanFlash: 0.20,
            bohemian: 0.15
          },
          antiStyles: {
            businesswear: -15,
            nomadLeathers: -10,
            highFashion: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.05,
          costExpectation: { floor: 50, sweet: 400, ceiling: 1200 },
          armorTolerance: -20
        },

        civilian_vendor: {
          label: "Street Vendor",
          parent: "civilian",
          description: "Noodle cart operators, Night Market stall owners, the entrepreneurial backbone of every district. Dressed practical with cultural flair — aprons over Asia Pop cuts in Little China, leather work vests in Rancho Coronado. The food is usually better than the fashion.",
          styleProfile: {
            genericChic: 0.45,
            asiaPop: 0.20,
            bagLadyChic: 0.20,
            bohemian: 0.15
          },
          antiStyles: {
            highFashion: -20,
            businesswear: -10,
            gangColors: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.05,
          costExpectation: { floor: 50, sweet: 300, ceiling: 1000 },
          armorTolerance: -10
        },

        civilian_office: {
          label: "Office Worker",
          parent: "civilian",
          description: "Data entry clerks, receptionists, mail room runners. They wear businesswear because the dress code says so, not because they have power. The corpo machine needs cogs, and these are the ones who show up on time and pray their health insurance covers chrome maintenance.",
          styleProfile: {
            businesswear: 0.35,
            genericChic: 0.35,
            leisurewear: 0.20,
            urbanFlash: 0.10
          },
          antiStyles: {
            gangColors: -20,
            bagLadyChic: -15,
            nomadLeathers: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.05,
          costExpectation: { floor: 200, sweet: 600, ceiling: 2000 },
          armorTolerance: -20
        },


        // ═══════════════════════════════════════
        // ENTERTAINER — 3 Sub-Archetypes
        // ═══════════════════════════════════════
        // Distinct from Rockerboys (who weaponize charisma for political change).
        // These are Night City's entertainment industry — the braindance stars,
        // the club circuit regulars, and the licensed companions.

        entertainer_performer: {
          label: "Braindance Star",
          parent: "entertainer",
          description: "Net-54 celebrities, braindance actors, the faces on every holoboard in Watson. Asia Pop trends mixed with high fashion, fashionware tuned for maximum visual impact. They sell fantasies for a living and dress like one.",
          styleProfile: {
            asiaPop: 0.35,
            urbanFlash: 0.30,
            highFashion: 0.20,
            leisurewear: 0.15
          },
          antiStyles: {
            bagLadyChic: -30,
            gangColors: -20,
            nomadLeathers: -15
          },
          chromeProfile: "fashionware",
          chromeWeight: 0.25,
          costExpectation: { floor: 1000, sweet: 2000, ceiling: null },
          armorTolerance: -30
        },

        entertainer_dj: {
          label: "Club DJ",
          parent: "entertainer",
          description: "Headliners at The Afterlife's back room, Totentanz regulars, the soundtrack of Night City's nightlife. Urban flash with Asia Pop influence, gear that doubles as fashion statement. They read a room by its BPM and dress accordingly.",
          styleProfile: {
            urbanFlash: 0.40,
            asiaPop: 0.25,
            bohemian: 0.20,
            leisurewear: 0.15
          },
          antiStyles: {
            businesswear: -20,
            nomadLeathers: -15,
            highFashion: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.15,
          costExpectation: { floor: 500, sweet: 1500, ceiling: 4000 },
          armorTolerance: -25
        },

        entertainer_companion: {
          label: "Licensed Companion",
          parent: "entertainer",
          description: "Night City's oldest profession, legitimized and licensed in most districts. High fashion meets urban flash meets whatever the client's paying for tonight. Fashionware-enhanced, biosculpted, and dressed to make an impression that costs by the hour.",
          styleProfile: {
            highFashion: 0.30,
            urbanFlash: 0.30,
            asiaPop: 0.25,
            leisurewear: 0.15
          },
          antiStyles: {
            bagLadyChic: -30,
            gangColors: -20,
            nomadLeathers: -15
          },
          chromeProfile: "fashionware",
          chromeWeight: 0.30,
          costExpectation: { floor: 800, sweet: 1500, ceiling: 4000 },
          armorTolerance: -30
        },


        // ═══════════════════════════════════════
        // ATHLETE — 2 Sub-Archetypes
        // ═══════════════════════════════════════
        // Night City runs on blood sport. Pit fights in Kabuki, combat cab
        // derbies in the Badlands, martial arts dojos in Japantown. The
        // athletes are the ones Leisurewear was actually designed for.

        athlete_competitor: {
          label: "Pit Fighter / Athlete",
          parent: "athlete",
          description: "Arena combatants, underground boxing circuit regulars, combat sport professionals. Leisurewear built for movement, bioware for edge, and a body that's half gym and half ripperdoc's best work. They fight for eurodollars and the crowd loves them for it.",
          styleProfile: {
            leisurewear: 0.50,
            genericChic: 0.25,
            urbanFlash: 0.15,
            gangColors: 0.10
          },
          antiStyles: {
            highFashion: -20,
            businesswear: -20,
            bohemian: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.25,
          costExpectation: { floor: 300, sweet: 800, ceiling: 2500 },
          armorTolerance: -10
        },

        athlete_trainer: {
          label: "Fitness Professional",
          parent: "athlete",
          description: "Personal trainers, dojo masters, combat sport coaches. They keep the corpo execs in shape and the pit fighters alive between rounds. Professional enough for a gym in The Glen, tough enough for a basement ring in Kabuki.",
          styleProfile: {
            leisurewear: 0.45,
            businesswear: 0.25,
            genericChic: 0.20,
            urbanFlash: 0.10
          },
          antiStyles: {
            bagLadyChic: -20,
            gangColors: -15,
            nomadLeathers: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.15,
          costExpectation: { floor: 500, sweet: 1200, ceiling: 3000 },
          armorTolerance: -15
        },


        // ═══════════════════════════════════════
        // CLERGY — 2 Sub-Archetypes
        // ═══════════════════════════════════════
        // Night City has real spiritual communities. Church of the Resurrection,
        // Zen temples in Japantown, storefront churches in South Night City.
        // Not to be confused with Gang Cults — these are community pillars.

        clergy_street: {
          label: "Street Preacher",
          parent: "clergy",
          description: "Storefront church pastors, sidewalk prophets, community spiritual leaders who stayed when the corps left. Bohemian layers with personal meaning, secondhand robes that have been through more services than a cathedral. Their congregation is the block and their church is wherever they're standing.",
          styleProfile: {
            bohemian: 0.45,
            genericChic: 0.25,
            bagLadyChic: 0.20,
            gangColors: 0.10
          },
          antiStyles: {
            highFashion: -25,
            urbanFlash: -15,
            asiaPop: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.05,
          costExpectation: { floor: 50, sweet: 200, ceiling: 800 },
          armorTolerance: -15
        },

        clergy_corporate: {
          label: "Corporate Chaplain",
          parent: "clergy",
          description: "Corpo-funded spiritual advisors, megachurch leaders, the kind of faith that comes with a marketing budget. Businesswear sharp enough for a board meeting, faith accessories that cost more than a street preacher's entire wardrobe. God works in mysterious ways — especially when there's a tax benefit.",
          styleProfile: {
            businesswear: 0.40,
            highFashion: 0.30,
            genericChic: 0.20,
            leisurewear: 0.10
          },
          antiStyles: {
            bagLadyChic: -25,
            gangColors: -20,
            nomadLeathers: -15
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.05,
          costExpectation: { floor: 1500, sweet: 3000, ceiling: 8000 },
          armorTolerance: -25
        },


        // ═══════════════════════════════════════
        // COURIER — 2 Sub-Archetypes
        // ═══════════════════════════════════════
        // The old NET is dead. Data moves physically now — on chips, in
        // packages, by messenger. These are Night City's circulatory system.

        courier_runner: {
          label: "Street Runner",
          parent: "courier",
          description: "Bike messengers, package runners, the kids who carry data chips across districts faster than any surviving NET connection. Leisurewear for mobility, light and aerodynamic, bioware in the legs if they can afford it. Speed is survival and the delivery fee is their rent.",
          styleProfile: {
            leisurewear: 0.40,
            urbanFlash: 0.25,
            genericChic: 0.25,
            asiaPop: 0.10
          },
          antiStyles: {
            highFashion: -15,
            businesswear: -15,
            nomadLeathers: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.15,
          costExpectation: { floor: 100, sweet: 500, ceiling: 1500 },
          armorTolerance: -10
        },

        courier_driver: {
          label: "Combat Cab / Delivery",
          parent: "courier",
          description: "Combat cab operators, delivery van drivers, the motorized half of Night City's logistics chain. Nomad-adjacent practicality meets city functionality — leather jacket over a generic tee, boots that work the pedals and the pavement. They know every shortcut, every checkpoint, and every street where you don't stop at red lights.",
          styleProfile: {
            nomadLeathers: 0.30,
            genericChic: 0.30,
            leisurewear: 0.25,
            urbanFlash: 0.15
          },
          antiStyles: {
            highFashion: -20,
            businesswear: -10,
            asiaPop: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.10,
          costExpectation: { floor: 150, sweet: 600, ceiling: 2000 },
          armorTolerance: 0
        },


        // ═══════════════════════════════════════
        // ACADEMIC — 2 Sub-Archetypes
        // ═══════════════════════════════════════
        // Night City University exists. So do corporate think tanks and
        // independent scholars trying to rebuild what the DataKrash destroyed.
        // Different from Techie (who builds things) — these preserve knowledge.

        academic_professor: {
          label: "NCU Faculty",
          parent: "academic",
          description: "Night City University professors, independent scholars, the ones trying to preserve civilization one lecture at a time. Bohemian layers over rumpled businesswear, coffee-stained and optimistic. They teach in buildings with bullet holes in the walls and call it 'character.'",
          styleProfile: {
            bohemian: 0.35,
            businesswear: 0.30,
            genericChic: 0.25,
            leisurewear: 0.10
          },
          antiStyles: {
            gangColors: -20,
            nomadLeathers: -10,
            urbanFlash: -10
          },
          chromeProfile: "hidden_chrome",
          chromeWeight: 0.05,
          costExpectation: { floor: 400, sweet: 1200, ceiling: 3000 },
          armorTolerance: -20
        },

        academic_researcher: {
          label: "Corporate Researcher",
          parent: "academic",
          description: "Biotechnica lab coats, Night Corp data analysts, Zhirafa think tank members. Corporate-funded intellect in business-casual packaging. They have clearance levels instead of street cred and their most dangerous weapon is a published paper.",
          styleProfile: {
            businesswear: 0.35,
            genericChic: 0.35,
            leisurewear: 0.20,
            urbanFlash: 0.10
          },
          antiStyles: {
            gangColors: -20,
            bagLadyChic: -15,
            nomadLeathers: -10
          },
          chromeProfile: "bioware",
          chromeWeight: 0.10,
          costExpectation: { floor: 600, sweet: 1800, ceiling: 4000 },
          armorTolerance: -20
        }
      },

    // ═══════════════════════════════════════
    // FACTIONS - RED 2045 Timeline
    // ═══════════════════════════════════════

    FACTIONS: {
// ── CORPORATIONS & ORGANIZATIONS ──
      nccs: {
        label: "NCCS (Night City Co-Prosperity Sphere)",
        archetype: "corpo_suit",
        rivals: ["militech", "sixth_street"],
        allies: ["tyger_claws", "kimen_gumi"],
        styleModifiers: { asiaPop: +0.12, businesswear: +0.05, genericChic: -0.10, urbanFlash: -0.07 },
        costOverride: { floor: 1800, sweet: 5000 },
        armorMod: +5,
        disguiseDifficulty: 3,
        description: "An alliance of Japanese-origin corps operating Watson and Kabuki. Arasaka's shadow looms behind the corporate veneer — officially banned, unofficially pulling strings."
      },
      militech: {
        label: "Militech",
        archetype: "corpo_security",
        rivals: ["nccs", "tyger_claws"],
        allies: ["sixth_street", "ncpd"],
        styleModifiers: { nomadLeathers: +0.10, genericChic: +0.10, urbanFlash: -0.10, highFashion: -0.10 },
        chromeWeightMod: +0.10,
        costOverride: { floor: 800, sweet: 2500 },
        armorMod: +10,
        disguiseDifficulty: 3,
        description: "Nationalized after the 4th Corporate War — now the armed wing of the US government. Operates the NorCal Military Base and provides security for Charter Hill. Professional, lethal, bureaucratic."
      },
      arasaka: {
        label: "Arasaka (Covert Operations)",
        archetype: "corpo_agent",
        rivals: ["militech", "sixth_street", "ncpd"],
        allies: ["nccs", "tyger_claws", "kimen_gumi"],
        styleModifiers: { asiaPop: +0.20, businesswear: +0.05, urbanFlash: -0.10, bohemian: -0.10, genericChic: -0.05 },
        chromeWeightMod: +0.10,
        costOverride: { floor: 3000, sweet: 8000 },
        armorMod: -5,
        disguiseDifficulty: 3,
        description: "The NUSA ban means nothing to a corporation that's been playing the long game for decades. Arasaka's official presence in Night City is zero. Their actual presence is everywhere — funneled through NCCS fronts, Tyger Claw muscle, and operatives who never existed on paper."
      },
      biotechnica: {
        label: "Biotechnica",
        archetype: "corpo_suit",
        rivals: ["el_norte_cartel", "inquisitors"],
        allies: ["night_corp", "trauma_team"],
        styleModifiers: { genericChic: +0.10, businesswear: +0.05, urbanFlash: -0.10, highFashion: -0.05 },
        chromeOverride: "bioware",
        chromeWeightMod: +0.10,
        costOverride: { floor: 1200, sweet: 3500 },
        disguiseDifficulty: 2,
        description: "If you've filled a fuel tank or installed bioware in the last decade, Biotechnica got paid. Their CHOOH2 monopoly funds everything from Badlands grow-ops to city biotech labs. Employees run clean, clinical, and utterly convinced they're saving the world one patent at a time."
      },
      continental_brands: {
        label: "Continental Brands",
        archetype: "corpo_suit",
        rivals: [],
        allies: ["night_corp", "network54"],
        styleModifiers: { highFashion: +0.08, urbanFlash: +0.05, businesswear: -0.05, genericChic: -0.08 },
        costOverride: { floor: 1800, sweet: 4500 },
        disguiseDifficulty: 1,
        description: "Every kibble bar, every SynthCola, every disposable product lining Night City's shelves — Continental Brands has a stake. Their corporate culture is aggressively friendly, their employees dress like walking advertisements, and their market share is terrifying."
      },
      network54: {
        label: "Network 54",
        archetype: "media_anchor",
        rivals: ["piranhas", "undertow"],
        allies: ["continental_brands", "night_corp"],
        styleModifiers: { highFashion: +0.10, urbanFlash: -0.05, bohemian: -0.05 },
        chromeWeightMod: +0.10,
        costOverride: { floor: 3000, sweet: 8000 },
        disguiseDifficulty: 2,
        description: "The loudest voice in Night City belongs to N54. Their anchors are camera-ready weapons of narrative control, their field teams move with military precision, and their editorial policy bends toward whoever's buying ad time this quarter."
      },
      petrochem: {
        label: "Petrochem",
        archetype: "corpo_security",
        rivals: ["aldecaldos", "steel_vaqueros"],
        allies: ["militech", "biotechnica"],
        styleModifiers: { nomadLeathers: +0.12, genericChic: +0.08, businesswear: -0.08, highFashion: -0.12 },
        chromeWeightMod: +0.05,
        costOverride: { floor: 600, sweet: 2000 },
        armorMod: +5,
        disguiseDifficulty: 2,
        description: "Refineries, pipelines, and the armed convoys that connect them — Petrochem's footprint in Night City is industrial-grade and defended accordingly. Their security details blur the line between corporate guard and military patrol. The nomad nations hate them for good reason."
      },
      sovoil: {
        label: "SovOil",
        archetype: "corpo_agent",
        rivals: ["petrochem", "militech"],
        allies: ["consortium"],
        styleModifiers: { businesswear: +0.12, genericChic: +0.08, urbanFlash: -0.12, asiaPop: -0.08 },
        costOverride: { floor: 1500, sweet: 4000 },
        armorMod: +5,
        disguiseDifficulty: 3,
        description: "Eastern European energy money flowing through Night City via Consortium intermediaries and anonymous shell companies. SovOil doesn't advertise its presence — their operatives look like anyone else until the energy futures contract is already signed and the competition is bankrupt."
      },
      ziggurat: {
        label: "Ziggurat",
        archetype: "corpo_suit",
        rivals: [],
        allies: ["night_corp", "nccs"],
        styleModifiers: { genericChic: +0.10, nomadLeathers: +0.05, highFashion: -0.10, urbanFlash: -0.05 },
        costOverride: { floor: 1000, sweet: 3000 },
        armorMod: +10,
        disguiseDifficulty: 2,
        description: "Somebody has to rebuild what the bombs knocked down, and Ziggurat makes sure they're the ones holding the contracts. Architecture, urban planning, heavy construction — their project managers dress for boardrooms but spend half their time on scaffolding."
      },
      zhirafa: {
        label: "Zhirafa Technical Manufacturing",
        archetype: "techie_corpo",
        rivals: [],
        allies: ["militech", "petrochem"],
        styleModifiers: { genericChic: +0.10, bagLadyChic: +0.05, businesswear: -0.08, urbanFlash: -0.07 },
        costOverride: { floor: 400, sweet: 1200 },
        armorMod: +10,
        disguiseDifficulty: 1,
        description: "The machines that rebuild Night City were built by Zhirafa. Heavy equipment, industrial components, vehicle parts — unglamorous work that keeps the city's infrastructure from collapsing entirely. Their engineers split time between lab coats and hard hats."
      },
      night_corp: {
        label: "Night Corp",
        archetype: "corpo_agent",
        rivals: [],
        allies: ["ncpd"],
        styleModifiers: { businesswear: +0.10, genericChic: +0.05, urbanFlash: -0.10, highFashion: -0.05 },
        chromeWeightMod: +0.05,
        costOverride: { floor: 2500, sweet: 6000 },
        disguiseDifficulty: 3,
        description: "The shadowy corporation behind Night City's reconstruction. They appointed The Glen's City Manager and their fingerprints are on half the rebuilding contracts. Nobody knows who's really in charge."
      },
      trauma_team: {
        label: "Trauma Team",
        archetype: "medtech_trauma",
        rivals: ["maelstrom", "scavvers"],
        allies: ["ncpd", "militech"],
        styleModifiers: { businesswear: +0.08, highFashion: +0.05, bagLadyChic: -0.08, genericChic: -0.05 },
        chromeWeightMod: +0.10,
        costOverride: { floor: 1500, sweet: 4000 },
        armorMod: +5,
        disguiseDifficulty: 3,
        description: "Subscription-based medical military. Armored AVs, heavy chrome, zero hesitation. Their tower in Watson is a fortress. Executive-level clients get a private hospital."
      },
      ncpd: {
        label: "NCPD",
        archetype: "lawman_beat",
        rivals: ["maelstrom", "scavvers", "iron_sights"],
        allies: ["militech", "sixth_street", "trauma_team"],
        styleModifiers: { genericChic: +0.10, bagLadyChic: +0.05, businesswear: -0.10, highFashion: -0.05 },
        costOverride: { floor: 200, sweet: 800 },
        armorMod: +5,
        disguiseDifficulty: 2,
        description: "Citywide jurisdiction, district-by-district reality. Understaffed, outgunned, relying on drones and deputized security forces to hold the line. Some precincts are better than others."
      },
      norcal_military: {
        label: "NorCal Military Police",
        archetype: "corpo_security",
        rivals: ["raffen_shiv", "toecutters", "scavvers"],
        allies: ["militech", "culper_ring", "sixth_street"],
        styleModifiers: { nomadLeathers: +0.08, businesswear: +0.05, gangColors: -0.10, urbanFlash: -0.10 },
        chromeWeightMod: +0.10,
        costOverride: { floor: 800, sweet: 2500 },
        armorMod: +15,
        disguiseDifficulty: 3,
        description: "The Estero Bay Military COG's official security arm, operating out of the NorCal Military Base in Northside. Loyal to NorCal and the Pacifica Confederation on paper, tied to Militech through training contracts and munitions deals in practice. General Ash Giovanni runs the base like a small city-state — disciplined, insular, and suspicious of outsiders. Military surplus aesthetic with corpo polish, tactical gear that's actually maintained, and the quiet confidence of people who answer to a chain of command instead of a fixer. The Culper Ring hides inside their ranks, but most NorCal MPs are just soldiers doing a job far from home."
      },
      lazarus: {
        label: "Lazarus Security",
        archetype: "solo_corpo",
        rivals: ["maelstrom", "iron_sights", "scavvers"],
        allies: [],
        styleModifiers: { businesswear: +0.10, highFashion: +0.05, nomadLeathers: -0.10, genericChic: -0.05 },
        chromeWeightMod: +0.05,
        costOverride: { floor: 1500, sweet: 4000 },
        disguiseDifficulty: 4,
        description: "The Exec Zone's private army. Elite operators in cutting-edge gear, protecting Night City's wealthiest residents. If you see Lazarus uniforms, you've entered a whole different economic bracket."
      },
      danger_gal: {
        label: "Danger Gal",
        archetype: "fixer_street",
        rivals: ["scavvers"],
        allies: ["ncpd"],
        costOverride: { floor: 800, sweet: 2500 },
        disguiseDifficulty: 2,
        description: "Private investigation and security neocorp out of Little Europe. Pink and professional. Their housing facility in Watson is unmistakable — and so are their operatives."
      },

      // ── SECURITY FORCES ──
      kimen_gumi: {
        label: "Kimen-Gumi",
        archetype: "lawman_deputy",
        rivals: ["kanzaki_family", "maelstrom", "iron_sights"],
        allies: ["tyger_claws", "nccs"],
        styleModifiers: { asiaPop: +0.12, businesswear: +0.08, gangColors: -0.10, urbanFlash: -0.10 },
        costOverride: { floor: 800, sweet: 3000 },
        armorMod: +5,
        disguiseDifficulty: 2,
        description: "Deputized security force for Kabuki and Old Japantown. Japanese professional enforcers operating under the NCCS umbrella. Discipline and duty in a combat zone."
      },
      culper_ring: {
        label: "Culper Ring",
        archetype: "corpo_agent",
        rivals: ["nccs", "arasaka"],
        allies: ["militech", "sixth_street"],
        chromeWeightMod: -0.10,
        costOverride: { floor: 500, sweet: 2000 },
        armorMod: +10,
        disguiseDifficulty: 3,
        description: "Reunification zealots embedded inside the Estero Bay Military COG, working to bring NorCal back under the US flag. Nobody knows how deep they go or how many members they have. Their cover identities are flawless because they were never covers — these people live their roles."
      },
      culper_ring: {
        label: "Culper Ring",
        archetype: "corpo_agent",
        rivals: ["nccs", "arasaka"],
        allies: ["militech", "sixth_street"],
        chromeWeightMod: -0.10,
        costOverride: { floor: 500, sweet: 2000 },
        armorMod: +10,
        disguiseDifficulty: 3,
        description: "Reunification zealots embedded inside the Estero Bay Military COG, working to bring NorCal back under the US flag. Nobody knows how deep they go or how many members they have. Their cover identities are flawless because they were never covers — these people live their roles."
      },
      ncu_security: {
        label: "NCU Campus Security",
        archetype: "lawman_deputy",
        rivals: ["kill_krashers", "iron_sights", "scavvers"],
        allies: ["ncu", "philharmonic_vampyres", "ncpd"],
        styleModifiers: { businesswear: +0.08, genericChic: +0.05, gangColors: -0.08, urbanFlash: -0.05 },
        costOverride: { floor: 400, sweet: 1200 },
        armorMod: +5,
        disguiseDifficulty: 2,
        description: "The deputized security force protecting Night City University and the surrounding district. Half campus cops, half combat veterans who took a steady paycheck over freelance work. They patrol a fortified campus and maintain an understanding with the local poser gangs — the Vampyres and the Princesses keep their drama internal, security keeps outside violence outside. Rumored to work with Yewtree bar to keep student drinking contained and monitored. Professional, underpaid, and surprisingly effective for a university security force."
      },
      whitewater_security: {
        label: "Whitewater Security",
        archetype: "lawman_deputy",
        rivals: ["undertow", "scavvers"],
        allies: ["eastern_tigers", "skiv_family"],
        styleModifiers: { businesswear: +0.08, genericChic: +0.05, urbanFlash: -0.08, bagLadyChic: -0.05 },
        costOverride: { floor: 600, sweet: 2000 },
        disguiseDifficulty: 2,
        description: "Private security firm protecting Downtown. Hired by the Chamber of Commerce to keep Night City's newest gentrified district sparkling clean. Corporate mercs with badge authority."
      },

// –– MAJOR GANGS ––
      tyger_claws: {
        label: "Tyger Claws",
        archetype: "gang_organized",
        rivals: ["kanzaki_family", "maelstrom", "sixth_street"],
        allies: ["nccs", "kimen_gumi"],
        styleModifiers: { asiaPop: +0.15, urbanFlash: +0.08, businesswear: -0.12, genericChic: -0.11 },
        chromeOverride: "visible_chrome",
        chromeWeightMod: +0.10,
        costOverride: { floor: 600, sweet: 2500 },
        armorMod: +5,
        disguiseDifficulty: 2,
        description: "A former Arasaka proxy gang, now a dominant force in Kabuki and Old Japantown. Neon luminous tattoos, chromed katanas, Japanese street style. They control both the security and the criminal element in their territory."
      },
      arzin_tynon: {
        label: "Arzin Tynon",
        archetype: "athlete_competitor",
        rivals: ["maelstrom", "iron_sights"],
        allies: [],
        disguiseDifficulty: 1,
        description: "One of Night City's older boostergangs, holding northern territory through inertia and chrome. Nothing cutting-edge about them — just augmented muscle that's been hitting the same streets long enough to know every corner, every exit, and every body buried under them."
      },
      maelstrom: {
        label: "Maelstrom",
        archetype: "gang_cult_chrome",
        rivals: ["ncpd", "trauma_team", "tyger_claws", "junkyard_collective"],
        allies: ["scavvers"],
        styleModifiers: { genericChic: +0.10, bagLadyChic: +0.08, gangColors: -0.10, urbanFlash: -0.08 },
        chromeWeightMod: +0.10,
        costOverride: { floor: 50, sweet: 600 },
        armorMod: +10,
        disguiseDifficulty: 2,
        description: "Maximum chrome, minimum humanity. Their leader Warlock transformed them from mindless borgs into a surprisingly effective criminal operation. The Totentanz in the Hot Zone is their chrome-metal cathedral."
      },
      sixth_street: {
        label: "6th Street",
        archetype: "gang_militia",
        rivals: ["tyger_claws", "maelstrom", "voodoo_boys"],
        allies: ["ncpd", "militech", "aldecaldos", "inquisitors"],
        styleModifiers: { gangColors: +0.10, nomadLeathers: +0.08, urbanFlash: -0.10, asiaPop: -0.08 },
        chromeOverride: "visible_chrome",
        chromeWeightMod: +0.05,
        costOverride: { floor: 300, sweet: 800 },
        armorMod: +15,
        disguiseDifficulty: 2,
        description: "4th Corporate War veterans who took up arms to protect their Arroyo neighborhood when NCPD couldn't. Patriotic, militaristic, and suspicious of anyone who isn't from the block. Military surplus mixed with gang colors, American flags on everything, and enough firepower to make Militech nervous — or proud."
      },
      rat_kings: {
        label: "Rat Kings",
        archetype: "gang_booster",
        rivals: [],
        allies: [],
        styleModifiers: { bagLadyChic: +0.08, genericChic: +0.05, gangColors: -0.08, urbanFlash: -0.05 },
        costOverride: { floor: 0, sweet: 300 },
        disguiseDifficulty: 1,
        description: "Squatters who turned an unfinished megabuilding into a chrome-heavy fortress. They know every half-built floor, every exposed elevator shaft, every structural weakness that doubles as a defensive advantage. Small gang, big home-field advantage."
      },
      wild_things: {
        label: "Wild Things",
        archetype: "gang_booster",
        rivals: ["kill_krashers"],
        allies: [],
        chromeWeightMod: +0.05,
        armorMod: +10,
        disguiseDifficulty: 1,
        description: "Arena fighters who channel their violence into gladiatorial bouts at the Redline. Chromed to the teeth and scarred from the ring — they dress for combat because combat is their entire identity. The crowds love the spectacle. The opponents love it less."
      },
      iron_sights: {
        label: "Iron Sights",
        archetype: "gang_booster",
        rivals: ["red_chrome_legion", "edgerunners_inc", "ncpd"],
        allies: ["scavvers"],
        styleModifiers: { nomadLeathers: +0.08, genericChic: +0.07, gangColors: -0.08, urbanFlash: -0.07 },
        chromeWeightMod: +0.05,
        costOverride: { floor: 200, sweet: 1000 },
        armorMod: +10,
        disguiseDifficulty: 1,
        description: "A brutal combat gang sponsored by a Fixer named Hornet. The backing turned them from street toughs into a genuine threat. Old Combat Zone and Old Japantown are their hunting grounds."
      },
      g3: {
        label: "G3",
        archetype: "gang_booster",
        rivals: ["kanzaki_family"],
        allies: ["tyger_claws"],
        styleModifiers: { asiaPop: +0.15, urbanFlash: +0.08, gangColors: -0.12, genericChic: -0.11 },
        chromeOverride: "fashionware",
        chromeWeightMod: -0.05,
        costOverride: { floor: 300, sweet: 1200 },
        armorMod: -10,
        disguiseDifficulty: 1,
        description: "A disturbingly violent anime-themed poser gang. Bright hair, exaggerated features, and absolutely zero boundary between cosplay and homicide. Active in Kabuki and Watson."
      },
      gold_dragons: {
        label: "Gold Dragons",
        archetype: "gang_organized",
        rivals: ["red_chrome_legion"],
        allies: ["weng_fang_tong"],
        styleModifiers: { asiaPop: +0.10, businesswear: +0.05, urbanFlash: -0.08, gangColors: -0.07 },
        costOverride: { floor: 600, sweet: 2200 },
        disguiseDifficulty: 2,
        description: "David Ling Po's protection force in Little China. Part gang, part security force — they maintain order in a community fighting its way out of the combat zones. Loyalty is to the neighborhood."
      },
      weng_fang_tong: {
        label: "Weng Fang Tong",
        archetype: "fixer_syndicate",
        rivals: ["eastern_tigers"],
        allies: ["gold_dragons"],
        styleModifiers: { highFashion: +0.08, urbanFlash: +0.07, genericChic: -0.08, gangColors: -0.07 },
        chromeOverride: "fashionware",
        costOverride: { floor: 800, sweet: 3000 },
        armorMod: -5,
        disguiseDifficulty: 3,
        description: "Night City's major crime syndicate with fingers in gambling and sex work across the city. Run by David Ling Po from Little China. Sophisticated, connected, and quietly everywhere."
      },
      eastern_tigers: {
        label: "Eastern Tigers Triad",
        archetype: "gang_organized",
        rivals: ["weng_fang_tong", "gold_dragons"],
        allies: ["whitewater_security"],
        styleModifiers: { asiaPop: +0.12, businesswear: +0.08, gangColors: -0.12, urbanFlash: -0.08 },
        costOverride: { floor: 800, sweet: 3000 },
        armorMod: -5,
        disguiseDifficulty: 2,
        description: "An organized crime ring recently arrived from China, establishing operations in Downtown. New money, new muscle, and absolutely no respect for existing territorial agreements."
      },
      skiv_family: {
        label: "Skiv Family",
        archetype: "fixer_syndicate",
        rivals: ["deadwoods"],
        allies: ["whitewater_security"],
        styleModifiers: { businesswear: +0.15, genericChic: +0.05, asiaPop: -0.15, gangColors: -0.05 },
        chromeWeightMod: -0.05,
        costOverride: { floor: 1000, sweet: 3500 },
        armorMod: -5,
        disguiseDifficulty: 2,
        description: "Night City's dominant mafia family, controlling the Heywood Docks and maintaining operations in Downtown. Old-school organized crime — suits, loyalty oaths, and shallow graves."
      },
      inquisitors: {
        label: "Inquisitors",
        archetype: "gang_cult_purity",
        rivals: ["the_enhanced", "maelstrom"],
        allies: ["sixth_street"],
        chromeOverride: "hidden_chrome",
        chromeWeightMod: -0.25,
        costOverride: { floor: 50, sweet: 400 },
        disguiseDifficulty: 1,
        description: "A cult centered on the belief that cyberware corrupts the soul. They rip implants from the unwilling, claiming salvation through pain. Active in North Heywood and growing bolder by the day."
      },
      kill_krashers: {
        label: "Kill Krashers",
        archetype: "gang_booster",
        rivals: ["sixth_street", "ncpd", "edgerunners_inc"],
        allies: [],
        styleModifiers: { bagLadyChic: +0.10, gangColors: +0.05, urbanFlash: -0.10, genericChic: -0.05 },
        costOverride: { floor: 0, sweet: 400 },
        armorMod: +5,
        disguiseDifficulty: 1,
        description: "A relatively new gang glorifying violence above all else. Growing with alarming speed across multiple districts. No ideology, no style — just escalating brutality."
      },
      scavvers: {
        label: "Scavengers",
        archetype: "streetrat_scavver",
        rivals: ["ncpd", "trauma_team", "edgerunners_inc"],
        allies: ["maelstrom", "iron_sights"],
        chromeWeightMod: +0.10,
        costOverride: { floor: 0, sweet: 100 },
        disguiseDifficulty: 1,
        description: "Not a single organized gang — a survival strategy. Scattered groups picking through ruins and combat zones for salvageable tech, chrome, and anything they can sell. Blood-stained and desperate."
      },
      reckoners: {
        label: "The Reckoners",
        archetype: "gang_cult_chrome",
        rivals: ["ncpd", "zoners"],
        allies: ["the_enhanced"],
        costOverride: { floor: 30, sweet: 400 },
        disguiseDifficulty: 2,
        description: "A nihilistic doomsday cult preaching an upcoming 'Harvest of Souls.' Always recruiting — sometimes from the conscious, often from the unconscious. Their sermons echo through South Night City and The Glen."
      },
      red_chrome_legion: {
        label: "Red Chrome Legion",
        archetype: "gang_booster",
        rivals: ["iron_sights", "gold_dragons"],
        allies: [],
        styleModifiers: { genericChic: +0.08, gangColors: +0.05, urbanFlash: -0.08, asiaPop: -0.05 },
        chromeWeightMod: +0.05,
        costOverride: { floor: 100, sweet: 700 },
        disguiseDifficulty: 1,
        description: "A neo-fascist hate group locked in a war of attrition with the Iron Sights. Active in Little China and Old Japantown. Chrome-heavy, ideology-poisoned, and universally despised by everyone else."
      },
      the_enhanced: {
        label: "The Enhanced",
        archetype: "gang_cult",
        rivals: ["inquisitors", "ncpd"],
        allies: ["reckoners"],
        chromeOverride: "visible_chrome",
        chromeWeightMod: +0.15,
        costOverride: { floor: 100, sweet: 600 },
        armorMod: +5,
        disguiseDifficulty: 2,
        description: "A cult that worships cyberpsychosis as the next stage of human evolution. They believe the chrome-mad are prophets, not patients. Active in South Night City, Heywood Industrial, and Pacifica."
      },

      // ── NOMAD FACTIONS ──
      aldecaldos: {
        label: "Aldecaldos",
        archetype: "nomad_clan",
        rivals: ["raffen_shiv", "militech"],
        allies: ["steel_vaqueros", "sixth_street"],
        styleModifiers: { urbanFlash: +0.08, genericChic: +0.05, bagLadyChic: -0.08, bohemian: -0.05 },
        costOverride: { floor: 200, sweet: 800 },
        armorMod: +5,
        disguiseDifficulty: 1,
        description: "The dominant nomad clan near Night City, camped at the base of the Petrochem dam in Santo Domingo. Road-worn family leathers, practical patches, fierce loyalty to the pack. Their peacekeepers provide official security for the district."
      },
      deadwoods: {
        label: "DeadWoods",
        archetype: "nomad_trader",
        rivals: ["skiv_family", "scavvers"],
        allies: ["thelas", "consortium"],
        styleModifiers: { nomadLeathers: +0.12, genericChic: +0.05, businesswear: -0.10, urbanFlash: -0.07 },
        costOverride: { floor: 200, sweet: 800 },
        armorMod: +10,
        disguiseDifficulty: 1,
        description: "A cowboy-themed gang serving as self-appointed protectors of Night City's railways. Spurs, dusters, lever-actions, and a code of honor that's half-frontier justice, half-street muscle."
      },
      steel_vaqueros: {
        label: "Steel Vaqueros",
        archetype: "nomad_clan",
        rivals: ["raffen_shiv"],
        allies: ["aldecaldos", "sixth_street"],
        styleModifiers: { nomadLeathers: +0.08, genericChic: +0.05, urbanFlash: -0.08, asiaPop: -0.05 },
        costOverride: { floor: 100, sweet: 500 },
        disguiseDifficulty: 1,
        description: "A nomad pack operating up and down the west coast. They recruit locals as junior members to hold territory while the main pack is on the road. Present in Santo Domingo and Rancho Coronado."
      },
      thelas: {
        label: "Thelas Nation",
        archetype: "nomad_trader",
        rivals: ["maelstrom", "scavvers"],
        allies: ["consortium", "deadwoods"],
        styleModifiers: { businesswear: +0.08, genericChic: +0.05, bagLadyChic: -0.08, bohemian: -0.05 },
        costOverride: { floor: 400, sweet: 1500 },
        disguiseDifficulty: 2,
        description: "The nomad nation that controls the Port of Night City. Their marines provide security, their elders appoint the City Manager, and their ships keep Night City connected to the outside world."
      },
      toecutters: {
        label: "The Toecutters",
        archetype: "nomad_raider",
        rivals: ["aldecaldos", "steel_vaqueros", "thelas"],
        allies: ["raffen_shiv"],
        styleModifiers: { bagLadyChic: +0.12, gangColors: +0.08, genericChic: -0.12, nomadLeathers: -0.08 },
        chromeWeightMod: +0.15,
        costOverride: { floor: 0, sweet: 150 },
        armorMod: +15,
        disguiseDifficulty: 2,
        description: "Even other Raffen give this clan a wide berth. Operating off Night City's eastern highways, the Toecutters cultivate a reputation for savagery that may or may not include cannibalism. They don't confirm or deny. The ambiguity is part of the strategy."
      },
      raffen_shiv: {
        label: "Raffen Shiv",
        archetype: "nomad_raider",
        rivals: ["aldecaldos", "steel_vaqueros", "ncpd"],
        allies: ["scavvers"],
        styleModifiers: { bagLadyChic: +0.10, gangColors: +0.05, genericChic: -0.10, nomadLeathers: -0.05 },
        chromeWeightMod: +0.10,
        costOverride: { floor: 0, sweet: 200 },
        armorMod: +10,
        disguiseDifficulty: 1,
        description: "Outcast nomads — raiders, slavers, and road pirates. The Toecutters are a Raffen Shiv clan operating on the eastern edges of Night City, rumored to be cannibals. Avoid."
      },

// ── ORGANIZED CRIME ──
      consortium: {
        label: "The Consortium",
        archetype: "fixer_syndicate",
        rivals: ["eastern_tigers"],
        allies: ["thelas", "sovoil"],
        styleModifiers: { businesswear: +0.12, genericChic: +0.08, asiaPop: -0.15, urbanFlash: -0.05 },
        chromeWeightMod: +0.05,
        costOverride: { floor: 800, sweet: 2800 },
        armorMod: +5,
        disguiseDifficulty: 2,
        description: "A tightly organized Russian mob group with deep ties to the Thelas nomad nation. They operate through the Port and Heywood Industrial Zone — smuggling, extortion, and quiet violence."
      },
      el_norte_cartel: {
        label: "El Norte Cartel",
        archetype: "fixer_syndicate",
        rivals: ["ncpd", "sixth_street"],
        allies: ["aldecaldos", "ncpd"],
        styleModifiers: { highFashion: +0.10, businesswear: +0.08, asiaPop: -0.15, gangColors: -0.03 },
        costOverride: { floor: 1000, sweet: 4000 },
        armorMod: +5,
        disguiseDifficulty: 2,
        description: "A Mexican criminal organization establishing itself in Night City through Santo Domingo. Rumored to be connected to City Manager Theresa Valentino herself. New power with old methods."
      },
      kanzaki_family: {
        label: "Kanzaki Family",
        archetype: "gang_organized",
        rivals: ["tyger_claws"],
        allies: ["kimen_gumi"],
        styleModifiers: { businesswear: +0.15, asiaPop: +0.05, gangColors: -0.12, urbanFlash: -0.08 },
        chromeWeightMod: -0.10,
        costOverride: { floor: 1200, sweet: 3500 },
        armorMod: -10,
        disguiseDifficulty: 2,
        description: "Traditional Yakuza in a city that's moved on without them. The Kanzaki still follow old codes of conduct that the Tyger Claws abandoned years ago — sharp suits, minimal visible chrome, and a rigid sense of protocol that makes them simultaneously honorable and dangerously predictable."
      },
      mudang_gumi: {
        label: "Mudang Gumi",
        archetype: "techie_netrunner",
        rivals: ["militech", "ncpd"],
        allies: ["voodoo_boys"],
        chromeWeightMod: +0.10,
        costOverride: { floor: 400, sweet: 1500 },
        disguiseDifficulty: 2,
        description: "A gang of netrunners and burglars focused on data theft. Operating in Pacifica, they move through the local NET architecture like ghosts. Low profile, high capability, and very, very quiet."
      },

      // ── PARTY & CULTURAL GANGS ──
      albino_alligators: {
        label: "Albino Alligators",
        archetype: "rocker_idol",
        rivals: ["raffen_shiv"],
        allies: ["piranhas"],
        styleModifiers: { urbanFlash: +0.12, genericChic: +0.05, highFashion: -0.10, bohemian: -0.07 },
        chromeWeightMod: -0.05,
        costOverride: { floor: 500, sweet: 2000 },
        disguiseDifficulty: 1,
        description: "Rancho Coronado's favourite party crew. Their cartoon gator mascot is plastered on half the walls in the district, and their popped-collar aesthetic somehow became the local uniform. More cultural influence than any combat gang twice their size."
      },
      dragula_racers: {
        label: "Dragula Racers",
        archetype: "rocker_underground",
        rivals: [],
        allies: ["piranhas", "albino_alligators"],
        styleModifiers: { bagLadyChic: +0.10, gangColors: +0.08, bohemian: -0.10, genericChic: -0.08 },
        chromeWeightMod: +0.10,
        costOverride: { floor: 200, sweet: 1000 },
        armorMod: +15,
        disguiseDifficulty: 1,
        description: "Monster-movie aesthetics bolted onto racing machines. Skull paint, horror prosthetics, and engines modified to scream like something from a braindance nightmare. They live for illegal street races and the crowd that gathers to watch the carnage."
      },
      eurotrashers: {
        label: "Eurotrashers",
        archetype: "rocker_idol",
        rivals: ["undertow"],
        allies: ["piranhas"],
        styleModifiers: { highFashion: +0.12, businesswear: +0.05, asiaPop: -0.10, bohemian: -0.07 },
        costOverride: { floor: 800, sweet: 3000 },
        disguiseDifficulty: 1,
        description: "Little Europe's self-appointed cultural ambassadors. Every member adopts a vaguely continental accent that doesn't match any real country, pairs it with designer knockoffs and club-kid energy, and insists with absolute sincerity that Night City would be nothing without them."
      },
      piranhas: {
        label: "Piranhas",
        archetype: "rocker_idol",
        rivals: ["the_andersons"],
        allies: ["voodoo_boys"],
        styleModifiers: { highFashion: +0.10, urbanFlash: +0.08, bohemian: -0.10, genericChic: -0.08 },
        costOverride: { floor: 1500, sweet: 5000 },
        disguiseDifficulty: 1,
        description: "Night City's premiere party gang. They don't just attend the best parties — they throw them. Flashy, social, and swallowing up the aging Andersons gang in Pacifica. Every night is an event."
      },
      the_muses: {
        label: "The Muses",
        archetype: "rocker_underground",
        rivals: ["toecutters", "inquisitors"],
        allies: ["sixth_street"],
        styleModifiers: { highFashion: +0.12, urbanFlash: +0.08, asiaPop: -0.10, bagLadyChic: -0.10 },
        costOverride: { floor: 400, sweet: 1800 },
        armorMod: +5,
        disguiseDifficulty: 1,
        description: "A poser gang and roller derby squad with a fusion disco and Greek mythology aesthetic. Xanadu in North Heywood is their temple. Equal parts performance art and combat sport."
      },

      // ── POSER GANGS ──
      lightning_cats: {
        label: "Lightning Cats",
        archetype: "gang_poser",
        rivals: [],
        allies: ["bozos"],
        styleModifiers: { asiaPop: +0.10, highFashion: +0.05, gangColors: -0.10, genericChic: -0.05 },
        chromeOverride: "bioware",
        chromeWeightMod: +0.10,
        costOverride: { floor: 500, sweet: 2500 },
        disguiseDifficulty: 2,
        description: "Full-commitment bioexotic posers running the Hot Zone fringes on all fours. Cat ears, tails, slit pupils, retractable claw implants — they've pushed fashionware and biosculpting further than the manufacturers intended. Once you go full cat, there's no going back to human."
      },
      philharmonic_vampyres: {
        label: "Philharmonic Vampyres",
        archetype: "gang_poser",
        rivals: ["bozos"],
        allies: ["the_muses", "sinful_adams"],
        styleModifiers: { bohemian: +0.15, highFashion: +0.05, asiaPop: -0.12, urbanFlash: -0.08 },
        costOverride: { floor: 300, sweet: 1500 },
        disguiseDifficulty: 2,
        description: "Caught between two identities — the artistic goth faction wants to haunt concert halls and brood beautifully, while the prankster faction wants to terrorize people in vampire biosculpts for laughs. The internal debate has been raging longer than most gang wars."
      },
      sinful_adams: {
        label: "The Sinful Adams",
        archetype: "gang_poser",
        rivals: ["reckoners"],
        allies: ["philharmonic_vampyres"],
        styleModifiers: { bohemian: +0.18, bagLadyChic: +0.05, asiaPop: -0.15, urbanFlash: -0.08 },
        costOverride: { floor: 100, sweet: 800 },
        disguiseDifficulty: 1,
        description: "South Night City's boneyard dwellers — goth posers who made a cemetery their headquarters and leaned all the way into the aesthetic. Black on black on black, death iconography as fashion statement, and a genuine comfort with mortality that unsettles even hardened gangers."
      },
      princesses_of_justice: {
        label: "Princesses of Justice",
        archetype: "gang_poser",
        rivals: ["kill_krashers", "reckoners"],
        allies: ["street_queens", "piranhas"],
        styleModifiers: { asiaPop: +0.15, highFashion: +0.05, gangColors: -0.10, bagLadyChic: -0.10 },
        costOverride: { floor: 300, sweet: 1500 },
        armorMod: +10,
        disguiseDifficulty: 1,
        description: "Grown adults in sparkly transformation costumes based on a pre-War cartoon, and they're completely serious about it. Behind the absurd aesthetic is a genuine guardian operation protecting abuse victims across Night City. Underestimating them because of the outfits is a common and painful mistake."
      },
      prime_time_players: {
        label: "The Prime-Time Players",
        archetype: "gang_poser",
        rivals: [],
        allies: ["piranhas", "eurotrashers"],
        styleModifiers: { genericChic: +0.12, urbanFlash: +0.05, asiaPop: -0.10, bohemian: -0.07 },
        chromeWeightMod: -0.10,
        costOverride: { floor: 200, sweet: 1000 },
        disguiseDifficulty: 1,
        description: "A poser gang fractured into sub-crews, each channeling a different ancient television show. One week it's a medical drama, the next it's a crime procedural. The costumes rotate but the commitment to character never wavers. Weirdly effective at territorial control through sheer confusion."
      },
      yellow_brick_road: {
        label: "Yellow Brick Road Gang",
        archetype: "gang_poser",
        rivals: [],
        allies: ["prime_time_players", "bozos"],
        styleModifiers: { bohemian: +0.10, genericChic: +0.08, asiaPop: -0.10, urbanFlash: -0.08 },
        chromeOverride: "visible_chrome",
        chromeWeightMod: +0.05,
        costOverride: { floor: 200, sweet: 1000 },
        disguiseDifficulty: 1,
        description: "Full biosculpt commitment to a century-old children's story. Tin men with actual chrome plating, scarecrows in tattered synthetics, courageous lions with mane implants. Surreal to encounter on a dark street. Surprisingly protective of whatever block they've designated as Oz."
      },
      bozos: {
        label: "Bozos",
        archetype: "gang_poser",
        rivals: ["ncpd", "sixth_street"],
        allies: [],
        styleModifiers: { urbanFlash: +0.15, gangColors: +0.10, asiaPop: -0.15, businesswear: -0.10 },
        chromeWeightMod: +0.10,
        costOverride: { floor: 100, sweet: 800 },
        armorMod: +5,
        disguiseDifficulty: 1,
        description: "Biosculpted clown-faced pranksters whose idea of a joke often ends with a body count. Unpredictable, terrifying, and currently locked in a civil war of pranks and mayhem in South Night City."
      },
      voodoo_boys: {
        label: "Voodoo Boys",
        archetype: "gang_poser",
        rivals: ["ncpd", "sixth_street", "militech"],
        allies: ["dirty_hippies"],
        styleModifiers: { bohemian: +0.15, bagLadyChic: +0.08, asiaPop: -0.15, urbanFlash: -0.08 },
        costOverride: { floor: 100, sweet: 600 },
        armorMod: +5,
        disguiseDifficulty: 2,
        description: "Posers draped in Hollywood-style voodoo trappings — skull paint, bone jewelry, mystical affectations. Violent and focused on the drug trade in Pacifica and Rancho Coronado. Don't confuse the aesthetic with depth."
      },

// ── GUARDIAN & ACTIVIST GANGS ──
      street_queens: {
        label: "The Street Queens",
        archetype: "rocker_rebel",
        rivals: ["red_chrome_legion", "inquisitors"],
        allies: ["princesses_of_justice", "undertow"],
        styleModifiers: { highFashion: +0.12, urbanFlash: +0.08, genericChic: -0.12, bagLadyChic: -0.08 },
        chromeOverride: "fashionware",
        costOverride: { floor: 400, sweet: 1500 },
        armorMod: +5,
        disguiseDifficulty: 1,
        description: "Guardian gang, activist crew, and neighborhood shield rolled into one. They protect Night City's queer communities with bold visibility — their style is a deliberate statement, their presence is a deterrent, and anyone targeting their people answers to the whole organization."
      },
      tombstone_preservers: {
        label: "Tombstone Preservers",
        archetype: "rocker_rebel",
        rivals: ["reckoners", "scavvers"],
        allies: ["sinful_adams"],
        styleModifiers: { bohemian: +0.08, bagLadyChic: +0.05, urbanFlash: -0.08, highFashion: -0.05 },
        costOverride: { floor: 100, sweet: 600 },
        disguiseDifficulty: 1,
        description: "In a city where scavvers harvest chrome from fresh corpses, the Tombstone Preservers draw a hard line. They guard gravesites, memorial markers, and the remains of the dead against desecration. It's thankless work, but somebody decided it matters."
      },
      zoners: {
        label: "The Zoners",
        archetype: "rocker_rebel",
        rivals: ["kill_krashers", "reckoners"],
        allies: ["undertow", "street_queens"],
        styleModifiers: { genericChic: +0.08, gangColors: +0.05, highFashion: -0.08, urbanFlash: -0.05 },
        chromeWeightMod: -0.05,
        costOverride: { floor: 100, sweet: 500 },
        disguiseDifficulty: 1,
        description: "Community organizers in a district that's been written off by everyone else. The Zoners believe South Night City deserves functional infrastructure, honest governance, and basic dignity — radical concepts when your city manager is lining his own pockets. Protest signs over weapons, but they'll use both."
      },
      willows: {
        label: "Willows",
        archetype: "solo_veteran",
        rivals: [],
        allies: ["street_queens", "princesses_of_justice"],
        styleModifiers: { genericChic: +0.08, businesswear: +0.05, bagLadyChic: -0.08, urbanFlash: -0.05 },
        chromeOverride: "hidden_chrome",
        chromeWeightMod: -0.05,
        costOverride: { floor: 300, sweet: 1000 },
        armorMod: -5,
        disguiseDifficulty: 1,
        description: "Female combat veterans who found each other after the wars ended and the nightmares didn't. Part support network, part crew — they carry themselves with military discipline and dress in the practical gear they never stopped wearing. Quiet until provoked, devastating when they are."
      },
      undertow: {
        label: "Undertow",
        archetype: "rocker_rebel",
        rivals: ["whitewater_security", "eastern_tigers"],
        allies: ["eurotrashers"],
        styleModifiers: { urbanFlash: +0.10, gangColors: +0.05, highFashion: -0.10, genericChic: -0.05 },
        chromeWeightMod: +0.05,
        armorMod: +10,
        disguiseDifficulty: 1,
        description: "A gang operating in Little Europe and Downtown, claiming to fight gentrification. Their methods — arson, intimidation, assault — often destroy the very neighborhoods they say they're protecting."
      },

      // ── SMALLER / CULTURAL GANGS ──
      andersons: {
        label: "The Andersons",
        archetype: "streetrat_squatter",
        rivals: ["piranhas"],
        allies: [],
        styleModifiers: { genericChic: +0.12, businesswear: +0.05, gangColors: -0.10, urbanFlash: -0.07 },
        chromeOverride: "hidden_chrome",
        chromeWeightMod: -0.10,
        costOverride: { floor: 50, sweet: 300 },
        armorMod: -10,
        disguiseDifficulty: 1,
        description: "A yogang built around a retro family-values theme that hasn't aged well. Their younger members keep defecting to the Piranhas, leaving behind a shrinking core of die-hards who dress like a pre-War domestic comedy and refuse to update the formula."
      },
      generation_red: {
        label: "Generation Red",
        archetype: "streetrat_urchin",
        rivals: [],
        allies: ["edgerunners_inc", "the_faded"],
        styleModifiers: { bagLadyChic: +0.10, genericChic: -0.10 },
        chromeWeightMod: -0.05,
        costOverride: { floor: 0, sweet: 50 },
        disguiseDifficulty: 1,
        description: "Kids who were born into the Time of the Red and never knew anything else. The Old Combat Zone is their entire world. They run in packs, survive on resourcefulness, and navigate ruins that adults won't enter. Overlooked by everyone, which is exactly how they like it."
      },

      // ── UNDERGROUND & COUNTER-CULTURE ──
      dirty_hippies: {
        label: "The Dirty Hippies",
        archetype: "techie_maker",
        rivals: ["ncpd", "inquisitors"],
        allies: ["shroomers"],
        styleModifiers: { bohemian: +0.15, bagLadyChic: +0.05, genericChic: -0.12, urbanFlash: -0.08 },
        chromeOverride: "bioware",
        chromeWeightMod: +0.05,
        costOverride: { floor: 30, sweet: 300 },
        disguiseDifficulty: 1,
        description: "Part botanical laboratory, part counterculture holdover. They grow herb blends laced with custom-designed recreational compounds and sell them across Night City under the collective brand of ganga. Smell like a greenhouse, dress like the commune never ended, know more chemistry than they let on."
      },
      shroomers: {
        label: "The Shroomers",
        archetype: "techie_maker",
        rivals: ["iron_sights", "scavvers"],
        allies: ["edgerunners_inc"],
        styleModifiers: { bagLadyChic: +0.12, bohemian: +0.05, genericChic: -0.10, urbanFlash: -0.07 },
        chromeOverride: "bioware",
        costOverride: { floor: 0, sweet: 200 },
        disguiseDifficulty: 1,
        description: "Part survivalist group, part guerrilla gardener collective. They live beneath the streets of the Old Combat Zone, growing fungi in The Underground. Practical, paranoid, and surprisingly well-supplied."
      },
      fixies_couriers: {
        label: "Fixie's Couriers",
        archetype: "fixer_street",
        rivals: [],
        allies: ["edgerunners_inc", "danger_gal"],
        styleModifiers: { genericChic: +0.10, urbanFlash: +0.05, businesswear: -0.10, highFashion: -0.05 },
        chromeWeightMod: -0.05,
        costOverride: { floor: 200, sweet: 800 },
        disguiseDifficulty: 1,
        description: "Night City's pedal-powered information network. A Fixer called Fixie coordinates bicycle couriers who know every back alley, rooftop shortcut, and service tunnel in the city. Low-profile gear, messenger bags stuffed with packages nobody asks about, and cardio that would kill a solo."
      },
      the_faded: {
        label: "The Faded",
        archetype: "solo_veteran",
        rivals: [],
        allies: ["edgerunners_inc"],
        styleModifiers: { nomadLeathers: +0.08, bagLadyChic: +0.05, genericChic: -0.08, urbanFlash: -0.05 },
        chromeWeightMod: +0.05,
        costOverride: { floor: 100, sweet: 600 },
        disguiseDifficulty: 2,
        description: "Veterans of Night City's edge who never retired — they just got quieter. They want the Old Combat Zone left alone, no reconstruction projects, no gentrification, no corporate interest. Their gear has decades of wear. So do they."
      },
      edgerunners_inc: {
        label: "Edgerunners Inc",
        archetype: "solo_merc",
        rivals: ["iron_sights", "scavvers", "the_faded"],
        allies: ["shroomers", "generation_red"],
        styleModifiers: { urbanFlash: +0.10, genericChic: +0.05, bohemian: -0.08, highFashion: -0.07 },
        chromeWeightMod: +0.05,
        costOverride: { floor: 200, sweet: 1000 },
        disguiseDifficulty: 1,
        description: "Young edgerunners trying to reconnect the Old Combat Zone to civilization. Named after a pre-war company. Their leader Brick Coleman serves as the zone's de facto City Manager. Idealists with guns."
      },
// — NEW ARCHETYPE FACTIONS —
      // ── Edgerunner ──
      afterlife_regulars: {
        label: "Afterlife Regulars",
        archetype: "edgerunner_freelance",
        rivals: [],
        allies: ["data_runners", "edgerunners_local"],
        styleModifiers: { genericChic: +0.05, urbanFlash: +0.05, highFashion: -0.05 },
        costOverride: { floor: 100, sweet: 600 },
        disguiseDifficulty: 2,
        description: "The freelance edgerunner circuit that orbits the Afterlife bar. Not a gang, not a crew — just professionals between gigs who drink at the same place and occasionally share fixers. Your reputation is your membership card."
      },
      edgerunners_local: {
        label: "Local Gig Workers",
        archetype: "edgerunner_freelance",
        rivals: ["scavvers"],
        allies: ["afterlife_regulars", "data_runners"],
        styleModifiers: { genericChic: +0.05, nomadLeathers: +0.03, businesswear: -0.05 },
        costOverride: { floor: 50, sweet: 400 },
        disguiseDifficulty: 1,
        description: "District-level freelancers who handle the jobs too small for Afterlife crews and too dangerous for civilians. Every neighborhood has them — the person you call when something needs doing and you can't call NCPD."
      },

      // ── Chromer ──
      chrome_scene: {
        label: "Chrome Scene",
        archetype: "chromer_junkie",
        rivals: ["inquisitors"],
        allies: ["maelstrom"],
        styleModifiers: { genericChic: +0.03, bagLadyChic: +0.05, highFashion: -0.10, businesswear: -0.10 },
        costOverride: { floor: 0, sweet: 300 },
        disguiseDifficulty: 1,
        description: "The body modification underground. Ripperdoc groupies, chrome collectors, and augmentation enthusiasts who treat their bodies like custom cars. Not Maelstrom — they lack the ideology — but they share ripperdocs and trade installation horror stories. One manifesto away from recruitment."
      },

      // ── Operative ──
      grey_ops: {
        label: "Grey Operatives",
        archetype: "operative_sleeper",
        rivals: [],
        allies: [],
        styleModifiers: { genericChic: +0.05, businesswear: +0.03, gangColors: -0.10, urbanFlash: -0.05 },
        costOverride: { floor: 300, sweet: 1200 },
        disguiseDifficulty: 4,
        description: "They don't have a name because that's the point. Deep-cover corpo assets, retired intelligence officers, and professionals who understand that being nobody is the most powerful identity in Night City. If you've identified one, they've already identified you."
      },
      combat_cab: {
        label: "Combat Cab",
        archetype: "courier_driver",
        rivals: [],
        allies: ["ncpd", "danger_gal"],
        styleModifiers: { nomadLeathers: +0.05, genericChic: +0.05, highFashion: -0.05, businesswear: -0.05 },
        costOverride: { floor: 150, sweet: 500 },
        disguiseDifficulty: 1,
        description: "Night City's motorized lifeline. Licensed cab operators who double as package runners, data chip couriers, and occasionally getaway drivers. They know every shortcut, every checkpoint, and every street where you keep driving no matter what."
      },
      ncu: {
        label: "Night City University",
        archetype: "academic_professor",
        rivals: [],
        allies: ["ncpd"],
        styleModifiers: { bohemian: +0.05, businesswear: +0.05, gangColors: -0.05, urbanFlash: -0.05 },
        costOverride: { floor: 400, sweet: 1500 },
        disguiseDifficulty: 1,
        description: "The largest educational institution left standing in Night City. NCU survived the 4th War, the Hot Zone, and annual budget cuts. Faculty range from idealistic scholars to corporate-funded researchers. The campus in University City is half ivory tower, half fortified compound."
      },
      church_resurrection: {
        label: "Church of the Resurrection",
        archetype: "clergy_street",
        rivals: ["inquisitors", "reckoners"],
        allies: [],
        styleModifiers: { bohemian: +0.08, bagLadyChic: +0.05, urbanFlash: -0.08, highFashion: -0.05 },
        costOverride: { floor: 50, sweet: 300 },
        disguiseDifficulty: 1,
        description: "The largest organized religion in Night City. Storefront churches in every district, community kitchens, chrome-neutral theology. They preach survival through faith and community — and in the Time of the Red, that's more radical than it sounds."
      },
      night_market_guild: {
        label: "Night Market Guild",
        archetype: "civilian_vendor",
        rivals: ["scavvers"],
        allies: [],
       styleModifiers: { genericChic: +0.05, asiaPop: +0.05, highFashion: -0.05, businesswear: -0.05 },
        costOverride: { floor: 50, sweet: 400 },
        disguiseDifficulty: 1,
        description: "The loose association of Night Market vendors, food stall operators, and small-time merchants who pay protection money to whoever runs the block. Not a gang — just small business owners trying to make a living between the firefights."
      },
      redline_arena: {
        label: "Redline Arena Circuit",
        archetype: "athlete_competitor",
        rivals: [],
        allies: ["wild_things"],
        styleModifiers: { leisurewear: +0.08, gangColors: +0.05, businesswear: -0.08, highFashion: -0.05 },
        costOverride: { floor: 300, sweet: 1000 },
        disguiseDifficulty: 1,
        description: "Night City's blood sport circuit. Pit fights, martial arts bouts, and combat derbies draw crowds across every district. The fighters are the stars — bioware-enhanced athletes who make money with violence the audience can cheer for."
      },
      data_runners: {
        label: "Data Runners",
        archetype: "courier_runner",
        rivals: ["scavvers", "maelstrom"],
        allies: ["edgerunners_inc", "shroomers"],
        styleModifiers: { leisurewear: +0.08, urbanFlash: +0.05, businesswear: -0.08, nomadLeathers: -0.05 },
        costOverride: { floor: 100, sweet: 600 },
        disguiseDifficulty: 1,
        description: "Bike messengers and package runners who carry data chips, physical packages, and sensitive materials across Night City's districts. The old NET is dead — these runners are the reason information still moves. Speed is survival and the delivery fee is rent."
      },

      // –– New Archetype Factions ––

      corpo_black_ops: {
        label: "Corporate Black Operations",
        archetype: "solo_corpo",
        rivals: ["afterlife_regulars", "edgerunners_local"],
        allies: ["culper_ring", "arasaka_covert", "lazarus"],
        styleModifiers: { businesswear: +0.05, highFashion: +0.03, gangColors: -0.10, bagLadyChic: -0.10 },
        costOverride: { floor: 2500, sweet: 6000 },
        disguiseDifficulty: 4,
        description: "The people corporations send when negotiation fails and deniability is required. Arasaka wet-work teams, Militech counter-terrorism units, Lazarus Group extraction specialists. They look like executives until the shooting starts — then they look like the reason you should have stayed home."
      },

      corpo_netops: {
        label: "Corporate Cyber-Operations",
        archetype: "techie_corponet",
        rivals: ["chrome_scene", "shroomers"],
        allies: ["culper_ring", "grey_ops"],
        styleModifiers: { businesswear: +0.05, urbanFlash: +0.03, bagLadyChic: -0.10, gangColors: -0.05 },
        costOverride: { floor: 1500, sweet: 4000 },
        disguiseDifficulty: 3,
        description: "The digital warfare divisions of Night City's megacorps. ICE architects, counterintrusion teams, and the people responsible for keeping corporate data behind walls that street runners spend their careers trying to crack. Same NET, very different paycheck."
      },

      corpo_hr: {
        label: "Corporate Asset Management",
        archetype: "fixer_corpo",
        rivals: [],
        allies: ["grey_ops", "culper_ring"],
        styleModifiers: { businesswear: +0.05, highFashion: +0.05, gangColors: -0.10, bagLadyChic: -0.10 },
        costOverride: { floor: 3000, sweet: 7000 },
        disguiseDifficulty: 3,
        description: "Internal fixers who arrange things within the corporate machine. Headhunters, asset managers, the people who make problems disappear through paperwork instead of bullets. They attend the same meetings as Execs but serve a different function — Execs decide, Handlers deliver."
      },

      corpo_fleet: {
        label: "Corporate Fleet Services",
        archetype: "nomad_corpo",
        rivals: ["raffen_shiv", "toecutters"],
        allies: ["petrochem", "militech"],
        styleModifiers: { nomadLeathers: +0.05, businesswear: +0.05, gangColors: -0.05, highFashion: -0.05 },
        costOverride: { floor: 800, sweet: 2500 },
        disguiseDifficulty: 2,
        description: "Nomads who traded clan patches for corporate logos. Petrochem pipeline escorts, Militech convoy drivers, SovOil tanker runners. The Badlands are still dangerous and the corps still need people who know the roads. Steady pay, no clan backup, expendable by contract."
      },

      junkyard_collective: {
        label: "Junkyard Collective",
        archetype: "techie_scrapper",
        rivals: ["scavvers"],
        allies: ["dirty_hippies", "shroomers"],
        styleModifiers: { bagLadyChic: +0.08, nomadLeathers: +0.05, highFashion: -0.10, businesswear: -0.10 },
        costOverride: { floor: 50, sweet: 350 },
        disguiseDifficulty: 1,
        description: "Combat Zone tinkers and salvage engineers who build functional tech from scrap. Not hackers — hands-on builders who can fabricate weapons, repair vehicles, and improvise solutions from whatever the scavvers didn't strip. Their workshops are the reason the Combat Zone still has working infrastructure."
      },

      net_underground: {
        label: "NET Underground",
        archetype: "techie_hacker",
        rivals: ["corpo_netops", "ncpd"],
        allies: ["chrome_scene", "shroomers", "afterlife_regulars"],
        styleModifiers: { urbanFlash: +0.05, asiaPop: +0.05, businesswear: -0.10, highFashion: -0.05 },
        costOverride: { floor: 300, sweet: 1000 },
        disguiseDifficulty: 2,
        description: "The illegal side of the NET. Intrusion specialists, data thieves, ICE crackers for hire. They meet in Japantown basement cafes and Kabuki back rooms, trading exploit code and war stories about corporate architecture. The digital equivalent of edgerunners — freelance, dangerous, and always one job away from a Black ICE flatline."
      },

      syndicate_bosses: {
        label: "Syndicate Leadership",
        archetype: "gang_boss",
        rivals: ["ncpd", "lazarus"],
        allies: ["tyger_claws", "gold_dragons", "kanzaki_family"],
        styleModifiers: { gangColors: +0.05, highFashion: +0.05, bagLadyChic: -0.10, bohemian: -0.10 },
        costOverride: { floor: 3000, sweet: 8000 },
        disguiseDifficulty: 3,
        description: "The executive tier of Night City's criminal organizations. Tyger Claw oyabun, Valentino captains, the Maelstrom leadership who cleaned up enough to negotiate territory over expensive whiskey. They run the gangs like corporations because at this level, the difference is just branding."
      },

      protest_circuit: {
        label: "Protest Circuit",
        archetype: "rocker_activist",
        rivals: ["ncpd", "grey_ops"],
        allies: ["zoners", "undertow"],
        styleModifiers: { gangColors: +0.05, bohemian: +0.05, businesswear: -0.10, highFashion: -0.10 },
        costOverride: { floor: 200, sweet: 800 },
        disguiseDifficulty: 1,
        description: "The political music underground. Rally organizers, pirate radio hosts, protest singers broadcasting anti-corpo anthems from mobile transmitters. They carry Silverhand's ideology without the thermonuclear punctuation. Every district crackdown creates three more of them."
      },

      brand_circuit: {
        label: "Brand Circuit",
        archetype: "rocker_corporate",
        rivals: ["protest_circuit", "undertow"],
        allies: ["network54", "continental_brands"],
        styleModifiers: { highFashion: +0.05, urbanFlash: +0.05, bagLadyChic: -0.10, gangColors: -0.10 },
        costOverride: { floor: 2000, sweet: 5000 },
        disguiseDifficulty: 2,
        description: "Sponsored rockerboys who traded artistic freedom for corporate backing. Energy drink concerts, branded tours, corpo event headliners. The underground despises them and the mainstream can't look away. Every record deal comes with a handler, a stylist, and a morality clause nobody reads."
      },

      street_hustlers: {
        label: "Street Hustlers",
        archetype: "streetrat_hustler",
        rivals: ["scavvers"],
        allies: ["edgerunners_local"],
        styleModifiers: { urbanFlash: +0.05, bagLadyChic: +0.05, highFashion: -0.10, businesswear: -0.05 },
        costOverride: { floor: 50, sweet: 400 },
        disguiseDifficulty: 1,
        description: "The aspirational underclass. Knockoff flash on a scav's budget, running small cons and moving small product. Every one of them thinks they're one big score from the Afterlife. Most of them are one bad week from the gutter. Night City runs on their optimism and feeds on their failure."
      }
    },

    // ═══════════════════════════════════════
    // ROLE PROFILES — How roles shape perception
    // ═══════════════════════════════════════
    ROLE_PROFILES: {
      solo: {
        label: "Solo",
        icon: "fas fa-crosshairs",
        archetypeAffinity: {
          primary: ["solo", "edgerunner"],
          secondary: ["lawman", "corpo", "fixer"],
          conflicting: ["civilian", "media", "medtech", "entertainer"]
        },
        styleExpectation: {
          urbanFlash: 0.30, genericChic: 0.30, nomadLeathers: 0.25, businesswear: 0.15
        },
        highRankStyleShift: {
          urbanFlash: 0.10, nomadLeathers: 0.05, genericChic: -0.10, businesswear: -0.05
        },
        chromeAffinity: "visible_chrome",
        chromeComfort: 0.25,
        styleTolerance: { heatReduction: 0.9, maxStyleHeat: 30 },
        weaponTolerance: { baseline: 2, perRank: 0.3, heatReduction: 0.5 },
        armorTolerance: { baseline: 1, perRank: 0.2, heatReduction: 0.6 },
        costExpectation: { base: { floor: 500, sweet: 1500 }, perRank: { floor: 100, sweet: 300 } },
        perception: { intimidationBonus: 3, approachabilityPenalty: -1, recognizability: 1.5, coolMasking: 0.8 },
        rankDescriptions: {
          low: "Green muscle. Knows which end of the gun goes bang but hasn't earned a reputation yet.",
          mid: "Working professional. The way they scan a room, check sightlines — trained eyes recognize trained behavior.",
          high: "Veteran operator. There's a stillness to them that makes people nervous.",
          legendary: "Walking death. People cross the street. Their reputation enters the room before they do."
        },
        multiclassNotes: {
          fixer: "Mercenary with connections. Finds their own contracts.",
          exec: "Corporate enforcer. Violence in a three-piece suit.",
          netrunner: "Hybrid operator. Kills you physically or digitally.",
          tech: "Weaponsmith. Builds what they use, uses what they build.",
          medtech: "Combat medic. Keeps the team alive, puts enemies down.",
          media: "War correspondent. The camera and the gun.",
          lawman: "Badge-carrying killer. Maximum authority, maximum force.",
          nomad: "Road warrior. The Badlands' most dangerous export.",
          rockerboy: "Warrior poet. Fights for a cause, bleeds for an audience."
        },
        districtAffinity: {
          typeModifiers: {
            corpo: -2, luxury: -3, danger: 3, military: 2, industrial: 1, mixed: 0, wasteland: 2
          },
          districtOverrides: {
            UPPER_MARINA: 3,       // Edgerunner territory — mercs welcome
            OLD_COMBAT_ZONE: 4,    // Combat pros thrive here
            NORCAL_MILITARY_BASE: 3 // Military background
          },
        },
        factionTension: {
          hostile: [],
          wary: ["lawman_"],
          respected: ["solo_", "edgerunner_"]
        },
        subArchetypePreference: {
          // Low rank: green muscle, basic merc work
          // Mid rank: specializing into a lane
          // High rank: elite operator, distinct specialty
          // Legendary: living weapon, iconic silhouette
          solo_merc:              { low: 8, mid: 5, high: 2, legendary: 0 },
          solo_bodyguard:         { low: 2, mid: 6, high: 8, legendary: 5 },
          solo_assassin:          { low: 0, mid: 3, high: 8, legendary: 10 },
          solo_veteran:           { low: 0, mid: 2, high: 5, legendary: 10 },
          edgerunner_freelance:   { low: 5, mid: 3, high: 0, legendary: -3 },
          corpo_security:         { low: 0, mid: 3, high: 5, legendary: 3 },
          solo_corpo:             { low: 0, mid: 2, high: 7, legendary: 9 },
          // Anti-patterns: a real Solo doesn't read as a civilian
          civilian_office:        { low: -3, mid: -5, high: -8, legendary: -10 },
          civilian_resident:      { low: -2, mid: -4, high: -6, legendary: -8 }
        }
      },
      exec: {
        label: "Exec",
        icon: "fas fa-chess-king",
        archetypeAffinity: {
          primary: ["exec", "corpo"],
          secondary: ["fixer", "operative"],
          conflicting: ["gang", "nomad", "streetrat", "edgerunner"]
        },
        styleExpectation: {
          businesswear: 0.40, highFashion: 0.35, genericChic: 0.15, leisurewear: 0.10
        },
        highRankStyleShift: {
          highFashion: 0.15, businesswear: -0.05, genericChic: -0.10
        },
        chromeAffinity: "hidden_chrome",
        chromeComfort: 0.10,
        styleTolerance: { heatReduction: 0.3, maxStyleHeat: 8 },
        weaponTolerance: { baseline: 0, perRank: 0.1, heatReduction: 1.2 },
        armorTolerance: { baseline: 1, perRank: 0.15, heatReduction: 1.0 },
        costExpectation: { base: { floor: 2000, sweet: 5000 }, perRank: { floor: 500, sweet: 1000 } },
        perception: { intimidationBonus: 0, approachabilityPenalty: 0, recognizability: 2.5, coolMasking: 0.5 },
        rankDescriptions: {
          low: "Junior exec. Nice suit, no pull.",
          mid: "Division head. Has people, budget, and enemies.",
          high: "C-suite predator. Entire departments pivot on their mood.",
          legendary: "Reshapes markets with a phone call. Power so absolute it doesn't need to be displayed."
        },
        multiclassNotes: {
          solo: "Corporate enforcer who does their own wetwork.",
          fixer: "Power broker. Runs the deal and the company.",
          netrunner: "Digital executive. Controls the boardroom and the NET.",
          tech: "Innovation officer. Builds the products that build the empire.",
          medtech: "Biotech executive. Profits from other people's pain.",
          media: "Media mogul. Owns the narrative, literally.",
          lawman: "Commissioner-level authority. Law is whatever they say it is.",
          nomad: "Trade baron. Corporate logistics with Nomad muscle.",
          rockerboy: "Celebrity CEO. Disrupts industries with charisma."
        },
        districtAffinity: {
          typeModifiers: {
            corpo: 4, luxury: 4, danger: -4, military: 0, industrial: 1, mixed: 0, wasteland: -5
          },
          districtOverrides: {
            DOWNTOWN: 5,            // Corpo HQ turf
            EXEC_ZONE: 5,           // Literally named for them
            CHARTER_HILL: 4,        // Rich neighborhood
            OLD_COMBAT_ZONE: -5,    // Walking ATM
            RANCHO_CORONADO: -4     // Gang territory
          },
        },
        factionTension: {
          hostile: ["gang_booster", "streetrat_"],
          wary: ["gang_organized", "nomad_raider"],
          respected: ["corpo_", "fixer_syndicate"]
        },
        subArchetypePreference: {
          // Low: junior exec = basically a corpo suit
          // Mid: climbing, social capital matters
          // High: C-suite predator
          // Legendary: reshapes markets
          corpo_suit:             { low: 8, mid: 4, high: 0, legendary: -3 },
          exec_socialite:         { low: 2, mid: 7, high: 6, legendary: 4 },
          exec_power:             { low: 0, mid: 3, high: 9, legendary: 10 },
          corpo_agent:            { low: 0, mid: 2, high: 5, legendary: 6 },
          fixer_broker:           { low: 0, mid: 0, high: 4, legendary: 6 },
          civilian_office:        { low: 5, mid: 0, high: -5, legendary: -8 },
          solo_corpo:             { low: 0, mid: 0, high: 3, legendary: 4 },
          fixer_corpo:            { low: 0, mid: 2, high: 5, legendary: 6 },
          // Anti-patterns: an Exec never reads as street
          streetrat_scavver:      { low: -5, mid: -8, high: -10, legendary: -10 },
          gang_booster:           { low: -5, mid: -8, high: -10, legendary: -10 }
        }
      },
      fixer: {
        label: "Fixer",
        icon: "fas fa-handshake",
        archetypeAffinity: {
          primary: ["fixer"],
          secondary: ["corpo", "exec", "civilian", "operative"],
          conflicting: ["solo", "gang"]
        },
        styleExpectation: {
          genericChic: 0.30, businesswear: 0.25, urbanFlash: 0.25, leisurewear: 0.20
        },
        highRankStyleShift: {
          businesswear: 0.10, urbanFlash: 0.05, genericChic: -0.10, leisurewear: -0.05
        },
        chromeAffinity: "hidden_chrome",
        chromeComfort: 0.15,
        styleTolerance: { heatReduction: 0.5, maxStyleHeat: 15 },
        weaponTolerance: { baseline: 1, perRank: 0.15, heatReduction: 0.8 },
        armorTolerance: { baseline: 0, perRank: 0.1, heatReduction: 0.9 },
        costExpectation: { base: { floor: 800, sweet: 2500 }, perRank: { floor: 200, sweet: 500 } },
        perception: { intimidationBonus: 0, approachabilityPenalty: 0, recognizability: 1.0, coolMasking: 1.2 },
        rankDescriptions: {
          low: "Small-time broker. Knows a guy who knows a guy.",
          mid: "Connected operator. Multiple client networks, multiple wardrobes for multiple worlds.",
          high: "Major player. Their name opens doors across Night City.",
          legendary: "The person everyone calls when everything else fails."
        },
        multiclassNotes: {
          solo: "Mercenary broker. Sells jobs, sometimes does them personally.",
          exec: "Corporate dealmaker. Connections on both sides of legal.",
          netrunner: "Information broker. Sells data, buys secrets.",
          tech: "Equipment dealer. Sources gear nobody else can find.",
          medtech: "Back-alley clinic operator. Connects patients with chrome.",
          media: "Gossip merchant. Sells stories and silence equally.",
          lawman: "Corrupt badge. Fixes problems for the right price.",
          nomad: "Smuggling coordinator. Moves anything across any border.",
          rockerboy: "Scene promoter. Books the talent, runs the venue."
        },
        districtAffinity: {
          typeModifiers: {
            corpo: 1, luxury: 1, danger: 1, military: -2, industrial: 1, mixed: 2, wasteland: -1
          },
          districtOverrides: {
            UPPER_MARINA: 3,        // Afterlife adjacent, deal central
            LITTLE_CHINA: 3,        // Night markets, underground deals
            KABUKI: 3,              // Fixers run Kabuki
            NEW_WESTBROOK: 2        // Money flows through Westbrook
          },
        },
        factionTension: {
          hostile: [],
          wary: [],
          respected: ["fixer_", "edgerunner_"]
        },
        subArchetypePreference: {
          // Low: small-time street deals
          // Mid: growing network, multiple worlds
          // High: power player, doors open everywhere
          // Legendary: the name everyone knows
          fixer_street:           { low: 8, mid: 5, high: 2, legendary: 0 },
          fixer_syndicate:        { low: 2, mid: 6, high: 7, legendary: 5 },
          fixer_broker:           { low: 0, mid: 3, high: 8, legendary: 10 },
          fixer_smuggler:         { low: 4, mid: 5, high: 4, legendary: 2 },
          fixer_corpo:            { low: 0, mid: 2, high: 6, legendary: 8 },
          corpo_agent:            { low: 0, mid: 2, high: 5, legendary: 7 },
          civilian_vendor:        { low: 5, mid: 2, high: -2, legendary: -5 },
          edgerunner_freelance:   { low: 3, mid: 0, high: -3, legendary: -5 }
        }
      },
      lawman: {
        label: "Lawman",
        icon: "fas fa-shield-alt",
        archetypeAffinity: {
          primary: ["lawman"],
          secondary: ["corpo", "solo", "operative"],
          conflicting: ["gang", "streetrat", "edgerunner", "nomad"]
        },
        styleExpectation: {
          genericChic: 0.35, businesswear: 0.25, urbanFlash: 0.25, nomadLeathers: 0.15
        },
        highRankStyleShift: {
          businesswear: 0.10, urbanFlash: 0.05, genericChic: -0.10, nomadLeathers: -0.05
        },
        chromeAffinity: "hidden_chrome",
        chromeComfort: 0.20,
        weaponTolerance: { baseline: 2, perRank: 0.25, heatReduction: 0.4 },
        armorTolerance: { baseline: 2, perRank: 0.3, heatReduction: 0.3 },
        costExpectation: { base: { floor: 400, sweet: 1500 }, perRank: { floor: 100, sweet: 250 } },
        perception: { intimidationBonus: 2, approachabilityPenalty: -2, recognizability: 2.0, coolMasking: 0.7 },
        rankDescriptions: {
          low: "Patrol officer. Standard-issue everything.",
          mid: "Detective or squad leader. Better gear, harder eyes.",
          high: "Commander-level. Criminals know the face.",
          legendary: "The law itself. Even other cops stand straighter."
        },
        multiclassNotes: {
          solo: "SWAT specialist. Maximum force, minimum questions.",
          exec: "Police commissioner. Politics and policing combined.",
          fixer: "Connected cop. Knows the street, works both sides.",
          netrunner: "Cybercrime investigator. Hunts criminals in the NET.",
          tech: "Forensic specialist. Solves cases with technology.",
          medtech: "Medical examiner or crisis medic with a badge.",
          media: "Internal affairs or media liaison.",
          nomad: "Highway patrol or border enforcement.",
          rockerboy: "Community liaison. Polices through presence and charisma."
        },
        districtAffinity: {
          typeModifiers: {
            corpo: 3, luxury: 2, danger: -2, military: 3, industrial: 1, mixed: 1, wasteland: -2
          },
          districtOverrides: {
            DOWNTOWN: 4,            // NCPD presence strong
            NORCAL_MILITARY_BASE: 3,// Law enforcement welcome
            OLD_COMBAT_ZONE: -4,    // Cops get shot here
            PACIFICA_PLAYGROUND: -4, // VDB territory, no badges
            RANCHO_CORONADO: -3     // Gang turf, badge = target
          }
        },
        factionTension: {
          hostile: ["gang_booster", "gang_cult", "streetrat_scavver", "nomad_raider"],
          wary: ["gang_organized", "gang_militia", "gang_boss", "fixer_syndicate", "gang_poser"],
          respected: ["lawman_", "corpo_security", "solo_corpo"]
        },
        subArchetypePreference: {
          // Low: beat cop — uniform energy, standard issue
          // Mid: detective/squad lead — harder edges
          // High: commander — institutional authority
          // Legendary: THE law walks in the room
          lawman_beat:            { low: 10, mid: 6, high: 3, legendary: 4 },
          lawman_deputy:          { low: 3, mid: 7, high: 10, legendary: 8 },
          lawman_trauma:          { low: 0, mid: 3, high: 5, legendary: 4 },
          solo_corpo:             { low: 0, mid: 0, high: 2, legendary: 3 },
          corpo_security:         { low: 2, mid: 4, high: 6, legendary: 5 },
          solo_bodyguard:         { low: 0, mid: 2, high: 3, legendary: 2 },
          // Anti-patterns: law doesn't read as crime
          gang_organized:         { low: -5, mid: -7, high: -10, legendary: -10 },
          streetrat_scavver:      { low: -5, mid: -8, high: -10, legendary: -10 },
          fixer_syndicate:        { low: -3, mid: -5, high: -7, legendary: -8 }
        }
      },
      media: {
        label: "Media",
        icon: "fas fa-broadcast-tower",
        archetypeAffinity: {
          primary: ["media", "entertainer"],
          secondary: ["civilian", "exec", "rockerboy"],
          conflicting: ["solo", "gang", "streetrat"]
        },
        styleExpectation: {
          genericChic: 0.30, highFashion: 0.25, businesswear: 0.25, urbanFlash: 0.20
        },
        highRankStyleShift: {
          highFashion: 0.15, businesswear: 0.05, genericChic: -0.15, urbanFlash: -0.05
        },
        chromeAffinity: "hidden_chrome",
        chromeComfort: 0.10,
        weaponTolerance: { baseline: 0, perRank: 0.1, heatReduction: 1.5 },
        armorTolerance: { baseline: 0, perRank: 0.1, heatReduction: 1.3 },
        costExpectation: { base: { floor: 600, sweet: 2000 }, perRank: { floor: 200, sweet: 600 } },
        perception: { intimidationBonus: -1, approachabilityPenalty: 1, recognizability: 3.0, coolMasking: 0.6 },
        rankDescriptions: {
          low: "Blogger or freelancer. Covering stories nobody else wants.",
          mid: "Established journalist. Recognized byline, real equipment.",
          high: "Star reporter. Face on screen, name in headlines.",
          legendary: "The voice of Night City. When they speak, millions listen."
        },
        multiclassNotes: {
          solo: "War correspondent. Reports from the front lines personally.",
          exec: "Media mogul. Owns the platform, shapes the narrative.",
          fixer: "Information broker who publishes the good stuff.",
          netrunner: "Digital investigator. Hacks the story, publishes the truth.",
          tech: "Technical journalist or equipment reviewer.",
          medtech: "Medical correspondent. Reports on plagues and pharma.",
          lawman: "Crime reporter with actual arrest authority.",
          nomad: "Road reporter. Covers the Badlands beat nobody else survives.",
          rockerboy: "Celebrity journalist. The messenger IS the message."
        },
        districtAffinity: {
          typeModifiers: {
            corpo: 0, luxury: 1, danger: -1, military: -3, industrial: 0, mixed: 1, wasteland: -1
          },
          districtOverrides: {
            UNIVERSITY_DISTRICT: 3,  // Intellectual crowd
            NEW_WESTBROOK: 2,        // Media scene
            NORCAL_MILITARY_BASE: -4 // Cameras very unwelcome
          }
        },
        factionTension: {
          hostile: [],
          wary: ["corpo_agent", "operative_", "gang_cult"],
          respected: ["rocker_", "media_"]
        },
        subArchetypePreference: {
          // Low: freelance blogger, pirate media scrapper
          // Mid: established byline, real gear
          // High: star reporter, face on screen
          // Legendary: the voice of Night City
          media_pirate:           { low: 8, mid: 4, high: 0, legendary: -2 },
          media_gonzo:            { low: 5, mid: 8, high: 5, legendary: 3 },
          media_anchor:           { low: 0, mid: 4, high: 9, legendary: 10 },
          rocker_rebel:           { low: 4, mid: 2, high: 0, legendary: 0 },
          rocker_activist:        { low: 3, mid: 2, high: 0, legendary: 0 },
          rocker_corporate:       { low: 0, mid: 0, high: 3, legendary: 2 },
          entertainer_performer:  { low: 0, mid: 3, high: 5, legendary: 4 },
          // Anti-patterns
          operative_sleeper:      { low: -3, mid: -5, high: -7, legendary: -8 },
          civilian_office:        { low: -2, mid: -4, high: -6, legendary: -8 }
        }
      },
      medtech: {
        label: "MedTech",
        icon: "fas fa-heartbeat",
        archetypeAffinity: {
          primary: ["medtech", "civilian"],
          secondary: ["corpo", "fixer", "techie"],
          conflicting: ["solo", "gang", "edgerunner", "nomad"]
        },
        styleExpectation: {
          genericChic: 0.40, businesswear: 0.30, leisurewear: 0.20, urbanFlash: 0.10
        },
        highRankStyleShift: {
          businesswear: 0.15, genericChic: -0.10, leisurewear: -0.05
        },
        chromeAffinity: "bioware",
        chromeComfort: 0.15,
        weaponTolerance: { baseline: 0, perRank: 0.05, heatReduction: 1.4 },
        armorTolerance: { baseline: 0, perRank: 0.1, heatReduction: 1.2 },
        costExpectation: { base: { floor: 500, sweet: 2000 }, perRank: { floor: 150, sweet: 400 } },
        perception: { intimidationBonus: -2, approachabilityPenalty: 2, recognizability: 0.5, coolMasking: 0.7 },
        rankDescriptions: {
          low: "Street doc or clinic assistant. Dresses like they might get blood on anything.",
          mid: "Skilled surgeon or combat medic. Quiet confidence of someone who's held lives in their hands.",
          high: "Top-tier physician. Dresses like someone whose time is worth thousands per hour.",
          legendary: "Miracle worker. People fly across continents for their expertise."
        },
        multiclassNotes: {
          solo: "Combat medic. Patches holes they helped put there.",
          exec: "Biotech executive. Runs the clinic that runs the city.",
          fixer: "Ripperdoc with connections. Black market chrome specialist.",
          netrunner: "Neural surgeon. Installs the wetware for NET operations.",
          tech: "Cyberware engineer. Designs what they install.",
          media: "Medical correspondent or whistleblower.",
          lawman: "Medical examiner. Reads the dead for the badge.",
          nomad: "Caravan medic. Only doctor for a hundred miles.",
          rockerboy: "Celebrity doctor or medical activist."
        },
        districtAffinity: {
          typeModifiers: {
            corpo: 1, luxury: 0, danger: 2, military: 2, industrial: 1, mixed: 1, wasteland: 1
          },
          districtOverrides: {
            OLD_COMBAT_ZONE: 3,     // Everyone needs a doc here
            SOUTH_NIGHT_CITY: 2,    // Underserved, medtechs valued
            KABUKI: 2               // Ripperdoc row
          }
        },
        factionTension: {
          hostile: [],
          wary: [],
          respected: ["medtech_"]
        },
        subArchetypePreference: {
          // Low: street doc, back-alley work
          // Mid: skilled surgeon, clinic runner
          // High: top physician, Trauma Team tier
          // Legendary: miracle worker — people fly across continents
          medtech_ripper:         { low: 9, mid: 5, high: 2, legendary: 0 },
          medtech_combat:         { low: 5, mid: 7, high: 4, legendary: 2 },
          medtech_clinic:         { low: 0, mid: 4, high: 9, legendary: 10 },
          medtech_trauma:         { low: 0, mid: 2, high: 7, legendary: 8 },
          techie_maker:           { low: 3, mid: 2, high: 0, legendary: 0 },
          civilian_worker:        { low: 4, mid: 0, high: -3, legendary: -5 },
          // Anti-patterns
          gang_booster:           { low: -3, mid: -5, high: -8, legendary: -10 },
          streetrat_scavver:      { low: -4, mid: -6, high: -8, legendary: -10 }
        }
      },
      netrunner: {
        label: "Netrunner",
        icon: "fas fa-network-wired",
        archetypeAffinity: {
          primary: ["techie", "techie_netrunner"],
          secondary: ["civilian", "fixer", "medtech", "edgerunner_freelance"],
          conflicting: ["exec", "gang"]
        },
        styleExpectation: {
          urbanFlash: 0.30, genericChic: 0.25, asiaPop: 0.25, leisurewear: 0.20
        },
        highRankStyleShift: {
          asiaPop: 0.10, urbanFlash: 0.05, genericChic: -0.10, leisurewear: -0.05
        },
        chromeAffinity: "hidden_chrome",
        chromeComfort: 0.30,
        weaponTolerance: { baseline: 0, perRank: 0.1, heatReduction: 1.3 },
        armorTolerance: { baseline: 0, perRank: 0.1, heatReduction: 1.1 },
        costExpectation: { base: { floor: 300, sweet: 1200 }, perRank: { floor: 100, sweet: 300 } },
        perception: { intimidationBonus: -1, approachabilityPenalty: -1, recognizability: 0.8, coolMasking: 1.0 },
        rankDescriptions: {
          low: "Script kiddy with a neural link. Cheap interface gear, energy drink stains.",
          mid: "Serious runner. Custom rig, quality interface plugs, thousand-yard stare.",
          high: "Elite hacker. Military-grade neural architecture.",
          legendary: "Digital ghost. Could crash the city from a food court."
        },
        multiclassNotes: {
          solo: "Cyber-commando. Kills in meatspace and cyberspace.",
          exec: "Corporate hacker. Industrial espionage in a suit.",
          fixer: "Data broker. Steals information, sells it to the highest bidder.",
          tech: "Hardware/software engineer. Builds the tools runners dream of.",
          medtech: "Neural surgeon. Installs and maintains runner chrome.",
          media: "Hacktivist journalist. Steals the truth, publishes it.",
          lawman: "NetWatch or cybercrime investigator.",
          nomad: "Mobile runner. Hacks from the road, leaves no trace.",
          rockerboy: "Digital artist or virtual performer. The NET is their stage."
        },
        districtAffinity: {
          typeModifiers: {
            corpo: -1, luxury: -2, danger: 1, military: -3, industrial: 2, mixed: 1, wasteland: -2
          },
          districtOverrides: {
            KABUKI: 4,              // Net café culture, runner haven
            OLD_JAPANTOWN: 3,       // Tech underground
            PACIFICA_PLAYGROUND: 2, // VDB territory — runners respected
            NORCAL_MILITARY_BASE: -4 // Black ICE central, stay out
          }
        },
        factionTension: {
          hostile: [],
          wary: ["corpo_security", "lawman_"],
          respected: ["techie_netrunner"]
        },
        subArchetypePreference: {
          // Low: script kiddy — cheap gear, energy drink stains
          // Mid: serious runner — custom rig, thousand-yard stare
          // High: elite hacker — military-grade neural architecture
          // Legendary: digital ghost — invisible in meatspace
          techie_netrunner:       { low: 8, mid: 10, high: 8, legendary: 6 },
          techie_maker:           { low: 4, mid: 2, high: 0, legendary: 0 },
          techie_corpo:           { low: 0, mid: 2, high: 5, legendary: 4 },
          techie_hacker:          { low: 6, mid: 8, high: 7, legendary: 5 },
          techie_corponet:        { low: 0, mid: 2, high: 7, legendary: 10 },
          techie_scrapper:        { low: 3, mid: 0, high: -2, legendary: -3 },
          operative_sleeper:      { low: 0, mid: 0, high: 5, legendary: 10 },
          corpo_agent:            { low: 0, mid: 0, high: 3, legendary: 6 },
          edgerunner_freelance:   { low: 5, mid: 3, high: 0, legendary: -2 },
          // Anti-patterns: netrunners don't read as muscle
          solo_merc:              { low: -3, mid: -5, high: -7, legendary: -8 },
          gang_booster:           { low: -4, mid: -6, high: -8, legendary: -10 }
        }
      },
      nomad: {
        label: "Nomad",
        icon: "fas fa-truck-monster",
        archetypeAffinity: {
          primary: ["nomad"],
          secondary: ["solo", "edgerunner"],
          conflicting: ["exec", "corpo", "entertainer"]
        },
        styleExpectation: {
          nomadLeathers: 0.40, genericChic: 0.25, bagLadyChic: 0.20, urbanFlash: 0.15
        },
        highRankStyleShift: {
          nomadLeathers: 0.10, urbanFlash: 0.05, bagLadyChic: -0.10, genericChic: -0.05
        },
        chromeAffinity: "visible_chrome",
        chromeComfort: 0.20,
        weaponTolerance: { baseline: 2, perRank: 0.2, heatReduction: 0.6 },
        armorTolerance: { baseline: 1, perRank: 0.2, heatReduction: 0.5 },
        costExpectation: { base: { floor: 200, sweet: 800 }, perRank: { floor: 50, sweet: 150 } },
        perception: { intimidationBonus: 1, approachabilityPenalty: -1, recognizability: 1.2, coolMasking: 0.9 },
        rankDescriptions: {
          low: "Road kid. Pack colors, road dust, hand-me-down leathers.",
          mid: "Pack member with standing. Better gear, pack insignia.",
          high: "Pack leader or senior member. Quality road gear, visible authority.",
          legendary: "Nation-level leader. When their pack rolls into town, the city notices."
        },
        multiclassNotes: {
          solo: "Road warrior. The Badlands' apex predator.",
          exec: "Trade baron. Nomad logistics meets corporate ambition.",
          fixer: "Smuggling specialist. Moves anything past any checkpoint.",
          netrunner: "Mobile runner. Hacks from a moving vehicle.",
          tech: "Vehicle engineer. Builds the machines that run the roads.",
          medtech: "Caravan medic. Only healthcare for hundreds of miles.",
          media: "Badlands correspondent. Reports from places others fear.",
          lawman: "Highway marshal. Law of the open road.",
          rockerboy: "Traveling performer. Music for the masses, town to town."
        },
        districtAffinity: {
          typeModifiers: {
            corpo: -3, luxury: -4, danger: 1, military: -1, industrial: 2, mixed: -1, wasteland: 5
          },
          districtOverrides: {
            BADLANDS: 5,            // Home turf
            HEYWOOD_DOCKS: 2,       // Trade routes
            SANTO_DOMINGO: 2,       // Edge of city, nomad-adjacent
            PORT_OF_NIGHT_CITY: 2,  // Logistics hub
            EXEC_ZONE: -5,          // Fish out of water
            CHARTER_HILL: -4        // Country mouse in the city
          }
        },
        factionTension: {
          hostile: ["nomad_raider"],
          wary: ["corpo_security", "corpo_agent"],
          respected: ["nomad_clan", "nomad_trader"]
        },
        subArchetypePreference: {
          // Low: road kid — pack colors, hand-me-down leathers
          // Mid: pack member — standing, better gear
          // High: pack leader — quality road gear, visible authority
          // Legendary: nation-level — the city notices when they roll in
          nomad_clan:             { low: 9, mid: 8, high: 7, legendary: 10 },
          nomad_trader:           { low: 2, mid: 5, high: 8, legendary: 7 },
          nomad_corpo:            { low: -2, mid: 2, high: 5, legendary: 3 },
          fixer_smuggler:         { low: 2, mid: 4, high: 5, legendary: 3 },
          courier_driver:         { low: 5, mid: 3, high: 0, legendary: 0 },
          // Anti-patterns: legitimate nomads HATE being read as raiders
          nomad_raider:           { low: -3, mid: -6, high: -8, legendary: -10 },
          // Nomads don't read as city archetypes
          corpo_suit:             { low: -4, mid: -6, high: -8, legendary: -10 },
          exec_socialite:         { low: -5, mid: -7, high: -9, legendary: -10 },
          civilian_office:        { low: -3, mid: -5, high: -7, legendary: -8 }
        }
      },
      rockerboy: {
        label: "Rockerboy",
        icon: "fas fa-guitar",
        archetypeAffinity: {
          primary: ["rockerboy", "entertainer"],
          secondary: ["media", "streetrat"],
          conflicting: ["corpo", "lawman", "operative"]
        },
        styleExpectation: {
          urbanFlash: 0.30, bohemian: 0.25, highFashion: 0.20, asiaPop: 0.15, gangColors: 0.10
        },
        highRankStyleShift: {
          highFashion: 0.15, urbanFlash: 0.05, bohemian: -0.10, gangColors: -0.10
        },
        chromeAffinity: "fashionware",
        chromeComfort: 0.25,
        styleTolerance: { heatReduction: 0.4, maxStyleHeat: 12 },
        weaponTolerance: { baseline: 0, perRank: 0.15, heatReduction: 1.0 },
        armorTolerance: { baseline: 0, perRank: 0.1, heatReduction: 1.1 },
        costExpectation: { base: { floor: 400, sweet: 2000 }, perRank: { floor: 200, sweet: 800 } },
        perception: { intimidationBonus: 0, approachabilityPenalty: 2, recognizability: 3.0, coolMasking: 0.5 },
        rankDescriptions: {
          low: "Open mic night. Thrift-store bohemian, playing to twelve people in a basement.",
          mid: "Club headliner. Real following, real style. Fashion is part of the performance.",
          high: "Star. Billboard face, headline act, every outfit is a statement.",
          legendary: "Icon. Their style defines an era. Silverhand levels of cultural gravity."
        },
        multiclassNotes: {
          solo: "Warrior poet. Fights for a cause, bleeds for an audience.",
          exec: "Celebrity CEO. Disrupts industries with charisma.",
          fixer: "Scene promoter. Books talent, runs venues, shapes culture.",
          netrunner: "Digital artist. Virtual performances, NET-born fame.",
          tech: "Instrument builder or sound engineer.",
          medtech: "Medical activist. Heals the people, rallies the cause.",
          media: "Journalist-activist. The messenger IS the message.",
          lawman: "Community icon with a badge. Polices through presence.",
          nomad: "Traveling bard. Brings music to the road."
        },
        districtAffinity: {
          typeModifiers: {
            corpo: -2, luxury: 1, danger: 0, military: -3, industrial: 0, mixed: 2, wasteland: -2
          },
          districtOverrides: {
            UPPER_MARINA: 3,        // Club scene
            OLD_JAPANTOWN: 3,       // Counterculture hub
            NEW_WESTBROOK: 2,       // Entertainment district
            UNIVERSITY_DISTRICT: 2, // Young fans
            NORCAL_MILITARY_BASE: -4 // Not their scene at all
          }
        },
        factionTension: {
          hostile: [],
          wary: ["corpo_agent", "corpo_security"],
          respected: ["rocker_", "gang_poser"]
        },
        subArchetypePreference: {
          // Low: open mic — thrift-store bohemian
          // Mid: club headliner — real following, style is performance
          // High: star — billboard face, every outfit a statement
          // Legendary: icon — defines an era
          rocker_underground:     { low: 8, mid: 4, high: 0, legendary: -2 },
          rocker_rebel:           { low: 5, mid: 8, high: 7, legendary: 9 },
          rocker_idol:            { low: 0, mid: 5, high: 10, legendary: 10 },
          entertainer_performer:  { low: 3, mid: 5, high: 6, legendary: 4 },
          rocker_activist:        { low: 5, mid: 7, high: 5, legendary: 4 },
          rocker_corporate:       { low: 0, mid: 3, high: 8, legendary: 6 },
          entertainer_dj:         { low: 4, mid: 3, high: 0, legendary: 0 },
          media_gonzo:            { low: 3, mid: 2, high: 0, legendary: 0 },
          // Anti-patterns: rockers don't read as corporate
          corpo_suit:             { low: -4, mid: -6, high: -8, legendary: -10 },
          civilian_office:        { low: -3, mid: -5, high: -7, legendary: -8 }
        }
      },
      tech: {
        label: "Tech",
        icon: "fas fa-wrench",
        archetypeAffinity: {
          primary: ["techie", "techie_maker"],
          secondary: ["civilian", "fixer", "medtech", "techie_corpo"],
          conflicting: ["exec", "gang"]
        },
        styleExpectation: {
          genericChic: 0.35, urbanFlash: 0.25, bagLadyChic: 0.20, leisurewear: 0.20
        },
        highRankStyleShift: {
          urbanFlash: 0.10, genericChic: 0.05, bagLadyChic: -0.10, leisurewear: -0.05
        },
        chromeAffinity: "visible_chrome",
        chromeComfort: 0.25,
        weaponTolerance: { baseline: 0, perRank: 0.15, heatReduction: 0.9 },
        armorTolerance: { baseline: 0, perRank: 0.1, heatReduction: 1.0 },
        costExpectation: { base: { floor: 300, sweet: 1000 }, perRank: { floor: 100, sweet: 250 } },
        perception: { intimidationBonus: -1, approachabilityPenalty: 0, recognizability: 0.5, coolMasking: 0.9 },
        rankDescriptions: {
          low: "Apprentice tinker. Grease under the fingernails, utility wear.",
          mid: "Skilled craftsman. Practical style with custom touches.",
          high: "Master engineer. Half the outfit has hidden pockets or tool mounts.",
          legendary: "The maker. Everything they wear, they improved."
        },
        multiclassNotes: {
          solo: "Weaponsmith. Builds what they use.",
          exec: "Innovation officer. Builds the products that build the empire.",
          fixer: "Equipment dealer. Sources gear nobody else can find.",
          netrunner: "Hardware engineer. Builds the decks runners rely on.",
          medtech: "Cyberware engineer. Designs and installs chrome.",
          media: "Technical journalist or gear reviewer.",
          lawman: "Forensics specialist. Technology solves crimes.",
          nomad: "Vehicle mechanic. Keeps the pack rolling.",
          rockerboy: "Instrument builder. Creates the tools of art."
        },
        districtAffinity: {
          typeModifiers: {
            corpo: 0, luxury: -2, danger: 1, military: 1, industrial: 3, mixed: 1, wasteland: 1
          },
          districtOverrides: {
            HEYWOOD_INDUSTRIAL: 4,  // Workshop heaven
            PORT_OF_NIGHT_CITY: 3,  // Salvage and parts
            WATSON_DEVELOPMENT: 2,  // Tech startup zone
            KABUKI: 2               // Maker culture
          }
        },
        factionTension: {
          hostile: [],
          wary: [],
          respected: ["techie_"]
        },
        subArchetypePreference: {
          // Low: apprentice tinker — grease and utility wear
          // Mid: skilled craftsman — practical with custom touches
          // High: master engineer — hidden pockets, tool mounts
          // Legendary: THE maker — everything they wear, they improved
          techie_maker:           { low: 9, mid: 10, high: 8, legendary: 10 },
          techie_netrunner:       { low: 3, mid: 2, high: 0, legendary: 0 },
          techie_corpo:           { low: 0, mid: 3, high: 7, legendary: 5 },
          techie_scrapper:        { low: 8, mid: 6, high: 3, legendary: 0 },
          techie_hacker:          { low: 2, mid: 0, high: -2, legendary: -3 },
          techie_corponet:        { low: 0, mid: 2, high: 5, legendary: 4 },
          civilian_worker:        { low: 5, mid: 2, high: -2, legendary: -4 },
          medtech_ripper:         { low: 3, mid: 3, high: 2, legendary: 0 },
          // Anti-patterns: techs don't read as social butterflies
          exec_socialite:         { low: -4, mid: -6, high: -8, legendary: -10 },
          rocker_idol:            { low: -3, mid: -5, high: -7, legendary: -8 },
          entertainer_performer:  { low: -2, mid: -4, high: -6, legendary: -7 }
        }
      },
      none: {
        label: "Civilian",
        icon: "fas fa-user",
        archetypeAffinity: {
          primary: ["civilian"],
          secondary: ["entertainer", "medtech"],
          conflicting: ["solo", "exec", "gang", "edgerunner"]
        },
        styleExpectation: {
          genericChic: 0.50, leisurewear: 0.30, bagLadyChic: 0.20
        },
        districtAffinity: {
          typeModifiers: {
            corpo: 0, luxury: 0, danger: 0, military: -2, industrial: 0, mixed: 0, wasteland: -1
          },
          districtOverrides: {}
        },
        factionTension: {
          hostile: [],
          wary: [],
          respected: []
        },
        highRankStyleShift: {},
        chromeAffinity: "hidden_chrome",
        chromeComfort: 0.05,
        weaponTolerance: { baseline: 0, perRank: 0, heatReduction: 1.5 },
        armorTolerance: { baseline: 0, perRank: 0, heatReduction: 1.5 },
        costExpectation: { base: { floor: 100, sweet: 500 }, perRank: { floor: 0, sweet: 0 } },
        perception: { intimidationBonus: -3, approachabilityPenalty: 3, recognizability: 0, coolMasking: 0.5 },
        rankDescriptions: {
          low: "Nobody. Just another face in the Night City crowd.",
          mid: "Nobody.", high: "Nobody.", legendary: "Nobody."
        },
        multiclassNotes: {}
      }
    }
  };

export default FACTIONS;
