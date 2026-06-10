/**
 * known-for.mjs — persistent style reputation (M7.9, guide §16.6).
 *
 * A character who consistently READS one way accrues a "known for" descriptor
 * that colors first impressions. Lightweight by design: every PUBLIC read (a
 * token scan, a gate run) tallies the top archetype on an actor flag; when one
 * archetype's tally clears the threshold, it becomes the reputation. The tally
 * is capped and rescaled, so an old reputation can be outgrown by dressing —
 * and being seen — differently.
 *
 * Flag shape (FLAGS.ACTOR_PREFS.knownFor):
 *   { tally: { <archKey>: n }, key, label, since }
 *
 * Writes are GM-side: the scan path routes through a socket when a player
 * triggers it (players can't write flags on actors they don't own).
 *
 * Spec: SC-Module-Architecture-Guide.md §16.6, §17 (M7).
 */

import { getActorPrefs, setActorPrefs } from "../data/flags.mjs";
import { getTunables } from "../config/tunables.mjs";

/** The actor's reputation, if one has stuck. */
export function getKnownFor(actor) {
  return getActorPrefs(actor)?.knownFor ?? null;
}

/**
 * Tally one public read into a knownFor record. PURE — returns the next record.
 * When any archetype clears the threshold it becomes (or stays) the reputation;
 * at the cap, all tallies halve so impressions stay current.
 *
 * @param {object|null} record   the current knownFor record (or null)
 * @param {{key: string, label: string}} topArch  the read's top archetype
 * @param {object} [tunables]
 * @returns {object} next record
 */
export function tallyRead(record, topArch, tunables = getTunables()) {
  const K = tunables.knownFor;
  if (!topArch?.key || topArch.key === "unknown") return record ?? { tally: {} };

  const tally = { ...(record?.tally ?? {}) };
  tally[topArch.key] = (tally[topArch.key] || 0) + 1;

  // Rolling cap: halve everything when the total runs long, so reputations age.
  const total = Object.values(tally).reduce((a, b) => a + b, 0);
  if (total > K.tallyCap) {
    for (const k of Object.keys(tally)) {
      tally[k] = Math.floor(tally[k] / 2);
      if (!tally[k]) delete tally[k];
    }
  }

  const next = { ...(record ?? {}), tally };
  const [bestKey, bestCount] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
  if (bestKey && bestCount >= K.threshold && bestKey === topArch.key) {
    if (next.key !== bestKey) next.since = null; // stamped by the writer (needs world time)
    next.key = bestKey;
    next.label = topArch.label;
  }
  return next;
}

/** Record a public read on an actor (GM-side write; callers gate on ownership). */
export async function recordPublicRead(actor, topArch) {
  if (!actor || !topArch?.key) return null;
  const prefs = getActorPrefs(actor);
  const next = tallyRead(prefs.knownFor ?? null, topArch);
  if (next.key && next.since === null) next.since = Date.now();
  await setActorPrefs(actor, { ...prefs, knownFor: next });
  return next;
}
