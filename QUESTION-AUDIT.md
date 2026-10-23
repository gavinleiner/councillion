# Question and Puffer review · 23 October 2026

The library exposes **3,188 reviewed categories**; **3,113** enter Daily/Practice and **3,104** enter Puffer, including **213 sports categories**. Their banks contain 5,228,184 and 5,227,944 canonical answer/category entries, excluding aliases. These overlap across categories; they are not counts of unique concepts. Narrow country/state city filters and old unreliable cast/semantic banks remain archived.

This is a reduction from the previous inflated random pool, not a claim of infinite new questions. Puffer excludes the room's revealed questions and the players' reported browser history across rematches. Exhaustion stops the deck instead of recycling it. Practice remains intentionally replayable after its queue is exhausted. History is scoped to an account in this browser, not synced across devices.

## What was checked and repaired

`question-audit-report.json` records a structural scan of **1,454,079 canonical rows and 1,098,924 aliases** across every shipped bank, including historical data. It found no duplicate normalized canonical rows, colliding aliases, empty keys, invalid scores, incorrect bank counts or manifest hash failures. Structural checks do not certify every factual relationship in those source inventories. The separate editorial policy determines which categories are admitted to play.

- Terraria was refreshed from the [Official Terraria Wiki Items table](https://terraria.wiki.gg/wiki/Special:CargoTables/Items), with aliases from [tModLoader ItemID](https://docs.tmodloader.net/docs/stable/class_item_i_d.html). All **6,110** normalized actual item names in the retained wiki snapshot have exact support. Blank-ID armor groupings are excluded; older/unused vanilla item names remain valid under the explicit “any version” prompt. Zenith, Terraprisma, Shellphone and Rod of Harmony now work. Copper Shortsword is worth 10 rather than an accidental 100.
- All **2,121** normalized names in the retained [Minecraft data](https://github.com/PrismarineJS/minecraft-data) and **7,687** source name keys in the selected [Fortnite cosmetic inventory](https://dash.fortnite-api.com/endpoints/cosmetics) have exact support. Fortnite's punctuation-only `!` emote has an explicit literal alias to “Exclamation Mark”; it is not silently discarded by text normalization. Coverage is against these retained finite snapshots, not every later update.
- Generic voice-credit headings and composite credit artifacts were removed from the broad character banks. Familiar missing names and conventional aliases were added, including Princess Daisy, Luna Lovegood, Superman, Deadpool, Hagrid and Doctor Watson. Tails is one canonical identity with aliases. Franchise-specific cast-derived questions are archived rather than presented as trustworthy membership lists.
- Broad parent banks inherit reviewed child additions. Sea life now explicitly accepts aquatic and semi-aquatic animals, including freshwater creatures; Axolotl, Manatee and Dugong are supported. The plant bank gains familiar plant names while excluding fungi. A mushroom still works in food/fungus categories, not the botanical plant category.
- Common title/item omissions were repaired for games, films, languages, food and materials. The source generators' familiarity overrides were checked against actual bank membership, catching names that had a score override but were absent from the bank itself.
- All 80 four-choice questions were checked for unique choices and source links, and compared with the 16 published [Future Counsel reviews](https://futurecounsel.org/). The Mahanoy overstatement question had later distractor overrides that made multiple choices defensible. It now has one overstatement and three supported, limited conclusions. The existing five-correct streak and requested shortcut remain intact.

The two user-supplied banks keep their canonical labels and points. Scores remain an editorial familiarity model, not measured answer frequencies or access to Krillion's private grading. Correction proposals still appear only after submitting, require another submission to confirm, and keep the original score. The `locals coffee` / `black coffee` regression remains rejected.

## Shared Daily revision

The intentionally reviewed calendar replaces retired prompts beginning **2026-10-23**, consistently for every account. Earlier dates retain their original draw. Saved Daily runs must match the published seven IDs in the same order; mismatched runs are discarded rather than giving returning players a different set.

The calendar now contains **444 complete nonrepeating Daily dives through 2028-01-09**. The previously published 257-ID prefix is unchanged. Every account receives the same seven prompts in the same order, and the calendar stops rather than wrapping.

## Puffer changes

- The bot session module and entry point are removed. Old `#party?test=bots` links lead to normal Google-required Puffer setup. The bot arena was browser-local; it created no Firebase test room or ranked records.
- Seats retain connected roster order around the arena. A randomly drawn first player starts; accepted answers then move clockwise, skipping eliminated or disconnected players. The existing first-player draw animation remains.
- One persistent, compact bubble shows only the current answerer's typing. Preparation stays local before their turn. Old game/category/turn drafts, expired drafts and non-holder drafts are hidden. Edits and deletion interpolate in at most 160 ms and settle promptly after a paste. There is no LIVE label.
- Accepted-answer cards search open space when their immediate anchors would cover a nearby name. Long text wraps and can be scrolled. The question, controls and player names are treated as obstacles.
- The approved arena art, anchored rocks and character models are retained. Warm low-opacity sand grains sway less than two screen pixels over slow cycles. The ambient canvas remains capped at 20 fps and stops for reduced motion, hidden tabs and view disposal.

## Validation and reproducibility

Run `npm test`, `npm run build`, `node scripts/audit-questions.mjs` and `npm run test:security` (Java 21). The review adds tests for policy admission, retired saved queues/rooms, no-heart question replacement, clockwise passing, private draft publication, stale draft visibility, interpolation/cleanup, exact inventory coverage and corrected answers. Local Playwright checks cover 1366×768, 1024×600, 502×596 and 390×844, plus reduced motion and the canvas frame cap. Tests use disposable local browser/emulator accounts.

`scripts/repair-question-banks.py` reapplies deterministic editorial repairs after the retained source generators. `data-snapshots/quality/` stores the wiki names/IDs, tModLoader identifiers, editorial additions, original manifest hashes, the initial repair ledger and the final before/after manifest ledger. No game artwork, source prose or private user data is imported by this data repair. The official wiki identifies its text under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/); attribution is retained here and in `DATA-SOURCES.md`. Only factual names and identifiers are used.

These are finite source-backed banks. Exact snapshot coverage and a clean integrity scan are inspectable evidence; they do not establish that every conceivable real-world answer is present or every open-ended classification is perfect. Players can report/vote past a problematic category without losing a heart.

## Discovery expansion validation

2,851 new source-gated prompts supplement the reviewed pool without re-enabling the archived geographical, cast-credit or ambiguous lexical banks. See `discovery-manifest.json`, `question-counts.csv`, `data-snapshots/discovery/sources.json` and the player-facing `question-sources.html` for counts and source boundaries. Editorial/source gates and structural validation are not represented as a manual factual review of every relationship.

New checks cover every discovery bank's compressed integrity, unique canonical identities, metadata count and admission threshold; exact familiar sports/film/TV/console answers; finite Daily-calendar uniqueness and the unchanged published prefix; and exclusions across a 500-question Puffer history. Sports are a separate selection family, and all four seeded test decks include sports in their first 14 prompts. A cold library remains metadata only. Real local-browser gameplay accepts a quarterback answer, and the established responsive arena tests cover four laptop/mobile viewports, long answers, holder-only draft edits, clockwise passing, the 20 fps cap, reduced motion and cleanup. The existing Google-only multiplayer/authentication emulator checks also pass with the expanded catalog.
