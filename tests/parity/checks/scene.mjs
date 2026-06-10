/**
 * checks/scene.mjs — parity for engine/scene.mjs (deriveSceneToken, aggregateScene).
 *
 * Skips until fixtures carry outputs.sceneAnalysis (the comprehensive re-run). The
 * macro's sceneToken carries live-doc fields (actor, cyberwareData) the pure engine
 * doesn't produce — those are stripped before comparison.
 */

import { deriveSceneToken, aggregateScene } from "../../../scripts/engine/scene.mjs";

/** Drop the live-doc / pass-through fields the pure engine doesn't emit. */
function stripToken(e) {
  const { actor, cyberwareData, powerScore, ...rest } = e;
  return rest;
}

export default function sceneChecks(fix) {
  const scene = fix.outputs.sceneAnalysis;
  if (!scene?.allCharacters) return []; // pre-re-run fixture

  const checks = [];

  // Reconstruct the input token set from the captured (power-sorted) characters.
  let tokens = scene.allCharacters.map((e) => ({
    id: e.id,
    name: e.name,
    actorId: e.actor?.id ?? e.actorId,
    styleScore: e.styleScore,
    threatLevel: e.threatLevel,
    styles: e.styles,
    weaponsEquipped: e.weaponsEquipped,
    drawnWeapons: e.drawnWeapons,
    armorVisible: e.armorVisible,
    cyberwareCount: e.cyberwareCount,
    chromePercent: e.chromePercent,
    socialStats: e.socialStats,
    roleData: e.roleData,
  }));

  // deriveSceneToken — this actor's token must match its captured character entry.
  const mine = scene.allCharacters.find((e) => (e.actor?.id ?? e.actorId) === fix.actorId);
  if (mine) {
    checks.push({
      name: `scene.deriveSceneToken — ${fix.actorName}`,
      actual: deriveSceneToken({ id: mine.id, name: mine.name, actorId: fix.actorId, collected: fix.collected, cyberwareData: fix.inputs.cyberwareData }),
      expected: stripToken(mine),
    });
  }

  // aggregateScene — full scene readout, with live-doc fields stripped from chars.
  // When the capture preserved canvas token order, restore it so the threatLevel
  // tie-break (yourThreatRank) is exact; otherwise that one ambiguous field is
  // excluded (equal-threatLevel actors rank by lost original order).
  const order = fix.inputs.sceneTokenOrder;
  const expectedScene = { ...scene, allCharacters: scene.allCharacters.map(stripToken) };
  if (order) {
    const idx = new Map(order.map((id, i) => [id, i]));
    tokens = [...tokens].sort((a, b) => (idx.get(a.id) ?? 0) - (idx.get(b.id) ?? 0));
  } else {
    delete expectedScene.yourThreatRank;
  }
  checks.push({
    name: `scene.aggregateScene — ${fix.actorName}`,
    actual: aggregateScene({ tokens, currentActorId: fix.actorId }),
    expected: expectedScene,
  });

  return checks;
}
