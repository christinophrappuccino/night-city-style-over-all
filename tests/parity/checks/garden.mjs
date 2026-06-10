/**
 * checks/garden.mjs — M7.10 The Garden engine (aggregate; fixture-independent).
 *
 * Seeded-RNG verification of engine/garden.mjs:
 *  1. followersFor — hand-computed engagement math (idol ≫ grey man);
 *  2. postMetrics — metrics scale with the author's reach;
 *  3. buildFeedPool — the macro's category gates fire on crafted reads;
 *  4. selectFeed — dedupe by text + max-2-per-category (macro rules);
 *  5. interleaveAds — an ad every N posts.
 */

import { followersFor, postMetrics, buildFeedPool, selectFeed, interleaveAds } from "../../../scripts/engine/garden.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";

const T = TUNABLES_DEFAULTS;

/** Deterministic rng (mulberry32). */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function gardenChecks() {
  const checks = [];

  // 1 — engagement math: 40 · (1+5·0.9) · (1+100/100·2.2) · (1+50/100·0.8) = 985.6 → 986.
  const idol = followersFor({ styleScore: 100, reputation: 5, heat: 50 }, T);
  const greyMan = followersFor({ styleScore: 20, reputation: 0, heat: 5 }, T);
  checks.push({
    name: "garden.followersFor — engagement is f(heat, rep, style)",
    actual: { idol: idol.value, greyMan: greyMan.value, idolLouder: idol.value > greyMan.value * 10 },
    expected: { idol: 986, greyMan: 60, idolLouder: true },
  });

  // 2 — metrics scale with reach (same rng seed → same jitter; ratio ≈ followers
  // ratio, within rounding).
  const bigM = postMetrics(10000, seeded(7), T);
  const smallM = postMetrics(100, seeded(7), T);
  const ratio = bigM.likes / smallM.likes;
  checks.push({
    name: "garden.postMetrics — a grey man gets crickets",
    actual: { scalesRoughly100x: ratio > 80 && ratio < 125, floor: postMetrics(0, seeded(7), T).likes },
    expected: { scalesRoughly100x: true, floor: 1 },
  });

  // 3 — pool gates on crafted reads + a tiny comments blob.
  const comments = {
    tier_comments: { tier4: [{ text: "tier-a" }, { text: "tier-b" }, { text: "tier-c" }] },
    archetype_comments: { gang_booster: [{ text: "arch-parent" }] },  // sub falls back to parent
    chrome_comments: { organic: [{ text: "organic" }] },
    heat_comments: { hot: [{ text: "heat-hot" }] },
    cohesion_comments: { mixed: [{ text: "coh-mixed" }] },
    weapon_comments: { unarmed: [{ text: "wpn-unarmed" }], armored: [{ text: "wpn-armored" }] },
    style_comments: { asiaPop: [{ text: "style-asiapop" }] },
    stat_comments: { total_unknown: [{ text: "stat-nobody" }] },
    scene_comments: { top_ranked: [{ text: "scene-top" }] },
  };
  const reads = {
    styleRating: { total: 60, tier: { key: "tier4", number: 4 } },
    archetypes: [{ key: "gang_sub", label: "Sub Ganger" }],
    cyberwareData: { displayCount: 0, fashionware: [], borgware: [] },
    heat: { level: "HOT", value: 55 },
    cohesion: { label: "MIXED" },
    collected: {
      socialStats: { cool: 4, reputation: 0, personalGrooming: 3, wardrobeAndStyle: 2 },
      styles: { asiaPop: 2, urbanFlash: 1 },
      weapons: { equipped: [], concealed: [] },
      armor: { equipped: [{ id: "a1" }] },
      totalCost: 800,
      roleData: { hasRole: false },
    },
    scene: { yourRank: 1, totalCharacters: 4, status: "ABOVE AVERAGE", yourStyleScore: 60, averageStyleScore: 40 },
  };
  const factionsConfig = { FACTION_ARCHETYPES: { gang_sub: { parent: "gang_booster", label: "Sub Ganger" } } };
  const pool = buildFeedPool({ reads, comments, factionsConfig, rng: seeded(1), tunables: T });
  const categories = [...new Set(pool.map((p) => p.category))].sort();
  checks.push({
    name: "garden.buildFeedPool — macro category gates fire",
    actual: {
      categories,
      archParentFallback: pool.some((p) => p.text === "arch-parent"),
      organicChrome: pool.some((p) => p.text === "organic"),
      unarmedAndArmored: pool.some((p) => p.text === "wpn-unarmed") && pool.some((p) => p.text === "wpn-armored"),
      nobody: pool.some((p) => p.text === "stat-nobody"),
      sceneTop: pool.some((p) => p.text === "scene-top"),
    },
    expected: {
      categories: ["archetype", "chrome", "cohesion", "heat", "scene", "stat", "style", "tier", "weapon"],
      archParentFallback: true,
      organicChrome: true,
      unarmedAndArmored: true,
      nobody: true,
      sceneTop: true,
    },
  });

  // 4 — selection: dedupe by text, max 2 per category.
  const dupPool = [
    { category: "tier", text: "same" }, { category: "tier", text: "same" },
    { category: "tier", text: "t2" }, { category: "tier", text: "t3" },
    { category: "heat", text: "h1" },
  ];
  const picked = selectFeed(dupPool, 10, seeded(3), T);
  checks.push({
    name: "garden.selectFeed — dedupe + max per category",
    actual: {
      total: picked.length,
      tierCount: picked.filter((p) => p.category === "tier").length,
      uniqueTexts: new Set(picked.map((p) => p.text)).size === picked.length,
    },
    expected: { total: 3, tierCount: 2, uniqueTexts: true },
  });

  // 5 — ads every N posts.
  const posts = Array.from({ length: 8 }, (_, i) => ({ kind: "post", text: `p${i}` }));
  const withAds = interleaveAds(posts, [{ sponsor: "Ziggurat", text: "ad" }], seeded(4), T);
  checks.push({
    name: "garden.interleaveAds — sponsored every N",
    actual: { total: withAds.length, adSlots: withAds.map((p, i) => (p.kind === "ad" ? i : null)).filter((i) => i != null) },
    expected: { total: 10, adSlots: [4, 9] },
  });

  return checks;
}
