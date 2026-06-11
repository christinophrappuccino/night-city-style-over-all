/**
 * checks/observer-lens.mjs — M9.3a: the §24 observer lens + §25.2 headline
 * (aggregate; fixture-independent).
 *
 * NEW work (no macro reference — the macro had PerceptionGate but no in-app
 * observer model; designed from §24/§16.2/§25.2/§27.3). Verifies:
 *  1. collect factors gating — covered clothing stops feeding the CPR-native
 *     genre count + perceived cost; the SELF path (no factors) is unchanged;
 *  2. headline composer — full line, tone-less line, empty-set line;
 *  3. resolveObserver — street defaults from tunables.observer, faction
 *     resolution, stale-selection fallback, token observer via effectiveStats;
 *  4. applyObserverLens (street) — passive tier vs COOL-shifted thresholds and
 *     the strictly-more reveal map (§16.2).
 *
 * The faction-observer disguise branch reads the uniforms world setting
 * (DataStore → game.settings), so it stays an in-world check, not a node one.
 */

import { collect } from "../../../scripts/engine/collect.mjs";
import { composeHeadline } from "../../../scripts/engine/headline.mjs";
import { observerOptions, resolveObserver, applyObserverLens } from "../../../scripts/services/observers.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";
import FACTIONS_CONFIG from "../../../scripts/config/factions.mjs";

let nextId = 0;
const mockClothing = (slot, style, cost, name = "Piece") => ({
  id: `obs-mock-${nextId++}`, name, type: "clothing", img: null,
  system: { equipped: "equipped", type: slot, style, price: { market: cost } },
  effects: [], flags: {},
});

export default function observerLensChecks() {
  const checks = [];
  const T = TUNABLES_DEFAULTS;
  const config = { factions: FACTIONS_CONFIG, brands: { BRANDS: {} } };

  // ── 1. collect factors gating (§27.3) ──────────────────────────────────────
  const jacket = mockClothing("jacket", "kitsch", 100, "Scrap Jacket");
  const top = mockClothing("top", "businesswear", 500, "Silk Shirt");
  const items = [jacket, top];

  const selfRun = collect(null, { items });
  checks.push({
    name: "observer.collect — self path (no factors) counts everything, as ever",
    actual: { styles: selfRun.styles, totalCost: selfRun.totalCost, covered: selfRun.parts.top.covered },
    expected: { styles: { kitsch: 1, businesswear: 1 }, totalCost: 600, covered: false },
  });

  const observedRun = collect(null, { items, factors: { [jacket.id]: 1, [top.id]: 0 } });
  checks.push({
    name: "observer.collect — factor-0 clothing stops reading: no genre count, no perceived cost, still WORN",
    actual: {
      styles: observedRun.styles, totalCost: observedRun.totalCost,
      topWorn: observedRun.parts.top.worn, topCovered: observedRun.parts.top.covered,
      jacketCovered: observedRun.parts.jacket.covered,
    },
    expected: {
      styles: { kitsch: 1 }, totalCost: 100,
      topWorn: true, topCovered: true, jacketCovered: false,
    },
  });

  // ── 2. headline composer (§25.2) ───────────────────────────────────────────
  const full = composeHeadline({
    vibes: { descriptor: "cool, faintly menacing" },
    archetypes: [{ key: "solo", label: "Solo" }],
    heat: { level: "HOT" },
    districtName: "Watson",
  });
  checks.push({
    name: "headline — tone + read + heat + district compose the §25.2 line",
    actual: { text: full.text, hasSignal: full.hasSignal },
    expected: { text: "Cool, faintly menacing — reads Solo. Running hot, at home in Watson.", hasSignal: true },
  });
  checks.push({
    name: "headline — no tone leads with the read; empty set degrades honestly",
    actual: {
      noTone: composeHeadline({ archetypes: [{ key: "solo", label: "Solo" }], heat: { level: "COLD" } }).text,
      empty: composeHeadline({}).hasSignal,
    },
    expected: { noTone: "Reads Solo. Barely any heat.", empty: false },
  });

  // ── 3. resolveObserver ─────────────────────────────────────────────────────
  const street = resolveObserver("street", config, {}, T);
  checks.push({
    name: "observer.resolve — street defaults ride tunables.observer.generic",
    actual: { kind: street.kind, int: street.int, perception: street.perception, factionKey: street.factionKey },
    expected: { kind: "street", int: T.observer.generic.int, perception: T.observer.generic.perception, factionKey: null },
  });

  const factionKey = Object.keys(FACTIONS_CONFIG.FACTIONS)[0];
  const faction = resolveObserver(`faction:${factionKey}`, config, {}, T);
  checks.push({
    name: "observer.resolve — faction selection carries the key; stale selection falls back to the street",
    actual: { kind: faction.kind, factionKey: faction.factionKey, stale: resolveObserver("faction:noSuchGang", config, {}, T).kind },
    expected: { kind: "faction", factionKey, stale: "street" },
  });

  const lookout = {
    id: "obs-tok-1", name: "Lookout",
    system: {
      stats: { int: { value: 7 }, cool: { value: 0 }, emp: { value: 0 } },
      skills: { concentration: { perception: { level: 4 } } },
      reputation: { value: 0 },
    },
    items: [],
  };
  const token = resolveObserver("token:obs-tok-1", config, { actors: [lookout] }, T);
  checks.push({
    name: "observer.resolve — token observer uses their actual effective INT + Perception (§24)",
    actual: { kind: token.kind, int: token.int, perception: token.perception, label: token.label },
    expected: { kind: "token", int: 7, perception: 4, label: "Lookout" },
  });

  checks.push({
    name: "observer.options — street first, factions grouped, self excluded from scene tokens",
    actual: (() => {
      const opts = observerOptions(config, { actors: [lookout, { id: "me", name: "Me" }], selfId: "me" });
      return {
        first: opts[0].value,
        hasFaction: opts.some((o) => o.value === `faction:${factionKey}`),
        tokens: opts.filter((o) => o.value.startsWith("token:")).map((o) => o.value),
      };
    })(),
    expected: { first: "street", hasFaction: true, tokens: ["token:obs-tok-1"] },
  });

  // ── 4. applyObserverLens — passive tier + the strictly-more reveal (§16.2) ─
  const mockReads = (cool) => ({
    actor: { items: [] },
    collected: { socialStats: { cool }, styles: {} },
    cyberwareData: { hidden_chrome: [], bioware: [] },
    visibility: { value: {} },
    scMods: {},
    archetypes: [{ key: "solo", label: "Solo" }],
  });

  // street passive = 5 + 6 + 5 = 16. COOL 6 shifts thresholds to 14/17/19 → minimal.
  const glance = applyObserverLens({ reads: mockReads(6), observer: street, config, tunables: T });
  checks.push({
    name: "observer.lens — composure shifts the bar: COOL 6 holds the street to a glance (minimal)",
    actual: {
      tier: glance.tier, passiveTotal: glance.passiveTotal,
      reveal: { archetype: glance.reveal.archetype, vibeDescriptor: glance.reveal.vibeDescriptor, vibeRadar: glance.reveal.vibeRadar, heat: glance.reveal.heat, brands: glance.reveal.brands, styleTier: glance.reveal.styleTier },
    },
    expected: {
      tier: "minimal", passiveTotal: 16,
      reveal: { archetype: true, vibeDescriptor: true, vibeRadar: false, heat: false, brands: false, styleTier: false },
    },
  });

  // COOL 0 → thresholds 12/15/17 → 16 lands partial: shape/heat/brands open, studied look still closed.
  const goodLook = applyObserverLens({ reads: mockReads(0), observer: street, config, tunables: T });
  checks.push({
    name: "observer.lens — partial opens shape/heat/brands, the studied look stays closed",
    actual: { tier: goodLook.tier, vibeRadar: goodLook.reveal.vibeRadar, heat: goodLook.reveal.heat, brands: goodLook.reveal.brands, styleTier: goodLook.reveal.styleTier, danger: goodLook.reveal.danger },
    expected: { tier: "partial", vibeRadar: true, heat: true, brands: true, styleTier: false, danger: false },
  });

  // An eagle-eyed token (INT 7 + PER 4 + 5 = 16) vs COOL 30 → thresholds 22/25/27 → failed.
  const blank = applyObserverLens({ reads: mockReads(30), observer: token, config, tunables: T });
  checks.push({
    name: "observer.lens — enough composure beats a passive eye entirely (failed → reveal nothing)",
    actual: { tier: blank.tier, anything: blank.reveal.anything, archetype: blank.reveal.archetype },
    expected: { tier: "failed", anything: false, archetype: false },
  });

  return checks;
}
