/**
 * vibes.mjs — the vibe profile aggregation (guide §22.3, M9.1).
 *
 * NEW engine work (no macro reference — §22.5 scheduled the parallel vibe pass
 * for M2/M3 but nothing landed; designed from §22.3–§22.4). Turns the collector's
 * aggregated vibe map (items + brand identities, merged in engine/cascade.mjs)
 * into a TONE PROFILE: ordered radar spokes, the dominant tone set, and a
 * progressive-disclosure descriptor ("cool, faintly menacing" — §22.4 #4).
 *
 * Discipline (§22.4): vibe is a profile with tradeoffs, never a "more is better"
 * score — this module ranks and words tones, it never sums them into a total.
 * It is additive and optional: nothing downstream is load-bearing on it.
 *
 * The nine canonical spokes (constants.VIBE_TAGS, Christian-confirmed v1.6 set)
 * are always present in spoke order (zero-filled) so the §25 radar has a stable
 * shape; custom GM tags that appear in play are appended after them — the set
 * is open vocabulary (§22.3: GM can add/rename in the Config App).
 *
 * Pure: data in, data out. Spec: §22.3, §22.4, §25.1 (radar), §4.1.
 */

import { VIBE_TAGS } from "../constants.mjs";
import { result, component } from "./explain.mjs";
import { humanize } from "../config/style-tab-schema.mjs";

/**
 * Aggregate a vibe map into the tone profile.
 *
 * @param {object} p
 * @param {Record<string, number>} [p.vibe] aggregated tag → points (collectScMods().vibe
 *   or any hypothetical map — the Wardrobe preview path passes staged-set mods)
 * @param {object} [vibeTunables]  tunables.vibe group
 * @param {string[]} [spokeTags]   canonical spoke order (defaults to VIBE_TAGS)
 * @returns explainable result:
 *   value     — { tag: points } (spokes zero-filled, custom tags included)
 *   spokes    — [{ tag, label, value, dominant }] in radar order (custom appended)
 *   dominant  — string[] tones clearing dominantMin within dominantRatio of the top
 *   descriptor— one-liner: "cool, faintly menacing" ("" when no signal)
 */
export function vibeProfile({ vibe = {} } = {}, vibeTunables = {}, spokeTags = VIBE_TAGS) {
  const T = vibeTunables;

  // Canonical spokes first (stable radar shape), then custom tags by weight.
  const custom = Object.keys(vibe)
    .filter((t) => !spokeTags.includes(t))
    .sort((a, b) => (vibe[b] || 0) - (vibe[a] || 0));
  const order = [...spokeTags, ...custom];

  const value = {};
  for (const tag of order) value[tag] = vibe[tag] || 0;

  // Dominance: clear the floor AND hold dominantRatio of the top tone.
  const ranked = order.filter((t) => value[t] > 0).sort((a, b) => value[b] - value[a]);
  const top = ranked.length ? value[ranked[0]] : 0;
  const dominant = ranked.filter((t) => value[t] >= T.dominantMin && value[t] >= top * T.dominantRatio);

  const spokes = order.map((tag) => ({
    tag, label: humanize(tag), value: value[tag], dominant: dominant.includes(tag),
  }));

  // Descriptor (§22.4 #4 progressive disclosure): top N tones, intensity-worded.
  const word = (t) => {
    const v = value[t];
    if (v >= T.strongMin) return `strongly ${humanize(t).toLowerCase()}`;
    if (v <= T.faintMax) return `faintly ${humanize(t).toLowerCase()}`;
    return humanize(t).toLowerCase();
  };
  const named = ranked.slice(0, T.descriptorMax ?? 2);
  const descriptor = named.map(word).join(", ");

  const components = ranked.map((t) => component(`vibe ${humanize(t)}`, value[t], "aggregated set"));

  const label = dominant.length
    ? dominant.map((t) => humanize(t)).join(" · ")
    : ranked.length ? "Faint vibe" : "No vibe read";
  const blurb = descriptor
    ? `Reads ${descriptor}.`
    : "No tone signal — nothing equipped carries a vibe.";

  return {
    ...result({ value, label, blurb, components, tunablesApplied: { "vibe.*": T } }),
    spokes, dominant, descriptor,
  };
}
