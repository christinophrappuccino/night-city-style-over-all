/**
 * checks/components.mjs — M9.2 chart library + transparency standard (aggregate;
 * fixture-independent).
 *
 * NEW work (no macro reference — §25 charts and the §19 breakdown path never
 * existed in Phase 82; designed from §25.1/§25.3/§19.2–§19.4). Verifies the
 * PURE view-model builders against hand-computed geometry:
 *  1. radar — spoke angles/normalization, overlay tag-alignment, scale floor;
 *  2. gauge — band segments from the live heat dials, needle angle, band pick;
 *  3. ring — circumference/dashoffset, threshold tick, pass/fail wording;
 *  4. fingerprint — proportions, dominance, tail collapse into Other;
 *  5. sparkline — point mapping, direction wording;
 *  6. heatmap — fixed vs column normalization, intensity levels;
 *  7. breakdownView — rows from components, zero-drop, totals, dial display;
 *  8. glossary/metricScale — thresholds read LIVE from tunables/config (§19.3).
 */

import { radarView, gaugeView, ringView, fingerprintView, sparklineView, heatmapView } from "../../../scripts/apps/components/charts.mjs";
import { breakdownView } from "../../../scripts/apps/components/breakdown.mjs";
import { glossary, metricScale, metricMeta, METRICS } from "../../../scripts/engine/metrics.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";
import { RATINGS } from "../../../scripts/config/ratings.mjs";

export default function componentChecks() {
  const checks = [];
  const T = TUNABLES_DEFAULTS;

  // ── 1. radar geometry ──────────────────────────────────────────────────────
  // 4 spokes on the compass points (size 240, labels → r 90, center 120):
  // top value 10 (full), right 5 (half), bottom 0 (center), left 5 (half).
  const radar = radarView(
    [
      { tag: "a", label: "A", value: 10, dominant: true },
      { tag: "b", label: "B", value: 5 },
      { tag: "c", label: "C", value: 0 },
      { tag: "d", label: "D", value: 5 },
    ],
    { overlay: [{ tag: "d", value: 10 }], size: 240 }
  );
  checks.push({
    name: "components.radar — spoke angles + normalization (4-point compass)",
    actual: { points: radar.points, max: radar.max, axes: radar.axes.length, hasSignal: radar.hasSignal },
    expected: { points: "120,30 165,120 120,120 75,120", max: 10, axes: 4, hasSignal: true },
  });
  checks.push({
    name: "components.radar — overlay aligns by TAG, missing tags read 0 (§24)",
    actual: { overlayPoints: radar.overlayPoints },
    expected: { overlayPoints: "120,120 120,120 120,120 30,120" },
  });
  const faint = radarView([{ tag: "a", label: "A", value: 1 }, { tag: "b", label: "B", value: 1 }, { tag: "c", label: "C", value: 1 }], { size: 240, minScale: 5 });
  checks.push({
    name: "components.radar — scale floor keeps faint profiles small",
    actual: { max: faint.max },
    expected: { max: 5 },
  });

  // ── 2. gauge from the LIVE heat dials ─────────────────────────────────────
  // metricScale("heat") reads tunables.heat.levels — the dial zones and the
  // engine's banding share one source (§19.3).
  const heatBands = metricScale("heat", T);
  const gauge = gaugeView({ value: 50, max: 100, bands: heatBands, width: 200 });
  checks.push({
    name: "components.gauge — band zones from tunables.heat.levels, in order",
    actual: { segs: gauge.segments.map((s) => s.key), band: gauge.band },
    expected: { segs: ["cold", "warm", "hot", "blazing"], band: { key: "hot", label: "HOT" } },
  });
  checks.push({
    name: "components.gauge — needle at 50/100 points straight up",
    actual: { needle: gauge.needle, dot: gauge.dot, pct: gauge.pct },
    expected: { needle: { x1: 100, y1: 108, x2: 100, y2: 34 }, dot: { x: 100, y: 30 }, pct: 50 },
  });
  checks.push({
    name: "components.gauge — first segment arc spans cold (0 → warm threshold)",
    actual: { path: gauge.segments[0].path },
    expected: { path: "M 22 108 A 78 78 0 0 1 44.8 52.8" },
  });

  // ── 3. ring vs pass mark ───────────────────────────────────────────────────
  const ring = ringView({ value: 68, max: 100, threshold: 75, label: "PASSABLE", size: 120 });
  checks.push({
    name: "components.ring — circumference/dashoffset + threshold tick at 75%",
    actual: {
      circumference: ring.circumference, dashOffset: ring.dashOffset,
      tick: ring.tick, pass: ring.pass, needText: ring.needText,
    },
    expected: {
      circumference: 301.6, dashOffset: 96.5,
      tick: { x1: 19, y1: 60, x2: 5, y2: 60 }, pass: false, needText: "need 75",
    },
  });
  const ringPass = ringView({ value: 80, threshold: 75 });
  checks.push({
    name: "components.ring — clearing the mark flips the wording, not just color",
    actual: { pass: ringPass.pass, needText: ringPass.needText },
    expected: { pass: true, needText: "clears 75" },
  });

  // ── 4. fingerprint proportions ─────────────────────────────────────────────
  const fp = fingerprintView({ kitsch: 2, leisurewear: 1, businesswear: 1 });
  checks.push({
    name: "components.fingerprint — proportions + dominance (2/1/1 → 50/25/25)",
    actual: {
      pcts: fp.segments.map((s) => s.pct), colors: fp.segments.map((s) => s.colorClass),
      dominant: fp.segments[0].dominant, total: fp.total,
    },
    expected: { pcts: [50, 25, 25], colors: ["c0", "c1", "c2"], dominant: true, total: 4 },
  });
  const manyStyles = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`s${i}`, 10 - i]));
  const fpTail = fingerprintView(manyStyles, { maxSegments: 8 });
  checks.push({
    name: "components.fingerprint — long tail collapses into Other (8-segment cap)",
    actual: { count: fpTail.segments.length, lastLabel: fpTail.segments[7].label, lastCount: fpTail.segments[7].count },
    expected: { count: 8, lastLabel: "Other", lastCount: 1 + 2 + 3 }, // s9 + s8 + s7
  });
  checks.push({
    name: "components.fingerprint — empty set degrades to an empty state",
    actual: fingerprintView({}),
    expected: { segments: [], total: 0, hasSignal: false },
  });

  // ── 5. sparkline ───────────────────────────────────────────────────────────
  const spark = sparklineView([10, 30, 20], { label: "engagement" });
  checks.push({
    name: "components.sparkline — point mapping + worded direction (§25.3)",
    actual: { points: spark.points, last: spark.last, dir: spark.dir, dirWord: spark.dirWord },
    expected: { points: "3,25 60,3 117,14", last: 20, dir: "up", dirWord: "rising" },
  });
  checks.push({
    name: "components.sparkline — one point is not a trend",
    actual: sparklineView([42]),
    expected: { hasSignal: false, dir: "flat", dirWord: "steady" },
  });

  // ── 6. heatmap normalization ───────────────────────────────────────────────
  const hm = heatmapView([
    { name: "A", styleScore: 200, heat: { value: 80 }, danger: { value: 20 }, cohesion: { percent: 100 } },
    { name: "B", styleScore: 100, heat: { value: 40 }, danger: { value: 0 }, cohesion: { percent: 50 } },
  ]);
  checks.push({
    name: "components.heatmap — style normalizes per column, heat/danger/cohesion vs 100",
    actual: {
      cols: hm.columns.map((c) => c.key),
      a: hm.rows[0].cells.map((c) => c.level),
      b: hm.rows[1].cells.map((c) => c.level),
      bStylePct: hm.rows[1].cells[0].pct,
    },
    expected: {
      cols: ["style", "heat", "danger", "cohesion"],
      a: ["l4", "l4", "l1", "l4"],
      b: ["l2", "l2", "l0", "l2"],
      bStylePct: 50,
    },
  });

  // ── 7. breakdownView (§19.2 layer 2) ───────────────────────────────────────
  const bd = breakdownView({
    value: 34, label: "Heat 34 — WARM", blurb: "Draws 34/100 attention (WARM).",
    components: [
      { term: "base", value: 10, source: "Solo" },
      { term: "weapons", value: 12, source: "" },
      { term: "visible chrome", value: 8, source: "" },
      { term: "flashy colorway", value: 4, source: "" },
      { term: "nothing", value: 0, source: "" },
    ],
    tunablesApplied: { "heat.levels": { blazing: 75, hot: 50, warm: 25 } },
  });
  checks.push({
    name: "components.breakdown — rows from components (zero dropped), Σ, dials inlined",
    actual: {
      rows: bd.rows.length, first: bd.rows[0], total: bd.total.display,
      dial: bd.tunables[0],
    },
    expected: {
      rows: 4, first: { term: "base", display: "+10", cls: "pos", source: "Solo" }, total: "+34",
      dial: { key: "heat.levels", display: "blazing 75 · hot 50 · warm 25" },
    },
  });
  checks.push({
    name: "components.breakdown — negatives signed and classed",
    actual: breakdownView({ components: [{ term: "clash", value: -3 }, { term: "x", value: 1 }] }).rows[0],
    expected: { display: "-3", cls: "neg" },
  });

  // ── 8. glossary generated from live dials (§19.3 — docs can't drift) ───────
  const gl = glossary(T, { ratings: RATINGS });
  const heatEntry = gl.find((e) => e.key === "heat");
  const tiers = gl.find((e) => e.key === "styleRating");
  checks.push({
    name: "components.glossary — heat scale reads tunables.heat.levels live",
    actual: { scale: heatEntry.scale },
    expected: {
      scale: [
        { key: "cold", label: "COLD", min: 0 },
        { key: "warm", label: "WARM", min: 25 },
        { key: "hot", label: "HOT", min: 50 },
        { key: "blazing", label: "BLAZING", min: 75 },
      ],
    },
  });
  checks.push({
    name: "components.glossary — style tiers from config ratings, ascending",
    actual: { first: tiers.scale[0], last: tiers.scale[8], count: tiers.scale.length },
    expected: { first: { label: "Disaster Zone (F)", min: 0 }, last: { label: "Myth Made Flesh (SSS)", min: 900 }, count: 9 },
  });
  checks.push({
    name: "components.glossary — every metric carries a definition + chart mapping",
    actual: {
      complete: gl.every((e) => e.key && e.label && e.definition && e.chart),
      count: gl.length,
      disguiseScale: metricScale("disguise", T).map((b) => b.key),
      unknown: metricMeta("nope"),
    },
    expected: {
      complete: true,
      count: METRICS.length,
      disguiseScale: ["blown", "suspicious", "risky", "passable", "convincing"],
      unknown: null,
    },
  });

  return checks;
}
