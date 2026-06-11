/**
 * headline.mjs — the §25.2 headline read (M9.3): one plain-language line.
 *
 * "Cool, faintly menacing — reads Solo. Running hot, at home in Watson."
 *
 * A COMPOSITION, not a metric: it words already-computed (and already
 * explainable) reads — the vibe descriptor, the top archetype, the heat band,
 * the best district — into the new-player on-ramp line at the top of the
 * Style Profile. No math happens here, so there are no tunables; the phrase
 * maps are content copy (like the fixer comments), which stays inline in the
 * engine by convention.
 *
 * Pure: data in, data out. Spec: SC-Module-Architecture-Guide.md §25.2, §4.1
 */

/** Heat band → prose. Keys are the engine's heat.level vocabulary. */
const HEAT_PHRASE = {
  COLD: "barely any heat",
  WARM: "a little heat",
  HOT: "running hot",
  BLAZING: "blazing hot",
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * Compose the headline line from the pipeline's reads.
 *
 * @param {object} p
 * @param {object} [p.vibes]       vibeProfile result (descriptor used)
 * @param {object[]} [p.archetypes] detectAllArchetypes output (top read used)
 * @param {object} [p.heat]        heatIndex result (level used)
 * @param {string} [p.districtName] best-fitting district, if the caller ranked one
 * @returns {{ text:string, hasSignal:boolean, parts:{tone,readsAs,heat,fit} }}
 */
export function composeHeadline({ vibes, archetypes, heat, districtName = null } = {}) {
  const tone = vibes?.descriptor || "";
  const top = archetypes?.[0];
  const readsAs = top && top.key && top.key !== "unknown" ? (top.label || top.key) : null;
  const heatPhrase = HEAT_PHRASE[heat?.level] ?? "";
  const fit = districtName ? `at home in ${districtName}` : "";

  const hasSignal = !!(tone || readsAs);
  if (!hasSignal) {
    return {
      text: "No read yet — nothing equipped is saying anything.",
      hasSignal: false,
      parts: { tone: "", readsAs: "", heat: heatPhrase, fit: "" },
    };
  }

  // "Tone — reads X." / "Reads X." / "Tone — no clear read."
  const first = tone
    ? `${capitalize(tone)} — ${readsAs ? `reads ${readsAs}` : "no clear read"}.`
    : `Reads ${readsAs}.`;
  // "Running hot, at home in Watson." / "Running hot." / "At home in Watson."
  const second = [heatPhrase, fit].filter(Boolean).join(", ");

  return {
    text: second ? `${first} ${capitalize(second)}.` : first,
    hasSignal: true,
    parts: { tone, readsAs: readsAs ?? "", heat: heatPhrase, fit },
  };
}
