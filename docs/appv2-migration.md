# AppV2 Migration Path (M9.4d, guide D2)

**Status: DOCUMENTED, deliberately not yet executed.** The guide's D2 escape
hatch applies: *"Where AppV2 migration is low-risk, do it; otherwise document
the path."* As of M9.4, the M9.2→M9.4 surfaces (charts, headline/lens,
overrides, lookbook, matrix editor, presets panel, recolor) have **not yet had
their in-world verification sweep**. Migrating all five window classes on top
of that would confound every sweep finding between "the feature was wrong" and
"the V2 port broke it." **Sequence: sweep first → then migrate, one app per
session, verifying in-world after each.**

There is no deprecation pressure: the module targets V12
(`compatibility.verified = "12"`), V1 `Application` survives through V13+
(removal is announced for much later), and `cyberpunk-red-core`'s own sheets
are V1. The engine/UI split (the Engine Rule) means this migration touches
`apps/` only — by design.

## Inventory

| App | Class | Lines | Special features the port must preserve |
|---|---|---|---|
| `shop-app.mjs` | `Application` | 378 | view toggle (shops/brands §13), wealth ledger buys, trends strip |
| `gm-dashboard-app.mjs` | `Application` | 316 | 5 tabs, scene polling, overrides editor (§14.3), socket pushes |
| `style-checker-app.mjs` | `Application` | 378 | 5 tabs, lens bar + observer select (§24), `this._results` + `bindInfoAffordances` (§19.4), `openForActor` |
| `gm-config-app.mjs` | `FormApplication` | 396 | **`registerMenu` target**, manual save flow (no submit pipeline), DOM-filter searches that must keep input focus, preset bar (M9.4a) |
| `wardrobe-app.mjs` | `Application` | 660 | staging state (preview ≡ commit), `_applyRecoloredIcons` post-render patch (§9.1), wearMode toggles, as-target-sees-it panel |

Also in scope eventually: `tailor-dialog.mjs` + every `Dialog` spawn
(→ `DialogV2`; the `NCSOA_DIALOG` options object is the single seam), and
`item-style-tab.mjs` (NOT ours to V2 — it injects into CPR's V1 item sheet via
`renderItemSheet`; it moves only when CPR's sheets do, per guide §8.2 note).

## Target shape (per app)

```js
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class WardrobeAppV2 extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ncsoa-wardrobe-{id}",
    classes: ["ncsoa", "ncsoa-wardrobe"],
    window: { title: "…", resizable: true },
    position: { width: 980, height: 720 },
    actions: { /* every data-action maps here — see below */ },
  };
  static PARTS = { body: { template: "modules/…/templates/wardrobe.hbs" } };
  async _prepareContext(options) { /* = getData() */ }
  _onRender(context, options) { /* = the non-listener parts of activateListeners */ }
}
```

### Mechanical mapping

| V1 | V2 |
|---|---|
| `static get defaultOptions` + `mergeObject` | `static DEFAULT_OPTIONS` (declarative merge up the chain) |
| `template` option | `static PARTS` (HandlebarsApplicationMixin) |
| `getData()` | `async _prepareContext(options)` |
| `activateListeners(html)` (jQuery) | `actions:{}` for clicks; `_onRender(context, options)` for change/input bindings (NATIVE `this.element`, no jQuery) |
| `html.find("[data-action='x']").on("click", …)` | `actions: { x: WardrobeAppV2.#onX }` — the action receives `(event, target)`; `data-action="x"` in templates is ALREADY the V2 convention (no template changes needed for clicks) |
| `this.render(false)` | `this.render()` (V2 ignores the force flag distinction for re-render) |
| `title` getter | `window.title` option / `get title` still works |
| `closeOnSubmit`/`submitOnChange` (GMConfig) | gone — our save flow is already manual, port as actions |

### The fiddly bits (why this is one-app-per-session work)

1. **jQuery → native.** Every `html.find(...)` becomes
   `this.element.querySelector(All)`. The DOM-filter searches (GM Config matrix
   + knob filter) and `bindInfoAffordances(html, …)` take jQuery objects today —
   `bindInfoAffordances` should be taught to accept either (one shared shim),
   NOT forked per app.
2. **Change/input listeners** (selects, search inputs, checkboxes) are not
   `actions` — they bind in `_onRender`. Re-render replaces DOM, so bindings
   re-attach naturally, but the focus-preserving searches must keep their
   "filter without re-render" pattern.
3. **`registerMenu`** (GM Config): V12 accepts an ApplicationV2 subclass as a
   menu `type` only on later 12.x builds — **verify on the table's actual
   Foundry build first**; if it complains, keep a thin V1 `FormApplication`
   shell that opens the V2 app and migrate the shell in V13.
4. **`render(false)` semantics.** V1 `render(false)` re-renders an open window;
   V2 `render()` does. All our `this.render(false)` calls translate 1:1, but
   each app has ~10 of them — mechanical, easy to miss one.
5. **Post-render patches** (`_applyRecoloredIcons`, `bindInfoAffordances`,
   matrix search re-apply) move into `_onRender` — V2 calls it on every render,
   same timing as `activateListeners`.
6. **Window chrome CSS.** `.ncsoa.window-app` selectors in base.css target V1
   window markup. V2 windows use `.application` + different header classes —
   the shell skin (neon frame, gradient header, scrollbars) needs a parallel
   selector block: `.ncsoa.application`, `.ncsoa .window-header` (same class,
   verify), close-button markup differs. Budget a CSS pass per app.
7. **Dialogs**: migrate `Dialog` → `foundry.applications.api.DialogV2`
   separately and LAST; `NCSOA_DIALOG` is the one seam (register.mjs), but
   DialogV2's `classes` and button API differ — one focused session.

### Recommended order (simplest → hairiest, verify in-world after each)

1. **ShopApp** — no tabs, no form, proves the pattern + the V2 window-skin CSS.
2. **StyleCheckerApp** — tabs + info affordances (the shared-shim work lands here).
3. **GMDashboardApp** — reuses the tab pattern; overrides editor is change-listener-heavy.
4. **WardrobeApp** — biggest; staging must stay byte-identical (preview ≡ commit gate covers the logic, but the listener wiring is dense).
5. **GMConfigApp** — last, because of the `registerMenu` question.
6. **Dialogs → DialogV2** as a final focused pass.

### Invariants that must survive the port (from CLAUDE.md)

- Engine/data layers untouched — this is an `apps/`-only migration (§4.1).
- `data-action` attributes in templates are already V2-shaped — don't rename.
- `NCSOA_DIALOG` stays the single dialog-options seam.
- The M9.2 chart partials + `this._results`/`bindInfoAffordances` contract.
- Wardrobe staging: preview ≡ commit (gate-enforced).
- The `.ncsoa` class must land on the V2 root element (token scope + skin).
