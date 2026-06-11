/**
 * checks/quick-read.mjs — M9.3d: the unified §16.2/§16.3 tiered read
 * (aggregate; fixture-independent).
 *
 * buildTieredRead moved from hooks/token-scan.mjs into services/quick-read.mjs
 * (one path for the token scan AND the lookbook button) and was made
 * side-effect-free — these checks pin the §16.2 strictly-more contract:
 *  1. failed — nothing reads;
 *  2. minimal — first impression only (Reads as + archetype blurb sentence);
 *  3. partial — + primary style, heat band (no studied-look rows yet);
 *  4. full — + style tier, danger, drip (uniform row only when a kit matches);
 *  5. §14.3 brand-tier pin surfaces as a "Reads … money" row at partial+.
 */

import { buildTieredRead } from "../../../scripts/services/quick-read.mjs";
import { TUNABLES_DEFAULTS } from "../../../scripts/config/tunables.mjs";

const READS = {
  actor: { items: [] },
  archetypes: [{ key: "solo", label: "Solo" }],
  collected: { styles: { kitsch: 2, businesswear: 1 }, socialStats: { cool: 0 } },
  heat: { level: "WARM" },
  styleRating: { total: 80, tier: { name: "Average Joe" } },
  danger: { value: 12, tier: "LOW" },
  dripRating: { rating: "Thrift-Core" },
  cyberwareData: { hidden_chrome: [], bioware: [] },
  visibility: { value: {} },
  scMods: {},
};
const CONFIG = {
  factions: { FACTION_ARCHETYPES: { solo: { description: "Hired muscle. Stays paid, stays quiet." } } },
  brands: { BRANDS: {} },
};
const TARGET = { flags: {} };
const OPTS = { scannerInt: 5, scanTotal: 16, tunables: TUNABLES_DEFAULTS, uniforms: [] };

export default function quickReadChecks() {
  const checks = [];
  const labels = (r) => r.rows.map((row) => row.label);

  checks.push({
    name: "quickRead — failed tier reads nothing",
    actual: buildTieredRead("failed", READS, CONFIG, TARGET, OPTS),
    expected: { rows: [], blurb: null },
  });

  const minimal = buildTieredRead("minimal", READS, CONFIG, TARGET, OPTS);
  checks.push({
    name: "quickRead — minimal is the first impression: archetype + its first sentence",
    actual: { labels: labels(minimal), readsAs: minimal.rows[0].value, blurb: minimal.blurb },
    expected: { labels: ["Reads as"], readsAs: "Solo", blurb: "Hired muscle." },
  });

  const partial = buildTieredRead("partial", READS, CONFIG, TARGET, OPTS);
  checks.push({
    name: "quickRead — partial adds primary style + heat band, nothing studied",
    actual: { labels: labels(partial), heat: partial.rows[2].value },
    expected: { labels: ["Reads as", "Primary style", "Heat"], heat: "WARM" },
  });

  const full = buildTieredRead("full", READS, CONFIG, TARGET, OPTS);
  checks.push({
    name: "quickRead — full is the studied look: + style tier, danger, drip (no uniform without a kit)",
    actual: { labels: labels(full), style: full.rows[3].value, drip: full.rows[5].value },
    expected: {
      labels: ["Reads as", "Primary style", "Heat", "Style", "Danger", "Drip"],
      style: "80 · Average Joe",
      drip: "Thrift-Core",
    },
  });

  const pinnedTier = buildTieredRead(
    "partial",
    { ...READS, overrides: { brandTier: "luxury" } },
    CONFIG, TARGET, OPTS
  );
  checks.push({
    name: "quickRead — §14.3 brand-tier pin surfaces at partial+ as a Reads row",
    actual: { hasReadsRow: pinnedTier.rows.some((r) => r.label === "Reads" && /money/.test(r.value)) },
    expected: { hasReadsRow: true },
  });

  return checks;
}
