# Night City: Style Over All — Architecture & Conversion Guide

**Doc version:** 1.13 · **Date:** June 2026 · **Covers:** conversion from macro Phase 82 (19,719 lines) → FoundryVTT module
**Status:** DECISIONS LOCKED (§3.0) — ready to begin M0
**Module:** title *Night City: Style Over All* · id `night-city-style-over-all` (see §3.0)

> **Changelog v1.13:** added §31 — **Content Ingestion Workflow** (sourcebook → module). Splits the shippable *tool* (importer/schema/originals) from the *content* (canon stays private to the GM's table; original content is publishable). Rides existing import/export + NPC-generator + bulk-tag tooling. Restates the "reworded ≠ original" + monetization/fan-policy boundary.
> **Changelog v1.12:** added §30 — Canonical Data Sources (Night City 2045 sourcebook); faction `identifiers` field; copyright boundary for the public package.
> **Changelog v1.11:** resolved §29.7 tuning decisions (wearMode default open, vibe nudge low, caps on build); added §29.8 aggregation under the expanded slot model.
> **Changelog v1.10:** added §29 — System Integration & Coherence (canonical engine pipeline, two-mode wiring, visibility vs perception filters, precedence rules). Extended Tunables inventory (§18.3).
> **Changelog v1.9:** evaluated an external slot-model review — adopted `wearMode`, `coverage`, `regions[]`, `readPriority`, optional `anchoredTo`, expanded `scSlot` list (§27.6); cut `pairing`; added §28 Formality.
> **Changelog v1.8:** added §27 — Clothing Slots, Layering & Laterality (`scSlot` · `region` · `layer` · `side` over CPR's coarse type).
> **Changelog v1.7:** added §26 — Catalog Authoring & Packaging (compendium, the `sc.*` bridge to author now, lock-schema-before-bulk-entry).
> **Changelog v1.6:** revised the default vibe set (§22.3) to 9 spokes; clarified wealth is a status read, not a vibe; coverage by blending.
> **Changelog v1.5:** extended §23 to weapons & armor (§23.8); added §24 the Lens Toggle (Self ↔ As-Seen-By, applies to the whole read); added §25 Visualization & Readability (vibe radar, gauges, rings, progressive disclosure).
> **Changelog v1.4:** added §1.1 — the **three-layer Conceptual Model** (read-this-first), with three accuracy revisions; added §23 — **Cyberware as a First-Class Style Item**. Schema (§5.2) noted as item-type-agnostic.
> **Changelog v1.3:** added §22 — Brand & Clothing Prominence and the Vibe Axis (cool/cute/sexy/sleazy), with anti-convolution guardrails. Schema (§5.2) gains `vibe` + `brand`.
> **Changelog v1.2:** selected features promoted (§21) — Shops as Entities (real-item RollTables), Crew/Faction Uniforms, Universal GM Editability & Import/Export, and **The Garden** social network. Added Integration & UX Principles (§21.0), decision D7 (Garden feedback loop), and v1.2 phase integration (§21.5). Parked: Spotify, vehicle-as-style.
> **Changelog v1.1:** decisions D1–D5 + open questions locked (§3.0, §11); module renamed; added four design systems — Brand System (§13), GM Configuration & Control (§14), Expanded Clothing Attributes (§15), Quick-Perceive Style Reads (§16); plus Formula Customization (§18) and In-UI Transparency (§19); phase integration revised (§17, §20).

---

## 0. How to Use This Document

This is the master plan for converting the Style Checker macro into a proper FoundryVTT module. It serves three jobs:

1. **The plan of record.** Phases, architecture, schemas, and decisions live here. When we disagree with the doc, we update the doc.
2. **Prompt context for new conversations.** Paste the block below (or the whole doc) into a fresh Claude chat to resume work mid-conversion.
3. **The contract between phases.** Each module phase (M0–M9) has explicit "done when" criteria so we always know where we are.

### Project Context (Give This to Claude First)

> I'm converting my **Style Checker** macro for **Foundry VTT** (Cyberpunk RED system, `cyberpunk-red-core`) into a full module. The macro is ~20k lines (Phase 82): style/archetype detection, heat index, disguise planner, faction tensions, budget planner, crew system, GM dashboard — all driven by equipped items, `sc.*` Active Effect keys, and JSON config stored in journal entries. The module conversion follows the **SC-Module-Architecture-Guide.md** in project knowledge: flags replace `sc.*` AEs for metadata, world settings replace journals, the engine is extracted into pure ES modules, and new UI includes an injected Item Style Tab and a Wardrobe App. Current module phase: **M__**. Read the guide before proposing changes.

---

## 1. Vision

**What the module is:** the same Style Checker the table already knows — same scoring, same balance, same five player tabs and four-plus GM tabs — repackaged as installable software with proper data storage, proper item authoring, and new UI that the macro architecture could never support.

**What stays the same:**
- All engine math: archetype weights, asymmetric penalties, primary style gates, heat baselines, disguise confidence, district fit, danger score
- The `sc.*` Active Effects vocabulary (as a permanently supported compatibility layer)
- The spreadsheet → Apps Script → import authoring pipeline (it becomes the *authoring* tool; the module ships *distribution*)
- Discord-driven, phase-numbered development

**What changes:**

| Macro era | Module era |
|---|---|
| 20k-line paste into macro editor to deploy | `git push` → GitHub release → players click update |
| JSON-in-`<pre>`-tags inside 7 journals | Versioned world settings + automatic migrations |
| Hand-typed `sc.*` Active Effect keys | Item sheet **Style Tab** with dropdowns + live cascade preview |
| Stale journal data silently breaking detection | `schemaVersion` + migration framework + auto-backup |
| Re-open the app to see changes | Hooks + sockets: live refresh, GM push, chat cards |
| Items styled by description only | **Color system** with mechanical effects + SVG icon recoloring |
| Equip items one at a time on the sheet | **Wardrobe App**: slot grid, live impact preview, one-click outfit presets |

---

### 1.1 Conceptual Model — read this first

The system has **three layers.** Keeping them distinct is the single best defense against the "axis-proliferation" confusion (a pile of overlapping numbers nobody can read). *(Rendered as a diagram in the working chat; this text is the canonical version. It refines the first sketch in three ways — flagged below.)*

**Layer 1 — Inputs.** Two kinds, and the distinction matters:
- **Character state** (what you have/are): clothing — each piece carrying its own genre/style, brand, vibe tags, color, condition, cost — plus cyberware/chrome, weapons, armor, faction tags, role, wounds, and body + social stats (COOL, grooming, wardrobe, reputation).
- **Context & observer** (the situation the read is judged in): the district/scene, active trends, and crucially **who is looking** — their faction, expectations, perception roll, and the district's hostility.

**Layer 2 — Characterization (how the look *reads*).**
- **Authored axes** — set on items, then aggregated: **Genre** (CPR style: asiaPop, urbanFlash…) and **Vibe** (tone tags: cool/cute/sexy/sleazy…).
- **Derived reads** — computed by the engine from the inputs: **Archetype** (who you read as: corpo, nomad, ripperdoc), and alongside it the **faction/affiliation read** (which org you align with) and **perceived status/wealth**. Archetype is the headline, but it is *one of several* derived reads, not the only one.
- Mantra: **Genre = aesthetic · Vibe = tone · Archetype = identity.** You author the first two; the rest emerge.

**Layer 3 — Consequences (what it *means*), plus one lens.**
- **Computed values:** **Heat** (attention drawn), **Danger** (threat read), **Disguise confidence** (can you pass — *relational*), **District fit** (do you belong), and **Social/Garden/reputation**.
- **The lens — Perception.** Perception is **not** a peer consequence. It is the *observer's filter* that governs how much of Layers 2–3 they actually receive, gated by their INT + Perception vs your COOL. It sits *between* you and the observer — everything else is what's there to be seen; perception decides how much gets seen.

**The relationships that matter:**
1. You **author** Genre and Vibe; Archetype and the other reads **emerge**.
2. Layer 3 draws on **all of Layer 1 plus the Layer 2 axes — not the three axes alone.** Heat and danger especially are driven mostly by weapons, armor, visible chrome, flash/cost, faction, and colors; the axes contribute but don't dominate.
3. **Half the system is relational.** Disguise confidence, faction tension, and reaction depend on the *observer + context*, not on you in isolation — "can I pass *to this faction, in this district*," not "am I disguised."

**One-line summary:** the three axes are the **portrait**; heat, danger, disguise, and district fit are **consequences** the engine computes from that portrait *plus* your gear, stats, where you stand, and who's looking.

**The three revisions** over the first sketch, for the record: (a) **perception is a lens, not an output** — it filters visibility rather than emitting a value; (b) **inputs split into character vs context/observer** — because the relational outputs need the observer; (c) **archetype is one of several derived reads** — the clean triad is the teaching frame, but the engine also derives faction-affiliation and status.

---

## 2. Current State Audit (Phase 82)

Ground truth for the conversion. Line numbers refer to `stylechecker2_0_Phase82.js`.

### 2.1 Class Map

| Class | Lines | Role | Module destination |
|---|---|---|---|
| `StyleDataManager` | 16–5863 | Journal storage + **all default config data** (districts, factions, comments, cyberware, ratings/archetypes, crews, scene gates) | Split: storage logic → `data/`, default data → `config/*.mjs` |
| `CyberwareAnalyzer` | 5864–6151 | Chrome categorization, threat levels, `sc.chrome.*` reads | `engine/cyberware.mjs` |
| `StyleRatingCalculator` | 6152–8297 | The core engine: collectors, `getEffectiveStats`, style counts, archetype detection, heat, danger, `collectDisguiseModifiers` (8125) | `engine/` (split into ~5 files) |
| `PerceptionGate` | 8298–8551 | INT+Perception scan tiers, COOL counter-scan | `engine/perception.mjs` |
| `SceneAnalyzer` | 8552–8867 | Scene-wide token analysis | `engine/scene.mjs` |
| `CrewAnalyzer` | 8868–9542 | Crew rosters, aggregate reads | `engine/crew.mjs` |
| `GMDashboardApp` | 9543–11259 | 5 GM tabs: readout, scene, gate, disguise, tension | `apps/gm-dashboard.mjs` |
| `RecommendationEngine` | 11260–12055 | Budget planner, slot-first engine, Fixer's Notes | `engine/recommendations.mjs` |
| `CharacterSelectorDialog` | 12056–12229 | Actor picker | `apps/character-selector.mjs` |
| `StyleCheckerApp` | 12230–19719 | 5 player tabs: profile, chrome, gear, crew, social | `apps/style-checker.mjs` |

Roughly **30% of the file is config data** (the default journal payloads inside `StyleDataManager`), not logic. That data becomes plain ES module exports — the single biggest, lowest-risk size reduction.

### 2.2 Storage Today

Seven journals in a "Style Checker" folder, each holding JSON inside a `<pre>` tag, parsed with regex + entity-unescaping on every read:

`Districts Data` · `Social Comments` · `Cyberware Config` · `Style Ratings` · `Factions Config` · `Crew Config` · `Scene Gates`

Known hazards (documented across Phases): stale journal saves missing newer keys (mitigated today by per-read backfill loops), no version stamp, players can't write (GM-only journal updates), and human edits can silently break JSON.

### 2.3 Item Data Today

- **CPR native fields read:** `system.equipped`, `system.style` (asiaPop, urbanFlash, …), `system.type` (slot), `system.price.market`, `system.concealable.*`, weapon/armor/cyberware schemas
- **SC custom layer:** Active Effects with `sc.*` keys (`sc.faction.*`, `sc.archetype.*`, `sc.style.*`, `sc.district.*`, `sc.chrome.*`, `sc.cost`, `sc.armor`, `sc.heat`, `sc.disguise.dc`, `sc.antiStyle.suppress`), collected by `collectDisguiseModifiers` and injected as **virtual data** into the pipeline
- **Stat-touching AEs:** `bonuses.cool` etc. — these are *real* CPR mechanics and must remain Active Effects forever

> The virtual-injection design in `collectDisguiseModifiers` is the most important existing asset for the module: it proves the engine already accepts simulated inputs. The Wardrobe App's live preview is the same trick pointed at a hypothetical equipped set.

---

## 3. Decision Points

### 3.0 LOCKED DECISIONS (v1.1) ✅

| # | Decision | Locked value |
|---|---|---|
| D1 | Module identity | **title:** "Night City: Style Over All" · **id:** `night-city-style-over-all` ✅ *slug CONFIRMED* |
| D2 | Foundry target | **V12 primary**, architecture forward-compatible to **V13 → V14**; AppV2 prep stays isolated in `apps/` |
| D3 | Storage backend | World settings as source of truth; journals demoted to auto-backup/export |
| D4 | `sc.*` compatibility | Dual-read forever; flags win conflicts; AE→flag migrator tool |
| D5 | Dependencies | None hard; `socket: true` from day one; libWrapper optional if ever needed |
| Q2 | Repository | **New public GitHub repo** (drives auto-update manifest + Actions in M8) |
| Q4 | Catalog icons | **Ship our own monochrome sentinel-fill icon set** as the first-class color path; stock-icon recolor = best-effort fallback (§9.1) |
| Q5 | Wardrobe timing | **Read-only Wardrobe at M2/M3 as the engine-parity test harness**; full editable Wardrobe at M6 (§17) |
| Q6 | Distribution | **GitHub** (manifest + releases) **+ Patreon** (funding/announcements, optional early-access for patrons); no Foundry registry listing required |

> **One-way-door note (settled):** the id is the flag scope (`flags["night-city-style-over-all"]`), settings namespace, and socket channel. Confirmed as `night-city-style-over-all` and applied throughout this doc and `module.json`. It is now fixed for the life of the module.

---

The rationale below is retained for the record.

### D1 — Module identity (LOCKED → §3.0)
Title *Night City: Style Over All*, id `night-city-style-over-all`. Title and id differ on purpose: the title is cosmetic and free to change; the id is the permanent technical scope.

### D2 — Foundry target: V12 now, V13-ready architecture
Your world runs V12. The port keeps `Application` (V1) wrappers — zero behavioral risk — but enforces the engine/UI split so the eventual ApplicationV2 migration (M9) only touches `apps/`. Before any V13 world upgrade, verify `cyberpunk-red-core`'s current V13 support status.
**Recommendation:** `compatibility: { minimum: "12", verified: "12" }`; AppV2 deferred to M9.

### D3 — Storage backend: world settings, journals demoted to backups
Config moves to `game.settings` (world scope, `config: false`) behind a `DataStore` facade. Journals get a second life as the **backup/export format**: before every migration, the module snapshots current settings into a timestamped journal page — human-readable, restorable, and it preserves the GM habit of inspecting data in journals.
**Recommendation:** settings as source of truth; auto-backup journals; an Export/Import button in module settings.

### D4 — `sc.*` AE compatibility: dual-read forever, flags win on conflict
Items in the wild (and the whole batch pipeline) speak `sc.*`. The collector reads **both** flags and `sc.*` AEs permanently. Precedence: if an item has SC flags, its `sc.*` AEs are ignored (prevents double-counting after migration). A migrator tool converts AEs → flags per-item, per-folder, or world-wide, and reports conflicts. Stat-changing AEs (`bonuses.*`, `system.stats.*`) are never touched.
**Recommendation:** as stated. The batch exporter gains a flags output mode in M3, but `sc.*` columns keep working.

### D5 — Dependencies: none hard, libWrapper optional later
Sheet-tab injection works through plain `renderItemSheet` hooks — no patching needed. If we ever must wrap CPR system methods (unlikely before M7), add libWrapper as an *optional* relationship then.
**Recommendation:** zero hard dependencies. `socket: true` in the manifest from day one (free to declare, needed by M7).

---

## 4. Target Architecture

### 4.1 The Layer Rule

```
┌────────────────────────────────────────────────────────┐
│  INTEGRATION   hooks.mjs · sockets.mjs · api.mjs       │  talks to Foundry events,
│                token-hud.mjs · chat-cards.mjs          │  other modules, players
├────────────────────────────────────────────────────────┤
│  APPLICATIONS  style-checker · gm-dashboard ·          │  windows & sheet tabs;
│  (UI only)     wardrobe · item-style-tab · selector    │  render data, emit intents
├────────────────────────────────────────────────────────┤
│  ENGINE        profile · archetypes · heat · disguise  │  PURE: data in → data out.
│  (pure)        perception · scene · crew · recs ·      │  No DOM. No ui.*. No game.*
│                cyberware · ratings                     │  reads — context is passed IN
├────────────────────────────────────────────────────────┤
│  DATA          data-store · flags · migrations/ ·      │  settings, flags, journal
│                cpr-adapter · config/ (defaults)        │  backups, schema versions
└────────────────────────────────────────────────────────┘
```

**The Engine Rule (non-negotiable):** engine functions receive a plain context object and return plain objects. No `game.*` lookups, no `ui.notifications`, no jQuery inside `engine/`. This is what buys us: Wardrobe live preview (run the engine on hypothetical inputs), the public API, socket payloads, and — someday — unit tests outside Foundry.

**The Explainability Rule (added v1.1, decide before M2):** engine functions return **explainable results**, not bare numbers — `{ value, label, blurb, components: [{ term, value, source }], tunablesApplied: {…} }`. And every formula constant is read from the **Tunables config** (§18), never inlined. These two together make *both* customization (§18) and in-UI documentation (§19) first-class instead of bolted-on: the UI renders breakdowns from the components, the help system reads definitions from the same metadata, and changing a tunable updates the number *and* its explanation automatically. This must be baked in as the engine is extracted in M2 — retrofitting explainability onto bare-number functions later is a rewrite, not an edit.

**The CPR Adapter Rule:** every read of a CPR system data path (`system.equipped`, `system.style`, `system.price.market`, role paths, stat paths…) goes through `data/cpr-adapter.mjs`. When a cyberpunk-red-core update moves a field, we fix **one file**. This is the single best insurance policy a system-dependent module can buy.

### 4.2 Repository / Folder Structure

```
night-city-style-over-all/
├── module.json
├── README.md · CHANGELOG.md · LICENSE
├── scripts/
│   ├── main.mjs                  # entry: init/ready hooks, registrations
│   ├── constants.mjs             # MODULE_ID, flag keys, enums — single source
│   ├── data/
│   │   ├── data-store.mjs        # settings-backed config store (facade)
│   │   ├── flags.mjs             # typed get/set helpers for item & actor flags
│   │   ├── cpr-adapter.mjs       # ALL cyberpunk-red-core data-path reads
│   │   ├── backup.mjs            # snapshot settings → journal, restore
│   │   └── migrations/
│   │       ├── index.mjs         # ordered runner (see §5.4)
│   │       ├── 001-journals-to-settings.mjs
│   │       └── 002-sc-effects-to-flags.mjs   # the migrator tool backend
│   ├── config/                   # former journal default payloads, as code
│   │   ├── districts.mjs · factions.mjs · archetypes.mjs
│   │   ├── ratings.mjs · cyberware.mjs · comments.mjs
│   ├── engine/
│   │   ├── collect.mjs           # item/AE/flag collection → normalized input
│   │   ├── profile.mjs           # style distribution, archetype detection
│   │   ├── heat.mjs · danger.mjs · disguise.mjs · perception.mjs
│   │   ├── districts.mjs · scene.mjs · crew.mjs
│   │   ├── recommendations.mjs   # budget planner
│   │   └── cyberware.mjs
│   ├── apps/
│   │   ├── style-checker.mjs · gm-dashboard.mjs
│   │   ├── wardrobe.mjs          # NEW — §7
│   │   ├── item-style-tab.mjs    # NEW — sheet injection, §8
│   │   └── character-selector.mjs
│   ├── services/
│   │   ├── icon-color.mjs        # SVG recolor service — §9
│   │   ├── outfits.mjs           # preset save/equip engine — §7.4
│   │   └── sockets.mjs · chat-cards.mjs · api.mjs
│   └── hooks/
│       ├── item-hooks.mjs        # updateItem live refresh
│       ├── scene-hooks.mjs       # district flags, gate auto-arm
│       └── token-hud.mjs
├── templates/                    # Handlebars, extracted opportunistically
│   ├── style-checker/ · gm-dashboard/ · wardrobe/ · item-style-tab/
│   └── partials/                 # stat chips, archetype bars, item rows
├── styles/
│   └── style-checker.css         # extracted from inline <style> blobs
├── packs/                        # compiled compendia (M8) — gitignored
├── packs-src/                    # JSON source for compendia (committed)
├── lang/en.json
└── tools/
    └── build-packs.mjs           # @foundryvtt/foundryvtt-cli wrapper
```

### 4.3 module.json (M0 version)

```json
{
  "id": "night-city-style-over-all",
  "title": "Night City: Style Over All",
  "description": "Archetype detection, heat index, disguises, district fit, a living brand economy, wardrobe management, and a full GM dashboard. Reads your equipped gear and tells you who Night City thinks you are.",
  "version": "0.1.0",
  "compatibility": { "minimum": "12", "verified": "12" },
  "relationships": {
    "systems": [{ "id": "cyberpunk-red-core", "type": "system", "compatibility": {} }]
  },
  "esmodules": ["scripts/main.mjs"],
  "styles": ["styles/style-checker.css"],
  "languages": [{ "lang": "en", "name": "English", "path": "lang/en.json" }],
  "packs": [],
  "socket": true,
  "authors": [{ "name": "Christian" }],
  "url": "https://github.com/<you>/night-city-style-over-all",
  "manifest": "https://github.com/<you>/night-city-style-over-all/releases/latest/download/module.json",
  "download": "https://github.com/<you>/night-city-style-over-all/releases/latest/download/module.zip"
}
```

> `manifest` pointing at `releases/latest` lets Foundry's updater find new versions automatically; each release's zip also contains its own pinned `module.json`.

---

## 5. Data Schemas

### 5.1 Constants — Single Source of Truth (`constants.mjs`)

```js
export const MODULE_ID = "night-city-style-over-all";

// Flag keys — never hardcode these strings anywhere else
export const FLAGS = {
  STYLE_DATA: "styleData",     // item: the SC metadata blob (§5.2)
  OUTFITS:    "outfits",       // actor: saved outfit presets (§7.4)
  ACTOR_PREFS:"prefs",         // actor: per-character SC settings
};

// Settings keys
export const SETTINGS = {
  SCHEMA_VERSION: "schemaVersion",
  CONFIG_DISTRICTS: "districts",
  CONFIG_FACTIONS: "factions",
  CONFIG_ARCHETYPES: "archetypes",
  CONFIG_RATINGS: "ratings",
  CONFIG_CYBERWARE: "cyberware",
  CONFIG_COMMENTS: "comments",
  CONFIG_CREWS: "crews",
  CONFIG_SCENE_GATES: "sceneGates",
  ICON_RECOLOR_ENABLED: "iconRecolorEnabled",
  LIVE_REFRESH: "liveRefresh",
};

export const CURRENT_SCHEMA = 2;   // bump on every migration

// Style categories already used by the engine (CPR system.style values)
export const STYLE_KEYS = ["asiaPop", "urbanFlash", /* …full list pulled from engine */];
```

### 5.2 Item Style Flag — `flags["night-city-style-over-all"].styleData`

The flag blob replaces hand-typed `sc.*` AEs for **metadata** (never for stat changes). Every field is optional; absence means "no signal." This flag is **item-type-agnostic** — it attaches to clothing, **cyberware**, and optionally gear/weapons/armor (§23), not clothing alone.

```js
{
  schema: 2,                       // per-item schema stamp for targeted migration

  // Identity signals — mirror the sc.* vocabulary 1:1
  faction:   { tyger_claws: 25 },  // sc.faction.*  (full cascade)
  archetype: { ripperdoc: 15 },    // sc.archetype.* (medium cascade)
  style:     { asiaPop: 3 },       // sc.style.*    (flat)
  district:  { kabuki: 5 },        // sc.district.* (flat)
  chrome:    { display_chrome: 2 },// sc.chrome.*   (flat)
  cost: 3000,                      // sc.cost
  armor: -1,                       // sc.armor
  heat: -5,                        // sc.heat
  disguiseDc: 4,                   // sc.disguise.dc
  antiStyleSuppress: 0.7,          // sc.antiStyle.suppress (clamp 0–1)

  // NEW v1.3 — brand (§13 registry key; broad cascade source: style+cost+heat+vibe+recognition)
  brand: "ofuda",

  // NEW v1.3 — expressive vibe tags (cool/cute/sexy/sleazy…), GM-defined set (§22.3).
  // ORTHOGONAL to style (genre) and archetype (identity): this layer is social TONE.
  // A profile with tradeoffs, not a "more is better" score (menacing helps intimidation,
  // hurts approachability; sleazy reads untrustworthy). Optional — disable-able world-wide.
  vibe: { cool: 3, menacing: 2 },

  // NEW v1.7 — slot model (layered OVER CPR's coarse system.type, never replacing it; §27)
  scSlot: "cape",      // precise garment: cape, hood, skirt, scarf, gloves, belt, necklace, watch…
  region: "torso",     // head·eyes·face·neck·torso·arms·hands·waist·legs·feet·back·accessory
  layer: 2,            // ordinal within region (0 base → outer); covered layers don't read (§27.3)
  side: "pair",        // OPTIONAL laterality: left | right | pair (§27.4)

  // NEW v1.9 — wear state + coverage (make "covered doesn't read" precise; §27.6)
  wearMode: "closed",  // partly a LIVE toggle: open|closed · raised|lowered · on|off · slung · tucked
  coverage: "major",   // how much it hides: none | partial | major | full (modulated by wearMode)
  regions: ["torso","arms","back"],  // ALL regions covered (region above = primary, for sorting)
  readPriority: 1,     // 0 background · 1 normal · 2 noticeable · 3 statement (supersedes statementPiece §15)
  anchoredTo: null,    // OPTIONAL: garment/region a small item attaches to (inherits its visibility)
  formality: 2,        // dress register, NOT a vibe (§28): 0 intimate·1 casual·2 street·3 formal·4 ceremonial

  // NEW — color system (§9). Mechanical, not just cosmetic.
  colors: {
    primary:  "#1a2b6d",
    accent:   "#ff2a6d",
    recolorIcon: true,             // opt-in SVG tint for THIS item
    recoloredImgPath: null         // set after FilePicker.upload(); null = inline only
  },

  // NEW — condition/wear (§ future). Style penalty until cleaned/repaired.
  condition: "worn",               // pristine | worn | damaged | bloodied

  // Provenance — lets us trace data origin during migration/debug
  _source: "migrated-from-ae"      // null | "manual" | "batch" | "migrated-from-ae"
}
```

**Precedence (D4):** if `styleData` exists on an item, the collector ignores that item's `sc.*` AEs entirely. One source per item, no double-count.

### 5.3 Config Schema (settings, was journals)

Each config key holds the same JSON shape the journals hold today — lifted verbatim from `StyleDataManager.getDefault*Data()` into `config/*.mjs` as the seed. The only addition is a top-level `schema` field so each config blob can be migrated independently.

```js
// config/factions.mjs
export const DEFAULT_FACTIONS = { schema: 2, /* …existing faction payload… */ };
```

`DataStore.get(key)` returns the stored setting if present, else the `config/` default, and **deep-merges missing keys from the default** — this replaces the per-read backfill loops scattered through `StyleDataManager` today, in one place.

### 5.4 Migration Framework

The answer to "stale journal data is a recurring hazard." Runs once on `ready`, GM-only, idempotent, backs up first.

```js
// migrations/index.mjs
const MIGRATIONS = [
  { to: 1, fn: journalsToSettings },   // read old journals → write settings
  { to: 2, fn: scEffectsToFlags },     // (item-level, also exposed as manual tool)
];

export async function runMigrations() {
  if (!game.user.isGM) return;
  const from = game.settings.get(MODULE_ID, SETTINGS.SCHEMA_VERSION) ?? 0;
  if (from >= CURRENT_SCHEMA) return;

  await Backup.snapshot(`pre-migration-v${from}-to-v${CURRENT_SCHEMA}`);
  for (const m of MIGRATIONS.filter(m => m.to > from)) {
    ui.notifications.info(`Style Checker: migrating to schema v${m.to}…`);
    await m.fn();                       // must be safe to re-run
  }
  await game.settings.set(MODULE_ID, SETTINGS.SCHEMA_VERSION, CURRENT_SCHEMA);
  ui.notifications.info("Style Checker: data up to date.");
}
```

**Migration 001** detects the seven legacy journals, parses them with the *existing* regex/unescape logic (ported as-is from `_readJournal`), writes the result into settings, then renames the journals `[ARCHIVED] …` rather than deleting them.

**Migration 002** is also the user-facing migrator (D4): iterate items (scope-selectable), read `sc.*` AE changes, build a `styleData` blob, set the flag, tag `_source:"migrated-from-ae"`, leave the AEs in place but now-ignored, and produce a report of conflicts/skips.

---

## 6. Conversion Phases (M0–M9)

Phases are sized so each ends with a **working module you could hand to the table** — never a half-broken intermediate. "Macro Phase 82" behavior is the regression baseline throughout.

### M0 — Scaffold & Smoke Test
**Goal:** a loadable, do-nothing module.
- Repo, `module.json` (§4.3), `main.mjs` with init/ready logging, `constants.mjs`, empty `DataStore`, `lang/en.json`, CSS file.
- Symlink/install into the V12 data folder; confirm it loads with no console errors alongside cyberpunk-red-core.
**Done when:** module appears in Manage Modules, activates clean, logs its version on ready.

### M1 — Data Layer & Migration 001
**Goal:** config lives in settings; old worlds migrate silently.
- Port every `getDefault*Data()` payload into `config/*.mjs`.
- Build `DataStore` (get/set + deep-merge defaults), register all settings.
- Build `Backup` (snapshot/restore to journal).
- Write Migration 001; wire `runMigrations()` into `ready`.
- Module-settings UI: Export/Import config, "Restore from backup," "Re-run migration."
**Done when:** a copy of your live world, on first load, reproduces all current config in settings, archives the journals, and the engine (still the macro, reading via a temporary shim) sees identical data.

### M2 — Engine Extraction ⭐ the big lift
**Goal:** the macro's logic becomes pure ES modules; behavior byte-identical.
- Move classes → `engine/` files per §4.1. Strip all `game.*`/`ui.*`/jQuery from them; those become **inputs** (context object) and **return values**.
- Stand up `cpr-adapter.mjs`; route every CPR field read through it.
- Build `collect.mjs`: one normalized "equipped set + stats + flags + AEs" input object that every engine function consumes — including the `collectDisguiseModifiers` virtual-injection logic (macro line 8125), now generalized to accept hypothetical sets (this is what M7's Wardrobe preview calls).
- Keep the macro's apps temporarily calling the new engine to validate parity.
**Done when:** for a set of saved test actors, every number (style score, archetype ranking, heat, danger, disguise %, district fit) matches Phase 82 exactly. This is the regression gate for the whole project.

### M3 — Player & GM Apps Ported
**Goal:** real module windows replace the macro's apps.
- Port `StyleCheckerApp` (5 tabs) and `GMDashboardApp` (5 tabs) into `apps/`, rendering from engine output.
- Extract the largest inline `<style>` blocks → `styles/style-checker.css`; opportunistically move the heaviest HTML strings → Handlebars. (Full templating is not required to ship — do it where it reduces pain most.)
- Launch points: scene control button (GM dashboard), actor-sheet header button (player app), `/sc` chat command.
- Batch exporter gains optional **flags output mode** (still emits `sc.*` too).
**Done when:** the table can uninstall the macro and use only the module with no lost functionality.

### M4 — Item Style Tab ⭐ kills the AE workflow
**Goal:** author item style data with dropdowns, not typed keys. (§8)
- `renderItemSheet` injection adds a **Style** tab to clothing/gear/armor/cyberware sheets.
- Controls: faction / archetype / style / district / chrome pickers (populated from config), cost / heat / armor / disguise-DC / suppress inputs, **color pickers**, condition.
- **Live cascade preview** in the tab: run the engine on this single item, show the derived style/chrome/cost it contributes ("this jacket reads +25 Tyger Claw → asiaPop +X, displayChrome +Y, cost +Z").
- Writes `styleData` flag; reads back on open.
**Done when:** a new clothing item can be fully styled without ever opening the Effects tab, and an existing `sc.*` item shows its values in the tab (read-through) with a one-click "convert to flags" action (Migration 002, single-item).

### M5 — Migration 002 & Compatibility Hardening
**Goal:** the world's existing `sc.*` items become flag-based on demand.
- Finish the world/folder/item-scoped migrator UI with conflict reporting.
- Confirm dual-read precedence (D4) across the whole engine; add the parity test for "AE item" vs "migrated flag item" producing identical reads.
- Document the supported `sc.*` ↔ flag mapping in README.
**Done when:** running the migrator on the live world changes storage but not a single computed result.

### M6 — Wardrobe App ⭐ your requested feature (§7)
**Goal:** fast clothing management with live stat impact.
- Slot grid (head, body, jacket, legs, feet, eyewear, accessories ×N), current outfit panel, reserve/owned panel.
- Add/equip/unequip/swap inline; **live preview** of the resulting style profile, archetype shift, heat, district fit, disguise confidence — all from the engine's hypothetical-set path (M2).
- Color/coordination readout (M9 color math feeds in here once available; ships first with monochrome).
- Outfit **presets**: save current as named outfit, one-click equip whole outfit, "equip this disguise" handoff from the budget/disguise planner.
**Done when:** a player can build, preview, save, and apply an outfit from one window without the CPR sheet.

### M7 — Live Layer: Hooks, Sockets, Chat, Token HUD
**Goal:** the system reacts in real time and reaches the table.
- `updateItem` (equip changes) → refresh open SC/Wardrobe windows; optional token floating text.
- Sockets: GM dashboard pushes scan results / scene-gate verdicts / heat changes to the relevant player live.
- Chat cards: perception-gated style read, scene-gate result, social-feed posts — collapsible, themed.
- Token HUD / right-click: "Scan Style" (perception-gated, whispered result).
- Scene flags: tag scene → district; gates auto-arm on scene activation.
**Done when:** a GM can run a scene-gate check and the affected players see their result without opening anything.

### M8 — Compendium Packs & Distribution
**Goal:** ship the catalog; one-click install/update.
- `packs-src/` JSON (Ofuda, Brass Lotus, …) pre-flagged with `styleData`; `tools/build-packs.mjs` compiles to LevelDB packs via the Foundry CLI.
- GitHub Actions: on tag, zip the module + pinned `module.json`, attach to release; `manifest`/`download` resolve to `releases/latest`.
- README, CHANGELOG, install instructions, the `sc.*`↔flag table, screenshots.
**Done when:** a fresh world installs the module by manifest URL, gets the compendium, and updates via Foundry's updater.

### M9 — Color Math, Polish & AppV2 Readiness
**Goal:** colors become mechanical; prep for the future.
- Implement color/coordination scoring (§9.2): palette match → Wardrobe & Style, faction colorway reads, district palette fit, clash → anti-style.
- SVG recolor service productionized (§9.1): inline tint everywhere, opt-in baked-file upload, raster `hue-rotate` fallback.
- Settings for archetype weights / heat baselines / scan DCs (tuning without code edits).
- Public API + custom hooks (`api.mjs`); fire `styleCheckerScanComplete` etc.
- Where AppV2 migration is low-risk, do it; otherwise document the path (D2).
**Done when:** matched colors measurably move scores, the catalog icons tint to their colorway, and other macros can call `game.modules.get("night-city-style-over-all").api`.

### Sequencing Rationale
M1→M2→M3 front-loads the **risk** (storage, then the engine parity gate, then UI parity) so the scary refactor is done while the macro still exists as a reference. M4/M5 retire the AE workflow. M6 (Wardrobe) deliberately lands *after* the engine's hypothetical-set path exists — building it on the macro would mean rebuilding it. M7+ are additive: each ships standalone value and can reorder around Discord demand without architectural penalty.

---

## 7. Wardrobe App — Design Detail

### 7.1 Purpose
A dedicated window for managing a single actor's clothing fast, with the style consequences visible *before* committing. Today equipping is one-item-at-a-time on the CPR sheet with no feedback until the Style Checker is reopened. The Wardrobe collapses author → preview → apply into one surface.

### 7.2 Layout (3 columns)
- **Left — Slot Grid:** one cell per clothing slot (head, body, jacket, legs, feet, eyewear, + accessory slots). Each cell shows the equipped item's (recolored) icon, name, and its headline contribution chip (e.g., "+25 Tyger Claw"). Empty cells invite a pick.
- **Center — Live Profile:** the engine's output for the *previewed* set — top archetypes with bars, primary style, heat gauge, district fit for the active scene's district, danger score. Updates on every hover/stage action (debounced).
- **Right — Closet:** owned/reserve clothing filtered by the focused slot, searchable; click to stage into the slot (preview only) or commit (writes `system.equipped`).

### 7.3 Preview vs Commit
- **Stage** = build a hypothetical equipped set in memory, run the engine's hypothetical-set path (M2 `collect.mjs`), render center column. Zero writes.
- **Commit** = apply staged changes to actual `system.equipped` values in one batched `actor.updateEmbeddedDocuments` call; live hooks (M7) refresh other windows.
- A "dirty" indicator + Apply/Revert when staged ≠ equipped.

### 7.4 Outfit Presets (`flags…outfits`)
```js
// actor flag: array of presets
[{
  id, name: "Kabuki Night Out", icon,
  items: [{ itemId, slot }],          // resolves at apply-time; missing items flagged
  note: "disguise: Tyger Claw, low heat"
}]
```
- Save current outfit, rename, delete, reorder.
- **Apply outfit** = stage all → commit.
- **Handoff target:** the budget planner / disguise detector can emit a preset ("here's the disguise I recommend") that drops straight into the Wardrobe as a stage-able outfit, closing the loop between *recommendation* and *action*.

---

## 8. Item Style Tab — Design Detail

### 8.1 Injection
`Hooks.on("renderItemSheet", (app, html, data) => …)` — guard on `app.item.type ∈ {clothing, gear, armor, cyberware}` and on the CPR system being active. Add a tab button + tab body; bind change handlers that write `styleData`. (V13/AppV2 note per D2: injection mechanics differ; isolated to this file.)

### 8.2 Controls → flag fields
| UI control | Writes | Source of options |
|---|---|---|
| Faction select + strength | `styleData.faction` | `config/factions` |
| Archetype select + strength | `styleData.archetype` | `config/archetypes` |
| Style multi-add | `styleData.style` | `STYLE_KEYS` |
| District select + value | `styleData.district` | `config/districts` |
| Chrome select + value | `styleData.chrome` | `config/cyberware` cats |
| Cost / Heat / Armor / DiscDC / Suppress | scalar fields | — |
| **Color pickers** (primary/accent) + "recolor icon" | `styleData.colors` | §9 |
| Condition | `styleData.condition` | enum |

### 8.3 Live Cascade Preview
A read-only panel inside the tab runs the engine on *this item alone* and prints the derived effects, so authors see what a faction key actually cascades into ("Tyger Claw 25 → asiaPop +X, urbanFlash +Y, displayChrome +Z, cost +N, +DC"). This is the macro's cascade logic surfaced as an authoring aid — it also doubles as living documentation of the cascade tables.

### 8.4 sc.* read-through
If the item has no `styleData` but has `sc.*` AEs, the tab displays those values (read-only, sourced from the AEs) with a **"Convert to Style Data"** button → single-item Migration 002. After conversion the AEs remain but are ignored (D4), and the tab becomes editable.

---

## 9. Color System — Design Detail

### 9.1 SVG Icon Recoloring
**Feasibility: confirmed.** CPR ships SVG icons (the readme's auto-image tables are all `.svg`), and SVGs are editable text.

Pipeline:
1. `fetch(item.img)` → SVG source text.
2. Recolor by **placeholder convention** (preferred): SC-authored catalog icons use sentinel fills — `#FF00FF` → `colors.primary`, `#00FFFF` → `colors.accent` — so recolor is a precise string swap. For stock icons with arbitrary fills, fall back to tinting the dominant fill/stroke or to filter mode.
3. **Display** two ways:
   - *Inline* (default, zero persistence): SC's own UI renders the recolored SVG string directly. No file writes; perfect for previews and the Wardrobe.
   - *Baked* (opt-in `colors.recolorIcon` + persistence): `FilePicker.upload()` the recolored SVG to a world folder, set `styleData.colors.recoloredImgPath`, optionally point `item.img` at it so the tint shows on the CPR sheet, sidebar, and chat too.
4. **Raster fallback:** non-SVG icons get a CSS `filter: hue-rotate()/saturate()` at render — display-only, free, no upload.

**Recommendation:** ship our **own monochrome catalog icon set designed for tinting** (sentinel-fill convention) as the first-class path; treat stock-icon recolor as best-effort.

### 9.2 Colors as Mechanics (M9)
Color is not cosmetic-only — it feeds the engine:
- **Faction colorways:** wearing a faction's signature palette reads as soft affiliation even on unbranded items (small `faction` contribution); wrong palette in the wrong district adds heat / lowers disguise confidence. Palettes come from `config/factions`.
- **Coordination → Wardrobe & Style:** a matched palette across equipped slots adds to the Wardrobe & Style social stat; a clashing palette feeds the existing **anti-style penalty**.
- **District palette fit:** `config/districts` gains palette hints; on-palette outfits nudge district fit.
- **Fashionware synergy:** matching techhair/Shift-Tacts colorways to the outfit grants a small coordination bonus — exactly the lived-in detail the system rewards.

All color math is pure engine code (`engine/profile.mjs` extension), so the Wardrobe preview reflects it for free.

---

## 10. Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Engine extraction (M2) silently changes a number | Med | Saved-actor parity test as the M2 gate; macro kept as reference until M3 done |
| cyberpunk-red-core update breaks a data path | Med | `cpr-adapter.mjs` — all reads in one file |
| V13/AppV2 forces sheet-injection rewrite | Med | UI isolated in `apps/`; engine untouched; D2 verify CPR's V13 status before upgrading |
| Migration corrupts live config | Low/High-impact | Auto-backup-before-migrate; archive-not-delete journals; idempotent migrations; tested on a world copy first |
| Double-counting after AE→flag migration | Med | D4 precedence (flags suppress that item's `sc.*`); explicit parity test |
| SVG recolor flaky on arbitrary stock icons | Med | Own sentinel-fill icon set as primary path; filter/raster fallback |
| Scope creep stalls the refactor | High | M0–M3 ship the refactor before new toys; features (M6+) reorder freely but never block the foundation |

---

## 11. Open Questions — RESOLVED (v1.1)

1. **Module identity** → *Night City: Style Over All* / `night-city-style-over-all` (D1; confirm exact slug before M0).
2. **GitHub** → new public repo (Q2).
3. **Foundry version** → V12 primary, forward-compatible to V13→V14 (D2).
4. **Catalog icons** → ship our own monochrome sentinel-fill set as first-class; stock recolor as fallback (Q4, §9.1).
5. **Wardrobe priority** → read-only at M2/M3 as parity harness; full at M6 (Q5, §17).
6. **Distribution** → GitHub + Patreon (Q6).

Newly opened by v1.1 (for Christian):
- **Brand seed list** — which canon + homebrew brands seed the registry at M1? (Lore already exists in the batch guide's Brand Voice table — §13.5.)
- **Counterfeit depth** — do fakes get one authenticity tier or several (street knockoff vs. premium replica)? (§13.4)
- **GM trends cadence** — are fashion trends a manual GM toggle, or scheduled (per-session / in-game weekly)? (§14.4)

---

## 12. Immediate Next Step

On sign-off of §3 (D1–D5) and §11, begin **M0**: scaffold `module.json`, `main.mjs`, `constants.mjs`, and the empty `DataStore`, then confirm a clean load in the V12 world. M0 is deliberately tiny and reversible — it proves the plumbing before any of the 20k lines move.

---

## 13. Brand System — Design Detail (v1.1)

**The opportunity:** brands are richly developed in the batch guide (Brand Voice Archetypes, canon labels, homebrew houses like Ofuda and Brass Lotus) but carry **zero mechanical weight today** — they exist only in item names and descriptions. This system makes a brand a first-class, GM-editable, cascading signal: who made your clothes becomes part of who the city reads you as.

### 13.1 Brand Registry (new config, GM-editable)
A new config blob (`config/brands.mjs`, stored in settings, edited via the GM Config App §14.1), seeded from existing lore.

```js
// one entry in the registry
{
  schema: 2,
  key: "ofuda",
  label: "Ofuda",
  voice: "japaneseLuxury",        // maps to batch-guide Brand Voice Archetype (description gen)
  tier: "luxury",                 // street | massMarket | premium | luxury | hauteCouture
  styleAffinity: { asiaPop: 12, urbanFlash: 6 },   // amplifies these style reads
  archetypeSignal: { /* optional */ },             // e.g. corpo brands nudge corpo
  factionAffinity: null,          // optional soft faction read (feeds disguise + tension)
  districtAffinity: { kabuki: 4 },// optional district-fit nudge
  heatProfile: 6,                 // flashy designer +heat; grey/generic ~0; tactical contextual
  recognition: "known",           // niche | known | iconic — perception-gated (§13.3)
  counterfeit: { exists: true, replicaTiers: ["streetKnockoff", "premiumReplica"] }, // §13.4
  signaturePieces: ["the wave-embroidered cyberweave jacket"]  // flavor for lookbook/feed
}
```

### 13.2 Brand as a Cascade Source ⭐
Brand slots cleanly into the existing cascade hierarchy, **between faction and archetype**:

| Source | Cascade breadth |
|---|---|
| `faction` | Full — archetype + style + chrome + cost + district + disguise DC |
| **`brand`** | **Broad — style + cost + heat + recognition (+ optional faction/district/archetype)** ← NEW |
| `archetype` | Medium — style + chrome + cost |
| flat keys | Surgical — one system each |

The engine gains a brand-resolution step in `engine/collect.mjs` → `profile.mjs` that reads `styleData.brand`, looks up the registry, and injects the derived modifiers exactly as faction does today. **Tier drives perceived cost and the style ceiling** (a haute piece can read higher than a street piece even at equal style count). Authoring `brand: "ofuda"` is therefore as powerful as a faction key, but for *taste/wealth* instead of *allegiance*.

### 13.3 Recognition Gating (ties to PerceptionGate)
Not everyone clocks every label. `recognition` interacts with the scanner:
- **iconic** megabrands read to everyone (low INT bar).
- **known** brands read to most observers.
- **niche** haute labels only register to high-INT / fashion-literate NPCs — to everyone else it's "just an expensive-looking jacket," prestige without the name.

This makes brand knowledge a *character competency* and gives the perception system a fashion dimension, not just a threat dimension.

### 13.4 Authenticity & Counterfeits ⭐ (ties to Disguise)
A garment carries `authenticity: genuine | counterfeit` (§15) and, if counterfeit, a `replicaTier`. The play:
- A counterfeit reads as the **real brand's full prestige at a glance** (passive look).
- An **active scan** (perception-gated, harder for better replicas) can reveal the fake.
- Outcomes: blown disguise, social embarrassment in a high-status venue, *or* a savvy budget play that holds up where it counts.

This is the strongest new disguise lever in the system — a fake Arasaka-tier look that passes the bouncer but fails the executive who shops there.

### 13.5 Brand Mechanics in Play
- **Head-to-toe brand match ("full look"):** wearing one brand across slots reads as wealth/dedication. Bonus to Wardrobe & Style for fashion-forward archetypes; a "trying too hard" penalty for street/nomad reads. Computed over the equipped set.
- **Complementary brand pairing:** known-good brand combinations read as sophisticated styling (small coordination bonus); clashing tiers (haute jacket + street everything) can read as stolen/borrowed.
- **Brand signature / reputation:** a character who consistently wears one brand builds a "known for" signature surfaced in the social feed (ties to §16 reputation).
- **Color × brand:** a brand's colorway worn on *unbranded* items still nudges that brand's read (ties to §9.2).

### 13.6 Seeding (M1)
Seed the registry from the batch guide's Brand Voice table + canon labels + existing homebrew (Ofuda, Brass Lotus, …). The batch exporter gains a `brand` column so new catalog items carry their brand into `styleData` automatically.

---

## 14. GM Configuration & Control — Design Detail (v1.1)

The macro already lets GMs customize a lot — but only by hand-editing JSON inside journals. Moving to settings (M1) unlocks the real win: **form-based control surfaces**. This section is the umbrella for "more GM customization."

### 14.1 Config App (form editor) — replaces JSON-in-journals ⭐
A tabbed GM application (`apps/config-app.mjs`) for editing every config blob with forms, dropdowns, and validation instead of raw JSON:
- Tabs: **Factions · Archetypes · Districts · Brands · Cyberware · Comments · Scene Gates · Crews · Shops · Uniforms · Ratings · Tunables · Garden · Vibes** (every data domain; see §21.3)
- Per-entry: add / edit / delete / **duplicate** (clone-and-tweak is how most homebrew gets made).
- Validation on save (no more silently-broken JSON); writes through `DataStore`; journals kept as the human-readable mirror (§21.3); auto-backup before bulk changes.
- **Import/Export per tab** (share faction packs, district sets, brand registries, shop lists, uniform packs with the community — the basis of the content library, §21.3).

This single feature is the biggest GM quality-of-life jump in the whole conversion.

### 14.2 Tuning Panel (no-code balance)
Sliders/inputs in module settings for the numbers that are currently buried in engine code: archetype-match weights, asymmetric penalty strength, heat baselines, scan DC curves, brand full-look bonus, counterfeit detection difficulty. Per-world, live, reversible. (This is M9's "settings for weights," expanded into a real panel.)

### 14.3 GM Overrides (narrative control)
Pin a read on a specific actor/token **regardless of gear**, stored as an actor flag:
- Force archetype ("this fixer always reads corpo"), force/offset heat, force disguise outcome, force brand-tier read.
- Overrides are clearly flagged in the UI so the GM knows a value is manual, not computed.

### 14.4 Trends System (rotating fashion meta)
GM-defined fashion trends that temporarily shift style/archetype weights and are announced **in-world through the existing social commentary feed** as fashion posts ("kabuki-glam is everywhere this week"). Time-boxed (manual toggle or scheduled — see open Q). Turns the meta into a living, GM-driven narrative dial.

### 14.5 NPC Quick-Dress / Style Templates ⭐ (prep saver)
Apply an outfit template to an NPC instantly — "dress this mook as a Tyger Claw foot soldier" — pulling from compendium items + saved presets (§7.4). One click, a fully-styled NPC. Rides the Wardrobe preset engine (M6).

### 14.6 NPC Style Generator (stretch)
"Generate a Kabuki street vendor" → auto-assemble an outfit from the catalog matching a target archetype + district + brand tier + budget. Bigger lift; post-M8 stretch goal.

### 14.7 Faction Relationship Matrix Editor
A visual who-hates-whom grid feeding the Faction Tension scanner, editable in the Config App instead of nested JSON.

### 14.8 Scene Authoring
Expand Scene Gates into a scene builder bound to **scene flags**: set district, ambient heat, active trends, who's watching, and entry requirements per scene; auto-arm on scene activation (ties to M7 scene-hooks).

---

## 15. Expanded Clothing Attributes — Design Detail (v1.1)

CPR clothing natively carries only **Style** and **Type** (slot) plus price. The `styleData` flag already adds faction/archetype/heat/etc. v1.1 expands the *garment's own properties* — authored in the Item Style Tab (§8), several dynamic in play. All optional; absence = no signal.

| Attribute | Values | Effect |
|---|---|---|
| `brand` | registry key | Brand cascade (§13) |
| `tier` | budget…hauteCouture | Perceived cost + style ceiling (inherited from brand if set, overridable) |
| `condition` | pristine \| worn \| damaged \| bloodied | Style penalty until cleaned/repaired; **dynamic** — combat dirties it (M7 hook). Fits the "lived-in imperfection" tone. |
| `authenticity` | genuine \| counterfeit(+replicaTier) | Counterfeit play (§13.4) |
| `material` | synthLeather \| cotton \| kevlarWeave \| smartfabric \| … | Flavor + optional heat/weather/armor hooks |
| `fit` | tailored \| offTheRack \| oversized | Read quality + conceal potential |
| `colors` | primary/accent (+recolor) | Color system (§9) |
| `modifications[]` | armoredLining \| hiddenPockets \| techIntegration \| reinforced \| distressed | The "modify clothing" layer — see §15.1 |
| `statementPiece` | bool | Dominates the read (a signature jacket overrides slot-balance) |
| `layer` | base \| mid \| outer | Optional conceal/style stacking within CPR's slot limits |

### 15.1 Tailor / Customization Flow ⭐ (answers "modify clothing easier")
A customization surface — launched from the Item Style Tab or the Wardrobe (§7) — that takes a base garment and produces a modified variant:
- **Recolor** (set colorway / tint icon, §9), **retailor** (change fit), **add modification** (armored lining → armor; hidden pockets → conceal; tech integration → built-in fashionware), **distress** (condition → worn for aesthetic), **counterfeit-brand** (stamp a brand the garment doesn't legitimately carry, §13.4).
- Produces either an edited flag set on the same item or a duplicated "modified" item, GM's choice. This is the player-facing realization of "make clothing customizable," and it feeds every downstream read automatically because it all writes to `styleData`.

---

## 16. Quick-Perceive Style Reads — Design Detail (v1.1)

**The ask:** a fast way for players *and* GMs to read someone's style at a glance. The pieces already exist — PerceptionGate (scan tiers, COOL counter-scan), the All-Party Readout, and a large library of archetype "vibe" one-liners. v1.1 packages them into fast, accessible reads. All perception-gated; most land in M7 (live layer).

### 16.1 Token Style Read ⭐ (the headline feature)
Right-click a token (or a Token HUD button) → **"Read Style"** → a compact card whispered to the reader:
> top archetype · primary style · heat dot · one-line vibe (pulled from the existing one-liner library) · brand recognition (if the observer clocks it, §13.3)

Perception-gated by the reader's INT + Perception vs. the target's gear-boosted COOL counter-scan (existing logic). Fast, in-flow, no app window.

### 16.2 Tiered Looking
- **Passive glance** (low bar): archetype + vibe only — what you notice walking past.
- **Active scan** (roll, higher bar): full breakdown — what you get when you *study* someone.

Maps directly onto the existing partial/full scan tiers in `collectStyleData`.

### 16.3 Player ↔ Player Reads (sockets)
A player can quick-read another PC without GM mediation, delivered via socket as a whispered card. A real table-level social tool — "what do I make of this stranger?" resolves instantly and privately.

### 16.4 Lookbook Card (social artifact + quick-perceive)
Generate a shareable chat card showing a character's **current outfit in slot layout** with recolored icons (§9), brand tags, and the read. Doubles as a fun in-world artifact (a "fit pic") and a fast way for the table to eyeball someone's look.

### 16.5 Scene Style HUD (GM)
A compact grid panel of every token's quick-read for the GM (a mobile-friendly distillation of the All-Party Readout), plus optional small token badges (heat level / faction glyph) as a GM-only overlay — situational awareness for a crowded scene at a glance.

### 16.6 Reputation / "Known For" (cross-cutting)
Persistent style reputation built over play and surfaced in the social feed: a character consistently reading one way (archetype, brand signature, colorway) accrues a "known for" descriptor that colors first impressions. Lightweight, flag-stored, feeds the quick-read's flavor line.

---

## 17. Phase Integration for v1.1 Features

How the four new systems map onto the M0–M9 backbone. Nothing here reorders the foundation (M0–M3 still front-load the risk); features attach to the phase where their dependencies first exist.

| System | Lands in | Notes |
|---|---|---|
| **Read-only Wardrobe (parity harness)** | M2→M3 | Q5: a thin "show current outfit + engine read, no editing" window is the *visual* regression check for M2 engine extraction. Cheap, high-value for bug-testing. |
| **Brand Registry (data + seed)** | M1 | New config blob in `config/brands.mjs`, seeded from lore (§13.6); editable once the Config App exists. |
| **Brand authoring (tab picker)** | M4 | Item Style Tab gains brand + recognition + authenticity controls. |
| **Brand cascade — basic** | M4 | tier→cost, styleAffinity→style read wired into the engine. |
| **Brand cascade — advanced** | M9 | Full-look bonus, complementary pairing, counterfeit detection, recognition gating (recognition also touches M7 perception). |
| **GM Config App (form editor)** | M3 (companion) | Belongs with the other apps once settings storage (M1) lands. The biggest GM QoL win. |
| **Tuning Panel** | M9 | Expands M9's "settings for weights." |
| **GM Overrides** | M4 | Actor-flag based; authored alongside the tab work. |
| **Trends System** | M7 | Uses social feed + sockets. |
| **NPC Quick-Dress / Templates** | M6 | Rides the Wardrobe preset engine. |
| **NPC Style Generator** | post-M8 | Stretch. |
| **Faction Matrix Editor** | M3 | A tab in the Config App. |
| **Scene Authoring** | M7 | Bound to scene flags + scene-hooks. |
| **Expanded clothing attributes (schema + tab)** | M4 | Fields added to `styleData` + Item Style Tab. |
| **Tailor / Customization flow** | M6 | Wardrobe-adjacent (also reachable from the tab). |
| **Condition dynamics (combat dirties gear)** | M7 | `updateActor`/damage hooks. |
| **Material / weather hooks** | M9 / optional | Lowest priority. |
| **Quick-Perceive: token read, HUD, chat card, player↔player, scene HUD, lookbook** | M7 | The live layer is their natural home; tiered looking reuses the M2 PerceptionGate engine. |
| **Reputation / "Known For"** | M7 | Flag-stored, feeds the social feed + quick-read flavor. |

### Revised "feature-complete" picture
- **After M3:** macro fully replaced + GM Config App (forms instead of JSON) + read-only Wardrobe. Already a major upgrade for the table.
- **After M4–M5:** AE workflow retired; brands, expanded clothing, and colors authored through dropdowns; existing `sc.*` items migrate cleanly.
- **After M6:** full Wardrobe with presets, tailor/customization, NPC quick-dress.
- **After M7:** the system reaches the table live — quick-perceive reads, trends, dynamic condition, scene authoring, reputation.
- **After M8–M9:** catalog ships as compendia; brands/colors become fully mechanical; tuning and public API land.

---

## 18. Formula Customization & Tunables (v1.1)

### 18.1 Honest status — what's customizable *today*
A precise answer to "I assume all the formula stuff is customizable?": **not yet.** Today the line is:
- **Customizable (data, in journals):** archetype style profiles, faction definitions, district modifiers, cyberware categories, ratings tables, comments. These are already editable.
- **NOT customizable (hardcoded in the engine):** the *math itself* and its *constants*. Real examples pulled from Phase 82 — slot cost weights `{ jacket: 1.8, top: 1.4, bottoms: 1.2, footwear: 1.0, hats: 0.9, glasses: 0.7, jewelry: 0.5 }`, slot caps, `STYLE_COSTS`, the anti-style penalty range (0 to −20), the difficulty multiplier, the role multiplier, `AMMO_HEAT_CONFIG`, `AMMO_HEAT_TOTAL_CAP = 40`, scan DCs, the COOL counter-scan formula, archetype-match weighting, the dominance bonus, and primary-style gate thresholds. All of these are literals baked into functions.

So "make the formula stuff customizable" is a real, in-scope feature — and v1.1 commits to it via the three-tier model below.

### 18.2 The Three Tiers of Customization
| Tier | What | Plan |
|---|---|---|
| **1 — Data** | Profiles, registries, modifier tables (archetypes, factions, districts, brands, cyberware) | Already customizable; gets the form editor (§14.1) |
| **2 — Tunables** | Every weight, multiplier, threshold, baseline, cap, DC, and curve currently hardcoded | **Extracted into a Tunables config** (settings-backed), exposed in the Tuning Panel (§14.2). This is what "customizable formulas" means for ~95% of GMs: retune behavior without touching structure. |
| **3 — Algorithm structure** | The actual equations (cosine → asymmetric penalty, dominance bonus, slot-cost weighting, counter-scan) | Stays in documented code. Offered as **scoring presets** (named philosophies — e.g. "Forgiving" vs "Strict" vs "Custom"). A true GM-authored **formula-expression editor** is a deferred, opt-in advanced stretch (§18.4). |

### 18.3 Tunables Inventory (extracted during M2)
The constants lifted from the engine into `config/tunables.mjs` (settings-backed, GM-editable), grouped:
- **Style scoring:** style-match weights, dominance bonus, primary-style gate thresholds, cohesion curve.
- **Anti-style:** penalty range + per-clash scaling.
- **Heat:** baselines per role, weapon/armor tolerances, ammo heat values + cap, flashy/grey thresholds.
- **Danger:** weapon/armor/cyberware/body/wound/social contribution weights.
- **Disguise:** style-distribution match weighting, chrome-match weight, cost-fit weight, difficulty multipliers, counter-scan COOL formula coefficients.
- **Perception:** scan-tier DCs, INT/Perception curve, recognition-gating thresholds (§13.3).
- **Budget planner:** slot cost weights, slot caps, style costs, role/district cost scaling.
- **Brand (new):** full-look bonus, complementary-pairing bonus, tier→cost mapping, counterfeit detection difficulty (§13).
- **Color (new):** coordination bonus, palette-clash penalty, colorway-affiliation weight (§9.2).
- **Slots & layering (new):** coverage→read weights, wearMode coverage modifiers, readPriority multipliers, anchored-visibility inheritance (§27).
- **Formality (new):** dress-register gate thresholds, register-mismatch penalty (§28).

**Architecture tie-in:** every one of these is read via the Tunables config (per the Explainability Rule §4.1), so no formula constant is ever inlined. The Tuning Panel writes these; the breakdown UI (§19) shows *which value applied* to a given number.

### 18.4 DECISION D6 — How far on formula customization?
- **A — Tunables only** (recommended baseline): every number is a knob; structure is fixed. Covers the vast majority of GM intent, zero footgun.
- **B — Tunables + Scoring Presets** (recommended): A, plus a few curated named scoring philosophies the GM can switch between or fork.
- **C — + Formula-Expression Editor** (deferred stretch): GM types their own expressions for specific formulas, evaluated in a sandbox with validation and guardrails. Powerful, but a real footgun (a bad expression silently skews every read) and a meaningful build. Opt-in, behind warnings, only if demand appears.

**Recommendation: ship A+B; hold C as a post-M9 maybe.** *Open for Christian's call.*

### 18.5 Phasing
Extracting constants → Tunables config happens **inside M2** (the cheapest moment — lift each literal into the config as the function is pulled apart, rather than re-finding them all later). The **Tuning Panel UI** rides the Config App (M3) for the common knobs and is completed in M9. **Scoring presets** land in M9. **D6-C** (if ever) is post-M9.

---

## 19. In-UI Documentation & Formula Transparency (v1.1)

### 19.1 You already do this 279 times
The macro already carries **279 inline `title=` tooltips** explaining metrics — ANTI-STYLE PENALTY, CHROME PROFILE, COOL, COHESION, CREW DANGER, and more, several with live breakdowns (the anti-style tooltip lists each clashing style and its point cost). So the instinct to "describe what everything does" is already half-built. The problems with the current form: it's **inconsistent** (some elements explained, others not), **hover-only** (useless on touch/mobile), **buried in HTML strings** (painful to maintain), and **can drift** from the real formula (the tooltip text and the code are two separate sources of truth).

v1.1 formalizes this into a standard so every number in every app explains itself, consistently, and *from the same source as the math*.

### 19.2 The Transparency Standard (every score, stat, and bar)
Three layers on every metric, everywhere:
1. **What is this** — a one-line plain-language definition (always visible or one tap away).
2. **How it's calculated** — an expandable breakdown showing the actual contributing terms, the **tunable values in play** (§18), and the specific items/stats that fed it. ("Heat 34 = base 10 (Solo) + weapons 12 + visible chrome 8 + flashy colorway 4; cap 40.")
3. **Glossary / Help** — a central reference (a Help tab and a `?` affordance) defining every metric and its formula in plain words.

### 19.3 Architecture — explainability is data, not decoration
This is why the **Explainability Rule (§4.1)** exists: engine functions return `{ value, label, blurb, components, tunablesApplied }`. Consequences:
- The breakdown UI renders directly from `components` — **no formula logic duplicated in the UI** (the macro's current trap, where tooltip text restates the math by hand and can fall out of sync).
- The Help/glossary is **generated from the same metric metadata** the engine emits, so documentation cannot drift from code.
- Change a tunable → the number *and* its printed breakdown both update automatically.

### 19.4 Reusable UI pieces
- An **Info affordance** component (tap/hover, mobile-friendly) → opens the metric's definition + breakdown.
- A **Breakdown partial** (the component-list renderer) reused across every app — Style Profile, GM Dashboard, Wardrobe, quick-perceive cards.
- A **Help tab** per app surfacing that app's metrics, plus a global glossary.
- The Item Style Tab's **live cascade preview (§8.3)** and the Wardrobe's **live profile (§7.2)** are this standard applied to authoring/preview — same partial, same source.

### 19.5 Phasing
The **explainable-result contract** is built in M2 alongside extraction (non-negotiable timing — see §4.1). The **Breakdown partial + Info affordance** land in M3 and are reused by every subsequent app for free (M4 tab, M6 Wardrobe, M7 quick-perceive cards). The **Help tab + glossary** land in M3 and grow as metrics are added. Net effect: the 279 hand-written tooltips collapse into one rendering path fed by the engine.

---

## 20. Phase Integration — v1.1b Additions

Appends to §17. Again, nothing reorders the M0–M3 foundation.

| System | Lands in | Notes |
|---|---|---|
| **Extract constants → Tunables config** | **M2** | Done *during* extraction — the cheapest moment. Every literal becomes a config read. |
| **Explainable-result engine contract** | **M2** | Non-negotiable timing; retrofit later = rewrite (§4.1). |
| **Breakdown partial + Info affordance** | M3 | Built once, reused by every app thereafter. |
| **Help tab + global glossary** | M3 | Generated from engine metric metadata; grows with new metrics. |
| **Tuning Panel (common knobs)** | M3 (Config App) | The everyday weights/baselines/DCs. |
| **Tuning Panel (full) + Scoring Presets** | M9 | Complete knob coverage + named scoring philosophies. |
| **Formula-Expression Editor (D6-C)** | post-M9 | Only if demand appears; sandboxed, guard-railed, opt-in. |


---

## 21. Selected Features (v1.2)

Promoted from the §13–§16 brainstorm by Christian's selection, plus **The Garden** (new). Held to the principles in §21.0 throughout.

### 21.0 Integration & UX Principles (apply to every feature)
Christian's standing requirement: **easy for the user, seamless in integration, sensible for the GM/players who run it.** Concretely:
- No feature requires editing raw JSON — everything authored through the GM Config App or the relevant in-app surface.
- Everything that holds data is **import/exportable** (community sharing; backup before changes).
- Features reuse existing surfaces (Config App, Wardrobe, social feed) rather than spawning new windows to learn.
- **Graceful degradation:** missing/stale references are reported, never silently broken (consistent with §5.4).

### 21.1 Shops as Entities ⭐ — pulling REAL items
A **Shop** is a GM-authored vendor that sources **actual Foundry clothing/gear Items** — never invented text.

**Data model** (editable in Config App, journal mirror per §21.3): name, district, brand/archetype focus, price modifier, description/voice — plus **stock** defined two combinable ways:
1. **Explicit list** — hand-picked item references.
2. **Query** — a filter ("clothing · style asiaPop · tier premium · brand Ofuda") resolved against available items, so a shop is defined by *what it sells*, not by enumerating every SKU.

**Real-item references & portability (important):**
- Stock references real Item documents by **UUID**. For shops that survive export/import into *other* worlds, references must point at **compendium pack items** — world item IDs are world-specific and won't resolve elsewhere. The module's own catalog packs (M8) are the natural source; a GM's own packs work too.
- References are validated on load/roll; missing items are reported, never crash.

**RollTable generation:**
- One click → a native Foundry **RollTable** whose results are **document-reference results** pointing at the shop's real items (optionally weighted by tier/rarity). Roll it for stock, restocks, or loot — every draw yields a real, draggable item.
- Re-generate on shop change to keep the table in sync.

**Shopping UX (light economy):** a shop view lists items at computed price (base × shop modifier × active trend modifier §14.4); drag-to-actor or "purchase" (deduct eb, add + optionally equip). This is the seam connecting the budget planner to actual acquisition.

**Export/Import:** serialize metadata + references (+ query) to JSON; import resolves and validates, surfacing the compendium-vs-world portability caveat in the UI.

### 21.2 Crew / Faction Uniforms ⭐
A **Uniform** defines a crew's or faction's look, is set/preset/import/export-able, and — critically — **a character wearing it is identified as belonging to that group.**

**Two complementary forms:**
- **Hard uniform** — specific items (these exact pieces), referenced by compendium UUID for portability (§21.1). Powers NPC dressing (§14.5), disguise kits, and one-click "wear the uniform."
- **Soft uniform / signature** — a style + color + brand + chrome signature *any matching gear* satisfies ("Tyger Claw = red/black colorway + asiaPop lean + visible chrome"). This drives **recognition**: a character reads as the group if their look matches the signature, even in improvised gear.

**"Identified as so" — detection hooks:** soft-signature match feeds the **faction/crew read**, **disguise confidence** (wearing a uniform *is* a disguise toward that group), **faction tension**, and **crew cohesion** (matching crewmates read as a unit). Match is graded (full = strong, partial = partial) and surfaced in the quick-perceive card (§16.1) and GM dashboard.

**Unifies several systems:** a uniform is at once a shared Wardrobe preset (§7.4), a detection signature, a disguise target, and an NPC-dressing template — authored once, reused everywhere. Edited and import/exported via the Config App.

### 21.3 Universal GM Editability & Import/Export
Christian likes the journal-backed model — so journals stay as the **human-readable home/mirror** while **every domain becomes editable and import/exportable through the GM Config App** (§14.1).
- **Reconciliation with D3:** settings remain the engine's source of truth (player-readable, migration-safe); the Config App is the editor; **journals are the readable mirror + export artifact** — honoring the journal affinity and D3's backup role at once. A GM who prefers editing the journal still can; the app keeps it in sync.
- **Domains covered (all):** Factions · Archetypes · Districts · Brands · Cyberware · Comments · Scene Gates · Crews · **Shops** · **Uniforms** · Ratings · Tunables (§18) · Garden config · Vibe tags (§22.3).
- **Per-domain Import/Export** everywhere — the foundation of the community content library (brand packs, district sets, shop lists, uniform packs via GitHub/Patreon/Discord).

### 21.4 The Garden — Ziggurat's social network ⭐⭐
**Concept (strong recommendation: build it).** CPR 2045 has no global social media — just city-local, air-gapped CitiNets/Data Pools and **Garden** (by Ziggurat), a Reddit/YouTube/Tumblr hybrid for text/audio/video posts dodging targeted ads. The social commentary system already holds the raw material: a deep comment library keyed by archetype/faction/district across real "platforms" (streetview, datakrash, screamsheet, fixernet, ncpd_scanner) with distinct username pools (gonks, netrunners, media, fixers, solos, corpos, gangers). **The Garden renders that feed as one page that feels like a social network — and reacts to play.**

**Key design insight — Garden is a visible reputation dashboard, not a simulation.** Engagement is a **function of heat + reputation + style score**: a flashy idol's post racks thousands of likes; a grey man gets crickets. That single rule makes Garden mechanically meaningful instead of cosmetic — your style performance *is* your social footprint, rendered.

**One packed page (nothing too crazy):**
- **Feed of posts** about a character / party / scene: username + handle + platform tag + timestamp + comment body, in social chrome — likes, reposts/boosts, reply counts, light threads.
- **Post variety** (the hybrid): text posts (existing comments), "clip" posts (thumbnail + caption — *someone filmed you crossing Kabuki*), and **look posts** (the lookbook/fit card §16.4 as a posted image).
- **Profile page** per character: handle, bio, follower count (driven by reputation), pinned look, post history (style timeline as the feed), "known for" tags — unifying reputation + style journal + lookbook in one believable place.
- **Trending** ties to the trends system (§14.4): what's "in" shows as trending in the active district.
- **Fake targeted ads** interspersed (Continental Brands, NiCola, ripperdoc clinics) to scroll past — cheap flavor that sells the lore.
- **Feed filters:** mentions of me · the scene · trending in [district] · my crew.

**Reactive to play (the part that makes it sing):** the GM can hand-post ("the city reacts to what you did"), and posts auto-trigger on events via hooks (M7) — a blown disguise, a heat spike, a gala entrance, a scene-gate pass/fail spawns Garden chatter. The feed becomes a living mirror of the session.

**Scope honesty:** engine work is *small* (engagement = f(heat, reputation); event→post mapping). The cost is **UI polish** — it's a rich page — not architecture. Standout screenshot feature for Patreon/Discord. Read-mostly and GM-seedable by design; explicitly **not** a simulated NPC social graph.

**DECISION D7 — feedback loop?** Does Garden footprint **feed back** into reputation/street-cred (going viral *raises* notoriety → affects gates/social reads), or stay a read-only mirror with light metrics? Feedback closes a satisfying loop but edges toward "crazy."
**Recommendation:** ship read-only-with-metrics first; add an **optional, toggleable feedback loop** later. *Christian's call.*

### 21.5 Phase Integration (v1.2)
| Feature | Lands in | Notes |
|---|---|---|
| Soft-uniform detection signature | M2 | Pure engine — match logic in the detection pipeline. |
| Config App: Shops, Uniforms, all domains + per-domain import/export | M3 | Universal editor; journals kept as mirror (§21.3). |
| Crew/Faction Uniforms (authoring, presets, NPC-dress) | M6 | Rides Wardrobe preset engine; detection already live from M2. |
| Shops (entity, editor, query, buy UX) | M6 | Reads available items; light economy. |
| Shops → RollTable gen + portable compendium references | M8 | Portable refs need catalog packs (M8); table gen can prototype earlier on world items. |
| The Garden (engagement math; feed/profile/trending UI; event posts) | M7 | Capstone of the social layer; unifies reputation + journal + lookbook; reactive posts need M7 hooks. |
| Garden feedback loop (D7, optional) | post-M7 | Only if chosen; toggleable. |

### 21.6 Parked & Backlog
- **Parked (not doing):** Spotify integration, vehicle-as-style-item.
- **Captured backlog (not yet promoted):** active social mechanics (style→roll modifiers, reaction engine, social conflict), "dress for a purpose" intent/goals, economy depth (fixer sourcing, dynamic pricing, tailoring economy), narrative persistence (reputation decay, seasons & marquee events), multi-session infiltration arcs, district aesthetic dominance, paper-doll visualization, GM generation suite (random-NPC dressing, loot gen, crowd ambiance, procedural brand gen), colorblind-safe palettes + onboarding + community library. Tier these before v1.0 lock.

---

## 22. Brand & Clothing Prominence + the Vibe Axis (v1.3)

Christian's priority: **brands and clothing should feel important and stand out** — there's a body of homebrew brands (mottos, lore, signature pieces) that must read as a centerpiece, not buried flavor text. This section covers how, plus the requested **expressive vibe modifiers** (cool/cute/sexy/sleazy) and an honest take on whether they're worth the complexity.

### 22.0 The core move: brands are *content*, not a field
The system is uniquely able to make a brand matter because it touches every layer — what you read as, how the city talks about you, what you can get into. The strategy: a brand carries a rich identity that is simultaneously **(a) mechanically cascading, (b) narratively surfaced in play, and (c) culturally positioned.** Homebrew lore stops being a description nobody reads and becomes displayed, cited, and reacted-to.

### 22.1 Making homebrew brands stand out

**Mechanical weight (extends §13):**
- Brand is a broad cascade source — tier → perceived cost + style ceiling, style affinity, heat profile, vibe identity (§22.3), recognition.
- **Signature pieces:** a brand's iconic item (the "it" jacket) that *dominates* a read and is widely recognized. Wearing it is a statement, not a stat.
- **Full-look bonus / brand loyalty:** head-to-toe one brand reads as devotion/wealth, and can build standing with that brand (shop discounts, access).

**Narrative surfacing — your writing appears in play:**
- **Mottos & lore in reads.** When a brand item is detected, the read cites the brand's identity: *"That's Ofuda — 'tradition, sharpened.' Old-money taste, and it knows it."* The social-commentary narrator references the motto/lore you wrote. (Engine returns brand context in the explainable result §4.1; the UI shows it.)
- **Brand identity card / "house page":** each brand gets a profile — motto, lore, founding, home district, signature pieces, vibe identity, prestige, reputation — authored in the Config App and shown in shops, reads, and on The Garden.

**Cultural positioning — brands have standing:**
- **Cachet states:** aspirational (everyone wants it) · notorious (gang-associated) · exclusive (gatekept) · fallen (used to be cool). This colors reads and social value, and can shift with trends (§14.4) — a brand can be *hot this season*.
- **Recognition gating (§13.3):** niche houses only register to the fashion-literate; iconic ones read to everyone. Knowing the obscure label is a flex.
- **Brand–faction/district ties:** a brand can be a faction's unofficial uniform or a district's signature — wearing it reads as belonging (ties to soft uniforms §21.2).

**Brands live on The Garden (§21.4) — the biggest "alive" lever:**
- Brands have Garden presence: official accounts posting drops, fans posting fits tagged with the brand, brands *trending*. Your homebrew houses become entities in the world's social fabric, not entries in a table. This is where Ofuda and Brass Lotus start to feel real.

### 22.2 Making individual clothing stand out
- **Statement pieces** (§15) dominate the read regardless of slot balance.
- **Provenance / story:** an item with history (who wore it, where it came from) reads differently; lived-in imperfection is a first-class trait (the tone bible's core value), authored on the item and surfaced in reads.
- **Named / iconic items** become recognizable like signature pieces — the city clocks *that* jacket.
- **Customization** (tailor flow §15.1) makes each piece personal; condition (§15) gives it wear and a life.

### 22.3 The Vibe Axis ⭐ (cool / cute / sexy / sleazy …)
**Honest verdict: worth doing — *if* it has a distinct job, a small curated set, and is optional.** The Yakuza framing is apt: there, those tags are *expressive and social*, not redundant with combat stats. The same applies here.

**The distinct job (why it's not redundant):** the system already has three things — CPR **style** = aesthetic *genre* (asiaPop, urbanFlash…), **archetype** = who you read *as* (corpo, nomad, ripperdoc), and now **vibe** = the social *tone* you project. These are orthogonal: a *cute asiaPop idol* and a *menacing asiaPop solo* share a genre, differ in identity, and differ in tone. Vibe is the missing **expressive/social-tone** layer — and the natural input to social play.

**How it works:**
- Items and brands carry vibe contributions (`vibe: { cool: 3, sexy: 2 }`) on the styleData flag (§5.2), authored in the Item Style Tab (§8) — just another optional field, no extra burden.
- The equipped set aggregates into a **vibe profile** (dominant tone(s)), computed in a parallel, additive engine pass — it does **not** rewrite the tuned archetype/style detection.
- It's a **profile with tradeoffs, not a score:** *menacing* helps intimidation but hurts approachability; *sleazy* reads untrustworthy; *cute* disarms; *cool* commands respect; *sexy* alluring. More isn't better — the *shape* is the point.

**What it feeds:**
- **Social mechanics (its biggest payoff — backlog §21.6):** vibe is the natural modifier for social rolls — seduction (sexy), intimidation (menacing), disarming (cute), commanding respect (cool). This is the dimension the existing systems don't capture.
- **The Garden & commentary:** vibe colors the city's voice (*"giving menacing-glam energy"*).
- **Quick-perceive card (§16.1):** vibe is part of the at-a-glance read.
- **Brand identity (§22.1):** brands *push* vibes — Ofuda might be *elegant + cool*, Brass Lotus *sexy + sleazy*. The two systems reinforce each other, and a brand's motto can even seed its vibe identity.
- **Optional archetype nudge:** vibe *may* lightly nudge archetype (cute→idol, menacing→solo), kept minor by default so it never destabilizes detection.

**Default tag set (v1.6, GM-editable, 9 spokes):** Cool · Cute · Sexy · Sleazy · Menacing · Flashy · Elegant · Rugged · Scrappy. Each is a tone with a social tradeoff (none strictly "good"); they are independent radar spokes (a look can be both cute *and* menacing). Revised from the first draft: dropped **Slick** (subsumed by Cool/Elegant) and **Feral** (subsumed by Menacing); added **Flashy** (loud/glam/spectacle — the biggest gap), **Rugged** (weathered/streetworn-tough), and **Scrappy** (broke/improvised/surviving).

**Vibe is tone, not wealth.** "Poor" / "rich" is a *perceived-status read* (a Layer-2 derived read, §1.1) computed from cost/brand/tier — it is **not** a vibe spoke. **Scrappy** is the *tonal* cousin (the broke-survival, held-together-with-tape look), and it's distinct from **Rugged** (tough/weathered — which a wealthy nomad reads as) and **Sleazy** (gross/untrustworthy). So the system reads how broke you *look* (status) separately from whether you carry yourself as *scrappy* (tone).

**Coverage by blending, not enumeration.** The 9 are a *basis* that spans tone-space; tones we didn't name emerge as combinations — mysterious ≈ high Cool, low everything else · regal ≈ Elegant + Cool · unhinged ≈ Menacing + Flashy · wholesome ≈ Cute, low Sleazy. A look maps to *some* blend without a spoke per adjective (the way three primaries make every color). The GM can still add/rename tags in the Config App (Vibes domain) — this is the shipped default, not a ceiling.

**Bench (swap-ins if the table wants them):** Feral (chaotic/unhinged danger), Slick (corporate-smooth), Aloof (mysterious/enigmatic), Warm (earnest/community — the Mox read), Retro (era-coded).

### 22.4 Anti-Convolution Guardrails (the honest part)
Adding a fourth axis *could* make the system convoluted — the failure mode is **axis proliferation**: five overlapping score bars nobody can keep straight. These rules prevent that:
1. **One clear job per axis.** style = genre · archetype = identity · vibe = tone. Vibe never duplicates the other two's scoring.
2. **Small, curated tag set** (~9 default), not 40.
3. **Optional and disable-able world-wide.** The core style/archetype system is fully functional without vibe; a GM who finds it too much turns it off and loses nothing essential. This is the key guardrail — vibe is *additive, never load-bearing*.
4. **Progressive disclosure (§19).** Show vibe as a short expressive descriptor by default ("cool, faintly menacing"), not a giant breakdown — the detail is one tap away for those who want it.
5. **Authored in the same dropdowns** (Item Style Tab) — zero new authoring surface.

### 22.5 Schema, Config & Phase Integration
- **Schema:** `styleData.brand` + `styleData.vibe` (§5.2).
- **Config:** Vibe tag definitions become a Config App domain (§14.1, §21.3) — editable, import/exportable like everything else.

| Element | Lands in | Notes |
|---|---|---|
| Vibe schema field + Item Style Tab authoring | M4 | One more optional dropdown. |
| Vibe aggregation (parallel engine pass) + default tag set | M2/M3 | Additive; does not touch archetype detection. Tags editable in Config App (M3). |
| Brand identity card / house page (authoring + display) | M3 | Config App; shown in shops + reads. |
| Mottos/lore surfaced in reads | M3 | Engine returns brand context (§4.1); UI cites it. |
| Signature pieces + statement pieces | M4 | Item flags (§15). |
| Vibe → quick-perceive card | M7 | Part of the at-a-glance read. |
| Brands & vibe on The Garden | M7 | Brand accounts, fan fits, trending; vibe colors commentary. |
| Vibe → social-roll modifiers | backlog (§21.6) | Blooms when active social mechanics are promoted — vibe's biggest payoff. |
| Brand cachet states (dynamic) | M9 | Trend-driven hotness; static cachet available from M3. |

---

## 23. Cyberware, Weapons & Armor as First-Class Style Items (v1.4–1.5)

**Principle:** brand (§13), vibe (§22), color (§9), prominence (§22.1), and recognition (§13.3) are **item-type-agnostic** — the styleData flag and every system built on it apply to **cyberware** exactly as to clothing. Cyberware is already mechanically wired on the *detection* side (`CyberwareAnalyzer` → chrome profile, heat, danger, archetype influence). v1.4 makes it a full participant in the *identity / brand / expressive* layer too. This is "apply the existing systems to cyberware," **not new infrastructure** — it rides the tab work and the analyzer already in place. *(Same applies, optionally, to gear/weapons/armor — a Malorian read, a menacing weapon — but cyberware is the priority.)*

### 23.1 Cyberware brands
Real CPR makers (Kiroshi, Zetatech, Dynalar, Raven Microcybernetics, Militech, Arasaka, Biotechnica…) plus homebrew, in the **same Brand Registry** (§13). A cyberware brand cascades like a clothing brand — tier → perceived wealth (premium Kiroshi optics vs back-alley clinic chrome), style affinity, heat profile, vibe, recognition. Chrome stops being generic "implants" and starts reading as *whose* chrome.

### 23.2 Recognition × Visibility (the cyberware-specific synergy) ⭐
Cyberware has something clothing doesn't: a visible/hidden split (already in `CyberwareAnalyzer`). Wire brand **recognition** (§13.3) to it:
- **Visible chrome broadcasts its brand** — a recognizable Kiroshi optic shimmer, a Militech mil-spec finish, a flashy cyberlimb model — readable at a glance (subject to the observer's fashion/tech literacy).
- **Hidden/internal chrome only reads on a scan** — subdermal armor, internal cyberware, covert ware keep their brand secret until perception digs in.

This is a strong disguise lever: premium chrome under a grey-man coat passes casual eyes; an active scan reveals the Arasaka-grade hardware. Fashionware and visible cyberlimbs *announce*; internal ware stays covert.

### 23.3 Cyberware vibe
Chrome contributes vibe tags (§22) alongside clothing: **menacing** (Wolvers, military chrome), **slick** (corporate optics), **sleazy** (back-alley budget ware), **elegant** (refined fashionware). Your chrome shapes the social-tone profile, not just the threat read.

### 23.4 Chrome colorways & finishes
Visible chrome takes colorways/finishes via the color system (§9) — etched, chromed, matte, neon-trace — and can be coordinated to the outfit (the fashionware synergy already noted in §9.2: matching techhair/Shift-Tacts/limb finishes to your colorway earns a coordination bonus). Icon recoloring (sentinel-fill set) applies to cyberware icons too.

### 23.5 Cyberware prominence
Cyberware brands get the full §22 treatment: identity card / lore / motto / signature pieces (an iconic cyberarm model, a flagship Kiroshi optic), and **Garden presence** (§21.4) — brand accounts posting drops, fans showing off their chrome. A signature piece of chrome can dominate a read the way a statement jacket does.

### 23.6 Authoring & integration
Authored through the **Item Style Tab** (§8) on cyberware items — the same dropdowns (brand, vibe, color, recognition, signature) used for clothing, plus the cyberware-native visible/hidden flag driving §23.2. The brand/vibe/color data **layers on top of** the existing `CyberwareAnalyzer` categorization — no rewrite of the chrome pipeline.

### 23.7 Phase Integration
| Element | Lands in | Notes |
|---|---|---|
| Cyberware brand registry entries | M1 | Seeded with canon + homebrew makers (same registry, §13.6). |
| Brand/vibe/color authoring on cyberware (Item Style Tab) | M4 | Same tab, same dropdowns — adds the visible/hidden recognition hook. |
| Recognition × visibility detection | M4 → M7 | Engine match at M4; surfaced live in quick-perceive (M7). |
| Chrome colorways/finishes + icon recolor | M9 | Rides the color-math phase (§9.2). |
| Cyberware brands on The Garden | M7 | Brand accounts, chrome fits, trending. |

**Net effect:** everything that makes a homebrew clothing *brand* feel important applies identically to a homebrew chrome brand — and cyberware gains a recognition mechanic clothing can't have, because chrome can be hidden.

### 23.8 Weapons & Armor (v1.5)
The same identity layer extends to weapons and armor — they already feed danger and heat (Layer 3); now they also carry brand, vibe, and prominence.

**Brands:** real CPR makers in the same registry (§13) — weapons: Militech, Arasaka, Kang Tao, Tsunami, Malorian, Nokota, Federated Arms, Budget Arms; armor: Militech, Kevlar®, corporate vs. street armorers. Tier → perceived wealth + recognition (a Malorian reads *money and danger*; a Budget Arms piece reads *desperate*). Cascades like any brand: style/cost/heat/vibe/recognition.

**Vibe:** weapons and armor push tone hard — **menacing** (a drawn assault rifle, spiked combat armor), **slick** (a concealed corporate sidearm, a tailored armorjack), **sleazy** (a sawn-off, taped-up plating), **elegant** (an engraved pistol, designer armorweave). This is a major input to the *intimidation* side of social play (vibe → social mechanics, §22.3).

**Concealment × recognition (the weapon/armor analog of §23.2):** weapons have a concealment dimension just like chrome has visible/hidden. An **openly carried** weapon broadcasts its brand and dumps its menacing vibe into the read; a **concealed/holstered** one stays off the read until drawn or scanned (CPR's `concealable` flag already exists). Same for armor — visible hard armor announces; subtle armorweave under clothing reads as ordinary wear. So "openly armed in a Malorian-and-armor loadout" and "the same gear concealed under a corporate coat" produce very different reads and heat — exactly the disguise lever §23.2 gives chrome.

**Prominence & Garden:** weapon/armor brands get identity cards, mottos, signature pieces (an iconic Militech model), and Garden presence — fans posting their loadouts, brands trending. A signature weapon can dominate a read.

**Heat caveat (don't regress the baseline):** per the standing principle, carrying weapons and wearing armor is **baseline Night City behavior**, not a threat spike — the brand/vibe layer adjusts *how* the gear reads (menacing vs. slick vs. expensive), it does **not** re-pathologize simply being armed. The existing heat tolerances by role stay intact.

**Authoring & phase:** Item Style Tab on weapon/armor items (same dropdowns + the native `concealable` hook); registry entries seed at M1; authoring at M4; concealment×recognition M4→M7; Garden M7. Pure reuse of the cyberware path above.

---

## 24. The Lens Toggle — Self vs As-Seen-By (v1.5)

**Concept:** every read can be viewed two ways, and the user toggles between them. This is the §1.1 conceptual model (the perception *lens*, the *relational* outputs) turned into a single control — and it's the feature that makes the abstract perception/disguise machinery tangible.

- **Self / true ("what you are"):** full information, no gating. Real stats, true archetype, full chrome including hidden, real vibe, no disguise masking. The ground truth about the character.
- **As-Seen-By ("how you read"):** the perception-gated, disguise-applied read an observer actually receives — hidden chrome concealed, concealed weapons absent, disguise modifiers applied, brand recognition gated by the observer's literacy, detail scrambled by scan tier.

**Observer selection (for As-Seen-By):**
- **Generic district observer** (default) — the "street read" in the current district.
- **A faction** — "how a Tyger Claw / a corpo / NCPD reads you."
- **A specific token/NPC** — uses their actual INT + Perception and faction.

**Where it lives:**
- **Player Style Profile** — flip between your truth and your street read.
- **Wardrobe (§7)** — preview a disguise *as the target sees it* while you build it. This is enormous for disguise planning: you're not guessing whether the look passes, you're watching the observer's read update live.
- **Quick-perceive card (§16)** *is* the As-Seen-By view of someone else — same engine path.
- **Charts (§25)** — the toggle overlays beautifully: your true vibe vs your perceived vibe as two polygons on one radar (demonstrated in chat).

**Architecture:** trivial given the pure engine (§4.1) plus the existing `PerceptionGate` and `collectDisguiseModifiers`. Self = run the engine with full info, gating off. As-Seen-By = run the same engine with perception gating + disguise mods + the chosen observer's params. Both halves already exist in the macro; the toggle just exposes them side by side and runs the engine twice with different context flags.

**Phase:** basic Self ↔ generic-observer toggle in the player app at **M3**; faction- and token-specific observers + Wardrobe live-preview at **M6–M7** (ride the disguise/quick-perceive/live layer).

---

## 25. Visualization & Readability (v1.5)

**The problem (Christian's, stated plainly):** the macro is number-dense — lots of scores and bars — and that's a wall for a new player or GM. **The fix is not less information; it's leading with shape.** Show a picture first, put the digits one tap away (this is the visual half of the §19 transparency standard, and it leans on progressive disclosure). The existing visual language and CSS stay — this *organizes* it, it doesn't replace it.

### 25.1 Chart-per-metric map
Match the visual to the data's nature:

| Metric | Visual | Why |
|---|---|---|
| **Vibe profile** | **Radar / spider chart** (Yakuza-style) | 8 tone axes; the *shape* reads instantly. Supports overlay — self vs. observed (§24), or two characters. The signature visual. |
| Genre / style mix | Horizontal proportion ("style fingerprint") bar | Genre is "dominant + tail," better as a proportion than a polygon — and keeps it visually distinct from the vibe radar. |
| Archetype match | Ranked confidence bars + a "primary read" callout | Top read big and clear; runners-up below; confidence shown, not buried. |
| **Heat** | **Gauge / dial** with labeled zones (cold→critical) | Single bounded value with thresholds = a dial. Instantly legible. |
| Danger | Gauge, with the component breakdown on tap | Lead with one number; keep the existing component bars behind disclosure. |
| **Disguise confidence** | **Progress ring / arc** with the pass threshold marked | "68%, need 75% to fool a Tyger Claw" reads in a glance. |
| District fit | Small fit meter | Compact, at-a-glance belonging. |
| Heat / reputation over time | Sparkline | Trend, ties to the style journal + Garden. |
| Party / scene (GM) | Small-multiples (mini-radars/gauges) + a heatmap grid | Characters × metrics, color-coded — a crowded scene digestible at one look. |
| Brand cachet / tier | Badges / pills | Categorical status, not a number. |

### 25.2 The "headline read" (new-player on-ramp)
The top of the Style Profile shows a **headline read** — one plain-language line ("Cool, slick, reads corpo — low heat, blends in Corpo Plaza") plus the three hero visuals (vibe radar, heat gauge, primary archetype). Everything else is collapsible. A new player gets the gist in two seconds; a power user expands for the full breakdown. This single layout choice is the biggest digestibility win.

### 25.3 Consistent visual language
- Shared color semantics across every chart: warm ramp = heat/threat, green = safe/pass, coral/red = danger/fail, neutral gray = structural. (Mind colorblind-safety — pair color with shape/label, §21.6 backlog flags this; it matters once color is mechanical.)
- One gauge style, one ring style, one bar style — reused everywhere so the eye learns them once.
- Charts are the **visual layer of §19**: each chart's "how it's calculated" breakdown is the §19 disclosure, one tap away.

### 25.4 Phase
Chart components (radar, gauge, ring, fingerprint bar, sparkline) are built **once in M3** and reused by every app after. The vibe radar rides the vibe work (M3/M4). The GM heatmap/small-multiples land with the dashboard (M3) and get polished at M7. Sparklines need history → M7. The headline-read layout is M3. *Net:* digestibility is foundational, not a final-coat polish — it ships with the first real UI.

---

## 26. Catalog Authoring & Packaging (v1.7)

**Goal:** ship Christian's clothing (and chrome/weapons/armor) as a compendium *inside* the module, pre-filled with styleData — vibe, brand, faction/disguise, colors, condition, tier — so a fresh install gets the full catalog ready to drop on actors. This is the M8 deliverable and the module's showcase.

### 26.1 The package = a compendium pack
Authored items live in `packs-src/` as JSON, compiled to LevelDB packs via the Foundry CLI (`tools/build-packs.mjs`), declared in `module.json` `packs[]`. Install → the catalog shows up as a compendium. Items are reference-able by shops/uniforms/RollTables via **compendium UUID** (portable across worlds, §21.1) — which is exactly why the catalog must live in a pack, not loose world items.

### 26.2 Authoring stays in the spreadsheet pipeline (extended)
The existing Sheets → Apps Script → import pipeline remains the authoring tool. Two additions carry the new metadata:
- **Exporter gains a flags-output mode** — emits `styleData` (brand, vibe, colors, condition, tier, faction/disguise…) directly, alongside the existing `sc.*` output.
- **Spreadsheet gains columns** for the high-frequency new fields (brand, vibe, primary/accent color, condition, tier, recognition, authenticity); the 5 FX effect slots keep handling the rest.

### 26.3 Author NOW, no new tooling — the `sc.*` bridge ⭐
Christian can start tagging the new metadata **today**, because the module dual-reads `sc.*` and flags (D4) and the `sc.*` vocabulary extends cleanly. New keys, used in the existing FX effect slots:
- `sc.vibe.<tag>` — vibe contribution. Nine tags: `cool · cute · sexy · sleazy · menacing · flashy · elegant · rugged · scrappy`. E.g. `sc.vibe.cool = 3`, `sc.vibe.menacing = 2`.
- `sc.brand.<key>` — brand, e.g. `sc.brand.ofuda`.
- Already covered: `sc.faction.*` (disguise/affiliation), `sc.heat`, `sc.cost`, `sc.armor`, `sc.district.*`, `sc.chrome.*`, `sc.antiStyle.suppress`, `sc.disguise.dc`.

**Nothing authored this way is wasted:** the M5 migrator converts every `sc.*` to a `styleData` flag automatically. The only limit is 5 FX slots per item — very rich items may exceed that and should wait for the column-based authoring (26.2), or use their slots for the highest-value signals.

### 26.4 Don't enter the data twice — lock the schema first ⚠️
The one real hazard with a large catalog: filling everything out against a field set that later changes means re-entry. **Before bulk data entry, freeze the authoring field set** — the §5.2 styleData schema plus the §26.3 key list. It is stable as of v1.7; the action item is to confirm it expresses *everything* Christian wants (any missing attribute, any extra vibe), then do the volume work against a frozen target.

### 26.5 Bulk-tagging assist (optional, post-M8)
For existing clothing that lacks the new metadata, a helper can **suggest** vibe/brand/tier/colors from an item's existing data (name, genre, archetype, price, description) for the GM to confirm — turning re-tagging from blank-slate entry into quick review. Nice-to-have.

### 26.6 Phase
| Step | When |
|---|---|
| Tag new metadata via the `sc.*` bridge (existing pipeline) | **Now** |
| Flags-output exporter + new spreadsheet columns | M3 |
| Migrator converts bridge-authored `sc.*` → flags | M5 |
| Compile catalog to compendium + ship in module | M8 |
| Bulk-tagging assist | post-M8 |

---

## 27. Clothing Slots, Layering & Laterality (v1.8)

**The problem:** CPR's clothing `system.type` is a short flat list — top, bottom, jacket, footwear, hat, glasses, mirrorshades, contacts, jewelry. No cape, hood, skirt, scarf, mask, gloves, belt; no layering; no laterality. Christian's been cramming necklaces/wristbands/watches into `jewelry`. The module adds the missing depth **without forking CPR**.

**Core principle — layer over CPR, never replace it.** Each item keeps its native CPR `system.type` (so CPR's own mechanics and our baseline slot logic still work). The module adds a richer model in `styleData`: CPR sees the coarse bucket, the module sees the precise garment. (Consistent with D2 / the cpr-adapter rule — we never patch the system's schema.)

### 27.1 The model (added to styleData §5.2)
- `scSlot` — the precise garment CPR can't name: cape, hood, skirt, scarf, mask, gloves, belt, necklace, earrings, wristband, watch, ring, bag, pin…
- `region` — body region: head · eyes · face · neck · torso · arms · hands · waist · legs · feet · back · accessory. Groups slots for layering + capacity.
- `layer` — ordinal within a region (0 = base → higher = outer). The depth lever (§27.3).
- `side` — optional laterality: left | right | pair (§27.4).

### 27.2 Garments CPR can't express → map + tag
Give the item the *nearest* CPR `system.type` for compatibility; record the truth in `scSlot`:

| Garment | CPR type (compat) | scSlot |
|---|---|---|
| Cape / cloak | jacket | cape |
| Hood | hat (or jacket) | hood |
| Skirt / kilt | bottom | skirt |
| Scarf / muffler | jewelry (or top) | scarf |
| Gloves | jewelry | gloves |
| Belt / sash | jewelry | belt |
| Necklace / choker | jewelry | necklace |
| Wristband / watch | jewelry | wristband / watch |
| Mask / respirator | glasses (or hat) | mask |

This **solves the accessory-cramming:** instead of ten different things all reading as undifferentiated "jewelry," the module distinguishes a watch from a choker from a belt — for slot capacity, recommendations, and reads — while CPR still treats them as jewelry.

### 27.3 Layering — the real depth ⭐
`layer` stacks garments in a region (undershirt → shirt → vest → jacket → coat → cape). Not bookkeeping — it drives mechanics:
- **Covered doesn't read.** A flashy shirt under a grey coat doesn't reach the street; the *outer* layer is what's seen. Shed the coat and the read changes.
- **Concealment.** An outer layer hides inner items, weapons, or armor (ties §23.8 concealment, §13.4 disguise).
- **It gives the §24 toggle teeth.** The *self* view knows every layer; the *as-seen* view shows only what's visible on top. Layering is precisely how "what I'm wearing" and "what they see" diverge — the grey-man-coat-over-flash, finally modeled rather than imagined.

Highest-value addition in this section: it turns an outfit from a flat set into a *stack with visibility*.

### 27.4 Laterality — optional, low-stakes
**Honest take:** which wrist your watch is on rarely changes a read, so `side` is optional and never load-bearing. Where it earns its place:
- **Paired vs single** — two wristbands vs one, a single earring, one-shoulder asymmetry.
- **Asymmetry as expression** — symmetric reads polished/elegant; deliberate asymmetry reads edgy/flashy — a *small* nudge to the read, no more.

Support `side: left | right | pair`, surface it only where it matters, never require it. Depth for those who want it, invisible to those who don't.

### 27.5 Authoring & phase
- These fields join the **frozen authoring schema** (§26.4) — important, since the catalog is about to be tagged: set `scSlot`/`region`/`layer`/`side` *now* so the catalog ships with layering depth instead of retrofitting it.
- Via the `sc.*` bridge today: `sc.slot.<name>`, `sc.region.<name>`, `sc.layer.<n>`, `sc.side.<lr>` (or directly on flags once the Item Style Tab lands, M4).
- Engine: layer→visibility resolution lives in `collect.mjs` (M2) — the collector decides which layers are visible *before* the read runs. Slot taxonomy + capacity feed the budget/Wardrobe logic (M6). Laterality is a light read modifier (M9, or skip).

### 27.6 Wear state, coverage & read priority (v1.9 — from external review)
An outside review proposed several slot additions. **Adopted the ones that *complete* the layering mechanic** (without them, "covered doesn't read" is too crude — a mesh top would wrongly hide what's under it, a coat would only hide your torso and not your arms), **cut the rest.** Framing matters: these aren't new features, they make §27.3 *actually work*.

- **`wearMode`** ⭐ — the garment's *state*, separate from what it is: coat open vs closed, hood raised vs lowered, mask on vs off, bag slung vs carried. Partly a **live toggle** — pull your hood up mid-scene and your read shifts — so it ties to the live layer (M7) and the §24 self/observer view. It *modulates coverage*: an open coat's effective coverage drops and the inner layer reads again. The strongest single addition.
- **`coverage`** (none/partial/major/full) — how much a garment hides, since `layer` alone gives only stacking order. Makes "covered doesn't read" graded: full → inner doesn't read; major → inner contributes weakly; partial (mesh, open vest) → inner still reads. Effective coverage = `coverage` adjusted by `wearMode`.
- **`regions[]`** — a garment covers *all* regions it spans (a coat: torso + arms + back + legs), not one. Required for the visibility cascade to be correct. Keep singular `region` as the primary (sorting/slotting); `regions[]` drives coverage.
- **`readPriority`** (0–3: background · normal · noticeable · statement) — lets a small item punch above its size (a red gang pin reads louder than a plain shirt — ties faction markers). **Supersedes the boolean `statementPiece` (§15)**; graded is strictly better, so it replaces rather than adds.
- **`anchoredTo`** (optional) — a small item attaches to a garment/region (pin→jacket, chain→belt, charm→bag) and **inherits that garment's visibility** (cover the jacket → the pin is covered too). Light, optional; earns its keep only through the visibility cascade.

**Cut — `pairing` (single/pair/set).** Overlaps `side` (which already carries `pair`), and "one ring vs ten" is better served by `readPriority` or the item itself. Granularity without payoff.

**Expanded default `scSlot` list** (open vocabulary — GMs add their own; this ships as the suggested set):
`hat · hood · veil · glasses · mirrorshades · contacts · mask · respirator · makeup · necklace · choker · scarf · tie · undershirt · shirt · overshirt · vest · jacket · coat · cloak · cape · harness · gloves · wristband · watch · ring · nails · belt · sash · chain · holster · pants · skirt · kilt · shorts · leggings · bodysuit · socks · shoes · boots · bag · backpack · pin · badge · patch · charm · implantCover`
The torso ladder (undershirt→shirt→overshirt→vest→jacket→coat→cape) is what makes §27.3 layering real. `implantCover` is notable — a sleeve over a cyberarm *hides the chrome's brand* (ties §23.2). **Principle (agreed with the review):** specific styles (beret, beanie, fedora) are *item names* with `scSlot: hat`, not their own slots.

**Default `wearMode` (v1.11)** — applied when an item sets none. Principle (Christian): the garment's natural, least-concealing worn state, the way it sits when you just put it on IRL; concealment is always a deliberate toggle, never the default.

| scSlot | default wearMode |
|---|---|
| coat · jacket · cape · cloak | open |
| hood | lowered |
| mask · respirator · veil | lowered |
| scarf | loose |
| bag · backpack | slung |
| glasses · mirrorshades | worn |
| everything else | none (no meaningful state) |

---

## 28. Formality / Dress Register (v1.9)

A distinct dimension the review surfaced, and worth adopting: **formality** — the occasion-register of a look. It is **not** a vibe.

- Per-item `formality` 0–4: **intimate · casual · street · formal · ceremonial**. Aggregates to an outfit **dress register**.
- **Why it's not a vibe (§1.1 discipline):** Elegant (a *tone*) ≠ formal (a *register*). You can be elegantly casual (tasteful streetwear) or sleazily formal (a cheap, ill-fitting suit). Register is orthogonal to tone, genre, status, and identity — a clean separate axis, authored per item, never a radar spoke.
- **Mechanical home — it powers systems we already have:** **scene gates / dress codes** ("this club requires formal"), **disguise** (passing as corpo needs the right *register*, not just elegance), and **district fit**. A gala checks formality; a Combat Zone dive doesn't care.
- Optional like everything else; absent = treated as street (2).
- **Phase:** per-item authoring at M4; aggregation + scene-gate/disguise consumption rides the existing gate/disguise logic (M3 engine, M7 live).

---

## 29. System Integration & Coherence (v1.10)

With everything v1.0–1.9 added, the systems compose through **one canonical pipeline order** plus a small set of **precedence rules**. This section is the coherence check — written so the build doesn't have to rediscover how the parts fit.

### 29.1 The canonical engine pipeline (order matters)
Run by `engine/` per the pure-function model (§4.1). The order is load-bearing:
1. **Collect** — equipped items + all styleData fields, chrome, weapons, armor, stats, wounds, context/observer.
2. **Resolve physical visibility** — `layer` + `coverage` + `wearMode` + `regions` + `anchoredTo` compute what is *physically* visible → a **visible set** vs the **full set**. Runs first, because every downstream read must consume the right set.
3. **Aggregate descriptive axes** — genre, vibe, brand reads, perceived status, formality register, colors, chrome — from the chosen set, **each contribution scaled by `readPriority`** (a statement pin outweighs a background sock).
4. **Derive reads** — archetype, faction/affiliation, status — from the aggregations + role + chrome + faction (+ a small vibe nudge).
5. **Compute consequences** — heat, danger, disguise confidence, district fit, social/Garden engagement.
6. **Apply the lens** — for the *observed* view only: perception/recognition gating (observer INT+Perception vs target COOL; brand recognition vs observer literacy; scan-tier scramble).

### 29.2 Two-mode is pervasive (the §24 toggle)
The pipeline runs in two modes; the difference is exactly two switches:
- **Self ("what you are"):** Stage 3+ uses the **full set**; Stage 6 gating **off**.
- **Observed ("how you read"):** Stage 3+ uses the **visible set**; Stage 6 gating **on** for the chosen observer.

So *every consequence has two values.* Concealed weapon → self-danger up, observed-danger flat until drawn. Flashy shirt under a closed coat → self-vibe flashy, observed-vibe muted. The toggle is not a UI trick; it's the same engine run with two context flags — which the pure-engine model (§4.1) makes free.

### 29.3 Two distinct "what's seen" filters — don't conflate
The most likely point of confusion, resolved: **physical visibility (Stage 2)** and **perception (Stage 6)** are different filters that stack in order.
- *Physical:* is it covered? A closed coat hides the shirt — objective; everyone sees the coat.
- *Cognitive:* does the observer notice/recognize what's visible? Gated by their roll + literacy — observer-dependent.

Order: filter to the visible set first, *then* gate by perception. A niche brand that's physically visible can still go unrecognized by a fashion-illiterate observer. Two stages, never merged.

### 29.4 Cross-system precedence rules (conflict resolution)
- **Brand cascade vs explicit fields:** brand contributes defaults (style/cost/heat/vibe/recognition); explicit item fields **stack additively on top — with per-axis caps.** This is the direct lesson of the Budget Planner runaway-stacking bug: never let contributions compound unbounded.
- **`readPriority` is a contribution multiplier, not a flag** — it scales an item's weight uniformly across genre, vibe, and brand aggregation. (It replaced the boolean `statementPiece`.)
- **Status vs formality vs vibe are orthogonal** inputs to the relational systems (disguise, scene gates) — they combine as distinct weighted signals, never double-count. A corpo cover wants high status + formal register + slick/elegant vibe + corporate brand: four signals summed, not one counted four times.
- **flags vs `sc.*` (D4):** unchanged — if an item has a `styleData` flag, its `sc.*` AEs are ignored; the bridge and the flags never both fire for one item.

### 29.5 Maintenance coherence (plumbing kept in sync)
New mechanics created obligations the plumbing honors:
- **Tunables (§18.3) extended** to every new mechanic's constants — coverage→read weights, readPriority multipliers, formality gate thresholds, wearMode modifiers, vibe→social weights, brand full-look bonus, color coordination. *(Done in this revision.)*
- **Migrator (M5) covers every `sc.*` key** defined — including v1.6–1.9 additions (`sc.vibe.*`, `sc.brand`, `sc.slot.*`, `sc.layer.*`, `sc.region.*`, `sc.side.*`). Nothing authored on the bridge is left behind.
- **`sc.*` bridge scope is honest:** good for the high-value signals (vibe, brand, faction, heat) within 5 FX slots; the full slot/layer/coverage/formality richness realistically needs the Item Style Tab (M4) or direct flags. Don't expect the bridge to carry everything.
- **Config domains stay uniform:** vibe tags, scSlot vocabulary, formality labels, wearMode/coverage enums all edit through the same DataStore-backed Config App pattern as every other domain.

### 29.6 Where the systems reinforce (the payoff)
Confirmation that the additions are mutually *amplifying*, not merely non-conflicting:
- Layering + wearMode + coverage → the self/observed toggle gets real teeth (grey-coat-over-flash is modeled).
- Brand + vibe + recognition + visibility → hidden premium chrome's brand stays secret (concealment + recognition compose).
- Formality + status + brand + vibe → disguise/scene-gates get four orthogonal levers instead of one blunt style score.
- readPriority + faction marker → a small gang pin reads loud.
- Everything pure-engine → Wardrobe preview, quick-perceive, Garden, and the public API all run the *same* pipeline; no system computes reads its own way.

### 29.7 Resolved tuning decisions (Christian, v1.11)
- **`wearMode` default → open / least-concealing resting state.** Principle: the default is how a garment naturally sits when you put it on IRL — coat open, hood down, mask lowered. Concealment (closed coat, raised hood, mask up) is always a deliberate toggle, never the default — which lines up exactly with disguise-as-active-choice. Default table in §27.6.
- **Vibe→archetype nudge → low (locked).** Archetype is already determined by stronger signals — genre distribution, role, chrome, faction. Vibe is a light tiebreak only; it must never override those.
- **Stacking caps → tuned on a build, by feel** — and see §29.8: the expanded slot model changes the aggregation math, so the caps (and slot weights) are derived against the *new* slot space, which is exactly why they can't be eyeballed analytically.

### 29.8 Aggregation under the expanded slot model
Christian's catch: adding many slots changes how scores are calculated. The old engine tuned weights and caps against ~7 clothing slots; the model now has 40+ `scSlot` values, layering (several items per region), coverage (some don't read), and `readPriority`. So the aggregation / normalization / cap layer is **derived against the full slot model, not inherited:**
- **Slot weights:** a coat or jacket weighs more than a wristband in genre/vibe/brand aggregation; **coverage-adjusted** (covered → zero or reduced weight); **readPriority-scaled** on top.
- **Caps scale with the realistic slot/layer space**, not a fixed 7-slot number — the reason they're tuned on a build rather than guessed.
- **Self vs Observed differ in the denominator:** covered items drop out of the observed aggregation, so effective weights differ by view (§29.2).
- **M2 parity nuance:** the "match Phase 82 exactly" gate holds for *legacy* items (no new fields). Items using coverage/layering/readPriority **intentionally diverge** — a covered piece Phase 82 counted now doesn't read. Parity here means backward-compatible, not identical.

**Verdict:** the architecture holds. The pipeline order (§29.1) is the spine, the precedence rules (§29.4) are the joints, the expanded-slot aggregation (§29.8) is derived not inherited, and the pure-engine model means one computation path serves every surface. What's left is dial-tuning on a live build, not structural cracks.

---

## 30. Canonical Data Sources & Content — Night City 2045 (v1.12)

R. Talsorian's *Night City* sourcebook (2045, CR3141, 314 pp.) is a canon goldmine for the module's two data-heavy systems. It does **not** demand new features — it richly *populates the systems already designed*, which is ideal now that the design is feature-complete.

### 30.1 What it provides
- **Faction roster, structured entries** — each gang/org carries **Leader · Activities/Themes · Hangouts · Identifiers**. The **`Identifiers`** field (e.g. "popped shirt collars + white alligator mascot"; "denim + ANDERSONS knuckle tattoo"; "armorjack with gang logo on the back"; "colorful oni masks") is a direct match for the **soft-uniform signature** (§21.2) and the faction visual read.
- **26 districts** (matching the macro's existing list) with detailed character → district configs: palette, dominant factions, ambient heat, belonging archetypes, local aesthetic (§28 fit).
- **Per-district NPC statblocks** with full social stats (COOL, Wardrobe & Style, Personal Grooming, Reputation) and **gear + cyberware loadouts** → ready-made **NPC quick-dress templates** (§14.5) and seeds for the **NPC style generator** (§14.6) — with the exact stats the engine reads.
- **Venues / hangouts** (clubs, markets, fashionware salons, clinics) → seeds for **shops** (§21.1) and **scene-gate venues with dress codes** (§28); fashionware salons → chrome/fashionware vendors.
- **Faction rivalries** (narrative allies/enemies) → the **faction tension matrix** (§14.7).
- **2045 currency** — leaders, gang status, district state as of 2045, keeping the campaign's canon accurate.

### 30.2 Refinement: faction `identifiers` / signature field
Add an explicit **`identifiers` / signature** field to the faction config (Config App, §14.1): the canonical visual markers that define the soft-uniform read — colors, garments, tattoos, mascots, logos. This is the bridge between the book's data and the §21.2 recognition mechanic, and it sharpens disguise authenticity (wearing the *right* identifiers reads as the faction).

### 30.3 ⚠️ Copyright boundary for the public package
The sourcebook is RTG's copyrighted commercial IP. For a **public** GitHub/Patreon module:
- **Fine:** using it as *reference* to design fields and to richly populate *your own private game* (factions, districts, NPCs, venues) for your table.
- **Fine:** factual references — canonical district/faction *names*; "Tyger Claws are strong in Old Japantown."
- **Not fine:** bundling RTG's *substantial text or statblocks* (gang descriptions, NPC stats, identifier prose as written) into a shipped public compendium or config — that's redistribution.
- **Therefore:** the public module ships **original / homebrew / thin-template defaults**; the rich canonical data is something a GM imports for their *own* world via the Config App (§14.1). **Audit the existing macro's bundled faction/district defaults against this line before any public release.**

### 30.4 Phase
Pure content/data work, parallel to engineering. The `identifiers` field is a small schema add (M1 config + M4 authoring). NPC templates and venue→shop seeds ride M6–M8. The copyright audit is a pre-release (M8) gate.

---

## 31. Content Ingestion Workflow — sourcebook → module (v1.13)

Goal: pull canon (gangs, districts, archetypes, NPCs, items) from the Night City 2045 book into the module's data structures — adapted/reworded, with the book's new 2045 content represented — without exposing a public, monetized release to RTG/CDPR's IP.

### 31.1 The split that makes this both safe and possible: TOOL vs CONTENT
- **The tool ships; the canon content does not.** The public module ships the *importer + schema + original defaults* (§14.1 import/export, §26 packaging). The RTG-derived data a GM builds is *their world's content*, imported privately — never bundled in the public package.
- **Two content streams:**
  - **Canon entities (RTG's gangs/NPCs/districts):** structure shipped; the GM populates their *own world* from the book they own, via the Config App importer. Private to their table.
  - **Original content (your inventions, in the setting's flavor):** publishable — it's yours. The public catalog grows with original gangs/brands/items/archetypes that fit Night City *without copying RTG's specific creations*. (The §CPR-Batch tone bible already works this way — invent beyond the canon brands, don't reskin.)

### 31.2 The pipeline (rides existing infrastructure — no new engine)
1. GM extracts the *facts* they need from the book (which gang, its identifiers, turf, themes).
2. **Adaptation assist** reworks those into the module's voice and fills the structured fields — faction (name, `identifiers`/signature, colors, activities, hangouts→venues, allies/enemies), archetype (style profile, vibe), item (styleData), district (palette, factions, heat). *Genuine reworking into the module's framing + 2045 tone — not paraphrase-with-synonyms.*
3. Output = Config App import JSON (§14.1 / §21.3) → imported into the GM's world.
4. NPC statblocks → quick-dress templates (§14.5); venues → shops/gates (§21.1, §28). The bulk-tag assist (§26.5) and NPC generator (§14.6) are the same family of tools.

### 31.3 ⚠️ "Reworded" is not a copyright eraser — especially when monetized
Honest boundary (not legal advice):
- Adapting a book *you own* for *your own table* is normal tabletop practice — fine.
- **Reworded ≠ original.** A paraphrase of RTG's specific gangs/NPCs/setting is still *derivative* of protected creative expression. Mechanics/stats aren't copyrightable; the creative content (named gangs, characters, world detail) is — and Cyberpunk is a licensed IP (RTG + CD Projekt).
- **Monetization raises the stakes.** Distributing canon-derived content through Patreon/a paid channel may conflict with the IP holders' fan-content terms (many permit *non-commercial* fan use only). **Check RTG's Homebrew Content Policy and CDPR's fan-content guidelines before monetizing anything canon-derived.**
- **Rule:** canon-derived content stays *private to your table* (imported, not shipped); the *public / monetized* package ships the tooling + your *original* content. This is exactly why §31.1 splits tool from content.

### 31.4 Phase
The importer is the Config App import/export (M3) — no new infra. The adaptation assist is an authoring aid in the §14.6 / §26.5 family (post-M4 content work). The §31.3 boundary is a standing rule, enforced at the M8 release gate (with §30.3).
