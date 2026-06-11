/**
 * item-style-tab.mjs — the Item Style Tab (M4, guide §8). Retires the sc.* AE
 * authoring workflow: author the §5.2 styleData flag with dropdowns, on the CPR
 * item sheet itself.
 *
 * Injected via `renderItemSheet`, guarded on item type ∈ {clothing, gear, armor,
 * cyberware} and the CPR system being active (§8.1). The control set is declared in
 * config/style-tab-schema.mjs (frozen §5.2 schema); the live cascade preview (§8.3)
 * runs services/item-preview.mjs; sc.* read-through + single-item convert (§8.4)
 * use data/sc-keys.mjs.
 *
 * Writes use `{render:false}` so editing doesn't thrash the sheet; the preview panel
 * is refreshed in place, and structural edits (add/remove a weighted row, convert)
 * re-render only the injected tab body. (V13/AppV2 note D2: injection mechanics
 * differ; that change is isolated to THIS file.)
 *
 * Spec: SC-Module-Architecture-Guide.md §8, §5.2, §27, §28.
 */

import { MODULE_ID, FLAGS, CURRENT_SCHEMA } from "../constants.mjs";
import { getStyleData, updateStyleData } from "../data/flags.mjs";
import { hasScKeys, scSourcesFromAe, styleDataFromAe } from "../data/sc-keys.mjs";
import { buildTabSchema, humanize } from "../config/style-tab-schema.mjs";
import { getEngineConfig } from "../services/engine-config.mjs";
import { previewItemCascade } from "../services/item-preview.mjs";
import { openTailorDialog } from "./tailor-dialog.mjs";

const TAB_KEY = "ncsoa-style";
const TEMPLATE = `modules/${MODULE_ID}/templates/item-style-tab.hbs`;
const EDITABLE_TYPES = new Set(["clothing", "cyberware", "weapon", "armor", "gear"]);

const isCprActive = () => game.system?.id === "cyberpunk-red-core";

// ── dot-path helpers (operate on the working styleData copy) ────────────────
function getPath(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setPath(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof cur[keys[i]] !== "object" || cur[keys[i]] == null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  if (value === undefined) delete cur[keys[keys.length - 1]];
  else cur[keys[keys.length - 1]] = value;
}

/** Strip empties so the flag stays lean: blank strings, empty maps, null, 0-less scalars kept only if explicitly set. */
function cleanStyleData(sd) {
  const out = {};
  for (const [k, v] of Object.entries(sd)) {
    if (v == null || v === "") continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      const inner = cleanStyleData(v);
      if (Object.keys(inner).length) out[k] = inner;
    } else if (Array.isArray(v)) {
      if (v.length) out[k] = v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ── render context ──────────────────────────────────────────────────────────

/** Build one field's render context from the working styleData + materialized schema. */
function fieldContext(field, sd) {
  const current = getPath(sd, field.path);
  const base = {
    key: field.key, path: field.path, label: field.label, hint: field.hint,
    control: field.control, step: field.step ?? 1, min: field.min, max: field.max,
    placeholder: field.placeholder, datalist: field.datalist,
  };
  switch (field.control) {
    case "weightedMap": {
      const map = current && typeof current === "object" ? current : {};
      const rows = Object.entries(map).map(([k, v]) => ({ mapkey: k, label: humanize(k), value: v }));
      // options not already chosen (keep current rows pickable too for clarity)
      const options = (field.options ?? []);
      return { ...base, isWeightedMap: true, rows, options, defaultStrength: field.defaultStrength ?? 1 };
    }
    case "scalar":
      return { ...base, isScalar: true, value: current ?? "", hasMin: field.min != null, hasMax: field.max != null };
    case "select": {
      const options = (field.options ?? []).map((o) => ({ ...o, selected: String(o.value) === String(current) }));
      // Open-vocab fields (brand, scSlot): keep an authored value that isn't in
      // the option list selectable instead of silently dropping it on save.
      if (current != null && current !== "" && !options.some((o) => o.selected)) {
        options.push({ value: current, label: `${humanize(String(current))} (custom)`, selected: true });
      }
      return { ...base, isSelect: true, value: current ?? "", options, allowBlank: field.allowBlank };
    }
    case "multiSelect": {
      const sel = new Set(Array.isArray(current) ? current.map(String) : []);
      const options = (field.options ?? []).map((o) => ({ ...o, selected: sel.has(String(o.value)) }));
      return { ...base, isMultiSelect: true, options };
    }
    case "color":
      return { ...base, isColor: true, value: current || "#000000", hasValue: current != null && current !== "" };
    case "checkbox":
      return { ...base, isCheckbox: true, checked: !!current };
    case "text":
      return { ...base, isText: true, value: current ?? "" };
    default:
      return base;
  }
}

function buildContext(state) {
  const { working, item } = state;
  const schema = buildTabSchema(getEngineConfig());
  const sections = schema.sections.map((s) => ({
    id: s.id, label: s.label, hint: s.hint,
    fields: s.fields.map((f) => fieldContext(f, working)),
  }));
  const preview = previewItemCascade(working);
  return {
    itemName: item.name,
    itemImg: item.img,
    mode: state.mode,
    isReadthrough: state.mode === "readthrough",
    scSources: state.scSources,
    source: working._source || null,
    sections,
    preview: {
      label: preview.label, blurb: preview.blurb, hasSignal: preview.hasSignal,
      groups: preview.groups, components: preview.components,
    },
  };
}

// ── tab injection ─────────────────────────────────────────────────────────

function findSheetParts($html) {
  // CPR item sheet: nav.navtabs-item.cpr-tabs + .item-bottom-content-section.
  // Fallbacks cover the generic Foundry ItemSheet structure too.
  const nav = $html.find('nav.cpr-tabs, nav.navtabs-item, nav.sheet-tabs, nav.tabs, .tabs[data-group="primary"]').first();
  const body = $html.find(".item-bottom-content-section, section.sheet-body, .sheet-body").first();
  return { nav: nav.length ? nav : null, body: body.length ? body : null };
}

// ── the controller (one per open sheet render) ──────────────────────────────

class ItemStyleTabController {
  constructor(app, $html) {
    this.app = app;
    this.item = app.item;
    this.$html = $html;
    const flag = getStyleData(this.item);
    const hasFlag = flag !== undefined;
    this.mode = !hasFlag && hasScKeys(this.item) ? "readthrough" : "edit";
    this.scSources = this.mode === "readthrough" ? scSourcesFromAe(this.item) : [];
    // working copy: clone the flag, or empty in edit mode (read-through shows AEs, not editable)
    this.working = flag ? foundry.utils.deepClone(flag) : {};
    this._debounce = null;
  }

  get state() { return { working: this.working, item: this.item, mode: this.mode, scSources: this.scSources }; }

  async inject() {
    if (this.$html.find(".ncsoa-tab-link").length) return; // already injected this render
    const { nav, body } = findSheetParts(this.$html);
    if (!nav || !body) {
      console.warn(`${MODULE_ID} | Item Style Tab: could not locate sheet tab/body for ${this.item.name}; skipping injection.`);
      return;
    }
    // Match CPR's nav markup (link wrapped in .tab-pink-underlay) so it styles natively.
    nav.append(
      `<div class="tab-pink-underlay ncsoa-tab-underlay"><a class="tab-label text-small tab-indent ncsoa-tab-link" data-tab="${TAB_KEY}" title="Style Over All"><i class="fas fa-id-card"></i> Style</a></div>`
    );
    this.$section = $(`<div class="tab ncsoa ncsoa-style-tab" data-tab="${TAB_KEY}" data-group="primary"></div>`);
    body.append(this.$section);
    this.$link = nav.find(`a.ncsoa-tab-link[data-tab="${TAB_KEY}"]`);

    // Manual activation: the sheet's Tabs controller binds at render and won't know
    // about links added afterward, so we drive our tab's active state ourselves and
    // clear it when another tab is chosen.
    this.$link.on("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); this._activate(); });
    nav.find("a[data-tab]").not(this.$link).on("click", () => this._deactivate());

    await this._renderBody();
  }

  _activate() {
    const { nav, body } = findSheetParts(this.$html);
    nav?.find("a[data-tab]").removeClass("active");
    this.$link.addClass("active");
    body?.find(".tab").removeClass("active");
    this.$section.addClass("active");
  }
  _deactivate() { this.$link.removeClass("active"); this.$section.removeClass("active"); }

  async _renderBody() {
    const html = await renderTemplate(TEMPLATE, buildContext(this.state));
    this.$section.html(html);
    this._bind();
  }

  /** Re-render only the preview panel (cheap path for value edits). */
  async _refreshPreview() {
    const html = await renderTemplate(TEMPLATE, buildContext(this.state));
    const $fresh = $("<div>").html(html).find(".ncsoa-ist-preview");
    this.$section.find(".ncsoa-ist-preview").replaceWith($fresh);
  }

  _persist(immediate = false) {
    clearTimeout(this._debounce);
    const write = () => {
      const clean = cleanStyleData(this.working);
      clean.schema = CURRENT_SCHEMA;
      if (!clean._source) clean._source = "manual";
      this.working = clean;
      // The shared safe-write diffs vs storage — merged updates can't delete keys.
      updateStyleData(this.item, clean);
    };
    if (immediate) write();
    else this._debounce = setTimeout(write, 400);
  }

  _bind() {
    const root = this.$section;

    // Scalar / text / color inputs, selects, checkboxes.
    root.find("[data-path]").on("change", (ev) => {
      const el = ev.currentTarget;
      if (el.dataset.mapkey != null || el.classList.contains("ncsoa-ist-addsel")) return; // handled separately
      this._onValueChange(el);
    });

    // multiSelect (checkbox group).
    root.find("[data-multipath]").on("change", () => this._onMultiChange());

    // weightedMap: add / remove rows.
    root.find('[data-action="add-map"]').on("click", (ev) => this._onAddMap(ev.currentTarget.dataset.path));
    root.find('[data-action="remove-map"]').on("click", (ev) => {
      const { path, mapkey } = ev.currentTarget.dataset;
      this._onRemoveMap(path, mapkey);
    });
    // weightedMap: edit a row's strength.
    root.find("input[data-mapkey]").on("change", (ev) => {
      const { path, mapkey } = ev.currentTarget.dataset;
      const v = Number(ev.currentTarget.value);
      const map = getPath(this.working, path) || {};
      if (Number.isNaN(v) || v === 0) delete map[mapkey];
      else map[mapkey] = v;
      setPath(this.working, path, Object.keys(map).length ? map : undefined);
      this._persist();
      this._refreshPreview();
    });

    // Convert sc.* → flags (read-through mode, §8.4).
    root.find('[data-action="convert"]').on("click", () => this._onConvert());

    // Tailor (§15.1): customize this garment; reload the working copy after.
    root.find('[data-action="open-tailor"]').on("click", async () => {
      const applied = await openTailorDialog(this.item);
      if (applied) {
        this.working = foundry.utils.deepClone(getStyleData(this.item) ?? {});
        await this._renderBody();
        this._activate();
      }
    });
  }

  _onValueChange(el) {
    const path = el.dataset.path;
    const control = el.dataset.control;
    let value;
    if (control === "checkbox") value = el.checked ? true : undefined;
    else if (control === "scalar") { const n = Number(el.value); value = el.value === "" || Number.isNaN(n) ? undefined : n; }
    else value = el.value === "" ? undefined : el.value;
    setPath(this.working, path, value);
    this._persist();
    this._refreshPreview();
  }

  _onMultiChange() {
    this.$section.find("[data-multipath]").each((_i, group) => {
      const path = group.dataset.multipath;
      const checked = Array.from(group.querySelectorAll("input[type=checkbox]:checked")).map((c) => c.value);
      setPath(this.working, path, checked.length ? checked : undefined);
    });
    this._persist();
    this._refreshPreview();
  }

  async _onAddMap(path) {
    const sel = this.$section.find(`select.ncsoa-ist-addsel[data-path="${path}"]`);
    const strengthInput = this.$section.find(`input.ncsoa-ist-addstr[data-path="${path}"]`);
    const key = sel.val();
    if (!key) return;
    const strength = Number(strengthInput.val()) || 1;
    const map = getPath(this.working, path) || {};
    map[key] = strength;
    setPath(this.working, path, map);
    this._persist(true);
    await this._renderBody();
    this._activate();
  }

  async _onRemoveMap(path, mapkey) {
    const map = getPath(this.working, path) || {};
    delete map[mapkey];
    setPath(this.working, path, Object.keys(map).length ? map : undefined);
    this._persist(true);
    await this._renderBody();
    this._activate();
  }

  async _onConvert() {
    const converted = styleDataFromAe(this.item);
    if (!converted) { ui.notifications?.warn("No sc.* effects to convert."); return; }
    await this.item.update(
      { [`flags.${MODULE_ID}.${FLAGS.STYLE_DATA}`]: converted },
      { render: false }
    );
    ui.notifications?.info(`Converted ${this.item.name}'s sc.* effects to Style Data. The effects remain but are now ignored.`);
    this.mode = "edit";
    this.scSources = [];
    this.working = converted;
    await this._renderBody();
    this._activate();
  }
}

/**
 * `renderItemSheet` hook handler. Guards on type + system, then injects the tab.
 * Exported for registration in main.mjs.
 */
export function injectItemStyleTab(app, html /*, data */) {
  try {
    const item = app?.item;
    if (!item || !EDITABLE_TYPES.has(item.type) || !isCprActive()) return;
    const $html = html instanceof jQuery ? html : $(html);
    const controller = new ItemStyleTabController(app, $html);
    controller.inject(); // async; fire-and-forget (sheet already rendered)
  } catch (e) {
    console.error(`${MODULE_ID} | Item Style Tab injection failed:`, e);
  }
}
