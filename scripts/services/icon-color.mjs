/**
 * icon-color.mjs — the §9.1 SVG icon recolor service (M9.4c).
 *
 * Pipeline (guide §9.1, verbatim):
 *  1. fetch(item.img) → SVG source text.
 *  2. Recolor by SENTINEL CONVENTION first (our catalog icons author their
 *     fills as #FF00FF → colors.primary and #00FFFF → colors.accent — a
 *     precise string swap); stock icons with arbitrary fills fall back to
 *     tinting the DOMINANT fill.
 *  3. Display INLINE by default (data URI, zero persistence — Wardrobe,
 *     lookbook, previews); BAKED on opt-in (colors.recolorIcon +
 *     FilePicker.upload → styleData.colors.recoloredImgPath).
 *  4. Raster fallback: non-SVG icons get a CSS hue-rotate filter at render.
 *
 * recolorSvgText / hueRotateFilter / svgToDataUri are PURE (node-gated by
 * checks/icon-color.mjs); only iconFor/bakeRecoloredIcon touch Foundry.
 * The sentinel-fill icon SET is the Q4 art deliverable — until it lands,
 * the dominant-fill fallback carries stock icons best-effort.
 */

import { hexToHsl } from "../engine/colors.mjs";
import { dualReadStyleData } from "../data/sc-keys.mjs";
import { updateStyleData } from "../data/flags.mjs";

// ── pure core ────────────────────────────────────────────────────────────────

const SENTINEL_PRIMARY = /#ff00ff\b|#f0f\b/gi;
const SENTINEL_ACCENT = /#00ffff\b|#0ff\b/gi;

/** Fills we never treat as "dominant" — structural, not identity. */
const STRUCTURAL_FILLS = new Set(["none", "transparent", "#000", "#000000", "#fff", "#ffffff", "currentcolor"]);

/**
 * Recolor an SVG's source text to an item's colorway.
 * Sentinel fills swap precisely; otherwise the dominant non-structural fill
 * tints to `primary` (best-effort for stock icons).
 *
 * @param {string} svgText
 * @param {{primary?: string, accent?: string}} colors
 * @returns {{ svg: string, mode: "sentinel"|"dominant"|"none", swapped: number }}
 */
export function recolorSvgText(svgText, colors = {}) {
  const { primary, accent } = colors;
  if (!svgText || (!primary && !accent)) return { svg: svgText, mode: "none", swapped: 0 };

  // 1 — sentinel convention (our catalog icons).
  let swapped = 0;
  let out = svgText;
  if (primary) out = out.replace(SENTINEL_PRIMARY, () => (swapped++, primary));
  if (accent) out = out.replace(SENTINEL_ACCENT, () => (swapped++, accent));
  if (swapped > 0) return { svg: out, mode: "sentinel", swapped };

  // 2 — dominant-fill fallback (stock icons, arbitrary palettes).
  if (!primary) return { svg: svgText, mode: "none", swapped: 0 };
  const counts = new Map();
  for (const m of svgText.matchAll(/(?:fill|stroke)\s*[:=]\s*["']?(#[0-9a-fA-F]{3,8})/g)) {
    const hex = m[1].toLowerCase();
    if (STRUCTURAL_FILLS.has(hex)) continue;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!dominant) return { svg: svgText, mode: "none", swapped: 0 };
  const re = new RegExp(dominant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  out = svgText.replace(re, () => (swapped++, primary));
  return { svg: out, mode: "dominant", swapped };
}

/** SVG source → data URI usable as an <img src>. */
export function svgToDataUri(svgText) {
  return `data:image/svg+xml,${encodeURIComponent(svgText)}`;
}

/**
 * Raster fallback: a CSS filter string steering a generic icon TOWARD the
 * primary hue. Display-only, free, approximate (guide §9.1 step 4).
 * @returns {string|null} e.g. "hue-rotate(312deg) saturate(1.4)"
 */
export function hueRotateFilter(primaryHex) {
  const hsl = hexToHsl(primaryHex);
  if (!hsl) return null;
  return `hue-rotate(${Math.round(hsl.h)}deg) saturate(${hsl.s >= 0.5 ? 1.4 : 1})`;
}

// ── Foundry shell ────────────────────────────────────────────────────────────

/** Inline-recolor cache: img path + colorway → resolved icon descriptor. */
const _cache = new Map();

/**
 * Resolve an item's display icon honoring its colorway (§9.1 display modes).
 * Returns `{ src, filter }`:
 *  - baked path set → that file, no work;
 *  - SVG + colors → inline-recolored data URI (cached);
 *  - raster + colors → original src + a hue-rotate filter;
 *  - no colors / no recolorIcon opt-in for previews → original src.
 *
 * @param {Item} item
 * @param {object} [opts]
 * @param {boolean} [opts.always]  recolor even without the recolorIcon opt-in
 *                                 (the opt-in gates BAKING; previews may tint freely)
 * @returns {Promise<{src: string, filter: string|null, mode: string}>}
 */
export async function iconFor(item, { always = false } = {}) {
  const plain = { src: item?.img ?? "", filter: null, mode: "plain" };
  if (!item?.img) return plain;
  const colors = dualReadStyleData(item).styleData?.colors ?? {};
  if (colors.recoloredImgPath) return { src: colors.recoloredImgPath, filter: null, mode: "baked" };
  if (!colors.primary && !colors.accent) return plain;
  if (!always && !colors.recolorIcon) return plain;

  const key = `${item.img}|${colors.primary ?? ""}|${colors.accent ?? ""}`;
  if (_cache.has(key)) return _cache.get(key);

  let resolved = plain;
  if (item.img.toLowerCase().endsWith(".svg")) {
    try {
      const text = await (await fetch(item.img)).text();
      const { svg, mode, swapped } = recolorSvgText(text, colors);
      resolved = swapped > 0 ? { src: svgToDataUri(svg), filter: null, mode } : plain;
    } catch (e) {
      console.warn("Night City: Style Over All | icon recolor fetch failed:", item.img, e);
    }
  } else if (colors.primary) {
    resolved = { src: item.img, filter: hueRotateFilter(colors.primary), mode: "filter" };
  }
  _cache.set(key, resolved);
  return resolved;
}

/**
 * BAKE the recolor (guide §9.1 display mode 2, opt-in): upload the recolored
 * SVG to a world folder, record it on styleData.colors.recoloredImgPath, and
 * optionally point item.img at it so the tint shows on the CPR sheet/sidebar/
 * chat too. GM/owner action — writes documents.
 *
 * @param {Item} item
 * @param {object} [opts]
 * @param {boolean} [opts.setItemImg=true]
 * @returns {Promise<string|null>} the uploaded path, or null if not bakeable
 */
export async function bakeRecoloredIcon(item, { setItemImg = true } = {}) {
  const colors = dualReadStyleData(item).styleData?.colors ?? {};
  if (!item?.img?.toLowerCase().endsWith(".svg") || (!colors.primary && !colors.accent)) {
    ui.notifications?.warn("Baking needs an SVG icon and an authored colorway.");
    return null;
  }
  const text = await (await fetch(item.img)).text();
  const { svg, swapped } = recolorSvgText(text, colors);
  if (!swapped) {
    ui.notifications?.warn("No tintable fill found in this icon — nothing to bake.");
    return null;
  }
  const dir = "ncsoa-recolored";
  try { await FilePicker.createDirectory("data", dir); } catch { /* exists */ }
  const name = `${item.id}-${(colors.primary ?? "").replace("#", "")}.svg`;
  const file = new File([svg], name, { type: "image/svg+xml" });
  const up = await FilePicker.upload("data", dir, file, {});
  const path = up?.path;
  if (!path) return null;
  await updateStyleData(item, { colors: { ...colors, recoloredImgPath: path } });
  if (setItemImg) await item.update({ img: path });
  return path;
}
