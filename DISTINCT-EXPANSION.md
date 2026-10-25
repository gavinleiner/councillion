> Superseded by `20261025-reviewed-standard-v1`: **227 questions** are individually admitted for normal play. The source inventories described below remain archived/optional. See [QUESTION-STANDARD.md](QUESTION-STANDARD.md) for the correction and independent answer checks.

# First distinct-topic expansion

Release `20261025-expansion-v1` has **1,009 normal questions**, including all 98 approved tryout prompts. This batch adds 590 inventories across nine subjects. **The requested 5,000-question normal pool is not complete.** The old generated source archive remains optional and is not counted as live normal content.

The runtime inventory is gaming 100, sports 129, culture 369, music 159, food 63, nature 44, science 48, world 33, everyday 64. These are inventory sizes, not sampling weights. Live selection balances subjects and formats; the 100-question sample comes from that same selector. A source with hundreds of records does not get hundreds of extra turns.

## Admission and novelty

`scripts/distinct-topic-recipes.py` explicitly names admitted topics and source boundaries. It does not enumerate every ontology node or generate combinations of tags, countries, years, letters or arbitrary constraints. New screen credits use one anchor per actor: an actor supplies either a works question or a castmate question, never both. Whole major-team histories do not add a second position, season or nationality restriction. Game questions use actual object/character inventories.

Identical normalized complete answer sets and identical prompt wording are rejected. A separate semantic exclusion list rejects 13 same-concept or vague rewrites even when their wording and source rows differ; these do not count toward the expansion. Original inventory IDs remain provenance/identity links, so a remembered old source question cannot return as a new ID. Different meaningful topics can overlap. A named instrument is still an instrument even when another question asks for percussion specifically; that is not a promise of disjoint answers.

Most admitted banks have at least 24 canonical answers. Naturally finite screen-work lists and game-object sets allow 12. Explicit aliases are merged into the answer's identity, and ambiguous aliases are removed. No generated initialisms are added. The airline inventory deliberately omits IATA/ICAO/callsign-code aliases; a small set of genuine marketed names such as KLM and ANA is explicit. Rarity remains an editorial familiarity estimate, with source proxies for screen works and retained sports/music banks.

## Sources and quality limits

`data-snapshots/distinct/sources.json` records attribution, licenses, primary background references and limits. New global screen-work credits supplement the retained film cast source; source coverage can omit a credit. Untitled/upcoming works and aggregate film-series labels are excluded. WordNet senses are selected individually; broad or technical nodes are not automatically admitted. Some historical classifications can still need editorial repair.

The authored factual lists are finite knowledge inventories, with explicit aliases and negative examples. Retained inventory repairs add missing familiar entries such as Gala/Fuji/Honeycrisp, generic marsupial/primate names, and basic academic subjects. Citrus peel/juice and unfermented must are excluded from fruit/fermentation inventories. School and musical-ensemble types do not count individual named institutions or acts. The gas and liquid inventories repair misleading phase-state descendants and include everyday examples. Background links are not a claim that every row has been independently verified against every source. In particular, this release does not claim every possible answer on Earth. A broad category can still miss a valid name. The task still needs more broad, distinct, researched inventories toward 5,000; a source record count alone cannot establish playability.

`distinct-bank-manifest.json` contains exact row counts, hashes, rarity distributions and examples. Runtime metadata omits QA examples, and all answer banks stay hidden in the UI until the appropriate results screen. Public static files can be inspected like the rest of this GitHub Pages game.

## Daily, histories and migration

Published October 23–25 keep their exact ordered shared prompts. Future dates are rebuilt from October 26 with the expanded pool. Every scheduled date has seven different subjects, the same ordered questions for every player and no repeated category IDs. The finite calendar currently ends December 18, 2026; exhaustion stops without cycling.

Old Practice queues receive newly introduced IDs once and preserve their unplayed eligible IDs. Puffer canonicalizes source histories, including corrected subject labels, and new rooms/rematches build independently random decks. Old room tails migrate without disturbing a valid current question or hearts. Catalog versions prevent incompatible clients from silently joining.

## Reproduce and verify

Run `PYTHONPATH=/path/to/wordfreq-runtime python3 scripts/build-distinct-expansion.py` using the pinned source files. `--probe` reports admission without writing banks. No network/model calls run while building these inventories or playing the game. The build does not fetch new research behind the scenes.

Run `node scripts/build-daily-schedule.mjs` to append only; do not review an already-published date without authorization. Reproduce the live sample and CSV with `node scripts/build-question-sample.mjs --seed=20261025-expansion`, then `npm run build`.

Tests cover every new compressed-bank hash, exact counts, unique canonical labels, unambiguous aliases, supplied positive/negative boundaries, one actor anchor per question, canonical source history, Practice migration, 500 random Puffer seeds, all nine subjects, shared Daily dates and unchanged published sets. Browser and emulator tests cover the real loader/matcher, multiplayer, rematches, reconnects and tournaments. These checks do not prove every real-world classification perfect.
