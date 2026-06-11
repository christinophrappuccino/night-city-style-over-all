/**
 * breakdown.mjs — the §19 breakdown renderer's view model (M9.2).
 *
 * Turns any explainable engine result ({ value, label, blurb, components,
 * tunablesApplied } — engine/explain.mjs) into rows the shared breakdown partial
 * stamps out. This is THE one rendering path for "how it's calculated" — no app
 * writes its own breakdown markup, and no formula text is restated by hand
 * (§19.3: the components ARE the math, so the printout can't drift from it).
 *
 * PURE: no game.*, no DOM. Spec: SC-Module-Architecture-Guide.md §19, §4.1.
 */

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

/** Compact display for a tunable value (numbers plain, objects inlined). */
function tunableDisplay(v) {
  if (isNum(v)) return String(v);
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(tunableDisplay).join(", ");
  if (v && typeof v === "object") {
    return Object.entries(v)
      .map(([k, x]) => `${k} ${tunableDisplay(x)}`)
      .join(" · ");
  }
  return String(v);
}

/**
 * Build the breakdown view for one explainable result.
 *
 * @param {object} result  an engine ExplainResult (missing fields tolerated)
 * @param {object} [opts]
 * @param {boolean} [opts.showZero]  keep zero-valued components (default drop)
 * @param {boolean} [opts.total]     show a Σ row (default: when ≥2 numeric rows)
 * @returns view model for templates/partials/breakdown.hbs
 */
export function breakdownView(result = {}, opts = {}) {
  const { showZero = false } = opts;

  const rows = (result.components ?? [])
    .filter((c) => c && (showZero || !isNum(c.value) || c.value !== 0))
    .map((c) => ({
      term: c.term ?? "",
      source: c.source ?? "",
      numeric: isNum(c.value),
      display: isNum(c.value) ? (c.value > 0 ? `+${c.value}` : `${c.value}`) : String(c.value ?? ""),
      cls: !isNum(c.value) ? "note" : c.value > 0 ? "pos" : c.value < 0 ? "neg" : "zero",
    }));

  const numeric = rows.filter((r) => r.numeric);
  const wantTotal = opts.total ?? numeric.length >= 2;
  const sum = (result.components ?? []).reduce((acc, c) => acc + (isNum(c?.value) ? c.value : 0), 0);

  const tunables = Object.entries(result.tunablesApplied ?? {}).map(([key, value]) => ({
    key,
    display: tunableDisplay(value),
  }));

  return {
    label: result.label ?? "",
    blurb: result.blurb ?? "",
    value: result.value,
    rows,
    hasRows: rows.length > 0,
    total: wantTotal ? { display: sum > 0 ? `+${Math.round(sum * 100) / 100}` : `${Math.round(sum * 100) / 100}` } : null,
    tunables,
    hasTunables: tunables.length > 0,
  };
}
