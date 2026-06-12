/**
 * quick-read.mjs — the §16 quick-perceive read, as ONE shared service (M9.3d).
 *
 * Two callers, one path (§16.2 + §16.3): the token-HUD scan (hooks/token-scan)
 * and the lookbook card's "what do I make of them?" button both run
 * `performQuickRead` — roll 1d10 + INT + Perception vs the target's
 * COOL-shifted thresholds, build the tier-gated read, whisper the card to the
 * scanner + GM, and tally the public read (§16.6 Known For). Players read
 * players with no GM mediation; the GM still sees every card.
 *
 * The read uses the OBSERVED pipeline run (§29.2) — covered items don't feed
 * a scan (they physically can't be seen); pre-M9.3 the scan used the self
 * view because the observed run didn't exist yet.
 *
 * `buildTieredRead` is kept side-effect-free (config/tunables/uniforms passed
 * IN) so the tier gating is node-gate-testable.
 *
 * Spec: SC-Module-Architecture-Guide.md §16.1–16.3, §16.6, §13.3, §29.2
 */

import * as cpr from "../data/cpr-adapter.mjs";
import { effectiveStats } from "../engine/collect.mjs";
import { scanThresholds, scanTier } from "../engine/perception.mjs";
import { formatStyleName } from "../engine/recommendations.mjs";
import { collectWornBrands, recognizeBrands } from "../engine/recognition.mjs";
import { bestUniformMatch } from "../engine/uniforms.mjs";
import { getKnownFor, recordPublicRead } from "./known-for.mjs";
import { getUniforms } from "./uniforms.mjs";
import { computeActorReads } from "./style-reads.mjs";
import { getEngineConfig } from "./engine-config.mjs";
import { getTunables } from "../config/tunables.mjs";
import { postStyleRead } from "./chat-cards.mjs";
import { emitSocket, MESSAGE } from "./sockets.mjs";
import { fireApiHook, API_HOOKS } from "../api-hooks.mjs";

/**
 * Tier-gated card content (§16.2): each tier reveals strictly more.
 * Side-effect-free: every context object is a parameter.
 *
 * @param {"failed"|"minimal"|"partial"|"full"} tier
 * @param {object} reads   computeActorReads bundle for the TARGET
 * @param {object} config  engine config (factions + brands)
 * @param {object|null} target  target actor (Known For flag read; null ok)
 * @param {object} [p]
 * @param {number} [p.scannerInt]
 * @param {number} [p.scanTotal]
 * @param {object} [p.tunables]
 * @param {object[]} [p.uniforms]  registered uniforms (pass getUniforms())
 */
export function buildTieredRead(tier, reads, config, target, { scannerInt = 0, scanTotal = 0, tunables = getTunables(), uniforms = [] } = {}) {
  if (tier === "failed") return { rows: [], blurb: null };

  const rows = [];
  const top = reads.archetypes[0];
  const archDef = top ? config.factions?.FACTION_ARCHETYPES?.[top.key] : null;

  // minimal — the passive glance: archetype + vibe line (+ street reputation,
  // §16.6 — a "known for" colors first impressions at any tier).
  rows.push({ label: "Reads as", value: top?.label ?? "Unaffiliated" });
  const known = target ? getKnownFor(target) : null;
  if (known?.label) rows.push({ label: "Known for", value: `${known.label} looks` });
  let blurb = archDef?.description ? firstSentence(archDef.description) : null;

  if (tier === "partial" || tier === "full") {
    const styles = Object.entries(reads.collected.styles).sort((a, b) => b[1] - a[1]);
    rows.push({ label: "Primary style", value: styles[0] ? formatStyleName(styles[0][0]) : "—" });
    rows.push({ label: "Heat", value: reads.heat.level });

    // Brand recognition (§13.3/§23.2) — only labels this scanner clocks.
    // Hidden chrome's brand surfaces only at the deep tier; a counterfeit reads
    // genuine unless the scan beats its reveal DC (§13.4).
    const cw = reads.cyberwareData;
    const hiddenItemIds = [...(cw.hidden_chrome ?? []), ...(cw.bioware ?? [])].map((e) => e.id).filter(Boolean);
    const brands = recognizeBrands(
      {
        wornBrands: collectWornBrands({
          items: cpr.getItems(reads.actor),
          visibility: reads.visibility?.value,
          hiddenItemIds,
        }),
        observerLiteracy: scannerInt, scanTier: tier, scanTotal,
      },
      config.brands ?? {},
      tunables.recognition ?? {}
    );
    if (brands.recognized.length) {
      const tags = brands.recognized.map((r) =>
        r.counterfeit?.revealed ? `${r.label} (FAKE)` : r.label
      );
      rows.push({ label: "Wearing", value: tags.join(", ") });
    } else if (brands.value.some((r) => r.prestige === "expensive")) {
      rows.push({ label: "Wearing", value: "Expensive-looking pieces (label unplaced)" });
    }
    // §14.3 brand-tier pin: the GM says this look reads a tier, full stop.
    if (reads.overrides?.brandTier) {
      rows.push({ label: "Reads", value: `${formatStyleName(reads.overrides.brandTier)} money` });
    }
  }

  if (tier === "full") {
    rows.push({ label: "Style", value: `${reads.styleRating.total} · ${reads.styleRating.tier?.name ?? ""}`.trim() });
    rows.push({ label: "Danger", value: `${reads.danger.value} · ${reads.danger.tier}` });
    rows.push({ label: "Drip", value: reads.dripRating.rating });
    const uniform = bestUniformMatch({
      uniforms,
      collected: reads.collected, cyberwareData: reads.cyberwareData, scMods: reads.scMods,
    });
    if (uniform) {
      rows.push({ label: "Uniform", value: `${uniform.uniform.name} (${uniform.match.grade.toUpperCase()})` });
    }
  }

  return { rows, blurb };
}

function firstSentence(text) {
  const s = String(text).split(/(?<=[.!?])\s/)[0] ?? "";
  return s.length > 140 ? `${s.slice(0, 137)}…` : s;
}

/**
 * The full quick-read flow (§16.2/§16.3): roll → tier → whispered card →
 * public-read tally. Returns { tier, total } or null when it couldn't run.
 *
 * @param {object} p
 * @param {object} p.scanner  the reading actor (the user's character)
 * @param {object} p.target   the actor being read
 * @param {object} [p.config]
 */
export async function performQuickRead({ scanner, target, config = getEngineConfig() }) {
  if (!scanner) {
    ui.notifications?.warn("No character to read with — assign a character or control a token.");
    return null;
  }
  if (!target) return null;
  if (target.id === scanner.id) {
    ui.notifications?.info("You know what you look like, choom.");
    return null;
  }

  // The OBSERVED run: what physically shows is what a scan can read (§29.2).
  const reads = computeActorReads(target, { config, view: "observed" });

  // The counter-scan: thresholds shift with the target's effective COOL.
  const sStats = effectiveStats(scanner);
  const thresholds = scanThresholds(reads.collected.socialStats.cool);
  const roll = await new Roll("1d10").evaluate();
  const total = roll.total + sStats.int + sStats.perception;
  const tier = scanTier(total, thresholds);

  const read = buildTieredRead(tier, reads, config, target, {
    scannerInt: sStats.int, scanTotal: total, uniforms: getUniforms(),
  });
  const whisper = [...new Set([game.user.id, ...game.users.contents.filter((u) => u.isGM).map((u) => u.id)])];
  await postStyleRead({
    scanner, target,
    tier: tier === "failed" ? "none" : tier,
    roll: { formula: `1d10(${roll.total}) + INT ${sStats.int} + PER ${sStats.perception}`, total },
    read, whisper,
  });

  // A successful scan is a PUBLIC read — it builds the target's reputation
  // (§16.6). Players can't write to unowned actors; the GM client tallies.
  if (tier !== "failed" && reads.archetypes[0]) {
    const topArch = { key: reads.archetypes[0].key, label: reads.archetypes[0].label };
    if (game.user.isGM) await recordPublicRead(target, topArch);
    else emitSocket(MESSAGE.RECORD_READ, { actorId: target.id, topArch });
  }

  fireApiHook(API_HOOKS.SCAN_COMPLETE, { scanner, target, tier, total, read });
  return { tier, total };
}
