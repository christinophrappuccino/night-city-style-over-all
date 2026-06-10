/**
 * explain.mjs — the explainable-result contract for every engine function.
 *
 * The Explainability Rule (guide §4.1, §19): engine functions return explainable
 * results, not bare numbers:
 *
 *   { value, label, blurb, components: [{ term, value, source }], tunablesApplied }
 *
 * The UI renders breakdowns from `components`; the help system reads definitions
 * from the same metadata; a tunable change updates the number AND its explanation.
 * Baked in from the start — retrofitting onto bare numbers later is a rewrite.
 *
 * These helpers are pure and Foundry-free.
 *
 * Spec: SC-Module-Architecture-Guide.md §4.1, §19
 */

/**
 * @typedef {Object} Component
 * @property {string} term    human-readable name of this contribution
 * @property {number} value   its numeric contribution to the result
 * @property {string} [source] where it came from (item name, tunable key, axis…)
 */

/**
 * @typedef {Object} ExplainResult
 * @property {*}            value           the headline value (number, key, tier…)
 * @property {string}      label            short display label
 * @property {string}      blurb            one-line plain-language summary
 * @property {Component[]} components       additive/explanatory breakdown
 * @property {Object}      tunablesApplied  { tunableKey: valueUsed } — which dials fired
 */

/**
 * Build an explainable result. Always returns the full shape so consumers never
 * branch on missing fields.
 * @param {Partial<ExplainResult>} parts
 * @returns {ExplainResult}
 */
export function result({ value = null, label = "", blurb = "", components = [], tunablesApplied = {} } = {}) {
  return { value, label, blurb, components, tunablesApplied };
}

/** A single breakdown component. */
export function component(term, value, source = "") {
  return { term, value, source };
}

/** Sum the numeric `value` of a component list (helper for derived totals). */
export function sumComponents(components = []) {
  return components.reduce((acc, c) => acc + (Number(c?.value) || 0), 0);
}

/**
 * Merge several explainable results' components/tunables into one (e.g. when a
 * consequence draws on multiple sub-scores). Does not compute a new headline value.
 * @param {ExplainResult[]} results
 */
export function mergeExplain(results = []) {
  const components = [];
  const tunablesApplied = {};
  for (const r of results) {
    if (!r) continue;
    components.push(...(r.components ?? []));
    Object.assign(tunablesApplied, r.tunablesApplied ?? {});
  }
  return { components, tunablesApplied };
}
