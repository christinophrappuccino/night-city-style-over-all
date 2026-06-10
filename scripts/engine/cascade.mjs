/**
 * cascade.mjs — the faction cascade + the actor-wide scMods collector (M5).
 *
 * Two jobs, both pure:
 *
 *  · `cascadeStyleData` — expand ONE item's §5.2 styleData into read-modifiers.
 *    Faction keys cascade into archetype/style/chrome/cost/DC (the macro's
 *    collectDisguiseModifiers cascade, §8167–8208); everything else applies
 *    directly. Promoted here from services/item-preview.mjs (M4) so the live
 *    engine and the Item Style Tab preview share ONE cascade.
 *
 *  · `collectScMods` — the per-actor aggregation the macro calls
 *    `collectDisguiseModifiers` (§8125–8287): scan equipped/installed items,
 *    DUAL-READ each one (D4: the styleData flag wins; `sc.*` AEs are the
 *    fallback and are IGNORED when a flag exists — no double-count), cascade,
 *    and merge into the macro-shaped mods object every consumer
 *    (detectAllArchetypes / heatIndex / disguise injection) understands.
 *
 * Fidelity notes vs the macro:
 *  · The macro cascades each AE change individually; we parse an item's AEs into
 *    one styleData and cascade that. Identical whenever a key appears once per
 *    item (the authored norm). An item repeating the SAME faction key in several
 *    changes merges before the cascade's rounding instead of after — a documented,
 *    intentional unification (§29.8: parity = backward-compatible, not bug-for-bug).
 *  · `vibe` rides the mods as a superset axis (the macro skipped it); no legacy
 *    consumer reads it, so legacy results are unchanged.
 *
 * Pure: documents are read only through cpr-adapter / data-layer helpers; config
 * and tunables are passed IN. No game.*, no ui.*.
 *
 * Spec: SC-Module-Architecture-Guide.md §8.3, §5.2, §29.1 (Stage 1), §3 D4; CLAUDE.md M5.
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { getStyleData } from "../data/flags.mjs";
import { isScKey, scSourcesFromAe, styleDataFromChanges, SC_CATEGORY_MAP } from "../data/sc-keys.mjs";
import { component } from "./explain.mjs";
import { humanize } from "../config/style-tab-schema.mjs";

const round = Math.round;
const max = Math.max;

/** Equip states whose sc.* / styleData metadata is live (macro §8243–8245). */
const ACTIVE_EQUIP_STATES = new Set([cpr.EQUIP.EQUIPPED, "installed"]);

/** Empty modifiers accumulator — same shape as the macro's collectDisguiseModifiers. */
export function emptyMods() {
  return {
    archetypes: {}, styles: {}, districts: {}, factions: {}, chrome: {}, vibe: {},
    cost: 0, armor: 0, heat: 0, disguiseDC: 0, antiStyleSuppress: 0,
  };
}

const addMap = (map, key, v) => { if (key && v) map[key] = (map[key] || 0) + v; };

/**
 * Expand a single item's styleData into aggregated read-modifiers + a component
 * trail. Faction keys cascade (archetype/style/chrome/cost/DC); archetype/style/
 * district/chrome/vibe/scalars apply directly. Raw keys are NEVER mutated — this
 * derives the read the engine would compute for an actor wearing only this item.
 *
 * @param {object} styleData            the §5.2 flag blob (any subset)
 * @param {object} factionsConfig       { FACTIONS, FACTION_ARCHETYPES }
 * @param {object} cascadeTunables      tunables.cascade group
 * @returns {{ mods: object, components: Array, tunablesApplied: object }}
 */
export function cascadeStyleData(styleData = {}, factionsConfig = {}, cascadeTunables = {}) {
  const mods = emptyMods();
  const components = [];
  const C = cascadeTunables;
  const FACTIONS = factionsConfig.FACTIONS ?? {};
  const ARCHS = factionsConfig.FACTION_ARCHETYPES ?? {};

  const push = (term, value, source) => { if (value) components.push(component(term, value, source)); };

  // ── Direct, flat contributions (authored as-is) ───────────────────────────
  for (const [k, v] of Object.entries(styleData.style ?? {})) { addMap(mods.styles, k, v); push(`style ${humanize(k)}`, v, "direct"); }
  for (const [k, v] of Object.entries(styleData.district ?? {})) { addMap(mods.districts, k, v); push(`district ${humanize(k)}`, v, "direct"); }
  for (const [k, v] of Object.entries(styleData.chrome ?? {})) { addMap(mods.chrome, k, v); push(`chrome ${humanize(k)}`, v, "direct"); }
  for (const [k, v] of Object.entries(styleData.vibe ?? {})) { addMap(mods.vibe, k, v); push(`vibe ${humanize(k)}`, v, "direct"); }
  for (const [k, v] of Object.entries(styleData.archetype ?? {})) { addMap(mods.archetypes, k, v); push(`archetype ${humanize(k)}`, v, "direct"); }

  if (styleData.cost) { mods.cost += styleData.cost; push("cost", styleData.cost, "direct"); }
  if (styleData.armor) { mods.armor += styleData.armor; push("armor", styleData.armor, "direct"); }
  if (styleData.heat) { mods.heat += styleData.heat; push("heat", styleData.heat, "direct"); }
  if (styleData.disguiseDc) { mods.disguiseDC += styleData.disguiseDc; push("disguise DC", styleData.disguiseDc, "direct"); }
  if (styleData.antiStyleSuppress) {
    mods.antiStyleSuppress = Math.min(1, max(0, mods.antiStyleSuppress + styleData.antiStyleSuppress));
    push("anti-style suppress", styleData.antiStyleSuppress, "direct");
  }

  // ── Faction cascade (the wide one) ────────────────────────────────────────
  for (const [fKey, value] of Object.entries(styleData.faction ?? {})) {
    if (!value) continue;
    addMap(mods.factions, fKey, value);
    const fc = FACTIONS[fKey];
    if (!fc) { push(`faction ${humanize(fKey)}`, value, "direct (unknown faction)"); continue; }
    const via = fc.label || humanize(fKey);
    const archKey = fc.archetype;
    const arch = archKey ? ARCHS[archKey] : null;

    // 1. Boost the mapped archetype.
    if (archKey) { addMap(mods.archetypes, archKey, value); push(`archetype ${arch?.label || humanize(archKey)}`, value, `via ${via}`); }

    // 2. Virtual styles from the archetype's styleProfile.
    if (arch?.styleProfile) {
      for (const [s, w] of Object.entries(arch.styleProfile)) {
        if (w >= C.styleProfileThreshold) {
          const v = round((value / C.styleProfileDivisor) * w * C.styleProfileMult);
          if (v > 0) { addMap(mods.styles, s, v); push(`style ${humanize(s)}`, v, `via ${via}`); }
        }
      }
    }
    // 2b. Faction-specific style tweaks (e.g. Arasaka's asiaPop).
    if (fc.styleModifiers) {
      for (const [s, m] of Object.entries(fc.styleModifiers)) {
        if (m > 0) {
          const v = round((value / C.styleModifierDivisor) * m * C.styleModifierMult);
          if (v > 0) { addMap(mods.styles, s, v); push(`style ${humanize(s)}`, v, `via ${via}`); }
        }
      }
    }
    // 3. Chrome profile nudge (+ faction chrome override).
    if (arch?.chromeProfile) { const v = max(C.chromeNudgeMin, round(value / C.chromeNudgeDivisor)); addMap(mods.chrome, arch.chromeProfile, v); push(`chrome ${humanize(arch.chromeProfile)}`, v, `via ${via}`); }
    if (fc.chromeOverride) { const v = max(C.chromeNudgeMin, round(value / C.chromeNudgeDivisor)); addMap(mods.chrome, fc.chromeOverride, v); push(`chrome ${humanize(fc.chromeOverride)}`, v, `via ${via}`); }

    // 4. Cost nudge toward the faction's expected range.
    const costTarget = fc.costOverride?.sweet || arch?.costExpectation?.sweet || 0;
    if (costTarget > 0) { const v = round(costTarget * (value / C.costNudgeDivisor)); mods.cost += v; push("cost", v, `via ${via}`); }

    // 5. Disguise DC bonus (proportional).
    const dc = round(value / C.dcDivisor);
    if (dc) { mods.disguiseDC += dc; push("disguise DC", dc, `via ${via}`); }
  }

  return { mods, components, tunablesApplied: { "cascade.*": C } };
}

// ── the actor-wide collector (macro collectDisguiseModifiers) ────────────────

const MAP_FIELDS = ["archetypes", "styles", "districts", "factions", "chrome", "vibe"];
const SCALAR_FIELDS = ["cost", "armor", "heat", "disguiseDC"];

/** Merge one item's cascaded mods into the accumulator (suppress clamps 0–1). */
function mergeMods(acc, mods) {
  for (const f of MAP_FIELDS) {
    for (const [k, v] of Object.entries(mods[f])) addMap(acc[f], k, v);
  }
  for (const f of SCALAR_FIELDS) acc[f] += mods[f];
  if (mods.antiStyleSuppress) {
    acc.antiStyleSuppress = Math.min(1, max(0, acc.antiStyleSuppress + mods.antiStyleSuppress));
  }
}

/** True if a cascaded mods object carries any signal. */
function modsHaveSignal(mods) {
  return MAP_FIELDS.some((f) => Object.keys(mods[f]).length > 0)
    || SCALAR_FIELDS.some((f) => mods[f] !== 0)
    || mods.antiStyleSuppress !== 0;
}

/** styleData field → pseudo `sc.*` key, for flag-item source entries (UI parity:
 *  the macro renders sources as `item: key=value`). */
const FLAG_SOURCE_KEYS = [
  ["archetype", (sub) => `sc.archetype.${sub}`],
  ["style", (sub) => `sc.style.${sub}`],
  ["district", (sub) => `sc.district.${sub}`],
  ["faction", (sub) => `sc.faction.${sub}`],
  ["chrome", (sub) => `sc.chrome.${sub}`],
  ["vibe", (sub) => `sc.vibe.${sub}`],
];
const FLAG_SOURCE_SCALARS = [
  ["cost", "sc.cost"], ["armor", "sc.armor"], ["heat", "sc.heat"],
  ["disguiseDc", "sc.disguise.dc"], ["antiStyleSuppress", "sc.antiStyle.suppress"],
];

/** Source rows for a flag-driven item (one per authored signal). */
function flagSources(item, styleData) {
  const rows = [];
  const base = {
    item: item.name, itemId: item.id,
    itemImg: item.img || "icons/svg/item-bag.svg",
    effectName: "", via: "flags",
  };
  for (const [field, keyFn] of FLAG_SOURCE_KEYS) {
    for (const [sub, value] of Object.entries(styleData[field] ?? {})) {
      if (value) rows.push({ ...base, key: keyFn(sub), category: field, subKey: sub, value });
    }
  }
  for (const [field, key] of FLAG_SOURCE_SCALARS) {
    const value = styleData[field];
    if (value) rows.push({ ...base, key, category: field, subKey: "", value });
  }
  return rows;
}

/** True if an `sc.*` key is one the macro's collector counted (mods-producing). */
function isModsProducingKey(key, value) {
  if (!isScKey(key) || !value) return false;
  const parts = key.split(".");
  const spec = SC_CATEGORY_MAP[parts[1]];
  if (!spec) return false;
  const sub = parts.slice(2).join(".");
  switch (spec.kind) {
    case "map": return !!sub;
    case "scalar": return true;
    case "scalarSub": return sub === spec.sub;
    default: return false; // tag/tagNum (slot bridge) carry no read-modifier
  }
}

/**
 * Collect an actor's aggregated style read-modifiers — the engine's
 * `collectDisguiseModifiers`. Dual-read per item (D4: flags win), faction cascade
 * applied, macro-shaped result.
 *
 * Inputs are DECOMPOSED (collect-style): pass the item list and actor-level
 * effects, not the actor — so hypothetical sets (Wardrobe, M6) work for free.
 *
 * @param {object} p
 * @param {object[]} p.items          the actor's items (or a hypothetical set)
 * @param {object[]} [p.actorEffects] actor-level Active Effects (transferred sc.* keys)
 * @param {object} factionsConfig     { FACTIONS, FACTION_ARCHETYPES }
 * @param {object} cascadeTunables    tunables.cascade group
 * @returns {object} { archetypes, styles, districts, factions, chrome, vibe,
 *   cost, armor, heat, disguiseDC, antiStyleSuppress, sources, hasModifiers,
 *   components, tunablesApplied }
 */
export function collectScMods({ items = [], actorEffects = [] } = {}, factionsConfig = {}, cascadeTunables = {}) {
  const acc = emptyMods();
  acc.sources = [];
  acc.hasModifiers = false;
  const components = [];

  const itemById = new Map(items.map((i) => [i.id, i]));

  // ── Pass 1: equipped/installed items, dual-read (flags win — D4) ──────────
  for (const item of items) {
    if (!ACTIVE_EQUIP_STATES.has(cpr.getEquipState(item))) continue;

    const flag = getStyleData(item);
    if (flag !== undefined) {
      // Flag item: its sc.* AEs (and their transferred copies) are IGNORED.
      const { mods, components: c } = cascadeStyleData(flag ?? {}, factionsConfig, cascadeTunables);
      if (!modsHaveSignal(mods)) continue;
      mergeMods(acc, mods);
      acc.sources.push(...flagSources(item, flag));
      components.push(...c.map((x) => ({ ...x, source: `${item.name} · ${x.source}` })));
      continue;
    }

    // Legacy AE item: parse enabled sc.* changes → styleData → same cascade.
    const aeSources = scSourcesFromAe(item);
    if (!aeSources.length) continue;
    const parsed = styleDataFromChanges(aeSources);
    if (!parsed) continue;
    const { mods, components: c } = cascadeStyleData(parsed, factionsConfig, cascadeTunables);
    if (!modsHaveSignal(mods)) continue;
    mergeMods(acc, mods);
    for (const s of aeSources) {
      if (!isModsProducingKey(s.key, s.value)) continue;
      const parts = s.key.split(".");
      acc.sources.push({
        item: item.name, itemId: item.id, itemImg: item.img || "icons/svg/item-bag.svg",
        key: s.key, category: parts[1], subKey: parts.slice(2).join("."), value: s.value,
        effectName: s.effectName,
      });
    }
    components.push(...c.map((x) => ({ ...x, source: `${item.name} · ${x.source}` })));
  }

  // ── Pass 2: actor-level transferred effects (macro §8256–8274) ────────────
  for (const effect of actorEffects) {
    for (const change of cpr.getEffectChanges(effect)) { // skips disabled effects
      if (!isScKey(change.key)) continue;
      const value = parseFloat(change.value) || 0;
      if (value === 0) continue;
      const originId = effect.origin?.split(".")?.pop();
      const originItem = originId ? itemById.get(originId) : null;
      // Flags win: a flagged origin item already contributed via its flag.
      if (originItem && getStyleData(originItem) !== undefined) continue;
      // De-dupe transferred copies of changes already counted from the item.
      const alreadyCounted = originItem &&
        acc.sources.some((s) => s.itemId === originId && s.key === change.key && s.value === value);
      if (alreadyCounted) continue;
      if (!isModsProducingKey(change.key, value)) continue;

      const parsed = styleDataFromChanges([{ key: change.key, value }]);
      if (!parsed) continue;
      const { mods, components: c } = cascadeStyleData(parsed, factionsConfig, cascadeTunables);
      if (!modsHaveSignal(mods)) continue;
      mergeMods(acc, mods);
      const parts = change.key.split(".");
      const name = originItem?.name || effect.name || "Effect";
      acc.sources.push({
        item: name, itemId: originItem?.id || null,
        itemImg: originItem?.img || "icons/svg/aura.svg",
        key: change.key, category: parts[1], subKey: parts.slice(2).join("."), value,
        effectName: effect.name || effect.label || "", via: "actorEffect",
      });
      components.push(...c.map((x) => ({ ...x, source: `${name} · ${x.source}` })));
    }
  }

  acc.hasModifiers = modsHaveSignal(acc);
  acc.components = components;
  acc.tunablesApplied = { "cascade.*": cascadeTunables };
  return acc;
}
