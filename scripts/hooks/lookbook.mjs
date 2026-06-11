/**
 * hooks/lookbook.mjs — the lookbook card's quick-read button (§16.3, M9.3d).
 *
 * A lookbook is public; READING it is personal. Any viewer clicks "what do I
 * make of them?" and THEIR character runs the §16.2 scan against the look —
 * computed on the clicking user's client, whispered to them + the GM, no GM
 * mediation needed. Scanner = the user's assigned character, falling back to
 * their controlled token.
 *
 * Integration layer: binding only; the read lives in services/quick-read.mjs.
 */

import { performQuickRead } from "../services/quick-read.mjs";

export function registerLookbookChat() {
  Hooks.on("renderChatMessage", (message, html) => {
    const $html = html instanceof jQuery ? html : $(html);
    const btn = $html.find("[data-action='ncsoa-quick-read']");
    if (!btn.length) return;
    btn.on("click", async (e) => {
      const target = game.actors?.get(e.currentTarget.dataset.actor);
      const scanner = game.user?.character ?? canvas?.tokens?.controlled?.[0]?.actor ?? null;
      try {
        await performQuickRead({ scanner, target });
      } catch (err) {
        console.error("Night City: Style Over All | lookbook quick-read failed:", err);
        ui.notifications?.error("Read failed — see console.");
      }
    });
  });
}
