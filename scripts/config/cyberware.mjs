/**
 * config/cyberware.mjs — seed defaults (guide §5.3).
 *
 * Lifted VERBATIM from stylechecker2_0_Phase82.js
 * StyleDataManager.getDefaultCyberwareData(). Do not hand-edit — regenerate via
 * tools/extract-config.mjs if the reference macro changes.
 *
 * Top-level keys: 3.
 */

export const CYBERWARE = {
      CYBERWARE_CATEGORIES: {
        visible_chrome: {
          styleModifier: -10, coolModifier: 25, threatModifier: 30,
          keywords: ["cyberarm", "cyberleg", "cyberlimb", "cybereye", "faceplate", "metal", "chrome", "external", "implanted hand", "implanted foot", "battleglove"],
          examples: ["Cyberarm", "Cybereye (visible)", "Faceplate", "Cybernetic Limb"]
        },
        hidden_chrome: {
          styleModifier: 0, coolModifier: 10, threatModifier: 10,
          keywords: ["neural", "link", "processor", "interface", "bone lacing", "pain editor", "chipware", "coprocessor", "subdermal", "internal", "reflex"],
          examples: ["Neural Link", "Bone Lacing", "Pain Editor", "Kerenzikov"]
        },
        fashionware: {
          styleModifier: 15, coolModifier: 20, threatModifier: -5,
          keywords: ["tattoo", "light tattoo", "shift tacts", "color shift", "techhair", "biomonitor", "fashionware", "chemskin", "synthskin", "skinwatch", "corneal"],
          examples: ["Light Tattoo", "Shift Tacts", "Color Shift Eyes", "Techhair"]
        },
        bioware: {
          styleModifier: -5, coolModifier: 15, threatModifier: 15,
          keywords: ["grafted", "muscle", "toxin binder", "enhanced antibodies", "nasal filter", "gills", "independent air", "bioware", "enhanced body"],
          examples: ["Grafted Muscle", "Toxin Binders", "Enhanced Antibodies"]
        },
        borgware: {
          styleModifier: -15, coolModifier: 20, threatModifier: 50,
          keywords: ["linear frame", "sigma frame", "exoskeleton", "shoulder mount", "implanted frame", "sensor array", "twin rack", "popup"],
          examples: ["Linear Frame", "Artificial Shoulder Mount", "Sigma Frame", "Sensor Array"]
        }
      },
      CYBERWARE_VISIBILITY: {
        // Items completely ignored by Style Checker (system scaffolding)
        EXCLUDED_ITEMS: [
          "External (7 Option Slots)",
          "Internal (7 Option Slots)",
          "Fashionware (7 Option Slots)"
        ],
        // Type-level defaults — covers most items automatically
        TYPE_DEFAULTS: {
          borgware:          { visibility: 'visible',     threat: 'threatening', chromeWeight: 3 },
          cyberArm:          { visibility: 'visible',     threat: 'neutral',     chromeWeight: 3 },
          cyberAudioSuite:   { visibility: 'hidden',      threat: 'neutral',     chromeWeight: 0 },
          cyberEye:          { visibility: 'visible',     threat: 'neutral',     chromeWeight: 2 },
          cyberLeg:          { visibility: 'visible',     threat: 'neutral',     chromeWeight: 3 },
          cyberwareExternal: { visibility: 'visible',     threat: 'neutral',     chromeWeight: 1 },
          cyberwareInternal: { visibility: 'hidden',      threat: 'neutral',     chromeWeight: 0 },
          fashionware:       { visibility: 'fashionware', threat: 'neutral',     chromeWeight: 1 },
          neuralWare:        { visibility: 'hidden',      threat: 'neutral',     chromeWeight: 0 }
        },
        // Per-item overrides where item differs from its type default
        ITEM_OVERRIDES: {
          // === BORGWARE ===
          "Hardened Shielding (Borgware)":        { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          // === CYBERARM — Hidden foundationals ===
          "Meat Arm":                             { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "MechaMan Smart Glove":                 { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Medical Grade Cyberarm":               { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          // === CYBERARM — Visible specials ===
          "Gang Jazzler":                         { visibility: 'visible', threat: 'neutral',     chromeWeight: 2 },
          "Blitzkrieg Arc-Thrower Cyberarm":       { visibility: 'visible', threat: 'threatening', chromeWeight: 3 },
          "ChainRipp":                            { visibility: 'visible', threat: 'threatening', chromeWeight: 3 },
          "Medscanner":                           { visibility: 'visible', threat: 'neutral',     chromeWeight: 2 },
          "MicroWaldo":                           { visibility: 'visible', threat: 'neutral',     chromeWeight: 2 },
          "Techscanner":                          { visibility: 'visible', threat: 'neutral',     chromeWeight: 2 },
          "Superchrome Covering (Cyber Arm)":     { visibility: 'visible', threat: 'neutral',     chromeWeight: 2 },
          "Superchrome\u00ae Covering (Cyber Arm)": { visibility: 'visible', threat: 'neutral',   chromeWeight: 2 },
          "Pursuit Security Inc. Personal Shredder": { visibility: 'visible', threat: 'neutral',  chromeWeight: 1 },
          // === CYBERARM — Hidden options (inside the arm) ===
          "Airhypo Cyberfinger":                  { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Ballpoint Cyberfinger":                { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Big Knucks":                           { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Bullet Storage Cyberfinger":           { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Cyberdeck (Hardwired)":                { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Dartgun Cyberfinger":                  { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Extra-Jointed Cyberarm Upgrade":       { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Flashlight Cyberfinger":               { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Hardened Shielding (Cyber Arm)":       { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Homing Tracer Cyberfinger":            { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Integrated Cyberdeck Upgrade":         { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Laser Pointer Cyberfinger":            { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Lighter Cyberfinger":                  { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Lockpick Cyberfinger":                 { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Microphone Cyberfinger":               { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Mini Air Supply Cyberfinger":          { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "One Shot Special Cyberfinger":         { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Popup Grenade Launcher":               { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Popup Melee Weapon":                   { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Popup Net Launcher":                   { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Popup Ranged Weapon":                  { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Popup Shield":                         { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Popup Shotgun":                        { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Quick Change Mount":                   { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Realskinn Covering (Cyber Arm)":       { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Reinforced Cyberarm Upgrade":          { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Rippers":                              { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Scratchers":                           { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Slice 'N Dice":                        { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Spray Paint Cyberfinger":              { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Squirt Cyberfinger":                   { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Standard Cyberfinger":                 { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Subdermal Grip":                       { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Wirecutter/Scissors Cyberfingers":     { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Wolvers":                              { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          // === CYBERAUDIO ===
          "Discount Cyberaudio Suite":            { visibility: 'visible', threat: 'neutral',     chromeWeight: 1 },
          // === CYBEREYE — Hidden options (inside the eye) ===
          "Anti-Dazzle":                          { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Chipware Compartment":                 { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Chyron":                               { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Color Shift":                          { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Dartgun":                              { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Hardened Shielding (Cybereye)":        { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Image Enhance":                        { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Low Light/IR/UV":                      { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "MicroOptics":                          { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "MicroVideo":                           { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Radiation Detector":                   { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Smart Lens":                           { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Targeting Scope":                      { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "TeleOptics":                           { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Virtuality":                           { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          // === CYBEREYE — Visible specials ===
          "Bug Eye":                              { visibility: 'visible', threat: 'neutral',     chromeWeight: 3 },
          "MonoVision":                           { visibility: 'visible', threat: 'neutral',     chromeWeight: 3 },
          // === CYBERLEG ===
          "Meat Leg":                             { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Medical Grade Cyberleg":               { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Extra-Jointed Cyberleg Upgrade":       { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Hardened Shielding (Cyber Leg)":       { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Jump Booster":                         { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Reinforced Cyberleg Upgrade":          { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Realskinn Covering (Cyber Leg)":       { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Romanova Cyberlegs":                   { visibility: 'visible', threat: 'threatening', chromeWeight: 3 },
          "Talon Foot":                           { visibility: 'visible', threat: 'threatening', chromeWeight: 1 },
          "Superchrome Covering (Cyber Leg)":     { visibility: 'visible', threat: 'neutral',     chromeWeight: 2 },
          "Superchrome\u00ae Covering (Cyber Leg)": { visibility: 'visible', threat: 'neutral',   chromeWeight: 2 },
          // === EXTERNAL ===
          "Combat Jaw":                           { visibility: 'visible', threat: 'threatening', chromeWeight: 2 },
          "Combat Tail":                          { visibility: 'visible', threat: 'threatening', chromeWeight: 3 },
          "FleshWeave":                           { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Hidden Holster":                       { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "OptiShield":                           { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Skin Weave":                           { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Subdermal Armor":                      { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          "Subdermal Pocket":                     { visibility: 'hidden', threat: 'neutral',     chromeWeight: 0 },
          // === INTERNAL ===
          "Cybersnake":                           { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Firebreather":                         { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Grafted Muscle and Bone Lace":         { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Gills":                                { visibility: 'visible', threat: 'neutral',     chromeWeight: 1 },
          "Vampyres":                             { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          // === NEURALWARE ===
          "Interface Plugs":                      { visibility: 'visible', threat: 'neutral',     chromeWeight: 1 },
          "Kerenzikov":                           { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Pain Editor":                          { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Reflex Co-Processor":                  { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 },
          "Sandevistan":                          { visibility: 'hidden', threat: 'threatening', chromeWeight: 0 }
        }
      },
      HUMANITY_CONFIG: {
        maxHumanity: 100, // fallback if EMP unreadable
        warningThreshold: 40,
        criticalThreshold: 20,
        cyberpsychosisThreshold: 0,
        humanityPerCyberware: 4, // fallback HL per piece if item has no HL data
        // Drug addiction — HL penalty by severity
        drugAddictionHL: { mild: 2, moderate: 4, severe: 7 },
        // Drug keywords to detect from actor items
        drugKeywords: ['drug', 'narcotic', 'stim', 'synth', 'endorphin', 'black lace', 'blue glass', 'smash', 'boost', 'dorph', 'synthcoke', 'prime', 'frenzy', 'addiction'],
        // Social impact thresholds — EMP affects roleplay
        socialImpact: [
          { maxEmp: 2, label: 'DETACHED', desc: 'Struggles with basic empathy. Others sense something deeply wrong.', color: '#dc3545' },
          { maxEmp: 4, label: 'COLD', desc: 'Emotionally distant. Comes across as uncaring or calculating.', color: '#ff6b00' },
          { maxEmp: 6, label: 'GUARDED', desc: 'Functional but muted. Social warmth takes conscious effort.', color: '#ffc107' },
          { maxEmp: 8, label: 'NORMAL', desc: 'Standard emotional range. No noticeable issues.', color: '#00d9ff' },
          { maxEmp: 10, label: 'WARM', desc: 'Naturally empathetic. People trust and confide easily.', color: '#28a745' }
        ]
      }
    };

export default CYBERWARE;
