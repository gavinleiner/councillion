# Group-selected question pool

Release `20261023-group5000-v1` uses exactly 5,000 ordinary-play categories in Puffer, Daily and Practice shuffle. The searchable question library includes their canonical answer counts and a downloadable CSV. Older specialist inventories remain optional or archived; they do not enlarge the ordinary pool behind the scenes.

The submitted tryout approved 98 prompts and rejected two. All 98 approved prompts have playable inventories. Super Bowl halftime performers and songs from movie musicals are excluded from this expansion. Elden Ring bosses include the base game and Shadow of the Erdtree, with explicit familiar boss-name aliases. Steam questions use one actual community tag, such as “Horror” or “Open World”; single-tag prompts require only that label. Broad two-tag alternatives also remain, with a stricter familiar-answer gate.

## How the expansion works

`scripts/build-group-banks.py` combines the approved recipes, retained broad categories, single Steam tags and familiar two-tag pairs, film genres/story keywords/studio credits, music genre associations/artist credits, game creator credits, and literal title patterns. These are generated factual categories derived from the approved styles, not 5,000 individually hand-written or individually user-rated prompts.

Each derived category has a recorded predicate and a familiar-answer admission threshold. Generic source categories require at least 30 canonical answers and eight familiar answers. Title patterns and full artist discographies allow 24, with at least eight familiar answers for literal words and artist credits; concrete title vocabularies require six. Naturally finite approved prompts allow 12, including the six familiar reviewed examples. Studio questions need 15 familiar films, and movie keywords need ten. Two-tag Steam questions need 50 answers, 20 titles with at least 5,000 positive reviews, and six with at least 20,000. Technical and redundant pairings are held out. Title-word prompts also need four stronger examples, and use common English content words rather than foreign particles, production labels or isolated place names. Artist inventories need 12 distinct tracks with source popularity at least 60. Counts refer to canonical answers, not aliases.

Album questions are excluded because the track dataset’s album field also contains singles and EP releases. Obvious remix/live/remaster/featured-credit suffixes are explicit aliases of the same song title instead of separate answers. Familiar film studios use a short named whitelist.

Literal title words match complete words, including subtitles, never arbitrary initial letters or fragments. Title-category questions explicitly ask for a category name in the title; they do not infer a film's plot from its name. A word with another meaning still counts as that literal word. Known software-only AI, poisonous-but-not-venomous animals, reflecting objects, future Olympic hosts, non-country islands and artificial spacecraft are excluded from their respective approved prompts.

Identical complete normalized answer sets and duplicate prompt wording are rejected. Explicit aliases are merged into one identity, and ambiguous cross-answer aliases are removed. Different predicates can overlap: a horror game may also be an open-world game. This is a finite pool of distinct categories, not a promise that a familiar answer can never qualify in two different questions.

## Selection and history

Puffer balances available unseen subjects, then balances formats within each subject. Random ties and shuffled format buckets choose the specific prompt; the size of a Steam or movie inventory does not give it more turns. Recent-subject spacing keeps seven distinct subjects together while at least seven subjects remain available. Each new lobby and rematch supplies a fresh random order, while participants' recorded seen IDs are excluded. Identical retained banks share a canonical question identity. Histories are per Firebase account in this browser; changing devices or clearing site data can reset them.

Practice uses the same balanced selection and persists its remaining queue. A one-time migration reorders only the remaining saved IDs. Daily publishes one frozen balanced calendar: the same seven IDs in the same order for everyone. October 23's published questions stay fixed; the new balanced schedule begins October 24. The calendar and Puffer stop on exhaustion instead of wrapping. Seven Daily questions per day consume a 5,000-category pool in about 714 days; this is not an infinite supply.

## Sources, rankings and limits

`group-bank-manifest.json` records every selected predicate, answer count, familiar count, rarity distribution, file hash and compressed size. `group-question-list.csv` lists all 5,000 prompts and counts. `data-snapshots/group/sources.json` records the additional inputs and references; parent snapshot manifests and `question-sources.html` retain dataset attribution and license links. Raw personal review files are not published.

Membership retains the full eligible recorded source set rather than only the popular examples. Points use source popularity proxies and curated familiarity estimates, not measured player answer frequencies. A deterministic uncommon answer may receive 100 points. The normal 10/30/60/85/100 rarity family is preserved.

Checks cover structural integrity, hashes, exact examples, explicit boundaries, source membership for Steam tags, shared Daily dates, shuffled decks, room history and multiplayer behavior. They do not prove every metadata classification correct or every possible real-world answer present. Curated supplements and source snapshots are finite; missing answers and new releases still require maintenance. No online AI calls, API charges or generated answer decisions occur during play. Answer matching and its submit-then-confirm behavior are unchanged.


To regenerate the frozen selection, install `requirements-questions.txt` and run `python3 scripts/build-group-banks.py`. Replacing the editorial selection requires `--reselect`; ordinary play balances the same frozen IDs. WordNet content-word and Olympic event snapshots are included under `data-snapshots/group/`.

## Live 100-question review

Release `20261023-sample100-v1` adds `#sample`: 100 actual live prompts drawn using the same subject/format balancing as gameplay, with a frozen random seed. It shows all 100 together, each format and canonical answer count, subject/format/vote filters, Yes/No, notes, undo and JSON export. Its votes are stored per account on this device, under a separate sample version; the original `#review` and its private cloud feedback remain separate. The page never downloads answer banks. `question-sample-100.json` is the exact unvoted draw. Reproduce it with `node scripts/build-question-sample.mjs --seed=1c7de22efbd657b9bb8a2321`.

The first draw has 11 questions from eight subjects and 12 from science, including one single-tag and one two-tag Steam question. Balancing changes draw probabilities, not the underlying catalog counts. Unseen subjects or formats eventually run out; they drop out instead of reusing played questions to fill a quota. New content is still required to sustain all subjects indefinitely. October 23's published Daily remains unchanged.
