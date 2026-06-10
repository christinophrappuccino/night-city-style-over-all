/**
 * shops.mjs (services) — vendor stock resolution + the buy flow (M6.6, §21.1).
 *
 * Pure core (node-tested): query matching, stock merge/dedup, price computation,
 * purchase planning. Thin async edges: manual-ref resolution (fromUuid) and the
 * actual purchase (wealth ledger via the adapter + ONE embedded-document create).
 *
 * Prices: base × shop.priceModifier × trend. The trend multiplier is the §14.4
 * hook — it defaults to 1 until the Trends system lands (M7).
 *
 * Spec: SC-Module-Architecture-Guide.md §21.1, §21.5 (M6), §14.4.
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { SETTINGS } from "../constants.mjs";
import { DataStore } from "../data/data-store.mjs";
import { trendMultiplier } from "./trends.mjs";

/** Item types a shop may sell (quick-dress/wardrobe-adjacent inventory). */
export const SELLABLE_TYPES = ["clothing", "gear", "armor", "weapon", "cyberware", "item"];

// ── registry ─────────────────────────────────────────────────────────────────

export function getShops() {
  return DataStore.get(SETTINGS.CONFIG_SHOPS)?.shops ?? [];
}

/** Persist the full shop list (array replaces wholesale — write-safe). */
export function setShops(shops) {
  return DataStore.set(SETTINGS.CONFIG_SHOPS, { shops });
}

// ── pure core ────────────────────────────────────────────────────────────────

/** Does an item satisfy a shop query? (null/empty query fields = no constraint) */
export function matchesQuery(item, query) {
  if (!query) return false;
  if (!SELLABLE_TYPES.includes(item.type)) return false;
  if (query.types?.length && !query.types.includes(item.type)) return false;
  if (query.styles?.length) {
    const style = cpr.getClothingStyle(item);
    if (!style || !query.styles.includes(style)) return false;
  }
  const price = cpr.getPrice(item);
  if (query.priceMin != null && price < query.priceMin) return false;
  if (query.priceMax != null && price > query.priceMax) return false;
  if (query.nameContains && !item.name?.toLowerCase().includes(query.nameContains.toLowerCase())) return false;
  return true;
}

/** Resolve a shop query against an item pool. */
export function queryStock(items, query) {
  if (!query) return [];
  return (items ?? []).filter((i) => matchesQuery(i, query));
}

/** Merge manual + queried stock, de-duplicated (manual wins; uuid/id identity). */
export function mergeStock(manualItems, queriedItems) {
  const out = [];
  const seen = new Set();
  for (const item of manualItems ?? []) {
    const key = item.uuid ?? item.id;
    if (item && !seen.has(key)) { seen.add(key); out.push({ item, source: "manual" }); }
  }
  for (const item of queriedItems ?? []) {
    const key = item.uuid ?? item.id;
    if (!seen.has(key)) { seen.add(key); out.push({ item, source: "query" }); }
  }
  return out;
}

/** Display price: base × shop modifier × trend (§14.4 hook; trend lands M7). */
export function computedPrice(basePrice, shop, trendModifier = 1) {
  return Math.max(0, Math.round((basePrice || 0) * (shop?.priceModifier ?? 1) * trendModifier));
}

/** Can the buyer afford it? Pure. */
export function planPurchase({ wealth, price }) {
  const ok = wealth >= price;
  return { ok, shortfall: ok ? 0 : price - wealth, newWealth: ok ? wealth - price : wealth };
}

// ── async edges ──────────────────────────────────────────────────────────────

/**
 * Resolve a shop's full stock: manual refs via fromUuid + the query against the
 * world's items, merged/deduped, each entry priced. Active fashion trends (§14.4)
 * multiply per item style — pass `trends` (getTrends()) or a flat override.
 * @returns {Promise<{entries: {item, source, price, trended}[], missing: object[]}>}
 */
export async function resolveShopStock(shop, { worldItems, trends = null } = {}) {
  const pool = worldItems ?? game.items?.contents ?? [];
  const manual = [];
  const missing = [];
  for (const ref of shop?.stock?.manual ?? []) {
    const item = await fromUuid(ref.uuid).catch(() => null);
    if (item) manual.push(item);
    else missing.push(ref);
  }
  const entries = mergeStock(manual, queryStock(pool, shop?.stock?.query)).map((e) => {
    const trendMult = trendMultiplier(cpr.getClothingStyle(e.item), trends ?? []);
    return {
      ...e,
      price: computedPrice(cpr.getPrice(e.item), shop, trendMult),
      trended: trendMult !== 1,
      trendMult,
    };
  });
  return { entries, missing };
}

/**
 * Purchase: deduct eurobucks (CPR wealth ledger) and hand over a copy of the
 * item (owned, not equipped). Refuses politely when the buyer can't pay.
 * @returns {Promise<{ok: boolean, shortfall?: number}>}
 */
export async function buyFromShop({ actor, item, price, shopName = "shop" }) {
  const plan = planPurchase({ wealth: cpr.getWealth(actor), price });
  if (!plan.ok) return { ok: false, shortfall: plan.shortfall };

  const data = item.toObject();
  delete data._id;
  data.system = { ...data.system, equipped: cpr.EQUIP.OWNED };

  await cpr.spendWealth(actor, price, `Purchase: ${item.name} (${shopName})`);
  await actor.createEmbeddedDocuments("Item", [data]);
  return { ok: true };
}
