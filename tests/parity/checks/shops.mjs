/**
 * checks/shops.mjs — M6.6 shop stock + economy core (aggregate; fixture-independent).
 *
 * Verifies services/shops.mjs (the pure parts):
 *  1. matchesQuery — type / style / price-band / name filters, each independently;
 *  2. queryStock + mergeStock — manual wins dedup, query fills the rest;
 *  3. computedPrice — base × shop modifier × trend (rounded, floored at 0);
 *  4. planPurchase — affordability + shortfall math.
 */

import { matchesQuery, queryStock, mergeStock, computedPrice, planPurchase } from "../../../scripts/services/shops.mjs";

const item = (id, { type = "clothing", style = "asiaPop", price = 100, name = `Item ${id}` } = {}) => ({
  id, name, type, uuid: `World.Item.${id}`,
  system: { equipped: "owned", type: "jacket", style, price: { market: price } },
});

export default function shopChecks() {
  const checks = [];

  const kimono = item("kimono", { style: "asiaPop", price: 500, name: "Silk Kimono" });
  const parka = item("parka", { style: "nomadLeathers", price: 80, name: "Dust Parka" });
  const deck = item("deck", { type: "gear", style: null, price: 900, name: "Cyberdeck Case" });
  const skillDoc = { id: "s", name: "Skill", type: "skill", system: {} };
  const pool = [kimono, parka, deck, skillDoc];

  // 1 — each filter axis works independently.
  checks.push({
    name: "shops.matchesQuery — filter axes",
    actual: {
      byType: queryStock(pool, { types: ["gear"] }).map((i) => i.id),
      byStyle: queryStock(pool, { styles: ["asiaPop"] }).map((i) => i.id),
      byBand: queryStock(pool, { priceMin: 100, priceMax: 600 }).map((i) => i.id),
      byName: queryStock(pool, { nameContains: "kim" }).map((i) => i.id),
      anything: queryStock(pool, {}).map((i) => i.id),         // sellable types only
      nullQuery: queryStock(pool, null),
      skillNeverSells: matchesQuery(skillDoc, {}),
    },
    expected: {
      byType: ["deck"],
      byStyle: ["kimono"],
      byBand: ["kimono"],
      byName: ["kimono"],
      anything: ["kimono", "parka", "deck"],
      nullQuery: [],
      skillNeverSells: false,
    },
  });

  // 2 — merge: manual picks win the dedup; query fills the rest.
  const merged = mergeStock([kimono], queryStock(pool, { styles: ["asiaPop", "nomadLeathers"] }));
  checks.push({
    name: "shops.mergeStock — manual wins, query fills",
    actual: merged.map((e) => ({ id: e.item.id, source: e.source })),
    expected: [
      { id: "kimono", source: "manual" },   // present in both → manual entry only
      { id: "parka", source: "query" },
    ],
  });

  // 3 — pricing: base × shop modifier × trend, rounded.
  const boutique = { priceModifier: 1.5 };
  checks.push({
    name: "shops.computedPrice — modifier & trend hook",
    actual: {
      list: computedPrice(100, { priceModifier: 1 }),
      marked: computedPrice(500, boutique),
      trended: computedPrice(100, boutique, 1.2),
      rounded: computedPrice(99, { priceModifier: 1.075 }),
      floored: computedPrice(100, { priceModifier: -2 }),
      defaulted: computedPrice(100, {}),
    },
    expected: { list: 100, marked: 750, trended: 180, rounded: 106, floored: 0, defaulted: 100 },
  });

  // 4 — purchase planning.
  checks.push({
    name: "shops.planPurchase — affordability math",
    actual: {
      ok: planPurchase({ wealth: 1000, price: 750 }),
      broke: planPurchase({ wealth: 100, price: 750 }),
      exact: planPurchase({ wealth: 750, price: 750 }),
    },
    expected: {
      ok: { ok: true, shortfall: 0, newWealth: 250 },
      broke: { ok: false, shortfall: 650, newWealth: 100 },
      exact: { ok: true, shortfall: 0, newWealth: 0 },
    },
  });

  return checks;
}
