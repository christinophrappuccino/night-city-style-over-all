/**
 * overrides.mjs — GM read overrides (§14.3, M9.3c): pin a read on an actor
 * REGARDLESS of gear, as narrative control.
 *
 * NEW engine work (no macro reference — designed from §14.3). The override
 * record lives on an actor flag (data/flags.mjs getOverrides); this module is
 * the PURE application: given computed reads + the record, return pinned
 * versions. Two §14.3 commandments are enforced here:
 *  1. Overrides are clearly flagged — every pinned result carries
 *     `overridden: true` / `pinned: true` AND a "GM override" component, so
 *     the §19 breakdown path prints the manual hand automatically, everywhere.
 *  2. Pins ride the SPINE: computeActorReads applies this once, so every
 *     surface (apps, scans, gates, the Garden) sees the same pinned read —
 *     no surface re-implements it.
 *
 * Disguise ("holds"/"blown") and brandTier pins have no single number to
 * rewrite — they're consumed at their surfaces (observer lens, GM disguise
 * detector) by reading the same record; this module just validates presence.
 *
 * Pure: data in, data out. Spec: SC-Module-Architecture-Guide.md §14.3, §4.1, §19
 */

import { heatLevel } from "./heat.mjs";
import { component } from "./explain.mjs";
import { humanize } from "../config/style-tab-schema.mjs";

/** Does the record pin anything at all? */
export function hasAnyOverride(o) {
  return !!o && (o.archetype != null || o.heat != null || o.disguise != null || o.brandTier != null);
}

/**
 * Apply archetype/heat pins to computed reads. Returns NEW objects; inputs are
 * never mutated. Unpinned fields pass through untouched.
 *
 * @param {object} p
 * @param {object[]} p.archetypes  detectAllArchetypes output
 * @param {object}   p.heat        heatIndex result
 * @param {object|null} overrides  the actor's override record (or null)
 * @param {object} [ctx]
 * @param {object} [ctx.archetypeDefs] FACTION_ARCHETYPES (labels for pinned keys)
 * @param {object} [ctx.tunables]      for the heat re-band
 * @returns {{ archetypes, heat }}
 */
export function applyReadOverrides({ archetypes = [], heat }, overrides, { archetypeDefs = {}, tunables } = {}) {
  if (!hasAnyOverride(overrides)) return { archetypes, heat };
  let outArch = archetypes;
  let outHeat = heat;

  // ── archetype pin: "this fixer always reads corpo" ─────────────────────────
  if (overrides.archetype) {
    const key = overrides.archetype;
    const label = archetypeDefs[key]?.label ?? humanize(key);
    const pinnedEntry = {
      key, label, confidence: 100, pinned: true,
      components: [component("GM override", 100, "pinned read (§14.3)")],
    };
    outArch = [pinnedEntry, ...archetypes.filter((a) => a.key !== key)];
  }

  // ── heat pin: force a value, or shove the computed one ────────────────────
  if (overrides.heat && Number.isFinite(overrides.heat.value) && heat) {
    const { mode, value } = overrides.heat;
    const pinnedValue = Math.min(100, Math.max(0, Math.round(mode === "force" ? value : heat.value + value)));
    const level = heatLevel(pinnedValue, tunables);
    const delta = pinnedValue - heat.value;
    outHeat = {
      ...heat,
      value: pinnedValue,
      level,
      overridden: true,
      label: `Heat ${pinnedValue} — ${level}`,
      blurb: `Draws ${pinnedValue}/100 attention (${level}) — GM override.`,
      components: [
        ...(heat.components ?? []),
        component("GM override", delta, mode === "force" ? `forced to ${pinnedValue} (§14.3)` : `offset ${value > 0 ? "+" : ""}${value} (§14.3)`),
      ],
    };
  }

  return { archetypes: outArch, heat: outHeat };
}
