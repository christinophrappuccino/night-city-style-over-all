/**
 * hooks/token-scan.mjs — "Scan Style" on the Token HUD (M7.6, guide §16.1–16.2).
 *
 * The headline quick-perceive: select your token, TARGET someone (hover + T),
 * hit the eye on your token's HUD. The roll, tier gating, whispered card and
 * Known-For tally all live in services/quick-read.mjs (M9.3d — ONE path shared
 * with the lookbook card's read button, §16.3). This hook is only the HUD
 * injection + token/target acquisition.
 *
 * Integration layer: zero read logic here.
 */

import { performQuickRead } from "../services/quick-read.mjs";

export function registerTokenScan() {
  Hooks.on("renderTokenHUD", (hud, html) => {
    const token = hud.object;
    if (!token?.actor?.isOwner) return;
    const $html = html instanceof jQuery ? html : $(html);
    if ($html.find(".ncsoa-scan").length) return;
    const btn = $(
      `<div class="control-icon ncsoa-scan" title="Scan Style — read your TARGETED token (hover a token and press T to target)">
         <i class="fas fa-eye"></i>
       </div>`
    );
    btn.on("click", () => scanTargetFrom(token));
    $html.find(".col.right").append(btn);
  });
}

async function scanTargetFrom(scannerToken) {
  const scanner = scannerToken.actor;
  const targetToken = [...(game.user?.targets ?? [])][0];
  if (!targetToken?.actor) {
    ui.notifications?.warn("Target someone first — hover their token and press T.");
    return;
  }
  try {
    await performQuickRead({ scanner, target: targetToken.actor });
  } catch (e) {
    console.error("Night City: Style Over All | token scan failed:", e);
    ui.notifications?.error("Scan failed — see console.");
  }
}
