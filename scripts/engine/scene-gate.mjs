/**
 * scene-gate.mjs — venue entry check: does a character meet a gate's criteria?
 *
 * Pure; consumes a per-token read (tokenData) + a gate's criteria + the factions
 * registry. Returns the Phase 82 {status, issues} where status is green/yellow/red
 * and issues carry severity + message. Confidence floors come from Tunables (gm).
 *
 * Ports: GMDashboardApp.evaluateGate.
 * Spec: SC-Module-Architecture-Guide.md §29.1 (Stage 5), §4.1, §18
 */

import { getTunables } from "../config/tunables.mjs";
import { formatStyleName } from "./recommendations.mjs";

// tier number → grade label (display map, mirrors config TIERS grades).
const TIER_TO_GRADE = { 1: "F", 2: "D", 3: "C", 4: "B", 5: "A", 6: "S", 7: "S+", 8: "SS", 9: "SSS" };

/**
 * @param {object} p
 * @param {object} p.tokenData  { styleScore, tier{number,grade}, styles, weapons{visible,concealed},
 *   visibleChromeCount, archetypes[{key,confidence}], socialStats }
 * @param {object} p.criteria   a gate's criteria block (scene-gates config)
 * @param {object} p.factions   FACTIONS registry (for hostileFactions / factionCheck)
 * @param {object} [p.tunables]
 * @returns {{status:'green'|'yellow'|'red', issues:{type,msg,severity}[]}}
 */
export function evaluateGate({ tokenData, criteria, factions = null, tunables = getTunables() }) {
  const G = tunables.gm;
  const issues = [];
  let status = "green";
  const flagRed = (type, msg) => { issues.push({ type, msg, severity: "red" }); status = "red"; };
  const flagYellow = (type, msg) => { issues.push({ type, msg, severity: "yellow" }); if (status !== "red") status = "yellow"; };

  // Style score band.
  if (criteria.minStyleScore && tokenData.styleScore < criteria.minStyleScore)
    flagRed("score", `Style €$${tokenData.styleScore} below minimum €$${criteria.minStyleScore}`);
  if (criteria.maxStyleScore && tokenData.styleScore > criteria.maxStyleScore)
    flagYellow("score", `Style €$${tokenData.styleScore} exceeds max €$${criteria.maxStyleScore} — too flashy`);

  // Tier.
  if (criteria.minTier && tokenData.tier.number < criteria.minTier)
    flagRed("tier", `Grade ${tokenData.tier.grade || "F"} below required ${TIER_TO_GRADE[criteria.minTier] || "F"}`);

  // Required / banned styles.
  if (criteria.requiredStyles?.length) {
    const missing = criteria.requiredStyles.filter((s) => !tokenData.styles[s]);
    if (missing.length) flagRed("style", `Missing required style${missing.length > 1 ? "s" : ""}: ${missing.map(formatStyleName).join(", ")}`);
  }
  if (criteria.bannedStyles?.length) {
    const found = criteria.bannedStyles.filter((s) => tokenData.styles[s]);
    if (found.length) flagRed("style", `Banned style${found.length > 1 ? "s" : ""}: ${found.map(formatStyleName).join(", ")}`);
  }

  // Weapons.
  const visWeapons = tokenData.weapons?.visible?.length || 0;
  const concWeapons = tokenData.weapons?.concealed?.length || 0;
  if (criteria.visibleWeaponsPolicy === "banned" && visWeapons > 0)
    flagRed("weapon", `${visWeapons} visible weapon${visWeapons > 1 ? "s" : ""} — not allowed`);
  if (criteria.concealedWeaponsPolicy === "banned" && concWeapons > 0)
    flagYellow("weapon", "Concealed weapons detected — not allowed");

  // Chrome.
  const vc = tokenData.visibleChromeCount || 0;
  if (criteria.visibleChromePolicy === "banned" && vc > 0) flagRed("chrome", `${vc} visible chrome — not allowed`);
  if (criteria.visibleChromePolicy === "required" && vc === 0) flagYellow("chrome", "No visible chrome — expected here");
  if (criteria.maxVisibleChrome !== null && criteria.maxVisibleChrome !== undefined && vc > criteria.maxVisibleChrome)
    flagRed("chrome", `${vc} visible chrome exceeds max ${criteria.maxVisibleChrome}`);
  if (criteria.minVisibleChrome && vc < criteria.minVisibleChrome)
    flagYellow("chrome", `Only ${vc} visible chrome — minimum ${criteria.minVisibleChrome}`);

  // Faction reads.
  if (criteria.hostileFactions?.length && factions) {
    const playerFactionKeys = new Set();
    tokenData.archetypes.slice(0, 3).forEach((arch) => {
      if ((arch.confidence ?? 0) < G.factionReadConfidenceFloor) return;
      Object.entries(factions).forEach(([fKey, fData]) => { if (fData.archetype === arch.key) playerFactionKeys.add(fKey); });
    });
    const hostileMatch = criteria.hostileFactions.filter((hf) => playerFactionKeys.has(hf));
    if (hostileMatch.length) flagRed("faction", `Reads as ${hostileMatch.map((k) => factions[k]?.label || k).join(", ")} — hostile here`);
  }
  if (criteria.factionCheck && factions) {
    const targetFaction = factions[criteria.factionCheck];
    if (targetFaction) {
      const matchesTarget = tokenData.archetypes.some((a) => a.key === targetFaction.archetype && (a.confidence ?? 0) >= G.gate.factionCheckMinConfidence);
      if (!matchesTarget) flagYellow("faction", `Doesn't read as ${targetFaction.label}`);
    }
  }

  // Social-stat gates.
  const ss = tokenData.socialStats || { cool: 0, personalGrooming: 0, wardrobeAndStyle: 0, reputation: 0 };
  if (criteria.minCool && ss.cool < criteria.minCool) flagYellow("stat", `COOL ${ss.cool} below minimum ${criteria.minCool} — lacks composure`);
  if (criteria.minRep && ss.reputation < criteria.minRep) flagRed("stat", `Rep ${ss.reputation} below minimum ${criteria.minRep} — nobody knows them`);
  if (criteria.maxRep && ss.reputation > criteria.maxRep) flagYellow("stat", `Rep ${ss.reputation} exceeds max ${criteria.maxRep} — too recognizable, draws heat`);
  if (criteria.minGrooming && ss.personalGrooming < criteria.minGrooming) flagYellow("stat", `Grooming ${ss.personalGrooming} below minimum ${criteria.minGrooming} — presentation too rough`);
  if (criteria.minWS && ss.wardrobeAndStyle < criteria.minWS) flagYellow("stat", `W&S ${ss.wardrobeAndStyle} below minimum ${criteria.minWS} — doesn't know the dress code`);

  if (issues.length === 0) issues.push({ type: "pass", msg: "All clear — fits the scene perfectly", severity: "green" });
  return { status, issues };
}
