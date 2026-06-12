/**
 * api.mjs — the public API surface (M9.4b, guide §4.2 Integration layer / M9).
 *
 * Exposed as game.modules.get("night-city-style-over-all").api. This is the
 * CURATED, stable surface for macros and other modules — everything here rides
 * the same §29.1 pipeline as the apps (the Engine Rule's payoff: one
 * computation path serves every surface). Additions are fine; renames and
 * removals are breaking — bump apiVersion.
 *
 * Custom hooks: see api-hooks.mjs (also exposed here as api.HOOKS).
 */

import { DataStore } from "./data/data-store.mjs";
import { backupSettings, restoreSettings, snapshotSettings } from "./data/backup.mjs";
import { computeActorReads } from "./services/style-reads.mjs";
import { previewItemCascade } from "./services/item-preview.mjs";
import { styleDataFromAe, dualReadStyleData } from "./data/sc-keys.mjs";
import { collectScMods } from "./engine/cascade.mjs";
import { migrateScItems, resolveScopeItems, classifyScItem } from "./data/migrations/002-sc-effects-to-flags.mjs";
import { getTunables, TUNABLES_DEFAULTS } from "./config/tunables.mjs";
import { SCORING_PRESETS, matchPreset } from "./config/presets.mjs";
import { getEngineConfig } from "./services/engine-config.mjs";
import { performQuickRead, buildTieredRead } from "./services/quick-read.mjs";
import { postLookbook } from "./services/chat-cards.mjs";
import { iconFor, bakeRecoloredIcon, recolorSvgText } from "./services/icon-color.mjs";
import { glossary } from "./engine/metrics.mjs";
import { WardrobeApp } from "./apps/wardrobe-app.mjs";
import { StyleCheckerApp } from "./apps/style-checker-app.mjs";
import { GMDashboardApp } from "./apps/gm-dashboard-app.mjs";
import { ShopApp } from "./apps/shop-app.mjs";
import { GMConfigApp } from "./apps/gm-config-app.mjs";
import { API_HOOKS } from "./api-hooks.mjs";

/** Build the api object attached at init. */
export function buildApi() {
  return {
    apiVersion: 1,

    // ── the engine pipeline (§29.1 — the same spine every app uses) ─────────
    /** Full reads for an actor. opts: { items, view: "self"|"observed", config } */
    computeActorReads,
    /** One item's styleData cascade, previewed (§8.3). */
    previewItemCascade,
    /** Actor-wide sc-key + styleData modifiers, dual-read (D4/M5). */
    collectScMods,

    // ── quick reads (§16.2/§16.3) ────────────────────────────────────────────
    /** Roll a live read of `target` by `scanner` and post the whispered card. */
    performQuickRead,
    /** Compose a tiered read object without rolling or posting (pure). */
    buildTieredRead,
    /** Share an actor's committed outfit as a public lookbook card (§16.4). */
    postLookbook,

    // ── §9.1 icon recolor ────────────────────────────────────────────────────
    /** Resolve an item's display icon honoring its colorway (inline/baked/filter). */
    iconFor,
    /** Upload a recolored copy and point styleData (and optionally item.img) at it. */
    bakeRecoloredIcon,
    /** The pure sentinel-fill/dominant-fill SVG recolor (string in, string out). */
    recolorSvgText,

    // ── configuration ────────────────────────────────────────────────────────
    /** The effective tunables (defaults + the GM's overlay). */
    getTunables,
    TUNABLES_DEFAULTS,
    /** Scoring presets (§18.4 D6=B) + the overlay→preset matcher. */
    presets: { list: SCORING_PRESETS, match: matchPreset },
    /** The live engine config bundle (factions/districts/brands/…). */
    getEngineConfig,
    /** Metric definitions + live threshold bands (§19.2). */
    glossary,

    // ── data layer ───────────────────────────────────────────────────────────
    DataStore,
    backup: { backupSettings, restoreSettings, snapshotSettings },
    styleDataFromAe,
    dualReadStyleData,
    migration: { migrateScItems, resolveScopeItems, classifyScItem },

    // ── app openers ──────────────────────────────────────────────────────────
    openStyleChecker: (actor, tab) => StyleCheckerApp.openForActor(actor, tab),
    openWardrobe: (actor) => WardrobeApp.openForActor(actor),
    openGMDashboard: (tab) => GMDashboardApp.open(tab),
    openShops: () => ShopApp.open(),
    openConfig: () => new GMConfigApp().render(true),

    // ── custom hooks (subscribe with Hooks.on(api.HOOKS.…)) ─────────────────
    HOOKS: API_HOOKS,
  };
}
