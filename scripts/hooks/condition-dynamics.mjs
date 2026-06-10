/**
 * hooks/condition-dynamics.mjs — combat dirties gear (M7.8, guide §15/§17).
 *
 * Take damage past the thresholds and your equipped clothing shows it: hp ≤ 50%
 * reads worn, hp ≤ 25% reads bloodied (which the wound-heat fold already makes
 * the street notice). Degradation never improves gear — that's the tailor's job.
 *
 * Mechanics: `preUpdateActor` stashes the old hp on the update options; on
 * `updateActor` the ACTIVE GM client (single writer — players may not own the
 * doc, and only one client may write) plans via services/condition.mjs and
 * writes each garment through updateStyleData. Owners get a whispered note.
 *
 * Toggleable via the CONDITION_DYNAMICS world setting.
 */

import { MODULE_ID, SETTINGS } from "../constants.mjs";
import * as cpr from "../data/cpr-adapter.mjs";
import { updateStyleData } from "../data/flags.mjs";
import { planConditionDegradation } from "../services/condition.mjs";
import { isPrimaryGM } from "../services/sockets.mjs";

const OLD_HP = "ncsoaOldHp";

function enabled() {
  try {
    return game.settings.get(MODULE_ID, SETTINGS.CONDITION_DYNAMICS);
  } catch {
    return false;
  }
}

export function registerConditionDynamics() {
  Hooks.on("preUpdateActor", (actor, changes, options) => {
    const next = foundry.utils.getProperty(changes, "system.derivedStats.hp.value");
    if (next == null) return;
    options[OLD_HP] = cpr.getHP(actor).value;
  });

  Hooks.on("updateActor", async (actor, changes, options) => {
    if (!enabled() || !isPrimaryGM()) return;
    if (actor.type !== "character" && actor.type !== "mook") return;
    const oldHp = options?.[OLD_HP];
    const { value: newHp, max } = cpr.getHP(actor);
    if (oldHp == null || newHp >= oldHp) return; // healing/no change never dirties

    const hpPct = (newHp / Math.max(1, max)) * 100;
    const plan = planConditionDegradation({ hpPct, items: cpr.getItems(actor) });
    if (!plan.length) return;

    try {
      for (const { item, styleData, to } of plan) {
        await updateStyleData(item, { ...styleData, condition: to });
      }
      const worst = plan.some((p) => p.to === "bloodied") ? "bloodied" : "worn";
      const names = plan.map((p) => p.item.name).join(", ");
      ChatMessage.create({
        content:
          `<div class="ncsoa-chat-card ${worst === "bloodied" ? "red" : "yellow"}">` +
          `<div class="ncsoa-cc-notes"><i class="fas fa-droplet"></i> ` +
          `${actor.name}'s gear takes the hit — ${names} now read${plan.length === 1 ? "s" : ""} <strong>${worst}</strong>. ` +
          `A tailor can clean that up.</div></div>`,
        speaker: ChatMessage.getSpeaker({ actor }),
        whisper: game.users.contents.filter((u) => u.isGM || actor.testUserPermission?.(u, "OWNER")).map((u) => u.id),
      });
    } catch (e) {
      console.error("Night City: Style Over All | condition dynamics failed:", e);
    }
  });
}
