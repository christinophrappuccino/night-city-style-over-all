/**
 * harness.mjs — node parity-test utilities (no Foundry needed).
 *
 * The engine is tested against golden fixtures captured from Phase 82. Engine
 * functions return MACRO-COMPATIBLE SUPERSETS (Phase 82 fields + explainability),
 * so comparison is "expected ⊆ actual": every field the macro produced must match;
 * extra explainability fields on the engine result are ignored.
 *
 * Spec: SC-Module-Architecture-Guide.md §29.8 (parity gate)
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const EPS = 1e-9; // absorb IEEE float noise; parity is otherwise exact

/** Load the golden fixtures. */
export function loadFixtures() {
  const p = join(__dirname, "..", "fixtures", "sc-parity-fixtures.json");
  return JSON.parse(readFileSync(p, "utf8"));
}

function numEqual(a, b) {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return Math.abs(a - b) <= EPS + EPS * Math.max(Math.abs(a), Math.abs(b));
  }
  return false;
}

/**
 * Recursively assert that every field in `expected` is present and equal in
 * `actual` (subset semantics). Returns a list of {path, expected, actual} diffs.
 */
export function matchesSubset(actual, expected, path = "") {
  const diffs = [];
  const walk = (act, exp, p) => {
    if (exp === null || typeof exp !== "object") {
      if (!numEqual(act, exp) && act !== exp) diffs.push({ path: p || "(root)", expected: exp, actual: act });
      return;
    }
    if (Array.isArray(exp)) {
      if (!Array.isArray(act)) {
        diffs.push({ path: p, expected: `array[${exp.length}]`, actual: typeof act });
        return;
      }
      if (act.length !== exp.length) {
        diffs.push({ path: `${p}.length`, expected: exp.length, actual: act.length });
      }
      exp.forEach((v, i) => walk(act?.[i], v, `${p}[${i}]`));
      return;
    }
    if (act === null || typeof act !== "object") {
      diffs.push({ path: p, expected: "object", actual: act });
      return;
    }
    for (const k of Object.keys(exp)) walk(act[k], exp[k], p ? `${p}.${k}` : k);
  };
  walk(actual, expected, path);
  return diffs;
}

/** Simple tally + console reporter. */
export class Reporter {
  constructor() {
    this.pass = 0;
    this.fail = 0;
    this.failures = [];
  }
  record(name, diffs) {
    if (diffs.length === 0) {
      this.pass++;
    } else {
      this.fail++;
      this.failures.push({ name, diffs });
      console.log(`  ✗ ${name}`);
      for (const d of diffs.slice(0, 6)) {
        console.log(`      ${d.path}: expected ${JSON.stringify(d.expected)}, got ${JSON.stringify(d.actual)}`);
      }
      if (diffs.length > 6) console.log(`      …and ${diffs.length - 6} more`);
    }
  }
  summary() {
    const total = this.pass + this.fail;
    console.log(`\n${this.pass}/${total} checks passed${this.fail ? `, ${this.fail} FAILED` : " — parity GREEN"}.`);
    return this.fail === 0;
  }
}
