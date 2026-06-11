/**
 * metrics.mjs — metric metadata: the §19 glossary's single source (M9.2).
 *
 * One registry entry per player-facing metric: a plain-language definition
 * (§19.2 layer 1) plus a SCALE built from the live tunables/config — never
 * hand-written formula text. The Help tab and the info affordance both render
 * from here; the "how it's calculated" layer comes from each result's
 * `components` at runtime (engine/explain.mjs → breakdownView), so nothing in
 * the documentation path can drift from the math (§19.3).
 *
 * Definitions are WHAT-IS prose only. Band thresholds, tier names and caps are
 * read from the tunables object passed in — change a dial, the glossary
 * reprints itself.
 *
 * Pure: data in, data out. Spec: SC-Module-Architecture-Guide.md §19, §4.1.
 */

import { FORMALITY_LABELS, VIBE_TAGS } from "../constants.mjs";

/**
 * Ascending [{key, label, min}] from a {bandKey: min} map + a floor band.
 * The same rows feed the glossary (label + min) AND the gauge partial (key →
 * band color class), so the picture and the printed scale share one source.
 */
function bandsFromMins(mins, floorKey, labelFor = (k) => k.toUpperCase()) {
  const rows = Object.entries(mins ?? {}).map(([k, min]) => ({ key: k, label: labelFor(k), min }));
  rows.push({ key: floorKey, label: labelFor(floorKey), min: 0 });
  rows.sort((a, b) => a.min - b.min);
  return rows;
}

/**
 * The registry. Each entry:
 *   key        — matches the data-metric key the info affordance carries
 *   label      — display name
 *   definition — one-line plain-language "what is this" (§19.2 layer 1)
 *   scale(tunables, config) — [{label, min}] thresholds from the live dials,
 *                or null when the metric has no banded scale
 *   chart      — which §25 visual carries it (documentation for the Help tab)
 */
export const METRICS = [
  {
    key: "styleRating",
    label: "Style Rating",
    definition: "How hard your whole look hits — clothing, chrome, fashionware and synergy rolled into one score, then tiered.",
    chart: "fingerprint + tier badge",
    scale: (T, config) =>
      Object.values(config?.ratings?.TIERS ?? {})
        .map((t) => ({ label: `${t.name} (${t.grade})`, min: t.min }))
        .sort((a, b) => a.min - b.min),
  },
  {
    key: "cohesion",
    label: "Cohesion",
    definition: "How much your outfit agrees with itself — the share of pieces speaking the same style.",
    chart: "percent + label",
    scale: (T) =>
      bandsFromMins(
        {
          mixed: T?.styleScoring?.cohesion?.mixed,
          coordinated: T?.styleScoring?.cohesion?.coordinated,
          signature: T?.styleScoring?.cohesion?.signature,
        },
        "chaotic"
      ),
  },
  {
    key: "heat",
    label: "Heat",
    definition: "How much unwanted attention you draw right now — weapons, visible chrome, armor, reputation and standing out from the room all feed it.",
    chart: "gauge",
    scale: (T) => bandsFromMins(T?.heat?.levels, "cold"),
  },
  {
    key: "danger",
    label: "Danger",
    definition: "How threatening you READ to an onlooker — not how dangerous you are. Visible weapons, chrome and wear-and-tear set it.",
    chart: "gauge",
    scale: (T) => bandsFromMins(T?.danger?.tiers, "low"),
  },
  {
    key: "styleMix",
    label: "Style Mix",
    definition: "The genres your equipped pieces speak, as shares of the whole — a dominant voice plus a tail, not a polygon.",
    chart: "fingerprint bar",
    scale: () => null,
  },
  {
    key: "archetype",
    label: "Reads As (Archetype)",
    definition: "Who Night City thinks you are — the best-matching street archetype, with runners-up and a confidence for each.",
    chart: "ranked confidence bars",
    scale: () => null,
  },
  {
    key: "vibes",
    label: "Vibe Profile",
    definition: "The TONE of your look across nine spokes (cool, cute, sexy, sleazy, menacing, flashy, elegant, rugged, scrappy). A shape with tradeoffs — never a score to maximize.",
    chart: "radar",
    scale: () => null,
  },
  {
    key: "disguise",
    label: "Disguise Confidence",
    definition: "How convincingly you pass as the target faction — style match, chrome tells, clashes and register all weigh in.",
    chart: "ring vs pass mark",
    scale: (T) => bandsFromMins(T?.disguise?.labels, "blown"),
  },
  {
    key: "formality",
    label: "Dress Register",
    definition: `Where the outfit sits on the formality ladder (${FORMALITY_LABELS.join(" → ")}). Venues gate on it; disguises can fail on register alone.`,
    chart: "register meter",
    scale: () => FORMALITY_LABELS.map((label, i) => ({ label, min: i })),
  },
  {
    key: "districtFit",
    label: "District Fit",
    definition: "How naturally your current outfit belongs on a district's streets, including its color palette.",
    chart: "fit meter",
    scale: () => null,
  },
  {
    key: "drip",
    label: "Drip",
    definition: "The raw eddies on your back — total wardrobe spend, worded.",
    chart: "badge",
    scale: () => null,
  },
  {
    key: "crewSynergy",
    label: "Crew Synergy",
    definition: "How well the crew's looks work TOGETHER — coherence, role coverage and internal clashes combined.",
    chart: "small-multiples",
    scale: () => null,
  },
  {
    key: "engagement",
    label: "Garden Engagement",
    definition: "How loudly the city's feeds talk about you — a function of heat, reputation and style. A flashy idol racks thousands; a grey man gets crickets.",
    chart: "sparkline",
    scale: () => null,
  },
];

/** Quick lookup — metricMeta("heat") → registry entry (or null). */
export function metricMeta(key) {
  return METRICS.find((m) => m.key === key) ?? null;
}

/**
 * One metric's live scale — [{key, label, min}] from the current dials. The
 * gauge partials consume this directly (band key → color class), so the dial
 * zones and the glossary always agree.
 */
export function metricScale(key, tunables, config = {}) {
  return metricMeta(key)?.scale(tunables, config) ?? null;
}

/**
 * Build the glossary: every metric with its definition and its CURRENT scale
 * (thresholds read live from tunables/config — §19.3, nothing hand-maintained).
 *
 * @param {object} tunables  getTunables() bundle
 * @param {object} [config]  engine config (ratings tiers etc.)
 * @returns [{ key, label, definition, chart, scale: [{label,min}]|null }]
 */
export function glossary(tunables, config = {}) {
  return METRICS.map((m) => ({
    key: m.key,
    label: m.label,
    definition: m.definition,
    chart: m.chart,
    scale: m.scale(tunables, config),
  }));
}

/** The nine canonical radar spokes, for Help-tab reference. */
export const GLOSSARY_VIBE_TAGS = VIBE_TAGS;
