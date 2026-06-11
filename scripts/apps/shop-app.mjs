/**
 * shop-app.mjs — the Shop browser (M6.6, §21.1): real items, light economy.
 *
 * One window for the whole table:
 *  · Everyone — pick a shop, browse its resolved stock (manual + query, priced
 *    base × shop modifier × trend), and BUY for an actor they own: eurobucks come
 *    off the CPR wealth ledger, the item lands in their inventory (owned).
 *  · GM extra — create/edit/delete shops (dialog form: name, price modifier,
 *    query filters), remove stock refs, and DRAG ITEMS ONTO THE WINDOW from the
 *    sidebar/compendium to add manual stock.
 *
 * Session singleton (same pattern as the GM dashboard — selections survive
 * close/reopen). RollTable generation + portable compendium refs are M8.
 *
 * Spec: SC-Module-Architecture-Guide.md §21.1, §21.5, §14.4 (trend hook).
 */

import { MODULE_ID, STYLE_KEYS } from "../constants.mjs";
import * as cpr from "../data/cpr-adapter.mjs";
import { formatStyleName } from "../engine/recommendations.mjs";
import { getShops, setShops, resolveShopStock, buyFromShop, SELLABLE_TYPES } from "../services/shops.mjs";
import { getTrends, setTrends, toggleTrend, describeTrend, trendDefaults } from "../services/trends.mjs";
import { addEventPost, eventPostFromTemplate } from "../services/garden.mjs";
import { humanize } from "../config/style-tab-schema.mjs";
import { NCSOA_DIALOG } from "./components/register.mjs";

export class ShopApp extends Application {
  constructor(options = {}) {
    super(options);
    this.shopId = null;
    this.buyerId = null;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "ncsoa-shops",
      classes: ["ncsoa", "ncsoa-shops"],
      template: `modules/${MODULE_ID}/templates/shop-browser.hbs`,
      width: 620,
      height: 720,
      resizable: true,
      title: "Night City Shops",
      dragDrop: [{ dropSelector: ".ncsoa-shop-body" }],
    });
  }

  /** Session singleton — selections survive close/reopen (see GMDashboardApp). */
  static _instance = null;

  static open() {
    const app = (this._instance ??= new ShopApp());
    app.render(true);
    if (app.rendered) app.bringToTop();
    return app;
  }

  // ── data ─────────────────────────────────────────────────────────────────────

  _buyerChoices() {
    const isGM = !!game.user?.isGM;
    const actors = (game.actors?.contents ?? []).filter((a) =>
      (a.type === "character" || a.type === "mook") && (isGM ? a.hasPlayerOwner : a.isOwner)
    );
    // GM can also sell to any character actor they own (test dummies, NPCs).
    if (isGM) {
      for (const a of game.actors?.contents ?? []) {
        if (a.type === "character" && !actors.includes(a)) actors.push(a);
      }
    }
    return actors;
  }

  async getData() {
    const isGM = !!game.user?.isGM;
    const shops = getShops();
    const shop = shops.find((s) => s.id === this.shopId) ?? shops[0] ?? null;
    this.shopId = shop?.id ?? null;

    const buyers = this._buyerChoices();
    const buyer = buyers.find((a) => a.id === this.buyerId) ?? buyers[0] ?? null;
    this.buyerId = buyer?.id ?? null;

    const trends = getTrends();
    let stock = [];
    let missingRefs = 0;
    if (shop) {
      const resolved = await resolveShopStock(shop, { trends });
      missingRefs = resolved.missing.length;
      stock = resolved.entries.map(({ item, source, price, trended, trendMult }) => {
        const style = cpr.getClothingStyle(item);
        return {
          uuid: item.uuid,
          name: item.name,
          img: item.img,
          typeLabel: humanize(item.type),
          styleLabel: style ? formatStyleName(style) : null,
          basePrice: cpr.getPrice(item),
          price,
          marked: price !== cpr.getPrice(item),
          trended,
          trendHot: trended && trendMult > 1,
          isManual: source === "manual",
          affordable: buyer ? cpr.getWealth(buyer) >= price : false,
        };
      }).sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    }

    return {
      isGM,
      trends: isGM
        ? trends.map((t) => ({ id: t.id, name: t.name, active: !!t.active, desc: describeTrend(t) }))
        : trends.filter((t) => t.active).map((t) => ({ id: t.id, name: t.name, active: true, desc: describeTrend(t) })),
      hasTrends: isGM ? trends.length > 0 : trends.some((t) => t.active),
      shops: shops.map((s) => ({ id: s.id, name: s.name, selected: s.id === this.shopId })),
      hasShops: shops.length > 0,
      shop: shop && {
        id: shop.id, name: shop.name, note: shop.note,
        priceModifier: shop.priceModifier ?? 1,
        marked: (shop.priceModifier ?? 1) !== 1,
        hasQuery: !!shop.stock?.query,
      },
      buyers: buyers.map((a) => ({ id: a.id, name: a.name, selected: a.id === this.buyerId })),
      buyer: buyer && { id: buyer.id, name: buyer.name, wealth: cpr.getWealth(buyer) },
      stock,
      stockEmpty: stock.length === 0,
      missingRefs,
    };
  }

  // ── GM authoring ─────────────────────────────────────────────────────────────

  /** The shop form (new + edit share it). */
  async _promptShop(existing = null) {
    const q = existing?.stock?.query ?? {};
    const typeBoxes = SELLABLE_TYPES.map((t) =>
      `<label class="ncsoa-shop-check"><input type="checkbox" name="q-type" value="${t}" ${q.types?.includes(t) ? "checked" : ""}/> ${humanize(t)}</label>`
    ).join(" ");
    const styleOpts = STYLE_KEYS.map((s) =>
      `<option value="${s}" ${q.styles?.includes(s) ? "selected" : ""}>${formatStyleName(s)}</option>`
    ).join("");
    const content =
      `<p><label>Name</label><input type="text" name="s-name" value="${existing?.name ?? "New Shop"}" style="width:100%"/></p>` +
      `<p><label>Price modifier (1 = list price)</label><input type="number" step="0.05" min="0" name="s-mod" value="${existing?.priceModifier ?? 1}" style="width:100%"/></p>` +
      `<hr/><p><strong>Stock query</strong> — what this shop sells (leave everything empty for a manual-only shop; drag items onto the window to hand-pick stock).</p>` +
      `<p><label>Item types</label><br/>${typeBoxes}</p>` +
      `<p><label>Clothing styles (ctrl-click for several)</label><select name="q-styles" multiple size="4" style="width:100%">${styleOpts}</select></p>` +
      `<p style="display:flex;gap:8px;"><span style="flex:1"><label>Min base price</label><input type="number" name="q-min" value="${q.priceMin ?? ""}" style="width:100%"/></span>` +
      `<span style="flex:1"><label>Max base price</label><input type="number" name="q-max" value="${q.priceMax ?? ""}" style="width:100%"/></span></p>` +
      `<p><label>Name contains</label><input type="text" name="q-name" value="${q.nameContains ?? ""}" style="width:100%"/></p>`;

    return Dialog.prompt({
      options: NCSOA_DIALOG,
      title: existing ? `Edit ${existing.name}` : "New shop",
      content,
      label: existing ? "Save" : "Create",
      rejectClose: false,
      callback: (html) => {
        const name = html.find("[name='s-name']").val()?.trim();
        if (!name) return null;
        const types = html.find("[name='q-type']:checked").map((_, el) => el.value).get();
        const styles = html.find("[name='q-styles']").val() ?? [];
        const num = (sel) => { const v = html.find(sel).val(); return v === "" || v == null ? null : Number(v); };
        const nameContains = html.find("[name='q-name']").val()?.trim() ?? "";
        const hasQuery = types.length || styles.length || num("[name='q-min']") != null || num("[name='q-max']") != null || nameContains;
        return {
          name,
          priceModifier: Number(html.find("[name='s-mod']").val()) || 1,
          query: hasQuery ? { types, styles, priceMin: num("[name='q-min']"), priceMax: num("[name='q-max']"), nameContains } : null,
        };
      },
    });
  }

  async _newShop() {
    if (!game.user?.isGM) return;
    const form = await this._promptShop();
    if (!form) return;
    const shop = {
      id: foundry.utils.randomID(), name: form.name, note: "",
      priceModifier: form.priceModifier,
      stock: { manual: [], query: form.query },
    };
    await setShops([...getShops(), shop]);
    this.shopId = shop.id;
    this.render(false);
  }

  async _editShop() {
    if (!game.user?.isGM) return;
    const shop = getShops().find((s) => s.id === this.shopId);
    if (!shop) return;
    const form = await this._promptShop(shop);
    if (!form) return;
    await setShops(getShops().map((s) =>
      s.id === shop.id
        ? { ...s, name: form.name, priceModifier: form.priceModifier, stock: { ...s.stock, query: form.query } }
        : s
    ));
    this.render(false);
  }

  async _deleteShop() {
    if (!game.user?.isGM) return;
    const shop = getShops().find((s) => s.id === this.shopId);
    if (!shop) return;
    const ok = await Dialog.confirm({
      options: NCSOA_DIALOG,
      title: "Close shop?",
      content: `<p>Delete <strong>${shop.name}</strong>? Stock references are discarded; the items themselves are untouched.</p>`,
    });
    if (!ok) return;
    await setShops(getShops().filter((s) => s.id !== shop.id));
    this.shopId = null;
    this.render(false);
  }

  async _removeStockRef(uuid) {
    if (!game.user?.isGM) return;
    await setShops(getShops().map((s) =>
      s.id === this.shopId
        ? { ...s, stock: { ...s.stock, manual: (s.stock?.manual ?? []).filter((r) => r.uuid !== uuid) } }
        : s
    ));
    this.render(false);
  }

  /** GM drags an item from the sidebar/compendium onto the window → manual stock. */
  async _onDrop(event) {
    if (!game.user?.isGM) return;
    const data = TextEditor.getDragEventData(event);
    if (data?.type !== "Item" || !data.uuid) return;
    const shop = getShops().find((s) => s.id === this.shopId);
    if (!shop) { ui.notifications?.warn("Create a shop first."); return; }
    const item = await fromUuid(data.uuid).catch(() => null);
    if (!item || !SELLABLE_TYPES.includes(item.type)) {
      ui.notifications?.warn("Shops sell clothing, gear, armor, weapons, and cyberware.");
      return;
    }
    if ((shop.stock?.manual ?? []).some((r) => r.uuid === item.uuid)) return;
    await setShops(getShops().map((s) =>
      s.id === shop.id
        ? { ...s, stock: { ...s.stock, manual: [...(s.stock?.manual ?? []), { uuid: item.uuid, name: item.name, img: item.img }] } }
        : s
    ));
    this.render(false);
  }

  // ── GM trend tools (§14.4) ───────────────────────────────────────────────────

  async _newTrend() {
    if (!game.user?.isGM) return;
    const D = trendDefaults();
    const styleOpts = STYLE_KEYS.map((s) => `<option value="${s}">${formatStyleName(s)}</option>`).join("");
    const form = await Dialog.prompt({
      options: NCSOA_DIALOG,
      title: "New fashion trend",
      content:
        `<p><label>Name</label><input type="text" name="t-name" value="This Week's Look" style="width:100%"/></p>` +
        `<p><label>Wire copy (optional flavor for the announcement)</label><input type="text" name="t-note" style="width:100%"/></p>` +
        `<p style="display:flex;gap:8px;">` +
        `<span style="flex:1"><label>Hot styles (ctrl-click)</label><select name="t-hot" multiple size="4" style="width:100%">${styleOpts}</select></span>` +
        `<span style="flex:1"><label>Cold styles</label><select name="t-cold" multiple size="4" style="width:100%">${styleOpts}</select></span></p>` +
        `<p style="display:flex;gap:8px;">` +
        `<span style="flex:1"><label>Hot ×</label><input type="number" step="0.05" name="t-hotm" value="${D.hotMultiplier}" style="width:100%"/></span>` +
        `<span style="flex:1"><label>Cold ×</label><input type="number" step="0.05" name="t-coldm" value="${D.coldMultiplier}" style="width:100%"/></span></p>`,
      label: "Create (inactive)",
      rejectClose: false,
      callback: (html) => {
        const name = html.find("[name='t-name']").val()?.trim();
        if (!name) return null;
        const hotM = Number(html.find("[name='t-hotm']").val()) || D.hotMultiplier;
        const coldM = Number(html.find("[name='t-coldm']").val()) || D.coldMultiplier;
        const styles = {};
        for (const s of html.find("[name='t-hot']").val() ?? []) styles[s] = hotM;
        for (const s of html.find("[name='t-cold']").val() ?? []) styles[s] = coldM;
        return { name, note: html.find("[name='t-note']").val()?.trim() ?? "", styles };
      },
    });
    if (!form) return;
    await setTrends([...getTrends(), { id: foundry.utils.randomID(), active: false, ...form }]);
    this.render(false);
  }

  async _toggleTrend(id) {
    if (!game.user?.isGM) return;
    const trend = getTrends().find((t) => t.id === id);
    if (!trend) return;
    const next = !trend.active;
    await toggleTrend(id, next); // persists + posts the fashion-wire card
    // The flip also makes The Garden's feed (§21.4).
    const post = eventPostFromTemplate(next ? "trendOn" : "trendOff", { trend: trend.name });
    if (post) await addEventPost(post);
    this.render(false);
  }

  async _deleteTrend(id) {
    if (!game.user?.isGM) return;
    await setTrends(getTrends().filter((t) => t.id !== id));
    this.render(false);
  }

  /** §21.1: one click → a native RollTable whose results POINT AT the shop's real
   *  items (compendium refs portable, world refs world-local). Roll it for stock,
   *  restocks, or loot — every draw yields a real, draggable item. */
  async _generateRollTable() {
    if (!game.user?.isGM) return;
    const shop = getShops().find((s) => s.id === this.shopId);
    if (!shop) return;
    const { entries } = await resolveShopStock(shop, { trends: getTrends() });
    if (!entries.length) { ui.notifications?.warn("Empty shelves — nothing to roll."); return; }

    const results = entries.map(({ item }, i) => ({
      type: item.pack ? CONST.TABLE_RESULT_TYPES.COMPENDIUM : CONST.TABLE_RESULT_TYPES.DOCUMENT,
      documentCollection: item.pack || "Item",
      documentId: item.id,
      text: item.name,
      img: item.img,
      range: [i + 1, i + 1],
      weight: 1,
      drawn: false,
    }));
    const table = await RollTable.create({
      name: `${shop.name} — Stock`,
      description: `Generated from the shop "${shop.name}" (re-generate after changing its stock).`,
      formula: `1d${results.length}`,
      replacement: true,
      results,
    });
    ui.notifications?.info(`RollTable "${table.name}" created — ${results.length} result(s).`);
  }

  // ── buying ───────────────────────────────────────────────────────────────────

  async _buy(uuid, price) {
    const buyer = game.actors?.get(this.buyerId);
    const shop = getShops().find((s) => s.id === this.shopId);
    if (!buyer || !shop) return;
    if (!buyer.isOwner) { ui.notifications?.warn("You don't own that buyer."); return; }
    const item = await fromUuid(uuid).catch(() => null);
    if (!item) { ui.notifications?.warn("That item is no longer available."); return; }

    const ok = await Dialog.confirm({
      options: NCSOA_DIALOG,
      title: "Confirm purchase",
      content: `<p><strong>${buyer.name}</strong> buys <strong>${item.name}</strong> for <strong>€$${price}</strong> at ${shop.name}?</p>`,
    });
    if (!ok) return;

    const result = await buyFromShop({ actor: buyer, item, price: Number(price) || 0, shopName: shop.name });
    if (!result.ok) {
      ui.notifications?.warn(`${buyer.name} is €$${result.shortfall} short.`);
      return;
    }
    ui.notifications?.info(`${buyer.name} bought ${item.name} for €$${price}.`);
    this.render(false);
  }

  // ── listeners ────────────────────────────────────────────────────────────────

  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-control='shop']").on("change", (e) => { this.shopId = e.currentTarget.value; this.render(false); });
    html.find("[data-control='buyer']").on("change", (e) => { this.buyerId = e.currentTarget.value; this.render(false); });
    html.find("[data-action='new-shop']").on("click", () => this._newShop());
    html.find("[data-action='edit-shop']").on("click", () => this._editShop());
    html.find("[data-action='delete-shop']").on("click", () => this._deleteShop());
    html.find("[data-action='remove-ref']").on("click", (e) => this._removeStockRef(e.currentTarget.dataset.uuid));
    html.find("[data-action='buy']").on("click", (e) => this._buy(e.currentTarget.dataset.uuid, e.currentTarget.dataset.price));
    html.find("[data-action='gen-table']").on("click", () => this._generateRollTable());
    html.find("[data-action='new-trend']").on("click", () => this._newTrend());
    html.find("[data-action='toggle-trend']").on("click", (e) => this._toggleTrend(e.currentTarget.dataset.trend));
    html.find("[data-action='delete-trend']").on("click", (e) => this._deleteTrend(e.currentTarget.dataset.trend));
    html.find("[data-action='refresh']").on("click", () => this.render(false));
  }
}
