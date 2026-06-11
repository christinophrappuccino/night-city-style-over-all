/**
 * register.mjs — the chart library's Foundry seam (M9.2).
 *
 * The ONLY Foundry-touching file in apps/components/: registers the §25/§19
 * partials under stable names and binds the §19.4 info affordance (tap →
 * definition + live breakdown in a Dialog — works on touch, not hover-only).
 * The view-model builders (charts.mjs, breakdown.mjs) stay pure; apps call
 * those in getData() and stamp `{{> ncsoa-radar radar}}` in their templates.
 *
 * Spec: SC-Module-Architecture-Guide.md §25, §19.4, §4.1 (Layer Rule).
 */

import { MODULE_ID } from "../../constants.mjs";
import { breakdownView } from "./breakdown.mjs";
import { metricMeta } from "../../engine/metrics.mjs";

const P = (name) => `modules/${MODULE_ID}/templates/partials/${name}.hbs`;

/**
 * Options for every Dialog the module spawns: the ncsoa class rides the dialog
 * window, so the base.css form-control skin + dark canvas apply instead of
 * Foundry's parchment defaults. Pass as Dialog.confirm/prompt's `options` key
 * (or new Dialog's second argument).
 */
export const NCSOA_DIALOG = { classes: ["dialog", "ncsoa"] };

/** Partial name → template path. Names are the public vocabulary apps use. */
export const PARTIALS = {
  "ncsoa-radar": P("radar"),
  "ncsoa-gauge": P("gauge"),
  "ncsoa-ring": P("ring"),
  "ncsoa-fingerprint": P("fingerprint"),
  "ncsoa-sparkline": P("sparkline"),
  "ncsoa-heatmap": P("heatmap"),
  "ncsoa-breakdown": P("breakdown"),
  "ncsoa-info": P("info-affordance"),
  "ncsoa-glossary": P("help-glossary"),
};

/**
 * Load + name the shared partials. Call once at init; loadTemplates' object
 * form registers each compiled template under its key as a Handlebars partial.
 * @returns {Promise} resolves when every partial is compiled
 */
export function registerChartPartials() {
  return loadTemplates(PARTIALS);
}

/**
 * Bind every info affordance in an app's rendered HTML (§19.4). Call from
 * activateListeners. Clicking ? opens the metric's plain-language definition
 * (engine/metrics.mjs) + its LIVE breakdown rendered from the explainable
 * result the app computed this render — one rendering path, no restated math.
 *
 * @param {jQuery} html  the app's rendered root
 * @param {(metricKey:string)=>object|null} resolveResult  metricKey → the
 *   explainable engine result currently on screen (null = definition only)
 */
export function bindInfoAffordances(html, resolveResult) {
  html.find("[data-action='ncsoa-info']").on("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const key = e.currentTarget.dataset.metric;
    const meta = metricMeta(key);
    const result = resolveResult?.(key) ?? null;

    const parts = [];
    if (meta) parts.push(`<p class="ncsoa-bd-blurb"><strong>${meta.label}</strong> — ${meta.definition}</p>`);
    if (result) parts.push(await renderTemplate(PARTIALS["ncsoa-breakdown"], breakdownView(result)));
    if (!parts.length) parts.push(`<p class="ncsoa-chart-empty">No definition registered for "${key}".</p>`);

    new Dialog(
      {
        title: meta?.label ? `${meta.label} — how it's calculated` : "How it's calculated",
        content: `<div class="ncsoa ncsoa-info-dialog">${parts.join("")}</div>`,
        buttons: { close: { icon: '<i class="fas fa-check"></i>', label: "Got it" } },
        default: "close",
      },
      NCSOA_DIALOG
    ).render(true);
  });
}
