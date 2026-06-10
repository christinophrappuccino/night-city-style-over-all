/**
 * shops.mjs — seed for the vendor registry (§21.1, M6.6).
 *
 * A Shop is a GM-authored vendor that sells REAL Foundry items — never invented
 * text. Stock comes from two sources, merged and de-duplicated:
 *   · manual — hand-picked item refs (GM drags items onto the shop window);
 *   · query  — a filter resolved against the world's items ("clothing · asiaPop ·
 *     100–1000eb"), so a shop is defined by WHAT IT SELLS, not by enumerating SKUs.
 *
 *   {
 *     id, name, note,
 *     priceModifier: 1.0,                  // shop markup/discount multiplier
 *     stock: {
 *       manual: [{ uuid, name, img }],
 *       query: {                            // null = manual-only shop
 *         types: ["clothing", "gear"],      // item types ([] = any sellable type)
 *         styles: ["asiaPop"],              // CPR clothing styles ([] = any)
 *         priceMin: null, priceMax: null,   // base-price band (eb)
 *         nameContains: "",
 *       } | null,
 *     },
 *   }
 *
 * Display price = base × priceModifier × trend (trends arrive M7 §14.4 — the hook
 * defaults to 1). RollTable generation + portable compendium refs are M8 (§21.5).
 * Ships empty — shops are authored at the table.
 */

export default {
  shops: [],
};
