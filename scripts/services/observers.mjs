/**
 * observers.mjs — the §24 As-Seen-By lens: WHO is looking, and what they get.
 *
 * The engine pipeline's observed view (M9.1/M9.3) answers "what physically
 * shows"; this service is Stage 6 (§29.1) on top — the perception/recognition
 * LENS for a chosen observer:
 *   · generic street observer (default — the block's passing read)
 *   · a faction ("how a Tyger Claw reads you") — adds the disguise verdict
 *   · a specific scene token — uses their actual effective INT + Perception
 *
 * App previews are PASSIVE reads: deterministic (INT + PER +
 * tunables.observer.passiveRollEquivalent vs the COOL-shifted thresholds), no
 * die — the live token-HUD scan keeps its 1d10. Reveal gating mirrors the
 * token-scan card vocabulary (§16.2, strictly-more-per-tier): minimal = first
 * impression (top archetype, tone), partial = + genre/heat/brands, full = the
 * studied look (+ style tier, danger, drip). Vibe SHAPE (the radar) is
 * partial+; its one-line descriptor is first-impression material at minimal.
 *
 * Service layer: composes pure engine pieces with config/settings context.
 * Spec: SC-Module-Architecture-Guide.md §24, §29.1 (Stage 6), §16.2, §13.3
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { effectiveStats } from "../engine/collect.mjs";
import { scanThresholds, scanTier } from "../engine/perception.mjs";
import {
  confidence as disguiseConfidence, dc as disguiseDC,
  applyScModsToDisguise, applyUniformToDisguise, disguiseDetection,
} from "../engine/disguise.mjs";
import { matchSoftUniform } from "../engine/uniforms.mjs";
import { getUniforms, uniformForGroup } from "./uniforms.mjs";
import { collectWornBrands, recognizeBrands } from "../engine/recognition.mjs";
import { getTunables } from "../config/tunables.mjs";

/**
 * The observer dropdown's option list (grouped). Values are stable strings the
 * app can persist across renders: "street" | "faction:<key>" | "token:<actorId>".
 * @param {object} config engine config (factions)
 * @param {{actors?: object[], selfId?: string}} [ctx] scene actors for token observers
 */
export function observerOptions(config, { actors = [], selfId = null } = {}) {
  const factions = config.factions?.FACTIONS ?? {};
  return [
    { value: "street", label: "The street (generic observer)", group: "" },
    ...Object.entries(factions).map(([k, f]) => ({
      value: `faction:${k}`, label: f.label || k, group: "Factions",
    })),
    ...actors
      .filter((a) => a && a.id !== selfId)
      .map((a) => ({ value: `token:${a.id}`, label: a.name, group: "On the scene" })),
  ];
}

/**
 * Selection string → observer record { kind, value, label, factionKey, int,
 * perception, actorId? }. Unknown/stale selections fall back to the street.
 */
export function resolveObserver(selection, config, { actors = [] } = {}, tunables = getTunables()) {
  const G = tunables.observer.generic;
  const factions = config.factions?.FACTIONS ?? {};
  const sel = selection || "street";

  if (sel.startsWith("faction:")) {
    const key = sel.slice("faction:".length);
    const f = factions[key];
    if (f) {
      return {
        kind: "faction", value: sel, factionKey: key,
        label: f.label || key, int: G.int, perception: G.perception,
      };
    }
  }
  if (sel.startsWith("token:")) {
    const id = sel.slice("token:".length);
    const a = actors.find((x) => x?.id === id);
    if (a) {
      const s = effectiveStats(a);
      return {
        kind: "token", value: sel, actorId: id, factionKey: null,
        label: a.name, int: s.int, perception: s.perception,
      };
    }
  }
  return {
    kind: "street", value: "street", factionKey: null,
    label: "the street", int: G.int, perception: G.perception,
  };
}

/**
 * Stage 6 for one actor's OBSERVED reads: passive tier, brand recognition,
 * the disguise verdict (faction observers), and the per-block reveal map the
 * app renders from. `reads` must be a computeActorReads(view:"observed") run.
 *
 * @returns {{ tier, passiveTotal, thresholds, reveal, brands, disguise }}
 */
export function applyObserverLens({ reads, observer, config, tunables = getTunables() }) {
  // The counter-scan: thresholds shift with the target's effective COOL (§16.2).
  const thresholds = scanThresholds(reads.collected.socialStats.cool, tunables);
  const passiveTotal = observer.int + observer.perception + tunables.observer.passiveRollEquivalent;
  const tier = scanTier(passiveTotal, thresholds);
  const atLeastPartial = tier === "partial" || tier === "full";

  // Brand recognition (§13.3/§23.2): only labels THIS observer clocks; hidden
  // chrome's brand needs the full tier; counterfeits read genuine below their
  // reveal DC (§13.4). Same composition as the token-scan card.
  const cw = reads.cyberwareData;
  const hiddenItemIds = [...(cw.hidden_chrome ?? []), ...(cw.bioware ?? [])]
    .map((e) => e.id).filter(Boolean);
  const brands = recognizeBrands(
    {
      wornBrands: collectWornBrands({
        items: cpr.getItems(reads.actor),
        visibility: reads.visibility?.value,
        hiddenItemIds,
      }),
      observerLiteracy: observer.int, scanTier: tier, scanTotal: passiveTotal,
    },
    config.brands ?? {},
    tunables.recognition ?? {}
  );

  // Disguise verdict vs a faction observer (§24's planning payoff): the same
  // chain the GM dashboard runs — gear injections, soft-uniform match, then
  // detection vs THIS observer's perception.
  let disguise = null;
  if (observer.factionKey) {
    const factions = config.factions.FACTIONS;
    const archetypes = config.factions.FACTION_ARCHETYPES;
    const conf = disguiseConfidence({
      collected: reads.collected, cyberwareData: cw,
      targetFactionKey: observer.factionKey, factions, archetypes, tunables,
    });
    const dcCalc = disguiseDC(conf.confidence, reads.collected.socialStats, tunables);
    const inj = applyScModsToDisguise({
      confidence: conf.confidence, label: conf.label, dcTarget: dcCalc.dc,
      scMods: reads.scMods, targetFactionKey: observer.factionKey, tunables,
    });
    const targetUniform = uniformForGroup(getUniforms(), observer.factionKey);
    const uniformMatch = targetUniform?.soft
      ? matchSoftUniform({ collected: reads.collected, cyberwareData: cw, scMods: reads.scMods, signature: targetUniform.soft })
      : null;
    const uni = applyUniformToDisguise({ confidence: inj.confidence, label: inj.label, uniformMatch, tunables });
    const familiar = factions[observer.factionKey]?.archetype === reads.archetypes[0]?.key;
    const det = disguiseDetection({
      dcTarget: inj.dcTarget, viewerPerception: observer.perception,
      isFamiliarFaction: familiar, tunables,
    });
    disguise = {
      confidence: Math.round(uni.confidence), label: uni.label,
      dc: inj.dcTarget, detected: det.detected, margin: det.margin, familiar,
      gearDisguise: inj.applied,
      uniform: uni.applied ? { grade: uni.grade, bonus: uni.uniformBonus, name: targetUniform.name } : null,
    };
    // §14.3 GM pin: the outcome is the GM's call regardless of the math —
    // flagged `forced` so the UI badges the manual hand.
    if (reads.overrides?.disguise) {
      disguise = { ...disguise, detected: reads.overrides.disguise === "blown", margin: null, forced: true };
    }
  }

  // §14.3 brand-tier pin: "reads <tier> regardless of labels" — surfaces print
  // it alongside (not instead of) whatever the literacy math clocked.
  const forcedTier = reads.overrides?.brandTier ?? null;

  // The reveal map (§16.2 strictly-more): which blocks this tier surfaces.
  const reveal = {
    anything: tier !== "failed",
    archetype: tier !== "failed",           // the first impression
    archetypeRunnersUp: atLeastPartial,     // the maybes take a longer look
    vibeDescriptor: tier !== "failed",      // tone-at-a-glance wording
    vibeRadar: atLeastPartial,              // the SHAPE takes a longer look
    genre: atLeastPartial,
    heat: atLeastPartial,
    brands: atLeastPartial,
    styleTier: tier === "full",
    danger: tier === "full",
    drip: tier === "full",
  };

  return { tier, passiveTotal, thresholds, brands, disguise, reveal, forcedTier };
}
