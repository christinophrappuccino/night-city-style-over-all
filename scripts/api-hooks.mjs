/**
 * api-hooks.mjs — the custom hook vocabulary (M9.4b, guide §4.2 / M9).
 *
 * LEAF module on purpose: no imports, so services and apps can fire hooks
 * without creating an import cycle with api.mjs (which imports the apps for
 * its openers), and node-gated services can import it safely (nothing here
 * touches Foundry at module scope).
 *
 * Macro/module authors subscribe via the names (also exposed on the API as
 * `api.HOOKS`):
 *   Hooks.on("styleCheckerScanComplete", ({ scanner, target, tier }) => …);
 */

export const API_HOOKS = {
  /** A quick read finished (token-HUD scan or lookbook P2P read, §16.2/§16.3).
   *  payload: { scanner, target, tier, total, read } */
  SCAN_COMPLETE: "styleCheckerScanComplete",
  /** A scene-gate verdict was posted (§14.2). payload: { actor, gateName, verdict } */
  GATE_VERDICT: "styleCheckerGateVerdict",
  /** A staged Wardrobe look was committed to the actor (§7.3). payload: { actor, changed } */
  OUTFIT_APPLIED: "styleCheckerOutfitApplied",
  /** A lookbook card was shared to chat (§16.4). payload: { actor } */
  LOOKBOOK_SHARED: "styleCheckerLookbookShared",
};

/** Fire a custom hook, never letting a subscriber's error break the caller. */
export function fireApiHook(name, payload) {
  if (typeof Hooks === "undefined") return; // node / early boot
  try {
    Hooks.callAll(name, payload);
  } catch (e) {
    console.error(`Night City: Style Over All | hook "${name}" subscriber error:`, e);
  }
}
