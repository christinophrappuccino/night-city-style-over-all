/**
 * colors.mjs — color math as mechanics (guide §9.2, M9.1).
 *
 * NEW engine work (no macro reference — colors were cosmetic until now;
 * designed from §9.2, §18.3). Four mechanics, all reading the §5.2
 * `styleData.colors` field (primary/accent hex):
 *
 *  · Coordination → Wardrobe & Style: a matched palette across the equipped
 *    set adds to W&S; a clashing one subtracts (v1 NOTE: the clash penalty
 *    lands on W&S, not on the per-archetype anti-style tables — folding it
 *    into those rides the scoring-presets work, M9.4).
 *  · Fashionware synergy: techhair/Shift-Tacts-style chrome whose colorway
 *    coordinates with the outfit earns a small bonus — the lived-in detail.
 *  · Faction colorways: wearing a faction's signature palette reads as SOFT
 *    affiliation even on unbranded items (small `factions` contribution,
 *    merged into scMods — feeds disguise, tension, uniforms downstream).
 *  · District palette fit: on-palette outfits nudge district fit (positive
 *    only — being off-palette is just not belonging, not a crime).
 *
 * Color model: hex → HSL. NEUTRALS (low saturation, near-black, near-white)
 * coordinate with everything and never clash. Two saturated colors harmonize
 * when their hues are analogous, complementary, or triadic; they clash only
 * when both are saturated and none of those hold — muted mismatches are
 * ignored. Items weighted 0 by the §29.1 read factors (covered) don't count:
 * the coat over the clashing shirt genuinely saves the outfit.
 *
 * Legacy items author no colors → every output here is a 0/no-op → legacy
 * results unchanged (§29.8).
 *
 * Pure: items + config + tunables in, explainable results out.
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { getStyleData } from "../data/flags.mjs";
import { result, component } from "./explain.mjs";

const round = Math.round;

/** Equip states whose colors are on display (matches cascade.mjs). */
const ACTIVE_EQUIP_STATES = new Set([cpr.EQUIP.EQUIPPED, "installed"]);

// ── primitives ───────────────────────────────────────────────────────────────

/** "#rgb" | "#rrggbb" → { h: 0–360, s: 0–1, l: 0–1 } | null. */
export function hexToHsl(hex) {
  if (typeof hex !== "string") return null;
  let m = hex.trim().replace(/^#/, "");
  if (m.length === 3) m = m.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(m)) return null;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

/** Neutrals (grays, near-black, near-white) coordinate with everything. */
export function isNeutral(hsl, T = {}) {
  const N = T.neutral ?? {};
  return hsl.s <= (N.satMax ?? 0) || hsl.l <= (N.blackMax ?? 0) || hsl.l >= (N.whiteMin ?? 1);
}

const hueDist = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/**
 * Classify a pair of colors: "neutral" (either neutral — always fine),
 * "matched" | "complementary" | "triad" (coordinated), "clash" (both
 * saturated, no harmony), "muted" (mismatched but too soft to clash).
 */
export function pairHarmony(a, b, T = {}) {
  if (isNeutral(a, T) || isNeutral(b, T)) return "neutral";
  const H = T.harmony ?? {};
  const dh = hueDist(a.h, b.h);
  if (dh <= (H.analogousMax ?? 0)) return "matched";
  if (Math.abs(dh - 180) <= (H.complementaryTol ?? 0)) return "complementary";
  if (Math.abs(dh - 120) <= (H.triadTol ?? 0)) return "triad";
  return a.s >= (H.clashSatMin ?? 1) && b.s >= (H.clashSatMin ?? 1) ? "clash" : "muted";
}

const COORDINATED = new Set(["matched", "complementary", "triad"]);

/** A worn item's authored colors as [{ hex, hsl, weight }] (accent weighs less). */
function itemColors(item, T) {
  const colors = (getStyleData(item) ?? {}).colors ?? {};
  const out = [];
  const primary = hexToHsl(colors.primary);
  if (primary) out.push({ hex: colors.primary, hsl: primary, weight: 1 });
  const accent = hexToHsl(colors.accent);
  if (accent) out.push({ hex: colors.accent, hsl: accent, weight: T.accentWeight ?? 0.5 });
  return out;
}

// ── coordination → Wardrobe & Style (+ fashionware synergy) ──────────────────

/**
 * Score the equipped set's palette coordination.
 *
 * @param {object} p
 * @param {object[]} p.items  the actor's items (or a hypothetical set)
 * @param {Record<string, number>} [p.factors] §29.1 read factors (0 = covered)
 * @param {object} [colorTunables] tunables.color group
 * @returns explainable result:
 *   value    — coordination 0–100 (null when fewer than 2 judgeable colors)
 *   state    — "coordinated" | "mixed" | "clashing" | "neutral"
 *   wsDelta  — the Wardrobe & Style adjustment (clamped ±wsDeltaClamp)
 *   clashes  — [{ a, b, items }] clashing pairs for the UI
 *   synergy  — fashionware coordination bonus included in wsDelta
 */
export function colorCoordination({ items = [], factors } = {}, colorTunables = {}) {
  const T = colorTunables;
  const C = T.coordination ?? {};

  const clothing = [];
  const chrome = [];
  for (const item of items) {
    if (!ACTIVE_EQUIP_STATES.has(cpr.getEquipState(item))) continue;
    const weight = factors && factors[item.id] !== undefined ? factors[item.id] : 1;
    if (weight === 0) continue; // covered colors don't read
    const entries = itemColors(item, T).map((c) => ({ ...c, itemId: item.id, itemName: item.name }));
    if (!entries.length) continue;
    (item.type === cpr.ITEM_TYPE.CYBERWARE ? chrome : clothing).push(...entries);
  }

  const coloredItems = new Set(clothing.map((e) => e.itemId)).size;
  const components = [];
  let coordinated = 0;
  let clashPairs = 0;
  const clashes = [];

  if (coloredItems >= (C.minColored ?? 2)) {
    for (let i = 0; i < clothing.length; i++) {
      for (let j = i + 1; j < clothing.length; j++) {
        const a = clothing[i];
        const b = clothing[j];
        if (a.itemId === b.itemId) continue; // an item's own pairing is authored
        const kind = pairHarmony(a.hsl, b.hsl, T);
        if (COORDINATED.has(kind)) coordinated += 1;
        else if (kind === "clash") {
          clashPairs += 1;
          clashes.push({ a: a.hex, b: b.hex, items: [a.itemName, b.itemName] });
          components.push(component(`clash ${a.hex} × ${b.hex}`, -1, `${a.itemName} × ${b.itemName}`));
        }
      }
    }
  }

  const considered = coordinated + clashPairs;
  const ratio = considered > 0 ? coordinated / considered : 0;
  const value = considered > 0 ? round(ratio * 100) : null;

  // Fashionware synergy (§9.2): a chrome colorway that coordinates with the
  // outfit's saturated colors earns its small bonus, per piece up to the cap.
  let synergy = 0;
  if (clothing.some((e) => !isNeutral(e.hsl, T))) {
    const byItem = new Map();
    for (const e of chrome) {
      if (!byItem.has(e.itemId)) byItem.set(e.itemId, { name: e.itemName, colors: [] });
      byItem.get(e.itemId).colors.push(e);
    }
    for (const [, fw] of byItem) {
      let good = 0;
      let judged = 0;
      for (const c of fw.colors) {
        for (const o of clothing) {
          const kind = pairHarmony(c.hsl, o.hsl, T);
          if (kind === "neutral") continue;
          judged += 1;
          if (COORDINATED.has(kind)) good += 1;
        }
      }
      if (judged > 0 && good > judged / 2) {
        synergy += C.fashionwareSynergyBonus ?? 0;
        components.push(component(`${fw.name} colorway synergy`, C.fashionwareSynergyBonus ?? 0, "fashionware matches the outfit"));
      }
    }
    synergy = Math.min(synergy, C.fashionwareSynergyCap ?? synergy);
  }

  const clamp = C.wsDeltaClamp ?? 0;
  const rawDelta = (considered > 0 ? round(ratio * (C.wsBonusMax ?? 0)) - clashPairs * (C.clashPenaltyPerPair ?? 0) : 0) + synergy;
  const wsDelta = Math.min(clamp, Math.max(-clamp, rawDelta));

  const state = considered === 0 ? "neutral"
    : clashPairs > coordinated ? "clashing"
    : ratio >= 0.75 && clashPairs === 0 ? "coordinated" : "mixed";

  if (wsDelta) components.push(component("Wardrobe & Style", wsDelta, "palette coordination"));

  const label = state === "neutral" ? "No palette read"
    : state === "coordinated" ? "Coordinated palette"
    : state === "clashing" ? "Clashing palette" : "Mixed palette";
  const blurb = state === "neutral"
    ? "Not enough authored color to judge the palette."
    : state === "coordinated" ? "The colorway hangs together — it reads deliberate."
    : state === "clashing" ? "The palette fights itself — the street notices."
    : "Some of it works, some of it argues.";

  return {
    ...result({ value, label, blurb, components, tunablesApplied: { "color.*": T } }),
    state, wsDelta, clashes, synergy, coordinatedPairs: coordinated, clashPairs,
  };
}

// ── palette membership (colorways) ───────────────────────────────────────────

/** Does a color belong to a palette? Neutrals match neutral palette entries by
 *  lightness; saturated colors match on hue + lightness proximity. */
export function colorMatchesPalette(hex, palette = [], T = {}) {
  const hsl = hexToHsl(hex);
  if (!hsl) return false;
  const P = T.paletteMatch ?? {};
  for (const p of palette) {
    const target = hexToHsl(p);
    if (!target) continue;
    const bothNeutral = isNeutral(hsl, T) && isNeutral(target, T);
    if (bothNeutral) {
      if (Math.abs(hsl.l - target.l) <= (P.neutralLightTol ?? 0)) return true;
      continue;
    }
    if (isNeutral(hsl, T) || isNeutral(target, T)) continue;
    if (hueDist(hsl.h, target.h) <= (P.hueTol ?? 0) && Math.abs(hsl.l - target.l) <= (P.lightTol ?? 0)) return true;
  }
  return false;
}

/** Worn colored pieces vs a palette → { matched, colored, coverage } (weighted). */
function paletteCoverage(items, factors, palette, T) {
  let matched = 0;
  let colored = 0;
  const matchedNames = [];
  for (const item of items) {
    if (!ACTIVE_EQUIP_STATES.has(cpr.getEquipState(item))) continue;
    const weight = factors && factors[item.id] !== undefined ? factors[item.id] : 1;
    if (weight === 0) continue;
    const colors = (getStyleData(item) ?? {}).colors ?? {};
    const hexes = [colors.primary, colors.accent].filter((h) => hexToHsl(h));
    if (!hexes.length) continue;
    colored += 1;
    if (hexes.some((h) => colorMatchesPalette(h, palette, T))) {
      matched += 1;
      matchedNames.push(item.name);
    }
  }
  return { matched, colored, coverage: colored > 0 ? matched / colored : 0, matchedNames };
}

/**
 * Faction colorway reads (§9.2): enough of the worn palette in a faction's
 * signature colors reads as soft affiliation — even on unbranded items.
 *
 * @param {object} p              { items, factors }
 * @param {object} factionsConfig { FACTIONS } (factions may carry `palette: [hex…]`)
 * @param {object} [colorTunables]
 * @returns explainable result: value/factions — { factionKey: points }
 */
export function factionColorwayReads({ items = [], factors } = {}, factionsConfig = {}, colorTunables = {}) {
  const T = colorTunables;
  const W = T.colorway ?? {};
  const factions = {};
  const components = [];

  for (const [key, fc] of Object.entries(factionsConfig.FACTIONS ?? {})) {
    if (!Array.isArray(fc.palette) || !fc.palette.length) continue;
    const { matched, colored, coverage } = paletteCoverage(items, factors, fc.palette, T);
    if (colored < (W.minPieces ?? 1) || coverage < (W.coverageMin ?? 1)) continue;
    const pts = Math.min(W.cap ?? 0, round(coverage * (W.weight ?? 0)));
    if (pts <= 0) continue;
    factions[key] = pts;
    components.push(component(`faction ${fc.label || key}`, pts, `colorway: ${matched}/${colored} pieces on palette`));
  }

  const keys = Object.keys(factions);
  return {
    ...result({
      value: factions,
      label: keys.length ? "Colorway affiliation" : "No colorway read",
      blurb: keys.length
        ? "The palette alone reads as colors worn on purpose."
        : "No faction's signature palette dominates the look.",
      components, tunablesApplied: { "color.*": T },
    }),
    factions,
  };
}

/** Merge colorway reads into a collectScMods result (additive, §29.4). Returns
 *  the same object untouched when there's nothing to merge. */
export function applyColorwayToScMods(scMods, colorwayReads) {
  const reads = colorwayReads?.factions ?? {};
  const keys = Object.keys(reads);
  if (!keys.length) return scMods;
  const merged = { ...scMods, factions: { ...scMods.factions } };
  for (const k of keys) merged.factions[k] = (merged.factions[k] || 0) + reads[k];
  merged.hasModifiers = true;
  merged.components = [...(scMods.components ?? []), ...(colorwayReads.components ?? [])];
  return merged;
}

/**
 * District palette fit (§9.2): on-palette outfits nudge district fit — positive
 * only. Add `value` to districtStyleFit().currentScore at display/consume time.
 *
 * @param {object} p          { items, factors }
 * @param {object} district   district config (may carry `palette: [hex…]`)
 * @param {object} [colorTunables]
 */
export function districtPaletteFit({ items = [], factors } = {}, district = {}, colorTunables = {}) {
  const T = colorTunables;
  const D = T.districtFit ?? {};
  const palette = Array.isArray(district.palette) ? district.palette : [];
  const { matched, colored, coverage } = palette.length
    ? paletteCoverage(items, factors, palette, T)
    : { matched: 0, colored: 0, coverage: 0 };

  const engaged = palette.length > 0 && colored >= (D.minPieces ?? 1);
  const value = engaged ? round(coverage * (D.weight ?? 0)) : 0;

  return {
    ...result({
      value,
      label: value > 0 ? "On the district's palette" : "No palette nudge",
      blurb: value > 0
        ? `${matched} of ${colored} colored pieces sit on the local palette — the look belongs here.`
        : "The district's colors aren't in this outfit (or it doesn't define any).",
      components: value > 0 ? [component("district palette fit", value, `${matched}/${colored} pieces on palette`)] : [],
      tunablesApplied: { "color.*": T },
    }),
    coverage, matched, colored,
  };
}
