/**
 * presets.mjs — scoring presets (M9.4a, guide §18.4 D6 = A+B) + the full-panel
 * tunables helpers.
 *
 * A preset is a NAMED PHILOSOPHY: a curated sparse overlay of tunable values
 * (tier 2 only — never structure). Applying one replaces the GM's tunables
 * overlay; editing any dial afterwards forks it into "Custom" (the active
 * preset is DERIVED by comparing overlays, never stored — no drift).
 *
 * Pure module — no Foundry globals (node-gated by checks/presets.mjs).
 * Values reference REAL paths in TUNABLES_DEFAULTS; the node check validates
 * every path resolves to a number and differs from its default.
 *
 * The M9.1 color-clash deferral resolves here as VALUES, not structure:
 * palette clash stays on W&S (engine unchanged); presets express philosophy
 * through the clash dials (clashPenaltyPerPair, wsDeltaClamp).
 *
 * Spec: SC-Module-Architecture-Guide.md §18.2–§18.5
 */

export const SCORING_PRESETS = [
  {
    key: "phase82",
    label: "Phase 82 Faithful",
    blurb: "The play-tested macro, verbatim. Every dial at its extracted default — the baseline philosophy.",
    overlay: {},
  },
  {
    key: "forgiving",
    label: "Forgiving Streets",
    blurb: "The city cuts you slack: heat builds slower, composure counts for more, disguises bend before they break, and a clashing palette is a choice, not a crime.",
    overlay: {
      heat: { levels: { warm: 30, hot: 60, blazing: 85 }, coolPerPoint: 3 },
      danger: { tiers: { moderate: 35, high: 60, extreme: 85 } },
      disguise: {
        difficulty: { perLevel: 0.05 },
        labels: { convincing: 75, passable: 55, risky: 35 },
      },
      archetypes: { styleMatch: { missingPenaltyFactor: 1.3, unexpectedPenaltyFactor: 1.15 } },
      color: { coordination: { clashPenaltyPerPair: 0 } },
      formality: { disguise: { penaltyPerStep: 8 } },
      recognition: { counterfeit: { disguisePenaltyPerReveal: 10 } },
    },
  },
  {
    key: "strict",
    label: "Strict Protocol",
    blurb: "The city is watching: heat comes fast, drawn iron screams, labels get clocked, fakes get made, and a disguise has to be RIGHT — register, palette, everything.",
    overlay: {
      heat: {
        levels: { warm: 20, hot: 40, blazing: 65 },
        weapon: { drawnFirst: 20 },
        chrome: { threshold: 25, ratePerPct: 0.5 },
      },
      danger: { tiers: { moderate: 25, high: 50, extreme: 75 } },
      disguise: {
        difficulty: { perLevel: 0.15 },
        labels: { convincing: 85, passable: 65, risky: 45 },
      },
      gm: { disguise: { familiarityBonus: 5 } },
      recognition: { bar: { known: 3, niche: 6 }, counterfeit: { baseDc: 10 } },
      color: { coordination: { clashPenaltyPerPair: 2, wsDeltaClamp: 4 } },
      formality: { disguise: { penaltyPerStep: 16 } },
    },
  },
  {
    key: "cinematic",
    label: "Cinematic Neon",
    blurb: "Big swings, legible drama: outliers blaze, committed looks read louder, style makes you famous, and reputations stick fast. Tune for the montage.",
    overlay: {
      heat: { styleOutlierMultiplier: 45 },
      archetypes: { primaryGate: { penaltyMult: 30 } },
      styleScoring: { synergyScale: 14, fashionwarePointsPerItem: 28 },
      color: { coordination: { wsBonusMax: 3 } },
      garden: { followers: { styleMult: 3.2 } },
      knownFor: { threshold: 3 },
      vibe: { strongMin: 5, descriptorMax: 3 },
    },
  },
];

/** One preset by key (or undefined). */
export function getPreset(key) {
  return SCORING_PRESETS.find((p) => p.key === key);
}

// ── overlay plumbing (shared with the Tuning Panel) ──────────────────────────

const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

export const getByPath = (obj, path) =>
  path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

export function setByPath(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!isPlainObject(cur[keys[i]])) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

/** Remove a path from a sparse overlay, pruning any branches left empty. */
export function deleteByPath(obj, path) {
  const keys = path.split(".");
  const stack = [];
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!isPlainObject(cur[keys[i]])) return;
    stack.push([cur, keys[i]]);
    cur = cur[keys[i]];
  }
  delete cur[keys[keys.length - 1]];
  for (let i = stack.length - 1; i >= 0; i--) {
    const [parent, key] = stack[i];
    if (isPlainObject(parent[key]) && Object.keys(parent[key]).length === 0) delete parent[key];
    else break;
  }
}

/**
 * Flatten the tunables tree into knob descriptors for the full panel.
 * NUMERIC leaves only; anything inside an ARRAY is structural (tier tables,
 * name lists) and is skipped — those are preset/JSON territory, not knobs.
 * @returns {Array<{path: string, value: number}>}
 */
export function flattenTunables(obj, basePath = "") {
  const out = [];
  if (!isPlainObject(obj)) return out;
  for (const [k, v] of Object.entries(obj)) {
    const path = basePath ? `${basePath}.${k}` : k;
    if (typeof v === "number") out.push({ path, value: v });
    else if (isPlainObject(v)) out.push(...flattenTunables(v, path));
    // strings, arrays, null: not knobs
  }
  return out;
}

/** Count the scalar leaves of a sparse overlay. */
export function countLeaves(obj) {
  let n = 0;
  for (const v of Object.values(obj ?? {})) n += isPlainObject(v) ? countLeaves(v) : 1;
  return n;
}

/** Deep equality over plain data (objects/arrays/scalars). */
export function deepEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  if (isPlainObject(a) && isPlainObject(b)) {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

/**
 * Which preset is the GM's current overlay? DERIVED, never stored: an exact
 * match names the preset; anything else is a fork ("custom"). An empty/null
 * overlay is the defaults — Phase 82 Faithful.
 * @returns {string|null} preset key, or null = custom
 */
export function matchPreset(overlay) {
  const o = overlay && countLeaves(overlay) > 0 ? overlay : {};
  for (const p of SCORING_PRESETS) if (deepEqual(o, p.overlay)) return p.key;
  return null;
}

/**
 * Fold a set of knob edits into an EXISTING overlay (never rebuild — paths the
 * current view doesn't render must survive a save; presets write wide overlays
 * and the Common view shows a curated handful).
 * @param {object} overlay  current sparse overlay (not mutated)
 * @param {Array<{path: string, value: number}>} edits  rendered knob values
 * @param {object} defaults TUNABLES_DEFAULTS
 * @returns {object} the next overlay
 */
export function mergeKnobEdits(overlay, edits, defaults) {
  const next = JSON.parse(JSON.stringify(overlay ?? {}));
  for (const { path, value } of edits) {
    if (typeof value !== "number" || Number.isNaN(value)) continue;
    const def = getByPath(defaults, path);
    if (value === def) deleteByPath(next, path);
    else setByPath(next, path, value);
  }
  return next;
}

/**
 * Validate preset overlays against the defaults — used by the node gate so a
 * typo'd path or a value matching its default (a no-op masquerading as
 * philosophy) fails loudly.
 * @returns {string[]} problems (empty = valid)
 */
export function validatePresets(defaults) {
  const problems = [];
  for (const p of SCORING_PRESETS) {
    for (const { path, value } of flattenTunables(p.overlay)) {
      const def = getByPath(defaults, path);
      if (typeof def !== "number") problems.push(`${p.key}: ${path} is not a numeric tunable`);
      else if (value === def) problems.push(`${p.key}: ${path} equals its default (${def}) — dead weight`);
    }
  }
  return problems;
}
