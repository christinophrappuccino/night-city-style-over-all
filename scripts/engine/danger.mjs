/**
 * danger.mjs — Danger Score (how much trouble you represent in a fight).
 *
 * Pure; consumes resolved inputs (prepared actor system for BODY/HP, cyberware
 * aggregation, weapon list, injuries, social/role data, ammo heat). Per-role
 * danger multipliers come from config ROLE_PROFILES; remaining constants from
 * Tunables (danger). Output is the Phase 82 shape ({value,tier,color,tooltip,
 * components}) plus the explainability envelope.
 *
 * Ports: StyleRatingCalculator.calculateDangerScore.
 * Spec: SC-Module-Architecture-Guide.md §29.1 (Stage 5), §4.1, §18
 */

import { getTunables } from "../config/tunables.mjs";

/**
 * @param {object} p
 * @param {object} p.actorSystem      prepared actor.system (stats.body, derivedStats.hp)
 * @param {object[]} p.criticalInjuries [{name, deathSaveIncrease, location, id}]
 * @param {object[]} p.weaponsData     collected weapons.equipped (each has .state)
 * @param {number} p.armorCount
 * @param {object} p.cyberwareData
 * @param {object} p.socialStats       {cool, reputation}
 * @param {object} p.roleData
 * @param {object} p.roleProfiles      ROLE_PROFILES; may be null
 * @param {object} p.ammoHeat          {total, breakdown}
 * @param {object} [p.tunables]
 * @returns Phase 82 {value, tier, color, tooltip, components} + {label, blurb, tunablesApplied}
 */
export function dangerScore({
  actorSystem, criticalInjuries = [], weaponsData = [], armorCount = 0,
  cyberwareData = null, socialStats = null, roleData = null, roleProfiles = null,
  ammoHeat = null, tunables = getTunables(),
}) {
  const D = tunables.danger;
  const ss = socialStats || { cool: 0, reputation: 0 };
  const cw = cyberwareData || { profileCounts: {}, currentHumanity: 100, baseHumanity: 100, cyberpsychosisRisk: false };
  const _ahd = ammoHeat || { total: 0, breakdown: [] };
  const components = {};

  // Weapons.
  const drawnWeapons = weaponsData.filter((w) => w.state === "drawn");
  const holsteredWeapons = weaponsData.filter((w) => w.state !== "drawn");
  let weaponDanger = 0;
  for (let i = 0; i < drawnWeapons.length; i++) weaponDanger += i === 0 ? D.weapon.drawnFirst : D.weapon.drawnEach;
  for (let i = 0; i < holsteredWeapons.length; i++) weaponDanger += i === 0 ? D.weapon.holsteredFirst : D.weapon.holsteredEach;
  components.weaponDanger = weaponDanger;
  components.drawnCount = drawnWeapons.length;
  components.holsteredCount = holsteredWeapons.length;

  // Armor.
  const armorDanger = armorCount >= 1 ? D.armor.base + Math.max(0, armorCount - 1) * D.armor.perExtra : 0;
  components.armorDanger = armorDanger;

  // Chrome.
  const pc = cw.profileCounts || {};
  const visibleChromeDanger = Math.min(D.chrome.visibleCap, (pc.visible_chrome || 0) * D.chrome.visiblePerPiece);
  const borgDanger = (pc.borgware || 0) > 0 ? D.chrome.borgFlat : 0;
  const chromeDanger = visibleChromeDanger + borgDanger;
  components.chromeDanger = chromeDanger;
  components.visibleChromeCount = pc.visible_chrome || 0;
  components.borgCount = pc.borgware || 0;

  // Threat ammo.
  const ammoDanger = Math.min(D.ammo.cap, Math.round(_ahd.total * D.ammo.rate));
  components.ammoDanger = ammoDanger;

  // Body.
  const body = actorSystem?.stats?.body?.value || 0;
  const bodyTier = D.body.find((t) => body >= t.min);
  const bodyDanger = bodyTier ? bodyTier.pts : 0;
  components.bodyDanger = bodyDanger;
  components.body = body;

  // Humanity.
  const humCurrent = cw.currentHumanity ?? 100;
  const humMax = cw.baseHumanity || 100;
  const humPercent = humMax > 0 ? (humCurrent / humMax) * 100 : 100;
  const humTier = D.humanity.tiers.find((t) => humPercent <= t.maxPct);
  const humanityDanger = humTier ? humTier.pts : 0;
  const cyberpsychoFlag = cw.cyberpsychosisRisk ? D.humanity.cyberpsychoFlag : 0;
  components.humanityDanger = humanityDanger + cyberpsychoFlag;
  components.humPercent = Math.round(humPercent);

  // Wounds.
  const hpMax = actorSystem?.derivedStats?.hp?.max || 1;
  const hpCurrent = actorSystem?.derivedStats?.hp?.value ?? hpMax;
  const hpPercent = (hpCurrent / Math.max(1, hpMax)) * 100;
  const woundTier = D.wounds.find((t) => hpPercent <= t.maxPct);
  const woundDanger = woundTier ? woundTier.pts : 0;
  components.woundDanger = woundDanger;
  components.hpPercent = Math.round(hpPercent);

  // Critical injuries.
  const critCount = criticalInjuries.length;
  let injuryDanger = 0;
  const injuryDetails = [];
  for (const ci of criticalInjuries) {
    const name = ci.name;
    const severe = ci.deathSaveIncrease ?? ci.system?.deathSaveIncrease;
    const loc = ci.location ?? ci.system?.location ?? "body";
    if (D.injury.terrifyingNames.includes(name)) {
      injuryDanger += D.injury.terrifying;
      injuryDetails.push({ name, id: ci.id, type: "terrifying", pts: D.injury.terrifying + (severe ? D.injury.severeBonus : 0), loc });
    } else if (D.injury.impairedNames.includes(name)) {
      injuryDanger += D.injury.impaired;
      injuryDetails.push({ name, id: ci.id, type: "impaired", pts: D.injury.impaired + (severe ? D.injury.severeBonus : 0), loc });
    } else {
      injuryDanger += D.injury.scarred;
      injuryDetails.push({ name, id: ci.id, type: "scarred", pts: D.injury.scarred + (severe ? D.injury.severeBonus : 0), loc });
    }
    if (severe) injuryDanger += D.injury.severeBonus;
  }
  const stackTier = D.injury.stack.find((t) => critCount >= t.min);
  const injuryStack = stackTier ? stackTier.pts : 0;
  injuryDanger += injuryStack;
  components.injuryDanger = injuryDanger;
  components.injuryStack = injuryStack;
  components.critCount = critCount;
  components.injuryDetails = injuryDetails;

  // Stats.
  const coolDanger = ss.cool * D.stats.coolRate;
  const repDanger = ss.reputation * D.stats.repRate;
  components.coolDanger = coolDanger;
  components.repDanger = repDanger;

  // Subtotal.
  let danger =
    weaponDanger + armorDanger + chromeDanger + ammoDanger +
    bodyDanger + (humanityDanger + cyberpsychoFlag) + woundDanger +
    injuryDanger + coolDanger + repDanger;

  // Role multiplier.
  let roleMult = 1.0;
  let roleName = null;
  if (roleData?.hasRole && roleProfiles) {
    const key = roleData.primaryRole?.key;
    const rp = roleProfiles[key] || roleProfiles.none;
    roleMult = rp.dangerMultiplier ?? (
      D.role.highKeys.includes(key) ? D.role.highMult :
      D.role.midKeys.includes(key) ? D.role.midMult : D.role.lowMult
    );
    roleName = roleData.primaryRole.name;
    const rankScale = D.role.rankScaleBase + Math.min(D.role.rankCap, roleData.primaryRole.rank) * D.role.rankScalePerRank;
    roleMult *= rankScale;
  }
  danger = Math.round(danger * roleMult);
  components.roleMult = roleMult;
  components.roleName = roleName;

  // Cool masking.
  const coolMasking = ss.cool >= D.coolMasking.threshold ? Math.round((ss.cool - 5) * D.coolMasking.perPointOver5) : 0;
  danger -= coolMasking;
  components.coolMasking = coolMasking;

  danger = Math.max(0, Math.min(100, danger));

  const tier = danger >= D.tiers.extreme ? "EXTREME" : danger >= D.tiers.high ? "HIGH" : danger >= D.tiers.moderate ? "MODERATE" : "LOW";
  const color = danger >= D.tiers.extreme ? D.colors.extreme : danger >= D.tiers.high ? D.colors.high : danger >= D.tiers.moderate ? D.colors.moderate : D.colors.low;

  const tooltip = [
    "DANGER SCORE — How much trouble you represent",
    "―――――――――――――――――――",
    `Weapons: +${weaponDanger} (${drawnWeapons.length} drawn, ${holsteredWeapons.length} holstered)`,
    `Armor (${armorCount}): +${armorDanger}`,
    `Chrome: +${chromeDanger} (${pc.visible_chrome || 0} visible${borgDanger > 0 ? ", BORGWARE" : ""})`,
    ...(ammoDanger > 0 ? [`Ordnance: +${ammoDanger}`] : []),
    `Body (${body}): +${bodyDanger}`,
    `Humanity (${Math.round(humPercent)}%): +${humanityDanger + cyberpsychoFlag}${cyberpsychoFlag ? " ⚠ PSYCHOSIS RISK" : ""}`,
    `Wounds (${Math.round(hpPercent)}% HP): ${woundDanger >= 0 ? "+" : ""}${woundDanger}`,
    ...(critCount > 0 ? [
      `Injuries (${critCount}): ${injuryDanger >= 0 ? "+" : ""}${injuryDanger}${injuryStack > 0 ? " (incl. +" + injuryStack + " stacking)" : ""}`,
      ...injuryDetails.map((d) => `  · ${d.name} (${d.loc}): ${d.pts >= 0 ? "+" : ""}${d.pts}`),
    ] : []),
    `COOL (${ss.cool}): +${coolDanger}`,
    `Rep (${ss.reputation}): +${repDanger}`,
    ...(roleName ? [`Role (${roleName}): ×${roleMult.toFixed(2)}`] : []),
    ...(coolMasking > 0 ? [`Composure Masking: -${coolMasking}`] : []),
    "―――――――――――――――――――",
    `Total: ${danger}/100 — ${tier}`,
  ].join(" \n ");

  return {
    // ---- Phase 82-compatible core
    value: danger,
    tier,
    color,
    tooltip,
    components,
    // ---- explainability
    label: `Danger ${danger} — ${tier}`,
    blurb: `Reads as ${tier} threat (${danger}/100).`,
    tunablesApplied: { "danger.tiers": D.tiers, "danger.role": D.role },
  };
}
