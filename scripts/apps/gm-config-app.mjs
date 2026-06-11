/**
 * gm-config-app.mjs — GM Config & Tuning (M3/M5): no-code formula tuning + config
 * mgmt + the sc.* → flags migrator.
 *
 * Three tabs:
 *  · Tuning — a curated set of the most-used formula dials (§18.3) as number inputs.
 *    Save writes a SPARSE overlay (only knobs changed from default) to the TUNABLES
 *    setting; getTunables() deep-merges it over the defaults. Untouched knobs keep
 *    tracking future default changes. Full per-config form editors are later (M9).
 *  · Data — the style config blobs (districts, factions, …): reset-to-seed + export.
 *  · Migration — the scoped sc.* → styleData migrator (M5, §5.4 Migration 002):
 *    pick a scope (everything / world items / actor items / one folder / one actor),
 *    dry-run for a report, then convert. Conversion is non-destructive (AEs stay,
 *    flags win via D4 dual-read) and changes storage, never reads.
 *
 * Extends FormApplication so it can be a registerMenu target, but uses its own Save
 * flow (reads inputs by data-knob) rather than the submit pipeline — version-robust.
 *
 * Spec: SC-Module-Architecture-Guide.md §14.1, §14.2, §18.2, §18.5, §5.4, §6 M5
 */

import { MODULE_ID, SETTINGS } from "../constants.mjs";
import { DataStore } from "../data/data-store.mjs";
import { CONFIGS } from "../config/index.mjs";
import { TUNABLES_DEFAULTS, getTunables } from "../config/tunables.mjs";
import { migrateScItems, resolveScopeItems, summarizeReport } from "../data/migrations/002-sc-effects-to-flags.mjs";
import { NCSOA_DIALOG } from "./components/register.mjs";

// Curated dials. group → knobs[{path, label, step}]. path is a dot-path into tunables.
const TUNING_SCHEMA = [
  { group: "Heat", knobs: [
    { path: "heat.styleOutlierMultiplier", label: "Style outlier × " },
    { path: "heat.chrome.threshold", label: "Chrome heat starts at %" },
    { path: "heat.chrome.ratePerPct", label: "Chrome heat per % over", step: 0.1 },
    { path: "heat.coolPerPoint", label: "COOL reduces heat per point" },
    { path: "heat.levels.warm", label: "WARM threshold" },
    { path: "heat.levels.hot", label: "HOT threshold" },
    { path: "heat.levels.blazing", label: "BLAZING threshold" },
  ] },
  { group: "Danger", knobs: [
    { path: "danger.tiers.moderate", label: "MODERATE threshold" },
    { path: "danger.tiers.high", label: "HIGH threshold" },
    { path: "danger.tiers.extreme", label: "EXTREME threshold" },
    { path: "danger.coolMasking.threshold", label: "Composure masking needs COOL ≥" },
    { path: "danger.coolMasking.perPointOver5", label: "Masking per COOL over 5", step: 0.5 },
  ] },
  { group: "Disguise", knobs: [
    { path: "disguise.difficulty.floor", label: "Difficulty floor ×", step: 0.05 },
    { path: "disguise.difficulty.perLevel", label: "Difficulty per level", step: 0.05 },
    { path: "disguise.labels.convincing", label: "CONVINCING ≥" },
    { path: "disguise.labels.passable", label: "PASSABLE ≥" },
    { path: "disguise.labels.risky", label: "RISKY ≥" },
  ] },
  { group: "Crew", knobs: [
    { path: "crew.synergy.labels.tight", label: "TIGHT UNIT ≥" },
    { path: "crew.synergy.labels.legendary", label: "LEGENDARY ≥" },
    { path: "crew.danger.tiers.high", label: "Crew danger HIGH ≥" },
  ] },
  { group: "Scene", knobs: [
    { path: "scene.powerScore.repWeight", label: "Power: reputation weight" },
    { path: "scene.powerScore.coolWeight", label: "Power: COOL weight" },
  ] },
];

const getByPath = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
function setByPath(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof cur[keys[i]] !== "object" || cur[keys[i]] == null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

export class GMConfigApp extends FormApplication {
  constructor(options = {}) {
    super({}, options);
    this.currentTab = "tuning";
    this.migrationScope = "all";
    this.migrationReport = null;     // last dry-run/convert report
    this.migrationWasDryRun = true;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ncsoa-config",
      classes: ["ncsoa", "ncsoa-config"],
      template: `modules/${MODULE_ID}/templates/gm-config.hbs`,
      title: "Style Over All — Config & Tuning",
      width: 640,
      height: 720,
      resizable: true,
      closeOnSubmit: false,
      submitOnChange: false,
    });
  }

  getData() {
    const effective = getTunables();
    const groups = TUNING_SCHEMA.map((g) => ({
      group: g.group,
      knobs: g.knobs.map((k) => {
        const value = getByPath(effective, k.path);
        const def = getByPath(TUNABLES_DEFAULTS, k.path);
        return { path: k.path, label: k.label, step: k.step || 1, value, modified: value !== def, def };
      }),
    }));
    const overlay = this._overlay();
    const configs = CONFIGS.map((c) => ({ key: c.key, name: c.journal.replace(/^Style Checker - /, ""), schema: this._schemaOf(c.key) }));
    return {
      tabs: [
        { id: "tuning", label: "Tuning", icon: "fa-sliders", active: this.currentTab === "tuning" },
        { id: "data", label: "Config Data", icon: "fa-database", active: this.currentTab === "data" },
        { id: "migration", label: "Migration", icon: "fa-wand-magic-sparkles", active: this.currentTab === "migration" },
      ],
      tab: this.currentTab,
      isTuning: this.currentTab === "tuning",
      isData: this.currentTab === "data",
      isMigration: this.currentTab === "migration",
      groups,
      hasOverrides: Object.keys(overlay).length > 0,
      overrideCount: this._countLeaves(overlay),
      configs,
      migration: this._migrationContext(),
    };
  }

  // ── Migration tab (M5) ──────────────────────────────────────────────────────

  _migrationContext() {
    const folders = (game.folders?.contents ?? []).filter((f) => f.type === "Item");
    const actors = (game.actors?.contents ?? []).filter((a) => a.type === "character" || a.type === "mook");
    const scopes = [
      { key: "all", name: "Everything (world items + all actors)" },
      { key: "world", name: "World items only" },
      { key: "actors", name: "All actors' items" },
      ...folders.map((f) => ({ key: `folder:${f.id}`, name: `Item folder: ${f.name}` })),
      ...actors.map((a) => ({ key: `actor:${a.id}`, name: `Actor: ${a.name}` })),
    ];
    const r = this.migrationReport;
    return {
      scopes: scopes.map((s) => ({ ...s, selected: s.key === this.migrationScope })),
      report: r && {
        summary: summarizeReport(r),
        wasDryRun: this.migrationWasDryRun,
        converted: r.converted,
        conflicts: r.conflicts,
        empty: r.empty,
        errors: r.errors,
        hasConverted: r.converted.length > 0,
        hasConflicts: r.conflicts.length > 0,
        hasEmpty: r.empty.length > 0,
        hasErrors: r.errors.length > 0,
      },
    };
  }

  _resolveScope() {
    const s = this.migrationScope;
    if (s?.startsWith("folder:")) return { folderId: s.slice(7) };
    if (s?.startsWith("actor:")) return { actorId: s.slice(6) };
    return s;
  }

  async _runMigration(dryRun) {
    if (!dryRun) {
      const confirmed = await Dialog.confirm({
        options: NCSOA_DIALOG,
        title: "Convert sc.* effects to Style Data flags?",
        content:
          "<p>Writes a <strong>styleData</strong> flag onto every item in the chosen scope that has legacy <code>sc.*</code> effects. " +
          "The effects are left in place but ignored from then on (flags win). Reads do not change.</p>",
      });
      if (!confirmed) return;
    }
    const items = resolveScopeItems(this._resolveScope());
    this.migrationReport = await migrateScItems(items, { dryRun });
    this.migrationWasDryRun = dryRun;
    ui.notifications?.info(`Style Over All ${dryRun ? "(dry run)" : "migration"}: ${summarizeReport(this.migrationReport)}`);
    this.render(false);
  }

  _overlay() {
    try { return DataStore.get(SETTINGS.TUNABLES) || {}; } catch { return {}; }
  }
  _schemaOf(key) {
    try { return DataStore.getEnvelope(key)?.schema ?? 1; } catch { return 1; }
  }
  _countLeaves(obj) {
    let n = 0;
    for (const v of Object.values(obj)) n += v && typeof v === "object" && !Array.isArray(v) ? this._countLeaves(v) : 1;
    return n;
  }

  /** Required by FormApplication; our Save flow is manual (see activateListeners). */
  async _updateObject() {}

  async _saveTuning(html) {
    const overlay = {};
    html.find("[data-knob]").each((_, el) => {
      const path = el.dataset.knob;
      const def = getByPath(TUNABLES_DEFAULTS, path);
      const raw = el.value;
      if (raw === "" || raw == null) return;
      const num = Number(raw);
      if (Number.isNaN(num)) return;
      if (num !== def) setByPath(overlay, path, num); // store only real overrides
    });
    await DataStore.set(SETTINGS.TUNABLES, overlay);
    ui.notifications?.info(`Tuning saved — ${this._countLeaves(overlay)} override(s) active.`);
    this.render(false);
  }

  async _resetTuning() {
    await DataStore.set(SETTINGS.TUNABLES, {});
    ui.notifications?.info("Tuning reset to defaults.");
    this.render(false);
  }

  async _resetConfig(key) {
    const entry = CONFIGS.find((c) => c.key === key);
    if (!entry) return;
    const confirmed = await Dialog.confirm({
      options: NCSOA_DIALOG,
      title: "Reset config to seed?",
      content: `<p>Reset <strong>${entry.journal}</strong> to the bundled default? Any GM edits to it are lost.</p>`,
    });
    if (!confirmed) return;
    await DataStore.set(key, foundry.utils.deepClone(entry.seed), entry.schema);
    ui.notifications?.info(`${entry.journal} reset to seed.`);
    this.render(false);
  }

  _exportConfig(key) {
    const entry = CONFIGS.find((c) => c.key === key);
    const data = DataStore.getEnvelope(key);
    if (!entry || !data) return;
    saveDataToFile(JSON.stringify(data, null, 2), "application/json", `ncsoa-${key}.json`);
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-tab]").on("click", (e) => { this.currentTab = e.currentTarget.dataset.tab; this.render(false); });
    html.find("[data-action='save-tuning']").on("click", () => this._saveTuning(html));
    html.find("[data-action='reset-tuning']").on("click", () => this._resetTuning());
    html.find("[data-action='reset-config']").on("click", (e) => this._resetConfig(e.currentTarget.dataset.key));
    html.find("[data-action='export-config']").on("click", (e) => this._exportConfig(e.currentTarget.dataset.key));
    html.find("[data-control='migration-scope']").on("change", (e) => { this.migrationScope = e.currentTarget.value; });
    html.find("[data-action='migrate-dry']").on("click", () => this._runMigration(true));
    html.find("[data-action='migrate-run']").on("click", () => this._runMigration(false));
  }
}
