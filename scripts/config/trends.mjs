/**
 * trends.mjs — seed for the fashion-trend registry (§14.4, M7.7).
 *
 * A trend is a GM-driven, time-boxed shift in Night City's fashion meta:
 *
 *   {
 *     id, name, note,
 *     active: false,                  // manual toggle (the resolved open-Q)
 *     styles: { <styleKey>: mult },   // >1 = hot (kabuki-glam everywhere),
 *                                     // <1 = cold (nobody's wearing corpo grey)
 *   }
 *
 * Active trends multiply into shop prices per item style (services/shops.mjs
 * computedPrice trend hook) and are ANNOUNCED in-world as fashion posts when
 * toggled on. Read-weight shifts join the Garden's trending surface (M7.10/M9).
 * Ships empty — trends are table-authored (Shop browser → GM trend tools).
 */

export default {
  trends: [],
};
