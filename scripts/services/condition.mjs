/**
 * condition.mjs (services) — condition-dynamics planning (M7.8, guide §15/§17).
 *
 * Pure: given an HP percentage and the equipped clothing, decide which garments
 * degrade and to what. Degradation only ever WORSENS (pristine → worn →
 * damaged → bloodied); cleaning/repair is the tailor's job (§15.1). Items whose
 * authored condition is already as bad or worse are untouched.
 *
 * The hook layer (hooks/condition-dynamics.mjs) detects the damage and writes
 * the plan via updateStyleData; this file holds the logic so it's node-tested.
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { dualReadStyleData } from "../data/sc-keys.mjs";
import { getTunables } from "../config/tunables.mjs";
import { CONDITIONS } from "../constants.mjs";

/** Severity rank — index in CONDITIONS (pristine 0 … bloodied 3). */
const rank = (condition) => {
  const i = CONDITIONS.indexOf(condition);
  return i === -1 ? 0 : i; // unknown/absent reads as pristine
};

/** The condition a given HP percentage drives gear toward (null = no pressure). */
export function conditionForHpPct(hpPct, tunables = getTunables()) {
  const C = tunables.conditionDynamics;
  if (hpPct <= C.bloodiedAtPct) return "bloodied";
  if (hpPct <= C.wornAtPct) return "worn";
  return null;
}

/**
 * Plan the degradations for a damage event. Pure.
 * @param {object} p
 * @param {number} p.hpPct        the actor's NEW hp percentage
 * @param {object[]} p.items      the actor's items
 * @param {object} [p.tunables]
 * @returns {{item, styleData, from, to}[]} one entry per garment that degrades
 */
export function planConditionDegradation({ hpPct, items, tunables = getTunables() }) {
  const target = conditionForHpPct(hpPct, tunables);
  if (!target) return [];

  const plan = [];
  for (const item of items ?? []) {
    if (item.type !== cpr.ITEM_TYPE.CLOTHING || !cpr.isEquipped(item)) continue;
    const styleData = dualReadStyleData(item).styleData ?? {};
    const current = styleData.condition ?? "pristine";
    if (rank(target) <= rank(current)) continue; // never improves, never repeats
    plan.push({ item, styleData, from: current, to: target });
  }
  return plan;
}
