/**
 * checks/vibes.mjs — M9.1 vibe profile aggregation (aggregate; fixture-independent).
 *
 * NEW engine work (no macro reference — §22.5 scheduled the parallel vibe pass
 * for M2/M3 but nothing landed; designed from §22.3–§22.4). Verifies
 * engine/vibes.mjs against hand-computed profiles:
 *  1. spoke shape — nine canonical spokes zero-filled in order, custom GM tags
 *     appended (open vocabulary);
 *  2. dominance — the dominantMin floor AND the dominantRatio-of-top gate;
 *  3. descriptor wording — strongly/faintly intensity bands, descriptorMax cut;
 *  4. empty set — stable zero profile, no descriptor;
 *  5. integration — brand vibe identity (Ofuda via the registry cascade) merges
 *     with explicit item vibe through collectScMods into one profile.
 */

import BRANDS_CONFIG from "../../../scripts/config/brands.mjs";
import FACTIONS from "../../../scripts/config/factions.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";
import { VIBE_TAGS } from "../../../scripts/constants.mjs";
import { collectScMods } from "../../../scripts/engine/cascade.mjs";
import { vibeProfile } from "../../../scripts/engine/vibes.mjs";

const MODULE_ID = "night-city-style-over-all";
const VIBE_T = TUNABLES_DEFAULTS.vibe;

let nextId = 0;
const mockItem = (styleData) => ({
  id: `vibe-mock-${nextId++}`, name: "Vibe Piece", type: "clothing", img: null,
  system: { equipped: "equipped" }, effects: [],
  flags: { [MODULE_ID]: { styleData } },
});

export default function vibeChecks() {
  const checks = [];
  const profile = (vibe) => vibeProfile({ vibe }, VIBE_T);

  // 1 — spoke shape: canonical nine zero-filled in order; custom tag appended.
  const shaped = profile({ cool: 6, elegant: 4, cute: 1, customTone: 2 });
  checks.push({
    name: "vibes.profile — nine spokes zero-filled in order + custom tag appended",
    actual: { tags: shaped.spokes.map((s) => s.tag), value: shaped.value },
    expected: {
      tags: [...VIBE_TAGS, "customTone"],
      value: {
        cool: 6, cute: 1, sexy: 0, sleazy: 0, menacing: 0,
        flashy: 0, elegant: 4, rugged: 0, scrappy: 0, customTone: 2,
      },
    },
  });

  // 1b — dominance on the same set: cool 6 + elegant 4 clear floor 3 and ratio
  //      gate 6·0.6=3.6; customTone 2 and cute 1 fall to the floor.
  checks.push({
    name: "vibes.profile — dominant set (floor + ratio-of-top)",
    actual: { dominant: shaped.dominant, label: shaped.label },
    expected: { dominant: ["cool", "elegant"], label: "Cool · Elegant" },
  });

  // 2 — ratio gate alone: cool 3 clears the floor but not 8·0.6=4.8.
  const gated = profile({ menacing: 8, cool: 3 });
  checks.push({
    name: "vibes.profile — dominantRatio excludes a floor-clearing runner-up",
    actual: { dominant: gated.dominant, descriptor: gated.descriptor },
    expected: { dominant: ["menacing"], descriptor: "strongly menacing, cool" },
  });

  // 3 — intensity bands: 3 = plain, 1 = faint (faintMax 1).
  const worded = profile({ cool: 3, menacing: 1 });
  checks.push({
    name: "vibes.profile — descriptor intensity wording (plain + faintly)",
    actual: { descriptor: worded.descriptor, dominant: worded.dominant },
    expected: { descriptor: "cool, faintly menacing", dominant: ["cool"] },
  });

  // 4 — empty set: stable zero profile, no descriptor, honest label.
  const empty = profile({});
  checks.push({
    name: "vibes.profile — empty set reads as no signal",
    actual: {
      descriptor: empty.descriptor, dominant: empty.dominant,
      label: empty.label, spokeCount: empty.spokes.length, cool: empty.value.cool,
    },
    expected: { descriptor: "", dominant: [], label: "No vibe read", spokeCount: VIBE_TAGS.length, cool: 0 },
  });

  // 5 — integration: Ofuda brand identity (cool 3 · elegant 2 via the registry)
  //     merges with an explicit menacing piece through the collector. Tie at 2
  //     resolves by spoke order (menacing precedes elegant in VIBE_TAGS).
  const mods = collectScMods(
    { items: [mockItem({ brand: "ofuda" }), mockItem({ vibe: { menacing: 2 } })] },
    FACTIONS, TUNABLES_DEFAULTS.cascade, BRANDS_CONFIG, TUNABLES_DEFAULTS.brand
  );
  const merged = vibeProfile(mods, VIBE_T);
  checks.push({
    name: "vibes.profile — brand identity + explicit item vibe merge via collectScMods",
    actual: {
      cool: merged.value.cool, elegant: merged.value.elegant, menacing: merged.value.menacing,
      dominant: merged.dominant, descriptor: merged.descriptor,
    },
    expected: { cool: 3, elegant: 2, menacing: 2, dominant: ["cool"], descriptor: "cool, menacing" },
  });

  return checks;
}
