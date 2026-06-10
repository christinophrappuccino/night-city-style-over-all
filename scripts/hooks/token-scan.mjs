/**
 * hooks/token-scan.mjs — "Scan Style" on the Token HUD (M7.6, guide §16.1–16.2).
 *
 * The headline quick-perceive: select your token, TARGET someone (hover + T),
 * hit the eye on your token's HUD. The scanner rolls INT + Perception + 1d10
 * against tiered thresholds shifted by the target's gear-boosted COOL
 * (engine/perception.mjs — the existing counter-scan math), and gets a whispered
 * tiered card:
 *   · failed   — nothing reads;
 *   · minimal  — the passive glance (§16.2): top archetype + its vibe line;
 *   · partial  — + primary style and the heat band;
 *   · full     — the studied look: + style tier, danger, drip, uniform recognition.
 *
 * Fast, in-flow, no app window. Whisper goes to the scanning user + GM only.
 * Integration layer: HUD injection + roll; all math is engine; card is M7.4's.
 */

import { effectiveStats } from "../engine/collect.mjs";
import { scanThresholds, scanTier } from "../engine/perception.mjs";
import { bestUniformMatch } from "../engine/uniforms.mjs";
import { formatStyleName } from "../engine/recommendations.mjs";
import { computeActorReads } from "../services/style-reads.mjs";
import { getEngineConfig } from "../services/engine-config.mjs";
import { getUniforms } from "../services/uniforms.mjs";
import { postStyleRead } from "../services/chat-cards.mjs";
import { getKnownFor, recordPublicRead } from "../services/known-for.mjs";
import { emitSocket, MESSAGE } from "../services/sockets.mjs";

export function registerTokenScan() {
  Hooks.on("renderTokenHUD", (hud, html) => {
    const token = hud.object;
    if (!token?.actor?.isOwner) return;
    const $html = html instanceof jQuery ? html : $(html);
    if ($html.find(".ncsoa-scan").length) return;
    const btn = $(
      `<div class="control-icon ncsoa-scan" title="Scan Style — read your TARGETED token (hover a token and press T to target)">
         <i class="fas fa-eye"></i>
       </div>`
    );
    btn.on("click", () => scanTargetFrom(token));
    $html.find(".col.right").append(btn);
  });
}

async function scanTargetFrom(scannerToken) {
  const scanner = scannerToken.actor;
  const targetToken = [...(game.user?.targets ?? [])][0];
  if (!targetToken?.actor) {
    ui.notifications?.warn("Target someone first — hover their token and press T.");
    return;
  }
  if (targetToken.actor.id === scanner.id) {
    ui.notifications?.info("You know what you look like, choom.");
    return;
  }
  const target = targetToken.actor;

  try {
    const config = getEngineConfig();
    const reads = computeActorReads(target, { config });

    // The counter-scan: thresholds shift with the target's effective COOL.
    const sStats = effectiveStats(scanner);
    const thresholds = scanThresholds(reads.collected.socialStats.cool);
    const roll = await new Roll("1d10").evaluate();
    const total = roll.total + sStats.int + sStats.perception;
    const tier = scanTier(total, thresholds);

    const read = buildTieredRead(tier, reads, config, target);
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
  } catch (e) {
    console.error("Night City: Style Over All | token scan failed:", e);
    ui.notifications?.error("Scan failed — see console.");
  }
}

/** Tier-gated card content (§16.2): each tier reveals strictly more. */
function buildTieredRead(tier, reads, config, target) {
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
  }

  if (tier === "full") {
    rows.push({ label: "Style", value: `${reads.styleRating.total} · ${reads.styleRating.tier?.name ?? ""}`.trim() });
    rows.push({ label: "Danger", value: `${reads.danger.value} · ${reads.danger.tier}` });
    rows.push({ label: "Drip", value: reads.dripRating.rating });
    const uniform = bestUniformMatch({
      uniforms: getUniforms(),
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
