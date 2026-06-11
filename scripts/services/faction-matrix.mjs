/**
 * faction-matrix.mjs — the §14.7 who-hates-whom editor's pure core (M9.3e).
 *
 * The tension scanner (engine/faction-tension.mjs) treats a rivalry as live
 * when EITHER side's `rivals` array names the other — so the editor works in
 * symmetric PAIRS: toggling a rivalry writes (or clears) BOTH sides, and the
 * summary dedupes one-sided legacy entries into single pairs. Seed data may be
 * one-sided; pairs the editor touches come out normalized.
 *
 * Pure (node-gated): callers clone/persist the factions blob themselves —
 * these helpers never mutate their input.
 *
 * Spec: SC-Module-Architecture-Guide.md §14.7
 */

/**
 * Every rivalry pair in the blob, deduped (one-sided counts once), sorted by
 * label. @param {object} factions  the FACTIONS map ({ key: { label, rivals } })
 * @returns [{ aKey, bKey, aLabel, bLabel }]
 */
export function rivalryPairs(factions = {}) {
  const seen = new Set();
  const pairs = [];
  for (const [key, f] of Object.entries(factions)) {
    for (const rival of f?.rivals ?? []) {
      if (!factions[rival]) continue; // stale key — skip, never invent factions
      const id = [key, rival].sort().join("∷");
      if (seen.has(id)) continue;
      seen.add(id);
      const [aKey, bKey] = [key, rival].sort();
      pairs.push({
        aKey, bKey,
        aLabel: factions[aKey]?.label || aKey,
        bLabel: factions[bKey]?.label || bKey,
      });
    }
  }
  return pairs.sort((p, q) => (p.aLabel + p.bLabel).localeCompare(q.aLabel + q.bLabel));
}

/** Are these two factions rivals (either side names the other)? */
export function areRivals(factions, aKey, bKey) {
  return !!(
    factions?.[aKey]?.rivals?.includes(bKey) ||
    factions?.[bKey]?.rivals?.includes(aKey)
  );
}

/**
 * Set (or clear) a rivalry SYMMETRICALLY. Returns a NEW factions map; the
 * input is untouched. No-ops on unknown keys or self-pairs.
 */
export function setRivalry(factions, aKey, bKey, on) {
  if (!factions?.[aKey] || !factions?.[bKey] || aKey === bKey) return factions;
  const next = { ...factions };
  for (const [self, other] of [[aKey, bKey], [bKey, aKey]]) {
    const rivals = new Set(next[self].rivals ?? []);
    if (on) rivals.add(other);
    else rivals.delete(other);
    next[self] = { ...next[self], rivals: [...rivals].sort() };
  }
  return next;
}
