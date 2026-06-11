/**
 * checks/brands.mjs — M9.1 Brand Registry cascade (aggregate; fixture-independent).
 *
 * NEW engine work (no macro reference — §13 was scheduled M1/M4 but never landed;
 * designed from §13.1–§13.2, §29.4). Verifies the brand block in engine/cascade.mjs:
 *  1. full resolution — hand-computed style/vibe/cost/heat/district derivation
 *     from the real Ofuda seed entry;
 *  2. per-axis caps (§29.4) — extreme registry values clamp (style cap, cost cap
 *     incl. the hauteCouture tier overflowing tierCost);
 *  3. unknown brand — counts on the brands axis, contributes nothing else;
 *  4. back-compat inertness — no registry/tunables passed → no derived signal
 *     (the pre-M9.1 call shape cannot change legacy results);
 *  5. additive stacking (§29.4) — explicit fields stack on top of brand defaults;
 *  6. D4 identity — `sc.brand.<key>` AE item ≡ `{ brand }` flag item through
 *     collectScMods, and flags-win suppresses a conflicting brand AE.
 */

import BRANDS_CONFIG from "../../../scripts/config/brands.mjs";
import FACTIONS from "../../../scripts/config/factions.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";
import { cascadeStyleData, collectScMods } from "../../../scripts/engine/cascade.mjs";

const MODULE_ID = "night-city-style-over-all";
const CASCADE_T = TUNABLES_DEFAULTS.cascade;
const BRAND_T = TUNABLES_DEFAULTS.brand;

let nextId = 0;
function mockItem({ name = "Test Jacket", changes = [], styleData } = {}) {
  const effects = [];
  if (changes.length) effects.push({ name: "SC FX", disabled: false, changes });
  return {
    id: `brand-mock-${nextId++}`,
    name, type: "clothing", img: null,
    system: { equipped: "equipped" },
    effects,
    flags: styleData !== undefined ? { [MODULE_ID]: { styleData } } : {},
  };
}

/** Comparable read-modifier core (sources/components/explain excluded). */
function core(mods) {
  return {
    archetypes: mods.archetypes, styles: mods.styles, districts: mods.districts,
    factions: mods.factions, chrome: mods.chrome, vibe: mods.vibe, brands: mods.brands,
    cost: mods.cost, heat: mods.heat, disguiseDC: mods.disguiseDC,
  };
}

export default function brandChecks() {
  const checks = [];
  const cascade = (styleData, brands = BRANDS_CONFIG, brandT = BRAND_T) =>
    cascadeStyleData(styleData, FACTIONS, CASCADE_T, brands, brandT);

  // 1 — full resolution of the real Ofuda seed (luxury · asiaPop house).
  //     styles: asiaPop round(12·0.25)=3 · highFashion round(4·0.25)=1
  //     vibe: cool 3 · elegant 2 — cost: tierCost.luxury 4000 — heat: 6
  //     districts: KABUKI 4 · OLD_JAPANTOWN 4 — brands: { ofuda: 1 }
  const ofuda = cascade({ brand: "ofuda" });
  checks.push({
    name: "brands.cascade — Ofuda full resolution (hand-computed)",
    actual: core(ofuda.mods),
    expected: {
      archetypes: {}, factions: {}, chrome: {},
      styles: { asiaPop: 3, highFashion: 1 },
      vibe: { cool: 3, elegant: 2 },
      districts: { KABUKI: 4, OLD_JAPANTOWN: 4 },
      brands: { ofuda: 1 },
      cost: 4000, heat: 6, disguiseDC: 0,
    },
  });

  // 2 — per-axis caps (§29.4). Extreme registry entry clamps to caps; the real
  //     hauteCouture tier (9000) also overflows the 6000 cost cap.
  const extreme = cascade({ brand: "x" }, {
    BRANDS: { x: { label: "X", tier: "hauteCouture", styleAffinity: { asiaPop: 100 }, vibe: { cool: 99 }, heatProfile: 50 } },
  });
  checks.push({
    name: "brands.cascade — per-axis caps clamp (style 8 · vibe 4 · heat 10 · cost 6000)",
    actual: {
      style: extreme.mods.styles.asiaPop, vibe: extreme.mods.vibe.cool,
      heat: extreme.mods.heat, cost: extreme.mods.cost,
    },
    expected: { style: BRAND_T.caps.style, vibe: BRAND_T.caps.vibe, heat: BRAND_T.caps.heat, cost: BRAND_T.caps.cost },
  });

  // 3 — unknown brand: counted on the brands axis, contributes nothing else.
  const unknown = cascade({ brand: "no_such_house" });
  checks.push({
    name: "brands.cascade — unknown brand counts but contributes nothing",
    actual: core(unknown.mods),
    expected: {
      archetypes: {}, styles: {}, districts: {}, factions: {}, chrome: {}, vibe: {},
      brands: { no_such_house: 1 }, cost: 0, heat: 0, disguiseDC: 0,
    },
  });

  // 4 — back-compat inertness: the pre-M9.1 call shape (no registry/tunables)
  //     derives NO signal from a branded item beyond the count axis.
  const inert = cascadeStyleData({ brand: "ofuda" }, FACTIONS, CASCADE_T);
  checks.push({
    name: "brands.cascade — no registry passed → inert (legacy call shape unchanged)",
    actual: core(inert.mods),
    expected: {
      archetypes: {}, styles: {}, districts: {}, factions: {}, chrome: {}, vibe: {},
      brands: { ofuda: 1 }, cost: 0, heat: 0, disguiseDC: 0,
    },
  });

  // 5 — additive stacking (§29.4): explicit style + the brand's affinity sum.
  const stacked = cascade({ brand: "ofuda", style: { asiaPop: 3 } });
  checks.push({
    name: "brands.cascade — explicit fields stack additively on brand defaults",
    actual: { asiaPop: stacked.mods.styles.asiaPop },
    expected: { asiaPop: 6 }, // 3 explicit + 3 brand-derived
  });

  // 6 — D4 identity through the collector: sc.brand.* AE ≡ { brand } flag.
  const run = (items) => collectScMods({ items }, FACTIONS, CASCADE_T, BRANDS_CONFIG, BRAND_T);
  const viaFlag = run([mockItem({ styleData: { brand: "ofuda" } })]);
  const viaAe = run([mockItem({ changes: [{ key: "sc.brand.ofuda", value: 1 }] })]);
  checks.push({
    name: "brands.collectScMods — AE bridge item ≡ flag item (D4 identity)",
    actual: core(viaAe),
    expected: core(viaFlag),
  });

  // 6b — flags win: a flag brand suppresses a conflicting sc.brand.* AE entirely.
  const conflicted = run([mockItem({
    styleData: { brand: "rustwerk" },
    changes: [{ key: "sc.brand.ofuda", value: 1 }],
  })]);
  checks.push({
    name: "brands.collectScMods — flags win over a conflicting brand AE (D4)",
    actual: { brands: conflicted.brands, styles: conflicted.styles },
    expected: { brands: { rustwerk: 1 }, styles: { urbanFlash: 3, bagLadyChic: 1 } },
  });

  return checks;
}
