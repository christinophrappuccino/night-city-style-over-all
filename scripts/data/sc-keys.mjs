/**
 * sc-keys.mjs — the canonical `sc.*` Active-Effect ⇄ `styleData` flag mapping.
 *
 * The legacy authoring workflow encodes item metadata as Active Effects with
 * `sc.<category>.<sub>` keys (e.g. `sc.faction.tyger_claws = 25`). The Item Style
 * Tab (M4) authors the same metadata directly to the `styleData` flag, and the
 * single-item / bulk migrator (M5) converts old AE items to flags. Both need ONE
 * faithful parser of the `sc.*` vocabulary — this file.
 *
 * Fidelity rules (mirror the reference engine's `collectDisguiseModifiers`,
 * macro §8125–8287, so a converted item reads identically to the AE item):
 *   · Skip disabled effects (the engine only counts enabled ones — D4 parity).
 *   · `parseFloat(value) || 0`, then skip zero (zero contributes nothing).
 *   · Store the RAW authored keys only. The faction→archetype/style/chrome/cost/DC
 *     CASCADE is derived at READ time by the engine, NOT baked in here — so the
 *     flag carries the same authorial intent the AE did.
 *
 * Pure: reads documents only through the cpr-adapter effect helpers. No game.*,
 * no ui.*, no writes.
 *
 * Spec: SC-Module-Architecture-Guide.md §5.2 (styleData), §8.4 (read-through /
 * convert), §27.5 (slot bridge keys), §5.4 (Migration 002, M5).
 */

import * as cpr from "./cpr-adapter.mjs";
import { getStyleData } from "./flags.mjs";
import { CURRENT_SCHEMA } from "../constants.mjs";

/** The Active-Effect key namespace for all SC metadata. */
export const SC_PREFIX = "sc.";

/**
 * `sc.<category>` → how it lands in styleData.
 *  · kind "map"    — `sc.cat.<sub> = n` accumulates into `styleData[field][sub] += n`.
 *  · kind "scalar" — `sc.cat = n` accumulates into `styleData[field] += n`.
 *  · kind "scalarSub" — `sc.cat.<sub> = n`; only the listed `sub` is honored
 *                        (e.g. `sc.disguise.dc`, `sc.antiStyle.suppress`).
 *  · kind "tag"    — `sc.cat.<sub> = truthy` sets a single-valued `styleData[field] = sub`
 *                    (the §27.5 slot bridge: `sc.slot.cape`, `sc.side.pair`, …).
 *  · kind "tagNum" — like "tag" but the value comes from the numeric suffix
 *                    (`sc.layer.2` → `layer = 2`).
 *
 * CORE (the 10 parity categories the engine reads today) + BRIDGE (the v1.7+
 * slot/brand/vibe keys the guide §27.5 documents on the AE bridge). Anything not
 * here is preserved verbatim in `_unmapped` so conversion never silently drops data.
 */
export const SC_CATEGORY_MAP = Object.freeze({
  // ── CORE — macro collectDisguiseModifiers ────────────────────────────────
  archetype: { kind: "map", field: "archetype" },
  style:     { kind: "map", field: "style" },
  district:  { kind: "map", field: "district" },
  faction:   { kind: "map", field: "faction" },
  chrome:    { kind: "map", field: "chrome" },
  cost:      { kind: "scalar", field: "cost" },
  armor:     { kind: "scalar", field: "armor" },
  heat:      { kind: "scalar", field: "heat" },
  disguise:  { kind: "scalarSub", field: "disguiseDc", sub: "dc" },
  antiStyle: { kind: "scalarSub", field: "antiStyleSuppress", sub: "suppress", clamp: [0, 1] },
  // ── BRIDGE — v1.7+ slot model + brand/vibe (guide §27.5) ──────────────────
  vibe:   { kind: "map", field: "vibe" },
  slot:   { kind: "tag", field: "scSlot" },
  region: { kind: "tag", field: "region" },
  side:   { kind: "tag", field: "side" },
  brand:  { kind: "tag", field: "brand" },
  layer:  { kind: "tagNum", field: "layer" },
});

/** True if a change key targets the SC namespace. */
export const isScKey = (key) => typeof key === "string" && key.startsWith(SC_PREFIX);

/** Every enabled `sc.*` change on an item, flattened to {key, value, sub, effectName}.
 *  Disabled effects are skipped (engine parity). Zero/blank values are kept here
 *  (the display read-through shows them); the styleData builder drops zeros. */
export function scSourcesFromAe(item) {
  const out = [];
  for (const effect of cpr.getItemEffects(item)) {
    for (const change of cpr.getEffectChanges(effect)) {
      if (!isScKey(change.key)) continue;
      out.push({
        key: change.key,
        value: parseFloat(change.value),
        raw: change.value,
        effectName: effect.name || effect.label || "",
      });
    }
  }
  return out;
}

/** True if the item carries any enabled `sc.*` Active-Effect change. */
export const hasScKeys = (item) => scSourcesFromAe(item).length > 0;

const clampTo = ([lo, hi], n) => Math.min(hi, Math.max(lo, n));

/**
 * Parse a flat list of `sc.*` changes ([{key, value}]) into a `styleData`-shaped
 * object — the shared core of `styleDataFromAe` (whole item) and the loose
 * actor-effect path in `engine/cascade.mjs` (changes with no surviving origin item).
 * Returns `null` when nothing meaningful survives.
 *
 * @param {{key:string, value:*}[]} changes
 * @returns {object|null}
 */
export function styleDataFromChanges(changes) {
  if (!changes?.length) return null;

  const out = {};
  const unmapped = [];

  for (const { key, value } of changes) {
    if (!isScKey(key)) continue;
    const v = (typeof value === "number" ? value : parseFloat(value)) || 0;
    const parts = key.split(".");            // ["sc", category, ...sub]
    const category = parts[1];
    const sub = parts.slice(2).join(".");
    const spec = SC_CATEGORY_MAP[category];

    if (!spec) { unmapped.push({ key, value: v }); continue; }

    switch (spec.kind) {
      case "map": {
        if (!sub || v === 0) break;
        (out[spec.field] ??= {});
        out[spec.field][sub] = (out[spec.field][sub] || 0) + v;
        break;
      }
      case "scalar": {
        if (v === 0) break;
        out[spec.field] = (out[spec.field] || 0) + v;
        break;
      }
      case "scalarSub": {
        if (sub !== spec.sub || v === 0) break;
        let next = (out[spec.field] || 0) + v;
        if (spec.clamp) next = clampTo(spec.clamp, next);
        out[spec.field] = next;
        break;
      }
      case "tag": {
        if (!sub || !v) break;               // truthy value selects the suffix
        out[spec.field] = sub;
        break;
      }
      case "tagNum": {
        const n = Number(sub);
        if (Number.isNaN(n)) break;
        out[spec.field] = n;
        break;
      }
      default: unmapped.push({ key, value: v });
    }
  }

  // Drop maps that ended up empty (all-zero contributions).
  for (const k of Object.keys(out)) {
    if (out[k] && typeof out[k] === "object" && !Array.isArray(out[k]) && Object.keys(out[k]).length === 0) {
      delete out[k];
    }
  }

  if (unmapped.length) out._unmapped = unmapped;

  // Nothing meaningful survived (e.g. all keys were zeros).
  if (Object.keys(out).length === 0) return null;

  out.schema = CURRENT_SCHEMA;
  out._source = "migrated-from-ae";
  return out;
}

/**
 * Parse an item's enabled `sc.*` Active Effects into a `styleData`-shaped object.
 * Returns `null` when the item has no SC keys (caller decides what "no data" means).
 *
 * The result is a partial styleData: only fields that received data are present,
 * stamped `schema` + `_source: "migrated-from-ae"`. Empty maps / zero scalars are
 * omitted. Unknown `sc.*` categories are preserved under `_unmapped` (lossless).
 *
 * @param {object} item  a CPR item document
 * @returns {object|null}
 */
export function styleDataFromAe(item) {
  return styleDataFromChanges(scSourcesFromAe(item));
}

/**
 * Dual-read an item's style metadata (D4): the `styleData` FLAG wins; an item
 * without one falls back to its enabled `sc.*` Active Effects. An item with a flag
 * NEVER also contributes its AEs (no double-count).
 *
 * @param {object} item  a CPR item document
 * @returns {{styleData: object|null, source: "flags"|"ae"|null}}
 */
export function dualReadStyleData(item) {
  const flag = getStyleData(item);
  if (flag !== undefined) return { styleData: flag ?? null, source: "flags" };
  const fromAe = styleDataFromAe(item);
  return fromAe ? { styleData: fromAe, source: "ae" } : { styleData: null, source: null };
}
