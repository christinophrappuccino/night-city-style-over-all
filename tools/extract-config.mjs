/**
 * tools/extract-config.mjs — one-shot extractor (M1 build aid, not shipped at runtime).
 *
 * Lifts each StyleDataManager.getDefault*Data() object literal out of the reference
 * macro verbatim and emits a config/<name>.mjs seed module (guide §5.3). Run with:
 *
 *   node tools/extract-config.mjs
 *
 * It brace-matches the literal returned by each function (so nested braces, strings,
 * and comments survive intact), validates it evaluates as a JS object, and writes the
 * seed. Re-runnable / idempotent.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MACRO = join(ROOT, "stylechecker2_0_Phase82.js");
const CONFIG_DIR = join(ROOT, "scripts", "config");

// fn name in macro → [output file, exported const name]
const TARGETS = [
  ["getDefaultDistrictsData",  "districts.mjs",   "DISTRICTS"],
  ["getDefaultCommentsData",   "comments.mjs",    "COMMENTS"],
  ["getDefaultCyberwareData",  "cyberware.mjs",   "CYBERWARE"],
  ["getDefaultRatingsData",    "ratings.mjs",     "RATINGS"],
  ["getDefaultFactionsData",   "factions.mjs",    "FACTIONS"],
  ["getDefaultCrewData",       "crews.mjs",       "CREWS"],
  ["getDefaultSceneGatesData", "scene-gates.mjs", "SCENE_GATES"],
];

const src = readFileSync(MACRO, "utf8");

/**
 * Brace-aware slice: from the `{` at startIdx, return the substring through its
 * matching `}`. Skips braces inside strings, template literals, and comments.
 */
function matchObjectLiteral(text, startIdx) {
  let depth = 0;
  let i = startIdx;
  let inString = null; // quote char when inside a string
  let inLineComment = false;
  let inBlockComment = false;
  for (; i < text.length; i++) {
    const c = text[i];
    const prev = text[i - 1];
    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === "/" && prev === "*") inBlockComment = false;
      continue;
    }
    if (inString) {
      if (c === inString && prev !== "\\") inString = null;
      continue;
    }
    if (c === "/" && text[i + 1] === "/") { inLineComment = true; continue; }
    if (c === "/" && text[i + 1] === "*") { inBlockComment = true; continue; }
    if (c === '"' || c === "'" || c === "`") { inString = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return text.slice(startIdx, i + 1);
    }
  }
  throw new Error("Unbalanced braces while matching object literal");
}

mkdirSync(CONFIG_DIR, { recursive: true });

for (const [fn, outFile, constName] of TARGETS) {
  const fnIdx = src.indexOf(`static ${fn}(`);
  if (fnIdx === -1) throw new Error(`Function definition not found: static ${fn}(`);
  const returnIdx = src.indexOf("return", fnIdx);
  const braceIdx = src.indexOf("{", returnIdx);
  const literal = matchObjectLiteral(src, braceIdx);

  // Validate it evaluates to a plain object.
  let evaluated;
  try {
    // eslint-disable-next-line no-new-func
    evaluated = new Function(`return (${literal});`)();
  } catch (e) {
    throw new Error(`${fn}: literal failed to evaluate — ${e.message}`);
  }
  const topKeys = Object.keys(evaluated).length;

  const header =
    `/**\n` +
    ` * config/${outFile} — seed defaults (guide §5.3).\n` +
    ` *\n` +
    ` * Lifted VERBATIM from stylechecker2_0_Phase82.js\n` +
    ` * StyleDataManager.${fn}(). Do not hand-edit — regenerate via\n` +
    ` * tools/extract-config.mjs if the reference macro changes.\n` +
    ` *\n` +
    ` * Top-level keys: ${topKeys}.\n` +
    ` */\n\n`;

  const body =
    `export const ${constName} = ${literal};\n\n` +
    `export default ${constName};\n`;

  writeFileSync(join(CONFIG_DIR, outFile), header + body, "utf8");
  console.log(`✓ ${outFile.padEnd(16)} ${constName.padEnd(12)} (${topKeys} top-level keys, ${literal.length} chars)`);
}

console.log("Done.");
