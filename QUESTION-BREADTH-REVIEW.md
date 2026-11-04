# November 4 playability review

Release `20261104-broad-random-v1` retires **501 of the former 1,000 prompts** from ordinary play. **499 remain**, including all 98 Yes-voted original prompts. This implements the user's request for fewer specialist topics and fresh random games, superseding the earlier quantity target.

The review removes team-specific historical rosters, technical scientific subtopics, narrow plant/animal classifications, specialist brands, small franchise sub-rosters and similar specialist constraints. Broad games, sports, films, music, foods, everyday objects, nature, science and world knowledge remain. The explicit keep/remove list and per-question reasons live in `data-snapshots/reviewed-standard/broad-playability-review.json`; `admission.json` keeps retired factual evidence in `archivedQuestions`.

| Subject | Remaining |
| --- | ---: |
| Gaming | 69 |
| Sports | 41 |
| Culture | 67 |
| Music | 61 |
| Food | 62 |
| Nature | 41 |
| Science | 44 |
| World | 43 |
| Everyday | 71 |

Each subject represents 8.2–14.2% of the inventory. That balances the available pool; a particular random match does not impose subject quotas.

Every new Puffer lobby and rematch uses an unweighted Fisher–Yates shuffle of all 499 admitted questions. Google identity, past games, browser question history and other players' reported histories cannot remove or weight a prompt. The current match reveals each question at most once. Starting another match makes the full pool eligible again. Practice uses a fresh seven-question sample without retaining a future queue. The sample page now reproduces this same uniform selection rule.

Old `seenIds` client reports are ignored. The old per-account browser key is cleared at party sign-in. The room's compatibility field of that name contains only the actual current-match prefix, preserving host transfer without personalizing the next game. Ranks, W/L, achievements, sign-in and profile storage are unchanged.

Migration preserves a valid active question, player hearts and the revealed prefix. It refreshes only future turns. A retired active question advances with no heart penalty. A new selection build also prevents older incompatible rooms appearing in new-client quick play.

Daily remains a shared New York calendar with seven different subjects per date. All published assignments through November 4 are unchanged. November 5 onward draws from the curated pool. Its finite schedule currently ends December 20, 2026; it stops rather than silently cycling.

Retirement does not delete factual answer inventories, familiar aliases, wrong-answer boundaries or saved results. The admitted pool's production matcher checks 7,577 familiar exact inputs and 915 explicit wrong-answer boundaries. Historical source and answer tests continue to validate archived banks. These checks establish specific recorded memberships and gameplay behavior, not exhaustive coverage of every possible real-world answer.
