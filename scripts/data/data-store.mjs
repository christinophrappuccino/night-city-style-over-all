/**
 * data-store.mjs — settings-backed config store (facade).
 *
 * World settings are the SOURCE OF TRUTH (guide §3 D3, §5.4). Every config blob is
 * stored as an envelope `{ schema, data }` under its SETTINGS key. Callers use
 * get()/set() for the data and never touch game.settings directly.
 *
 * No CPR data paths are read here — that is cpr-adapter.mjs's job only.
 *
 * Spec: SC-Module-Architecture-Guide.md §4.2, §5.1, §5.3, §5.4
 */

import { MODULE_ID, SETTINGS } from "../constants.mjs";
import { CONFIGS } from "../config/index.mjs";

export const DataStore = {
  moduleId: MODULE_ID,

  /**
   * Register every module setting. Call once on `init`. Idempotent per session
   * (Foundry throws if a key is registered twice, so only call from the init hook).
   */
  registerSettings() {
    // Schema version — hidden, advanced by the migration runner.
    game.settings.register(MODULE_ID, SETTINGS.SCHEMA_VERSION, {
      scope: "world",
      config: false,
      type: Number,
      default: 0,
    });

    // Config blobs — hidden objects, defaulting to the verbatim seed envelope.
    for (const cfg of CONFIGS) {
      game.settings.register(MODULE_ID, cfg.key, {
        scope: "world",
        config: false,
        type: Object,
        default: { schema: cfg.schema, data: cfg.seed },
      });
    }

    // The Garden's rolling event-post store (§21.4) — runtime data, not config.
    game.settings.register(MODULE_ID, SETTINGS.GARDEN_FEED, {
      scope: "world",
      config: false,
      type: Object,
      default: { posts: [] },
    });

    // Tunables overlay — sparse GM overrides shadowing the defaults (§18). Empty
    // until the Config App's Tuning Panel writes to it.
    game.settings.register(MODULE_ID, SETTINGS.TUNABLES, {
      scope: "world",
      config: false,
      type: Object,
      default: { schema: 1, data: {} },
    });

    // User-facing toggles.
    game.settings.register(MODULE_ID, SETTINGS.ICON_RECOLOR_ENABLED, {
      name: "NCSOA.Settings.IconRecolor.Name",
      hint: "NCSOA.Settings.IconRecolor.Hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
    });
    game.settings.register(MODULE_ID, SETTINGS.LIVE_REFRESH, {
      name: "NCSOA.Settings.LiveRefresh.Name",
      hint: "NCSOA.Settings.LiveRefresh.Hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
    });
    game.settings.register(MODULE_ID, SETTINGS.CONDITION_DYNAMICS, {
      name: "NCSOA.Settings.ConditionDynamics.Name",
      hint: "NCSOA.Settings.ConditionDynamics.Hint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
    });
  },

  // ---- schema version -------------------------------------------------------

  getSchemaVersion() {
    return game.settings.get(MODULE_ID, SETTINGS.SCHEMA_VERSION);
  },

  async setSchemaVersion(v) {
    return game.settings.set(MODULE_ID, SETTINGS.SCHEMA_VERSION, v);
  },

  // ---- config envelopes -----------------------------------------------------

  /**
   * Raw envelope `{ schema, data }` for a config key. Returns the registered
   * default when never written.
   * @param {string} key SETTINGS.*
   */
  getEnvelope(key) {
    return game.settings.get(MODULE_ID, key);
  },

  /**
   * Persist a raw envelope for a config key.
   * @param {string} key SETTINGS.*
   * @param {{schema:number, data:*}} envelope
   */
  async setEnvelope(key, envelope) {
    return game.settings.set(MODULE_ID, key, envelope);
  },

  /**
   * The config DATA blob for a key (envelope unwrapped).
   * @param {string} key SETTINGS.*
   */
  get(key) {
    return this.getEnvelope(key)?.data;
  },

  /**
   * Write a config DATA blob, preserving (or setting) the envelope schema.
   * @param {string} key SETTINGS.*
   * @param {*} data
   * @param {number} [schema] override the stored schema stamp
   */
  async set(key, data, schema) {
    const current = this.getEnvelope(key);
    const nextSchema = schema ?? current?.schema ?? 1;
    return this.setEnvelope(key, { schema: nextSchema, data });
  },
};
