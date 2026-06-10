/**
 * 002-sc-effects-to-flags.mjs — Migration 002: `sc.*` Active Effects → `styleData` flags.
 *
 * Converts legacy AE-authored items to the §5.2 flag (the M4 Item Style Tab's
 * single-item Convert, scaled up). NON-DESTRUCTIVE by design:
 *   · the Active Effects are LEFT IN PLACE — D4 dual-read means a flagged item's
 *     `sc.*` AEs are simply ignored from then on, so the conversion is reversible
 *     by deleting the flag;
 *   · items that already carry a styleData flag are never overwritten — if they
 *     ALSO have `sc.*` AEs whose parse differs from the flag, that is reported as
 *     a CONFLICT and left alone (flags win);
 *   · unknown `sc.*` categories land losslessly in `_unmapped` (sc-keys.mjs).
 *
 * Because conversion changes storage but not reads (the engine dual-reads), the
 * auto-run on `ready` is safe and idempotent; the same core also powers the
 * GM-facing scoped migrator UI (GM Config → Migration tab).
 *
 * Spec: SC-Module-Architecture-Guide.md §5.4 (Migration 002), §6 M5, §3 D4.
 */

import { MODULE_ID, FLAGS } from "../../constants.mjs";
import { getStyleData } from "../flags.mjs";
import { hasScKeys, styleDataFromAe } from "../sc-keys.mjs";

const LOG = "Night City: Style Over All | migration 002 |";

/** Item types that can carry style metadata (matches the Item Style Tab). */
const CONVERTIBLE_TYPES = new Set(["clothing", "cyberware", "weapon", "armor", "gear", "item"]);

/**
 * Classify one item for conversion. Pure — no writes.
 * @returns {{status: "convert"|"already-flagged"|"conflict"|"no-sc-data"|"empty-sc-data",
 *            styleData?: object, detail?: string}}
 */
export function classifyScItem(item) {
  if (!CONVERTIBLE_TYPES.has(item.type)) return { status: "no-sc-data" };

  const hasAe = hasScKeys(item);
  const flag = getStyleData(item);

  if (flag !== undefined) {
    if (!hasAe) return { status: "already-flagged" };
    // Both present: flags win (D4). Report whether the ignored AEs agree.
    const parsed = styleDataFromAe(item);
    const agrees = parsed && sameStyleSignal(parsed, flag);
    return agrees
      ? { status: "already-flagged", detail: "sc.* AEs match the flag (ignored)" }
      : { status: "conflict", detail: "item has BOTH a styleData flag and differing sc.* AEs — flag wins, AEs ignored" };
  }

  if (!hasAe) return { status: "no-sc-data" };
  const styleData = styleDataFromAe(item);
  if (!styleData) return { status: "empty-sc-data", detail: "sc.* keys present but all zero/inert" };
  return { status: "convert", styleData };
}

/** Loose equality on the signal-bearing styleData fields (ignores bookkeeping). */
function sameStyleSignal(a, b) {
  const strip = (sd) => {
    const { schema, _source, _unmapped, ...rest } = sd ?? {};
    return JSON.stringify(sortKeys(rest));
  };
  return strip(a) === strip(b);
}
function sortKeys(obj) {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) return obj;
  return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, sortKeys(obj[k])]));
}

/**
 * Convert a list of item documents (world or embedded). Set `dryRun` to classify
 * without writing.
 *
 * @param {object[]} items   CPR item documents
 * @param {{dryRun?: boolean}} [opts]
 * @returns {Promise<{scanned:number, converted:object[], conflicts:object[],
 *                    alreadyFlagged:object[], empty:object[], errors:object[]}>}
 */
export async function migrateScItems(items, { dryRun = false } = {}) {
  const report = { scanned: 0, converted: [], conflicts: [], alreadyFlagged: [], empty: [], errors: [] };

  for (const item of items) {
    report.scanned++;
    const row = { id: item.id, uuid: item.uuid ?? item.id, name: item.name, type: item.type, owner: item.parent?.name ?? null };
    try {
      const c = classifyScItem(item);
      switch (c.status) {
        case "convert":
          if (!dryRun) {
            await item.update({ [`flags.${MODULE_ID}.${FLAGS.STYLE_DATA}`]: c.styleData }, { render: false });
          }
          report.converted.push(row);
          break;
        case "conflict":
          report.conflicts.push({ ...row, detail: c.detail });
          break;
        case "already-flagged":
          report.alreadyFlagged.push(row);
          break;
        case "empty-sc-data":
          report.empty.push({ ...row, detail: c.detail });
          break;
        default: // no-sc-data — not part of the report
          break;
      }
    } catch (e) {
      console.error(`${LOG} failed on "${item.name}":`, e);
      report.errors.push({ ...row, detail: e.message });
    }
  }
  return report;
}

// ── scope resolvers (the migrator UI's targets) ──────────────────────────────

/**
 * Resolve a migration scope to a flat item list.
 * @param {"all"|"world"|"actors"|{folderId:string}|{actorId:string}} scope
 * @returns {object[]} item documents
 */
export function resolveScopeItems(scope = "all") {
  const worldItems = () => game.items?.contents ?? [];
  const actorItems = (actors) => (actors ?? []).flatMap((a) => Array.from(a.items?.values?.() ?? a.items ?? []));

  if (scope === "world") return worldItems();
  if (scope === "actors") return actorItems(game.actors?.contents);
  if (scope === "all") return [...worldItems(), ...actorItems(game.actors?.contents)];
  if (scope?.folderId) return worldItems().filter((i) => i.folder?.id === scope.folderId);
  if (scope?.actorId) {
    const actor = game.actors?.get(scope.actorId);
    return actor ? actorItems([actor]) : [];
  }
  return [];
}

/** One-line human summary of a migrateScItems report. */
export function summarizeReport(report) {
  const bits = [`${report.converted.length} converted`];
  if (report.conflicts.length) bits.push(`${report.conflicts.length} conflict(s)`);
  if (report.alreadyFlagged.length) bits.push(`${report.alreadyFlagged.length} already flagged`);
  if (report.empty.length) bits.push(`${report.empty.length} inert`);
  if (report.errors.length) bits.push(`${report.errors.length} error(s)`);
  return `${report.scanned} item(s) scanned — ${bits.join(", ")}.`;
}

/**
 * The auto-run entry (registered in migrations/index.mjs, schema v2): convert every
 * world + actor-embedded item. Storage-only by D4 — reads are identical before and
 * after, so this is safe to run unattended. Unlinked scene-token items are NOT
 * touched (dual-read covers them forever); convert those via the scoped migrator
 * if desired.
 */
export async function migration002() {
  const report = await migrateScItems(resolveScopeItems("all"));
  console.log(`${LOG} ${summarizeReport(report)}`, report);
  if (report.conflicts.length) {
    ui.notifications?.warn(
      `Style Over All: ${report.conflicts.length} item(s) have BOTH a styleData flag and differing sc.* effects (flag wins). See console / GM Config → Migration.`
    );
  }
  return report;
}
