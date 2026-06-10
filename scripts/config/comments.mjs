/**
 * config/comments.mjs — seed defaults (guide §5.3).
 *
 * Lifted VERBATIM from stylechecker2_0_Phase82.js
 * StyleDataManager.getDefaultCommentsData(). Do not hand-edit — regenerate via
 * tools/extract-config.mjs if the reference macro changes.
 *
 * Top-level keys: 12.
 */

export const COMMENTS = {
        // ── CYBERPUNK USERNAMES ──
        usernames: {
            gonks: [
                "xXChr0meJunkieXx", "NightCity_Wanderer", "PREEM_or_NOVA", "GlitchInTheMeat",
                "NeonDreamer_2045", "StreetSamurai_NC", "CyberPsych0_Watch", "BottomOfTheStack",
                "ChromeAndBone", "Edgerunner_Anon", "MeatBag_Supreme", "LastGig_Lenny",
                "ZeroCool_NC", "D1gital_Ghost", "WiredReflex_Kid", "DumpsterDiver_NC",
                "Bartmoss_Was_Right", "Alt_Cunningham_Fan", "CorpoRat_Dropout", "TimeOfTheRed",
                "SteelAndSkin", "FleshIsWeak_", "NoFutureNC", "Overcl0cked",
                "HotZone_Crawler", "RadDust_Breather", "4thWar_Survivor", "NukeGlow_Kid"
            ],
            fixers: [
                "FixerFelicia_NC", "DealBroker99", "Rogue_Network", "TheMiddleWoman",
                "BlackMarket_Broker", "ConnectTheDots_", "NightMarket_Queen", "BackChannel_Op",
                "EddiesFirst_Fixer", "TheGo_Between", "ColdCall_Closer", "HandshakeDeal_NC",
                "Woodchipper_Fan", "Hornet_Hater", "Fixie_Courier_NC"
            ],
            corpos: [
                "NCCS_Intern_42", "CorpoClimber_NC", "MilitechMidMgmt", "Platinum_Credchip",
                "BoardroomViper", "C_Suite_Shark", "ExecutiveAction_", "GoldenParachute_NC",
                "Corner_Office_Life", "NightCorp_Drone", "Quarterly_Earnings", "PetrochemPeon",
                "ExecZone_Dreams", "Lazarus_Cleared", "SovOil_Stiff"
            ],
            netrunners: [
                "NetRunner_404", "DataKrash_Kid", "Bartmoss_Legacy", "ICE_Breaker_v2",
                "Subnet_Shadow", "Deep_Net_Diver", "BlackICE_Surfer", "R00tAccess_NC",
                "Daemon_Spawner", "VoidRunner_", "PacketStorm_NC", "Ghost_In_The_Net",
                "LocalNET_Only", "Architecture_Diver", "CityNET_Crawler"
            ],
            gangers: [
                "TygerClaw_Neon", "MaelstromMike", "6thStreet_Patriot", "IronSights_Brute",
                "Voodoo_Child_NC", "GoldDragon_Guard", "KillKrasher_Fan", "DeadWood_Cowboy",
                "Scav_Hunter_NC", "Colors4Life", "TurfWar_Veteran", "GangGang_NC",
                "Bozo_HaHaHa", "Enhanced_Prophet", "Reckoner_Doom"
            ],
            media: [
                "N54_Sharon", "TruthHurts_Media", "Screamsheet_Sally", "HotTake_Hannah",
                "StreetBeat_Reporter", "GossipGrid_NC", "ClickBait_Carl", "Breaking_NC_News",
                "Underground_Press", "PulseOfTheCity", "RedChronicles_", "MediaBlitz_NC",
                "Trace_Santiago_Fan", "DangerGal_Beat", "CombatZone_Press"
            ],
            solos: [
                "HighNoon_Solo", "ColdSteel_Merc", "ContractKiller_NC", "BulletProof_Betty",
                "DeadEye_Delta", "OverkillOption", "LastManStanding_", "HardTarget_NC",
                "4thWar_Vet_Solo", "EdgerunnerInc_Op", "BricksCrew_NC"
            ],
            techies: [
                "Wrench_Monkey_NC", "SolderBurn_Tech", "GearHead_Gina", "CraftedKill_",
                "TinkerTailor_NC", "ModShop_Mike", "OverEngineered_", "JuryRig_Jenny",
                "Shroomer_Tech", "Rocklin_Reject", "Dynalar_Dropout"
            ]
        },

        // ── PLATFORM SOURCES ──
        platforms: {
            streetview: { name: "StreetView", icon: "fa-camera-retro", color: "#e040fb", description: "Night City's #1 social feed" },
            n54news: { name: "N54 News", icon: "fa-broadcast-tower", color: "#dc3545", description: "Network 54 breaking news ticker" },
            screamsheet: { name: "Screamsheet", icon: "fa-newspaper", color: "#ffc107", description: "Gossip and tabloid" },
            datakrash: { name: "DataKrash", icon: "fa-skull-crossbones", color: "#28a745", description: "Underground data forum (post-Krash NET)" },
            fixernet: { name: "FixerNet", icon: "fa-handshake", color: "#ff6b00", description: "Private fixer network" },
            ncpd_scanner: { name: "NCPD Scanner", icon: "fa-shield-alt", color: "#00d9ff", description: "Law enforcement chatter" }
        },

        // ── TIER-BASED COMMENTS ──
        tier_comments: {
            tier7: [
                { text: "Elite-level drip. Even the Exec Zone crowd is taking notes.", platform: "streetview", usernamePool: "gonks" },
                { text: "This fit just crashed three fashion blogs simultaneously.", platform: "screamsheet", usernamePool: "media" },
                { text: "Night City royalty just walked in. Clear a path.", platform: "streetview", usernamePool: "fixers" },
                { text: "Not even the Iron Sights would mess with you looking like that.", platform: "streetview", usernamePool: "gangers" },
                { text: "THREAD: Is this the most expensive outfit ever seen in NC? [247 replies]", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Confirmed sighting of an S+ look in the wild. This is not a drill.", platform: "n54news", usernamePool: "media" },
                { text: "Ready to walk into Club Atlantis and own every room.", platform: "fixernet", usernamePool: "fixers" },
                { text: "I'd sell my chrome to afford half that outfit.", platform: "streetview", usernamePool: "gonks" }
            ],
            tier6: [
                { text: "Absolute legend status. This fit is everything.", platform: "streetview", usernamePool: "gonks" },
                { text: "This look could lead its own poser gang.", platform: "screamsheet", usernamePool: "media" },
                { text: "Worth every eddie. Dripping with cred.", platform: "streetview", usernamePool: "fixers" },
                { text: "Shining like a platinum credchip out here.", platform: "streetview", usernamePool: "gonks" },
                { text: "Street Legend material. The fixers are watching.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Just bookmarked this entire outfit. Need all of it.", platform: "streetview", usernamePool: "gonks" }
            ],
            tier5: [
                { text: "Corporate polish with a dangerous edge. Merrill Asukaga's lobby wouldn't blink.", platform: "streetview", usernamePool: "corpos" },
                { text: "Slick and shiny — just what the boardroom types in The Glen like.", platform: "streetview", usernamePool: "corpos" },
                { text: "Clean cut with a hint of rebel. Perfect combo.", platform: "screamsheet", usernamePool: "media" },
                { text: "Expensive taste and they're not hiding it.", platform: "streetview", usernamePool: "gonks" },
                { text: "This is what 'making it' looks like in the Time of the Red.", platform: "streetview", usernamePool: "fixers" }
            ],
            tier4: [
                { text: "Solid fit. You've got good taste, choom.", platform: "streetview", usernamePool: "gonks" },
                { text: "On the way to fashion icon status. Keep climbing.", platform: "streetview", usernamePool: "gonks" },
                { text: "Respectable drip. Not turning heads but not getting laughed at.", platform: "screamsheet", usernamePool: "media" },
                { text: "Looking like you belong in The Glen. Almost.", platform: "streetview", usernamePool: "corpos" }
            ],
            tier3: [
                { text: "Mid-tier fit. Room for improvement, choom.", platform: "streetview", usernamePool: "gonks" },
                { text: "It's alright, but 'alright' doesn't stop bullets.", platform: "streetview", usernamePool: "solos" },
                { text: "Pretty forgettable honestly. Seen ten of these today.", platform: "streetview", usernamePool: "gonks" },
                { text: "Average joe energy. Not great, not terrible.", platform: "screamsheet", usernamePool: "media" }
            ],
            tier2: [
                { text: "Not great, choomba. Looking rough out there.", platform: "streetview", usernamePool: "gonks" },
                { text: "Giving major 'I don't care' vibes and not in the cool way.", platform: "streetview", usernamePool: "gonks" },
                { text: "You'd barely blend into the Hot Zone wearing that.", platform: "streetview", usernamePool: "gangers" },
                { text: "Time to hit the shops. Seriously.", platform: "screamsheet", usernamePool: "media" }
            ],
            tier1: [
                { text: "Fashion emergency in progress. Someone call Trauma Team.", platform: "streetview", usernamePool: "gonks" },
                { text: "Did you get dressed in a dumpster? During a blackout?", platform: "streetview", usernamePool: "gonks" },
                { text: "TOTAL SYSTEM FAILURE. Reboot your wardrobe immediately.", platform: "streetview", usernamePool: "techies" },
                { text: "I've seen better drip on a scav corpse in the Hot Zone.", platform: "datakrash", usernamePool: "gangers" }
            ]
        },

        // ── ARCHETYPE-SPECIFIC COMMENTS ──
        archetype_comments: {
            // ══════════════════════════════════════
            // CORPO (base fallback)
            // ══════════════════════════════════════
            corpo: [
                { text: "Corporate energy detected. Watch your credchips, people.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "That corpo polish is unmistakable. Place your bets on which megacorp.", platform: "screamsheet", usernamePool: "media" },
                { text: "Bet they've never been past The Glen.", platform: "streetview", usernamePool: "gonks" },
                { text: "TARGET PROFILE: Corporate operative. Standard business attire. Low immediate threat.", platform: "ncpd_scanner", usernamePool: "corpos" }
            ],

            // ── Corpo Suit: boardroom operators, management class ──
            corpo_suit: [
                { text: "Another corpo suit slumming it with the rest of us. NCCS or Continental Brands?", platform: "streetview", usernamePool: "gangers" },
                { text: "Corner office energy. That blazer costs more than your monthly rent.", platform: "streetview", usernamePool: "gonks" },
                { text: "Suit screams middle management. Probably has a Lazarus escort idling around the corner.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Corporate management profile. Clean, pressed, and completely out of their depth down here.", platform: "streetview", usernamePool: "solos" },
                { text: "Boardroom dress code in a combat zone. Bold or stupid — Night City doesn't distinguish.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // ── Corpo Security: militarized corporate guards ──
            corpo_security: [
                { text: "Corp sec sweep. Militech? Petrochem? Either way, keep your hands visible.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "That's Arasaka-grade formation discipline. Two flanking, one overwatch. Textbook.", platform: "fixernet", usernamePool: "solos" },
                { text: "Corporate tactical gear. These aren't rent-a-cops — that's real military hardware under the logo.", platform: "streetview", usernamePool: "gangers" },
                { text: "⚠️ CORPORATE SECURITY DETAIL. Armed and authorized. Do not engage.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Walking perimeter sweep. Somebody important is nearby and they're the reason you won't get close.", platform: "screamsheet", usernamePool: "media" }
            ],

            // ── Corpo Agent: covert operatives, intelligence ──
            corpo_agent: [
                { text: "Something off about that one. Too clean, too calm, too aware of the exits.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Night Corp spook vibes. The suit is expensive but designed to be forgettable.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "I've seen that look before. The ones who smile at you while their team clones your agent.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Corporate intelligence operative. If you've noticed them, they wanted you to.", platform: "streetview", usernamePool: "solos" },
                { text: "Arasaka ghost? SovOil asset? Doesn't matter — you don't exist to them and they barely exist at all.", platform: "datakrash", usernamePool: "netrunners" }
            ],


            // ══════════════════════════════════════
            // EXEC (base fallback)
            // ══════════════════════════════════════
            exec: [
                { text: "Money just walked in the door. SERIOUS money.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Platinum-tier threads. The kind that survived the 4th War richer than they started.", platform: "screamsheet", usernamePool: "media" },
                { text: "Even their watch costs more than your cyberware.", platform: "streetview", usernamePool: "gonks" }
            ],

            // ── Exec Socialite: fashion-forward high society ──
            exec_socialite: [
                { text: "That's not an outfit, that's a Net-54 appearance fee walking around in public.", platform: "screamsheet", usernamePool: "media" },
                { text: "Socialite money. Every piece is this season's runway and they want you to know it.", platform: "streetview", usernamePool: "gonks" },
                { text: "Invitation-only aesthetic. The kind of person who gets waved past every velvet rope in the city.", platform: "fixernet", usernamePool: "fixers" },
                { text: "The fashionware alone costs more than a Combat Zone apartment building.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // ── Exec Power: boardroom authority, corporate elite ──
            exec_power: [
                { text: "Power broker. That suit didn't come off a rack — it came with a corner office and a kill team on retainer.", platform: "fixernet", usernamePool: "fixers" },
                { text: "C-suite energy. One call from that person shuts down city blocks.", platform: "streetview", usernamePool: "gonks" },
                { text: "The boardroom is their battlefield. Minimal chrome, maximum control. Everything about them says authority.", platform: "screamsheet", usernamePool: "media" },
                { text: "Executive-class threat assessment: low physical, extreme political. Handle with extreme caution.", platform: "ncpd_scanner", usernamePool: "corpos" }
            ],


            // ══════════════════════════════════════
            // GANG (base fallback)
            // ══════════════════════════════════════
            gang: [
                { text: "Colors loud and proud. Respect or fear — they don't care which.", platform: "streetview", usernamePool: "gangers" },
                { text: "Gang-affiliated for sure. Check the colors before you approach.", platform: "fixernet", usernamePool: "fixers" },
                { text: "⚠️ GANG INSIGNIA DETECTED. Advise caution in approach.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Territory is everything when you dress like that.", platform: "datakrash", usernamePool: "gangers" }
            ],

            // ── Gang Booster: chrome-heavy combat gangers ──
            gang_booster: [
                { text: "Full chrome ganger. Maelstrom? Iron Sights? Either way, cross the street.", platform: "streetview", usernamePool: "gonks" },
                { text: "Boostergang profile. Maximum chrome, minimum impulse control. The 'strom would love this one.", platform: "fixernet", usernamePool: "solos" },
                { text: "⚠️ BOOSTERGANG MEMBER — heavy cyberware, likely armed. Maintain distance.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Walking chrome showcase. Every implant is a statement: I'm harder than you and I'll prove it.", platform: "streetview", usernamePool: "gangers" },
                { text: "That much visible metal means they WANT the fight. Don't give it to them unless you're sure.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // ── Gang Poser: identity-focused, biosculpt heavy ──
            gang_poser: [
                { text: "Poser gang commitment right there. The biosculpting alone would take months.", platform: "streetview", usernamePool: "gonks" },
                { text: "Full aesthetic transformation. That's not a costume — they've become the character permanently.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Identity gang member. The look IS the ideology. Don't mock it to their face unless you want problems.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Fashionware pushed past the manufacturer's warranty. That's dedication or delusion, depending who you ask.", platform: "streetview", usernamePool: "gonks" },
                { text: "Poser culture is wild. They'll die for the aesthetic. Some of them literally have.", platform: "screamsheet", usernamePool: "media" }
            ],

            // ── Gang Organized: yakuza, triads, structured crime ──
            gang_organized: [
                { text: "That's not street muscle — that's organized muscle. The suit fits too well, the chrome is too discreet.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Syndicate dress code. Asia Pop influence with a razor underneath every layer.", platform: "streetview", usernamePool: "solos" },
                { text: "Tyger Claws? Weng Fang Tong? The organized crews all have that same controlled menace.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Old money crime. They don't brawl in the street — they own the street and charge you rent.", platform: "screamsheet", usernamePool: "media" },
                { text: "ORGANIZED CRIME PROFILE. Professional appearance, concealed weapons likely. Intelligence value: high.", platform: "ncpd_scanner", usernamePool: "corpos" }
            ],

            // ── Gang Cult: ideology-driven, zealots ──
            gang_cult: [
                { text: "True believer energy. Whatever they're selling, they'd die for it. That makes them dangerous.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Cult gang. The eyes give it away — conviction like that doesn't come from the street, it comes from faith.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ IDEOLOGICAL EXTREMIST PROFILE. Unpredictable behavior. Do not attempt standard de-escalation.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Reckoners? Doomsday preachers? Doesn't matter which flavor — zealots all taste the same.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Cult conviction and street survival instincts. The most dangerous kind of unpredictable.", platform: "screamsheet", usernamePool: "media" }
            ],

            // —— Gang Cult Purity: anti-chrome zealots, flesh purists ——
            gang_cult_purity: [
                { text: "Zero chrome. Deliberately zero chrome. In Night City that's not poverty — that's ideology.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Inquisitor vibes. Check for the scars where they ripped out their own implants. They wear them like medals.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ ANTI-AUGMENTATION EXTREMIST. Known to forcibly remove cyberware from targets. Avoid if chromed.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Flesh purist. The stripped-down look isn't minimalism — it's fanaticism. They think YOUR chrome is a sin.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Purity cult member. Austere clothes, clean skin, and the kind of calm that precedes extreme violence.", platform: "screamsheet", usernamePool: "media" }
            ],

            // —— Gang Cult Chrome: chrome worshippers, transcendence seekers ——
            gang_cult_chrome: [
                { text: "Chrome cultist. They didn't install all that metal for function — they installed it for FAITH.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Enhanced affiliate? That much visible chrome with that look in their eyes — they think cyberpsychosis is a gift.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ PRO-AUGMENTATION EXTREMIST. Likely operating near cyberpsychosis threshold. Unstable and heavily armed.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Walking chrome shrine. Every implant is a prayer to whatever machine-god they're worshipping this week.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "They WANT to go cyberpsycho. That's not a warning sign, that's the whole point. Stay far away.", platform: "screamsheet", usernamePool: "media" }
            ],
            // — Gang Militia: territorial defense, patriot gangs —
            gang_militia: [
                { text: "6th Street energy. Flag patches, unit discipline, and a loaded rifle they call 'community defense.'", platform: "streetview", usernamePool: "gangers" },
                { text: "Militia gang. They march in formation, hold intersections like checkpoints, and salute a flag nobody else recognizes.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Steel Patriots? 6th Street? The patriot gangs all have that same military surplus aesthetic and that same look in their eyes.", platform: "screamsheet", usernamePool: "media" },
                { text: "⚠️ PARAMILITARY GANG UNIT. Armed, organized, territorial. Standard gang protocols apply.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Neighborhood soldier. The line between 'protecting the block' and 'occupying it' is thinner than their dog tags.", platform: "datakrash", usernamePool: "netrunners" }
            ],
            // –– Gang Boss: high-ranking organized crime leadership ––
            gang_boss: [
                { text: "That's not a ganger. That's the person gangers answer to. Look at the tailoring on those colors.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Crime lord money. Gang ink under a suit that costs more than your car. Nobody wears both unless they own the block.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ HIGH-VALUE TARGET: Gang leadership, executive-tier resources. Exercise extreme caution.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "The outfit says boardroom but the eyes say body count. That's top-of-food-chain energy right there.", platform: "screamsheet", usernamePool: "media" },
                { text: "Silk and gang colors. In Night City that combination means you stopped climbing because there's nobody left above you.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // ══════════════════════════════════════
            // NOMAD (base fallback)
            // ══════════════════════════════════════
            nomad: [
                { text: "Dust-worn road warrior energy. You can smell the open road on those leathers.", platform: "streetview", usernamePool: "gonks" },
                { text: "Nomad in the city. Either running a supply line or running from something.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Family over chrome — classic nomad philosophy.", platform: "streetview", usernamePool: "gonks" },
                { text: "Those road leathers have seen the Badlands and survived.", platform: "streetview", usernamePool: "solos" }
            ],

            // ── Nomad Clan: family nations, road tribes ──
            nomad_clan: [
                { text: "Clan tattoos visible. Aldecaldos? Thelas? Either way, they've got family backing them up.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Real nomad, real clan. The patches tell a story if you know how to read them.", platform: "streetview", usernamePool: "gonks" },
                { text: "Road-bred and family-loyal. Mess with one and the entire nation shows up at your door.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Bioware over chrome — nomad clans trust the organic upgrades. Harder to detect, harder to hack.", platform: "streetview", usernamePool: "solos" }
            ],

            // ── Nomad Raider: hostile road gangs, Raffen ──
            nomad_raider: [
                { text: "Raffen. Raffen Shiv. Don't talk to them, don't look at them, don't be here.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ HOSTILE NOMAD PROFILE. Raffen-affiliated. Armed, aggressive, no negotiation recommended.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Road pirate aesthetic. Everything they're wearing was taken from someone who isn't alive anymore.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Raffen don't come into the city to sightsee. Whatever they want, it's not going to end peacefully.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "That's Toecutter patchwork. Even other Raffen won't ride with those psychos.", platform: "fixernet", usernamePool: "solos" }
            ],

            // ── Nomad Trader: city-nomad bridge, commerce ──
            nomad_trader: [
                { text: "Nomad trader. Clean enough for the city, road-worn enough to be real. They move goods both ways.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Supply line runner. Half the food in Night City came through someone dressed exactly like that.", platform: "streetview", usernamePool: "gonks" },
                { text: "Trade nomad — the DeadWoods and Thelas run half the commerce corridors. This one looks connected.", platform: "screamsheet", usernamePool: "media" },
                { text: "Business-adjacent leathers. They negotiate in boardrooms and load cargo in the Badlands, same day.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // –– Nomad Corpo: corporate fleet drivers, pipeline escorts ––
            nomad_corpo: [
                { text: "Nomad leather with corpo patches. Somebody sold their clan colors for a steady paycheck.", platform: "streetview", usernamePool: "gangers" },
                { text: "Petrochem fleet? Militech convoy? Either way, nomad skills on a corporate leash.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Road warrior gone corporate. The leather's real but the loyalty's rented.", platform: "screamsheet", usernamePool: "media" },
                { text: "CORPORATE LOGISTICS OPERATIVE: Nomad-trained. High vehicle threat. Low pedestrian risk.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "The clan calls them sellouts. The corp calls them expendable. They call it Tuesday.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // ══════════════════════════════════════
            // TECHIE (base fallback)
            // ══════════════════════════════════════
            techie: [
                { text: "Techie vibes. Probably running custom daemons on the local architecture right now.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Function over form. The clothes are just a wrapper for the real capability.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Don't let the plain clothes fool you. That's a digital predator.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // ── Techie Netrunner: local NET specialists ──
            techie_netrunner: [
                { text: "Netrunner. The interface plugs are visible if you know where to look. Local NET architect for sure.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Post-DataKrash runner. The old NET died but these people built something new in the wreckage.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Hidden chrome, quiet clothes, lethal in the NET. The most dangerous person here and nobody knows it.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Mudang Gumi? Freelancer? Either way, your data isn't safe while they're in range.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // ── Techie Maker: workshop engineers, builders ──
            techie_maker: [
                { text: "Workshop hands. Grease stains, burn marks, and a toolkit worth more than most people's chrome.", platform: "streetview", usernamePool: "gonks" },
                { text: "Maker energy. These are the people who keep Night City running — literally. Every machine, every fix.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "That's a builder, not a fighter. But they built the weapons the fighters carry, so show some respect.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Smells like solder and CHOOH2. Dirty Hippie chemist or legit machinist — hard to tell from here.", platform: "streetview", usernamePool: "gonks" }
            ],

            // ── Techie Corpo: corporate R&D, lab techs ──
            techie_corpo: [
                { text: "Corp lab coat meets street sensibility. Zhirafa? Biotechnica R&D? Someone's moonlighting.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Corporate technical staff. Smart enough to be valuable, not important enough for a bodyguard.", platform: "fixernet", usernamePool: "fixers" },
                { text: "R&D division aesthetic. Business-casual with tool calluses. The people who actually build what the corps sell.", platform: "screamsheet", usernamePool: "media" },
                { text: "Zhirafa engineer, maybe. That brand of practical-meets-professional is their house style.", platform: "streetview", usernamePool: "gonks" }
            ],

            // –– Techie Scrapper: junkyard engineers, salvage builders ––
            techie_scrapper: [
                { text: "That jacket has more solder burns than stitches. Maker for sure — the kind who builds guns from garbage.", platform: "streetview", usernamePool: "gonks" },
                { text: "Combat Zone tinker. Everything they're wearing is held together with wire and spite. Don't touch anything.", platform: "fixernet", usernamePool: "solos" },
                { text: "Junkyard chic. If it looks like scrap, it probably was — last week. Now it's a weapon.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Salvage tech vibes. These are the people who make Maelstrom's shopping list look expensive by comparison.", platform: "screamsheet", usernamePool: "media" },
                { text: "I respect the hustle. That rig on their arm is hand-built and probably outperforms mil-spec. Probably.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // –– Techie Hacker: black hat netrunners, data thieves ––
            techie_hacker: [
                { text: "Interface plugs at the temple and a deck worth more than the rest of the outfit combined. Runner.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Black hat energy. That person has already compromised three networks since they sat down.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Data cables braided into the jacket. That's not fashion — that's infrastructure.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ POSSIBLE INTRUSION SPECIALIST. Monitor local network activity. Do not engage digitally.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Japantown hacker aesthetic. Flashy enough to get noticed, skilled enough that it doesn't matter.", platform: "screamsheet", usernamePool: "media" }
            ],

            // –– Techie Corponet: corporate ICE architects, cyberwarfare ––
            techie_corponet: [
                { text: "Corp-casual with mil-grade interface hardware. That's cyberwarfare division — the people who build the walls.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Arasaka ICE architect? Militech counterintel? The suit says corporate, the neural ports say dangerous.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Same skills as a street runner, ten times the budget. Corporate netrunners don't hack from basements — they hack from corner offices.", platform: "screamsheet", usernamePool: "media" },
                { text: "CORPORATE CYBER-OPERATIONS SPECIALIST. High digital threat. Minimal physical profile.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "The neural port jewelry alone costs more than a street runner's entire deck setup. Money changes the game.", platform: "streetview", usernamePool: "gonks" }
            ],

            // ══════════════════════════════════════
            // MEDIA (base fallback)
            // ══════════════════════════════════════
            media: [
                { text: "Media personality spotted! Quick, check if they're recording.", platform: "screamsheet", usernamePool: "media" },
                { text: "Every outfit is a broadcast when you're media. And this one's prime time.", platform: "streetview", usernamePool: "media" },
                { text: "Camera-ready 24/7. The brand never sleeps.", platform: "streetview", usernamePool: "gonks" }
            ],

            // ── Media Anchor: network talent, on-camera faces ──
            media_anchor: [
                { text: "That's an N54 face. The hair alone has its own lighting budget.", platform: "screamsheet", usernamePool: "media" },
                { text: "Network anchor glamour. Fashionware tuned to camera frequencies. Everything about them is manufactured to be watched.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "If they're down here, there's a story. And if there's a story, there's a camera crew thirty seconds behind them.", platform: "fixernet", usernamePool: "fixers" },
                { text: "That level of polish doesn't happen by accident. Professional media — network tier, not streamer tier.", platform: "streetview", usernamePool: "gonks" }
            ],

            // ── Media Gonzo: street reporters, field journalists ──
            media_gonzo: [
                { text: "Gonzo journalist. Hidden recorder, worn boots, and a nose for trouble. They're here for a story.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Street media. Not the pretty N54 kind — the kind that gets shot at and keeps filming.", platform: "screamsheet", usernamePool: "media" },
                { text: "Combat journalist energy. That jacket has press credentials sewn inside and a trauma plate behind them.", platform: "streetview", usernamePool: "solos" },
                { text: "Gonzo reporter. Everything they see becomes content. Watch what you say within earshot.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // ── Media Pirate: underground broadcasters ──
            media_pirate: [
                { text: "Pirate broadcast gear under that coat. Guaranteed. The antenna array is barely hidden.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Underground media. They're running a signal that N54 would kill to shut down — and has tried.", platform: "screamsheet", usernamePool: "media" },
                { text: "Radio Free Night City energy. Bohemian clothes, military-grade transmitter. The revolution will be broadcast.", platform: "streetview", usernamePool: "gonks" },
                { text: "Technical broadcaster. More engineer than journalist — they build the signal that carries the truth.", platform: "datakrash", usernamePool: "netrunners" }
            ],


            // ══════════════════════════════════════
            // SOLO (base fallback)
            // ══════════════════════════════════════
            solo: [
                { text: "Solo energy radiating off this one. Don't make eye contact.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ HIGH THREAT INDIVIDUAL. Solo operative profile. Exercise extreme caution.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "That's not fashion, that's a warning sign with legs.", platform: "streetview", usernamePool: "gonks" }
            ],

            // ── Solo Merc: professional edgerunners ──
            solo_merc: [
                { text: "Professional muscle. The chrome is functional, the weapons are maintained, and the eyes never stop scanning.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Edgerunner-for-hire. Everything about that loadout says 'I do this for a living and I'm good at it.'", platform: "streetview", usernamePool: "solos" },
                { text: "Merc on the prowl. Visible chrome, visible weapons, visible don't-mess-with-me energy.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ SOLO OPERATIVE — armed, augmented, experienced. Threat level: significant.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "That's an Afterlife regular if I've ever seen one. The gear, the posture, the thousand-yard stare.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // ── Solo Bodyguard: executive protection ──
            solo_bodyguard: [
                { text: "Executive protection detail. Expensive suit cut to hide the iron underneath. Don't test them.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Bodyguard profile. Business dress with room for a shoulder holster. Eyes on every entrance and exit.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Lazarus? Whitewater? Doesn't matter — bodyguard chrome is always hidden until the moment it isn't.", platform: "streetview", usernamePool: "solos" },
                { text: "That's a human shield in a nice suit. Whoever they're protecting is close and probably worth a fortune.", platform: "screamsheet", usernamePool: "media" }
            ],

            // ── Solo Veteran: 4th War survivors ──
            solo_veteran: [
                { text: "4th Corporate War vintage. That gear has been through worse than anything Night City can throw.", platform: "streetview", usernamePool: "solos" },
                { text: "War veteran. The thousand-yard stare, the old-model chrome, the military surplus that fits like a second skin.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Willows? 6th Street? Faded? War vets all carry themselves the same — ready for a fight that already ended.", platform: "streetview", usernamePool: "gonks" },
                { text: "Old soldier energy. They've seen the worst humanity can do and they're still standing. Respect that.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Surplus gear and a look that says 'I survived Arasaka Tower.' Don't thank them for their service. Just stay clear.", platform: "screamsheet", usernamePool: "media" }
            ],

            // — Solo Assassin: high-end contract killers —
            solo_assassin: [
                { text: "That one's too clean and too calm. The expensive kind of dangerous.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Assassin profile. Businesswear tailored to hide a weapon, chrome hidden where it counts. They blend in until they don't.", platform: "streetview", usernamePool: "solos" },
                { text: "High-end contractor. The kind of person who walks into a party and someone doesn't walk out.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "That's not a corpo. The suit fits too well and the eyes track exits, not spreadsheets.", platform: "screamsheet", usernamePool: "media" },
                { text: "Elegant violence. They dress like money and move like a weapon. Arasaka sends these when subtlety matters.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // –– Solo Corpo: corporate wet-work, spec-ops ––
            solo_corpo: [
                { text: "Corpo killer. The suit's tailored to hide the holster and the chrome's all internal. Professional.", platform: "fixernet", usernamePool: "fixers" },
                { text: "That's who corpo_agent calls when the meeting goes wrong. Expensive, quiet, and already mapping exits.", platform: "fixernet", usernamePool: "solos" },
                { text: "⚠️ CORPORATE SPECIAL OPERATIONS. Armed, augmented, authorized. Extreme threat level.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Tailored suit, dead eyes, perfect posture. That person has a body count and a retirement plan. Terrifying combination.", platform: "screamsheet", usernamePool: "media" },
                { text: "The most dangerous people in Night City look like they're heading to a business lunch. This is one of them.", platform: "streetview", usernamePool: "gonks" }
            ],

            // ══════════════════════════════════════
            // FIXER (base fallback)
            // ══════════════════════════════════════
            fixer: [
                { text: "Fixer in the house. Deals are about to be made.", platform: "fixernet", usernamePool: "fixers" },
                { text: "That's the kind of person who knows everyone and owes no one.", platform: "streetview", usernamePool: "gonks" },
                { text: "Dressed to negotiate. Or to vanish. Depends on the meeting.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // ── Fixer Broker: Afterlife-tier deal makers ──
            fixer_broker: [
                { text: "Afterlife-tier fixer. That outfit alone closes deals — people see money and assume competence.", platform: "fixernet", usernamePool: "fixers" },
                { text: "High-end broker energy. They don't meet you on the street — you get summoned to their table.", platform: "screamsheet", usernamePool: "media" },
                { text: "Power fixer. The clothes say high fashion, the connections say don't waste their time.", platform: "streetview", usernamePool: "gonks" },
                { text: "That's a face that's been behind half the major gigs this quarter. You want work? Buy them a drink first.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // ── Fixer Street: neighborhood connectors ──
            fixer_street: [
                { text: "Neighborhood fixer. Not Afterlife glam — just someone who knows everyone on the block and can get things done.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Street connector. They don't move mountains, but they'll find you the right shovel and the person willing to dig.", platform: "streetview", usernamePool: "gonks" },
                { text: "Fixie's crew? Local operator? Either way, they're the reason packages arrive and problems disappear.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Low-key fixer energy. The generic clothes are deliberate — forgettable is profitable in their line of work.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // ── Fixer Syndicate: organized crime logistics ──
            fixer_syndicate: [
                { text: "Syndicate logistics. They dress like a fixer but they answer to a boss, and the boss answers to nobody.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Organized crime middleman. The suit has an Asia Pop cut and the pockets have someone else's money in them.", platform: "screamsheet", usernamePool: "media" },
                { text: "Skiv Family? Weng Fang Tong? El Norte? The fixers who work for syndicates all have that same careful polish.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Crime fixer. Every deal comes with strings attached to strings attached to someone who'll kill you over a percentage point.", platform: "streetview", usernamePool: "gonks" }
            ],
            // — Fixer Smuggler: hands-on logistics, physical transport —
            fixer_smuggler: [
                { text: "Smuggler. Nomad-adjacent, pockets deep enough to hide a data fortress, and they know every checkpoint gap from here to the Badlands.", platform: "fixernet", usernamePool: "fixers" },
                { text: "That's a runner, not a broker. They don't arrange the deal — they physically carry it through the door.", platform: "streetview", usernamePool: "gonks" },
                { text: "Courier-plus energy. Whatever they're carrying is worth more than the outfit, and the outfit's already not cheap.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Road-capable, street-smart, and dressed to blend in at both ends of the supply chain. Professional smuggler look.", platform: "screamsheet", usernamePool: "media" }
            ],

            // –– Fixer Corpo: internal corporate handlers, headhunters ––
            fixer_corpo: [
                { text: "Corporate handler. They don't make deals in bars — they make them in conference rooms with NDAs and armed escorts.", platform: "fixernet", usernamePool: "fixers" },
                { text: "That's the person who 'arranges things' inside the tower. HR meets espionage meets logistics.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Headhunter energy. They're not here to recruit you — they're here to recruit the person standing next to you.", platform: "screamsheet", usernamePool: "media" },
                { text: "CORPORATE ASSET MANAGEMENT. Non-combatant profile. High information threat.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "The smile says friendly, the briefcase says acquisition, the bodyguard outside says don't test it.", platform: "streetview", usernamePool: "gonks" }
            ],

            // ══════════════════════════════════════
            // ROCKERBOY (base fallback)
            // ══════════════════════════════════════
            rockerboy: [
                { text: "Rockerboy energy! Anti-establishment flash with a cause.", platform: "streetview", usernamePool: "gonks" },
                { text: "Silverhand died in '23, but the spirit lives on.", platform: "streetview", usernamePool: "gonks" },
                { text: "The look says 'burn it all down' in the most stylish way possible.", platform: "datakrash", usernamePool: "gonks" }
            ],

            // ── Rocker Rebel: firebrands, activist performers ──
            rocker_rebel: [
                { text: "Street Queen? Zoner? Undertow? The rebel aesthetic is all the same — righteous fury with a killer wardrobe.", platform: "screamsheet", usernamePool: "media" },
                { text: "Anti-corpo, anti-system, anti-everything-wrong-with-this-city. And dressed to make sure you know it.", platform: "streetview", usernamePool: "gonks" },
                { text: "Activist energy. Every patch, every pin, every torn seam is a political statement aimed at someone's throat.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Silverhand's ghost walks. That bohemian rebel look never dies because the reasons for it never go away.", platform: "streetview", usernamePool: "gonks" },
                { text: "Guardian gang vibes. They protect their community through visibility — you can't ignore someone dressed like that.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // ── Rocker Idol: manufactured stars, pop performers ──
            rocker_idol: [
                { text: "Pop culture royalty. The whole look is engineered for maximum attention and it's working.", platform: "screamsheet", usernamePool: "media" },
                { text: "Idol-class style. Half Night City wants to be them, the other half wants to date them.", platform: "streetview", usernamePool: "gonks" },
                { text: "Party gang chic. Piranhas? Albino Alligators? Eurotrashers? The party scene runs on these people.", platform: "fixernet", usernamePool: "fixers" },
                { text: "That outfit is a brand deal waiting to happen. Continental Brands is probably already on the line.", platform: "screamsheet", usernamePool: "media" },
                { text: "Manufactured charisma. Asia Pop meets high fashion meets calculated authenticity. Very Night City.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // ── Rocker Underground: basement shows, scene builders ──
            rocker_underground: [
                { text: "Underground scene energy. They don't play venues — they play squats, basements, and warehouse raves.", platform: "streetview", usernamePool: "gonks" },
                { text: "Dragula Racers? Local band? Either way, the visible chrome and urban flash screams 'I do this for the scene, not the money.'", platform: "screamsheet", usernamePool: "media" },
                { text: "Street-level performer. No N54 deal, no corpo sponsor — just raw talent and a crowd that shows up at midnight.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "The underground keeps Night City's culture alive. The corps just package it and sell it back to us.", platform: "streetview", usernamePool: "gangers" }
            ],

            // –– Rocker Activist: protest singers, political rockerboys ––
            rocker_activist: [
                { text: "Protest singer. Gang colors worn as solidarity, bohemian threads as a rejection of everything corpo. The message IS the outfit.", platform: "streetview", usernamePool: "gonks" },
                { text: "Johnny Silverhand's ideology without the nuclear option. Pirate radio anthems and rally speeches. Dangerous in a different way.", platform: "screamsheet", usernamePool: "media" },
                { text: "⚠️ POLITICAL AGITATOR: Charismatic profile. Monitor for rally organization and anti-corporate messaging.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "The revolution will not be sponsored. That outfit costs nothing and says everything.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "I've booked protest rockers before. They don't pay well but they pack venues. Half the crowd brings weapons.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // –– Rocker Corporate: sellout brand rockers, sponsored performers ––
            rocker_corporate: [
                { text: "Sellout rocker. Every piece of clothing has a sponsor logo and every song has a corpo message. But damn, the look is expensive.", platform: "streetview", usernamePool: "gonks" },
                { text: "Brand rocker money. The underground hates them but the mainstream can't stop watching. That's the deal.", platform: "screamsheet", usernamePool: "media" },
                { text: "Fashionware tuned to broadcast-ready, outfit worth more than a Combat Zone apartment. They sold out and look great doing it.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Corporate entertainment asset. Low physical threat, high influence profile. Significant social media footprint.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "I've fixed three of their concert tours. The rider alone costs more than most gigs pay. But the exposure is real.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // ══════════════════════════════════════
            // LAWMAN (base fallback)
            // ══════════════════════════════════════
            lawman: [
                { text: "Law enforcement vibes. Badge energy even without the badge.", platform: "streetview", usernamePool: "gonks" },
                { text: "That's a lawman look. Armed authority, whoever's paying the salary.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // ── Lawman Beat: NCPD patrol officers ──
            lawman_beat: [
                { text: "NCPD beat cop. Underpaid, overworked, and one bad day from joining the other side.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Standard patrol profile. Generic uniform, regulation sidearm, regulation attitude.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Night City's finest. The badge is real even if the justice isn't.", platform: "streetview", usernamePool: "gonks" },
                { text: "NCPD patrol. They'll respond to your call eventually. Maybe. If you're in the right district.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // ── Lawman Deputy: private security with authority ──
            lawman_deputy: [
                { text: "Deputized private security. Not quite NCPD, not quite corpo — somewhere in the uncomfortable middle.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Private law. The badge is real but the paycheck comes from a corp. Make of that what you will.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Contract security with arrest authority. The worst combination of corporate loyalty and legal power.", platform: "streetview", usernamePool: "gangers" },
                { text: "Whitewater? Lazarus? Someone's paying for law enforcement that actually shows up.", platform: "screamsheet", usernamePool: "media" }
            ],

            // ── Lawman Trauma: Trauma Team medics ──
            lawman_trauma: [
                { text: "Trauma Team. AV response, combat medicine, and a bill that'll flatline your credit. Platinum card holders only.", platform: "fixernet", usernamePool: "fixers" },
                { text: "⚠️ TRAUMA TEAM ACTIVE. Authorized use of lethal force in patient defense. Do NOT interfere.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Bioware-heavy, armored up, and they'll shoot you to save their client. The most expensive ambulance in the world.", platform: "streetview", usernamePool: "gonks" },
                { text: "TT responder. Best medics money can buy — emphasis on the money part.", platform: "datakrash", usernamePool: "netrunners" }
            ],


            // ══════════════════════════════════════
            // MEDTECH (base fallback)
            // ══════════════════════════════════════
            medtech: [
                { text: "Medtech look. Steady hands, clean clothes. Probably saved a life today.", platform: "streetview", usernamePool: "gonks" },
                { text: "Never piss off your ripperdoc. They know where all your implants are.", platform: "streetview", usernamePool: "gonks" }
            ],

            // ── Medtech Ripper: back-alley surgeons ──
            medtech_ripper: [
                { text: "Street ripper. The hands are steady, the clothes are bloody, and the operating table is a kitchen counter.", platform: "streetview", usernamePool: "gonks" },
                { text: "Back-alley surgeon vibes. No license, no insurance, no questions asked. Half the chrome in Night City went through hands like those.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Ripperdoc aesthetic. Bag lady practical with a medkit worth more than the entire outfit.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Don't judge the scrubs. That ripperdoc has installed more chrome than any licensed clinic — and charges less.", platform: "streetview", usernamePool: "gangers" }
            ],

            // ── Medtech Clinic: licensed practitioners ──
            medtech_clinic: [
                { text: "Licensed medtech. Clean scrubs, proper credentials, and prices that reflect both.", platform: "streetview", usernamePool: "gonks" },
                { text: "Clinic professional. Business-adjacent dress code, medical precision, and a waiting list a mile long.", platform: "screamsheet", usernamePool: "media" },
                { text: "Legitimate practitioner — the kind corps send their mid-level employees to. Good work, documented work.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Proper medical professional in Night City. An endangered species that charges accordingly.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // ── Medtech Combat: battlefield medics ──
            medtech_combat: [
                { text: "Combat medic. The armor is for stopping bullets, the kit is for stopping bleeding. Both get used daily.", platform: "streetview", usernamePool: "solos" },
                { text: "Field medicine professional. Nomad leathers, urban gear, and a trauma kit that's been opened too many times today.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Battlefield medtech. They'll patch you up under fire and bill you later — if you both survive.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "That's a medic who's seen more gunshot wounds than most solos have inflicted. Respect the kit.", platform: "streetview", usernamePool: "gangers" }
            ],
            // — Medtech Trauma: Trauma Team operatives —
            medtech_trauma: [
                { text: "Trauma Team operative. They'll save your life, bill your estate, and shoot anyone who gets in the way — in that order.", platform: "fixernet", usernamePool: "fixers" },
                { text: "⚠️ TRAUMA TEAM OPERATIVE. Platinum-tier response unit. Authorized lethal force in client defense.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "TT medic off-duty. The tactical posture never really goes away — neither does the bioware.", platform: "streetview", usernamePool: "gonks" },
                { text: "Militarized medicine. The most expensive ambulance ride in the world, and they're dressed for both halves of the job.", platform: "screamsheet", usernamePool: "media" },
                { text: "Combat triage specialist. They've kept people alive under AV fire and they dress like it's always a possibility.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // ══════════════════════════════════════
            // STREETRAT (base fallback)
            // ══════════════════════════════════════
            streetrat: [
                { text: "Bottom of the food chain but still standing. The War made millions of these.", platform: "streetview", usernamePool: "gonks" },
                { text: "Surviving on scraps and grit. Night City's true test since the bombs dropped.", platform: "datakrash", usernamePool: "gonks" },
                { text: "Street rat chic. Making it work with nothing in the Time of the Red.", platform: "screamsheet", usernamePool: "media" }
            ],

            // ── Streetrat Scavver: chrome strippers, salvagers ──
            streetrat_scavver: [
                { text: "Scavver. Check your chrome — they're already calculating what your implants are worth on the black market.", platform: "streetview", usernamePool: "gonks" },
                { text: "Salvage rat. Everything they're wearing came off someone or something else. Recycled survival.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "⚠️ SCAVENGER PROFILE. Known associates of chrome theft rings. Maintain awareness of personal cyberware.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "The lowest rung of Night City's food chain, and they'll strip you for parts to stay on it.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // ── Streetrat Squatter: combat zone territorial ──
            streetrat_squatter: [
                { text: "Combat Zone squatter. Territorial, resourceful, and not interested in sharing their block.", platform: "streetview", usernamePool: "gonks" },
                { text: "Urban survivor. They've turned rubble into a neighborhood and they'll defend it with whatever they've got.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Squatter crew. Gang-adjacent but independent — they answer to the block, not the colors.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Combat Zone native. They know every collapsed tunnel, every roof access, every way in and out. Home advantage is real.", platform: "streetview", usernamePool: "solos" }
            ],

            // ── Streetrat Urchin: youth crews, invisible survivors ──
            streetrat_urchin: [
                { text: "Street kid. Generation Red — born after the bombs, raised by the rubble.", platform: "streetview", usernamePool: "gonks" },
                { text: "Yogang runner. Too young for chrome, too fast to catch, and invisible to anyone who isn't looking down.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Night City made these kids and Night City ignores them. Which is exactly why they survive.", platform: "screamsheet", usernamePool: "media" },
                { text: "Don't underestimate the small ones. They see everything, remember everything, and they talk to fixers.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // –– Streetrat Hustler: knockoff flash, fake-it-til-you-make-it ––
            streetrat_hustler: [
                { text: "Knockoff mirrorshades and a thrift-store neon jacket. The ambition is real, the budget isn't.", platform: "streetview", usernamePool: "gonks" },
                { text: "Street hustler. One piece of real chrome and the rest is stolen flash. Every Combat Zone has a hundred of these.", platform: "fixernet", usernamePool: "fixers" },
                { text: "That outfit is trying SO hard. Like watching someone speed-run a reputation they haven't earned yet.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Wannabe energy. The gap between the jacket and the shoes tells you everything about their bank account.", platform: "screamsheet", usernamePool: "media" },
                { text: "I respect the hustle even if the fashion is a crime. They're faking it until they make it — or until someone calls the bluff.", platform: "streetview", usernamePool: "gangers" }
            ],

            // ═══════════════════════════════════════
            // CIVILIAN (base fallback)
            // ═══════════════════════════════════════
            civilian: [
                { text: "Just a regular person trying to get through the day. Night City's silent majority.", platform: "streetview", usernamePool: "gonks" },
                { text: "Civilian energy. No faction, no crew, no agenda — just survival.", platform: "streetview", usernamePool: "gonks" },
                { text: "Not everything in Night City has a hidden motive. Sometimes a commuter is just a commuter.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // — Civilian Worker: blue-collar, labor —
            civilian_worker: [
                { text: "Working stiff. Calloused hands, generic clothes, and a shift that started before dawn.", platform: "streetview", usernamePool: "gonks" },
                { text: "Blue-collar Night City. Someone has to rebuild what the edgerunners keep blowing up.", platform: "screamsheet", usernamePool: "media" },
                { text: "Dock worker? Construction crew? Either way, they built the city you're standing in.", platform: "streetview", usernamePool: "gonks" },
                { text: "Manual labor energy. The outfit's functional and they don't care what you think about it.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // — Civilian Resident: everyday Night Citizens —
            civilian_resident: [
                { text: "Megabuilding resident. Generic chic, morning commute, trying to afford rent in a city that's actively trying to kill them.", platform: "streetview", usernamePool: "gonks" },
                { text: "Everyday Night City. No colors, no chrome statement, no agenda. Just another face in the megabuilding elevator.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Civilian. The ones who make the city function between the firefights and corpo wars.", platform: "screamsheet", usernamePool: "media" },
                { text: "Standard resident profile. Low threat, low visibility, high probability of just wanting to be left alone.", platform: "ncpd_scanner", usernamePool: "corpos" }
            ],

            // — Civilian Student: NCU, trade schools —
            civilian_student: [
                { text: "NCU student energy. Asia Pop trends, secondhand textbooks, and a dream that might survive graduation.", platform: "streetview", usernamePool: "gonks" },
                { text: "Campus fashion in the streets. The Asia Pop influence is pure Night City youth culture.", platform: "screamsheet", usernamePool: "media" },
                { text: "Student. They're trying to learn their way out of the combat zones. Respect the hustle.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Young, bright-eyed, and wearing whatever's trending on campus this semester. Night City hasn't broken them yet.", platform: "streetview", usernamePool: "gonks" }
            ],

            // — Civilian Vendor: street food, Night Market operators —
            civilian_vendor: [
                { text: "Night Market vendor. The food's better than the fashion and that's exactly the right priority.", platform: "streetview", usernamePool: "gonks" },
                { text: "Street vendor. Practical clothes, cultural flair, and whatever the neighborhood expects. The noodles are probably excellent.", platform: "screamsheet", usernamePool: "media" },
                { text: "Small business energy. They pay protection to whoever runs the block and make it back on volume.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Food stall operator. The real backbone of Night City — edgerunners eat too.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // — Civilian Office: corporate drones, support staff —
            civilian_office: [
                { text: "Office drone. Businesswear because the dress code demands it, not because they have any actual power.", platform: "streetview", usernamePool: "gonks" },
                { text: "Corpo cog. They file the reports, answer the phones, and pray their health plan covers chrome maintenance.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Support staff aesthetic. Close enough to corpo to dress the part, too far down the ladder to matter.", platform: "screamsheet", usernamePool: "media" },
                { text: "Standard office worker. The machine needs gears and these are the ones that show up on time.", platform: "fixernet", usernamePool: "fixers" }
            ],


            // ═══════════════════════════════════════
            // ENTERTAINER (base fallback)
            // ═══════════════════════════════════════
            entertainer: [
                { text: "Entertainment industry vibes. Night City runs on spectacle and they're part of the show.", platform: "streetview", usernamePool: "gonks" },
                { text: "Performer energy. The look is the product and business is good.", platform: "screamsheet", usernamePool: "media" },
                { text: "Show business. Different from a Rockerboy — this one's selling entertainment, not revolution.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // — Entertainer Performer: braindance stars, Net-54 celebrities —
            entertainer_performer: [
                { text: "Braindance star material. The fashionware is tuned for recording and the outfit is tuned for attention.", platform: "screamsheet", usernamePool: "media" },
                { text: "Net-54 celebrity energy. Every piece is this season and they want you to know it.", platform: "streetview", usernamePool: "gonks" },
                { text: "Professional pretty. The look is manufactured, maintained, and worth more than your apartment building.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "BD actor? Holovid star? The Asia Pop influence and the fashionware say 'camera-ready at all times.'", platform: "fixernet", usernamePool: "fixers" }
            ],

            // — Entertainer DJ: club circuit, nightlife —
            entertainer_dj: [
                { text: "Club scene energy. Urban flash and Asia Pop — they set the mood for every venue from The Afterlife to the Totentanz.", platform: "streetview", usernamePool: "gonks" },
                { text: "DJ aesthetic. The gear doubles as fashion and the fashion doubles as a brand.", platform: "screamsheet", usernamePool: "media" },
                { text: "Nightlife professional. They read a room by its bass line and dress to match the beat.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Club headliner look. Bohemian enough to be credible, flashy enough to draw a crowd.", platform: "streetview", usernamePool: "gonks" }
            ],

            // — Entertainer Companion: licensed, professional —
            entertainer_companion: [
                { text: "Licensed companion. High fashion, fashionware-enhanced, and dressed to make an impression that costs by the hour.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Professional beauty. Every detail is deliberate, every look is calculated, and the rates reflect both.", platform: "streetview", usernamePool: "gonks" },
                { text: "Night City's oldest profession, newest fashionware. The biosculpting alone is a work of art.", platform: "screamsheet", usernamePool: "media" },
                { text: "Companion-class aesthetic. Don't stare unless you can afford the consultation fee.", platform: "datakrash", usernamePool: "netrunners" }
            ],


            // ═══════════════════════════════════════
            // ATHLETE (base fallback)
            // ═══════════════════════════════════════
            athlete: [
                { text: "Athlete build, athlete clothes. Night City's blood sport industry keeps growing.", platform: "streetview", usernamePool: "gonks" },
                { text: "Leisurewear that's actually being used for its intended purpose. Rare in this city.", platform: "screamsheet", usernamePool: "media" }
            ],

            // — Athlete Competitor: pit fighters, combat sport pros —
            athlete_competitor: [
                { text: "Pit fighter? Arena combatant? The bioware and the build say they make money with their fists.", platform: "streetview", usernamePool: "gonks" },
                { text: "Combat sport professional. The leisurewear hides bioware-enhanced muscle and the confidence of someone who fights for a living.", platform: "screamsheet", usernamePool: "media" },
                { text: "Arena energy. Kabuki underground circuit? Watson fight night? Either way, don't start something you can't finish.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Athletic build, practical gear, and the kind of calm that only comes from knowing you can handle yourself.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // — Athlete Trainer: coaches, fitness pros —
            athlete_trainer: [
                { text: "Trainer look. Professional enough for a gym in The Glen, tough enough for a basement ring in Kabuki.", platform: "streetview", usernamePool: "gonks" },
                { text: "Fitness professional. They keep the corpo execs in shape and the pit fighters alive between rounds.", platform: "screamsheet", usernamePool: "media" },
                { text: "Coach energy. Leisurewear meets business — the overlap zone where health becomes commerce.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Personal trainer aesthetic. Bioware for demonstration purposes, wardrobe for credibility.", platform: "datakrash", usernamePool: "netrunners" }
            ],


            // ═══════════════════════════════════════
            // CLERGY (base fallback)
            // ═══════════════════════════════════════
            clergy: [
                { text: "Spiritual energy in Night City. Either brave or delusional — and the city needs both.", platform: "streetview", usernamePool: "gonks" },
                { text: "Faith-based community figure. Different from cult gangs — these ones actually help people.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // — Clergy Street: storefront churches, community faith leaders —
            clergy_street: [
                { text: "Street preacher. Bohemian layers with personal meaning and a congregation that's the entire block.", platform: "streetview", usernamePool: "gonks" },
                { text: "Community faith leader. They stayed when the corps left and the gangs moved in. The neighborhood remembers that.", platform: "screamsheet", usernamePool: "media" },
                { text: "Storefront church energy. Secondhand robes, firsthand conviction. Night City needs more of this.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Street-level spiritual. Don't confuse them with the cult gangs — this one actually feeds people instead of feeding on them.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // — Clergy Corporate: megachurch, corpo-funded faith —
            clergy_corporate: [
                { text: "Corporate chaplain. God and quarterly earnings — the Night City special.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Megachurch energy. The suit costs more than a street preacher's entire wardrobe and the faith comes with a marketing budget.", platform: "screamsheet", usernamePool: "media" },
                { text: "Corpo-funded spiritual advisor. The collar is designer and the congregation has a credit check.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "High-end faith professional. Businesswear with divine authority — or at least the corporate version of it.", platform: "streetview", usernamePool: "gonks" }
            ],


            // ═══════════════════════════════════════
            // COURIER (base fallback)
            // ═══════════════════════════════════════
            courier: [
                { text: "Courier. The old NET is dead and data moves on legs now.", platform: "streetview", usernamePool: "gonks" },
                { text: "Delivery vibes. Night City's circulatory system — they keep everything moving.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // — Courier Runner: bike messengers, package runners —
            courier_runner: [
                { text: "Street runner. Legs like pistons, leisurewear for speed, and a delivery schedule that doesn't account for gang territory.", platform: "streetview", usernamePool: "gonks" },
                { text: "Bike courier energy. They know every shortcut between here and Japantown and they'll make the window or die trying.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Package runner. Whatever they're carrying is time-sensitive and so are they. Don't slow them down.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Data moves on foot now. These runners are the reason your chip delivery arrives same-day.", platform: "screamsheet", usernamePool: "media" }
            ],

            // — Courier Driver: combat cab, motorized delivery —
            courier_driver: [
                { text: "Combat cab operator. They know every checkpoint gap, every red-light district shortcut, and every street where you don't stop.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Delivery driver. Nomad-practical meets city-functional — leather jacket, work boots, and a vehicle that's seen better decades.", platform: "streetview", usernamePool: "gonks" },
                { text: "Motorized courier. The driving is the skill, the outfit is just what survived the last delivery route.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Cab driver aesthetic. They've heard every story Night City has to tell and they've stopped being surprised.", platform: "screamsheet", usernamePool: "media" }
            ],


            // ═══════════════════════════════════════
            // ACADEMIC (base fallback)
            // ═══════════════════════════════════════
            academic: [
                { text: "Academic energy. Someone's still trying to preserve knowledge in a city that keeps burning libraries.", platform: "streetview", usernamePool: "gonks" },
                { text: "Scholar vibes. Different from a techie — these ones teach instead of build.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // — Academic Professor: NCU faculty, independent scholars —
            academic_professor: [
                { text: "NCU professor. Bohemian layers over rumpled businesswear, coffee-stained and somehow still optimistic about education.", platform: "streetview", usernamePool: "gonks" },
                { text: "Faculty energy. They teach in buildings with bullet holes in the walls and call it 'institutional character.'", platform: "screamsheet", usernamePool: "media" },
                { text: "Night City University staff. The pay is terrible, the campus is a warzone, and they're still here. Respect.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Academic. The kind of person who thinks knowledge is power — and in Night City, they might actually be right.", platform: "fixernet", usernamePool: "fixers" }
            ],

            // — Academic Researcher: corporate labs, think tanks —
            academic_researcher: [
                { text: "Corporate researcher. Lab coat energy under businesswear — they have clearance levels instead of street cred.", platform: "streetview", usernamePool: "gonks" },
                { text: "Think tank professional. Biotechnica? Night Corp? Zhirafa? Someone's funding that quiet intellect.", platform: "screamsheet", usernamePool: "media" },
                { text: "R&D aesthetic. Their most dangerous weapon is a published paper and their bioware is for data processing, not combat.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Corporate research profile. Low physical threat, high information value. Interesting target for the right client.", platform: "fixernet", usernamePool: "fixers" }
            ],
            // ═══════════════════════════════════════
            // EDGERUNNER
            // ═══════════════════════════════════════
            edgerunner: [
                { text: "Gig worker. Chrome says professional, clothes say deniable.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Freelancer energy. No crew, no colors, just work.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ UNAFFILIATED ARMED INDIVIDUAL. No faction markers. Freelance threat.", platform: "ncpd_scanner", usernamePool: "corpos" }
            ],

            // ── Edgerunner Freelance: generic gig mercs ──
            edgerunner_freelance: [
                { text: "Freelance edgerunner. Dressed to be forgotten, chromed to be dangerous. Night City's gig economy at its finest.", platform: "fixernet", usernamePool: "fixers" },
                { text: "No colors, no crew patch, no loyalty. That's either a solo between contracts or someone smart enough to not advertise.", platform: "streetview", usernamePool: "solos" },
                { text: "Generic clothes, serious chrome. The 'I'm nobody' look that every fixer in the city recognizes instantly.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Freelancer. Clothes are disposable, chrome isn't. You can tell where the money goes.", platform: "streetview", usernamePool: "gonks" },
                { text: "Another edgerunner trying to blend in. The chrome gives it away — civilians don't carry that much hardware.", platform: "datakrash", usernamePool: "netrunners" }
            ],

            // ═══════════════════════════════════════
            // CHROMER
            // ═══════════════════════════════════════
            chromer: [
                { text: "Chrome addiction is real and it's standing right there.", platform: "streetview", usernamePool: "gonks" },
                { text: "More chrome than wardrobe budget. Classic.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "⚠️ HEAVILY AUGMENTED. Low social markers. Monitor for erratic behavior.", platform: "ncpd_scanner", usernamePool: "corpos" }
            ],

            // ── Chrome Junkie: ripperdoc frequent flyers ──
            chromer_junkie: [
                { text: "Chrome junkie. Every spare eddie goes to the ripperdoc — the outfit is whatever didn't get sold for implant money.", platform: "streetview", usernamePool: "gonks" },
                { text: "That's not an edgerunner, that's an addict. The chrome isn't for work — it's the point. Maelstrom recruitment poster.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Dressed like nothing, chromed like everything. One therapy session from Maelstrom and two from cyberpsychosis.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Ripperdoc's best customer. The clothes say broke, the chrome says 'I know what I'm prioritizing.'", platform: "streetview", usernamePool: "techies" },
                { text: "That level of augmentation without faction backing? Either trust fund chrome or a payment plan that ends in organ repossession.", platform: "screamsheet", usernamePool: "media" }
            ],

            // ═══════════════════════════════════════
            // OPERATIVE
            // ═══════════════════════════════════════
            operative: [
                { text: "Grey man. Deliberately forgettable. That takes effort.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Something wrong about that one. Too average. Nobody is that average on purpose.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ PROFILE MISMATCH. Appearance does not match augmentation level. Flagged.", platform: "ncpd_scanner", usernamePool: "corpos" }
            ],

            // ── Corporate Sleeper: hidden hardware, plain wrapper ──
            operative_sleeper: [
                { text: "Grey man alert. The outfit is aggressively forgettable but the chrome scan doesn't match. Nobody runs that much hidden hardware for fun.", platform: "fixernet", usernamePool: "fixers" },
                { text: "That's a weapon pretending to be a person. Generic clothes hiding corpo-grade internals. Sleeper agent or retired spook.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "The kind of person who looks like a commuter until they don't. Night Corp loves this profile.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Plain clothes, full suite underneath. Either deep cover or an edgerunner who actually understands operational security.", platform: "streetview", usernamePool: "solos" },
                { text: "Fascinating. The deliberate visual anonymity combined with that augmentation level suggests professional intelligence training.", platform: "screamsheet", usernamePool: "media" }
            ]
        },

        // ── CHROME-SPECIFIC COMMENTS ──
        chrome_comments: {
            heavy_chrome: [
                { text: "More metal than meat walking around out there.", platform: "streetview", usernamePool: "gonks" },
                { text: "Chrome reading off the charts. Cyberpsycho watch?", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "That much chrome has to hurt. In every sense.", platform: "streetview", usernamePool: "techies" },
                { text: "Walking hardware store. Every joint is an upgrade.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "The Enhanced would call them a prophet. Everyone else calls them a threat.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ HEAVILY AUGMENTED INDIVIDUAL. Multiple visible implants detected.", platform: "ncpd_scanner", usernamePool: "corpos" }
            ],
            light_chrome: [
                { text: "Subtle chrome. The kind you don't notice until it's too late.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Smart chrome placement. Just enough edge without going full borg.", platform: "streetview", usernamePool: "techies" },
                { text: "Tasteful augmentation. Rocklin quality, by the look of it.", platform: "streetview", usernamePool: "gonks" }
            ],
            organic: [
                { text: "Full organic? Bold move in Night City, 2045.", platform: "streetview", usernamePool: "gonks" },
                { text: "Zero chrome detected. Either brave, broke, or an Inquisitor sympathizer.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "100% meat. In the Time of the Red? That's either a statement or a death wish.", platform: "streetview", usernamePool: "gonks" },
                { text: "No chrome gang rise up. Meatbag pride.", platform: "datakrash", usernamePool: "gonks" }
            ],
            fashionware: [
                { text: "That fashionware is next level. Shift tacts? Light tattoos? All of it?", platform: "streetview", usernamePool: "gonks" },
                { text: "Chrome as accessory, not weapon. The fashionware approach.", platform: "screamsheet", usernamePool: "media" },
                { text: "Those light tattoos alone probably cost more than my cube rent.", platform: "streetview", usernamePool: "gonks" },
                { text: "Fashionware game is strong. Looking like a walking art installation.", platform: "streetview", usernamePool: "media" }
            ],
            borgware: [
                { text: "Is that a linear frame? That's military-grade exoskeleton hardware walking around in public.", platform: "streetview", usernamePool: "gonks" },
                { text: "Borgware detected. Shoulder mounts, frame augmentation — that's full-body combat architecture.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Walking tank. The frame alone costs more than most people's entire chrome suite.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Linear frame user. Treat as vehicle-class threat. Seriously — don't.", platform: "fixernet", usernamePool: "solos" },
                { text: "⚠️ EXOSKELETON-CLASS AUGMENTATION. Superhuman strength confirmed. Maintain distance.", platform: "ncpd_scanner", usernamePool: "corpos" }
            ]
        },

        // ── HEAT-LEVEL COMMENTS ──
        heat_comments: {
            blazing: [
                { text: "Everyone in the block just clocked that entrance. EVERYONE.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ HIGH VISIBILITY ALERT. Subject drawing significant attention.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Walking target. Every fixer, ganger, and scav within three blocks knows you're here.", platform: "fixernet", usernamePool: "fixers" },
                { text: "That outfit is a beacon. NCPD drones probably already flagged them.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "BLAZING hot entrance. Even Lazarus might take notice.", platform: "screamsheet", usernamePool: "media" }
            ],
            hot: [
                { text: "Turning heads and raising alerts. That's a lot of attention.", platform: "streetview", usernamePool: "gonks" },
                { text: "Running hot out there. The smart money says 'lay low.'", platform: "fixernet", usernamePool: "fixers" },
                { text: "Hard to miss someone looking like that. For better or worse.", platform: "streetview", usernamePool: "gonks" }
            ],
            warm: [
                { text: "Getting some looks but nothing dangerous. Yet.", platform: "streetview", usernamePool: "gonks" },
                { text: "Slight uptick on the radar. Nothing a quick outfit change won't fix.", platform: "fixernet", usernamePool: "fixers" }
            ],
            cold: [
                { text: "Ghost-mode activated. Nobody's giving a second look.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Invisible in the crowd. Perfect for business.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Low profile locked in. The best kind of entrance is the one nobody notices.", platform: "datakrash", usernamePool: "netrunners" }
            ]
        },

        // ── OUTFIT COHESION COMMENTS ──
        cohesion_comments: {
            signature: [
                { text: "Signature look LOCKED. Every piece tells the same story.", platform: "streetview", usernamePool: "gonks" },
                { text: "That's a curated aesthetic. Intentional from head to toe.", platform: "screamsheet", usernamePool: "media" },
                { text: "When the whole outfit speaks one language. *Chef's kiss.*", platform: "streetview", usernamePool: "gonks" }
            ],
            coordinated: [
                { text: "Coordinated fit. Clearly puts thought into the look.", platform: "streetview", usernamePool: "gonks" },
                { text: "Solid style coherence. Most pieces are singing the same tune.", platform: "screamsheet", usernamePool: "media" }
            ],
            mixed: [
                { text: "Mixed signals from that outfit. Can't tell if intentional or accidental.", platform: "streetview", usernamePool: "gonks" },
                { text: "Style identity crisis happening in real time.", platform: "screamsheet", usernamePool: "media" },
                { text: "Pick a lane, choom. The outfit's saying three things at once.", platform: "streetview", usernamePool: "gonks" }
            ],
            chaotic: [
                { text: "Fashion anarchy. Every piece from a different universe.", platform: "streetview", usernamePool: "gonks" },
                { text: "That outfit looks like it was assembled by a random number generator.", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Chaotic drip. Either genius or disaster, no in-between.", platform: "screamsheet", usernamePool: "media" }
            ]
        },

        // ── WEAPON/ARMOR COMMENTS ──
        weapon_comments: {
            heavy_armed: [
                { text: "Packing serious iron and NOT hiding it. Message received.", platform: "streetview", usernamePool: "gonks" },
                { text: "⚠️ MULTIPLE WEAPONS VISIBLE. Potential threat. Monitor closely.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Walking armory. That's not an outfit, that's a loadout.", platform: "fixernet", usernamePool: "solos" },
                { text: "They came dressed for war. Hope the meeting goes well.", platform: "datakrash", usernamePool: "netrunners" }
            ],
            light_armed: [
                { text: "One piece visible. Could be for show, could be for keeps.", platform: "streetview", usernamePool: "gonks" },
                { text: "Armed but not aggressive. Standard Night City carry.", platform: "fixernet", usernamePool: "fixers" }
            ],
            concealed: [
                { text: "Clean on the surface but I clocked at least one hidden piece.", platform: "fixernet", usernamePool: "solos" },
                { text: "Looking peaceful but the smart money says they're packing.", platform: "datakrash", usernamePool: "netrunners" }
            ],
            unarmed: [
                { text: "No visible weapons. Either very confident or very foolish.", platform: "streetview", usernamePool: "gonks" },
                { text: "Unarmed in Night City. That's either chrome confidence or a death wish.", platform: "fixernet", usernamePool: "fixers" }
            ],
            armored: [
                { text: "Walking tank alert. That armor is rated for serious threats.", platform: "streetview", usernamePool: "solos" },
                { text: "Armored up like they're expecting trouble. Probably are.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Heavy armor on the street? Either paranoid or connected enough to need it.", platform: "screamsheet", usernamePool: "media" }
            ]
        },

        // ── CREW COMMENTS ──
        crew_comments: {
            synergy_high: [
                { text: "That crew moves like a unit. Tight coordination, matching energy.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Professional crew spotted. They clearly work together regularly.", platform: "screamsheet", usernamePool: "media" },
                { text: "Crew synergy is off the charts. Don't cross them.", platform: "streetview", usernamePool: "gonks" }
            ],
            synergy_low: [
                { text: "That crew is a mess. Looks like they met five minutes ago.", platform: "streetview", usernamePool: "gonks" },
                { text: "Mismatched crew. A fixer's nightmare to coordinate.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Zero cohesion in that group. Expecting a wipe on their next gig.", platform: "datakrash", usernamePool: "netrunners" }
            ],
            crew_visible: [
                { text: "Running with a crew. Smart. Safer than solo in these streets.", platform: "streetview", usernamePool: "gonks" },
                { text: "Crew spotted. Count the heads, count the weapons, keep moving.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Group of edgerunners just rolled in. Clear the booth.", platform: "streetview", usernamePool: "gonks" }
            ],
            crew_heated: [
                { text: "That crew is running HOT. Somebody's about to have a very bad day.", platform: "fixernet", usernamePool: "fixers" },
                { text: "⚠️ ARMED GROUP. Multiple individuals. Elevated threat level.", platform: "ncpd_scanner", usernamePool: "corpos" }
            ],
            crew_blown: [
                { text: "Edgerunner crew sticking out like a sore thumb. Blown on sight.", platform: "fixernet", usernamePool: "fixers" },
                { text: "That group couldn't be more obvious if they wore matching jackets that said 'CRIMINALS'.", platform: "datakrash", usernamePool: "netrunners" }
            ],
            crew_stealthy: [
                { text: "Interesting group. They almost look like they don't know each other. Almost.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Low-profile crew. Professional. Would hire.", platform: "fixernet", usernamePool: "fixers" }
            ]
        },

        // ── STYLE-SPECIFIC COMMENTS ──
        style_comments: {
            highFashion: [
                { text: "High fashion on the streets? That's either courageous or suicidal.", platform: "streetview", usernamePool: "gonks" },
                { text: "Designer threads in the Time of the Red. The audacity.", platform: "screamsheet", usernamePool: "media" },
                { text: "Couture-level drip. Every piece is a statement.", platform: "streetview", usernamePool: "media" }
            ],
            gangColors: [
                { text: "Colors on display. Better know whose turf you're on — Night City's got fifty gangs now.", platform: "streetview", usernamePool: "gangers" },
                { text: "Gang colors spotted. Could be Tyger Claws, 6th Street, Iron Sights — check before you approach.", platform: "ncpd_scanner", usernamePool: "corpos" },
                { text: "Repping hard. Those colors mean something in these streets.", platform: "streetview", usernamePool: "gangers" }
            ],
            nomadLeathers: [
                { text: "Nomad leathers in the city. The Badlands are calling.", platform: "streetview", usernamePool: "gonks" },
                { text: "Road-worn leather tells a story. Aldecaldos patch? Steel Vaquero brand? Thelas salt?", platform: "screamsheet", usernamePool: "media" },
                { text: "Those leathers have seen dust storms and firefights.", platform: "streetview", usernamePool: "solos" }
            ],
            asiaPop: [
                { text: "Asia Pop drip is preem. Kabuki would approve.", platform: "streetview", usernamePool: "gonks" },
                { text: "NCCS aesthetic strong. Tyger Claw territory friendly.", platform: "streetview", usernamePool: "gangers" },
                { text: "That Asia Pop look is trending hard in Watson right now.", platform: "screamsheet", usernamePool: "media" }
            ],
            urbanFlash: [
                { text: "Urban flash on full display. Neon-lit and proud of it.", platform: "streetview", usernamePool: "gonks" },
                { text: "Street flash that demands attention. Every piece pops.", platform: "screamsheet", usernamePool: "media" },
                { text: "Techno-streetwear energy. Flashy, functional, and designed to be seen from across a neon-lit block.", platform: "streetview", usernamePool: "gonks" },
                { text: "Urban flash is Night City's native language. Loud, technological, unapologetically street.", platform: "datakrash", usernamePool: "netrunners" }
            ],
            businesswear: [
                { text: "Businesswear on the block. Either a meeting in The Glen or a disguise.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Suit energy. The kind that signs contracts at Merrill Asukaga and ends careers.", platform: "streetview", usernamePool: "corpos" },
                { text: "Leadership wardrobe. Presence and authority sewn into every seam. Corpo or not, that outfit commands a room.", platform: "screamsheet", usernamePool: "media" },
                { text: "Power dressing, Night City style. The suit is a weapon and they know exactly how to use it.", platform: "datakrash", usernamePool: "netrunners" }
            ],
            bohemian: [
                { text: "Bohemian rebel vibes. Art school meets anarchy.", platform: "streetview", usernamePool: "gonks" },
                { text: "Free spirit aesthetic. Rockerboy energy without the guitar. Silverhand would've liked it.", platform: "screamsheet", usernamePool: "media" },
                { text: "Folksy, retro, free-spirited. The kind of look that says 'I read banned books and I liked them.'", platform: "datakrash", usernamePool: "netrunners" },
                { text: "Bohemian layers. Every piece has a story and they'll tell you about it whether you asked or not.", platform: "fixernet", usernamePool: "fixers" }
            ],
            leisurewear: [
                { text: "Leisurewear flex. Either Charter Hill money or just doesn't care.", platform: "streetview", usernamePool: "gonks" },
                { text: "Casual money. The 'I'm relaxing' look that costs more than your cube hotel.", platform: "screamsheet", usernamePool: "media" },
                { text: "Built for comfort and agility. Leisurewear that's actually being used for movement, not just a vibe.", platform: "streetview", usernamePool: "gonks" },
                { text: "Athletic aesthetic. Designed for performance — whether that's a gym session or running from NCPD.", platform: "datakrash", usernamePool: "netrunners" }
            ],
            bagLadyChic: [
                { text: "Bag lady chic making a comeback? Or just... bag lady?", platform: "streetview", usernamePool: "gonks" },
                { text: "Post-War fashion. Either making a statement or making do with what the 4th War left behind.", platform: "screamsheet", usernamePool: "media" },
                { text: "Combat Zone casual. Not pretty but it works.", platform: "streetview", usernamePool: "gangers" }
            ],
            genericChic: [
                { text: "Generic but functional. Night City standard issue.", platform: "streetview", usernamePool: "gonks" },
                { text: "Basic but clean. Not everyone needs to make a statement.", platform: "streetview", usernamePool: "gonks" },
                { text: "Standard Night City wardrobe. Colorful enough to be a person, modular enough to mix and match.", platform: "streetview", usernamePool: "gonks" },
                { text: "Generic chic is Night City's real uniform. Eight million people wearing the same nothing and calling it fashion.", platform: "screamsheet", usernamePool: "media" },
                { text: "Plain clothes, no affiliations, no statement. In Night City, that IS a statement — 'I'm nobody's target.'", platform: "fixernet", usernamePool: "fixers" }
            ]
        },

        // ── SCENE-AWARE COMMENTS ──
        scene_comments: {
            overdressed: [
                { text: "Way overdressed for this crowd. Standout target.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Reading the room and they clearly didn't. All eyes on them.", platform: "streetview", usernamePool: "gonks" }
            ],
            underdressed: [
                { text: "Underdressed for the venue. Getting 'are they lost?' looks.", platform: "streetview", usernamePool: "gonks" },
                { text: "Below the dress code and everyone knows it.", platform: "screamsheet", usernamePool: "media" }
            ],
            top_ranked: [
                { text: "Best dressed in the room. Every head turned when they walked in.", platform: "streetview", usernamePool: "gonks" },
                { text: "Number one in the scene. Style dominance established.", platform: "screamsheet", usernamePool: "media" }
            ],
            bottom_ranked: [
                { text: "Worst dressed in the scene. Oof. Thoughts and prayers.", platform: "streetview", usernamePool: "gonks" },
                { text: "Dead last in the style rankings. Maybe that's the point?", platform: "datakrash", usernamePool: "netrunners" }
            ]
        },

        // ── STAT-AWARE COMMENTS ──
        stat_comments: {
            high_cool_low_outfit: [
                { text: "Doesn't need the clothes. That PRESENCE though.", platform: "streetview", usernamePool: "gonks" },
                { text: "Walked in wearing nothing special but everyone moved aside anyway.", platform: "streetview", usernamePool: "fixers" },
                { text: "Confidence like that can't be bought. Or chromed.", platform: "streetview", usernamePool: "solos" }
            ],
            high_ws_low_gear: [
                { text: "Stretching every eddie but making it WORK. This one knows fashion.", platform: "streetview", usernamePool: "gonks" },
                { text: "Budget outfit but styled like a pro. Wardrobe skills over wallet.", platform: "screamsheet", usernamePool: "media" },
                { text: "They clearly know what they're doing with limited resources.", platform: "streetview", usernamePool: "corpos" }
            ],
            low_grooming_expensive: [
                { text: "Money can't buy hygiene, choom. That suit deserves better.", platform: "streetview", usernamePool: "gonks" },
                { text: "Expensive threads, zero personal care. Classic Night City.", platform: "screamsheet", usernamePool: "media" },
                { text: "Outfit says Exec Zone. Grooming says Hot Zone.", platform: "streetview", usernamePool: "corpos" }
            ],
            high_rep_anywhere: [
                { text: "Everyone knows that face. Can't go anywhere quiet.", platform: "fixernet", usernamePool: "fixers" },
                { text: "SPOTTED: Known operator in the area. [Thread: 89 replies]", platform: "datakrash", usernamePool: "netrunners" },
                { text: "That's a name. Right there. Walking around like it's nothing.", platform: "streetview", usernamePool: "gonks" }
            ],
            low_cool_high_outfit: [
                { text: "All drip, no composure. Watch them fold under pressure.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Great outfit but they keep fidgeting. Nervous energy.", platform: "streetview", usernamePool: "gonks" },
                { text: "Clothes say apex predator. Body language says prey.", platform: "streetview", usernamePool: "solos" }
            ],
            high_grooming_low_gear: [
                { text: "Immaculately groomed but wearing... that? Priorities.", platform: "streetview", usernamePool: "gonks" },
                { text: "Face says runway. Clothes say thrift store.", platform: "screamsheet", usernamePool: "media" }
            ],
            max_rep: [
                { text: "LEGEND SIGHTING. I repeat. LEGEND. SIGHTING.", platform: "screamsheet", usernamePool: "media" },
                { text: "Security just tightened. Someone with a REP walked in.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Night City royalty in the building. Act natural.", platform: "streetview", usernamePool: "gonks" }
            ],
            cool_presence: [
                { text: "Something about the way they carry themselves. Calm. Controlled.", platform: "streetview", usernamePool: "gonks" },
                { text: "Not the loudest in the room but definitely the most dangerous.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Ice in their veins. You can just tell.", platform: "streetview", usernamePool: "solos" }
            ],
            ws_savvy: [
                { text: "That outfit didn't happen by accident. Someone knows their fashion.", platform: "streetview", usernamePool: "gonks" },
                { text: "Every piece chosen with intent. Wardrobe game is real.", platform: "screamsheet", usernamePool: "media" },
                { text: "Dressed with purpose. Not a single wasted accessory.", platform: "streetview", usernamePool: "corpos" }
            ],
            well_groomed: [
                { text: "Clean. Sharp. Put together. Details matter and they know it.", platform: "streetview", usernamePool: "gonks" },
                { text: "Grooming on point. This one takes personal presentation seriously.", platform: "screamsheet", usernamePool: "media" },
                { text: "Not a hair out of place. Professional to the core.", platform: "streetview", usernamePool: "corpos" }
            ],
            known_name: [
                { text: "Wait... is that...? I think I've heard that name before.", platform: "streetview", usernamePool: "gonks" },
                { text: "Someone with a rep just walked in. Heads are turning.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Not a nobody. The bartender just straightened up.", platform: "streetview", usernamePool: "solos" }
            ],
            total_unknown: [
                { text: "Who? Literally who? Zero presence.", platform: "streetview", usernamePool: "gonks" },
                { text: "Complete ghost. No rep, no name, no history. Could be useful.", platform: "fixernet", usernamePool: "fixers" },
                { text: "Nobody knows them. Nobody cares. Perfect anonymity.", platform: "datakrash", usernamePool: "netrunners" }
            ],
            low_cool: [
                { text: "Jumpy. Keeps looking over their shoulder. Fresh meat.", platform: "streetview", usernamePool: "gonks" },
                { text: "Body language screaming 'I don't belong here.' Easy mark.", platform: "fixernet", usernamePool: "fixers" },
                { text: "No poker face whatsoever. Every emotion on display.", platform: "streetview", usernamePool: "solos" }
            ]
        }
    };

export default COMMENTS;
