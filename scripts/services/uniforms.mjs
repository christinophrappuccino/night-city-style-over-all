/**
 * uniforms.mjs (services) — uniform registry + author-by-example (M6.5, §21.2).
 *
 * The registry lives in the CONFIG_UNIFORMS world setting (GM Config Data tab
 * gives export/reset; form editing arrives M9). Authoring happens by example in
 * the Wardrobe: the GM stages a model look and "Save as uniform" captures BOTH
 * forms at once —
 *   · hard:  the staged pieces as uuid refs (same shape as §14.5 templates, so
 *            "wear the uniform" / NPC-dress reuse applyQuickDress verbatim);
 *   · soft:  the derived signature (engine/uniforms.mjs deriveSoftSignature).
 *
 * Pure helpers + thin setting reads; the engine match itself is engine/uniforms.mjs.
 */

import { SETTINGS } from "../constants.mjs";
import { DataStore } from "../data/data-store.mjs";
import { deriveSoftSignature } from "../engine/uniforms.mjs";
import { snapshotTemplateEntries, applyQuickDress } from "./quick-dress.mjs";

/** All saved uniforms. */
export function getUniforms() {
  return DataStore.get(SETTINGS.CONFIG_UNIFORMS)?.uniforms ?? [];
}

/** Persist the full uniform list (array replaces wholesale — write-safe). */
export function setUniforms(uniforms) {
  return DataStore.set(SETTINGS.CONFIG_UNIFORMS, { uniforms });
}

/**
 * Build a uniform from a staged look's reads (author-by-example). Pure.
 * @param {object} p
 * @param {string} p.id            unique id (foundry.utils.randomID at the call site)
 * @param {string} p.name
 * @param {{type:string,key:string}|null} [p.group]  faction/crew this look belongs to
 * @param {object[]} p.stagedItems the staged item list (what the model wears)
 * @param {object[]} p.realItems   the model's real items (uuid lookup)
 * @param {object} p.reads         computeActorReads() of the staged look
 */
export function buildUniformFromReads({ id, name, group = null, stagedItems, realItems, reads }) {
  return {
    id, name, group, note: "",
    hard: { items: snapshotTemplateEntries(stagedItems, realItems) },
    soft: deriveSoftSignature({
      collected: reads.collected,
      cyberwareData: reads.cyberwareData,
      scMods: reads.scMods,
    }),
  };
}

/** One-click "wear the uniform" — the hard kit through the §14.5 machinery. */
export function wearUniform(actor, uniform) {
  return applyQuickDress(actor, { name: uniform.name, items: uniform.hard?.items ?? [] });
}

/** The uniform registered for a faction/crew key, if any. */
export function uniformForGroup(uniforms, key) {
  return (uniforms ?? []).find((u) => u?.group?.key === key) ?? null;
}
