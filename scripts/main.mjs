/**
 * main.mjs — module entry point.
 *
 * init  : register world settings (data layer).
 * ready : run pending migrations (GM-only, after auto-backup), then log version.
 *
 * Spec: SC-Module-Architecture-Guide.md §4.2, §4.3, §5.4
 */

import { MODULE_ID, SETTINGS } from "./constants.mjs";
import { DataStore } from "./data/data-store.mjs";
import { setTunablesOverlayProvider } from "./config/tunables.mjs";
import { GMConfigApp } from "./apps/gm-config-app.mjs";
import { backupSettings, restoreSettings, snapshotSettings } from "./data/backup.mjs";
import { runMigrations } from "./data/migrations/index.mjs";
import { computeActorReads } from "./services/style-reads.mjs";
import { previewItemCascade } from "./services/item-preview.mjs";
import { styleDataFromAe, dualReadStyleData } from "./data/sc-keys.mjs";
import { collectScMods } from "./engine/cascade.mjs";
import { migrateScItems, resolveScopeItems, classifyScItem } from "./data/migrations/002-sc-effects-to-flags.mjs";
import { WardrobeApp } from "./apps/wardrobe-app.mjs";
import { StyleCheckerApp } from "./apps/style-checker-app.mjs";
import { GMDashboardApp } from "./apps/gm-dashboard-app.mjs";
import { ShopApp } from "./apps/shop-app.mjs";
import { injectItemStyleTab } from "./apps/item-style-tab.mjs";
import { registerLiveRefresh } from "./hooks/live-refresh.mjs";
import { registerSceneStyle } from "./hooks/scene-style.mjs";
import { registerTokenScan } from "./hooks/token-scan.mjs";
import { registerConditionDynamics } from "./hooks/condition-dynamics.mjs";
import { registerSocket, onSocket, MESSAGE, isPrimaryGM } from "./services/sockets.mjs";
import { recordPublicRead } from "./services/known-for.mjs";

/** Namespaced console logging so module output is easy to filter. */
const LOG_PREFIX = "Night City: Style Over All |";

Hooks.once("init", () => {
  console.log(`${LOG_PREFIX} init`);

  DataStore.registerSettings();

  // Let getTunables() shadow the defaults with the GM's overlay (Tuning Panel writes
  // it). Guarded inside getTunables — falls back to defaults if settings aren't ready.
  setTunablesOverlayProvider(() => DataStore.get(SETTINGS.TUNABLES));

  // Config App entry in Foundry's Settings → Module Settings (GM tool).
  game.settings.registerMenu(MODULE_ID, "configApp", {
    name: "Night City: Style Over All — Configuration",
    label: "Open Config & Tuning",
    hint: "Tune formula dials and manage the style configs.",
    icon: "fas fa-sliders",
    type: GMConfigApp,
    restricted: true,
  });

  // Expose the public-ish API: data layer + the engine pipeline + app openers.
  const mod = game.modules.get(MODULE_ID);
  if (mod) {
    mod.api = {
      DataStore,
      backup: { backupSettings, restoreSettings, snapshotSettings },
      computeActorReads,
      previewItemCascade,                 // preview one item's styleData cascade (§8.3)
      styleDataFromAe,                    // parse an item's sc.* AEs → styleData (§8.4 / M5)
      dualReadStyleData,                  // flag-wins dual read for one item (D4)
      collectScMods,                      // actor-wide sc.*/styleData modifiers (M5)
      migration: { migrateScItems, resolveScopeItems, classifyScItem }, // Migration 002 (§5.4)
      openStyleChecker: (actor, tab) => StyleCheckerApp.openForActor(actor, tab),
      openWardrobe: (actor) => WardrobeApp.openForActor(actor),
      openGMDashboard: (tab) => GMDashboardApp.open(tab),
      openShops: () => ShopApp.open(),
      openConfig: () => new GMConfigApp().render(true),
    };
  }
});

// Scene-control launch points: GM Dashboard (GM-only, guide §6 M3) and the Shop
// browser (everyone — players buy for their own characters, §21.1 M6).
Hooks.on("getSceneControlButtons", (controls) => {
  const tokenControl = Array.isArray(controls) ? controls.find((c) => c.name === "token") : controls?.token;
  const tools = tokenControl?.tools;
  if (!tools) return;
  const add = (button) => {
    if (Array.isArray(tools)) tools.push(button);
    else tools[button.name] = button;
  };
  if (game.user?.isGM) {
    add({
      name: "ncsoa-gm-dashboard",
      title: "Style Checker — GM Dashboard",
      icon: "fas fa-chess-king",
      button: true,
      onClick: () => GMDashboardApp.open(),
    });
  }
  add({
    name: "ncsoa-shops",
    title: "Night City Shops",
    icon: "fas fa-bag-shopping",
    button: true,
    onClick: () => ShopApp.open(),
  });
});

// Actor-sheet launch points (guide §6 M3): header buttons that open the full Style
// Checker and the read-only Wardrobe. Character/mook actors only.
Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
  const actor = sheet?.actor;
  if (!actor || (actor.type !== "character" && actor.type !== "mook")) return;
  buttons.unshift({
    label: "Wardrobe",
    class: "ncsoa-wardrobe-btn",
    icon: "fas fa-shirt",
    onclick: () => WardrobeApp.openForActor(actor),
  });
  buttons.unshift({
    label: "Style",
    class: "ncsoa-style-btn",
    icon: "fas fa-id-card",
    onclick: () => StyleCheckerApp.openForActor(actor),
  });
});

// Item Style Tab (guide §6 M4, §8): inject the dropdown-driven styleData authoring
// tab into clothing/cyberware/weapon/armor/gear item sheets — retires the sc.* AE
// workflow. Guarded inside the handler on item type + CPR system being active.
Hooks.on("renderItemSheet", injectItemStyleTab);

// Live layer (guide §6 M7): item/actor/effect changes re-render open Style windows;
// scene tags (district/gate) author + auto-arm.
registerLiveRefresh();
registerSceneStyle();
registerTokenScan();
registerConditionDynamics();

Hooks.once("ready", async () => {
  // Socket layer (M7): typed GM→player pushes ride module.<id>.
  registerSocket();
  onSocket(MESSAGE.GATE_VERDICT, ({ actorName, gateName, status }) => {
    // The whispered chat card is the durable record; this is the live ping.
    const notify = status === "green" ? "info" : status === "yellow" ? "warn" : "error";
    const text = status === "green" ? "cleared" : status === "yellow" ? "flagged" : "TURNED AWAY";
    ui.notifications?.[notify](`${gateName}: ${actorName} ${text} — verdict card in chat.`);
  });
  // Players can't write Known For tallies on actors they don't own — the
  // primary GM client does it for them (§16.6).
  onSocket(MESSAGE.RECORD_READ, ({ actorId, topArch }) => {
    if (!isPrimaryGM()) return;
    const actor = game.actors?.get(actorId);
    if (actor) recordPublicRead(actor, topArch);
  });

  try {
    await runMigrations();
  } catch (e) {
    console.error(`${LOG_PREFIX} migration error:`, e);
    ui.notifications?.error(
      "Night City: Style Over All — migration failed; see console. Your data backup is in the Journals tab."
    );
  }

  const version = game.modules.get(MODULE_ID)?.version ?? "unknown";
  console.log(`${LOG_PREFIX} ready — v${version} (schema v${DataStore.getSchemaVersion()})`);
});
