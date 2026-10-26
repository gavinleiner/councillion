# Five-thousand-question expansion: development checkpoint

The requested release is unfinished. The production website still has 227 admitted questions. The development branch now has 262, including 35 newly reviewed inventories. Drafts, answer rows, source entities, archived recipes and reworded prompts do not count toward 5,000.

## Review standard

The preserved 100-question user review has 98 Yes votes and 2 No votes. Recognizable subjects with common entry answers and rare valid tails are the model. Two-label Steam joins, title-word slices, arbitrary demographic/geographic subcategories and artificial league unions cannot fill the target. Single Steam labels remain a deliberately small part of the pool.

A source classification is evidence, not automatic admission. Each normal-play ID must have an explicit admission record and separately supplied familiar-answer and wrong-answer cases. The same canonical question must be available to Puffer and Daily; the daily date schedule remains shared for everyone.

## Verified development admission

A complete 881-driver Formula One roster reconciles all nine source pages, including current public names and independently supplied familiar inputs. Six everyday inventories were admitted only after a second common-guess sweep repaired missing tools, product names and real aliases. Six Minecraft mechanics use pinned released-game recipes, recursive tags, components and loot tables. This covers every member of the stated game-data rule, rather than a short remembered list. Official character rosters cover Dota 2, Overwatch, Smash Ultimate and Legendary/Mythical Pokemon species. Nintendo alternate costumes share answer identity while actual separately playable fighters remain distinct. NASA supplies all 88 official constellation names. Official NBA award history supplies regular-season MVPs. A second, game-grain NFL inventory reconciles all 60 Super Bowls to 36 distinct winning starting quarterbacks; Bart Starr was caught and repaired during that reconciliation.

There are 74 authored inventories in development, of which 35 are admitted. Canonical answer rows are answers, not questions. The other 39 inventories remain unavailable in normal play.

## Drafts that still need work

- The Harry Potter source includes supplementary wandlore names beyond the current novels/films scope. Resolve eligibility before admission; do not broaden the scope while omitting obvious Fantastic Beasts characters.
- Broad Wikidata inventories must be reconciled against independently written common guesses. Missing classifications do not invalidate an obvious answer. For example, some familiar music duos and DJs have generic group/musician types rather than the narrow query type.
- Food source lists include adjacent categories and flattened labels. The food-source-holds ledger records unresolved entries. Baking, fermentation and named sushi/pizza inventories need eligibility and synonym review before admission.
- Manual science, nature, sports and object inventories remain drafts until their scope, common omissions and synonym identities are reviewed.
- Large worldwide site inventories must pass local loading, memory and typing-performance checks before admission; full data coverage cannot make the playing screen freeze.
- The next-100 proposal TSV is a writing/research backlog, not 100 complete playable questions.

## Remaining release work

Reach at least 5,000 individually admitted, semantically distinct questions. Keep every subject between 8% and 15% of the completed inventory; no source or franchise may dominate through generated slices. Practice pool migration now stores prior pool IDs and inserts genuinely new IDs without resurrecting played or retired questions, including when only content changes and the selection algorithm version stays the same. Verify that browser persistence path before publication. Preserve already-played daily dates while deliberately building future shared schedules from the expanded pool. Verify source inventories, hashes, alias identities, matching boundaries, distribution, local browser performance, and the deployed public build. Publish and email only after the promised completed release is genuinely ready.

`npm run check:5000` deliberately fails until the actual admitted normal-play pool meets the target and balance rules. Passing the volume check is necessary but is not a substitute for factual and browser QA.

## Verified checkpoint before continuing expansion

Production remains at 227 questions: nothing in this branch has been pushed, merged, deployed or emailed as finished. Development has 262 normal-play questions, including 35 newly admitted authored inventories, with 39 additional authored inventories still ineligible for normal play. The 5,000-question release gate deliberately fails.

Verification: production build passed; full unit suite passed 239 tests; latest targeted content and migration checks passed after the final alias/rating repairs. Local isolated Playwright tests passed at 1366×768 and 390×844, using local HTTP only and blocking external connections. They exercised legacy saved queues with an unchanged algorithm version, storage persistence across browser tabs, actual Zhou Guanyu grading (+30), the 100-question sample, library counts, and identical Daily IDs in two independent browser contexts. The browser report is in `work/five-thousand/browser/report.json` in the parent workspace; it is development evidence, not a publication receipt.

## Culture and music continuation

Seven new whole-subject culture inventories are admitted in development: fictional detectives, pirates, princesses, named vehicles, schools, heist films and time-travel/loop films. Typed film classification excludes 19 non-film records. Independently supplied common names repair classification gaps; the corrupted Hogwarts source label is removed, and real synonyms share an identity. The batch retains every factual title from the parsed heist and time-travel source tables, without copying prose. One music-duo inventory is admitted after 90 common-name probes, a broader-group lookup, publisher checks, and reconciliation of the earlier Simon/Garfunkel and DOMi/JD Beck identities. These are eight questions, not thousands of new questions.

The frozen sample was regenerated from all 255 admitted IDs using the same `20261025-reviewed-standard` seed. The first full test run exposed a stale 247-ID sample manifest; that manifest was rebuilt and the sample/content checks passed. Local browser checks passed again with the 255-question development pool, including saved-queue migration, tab reopening, actual answer grading, a shared seven-question Daily and laptop/mobile rendering. Nothing has been published or emailed as complete.

A new 37-subject writing/research backlog is in `work/five-thousand/next-whole-concepts.tsv` in the parent workspace. It does not count as finished questions. The QLever endpoint returned HTTP 429 during root lookup; requests to it stopped. Continue with cached factual tables and independently sourced primary-publisher inventories rather than retrying or replaying the denied query through another endpoint. Existing cached flatbread, stew, cloud, space-probe and other whole-concept facts still require scope and common-answer review; raw source rows are not automatically accepted answers.

The corrected full test rerun passed all 235 tests. The previous stale-sample failure is resolved without weakening its exact-pool assertion.

## Animal and sports continuation

Four animal questions are admitted from full publisher taxonomies: owls (248 species), parrots (410), penguins (19) and bats (1,514). Every source common/scientific name is tested through the actual matcher; scientific names currently accepted by MDD take priority over legacy synonyms. The MDD v2.5 CSV reconciles 6,904 unique species IDs and matches the published archive checksum. Current/recently extinct scope does not pretend to be a complete prehistoric-fossil catalog. Traditional common names and named groups are supported without species-code abbreviations or colour-morph padding.

Two sports questions are admitted after 81 independent common-name checks: combat sports/martial arts and ice/snow sports. Kenpo, Jiu-jitsu, ordinary ice-skating names and real martial-art school names were repaired. Downhill is separated from the broader Alpine family; Nordic skiing is separated from cross-country. Actual governing-body sources confirm Qwan Ki Do, ski archery and Yukigassen. Snowball fight correctly shares Yukigassen's identity but earns 30, rather than farming a 100-point foreign-name spelling. The other motorsport/bodyweight candidates still need better scope/common-input coverage.

Development is now 261 admitted questions (34 added to the original 227), with 39 more authored candidates excluded. There are 73 authored inventories total. The 5,000-question target remains unfinished: 4,739 additional distinct admitted questions are required. Do not count the 715,614 answer rows or the source metadata as questions. All 238 unit tests passed; after readable format-label updates, the content/sample/migration checks were rerun. Local browser cases passed actual grading for budgie, fairy penguin, bumblebee bat, snowball fight and Jiu-jitsu.

Next whole-list research is cached in `work/five-thousand/whole-concept-pages/` and `parsed-whole-list-names.json` in the parent workspace. Cheese needs the linked national/type cheese lists because the global page deliberately omits many major French/Italian names; these source pages still feed one global cheese question, not a question per country. Browser/OS/knot extraction retains some notes that need cleaning. Pancake root-word/alias cases need scope review. Rock names have 30 independent common probes present. WMO cloud-classification pages, a whole-list challenge file and older cached source tables are available for further source-backed work. None of those raw lists is an admitted question.

## Rock inventory and review branch

The development pool is now 262 questions: the original 227 plus 35 new admissions. There are 74 authored inventories, of which 35 are admitted and 39 remain candidates. The release target still needs 4,738 genuinely different admitted questions. Build and all 239 unit tests pass. The rock question adds 193 real answer identities, including the elementary igneous/sedimentary/metamorphic families; all 41 common-input cases pass. Real synonyms share identity and uncertain source rows remain held. The sample is regenerated with the same seed from the actual 262-question pool.

Draft PR #31 tracks this unfinished work: https://github.com/gavinleiner/councillion/pull/31 . The branch is `content/genuine-five-thousand`; do not mark the PR ready or merge it as the promised release below 5,000. Production was independently rechecked at 227 questions and main commit `48f6719c3668c505699bb9b0b0ad41954d734834`. Nothing has been published to the production website or emailed as finished. Update draft counts when the branch advances.

Cheese research now follows all 27 explicitly linked national/type lists under the global cheese list, producing 2,523 raw distinct name strings for **one** prospective question. They are not 2,523 questions. The files and receipts are in the parent workspace `work/five-thousand/`; raw labels still need note cleanup, specific alias decisions and supplier/brand eligibility review. The 46 independent familiar cheese inputs are saved before those repairs. Do not add a question for every country or cheese-list page.
