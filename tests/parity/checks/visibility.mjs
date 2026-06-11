/**
 * checks/visibility.mjs — M9.1 physical visibility resolution (aggregate;
 * fixture-independent).
 *
 * NEW engine work (no macro reference — §27.5 scheduled layer→visibility for
 * M2 but only weapon/armor concealment landed; designed from §27.3, §27.6,
 * §29.8). Verifies engine/visibility.mjs + the collectScMods factor hook:
 *  1. graded layering — coat over shirt at default/closed/full coverage;
 *  2. wearMode defaults (§27.6 table) + the live-toggle money case: hood
 *     lowered (default) hides nothing, raised blanks what's under it;
 *  3. multi-region averaging — half-covered = half-read;
 *  4. anchoredTo — a pin stacks in its anchor region at its own layer, so
 *     covering the jacket covers the pin (and the pin occludes nothing);
 *  5. readPriority factors — statement piece scales up; self vs observed;
 *  6. legacy items resolve to 1 (parity = backward-compatible);
 *  7. collectScMods applies factors: 0 skips an item, 0.5 scales-and-rounds.
 */

import BRANDS_CONFIG from "../../../scripts/config/brands.mjs";
import FACTIONS from "../../../scripts/config/factions.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";
import { resolveVisibility } from "../../../scripts/engine/visibility.mjs";
import { collectScMods } from "../../../scripts/engine/cascade.mjs";

const MODULE_ID = "night-city-style-over-all";
const SLOTS_T = TUNABLES_DEFAULTS.slots;

let nextId = 0;
function mockItem(styleData, name = "Piece") {
  return {
    id: `vis-mock-${nextId++}`, name, type: "clothing", img: null,
    system: { equipped: "equipped" }, effects: [],
    flags: styleData !== undefined ? { [MODULE_ID]: { styleData } } : {},
  };
}

const SHIRT = { scSlot: "shirt", region: "torso", regions: ["torso", "arms"], layer: 1 };
const COAT = { scSlot: "coat", region: "torso", regions: ["torso", "arms", "back"], layer: 3, coverage: "major" };

export default function visibilityChecks() {
  const checks = [];
  const resolve = (items) => resolveVisibility({ items }, SLOTS_T);
  const vis = (r, id) => r.value[id];

  // 1 — graded layering. Coat authors no wearMode → §27.6 default "open" →
  //     major shifts −1 → partial → transmission 0.7 on both shirt regions.
  const shirt1 = mockItem(SHIRT, "Flash Shirt");
  const coatOpen = mockItem(COAT, "Grey Coat");
  const open = resolve([shirt1, coatOpen]);
  checks.push({
    name: "visibility — default-open coat: inner shirt reads at partial (0.7)",
    actual: { shirt: vis(open, shirt1.id), coat: vis(open, coatOpen.id) },
    expected: { shirt: 0.7, coat: 1 },
  });

  // 1b — closed coat (deliberate toggle): major as authored → 0.25.
  const shirt2 = mockItem(SHIRT, "Flash Shirt");
  const coatClosed = mockItem({ ...COAT, wearMode: "closed" }, "Grey Coat");
  const closed = resolve([shirt2, coatClosed]);
  checks.push({
    name: "visibility — closed coat: inner shirt reads weakly (0.25)",
    actual: { shirt: vis(closed, shirt2.id) },
    expected: { shirt: 0.25 },
  });

  // 1c — closed FULL coverage: covered doesn't read; hidden set tracks it.
  const shirt3 = mockItem(SHIRT, "Flash Shirt");
  const coatFull = mockItem({ ...COAT, coverage: "full", wearMode: "closed" }, "Sealed Longcoat");
  const sealed = resolve([shirt3, coatFull]);
  checks.push({
    name: "visibility — sealed full coat: shirt drops out entirely",
    actual: { shirt: vis(sealed, shirt3.id), hidden: sealed.hidden, label: sealed.label },
    expected: { shirt: 0, hidden: [shirt3.id], label: "1 of 2 pieces read" },
  });

  // 2 — the wearMode live toggle (§27.6 ⭐): hood default "lowered" (shift −3 →
  //     none) hides nothing; raised blanks the cap under it.
  const cap = mockItem({ scSlot: "hat", region: "head", regions: ["head"], layer: 1 }, "Static Cap");
  const hoodDown = mockItem({ scSlot: "hood", region: "head", regions: ["head"], layer: 2, coverage: "full" }, "Hood");
  const down = resolve([cap, hoodDown]);
  const cap2 = mockItem({ scSlot: "hat", region: "head", regions: ["head"], layer: 1 }, "Static Cap");
  const hoodUp = mockItem({ scSlot: "hood", region: "head", regions: ["head"], layer: 2, coverage: "full", wearMode: "raised" }, "Hood");
  const up = resolve([cap2, hoodUp]);
  checks.push({
    name: "visibility — hood lowered (default) hides nothing; raised blanks the cap",
    actual: { lowered: vis(down, cap.id), raised: vis(up, cap2.id) },
    expected: { lowered: 1, raised: 0 },
  });

  // 3 — multi-region averaging: torso-only sealed vest over a torso+arms shirt
  //     → avg(0, 1) = 0.5 (half-covered = half-read).
  const shirt4 = mockItem(SHIRT, "Flash Shirt");
  const vest = mockItem({ scSlot: "vest", region: "torso", regions: ["torso"], layer: 2, coverage: "full", wearMode: "closed" }, "Sealed Vest");
  const half = resolve([shirt4, vest]);
  checks.push({
    name: "visibility — torso-only cover over torso+arms shirt averages to 0.5",
    actual: { shirt: vis(half, shirt4.id) },
    expected: { shirt: 0.5 },
  });

  // 4 — anchoredTo: pin at the jacket's layer in region torso. Uncovered it
  //     reads; a sealed coat above covers pin AND jacket. The pin (no own
  //     regions) never occludes anything.
  const jacket = mockItem({ scSlot: "jacket", region: "torso", regions: ["torso", "arms"], layer: 3, coverage: "major" }, "Gang Jacket");
  const pin = mockItem({ scSlot: "pin", anchoredTo: "torso", layer: 3, readPriority: 3 }, "Gang Pin");
  const bare = resolve([jacket, pin]);
  const coatOver = mockItem({ scSlot: "coat", region: "torso", regions: ["torso", "arms", "back"], layer: 4, coverage: "full", wearMode: "closed" }, "Grey Coat");
  const buried = resolve([jacket, pin, coatOver]);
  checks.push({
    name: "visibility — anchored pin reads with its jacket, dies under the coat",
    actual: {
      pinBare: vis(bare, pin.id), jacketBare: vis(bare, jacket.id),
      pinBuried: vis(buried, pin.id), jacketBuried: vis(buried, jacket.id),
    },
    expected: { pinBare: 1, jacketBare: 1, pinBuried: 0, jacketBuried: 0 },
  });

  // 5 — readPriority factors (§29.4 multiplier): statement pin ×2.5 self;
  //     observed multiplies visibility in.
  const pinEntry = bare.items.find((e) => e.id === pin.id);
  const shirtHalf = resolve([mockItem({ ...SHIRT, readPriority: 2 }, "Loud Shirt"), vest]);
  const loudEntry = shirtHalf.items[0];
  checks.push({
    name: "visibility — read factors: self = rpMult, observed = rpMult × visibility",
    actual: {
      pinSelf: pinEntry.factors.self, pinObserved: pinEntry.factors.observed,
      loudSelf: loudEntry.factors.self, loudObserved: loudEntry.factors.observed,
    },
    expected: { pinSelf: 2.5, pinObserved: 2.5, loudSelf: 1.5, loudObserved: 0.75 },
  });

  // 6 — legacy item (no styleData at all): visibility 1, factors 1 — §29.8
  //     backward-compatibility.
  const legacy = mockItem(undefined, "Legacy Jacket");
  const legacyR = resolve([legacy, coatFull]);
  checks.push({
    name: "visibility — legacy item (no slot model) always reads at 1",
    actual: { vis: vis(legacyR, legacy.id), factors: legacyR.factors[legacy.id] },
    expected: { vis: 1, factors: { self: 1, observed: 1 } },
  });

  // 7 — collectScMods factor hook: 0 skips the item; 0.5 scales-and-rounds the
  //     Ofuda cascade (cost 4000→2000, heat 6→3, asiaPop 3→2, brand count kept).
  const ofudaItem = mockItem({ brand: "ofuda" }, "Hanabi Bomber");
  const run = (factors) => collectScMods(
    { items: [ofudaItem] }, FACTIONS, TUNABLES_DEFAULTS.cascade,
    BRANDS_CONFIG, TUNABLES_DEFAULTS.brand, { factors }
  );
  const skipped = run({ [ofudaItem.id]: 0 });
  const halved = run({ [ofudaItem.id]: 0.5 });
  checks.push({
    name: "visibility — collectScMods factors: 0 skips, 0.5 scales-and-rounds",
    actual: {
      skippedHas: skipped.hasModifiers,
      cost: halved.cost, heat: halved.heat,
      asiaPop: halved.styles.asiaPop, brandCount: halved.brands.ofuda,
    },
    expected: { skippedHas: false, cost: 2000, heat: 3, asiaPop: 2, brandCount: 1 },
  });

  return checks;
}
