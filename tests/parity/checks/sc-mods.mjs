/**
 * checks/sc-mods.mjs — M5 dual-read parity (aggregate module; fixture-independent).
 *
 * Verifies engine/cascade.mjs `collectScMods` against:
 *  1. a MACRO-FAITHFUL reference — an independent inline port of Phase 82's
 *     `collectDisguiseModifiers.processChange` (§8143–8235), per-change cascade
 *     and all — run on a fabricated legacy AE item;
 *  2. the D4 identity — the same item "converted to flags" (styleDataFromAe) must
 *     produce IDENTICAL mods through the same collector;
 *  3. flags-win / no-double-count — an item with BOTH a flag and (different) sc.*
 *     AEs reads exactly as the flag alone;
 *  4. disabled-effect and zero-value skipping;
 *  5. actor-level transferred-effect de-duplication (+ loose effects still count);
 *  6. migration classification (conflict vs already-flagged vs convert).
 *
 * Mock items are plain objects shaped like CPR documents — cpr-adapter and the
 * flags helpers are pure field reads, so no Foundry is needed.
 */

import FACTIONS from "../../../scripts/config/factions.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";
import { collectScMods } from "../../../scripts/engine/cascade.mjs";
import { styleDataFromAe } from "../../../scripts/data/sc-keys.mjs";
import { classifyScItem } from "../../../scripts/data/migrations/002-sc-effects-to-flags.mjs";

const MODULE_ID = "night-city-style-over-all";
const CASCADE_T = TUNABLES_DEFAULTS.cascade;

// ── mock factory ─────────────────────────────────────────────────────────────

let nextId = 0;
function mockItem({ name = "Test Jacket", type = "clothing", equipped = "equipped", changes = [], disabledChanges = [], styleData } = {}) {
  const effects = [];
  if (changes.length) effects.push({ name: "SC FX", disabled: false, changes });
  if (disabledChanges.length) effects.push({ name: "SC FX (off)", disabled: true, changes: disabledChanges });
  const item = {
    id: `mock-${nextId++}`,
    name, type,
    img: null,
    system: { equipped },
    effects,
    flags: styleData !== undefined ? { [MODULE_ID]: { styleData } } : {},
  };
  return item;
}

const run = (items, actorEffects = []) => collectScMods({ items, actorEffects }, FACTIONS, CASCADE_T);

/** The comparable read-modifier core (sources/components/explain fields excluded). */
function core(mods) {
  return {
    archetypes: mods.archetypes, styles: mods.styles, districts: mods.districts,
    factions: mods.factions, chrome: mods.chrome,
    cost: mods.cost, armor: mods.armor, heat: mods.heat,
    disguiseDC: mods.disguiseDC, antiStyleSuppress: mods.antiStyleSuppress,
    hasModifiers: mods.hasModifiers,
  };
}

// ── macro-faithful reference (Phase 82 §8143–8235, per change) ───────────────

function macroReference(changeList, factionsConfig) {
  const mods = {
    archetypes: {}, styles: {}, districts: {}, factions: {}, chrome: {},
    cost: 0, armor: 0, disguiseDC: 0, heat: 0, antiStyleSuppress: 0, hasModifiers: false,
  };
  for (const change of changeList) {
    if (!change.key?.startsWith("sc.")) continue;
    const value = parseFloat(change.value) || 0;
    if (value === 0) continue;
    const parts = change.key.split(".");
    const category = parts[1];
    const subKey = parts.slice(2).join(".");
    switch (category) {
      case "archetype": if (subKey) mods.archetypes[subKey] = (mods.archetypes[subKey] || 0) + value; break;
      case "style": if (subKey) mods.styles[subKey] = (mods.styles[subKey] || 0) + value; break;
      case "district": if (subKey) mods.districts[subKey] = (mods.districts[subKey] || 0) + value; break;
      case "faction":
        if (subKey) {
          mods.factions[subKey] = (mods.factions[subKey] || 0) + value;
          const _fc = factionsConfig?.FACTIONS?.[subKey];
          if (_fc) {
            const _archKey = _fc.archetype;
            const _arch = _archKey ? factionsConfig.FACTION_ARCHETYPES?.[_archKey] : null;
            if (_archKey) mods.archetypes[_archKey] = (mods.archetypes[_archKey] || 0) + value;
            if (_arch?.styleProfile) {
              for (const [_s, _w] of Object.entries(_arch.styleProfile)) {
                if (_w >= 0.15) {
                  const _v = Math.round((value / 25) * _w * 3);
                  if (_v > 0) mods.styles[_s] = (mods.styles[_s] || 0) + _v;
                }
              }
            }
            if (_fc.styleModifiers) {
              for (const [_s, _m] of Object.entries(_fc.styleModifiers)) {
                if (_m > 0) {
                  const _v = Math.round((value / 25) * _m * 8);
                  if (_v > 0) mods.styles[_s] = (mods.styles[_s] || 0) + _v;
                }
              }
            }
            if (_arch?.chromeProfile) mods.chrome[_arch.chromeProfile] = (mods.chrome[_arch.chromeProfile] || 0) + Math.max(1, Math.round(value / 20));
            if (_fc.chromeOverride) mods.chrome[_fc.chromeOverride] = (mods.chrome[_fc.chromeOverride] || 0) + Math.max(1, Math.round(value / 20));
            const _costTarget = _fc.costOverride?.sweet || _arch?.costExpectation?.sweet || 0;
            if (_costTarget > 0) mods.cost += Math.round(_costTarget * (value / 100));
            mods.disguiseDC += Math.round(value / 10);
          }
        }
        break;
      case "chrome": if (subKey) mods.chrome[subKey] = (mods.chrome[subKey] || 0) + value; break;
      case "cost": mods.cost += value; break;
      case "armor": mods.armor += value; break;
      case "disguise": if (subKey === "dc") mods.disguiseDC += value; break;
      case "heat": mods.heat += value; break;
      case "antiStyle": if (subKey === "suppress") mods.antiStyleSuppress = Math.min(1, Math.max(0, mods.antiStyleSuppress + value)); break;
      default: continue;
    }
    mods.hasModifiers = true;
  }
  return mods;
}

// ── the checks ───────────────────────────────────────────────────────────────

export default function scModsChecks() {
  const checks = [];

  // The fabricated legacy loadout: a cascade-rich faction + every scalar category.
  const LEGACY_CHANGES = [
    { key: "sc.faction.tyger_claws", value: "25" },
    { key: "sc.style.urbanFlash", value: "5" },
    { key: "sc.district.japantown", value: "10" },
    { key: "sc.chrome.fashionware", value: "2" },
    { key: "sc.archetype.gang_organized", value: "8" },
    { key: "sc.cost", value: "150" },
    { key: "sc.armor", value: "-1" },
    { key: "sc.heat", value: "5" },
    { key: "sc.disguise.dc", value: "2" },
    { key: "sc.antiStyle.suppress", value: "0.5" },
  ];

  // 1 — engine vs the macro-faithful reference.
  const aeItem = mockItem({ changes: LEGACY_CHANGES });
  const engineMods = run([aeItem]);
  checks.push({
    name: "sc-mods.cascade matches macro reference (legacy AE item)",
    actual: core(engineMods),
    expected: macroReference(LEGACY_CHANGES, FACTIONS),
  });

  // 2 — D4 identity: the converted flag item reads IDENTICALLY.
  const converted = styleDataFromAe(aeItem);
  const flagItem = mockItem({ changes: LEGACY_CHANGES, styleData: converted }); // AEs still present!
  checks.push({
    name: "sc-mods.D4 identity — AE item ≡ migrated flag item",
    actual: core(run([flagItem])),
    expected: core(engineMods),
  });

  // 3 — flags win, no double-count: differing AEs on a flagged item are ignored.
  const flagOnly = mockItem({ styleData: { faction: { tyger_claws: 25 } } });
  const flagPlusLoudAe = mockItem({
    styleData: { faction: { tyger_claws: 25 } },
    changes: [{ key: "sc.faction.tyger_claws", value: "50" }, { key: "sc.heat", value: "99" }],
  });
  checks.push({
    name: "sc-mods.D4 precedence — flag + differing sc.* AEs reads as the flag alone",
    actual: core(run([flagPlusLoudAe])),
    expected: core(run([flagOnly])),
  });

  // 4 — disabled effects and zero values contribute nothing.
  const inert = mockItem({
    changes: [{ key: "sc.style.urbanFlash", value: "0" }],
    disabledChanges: [{ key: "sc.style.asiaPop", value: "10" }],
  });
  checks.push({
    name: "sc-mods.disabled/zero sc.* changes are skipped",
    actual: core(run([inert])),
    expected: { styles: {}, hasModifiers: false },
  });

  // 4b — unequipped items contribute nothing (macro equip gate).
  const carried = mockItem({ equipped: "carried", changes: [{ key: "sc.heat", value: "10" }] });
  checks.push({
    name: "sc-mods.unequipped items are ignored",
    actual: core(run([carried])),
    expected: { heat: 0, hasModifiers: false },
  });

  // 5 — actor-effect dedup: the transferred copy of an item change counts ONCE;
  //     loose actor effects (no origin item) still count.
  const gearItem = mockItem({ changes: [{ key: "sc.cost", value: "100" }] });
  const actorEffects = [
    { name: "SC FX", disabled: false, changes: [{ key: "sc.cost", value: "100" }], origin: `Actor.x.Item.${gearItem.id}` },
    { name: "Ritual Paint", disabled: false, changes: [{ key: "sc.heat", value: "3" }] },
  ];
  checks.push({
    name: "sc-mods.actor-effect dedup + loose effect counting",
    actual: core(run([gearItem], actorEffects)),
    expected: { cost: 100, heat: 3, hasModifiers: true },
  });

  // 5b — transferred copy of a FLAGGED item's AE is also ignored (flags win end-to-end).
  const flaggedGear = mockItem({ styleData: { cost: 100 }, changes: [{ key: "sc.cost", value: "100" }] });
  const transferred = [
    { name: "SC FX", disabled: false, changes: [{ key: "sc.cost", value: "100" }], origin: `Actor.x.Item.${flaggedGear.id}` },
  ];
  checks.push({
    name: "sc-mods.flagged item's transferred AE copy is ignored",
    actual: core(run([flaggedGear], transferred)),
    expected: { cost: 100, hasModifiers: true },
  });

  // 6 — migration classification.
  checks.push({
    name: "sc-mods.migration002 classification",
    actual: {
      convert: classifyScItem(mockItem({ changes: LEGACY_CHANGES })).status,
      conflict: classifyScItem(flagPlusLoudAe).status,
      agreeing: classifyScItem(mockItem({ changes: LEGACY_CHANGES, styleData: converted })).status,
      untouched: classifyScItem(mockItem({})).status,
      inert: classifyScItem(mockItem({ changes: [{ key: "sc.style.urbanFlash", value: "0" }] })).status,
    },
    expected: {
      convert: "convert",
      conflict: "conflict",
      agreeing: "already-flagged",
      untouched: "no-sc-data",
      inert: "empty-sc-data",
    },
  });

  return checks;
}
