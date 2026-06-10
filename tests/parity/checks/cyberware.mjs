/**
 * checks/cyberware.mjs — parity for engine/cyberware.mjs (analyzeCyberware).
 *
 * Per-actor and golden. Rebuilds a minimal mock actor from the captured raw items
 * (fix.inputs.cyberItems) + actor.system, runs the analyzer, and diffs against the
 * captured cyberwareData every downstream module consumes.
 *
 * Dormant until the re-run lands fix.inputs.cyberItems (the projected raw items).
 */

import CW from "../../../scripts/config/cyberware.mjs";
import { analyzeCyberware } from "../../../scripts/engine/cyberware.mjs";

export default function cyberwareChecks(fix) {
  const cyberItems = fix.inputs.cyberItems;
  const expected = fix.inputs.cyberwareData;
  if (!cyberItems || !expected) return []; // pre-re-run fixture

  // Minimal actor: plain system + plain item array (cpr-adapter reads fields only).
  const mockActor = { system: fix.inputs.actorSystem, items: cyberItems };

  return [
    {
      name: `cyberware.analyzeCyberware — ${fix.actorName}`,
      actual: analyzeCyberware(mockActor, CW),
      expected,
    },
  ];
}
