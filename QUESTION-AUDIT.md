# Question review · October 23, 2026

Release `20261023-group5000-v1` has **5,000 ordinary categories** in Puffer, Daily and Practice shuffle, with **3,853,849 canonical answer/category entries**. The median category has **123** answers; the range is **24–357,157**. Entries overlap between different questions and are not counts of distinct real-world concepts. Aliases are excluded from these counts.

All **98 approved tryout prompts** are playable. The two rejected prompts are excluded. Steam has **177 single-tag** prompts and **66 familiar two-tag** alternatives. Categories are derived from recorded source predicates and the approved styles; they are not 5,000 individually hand-written or user-rated questions. See [GROUP-POOL.md](GROUP-POOL.md) for selection methods and limitations, [group-question-list.csv](group-question-list.csv) for every selected count, and [group-bank-manifest.json](group-bank-manifest.json) for hashes, predicates and rarity distributions. [question-counts.csv](question-counts.csv) also lists retained optional/archive inventories with eligibility flags.

## Integrity and factual boundaries

[question-audit-report.json](question-audit-report.json) records the full structural scan, including archived data: canonical uniqueness, unambiguous aliases, score values, bank counts and compressed-content hashes. Exact coverage checks separately compare the retained Minecraft, Terraria and Fortnite inventories. Fortnite's actual one-letter `V` and punctuation-only `!` retain support; `!` uses an explicit literal alias. Distinct bank files sharing a historical category ID cannot reuse one another's hydrated cache entries.

The approved athlete bank includes all **7,922 skaters** and **903 goalies** returned by the official NHL all-career regular-season indexes, plus other retained professional sports sources and curated additions. Both returned totals are checked. Elden Ring includes base-game and Shadow of the Erdtree bosses, with explicit familiar short names. Tests distinguish physical robots from software-only AI, venom from poison, flying from gliding, islands from countries, completed Olympic hosts from future hosts, and natural Solar System bodies from spacecraft. Explicit synonyms share an answer identity; no random initialisms are generated.

These checks establish finite snapshot coverage and structural consistency. They do not establish every conceivable answer or certify every open-ended source classification. Curated supplements can still require correction, and source inventories can omit new releases or metadata memberships. Every generated bank retains its unfamiliar tail rather than a popularity-only top list. Scores remain editorial familiarity estimates, not measured player frequencies or access to Krillion's private grading. Retained core banks preserve their prior scores; entirely familiar inventories do not invent a rare 100-point answer.

## Selection, Daily and multiplayer

Puffer and Practice shuffle the full eligible pool, without a fixed starting prefix or forced family cycle. Puffer excludes participants' recorded browser/account history across new rooms and rematches. Equivalent retained answer sets share an identity. Changing devices or clearing site data can reset that history; it is not a global cross-device lifetime guarantee.

Daily is the same seven ordered IDs for every player. October 23's published draw remains fixed; the group-selected calendar begins October 24. Historical draws retain their original category references. The dated calendar contains **714 complete dives through October 5, 2028**, then stops rather than recycling. Practice remains replayable after its queue is exhausted.

Gameplay, rank math, characters, arena art, account permissions and submit-then-confirm spelling behavior are unchanged. The `locals coffee` / `black coffee` regression remains rejected. Only the current Puffer holder's typing is broadcast, turns proceed clockwise from a random starter, and no public bot lobby is enabled.

## Verification

Run `npm test`, `npm run build`, `node scripts/audit-questions.mjs` and `npm run test:security` with Java 21. The new group tests check the exact 5,000 count, all 98 previews as exact answers, exclusion of rejected IDs, single/two-tag membership, all NHL source names, hashes and alias ownership across all new banks, question boundaries, shuffle order, shared unrepeated Daily dates and bank-revision cache isolation.

Local Playwright checks use a 1366×768 laptop viewport, open the library without fetching answer banks, play an Elden Ring and a Steam Horror question, and check for horizontal overflow and uncaught errors. Separate Firebase emulator clients exercise Ranked rooms, countdowns, passing, duplicate rejection, fresh-category voting, spectators, chat, visibility, results, rematches, host migration and question history. Disposable local Google-provider accounts test session restoration and protected role/badge grants; no real player accounts or ranked records are modified by these tests.
