/**
 * build-packs.mjs — compile packs-src/ JSON into LevelDB compendium packs (M8).
 *
 *   npm run build:packs
 *
 * Each subdirectory of packs-src/ becomes packs/<name> via the Foundry CLI
 * (@foundryvtt/foundryvtt-cli). Source files are one document per JSON, with
 * `_id` (16 alphanumerics) and `_key` ("!items!<id>"). The built packs/ tree is
 * gitignored — CI builds it for releases; build locally to test in your world.
 *
 * Also validates the sources first: id format, key match, duplicate ids, and
 * that every clothing item carries a styleData flag (the catalog's whole point).
 *
 * Spec: SC-Module-Architecture-Guide.md §6 M8.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "packs-src");
const OUT = join(root, "packs");

const ID_RE = /^[a-zA-Z0-9]{16}$/;

function validatePack(dir) {
  const errors = [];
  const ids = new Set();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const doc = JSON.parse(readFileSync(join(dir, file), "utf8"));
    if (!ID_RE.test(doc._id ?? "")) errors.push(`${file}: bad _id "${doc._id}"`);
    if (doc._key !== `!items!${doc._id}`) errors.push(`${file}: _key mismatch`);
    if (ids.has(doc._id)) errors.push(`${file}: duplicate _id ${doc._id}`);
    ids.add(doc._id);
    if (doc.type === "clothing" && !doc.flags?.["night-city-style-over-all"]?.styleData) {
      errors.push(`${file}: clothing item without a styleData flag`);
    }
  }
  return { errors, count: ids.size };
}

const packs = readdirSync(SRC).filter((d) => statSync(join(SRC, d)).isDirectory());
if (!packs.length) {
  console.error("No pack sources found in packs-src/.");
  process.exit(1);
}

let failed = false;
for (const name of packs) {
  const dir = join(SRC, name);
  const { errors, count } = validatePack(dir);
  if (errors.length) {
    failed = true;
    console.error(`✗ ${name}: ${errors.length} problem(s)`);
    for (const e of errors) console.error(`    ${e}`);
    continue;
  }
  await compilePack(dir, join(OUT, name), { log: false });
  console.log(`✓ ${name}: ${count} document(s) → packs/${name}`);
}

process.exit(failed ? 1 : 0);
