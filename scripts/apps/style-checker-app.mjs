/**
 * style-checker-app.mjs — the player-facing Style Checker (M3): the macro replacement.
 *
 * Five tabs (matching Phase 82): Profile · Chrome · Gear & Optimization · Crew · Social.
 * Renders entirely from the engine via the pipeline spine (services/style-reads) plus
 * the crew / recommendations / district reads. No engine logic here — this is the
 * Integration+Application layer that gathers context (the actor, the room/party, config)
 * and formats engine output for the template.
 *
 * V1 Application by decision D2 (V13 AppV2 migration isolated to apps/, M9). Social is
 * a stub until The Garden (M7).
 *
 * Spec: SC-Module-Architecture-Guide.md §6 (M3), §19, §29.1, §4.1 (Layer Rule)
 */

import { MODULE_ID } from "../constants.mjs";
import { CLOTHING_SLOTS } from "../engine/collect.mjs";
import { formatStyleName } from "../engine/recommendations.mjs";
import { optimizeBudget } from "../engine/recommendations.mjs";
import { districtStyleFit } from "../engine/districts.mjs";
import { districtPaletteFit } from "../engine/colors.mjs";
import { getTunables } from "../config/tunables.mjs";
import * as cpr from "../data/cpr-adapter.mjs";
import { analyzeCrew } from "../engine/crew.mjs";
import { computeActorReads, buildCrewMemberInput } from "../services/style-reads.mjs";
import { getEngineConfig } from "../services/engine-config.mjs";
import { buildGardenView, addEventPost } from "../services/garden.mjs";
import { radarView, gaugeView, fingerprintView, sparklineView, ringView } from "./components/charts.mjs";
import { bindInfoAffordances, NCSOA_DIALOG } from "./components/register.mjs";
import { glossary, metricScale } from "../engine/metrics.mjs";
import { composeHeadline } from "../engine/headline.mjs";
import { observerOptions, resolveObserver, applyObserverLens } from "../services/observers.mjs";
import { getKnownFor } from "../services/known-for.mjs";

const TABS = [
  { id: "profile", label: "Style Profile", icon: "fa-id-card" },
  { id: "chrome", label: "Chrome", icon: "fa-microchip" },
  { id: "gear", label: "Gear & Optimization", icon: "fa-tshirt" },
  { id: "crew", label: "Crew", icon: "fa-users-cog" },
  { id: "social", label: "Social", icon: "fa-users" },
  { id: "help", label: "Help", icon: "fa-circle-question" },
];

const SLOT_LABELS = {
  top: "Top", bottoms: "Bottoms", jacket: "Jacket", footwear: "Footwear", hats: "Hat",
  glasses: "Glasses", mirrorshades: "Mirrorshades", contactLenses: "Contacts", jewelry: "Jewelry",
};
const CHROME_LABELS = {
  visible_chrome: "Visible Chrome", hidden_chrome: "Hidden Chrome", fashionware: "Fashionware",
  bioware: "Bioware", borgware: "Borgware", uncategorized: "Other", none: "None",
};
const CHROME_CATS = ["visible_chrome", "hidden_chrome", "fashionware", "bioware", "borgware"];
const HEAT_CLASS = { COLD: "cold", WARM: "warm", HOT: "hot", BLAZING: "blazing" };
const DEFAULT_BUDGET = 1000;

export class StyleCheckerApp extends Application {
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this.currentTab = options.tab || "profile";
    // §24 lens state: which view leads ("self" | "observed") and who's looking.
    this.lens = "self";
    this.observerSel = "street";
    this.options.id = `ncsoa-sc-${actor?.id ?? "none"}`;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ncsoa-sc",
      classes: ["ncsoa", "ncsoa-sc"],
      template: `modules/${MODULE_ID}/templates/style-checker.hbs`,
      width: 720,
      height: 840,
      resizable: true,
      title: "Style Checker",
    });
  }

  get title() {
    return `Style Checker — ${this.actor?.name ?? "Unknown"}`;
  }

  static openForActor(actor, tab) {
    if (!actor) return null;
    return new StyleCheckerApp(actor, tab ? { tab } : {}).render(true);
  }

  /** Unique actors behind the placed tokens (multiple tokens → one actor). */
  _party() {
    const placed = canvas?.tokens?.placeables ?? [];
    const seen = new Map();
    for (const t of placed) if (t.actor && !seen.has(t.actor.id)) seen.set(t.actor.id, t.actor);
    if (!seen.has(this.actor.id)) seen.set(this.actor.id, this.actor);
    return [...seen.values()];
  }

  getData() {
    const tabs = TABS.map((t) => ({ ...t, active: t.id === this.currentTab }));
    const base = { actorName: this.actor.name, actorImg: this.actor.img, tabs, tab: this.currentTab };

    try {
      const config = getEngineConfig();
      const party = this._party();

      if (this.currentTab === "crew") {
        return { ...base, isCrew: true, crew: this._crewData(party, config) };
      }
      if (this.currentTab === "social") {
        // The Garden (§21.4): profile · trending · feed, engagement-scaled.
        const reads = computeActorReads(this.actor, { sceneActors: party, config });
        let crew = null;
        if (party.length >= 2) {
          const members = party.map((a) => buildCrewMemberInput(a, config));
          crew = analyzeCrew({ members, factionsConfig: config.factions });
        }
        const garden = buildGardenView({ actor: this.actor, reads, crew });
        // §25.1 sparkline — engagement across the feed (oldest → newest).
        const series = [...garden.feed].filter((p) => p.kind !== "ad" && Number.isFinite(p.likes)).map((p) => p.likes).reverse();
        garden.spark = sparklineView(series, { label: "engagement" });
        return { ...base, isSocial: true, isGM: !!game.user?.isGM, garden };
      }
      if (this.currentTab === "help") {
        // §19.2 layer 3 — the glossary, generated from engine metric metadata
        // with thresholds read live from the dials (never hand-maintained).
        return { ...base, isHelp: true, glossary: { entries: glossary(getTunables(), config) } };
      }

      // profile / chrome / gear all build on the self-view reads.
      const reads = computeActorReads(this.actor, { sceneActors: party, config });
      if (this.currentTab === "chrome") return { ...base, isChrome: true, chrome: this._chromeData(reads) };
      if (this.currentTab === "gear") return { ...base, isGear: true, gear: this._gearData(reads, config) };

      // Profile (M9.3 rework): both pipeline modes run every render — the radar
      // overlays them (§24) — and the lens toggle picks which one leads.
      const observedReads = computeActorReads(this.actor, { sceneActors: party, config, view: "observed" });
      const lensBar = {
        observed: this.lens === "observed",
        options: observerOptions(config, { actors: party, selfId: this.actor.id })
          .map((o) => ({ ...o, selected: o.value === this.observerSel })),
      };
      if (this.lens === "observed") {
        const observer = resolveObserver(this.observerSel, config, { actors: party });
        const lens = applyObserverLens({ reads: observedReads, observer, config });
        // Info affordances (§19.4) resolve against what's ON SCREEN: the observed run.
        this._results = { styleRating: observedReads.styleRating, cohesion: observedReads.cohesion, heat: observedReads.heat, danger: observedReads.danger, vibes: observedReads.vibes };
        return { ...base, isProfile: true, lensBar, seenBy: this._observedData(observedReads, reads, lens, observer) };
      }
      this._results = { styleRating: reads.styleRating, cohesion: reads.cohesion, heat: reads.heat, danger: reads.danger, vibes: reads.vibes };
      return { ...base, isProfile: true, lensBar, profile: this._profileData(reads, observedReads, config) };
    } catch (e) {
      console.error("Night City: Style Over All | StyleChecker compute failed:", e);
      return { ...base, error: true };
    }
  }

  // ── tab data shapers ───────────────────────────────────────────────────────

  /** Outfit's best-fitting district name (headline's "at home in …"). */
  _bestDistrictName(reads, config) {
    const districts = config.districts || {};
    const colorT = getTunables().color ?? {};
    const items = cpr.getItems(reads.actor);
    let best = null;
    for (const [key, d] of Object.entries(districts)) {
      const fit = districtStyleFit(reads.collected.styles, d);
      const score = fit.currentScore + districtPaletteFit({ items }, d, colorT).value;
      if (score > 0 && (!best || score > best.score)) best = { name: d.name || key, score };
    }
    return best?.name ?? null;
  }

  _profileData(reads, observed, config) {
    const { styleRating, cohesion, heat, danger, archetypes, scene, dripRating, collected, vibes } = reads;
    const bd = styleRating.breakdown || {};
    const BD_LABELS = { clothing: "Clothing cost", cyberware: "Cyberware cool", fashionware: "Fashionware", accessories: "Accessories", synergy: "Style synergy" };
    const breakdown = Object.keys(BD_LABELS).filter((k) => bd[k]).map((k) => ({ label: BD_LABELS[k], raw: bd[k].raw, weighted: bd[k].weighted }));
    const bonuses = Object.entries(styleRating.bonuses || {}).filter(([, v]) => v).map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v }));

    const maxConf = Math.max(1, ...archetypes.slice(0, 5).map((a) => a.confidence ?? a.score ?? 0));
    const arch = archetypes.slice(0, 5).map((a, i) => {
      const conf = Math.round(a.confidence ?? a.score ?? 0);
      return { label: a.label || a.key, confidence: conf, pct: Math.round((conf / maxConf) * 100), primary: i === 0 };
    });

    return {
      style: { total: styleRating.total, tierName: styleRating.tier?.name, tierGrade: styleRating.tier?.grade, tierIcon: styleRating.tier?.icon, breakdown, bonuses,
        roleAlign: styleRating.roleAlignment?.label ? { label: styleRating.roleAlignment.label, mult: styleRating.roleAlignment.multiplier, role: styleRating.roleAlignment.roleName } : null },
      cohesion: { percent: cohesion.percent, label: cohesion.label, dominant: cohesion.dominantStyle !== "None" ? formatStyleName(cohesion.dominantStyle) : "None" },
      heat: { value: heat.value, level: heat.level, cls: HEAT_CLASS[heat.level] || "cold", tooltip: heat.tooltip },
      danger: { value: danger.value, tier: danger.tier, color: danger.color, tooltip: danger.tooltip },
      drip: dripRating.rating,
      totalCost: collected.totalCost,
      archetypes: arch,
      scene: { rank: scene.yourRank, total: scene.totalCharacters, status: scene.status, avg: scene.averageStyleScore },
      // §25.2 headline read — the two-second on-ramp line.
      headline: composeHeadline({ vibes, archetypes, heat, districtName: this._bestDistrictName(reads, config) }),
      archCallout: { primary: arch[0] ?? null, runnersUp: arch.slice(1, 4) },
      // §25 hero visuals (M9.2) — view models for the shared partials.
      charts: {
        radar: radarView(vibes.spokes, {
          overlay: observed?.vibes?.spokes?.map((s) => ({ tag: s.tag, value: s.value })) ?? null,
          seriesLabel: "Self", overlayLabel: "Street read", size: 230,
        }),
        vibeDescriptor: vibes.descriptor,
        heatGauge: gaugeView({ value: heat.value, max: 100, bands: metricScale("heat", getTunables()) }),
        fingerprint: fingerprintView(collected.styles, { formatLabel: formatStyleName }),
      },
    };
  }

  /**
   * The As-Seen-By profile (§24, M9.3): the OBSERVED pipeline run framed
   * through one observer's lens — tier-gated blocks, recognized brands only,
   * and the disguise verdict when the observer is a faction.
   */
  _observedData(oReads, selfReads, lens, observer) {
    const T = getTunables();
    const reveal = lens.reveal;
    const tierWord = { failed: "no read", minimal: "a passing glance", partial: "a good look", full: "the studied look" }[lens.tier];

    const maxConf = Math.max(1, ...oReads.archetypes.slice(0, 4).map((a) => a.confidence ?? a.score ?? 0));
    const arch = oReads.archetypes.slice(0, 4).map((a, i) => {
      const conf = Math.round(a.confidence ?? a.score ?? 0);
      return { label: a.label || a.key, confidence: conf, pct: Math.round((conf / maxConf) * 100), primary: i === 0 };
    });

    const recognized = lens.brands.recognized.map((r) => ({
      label: r.counterfeit?.revealed ? `${r.label} (FAKE)` : r.label,
      fake: !!r.counterfeit?.revealed,
      pieces: r.pieces.join(", "),
    }));
    const expensiveOnly = !recognized.length && lens.brands.value.some((r) => r.prestige === "expensive");

    return {
      observer: { label: observer.label, kind: observer.kind, int: observer.int, perception: observer.perception },
      tier: lens.tier,
      tierWord,
      passive: { total: lens.passiveTotal, full: lens.thresholds.full },
      reveal,
      headline: composeHeadline({
        vibes: reveal.vibeDescriptor ? oReads.vibes : null,
        archetypes: reveal.archetype ? oReads.archetypes : [],
        heat: reveal.heat ? oReads.heat : null,
      }),
      knownFor: getKnownFor(this.actor)?.label ?? null, // §16.6 colors any first impression
      archCallout: reveal.archetype
        ? { primary: arch[0] ?? null, runnersUp: reveal.archetypeRunnersUp ? arch.slice(1, 4) : [] }
        : null,
      brands: { recognized, expensiveOnly, any: recognized.length > 0 || expensiveOnly },
      full: reveal.styleTier
        ? {
            style: `${oReads.styleRating.total} · ${oReads.styleRating.tier?.name ?? ""}`.trim(),
            danger: `${oReads.danger.value} · ${oReads.danger.tier}`,
            drip: oReads.dripRating.rating,
          }
        : null,
      disguise: lens.disguise,
      charts: {
        radar: reveal.vibeRadar
          ? radarView(oReads.vibes.spokes, {
              overlay: selfReads.vibes.spokes.map((s) => ({ tag: s.tag, value: s.value })),
              seriesLabel: "Street read", overlayLabel: "Self (truth)", size: 230,
            })
          : null,
        heatGauge: reveal.heat
          ? gaugeView({ value: oReads.heat.value, max: 100, bands: metricScale("heat", T) })
          : null,
        disguiseRing: lens.disguise
          ? ringView({ value: lens.disguise.confidence, threshold: T.disguise.labels.passable, label: lens.disguise.label, size: 96 })
          : null,
      },
    };
  }

  _chromeData({ cyberwareData: cw }) {
    const config = getEngineConfig();
    const cats = config.cyberware.CYBERWARE_CATEGORIES;
    const categories = CHROME_CATS.map((cat) => {
      const items = cw[cat] || [];
      return { key: cat, label: CHROME_LABELS[cat], count: items.length, items: items.map((c) => ({ name: c.name })) };
    }).filter((c) => c.count > 0);

    return {
      totalCount: cw.totalCount,
      chromePercent: cw.chromePercent,
      humanity: { percent: cw.humanityPercent, current: cw.currentHumanity, base: cw.baseHumanity, loss: cw.totalHL },
      emp: { base: cw.baseEmp, effective: cw.effectiveEmp, loss: cw.empLoss },
      mods: { style: Math.round(cw.totalStyleMod), cool: Math.round(cw.totalCoolMod), threat: Math.round(cw.totalThreatMod) },
      social: cw.socialImpact ? { label: cw.socialImpact.label, desc: cw.socialImpact.desc, color: cw.socialImpact.color } : null,
      risk: cw.cyberpsychosisRisk,
      cyberpsychosis: cw.cyberpsychosis,
      categories,
      drugs: (cw.drugs || []).map((d) => ({ name: d.name, severity: d.severity, hl: d.hlCost })),
    };
  }

  _gearData(reads, config) {
    const { collected, archetypes } = reads;
    const roleData = collected.roleData;

    // District fit — rank every district by how the current outfit reads there.
    // §9.2 (M9.1): on-palette outfits add a positive nudge to the fit score.
    const districts = config.districts || {};
    const items = cpr.getItems(reads.actor);
    const colorT = getTunables().color ?? {};
    const fits = Object.entries(districts).map(([key, d]) => {
      const fit = districtStyleFit(collected.styles, d);
      const palette = districtPaletteFit({ items }, d, colorT);
      return {
        key, name: d.name || key, score: fit.currentScore + palette.value, potential: fit.potentialScore + palette.value,
        paletteFit: palette.value,
        keep: fit.keep.map((b) => ({ style: formatStyleName(b.style), impact: b.impact })),
        remove: fit.remove.map((b) => ({ style: formatStyleName(b.style), impact: b.impact })),
        add: fit.add.map((a) => ({ style: formatStyleName(a.style), modifier: a.modifier })),
      };
    }).sort((a, b) => b.score - a.score);

    const best = fits[0];
    const worst = fits[fits.length - 1];

    // Budget plan — optimize for the WORST-fitting district (most to gain), default budget.
    const rank = roleData?.primaryRole?.rank || 0;
    const roleProfile = roleData?.primaryRole?.key ? config.factions.ROLE_PROFILES?.[roleData.primaryRole.key] : null;
    const archKey = archetypes?.[0]?.key;
    const targetArch = archKey ? config.factions.FACTION_ARCHETYPES?.[archKey] : null;
    const planDistrict = worst ? districts[worst.key] : null;
    let plan = null;
    if (planDistrict) {
      const p = optimizeBudget({ budget: DEFAULT_BUDGET, districtData: planDistrict, roleProfile, rank, targetArch, collected });
      plan = {
        districtName: planDistrict.name || worst.key,
        budget: DEFAULT_BUDGET,
        totalSpent: p.totalSpent,
        totalScore: p.totalScore,
        remaining: p.remaining,
        allocations: p.allocations.map((a) => ({ label: a.label, count: a.count, spent: a.spent, scoreGain: a.scoreGain, slots: a.slots.join(", "), priority: a.priority, comment: a.fixerComment })),
      };
    }

    return { fits, best, worst, plan };
  }

  _crewData(party, config) {
    if (party.length === 0) return { empty: true };
    const members = party.map((a) => buildCrewMemberInput(a, config));
    const c = analyzeCrew({ members, factionsConfig: config.factions });

    return {
      count: c.members.length,
      synergy: c.synergy,
      reputation: c.crewReputation,
      heat: { value: c.crewHeat.value, level: c.crewHeat.level, levelLower: HEAT_CLASS[c.crewHeat.level] || "cold" },
      danger: { value: c.crewDanger.value, tier: c.crewDanger.tier, color: c.crewDanger.color },
      coherence: { score: c.styleCoherence.score, label: c.styleCoherence.label, blow: c.styleCoherence.blowability, blowLabel: c.styleCoherence.blowLabel, dominant: c.styleCoherence.dominantStyle !== "None" ? formatStyleName(c.styleCoherence.dominantStyle) : "None" },
      roleCoverage: { percent: c.roleCoverage.coveragePercent, covered: c.roleCoverage.covered, missing: c.roleCoverage.missing, assignments: c.roleCoverage.assignments },
      weakest: c.weakestLink,
      standout: c.standout,
      faction: c.crewFactionProfile.dominant,
      clashes: c.internalClashes.clashes,
      members: c.members.map((m) => ({ name: m.name, img: m.img, score: m.styleScore, tier: m.tier?.name, archetype: m.topArch?.label, chrome: m.chromeCount })),
    };
  }

  /** GM hand-post (§21.4 "the city reacts to what you did"). */
  async _gardenPost() {
    if (!game.user?.isGM) return;
    const form = await Dialog.prompt({
      options: NCSOA_DIALOG,
      title: "Post to The Garden",
      content:
        `<p><label>Post</label><textarea name="g-text" rows="3" style="width:100%" placeholder="The city saw something…"></textarea></p>` +
        `<p><label>About (actor name; empty = the whole table sees it on every profile)</label>` +
        `<input type="text" name="g-about" value="${this.actor.name}" style="width:100%"/></p>`,
      label: "Post",
      rejectClose: false,
      callback: (html) => ({
        text: html.find("[name='g-text']").val()?.trim() || null,
        about: html.find("[name='g-about']").val()?.trim() || null,
      }),
    });
    if (!form?.text) return;
    await addEventPost({ text: form.text, platform: "streetview", usernamePool: "gonks", about: form.about });
    this.render(false);
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-tab]").on("click", (e) => {
      this.currentTab = e.currentTarget.dataset.tab;
      this.render(false);
    });
    html.find("[data-action='garden-post']").on("click", () => this._gardenPost());
    html.find("[data-action='garden-refresh']").on("click", () => this.render(false));
    // §24 lens controls: flip the view; picking an observer implies observed.
    html.find("[data-action='lens']").on("click", (e) => {
      this.lens = e.currentTarget.dataset.lens === "observed" ? "observed" : "self";
      this.render(false);
    });
    html.find("[data-control='observer']").on("change", (e) => {
      this.observerSel = e.currentTarget.value;
      this.lens = "observed";
      this.render(false);
    });
    // §19.4 — every ? opens the metric's definition + the LIVE breakdown
    // computed this render (one rendering path; no restated math).
    bindInfoAffordances(html, (key) => this._results?.[key] ?? null);
  }
}
