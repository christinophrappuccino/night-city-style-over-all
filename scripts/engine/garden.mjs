/**
 * garden.mjs — The Garden's engine (M7.10, guide §21.4 ⭐⭐): Ziggurat's social
 * network as a visible reputation dashboard, NOT a simulation.
 *
 * Three pure jobs:
 *  · `followersFor` — the §21.4 key insight: engagement is a FUNCTION of heat +
 *    reputation + style score. One explainable number drives the whole page.
 *  · `buildFeedPool` / `selectFeed` — a faithful port of the macro's
 *    `_generateSocialFeed` pool assembly (§16514–16769: tier / archetype with
 *    parent fallback / chrome / heat / cohesion / weapon / crew / style / stat /
 *    scene / role gates; shuffle, dedupe by text, max 2 per category).
 *  · `decorateFeed` — usernames + platform chrome + timestamps + metrics. THE
 *    upgrade over the macro: likes/boosts/replies scale with followers instead
 *    of being uniform random (a grey man gets crickets).
 *
 * Pure: every input decomposed, RANDOMNESS INJECTED (`rng` = () => [0,1); pass
 * Math.random at call sites, a seeded fn in tests). D7: read-only with metrics;
 * the feedback loop is a future toggle.
 *
 * Spec: SC-Module-Architecture-Guide.md §21.4, §21.5, §4.1, §19.
 */

import { getTunables } from "../config/tunables.mjs";
import { result, component } from "./explain.mjs";

const round = Math.round;
const floor = Math.floor;

// ── engagement ───────────────────────────────────────────────────────────────

/**
 * Follower count — engagement = f(heat, reputation, style score). Explainable.
 * @param {object} p { styleScore, reputation, heat }
 */
export function followersFor({ styleScore = 0, reputation = 0, heat = 0 }, tunables = getTunables()) {
  const F = tunables.garden.followers;
  const repFactor = 1 + reputation * F.repMult;
  const styleFactor = 1 + (styleScore / F.styleDivisor) * F.styleMult;
  const heatFactor = 1 + (heat / F.heatDivisor) * F.heatMult;
  const value = Math.min(F.cap, round(F.base * repFactor * styleFactor * heatFactor));
  return result({
    value,
    label: `${value.toLocaleString()} followers`,
    blurb: value >= 10000 ? "The Garden knows this face." : value >= 1000 ? "A name that rings in a few feeds." : "Mostly crickets.",
    components: [
      component("base audience", F.base, "garden.followers"),
      component("reputation ×", round(repFactor * 100) / 100, `REP ${reputation}`),
      component("style ×", round(styleFactor * 100) / 100, `style ${styleScore}`),
      component("heat ×", round(heatFactor * 100) / 100, `heat ${heat}`),
    ],
    tunablesApplied: { "garden.followers": F },
  });
}

/** Post metrics from the author's reach (jittered by rng, floored at street level). */
export function postMetrics(followers, rng, tunables = getTunables()) {
  const M = tunables.garden.metrics;
  const jitter = () => M.jitterMin + rng() * M.jitterSpan;
  return {
    likes: Math.max(1, round(followers * M.likeRate * jitter())),
    boosts: Math.max(0, round(followers * M.boostRate * jitter())),
    replies: Math.max(0, round(followers * M.replyRate * jitter())),
  };
}

// ── the comment pool (macro _generateSocialFeed, faithful) ───────────────────

function pick(arr, count, category, rng) {
  if (!arr?.length) return [];
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, count).map((item) => ({
    category,
    text: typeof item === "string" ? item : item.text,
    platform: typeof item === "string" ? "streetview" : item.platform || "streetview",
    usernamePool: typeof item === "string" ? "gonks" : item.usernamePool || "gonks",
  }));
}

/**
 * Assemble the weighted comment pool for one actor's reads.
 * @param {object} p
 * @param {object} p.reads        computeActorReads() output
 * @param {object} [p.crew]       analyzeCrew() output (≥2 members gates crew chatter)
 * @param {object} p.comments     the comments config blob
 * @param {object} p.factionsConfig { FACTION_ARCHETYPES, ROLE_PROFILES }
 * @param {() => number} p.rng
 */
export function buildFeedPool({ reads, crew = null, comments, factionsConfig = {}, rng, tunables = getTunables() }) {
  const pool = [];
  const C = comments ?? {};
  const { styleRating, archetypes, cyberwareData, heat, cohesion, collected, scene } = reads;
  const socialStats = collected.socialStats;

  // 1. tier (always, up to 3)
  pool.push(...pick(C.tier_comments?.[styleRating.tier?.key || "tier3"], 3, "tier", rng));

  // 2. archetype (sub → parent fallback)
  const top = archetypes?.[0];
  if (top?.key && C.archetype_comments) {
    const archDef = factionsConfig.FACTION_ARCHETYPES?.[top.key];
    const key = C.archetype_comments[top.key] ? top.key : archDef?.parent || top.key;
    pool.push(...pick(C.archetype_comments[key], 2, "archetype", rng));
  }

  // 3. chrome
  if (C.chrome_comments) {
    const display = cyberwareData?.displayCount || 0;
    if (display >= 6) pool.push(...pick(C.chrome_comments.heavy_chrome, 2, "chrome", rng));
    else if (display >= 2) pool.push(...pick(C.chrome_comments.light_chrome, 1, "chrome", rng));
    else if (display === 0) pool.push(...pick(C.chrome_comments.organic, 1, "chrome", rng));
    if ((cyberwareData?.fashionware?.length || 0) >= 2) pool.push(...pick(C.chrome_comments.fashionware, 1, "chrome", rng));
    if ((cyberwareData?.borgware?.length || 0) > 0) pool.push(...pick(C.chrome_comments.borgware, 2, "chrome", rng));
  }

  // 4. heat
  pool.push(...pick(C.heat_comments?.[(heat?.level || "cold").toLowerCase()], 1, "heat", rng));

  // 5. cohesion
  pool.push(...pick(C.cohesion_comments?.[(cohesion?.label || "chaotic").toLowerCase()], 1, "cohesion", rng));

  // 6. weapons (+ armor)
  if (C.weapon_comments) {
    const equipped = collected.weapons?.equipped ?? [];
    const drawn = equipped.filter((w) => w.state === "drawn" || !w.state).length;
    const carried = equipped.filter((w) => w.state === "carried").length;
    const concealed = collected.weapons?.concealed?.length || 0;
    const onPerson = equipped.length + concealed;
    if (drawn >= 2 || onPerson >= 3) pool.push(...pick(C.weapon_comments.heavy_armed, 1, "weapon", rng));
    else if (drawn >= 1 || carried > 0) pool.push(...pick(C.weapon_comments.light_armed, 1, "weapon", rng));
    else if (concealed > 0) pool.push(...pick(C.weapon_comments.concealed, 1, "weapon", rng));
    else pool.push(...pick(C.weapon_comments.unarmed, 1, "weapon", rng));
    if ((collected.armor?.equipped?.length || 0) >= 1) pool.push(...pick(C.weapon_comments.armored, 1, "weapon", rng));
  }

  // 7. crew (only when there IS a crew)
  if (C.crew_comments && (crew?.members?.length ?? 0) >= 2) {
    pool.push(...pick(C.crew_comments.crew_visible, 1, "crew", rng));
    const synergy = crew.synergy?.score || 0;
    if (synergy >= 60) pool.push(...pick(C.crew_comments.synergy_high, 1, "crew", rng));
    else if (synergy < 30) pool.push(...pick(C.crew_comments.synergy_low, 1, "crew", rng));
    if ((crew.crewHeat?.value || 0) >= 60) pool.push(...pick(C.crew_comments.crew_heated, 1, "crew", rng));
    const blow = crew.styleCoherence?.blowability || 0;
    if (blow >= 60) pool.push(...pick(C.crew_comments.crew_blown, 1, "crew", rng));
    else if (blow <= 25) pool.push(...pick(C.crew_comments.crew_stealthy, 1, "crew", rng));
  }

  // 8. dominant style
  const dominant = Object.entries(collected.styles ?? {}).sort((a, b) => b[1] - a[1])[0];
  if (dominant) pool.push(...pick(C.style_comments?.[dominant[0]], 1, "style", rng));

  // 8.5 stat-aware (verbatim macro gates)
  if (C.stat_comments && socialStats) {
    const ss = socialStats;
    const tierNum = styleRating.tier?.number || 1;
    const cost = collected.totalCost ?? 0;
    const S = C.stat_comments;
    if (ss.cool >= 7 && tierNum <= 3) pool.push(...pick(S.high_cool_low_outfit, 1, "stat", rng));
    if (ss.wardrobeAndStyle >= 5 && cost < 500) pool.push(...pick(S.high_ws_low_gear, 1, "stat", rng));
    if (ss.personalGrooming <= 2 && tierNum >= 4) pool.push(...pick(S.low_grooming_expensive, 1, "stat", rng));
    if (ss.reputation >= 5) pool.push(...pick(S.high_rep_anywhere, 1, "stat", rng));
    if (ss.reputation >= 8) pool.push(...pick(S.max_rep, 1, "stat", rng));
    if (ss.cool <= 3 && tierNum >= 4) pool.push(...pick(S.low_cool_high_outfit, 1, "stat", rng));
    if (ss.personalGrooming >= 6 && tierNum <= 2) pool.push(...pick(S.high_grooming_low_gear, 1, "stat", rng));
    if (ss.cool >= 5 && ss.cool < 7) pool.push(...pick(S.cool_presence, 1, "stat", rng));
    if (ss.cool <= 2) pool.push(...pick(S.low_cool, 1, "stat", rng));
    if (ss.wardrobeAndStyle >= 4) pool.push(...pick(S.ws_savvy, 1, "stat", rng));
    if (ss.personalGrooming >= 5) pool.push(...pick(S.well_groomed, 1, "stat", rng));
    if (ss.reputation >= 3 && ss.reputation < 5) pool.push(...pick(S.known_name, 1, "stat", rng));
    if (ss.reputation <= 1) pool.push(...pick(S.total_unknown, 1, "stat", rng));
  }

  // 9. scene-aware
  if (C.scene_comments && scene) {
    const { yourRank, totalCharacters, status, yourStyleScore, averageStyleScore } = scene;
    if (yourRank === 1 && totalCharacters > 1) pool.push(...pick(C.scene_comments.top_ranked, 1, "scene", rng));
    else if (yourRank === totalCharacters && totalCharacters > 1) pool.push(...pick(C.scene_comments.bottom_ranked, 1, "scene", rng));
    if (status === "ABOVE AVERAGE" && yourStyleScore > averageStyleScore * 2) pool.push(...pick(C.scene_comments.overdressed, 1, "scene", rng));
    else if (status === "BELOW AVERAGE" && yourStyleScore < averageStyleScore * 0.5) pool.push(...pick(C.scene_comments.underdressed, 1, "scene", rng));
  }

  // 10. role-aware (macro _generateRoleComments — bespoke text, ported)
  const roleData = collected.roleData;
  const roleProfiles = factionsConfig.ROLE_PROFILES;
  if (roleData?.hasRole && roleProfiles && top) {
    const profile = roleProfiles[roleData.primaryRole.key] || roleProfiles.none;
    const archDef = factionsConfig.FACTION_ARCHETYPES?.[top.key];
    const archParent = archDef?.parent || top.key || "";
    const affinity = profile?.archetypeAffinity;
    if (affinity?.conflicting?.includes(archParent)) {
      pool.push(
        { category: "role", text: `That's not a ${top.label}. Look at the way they move — that's a ${profile.label} in costume.`, platform: "streetview", usernamePool: "gonks" },
        { category: "role", text: `${profile.label} reading as ${top.label}? Either deep cover or identity crisis.`, platform: "ncpd_scanner", usernamePool: "corpos" }
      );
    } else if (affinity?.primary?.includes(archParent)) {
      const rank = roleData.primaryRole.rank ?? 0;
      if (rank >= tunables.archetypes.roleTier.high) { // macro: tier high/legendary
        pool.push({ category: "role", text: `Textbook ${profile.label}. The ${top.label} read is dead on.`, platform: "streetview", usernamePool: "gonks" });
      }
    }
  }

  return pool;
}

/** Macro selection rules: shuffle, dedupe by text, max N per category. */
export function selectFeed(pool, count, rng, tunables = getTunables()) {
  const maxPerCategory = tunables.garden.feed.maxPerCategory;
  const shuffled = [...pool].sort(() => rng() - 0.5);
  const seen = new Set();
  const perCategory = {};
  const selected = [];
  for (const item of shuffled) {
    if (seen.has(item.text)) continue;
    if ((perCategory[item.category] || 0) >= maxPerCategory) continue;
    seen.add(item.text);
    perCategory[item.category] = (perCategory[item.category] || 0) + 1;
    selected.push(item);
    if (selected.length >= count) break;
  }
  return selected;
}

/** Dress the selection in social chrome: username · platform · time · metrics. */
export function decorateFeed(selected, { comments, followers, rng, tunables = getTunables() }) {
  const maxAge = tunables.garden.feed.maxAgeMinutes;
  return selected.map((item) => {
    const platform = comments?.platforms?.[item.platform] ?? { name: "StreetView", icon: "fa-camera-retro", color: "#e040fb" };
    const poolNames = comments?.usernames?.[item.usernamePool] ?? comments?.usernames?.gonks ?? ["Anon_NC"];
    const minutes = Math.max(1, floor(rng() * maxAge));
    return {
      kind: "post",
      text: item.text,
      category: item.category,
      username: poolNames[floor(rng() * poolNames.length)],
      platform: { name: platform.name, icon: platform.icon, color: platform.color },
      timeAgo: minutes >= 60 ? `${floor(minutes / 60)}h ago` : `${minutes}m ago`,
      ...postMetrics(followers, rng, tunables),
    };
  });
}

/** Intersperse targeted ads every N posts (§21.4 flavor). */
export function interleaveAds(posts, ads, rng, tunables = getTunables()) {
  const every = tunables.garden.feed.adEvery;
  if (!ads?.length || every <= 0) return posts;
  const out = [];
  posts.forEach((post, i) => {
    out.push(post);
    if ((i + 1) % every === 0) {
      const ad = ads[floor(rng() * ads.length)];
      out.push({ kind: "ad", ...ad });
    }
  });
  return out;
}
