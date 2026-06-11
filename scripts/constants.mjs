/**
 * constants.mjs — single source of truth for IDs, flag keys, settings keys, enums.
 *
 * Never hardcode any of these strings elsewhere in the codebase. The module id is
 * LOCKED (it is the flag scope, settings namespace, and socket channel) — see CLAUDE.md.
 *
 * Spec: SC-Module-Architecture-Guide.md §5.1
 */

export const MODULE_ID = "night-city-style-over-all";

// Flag keys — never hardcode these strings anywhere else.
export const FLAGS = {
  STYLE_DATA:  "styleData",   // item: the SC metadata blob (§5.2)
  OUTFITS:     "outfits",     // actor: saved outfit presets (§7.4)
  ACTOR_PREFS: "prefs",       // actor: per-character SC settings
  SCENE_STYLE: "sceneStyle",  // scene: { district, gate } tags (§14.8, M7)
};

// Settings keys.
export const SETTINGS = {
  SCHEMA_VERSION:       "schemaVersion",
  CONFIG_DISTRICTS:     "districts",
  CONFIG_FACTIONS:      "factions",
  CONFIG_ARCHETYPES:    "archetypes",
  CONFIG_RATINGS:       "ratings",
  CONFIG_CYBERWARE:     "cyberware",
  CONFIG_COMMENTS:      "comments",
  CONFIG_CREWS:         "crews",
  CONFIG_SCENE_GATES:   "sceneGates",
  CONFIG_STYLE_TEMPLATES: "styleTemplates", // GM quick-dress templates (§14.5, M6)
  CONFIG_UNIFORMS:      "uniforms",     // crew/faction uniforms (§21.2, M6)
  CONFIG_SHOPS:         "shops",        // vendor entities (§21.1, M6)
  CONFIG_TRENDS:        "trends",       // rotating fashion meta (§14.4, M7)
  CONFIG_GARDEN:        "garden",       // Garden ads + event templates (§21.4, M7)
  CONFIG_BRANDS:        "brands",       // brand registry (§13.1, M9.1)
  GARDEN_FEED:          "gardenFeed",   // hidden: rolling event-post store (§21.4)
  TUNABLES:             "tunables",   // GM overrides shadowing tunables defaults (§18)
  ICON_RECOLOR_ENABLED: "iconRecolorEnabled",
  LIVE_REFRESH:         "liveRefresh",
  CONDITION_DYNAMICS:   "conditionDynamics", // combat dirties gear (M7.8)
};

// Bump on every migration (see §5.4). Schema 2 is the current target.
export const CURRENT_SCHEMA = 2;

// Canonical CPR `system.style` values (cyberpunk-red-core clothing styles).
// Pulled from the reference engine; the adapter is the only place that should
// touch the raw CPR path — these keys are the normalized vocabulary.
export const STYLE_KEYS = [
  "genericChic",
  "asiaPop",
  "urbanFlash",
  "leisurewear",
  "businesswear",
  "highFashion",
  "bohemian",
  "bagLadyChic",
  "gangColors",
  "nomadLeathers",
];

// ── Frozen authoring vocabulary (guide §5.2, §27, §28) ──────────────────────
// The Item Style Tab (M4) authors against THIS field set. §26.4: freeze the
// schema before bulk-tagging the catalog so data is entered once. Open-vocab
// lists ship as the suggested set — GMs may add their own keys.

/** Chrome read-categories an item can inject (config cats + the two derived
 *  archetype profiles `display_chrome`/`combat_chrome`; matches archetypes.mjs). */
export const CHROME_READ_KEYS = [
  "visible_chrome",
  "hidden_chrome",
  "fashionware",
  "bioware",
  "borgware",
  "display_chrome",
  "combat_chrome",
];

/** Expressive vibe tags — social TONE, orthogonal to style/archetype (§22.3).
 *  The guide v1.6 nine spokes (confirmed by Christian, M9.1): independent radar
 *  axes, each a tradeoff, covering tone-space by BLENDING (mysterious ≈ high
 *  cool; regal ≈ elegant+cool; wholesome ≈ cute, low sleazy). GM-extensible;
 *  disable-able world-wide. */
export const VIBE_TAGS = [
  "cool", "cute", "sexy", "sleazy", "menacing",
  "flashy", "elegant", "rugged", "scrappy",
];

/** Body regions for the slot model (§27.1). */
export const REGIONS = [
  "head", "eyes", "face", "neck", "torso", "arms",
  "hands", "waist", "legs", "feet", "back", "accessory",
];

/** Suggested `scSlot` vocabulary (§27.6) — open list; GMs add their own.
 *  Specific styles (beret, fedora) are item NAMES with scSlot: hat, not slots. */
export const SC_SLOTS = [
  "hat", "hood", "veil", "glasses", "mirrorshades", "contacts", "mask", "respirator",
  "makeup", "necklace", "choker", "scarf", "tie", "undershirt", "shirt", "overshirt",
  "vest", "jacket", "coat", "cloak", "cape", "harness", "gloves", "wristband", "watch",
  "ring", "nails", "belt", "sash", "chain", "holster", "pants", "skirt", "kilt",
  "shorts", "leggings", "bodysuit", "socks", "shoes", "boots", "bag", "backpack",
  "pin", "badge", "patch", "charm", "implantCover",
];

/** How much a garment hides (modulated by wearMode); §27.6. */
export const COVERAGE = ["none", "partial", "major", "full"];

/** Garment wear state — partly a live toggle (§27.6). Open vocab. */
export const WEAR_MODES = ["open", "closed", "raised", "lowered", "on", "off", "slung", "tucked"];

/** Optional laterality (§27.4). */
export const SIDES = ["left", "right", "pair"];

/** Condition / wear — style penalty until cleaned/repaired (§5.2). */
export const CONDITIONS = ["pristine", "worn", "damaged", "bloodied"];

/** Garment fit (§15) — read quality + conceal potential. */
export const FITS = ["tailored", "offTheRack", "oversized"];

/** Garment modifications (§15.1) — the tailor's "modify clothing" layer.
 *  Mechanical wiring lives in tunables.tailor.modifications. */
export const GARMENT_MODIFICATIONS = [
  "armoredLining", "hiddenPockets", "techIntegration", "reinforced", "distressed",
];

/** Authenticity (§13.4 / §15) — counterfeit play. */
export const AUTHENTICITY = ["genuine", "counterfeit"];

/** Brand tiers (§13.1) — drives perceived cost + the style ceiling. Ordered. */
export const BRAND_TIERS = ["street", "massMarket", "premium", "luxury", "hauteCouture"];

/** Brand recognition (§13.3) — perception-gated brand literacy. Ordered broad→narrow. */
export const BRAND_RECOGNITION = ["iconic", "known", "niche"];

/** Read priority 0–3 — supersedes the boolean statementPiece (§27.6). Index = value. */
export const READ_PRIORITY_LABELS = ["Background", "Normal", "Noticeable", "Statement"];

/** Dress register 0–4 — NOT a vibe (§28). Index = value. */
export const FORMALITY_LABELS = ["Intimate", "Casual", "Street", "Formal", "Ceremonial"];
