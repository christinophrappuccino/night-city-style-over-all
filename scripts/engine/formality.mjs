/**
 * formality.mjs — dress register aggregation (guide §28, M9.1).
 *
 * NEW engine work (no macro reference — §28 scheduled aggregation for M4–M7
 * but only the schema field landed; designed from §28). Aggregates per-item
 * `formality` (0 intimate · 1 casual · 2 street · 3 formal · 4 ceremonial)
 * into the outfit's DRESS REGISTER.
 *
 * Discipline (§28): register is an occasion axis, orthogonal to vibe (you can
 * be elegantly casual or sleazily formal). It powers systems that already
 * exist — scene-gate dress codes, disguise (passing as corpo needs the right
 * register), district fit — it is not a score.
 *
 * Aggregation: weighted mean over the equipped clothing set. An item with no
 * authored formality reads as the default register (§28: absent = street 2);
 * weights are the §29.1 read factors (readPriority × visibility), so in the
 * observed view a gown sealed under a grey coat doesn't set the register —
 * the same factors the styleData aggregation uses (engine/visibility.mjs).
 * Items weighted to 0 drop from numerator AND denominator.
 *
 * Pure: items + tunables in, explainable result out.
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { getStyleData } from "../data/flags.mjs";
import { FORMALITY_LABELS } from "../constants.mjs";
import { result, component } from "./explain.mjs";

const clampRegister = (n) => Math.min(FORMALITY_LABELS.length - 1, Math.max(0, n));

/**
 * Aggregate the equipped set's dress register.
 *
 * @param {object} p
 * @param {object[]} p.items  the actor's items (or a hypothetical set)
 * @param {Record<string, number>} [p.factors] per-item read weights
 *   (engine/visibility.mjs factors, view already chosen). Absent id = 1.
 * @param {object} [formalityTunables] tunables.formality group
 * @returns explainable result:
 *   value    — weighted mean register (float)
 *   register — rounded 0–4
 *   labelKey — FORMALITY_LABELS[register]
 *   counted / authoredCount — how many pieces weighed in / carried the field
 */
export function dressRegister({ items = [], factors } = {}, formalityTunables = {}) {
  const T = formalityTunables;
  const fallback = T.defaultRegister ?? 2;

  const components = [];
  let weighted = 0;
  let totalWeight = 0;
  let counted = 0;
  let authoredCount = 0;

  for (const item of items) {
    if (item.type !== cpr.ITEM_TYPE.CLOTHING || !cpr.isEquipped(item)) continue;
    const weight = factors && factors[item.id] !== undefined ? factors[item.id] : 1;
    if (weight === 0) continue; // fully covered — doesn't set the register
    const sd = getStyleData(item) ?? {};
    const authored = Number.isFinite(sd.formality);
    const reg = authored ? clampRegister(sd.formality) : fallback;
    weighted += reg * weight;
    totalWeight += weight;
    counted += 1;
    if (authored) authoredCount += 1;
    components.push(component(
      `${item.name} · ${FORMALITY_LABELS[reg]}`, reg,
      `${authored ? "authored" : "default"}${weight !== 1 ? ` · weight ${Math.round(weight * 100) / 100}` : ""}`
    ));
  }

  const value = totalWeight > 0 ? weighted / totalWeight : fallback;
  const register = clampRegister(Math.round(value));
  const labelKey = FORMALITY_LABELS[register];

  const blurb = counted === 0
    ? `Nothing worn sets a register — reads ${FORMALITY_LABELS[fallback]} by default.`
    : authoredCount === 0
      ? `No piece authors a register — the outfit defaults to ${labelKey}.`
      : `The outfit registers as ${labelKey} (${Math.round(value * 100) / 100}).`;

  return {
    ...result({ value, label: labelKey, blurb, components, tunablesApplied: { "formality.*": T } }),
    register, labelKey, counted, authoredCount,
  };
}

/**
 * Register distance vs a requirement — the shared mismatch math for gates,
 * disguise, and district fit (§28).
 * @param {object} p
 * @param {number} p.register  the outfit's register (0–4)
 * @param {number} p.required  the required/target register
 * @param {number} [p.tolerance] steps of slack before it counts
 * @returns {{ distance:number, steps:number, ok:boolean }} steps = distance
 *   beyond tolerance (what penalties scale on)
 */
export function registerMismatch({ register, required, tolerance = 0 }) {
  const distance = Math.abs(register - required);
  const steps = Math.max(0, distance - tolerance);
  return { distance, steps, ok: steps === 0 };
}
