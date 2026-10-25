# Question pool and variety

Current release: `20261025-expansion-v1`. The first additional batch grows normal play from 419 to **1,009 questions**, with new topics in all nine subjects. The 5,000-question target is unfinished. All 98 user-approved prompts remain, and the old generated 5,000-entry archive is separate from admission to random games.

The balanced random draw, no-repeat histories and rejection of two-label Steam prompts remain in force. The first expansion and current counts are documented in [DISTINCT-EXPANSION.md](DISTINCT-EXPANSION.md). [ordinary-question-pool.json](ordinary-question-pool.json) and [ordinary-question-list.csv](ordinary-question-list.csv) are the actual normal pool. `#sample` uses the live selector and current admitted IDs.

The source and selection history below describes the October 25 repair before this expansion. Current Daily preserves October 23–25 and uses expanded future dates from October 26 through December 18, 2026, with seven distinct subjects per day. It stops without recycling. To append more approved content without moving scheduled dates, run `node scripts/build-daily-schedule.mjs`. Explicit date review is only for deliberately revising unpublished future dates or an authorized repair.

## Content admission

`ordinary-question-policy.js` records the normal-play gate. Both AND intersections and OR unions of Steam labels are excluded. Single Steam labels use a familiar genre/playstyle whitelist. Other admitted categories include all approved prompts, retained broad banks, broad movie/TV genres, named familiar music artists, common music genres, and literal familiar title words with stronger familiar-answer thresholds. Technical title vocabularies, generated multi-condition movie/story facets, creator-credit variants and narrow specialist banks stay outside automatic selection.

The normal inventory is gaming 78, sports 32, culture 84, music 107, food 38, nature 22, science 14, world 12, everyday 32. Inventory sizes do not determine their frequency in a fresh random game. See [ordinary-question-pool.json](ordinary-question-pool.json) and [ordinary-question-list.csv](ordinary-question-list.csv) for the admitted IDs, exact prompts and answer counts. These counts are finite, not thousands of independently authored questions.

The tryout's 98 approved prompts keep their complete recorded answer banks and scope. The two rejected proposals remain excluded. Answer banks, explicit aliases, matching, rarity values and source memberships are not altered by this release. A question can have many valid recorded answers; aliases are not counted as extra answers. Sources and classifications can still contain omissions or errors.

## Random selection

`balancedQuestionDeck` randomly selects an available subject, a least-used available format within that subject (random ties), then a question from its shuffled unseen bucket. The previous six subjects are avoided while alternatives remain. With nine subjects available, every rolling seven questions have different subjects. Single-label Steam questions share one format bucket rather than each getting separate format priority. As a small subject or format exhausts, it drops out without repeating IDs; the remaining mix necessarily changes.

Every eligible question is reachable, including the last catalog entry. This rule intentionally does not give each ID identical probability across differently sized subjects. Uniform ID selection from a pool dominated by tag combinations produced five two-label Steam prompts in one Daily. Subject/format balance prevents that source-volume bias while keeping questions and ordering random.

Puffer creates fresh independent decks for new rooms and rematches, excluding participants' recorded question history. Canonical equivalent banks share one identity. Histories are per Firebase account in this browser; clearing site data or using a new device can reset them. Old queues migrate once under the new selection build. Valid active questions and hearts remain; a newly held active question advances without a heart penalty. Clients on incompatible catalog builds cannot silently play together. Tournaments retain their existing roster, rank and result behavior.

Practice uses the same selector and saves its remaining queue. Migration removes held IDs and reshuffles only the remaining eligible IDs. Explicit specialist practice links still open the selected optional question. Random Practice cycles only after exhausting its finite inventory.

## Shared Daily

The calendar is frozen and account-independent. Everyone reads the same seven ordered IDs for the America/New_York date. Randomness is used when building the schedule, not on each player's browser.

October 25 is explicitly repaired in response to the reported five two-label Steam prompts. October 23–24 retain their published IDs. Each revised date has seven distinct subjects; no category ID repeats across the entire calendar. Saved Daily runs must match the new exact ordered IDs, so old October 25 runs restart on the shared repaired set.

The balanced calendar currently has 26 complete dates from October 23 through **November 17, 2026**. It stops when there are insufficient unseen subjects for another varied seven-question day. It does not append narrow leftovers or loop earlier prompts to imply an endless schedule. More broad, source-backed content is needed to extend it.

Reproduce the repair with `node scripts/build-daily-schedule.mjs --review-from=2026-10-25`. Normal append mode is `node scripts/build-daily-schedule.mjs`; both are idempotent on the current inputs. An explicit review is required to change already-published dates.

## Reproducible 100-question review

`#sample` uses the same subject/format-balanced selector as live play. It shows actual normal-play prompts, canonical answer counts, formats, filters and local Yes/No feedback. Its votes remain separate from the original tryout. The frozen sample is not a curated selection of better examples from a different pool.

Run `node scripts/build-question-sample.mjs --seed=20261025-expansion` to reproduce the current sample and normal-play metadata/CSV. `question-sample-100.json` is the exact unvoted export. Its first 100 contain all nine subjects; tests cover 500 independent fresh room seeds, format balance, varied openers, unseen history, queue migration and shared dates.

## Source archive and limits

`group-bank-manifest.json` records all 5,000 source predicates, answer counts, familiar counts, rarity distributions, hashes and compressed sizes. `group-question-list.csv` describes that source archive. `data-snapshots/group/sources.json`, parent manifests and `question-sources.html` retain attribution and license links. Raw personal review files are not published.

The archive was generated from approved recipes, retained banks, Steam community tags, TMDB/TVmaze metadata, music datasets, sports indexes and literal title predicates. Not every generated predicate was individually reviewed or approved. Identical normalized answer sets and duplicate prompt wording were rejected, but different predicates can still overlap.

Membership keeps the full eligible recorded source set rather than just popular examples. Points estimate familiarity from source popularity and editorial choices, not measured player frequencies. No online AI judge or paid API request runs during play. The selection repair does not establish every possible real-world answer or independently re-audit every metadata record.
