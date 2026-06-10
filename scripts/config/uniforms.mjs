/**
 * uniforms.mjs — seed for the crew/faction uniform registry (§21.2, M6.5).
 *
 * A uniform defines a group's look and is BOTH of:
 *   · hard — exact pieces (item refs, same entry shape as quick-dress templates):
 *     powers "wear the uniform" / NPC dressing via the §14.5 machinery;
 *   · soft — a signature any matching gear satisfies: style lean + visible chrome
 *     + authored faction-gear keys. Drives RECOGNITION — a character whose look
 *     matches reads as the group, even in improvised gear (engine/uniforms.mjs).
 *
 *   {
 *     id, name, note,
 *     group: { type: "faction"|"crew", key },          // who this look belongs to
 *     hard:  { items: [{ uuid, slot, name, img }] },   // optional
 *     soft:  {                                         // optional
 *       styles: { <styleKey>: weight 0–1 },            // expected style lean
 *       chrome: [<chromeCat>],                         // expected visible categories
 *       factionGear: [<factionKey>],                   // authored gear signals that count
 *       minPieces: n,                                  // clothing threshold for a real match
 *     },
 *   }
 *
 * Ships empty — uniforms are authored at the table by example (Wardrobe → GM →
 * "Save as uniform" derives the soft signature from the staged look). Color and
 * brand signature axes join in M9 (§9.2, §13).
 */

export default {
  uniforms: [],
};
