# CLAUDE.md — Night City: Style Over All

Operating instructions for Claude Code working on this module.

> **Read `SC-Module-Architecture-Guide.md` before writing any code — it is the authoritative spec (31 sections). This file is the quick-reference; the guide is the source of truth. If they appear to conflict, the guide wins — and flag the conflict rather than guessing.**

---

## What this project is

Converting a mature, play-tested ~19,700-line Foundry VTT macro (`stylechecker2_0_Phase82.js`) into a proper FoundryVTT **module** for the **Cyberpunk RED** system (`cyberpunk-red-core`).

The module reads a character's equipped gear and computes how they "read" in Night City — archetype, style genre, vibe, heat, disguise confidence, district fit, danger — plus a GM dashboard, brand/faction systems, an in-world social network ("The Garden"), and a pre-styled clothing catalog.

- **Spec:** `SC-Module-Architecture-Guide.md` — read it.
- **Reference implementation:** `stylechecker2_0_Phase82.js` — the working logic to port. Do **not** discard it; it is the behavioral source of truth for the engine (see the M2 parity gate).
- **Module identity (LOCKED — never change):** id `night-city-style-over-all`, title `Night City: Style Over All`. The id is the flag scope, settings namespace, and socket channel — a one-way door.

## Current status

**M7 DONE — M8 CODE-COMPLETE (awaiting GitHub push + first release tag).** M0–M7 are complete and verified in-world:
- **M0** scaffold · **M1** data layer + Migration 001 + config seeds + backup.
- **M2** engine extraction — all engine modules ported pure/explainable; parity gate green (`node tests/parity/run.mjs`) + M2.5 in-world 10/10.
- **M3** apps — read-only Wardrobe, 5-tab StyleChecker, 5-tab GM Dashboard, GM Config & Tuning. The table can run without the macro.
- **M4** Item Style Tab — dropdown-driven `styleData` authoring injected into CPR item sheets (retires the `sc.*` AE workflow); live cascade preview; `sc.*` read-through + one-click Convert. Verified in-world.
- **M5** Migration 002 + dual-read hardening — `engine/cascade.mjs` (`cascadeStyleData` promoted there + `collectScMods`, the D4 dual-read port of `collectDisguiseModifiers`) wired into the live pipeline: archetypes, heat (incl. the wound/injury fold, restored), GM-dashboard disguise injection. Migration 002 auto-runs (schema v2, non-destructive: AEs left inert) + scoped migrator UI (GM Config → Migration, dry-run + conflict report). Parity gate incl. the AE≡flag identity checks. README documents the `sc.*` ↔ flag table.
- **M6** — hypothetical-set seam (`computeActorReads(actor,{items})`), interactive Wardrobe (stage/commit), outfit presets, GM quick-dress templates, uniforms (soft-signature recognition — NEW engine work, no macro reference), shops (CPR wealth-ledger buys), tailor flow.
- **M7** (gate 200/200) — the live layer: live refresh, scene tags + gate auto-arm, sockets, chat cards, ⭐ live gate runs, token-HUD Scan Style, trends, condition dynamics, Known For, and The Garden (engagement = f(heat, rep, style); D7 = read-only with metrics). **UI/UX polish for everything M3–M7 is deferred to M9 by standing agreement — functionality first.**

The reference macro (`stylechecker2_0_Phase82.js`) is still the behavioral source of truth — keep it. See "Immediate next step" for the M7 resume point.

---

## Non-negotiable rules (do not drift)

1. **Four-layer architecture** (guide §4.1): Integration → Applications → Engine → Data. Dependencies point downward only.
2. **The Engine Rule:** everything in `engine/` is pure — data in, data out. No `game.*`, no `ui.*`, no jQuery, no DOM. Context is passed IN; results returned OUT. Engine functions return **explainable results** `{ value, label, blurb, components, tunablesApplied }`, never bare numbers (guide §4.1, §19, §29). This powers the Wardrobe preview, the self/observer toggle, the API, and tests. Bake it in from the start — retrofitting it later is a rewrite.
3. **The CPR Adapter Rule:** every read of a `cyberpunk-red-core` data path (`system.equipped`, `system.style`, `system.price.market`, role/stat paths, etc.) goes through `data/cpr-adapter.mjs`. One file to fix when the system updates. Never scatter CPR field paths through the codebase.
4. **Never fork or patch CPR — layer over it.** Item *metadata* lives in flags (`flags["night-city-style-over-all"].styleData`). Active Effects are used ONLY for real actor-stat changes (`bonuses.*`, `system.stats.*`). CPR's clothing `system.type` is never replaced — the richer slot model (`scSlot`/`region`/`layer`/`coverage`/`wearMode`/…) lives in flags on top (guide §27).
5. **Dual-read `sc.*` and flags, forever.** Items in the wild use `sc.*` Active Effect keys; the collector reads both. **Flags win:** if an item has a `styleData` flag, its `sc.*` AEs are ignored (no double-count). Decision D4.
6. **No hardcoded formula constants.** Every weight/threshold/cap/baseline reads from the Tunables config (`config/tunables.mjs`), so the GM can tune without code and the breakdown UI can show which value applied (guide §18).
7. **Storage:** world settings are the source of truth; journals are the human-readable mirror + backup; migrations are versioned, run once on `ready`, GM-only, after an auto-backup (guide §3 D3, §5.4).
8. **Copyright boundary:** ship the tooling + original content only. Canon-derived content (RTG's Night City 2045 gangs/NPCs/districts) is the GM's private import, never bundled in the public/Patreon package. Do not commit copyrighted sourcebook text or statblocks (guide §30.3, §31.3).

## The engine pipeline (the spine — guide §29.1)

Every read flows through this order. Do not let any feature compute reads its own way:

1. **Collect** — items + styleData, chrome, weapons, armor, stats, wounds, context/observer.
2. **Resolve physical visibility** — `layer` · `coverage` · `wearMode` · `regions` · `anchoredTo` → **visible set** vs **full set**.
3. **Aggregate axes (× `readPriority`)** — genre, vibe, brand, status, formality, colors, chrome.
4. **Derive reads** — archetype, faction/affiliation, status.
5. **Compute consequences** — heat, danger, disguise, district fit, social/Garden.
6. **Apply the lens** — perception/recognition gating (observed view only).

**Two-mode:** the pipeline runs twice for the self/observer toggle — **Self** (full set, gating off) vs **Observed** (visible set, gating on). Same engine, two context flags (guide §24, §29.2).

**Conceptual model (guide §1.1):** three layers — inputs → characterization (Genre/Vibe authored, Archetype derived) → consequences. Perception is a *lens*, not an output. Heat/danger draw on the whole character, not just the three axes.

---

## Phase plan (guide §6, §17, §20, §21.5, §29)

Build in order; **each phase ends with a working module.** Do not jump ahead to features before the foundation lands.

- **M0** — Scaffold & smoke test: loadable do-nothing module.
- **M1** — Data layer + Migration 001 (journals→settings) + config defaults + backup.
- **M2** ⭐ — Engine extraction (pure modules) + `cpr-adapter` + explainable results + the parity gate. The big lift; the macro stays as reference throughout.
- **M3** — Player + GM apps ported; Config App (form editor); chart/breakdown components; read-only Wardrobe (parity harness).
- **M4** — Item Style Tab (retires the AE workflow); authoring for brand/vibe/slots/colors/formality.
- **M5** — Migration 002 (`sc.*`→flags) + dual-read hardening.
- **M6** — Wardrobe (full) + outfit presets + shops + uniforms + tailor flow.
- **M7** — Live layer: hooks, sockets, chat cards, token HUD, quick-perceive, The Garden.
- **M8** — Compendium packs (catalog) + GitHub release/Actions + copyright audit.
- **M9** — Color math, scoring presets, tuning panel, public API, AppV2 readiness.

**M2 parity gate:** for *legacy* items (no new fields), engine output must match `stylechecker2_0_Phase82.js` exactly across saved test actors. Items using new fields (coverage/layering/readPriority/vibe/etc.) intentionally diverge — parity means backward-compatible, not identical (guide §29.8).

---

## Conventions

- ES modules (`.mjs`). Entry point: `scripts/main.mjs`. Single source of truth for IDs/keys/enums: `scripts/constants.mjs`.
- Folder structure: see guide §4.2 (`engine/` `apps/` `data/` `config/` `services/` `hooks/` `templates/` `styles/` `packs-src/`).
- Target Foundry **V12** (`compatibility.verified = "12"`), architecture forward-compatible to V13 → V14. Keep ApplicationV2-sensitive code isolated in `apps/` so the eventual migration is contained.
- No hard dependencies; `socket: true` from day one; libWrapper only if ever genuinely needed (D5).
- Reference the installed `cyberpunk-red-core` system source for real data paths — don't guess them, don't copy the system into this repo.
- Prefer small, reviewable commits aligned to the current phase.

## Reference docs in this repo

- `SC-Module-Architecture-Guide.md` — the spec (authoritative).
- `stylechecker2_0_Phase82.js` — reference implementation (behavioral truth for the engine).
- `ImportExportItemsforCPRStyleChecker_readme.md` — 72-column batch format + the `sc.*` keys + the bridge.
- `SC-Disguise-Effects-Guide.md` — the `sc.*` key system.
- `CPR-Batch-Item-Creation-Guide.md` — content voice / tone bible (for catalog work).

---

## Immediate next step — M7 (Live layer: hooks · sockets · chat · token HUD · The Garden)

**Key invariants standing from M5/M6 (keep them):**
- `data/flags.mjs updateStyleData` is THE styleData write — it injects `-=key` deletion markers (Document#update merges; bare writes resurrect deleted keys). Never write the flag directly.
- `services/wardrobe-staging.mjs` invariant: **preview ≡ commit** — gate-enforced.
- Config domains ride `config/index.mjs` (auto-register, GM Config → Data, backups). `socket: true` is already in module.json; the channel is `module.night-city-style-over-all`.
- The shop `trendModifier` hook (services/shops.mjs computedPrice) is where Trends (§14.4) plug in.

**M7 is CODE-COMPLETE — all 10 items (gate 200/200). M7.1–7.9 verified in-world; M7.10 (The Garden) awaits its verify pass:** Style Checker → Social tab (profile · trending · feed with engagement-scaled metrics + ads), run a gate / flip a trend → event posts lead the feed, GM pen button hand-posts. The milestone's "done when" (live gate verdicts) was verified earlier.

**M7 landmarks (for future sessions):**
- `engine/garden.mjs` — engagement = f(heat, rep, style) (§21.4); the feed pool is a faithful port of macro `_generateSocialFeed`; RNG is INJECTED (pure; seeded in tests). D7 resolved per the guide's recommendation: read-only with metrics, feedback loop = future toggle.
- `services/sockets.mjs` MESSAGE vocabulary + `isPrimaryGM()` single-writer guard; `hooks/` folder holds all Integration-layer reactivity (live-refresh, scene-style, token-scan, condition-dynamics).
- Event-post store: hidden GARDEN_FEED world setting, capped (tunables.garden.eventCap); CONFIG_GARDEN holds ads + event templates (GM-editable).

**M8 state (code-complete):** git repo initialized (local, branch main); `packs-src/ncsoa-catalog` (12 original items, 3 house brands: Ofuda · Brass Lotus · Rustwerk) builds via `npm run build:packs` and round-trips; release workflow on tag `v*` (gate → packs → version-pinned module.json → whitelist zip — the macro/guide/CLAUDE.md never ship); shop→RollTable gen landed. **Copyright audit verdict:** all shipped copy original, no sourcebook text; OPEN QUESTION (Christian's call): config seeds carry canon faction/district NAMES — fine for free distribution under the fan policy + README disclaimer, but a paid package should swap to original seeds or gate canon behind GM import.

**To finish M8 (user actions):** create the GitHub repo + `git remote add origin && git push -u origin main`, tag `v0.1.0` + push tags (cuts the release), verify a fresh world installs by manifest and gets the catalog, screenshots for README.

**Then M9 — polish (guide §6 M9):** color math (§9.2) + SVG recolor service (§9.1), scoring presets + full tuning panel, public API + custom hooks (`api.mjs`, fire `styleCheckerScanComplete` etc.), AppV2 readiness (D2), and the standing UI/UX rework of every M3–M7 app (the "make it better later" agreement).

**The repeatable port pattern (still applies):** read the macro fn → consume decomposed inputs (never the raw actor; that's `collect`'s job) → lift every literal into `config/tunables.mjs` → return a Phase 82-compatible SUPERSET + the explainability envelope → add a `checks/*.mjs` diffing against captured output → `node tests/parity/run.mjs` must stay green.

## What NOT to do

- Don't reimplement engine logic ad hoc or compute reads outside the §29.1 pipeline.
- Don't hardcode formula constants — use Tunables.
- Don't scatter CPR field paths — use the adapter.
- Don't break dual-read, or let flags and `sc.*` both fire for one item.
- Don't patch or fork the CPR system.
- Don't bundle copyrighted sourcebook content in the public package.
- Don't jump ahead to M7+ features (hooks, sockets, chat cards, The Garden) before M6 lands.
- Don't narrate these rules or the architecture to end users in UI copy.
