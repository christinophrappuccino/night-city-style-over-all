/**
 * sockets.mjs — the module's socket layer (M7.3, guide §6 M7).
 *
 * ONE channel (`module.<id>` — `socket: true` has been in module.json since M0),
 * typed messages, a handler registry. Senders address users explicitly
 * (`targetUserIds`) or broadcast; receivers ignore messages not meant for them.
 * Foundry sockets don't echo to the sender — `emit` runs the local handler too
 * when the sender is also a target, so GM-side UI reacts identically.
 *
 * Message types live in MESSAGE so senders and handlers can't drift apart.
 *
 * Spec: SC-Module-Architecture-Guide.md §6 M7, §16.3.
 */

import { MODULE_ID } from "../constants.mjs";

const CHANNEL = `module.${MODULE_ID}`;

/** Typed message vocabulary — add here, never inline strings. */
export const MESSAGE = Object.freeze({
  GATE_VERDICT: "gateVerdict",   // GM → player: your scene-gate result
  STYLE_SCAN: "styleScan",       // scanner → target's player: you were looked at (M7.6)
  HEAT_ALERT: "heatAlert",       // GM → player: your heat changed band
  RECORD_READ: "recordRead",     // player → GM: tally a public read (Known For, §16.6)
});

/** True on exactly ONE active GM client — the designated writer for hooks and
 *  socket handlers that mutate documents (every client sees the same events). */
export function isPrimaryGM() {
  if (!game.user?.isGM) return false;
  const activeGMs = game.users.contents.filter((u) => u.isGM && u.active).sort((a, b) => (a.id > b.id ? 1 : -1));
  return activeGMs[0]?.id === game.user.id;
}

const handlers = new Map();

/** Register the receiving end. Call once on `ready`. */
export function registerSocket() {
  game.socket?.on(CHANNEL, (msg) => dispatch(msg));
}

function dispatch(msg) {
  if (!msg?.type) return;
  if (msg.targetUserIds?.length && !msg.targetUserIds.includes(game.user.id)) return;
  const fn = handlers.get(msg.type);
  if (!fn) return;
  try {
    fn(msg.payload ?? {}, msg);
  } catch (e) {
    console.error(`Night City: Style Over All | socket handler "${msg.type}" failed:`, e);
  }
}

/** Subscribe a handler for a MESSAGE type (one handler per type). */
export function onSocket(type, fn) {
  handlers.set(type, fn);
}

/**
 * Send a typed message. `targetUserIds: null` broadcasts to everyone else;
 * the local handler also runs when this client is a target (or on broadcast).
 */
export function emitSocket(type, payload, { targetUserIds = null } = {}) {
  const msg = { type, payload, targetUserIds, senderId: game.user.id };
  game.socket?.emit(CHANNEL, msg);
  if (!targetUserIds || targetUserIds.includes(game.user.id)) dispatch(msg);
}

/** The connected, active users who own an actor (for targeting verdicts). */
export function ownersOf(actor, { activeOnly = true } = {}) {
  return (game.users?.contents ?? [])
    .filter((u) => !u.isGM && (!activeOnly || u.active) && actor?.testUserPermission?.(u, "OWNER"))
    .map((u) => u.id);
}
