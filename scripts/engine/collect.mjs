/**
 * collect.mjs — Stage 1 of the engine pipeline (§29.1): normalize an actor into one
 * input object every downstream engine function consumes.
 *
 * Pure: reads CPR documents only through cpr-adapter; no game/ui globals. Accepts an
 * optional `items` override so a HYPOTHETICAL equipped set can be evaluated (the
 * Wardrobe-preview seam, M6) — when omitted, the actor's real items are used.
 *
 * Faithful port of stylechecker2_0_Phase82.js:
 *   - getEffectiveStats   (social stats: base + bonuses.* / system.stats.* AEs)
 *   - collectStyleData    (self/ungated view: parts, weapons, armor, threat ammo, styles)
 *   - collectThreatAmmo + visibility helpers
 *   - extractRoles
 *
 * Perception gating (Stage 6) is intentionally NOT here — collect builds the full,
 * objective set; the lens is applied later (§29.3).
 *
 * M9.3: the OBSERVED view passes `factors` (visibility.mjs read factors, id → 0..1)
 * so covered clothing stops contributing its CPR-native genre count and perceived
 * cost (§27.3 "covered items stop reading"). Strictly opt-in — the self path never
 * passes it, so legacy output stays byte-identical (the M2 parity contract).
 *
 * Spec: SC-Module-Architecture-Guide.md §29.1 (Stage 1–2), §27.3, §4.1
 */

import * as cpr from "../data/cpr-adapter.mjs";

/** CPR clothing slots, in the reference engine's order. */
export const CLOTHING_SLOTS = [
  "top", "bottoms", "jacket", "footwear", "hats",
  "glasses", "mirrorshades", "contactLenses", "jewelry",
];

/** Ammo varieties that read as a visible threat (per reference engine). */
export const THREAT_AMMO_VARIETIES = ["grenade", "rocket", "arrow"];

// ── social stats (effective = base + Active Effect bonuses) ─────────────────

/** CPR bonus/stat change keys → our social-stat keys (verbatim from reference). */
const BONUS_KEY_MAP = {
  "bonuses.cool": "cool",
  "bonuses.int": "int",
  "bonuses.emp": "emp",
  "bonuses.reputation": "reputation",
  "bonuses.personalgrooming": "personalGrooming",
  "bonuses.personalGrooming": "personalGrooming",
  "bonuses.personal_grooming": "personalGrooming",
  "bonuses.wardrobeandstyle": "wardrobeAndStyle",
  "bonuses.wardrobeAndStyle": "wardrobeAndStyle",
  "bonuses.wardrobe_and_style": "wardrobeAndStyle",
  "bonuses.perception": "perception",
  "system.stats.cool.value": "cool",
  "system.stats.int.value": "int",
  "system.stats.emp.value": "emp",
};

function resolveBonusKey(changeKey) {
  if (!changeKey) return null;
  if (BONUS_KEY_MAP[changeKey]) return BONUS_KEY_MAP[changeKey];
  const lower = changeKey.toLowerCase();
  for (const [pattern, mapped] of Object.entries(BONUS_KEY_MAP)) {
    if (lower === pattern.toLowerCase()) return mapped;
  }
  return null;
}

/**
 * Effective social stats: base values plus equipped/installed-item and actor-level
 * Active Effect bonuses. `items` is the set scanned for bonus AEs (override-aware);
 * base stats and skills come from the actor.
 * @returns {{cool,int,emp,reputation,personalGrooming,wardrobeAndStyle,perception,_base,_mods,_sources}}
 */
export function effectiveStats(actor, items = cpr.getItems(actor)) {
  if (!actor) {
    return {
      cool: 0, int: 0, emp: 0, reputation: 0,
      personalGrooming: 0, wardrobeAndStyle: 0, perception: 0,
      _base: {}, _mods: {}, _sources: [],
    };
  }

  const base = {
    cool: cpr.getStat(actor, "cool"),
    int: cpr.getStat(actor, "int"),
    emp: cpr.getStat(actor, "emp"),
    reputation: cpr.getReputation(actor),
    personalGrooming: cpr.getSkillLevel(actor, "Personal Grooming"),
    wardrobeAndStyle: cpr.getSkillLevel(actor, "Wardrobe & Style"),
    perception: cpr.getSkillLevel(actor, "Perception") || cpr.getConcentrationPerception(actor),
  };

  const mods = { cool: 0, int: 0, emp: 0, reputation: 0, personalGrooming: 0, wardrobeAndStyle: 0, perception: 0 };
  const sources = [];

  // Equipped/installed item effects.
  for (const item of items) {
    const effects = cpr.getItemEffects(item);
    if (!effects.length) continue;
    const eq = cpr.getEquipState(item);
    const isActive =
      eq === cpr.EQUIP.EQUIPPED || eq === "installed" ||
      (item.type === cpr.ITEM_TYPE.CYBERWARE && cpr.isCyberwareInstalled(item));
    if (!isActive) continue;

    for (const effect of effects) {
      for (const change of cpr.getEffectChanges(effect)) {
        const mapped = resolveBonusKey(change.key);
        if (!mapped) continue;
        const value = parseInt(change.value) || 0;
        if (value === 0) continue;
        mods[mapped] += value;
        sources.push({
          item: item.name,
          itemId: item.id,
          itemImg: item.img || "icons/svg/item-bag.svg",
          stat: mapped,
          value,
          effectName: effect.name || effect.label || "",
        });
      }
    }
  }

  // Actor-level effects (transferred from items, conditions, …), de-duped.
  for (const effect of cpr.getActorEffects(actor)) {
    for (const change of cpr.getEffectChanges(effect)) {
      const mapped = resolveBonusKey(change.key);
      if (!mapped) continue;
      const value = parseInt(change.value) || 0;
      if (value === 0) continue;
      const originId = effect.origin?.split(".")?.pop();
      const originItem = actor.items?.get?.(originId);
      const alreadyCounted =
        originItem && sources.some((s) => s.itemId === originId && s.stat === mapped && s.value === value);
      if (alreadyCounted) continue;
      mods[mapped] += value;
      sources.push({
        item: originItem?.name || effect.name || "Effect",
        itemId: originItem?.id || null,
        itemImg: originItem?.img || "icons/svg/aura.svg",
        stat: mapped,
        value,
        via: "actorEffect",
      });
    }
  }

  return {
    cool: base.cool + mods.cool,
    int: base.int + mods.int,
    emp: base.emp + mods.emp,
    reputation: base.reputation + mods.reputation,
    personalGrooming: base.personalGrooming + mods.personalGrooming,
    wardrobeAndStyle: base.wardrobeAndStyle + mods.wardrobeAndStyle,
    perception: base.perception + mods.perception,
    _base: base,
    _mods: mods,
    _sources: sources,
  };
}

// ── visibility helpers (objective; no perception) ──────────────────────────

export function isBodyWeapon(item) {
  if (item.type !== cpr.ITEM_TYPE.WEAPON) return false;
  const wType = cpr.getWeaponType(item);
  const wSkill = cpr.getWeaponSkill(item);
  if (wType === "unarmed" || wType === "martialArts" || wType === "thrownWeapon") return true;
  if (wSkill === "Brawling" || wSkill === "Martial Arts") return true;
  return false;
}

export function isWeaponVisible(item) {
  if (isBodyWeapon(item)) return false;
  const eq = cpr.getEquipState(item);
  if (eq === cpr.EQUIP.EQUIPPED) return true;
  if (eq === cpr.EQUIP.CARRIED || eq === cpr.EQUIP.OWNED) {
    if (!cpr.isConcealable(item)) return true;
    return !cpr.isConcealed(item);
  }
  return false;
}

export function isWeaponConcealed(item) {
  if (isBodyWeapon(item)) return false;
  const eq = cpr.getEquipState(item);
  return (eq === cpr.EQUIP.CARRIED || eq === cpr.EQUIP.OWNED) && cpr.isConcealable(item) && cpr.isConcealed(item);
}

export function isArmorVisible(item) {
  if (cpr.getEquipState(item) !== cpr.EQUIP.EQUIPPED) return false;
  if (cpr.isConcealable(item) && cpr.isConcealed(item)) return false;
  return true;
}

export function isArmorConcealed(item) {
  const eq = cpr.getEquipState(item);
  return (eq === cpr.EQUIP.CARRIED || eq === cpr.EQUIP.OWNED) && cpr.isConcealable(item) && cpr.isConcealed(item);
}

export const isThreatAmmo = (item) =>
  item.type === cpr.ITEM_TYPE.AMMO && THREAT_AMMO_VARIETIES.includes(cpr.getAmmoVariety(item));

export const isThreatAmmoVisible = (item) =>
  isThreatAmmo(item) && cpr.getAmount(item) > 0 && !cpr.isConcealed(item);

export const isThreatAmmoConcealed = (item) =>
  isThreatAmmo(item) && cpr.getAmount(item) > 0 && cpr.isConcealed(item);

/** Collect threat ammo, excluding rounds loaded into a real (non-body) weapon. */
export function collectThreatAmmo(items) {
  const result = { visible: [], concealed: [] };

  const installedIds = new Set();
  for (const item of items) {
    if (item.type === cpr.ITEM_TYPE.WEAPON && !isBodyWeapon(item)) {
      for (const id of cpr.getInstalledItemIds(item)) installedIds.add(id);
    }
  }

  for (const item of items) {
    if (item.type !== cpr.ITEM_TYPE.AMMO || !isThreatAmmo(item)) continue;
    if (cpr.getAmount(item) <= 0 || installedIds.has(item.id)) continue;
    const entry = {
      id: item.id,
      name: item.name,
      img: item.img || null,
      variety: cpr.getAmmoVariety(item),
      type: cpr.getSystemType(item) || "basic",
      amount: cpr.getAmount(item),
    };
    if (isThreatAmmoVisible(item)) result.visible.push(entry);
    else if (isThreatAmmoConcealed(item)) result.concealed.push(entry);
  }
  return result;
}

// ── roles ───────────────────────────────────────────────────────────────────

export function extractRoles(items) {
  const roles = [];
  for (const item of items) {
    if (item.type !== cpr.ITEM_TYPE.ROLE) continue;
    roles.push({
      name: item.name,
      rank: cpr.getRoleRank(item),
      id: item.id,
      key: (item.name || "").toLowerCase().replace(/\s+/g, ""),
    });
  }
  roles.sort((a, b) => b.rank - a.rank);
  return {
    roles,
    primaryRole: roles[0] || null,
    secondaryRoles: roles.slice(1),
    isMulticlass: roles.length > 1,
    totalRanks: roles.reduce((sum, r) => sum + r.rank, 0),
    hasRole: roles.length > 0,
  };
}

// ── the collector ───────────────────────────────────────────────────────────

/**
 * Build the normalized input set for an actor (self/objective view).
 * @param {object} actor CPR actor document
 * @param {object} [opts]
 * @param {object[]} [opts.items] hypothetical-set override
 * @param {Record<string, number>} [opts.factors] OBSERVED-view read factors
 *   (item id → 0..1, from visibility.mjs). Factor 0 = physically covered:
 *   the piece keeps its slot (it IS worn) but stops feeding the genre count
 *   and the perceived cost. Omit for the self/objective view.
 * @returns {object} { parts, totalCost, weapons, armor, threatAmmo, styles, socialStats, effectiveStats, roleData }
 */
export function collect(actor, { items, factors } = {}) {
  const itemList = items ?? cpr.getItems(actor);

  const out = {
    parts: {},
    totalCost: 0,
    weapons: { equipped: [], concealed: [], visible: [] },
    armor: { equipped: [], concealed: [], unequipped: [] },
    threatAmmo: { visible: [], concealed: [] },
    styles: {},
    // Lossless list of every equipped clothing item (parts dedupes per slot;
    // this preserves same-slot duplicates so downstream counts stay exact).
    equippedClothing: [],
  };
  for (const slot of CLOTHING_SLOTS) {
    out.parts[slot] = { worn: false, name: "Missing", img: null, style: null, cost: 0, id: null };
  }

  for (const item of itemList) {
    // CLOTHING (equipped only)
    if (item.type === cpr.ITEM_TYPE.CLOTHING && cpr.isEquipped(item)) {
      const slot = cpr.getClothingSlot(item);
      const style = cpr.getClothingStyle(item);
      const cost = cpr.getPrice(item);
      // Observed view: factor 0 = covered — worn, but it doesn't READ (§27.3).
      const covered = !!factors && (factors[item.id] ?? 1) === 0;
      out.parts[slot] = { worn: true, name: item.name, img: item.img || null, style, cost, id: item.id, covered };
      out.equippedClothing.push({ id: item.id, name: item.name, slot, style, cost, covered });
      if (style && !covered) out.styles[style] = (out.styles[style] || 0) + 1;
      if (!covered) out.totalCost += cost;
    }

    // WEAPONS
    if (item.type === cpr.ITEM_TYPE.WEAPON) {
      if (isWeaponVisible(item)) {
        const eq = cpr.getEquipState(item);
        const state = eq === cpr.EQUIP.EQUIPPED ? "drawn" : eq === cpr.EQUIP.OWNED ? "owned" : "carried";
        out.weapons.equipped.push({
          id: item.id, name: item.name, visible: true, img: item.img || null,
          state, canConceal: !!cpr.isConcealable(item), equippedState: eq || "owned",
        });
      } else if (isWeaponConcealed(item)) {
        out.weapons.concealed.push({
          id: item.id, name: item.name, img: item.img || null,
          canConceal: true, equippedState: cpr.getEquipState(item) || "carried",
        });
      }
    }

    // ARMOR
    if (item.type === cpr.ITEM_TYPE.ARMOR) {
      if (isArmorVisible(item)) {
        const eq = cpr.getEquipState(item);
        const state = eq === cpr.EQUIP.EQUIPPED ? "worn" : eq === cpr.EQUIP.OWNED ? "owned" : "carried";
        out.armor.equipped.push({
          id: item.id, name: item.name, img: item.img || null,
          state, canConceal: !!cpr.isConcealable(item), equippedState: eq || "owned",
        });
      } else if (isArmorConcealed(item)) {
        out.armor.concealed.push({
          id: item.id, name: item.name, img: item.img || null,
          canConceal: true, equippedState: cpr.getEquipState(item) || "carried",
        });
      }
    }
  }

  out.threatAmmo = collectThreatAmmo(itemList);

  const eff = effectiveStats(actor, itemList);
  out.socialStats = {
    cool: eff.cool,
    personalGrooming: eff.personalGrooming,
    wardrobeAndStyle: eff.wardrobeAndStyle,
    reputation: eff.reputation,
  };
  out.effectiveStats = eff;
  out.roleData = extractRoles(itemList);

  return out;
}
