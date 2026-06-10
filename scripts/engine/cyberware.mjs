/**
 * cyberware.mjs — chrome aggregation (the cyberwareData every downstream read uses).
 *
 * A Stage-1 collector, sibling to collect.mjs: it normalizes an actor's cyberware,
 * borg-gear, and drugs into the `cyberwareData` object consumed by profile (cool/
 * fashionware), danger (visible/borg chrome, humanity), archetypes (profileCounts,
 * display/combat split), and disguise. Like collect.mjs it returns plain normalized
 * data (no explainability envelope) and reads CPR paths ONLY through cpr-adapter.
 *
 * The three-tier visibility classification (sc.chrome.* AE → curated map → isConcealed
 * → fallback), category bucketing, EMP/humanity derivation, and diminishing-returns
 * cool math are a faithful port of Phase 82. Category/humanity/visibility tables are
 * config (config/cyberware.mjs), passed in; no formula constant is inlined except the
 * structural maxBodySlots, which lives in the cyberware config's reference (kept inline
 * as the reference engine does — see NOTE).
 *
 * Ports: CyberwareAnalyzer.analyzeCyberware + classifyVisibility/categorizeItem/isExcludedItem.
 * Spec: SC-Module-Architecture-Guide.md §29.1 (Stage 1), §4.1 (CPR Adapter Rule)
 */

import * as cpr from "../data/cpr-adapter.mjs";

// sc.chrome.<cat> → {visibility, threat}. Verbatim from the reference engine.
const SC_CHROME_VIS_MAP = {
  visible_chrome: { visibility: "visible", threat: "neutral" },
  hidden_chrome: { visibility: "hidden", threat: "neutral" },
  fashionware: { visibility: "fashionware", threat: "neutral" },
  bioware: { visibility: "hidden", threat: "neutral" },
  borgware: { visibility: "visible", threat: "threatening" },
  display_chrome: { visibility: "visible", threat: "neutral" },
  combat_chrome: { visibility: "visible", threat: "threatening" },
};

const BORG_GEAR_KEYWORDS = ["linear frame", "exoskeleton", "sigma frame"];
const HIDE_FROM_DISPLAY_PREFIXES = ["meat arm", "meat leg", "medical grade"];
const MAX_BODY_SLOTS = 10; // reference engine's chrome-saturation denominator

// ── visibility / categorization helpers ─────────────────────────────────────

/** Items completely excluded from the Style Checker (scaffolding / core slots). */
function isExcludedItem(item, config) {
  const excluded = config.CYBERWARE_VISIBILITY?.EXCLUDED_ITEMS || [];
  const name = (item.name || "").trim();
  return excluded.includes(name) || cpr.isCyberwareCore(item);
}

/**
 * Three-tier visibility classification.
 * Priority: sc.chrome.* AE → curated item/type map → isConcealed → fallback.
 * @returns {{visibility, threat, chromeWeight}}
 */
function classifyVisibility(item, config) {
  const visConfig = config.CYBERWARE_VISIBILITY;
  if (!visConfig) return { visibility: "visible", threat: "neutral", chromeWeight: 1 };

  const name = (item.name || "").trim();
  const sysType = cpr.getSystemType(item) || "";

  // TIER 1: sc.chrome.* Active Effects — absolute override (disabled-inclusive).
  for (const effect of cpr.getItemEffects(item)) {
    for (const change of cpr.getEffectChangesRaw(effect)) {
      if (change.key?.startsWith("sc.chrome.")) {
        const chromeCat = change.key.split(".")[2];
        const mapped = SC_CHROME_VIS_MAP[chromeCat] || { visibility: "visible", threat: "neutral" };
        return { visibility: mapped.visibility, threat: mapped.threat, chromeWeight: parseInt(change.value) || 1 };
      }
    }
  }

  // TIER 2: curated map — item override first, then type default.
  const override = visConfig.ITEM_OVERRIDES?.[name];
  if (override) return { ...override };
  const typeDefault = visConfig.TYPE_DEFAULTS?.[sysType];
  if (typeDefault) return { ...typeDefault };

  // TIER 3: system isConcealed flag — fallback for homebrew/unmapped.
  if (cpr.isConcealed(item)) return { visibility: "hidden", threat: "neutral", chromeWeight: 0 };

  // TIER 4: final fallback.
  return { visibility: "visible", threat: "neutral", chromeWeight: 1 };
}

/** Bucket a cyberware item into a category key. */
function categorizeItem(item, config, categories) {
  const sysType = cpr.getSystemType(item) || "";
  const classification = classifyVisibility(item, config);

  if (sysType === "borgware") return "borgware";
  if (sysType === "fashionware" || classification.visibility === "fashionware") return "fashionware";
  if (classification.visibility === "hidden") return "hidden_chrome";
  if (classification.visibility === "visible") return "visible_chrome";

  // Legacy keyword fallback for unmapped types.
  const lname = (item.name || "").toLowerCase();
  for (const [catKey, catConfig] of Object.entries(categories)) {
    if (catConfig.keywords) {
      for (const keyword of catConfig.keywords) {
        if (lname.includes(keyword.toLowerCase())) return catKey;
      }
    }
  }
  return "hidden_chrome";
}

// ── the analyzer ────────────────────────────────────────────────────────────

/**
 * Build the cyberwareData aggregation for an actor.
 * @param {object} actor             CPR actor document (read for EMP/humanity)
 * @param {object} cyberwareConfig   { CYBERWARE_CATEGORIES, CYBERWARE_VISIBILITY, HUMANITY_CONFIG }
 * @param {{items?: object[]}} [opts] hypothetical-set override (Wardrobe preview seam)
 * @returns Phase 82 cyberwareData (plain normalized aggregation)
 */
export function analyzeCyberware(actor, cyberwareConfig, { items } = {}) {
  const categories = cyberwareConfig.CYBERWARE_CATEGORIES;
  const humanityConfig = cyberwareConfig.HUMANITY_CONFIG;

  const result = {
    all: [], visible_chrome: [], hidden_chrome: [], fashionware: [], bioware: [], borgware: [], uncategorized: [],
    totalCount: 0, totalStyleMod: 0, totalCoolMod: 0, totalThreatMod: 0,
    humanityLoss: 0, humanityPercent: 100, chromePercent: 0,
    baseEmp: 0, effectiveEmp: 0, empLoss: 0,
    baseHumanity: 100, currentHumanity: 100,
    chromeHL: 0, drugHL: 0, totalHL: 0,
    drugs: [], drugCount: 0,
    socialImpact: null, cyberpsychosisRisk: false,
  };
  const itemList = items ?? cpr.getItems(actor);
  if (!actor || !itemList.length) {
    if (!actor) return result;
  }

  // --- EMP / sheet humanity ---
  const emp = cpr.getStatRaw(actor, "emp");
  const baseEmp = emp.max || emp.value || 0;
  const effectiveEmp = emp.value ?? baseEmp;
  const sheet = cpr.getHumanitySheet(actor);
  const hasSheetHumanity = sheet.max !== undefined && sheet.value !== undefined;
  const baseHumanity = hasSheetHumanity ? sheet.max : baseEmp > 0 ? baseEmp * 10 : humanityConfig.maxHumanity;
  result.baseEmp = baseEmp;
  result.baseHumanity = baseHumanity;

  const drugKeywords = humanityConfig.drugKeywords || [];

  // --- scan items: cyberware, drugs ---
  for (const item of itemList) {
    if (item.type === cpr.ITEM_TYPE.CYBERWARE) {
      if (isExcludedItem(item, cyberwareConfig)) continue;

      const classification = classifyVisibility(item, cyberwareConfig);
      const hlParts = cpr.getHumanityLossParts(item);
      const cyberItem = {
        id: item.id, name: item.name, img: item.img || null,
        category: categorizeItem(item, cyberwareConfig, categories),
        installed: cpr.isCyberwareInstalled(item),
        isFoundational: cpr.isCyberwareFoundational(item),
        _coreSlot: false,
        humanityCost: hlParts.total || hlParts.base || humanityConfig.humanityPerCyberware,
        visibility: classification.visibility,
        threat: classification.threat,
        chromeWeight: classification.chromeWeight,
      };
      result.all.push(cyberItem);

      if (!cyberItem.installed) continue;

      if (result[cyberItem.category + "_count"] === undefined) result[cyberItem.category + "_count"] = 0;
      result[cyberItem.category + "_count"]++;

      const lowerName = (item.name || "").trim().toLowerCase();
      const hideFromDisplay =
        lowerName.includes("(empty)") || lowerName.includes("open slot") ||
        HIDE_FROM_DISPLAY_PREFIXES.some((p) => lowerName.startsWith(p));

      if (!hideFromDisplay) {
        const cat = cyberItem.category;
        if (result[cat]) result[cat].push(cyberItem);
        else result.uncategorized.push(cyberItem);
      }
    }

    // --- drug / addiction detection ---
    if (item.type === cpr.ITEM_TYPE.GEAR || item.type === cpr.ITEM_TYPE.ITEM || item.type === cpr.ITEM_TYPE.DRUG) {
      const lName = (item.name || "").toLowerCase();
      const lDesc = cpr.getDescriptionText(item).toLowerCase();
      const isDrug = drugKeywords.some((kw) => {
        const re = new RegExp("\\b" + kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
        return re.test(lName) || re.test(lDesc);
      });
      if (isDrug) {
        const qty = cpr.getDrugQuantity(item);
        const isAddiction = lName.includes("addiction") || lDesc.includes("addicted") || lDesc.includes("dependency") || lDesc.includes("withdrawal");
        const severity = isAddiction ? "severe" : qty >= 5 ? "moderate" : "mild";
        result.drugs.push({
          id: item.id, name: item.name, severity,
          hlCost: humanityConfig.drugAddictionHL?.[severity] || 2, qty,
        });
      }
    }
  }

  // --- borg gear (linear frames, exoskeletons, …) ---
  for (const item of itemList) {
    if (item.type !== cpr.ITEM_TYPE.GEAR) continue;
    const lName = (item.name || "").toLowerCase();
    const isBorgGear = BORG_GEAR_KEYWORDS.some((kw) => lName.includes(kw));
    if (isBorgGear && cpr.isEquipped(item)) {
      const hlParts = cpr.getHumanityLossParts(item);
      const borgItem = {
        id: item.id, name: item.name, img: item.img || null,
        category: "borgware", installed: true, isFoundational: false, _coreSlot: false,
        humanityCost: hlParts.total || hlParts.base || humanityConfig.humanityPerCyberware,
        isBorgGear: true, visibility: "visible", threat: "threatening", chromeWeight: 3,
      };
      result.all.push(borgItem);
      result.borgware.push(borgItem);
      result.borgware_count = (result.borgware_count || 0) + 1;
    }
  }

  // --- chrome profile counts (visibility-aware, display/combat split) ---
  const installed = result.all.filter((c) => c.installed);
  const displayChromeWeight = installed
    .filter((c) => c.visibility === "visible" && c.threat !== "threatening")
    .reduce((sum, c) => sum + (c.chromeWeight || 1), 0);
  const combatChromeWeight = installed
    .filter((c) => c.visibility === "visible" && c.threat === "threatening")
    .reduce((sum, c) => sum + (c.chromeWeight || 1), 0);
  const hiddenThreats = installed.filter((c) => c.visibility === "hidden" && c.threat === "threatening").length;

  result.profileCounts = {
    visible_chrome: result.visible_chrome_count || 0,
    hidden_chrome: result.hidden_chrome_count || 0,
    fashionware: result.fashionware_count || 0,
    bioware: result.bioware_count || 0,
    borgware: result.borgware_count || 0,
    display_chrome: displayChromeWeight,
    combat_chrome: combatChromeWeight,
  };
  result.displayChromeWeight = displayChromeWeight;
  result.combatChromeWeight = combatChromeWeight;
  result.hiddenThreats = hiddenThreats;

  result.totalCount = result.all.filter((c) => c.installed && !c._coreSlot).length;
  const displayCount =
    result.visible_chrome.length + result.hidden_chrome.length + result.fashionware.length +
    result.bioware.length + result.borgware.length + result.uncategorized.length;

  for (const catKey of ["visible_chrome", "hidden_chrome", "fashionware", "bioware", "borgware"]) {
    const catConfig = categories[catKey];
    const items_ = result[catKey];
    result.totalStyleMod += catConfig.styleModifier * items_.length;
    // Diminishing returns on cool: first 2 full, 3–4 half, 5+ quarter.
    const count = items_.length;
    const fullItems = Math.min(count, 2);
    const halfItems = Math.min(Math.max(count - 2, 0), 2);
    const quarterItems = Math.max(count - 4, 0);
    result.totalCoolMod += catConfig.coolModifier * (fullItems + halfItems * 0.5 + quarterItems * 0.25);
    result.totalThreatMod += catConfig.threatModifier * items_.length;
  }

  // --- humanity (sheet-driven; cyberware HL is informational) ---
  const chromeHL = result.all.filter((c) => c.installed).reduce((sum, c) => sum + (c.humanityCost || 0), 0);
  const drugHL = result.drugs.reduce((sum, d) => sum + d.hlCost, 0);
  const totalHL = chromeHL + drugHL;
  result.chromeHL = chromeHL;
  result.drugHL = drugHL;
  result.drugCount = result.drugs.length;
  result.totalHL = totalHL;
  result.humanityLoss = totalHL;

  const currentHumanity = hasSheetHumanity ? sheet.value : Math.max(0, baseHumanity - totalHL);
  result.currentHumanity = currentHumanity;
  result.humanityPercent = baseHumanity > 0 ? Math.max(0, Math.min(100, Math.round((currentHumanity / baseHumanity) * 100))) : 0;

  result.effectiveEmp = hasSheetHumanity ? effectiveEmp : Math.floor(Math.max(0, currentHumanity) / 10);
  result.empLoss = Math.max(0, baseEmp - result.effectiveEmp);

  result.cyberpsychosisRisk = currentHumanity <= 10 && currentHumanity > 0;
  result.cyberpsychosis = currentHumanity <= 0;

  const impacts = humanityConfig.socialImpact || [];
  result.socialImpact = impacts.find((i) => result.effectiveEmp <= i.maxEmp) || impacts[impacts.length - 1] || null;

  const visibleCount = result.visible_chrome.length + result.borgware.length;
  result.chromePercent = Math.min(100, Math.round((visibleCount / MAX_BODY_SLOTS) * 100));
  result.displayCount = displayCount;

  return result;
}
