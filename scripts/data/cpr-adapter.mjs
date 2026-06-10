/**
 * cpr-adapter.mjs — the ONLY place that reads cyberpunk-red-core data paths.
 *
 * The CPR Adapter Rule (guide §4.1): every read of a `cyberpunk-red-core` field
 * (`system.equipped`, `system.style`, `system.price.market`, stat/role paths, …)
 * goes through here. When the system moves a field, we fix one file.
 *
 * Pure field access only — accepts CPR documents (actor/item) and returns plain
 * values. No `game.*`, no `ui.*`. Verified against cyberpunk-red-core V12
 * DataModels (clothing/cyberware/equippable/valuable mixins) and the play-tested
 * paths in stylechecker2_0_Phase82.js.
 *
 * Spec: SC-Module-Architecture-Guide.md §4.1 (CPR Adapter Rule), §5
 */

// ---- enums / literals (verified against equippable-schema, clothing-datamodel) ----

/** Equipped-state values (system.equipped StringField; initial "owned"). */
export const EQUIP = Object.freeze({
  EQUIPPED: "equipped",
  CARRIED: "carried",
  OWNED: "owned",
});

/** Item types this module cares about (CPR Item.types subset). */
export const ITEM_TYPE = Object.freeze({
  CLOTHING: "clothing",
  CYBERWARE: "cyberware",
  WEAPON: "weapon",
  ARMOR: "armor",
  AMMO: "ammo",
  GEAR: "gear",
  ROLE: "role",
  SKILL: "skill",
  DRUG: "drug",
  ITEM: "item",
  CRITICAL_INJURY: "criticalInjury",
});

// ---- generic item ----------------------------------------------------------

export const getType = (item) => item?.type ?? null;
export const isType = (item, type) => item?.type === type;

/** Equipped state string: "equipped" | "carried" | "owned" | null. */
export const getEquipState = (item) => item?.system?.equipped ?? null;
export const isEquipped = (item) => getEquipState(item) === EQUIP.EQUIPPED;
export const isCarried = (item) => getEquipState(item) === EQUIP.CARRIED;

/** Embedded-document update record that sets an item's equip state (the ONE place
 *  the `system.equipped` WRITE path lives — Wardrobe commit, M6). */
export const equipUpdateRecord = (item, state) => ({ _id: item.id, "system.equipped": state });

/** Plain-data copy of an item's system block (DataModel-aware) — for building
 *  hypothetical-set shims without touching the document. */
export const getSystemData = (item) =>
  structuredClone(item?.system?.toObject?.() ?? item?.system ?? {});

// ---- clothing --------------------------------------------------------------

/** CPR clothing style key (system.style; one of STYLE_KEYS). */
export const getClothingStyle = (item) => item?.system?.style ?? null;
/** CPR clothing slot ("jacket", "hat", "glasses", …) from system.type. */
export const getClothingSlot = (item) => item?.system?.type ?? null;
/** Market price in eurobucks (system.price.market). */
export const getPrice = (item) => item?.system?.price?.market ?? 0;

// ---- cyberware -------------------------------------------------------------

/** Installed state. CPR default is true; treat only explicit false as not-installed. */
export const isCyberwareInstalled = (item) => item?.system?.isInstalled !== false;
export const isCyberwareFoundational = (item) => item?.system?.isFoundational === true;
/** Core/excluded-slot flag (e.g. neural link backbone). */
export const isCyberwareCore = (item) => item?.system?.core === true;
/** Humanity loss for an item: prefer total, fall back to base, else 0. */
export const getHumanityLoss = (item) =>
  item?.system?.humanityLoss?.total ?? item?.system?.humanityLoss?.base ?? 0;
/** Raw humanityLoss parts {total, base} (undefined preserved) — lets the caller
 *  apply the exact `total || base || fallback` chain the reference engine uses. */
export const getHumanityLossParts = (item) => ({
  total: item?.system?.humanityLoss?.total,
  base: item?.system?.humanityLoss?.base,
});
/** Cyberware/clothing/etc. subtype (e.g. "borgware", "fashionware"). */
export const getSystemType = (item) => item?.system?.type ?? null;

// ---- concealment (weapons / armor / cyberware share the concealable mixin) ---

export const isConcealable = (item) => item?.system?.concealable?.concealable === true;
export const isConcealed = (item) => item?.system?.concealable?.isConcealed === true;

// ---- weapons ---------------------------------------------------------------

export const getWeaponType = (item) => item?.system?.weaponType ?? null;
export const getWeaponSkill = (item) => item?.system?.weaponSkill ?? null;

// ---- ammo ------------------------------------------------------------------

export const getAmmoVariety = (item) => item?.system?.variety ?? null;
export const getAmount = (item) => item?.system?.amount ?? item?.system?.quantity ?? 0;

// ---- gear / drugs ----------------------------------------------------------

/** Description text (system.description.value, or a bare string), lowercased-safe. */
export const getDescriptionText = (item) =>
  String(item?.system?.description?.value ?? item?.system?.description ?? "");
/** Drug/dose quantity: amount, then quantity, defaulting to 1 (reference `|| 1`). */
export const getDrugQuantity = (item) => item?.system?.amount || item?.system?.quantity || 1;
/** Item IDs installed inside a container/launcher (system.installedItems.list). */
export const getInstalledItemIds = (item) => item?.system?.installedItems?.list ?? [];

// ---- roles -----------------------------------------------------------------

/** Role rank: system.rank, falling back to level, then first ability rank. */
export const getRoleRank = (item) =>
  item?.system?.rank ?? item?.system?.level ?? item?.system?.abilities?.[0]?.rank ?? 0;

// ---- actor stats & skills --------------------------------------------------

const STAT_PATH = {
  cool: "cool",
  int: "int",
  emp: "emp",
  luck: "luck",
  ref: "ref",
  body: "body",
};

/** Actor stat .value (e.g. "cool", "int", "emp", "luck", "body"). */
export const getStat = (actor, stat) => {
  const key = STAT_PATH[stat] ?? stat;
  return actor?.system?.stats?.[key]?.value ?? 0;
};
export const getStatMax = (actor, stat) => {
  const key = STAT_PATH[stat] ?? stat;
  return actor?.system?.stats?.[key]?.max ?? getStat(actor, stat);
};

/** Raw stat {value, max} (undefined preserved) — for the EMP/humanity derivation,
 *  which distinguishes "sheet has no value" from "value is 0". */
export const getStatRaw = (actor, stat) => {
  const key = STAT_PATH[stat] ?? stat;
  const s = actor?.system?.stats?.[key];
  return { value: s?.value, max: s?.max };
};

export const getReputation = (actor) => actor?.system?.reputation?.value ?? 0;

/** Eurobucks on hand (system.wealth ledger value). */
export const getWealth = (actor) => actor?.system?.wealth?.value ?? 0;

/**
 * Spend (or grant, with negative `amount`) eurobucks — the ONE wealth WRITE path.
 * Prefers CPR's ledger API so the transaction lands in the character's wealth
 * ledger like any native trade; falls back to a plain update on non-CPR docs.
 */
export const spendWealth = (actor, amount, reason) => {
  if (typeof actor?.deltaLedgerProperty === "function") {
    return actor.deltaLedgerProperty("wealth", -amount, reason);
  }
  return actor.update({ "system.wealth.value": getWealth(actor) - amount });
};

/** Hit points {value, max} from derivedStats (macro wound-heat path, §12406). */
export const getHP = (actor) => {
  const max = actor?.system?.derivedStats?.hp?.max || 1;
  return { value: actor?.system?.derivedStats?.hp?.value ?? max, max };
};

/** Humanity {value, max} from derivedStats. */
export const getHumanity = (actor) => ({
  value: actor?.system?.derivedStats?.humanity?.value ?? 0,
  max: actor?.system?.derivedStats?.humanity?.max ?? 0,
});

/** Raw sheet humanity {value, max} (undefined preserved) — lets the caller detect
 *  whether the sheet carries humanity at all (sheet-driven vs. EMP-derived). */
export const getHumanitySheet = (actor) => ({
  value: actor?.system?.derivedStats?.humanity?.value,
  max: actor?.system?.derivedStats?.humanity?.max,
});

/**
 * Skill level by skill-item name (e.g. "Wardrobe & Style", "Personal Grooming",
 * "Perception"). Exact-name match by default (matches the reference engine); pass
 * insensitive=true to relax case. Returns 0 when the skill item is absent.
 */
export const getSkillLevel = (actor, skillName, insensitive = false) => {
  const items = getItems(actor);
  for (const it of items) {
    if (it.type !== ITEM_TYPE.SKILL) continue;
    const match = insensitive
      ? String(it.name).toLowerCase() === String(skillName).toLowerCase()
      : it.name === skillName;
    if (match) return it.system?.level ?? 0;
  }
  return 0;
};

/** CPR fallback path for perception when no Perception skill item exists. */
export const getConcentrationPerception = (actor) =>
  actor?.system?.skills?.concentration?.perception?.level ?? 0;

// ---- collections & effects -------------------------------------------------

/** All embedded items as an array (actor.items can be a Map-like collection). */
export const getItems = (actor) => {
  const items = actor?.items;
  if (!items) return [];
  return Array.from(items.values?.() ?? items);
};

/** Items filtered by CPR type. */
export const getItemsOfType = (actor, type) => getItems(actor).filter((i) => i.type === type);

/** Active Effects on an actor (array). */
export const getActorEffects = (actor) => {
  const fx = actor?.effects;
  if (!fx) return [];
  return Array.from(fx.values?.() ?? fx);
};

/** Active Effects on an item (array). */
export const getItemEffects = (item) => {
  const fx = item?.effects;
  if (!fx) return [];
  return Array.from(fx.values?.() ?? fx);
};

/** Effect changes ([{key, value, mode, …}]); empty array when disabled/absent. */
export const getEffectChanges = (effect) => {
  if (!effect || effect.disabled) return [];
  return effect.changes ?? [];
};

/** Effect changes INCLUDING disabled effects — the chrome-classification path keys
 *  off sc.chrome.* regardless of enabled state (matches the reference engine). */
export const getEffectChangesRaw = (effect) => effect?.changes ?? [];
