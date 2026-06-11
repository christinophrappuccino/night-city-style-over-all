/**
 * checks/recognition.mjs — M9.1 brand recognition + counterfeits (aggregate;
 * fixture-independent).
 *
 * NEW engine work (no macro reference; designed from §13.3, §13.4, §23.2).
 * Verifies engine/recognition.mjs + the disguise hook:
 *  1. collectWornBrands — dual-read (D4), defaults, visibility/hidden plumbing;
 *  2. recognition bars (§13.3) — iconic reads to everyone, known needs
 *     literacy, niche stays unread; active scans add literacy; an
 *     unrecognized luxury label still reads "expensive";
 *  3. physical gating — clothing under the visibility floor is never clocked;
 *  4. §23.2 — hidden chrome's brand surfaces only at the deep scan tier;
 *  5. counterfeits (§13.4) — passive reads genuine; the reveal DC scales with
 *     replica quality; a beaten DC exposes the fake;
 *  6. applyCounterfeitToDisguise — per-reveal penalty + no-op.
 */

import BRANDS_CONFIG from "../../../scripts/config/brands.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";
import { collectWornBrands, recognizeBrands, counterfeitScan } from "../../../scripts/engine/recognition.mjs";
import { applyCounterfeitToDisguise } from "../../../scripts/engine/disguise.mjs";

const MODULE_ID = "night-city-style-over-all";
const REC_T = TUNABLES_DEFAULTS.recognition;

let nextId = 0;
function mockItem({ styleData, changes = [], type = "clothing", equipped = "equipped", name = "Piece" } = {}) {
  const effects = [];
  if (changes.length) effects.push({ name: "SC FX", disabled: false, changes });
  return {
    id: `rec-mock-${nextId++}`, name, type, img: null,
    system: { equipped }, effects,
    flags: styleData !== undefined ? { [MODULE_ID]: { styleData } } : {},
  };
}

export default function recognitionChecks() {
  const checks = [];
  const recognize = (p) => recognizeBrands(p, BRANDS_CONFIG, REC_T);

  // 1 — collector: flag + AE bridge collected, unbranded skipped, plumbing applied.
  const flagged = mockItem({ styleData: { brand: "ofuda" }, name: "Hanabi Bomber" });
  const bridged = mockItem({ changes: [{ key: "sc.brand.rustwerk", value: 1 }], name: "Scrapline Parka" });
  const plain = mockItem({ styleData: {}, name: "Plain Tee" });
  const optic = mockItem({ styleData: { brand: "kiroshi" }, type: "cyberware", equipped: "installed", name: "Kiroshi Optic" });
  const worn = collectWornBrands({
    items: [flagged, bridged, plain, optic],
    visibility: { [flagged.id]: 0.7 },
    hiddenItemIds: [optic.id],
  });
  checks.push({
    name: "recognition.collectWornBrands — dual-read, defaults, visibility/hidden plumbing",
    actual: worn.map((w) => ({ brand: w.brand, physical: w.physical, hidden: w.hidden, authenticity: w.authenticity })),
    expected: [
      { brand: "ofuda", physical: 0.7, hidden: false, authenticity: "genuine" },
      { brand: "rustwerk", physical: 1, hidden: false, authenticity: "genuine" },
      { brand: "kiroshi", physical: 1, hidden: true, authenticity: "genuine" },
    ],
  });

  // 2 — bars (§13.3). Street observer (INT 3), passive glance: iconic Kiroshi
  //     reads; known Ofuda (bar 4) doesn't — but its luxury tier still reads
  //     "expensive"; niche Brass Lotus (bar 8) is invisible-as-a-name.
  const wardrobe = [
    { itemId: "a", name: "Bomber", brand: "ofuda", physical: 1, hidden: false, authenticity: "genuine", replicaTier: null, isChrome: false },
    { itemId: "b", name: "Longcoat", brand: "brass_lotus", physical: 1, hidden: false, authenticity: "genuine", replicaTier: null, isChrome: false },
    { itemId: "c", name: "Shades", brand: "kiroshi", physical: 1, hidden: false, authenticity: "genuine", replicaTier: null, isChrome: false },
  ];
  const passive = recognize({ wornBrands: wardrobe, observerLiteracy: 3, scanTier: null });
  const summary = (r) => Object.fromEntries(r.value.map((b) => [b.brand, { recognized: b.recognized, prestige: b.prestige }]));
  checks.push({
    name: "recognition — passive glance: iconic reads, known/niche gated, luxury reads expensive",
    actual: summary(passive),
    expected: {
      ofuda: { recognized: false, prestige: "expensive" },
      brass_lotus: { recognized: false, prestige: "expensive" },
      kiroshi: { recognized: true, prestige: "named" },
    },
  });

  // 2b — a FULL scan adds literacy (+4): Ofuda now clocks (7 ≥ 4); Brass Lotus
  //      still doesn't (7 < 8) — knowing the obscure label stays a flex.
  const studied = recognize({ wornBrands: wardrobe, observerLiteracy: 3, scanTier: "full" });
  checks.push({
    name: "recognition — full scan literacy bonus: known clocks, niche still gated",
    actual: { ofuda: summary(studied).ofuda.recognized, brassLotus: summary(studied).brass_lotus.recognized },
    expected: { ofuda: true, brassLotus: false },
  });

  // 3 — visibility floor: a brand on a buried piece (0.1 < 0.25) never reads.
  const buried = recognize({
    wornBrands: [{ itemId: "x", name: "Hidden Shirt", brand: "ofuda", physical: 0.1, hidden: false, authenticity: "genuine", replicaTier: null, isChrome: false }],
    observerLiteracy: 10, scanTier: "full",
  });
  checks.push({
    name: "recognition — covered clothing under the visibility floor is never clocked",
    actual: { reads: buried.value.length, label: buried.label },
    expected: { reads: 0, label: "No brands visible" },
  });

  // 4 — §23.2 hidden chrome: invisible passively and at partial; surfaces at FULL.
  const chrome = [{ itemId: "k", name: "Internal Optic", brand: "kiroshi", physical: 1, hidden: true, authenticity: "genuine", replicaTier: null, isChrome: true }];
  checks.push({
    name: "recognition — hidden chrome's brand surfaces only at the deep scan tier (§23.2)",
    actual: {
      passive: recognize({ wornBrands: chrome, observerLiteracy: 10, scanTier: null }).value.length,
      partial: recognize({ wornBrands: chrome, observerLiteracy: 10, scanTier: "partial" }).value.length,
      full: recognize({ wornBrands: chrome, observerLiteracy: 10, scanTier: "full" }).value.length,
    },
    expected: { passive: 0, partial: 0, full: 1 },
  });

  // 5 — counterfeits (§13.4). Premium replica DC = 12 + 4 = 16; knockoff = 12.
  //     Passive: reads genuine even to a literate observer. Active: DC decides.
  const fake = [{ itemId: "f", name: "Imperial Column (rep)", brand: "brass_lotus", physical: 1, hidden: false, authenticity: "counterfeit", replicaTier: "premiumReplica", isChrome: false }];
  const glance = recognize({ wornBrands: fake, observerLiteracy: 8, scanTier: null });
  const weakScan = recognize({ wornBrands: fake, observerLiteracy: 8, scanTier: "full", scanTotal: 15 });
  const sharpScan = recognize({ wornBrands: fake, observerLiteracy: 8, scanTier: "full", scanTotal: 16 });
  checks.push({
    name: "recognition — counterfeit reads genuine passively; the scan DC decides the reveal",
    actual: {
      passiveCounterfeit: glance.value[0].counterfeit,
      passiveRecognized: glance.value[0].recognized,
      weakRevealed: weakScan.value[0].counterfeit.revealed,
      sharpRevealed: sharpScan.value[0].counterfeit.revealed,
      sharpExposedCount: sharpScan.exposed.length,
      knockoffDc: counterfeitScan({ replicaTier: "streetKnockoff", scanTotal: 0 }, REC_T).dc,
      premiumDc: counterfeitScan({ replicaTier: "premiumReplica", scanTotal: 0 }, REC_T).dc,
    },
    expected: {
      passiveCounterfeit: null, passiveRecognized: true,
      weakRevealed: false, sharpRevealed: true, sharpExposedCount: 1,
      knockoffDc: 12, premiumDc: 16,
    },
  });

  // 6 — disguise hook: one exposed fake −15, re-banded; none = untouched.
  const hit = applyCounterfeitToDisguise({ confidence: 80, label: "DEEP COVER", revealedCount: 1, tunables: TUNABLES_DEFAULTS });
  const noop = applyCounterfeitToDisguise({ confidence: 80, label: "DEEP COVER", revealedCount: 0, tunables: TUNABLES_DEFAULTS });
  checks.push({
    name: "recognition.applyCounterfeitToDisguise — per-reveal penalty + no-op",
    actual: { confidence: hit.confidence, penalty: hit.counterfeitPenalty, applied: hit.applied, noop: noop.applied, noopConfidence: noop.confidence },
    expected: { confidence: 65, penalty: 15, applied: true, noop: false, noopConfidence: 80 },
  });

  return checks;
}
