/**
 * checks/formality.mjs — M9.1 dress register (aggregate; fixture-independent).
 *
 * NEW engine work (no macro reference — §28 scheduled aggregation + gate/disguise
 * consumption for M4–M7 but only the schema field landed). Verifies:
 *  1. weighted-mean aggregation with the §28 default (absent = street 2);
 *  2. read-factor interplay — a covered gown doesn't set the observed register;
 *  3. empty set defaults honestly;
 *  4. registerMismatch distance/tolerance math;
 *  5. evaluateGate dress code — two-sided target (yellow/red bands) + floor;
 *  6. applyFormalityToDisguise — per-step penalty, clamped, no-op without an
 *     expectation.
 */

import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";
import { dressRegister, registerMismatch } from "../../../scripts/engine/formality.mjs";
import { applyFormalityToDisguise } from "../../../scripts/engine/disguise.mjs";
import { evaluateGate } from "../../../scripts/engine/scene-gate.mjs";

const MODULE_ID = "night-city-style-over-all";
const FORM_T = TUNABLES_DEFAULTS.formality;

let nextId = 0;
function mockClothing(styleData, name = "Piece") {
  return {
    id: `form-mock-${nextId++}`, name, type: "clothing", img: null,
    system: { equipped: "equipped" }, effects: [],
    flags: styleData !== undefined ? { [MODULE_ID]: { styleData } } : {},
  };
}

/** Minimal gate tokenData that trips no other criterion. */
function gateToken(register) {
  return {
    styleScore: 100, tier: { number: 5, grade: "A" }, styles: {},
    weapons: { visible: [], concealed: [] }, visibleChromeCount: 0,
    archetypes: [], socialStats: { cool: 10, personalGrooming: 10, wardrobeAndStyle: 10, reputation: 10 },
    formality: { register },
  };
}

export default function formalityChecks() {
  const checks = [];

  // 1 — weighted mean with the street default: gown 4 + heels 3 + untagged (2)
  //     → (4+3+2)/3 = 3.0 → Formal.
  const gown = mockClothing({ formality: 4 }, "Brass Lotus Gown");
  const heels = mockClothing({ formality: 3 }, "Gilded Thorn Heels");
  const plain = mockClothing({}, "Plain Tee");
  const formal = dressRegister({ items: [gown, heels, plain] }, FORM_T);
  checks.push({
    name: "formality.dressRegister — weighted mean, absent reads street (§28)",
    actual: { value: formal.value, register: formal.register, label: formal.labelKey, counted: formal.counted, authored: formal.authoredCount },
    expected: { value: 3, register: 3, label: "Formal", counted: 3, authored: 2 },
  });

  // 2 — read factors: the gown sealed under a coat (factor 0) drops from the
  //     observed register entirely → (3+2)/2 = 2.5.
  const observed = dressRegister({ items: [gown, heels, plain], factors: { [gown.id]: 0 } }, FORM_T);
  checks.push({
    name: "formality.dressRegister — covered gown doesn't set the observed register",
    actual: { value: observed.value, counted: observed.counted },
    expected: { value: 2.5, counted: 2 },
  });

  // 3 — nothing worn: defaults to street, says so.
  const naked = dressRegister({ items: [] }, FORM_T);
  checks.push({
    name: "formality.dressRegister — empty set defaults to street",
    actual: { value: naked.value, register: naked.register, counted: naked.counted },
    expected: { value: 2, register: 2, counted: 0 },
  });

  // 4 — mismatch math.
  checks.push({
    name: "formality.registerMismatch — distance, tolerance, ok",
    actual: {
      hard: registerMismatch({ register: 1, required: 3 }),
      slack: registerMismatch({ register: 1, required: 3, tolerance: 1 }),
      exact: registerMismatch({ register: 3, required: 3 }),
    },
    expected: {
      hard: { distance: 2, steps: 2, ok: false },
      slack: { distance: 2, steps: 1, ok: false },
      exact: { distance: 0, steps: 0, ok: true },
    },
  });

  // 5 — gate dress code (target 3 · Formal): street reads yellow, casual reads
  //     red, formal passes green; the one-sided floor flags red below it.
  const gate = (register, criteria) => evaluateGate({
    tokenData: gateToken(register), criteria, factions: null, tunables: TUNABLES_DEFAULTS,
  });
  checks.push({
    name: "formality.evaluateGate — two-sided dress code + one-sided floor",
    actual: {
      pass: gate(3, { formality: 3 }).status,
      slight: gate(2, { formality: 3 }).status,
      bad: gate(1, { formality: 3 }).status,
      overdressed: gate(4, { formality: 2 }).status,
      floor: gate(1, { minFormality: 2 }).status,
    },
    expected: { pass: "green", slight: "yellow", bad: "red", overdressed: "red", floor: "red" },
  });

  // 6 — disguise hook: 2 steps off the corpo expectation × 12 = −24, re-banded;
  //     no expectation → untouched.
  const hit = applyFormalityToDisguise({ confidence: 70, label: "CONVINCING", register: 1, expectedRegister: 3, tunables: TUNABLES_DEFAULTS });
  const noop = applyFormalityToDisguise({ confidence: 70, label: "CONVINCING", register: 1, tunables: TUNABLES_DEFAULTS });
  checks.push({
    name: "formality.applyFormalityToDisguise — per-step penalty + no-op",
    actual: {
      confidence: hit.confidence, penalty: hit.formalityPenalty, steps: hit.steps, applied: hit.applied,
      noopConfidence: noop.confidence, noopApplied: noop.applied,
    },
    expected: { confidence: 46, penalty: 24, steps: 2, applied: true, noopConfidence: 70, noopApplied: false },
  });

  return checks;
}
