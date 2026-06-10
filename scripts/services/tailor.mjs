/**
 * tailor.mjs — the tailor / customization flow (M6.7, guide §15.1).
 *
 * Takes a base garment and produces a modified variant: recolor, retailor (fit),
 * add modifications (armored lining → armor; tech integration → built-in
 * fashionware; …), distress (condition), counterfeit-brand (§13.4). Everything
 * writes to `styleData`, so every downstream read updates automatically — the
 * cascade, archetypes, heat, disguise, uniforms all see the change for free.
 *
 * Output is either an edited flag on the SAME item or a duplicated "modified"
 * item (GM's choice, per spec) — the app layer decides; this service is the pure
 * transform + the descriptors the dialog renders from.
 *
 * Modification mechanics live in tunables.tailor.modifications (rule 6 — no
 * hardcoded effects); a modification is applied AT MOST once per garment.
 *
 * Spec: SC-Module-Architecture-Guide.md §15, §15.1, §13.4, §5.2.
 */

import { getTunables } from "../config/tunables.mjs";
import { CURRENT_SCHEMA, FITS, GARMENT_MODIFICATIONS, CONDITIONS } from "../constants.mjs";

/**
 * Apply a set of tailor operations to a styleData blob. Pure — returns a NEW
 * styleData plus a human-readable change list (for the confirmation/report).
 *
 * @param {object|null} styleData  the item's current §5.2 blob (null/undefined = none)
 * @param {object} ops
 * @param {{primary?:string, accent?:string}} [ops.colors]   recolor (§9; display-only until M9)
 * @param {string} [ops.fit]                                 retailor: tailored|offTheRack|oversized
 * @param {string[]} [ops.addModifications]                  §15.1 modification keys
 * @param {string} [ops.condition]                           distress / restore
 * @param {string} [ops.counterfeitBrand]                    stamp a brand the garment doesn't carry
 * @param {object} [tunables]
 * @returns {{styleData: object, changes: string[]}}
 */
export function applyTailorOps(styleData, ops = {}, tunables = getTunables()) {
  const MODS = tunables.tailor.modifications;
  const next = structuredClone(styleData ?? {}); // plain JSON-ish blob — structuredClone is safe
  const changes = [];

  // Recolor — colorway only; icon tinting is the §9 service (M9).
  if (ops.colors?.primary || ops.colors?.accent) {
    next.colors = { ...(next.colors ?? {}) };
    if (ops.colors.primary) next.colors.primary = ops.colors.primary;
    if (ops.colors.accent) next.colors.accent = ops.colors.accent;
    changes.push("recolored");
  }

  // Retailor — fit.
  if (ops.fit && FITS.includes(ops.fit) && ops.fit !== next.fit) {
    next.fit = ops.fit;
    changes.push(`retailored (${ops.fit})`);
  }

  // Modifications — at most once each; mechanical effects merge into styleData.
  const existing = new Set(next.modifications ?? []);
  for (const key of ops.addModifications ?? []) {
    if (!GARMENT_MODIFICATIONS.includes(key) || existing.has(key)) continue;
    existing.add(key);
    const spec = MODS[key];
    const fx = spec?.effects ?? {};
    if (fx.armor) next.armor = (next.armor || 0) + fx.armor;
    if (fx.chrome) {
      next.chrome = { ...(next.chrome ?? {}) };
      for (const [cat, v] of Object.entries(fx.chrome)) next.chrome[cat] = (next.chrome[cat] || 0) + v;
    }
    if (fx.condition && !ops.condition) next.condition = fx.condition;
    changes.push(`+ ${spec?.label ?? key}`);
  }
  if (existing.size) next.modifications = [...existing];

  // Distress / restore — explicit condition wins over modification side-effects.
  if (ops.condition && CONDITIONS.includes(ops.condition) && ops.condition !== next.condition) {
    next.condition = ops.condition;
    changes.push(`condition → ${ops.condition}`);
  }

  // Counterfeit-brand (§13.4): stamp the brand, mark the fake.
  if (ops.counterfeitBrand) {
    next.brand = ops.counterfeitBrand;
    next.authenticity = "counterfeit";
    changes.push(`counterfeit ${ops.counterfeitBrand} stamp`);
  }

  if (changes.length) {
    next.schema = CURRENT_SCHEMA;
    if (!next._source) next._source = "tailored";
  }
  return { styleData: next, changes };
}

/** Dialog descriptors: every modification with its label + a mechanics blurb. */
export function modificationChoices(tunables = getTunables()) {
  const MODS = tunables.tailor.modifications;
  return GARMENT_MODIFICATIONS.map((key) => {
    const spec = MODS[key] ?? { label: key, effects: {} };
    const fx = [];
    if (spec.effects?.armor) fx.push(`+${spec.effects.armor} armor read`);
    for (const [cat, v] of Object.entries(spec.effects?.chrome ?? {})) fx.push(`+${v} ${cat} read`);
    if (spec.effects?.condition) fx.push(`condition → ${spec.effects.condition}`);
    return { key, label: spec.label, mechanics: fx.join(", ") || "flavor (hooks land later)" };
  });
}
