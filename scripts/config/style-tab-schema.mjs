/**
 * style-tab-schema.mjs — declarative descriptor of the Item Style Tab field set.
 *
 * The Item Style Tab (M4, guide §8) authors the full frozen §5.2 `styleData`
 * schema with dropdowns instead of typed `sc.*` keys. Rather than hardcode the
 * controls in a template, this file describes every field once — control type,
 * `styleData` path, and option source — and `buildTabSchema(engineConfig)`
 * materializes the option lists (dynamic ones from world config via engine-config;
 * static enums from constants). The app and template are generic over this.
 *
 * §26.4: this IS the frozen authoring target — the catalog gets tagged against it.
 *
 * Control types:
 *   weightedMap — `{ key: number }` map (faction/archetype/style/district/chrome/vibe)
 *   scalar      — number (cost/heat/armor/DC/suppress/layer)
 *   select      — single choice (slot/region/side/coverage/wearMode/condition/…)
 *   multiSelect — `string[]` (regions covered)
 *   color       — hex string
 *   checkbox    — boolean
 *   text        — free string (brand, until the §13 registry lands)
 *
 * Spec: SC-Module-Architecture-Guide.md §8.2, §5.2, §27, §28, §9.
 */

import {
  STYLE_KEYS, CHROME_READ_KEYS, VIBE_TAGS, REGIONS, SC_SLOTS, COVERAGE,
  WEAR_MODES, SIDES, CONDITIONS, READ_PRIORITY_LABELS, FORMALITY_LABELS,
  FITS, AUTHENTICITY, GARMENT_MODIFICATIONS,
} from "../constants.mjs";

/** key/camelCase/snake_case → "Title Case" display label. */
export function humanize(key) {
  if (key == null) return "";
  return String(key)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** [{value,label}] from a flat key list, humanizing labels. */
const opts = (keys) => keys.map((k) => ({ value: k, label: humanize(k) }));

/** [{value,label}] from an ordinal label array (index = stored value). */
const ordinal = (labels) => labels.map((label, value) => ({ value, label: `${value} · ${label}` }));

/**
 * The static field DEFINITIONS, grouped into the tab's sections. `optionsFrom`
 * names a dynamic config source resolved at build time; `options` is inline-static.
 * `path` is the dot-path inside `styleData`.
 */
const SECTIONS = [
  {
    id: "identity",
    label: "Identity",
    hint: "Who the city reads you as. Faction cascades widest (archetype + style + chrome + cost + DC); archetype medium; the rest are flat reads.",
    fields: [
      { key: "faction",   path: "faction",   control: "weightedMap", optionsFrom: "factions",   defaultStrength: 25, hint: "Soft affiliation. Cascades into archetype/style/chrome/cost/DC at read time." },
      { key: "archetype", path: "archetype", control: "weightedMap", optionsFrom: "archetypes", defaultStrength: 15 },
      { key: "style",     path: "style",     control: "weightedMap", options: opts(STYLE_KEYS), defaultStrength: 3, step: 1 },
      { key: "district",  path: "district",  control: "weightedMap", optionsFrom: "districts",  defaultStrength: 5 },
      { key: "chrome",    path: "chrome",    control: "weightedMap", options: opts(CHROME_READ_KEYS), defaultStrength: 2 },
    ],
  },
  {
    id: "numbers",
    label: "Modifiers",
    hint: "Flat scalar adjustments. Leave at 0 / blank for no signal.",
    fields: [
      { key: "cost",              path: "cost",              control: "scalar", step: 50, placeholder: "eurobucks (eb)" },
      { key: "heat",              path: "heat",              control: "scalar", step: 1, hint: "− cools the read, + raises it." },
      { key: "armor",             path: "armor",             control: "scalar", step: 1 },
      { key: "disguiseDc",        path: "disguiseDc",        control: "scalar", step: 1, label: "Disguise DC" },
      { key: "antiStyleSuppress", path: "antiStyleSuppress", control: "scalar", step: 0.05, min: 0, max: 1, label: "Anti-Style Suppress", hint: "0–1: how much this piece softens anti-style penalties." },
    ],
  },
  {
    id: "slots",
    label: "Slot & Layer",
    hint: "The precise garment CPR can't name, and where it sits in the layering stack (§27). Covered inner layers stop reading.",
    fields: [
      { key: "scSlot",       path: "scSlot",       control: "select", options: opts(SC_SLOTS), allowBlank: true, label: "Slot", datalist: true },
      { key: "region",       path: "region",       control: "select", options: opts(REGIONS), allowBlank: true, label: "Primary region" },
      { key: "regions",      path: "regions",      control: "multiSelect", options: opts(REGIONS), label: "All regions covered" },
      { key: "layer",        path: "layer",        control: "scalar", step: 1, min: 0, hint: "0 = base → higher = outer." },
      { key: "coverage",     path: "coverage",     control: "select", options: opts(COVERAGE), allowBlank: true },
      { key: "wearMode",     path: "wearMode",     control: "select", options: opts(WEAR_MODES), allowBlank: true, label: "Wear mode" },
      { key: "side",         path: "side",         control: "select", options: opts(SIDES), allowBlank: true, label: "Laterality" },
      { key: "readPriority", path: "readPriority", control: "select", options: ordinal(READ_PRIORITY_LABELS), allowBlank: true, label: "Read priority" },
      { key: "anchoredTo",   path: "anchoredTo",   control: "select", options: opts(REGIONS), allowBlank: true, label: "Anchored to", hint: "Small item inherits this region's visibility." },
    ],
  },
  {
    id: "tone",
    label: "Tone & Brand",
    hint: "Social tone (§22) and provenance (§13) — orthogonal to style and identity.",
    fields: [
      { key: "vibe",      path: "vibe",      control: "weightedMap", options: opts(VIBE_TAGS), defaultStrength: 3, step: 1, hint: "Tradeoffs, not 'more is better' — menacing aids intimidation, hurts approachability." },
      { key: "brand",     path: "brand",     control: "text", placeholder: "brand key (e.g. ofuda)", hint: "Registry key; broad cascade (style/cost/heat/recognition). Free text until the brand registry ships." },
      { key: "formality", path: "formality", control: "select", options: ordinal(FORMALITY_LABELS), allowBlank: true, label: "Formality" },
      { key: "condition", path: "condition", control: "select", options: opts(CONDITIONS), allowBlank: true },
      { key: "fit",       path: "fit",       control: "select", options: opts(FITS), allowBlank: true, hint: "Read quality + conceal potential (§15); the Tailor retailors this." },
      { key: "authenticity", path: "authenticity", control: "select", options: opts(AUTHENTICITY), allowBlank: true, hint: "Counterfeit play (§13.4); the Tailor's brand stamp sets this." },
      { key: "modifications", path: "modifications", control: "multiSelect", options: opts(GARMENT_MODIFICATIONS), label: "Modifications", hint: "The §15.1 tailor layer; mechanical wiring in Tunables → tailor." },
    ],
  },
  {
    id: "colors",
    label: "Colors",
    hint: "Mechanical, not just cosmetic (§9): faction colorways, coordination, district palette fit. Recolor is display-only until M9.",
    fields: [
      { key: "colorPrimary", path: "colors.primary",     control: "color", label: "Primary" },
      { key: "colorAccent",  path: "colors.accent",      control: "color", label: "Accent" },
      { key: "recolorIcon",  path: "colors.recolorIcon", control: "checkbox", label: "Recolor icon", hint: "Tint this item's icon to its colorway." },
    ],
  },
];

/** Resolve a field's option list: inline `options`, else the named `optionsFrom`. */
function resolveOptions(field, sources) {
  if (field.options) return field.options;
  if (field.optionsFrom) return sources[field.optionsFrom] ?? [];
  return null;
}

/**
 * Materialize the tab schema for rendering: dynamic option lists (factions /
 * archetypes / districts) drawn from the engine config, static ones inline.
 * Options are sorted by label for the long lists.
 *
 * @param {{factions:object, districts:object}} engineConfig  from getEngineConfig()
 * @returns {{sections: Array}}
 */
export function buildTabSchema(engineConfig = {}) {
  const f = engineConfig.factions ?? {};
  const sortByLabel = (a, b) => a.label.localeCompare(b.label);

  const sources = {
    factions: Object.entries(f.FACTIONS ?? {})
      .map(([value, v]) => ({ value, label: v?.label || humanize(value) }))
      .sort(sortByLabel),
    archetypes: Object.entries(f.FACTION_ARCHETYPES ?? {})
      .map(([value, v]) => ({ value, label: v?.label || humanize(value) }))
      .sort(sortByLabel),
    districts: Object.entries(engineConfig.districts ?? {})
      .map(([value, v]) => ({ value, label: v?.name || humanize(value) }))
      .sort(sortByLabel),
  };

  const sections = SECTIONS.map((s) => ({
    ...s,
    fields: s.fields.map((field) => ({
      ...field,
      label: field.label || humanize(field.key),
      options: resolveOptions(field, sources),
    })),
  }));

  return { sections };
}

/** Flat list of every field descriptor (for read/write iteration). */
export function allFields() {
  return SECTIONS.flatMap((s) => s.fields);
}

export { SECTIONS };
