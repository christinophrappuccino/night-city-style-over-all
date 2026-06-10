/**
 * style-templates.mjs — seed for the GM quick-dress template registry (§14.5, M6.4).
 *
 * A template is a world-level, GM-authored outfit any NPC can be dressed in with
 * one click. Items are referenced by UUID (world / compendium / embedded source);
 * applying a template IMPORTS unowned pieces onto the target and equips the look.
 *
 *   { id, name, note, items: [{ uuid, slot, name, img }] }
 *
 * Ships empty — templates are authored at the table (Wardrobe → "Save as template",
 * GM only). Compendium-portable refs arrive with the catalog packs (M8).
 */

export default {
  templates: [],
};
