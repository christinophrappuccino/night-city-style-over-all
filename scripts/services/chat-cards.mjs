/**
 * chat-cards.mjs — themed chat cards (M7.4, guide §6 M7).
 *
 * The live layer's persistent surface: whispered, collapsible, Night-City-themed
 * cards. Builders render a chat template and create the ChatMessage with the
 * right whisper routing (owners + GM by default — a verdict is the player's
 * business, not the table's).
 *
 * Cards:
 *  · gate verdict (§14.8 / M7.5) — green/yellow/red + the gate's issue list;
 *  · style read (§16.1–16.2 / M7.6) — perception-gated tiered read;
 *  · lookbook (§16.4 / M9.3d) — the PUBLIC fit pic: slot layout + brand tags
 *    + the headline read, with a quick-read button (§16.3) in the footer.
 *
 * Spec: SC-Module-Architecture-Guide.md §6 M7, §16.
 */

import { MODULE_ID } from "../constants.mjs";
import * as cpr from "../data/cpr-adapter.mjs";
import { CLOTHING_SLOTS } from "../engine/collect.mjs";
import { composeHeadline } from "../engine/headline.mjs";
import { formatStyleName } from "../engine/recommendations.mjs";
import { dualReadStyleData } from "../data/sc-keys.mjs";
import { humanize } from "../config/style-tab-schema.mjs";
import { computeActorReads } from "./style-reads.mjs";
import { getEngineConfig } from "./engine-config.mjs";

const TPL = (name) => `modules/${MODULE_ID}/templates/chat/${name}.hbs`;

/** Whisper targets: the actor's owners + every GM. */
function ownersAndGM(actor) {
  const ids = new Set((game.users?.contents ?? []).filter((u) => u.isGM).map((u) => u.id));
  for (const u of game.users?.contents ?? []) {
    if (actor?.testUserPermission?.(u, "OWNER")) ids.add(u.id);
  }
  return [...ids];
}

async function postCard(template, data, { actor, whisper, flavor } = {}) {
  const content = await renderTemplate(template, data);
  return ChatMessage.create({
    content,
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
    whisper: whisper ?? (actor ? ownersAndGM(actor) : []),
    flavor,
  });
}

/**
 * Scene-gate verdict card (M7.5): whispered to the actor's owners + GM.
 * @param {object} p
 * @param {object} p.actor      the judged actor
 * @param {string} p.gateName   gate display name
 * @param {string} [p.gateNotes] dress-code notes shown under the verdict
 * @param {{status:string, issues:{msg:string, severity:string}[]}} p.verdict evaluateGate() output
 */
export function postGateVerdict({ actor, gateName, gateNotes, verdict }) {
  const status = verdict.status;
  const label = status === "green" ? "CLEARED" : status === "yellow" ? "FLAGGED" : "TURNED AWAY";
  return postCard(TPL("gate-verdict"), {
    actorName: actor.name,
    actorImg: actor.img,
    gateName,
    gateNotes,
    status,
    label,
    issues: verdict.issues ?? [],
    hasIssues: (verdict.issues ?? []).length > 0,
  }, { actor });
}

/**
 * Tiered style-read card (M7.6): whispered to the SCANNER's user(s) + GM.
 * @param {object} p
 * @param {object} p.scanner   scanning actor (speaker)
 * @param {object} p.target    scanned actor
 * @param {string} p.tier      "none"|"minimal"|"partial"|"full"
 * @param {object} p.roll      {total, formula} display values
 * @param {object} p.read      tier-gated read fields (built by the caller)
 * @param {string[]} [p.whisper] explicit whisper user ids
 */
/**
 * Lookbook card (§16.4, M9.3d): a shareable "fit pic" — the CURRENT committed
 * outfit in slot layout with brand tags, plus the headline read. PUBLIC by
 * design (it's a social artifact for the table); the footer's quick-read
 * button gives any viewer their own §16.3 whispered read of the look.
 * Recolored icons ride the §9.1 SVG recolor service (M9.4) — item art as-is
 * until then.
 */
export async function postLookbook(actor, { config = getEngineConfig() } = {}) {
  const reads = computeActorReads(actor, { config });
  const itemById = new Map(cpr.getItems(actor).map((i) => [i.id, i]));
  const brands = config.brands?.BRANDS ?? {};

  const slots = CLOTHING_SLOTS
    .filter((s) => reads.collected.parts[s]?.worn)
    .map((s) => {
      const p = reads.collected.parts[s];
      const item = p.id ? itemById.get(p.id) : null;
      const sd = item ? dualReadStyleData(item).styleData : null;
      return {
        label: humanize(s),
        name: p.name,
        img: p.img,
        brand: sd?.brand ? (brands[sd.brand]?.label ?? humanize(sd.brand)) : null,
        style: p.style ? formatStyleName(p.style) : null,
      };
    });

  const headline = composeHeadline({ vibes: reads.vibes, archetypes: reads.archetypes, heat: reads.heat });
  return postCard(TPL("lookbook"), {
    actorId: actor.id,
    actorName: actor.name,
    actorImg: actor.img,
    headline: headline.text,
    vibe: reads.vibes.descriptor || null,
    tier: `${reads.styleRating.tier?.name ?? ""} ${reads.styleRating.tier?.grade ?? ""}`.trim(),
    drip: reads.dripRating.rating,
    cohesion: reads.cohesion.label,
    slots,
    hasSlots: slots.length > 0,
  }, { actor, whisper: [] }); // [] = public — the whole table sees the fit
}

export function postStyleRead({ scanner, target, tier, roll, read, whisper }) {
  return postCard(TPL("style-read"), {
    scannerName: scanner?.name ?? "Someone",
    targetName: target.name,
    targetImg: target.img,
    tier,
    tierLabel: tier.toUpperCase(),
    roll,
    read,
    isNone: tier === "none",
    isFull: tier === "full",
  }, { actor: scanner, whisper });
}
