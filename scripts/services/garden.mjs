/**
 * garden.mjs (services) — The Garden's view assembly + event-post store (M7.10).
 *
 * The engine (engine/garden.mjs) is pure; this service feeds it live data and
 * keeps the ROLLING EVENT STORE — the posts that make the feed "a living mirror
 * of the session" (§21.4): gate verdicts, trend flips, GM hand-posts. Stored in
 * a hidden world setting, capped (tunables.garden.eventCap), newest first.
 *
 * Event posts are written GM-side (the live hooks run there); reads are open.
 */

import { SETTINGS } from "../constants.mjs";
import { DataStore } from "../data/data-store.mjs";
import { getTunables } from "../config/tunables.mjs";
import { followersFor, buildFeedPool, selectFeed, decorateFeed, interleaveAds, postMetrics } from "../engine/garden.mjs";
import { getKnownFor } from "./known-for.mjs";
import { getTrends, activeTrends, describeTrend } from "./trends.mjs";
import { getEngineConfig } from "./engine-config.mjs";

// ── event-post store ─────────────────────────────────────────────────────────

export function getEventPosts() {
  return DataStore.get(SETTINGS.GARDEN_FEED)?.posts ?? [];
}

/**
 * Push an event post (GM-side). Capped FIFO — newest first.
 * @param {object} post { text, platform, usernamePool, about? (actor name), ts }
 */
export async function addEventPost(post) {
  const cap = getTunables().garden.eventCap;
  const posts = [{ ts: Date.now(), ...post }, ...getEventPosts()].slice(0, cap);
  await DataStore.set(SETTINGS.GARDEN_FEED, { posts });
  return posts[0];
}

/** Fill an event template ({name}/{gate}/{trend}) from the Garden config. */
export function eventPostFromTemplate(templateKey, tokens) {
  const tpl = DataStore.get(SETTINGS.CONFIG_GARDEN)?.events?.[templateKey];
  if (!tpl) return null;
  let text = tpl.text;
  for (const [k, v] of Object.entries(tokens ?? {})) text = text.replaceAll(`{${k}}`, v);
  return { text, platform: tpl.platform, usernamePool: tpl.usernamePool, about: tokens?.name ?? null };
}

// ── the page (profile · trending · feed) ─────────────────────────────────────

const timeAgo = (ts) => {
  const mins = Math.max(1, Math.floor((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
};

/**
 * Assemble the whole Garden page for one actor.
 * @param {object} p
 * @param {object} p.actor
 * @param {object} p.reads     computeActorReads() output
 * @param {object} [p.crew]    analyzeCrew() output (crew chatter gate)
 * @param {() => number} [p.rng]
 */
export function buildGardenView({ actor, reads, crew = null, rng = Math.random }) {
  const tunables = getTunables();
  const config = getEngineConfig();
  const comments = DataStore.get(SETTINGS.CONFIG_COMMENTS) ?? {};
  const gardenCfg = DataStore.get(SETTINGS.CONFIG_GARDEN) ?? {};

  // Profile — engagement is f(heat, rep, style) (§21.4).
  const followers = followersFor({
    styleScore: reads.styleRating.total,
    reputation: reads.collected.socialStats.reputation,
    heat: reads.heat.value,
  }, tunables);
  const known = getKnownFor(actor);
  const top = reads.archetypes[0];
  const archDesc = top ? config.factions?.FACTION_ARCHETYPES?.[top.key]?.description : null;

  // Generated chatter (the macro feed, engagement-scaled).
  const pool = buildFeedPool({ reads, crew, comments, factionsConfig: config.factions ?? {}, rng, tunables });
  const selected = selectFeed(pool, tunables.garden.feed.posts, rng, tunables);
  const chatter = decorateFeed(selected, { comments, followers: followers.value, rng, tunables });

  // Event posts about THIS actor (or the whole table) lead the feed, newest first.
  const events = getEventPosts()
    .filter((p) => !p.about || p.about === actor.name)
    .slice(0, tunables.garden.feed.posts)
    .map((p) => {
      const platform = comments.platforms?.[p.platform] ?? { name: "StreetView", icon: "fa-camera-retro", color: "#e040fb" };
      const names = comments.usernames?.[p.usernamePool] ?? ["Anon_NC"];
      return {
        kind: "event",
        text: p.text,
        username: names[Math.floor(rng() * names.length)],
        platform: { name: platform.name, icon: platform.icon, color: platform.color },
        timeAgo: timeAgo(p.ts),
        ...postMetrics(followers.value, rng, tunables),
      };
    });

  const feed = interleaveAds([...events, ...chatter], gardenCfg.ads, rng, tunables);

  return {
    profile: {
      handle: `@${actor.name.replace(/\s+/g, "_").replace(/[^\w]/g, "")}`,
      name: actor.name,
      img: actor.img,
      followers: followers.value,
      followersLabel: followers.value.toLocaleString(),
      followersBlurb: followers.blurb,
      bio: archDesc ? archDesc.split(/(?<=[.!?])\s/)[0] : "No bio. Mysterious, or just offline.",
      readsAs: top?.label ?? "Unaffiliated",
      knownFor: known?.label ? `${known.label} looks` : null,
      drip: reads.dripRating.rating,
      tier: reads.styleRating.tier?.name ?? "—",
    },
    trending: activeTrends(getTrends()).map((t) => ({ name: t.name, desc: describeTrend(t) })),
    feed,
  };
}
