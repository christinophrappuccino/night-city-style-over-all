/**
 * checks/icon-color.mjs — M9.4c: the §9.1 SVG recolor service's pure core
 * (aggregate; fixture-independent).
 *
 * NEW work (guide §9.1, no macro reference). Pins:
 *  1. sentinel convention — #FF00FF → colors.primary and #00FFFF →
 *     colors.accent swap precisely (case-insensitive, 3- and 6-digit forms),
 *     and sentinel presence SUPPRESSES the dominant-fill fallback;
 *  2. dominant-fill fallback — stock icons tint their most frequent
 *     non-structural fill to primary; black/white/none never count;
 *  3. no-ops — no colors, or nothing tintable, returns the input untouched
 *     with mode "none";
 *  4. helpers — data-URI shape and the raster hue-rotate filter.
 */

import { recolorSvgText, svgToDataUri, hueRotateFilter } from "../../../scripts/services/icon-color.mjs";

const SENTINEL_SVG = `<svg><path fill="#FF00FF" d="M0 0"/><circle stroke="#00ffff" r="2"/><rect fill="#ff00ff"/></svg>`;
const STOCK_SVG = `<svg><path fill="#8a4b2d" d="M0 0"/><path fill="#8A4B2D"/><path fill="#ffffff"/><path fill="none"/><path fill="#222222"/></svg>`;
const BARE_SVG = `<svg><path fill="none" d="M0 0"/><path fill="#000000"/></svg>`;

export default function iconColorChecks() {
  const checks = [];

  // 1 — sentinel swap: both sentinels, all casings; fallback suppressed.
  const sent = recolorSvgText(SENTINEL_SVG, { primary: "#12ab34", accent: "#fe9800" });
  checks.push({
    name: "iconColor.sentinel — precise swap, case-insensitive, fallback suppressed",
    actual: {
      mode: sent.mode,
      swapped: sent.swapped,
      hasPrimary: sent.svg.includes("#12ab34"),
      hasAccent: sent.svg.includes("#fe9800"),
      sentinelsGone: !/#ff00ff|#00ffff/i.test(sent.svg),
    },
    expected: { mode: "sentinel", swapped: 3, hasPrimary: true, hasAccent: true, sentinelsGone: true },
  });

  // 2 — dominant fallback: #8a4b2d (×2) wins over the structural fills.
  const dom = recolorSvgText(STOCK_SVG, { primary: "#00d9ff" });
  checks.push({
    name: "iconColor.dominant — most frequent non-structural fill tints to primary",
    actual: {
      mode: dom.mode,
      swapped: dom.swapped,
      tinted: dom.svg.includes("#00d9ff"),
      whiteKept: dom.svg.includes("#ffffff"),
      darkKept: dom.svg.includes("#222222"),
    },
    expected: { mode: "dominant", swapped: 2, tinted: true, whiteKept: true, darkKept: true },
  });

  // 3 — no-ops return the input untouched.
  const noColors = recolorSvgText(SENTINEL_SVG, {});
  const nothingTintable = recolorSvgText(BARE_SVG, { primary: "#00d9ff" });
  checks.push({
    name: "iconColor.noop — no colors / nothing tintable → input unchanged, mode none",
    actual: {
      noColorsMode: noColors.mode, noColorsSame: noColors.svg === SENTINEL_SVG,
      bareMode: nothingTintable.mode, bareSame: nothingTintable.svg === BARE_SVG,
    },
    expected: { noColorsMode: "none", noColorsSame: true, bareMode: "none", bareSame: true },
  });

  // 4 — helpers.
  checks.push({
    name: "iconColor.helpers — data-URI shape + hue-rotate filter from primary",
    actual: {
      uriPrefix: svgToDataUri("<svg/>").startsWith("data:image/svg+xml,"),
      filterMagenta: hueRotateFilter("#ff00ff"),
      filterBadHex: hueRotateFilter("not-a-color"),
    },
    expected: { uriPrefix: true, filterMagenta: "hue-rotate(300deg) saturate(1.4)", filterBadHex: null },
  });

  return checks;
}
