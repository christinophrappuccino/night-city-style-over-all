/**
 * uniforms.mjs — soft-uniform signature matching (M6.5, guide §21.2).
 *
 * "A character wearing the look is identified as belonging to that group." The
 * soft signature is a style lean + visible-chrome expectation + authored
 * faction-gear keys; ANY gear satisfying it matches — improvised pieces included.
 * The match is GRADED (full / partial / none) and explainable.
 *
 * NEW engine work — no macro reference (the §21.5 schedule put this in M2, but
 * nothing landed; designed from §21.2 here). Color and brand axes join the
 * signature in M9 (§9.2, §13); the schema reserves them.
 *
 * Pure: decomposed inputs (collected/cyberwareData/scMods) in, explainable result
 * out. Tunables: `uniforms` group.
 *
 * Spec: SC-Module-Architecture-Guide.md §21.2, §21.5, §4.1, §19.
 */

import { getTunables } from "../config/tunables.mjs";
import { result, component } from "./explain.mjs";

const round = Math.round;

/** Chrome categories a soft signature may expect (visible, readable ones). */
export const SIGNATURE_CHROME_CATS = ["visible_chrome", "fashionware", "bioware", "borgware"];

/**
 * Grade one actor's look against one soft signature.
 *
 * Components (each 0–1, weighted then renormalized over the ones the signature
 * actually defines — a styles-only signature is judged on styles alone):
 *  · styles      — Σ min(wearer's share, expected weight) / Σ expected weights
 *  · chrome      — fraction of expected visible-chrome categories present
 *  · factionGear — strongest authored faction signal vs factionGearFullValue
 * An underdressed wearer (fewer styled pieces than minPieces) scales the whole
 * match down proportionally — two matching pieces don't make a uniform.
 *
 * @param {object} p
 * @param {object} p.collected      collect() output (styles distribution)
 * @param {object} p.cyberwareData  analyzeCyberware() output
 * @param {object} [p.scMods]       collectScMods() output (factions map)
 * @param {object} p.signature      uniform.soft {styles, chrome, factionGear, minPieces}
 * @param {object} [p.tunables]
 * @returns explainable { value: 0–100, grade: "full"|"partial"|"none", label, blurb,
 *   components, tunablesApplied }
 */
export function matchSoftUniform({ collected, cyberwareData, scMods = null, signature, tunables = getTunables() }) {
  const U = tunables.uniforms;
  const sig = signature ?? {};
  const components = [];
  const parts = []; // [{key, score 0–1, weight}]

  const styleCounts = collected?.styles ?? {};
  const totalPieces = Object.values(styleCounts).reduce((a, b) => a + b, 0);

  // ── styles ──────────────────────────────────────────────────────────────────
  const sigStyles = Object.entries(sig.styles ?? {}).filter(([, w]) => w > 0);
  if (sigStyles.length) {
    const totalWeight = sigStyles.reduce((a, [, w]) => a + w, 0);
    let matched = 0;
    for (const [styleKey, weight] of sigStyles) {
      const share = totalPieces > 0 ? (styleCounts[styleKey] || 0) / totalPieces : 0;
      const got = Math.min(share, weight);
      matched += got;
      if (got > 0) components.push(component(`style ${styleKey}`, round((got / totalWeight) * 100) / 100, "soft signature"));
    }
    parts.push({ key: "styles", score: totalWeight > 0 ? matched / totalWeight : 0, weight: U.weights.styles });
  }

  // ── visible chrome ──────────────────────────────────────────────────────────
  const sigChrome = (sig.chrome ?? []).filter((c) => SIGNATURE_CHROME_CATS.includes(c));
  if (sigChrome.length) {
    let present = 0;
    for (const cat of sigChrome) {
      if ((cyberwareData?.[cat]?.length ?? 0) > 0) {
        present++;
        components.push(component(`chrome ${cat}`, 1, "soft signature"));
      }
    }
    parts.push({ key: "chrome", score: present / sigChrome.length, weight: U.weights.chrome });
  }

  // ── authored faction-gear signals ───────────────────────────────────────────
  const gearKeys = sig.factionGear ?? [];
  if (gearKeys.length) {
    const strongest = Math.max(0, ...gearKeys.map((k) => scMods?.factions?.[k] || 0));
    const score = Math.min(1, strongest / U.factionGearFullValue);
    if (score > 0) components.push(component("faction gear", round(score * 100) / 100, "authored signal"));
    parts.push({ key: "factionGear", score, weight: U.weights.factionGear });
  }

  // ── combine (renormalize over defined components) ───────────────────────────
  const weightSum = parts.reduce((a, p) => a + p.weight, 0);
  let combined = weightSum > 0 ? parts.reduce((a, p) => a + p.score * p.weight, 0) / weightSum : 0;

  // Underdressed gate: fewer styled pieces than the signature expects scales down.
  const minPieces = sig.minPieces ?? 0;
  if (minPieces > 0 && totalPieces < minPieces) {
    const factor = totalPieces / minPieces;
    combined *= factor;
    components.push(component("underdressed", round(factor * 100) / 100, `${totalPieces}/${minPieces} pieces`));
  }

  const value = Math.max(0, Math.min(100, round(combined * 100)));
  const grade = value >= U.grades.full ? "full" : value >= U.grades.partial ? "partial" : "none";
  const label = grade === "full" ? "FULL MATCH" : grade === "partial" ? "PARTIAL MATCH" : "NO MATCH";

  return {
    ...result({
      value, label,
      blurb: grade === "none" ? "The look doesn't read as this group." : `Reads as the group's look (${value}%).`,
      components,
      tunablesApplied: { "uniforms.weights": U.weights, "uniforms.grades": U.grades, "uniforms.factionGearFullValue": U.factionGearFullValue },
    }),
    grade,
  };
}

/**
 * Best uniform match across a registry. Uniforms without a soft signature are
 * recognition-invisible (hard-only kits don't read).
 * @returns {{uniform, match}|null} the strongest non-"none" match, or null
 */
export function bestUniformMatch({ uniforms, collected, cyberwareData, scMods = null, tunables = getTunables() }) {
  let best = null;
  for (const uniform of uniforms ?? []) {
    if (!uniform?.soft) continue;
    const match = matchSoftUniform({ collected, cyberwareData, scMods, signature: uniform.soft, tunables });
    if (match.grade === "none") continue;
    if (!best || match.value > best.match.value) best = { uniform, match };
  }
  return best;
}

/**
 * Author-by-example: derive a soft signature from a look's engine reads (the GM
 * dresses a model; this captures what the look IS). By construction the deriving
 * look matches its own signature at FULL.
 *
 * @param {object} p
 * @param {object} p.collected      collect() of the model look
 * @param {object} p.cyberwareData  analyzeCyberware() of the model
 * @param {object} [p.scMods]       collectScMods() of the model
 * @param {object} [p.tunables]
 * @returns {{styles, chrome, factionGear, minPieces}}
 */
export function deriveSoftSignature({ collected, cyberwareData, scMods = null, tunables = getTunables() }) {
  const D = tunables.uniforms.derive;
  const styleCounts = collected?.styles ?? {};
  const totalPieces = Object.values(styleCounts).reduce((a, b) => a + b, 0);

  const styles = {};
  for (const [key, count] of Object.entries(styleCounts)) {
    const share = totalPieces > 0 ? count / totalPieces : 0;
    if (share >= D.styleThreshold) styles[key] = round(share * 100) / 100;
  }

  const chrome = SIGNATURE_CHROME_CATS.filter((cat) => (cyberwareData?.[cat]?.length ?? 0) > 0);
  const factionGear = Object.entries(scMods?.factions ?? {})
    .filter(([, v]) => v > 0)
    .map(([k]) => k);

  return {
    styles,
    chrome,
    factionGear,
    minPieces: Math.max(D.minPiecesFloor, round(totalPieces * D.minPiecesRatio)),
  };
}
