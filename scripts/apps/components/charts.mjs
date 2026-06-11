/**
 * charts.mjs — pure view-model builders for the §25 chart library (M9.2).
 *
 * Each builder turns engine output into an SVG/markup-ready view model for one
 * shared partial (templates/partials/*). All geometry is precomputed HERE because
 * Handlebars can't do math — partials only stamp coordinates. PURE: no game.*,
 * no DOM, no Foundry — testable in node (tests/parity/checks/components.mjs).
 *
 * These are PRESENTATION transforms, not formula logic: scale floors, sizes and
 * padding are layout choices, not gameplay constants — they don't ride Tunables
 * (§18 governs formula dials; band THRESHOLDS still come in via arguments from
 * tunables so the picture can never disagree with the math).
 *
 * Consistent visual language (§25.3) lives in styles/charts.css; colorblind
 * safety = every color is paired with a shape or label in the partials, and the
 * builders emit those labels/markers alongside the color classes.
 *
 * Spec: SC-Module-Architecture-Guide.md §25, §19.4, §4.1 (Layer Rule — app layer).
 */

const round1 = (n) => Math.round(n * 10) / 10;

/** Point on a circle. SVG y grows downward; angles in degrees, 0° = +x axis. */
function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: round1(cx + r * Math.cos(rad)), y: round1(cy + r * Math.sin(rad)) };
}

// ── vibe radar (§25.1 — the signature visual) ────────────────────────────────

/**
 * Radar / spider chart view. Spokes start at 12 o'clock and run clockwise in
 * the order given (vibes.spokes already carries the canonical §22.3 order).
 *
 * @param {Array<{tag:string,label:string,value:number,dominant?:boolean}>} spokes
 * @param {object} [opts]
 * @param {Array<{tag:string,value:number}>} [opts.overlay] second series aligned
 *   by tag (§24 self vs observed; missing tags read 0). Rendered dashed —
 *   the dash pattern, not color alone, separates the two polygons.
 * @param {string} [opts.seriesLabel]  legend label for the main polygon
 * @param {string} [opts.overlayLabel] legend label for the overlay polygon
 * @param {number} [opts.size]      square viewBox edge
 * @param {number} [opts.minScale]  scale floor so faint profiles don't fill the chart
 * @param {boolean} [opts.labels]   spoke labels on/off (off for small-multiples)
 * @param {number} [opts.rings]     grid ring count
 */
export function radarView(spokes = [], opts = {}) {
  const { overlay = null, seriesLabel = "", overlayLabel = "", size = 240, minScale = 5, labels = true, rings = 4 } = opts;
  const n = spokes.length;
  const cx = size / 2;
  const cy = size / 2;
  const labelPad = labels ? 30 : 6;
  const r = size / 2 - labelPad;

  const overlayByTag = {};
  for (const o of overlay ?? []) overlayByTag[o.tag] = o.value || 0;

  const max = Math.max(
    minScale,
    ...spokes.map((s) => s.value || 0),
    ...Object.values(overlayByTag)
  );

  const angle = (i) => -90 + (i * 360) / Math.max(1, n);
  const pointFor = (i, v) => polar(cx, cy, r * (Math.max(0, v) / max), angle(i));

  const axes = spokes.map((s, i) => {
    const tip = polar(cx, cy, r, angle(i));
    const lp = polar(cx, cy, r + 12, angle(i));
    const cos = Math.cos((angle(i) * Math.PI) / 180);
    const anchor = Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";
    const pt = pointFor(i, s.value || 0);
    return {
      tag: s.tag, label: s.label, value: s.value || 0, dominant: !!s.dominant,
      x1: cx, y1: cy, x2: tip.x, y2: tip.y,
      lx: lp.x, ly: round1(lp.y + 3), anchor,
      // Dominant tones get a marker dot on the polygon vertex — shape, not
      // color alone, flags dominance (§25.3 colorblind safety).
      px: pt.x, py: pt.y,
    };
  });

  const toPoints = (vals) => vals.map((v, i) => { const p = pointFor(i, v); return `${p.x},${p.y}`; }).join(" ");
  const points = toPoints(spokes.map((s) => s.value || 0));
  const overlayPoints = overlay ? toPoints(spokes.map((s) => overlayByTag[s.tag] || 0)) : null;

  const grid = [];
  for (let g = 1; g <= rings; g++) {
    grid.push(spokes.map((s, i) => { const p = polar(cx, cy, (r * g) / rings, angle(i)); return `${p.x},${p.y}`; }).join(" "));
  }

  const named = spokes.filter((s) => (s.value || 0) > 0);
  return {
    size, cx, cy, max, labels, axes, points, overlayPoints, grid,
    seriesLabel, overlayLabel,
    hasSignal: named.length > 0,
    ariaText: named.length
      ? named.map((s) => `${s.label} ${s.value}`).join(", ")
      : "No tone signal.",
  };
}

// ── heat gauge (§25.1 — single bounded value with thresholds) ─────────────────

/**
 * Semicircular gauge with labeled band zones. Bands come from tunables (e.g.
 * heat.levels → cold/warm/hot/blazing) so the dial can never disagree with the
 * engine's banding.
 *
 * @param {object} p
 * @param {number} p.value
 * @param {number} [p.max]
 * @param {Array<{key:string,label:string,min:number}>} p.bands ascending by min,
 *   first band at min 0
 * @param {number} [p.width] viewBox width
 */
export function gaugeView({ value = 0, max = 100, bands = [], width = 200 } = {}) {
  const height = width * 0.62;
  const cx = width / 2;
  const cy = height - 16;
  const r = width / 2 - 22;
  const v = Math.max(0, Math.min(max, value));
  // 180° sweep: angle 180° (left) → 360° (right), over the top.
  const angleOf = (val) => 180 + (val / max) * 180;

  const sorted = [...bands].sort((a, b) => a.min - b.min);
  const segments = sorted.map((b, i) => {
    const from = angleOf(b.min);
    const to = angleOf(i + 1 < sorted.length ? sorted[i + 1].min : max);
    const p1 = polar(cx, cy, r, from);
    const p2 = polar(cx, cy, r, to);
    const mid = polar(cx, cy, r + 13, (from + to) / 2);
    return {
      key: b.key, label: b.label,
      path: `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`,
      lx: mid.x, ly: mid.y,
    };
  });

  const band = sorted.reduce((acc, b) => (v >= b.min ? b : acc), sorted[0] ?? { key: "", label: "" });
  const needleA = angleOf(v);
  const nTip = polar(cx, cy, r - 4, needleA);
  const dot = polar(cx, cy, r, needleA);

  return {
    width, height, cx, cy, r, value: v, max,
    pct: Math.round((v / max) * 100),
    segments,
    band: { key: band.key, label: band.label },
    needle: { x1: cx, y1: cy, x2: nTip.x, y2: nTip.y },
    dot,
    ariaText: `${v} of ${max} — ${band.label}.`,
  };
}

// ── disguise ring (§25.1 — progress vs a pass threshold) ─────────────────────

/**
 * Progress ring with the pass threshold marked. "68%, need 75%" reads at a
 * glance; pass/fail is ALSO shown as a glyph + text, never color alone.
 *
 * @param {object} p
 * @param {number} p.value       current confidence (0..max)
 * @param {number} [p.max]
 * @param {number} [p.threshold] pass mark; omit for a plain progress ring
 * @param {string} [p.label]     band/word under the number (e.g. "PASSABLE")
 * @param {number} [p.size]      square viewBox edge
 */
export function ringView({ value = 0, max = 100, threshold = null, label = "", size = 120 } = {}) {
  const c = size / 2;
  const stroke = Math.max(6, Math.round(size / 12));
  const r = c - stroke - 2;
  const circumference = round1(2 * Math.PI * r);
  const v = Math.max(0, Math.min(max, value));
  const dashOffset = round1(circumference * (1 - v / max));

  let tick = null;
  let pass = null;
  let needText = "";
  if (threshold !== null && threshold !== undefined) {
    // The progress circle is rotated −90° (starts at top, clockwise); the tick
    // angle matches: 0 at top, clockwise.
    const a = (threshold / max) * 360 - 90;
    const t1 = polar(c, c, r - stroke / 2 - 2, a);
    const t2 = polar(c, c, r + stroke / 2 + 2, a);
    tick = { x1: t1.x, y1: t1.y, x2: t2.x, y2: t2.y };
    pass = v >= threshold;
    needText = pass ? `clears ${threshold}` : `need ${threshold}`;
  }

  return {
    size, c, r, stroke, circumference, dashOffset,
    value: v, max, label, threshold, tick, pass, needText,
    ariaText: `${v} of ${max}${label ? ` — ${label}` : ""}${needText ? ` (${needText})` : ""}.`,
  };
}

// ── style fingerprint bar (§25.1 — dominant + tail proportions) ──────────────

/**
 * Horizontal proportion bar for the genre/style mix. Color classes cycle c0–c7;
 * the legend pairs every color with its label + share (colorblind-safe).
 *
 * @param {Record<string, number>} styles  collected.styles (styleKey → count)
 * @param {object} [opts]
 * @param {(key:string)=>string} [opts.formatLabel]
 * @param {number} [opts.maxSegments] longest tail collapses into "Other"
 */
export function fingerprintView(styles = {}, opts = {}) {
  const { formatLabel = (k) => k, maxSegments = 8 } = opts;
  const entries = Object.entries(styles)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((acc, [, n]) => acc + n, 0);
  if (!total) return { segments: [], total: 0, hasSignal: false, ariaText: "No styled pieces." };

  const head = entries.slice(0, maxSegments - 1);
  const tail = entries.slice(maxSegments - 1);
  const rows = tail.length
    ? [...head, ["other", tail.reduce((acc, [, n]) => acc + n, 0)]]
    : head;

  const segments = rows.map(([key, n], i) => ({
    key,
    label: key === "other" && tail.length ? "Other" : formatLabel(key),
    count: n,
    pct: round1((n / total) * 100),
    colorClass: `c${i % 8}`,
    dominant: i === 0,
  }));

  return {
    segments, total, hasSignal: true,
    ariaText: segments.map((s) => `${s.label} ${s.pct}%`).join(", "),
  };
}

// ── sparkline (§25.1 — trend over time) ───────────────────────────────────────

/**
 * Tiny trend line. Direction is ALSO worded ("rising"/"falling"/"steady") so the
 * arrow glyph isn't the only carrier.
 *
 * @param {number[]} series  oldest → newest
 * @param {object} [opts] { width, height, label }
 */
export function sparklineView(series = [], opts = {}) {
  const { width = 120, height = 28, label = "" } = opts;
  const vals = series.filter((v) => Number.isFinite(v));
  if (vals.length < 2) {
    return { width, height, points: "", last: vals[0] ?? null, dir: "flat", dirWord: "steady", label, hasSignal: false, ariaText: "Not enough history." };
  }
  const pad = 3;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const step = (width - 2 * pad) / (vals.length - 1);
  const pts = vals.map((v, i) => ({
    x: round1(pad + i * step),
    y: round1(pad + (1 - (v - min) / span) * (height - 2 * pad)),
  }));
  const points = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const last = vals[vals.length - 1];
  const delta = last - vals[0];
  const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  return {
    width, height, points, label,
    last, min, max, delta,
    end: pts[pts.length - 1],
    dir,
    dirWord: dir === "up" ? "rising" : dir === "down" ? "falling" : "steady",
    hasSignal: true,
    ariaText: `${label || "Trend"}: ${vals[0]} → ${last} (${dir === "up" ? "rising" : dir === "down" ? "falling" : "steady"}).`,
  };
}

// ── GM heatmap (§25.1 — characters × metrics at one look) ────────────────────

/** The default GM columns; heat/danger/cohesion are 0–100 by engine contract. */
const HEATMAP_METRICS = [
  { key: "style", label: "Style", get: (t) => t.styleScore ?? 0, normalize: "column" },
  { key: "heat", label: "Heat", get: (t) => t.heat?.value ?? 0, normalize: 100 },
  { key: "danger", label: "Danger", get: (t) => t.danger?.value ?? 0, normalize: 100 },
  { key: "cohesion", label: "Cohesion", get: (t) => t.cohesion?.percent ?? 0, normalize: 100 },
];

/**
 * Color-coded grid over computeSceneTokens output. Every cell shows its NUMBER
 * inside the color (colorblind-safe); intensity classes run l0–l4.
 *
 * @param {object[]} tokens  computeSceneTokens records (or any subset shape)
 * @param {object} [opts]
 * @param {Array} [opts.metrics] column descriptors (see HEATMAP_METRICS)
 */
export function heatmapView(tokens = [], opts = {}) {
  const metrics = opts.metrics ?? HEATMAP_METRICS;

  const columnMax = {};
  for (const m of metrics) {
    columnMax[m.key] = m.normalize === "column"
      ? Math.max(1, ...tokens.map((t) => m.get(t) || 0))
      : m.normalize;
  }

  const rows = tokens.map((t) => ({
    name: t.name,
    img: t.img ?? null,
    isPC: !!t.isPC,
    cells: metrics.map((m) => {
      const value = Math.round(m.get(t) || 0);
      const pct = Math.max(0, Math.min(1, value / columnMax[m.key]));
      return { key: m.key, value, pct: round1(pct * 100), level: `l${Math.min(4, Math.floor(pct * 5))}` };
    }),
  }));

  return {
    columns: metrics.map((m) => ({ key: m.key, label: m.label })),
    rows,
    hasRows: rows.length > 0,
  };
}
