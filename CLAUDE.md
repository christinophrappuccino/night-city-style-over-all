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

**M8 RELEASED (v0.1.0 live on GitHub; CLI-verified; in-Foundry fresh-world check + README screenshots still pending) — M9 IN PROGRESS: M9.1 DONE (246/246) · M9.2 DONE (265/265; charts confirmed in-world, button-skin follow-up landed) · M9.3 CODE-COMPLETE (gate 294/294) — all five chunks: a (Style Checker headline + observer lens) · b (Wardrobe wearMode toggles + as-target-sees-it) · c (GM Overrides §14.3) · d (lookbook §16.4 + unified quick-read §16.3) · e (faction matrix editor §14.7 + brand house pages §13 + Help everywhere). POLISH + TERMINAL ELEVATION LANDED 2026-06-11 · M9.4 CODE-COMPLETE same day except the AppV2 class-swap (gate 303/303): a tuning panel+presets · b public API+hooks · c SVG recolor · d documented path (docs/appv2-migration.md). NEXT: THE BIG IN-WORLD SWEEP (M9.2→M9.4 + the look), then AppV2 one-app-per-session.** M0–M7 are complete and verified in-world:
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

## Immediate next step — THE BIG IN-WORLD SWEEP (M9.2 → M9.4), then AppV2 execution

**M9.4 is CODE-COMPLETE except the AppV2 class-swap (2026-06-11, gate = syntax 90/90 + parity 303/303, all pushed): M9.4a tuning panel + scoring presets (`b9c091c`) · M9.4b public API + hooks (`d81c2c8`) · M9.4c SVG recolor service (`9dff68a`) · M9.4d = the documented path (`docs/appv2-migration.md`) — the class migration is DELIBERATELY sequenced AFTER the sweep (guide D2 escape hatch: don't confound port breakage with unverified-feature breakage). Also landed same day: the polish pass (`a4415b4`+`9ec78b1`), the macro terminal-language elevation (`677a26d`), and a boot hotfix (`5e36e41`: a `*/` inside api.mjs's JSDoc closed the comment early and broke the module's import chain in-world — Christian hit it live; the gate now opens with a SYNTAX PASS, `node --check` over all scripts/**/*.mjs, because behavior checks never parse the Foundry-global apps/integration files).** Template-level hierarchy judgment + macro-mine items (grade rings, portrait frames, voice microcopy) still ride the sweep findings. Next session, in order:

1. **In-world verification sweep** (the done-when for M9.2+M9.3), one pass per surface:
   - *Style Checker:* headline line + 3 heroes render; lens toggle Self↔Seen-by; faction observer → disguise ring/verdict panel; token observer uses their real INT+PER; high-COOL target → "can't get a read"; `?` affordances open definition+breakdown dialogs; Help tab glossary shows live thresholds.
   - *Wardrobe:* coat open/closed toggle flips the covered badge + the observed read; as-target-sees-it panel updates live while staging; `?` header glossary.
   - *GM Dashboard:* scene heatmap; disguise rings; Overrides tab — pin an archetype → thumbtack shows in readout/StyleChecker/scan card; force a disguise verdict → no margin printed; Help tab.
   - *Lookbook:* share from both apps (public card, brand tags); another player clicks "What do I make of them?" → whispered read on THEIR client; counterfeit shows (FAKE) only when an active scan beats the reveal DC.
   - *GM Config:* Factions tab — toggle a rivalry, watch the Tensions tab light up; unpair chip works; search filters. *Shops:* The Houses view renders all registry brands.
2. **While sweeping, also judge the look** (polish + elevation were authored blind): window chrome + scrollbars, terminal type + brackets + scanlines, motion (glow-pulse on the primary read, BLOWN-disguise pulse, slide-ins), chat-card feel. Note anything off; template-level hierarchy fixes ride the findings.
3. **Sweep the M9.4 additions:** GM Config → Tuning — preset bar (apply Strict → overrides badge + Tensions-style behavior shifts; edit one dial → "custom philosophy — forked"), All-dials view + path filter, save from Common view does NOT wipe preset overrides; API smoke from a macro (`game.modules.get("night-city-style-over-all").api.computeActorReads(_token.actor)` + a `styleCheckerScanComplete` Hooks.on logger); recolor — author colors.primary on an SVG-icon item → Wardrobe slot/closet icon tints + lookbook embeds it.
4. **Then the AppV2 class migration** — one app per session, in the order in `docs/appv2-migration.md` (ShopApp → StyleChecker → GMDashboard → Wardrobe → GMConfig → Dialogs), verifying in-world after each. The §25.2 template-hierarchy fixes and macro-mine items can interleave.

**M9 polish invariants (keep):** all spacing/radius/status-color/duration values come from the base.css token block (`--ncsoa-sp-*`, `--ncsoa-r-btn/card/pill`, `--ncsoa-heat-*`, `--ncsoa-worn/template/brand/trend-*`, `--ncsoa-fast`) — never reintroduce raw hexes or off-grid px for these. The token block is scoped to `.ncsoa, .ncsoa-chat-card` (chat cards live outside any `.ncsoa` window — keep both selectors). Micro-labels (uppercase 0.62–0.8em) use 1.5px tracking everywhere. Read-only surfaces (brand pages, garden posts) get NO hover treatment — hover implies clickability. `<details>` folds ride the shared `ncsoa-reveal` baseline in base.css. item-style-tab.css keeps px font sizes ON PURPOSE (isolation from CPR sheet font scaling — not a smell). The `.ncsoa-wb-*` prefix on shared components and the `.gdn-*` garden prefix are historical; renaming was DECLINED (template/JS-selector churn for zero visual payoff) — don't "clean it up".

**M9 elevation invariants (the macro terminal language — Christian chose HYBRID + FULL MOTION, 2026-06-11):** two visual registers, on purpose. **Chrome + showpieces speak terminal**: `--ncsoa-font-display` (Share Tech Mono, bundled in `fonts/` with its OFL license — `fonts` is in the release-zip whitelist) on window titles, tabs, section labels, card labels/values, verdicts, hero callouts, identity names; `[BRACKET]` section titles via `::before/::after` in `--ncsoa-bracket` (#ffed4e — the macro accent, distinct from status yellow); scanline grit on Style Checker (cyan) + GM Dashboard (orange) canvases + chat cards; slashed clip-path corners + diagonal stripe ticks on heroes/brand pages/seen-by panels (the macro stat-box dress). **Dense tool content stays quiet sans** (closet rows, GM tables, config knobs, breakdowns) — don't terminal-ize running text or dense lists. **Motion kit** lives in base.css ONLY (`ncsoa-glow-pulse`/`ncsoa-slide-in`/`ncsoa-box-pulse` + the `prefers-reduced-motion` kill switch that must keep covering card ROOTS, not just descendants); idle loops are reserved for meaningful states (primary read, blazing heat, BLOWN disguise) — never decorative. clip-path clips outer box-shadows — glows go on text/inner elements of cut boxes. Section-title layout is flex-start + `margin-left:auto` meta (NOT space-between — the bracket pseudos are flex items). Still owed from the macro mine (template/content work — judge in-world first): grade-tier ring badges, portrait corner-bracket frames, voice-infused microcopy ("Neural Interface Active", scan flavor lines), diagonal-stripe roll buttons.

**Key invariants standing from M5–M9.3 (keep them):**
- `data/flags.mjs updateStyleData` is THE styleData write — it injects `-=key` deletion markers (Document#update merges; bare writes resurrect deleted keys). Never write the flag directly.
- `services/wardrobe-staging.mjs` invariant: **preview ≡ commit** — gate-enforced.
- Config domains ride `config/index.mjs` (auto-register, GM Config → Data, backups). `socket: true` is already in module.json; the channel is `module.night-city-style-over-all`.
- The shop `trendModifier` hook (services/shops.mjs computedPrice) is where Trends (§14.4) plug in.
- **M9.1:** read factors flow ONE way — `engine/visibility.mjs` resolveVisibility → factors (self = readPriorityMult; observed = × visibility) → `collectScMods` opts.factors / `dressRegister` / `colorCoordination`; `computeActorReads(actor,{view:"self"|"observed"})` picks the view. The engine-config bundle now carries `brands`; `applyColorwayToScMods` merges colorway reads non-destructively. The `palette` fields in factions/districts seeds are HAND-AUTHORED post-macro extensions (headers say so — re-apply if those files are ever regenerated). Slot-model/brand reads dual-read via the same D4 pattern as the cascade.
- **M9.2:** chart/breakdown markup comes ONLY from `templates/partials/*` via the `ncsoa-*` partial names (`apps/components/register.mjs` `registerChartPartials()`, called at init) — never write app-specific chart markup. View models are built by the PURE helpers `apps/components/charts.mjs` (radar·gauge·ring·fingerprint·sparkline·heatmap — all SVG geometry precomputed; Handlebars can't do math) + `breakdown.mjs` (any explainable result → rows); both are node-gate-tested. `engine/metrics.mjs` is THE metric metadata registry: definitions + `metricScale(key, tunables, config)` band builders — gauge zones and the glossary share it, so thresholds are never hand-written in templates. Info affordance: stamp `{{> ncsoa-info key=… label=…}}`, stash explainable results per render (`this._results`, keys = metric registry keys), and call `bindInfoAffordances(html, resolve)` in activateListeners. `styles/charts.css` is the ONE chart stylesheet (§25.3 visual language; colorblind rule: color always paired with shape/label — keep it when extending).
- **M9.2 skin rules:** the form-control skin (buttons/selects/inputs/textareas + the dark `.window-content` canvas) lives ONCE in `styles/base.css` as a zero-specificity `:where()` baseline — per-app CSS declares only ACCENTS on top, never a re-skin (any plain rule overrides the baseline by existing). Every `Dialog.confirm/prompt/new Dialog` the module spawns MUST pass `NCSOA_DIALOG` (exported from `apps/components/register.mjs`) as its options so the dialog rides the `.ncsoa` skin — a dialog without it renders Foundry-parchment with unreadable light text.

**M9.3 state — ALL FIVE CHUNKS CODE-COMPLETE (a headline+lens · b wearMode+as-target-sees-it · c GM Overrides · d lookbook+quick-read · e matrix+house-pages+Help) + the CSS polish pass + the terminal elevation. M9.4 state — a/b/c CODE-COMPLETE, d documented (below). The in-world sweep covers ALL of it.**

**M9.4 invariants (keep):**
- **a (presets):** scoring presets are tier-2 VALUE bundles ONLY (`config/presets.mjs SCORING_PRESETS` — sparse tunables overlays; `validatePresets` makes a typo'd path a gate failure). The active preset is DERIVED (`matchPreset` deep-compares the overlay; empty = Phase 82 Faithful) — never stored, no drift. Tuning saves go through `mergeKnobEdits` (merge into the existing overlay; NEVER rebuild from rendered inputs — that wipes unrendered preset overrides). The full panel auto-generates from `TUNABLES_DEFAULTS` (numeric leaves; arrays are structural and stay preset/JSON-only) — new tunables need zero panel work. The M9.1 color-clash deferral RESOLVED as values-not-structure: clash stays on W&S; presets tune `clashPenaltyPerPair`/`wsDeltaClamp` (anti-style tables are faction-vs-style config — wrong home for self-coordination).
- **b (API):** `scripts/api.mjs buildApi()` is the curated surface (apiVersion 1 — additions free, renames/removals bump it); `scripts/api-hooks.mjs` is a LEAF module (zero imports) so services/apps fire hooks without cycles and node-gated services import it safely — always fire via `fireApiHook` (subscriber errors never break the caller). Hook family: `styleCheckerScanComplete` (in performQuickRead — covers token scan AND lookbook P2P) · `styleCheckerGateVerdict` · `styleCheckerOutfitApplied` · `styleCheckerLookbookShared`. README documents the surface.
- **c (recolor §9.1):** `services/icon-color.mjs` — pure core node-gated (`recolorSvgText`: sentinel #FF00FF→primary / #00FFFF→accent, sentinel presence SUPPRESSES the dominant-fill fallback; structural fills black/white/none never tint). `iconFor` resolution order: baked path → inline data-URI (SVG) → hue-rotate filter (raster) → plain; INLINE NEEDS NO OPT-IN — `colors.recolorIcon` gates BAKING only (§9.1 step 3). Wardrobe icons patch post-render via `data-recolor` attrs (`_applyRecoloredIcons` — keep it in any AppV2 `_onRender`); the lookbook embeds recolored data-URIs in the card. `bakeRecoloredIcon` writes via `updateStyleData` (THE styleData write) + uploads to `ncsoa-recolored/`. Sentinel-fill icon SET = still the Q4 art deliverable.
- **d (AppV2):** `docs/appv2-migration.md` is the plan of record — inventory, V1→V2 mapping, the seven fiddly bits (registerMenu on V12, jQuery shims, window-skin CSS for V2 markup, DialogV2 last), order ShopApp→StyleChecker→GMDashboard→Wardrobe→GMConfig→Dialogs, one per session, in-world verify after each. Templates' `data-action` attrs are already V2-shaped — don't rename. `item-style-tab.mjs` moves only when CPR's sheets do.

**M9.3e invariants (keep):** rivalry editing goes through `services/faction-matrix.mjs` ONLY — `setRivalry` writes SYMMETRIC pairs (both sides' `rivals`), `rivalryPairs` dedupes one-sided legacy entries; the editor persists the whole factions blob via `DataStore.set(SETTINGS.CONFIG_FACTIONS, blob, schema)` after `deepClone(getEngineConfig().factions)` (the live seed object must never be mutated in place). The engine keeps its either-side-counts rivalry semantics — the editor normalizes, the scanner stays tolerant. Brand house pages are a READ-ONLY showcase in the Shop app (`this.view = "shops"|"brands"`), rendered from the registry; brand EDITING stays in GM Config → Config Data. Help surfaces: tabbed apps get a Help tab with the `ncsoa-glossary` partial; non-tabbed apps (Wardrobe) use `openGlossaryDialog()` from components/register.mjs — same metadata, never a third path.

**M9.3d invariants (keep):** the §16 quick-read has ONE path — `services/quick-read.mjs`: `buildTieredRead` (side-effect-free; config/tunables/uniforms passed IN, node-gated) + `performQuickRead` (roll → tier → whispered card → Known-For tally/socket). The token-HUD scan AND the lookbook button both delegate; never compose a tiered read elsewhere. Quick reads run the OBSERVED pipeline (`view:"observed"`) as of M9.3d — covered items can't feed a scan. The lookbook card (`postLookbook`, templates/chat/lookbook.hbs) is PUBLIC by design (whisper: []) and shares the COMMITTED outfit; its footer button is the §16.3 P2P read (scanner = the clicking user's character, computed on their client — `hooks/lookbook.mjs` binds `renderChatMessage`). Recolored lookbook icons ride the §9.1 SVG recolor service (M9.4).

**M9.3c invariants (keep):** GM overrides live on ONE actor flag (`FLAGS.OVERRIDES` via `data/flags.mjs getOverrides/setOverrides` — empty record clears the flag). Application is pure `engine/overrides.mjs applyReadOverrides` and rides the SPINE once (computeActorReads, just before return) so every surface agrees; never re-pin at a surface. Archetype/heat pins rewrite the read (pinned entry at confidence 100 / value re-banded via the shared `heatLevel` helper) and ALWAYS carry `pinned`/`overridden` + a "GM override" component — the §19 breakdown shows the manual hand automatically. Disguise ("holds"/"blown") and brandTier pins have no number to rewrite: surfaces read `reads.overrides` directly (observer lens `forced`/`forcedTier`, GM disguise detector). The MANUAL badge is the thumbtack + `.manual` class (components.css), shown wherever a pinned value surfaces; forced verdicts print NO margin.

**M9.3b invariants (keep):** wearMode live toggles flip ONLY the symmetric `constants.WEAR_MODE_TOGGLE` pairs (open/closed · raised/lowered · on/off · slung/tucked — toggle twice = back; worn/loose/none get no toggle by design). A wear flip is item STATE, not an outfit change: it writes immediately via `updateStyleData` and is NOT staged — the Wardrobe's stage→preview→apply (preview ≡ commit) stays slot-only. The Wardrobe's as-target-sees-it panel runs `computeActorReads(actor, {items: stagedItems, view: "observed"})` — the M6 hypothetical-set seam composes with the M9.1 view switch; zero writes. Covered badges read `reads.visibility.items` (visibility is view-independent; factors differ per view).

**M9.3a invariants (keep):** the observer lens flows ONE way — `services/observers.mjs` is Stage 6 (§29.1): `observerOptions/resolveObserver` (selection strings `street` | `faction:<key>` | `token:<actorId>`, defaults from `tunables.observer`) → `applyObserverLens({reads: <observed run>, observer, config})` → `{tier, reveal, brands, disguise}`. App previews are PASSIVE (INT+PER+`tunables.observer.passiveRollEquivalent`, no die — the token-HUD scan keeps its 1d10); the reveal map mirrors the token-scan tiers (§16.2 strictly-more: minimal = archetype + vibe DESCRIPTOR, partial = +radar/genre/heat/brands, full = +styleTier/danger/drip). `collect(actor,{factors})` is the §27.3 covered-items gate for CPR-native genre counts + perceived cost — OPT-IN, observed path only; the self path must stay byte-identical (parity). `engine/headline.mjs composeHeadline` words the §25.2 line from existing labels only (phrase maps = content copy, fine inline). The faction-observer disguise branch reads the uniforms world setting → in-world check, not a node check.

**M7 landmarks (for future sessions):**
- `engine/garden.mjs` — engagement = f(heat, rep, style) (§21.4); the feed pool is a faithful port of macro `_generateSocialFeed`; RNG is INJECTED (pure; seeded in tests). D7 resolved per the guide's recommendation: read-only with metrics, feedback loop = future toggle.
- `services/sockets.mjs` MESSAGE vocabulary + `isPrimaryGM()` single-writer guard; `hooks/` folder holds all Integration-layer reactivity (live-refresh, scene-style, token-scan, condition-dynamics).
- Event-post store: hidden GARDEN_FEED world setting, capped (tunables.garden.eventCap); CONFIG_GARDEN holds ads + event templates (GM-editable).

**M8 state (code-complete):** git repo initialized (local, branch main); `packs-src/ncsoa-catalog` (12 original items, 3 house brands: Ofuda · Brass Lotus · Rustwerk) builds via `npm run build:packs` and round-trips; release workflow on tag `v*` (gate → packs → version-pinned module.json → whitelist zip — the macro/guide/CLAUDE.md never ship); shop→RollTable gen landed. **Copyright audit verdict:** all shipped copy original, no sourcebook text; OPEN QUESTION (Christian's call): config seeds carry canon faction/district NAMES — fine for free distribution under the fan policy + README disclaimer, but a paid package should swap to original seeds or gate canon behind GM import.

**Repo state:** `main` is pushed to `https://github.com/christinophrappuccino/night-city-style-over-all` (public). Auth is **gh CLI over HTTPS with the `workflow` scope** — origin must stay the HTTPS URL (SSH keys are NOT set up on this machine; an SSH origin fails host-key verification).

**v0.1.0 release (2026-06-10, Actions run green) — verified from the CLI:** release assets live (`module.json` + `module.zip`); the `releases/latest/download/module.json` manifest URL resolves to version 0.1.0 with a pinned download URL; the zip honors the whitelist (no macro/guide/CLAUDE.md/tests/packs-src) and carries the compiled LevelDB pack; extracting that pack with `@foundryvtt/foundryvtt-cli` yields all 12 catalog items with their 3 house-brand `styleData` flags intact.

**To close M8 (manual, in-Foundry):** install into a fresh world via the manifest URL `https://github.com/christinophrappuccino/night-city-style-over-all/releases/latest/download/module.json` and confirm the Night City Catalog compendium appears (the done-when), then grab screenshots for README.

**M9 — the big one (gap analysis 2026-06-11, full guide audit; details in memory `project-m9-scope.md`).** The audit found that several guide-scheduled M3–M7 systems were never built and fold into M9: the **Brand Registry + cascade (§13/§22.1) does not exist** (no `config/brands.mjs`, no engine resolution — `brand` is a cosmetic label today), vibe never aggregates into a profile (§22.3), formality (§28) and `wearMode` (§27.6) are schema-only fields the engine ignores, GM Overrides (§14.3) and the lookbook card (§16.4) are absent, the lens toggle (§24) has no faction/token-specific observers, and **zero §25 charts exist in any template**. M9 runs as four sub-milestones, each ending with a working module:

- **M9.1 — Engine completions — DONE (2026-06-11, gate 246/246):** brand registry + cascade (`engine/cascade.mjs` brand block, `config/brands.mjs`), vibe profile (`engine/vibes.mjs`, canonical 9 spokes confirmed), physical visibility (`engine/visibility.mjs` — wearMode/coverage/regions/anchoredTo + read factors; `collectScMods` opts.factors; `computeActorReads({view})`), dress register (`engine/formality.mjs` + gate criteria + disguise hook), color math (`engine/colors.mjs` — coordination→W&S, faction colorways→scMods, district palette fit; palette seeds on 5 factions/3 districts), recognition gating + counterfeits (`engine/recognition.mjs` + `applyCounterfeitToDisguise` + token-scan card brand rows). Deferred from M9.1: CPR-native genre counts + perception lens are not yet view-gated (rides observer/lens depth, M9.3); color clash lands on W&S not the anti-style tables (rides scoring presets, M9.4).
- **M9.2 — Visual component library (§25) + transparency standard (§19) — CODE-COMPLETE (2026-06-11, gate 265/265; in-world check pending):** radar · gauge · ring · fingerprint bar · sparkline · GM heatmap + breakdown partial + info affordance + help/glossary — built once (`apps/components/` + `templates/partials/` + `styles/charts.css`), demonstrated in the Style Checker (vibe radar w/ self-vs-observed overlay, heat gauge, style-mix fingerprint, ? affordances on the four headline cards, Help tab, Garden engagement sparkline) and the GM Dashboard (scene heatmap, disguise rings vs the passable mark). Headline-read LAYOUT deliberately deferred to M9.3.
- **M9.3 — App-by-app UI/UX rework — CURRENT** (the standing M3–M7 polish agreement) + missing surfaces: headline-read layout, lookbook card, GM overrides UI, observer picker, wearMode live toggles, brand house pages, faction matrix editor.
- **M9.4 — Platform:** full tuning panel + scoring presets (D6 = A+B), public API + custom hooks (`api.mjs`, fire `styleCheckerScanComplete` etc.), SVG recolor service (§9.1) + the sentinel-fill icon set (Q4, art deliverable), AppV2 migration (all five apps are V1 `Application`/`FormApplication`).

**NOT M9 (post-M9/backlog — don't scope-creep):** D6-C expression editor, NPC style generator (§14.6), bulk-tag assist (§26.5), adaptation assist (§31), Garden feedback loop (D7), and the §21.6 backlog (vibe→social-roll modifiers, reputation decay/seasons, paper-doll, economy depth, onboarding, community library).

**The repeatable port pattern (still applies):** read the macro fn → consume decomposed inputs (never the raw actor; that's `collect`'s job) → lift every literal into `config/tunables.mjs` → return a Phase 82-compatible SUPERSET + the explainability envelope → add a `checks/*.mjs` diffing against captured output → `node tests/parity/run.mjs` must stay green.

## What NOT to do

- Don't reimplement engine logic ad hoc or compute reads outside the §29.1 pipeline.
- Don't hardcode formula constants — use Tunables.
- Don't scatter CPR field paths — use the adapter.
- Don't break dual-read, or let flags and `sc.*` both fire for one item.
- Don't patch or fork the CPR system.
- Don't bundle copyrighted sourcebook content in the public package.
- Don't write app-specific chart/breakdown markup — visuals come from the M9.2 shared component library, fed by explainable results.
- Don't narrate these rules or the architecture to end users in UI copy.
