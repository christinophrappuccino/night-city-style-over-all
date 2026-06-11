/**
 * config/brands.mjs — the Brand Registry seed (guide §13.1, M9.1).
 *
 * NEW config domain (no macro reference — §13 was scheduled M1/M4 but never
 * landed; designed from §13.1–§13.6, §22.1, §23.1, §23.8). A brand is a broad
 * cascade source sitting between faction and archetype (§13.2): tier drives
 * perceived cost, styleAffinity amplifies style reads, heatProfile feeds heat,
 * vibe pushes social tone, recognition is perception-gated literacy (§13.3),
 * counterfeit powers the §13.4 authenticity play.
 *
 * Entry fields (every one optional except label/tier):
 *   label            display name
 *   voice            batch-guide Brand Voice Archetype key (description gen)
 *   tier             street | massMarket | premium | luxury | hauteCouture
 *   styleAffinity    { styleKey: weight } — amplified style reads (registry scale;
 *                    tunables.brand.styleMult converts to virtual style points)
 *   archetypeSignal  { archetypeKey: pts } — optional identity nudge
 *   factionAffinity  { factionKey: pts } — optional soft affiliation read
 *   districtAffinity { DISTRICT_KEY: pts } — optional district-fit nudge
 *   heatProfile      flat heat contribution (flashy designer +, grey/street ~0)
 *   recognition      iconic | known | niche (§13.3 — niche needs fashion literacy)
 *   counterfeit      { exists, replicaTiers: ["streetKnockoff","premiumReplica"] }
 *   vibe             { vibeTag: pts } — the brand's vibe identity (§22.3)
 *   motto, lore      surfaced in reads + the house page (§22.1); ALWAYS original copy
 *   signaturePieces  flavor for lookbook/feed (§13.5)
 *
 * Seeds: the three house brands (M8 catalog: Ofuda · Brass Lotus · Rustwerk) in
 * full, plus light canon-MAKER entries (Kiroshi · Militech · Arasaka — names
 * only per the standing §30.3 policy; all copy original; §23.1/§23.8 scheduled
 * these at M1). GM-editable via GM Config → Data; open vocabulary.
 */

export const BRANDS_CONFIG = {
  BRANDS: {
    // ── House brands (original, ship with the catalog) ───────────────────────
    ofuda: {
      label: "Ofuda",
      voice: "japaneseLuxury",
      tier: "luxury",
      styleAffinity: { asiaPop: 12, highFashion: 4 },
      districtAffinity: { KABUKI: 4, OLD_JAPANTOWN: 4 },
      heatProfile: 6,
      recognition: "known",
      counterfeit: { exists: true, replicaTiers: ["streetKnockoff", "premiumReplica"] },
      vibe: { cool: 3, elegant: 2 },
      motto: "Tradition, sharpened.",
      lore: "Old Japantown tailoring house gone city-wide — heritage cuts in modern cyberweave, priced like it remembers being couture.",
      signaturePieces: ['the "Hanabi" bomber', "Kitsune mirrorshades"],
    },
    brass_lotus: {
      label: "Brass Lotus",
      voice: "decadentCouture",
      tier: "hauteCouture",
      styleAffinity: { highFashion: 12, businesswear: 4 },
      districtAffinity: { CHARTER_HILL: 4, NEW_WESTBROOK: 3 },
      heatProfile: 9,
      recognition: "niche",
      counterfeit: { exists: true, replicaTiers: ["premiumReplica"] },
      vibe: { elegant: 3, sexy: 2 },
      motto: "Gilded, not gentle.",
      lore: "Invitation-list atelier trading in lacquer, filigree, and the kind of silhouette that ends conversations. If you have to ask, it isn't for you.",
      signaturePieces: ['the "Imperial Column" longcoat'],
    },
    rustwerk: {
      label: "Rustwerk",
      voice: "salvageStreet",
      tier: "street",
      styleAffinity: { urbanFlash: 10, bagLadyChic: 3 },
      districtAffinity: { WATSON_DEVELOPMENT: 3, RECLAMATION_ZONE: 3 },
      heatProfile: 0,
      recognition: "known",
      counterfeit: { exists: false, replicaTiers: [] },
      vibe: { rugged: 2, scrappy: 2 },
      motto: "Built from what's left.",
      lore: "Reclamation-zone workwear stitched from freight tarps and dead uniforms. Cheap, honest, everywhere — the city's default armor against being noticed.",
      signaturePieces: ["the Scrapline parka"],
    },

    // ── Canon makers (names only — original copy; §23.1/§23.8) ───────────────
    kiroshi: {
      label: "Kiroshi",
      voice: "corporatePrecision",
      tier: "premium",
      styleAffinity: { businesswear: 3 },
      heatProfile: 2,
      recognition: "iconic",
      counterfeit: { exists: true, replicaTiers: ["streetKnockoff"] },
      vibe: { cool: 2 },
      motto: "",
      lore: "Optics maker so dominant that 'kiroshis' means cybereyes. The shimmer is the status symbol.",
      signaturePieces: [],
    },
    militech: {
      label: "Militech",
      voice: "milSpec",
      tier: "premium",
      styleAffinity: {},
      heatProfile: 3,
      recognition: "iconic",
      counterfeit: { exists: true, replicaTiers: ["streetKnockoff"] },
      vibe: { menacing: 2, rugged: 1 },
      motto: "",
      lore: "Mil-spec finish on everything from sidearms to plate. Reads competent, funded, and not to be tested.",
      signaturePieces: [],
    },
    arasaka: {
      label: "Arasaka",
      voice: "corporateImperial",
      tier: "luxury",
      styleAffinity: { businesswear: 6, asiaPop: 3 },
      archetypeSignal: { corpo_suit: 6 },
      factionAffinity: { arasaka: 10 },
      heatProfile: 5,
      recognition: "iconic",
      counterfeit: { exists: true, replicaTiers: ["streetKnockoff", "premiumReplica"] },
      vibe: { elegant: 2, menacing: 1, cool: 2 },
      motto: "",
      lore: "The black-and-red letterhead of corporate power. Wearing it is a statement about whose ladder you're on — or whose you robbed.",
      signaturePieces: [],
    },
  },
};

export default BRANDS_CONFIG;
