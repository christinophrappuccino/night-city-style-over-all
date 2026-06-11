/**
 * tailor-dialog.mjs — the Tailor (M6.7, guide §15.1): customize a garment.
 *
 * One dialog, launched from the Wardrobe (scissors on a slot/closet row) or the
 * Item Style Tab. Recolor · retailor (fit) · add modifications · distress ·
 * counterfeit-brand. Applies as either an edit to THIS item or a duplicated
 * "(modified)" copy — the copy path is GM-only (players don't mint free clothes).
 *
 * The transform itself is services/tailor.mjs (pure); writes go through the
 * shared deletion-marker-safe updateStyleData.
 *
 * Spec: SC-Module-Architecture-Guide.md §15.1, §13.4, §5.2.
 */

import { FITS, CONDITIONS } from "../constants.mjs";
import { getStyleData, updateStyleData } from "../data/flags.mjs";
import { dualReadStyleData } from "../data/sc-keys.mjs";
import { applyTailorOps, modificationChoices } from "../services/tailor.mjs";
import { humanize } from "../config/style-tab-schema.mjs";
import { NCSOA_DIALOG } from "./components/register.mjs";

/**
 * Open the Tailor for an item. Resolves true when something was applied.
 * @param {object} item   a CPR clothing/gear item document
 * @param {object} [opts]
 * @param {() => void} [opts.onApplied]  re-render callback for the launching app
 */
export async function openTailorDialog(item, { onApplied } = {}) {
  if (!item?.isOwner) {
    ui.notifications?.warn("You don't own that garment.");
    return false;
  }
  const isGM = !!game.user?.isGM;
  const current = dualReadStyleData(item).styleData ?? {};
  const existingMods = new Set(current.modifications ?? []);

  const fitOpts = ['<option value="">— keep —</option>',
    ...FITS.map((f) => `<option value="${f}" ${current.fit === f ? "selected" : ""}>${humanize(f)}</option>`)].join("");
  const condOpts = ['<option value="">— keep —</option>',
    ...CONDITIONS.map((c) => `<option value="${c}" ${current.condition === c ? "selected" : ""}>${humanize(c)}</option>`)].join("");
  const modRows = modificationChoices().map(({ key, label, mechanics }) => {
    const has = existingMods.has(key);
    return `<label class="ncsoa-tailor-mod ${has ? "owned" : ""}" title="${mechanics}">
      <input type="checkbox" name="t-mod" value="${key}" ${has ? "checked disabled" : ""}/> ${label}${has ? " ✓" : ""}
    </label>`;
  }).join("");

  const content =
    `<div class="ncsoa-tailor">` +
    `<p class="ncsoa-tailor-head"><strong>${item.name}</strong> — every change writes style data and feeds the reads automatically.</p>` +
    `<p style="display:flex;gap:8px;align-items:end;">` +
    `<span style="flex:1"><label>Primary color</label><input type="color" name="t-c1" value="${current.colors?.primary ?? "#222222"}" style="width:100%"/></span>` +
    `<span style="flex:1"><label>Accent color</label><input type="color" name="t-c2" value="${current.colors?.accent ?? "#00d9ff"}" style="width:100%"/></span>` +
    `<label style="white-space:nowrap"><input type="checkbox" name="t-recolor"/> apply recolor</label></p>` +
    `<p style="display:flex;gap:8px;"><span style="flex:1"><label>Fit (retailor)</label><select name="t-fit" style="width:100%">${fitOpts}</select></span>` +
    `<span style="flex:1"><label>Condition</label><select name="t-cond" style="width:100%">${condOpts}</select></span></p>` +
    `<p><label>Modifications</label><br/>${modRows}</p>` +
    `<p><label>Counterfeit brand stamp (§13.4)</label><input type="text" name="t-fake" placeholder="brand key — leave empty for none" style="width:100%"/></p>` +
    (isGM
      ? `<p><label><input type="radio" name="t-mode" value="edit" checked/> Modify this item</label><br/>` +
        `<label><input type="radio" name="t-mode" value="copy"/> Create a "(modified)" copy, keep the original</label></p>`
      : "") +
    `</div>`;

  const form = await Dialog.prompt({
    options: NCSOA_DIALOG,
    title: `Tailor — ${item.name}`,
    content,
    label: "Apply work",
    rejectClose: false,
    callback: (html) => ({
      colors: html.find("[name='t-recolor']").is(":checked")
        ? { primary: html.find("[name='t-c1']").val(), accent: html.find("[name='t-c2']").val() }
        : null,
      fit: html.find("[name='t-fit']").val() || null,
      condition: html.find("[name='t-cond']").val() || null,
      addModifications: html.find("[name='t-mod']:checked:not(:disabled)").map((_, el) => el.value).get(),
      counterfeitBrand: html.find("[name='t-fake']").val()?.trim() || null,
      mode: html.find("[name='t-mode']:checked").val() || "edit",
    }),
  });
  if (!form) return false;

  const { styleData, changes } = applyTailorOps(current, {
    colors: form.colors ?? undefined,
    fit: form.fit ?? undefined,
    condition: form.condition ?? undefined,
    addModifications: form.addModifications,
    counterfeitBrand: form.counterfeitBrand ?? undefined,
  });
  if (!changes.length) {
    ui.notifications?.info("No alterations chosen — the garment leaves the shop untouched.");
    return false;
  }

  if (form.mode === "copy" && isGM) {
    const data = item.toObject();
    delete data._id;
    data.name = `${item.name} (modified)`;
    const created = item.parent
      ? await item.parent.createEmbeddedDocuments("Item", [data])
      : await Item.createDocuments([data]);
    const copy = created[0];
    await updateStyleData(copy, styleData);
    ui.notifications?.info(`Tailored a copy: ${copy.name} — ${changes.join(", ")}.`);
  } else {
    await updateStyleData(item, styleData);
    ui.notifications?.info(`${item.name} tailored — ${changes.join(", ")}.`);
  }
  onApplied?.();
  return true;
}
