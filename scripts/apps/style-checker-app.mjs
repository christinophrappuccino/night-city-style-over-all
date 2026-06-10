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
import { analyzeCrew } from "../engine/crew.mjs";
import { computeActorReads, buildCrewMemberInput } from "../services/style-reads.mjs";
import { getEngineConfig } from "../services/engine-config.mjs";
import { buildGardenView, addEventPost } from "../services/garden.mjs";

const TABS = [
  { id: "profile", label: "Style Profile", icon: "fa-id-card" },
  { id: "chrome", label: "Chrome", icon: "fa-microchip" },
  { id: "gear", label: "Gear & Optimization", icon: "fa-tshirt" },
  { id: "crew", label: "Crew", icon: "fa-users-cog" },
  { id: "social", label: "Social", icon: "fa-users" },
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
        return { ...base, isSocial: true, isGM: !!game.user?.isGM, garden: buildGardenView({ actor: this.actor, reads, crew }) };
      }

      // profile / chrome / gear all build on the self-view reads.
      const reads = computeActorReads(this.actor, { sceneActors: party, config });
      if (this.currentTab === "chrome") return { ...base, isChrome: true, chrome: this._chromeData(reads) };
      if (this.currentTab === "gear") return { ...base, isGear: true, gear: this._gearData(reads, config) };
      return { ...base, isProfile: true, profile: this._profileData(reads) };
    } catch (e) {
      console.error("Night City: Style Over All | StyleChecker compute failed:", e);
      return { ...base, error: true };
    }
  }

  // ── tab data shapers ───────────────────────────────────────────────────────

  _profileData({ styleRating, cohesion, heat, danger, archetypes, scene, dripRating, collected }) {
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
    const districts = config.districts || {};
    const fits = Object.entries(districts).map(([key, d]) => {
      const fit = districtStyleFit(collected.styles, d);
      return {
        key, name: d.name || key, score: fit.currentScore, potential: fit.potentialScore,
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
  }
}
