/**
 * 001-journals-to-settings.mjs — import legacy macro journals into world settings.
 *
 * The reference macro stored config as JournalEntries (a "Style Checker" folder, one
 * page each, JSON wrapped in <pre>). This migration reads those journals — using the
 * SAME parse the macro did — and writes their data into the settings envelopes.
 *
 * Defensive by design: when a legacy journal is absent (fresh install, or a world
 * that never ran the macro), the registered seed default already stands, so we simply
 * skip it. A parse failure also skips (keeps the default) and warns — never throws.
 *
 * Spec: SC-Module-Architecture-Guide.md §5.4; ref StyleDataManager._readJournal
 */

import { CONFIGS } from "../../config/index.mjs";
import { DataStore } from "../data-store.mjs";

const LOG = "Night City: Style Over All | migration 001 |";

/**
 * Replicate StyleDataManager._readJournal: pull the page content, extract the JSON
 * from inside <pre>…</pre> (unescaping HTML entities), and parse it.
 * @param {JournalEntry} journal
 * @returns {object|null} parsed data, or null if empty/unparseable
 */
function readJournalJSON(journal) {
  let content = "";
  if (journal.pages && journal.pages.size > 0) {
    content = journal.pages.contents[0]?.text?.content || "";
  } else if (journal.content) {
    content = journal.content;
  }
  if (!content) return null;

  try {
    const preMatch = content.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    let jsonText = preMatch ? preMatch[1] : content;
    jsonText = jsonText
      .replace(/<\/?code>/gi, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&") // unescape & LAST so earlier entities aren't double-decoded
      .trim();
    return JSON.parse(jsonText);
  } catch (e) {
    console.error(`${LOG} failed to parse "${journal.name}":`, e);
    ui.notifications?.warn(
      `Style Over All: couldn't read legacy journal "${journal.name}" — kept defaults for that config.`
    );
    return null;
  }
}

/**
 * Run the journals → settings import. GM-gated by the runner.
 * @returns {Promise<{imported:string[], skipped:string[]}>}
 */
export async function migration001() {
  const imported = [];
  const skipped = [];

  for (const cfg of CONFIGS) {
    const journal = game.journal.getName(cfg.journal);
    if (!journal) {
      skipped.push(cfg.key); // no legacy data — registered default stands
      continue;
    }
    const data = readJournalJSON(journal);
    if (data == null) {
      skipped.push(cfg.key); // empty/unparseable — keep default
      continue;
    }
    await DataStore.setEnvelope(cfg.key, { schema: cfg.schema, data });
    imported.push(cfg.key);
  }

  console.log(
    `${LOG} imported ${imported.length} config(s) from journals; ` +
      `${skipped.length} kept defaults.`,
    { imported, skipped }
  );
  return { imported, skipped };
}
