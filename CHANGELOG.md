# Changelog — Night City: Style Over All

## [Unreleased] — 0.1.0 (first public cut)

The full conversion of the play-tested Style Checker macro into a proper module, M0–M8.

### Engine & data
- Pure, explainable read engine (archetypes · heat · danger · disguise · district fit · crew · scene gates · perception tiers), parity-gated against the original macro (`npm test`, 200 checks).
- `styleData` item flags with **dual-read forever**: legacy `sc.*` Active-Effect items keep working; flags win when both exist. Migration 002 converts on demand (world / folder / actor scoped, dry-run first) and never changes a computed result.
- All formula constants in GM-tunable settings; world settings are the source of truth with versioned, auto-backed-up migrations.

### Apps
- **Style Checker** (5 tabs) incl. **The Garden** — Ziggurat's social network: profile, follower count driven by heat + reputation + style, reactive feed, trends, sponsored ads.
- **Wardrobe** — slot grid · live engine preview · closet; stage→preview→apply; outfit presets; GM quick-dress templates; uniforms (recognition + disguise hooks); tailor flow (recolor / fit / modifications / distress / counterfeit).
- **GM Dashboard** (5 tabs) — party/scene readouts, scene gates with **live gate runs** (whispered verdict cards + player pings), disguise detector with gear/uniform injections, faction tensions.
- **Shops** — GM-authored vendors selling real items (query + hand-picked stock), CPR wealth-ledger purchases, fashion-trend pricing.
- **Item Style Tab** — dropdown authoring of the full styleData schema with a live cascade preview and one-click `sc.*` conversion.

### Live layer
- Live refresh of open windows on equip changes; scene district/gate tags with auto-arm; token-HUD **Scan Style** (perception-gated tiered reads); combat dirties gear; "Known For" street reputation.

### Content
- **Night City Catalog** compendium: an original starter wardrobe across three house brands (Ofuda · Brass Lotus · Rustwerk), every piece pre-flagged with styleData.
