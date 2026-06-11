/**
 * recognition.mjs — brand recognition gating + counterfeit detection
 * (guide §13.3, §13.4, §23.2 — M9.1, the last engine piece).
 *
 * NEW engine work (no macro reference; designed from §13.3–§13.4, §23.2).
 * The OBSERVER side of the brand system — Stage 6 of the §29.1 pipeline,
 * stacking AFTER physical visibility (§29.3: two filters, never merged):
 *
 *  · Recognition gating (§13.3): not everyone clocks every label. A brand
 *    reads by NAME only if the observer's fashion literacy (INT + any bonus,
 *    plus a bonus for actively studying the look) clears the bar for the
 *    brand's recognition band — iconic reads to everyone, known to most,
 *    niche only to the fashion-literate. An UNRECOGNIZED luxury label still
 *    reads as "expensive-looking" — prestige without the name.
 *  · Recognition × visibility (§23.2): visible chrome broadcasts its brand;
 *    hidden/internal chrome only reads at a deep scan tier. Clothing brands
 *    need enough physical visibility (the §27 stack) to be clocked at all.
 *  · Counterfeits (§13.4): a fake reads as the real brand's full prestige at
 *    a glance; only an ACTIVE scan can reveal it, against a DC that rises
 *    with replica quality. A revealed fake is the §13.4 outcome lever —
 *    `applyCounterfeitToDisguise` in engine/disguise.mjs consumes it.
 *
 * Pure: worn-brand records + observer params + registry + tunables in,
 * explainable result out. `collectWornBrands` builds the records from items
 * (dual-read like the cascade, D4).
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { getStyleData } from "../data/flags.mjs";
import { scSourcesFromAe, styleDataFromChanges } from "../data/sc-keys.mjs";
import { result, component } from "./explain.mjs";
import { humanize } from "../config/style-tab-schema.mjs";

const ACTIVE_EQUIP_STATES = new Set([cpr.EQUIP.EQUIPPED, "installed"]);

/** Tiers that read as wealth even when the label goes unrecognized (§13.3). */
const PRESTIGE_TIERS = new Set(["luxury", "hauteCouture"]);

/** Item's styleData, dual-read (D4: flag wins, sc.* bridge fallback). */
function itemStyleData(item) {
  const flag = getStyleData(item);
  if (flag !== undefined) return flag ?? {};
  const aeSources = scSourcesFromAe(item);
  if (!aeSources.length) return {};
  return styleDataFromChanges(aeSources) ?? {};
}

/**
 * Build the worn-brand records the recognizer consumes.
 *
 * @param {object} p
 * @param {object[]} p.items  the actor's items (or a hypothetical set)
 * @param {Record<string, number>} [p.visibility] itemId → physical visibility
 *   (resolveVisibility().value); absent id = 1
 * @param {Set<string>|string[]} [p.hiddenItemIds] ids whose brand is hidden
 *   from sight entirely — internal chrome, bioware (§23.2)
 * @returns {Array<{itemId,name,brand,physical,hidden,authenticity,replicaTier,isChrome}>}
 */
export function collectWornBrands({ items = [], visibility, hiddenItemIds } = {}) {
  const hidden = hiddenItemIds instanceof Set ? hiddenItemIds : new Set(hiddenItemIds ?? []);
  const out = [];
  for (const item of items) {
    if (!ACTIVE_EQUIP_STATES.has(cpr.getEquipState(item))) continue;
    const sd = itemStyleData(item);
    if (!sd.brand) continue;
    out.push({
      itemId: item.id,
      name: item.name,
      brand: sd.brand,
      physical: visibility && visibility[item.id] !== undefined ? visibility[item.id] : 1,
      hidden: hidden.has(item.id),
      authenticity: sd.authenticity ?? "genuine",
      replicaTier: sd.replicaTier ?? null,
      isChrome: item.type === cpr.ITEM_TYPE.CYBERWARE,
    });
  }
  return out;
}

/**
 * Can an active scan expose a counterfeit? DC rises with replica quality.
 * @param {object} p
 * @param {string|null} p.replicaTier  e.g. "streetKnockoff" | "premiumReplica"
 * @param {number} p.scanTotal         the scanner's roll total (INT + PER + d10)
 * @param {object} recognitionTunables tunables.recognition group
 * @returns {{ revealed: boolean, dc: number }}
 */
export function counterfeitScan({ replicaTier = null, scanTotal = 0 } = {}, recognitionTunables = {}) {
  const C = recognitionTunables.counterfeit ?? {};
  const dc = (C.baseDc ?? Infinity) + ((C.replicaDcBonus ?? {})[replicaTier] ?? 0);
  return { revealed: scanTotal >= dc, dc };
}

/**
 * Gate worn brands through the observer's recognition (§13.3) — the lens step.
 *
 * @param {object} p
 * @param {Array} p.wornBrands   collectWornBrands() output
 * @param {number} [p.observerLiteracy] observer INT (+ any fashion-literacy bonus)
 * @param {"failed"|"minimal"|"partial"|"full"|null} [p.scanTier] null/failed =
 *   the passive glance; partial/full = an active, studied scan (§16.2)
 * @param {number} [p.scanTotal] the scan roll total — drives counterfeit reveals
 * @param {object} brandsConfig  { BRANDS } registry (§13.1)
 * @param {object} [recognitionTunables] tunables.recognition group
 * @returns explainable result:
 *   value — [{ brand, label, tier, recognition, seen, recognized, prestige,
 *              counterfeit: null | { revealed, dc }, pieces: [names] }]
 *   recognized — the by-name reads only (what a quick-perceive card prints)
 */
export function recognizeBrands(
  { wornBrands = [], observerLiteracy = 0, scanTier = null, scanTotal = 0 } = {},
  brandsConfig = {},
  recognitionTunables = {}
) {
  const T = recognitionTunables;
  const BRANDS = brandsConfig.BRANDS ?? {};
  const tier = scanTier && scanTier !== "failed" ? scanTier : null;
  const activeScan = tier === "partial" || tier === "full";
  const literacy = observerLiteracy + ((T.scanLiteracyBonus ?? {})[tier ?? "failed"] ?? 0);
  const floor = T.visibilityFloor ?? 0;
  const components = [];

  // Group worn pieces by brand key.
  const byBrand = new Map();
  for (const w of wornBrands) {
    if (!byBrand.has(w.brand)) byBrand.set(w.brand, []);
    byBrand.get(w.brand).push(w);
  }

  const reads = [];
  for (const [key, pieces] of byBrand) {
    const bc = BRANDS[key];
    // §23.2/§27: which pieces can this observer physically see right now?
    // Hidden chrome surfaces only at the deep-scan tier; covered clothing
    // below the visibility floor stays unclocked.
    const seenPieces = pieces.filter((p) =>
      p.hidden ? tier === (T.hiddenChromeNeedsTier ?? "full") : p.physical >= floor
    );
    if (!seenPieces.length) continue; // physically unseen — no read at all

    const recognition = bc?.recognition ?? "niche"; // off-registry labels are nobody's household name
    const bar = (T.bar ?? {})[recognition];
    const recognized = bar !== undefined && literacy >= bar;
    const prestige = recognized ? "named"
      : bc && PRESTIGE_TIERS.has(bc.tier) ? "expensive" : "plain";

    // §13.4: a counterfeit reads as the real thing at a glance; an active scan
    // may expose it (one reveal taints the brand read).
    const fakes = seenPieces.filter((p) => p.authenticity === "counterfeit");
    let counterfeit = null;
    if (fakes.length && activeScan) {
      const scans = fakes.map((p) => counterfeitScan({ replicaTier: p.replicaTier, scanTotal }, T));
      const revealed = scans.some((s) => s.revealed);
      counterfeit = { revealed, dc: Math.min(...scans.map((s) => s.dc)) };
    }

    const label = bc?.label ?? humanize(key);
    reads.push({
      brand: key, label, tier: bc?.tier ?? null, recognition,
      seen: seenPieces.length, recognized, prestige, counterfeit,
      pieces: seenPieces.map((p) => p.name),
    });
    components.push(component(
      `brand ${label}`,
      seenPieces.length,
      recognized ? `clocked (${recognition}, literacy ${literacy} ≥ ${bar})`
        : `unrecognized (${recognition} needs ${bar ?? "?"}, literacy ${literacy})`
    ));
  }

  const recognized = reads.filter((r) => r.recognized);
  const exposed = reads.filter((r) => r.counterfeit?.revealed);
  const label = recognized.length
    ? recognized.map((r) => r.label).join(" · ")
    : reads.length ? "Labels unrecognized" : "No brands visible";
  const blurb = exposed.length
    ? `That ${exposed[0].label} is a FAKE — and the observer can tell.`
    : recognized.length
      ? "The observer knows exactly whose name is on this look."
      : reads.length
        ? "Something about it reads deliberate, but the labels don't register."
        : "Nothing visibly branded.";

  return {
    ...result({ value: reads, label, blurb, components, tunablesApplied: { "recognition.*": T } }),
    recognized, exposed,
  };
}
