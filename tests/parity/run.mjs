/**
 * run.mjs — parity gate runner. Loads golden fixtures, runs every registered
 * check module against each fixture, reports, and exits non-zero on any failure.
 *
 *   node tests/parity/run.mjs
 *
 * Add a module's checks by importing it and pushing into CHECK_MODULES.
 * Spec: SC-Module-Architecture-Guide.md §29.8
 */

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { loadFixtures, matchesSubset, Reporter } from "./harness.mjs";
import ratingsChecks from "./checks/ratings.mjs";
import profileChecks from "./checks/profile.mjs";
import heatChecks from "./checks/heat.mjs";
import dangerChecks from "./checks/danger.mjs";
import archetypeChecks from "./checks/archetypes.mjs";
import disguiseChecks from "./checks/disguise.mjs";
import districtChecks from "./checks/districts.mjs";
import sceneChecks from "./checks/scene.mjs";
import crewChecks from "./checks/crew.mjs";
import recommendationChecks from "./checks/recommendations.mjs";
import cyberwareChecks from "./checks/cyberware.mjs";
import scModsChecks from "./checks/sc-mods.mjs";
import wardrobeStagingChecks from "./checks/wardrobe-staging.mjs";
import outfitChecks from "./checks/outfits.mjs";
import quickDressChecks from "./checks/quick-dress.mjs";
import uniformChecks from "./checks/uniforms.mjs";
import shopChecks from "./checks/shops.mjs";
import tailorChecks from "./checks/tailor.mjs";
import trendChecks from "./checks/trends.mjs";
import liveLayerChecks from "./checks/live-layer.mjs";
import gardenChecks from "./checks/garden.mjs";
import brandChecks from "./checks/brands.mjs";
import vibeChecks from "./checks/vibes.mjs";
import visibilityChecks from "./checks/visibility.mjs";
import formalityChecks from "./checks/formality.mjs";
import colorChecks from "./checks/colors.mjs";
import recognitionChecks from "./checks/recognition.mjs";
import componentChecks from "./checks/components.mjs";
import observerLensChecks from "./checks/observer-lens.mjs";
import overrideChecks from "./checks/overrides.mjs";
import quickReadChecks from "./checks/quick-read.mjs";
import factionMatrixChecks from "./checks/faction-matrix.mjs";
import presetChecks from "./checks/presets.mjs";
import iconColorChecks from "./checks/icon-color.mjs";

// Per-actor modules: invoked once per fixture.
const CHECK_MODULES = [
  ratingsChecks,
  profileChecks,
  heatChecks,
  dangerChecks,
  archetypeChecks,
  disguiseChecks,
  districtChecks,
  sceneChecks,
  recommendationChecks,
  cyberwareChecks,
];

// Aggregate modules: invoked once with the whole payload (crew, recommendations)
// or once standalone (sc-mods builds its own fabricated items).
const AGGREGATE_MODULES = [
  crewChecks,
  scModsChecks,
  wardrobeStagingChecks,
  outfitChecks,
  quickDressChecks,
  uniformChecks,
  shopChecks,
  tailorChecks,
  trendChecks,
  liveLayerChecks,
  gardenChecks,
  brandChecks,
  vibeChecks,
  visibilityChecks,
  formalityChecks,
  colorChecks,
  recognitionChecks,
  componentChecks,
  observerLensChecks,
  overrideChecks,
  quickReadChecks,
  factionMatrixChecks,
  presetChecks,
  iconColorChecks,
];

// ── Syntax gate ──────────────────────────────────────────────────────────────
// Parse EVERY module file with `node --check`. The behavior checks below only
// import the pure layers — apps/integration files are Foundry-global and never
// load in node, so a syntax error there (e.g. a `*/` inside a block comment)
// would otherwise ship and break the module at the browser's import step.
function listMjs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? listMjs(p) : e.name.endsWith(".mjs") ? [p] : [];
  });
}
const sources = listMjs("scripts");
const syntaxErrors = sources.filter((f) => spawnSync(process.execPath, ["--check", f]).status !== 0);
if (syntaxErrors.length) {
  console.error(`Syntax gate — ${syntaxErrors.length} file(s) fail to parse:`);
  for (const f of syntaxErrors) {
    console.error(`\n✗ ${f}`);
    console.error(String(spawnSync(process.execPath, ["--check", f]).stderr));
  }
  process.exit(1);
}
console.log(`Syntax gate — ${sources.length} module files parse clean.`);

const data = loadFixtures();
console.log(`Parity gate — ${data.count} actor(s), captured ${data.capturedAt}\n`);

const reporter = new Reporter();
for (const fix of data.fixtures) {
  for (const mod of CHECK_MODULES) {
    for (const check of mod(fix)) {
      reporter.record(check.name, matchesSubset(check.actual, check.expected));
    }
  }
}
for (const mod of AGGREGATE_MODULES) {
  for (const check of mod(data)) {
    reporter.record(check.name, matchesSubset(check.actual, check.expected));
  }
}

process.exit(reporter.summary() ? 0 : 1);
