/**
 * checks/faction-matrix.mjs — M9.3e: the §14.7 rivalry editor's pure core
 * (aggregate; fixture-independent).
 *
 * NEW work (no macro reference — designed from §14.7). The tension scanner
 * fires when EITHER side's `rivals` names the other, so the editor works in
 * symmetric pairs. These checks pin:
 *  1. pair listing — one-sided legacy entries dedupe to ONE pair; stale keys
 *     (rivals naming a faction that no longer exists) are skipped;
 *  2. setRivalry on — BOTH sides gain the entry; input is never mutated;
 *  3. setRivalry off — BOTH sides lose it (even a one-sided legacy rivalry);
 *  4. guards — self-pairs and unknown keys are no-ops;
 *  5. the seeds round-trip — every seed rivalry survives pairs() and areRivals.
 */

import { rivalryPairs, areRivals, setRivalry } from "../../../scripts/services/faction-matrix.mjs";
import FACTIONS_CONFIG from "../../../scripts/config/factions.mjs";

const SAMPLE = {
  ncpd: { label: "NCPD", rivals: ["maelstrom"] },          // one-sided
  maelstrom: { label: "Maelstrom", rivals: [] },
  tygers: { label: "Tyger Claws", rivals: ["valentinos"] },
  valentinos: { label: "Valentinos", rivals: ["tygers"] },  // two-sided (same pair)
  ghosts: { label: "Ghosts", rivals: ["noSuchGang"] },      // stale key
};

export default function factionMatrixChecks() {
  const checks = [];

  // 1 — dedupe + stale-key skip.
  const pairs = rivalryPairs(SAMPLE);
  checks.push({
    name: "matrix.pairs — one-sided and two-sided both list ONCE; stale keys skipped",
    actual: { count: pairs.length, pairs: pairs.map((p) => `${p.aKey}~${p.bKey}`) },
    expected: { count: 2, pairs: ["maelstrom~ncpd", "tygers~valentinos"] },
  });

  // 2 — symmetric ON, immutably.
  const on = setRivalry(SAMPLE, "maelstrom", "tygers", true);
  checks.push({
    name: "matrix.set on — both sides gain the rivalry; the input blob is untouched",
    actual: {
      a: on.maelstrom.rivals, b: on.tygers.rivals,
      inputA: SAMPLE.maelstrom.rivals.length, nowRivals: areRivals(on, "tygers", "maelstrom"),
    },
    expected: { a: ["tygers"], b: ["maelstrom", "valentinos"], inputA: 0, nowRivals: true },
  });

  // 3 — symmetric OFF clears even a one-sided legacy entry.
  const off = setRivalry(SAMPLE, "maelstrom", "ncpd", false);
  checks.push({
    name: "matrix.set off — clears BOTH sides (one-sided legacy included)",
    actual: { ncpd: off.ncpd.rivals, was: areRivals(SAMPLE, "ncpd", "maelstrom"), now: areRivals(off, "ncpd", "maelstrom") },
    expected: { ncpd: [], was: true, now: false },
  });

  // 4 — guards.
  checks.push({
    name: "matrix.set — self-pairs and unknown keys are no-ops (same reference back)",
    actual: {
      self: setRivalry(SAMPLE, "ncpd", "ncpd", true) === SAMPLE,
      unknown: setRivalry(SAMPLE, "ncpd", "noSuchGang", true) === SAMPLE,
    },
    expected: { self: true, unknown: true },
  });

  // 5 — the live seeds round-trip: every authored rivalry shows as a pair.
  const FACTIONS = FACTIONS_CONFIG.FACTIONS;
  const seedPairs = rivalryPairs(FACTIONS);
  const everyAuthoredCovered = Object.entries(FACTIONS).every(([key, f]) =>
    (f.rivals ?? []).every((r) => !FACTIONS[r] || areRivals(FACTIONS, key, r))
  );
  checks.push({
    name: "matrix.seeds — every authored seed rivalry is a listed, live pair",
    actual: { covered: everyAuthoredCovered, atLeastOne: seedPairs.length > 0 },
    expected: { covered: true, atLeastOne: true },
  });

  return checks;
}
