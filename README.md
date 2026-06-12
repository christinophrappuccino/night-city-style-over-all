# Night City: Style Over All

*Style Over Substance, mechanized — for Cyberpunk RED on Foundry VTT.*

A FoundryVTT module for the **Cyberpunk RED** system that reads a character's equipped gear and tells you who Night City thinks they are: archetype, style genre, vibe, heat, disguise confidence, district fit, and danger — with a full GM dashboard, a living brand-and-faction economy, an in-world social network, and a pre-styled clothing catalog.

> **Status:** in active development. Converting a mature, play-tested ~19,700-line macro into a proper module. Not yet released — see the roadmap below.

## What it does

- **Five player views** — Style Profile, Chrome, Gear & Optimization, Crew, Social.
- **GM dashboard** — all-party readout, scene gates / dress codes, disguise detector, faction tension scanner.
- **Reads, not just stats** — archetype detection, an expressive *vibe* axis (cool · cute · sexy · sleazy · menacing · flashy · elegant · rugged · scrappy) shown as a radar, heat index, disguise confidence, district fit, danger score.
- **Self vs As-Seen-By** — flip between what a character *is* and how they *read* to a chosen observer; perception-gated and disguise-aware.
- **Brands & factions that matter** — brands cascade into the read; factions carry visual signatures; uniforms are recognized; layering means a coat can hide what's underneath.
- **The Garden** — Ziggurat's social network, where your style performance becomes your social footprint.
- **A clothing catalog** — original Night City brands, pre-tagged, shipped as a compendium.

## Requirements

- Foundry VTT **v12**
- The **Cyberpunk RED** system (`cyberpunk-red-core`)

## Installation

In Foundry: **Add-on Modules → Install Module**, paste the manifest URL:

```
https://github.com/christinophrappuccino/night-city-style-over-all/releases/latest/download/module.json
```

Updates arrive through Foundry's module updater (the manifest always points at the latest release). The **Night City Catalog** compendium (an original starter wardrobe — Ofuda · Brass Lotus · Rustwerk, every piece pre-flagged with style data) installs with the module.

### Building from source

```
npm install        # dev tooling (the Foundry CLI)
npm test           # the engine parity gate
npm run build:packs  # compile packs-src/ → packs/ (LevelDB compendia)
```

Releases are cut by tagging `vX.Y.Z` — GitHub Actions runs the gate, builds the packs, pins the version, and attaches `module.json` + `module.zip`.

## Migrating legacy `sc.*` items (Migration 002)

Items authored under the old macro carry their style metadata as Active Effects with `sc.*` keys. The module reads those forever (**dual-read**), but the modern home for that data is the `styleData` flag, authored on the item sheet's **Style** tab.

**The rules (Decision D4):**

- The engine reads **both** `sc.*` Active Effects and `styleData` flags — old items keep working with no action required.
- If an item has a `styleData` flag, its `sc.*` effects are **ignored entirely** (flags win; nothing is ever double-counted).
- Conversion is **non-destructive**: the migrator writes the flag and leaves the effects in place (now inert). Deleting the flag reverts the item to its effects.
- Converting changes **storage, not results** — a converted item produces byte-identical reads (enforced by the parity gate).

**How to convert:** automatically on first load after updating (world + actor items), per item via the Style tab's *Convert* button, or in bulk with a scope of your choosing (everything / world items / actors / one folder / one actor) from **Settings → Open Config & Tuning → Migration**, with a dry-run report first. Items inside unlinked scene tokens are left alone — dual-read covers them.

### Supported `sc.*` ↔ `styleData` mapping

| Active Effect key | `styleData` field | Meaning |
|---|---|---|
| `sc.archetype.<key> = n` | `archetype: {<key>: n}` | direct archetype signal |
| `sc.style.<key> = n` | `style: {<key>: n}` | style genre signal |
| `sc.district.<key> = n` | `district: {<key>: n}` | district fit signal |
| `sc.faction.<key> = n` | `faction: {<key>: n}` | faction signature — cascades into archetype, virtual styles, chrome, cost, and disguise DC at read time |
| `sc.chrome.<key> = n` | `chrome: {<key>: n}` | chrome read category |
| `sc.vibe.<key> = n` | `vibe: {<key>: n}` | expressive vibe tag |
| `sc.cost = n` | `cost: n` | perceived-cost adjustment (eb) |
| `sc.armor = n` | `armor: n` | perceived-armor adjustment |
| `sc.heat = n` | `heat: n` | flat heat contribution |
| `sc.disguise.dc = n` | `disguiseDc: n` | disguise DC bonus |
| `sc.antiStyle.suppress = n` | `antiStyleSuppress: n` (0–1) | anti-style suppression |
| `sc.slot.<key>` / `sc.region.<key>` / `sc.side.<key>` / `sc.brand.<key>` | `scSlot` / `region` / `side` / `brand` | slot-model bridge tags |
| `sc.layer.<n>` | `layer: n` | layering depth |
| *anything else* | `_unmapped: [...]` | preserved losslessly, never dropped |

Faction cascades are **never baked in** at conversion — the flag stores the raw authored keys, and the cascade is derived at read time exactly as it was for the effects, so retuning the cascade later affects converted and unconverted items identically.

## For developers

- **Architecture & spec:** [`SC-Module-Architecture-Guide.md`](./SC-Module-Architecture-Guide.md) — the authoritative design doc (31 sections).
- **AI-assist instructions:** [`CLAUDE.md`](./CLAUDE.md) — operating rules for development with Claude Code.
- **Reference implementation:** `stylechecker2_0_Phase82.js` — the original macro this module ports.

Built as ES modules for Foundry V12, forward-compatible to V13 → V14. Pure-engine core, CPR-adapter isolation, settings-backed storage with versioned migrations.

### Roadmap (high level)

`M0` scaffold → `M1` data + migrations → `M2` engine extraction → `M3` apps + config UI → `M4` item style tab → `M5` sc.* migration → `M6` wardrobe / shops / uniforms → `M7` live layer + The Garden → `M8` compendium + release → `M9` color math + public API.

### Public API

The module exposes a curated, versioned API for macros and other modules:

```js
const api = game.modules.get("night-city-style-over-all").api;

// The engine pipeline — the same spine every app uses (§29.1).
const reads = api.computeActorReads(actor);                    // self view
const seen  = api.computeActorReads(actor, { view: "observed" }); // what physically shows
// Hypothetical outfits: pass { items } to preview without touching the actor.

// Quick reads & cards
await api.performQuickRead({ scanner, target }); // roll → tier → whispered card
await api.postLookbook(actor);                   // public "fit pic" card

// Configuration
api.getTunables();          // effective formula dials (defaults + GM overlay)
api.presets.list;           // scoring presets (named philosophies)
api.getEngineConfig();      // factions / districts / brands / …

// App openers
api.openStyleChecker(actor); api.openWardrobe(actor);
api.openGMDashboard(); api.openShops(); api.openConfig();
```

Custom hooks fire at the natural seams (names on `api.HOOKS`):

| Hook | When | Payload |
|---|---|---|
| `styleCheckerScanComplete` | a quick read finishes (token scan or lookbook read) | `{ scanner, target, tier, total, read }` |
| `styleCheckerGateVerdict` | a scene-gate verdict posts | `{ actor, gateName, verdict }` |
| `styleCheckerOutfitApplied` | a staged Wardrobe look commits | `{ actor, changed }` |
| `styleCheckerLookbookShared` | a lookbook card is shared | `{ actor }` |

```js
Hooks.on("styleCheckerScanComplete", ({ scanner, target, tier }) => {
  console.log(`${scanner.name} read ${target.name}: ${tier}`);
});
```

Additions keep `api.apiVersion`; renames/removals bump it.

## A note on intellectual property

*Cyberpunk* and *Cyberpunk RED* are the property of R. Talsorian Games and CD Projekt. This is an unofficial, fan-made module and is **not** affiliated with or endorsed by either company. It ships only original content and tooling — it does not include or redistribute copyrighted sourcebook material. Canonical setting data is something a GM imports for their own table from books they own. Please support the official releases.

## Links

- **Source:** `https://github.com/christinophrappuccino/night-city-style-over-all`
- **Support & updates:** *(Patreon — link TBD)*
- **Community:** *(Discord — link TBD)*

## License

TBD — see `LICENSE`. Any code license applies to this module's original code and content only; the Cyberpunk IP remains with its respective owners.
