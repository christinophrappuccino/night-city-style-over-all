/**
 * migrations/index.mjs — ordered, versioned migration runner.
 *
 * Runs once on `ready`, GM-only, AFTER an auto-backup (guide §5.4). Each migration
 * has a target schema version; the runner applies every migration whose version is
 * greater than the stored schemaVersion, in order, stamping the version after each.
 *
 * Idempotent: re-running with no pending migrations is a no-op (and writes no backup).
 *
 * Spec: SC-Module-Architecture-Guide.md §5.4
 */

import { DataStore } from "../data-store.mjs";
import { backupSettings } from "../backup.mjs";
import { migration001 } from "./001-journals-to-settings.mjs";
import { migration002 } from "./002-sc-effects-to-flags.mjs";

const LOG = "Night City: Style Over All | migrations |";

/**
 * Registered migrations, ascending by `version`. Add new entries here as schema
 * advances (keep CURRENT_SCHEMA in constants.mjs in step with the highest version).
 * @type {{version:number, label:string, run:() => Promise<*>}[]}
 */
const MIGRATIONS = [
  { version: 1, label: "journals-to-settings", run: migration001 },
  { version: 2, label: "sc-effects-to-flags", run: migration002 },
];

/**
 * Apply all pending migrations. GM-only; non-GMs and up-to-date worlds no-op.
 */
export async function runMigrations() {
  if (!game.user?.isGM) return;

  const current = DataStore.getSchemaVersion();
  const pending = MIGRATIONS.filter((m) => m.version > current).sort(
    (a, b) => a.version - b.version
  );

  if (pending.length === 0) {
    console.log(`${LOG} up to date (schema v${current}).`);
    return;
  }

  console.log(
    `${LOG} schema v${current} → v${pending[pending.length - 1].version}; ` +
      `${pending.length} migration(s) pending.`
  );

  // Always back up before mutating settings.
  await backupSettings(`pre-migration-v${current}`);

  for (const m of pending) {
    console.log(`${LOG} running v${m.version} (${m.label})…`);
    await m.run();
    await DataStore.setSchemaVersion(m.version);
    console.log(`${LOG} schema now v${m.version}.`);
  }

  ui.notifications?.info(
    `Night City: Style Over All — data migrated to schema v${DataStore.getSchemaVersion()}.`
  );
}
