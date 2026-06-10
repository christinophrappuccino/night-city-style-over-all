/**
 * garden.mjs — seed for The Garden's content config (§21.4, M7.10).
 *
 * GM-editable flavor: the fake targeted ads scrolled past in the feed, and the
 * event-post templates the live layer fills in ({name}/{gate}/{trend} tokens).
 * All copy here is ORIGINAL (brand keys reference the same in-world names the
 * factions seed already ships; no sourcebook text — guide §30.3).
 */

export default {
  /** Targeted ads (§21.4 "cheap flavor that sells the lore"). */
  ads: [
    { sponsor: "Continental Brands", text: "You weren't born lucky. Dress like you were. New drops Friday.", tag: "style" },
    { sponsor: "Ziggurat", text: "Your feed, your face, your city. The Garden Premium — zero targeted ads.*  (*some targeted ads)", tag: "meta" },
    { sponsor: "Doc Mletva's Chrome Bar", text: "Walk-ins welcome. Fashionware fitted while you wait. Ask about the glow package.", tag: "chrome" },
    { sponsor: "Kabuki Night Market", text: "Yesterday's couture, tonight's prices. If it's been worn, it's been LIVED.", tag: "style" },
    { sponsor: "SafeHaus Insurance", text: "Bloodstains out by morning — or the replacement jacket's on us. Terms apply.", tag: "condition" },
    { sponsor: "The Wire", text: "Trends move fast. Move faster. Push alerts for your district — free this month.", tag: "trends" },
  ],

  /** Event-post templates (live layer → feed). Tokens: {name} {gate} {trend}. */
  events: {
    gateGreen: { text: "Spotted {name} walking straight past the line at {gate}. The fit said everything.", platform: "streetview", usernamePool: "gonks" },
    gateRed: { text: "{name} just got bounced at {gate}. The doorman didn't even blink. Brutal.", platform: "streetview", usernamePool: "gonks" },
    trendOn: { text: "Calling it now: {trend} is THE look. You heard it here first.", platform: "screamsheet", usernamePool: "media" },
    trendOff: { text: "If you're still doing {trend}, take it off before someone films you.", platform: "screamsheet", usernamePool: "media" },
  },
};
