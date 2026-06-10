/**
 * backup.mjs — snapshot settings → journal, and restore.
 *
 * World settings are the source of truth; journals are the human-readable mirror +
 * backup (guide §3 D3). Migrations run ONLY after an auto-backup (guide §5.4). The
 * backup is a single JournalEntry holding a `<pre>` JSON page, GM-only.
 *
 * Spec: SC-Module-Architecture-Guide.md §3 D3, §5.4
 */

import { MODULE_ID, SETTINGS } from "../constants.mjs";
import { CONFIGS } from "../config/index.mjs";
import { DataStore } from "./data-store.mjs";

const BACKUP_FOLDER = "Night City: Style Over All — Backups";

/** Escape for safe embedding in <pre> — exact inverse of the migration's unescape. */
function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Wrap JSON in the same styled <pre> the reference macro used (human-readable mirror). */
function wrapJson(obj) {
  const json = JSON.stringify(obj, null, 2);
  return (
    `<pre style="background:#1a1a1a;color:#00ff00;padding:15px;border-radius:5px;` +
    `overflow-x:auto;font-family:'Courier New',monospace;">${escapeHtml(json)}</pre>`
  );
}

/** Ensure (and return) the module's backup JournalEntry folder. */
async function ensureBackupFolder() {
  let folder = game.folders.find(
    (f) => f.name === BACKUP_FOLDER && f.type === "JournalEntry"
  );
  if (!folder) {
    folder = await Folder.create({
      name: BACKUP_FOLDER,
      type: "JournalEntry",
      color: "#ff2a6d",
      sorting: "a",
    });
  }
  return folder;
}

/**
 * Gather all module settings into one plain snapshot object.
 * @returns {{module:string, takenAt:string, schemaVersion:number, configs:Object}}
 */
export function snapshotSettings() {
  const configs = {};
  for (const cfg of CONFIGS) {
    configs[cfg.key] = DataStore.getEnvelope(cfg.key);
  }
  return {
    module: MODULE_ID,
    takenAt: new Date().toISOString(),
    schemaVersion: DataStore.getSchemaVersion(),
    settings: {
      [SETTINGS.ICON_RECOLOR_ENABLED]: game.settings.get(MODULE_ID, SETTINGS.ICON_RECOLOR_ENABLED),
      [SETTINGS.LIVE_REFRESH]: game.settings.get(MODULE_ID, SETTINGS.LIVE_REFRESH),
    },
    configs,
  };
}

/**
 * Write a settings backup to a JournalEntry. GM-only; no-ops for non-GMs.
 * @param {string} [label] short tag included in the journal name (e.g. "pre-migration-v0")
 * @returns {Promise<JournalEntry|null>}
 */
export async function backupSettings(label = "manual") {
  if (!game.user?.isGM) return null;
  const folder = await ensureBackupFolder();
  const snapshot = snapshotSettings();
  const stamp = snapshot.takenAt.replace(/[:.]/g, "-");
  const name = `Backup [${label}] ${stamp}`;
  const journal = await JournalEntry.create({
    name,
    folder: folder.id,
    pages: [
      {
        name: "Settings Snapshot",
        type: "text",
        text: { content: wrapJson(snapshot), format: 1 },
      },
    ],
  });
  console.log(`Night City: Style Over All | backup written → "${name}"`);
  return journal;
}

/**
 * Restore module settings from a backup snapshot object (as produced by
 * snapshotSettings). GM-only. Does not touch settings absent from the snapshot.
 * @param {object} snapshot
 */
export async function restoreSettings(snapshot) {
  if (!game.user?.isGM) return;
  if (snapshot?.module !== MODULE_ID) {
    throw new Error("Refusing to restore: snapshot is not for this module.");
  }
  if (typeof snapshot.schemaVersion === "number") {
    await DataStore.setSchemaVersion(snapshot.schemaVersion);
  }
  for (const cfg of CONFIGS) {
    const env = snapshot.configs?.[cfg.key];
    if (env) await DataStore.setEnvelope(cfg.key, env);
  }
  for (const key of [SETTINGS.ICON_RECOLOR_ENABLED, SETTINGS.LIVE_REFRESH]) {
    if (snapshot.settings && key in snapshot.settings) {
      await game.settings.set(MODULE_ID, key, snapshot.settings[key]);
    }
  }
  console.log("Night City: Style Over All | settings restored from snapshot.");
}
