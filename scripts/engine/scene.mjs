/**
 * scene.mjs — multi-token scene analysis (where you rank in the room).
 *
 * Pure; works over a list of per-token derived data rather than the live canvas.
 * `deriveSceneToken` turns one actor's collected set + cyberware into a scene token;
 * `aggregateScene` ranks the room and produces the scene readout. Constants from
 * Tunables (scene).
 *
 * NOTE: SceneAnalyzer.getTacticalRoles (UI advisory strings) is NOT part of the
 * scene readout and rides the GM dashboard (M3), not this engine module.
 *
 * Ports: SceneAnalyzer.analyze + its per-token helpers.
 * Spec: SC-Module-Architecture-Guide.md §29.1, §4.1, §18
 */

import { getTunables } from "../config/tunables.mjs";

/**
 * Derive one scene token from a collected set + cyberware aggregation.
 * @returns token {id, name, actorId, styleScore, threatLevel, styles, weaponsEquipped,
 *   drawnWeapons, armorVisible, cyberwareCount, chromePercent, socialStats, roleData}
 */
export function deriveSceneToken({ id, name, actorId, collected, cyberwareData }, tunables = getTunables()) {
  const S = tunables.scene;
  const weaponsEquipped = collected.weapons.equipped.length;
  const drawnWeapons = collected.weapons.equipped.filter((w) => w.state === "drawn").length;
  const armorVisible = collected.armor.equipped.length;
  const threatLevel =
    weaponsEquipped * S.threat.weaponPer +
    armorVisible * S.threat.armorPer +
    (cyberwareData?.totalThreatMod || 0);
  const styles = collected.equippedClothing.filter((c) => c.style).map((c) => c.style);

  return {
    id,
    name,
    actorId,
    styleScore: collected.totalCost,
    threatLevel,
    styles,
    weaponsEquipped,
    drawnWeapons,
    armorVisible,
    cyberwareCount: cyberwareData?.totalCount || 0,
    chromePercent: cyberwareData?.chromePercent || 0,
    socialStats: collected.socialStats,
    roleData: collected.roleData,
  };
}

/**
 * Aggregate a room of scene tokens from the viewpoint of `currentActorId`.
 * @param {object} p
 * @param {object[]} p.tokens     deriveSceneToken() outputs
 * @param {string} p.currentActorId
 * @param {object} [p.tunables]
 * @returns Phase 82 sceneData
 */
export function aggregateScene({ tokens, currentActorId, tunables = getTunables() }) {
  const S = tunables.scene;
  const sceneTokens = tokens.map((t) => ({ ...t }));

  const current = sceneTokens.find((t) => t.actorId === currentActorId);
  const yourScore = current ? current.styleScore : 0;
  const scores = sceneTokens.map((t) => t.styleScore);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  sceneTokens.forEach((t) => {
    const ss = t.socialStats || { cool: 0, reputation: 0 };
    t.powerScore =
      ss.reputation * S.powerScore.repWeight +
      ss.cool * S.powerScore.coolWeight +
      t.styleScore * S.powerScore.styleWeight +
      t.threatLevel * S.powerScore.threatWeight;
  });

  const sortedByPower = [...sceneTokens].sort((a, b) => b.powerScore - a.powerScore);
  const yourRank = sortedByPower.findIndex((t) => t.actorId === currentActorId) + 1;

  const allStyles = {};
  const styleWearers = {};
  sceneTokens.forEach((token) => {
    token.styles.forEach((style) => { allStyles[style] = (allStyles[style] || 0) + 1; });
    new Set(token.styles).forEach((style) => { styleWearers[style] = (styleWearers[style] || 0) + 1; });
  });
  const mostCommonStyle = Object.entries(allStyles).sort((a, b) => b[1] - a[1])[0];

  const sortedByThreat = [...sceneTokens].sort((a, b) => b.threatLevel - a.threatLevel);
  const yourThreatRank = sortedByThreat.findIndex((t) => t.actorId === currentActorId) + 1;

  const chromeValues = sceneTokens.map((t) => t.cyberwareCount);
  const avgChrome = chromeValues.length > 0 ? chromeValues.reduce((a, b) => a + b, 0) / chromeValues.length : 0;

  const totalUniqueStyles = Object.keys(allStyles).length;
  const totalStyleItems = Object.values(allStyles).reduce((a, b) => a + b, 0);

  return {
    totalCharacters: sceneTokens.length,
    averageStyleScore: Math.round(avgScore),
    yourStyleScore: yourScore,
    yourRank,
    status: yourScore > avgScore ? "ABOVE AVERAGE" : yourScore < avgScore ? "BELOW AVERAGE" : "AVERAGE",
    mostCommonStyle: mostCommonStyle ? mostCommonStyle[0] : "None",
    mostCommonStyleCount: mostCommonStyle ? styleWearers[mostCommonStyle[0]] || mostCommonStyle[1] : 0,
    styleDistribution: allStyles,
    styleWearers: styleWearers || {},
    yourThreatRank,
    totalArmed: sceneTokens.filter((t) => t.weaponsEquipped > 0).length,
    totalArmored: sceneTokens.filter((t) => t.armorVisible > 0).length,
    totalChromed: sceneTokens.filter((t) => t.cyberwareCount > 0).length,
    allCharacters: sortedByPower,
    averageChrome: Math.round(avgChrome * 10) / 10,
    totalUniqueStyles,
    totalStyleItems,
  };
}
