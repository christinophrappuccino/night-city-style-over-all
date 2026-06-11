/**
 * gm-dashboard-app.mjs — the GM Dashboard (M3): scene-wide style intelligence.
 *
 * Five tabs (matching Phase 82): Party Readout · All-Scene Readout · Scene Gate ·
 * Disguise Detector · Faction Tensions. Renders from the engine via the scene-token
 * pipeline (services/style-reads → computeSceneTokens) plus the gate / disguise /
 * tension reads. No engine logic here — gathers the scene's tokens + config and
 * formats. GM-only launch (scene control).
 *
 * V1 Application by decision D2.
 * Spec: SC-Module-Architecture-Guide.md §6 (M3), §14.8, §16.5, §29.1, §4.1
 */

import { MODULE_ID } from "../constants.mjs";
import { evaluateGate } from "../engine/scene-gate.mjs";
import { scanFactionTensions } from "../engine/faction-tension.mjs";
import { confidence as disguiseConfidence, dc as disguiseDC, disguiseDetection, applyScModsToDisguise, applyUniformToDisguise } from "../engine/disguise.mjs";
import { matchSoftUniform } from "../engine/uniforms.mjs";
import { getUniforms, uniformForGroup } from "../services/uniforms.mjs";
import { computeSceneTokens } from "../services/style-reads.mjs";
import { getEngineConfig } from "../services/engine-config.mjs";
import { activeSceneStyle } from "../data/flags.mjs";
import { postGateVerdict } from "../services/chat-cards.mjs";
import { emitSocket, ownersOf, MESSAGE } from "../services/sockets.mjs";
import { recordPublicRead } from "../services/known-for.mjs";
import { addEventPost, eventPostFromTemplate } from "../services/garden.mjs";
import { heatmapView, ringView } from "./components/charts.mjs";
import { getTunables } from "../config/tunables.mjs";
import { getOverrides, setOverrides } from "../data/flags.mjs";
import { glossary } from "../engine/metrics.mjs";
import { humanize } from "../config/style-tab-schema.mjs";

const TABS = [
  { id: "readout", label: "Party", icon: "fa-th-list" },
  { id: "scene", label: "All Scene", icon: "fa-street-view" },
  { id: "gate", label: "Scene Gate", icon: "fa-door-open" },
  { id: "disguise", label: "Disguise", icon: "fa-mask" },
  { id: "tension", label: "Tensions", icon: "fa-bolt" },
  { id: "overrides", label: "Overrides", icon: "fa-thumbtack" },
  { id: "help", label: "Help", icon: "fa-circle-question" },
];

const HEAT_CLASS = { COLD: "cold", WARM: "warm", HOT: "hot", BLAZING: "blazing" };
const DEFAULT_PERCEPTION = 12;

export class GMDashboardApp extends Application {
  constructor(options = {}) {
    super(options);
    this.currentTab = options.tab || "readout";
    this.gateKey = null;
    this.disguiseFaction = null;
    this.perception = DEFAULT_PERCEPTION;
    this.districtKey = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ncsoa-gm",
      classes: ["ncsoa", "ncsoa-gm"],
      template: `modules/${MODULE_ID}/templates/gm-dashboard.hbs`,
      width: 820,
      height: 880,
      resizable: true,
      title: "Style Checker — GM Dashboard",
    });
  }

  /** Session singleton — every open() reuses ONE instance. A fresh instance per
   *  click would (a) reset the gate/faction/district/perception selections on every
   *  reopen and (b) render a second copy into the same DOM id while the first is
   *  open, leaving a stale instance behind. Selections persist until reload. */
  static _instance = null;

  static open(tab) {
    const app = (this._instance ??= new GMDashboardApp());
    if (tab) app.currentTab = tab;
    app.render(true);
    if (app.rendered) app.bringToTop();
    return app;
  }

  /** Unique actors behind the placed tokens. */
  _sceneActors() {
    const placed = canvas?.tokens?.placeables ?? [];
    const seen = new Map();
    for (const t of placed) if (t.actor && !seen.has(t.actor.id)) seen.set(t.actor.id, t.actor);
    return [...seen.values()];
  }

  getData() {
    const tabs = TABS.map((t) => ({ ...t, active: t.id === this.currentTab }));
    const base = { tabs, tab: this.currentTab };

    try {
      const config = getEngineConfig();
      const tokens = computeSceneTokens(this._sceneActors(), config);
      const pcs = tokens.filter((t) => t.isPC);
      const npcs = tokens.filter((t) => !t.isPC);
      base.counts = { pcs: pcs.length, npcs: npcs.length, total: tokens.length };

      // Help works with an empty scene; everything else needs tokens.
      if (this.currentTab === "help") {
        return { ...base, isHelp: true, glossary: { entries: glossary(getTunables(), config) } };
      }
      if (tokens.length === 0) return { ...base, empty: true };

      switch (this.currentTab) {
        case "overrides": return { ...base, isOverrides: true, overrides: this._overridesData(tokens, config) };
        // §25.1 heatmap (M9.2): characters × metrics, color-coded with the
        // number always inside the cell — the crowded-scene view at one look.
        case "scene": return { ...base, isScene: true, heatmap: heatmapView(tokens), rows: tokens.map((t) => this._row(t)) };
        case "gate": return { ...base, isGate: true, gate: this._gateData(tokens, config) };
        case "disguise": return { ...base, isDisguise: true, disguise: this._disguiseData(pcs, config) };
        case "tension": return { ...base, isTension: true, tension: this._tensionData(tokens, config) };
        default: return { ...base, isReadout: true, rows: pcs.map((t) => this._row(t)) };
      }
    } catch (e) {
      console.error("Night City: Style Over All | GM Dashboard compute failed:", e);
      return { ...base, error: true };
    }
  }

  // ── shapers ────────────────────────────────────────────────────────────────

  _row(t) {
    return {
      name: t.name, img: t.img, isPC: t.isPC,
      style: t.styleScore, tier: t.tier?.name, grade: t.tier?.grade,
      // §14.3: a pinned value is clearly flagged wherever it surfaces.
      heat: { value: t.heat.value, cls: HEAT_CLASS[t.heat.level] || "cold", manual: !!t.heat.overridden },
      danger: { value: t.danger.value, color: t.danger.color },
      arch: t.topArch?.label || "—",
      archManual: !!t.topArch?.pinned,
      drip: t.drip?.rating,
    };
  }

  /** §14.3 — the per-actor read-pin editor (writes the actor's OVERRIDES flag). */
  _overridesData(tokens, config) {
    const archetypeDefs = config.factions.FACTION_ARCHETYPES ?? {};
    const archOptions = Object.entries(archetypeDefs).map(([key, a]) => ({ key, label: a.label || humanize(key) }));
    const tierOptions = Object.keys(getTunables().brand?.tierCost ?? {}).map((key) => ({ key, label: humanize(key) }));
    const rows = tokens.map((t) => {
      const actor = game.actors?.get(t.actorId);
      const o = actor ? getOverrides(actor) ?? {} : {};
      return {
        actorId: t.actorId, name: t.name, img: t.img, isPC: t.isPC,
        computed: { arch: t.topArch?.label || "—", heat: t.heat.value },
        any: Object.keys(o).length > 0,
        archetype: o.archetype ?? "",
        archOptions: archOptions.map((a) => ({ ...a, selected: a.key === o.archetype })),
        heatMode: o.heat?.mode ?? "",
        heatValue: o.heat?.value ?? 0,
        disguise: o.disguise ?? "",
        brandTier: o.brandTier ?? "",
        tierOptions: tierOptions.map((tr) => ({ ...tr, selected: tr.key === o.brandTier })),
      };
    });
    return { rows };
  }

  /** Write one actor's override record from its editor row's controls. */
  async _writeOverrides(actorId, rowEl) {
    const actor = game.actors?.get(actorId);
    if (!actor) return;
    const $row = $(rowEl);
    const val = (name) => $row.find(`[data-override='${name}']`).val();
    const o = {};
    if (val("archetype")) o.archetype = val("archetype");
    const heatMode = val("heat-mode");
    if (heatMode === "offset" || heatMode === "force") o.heat = { mode: heatMode, value: Number(val("heat-value")) || 0 };
    if (val("disguise")) o.disguise = val("disguise");
    if (val("brand-tier")) o.brandTier = val("brand-tier");
    await setOverrides(actor, o);
    this.render(false);
  }

  _gateData(tokens, config) {
    const gates = config.sceneGates?.gates || {};
    const keys = Object.keys(gates);
    // Auto-arm (§14.8): the active scene's tagged gate is the default selection.
    const armed = activeSceneStyle().gate;
    const selected =
      (this.gateKey && gates[this.gateKey] ? this.gateKey : null) ??
      (armed && gates[armed] ? armed : null) ??
      keys[0];
    const gate = gates[selected];
    const factions = config.factions.FACTIONS;
    const results = tokens.map((t) => {
      const { status, issues } = evaluateGate({ tokenData: t, criteria: gate.criteria, factions });
      return { name: t.name, img: t.img, isPC: t.isPC, status, issues };
    });
    return {
      options: keys.map((k) => ({ key: k, name: gates[k].name, selected: k === selected })),
      selectedName: gate.name,
      description: gate.description,
      notes: gate.criteria.notes,
      results,
    };
  }

  _disguiseData(pcs, config) {
    const factions = config.factions.FACTIONS;
    const archetypes = config.factions.FACTION_ARCHETYPES;
    const keys = Object.keys(factions);
    const selected = this.disguiseFaction && factions[this.disguiseFaction] ? this.disguiseFaction : keys[0];
    const target = factions[selected];
    const perception = Number(this.perception) || 0;

    // The target group's registered uniform, if any — wearing it IS a disguise (§21.2).
    const targetUniform = uniformForGroup(getUniforms(), selected);

    const results = pcs.map((t) => {
      const conf = disguiseConfidence({ collected: t.collected, cyberwareData: t.cyberwareData, targetFactionKey: selected, factions, archetypes });
      const dcCalc = disguiseDC(conf.confidence, t.socialStats);
      // sc.faction.<target> / sc.disguise.dc gear injections (macro §9892–9907, M5).
      const inj = applyScModsToDisguise({
        confidence: conf.confidence, label: conf.label, dcTarget: dcCalc.dc,
        scMods: t.scMods, targetFactionKey: selected,
      });
      // Soft-uniform recognition bonus (M6.5).
      const uniformMatch = targetUniform?.soft
        ? matchSoftUniform({ collected: t.collected, cyberwareData: t.cyberwareData, scMods: t.scMods, signature: targetUniform.soft })
        : null;
      const uni = applyUniformToDisguise({ confidence: inj.confidence, label: inj.label, uniformMatch });
      const familiar = target?.archetype === t.topArch.key;
      const det = disguiseDetection({ dcTarget: inj.dcTarget, viewerPerception: perception, isFamiliarFaction: familiar });
      // §14.3 GM pin: the verdict is the GM's call regardless of the math.
      const forced = t.overrides?.disguise ?? null;
      // §25.1 ring (M9.2): confidence vs the PASSABLE mark from the live dials.
      const ring = ringView({
        value: Math.round(uni.confidence), threshold: getTunables().disguise.labels.passable,
        label: uni.label, size: 64,
      });
      return {
        name: t.name, img: t.img, readsAs: t.topArch?.label, ring,
        confidence: uni.confidence, label: uni.label, forced: !!forced,
        dc: inj.dcTarget, detected: forced ? forced === "blown" : det.detected,
        margin: forced ? null : det.margin, familiar,
        gearDisguise: inj.applied,
        uniform: uni.applied ? { grade: uni.grade, bonus: uni.uniformBonus, name: targetUniform.name } : null,
      };
    });
    return {
      options: keys.map((k) => ({ key: k, name: factions[k].label || k, selected: k === selected })),
      selectedName: target?.label || selected,
      perception,
      results,
    };
  }

  _tensionData(tokens, config) {
    const districts = config.districts || {};
    const keys = Object.keys(districts);
    // Scene → district (§14.8): the active scene's tag is the default context.
    const tagged = activeSceneStyle().district;
    const selected =
      (this.districtKey && districts[this.districtKey] ? this.districtKey : null) ??
      (tagged && districts[tagged] ? tagged : null);
    const scan = scanFactionTensions({
      tokens,
      district: selected ? districts[selected] : null,
      factions: config.factions.FACTIONS,
      roleProfiles: config.factions.ROLE_PROFILES,
    });
    return {
      options: [{ key: "", name: "— No District —", selected: !selected }, ...keys.map((k) => ({ key: k, name: districts[k].name || k, selected: k === selected }))],
      districtName: scan.district,
      tensions: scan.tensions,
      warnings: scan.warnings,
      clear: scan.tensions.length === 0 && scan.warnings.length === 0,
    };
  }

  /**
   * Run the armed gate (M7.5 — the milestone's "done when"): every PC at the
   * door gets their verdict as a whispered chat card + a live socket ping. The
   * GM keeps the dashboard summary.
   */
  async _runGate() {
    if (!game.user?.isGM) return;
    try {
      const config = getEngineConfig();
      const gates = config.sceneGates?.gates || {};
      const armed = activeSceneStyle().gate;
      const selected =
        (this.gateKey && gates[this.gateKey] ? this.gateKey : null) ??
        (armed && gates[armed] ? armed : null) ??
        Object.keys(gates)[0];
      const gate = gates[selected];
      if (!gate) { ui.notifications?.warn("No scene gate configured."); return; }

      const pcs = computeSceneTokens(this._sceneActors(), config).filter((t) => t.isPC);
      if (!pcs.length) { ui.notifications?.warn("No PC tokens on the canvas to judge."); return; }

      const tally = { green: 0, yellow: 0, red: 0 };
      for (const t of pcs) {
        const actor = game.actors?.get(t.actorId);
        if (!actor) continue;
        const verdict = evaluateGate({ tokenData: t, criteria: gate.criteria, factions: config.factions.FACTIONS });
        tally[verdict.status] = (tally[verdict.status] ?? 0) + 1;
        await postGateVerdict({ actor, gateName: gate.name, gateNotes: gate.criteria?.notes, verdict });
        emitSocket(MESSAGE.GATE_VERDICT, {
          actorName: actor.name, gateName: gate.name, status: verdict.status,
        }, { targetUserIds: ownersOf(actor) });
        // Getting judged at the door is a PUBLIC read (§16.6 Known For)…
        if (t.topArch?.key) await recordPublicRead(actor, { key: t.topArch.key, label: t.topArch.label });
        // …and door drama makes the feed (§21.4 — the Garden reacts to play).
        if (verdict.status !== "yellow") {
          const post = eventPostFromTemplate(verdict.status === "red" ? "gateRed" : "gateGreen", { name: actor.name, gate: gate.name });
          if (post) await addEventPost(post);
        }
      }
      ui.notifications?.info(
        `${gate.name}: ${tally.green} cleared · ${tally.yellow} flagged · ${tally.red} turned away — verdicts delivered.`
      );
    } catch (e) {
      console.error("Night City: Style Over All | gate run failed:", e);
      ui.notifications?.error("Gate run failed — see console.");
    }
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='run-gate']").on("click", () => this._runGate());
    html.find("[data-tab]").on("click", (e) => { this.currentTab = e.currentTarget.dataset.tab; this.render(false); });
    html.find("[data-control='gate']").on("change", (e) => { this.gateKey = e.currentTarget.value; this.render(false); });
    html.find("[data-control='faction']").on("change", (e) => { this.disguiseFaction = e.currentTarget.value; this.render(false); });
    html.find("[data-control='district']").on("change", (e) => { this.districtKey = e.currentTarget.value || null; this.render(false); });
    html.find("[data-control='perception']").on("change", (e) => { this.perception = e.currentTarget.value; this.render(false); });
    // §14.3 — every control in an override row writes that actor's full record.
    html.find("[data-override]").on("change", (e) => {
      const row = e.currentTarget.closest("[data-override-actor]");
      if (row) this._writeOverrides(row.dataset.overrideActor, row);
    });
    html.find("[data-action='clear-overrides']").on("click", async (e) => {
      const actor = game.actors?.get(e.currentTarget.dataset.actor);
      if (actor) { await setOverrides(actor, {}); this.render(false); }
    });
  }
}
