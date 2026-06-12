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
import { SCORING_PRESETS, getPreset, matchPreset, flattenTunables, mergeKnobEdits, countLeaves, getByPath as presetGetByPath } from "../config/presets.mjs";
import { migrateScItems, resolveScopeItems, summarizeReport } from "../data/migrations/002-sc-effects-to-flags.mjs";
import { NCSOA_DIALOG } from "./components/register.mjs";
import { getEngineConfig } from "../services/engine-config.mjs";
import { rivalryPairs, areRivals, setRivalry } from "../services/faction-matrix.mjs";
import { glossary } from "../engine/metrics.mjs";

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
    this.tuningView = "common";      // M9.4a — "common" (curated) | "full" (every dial)
    this.tuningSearch = "";          // full-view path filter (DOM, keeps focus)
    this.presetPick = null;          // the preset selected in the bar (not yet applied)
    this.migrationScope = "all";
    this.migrationReport = null;     // last dry-run/convert report
    this.migrationWasDryRun = true;
    this.matrixFaction = null;       // §14.7 — the faction whose rivals are being edited
    this.matrixSearch = "";
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
    const groups =
      this.tuningView === "full" ? this._fullGroups(effective) : this._commonGroups(effective);
    const overlay = this._overlay();
    const configs = CONFIGS.map((c) => ({ key: c.key, name: c.journal.replace(/^Style Checker - /, ""), schema: this._schemaOf(c.key) }));
    return {
      tabs: [
        { id: "tuning", label: "Tuning", icon: "fa-sliders", active: this.currentTab === "tuning" },
        { id: "data", label: "Config Data", icon: "fa-database", active: this.currentTab === "data" },
        { id: "factions", label: "Factions", icon: "fa-handshake-slash", active: this.currentTab === "factions" },
        { id: "migration", label: "Migration", icon: "fa-wand-magic-sparkles", active: this.currentTab === "migration" },
        { id: "help", label: "Help", icon: "fa-circle-question", active: this.currentTab === "help" },
      ],
      tab: this.currentTab,
      isTuning: this.currentTab === "tuning",
      isData: this.currentTab === "data",
      isFactions: this.currentTab === "factions",
      isMigration: this.currentTab === "migration",
      isHelp: this.currentTab === "help",
      groups,
      hasOverrides: Object.keys(overlay).length > 0,
      overrideCount: this._countLeaves(overlay),
      tuning: this.currentTab === "tuning" ? this._tuningContext(overlay) : null,
      configs,
      migration: this._migrationContext(),
      matrix: this.currentTab === "factions" ? this._matrixData() : null,
      glossary: this.currentTab === "help" ? { entries: glossary(getTunables(), getEngineConfig()) } : null,
    };
  }

  // ── Tuning Panel (M9.4a: §18.2 tier 2 full coverage + §18.4 D6=B presets) ───

  /** The curated everyday dials (the M3 schema, unchanged). */
  _commonGroups(effective) {
    return TUNING_SCHEMA.map((g) => ({
      group: g.group,
      knobs: g.knobs.map((k) => {
        const value = getByPath(effective, k.path);
        const def = getByPath(TUNABLES_DEFAULTS, k.path);
        return { path: k.path, label: k.label, step: k.step || 1, value, modified: value !== def, def };
      }),
    }));
  }

  /** EVERY numeric dial, auto-generated from the defaults tree (§18.3 full inventory). */
  _fullGroups(effective) {
    const byGroup = new Map();
    for (const { path } of flattenTunables(TUNABLES_DEFAULTS)) {
      const group = path.split(".")[0];
      const def = presetGetByPath(TUNABLES_DEFAULTS, path);
      const value = presetGetByPath(effective, path);
      if (!byGroup.has(group)) byGroup.set(group, []);
      byGroup.get(group).push({
        path,
        label: path.slice(group.length + 1),
        labelLower: path.toLowerCase(),
        step: Number.isInteger(def) ? 1 : 0.05,
        value,
        def,
        modified: value !== def,
      });
    }
    return [...byGroup.entries()].map(([group, knobs]) => ({ group, knobs, full: true }));
  }

  /** Preset bar context: derived active preset, pick, blurb. */
  _tuningContext(overlay) {
    const activeKey = matchPreset(overlay);
    const pick = this.presetPick ?? activeKey ?? "phase82";
    const picked = getPreset(pick);
    return {
      viewFull: this.tuningView === "full",
      search: this.tuningSearch,
      activeKey,
      isCustom: activeKey === null,
      presets: SCORING_PRESETS.map((p) => ({
        key: p.key,
        label: p.label,
        selected: p.key === pick,
        active: p.key === activeKey,
      })),
      pickBlurb: picked?.blurb ?? "",
      pickIsActive: pick === activeKey,
    };
  }

  /** Apply a scoring preset: its overlay REPLACES the GM's tunables overlay. */
  async _applyPreset(key) {
    const preset = getPreset(key);
    if (!preset) return;
    const confirmed = await Dialog.confirm({
      options: NCSOA_DIALOG,
      title: `Apply "${preset.label}"?`,
      content: `<p><strong>${preset.label}</strong> — ${preset.blurb}</p><p>This replaces your current tuning overrides (${this._countLeaves(this._overlay())} active). Edit any dial afterwards to fork it into a custom philosophy.</p>`,
    });
    if (!confirmed) return;
    await DataStore.set(SETTINGS.TUNABLES, foundry.utils.deepClone(preset.overlay));
    this.presetPick = null;
    ui.notifications?.info(`Scoring preset applied: ${preset.label}.`);
    this.render(false);
  }

  // ── Faction matrix (§14.7, M9.3e) ───────────────────────────────────────────

  /** The LIVE factions map (setting-backed, seed fallback). */
  _factions() {
    return getEngineConfig().factions?.FACTIONS ?? {};
  }

  _matrixData() {
    const factions = this._factions();
    const keys = Object.keys(factions).sort((a, b) =>
      (factions[a].label || a).localeCompare(factions[b].label || b)
    );
    const selected = this.matrixFaction && factions[this.matrixFaction] ? this.matrixFaction : keys[0];
    const pairs = rivalryPairs(factions);
    return {
      pairs,
      pairCount: pairs.length,
      options: keys.map((k) => ({ key: k, label: factions[k].label || k, selected: k === selected })),
      selectedKey: selected,
      selectedLabel: factions[selected]?.label || selected,
      search: this.matrixSearch,
      rivals: keys
        .filter((k) => k !== selected)
        .map((k) => ({
          key: k,
          label: factions[k].label || k,
          labelLower: (factions[k].label || k).toLowerCase(),
          rival: areRivals(factions, selected, k),
        })),
    };
  }

  /** Toggle one rivalry pair symmetrically and persist the factions blob. */
  async _toggleRivalry(aKey, bKey, on) {
    const entry = CONFIGS.find((c) => c.key === SETTINGS.CONFIG_FACTIONS);
    const blob = foundry.utils.deepClone(getEngineConfig().factions);
    blob.FACTIONS = setRivalry(blob.FACTIONS, aKey, bKey, on);
    await DataStore.set(SETTINGS.CONFIG_FACTIONS, blob, entry?.schema);
    this.render(false);
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
    // MERGE the rendered knobs into the existing overlay — never rebuild from
    // the view. The Common view renders a curated handful; a preset writes a
    // wide overlay; rebuilding would silently wipe every unrendered override.
    const edits = [];
    html.find("[data-knob]").each((_, el) => {
      const raw = el.value;
      if (raw === "" || raw == null) return;
      const num = Number(raw);
      if (!Number.isNaN(num)) edits.push({ path: el.dataset.knob, value: num });
    });
    const overlay = mergeKnobEdits(this._overlay(), edits, TUNABLES_DEFAULTS);
    await DataStore.set(SETTINGS.TUNABLES, overlay);
    ui.notifications?.info(`Tuning saved — ${countLeaves(overlay)} override(s) active.`);
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

    // M9.4a — preset bar + the Common/Full view switch + the full-view filter.
    html.find("[data-control='preset-pick']").on("change", (e) => {
      this.presetPick = e.currentTarget.value;
      this.render(false);
    });
    html.find("[data-action='apply-preset']").on("click", (e) => this._applyPreset(e.currentTarget.dataset.preset));
    html.find("[data-action='tuning-view']").on("click", (e) => {
      this.tuningView = e.currentTarget.dataset.view;
      this.render(false);
    });
    const applyKnobSearch = (term) => {
      this.tuningSearch = term;
      const q = term.trim().toLowerCase();
      html.find("[data-knob-path]").each((_, el) => {
        el.style.display = !q || el.dataset.knobPath.includes(q) ? "" : "none";
      });
      // hide groups left with no visible knobs
      html.find("[data-knob-group]").each((_, el) => {
        const any = Array.from(el.querySelectorAll("[data-knob-path]")).some((k) => k.style.display !== "none");
        el.style.display = any ? "" : "none";
      });
    };
    html.find("[data-control='knob-search']").on("input", (e) => applyKnobSearch(e.currentTarget.value));
    if (this.tuningView === "full" && this.tuningSearch) applyKnobSearch(this.tuningSearch);
    html.find("[data-action='reset-config']").on("click", (e) => this._resetConfig(e.currentTarget.dataset.key));
    html.find("[data-action='export-config']").on("click", (e) => this._exportConfig(e.currentTarget.dataset.key));
    html.find("[data-control='migration-scope']").on("change", (e) => { this.migrationScope = e.currentTarget.value; });
    html.find("[data-action='migrate-dry']").on("click", () => this._runMigration(true));
    html.find("[data-action='migrate-run']").on("click", () => this._runMigration(false));

    // §14.7 faction matrix.
    html.find("[data-control='matrix-faction']").on("change", (e) => {
      this.matrixFaction = e.currentTarget.value;
      this.render(false);
    });
    html.find("[data-rival]").on("change", (e) => {
      this._toggleRivalry(e.currentTarget.dataset.faction, e.currentTarget.dataset.rival, e.currentTarget.checked);
    });
    html.find("[data-action='unpair']").on("click", (e) => {
      this._toggleRivalry(e.currentTarget.dataset.a, e.currentTarget.dataset.b, false);
    });
    // Rival list search: DOM filter (no re-render → the input keeps focus).
    const applyMatrixSearch = (term) => {
      this.matrixSearch = term;
      const q = term.trim().toLowerCase();
      html.find("[data-rival-name]").each((_, el) => {
        el.style.display = !q || el.dataset.rivalName.includes(q) ? "" : "none";
      });
    };
    html.find("[data-control='matrix-search']").on("input", (e) => applyMatrixSearch(e.currentTarget.value));
    if (this.matrixSearch) applyMatrixSearch(this.matrixSearch);
  }
}
