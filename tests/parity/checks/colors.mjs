/**
 * checks/colors.mjs — M9.1 color math (aggregate; fixture-independent).
 *
 * NEW engine work (no macro reference — colors were cosmetic; designed from
 * §9.2). Verifies engine/colors.mjs:
 *  1. hex→HSL primitives + neutral detection;
 *  2. pair harmony — matched/complementary/triad/clash/muted/neutral bands;
 *  3. outfit coordination — bonus, clash penalty, the minColored gate, covered
 *     items dropping out (the coat saves the clashing outfit), fashionware
 *     synergy;
 *  4. palette membership (hue+lightness; neutrals by lightness);
 *  5. faction colorway reads — coverage gate + soft-affiliation points and the
 *     scMods merge;
 *  6. district palette fit — positive-only nudge.
 */

import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";
import {
  hexToHsl, isNeutral, pairHarmony, colorCoordination,
  colorMatchesPalette, factionColorwayReads, applyColorwayToScMods, districtPaletteFit,
} from "../../../scripts/engine/colors.mjs";

const MODULE_ID = "night-city-style-over-all";
const COLOR_T = TUNABLES_DEFAULTS.color;

let nextId = 0;
function mockItem({ colors, type = "clothing", equipped = "equipped", name = "Piece" } = {}) {
  return {
    id: `color-mock-${nextId++}`, name, type, img: null,
    system: { equipped }, effects: [],
    flags: colors ? { [MODULE_ID]: { styleData: { colors } } } : {},
  };
}

export default function colorChecks() {
  const checks = [];

  // 1 — primitives.
  checks.push({
    name: "colors.hexToHsl — red, orange, gray; neutrals detected",
    actual: {
      red: hexToHsl("#ff0000"),
      orangeH: hexToHsl("#ff8000").h,
      grayNeutral: isNeutral(hexToHsl("#808080"), COLOR_T),
      blackNeutral: isNeutral(hexToHsl("#111111"), COLOR_T),
      whiteNeutral: isNeutral(hexToHsl("#f8f8f8"), COLOR_T),
      redNeutral: isNeutral(hexToHsl("#ff0000"), COLOR_T),
      invalid: hexToHsl("not-a-color"),
    },
    expected: {
      red: { h: 0, s: 1, l: 0.5 },
      orangeH: (60 * 128) / 255,
      grayNeutral: true, blackNeutral: true, whiteNeutral: true, redNeutral: false,
      invalid: null,
    },
  });

  // 2 — harmony bands.
  const H = (a, b) => pairHarmony(hexToHsl(a), hexToHsl(b), COLOR_T);
  checks.push({
    name: "colors.pairHarmony — matched/complementary/triad/clash/muted/neutral",
    actual: {
      analogous: H("#ff0000", "#ff8000"),    // Δh ≈ 30 ≤ 35
      complementary: H("#ff0000", "#00ffff"), // Δh = 180
      triad: H("#ff0000", "#00ff00"),         // Δh = 120
      clash: H("#ff0000", "#aaff00"),         // Δh = 80, both saturated
      muted: H("#996666", "#667799"),         // Δh = 140 but s = 0.2 < 0.4
      neutral: H("#ff0000", "#808080"),
    },
    expected: {
      analogous: "matched", complementary: "complementary", triad: "triad",
      clash: "clash", muted: "muted", neutral: "neutral",
    },
  });

  // 3 — outfit coordination.
  const coord = (items, factors) => colorCoordination({ items, factors }, COLOR_T);

  const redJacket = mockItem({ colors: { primary: "#ff0000" }, name: "Red Jacket" });
  const orangePants = mockItem({ colors: { primary: "#ff8000" }, name: "Orange Pants" });
  const matched = coord([redJacket, orangePants]);
  checks.push({
    name: "colors.coordination — matched palette: +2 W&S, value 100",
    actual: { value: matched.value, wsDelta: matched.wsDelta, state: matched.state },
    expected: { value: 100, wsDelta: 2, state: "coordinated" },
  });

  const limePants = mockItem({ colors: { primary: "#aaff00" }, name: "Lime Pants" });
  const clashing = coord([redJacket, limePants]);
  checks.push({
    name: "colors.coordination — clashing palette: −1 W&S, clash listed",
    actual: { value: clashing.value, wsDelta: clashing.wsDelta, state: clashing.state, clashes: clashing.clashes.length },
    expected: { value: 0, wsDelta: -1, state: "clashing", clashes: 1 },
  });

  const neutralFit = coord([
    mockItem({ colors: { primary: "#808080" }, name: "Gray Tee" }),
    mockItem({ colors: { primary: "#111111" }, name: "Black Pants" }),
  ]);
  const single = coord([redJacket]);
  checks.push({
    name: "colors.coordination — all-neutral or under minColored: no read",
    actual: {
      neutralState: neutralFit.state, neutralDelta: neutralFit.wsDelta, neutralValue: neutralFit.value,
      singleState: single.state, singleDelta: single.wsDelta,
    },
    expected: { neutralState: "neutral", neutralDelta: 0, neutralValue: null, singleState: "neutral", singleDelta: 0 },
  });

  // 3b — covered colors don't read: the coat over the lime pants saves the fit.
  const saved = coord([redJacket, limePants], { [limePants.id]: 0 });
  checks.push({
    name: "colors.coordination — covering the clashing piece removes the clash",
    actual: { state: saved.state, wsDelta: saved.wsDelta },
    expected: { state: "neutral", wsDelta: 0 },
  });

  // 3c — fashionware synergy (§9.2): techhair on the outfit's hues adds +1.
  const techhair = mockItem({ colors: { primary: "#ff3300" }, type: "cyberware", equipped: "installed", name: "Techhair" });
  const synergized = coord([redJacket, orangePants, techhair]);
  checks.push({
    name: "colors.coordination — fashionware colorway synergy adds its bonus",
    actual: { wsDelta: synergized.wsDelta, synergy: synergized.synergy, value: synergized.value },
    expected: { wsDelta: 3, synergy: 1, value: 100 },
  });

  // 4 — palette membership.
  const TYGER_PALETTE = ["#ff0033", "#ff2a6d", "#111111"];
  checks.push({
    name: "colors.colorMatchesPalette — hue+lightness for saturated, lightness for neutrals",
    actual: {
      nearRed: colorMatchesPalette("#ff0040", TYGER_PALETTE, COLOR_T),
      black: colorMatchesPalette("#000000", TYGER_PALETTE, COLOR_T),
      offHue: colorMatchesPalette("#00ff00", TYGER_PALETTE, COLOR_T),
      neutralVsSaturated: colorMatchesPalette("#808080", ["#ff0033"], COLOR_T),
    },
    expected: { nearRed: true, black: true, offHue: false, neutralVsSaturated: false },
  });

  // 5 — faction colorway reads (custom one-faction registry for determinism).
  const FACTIONS_ONE = { FACTIONS: { tyger_claws: { label: "Tyger Claws", palette: TYGER_PALETTE } } };
  const wayFull = factionColorwayReads(
    { items: [mockItem({ colors: { primary: "#ff0040" } }), mockItem({ colors: { primary: "#ff2a6d" } })] },
    FACTIONS_ONE, COLOR_T
  );
  const wayHalf = factionColorwayReads(
    { items: [mockItem({ colors: { primary: "#ff0040" } }), mockItem({ colors: { primary: "#00ff00" } })] },
    FACTIONS_ONE, COLOR_T
  );
  const wayOne = factionColorwayReads(
    { items: [mockItem({ colors: { primary: "#ff0040" } })] },
    FACTIONS_ONE, COLOR_T
  );
  checks.push({
    name: "colors.factionColorwayReads — coverage → points, gates respected",
    actual: { full: wayFull.factions, half: wayHalf.factions, underMin: wayOne.factions },
    expected: { full: { tyger_claws: 10 }, half: { tyger_claws: 5 }, underMin: {} },
  });

  // 5b — scMods merge is additive and non-destructive.
  const base = { factions: { tyger_claws: 25 }, hasModifiers: true, components: [] };
  const mergedMods = applyColorwayToScMods(base, wayFull);
  const untouched = applyColorwayToScMods(base, { factions: {} });
  checks.push({
    name: "colors.applyColorwayToScMods — additive merge; no-op returns the input",
    actual: { merged: mergedMods.factions, baseUnchanged: base.factions.tyger_claws, noop: untouched === base },
    expected: { merged: { tyger_claws: 35 }, baseUnchanged: 25, noop: true },
  });

  // 6 — district palette fit: on-palette nudge, positive only, palette-less = 0.
  const KABUKI = { name: "Kabuki", palette: ["#ff2a6d", "#05d9e8", "#ff0033"] };
  const onPalette = districtPaletteFit(
    { items: [mockItem({ colors: { primary: "#ff0040" } }), mockItem({ colors: { primary: "#ff2a6d" } })] },
    KABUKI, COLOR_T
  );
  const offPalette = districtPaletteFit(
    { items: [mockItem({ colors: { primary: "#00ff00" } }), mockItem({ colors: { primary: "#0000ff" } })] },
    KABUKI, COLOR_T
  );
  const noPalette = districtPaletteFit(
    { items: [mockItem({ colors: { primary: "#ff0040" } }), mockItem({ colors: { primary: "#ff2a6d" } })] },
    { name: "The Glen" }, COLOR_T
  );
  checks.push({
    name: "colors.districtPaletteFit — on-palette nudges, off/absent stays 0",
    actual: { on: onPalette.value, off: offPalette.value, none: noPalette.value },
    expected: { on: 8, off: 0, none: 0 },
  });

  return checks;
}
