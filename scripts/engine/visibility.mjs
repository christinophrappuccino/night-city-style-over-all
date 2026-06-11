/**
 * visibility.mjs — physical visibility resolution (guide §27.3/§27.6, §29.1 Stage 2).
 *
 * NEW engine work (no macro reference — §27.5 scheduled layer→visibility in
 * collect.mjs for M2 but only weapon/armor concealment landed; designed from
 * §27.3, §27.6, §29.3, §29.8). Resolves, from the slot model authored on each
 * item (`regions`/`region` · `layer` · `coverage` · `wearMode` · `anchoredTo` ·
 * `readPriority`), how much of each equipped item PHYSICALLY reads:
 *
 *  · Per region, garments stack by `layer`; an item's signal passes through the
 *    TRANSMISSION of every higher-layer garment covering that region
 *    (tunables.slots.transmission — graded, §27.6: full hides, major reads
 *    weakly, partial still mostly reads). Multi-region items average across
 *    their regions (half-covered = half-read).
 *  · `wearMode` modulates a garment's effective coverage by shifting it whole
 *    coverage steps (tunables.slots.wearModeShift): an open coat drops a step,
 *    a lowered hood/mask conceals nothing. Items that author no wearMode get
 *    the §27.6 per-scSlot default (least-concealing resting state).
 *  · `anchoredTo` is a REGION OVERRIDE: the anchored item stacks in its anchor
 *    region at its own `layer` (author the pin at its jacket's layer), so
 *    covering the jacket covers the pin — inheritance via shared stacking.
 *  · Items with no region data can't be occluded (visibility 1); only items
 *    with regions and effective coverage above `none` occlude others. An item
 *    never occludes itself; equal layers don't occlude each other.
 *
 * Also computes each item's read FACTORS (§29.1 Stage 3 / §29.4):
 *    self     = readPriorityMult[readPriority]            (full set — gating off)
 *    observed = readPriorityMult[readPriority] · visibility (visible set)
 * which engine/cascade.mjs `collectScMods` applies per item via its `factors`
 * option. This is the two-mode denominator split of §29.8: covered items drop
 * out of the observed aggregation only.
 *
 * Two distinct filters, never merged (§29.3): this module is the PHYSICAL
 * filter (is it covered — objective); perception (does the observer notice —
 * cognitive) stays in engine/perception.mjs and gates AFTER this.
 *
 * Legacy items (no slot-model fields) resolve to visibility 1 · factors 1, so
 * legacy results are unchanged (§29.8: parity = backward-compatible).
 *
 * Pure: dual-reads each item like the cascade does (D4 — the styleData flag
 * wins; `sc.*` bridge keys are the fallback); config/tunables passed IN.
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { getStyleData } from "../data/flags.mjs";
import { scSourcesFromAe, styleDataFromChanges } from "../data/sc-keys.mjs";
import { COVERAGE } from "../constants.mjs";
import { result, component } from "./explain.mjs";

/** Equip states that participate in the worn stack (matches cascade.mjs). */
const ACTIVE_EQUIP_STATES = new Set([cpr.EQUIP.EQUIPPED, "installed"]);

/** Item's slot-model styleData, dual-read (D4: flag wins, sc.* bridge fallback). */
function slotData(item) {
  const flag = getStyleData(item);
  if (flag !== undefined) return flag ?? {};
  const aeSources = scSourcesFromAe(item);
  if (!aeSources.length) return {};
  return styleDataFromChanges(aeSources) ?? {};
}

/** Effective coverage after the wearMode shift, clamped to the COVERAGE scale. */
function effectiveCoverage(coverage, wearMode, T) {
  const idx = COVERAGE.indexOf(coverage);
  if (idx <= 0) return COVERAGE[Math.max(0, idx)] ?? "none";
  const shift = (T.wearModeShift ?? {})[wearMode] ?? 0;
  return COVERAGE[Math.min(COVERAGE.length - 1, Math.max(0, idx + shift))];
}

/**
 * Resolve physical visibility + read factors for an equipped set.
 *
 * @param {object} p
 * @param {object[]} p.items  the actor's items (or a hypothetical set)
 * @param {object} [slotTunables]  tunables.slots group
 * @returns explainable result:
 *   value    — { [itemId]: visibility 0–1 }
 *   items    — per-item detail [{ id, name, regions, layer, wearMode,
 *              coverage, effectiveCoverage, visibility, readPriority,
 *              factors: { self, observed }, coveredBy: [names] }]
 *   factors  — { [itemId]: { self, observed } } (collectScMods `factors` input)
 *   visible  — item ids with visibility > 0 (the §29.1 visible set)
 *   hidden   — item ids fully covered (visibility 0)
 */
export function resolveVisibility({ items = [] } = {}, slotTunables = {}) {
  const T = slotTunables;
  const trans = T.transmission ?? {};
  const rpMult = T.readPriorityMult ?? [];
  const defaults = T.defaultWearMode ?? {};

  // ── Normalize the worn stack ───────────────────────────────────────────────
  const entries = [];
  for (const item of items) {
    if (!ACTIVE_EQUIP_STATES.has(cpr.getEquipState(item))) continue;
    const sd = slotData(item);
    const ownRegions = Array.isArray(sd.regions) && sd.regions.length
      ? sd.regions
      : (sd.region ? [sd.region] : []);
    const regions = sd.anchoredTo ? [sd.anchoredTo] : ownRegions;
    const wearMode = sd.wearMode ?? defaults[sd.scSlot] ?? "none";
    const coverage = sd.coverage ?? "none";
    const eff = effectiveCoverage(coverage, wearMode, T);
    entries.push({
      id: item.id, name: item.name,
      regions, occludes: ownRegions, // an anchored pin never hides its anchor
      layer: Number.isFinite(sd.layer) ? sd.layer : 0,
      wearMode, coverage, effectiveCoverage: eff,
      transmission: trans[eff] ?? 1,
      readPriority: Number.isFinite(sd.readPriority) ? sd.readPriority : 1,
    });
  }

  // ── Stack: per region, signal passes the transmission of every garment above ──
  const occluders = entries.filter((e) => e.occludes.length && e.transmission < 1);
  const perRegionVis = (region, layer, selfId) => {
    let v = 1;
    for (const o of occluders) {
      if (o.id === selfId || o.layer <= layer || !o.occludes.includes(region)) continue;
      v *= o.transmission;
    }
    return v;
  };

  const value = {};
  const factors = {};
  const detail = [];
  for (const e of entries) {
    let visibility = 1;
    let coveredBy = [];
    if (e.regions.length) {
      visibility = e.regions.reduce((sum, r) => sum + perRegionVis(r, e.layer, e.id), 0) / e.regions.length;
      coveredBy = occluders
        .filter((o) => o.id !== e.id && o.layer > e.layer && o.occludes.some((r) => e.regions.includes(r)))
        .map((o) => o.name);
    }
    const rp = rpMult[e.readPriority] ?? 1;
    value[e.id] = visibility;
    factors[e.id] = { self: rp, observed: rp * visibility };
    detail.push({ ...e, visibility, coveredBy, factors: factors[e.id] });
  }

  const visible = detail.filter((e) => e.visibility > 0).map((e) => e.id);
  const hidden = detail.filter((e) => e.visibility === 0).map((e) => e.id);

  const components = detail
    .filter((e) => e.visibility < 1)
    .map((e) => component(
      `${e.name} visibility`, Math.round(e.visibility * 100) / 100,
      e.coveredBy.length ? `under ${e.coveredBy.join(", ")}` : e.effectiveCoverage
    ));

  const label = hidden.length
    ? `${visible.length} of ${detail.length} pieces read`
    : "Everything reads";
  const blurb = hidden.length
    ? "Covered layers don't reach the street — shed the outer layer and the read changes."
    : "No layer fully covers another — the whole look is on display.";

  return {
    ...result({ value, label, blurb, components, tunablesApplied: { "slots.*": T } }),
    items: detail, factors, visible, hidden,
  };
}
