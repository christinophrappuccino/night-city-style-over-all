/**
 * checks/tailor.mjs — M6.7 tailor flow + the shared safe-write (aggregate).
 *
 * Verifies services/tailor.mjs (pure transform):
 *  1. each operation writes the right styleData fields (recolor / retailor /
 *     modifications incl. mechanical wiring / distress / counterfeit);
 *  2. a modification applies AT MOST once (re-tailoring never stacks armor);
 *  3. explicit condition beats a modification's condition side-effect;
 *  4. no-op runs change nothing and report no changes;
 * and data/flags.mjs withDeletionMarkers (promoted from the Style Tab in M6.7):
 *  5. removed keys gain `-=` markers, nested maps recurse, additions pass through.
 */

import { applyTailorOps, modificationChoices } from "../../../scripts/services/tailor.mjs";
import { withDeletionMarkers } from "../../../scripts/data/flags.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";

export default function tailorChecks() {
  const checks = [];
  const T = TUNABLES_DEFAULTS;

  // 1 — the full work order on a garment that already has some style data.
  const base = { style: { asiaPop: 2 }, armor: 1, condition: "pristine" };
  const out = applyTailorOps(base, {
    colors: { primary: "#ff0044", accent: "#00d9ff" },
    fit: "tailored",
    addModifications: ["armoredLining", "techIntegration", "hiddenPockets"],
    counterfeitBrand: "ofuda",
  }, T);
  checks.push({
    name: "tailor.applyTailorOps — full work order",
    actual: {
      colors: out.styleData.colors,
      fit: out.styleData.fit,
      modifications: out.styleData.modifications.slice().sort(),
      armor: out.styleData.armor,                      // 1 base + 1 armoredLining
      fashionware: out.styleData.chrome.fashionware,   // techIntegration wiring
      brand: out.styleData.brand,
      authenticity: out.styleData.authenticity,
      source: out.styleData._source,
      changeCount: out.changes.length,
      baseUntouched: base.armor === 1 && !base.colors, // pure — input not mutated
    },
    expected: {
      colors: { primary: "#ff0044", accent: "#00d9ff" },
      fit: "tailored",
      modifications: ["armoredLining", "hiddenPockets", "techIntegration"],
      armor: 2,
      fashionware: 1,
      brand: "ofuda",
      authenticity: "counterfeit",
      source: "tailored",
      changeCount: 6, // recolor, retailor, 3 mods, counterfeit
      baseUntouched: true,
    },
  });

  // 2 — modifications never stack: re-applying armoredLining is a no-op.
  const again = applyTailorOps(out.styleData, { addModifications: ["armoredLining"] }, T);
  checks.push({
    name: "tailor.applyTailorOps — modifications apply at most once",
    actual: { armor: again.styleData.armor, changes: again.changes.length },
    expected: { armor: 2, changes: 0 },
  });

  // 3 — distressed sets condition worn; an explicit condition wins over it.
  const distressed = applyTailorOps({}, { addModifications: ["distressed"] }, T);
  const restored = applyTailorOps({}, { addModifications: ["distressed"], condition: "pristine" }, T);
  checks.push({
    name: "tailor.applyTailorOps — distress vs explicit condition",
    actual: { distressed: distressed.styleData.condition, explicitWins: restored.styleData.condition },
    expected: { distressed: "worn", explicitWins: "pristine" },
  });

  // 4 — a no-op run reports no changes and stamps nothing.
  const noop = applyTailorOps({ fit: "tailored" }, { fit: "tailored" }, T);
  checks.push({
    name: "tailor.applyTailorOps — no-op run",
    actual: { changes: noop.changes.length, stamped: "_source" in noop.styleData },
    expected: { changes: 0, stamped: false },
  });

  // 4b — every §15.1 modification has a dialog descriptor.
  checks.push({
    name: "tailor.modificationChoices — descriptor per modification",
    actual: modificationChoices(T).map((m) => m.key).sort(),
    expected: ["armoredLining", "distressed", "hiddenPockets", "reinforced", "techIntegration"],
  });

  // 5 — withDeletionMarkers (now the shared safe-write core in data/flags.mjs).
  const persisted = { faction: { deadwoods: 25, tyger_claws: 10 }, heat: 5, fit: "oversized" };
  const next = { faction: { tyger_claws: 10 }, cost: 100 };
  checks.push({
    name: "flags.withDeletionMarkers — deletions, nesting, additions",
    actual: withDeletionMarkers(persisted, next),
    expected: {
      faction: { tyger_claws: 10, "-=deadwoods": null },
      cost: 100,
      "-=heat": null,
      "-=fit": null,
    },
  });

  return checks;
}
