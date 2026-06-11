/**
 * hooks/scene-style.mjs — scene authoring (M7.2, guide §14.8).
 *
 * GM tags a scene with a district and/or a scene gate (right-click the scene in
 * the directory → "Style: Tag District / Gate"). The tags live on a scene flag;
 * the GM dashboard's Gate and Tensions tabs default to the ACTIVE scene's tags
 * (auto-arm), and activating a tagged scene tells the GM the gate is armed.
 *
 * Integration layer: dialogs + hooks only; the flag helpers live in data/flags.mjs.
 */

import { SETTINGS } from "../constants.mjs";
import { DataStore } from "../data/data-store.mjs";
import { getSceneStyle, setSceneStyle } from "../data/flags.mjs";
import { GMDashboardApp } from "../apps/gm-dashboard-app.mjs";
import { NCSOA_DIALOG } from "../apps/components/register.mjs";

/** GM dialog: pick the scene's district + gate. */
export async function openSceneStyleDialog(scene) {
  if (!scene || !game.user?.isGM) return;
  const current = getSceneStyle(scene);
  const districts = DataStore.get(SETTINGS.CONFIG_DISTRICTS) ?? {};
  const gates = DataStore.get(SETTINGS.CONFIG_SCENE_GATES)?.gates ?? {};

  const districtOpts = ['<option value="">— none —</option>',
    ...Object.entries(districts).map(([k, d]) =>
      `<option value="${k}" ${current.district === k ? "selected" : ""}>${d.name || k}</option>`)].join("");
  const gateOpts = ['<option value="">— none —</option>',
    ...Object.entries(gates).map(([k, g]) =>
      `<option value="${k}" ${current.gate === k ? "selected" : ""}>${g.name || k}</option>`)].join("");

  const picked = await Dialog.prompt({
    options: NCSOA_DIALOG,
    title: `Style tags — ${scene.name}`,
    content:
      `<p><label>District (feeds district-fit reads + tension scans)</label><select name="ss-district" style="width:100%">${districtOpts}</select></p>` +
      `<p><label>Scene gate (auto-arms in the GM dashboard when this scene is active)</label><select name="ss-gate" style="width:100%">${gateOpts}</select></p>`,
    label: "Save tags",
    rejectClose: false,
    callback: (html) => ({
      district: html.find("[name='ss-district']").val() || null,
      gate: html.find("[name='ss-gate']").val() || null,
    }),
  });
  if (!picked) return;
  await setSceneStyle(scene, picked);
  ui.notifications?.info(
    `${scene.name} tagged — district: ${picked.district ? (districts[picked.district]?.name ?? picked.district) : "none"}, ` +
    `gate: ${picked.gate ? (gates[picked.gate]?.name ?? picked.gate) : "none"}.`
  );
}

export function registerSceneStyle() {
  // Scene directory context menu entry (GM only).
  Hooks.on("getSceneContextOptions", addContextOption);
  Hooks.on("getSceneDirectoryEntryContext", (_html, options) => addOption(options)); // pre-V13 name

  // Auto-arm on activation: tell the GM and refresh an open dashboard.
  Hooks.on("updateScene", (scene, changes) => {
    if (!changes.active || !game.user?.isGM) return;
    const tags = getSceneStyle(scene);
    if (!tags.gate && !tags.district) return;
    const gates = DataStore.get(SETTINGS.CONFIG_SCENE_GATES)?.gates ?? {};
    if (tags.gate) {
      ui.notifications?.info(`Scene gate armed: ${gates[tags.gate]?.name ?? tags.gate} (${scene.name}).`);
    }
    const dash = GMDashboardApp._instance;
    if (dash?.rendered) {
      dash.gateKey = tags.gate ?? dash.gateKey;
      dash.districtKey = tags.district ?? dash.districtKey;
      dash.render(false);
    }
  });
}

function addContextOption(_html, options) {
  addOption(options);
}

function addOption(options) {
  if (!Array.isArray(options)) return;
  if (options.some((o) => o?.name === "Style: Tag District / Gate")) return;
  options.push({
    name: "Style: Tag District / Gate",
    icon: '<i class="fas fa-map-location-dot"></i>',
    condition: () => !!game.user?.isGM,
    callback: (li) => {
      const id = li?.data?.("documentId") ?? li?.dataset?.documentId ?? li?.dataset?.entryId;
      const scene = game.scenes?.get(id);
      if (scene) openSceneStyleDialog(scene);
    },
  });
}
