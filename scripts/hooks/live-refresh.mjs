/**
 * hooks/live-refresh.mjs — the live layer's heartbeat (M7.1, guide §6 M7).
 *
 * Equip something on the CPR sheet and every open Style window updates: item
 * create/update/delete, actor updates, and Active Effect changes re-render the
 * affected Wardrobe/StyleChecker windows (actor-matched) and the GM Dashboard /
 * Shop browser (scene/wealth-wide). Renders are debounced per window so a batched
 * `updateEmbeddedDocuments` (Wardrobe commit, quick-dress) repaints once, not once
 * per document.
 *
 * Instance state survives re-render by design — the Wardrobe's staged set, closet
 * search, and the dashboard's tab/selections are instance fields, so a live
 * refresh never stomps what the user is doing.
 *
 * Gated on the LIVE_REFRESH world setting (registered since M1). Integration
 * layer: this file may import apps; nothing imports it but main.mjs.
 */

import { MODULE_ID, SETTINGS } from "../constants.mjs";
import { WardrobeApp } from "../apps/wardrobe-app.mjs";
import { StyleCheckerApp } from "../apps/style-checker-app.mjs";
import { GMDashboardApp } from "../apps/gm-dashboard-app.mjs";
import { ShopApp } from "../apps/shop-app.mjs";

const RENDER_DEBOUNCE_MS = 150;
const pending = new Map(); // appId → timeout

function queueRender(app) {
  clearTimeout(pending.get(app.appId));
  pending.set(app.appId, setTimeout(() => {
    pending.delete(app.appId);
    if (app.rendered) app.render(false);
  }, RENDER_DEBOUNCE_MS));
}

function liveRefreshEnabled() {
  try {
    return game.settings.get(MODULE_ID, SETTINGS.LIVE_REFRESH);
  } catch {
    return true;
  }
}

const isReadableActor = (actor) =>
  actor?.documentName === "Actor" && (actor.type === "character" || actor.type === "mook");

/** Re-render every open Style window the change touches. */
function refreshFor(actor) {
  if (!isReadableActor(actor) || !liveRefreshEnabled()) return;
  for (const app of Object.values(ui.windows)) {
    if (app instanceof WardrobeApp || app instanceof StyleCheckerApp) {
      if (app.actor?.id === actor.id) queueRender(app);
    } else if (app instanceof GMDashboardApp || app instanceof ShopApp) {
      queueRender(app); // scene-wide readouts / buyer wealth — any actor change matters
    }
  }
}

/** The actor behind an embedded document (item or effect, however nested). */
function owningActor(doc) {
  let p = doc?.parent;
  while (p && p.documentName !== "Actor") p = p.parent;
  return p ?? null;
}

export function registerLiveRefresh() {
  for (const hook of ["createItem", "updateItem", "deleteItem"]) {
    Hooks.on(hook, (item) => refreshFor(owningActor(item)));
  }
  for (const hook of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
    Hooks.on(hook, (effect) => refreshFor(owningActor(effect)));
  }
  Hooks.on("updateActor", (actor) => refreshFor(actor));
}
