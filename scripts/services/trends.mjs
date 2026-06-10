/**
 * trends.mjs (services) — the rotating fashion meta (M7.7, guide §14.4).
 *
 * Pure core: which trends are live and what multiplier they put on a style.
 * Active trends MULTIPLY (kabuki-glam hot ×1.25 during a silk shortage ×1.1 →
 * ×1.375); styles no trend mentions stay at ×1. The shop browser applies this
 * per item (services/shops.mjs); toggling a trend ON announces it in-world as a
 * fashion post (chat card — the social-feed surface until The Garden lands).
 *
 * Spec: SC-Module-Architecture-Guide.md §14.4, §21.5 (M7).
 */

import { MODULE_ID, SETTINGS } from "../constants.mjs";
import { DataStore } from "../data/data-store.mjs";
import { getTunables } from "../config/tunables.mjs";
import { formatStyleName } from "../engine/recommendations.mjs";

// ── registry ─────────────────────────────────────────────────────────────────

export function getTrends() {
  return DataStore.get(SETTINGS.CONFIG_TRENDS)?.trends ?? [];
}

/** Persist the full trend list (array replaces wholesale — write-safe). */
export function setTrends(trends) {
  return DataStore.set(SETTINGS.CONFIG_TRENDS, { trends });
}

// ── pure core ────────────────────────────────────────────────────────────────

export const activeTrends = (trends) => (trends ?? []).filter((t) => t?.active);

/**
 * The combined trend multiplier for a style key (1 when nothing applies).
 * @param {string|null} styleKey  the item's CPR clothing style
 * @param {object[]} trends       the trend list (pass getTrends() at call sites)
 */
export function trendMultiplier(styleKey, trends) {
  if (!styleKey) return 1;
  let mult = 1;
  for (const t of activeTrends(trends)) {
    const m = t.styles?.[styleKey];
    if (typeof m === "number" && m > 0) mult *= m;
  }
  return mult;
}

/** Human summary of one trend's effect ("Asia Pop ×1.25 · Businesswear ×0.8"). */
export function describeTrend(trend) {
  return Object.entries(trend?.styles ?? {})
    .map(([k, m]) => `${formatStyleName(k)} ×${m}`)
    .join(" · ");
}

// ── announcement (the in-world fashion post) ─────────────────────────────────

/** Public chat post announcing a trend flip (§14.4 — feeds The Garden later). */
export async function announceTrend(trend, { off = false } = {}) {
  const hot = Object.entries(trend.styles ?? {}).filter(([, m]) => m > 1).map(([k]) => formatStyleName(k));
  const cold = Object.entries(trend.styles ?? {}).filter(([, m]) => m < 1).map(([k]) => formatStyleName(k));
  const line = off
    ? `<em>${trend.name}</em> is over. Nobody's talking about it anymore.`
    : `${hot.length ? `<strong>${hot.join(", ")}</strong> is everywhere this week. ` : ""}` +
      `${cold.length ? `${cold.join(", ")} is looking tired. ` : ""}` +
      `${trend.note ? `<em>${trend.note}</em>` : ""}`;
  const content =
    `<div class="ncsoa-chat-card ncsoa-trend-card">` +
    `<header class="ncsoa-cc-head"><div class="ncsoa-cc-title">` +
    `<span class="ncsoa-cc-name"><i class="fas fa-arrow-trend-up"></i> ${trend.name}</span>` +
    `<span class="ncsoa-cc-sub">Night City fashion wire</span></div>` +
    `<span class="ncsoa-cc-verdict ${off ? "red" : "green"}">${off ? "OVER" : "TRENDING"}</span></header>` +
    `<div class="ncsoa-cc-notes">${line}</div></div>`;
  return ChatMessage.create({ content, speaker: { alias: "The Wire" } });
}

/** Flip a trend, persist, and announce. GM-gated by the callers. */
export async function toggleTrend(id, active) {
  const trends = getTrends();
  const trend = trends.find((t) => t.id === id);
  if (!trend) return null;
  await setTrends(trends.map((t) => (t.id === id ? { ...t, active } : t)));
  await announceTrend({ ...trend, active }, { off: !active });
  return { ...trend, active };
}

/** Default hot/cold multipliers for the authoring dialog. */
export function trendDefaults(tunables = getTunables()) {
  return tunables.trends;
}
