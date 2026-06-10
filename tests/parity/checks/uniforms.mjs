/**
 * checks/uniforms.mjs — M6.5 soft-uniform recognition (aggregate; fixture-independent).
 *
 * NEW engine work (no macro reference — §21.5 scheduled it for M2 but nothing
 * landed; designed from §21.2). Verifies engine/uniforms.mjs + the disguise hook:
 *  1. matchSoftUniform — hand-computed full / partial / none grading;
 *  2. underdressed gate — matching pieces below minPieces scale the match down;
 *  3. author-by-example round trip — a look matches its own derived signature FULL;
 *  4. bestUniformMatch — strongest non-none wins; hard-only uniforms are invisible;
 *  5. applyUniformToDisguise — graded bonus + re-band; no-op on "none".
 */

import { matchSoftUniform, bestUniformMatch, deriveSoftSignature } from "../../../scripts/engine/uniforms.mjs";
import { applyUniformToDisguise } from "../../../scripts/engine/disguise.mjs";

const cyber = (visible = 0) => ({
  visible_chrome: Array.from({ length: visible }, (_, i) => ({ name: `chrome${i}` })),
  fashionware: [], bioware: [], borgware: [],
});

const SIGNATURE = {
  styles: { asiaPop: 0.5, urbanFlash: 0.25 },
  chrome: ["visible_chrome"],
  factionGear: ["tyger_claws"],
  minPieces: 2,
};

export default function uniformChecks() {
  const checks = [];

  // 1 — full match: shares meet the lean, chrome present, strong gear signal.
  //     styles 1.0·0.6 + chrome 1.0·0.25 + gear (25/25)·0.15 = 1.0 → 100.
  const fullLook = {
    collected: { styles: { asiaPop: 2, urbanFlash: 1, genericChic: 1 } },
    cyberwareData: cyber(1),
    scMods: { factions: { tyger_claws: 25 } },
  };
  const full = matchSoftUniform({ ...fullLook, signature: SIGNATURE });
  checks.push({
    name: "uniforms.matchSoftUniform — full match",
    actual: { value: full.value, grade: full.grade },
    expected: { value: 100, grade: "full" },
  });

  // 1b — partial: quarter style lean + chrome, no gear signal.
  //      styles (0.25/0.75)·0.6 + chrome 1·0.25 + gear 0 = 0.45 → 45 partial.
  const partial = matchSoftUniform({
    collected: { styles: { asiaPop: 1, genericChic: 3 } },
    cyberwareData: cyber(1),
    scMods: null,
    signature: SIGNATURE,
  });
  checks.push({
    name: "uniforms.matchSoftUniform — partial match",
    actual: { value: partial.value, grade: partial.grade },
    expected: { value: 45, grade: "partial" },
  });

  // 1c — none: wrong styles, no chrome, no gear → 0.45·0.6·(1/3)… compute: styles
  //      (0.25/0.75)=1/3 ·0.6 = 0.2 → 20 → none.
  const none = matchSoftUniform({
    collected: { styles: { asiaPop: 1, genericChic: 3 } },
    cyberwareData: cyber(0),
    scMods: null,
    signature: SIGNATURE,
  });
  checks.push({
    name: "uniforms.matchSoftUniform — no match",
    actual: { value: none.value, grade: none.grade },
    expected: { value: 20, grade: "none" },
  });

  // 2 — underdressed: one perfect piece vs minPieces 2 halves the match.
  //     styles (0.5/0.75)·0.6 + 0.25 + 0.15 = 0.8 → ×0.5 → 40 partial.
  const under = matchSoftUniform({
    collected: { styles: { asiaPop: 1 } },
    cyberwareData: cyber(1),
    scMods: { factions: { tyger_claws: 25 } },
    signature: SIGNATURE,
  });
  checks.push({
    name: "uniforms.matchSoftUniform — underdressed gate",
    actual: { value: under.value, grade: under.grade },
    expected: { value: 40, grade: "partial" },
  });

  // 3 — author-by-example round trip: a look matches its own derived signature FULL.
  const derived = deriveSoftSignature(fullLook);
  const roundTrip = matchSoftUniform({ ...fullLook, signature: derived });
  checks.push({
    name: "uniforms.derive round trip — model look matches its own signature FULL",
    actual: {
      grade: roundTrip.grade,
      styles: derived.styles,
      chrome: derived.chrome,
      factionGear: derived.factionGear,
      minPieces: derived.minPieces,
    },
    expected: {
      grade: "full",
      styles: { asiaPop: 0.5, urbanFlash: 0.25, genericChic: 0.25 },
      chrome: ["visible_chrome"],
      factionGear: ["tyger_claws"],
      minPieces: 2,
    },
  });

  // 4 — registry: strongest non-none wins; hard-only uniforms can't be recognized.
  const registry = [
    { id: "h", name: "Hard Only", hard: { items: [] } },               // no soft → invisible
    { id: "w", name: "Weak", soft: { styles: { genericChic: 0.9 } } }, // poor fit
    { id: "s", name: "Tyger Look", soft: SIGNATURE },
  ];
  const best = bestUniformMatch({ uniforms: registry, ...fullLook });
  checks.push({
    name: "uniforms.bestUniformMatch — strongest soft match wins",
    actual: { id: best.uniform.id, grade: best.match.grade },
    expected: { id: "s", grade: "full" },
  });

  // 5 — disguise hook: full grade adds +15 and re-bands (50 → 65 ≥ convincing 60).
  const boosted = applyUniformToDisguise({ confidence: 50, label: "PASSABLE", uniformMatch: full });
  const untouched = applyUniformToDisguise({ confidence: 50, label: "PASSABLE", uniformMatch: none });
  checks.push({
    name: "uniforms.applyUniformToDisguise — graded bonus + re-band, no-op on none",
    actual: {
      conf: boosted.confidence, label: boosted.label, applied: boosted.applied,
      noopConf: untouched.confidence, noopApplied: untouched.applied,
    },
    expected: { conf: 65, label: "CONVINCING", applied: true, noopConf: 50, noopApplied: false },
  });

  return checks;
}
