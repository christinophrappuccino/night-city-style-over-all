/**
 * item-preview.mjs — the Item Style Tab's live cascade preview (guide §8.3).
 *
 * Runs the engine cascade on ONE item's styleData and reports the derived effects,
 * so an author sees what a faction key actually expands into ("Tyger Claw 25 →
 * asiaPop +X, displayChrome +Y, cost +Z, +DC"). This is the macro's cascade logic
 * (collectDisguiseModifiers, §8167–8208) surfaced as an authoring aid — and it
 * doubles as living documentation of the cascade tables.
 *
 * The cascade itself lives in engine/cascade.mjs (promoted there in M5 so the live
 * pipeline and this preview share ONE implementation); `previewItemCascade` is the
 * services-layer wrapper that pulls config from engine-config and tunables from
 * getTunables. Mirrors the §5.2 → engine read so a converted/flag item previews
 * identically to its legacy AE form.
 *
 * Spec: SC-Module-Architecture-Guide.md §8.3, §5.2, §13.2 (brand cascade later).
 */

import { getEngineConfig } from "./engine-config.mjs";
import { getTunables } from "../config/tunables.mjs";
import { result } from "../engine/explain.mjs";
import { humanize } from "../config/style-tab-schema.mjs";
import { cascadeStyleData } from "../engine/cascade.mjs";

// Back-compat: M4 callers imported the cascade from here.
export { cascadeStyleData } from "../engine/cascade.mjs";

/** Axis-grouped view of the aggregated mods for the panel ([{key,label,value}]). */
function groupMods(mods) {
  const mapRows = (m) => Object.entries(m).filter(([, v]) => v).map(([key, value]) => ({ key, label: humanize(key), value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const scalars = [
    ["cost", mods.cost], ["heat", mods.heat], ["armor", mods.armor],
    ["disguiseDC", mods.disguiseDC], ["antiStyleSuppress", mods.antiStyleSuppress],
  ].filter(([, v]) => v).map(([key, value]) => ({ key, label: humanize(key), value }));
  return {
    archetypes: mapRows(mods.archetypes),
    styles: mapRows(mods.styles),
    chrome: mapRows(mods.chrome),
    districts: mapRows(mods.districts),
    vibe: mapRows(mods.vibe),
    factions: mapRows(mods.factions),
    brands: mapRows(mods.brands ?? {}),
    scalars,
  };
}

/**
 * Services-layer entry: preview a single item's styleData against live world config
 * + tunables. Returns an explainable result with `.value` = aggregated mods and
 * `.groups` = axis-grouped rows for rendering.
 *
 * @param {object} styleData      the item's §5.2 flag blob (may be empty/partial)
 * @param {object} [engineConfig] override (defaults to getEngineConfig())
 * @returns {import('../engine/explain.mjs').ExplainResult & {groups:object, hasSignal:boolean}}
 */
export function previewItemCascade(styleData = {}, engineConfig = getEngineConfig()) {
  const tunables = getTunables();
  const { mods, components, tunablesApplied } = cascadeStyleData(
    styleData, engineConfig.factions, tunables.cascade ?? {},
    engineConfig.brands ?? {}, tunables.brand ?? {}
  );
  const groups = groupMods(mods);
  const signalCount = components.length;

  const topStyles = groups.styles.slice(0, 3).map((r) => `${r.label} ${r.value > 0 ? "+" : ""}${r.value}`).join(", ");
  const label = signalCount ? `${signalCount} derived signal${signalCount === 1 ? "" : "s"}` : "No style signal yet";
  const blurb = topStyles ? `Reads as: ${topStyles}${groups.styles.length > 3 ? "…" : ""}` :
    signalCount ? "Contributes modifiers but no dominant style read." : "Author a faction, style, or modifier to see the cascade.";

  return { ...result({ value: mods, label, blurb, components, tunablesApplied }), groups, hasSignal: signalCount > 0 };
}
