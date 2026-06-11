/**
 * wardrobe-app.mjs — the interactive Wardrobe (M6, guide §7): build → preview →
 * apply an outfit from one window, without the CPR sheet.
 *
 * Three columns (§7.2):
 *  · Slot Grid — one cell per CPR clothing slot; shows the (staged) occupant +
 *    its headline contribution chip; click to focus a slot, × to stage it empty.
 *  · Live Profile — the engine's output for the PREVIEWED set: style/cohesion/
 *    heat/danger cards (with deltas vs the committed outfit while dirty),
 *    archetype read, chrome, breakdown.
 *  · Closet — owned/reserve clothing, filtered by the focused slot + search;
 *    click to stage into its slot.
 *
 * Stage vs Commit (§7.3): staging builds a hypothetical item list (zero writes)
 * through services/wardrobe-staging.mjs and previews it via the M6.1 engine seam
 * `computeActorReads(actor, {items})`. Commit applies every staged slot in ONE
 * batched `updateEmbeddedDocuments` call. Dirty bar offers Apply / Revert.
 *
 * V1 Application by decision D2 (AppV2 migration isolated to apps/, M9).
 *
 * Spec: SC-Module-Architecture-Guide.md §7.2–7.3, §6 M6, §19, §4.1 (Layer Rule)
 */

import { MODULE_ID } from "../constants.mjs";
import * as cpr from "../data/cpr-adapter.mjs";
import { dualReadStyleData } from "../data/sc-keys.mjs";
import { CLOTHING_SLOTS } from "../engine/collect.mjs";
import { formatStyleName } from "../engine/recommendations.mjs";
import { computeActorReads } from "../services/style-reads.mjs";
import { getEngineConfig } from "../services/engine-config.mjs";
import { normalizeStaged, buildStagedItems, buildCommitUpdates } from "../services/wardrobe-staging.mjs";
import { snapshotOutfit, makePreset, outfitToStaged, addOutfit, removeOutfit, renameOutfit } from "../services/outfits.mjs";
import { getStyleTemplates, setStyleTemplates, snapshotTemplateEntries, applyQuickDress } from "../services/quick-dress.mjs";
import { getUniforms, setUniforms, buildUniformFromReads, wearUniform } from "../services/uniforms.mjs";
import { bestUniformMatch } from "../engine/uniforms.mjs";
import { getOutfits, setOutfits } from "../data/flags.mjs";
import { openTailorDialog } from "./tailor-dialog.mjs";
import { humanize } from "../config/style-tab-schema.mjs";
import { NCSOA_DIALOG } from "./components/register.mjs";

const SLOT_LABELS = {
  top: "Top", bottoms: "Bottoms", jacket: "Jacket", footwear: "Footwear", hats: "Hat",
  glasses: "Glasses", mirrorshades: "Mirrorshades", contactLenses: "Contacts", jewelry: "Jewelry",
};

const CHROME_LABELS = {
  visible_chrome: "Visible Chrome", hidden_chrome: "Hidden Chrome", fashionware: "Fashionware",
  bioware: "Bioware", borgware: "Borgware", uncategorized: "Other", none: "None",
};

const CHROME_DISPLAY_CATS = ["visible_chrome", "hidden_chrome", "fashionware", "bioware", "borgware"];

const HEAT_CLASS = { COLD: "cold", WARM: "warm", HOT: "hot", BLAZING: "blazing" };

const BREAKDOWN_LABELS = {
  clothing: "Clothing cost", cyberware: "Cyberware cool", fashionware: "Fashionware",
  accessories: "Accessories", synergy: "Style synergy",
};

/** Headline contribution chip for an item: strongest authored signal, or the CPR style. */
function headlineChip(item, factionsConfig) {
  const { styleData } = dualReadStyleData(item);
  if (styleData) {
    const top = (field) => {
      const entries = Object.entries(styleData[field] ?? {}).filter(([, v]) => v);
      if (!entries.length) return null;
      return entries.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
    };
    const faction = top("faction");
    if (faction) {
      const label = factionsConfig?.FACTIONS?.[faction[0]]?.label || humanize(faction[0]);
      return `${faction[1] > 0 ? "+" : ""}${faction[1]} ${label}`;
    }
    const style = top("style");
    if (style) return `${style[1] > 0 ? "+" : ""}${style[1]} ${formatStyleName(style[0])}`;
  }
  const cprStyle = cpr.getClothingStyle(item);
  return cprStyle ? formatStyleName(cprStyle) : null;
}

/** Signed delta cell for the headline cards ("higher is better" flips per metric). */
function delta(staged, base, { higherIsBetter = true } = {}) {
  const d = staged - base;
  if (!d) return null;
  return {
    text: `${d > 0 ? "+" : ""}${d}`,
    cls: (d > 0) === higherIsBetter ? "good" : "bad",
  };
}

export class WardrobeApp extends Application {
  /**
   * @param {object} actor CPR actor document
   * @param {object} [options] Application options
   * @param {object[]} [options.sceneActors] room context for the heat outlier
   */
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this.sceneActors = options.sceneActors ?? null;
    /** Staged changes: { <slot>: itemId|null } — null stages the slot empty. */
    this.staged = {};
    /** Closet filter: the focused slot key, or null for all. */
    this.focusSlot = null;
    this.closetSearch = "";
    // One window per actor (unique element id; re-open focuses the existing one).
    this.options.id = `ncsoa-wardrobe-${actor?.id ?? "none"}`;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ncsoa-wardrobe",
      classes: ["ncsoa", "ncsoa-wardrobe"],
      template: `modules/${MODULE_ID}/templates/wardrobe.hbs`,
      width: 1000,
      height: 800,
      resizable: true,
      title: "Wardrobe",
    });
  }

  get title() {
    return `Wardrobe — ${this.actor?.name ?? "Unknown"}`;
  }

  get isDirty() {
    return Object.keys(this.staged).length > 0;
  }

  /**
   * Open (or focus) the Wardrobe for an actor. Pulls scene context from the
   * canvas (placed tokens with actors) so the heat outlier reflects the room.
   */
  static openForActor(actor) {
    if (!actor) return null;
    const sceneActors = canvas?.tokens?.placeables?.map((t) => t.actor).filter(Boolean);
    const app = new WardrobeApp(actor, { sceneActors: sceneActors?.length ? sceneActors : null });
    return app.render(true);
  }

  getData() {
    const config = getEngineConfig();
    const realItems = cpr.getItems(this.actor);
    this.staged = normalizeStaged(realItems, this.staged);

    let reads, baseline;
    try {
      const stagedItems = buildStagedItems(realItems, this.staged);
      const ctx = this.sceneActors ? { sceneActors: this.sceneActors } : {};
      reads = computeActorReads(this.actor, { ...ctx, config, items: stagedItems });
      baseline = this.isDirty ? computeActorReads(this.actor, { ...ctx, config }) : null;
    } catch (e) {
      console.error("Night City: Style Over All | Wardrobe compute failed:", e);
      return { error: true, actorName: this.actor?.name ?? "Unknown" };
    }

    const { collected, cyberwareData, styleRating, cohesion, dripRating, heat, danger, archetypes, chromeProfile } = reads;

    // ── Left: slot grid (the staged view) ─────────────────────────────────────
    const itemById = new Map(realItems.map((i) => [i.id, i]));
    const slots = CLOTHING_SLOTS.map((slot) => {
      const p = collected.parts[slot] || { worn: false };
      const occupant = p.id ? itemById.get(p.id) : null;
      return {
        slot,
        label: SLOT_LABELS[slot] || slot,
        worn: !!p.worn,
        name: p.worn ? p.name : "Empty",
        img: p.worn ? p.img : null,
        itemId: p.id || null,
        chip: occupant ? headlineChip(occupant, config.factions) : null,
        cost: p.worn ? p.cost || 0 : null,
        isStaged: slot in this.staged,
        focused: this.focusSlot === slot,
      };
    });

    // ── Right: closet (everything not occupying its slot in the staged view) ──
    const occupantIds = new Set(Object.values(collected.parts).map((p) => p.id).filter(Boolean));
    const closet = realItems
      .filter((i) => i.type === cpr.ITEM_TYPE.CLOTHING && !occupantIds.has(i.id))
      .filter((i) => !this.focusSlot || cpr.getClothingSlot(i) === this.focusSlot)
      .map((i) => {
        const slot = cpr.getClothingSlot(i);
        return {
          id: i.id,
          name: i.name,
          nameLower: i.name.toLowerCase(),
          img: i.img,
          slotLabel: SLOT_LABELS[slot] || slot,
          styleLabel: cpr.getClothingStyle(i) ? formatStyleName(cpr.getClothingStyle(i)) : null,
          cost: cpr.getPrice(i),
          chip: headlineChip(i, config.factions),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // ── Center: live profile (+ deltas vs the committed outfit while dirty) ──
    const bd = styleRating.breakdown || {};
    const breakdown = Object.keys(BREAKDOWN_LABELS)
      .filter((k) => bd[k])
      .map((k) => ({ label: BREAKDOWN_LABELS[k], raw: bd[k].raw, weighted: bd[k].weighted }));
    const bonuses = Object.entries(styleRating.bonuses || {})
      .filter(([, v]) => v)
      .map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v }));
    const roleAlign = styleRating.roleAlignment?.label
      ? { label: styleRating.roleAlignment.label, mult: styleRating.roleAlignment.multiplier, role: styleRating.roleAlignment.roleName }
      : null;

    const chromeItems = [];
    for (const cat of CHROME_DISPLAY_CATS) {
      for (const c of cyberwareData[cat] || []) chromeItems.push({ name: c.name, category: CHROME_LABELS[cat] });
    }

    const topArchetypes = (archetypes || []).slice(0, 3).map((a) => ({
      label: a.label || a.key,
      confidence: Math.round(a.confidence ?? a.score ?? 0),
    }));

    // ── Outfit presets (§7.4) ─────────────────────────────────────────────────
    const wornNow = new Set(snapshotOutfit(buildStagedItems(realItems, this.staged)).map((e) => e.itemId));
    const outfits = getOutfits(this.actor).map((o) => {
      const entries = o.items ?? [];
      const missing = entries.filter((e) => !itemById.has(e.itemId)).length;
      const isWorn = entries.length > 0 && entries.length === wornNow.size && entries.every((e) => wornNow.has(e.itemId));
      return {
        id: o.id, name: o.name, note: o.note,
        count: entries.length, missing, hasMissing: missing > 0, isWorn,
      };
    });

    // ── GM quick-dress templates (§14.5; GM only) ─────────────────────────────
    const isGM = !!game.user?.isGM;
    const templates = isGM
      ? getStyleTemplates().map((t) => ({ id: t.id, name: t.name, note: t.note, count: (t.items ?? []).length }))
      : [];

    // ── Uniform recognition (§21.2): does the PREVIEWED look read as a group? ──
    const allUniforms = getUniforms();
    const uniformHit = bestUniformMatch({
      uniforms: allUniforms,
      collected: reads.collected, cyberwareData: reads.cyberwareData, scMods: reads.scMods,
    });
    const uniformRead = uniformHit
      ? { name: uniformHit.uniform.name, grade: uniformHit.match.grade, value: uniformHit.match.value, isFull: uniformHit.match.grade === "full" }
      : null;
    const uniforms = isGM
      ? allUniforms.map((u) => ({
          id: u.id, name: u.name, note: u.note,
          count: (u.hard?.items ?? []).length,
          groupKey: u.group?.key ?? null,
          groupLabel: u.group?.key ? (config.factions?.FACTIONS?.[u.group.key]?.label || humanize(u.group.key)) : null,
        }))
      : [];

    return {
      actorName: this.actor.name,
      actorImg: this.actor.img,
      isDirty: this.isDirty,
      outfits,
      hasOutfits: outfits.length > 0,
      isGM,
      templates,
      hasTemplates: templates.length > 0,
      uniforms,
      hasUniforms: uniforms.length > 0,
      uniformRead,
      stagedCount: Object.keys(this.staged).length,
      focusSlot: this.focusSlot,
      focusLabel: this.focusSlot ? SLOT_LABELS[this.focusSlot] || this.focusSlot : null,
      closetSearch: this.closetSearch,
      style: {
        total: styleRating.total,
        tierName: styleRating.tier?.name ?? "—",
        tierGrade: styleRating.tier?.grade ?? "",
        tierIcon: styleRating.tier?.icon ?? "",
        delta: baseline && delta(styleRating.total, baseline.styleRating.total),
        breakdown,
        bonuses,
        roleAlign,
      },
      cohesion: {
        percent: cohesion.percent,
        label: cohesion.label,
        dominant: cohesion.dominantStyle && cohesion.dominantStyle !== "None" ? formatStyleName(cohesion.dominantStyle) : "None",
        delta: baseline && delta(cohesion.percent, baseline.cohesion.percent),
      },
      heat: {
        value: heat.value, level: heat.level, cls: HEAT_CLASS[heat.level] || "cold",
        delta: baseline && delta(heat.value, baseline.heat.value, { higherIsBetter: false }),
      },
      danger: {
        value: danger.value, tier: danger.tier, color: danger.color,
        delta: baseline && delta(danger.value, baseline.danger.value, { higherIsBetter: false }),
      },
      drip: dripRating.rating,
      totalCost: collected.totalCost,
      archetypes: topArchetypes,
      chromeProfile: { label: CHROME_LABELS[chromeProfile.category] || chromeProfile.category, count: chromeProfile.count },
      chrome: {
        totalCount: cyberwareData.totalCount,
        chromePercent: cyberwareData.chromePercent,
        humanityPercent: cyberwareData.humanityPercent,
        items: chromeItems,
      },
      slots,
      closet,
      closetEmpty: closet.length === 0,
    };
  }

  // ── staging actions ──────────────────────────────────────────────────────────

  _stage(itemId) {
    const item = this.actor.items?.get?.(itemId);
    if (!item || item.type !== cpr.ITEM_TYPE.CLOTHING) return;
    const slot = cpr.getClothingSlot(item);
    if (!slot) return;
    this.staged[slot] = itemId;
    this.render(false);
  }

  _clearSlot(slot) {
    this.staged[slot] = null; // stage the slot EMPTY (≠ untouched)
    this.render(false);
  }

  _focus(slot) {
    this.focusSlot = this.focusSlot === slot ? null : slot;
    this.render(false);
  }

  _revert() {
    this.staged = {};
    this.render(false);
  }

  async _apply() {
    const updates = buildCommitUpdates(cpr.getItems(this.actor), this.staged);
    if (updates.length) {
      await this.actor.updateEmbeddedDocuments("Item", updates);
    }
    this.staged = {};
    this.render(false);
  }

  // ── outfit presets (§7.4) ────────────────────────────────────────────────────

  /** Save the STAGED view as a preset — what you're previewing is what you save. */
  async _saveOutfit() {
    const items = snapshotOutfit(buildStagedItems(cpr.getItems(this.actor), this.staged));
    if (!items.length) {
      ui.notifications?.warn("Nothing equipped to save — stage or wear an outfit first.");
      return;
    }
    const name = await this._promptName("Save outfit", `Outfit ${getOutfits(this.actor).length + 1}`);
    if (!name) return;
    const preset = makePreset({ id: foundry.utils.randomID(), name, items });
    await setOutfits(this.actor, addOutfit(getOutfits(this.actor), preset));
    this.render(false);
  }

  /** Stage a preset (complete look — zero writes; Apply commits it). */
  _tryOnOutfit(id) {
    const preset = getOutfits(this.actor).find((o) => o.id === id);
    if (!preset) return;
    const { stagedBySlot, missing } = outfitToStaged(preset, cpr.getItems(this.actor));
    if (missing.length) {
      ui.notifications?.warn(
        `"${preset.name}": ${missing.length} piece(s) no longer in the wardrobe — ${missing.map((m) => m.name || m.itemId).join(", ")}.`
      );
    }
    this.staged = stagedBySlot;
    this.render(false);
  }

  async _renameOutfit(id) {
    const preset = getOutfits(this.actor).find((o) => o.id === id);
    if (!preset) return;
    const name = await this._promptName("Rename outfit", preset.name);
    if (!name || name === preset.name) return;
    await setOutfits(this.actor, renameOutfit(getOutfits(this.actor), id, name));
    this.render(false);
  }

  async _deleteOutfit(id) {
    const preset = getOutfits(this.actor).find((o) => o.id === id);
    if (!preset) return;
    const ok = await Dialog.confirm({
      options: NCSOA_DIALOG,
      title: "Delete outfit?",
      content: `<p>Delete the saved outfit <strong>${preset.name}</strong>? The clothes stay in the wardrobe.</p>`,
    });
    if (!ok) return;
    await setOutfits(this.actor, removeOutfit(getOutfits(this.actor), id));
    this.render(false);
  }

  // ── GM quick-dress templates (§14.5) ─────────────────────────────────────────

  /** Save the STAGED look as a world template any NPC can be dressed in. */
  async _saveTemplate() {
    if (!game.user?.isGM) return;
    const realItems = cpr.getItems(this.actor);
    const entries = snapshotTemplateEntries(buildStagedItems(realItems, this.staged), realItems);
    if (!entries.length) {
      ui.notifications?.warn("Nothing equipped to save — stage or wear an outfit first.");
      return;
    }
    const name = await this._promptName("Save as quick-dress template", `${this.actor.name} look`);
    if (!name) return;
    await setStyleTemplates([
      ...getStyleTemplates(),
      { id: foundry.utils.randomID(), name, note: "", items: entries },
    ]);
    this.render(false);
  }

  /** One-click §14.5: import + equip the template's look onto THIS actor. */
  async _applyTemplate(id) {
    if (!game.user?.isGM) return;
    const template = getStyleTemplates().find((t) => t.id === id);
    if (!template) return;
    const ok = await Dialog.confirm({
      options: NCSOA_DIALOG,
      title: "Quick-dress?",
      content: `<p>Dress <strong>${this.actor.name}</strong> as <strong>${template.name}</strong>? ` +
        `Pieces they don't own are imported; the current outfit comes off. This writes immediately.</p>`,
    });
    if (!ok) return;
    const plan = await applyQuickDress(this.actor, template);
    const bits = [];
    if (plan.importItems.length) bits.push(`${plan.importItems.length} imported`);
    if (plan.reuse.length) bits.push(`${plan.reuse.length} reused`);
    if (plan.missing.length) bits.push(`${plan.missing.length} MISSING (${plan.missing.map((m) => m.name).join(", ")})`);
    const notify = plan.missing.length ? "warn" : "info";
    ui.notifications?.[notify](`${this.actor.name} dressed as "${template.name}" — ${bits.join(", ") || "no changes"}.`);
    this.staged = {};
    this.render(false);
  }

  async _deleteTemplate(id) {
    if (!game.user?.isGM) return;
    const template = getStyleTemplates().find((t) => t.id === id);
    if (!template) return;
    const ok = await Dialog.confirm({
      options: NCSOA_DIALOG,
      title: "Delete template?",
      content: `<p>Delete the quick-dress template <strong>${template.name}</strong> for the whole world?</p>`,
    });
    if (!ok) return;
    await setStyleTemplates(getStyleTemplates().filter((t) => t.id !== id));
    this.render(false);
  }

  // ── uniforms (§21.2) ─────────────────────────────────────────────────────────

  /** Author by example: capture the STAGED look as a uniform (hard kit + derived
   *  soft signature), optionally bound to a faction (recognition + disguise hooks). */
  async _saveUniform() {
    if (!game.user?.isGM) return;
    const realItems = cpr.getItems(this.actor);
    const stagedItems = buildStagedItems(realItems, this.staged);
    if (!snapshotOutfit(stagedItems).length) {
      ui.notifications?.warn("Nothing equipped to save — stage or wear the model look first.");
      return;
    }
    const factions = getEngineConfig().factions?.FACTIONS ?? {};
    const options = Object.entries(factions)
      .map(([key, f]) => `<option value="${key}">${f.label || key}</option>`)
      .join("");
    const picked = await Dialog.prompt({
      options: NCSOA_DIALOG,
      title: "Save as uniform",
      content:
        `<p><label>Name</label><input type="text" name="ncsoa-uni-name" value="${this.actor.name} uniform" style="width:100%" /></p>` +
        `<p><label>Group (recognition + disguise hooks)</label><select name="ncsoa-uni-group" style="width:100%">` +
        `<option value="">— none / crew only —</option>${options}</select></p>` +
        `<p class="notes">The soft signature (style lean · chrome · gear signals) is derived from the previewed look.</p>`,
      label: "Save uniform",
      callback: (html) => ({
        name: html.find("[name='ncsoa-uni-name']").val()?.trim() || null,
        groupKey: html.find("[name='ncsoa-uni-group']").val() || null,
      }),
      rejectClose: false,
    });
    if (!picked?.name) return;
    const reads = computeActorReads(this.actor, { config: getEngineConfig(), items: stagedItems });
    const uniform = buildUniformFromReads({
      id: foundry.utils.randomID(),
      name: picked.name,
      group: picked.groupKey ? { type: "faction", key: picked.groupKey } : null,
      stagedItems, realItems, reads,
    });
    await setUniforms([...getUniforms(), uniform]);
    this.render(false);
  }

  /** One-click "wear the uniform" — the hard kit via the §14.5 machinery. */
  async _wearUniform(id) {
    if (!game.user?.isGM) return;
    const uniform = getUniforms().find((u) => u.id === id);
    if (!uniform) return;
    const ok = await Dialog.confirm({
      options: NCSOA_DIALOG,
      title: "Wear uniform?",
      content: `<p>Dress <strong>${this.actor.name}</strong> in <strong>${uniform.name}</strong>? ` +
        `Pieces they don't own are imported; the current outfit comes off. This writes immediately.</p>`,
    });
    if (!ok) return;
    const plan = await wearUniform(this.actor, uniform);
    const notify = plan.missing.length ? "warn" : "info";
    ui.notifications?.[notify](
      `${this.actor.name} in "${uniform.name}" — ${plan.importItems.length} imported, ${plan.reuse.length} reused` +
      (plan.missing.length ? `, ${plan.missing.length} MISSING (${plan.missing.map((m) => m.name).join(", ")})` : "") + "."
    );
    this.staged = {};
    this.render(false);
  }

  async _deleteUniform(id) {
    if (!game.user?.isGM) return;
    const uniform = getUniforms().find((u) => u.id === id);
    if (!uniform) return;
    const ok = await Dialog.confirm({
      options: NCSOA_DIALOG,
      title: "Delete uniform?",
      content: `<p>Delete <strong>${uniform.name}</strong> for the whole world? Recognition and disguise hooks for it stop.</p>`,
    });
    if (!ok) return;
    await setUniforms(getUniforms().filter((u) => u.id !== id));
    this.render(false);
  }

  _promptName(title, initial) {
    return Dialog.prompt({
      options: NCSOA_DIALOG,
      title,
      content: `<p><input type="text" name="ncsoa-outfit-name" value="${initial ?? ""}" style="width:100%" /></p>`,
      label: "Save",
      callback: (html) => html.find("[name='ncsoa-outfit-name']").val()?.trim() || null,
      rejectClose: false,
    });
  }

  // ── listeners ────────────────────────────────────────────────────────────────

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-action='refresh']").on("click", () => this.render(false));
    html.find("[data-action='focus-slot']").on("click", (e) => this._focus(e.currentTarget.dataset.slot));
    html.find("[data-action='clear-slot']").on("click", (e) => {
      e.stopPropagation(); // don't also toggle slot focus
      this._clearSlot(e.currentTarget.dataset.slot);
    });
    html.find("[data-action='stage']").on("click", (e) => this._stage(e.currentTarget.dataset.item));
    html.find("[data-action='apply']").on("click", () => this._apply());
    html.find("[data-action='revert']").on("click", () => this._revert());
    html.find("[data-action='save-outfit']").on("click", () => this._saveOutfit());
    html.find("[data-action='tryon-outfit']").on("click", (e) => this._tryOnOutfit(e.currentTarget.dataset.outfit));
    html.find("[data-action='rename-outfit']").on("click", (e) => { e.stopPropagation(); this._renameOutfit(e.currentTarget.dataset.outfit); });
    html.find("[data-action='delete-outfit']").on("click", (e) => { e.stopPropagation(); this._deleteOutfit(e.currentTarget.dataset.outfit); });
    html.find("[data-action='save-template']").on("click", () => this._saveTemplate());
    html.find("[data-action='apply-template']").on("click", (e) => this._applyTemplate(e.currentTarget.dataset.template));
    html.find("[data-action='delete-template']").on("click", (e) => { e.stopPropagation(); this._deleteTemplate(e.currentTarget.dataset.template); });
    html.find("[data-action='save-uniform']").on("click", () => this._saveUniform());
    html.find("[data-action='wear-uniform']").on("click", (e) => this._wearUniform(e.currentTarget.dataset.uniform));
    html.find("[data-action='delete-uniform']").on("click", (e) => { e.stopPropagation(); this._deleteUniform(e.currentTarget.dataset.uniform); });

    // Tailor (§15.1): customize a garment from the slot grid or the closet.
    html.find("[data-action='tailor']").on("click", (e) => {
      e.stopPropagation();
      const item = this.actor.items?.get?.(e.currentTarget.dataset.item);
      if (item) openTailorDialog(item, { onApplied: () => this.render(false) });
    });

    // Closet search: DOM-level filter (no re-render → the input keeps focus).
    const applySearch = (term) => {
      this.closetSearch = term;
      const q = term.trim().toLowerCase();
      html.find("[data-closet-name]").each((_, el) => {
        el.style.display = !q || el.dataset.closetName.includes(q) ? "" : "none";
      });
    };
    html.find("[data-control='closet-search']").on("input", (e) => applySearch(e.currentTarget.value));
    if (this.closetSearch) applySearch(this.closetSearch);
  }
}

// Back-compat: M3 callers imported the read-only app by this name.
export const WardrobeReadOnlyApp = WardrobeApp;
