/**
 * perception.mjs — the scan lens (Stage 6): scan-tier thresholds + tier banding.
 *
 * Pure. The dialog/animation/roll in PerceptionGate.promptScan is presentation +
 * RNG (Integration layer); the ENGINE part is just the threshold math and the
 * roll-total → tier mapping, both extracted here. Constants from Tunables.
 *
 * Ports: PerceptionGate.promptScan threshold logic + StyleCheckerApp.scanTier banding.
 * Spec: SC-Module-Architecture-Guide.md §29.1 (Stage 6), §24, §4.1, §18
 */

import { getTunables } from "../config/tunables.mjs";

/**
 * Scan thresholds for reading a target, shifted up by the target's composure (COOL).
 * @param {number} targetCool effective COOL of the scanned target
 * @returns {{minimal:number, partial:number, full:number, coolShift:number}}
 */
export function scanThresholds(targetCool = 0, tunables = getTunables()) {
  const P = tunables.perception;
  const coolShift = Math.floor((targetCool || 0) / P.coolShiftDivisor);
  return {
    minimal: P.scanThresholds.minimal + coolShift,
    partial: P.scanThresholds.partial + coolShift,
    full: P.scanThresholds.full + coolShift,
    coolShift,
  };
}

/**
 * Map a scan roll total (INT + PER + 1d10) to an information tier.
 * @param {number} rollTotal
 * @param {{minimal:number, partial:number, full:number}} thresholds
 * @returns {"full"|"partial"|"minimal"|"failed"}
 */
export function scanTier(rollTotal, thresholds) {
  if (rollTotal >= thresholds.full) return "full";
  if (rollTotal >= thresholds.partial) return "partial";
  if (rollTotal >= thresholds.minimal) return "minimal";
  return "failed";
}
