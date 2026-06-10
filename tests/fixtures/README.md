# Parity fixtures

Golden snapshots of `stylechecker2_0_Phase82.js` output, used as the M2 parity gate
(guide §29.8). The engine must reproduce these numbers for legacy (`sc.*`-only) actors.

## How they're produced

1. In Foundry, open your **Phase 82** macro and paste `tools/parity-capture.macro.js`
   at the very end (after `selector.render(true);`).
2. Select the test-actor tokens (or none → all player-owned actors) and run it.
3. It downloads `sc-parity-fixtures.json`. Move that file into **this folder**:
   `tests/fixtures/sc-parity-fixtures.json`

Regenerate whenever the test actors change. Do not hand-edit — they're a frozen baseline.
