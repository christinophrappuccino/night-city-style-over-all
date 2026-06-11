/**
 * heat.mjs — Heat Index (how much attention you draw) + threat-ammo heat.
 *
 * Pure; consumes resolved inputs (style/scene scores, counts, social stats, role
 * data, scMods, ammo heat). Per-role tolerances come from config ROLE_PROFILES; the
 * remaining constants come from Tunables (heat). Output is the Phase 82 shape — note
 * its `components` is an OBJECT breakdown (kept for parity); the explainability
 * envelope (value/label/blurb/tunablesApplied) wraps around it.
 *
 * Ports: StyleRatingCalculator.calculateHeatIndex, .calculateAmmoHeat.
 * Spec: SC-Module-Architecture-Guide.md §29.1 (Stage 5), §4.1, §18
 */

import { getTunables } from "../config/tunables.mjs";

/**
 * Threat-ammo heat from a collected threatAmmo set.
 * @returns {{total:number, breakdown:{variety,name,amount,heat}[]}}
 */
export function ammoHeat(threatAmmo, tunables = getTunables()) {
  const A = tunables.heat.ammo;
  if (!threatAmmo?.visible?.length) return { total: 0, breakdown: [] };
  let total = 0;
  const breakdown = [];
  for (const a of threatAmmo.visible) {
    const cfg = A.varieties[a.variety] || A.defaultPerVariety;
    const heat = Math.min(cfg.cap, Math.round(cfg.base + Math.max(0, a.amount - 1) * cfg.perUnit));
    total += heat;
    breakdown.push({ variety: a.variety, name: a.name, amount: a.amount, heat });
  }
  return { total: Math.min(A.totalCap, total), breakdown };
}

/**
 * Wound/injury heat — blood and visible injuries draw eyes (macro initialize(),
 * §12406–12418). The SELF-view pipeline folds this into scMods.heat before
 * heatIndex (the macro did it inline in the app; here it is a pure helper so the
 * orchestrator stays thin and the numbers stay tunable).
 *
 * @param {object} p
 * @param {{value:number, max:number}} p.hp          actor hit points
 * @param {string[]} p.criticalInjuryNames           names of criticalInjury items
 * @param {string[]} p.terrifyingNames               tunables.danger.injury.terrifyingNames
 * @param {object} [p.tunables]
 * @returns {{value:number, woundHeat:number, injuryHeat:number, tunablesApplied:object}}
 */
export function woundInjuryHeat({ hp, criticalInjuryNames = [], terrifyingNames = [], tunables = getTunables() }) {
  const W = tunables.heat.woundInjury;
  const hpPct = ((hp?.value ?? 1) / Math.max(1, hp?.max ?? 1)) * 100;
  const tier = W.woundTiers.find((t) => hpPct <= t.maxPct);
  const woundHeat = tier ? tier.heat : 0;
  let injuryHeat = 0;
  for (const name of criticalInjuryNames) {
    injuryHeat += terrifyingNames.includes(name) ? W.terrifyingInjuryHeat : W.otherInjuryHeat;
  }
  return { value: woundHeat + injuryHeat, woundHeat, injuryHeat, tunablesApplied: { "heat.woundInjury": W } };
}

/**
 * Heat Index.
 * @param {object} p
 * @param {number} p.styleScore        your style rating total
 * @param {number} p.sceneAvg          scene average style score
 * @param {number} p.weaponsEquipped   visible weapon count
 * @param {number} p.chromePercent
 * @param {number} p.armorEquipped     visible armor count
 * @param {object} p.socialStats       {cool, reputation, …}
 * @param {object} p.roleData          extractRoles() output
 * @param {object} p.roleProfiles      ROLE_PROFILES (config/factions); may be null
 * @param {object} p.scMods            disguise modifiers (heat field), incl. wound/injury
 * @param {object} p.ammoHeat          {total, breakdown} (see ammoHeat())
 * @param {number} p.drawnWeapons
 * @param {object} [p.tunables]
 * @returns Phase 82 {value, level, repHeat, coolReduction, tooltip, components} + {label, blurb, tunablesApplied}
 */
/** Heat value → band word, from the live dials (shared by heatIndex + the
 *  §14.3 override re-band, so a pinned value can never wear the wrong label). */
export function heatLevel(heat, tunables = getTunables()) {
  const L = tunables.heat.levels;
  return heat >= L.blazing ? "BLAZING" : heat >= L.hot ? "HOT" : heat >= L.warm ? "WARM" : "COLD";
}

export function heatIndex({
  styleScore, sceneAvg, weaponsEquipped, chromePercent, armorEquipped,
  socialStats = null, roleData = null, roleProfiles = null, scMods = null,
  ammoHeat: ammoHeatData = null, drawnWeapons = 0, tunables = getTunables(),
}) {
  const H = tunables.heat;
  const ss = socialStats || { cool: 0, reputation: 0 };
  let heat = 0;

  // Style outlier (role-normalized).
  let styleHeat = 0;
  let styleHeatMult = 1.0;
  let styleHeatCap = 100;
  if (sceneAvg > 0) {
    const styleOutlier = Math.abs(styleScore / sceneAvg - 1);
    styleHeat = styleOutlier * H.styleOutlierMultiplier;
    if (roleData?.hasRole && roleProfiles) {
      const rp = roleProfiles[roleData.primaryRole.key] || roleProfiles.none;
      if (rp.styleTolerance) {
        styleHeatMult = rp.styleTolerance.heatReduction;
        styleHeatCap = rp.styleTolerance.maxStyleHeat;
        styleHeat = Math.min(styleHeatCap, styleHeat * styleHeatMult);
      }
    }
  }
  heat += styleHeat;

  // Weapons.
  let weaponHeat = 0;
  const carried = Math.max(0, weaponsEquipped - drawnWeapons);
  for (let i = 0; i < drawnWeapons; i++) weaponHeat += i === 0 ? H.weapon.drawnFirst : H.weapon.drawnEach;
  for (let i = 0; i < carried; i++) weaponHeat += i === 0 ? H.weapon.carriedFirst : H.weapon.carriedEach;
  let weaponHeatMult = 1.0;
  if (roleData?.hasRole && roleProfiles) {
    const rp = roleProfiles[roleData.primaryRole.key] || roleProfiles.none;
    const wt = rp.weaponTolerance;
    const toleratedWeapons = wt.baseline + roleData.primaryRole.rank * wt.perRank;
    if (weaponsEquipped <= toleratedWeapons) {
      weaponHeat *= wt.heatReduction;
    } else {
      const toleratedHeat = Math.min(weaponHeat, toleratedWeapons * H.weapon.toleratedHeatPerWeapon) * wt.heatReduction;
      const excessHeat = Math.max(0, weaponHeat - toleratedWeapons * H.weapon.toleratedHeatPerWeapon);
      weaponHeat = toleratedHeat + excessHeat;
    }
    weaponHeatMult = wt.heatReduction;
  }
  heat += weaponHeat;

  // Chrome.
  const chromeHeat = Math.max(0, (chromePercent - H.chrome.threshold) * H.chrome.ratePerPct);
  heat += chromeHeat;

  // Armor.
  let armorHeat = armorEquipped >= H.armor.minPieces ? (armorEquipped - 1) * H.armor.perExtraPiece : 0;
  let armorHeatMult = 1.0;
  if (roleData?.hasRole && roleProfiles) {
    const rp = roleProfiles[roleData.primaryRole.key] || roleProfiles.none;
    armorHeat *= rp.armorTolerance.heatReduction;
    armorHeatMult = rp.armorTolerance.heatReduction;
  }
  heat += armorHeat;

  // Threat ammo.
  const _ahd = ammoHeatData || { total: 0, breakdown: [] };
  const ammoTotal = _ahd.total;
  heat += ammoTotal;

  // Reputation.
  const R = H.rep;
  const repHeat = Math.round(
    Math.min(ss.reputation, R.lowCap) * R.lowRate +
    Math.max(0, Math.min(ss.reputation - R.lowCap, R.midCap - R.lowCap)) * R.midRate +
    Math.max(0, ss.reputation - R.midCap) * R.highRate
  );
  heat += repHeat;

  // COOL composure (role-masked).
  let coolMaskMult = 1.0;
  if (roleData?.hasRole && roleProfiles) {
    const rp = roleProfiles[roleData.primaryRole.key] || roleProfiles.none;
    coolMaskMult = rp.perception.coolMasking;
  }
  const coolReduction = Math.round(ss.cool * H.coolPerPoint * coolMaskMult);
  heat -= coolReduction;

  // Gear heat (sc.heat / styleData, incl. wound+injury).
  let gearHeat = 0;
  if (scMods?.heat) {
    gearHeat = scMods.heat;
    heat += gearHeat;
  }

  heat = Math.min(100, Math.max(0, Math.round(heat)));

  const level = heatLevel(heat, tunables);

  const tooltip = [
    "HEAT INDEX — How much attention you draw",
    "―――――――――――――――――――",
    `Style Outlier (${styleScore >= sceneAvg ? "overdressed" : "underdressed"}): +${Math.round(styleHeat)}${styleHeatMult < 1.0 ? " (role ×" + styleHeatMult.toFixed(1) + ", cap " + styleHeatCap + ")" : ""}`,
    `Weapons (${drawnWeapons} drawn, ${Math.max(0, weaponsEquipped - drawnWeapons)} holstered): +${Math.round(weaponHeat)}`,
    `Chrome (${chromePercent}%): +${Math.round(chromeHeat)}`,
    `Armor (${armorEquipped}): +${Math.round(armorHeat)}`,
    ...(ammoTotal > 0 ? [`Ordnance: +${ammoTotal}`, ..._ahd.breakdown.map((b) => `  · ${b.name} ×${b.amount}: +${b.heat}`)] : []),
    `Rep Draw: +${repHeat}`,
    `COOL Composure: -${coolReduction}${coolMaskMult !== 1.0 ? " (×" + coolMaskMult.toFixed(1) + " role)" : ""}`,
    ...(gearHeat !== 0 ? [`Gear Effects: ${gearHeat > 0 ? "+" : ""}${gearHeat}`] : []),
    ...(roleData?.hasRole ? [`Role (${roleData.primaryRole.name} ${roleData.primaryRole.rank}): wpn×${weaponHeatMult.toFixed(1)} arm×${armorHeatMult.toFixed(1)}`] : []),
    "―――――――――――――――――――",
    `Total: ${heat}/100 — ${level}`,
  ].join(" \n ");

  return {
    // ---- Phase 82-compatible core
    value: heat,
    level,
    repHeat,
    coolReduction,
    tooltip,
    components: {
      styleHeat: Math.round(styleHeat),
      styleHeatMult,
      styleHeatCap,
      weaponHeat: Math.round(weaponHeat),
      weaponsEquipped,
      drawnWeapons,
      weaponHeatMult,
      chromeHeat: Math.round(chromeHeat),
      chromePercent,
      armorHeat: Math.round(armorHeat),
      armorEquipped,
      armorHeatMult,
      ammoHeat: ammoTotal,
      ammoBreakdown: _ahd.breakdown,
      repHeat,
      coolReduction,
      coolMaskMult,
      gearHeat,
    },
    // ---- explainability
    label: `Heat ${heat} — ${level}`,
    blurb: `Draws ${heat}/100 attention (${level}).`,
    tunablesApplied: { "heat.styleOutlierMultiplier": H.styleOutlierMultiplier, "heat.levels": H.levels },
  };
}
