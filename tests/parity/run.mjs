/**
 * run.mjs — parity gate runner. Loads golden fixtures, runs every registered
 * check module against each fixture, reports, and exits non-zero on any failure.
 *
 *   node tests/parity/run.mjs
 *
 * Add a module's checks by importing it and pushing into CHECK_MODULES.
 * Spec: SC-Module-Architecture-Guide.md §29.8
 */

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
];

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
