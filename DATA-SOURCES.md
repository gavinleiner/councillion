# Councillion answer banks

Snapshots: 21–22 October 2026. The shared Daily/Practice/Puffer pool has **221 categories and 154,129 answer/category entries**, including **113,279 distinct normalized answer labels** across categories. Aliases do not increase these counts. Some concepts have distinct accepted names in source data, and some answers occur in several categories; these are not counts of unique real-world concepts. The banks are finite and can omit otherwise valid answers.

This expansion adds **204 categories and 141,616 entries** to the original 17-category pool. New banks have 47–6,328 entries. Across the complete pool, 181 categories have at least 100 entries, and the median bank has 234. Naturally constrained categories are kept meaningful rather than padded. The original 111-answer airline and 1,194-answer vehicle banks retain all supplied labels and scores.

| Subject | Categories |
| --- | ---: |
| Wordplay | 31 |
| Nature | 27 |
| Food | 31 |
| Science | 21 |
| Culture | 61 |
| World | 32 |
| Everyday | 18 |

Examples include apple cultivars, pasta and noodles, soups, hand tools, mineral species, space probes, writing systems, musical instruments, mythical creatures, film-award nominees, Nobel laureates, animal groups, pronunciation puzzles, constrained city sets and Pokémon typing. Prompts state their boundaries: common names versus scientific names, film versus person, historical breeds, regional food names, and species versus alternate forms. The searchable `#questions` library shows prompts and bank sizes while keeping answers hidden until a dive is completed.

## Original 17-category pool

The first 15 generated banks below plus the two user-provided examples contribute 12,513 entries and remain unchanged.

| Challenge | Entries |
| --- | ---: |
| Ten-letter words without repeated letters | 1,095 |
| Words with three consecutive vowels | 2,450 |
| Words with a silent first letter | 923 |
| Non-avian dinosaur genera | 1,542 |
| Bird species recorded in North America | 992 |
| Cheeses and other fermented dairy | 1,940 |
| Culinary herbs, spices and blends | 184 |
| Sauces and condiments | 99 |
| Elements with two-letter symbols | 104 |
| First 1,000 numbered minor planets | 1,000 |
| Best Picture nominees | 589 |
| Best Picture winners | 97 distinct titles |
| Atlantic-draining rivers | 106 |
| Pacific/Indian-draining rivers | 55 |
| Arctic-draining rivers | 32 |

The two separate films called *All Quiet on the Western Front* share one accepted title; this is why 98 winning films become 97 displayed title entries. Each movie bank covers ceremonies through 2026. Accepted-answer banks remain finite; valid omissions can occur. Short, naturally constrained categories are not padded to reach a minimum count.

## Daily selection

The New York calendar date selects one question from each family: words, nature, food, science, culture, geography, and everyday curiosities. Each family cycles through all its prompts before starting another cycle. A stable first question keeps adjacent cycle boundaries from repeating; the remaining order varies deterministically by cycle. The seven questions are then shuffled into a shared daily order. The expanded pool starts **23 October 2026 at midnight in New York**; earlier dates use the original 17-category algorithm so the release does not change today's shared draw. Two years of future dates are tested for family coverage, uniqueness, no adjacent-day repeats and eventual use of all 221 categories. Existing saved dives retain their question IDs. Basic legacy packs are kept for compatibility and excluded from new selection.

Puffer Party and practice use the expanded pool immediately. Party decks visit every category before wrapping, with weighted subject grouping to avoid consecutive narrow subjects such as Pokémon types. New room metadata records the catalogue build; incompatible clients receive a refresh message. The server still enforces Google membership for multiplayer.

## Original rarity model

This is an editorial familiarity estimate, **not a measurement of player choices** and not Krillion's private scoring system. For each canonical answer, English phrase frequency from wordfreq 3.1.1 provides a baseline: Zipf frequency ≥5 → 10 points; ≥4.1 → 30; ≥3.1 → 60; otherwise 85. The expansion also uses recorded source prominence where available: `1.4 + 1.05 × log10(popularity + 1)` is an additional familiarity floor; popularity is the recorded source measure, such as Wikidata sitelinks or city population. It is not a count of players. Explicit common/familiar/known overrides calibrate category-specific names (for example Labrador Retriever, Quartz, Python and Einstein). Regular word inflections inherit the familiarity of their dictionary base where identifiable, so adding an ordinary plural or past-tense ending is not a rarity loophole. Selected memorable discoveries receive 100; otherwise a low-familiarity candidate is chosen deterministically. Every category has at least one such discovery. Values are generated once and shipped as static data; there is no AI API call or player tracking while playing. Original packs keep their existing ranking and supplied score allocations.

The generator contains every override. Source ambiguity is handled conservatively: canonical labels take precedence, and aliases naming multiple records are discarded. Numerical asteroid IDs alone are not accepted. Typo matching uses a bounded weighted edit distance: neighboring keys cost 0.65 edits, repeated letters 0.55, adjacent transpositions 0.65, and ordinary edits 1. Short names permit about one edit; longer names permit more, up to 3.5 weighted edits for names of 18+ characters. A margin of 0.55 edits over another candidate is required. Unique initialisms are accepted; ambiguous ones and arbitrary prefixes are rejected. Curated common abbreviations take precedence. Foreign-character-only aliases are not generated.

The separate seven-question percentile curve remains a disclosed estimate centered near 265 points. Its parameters do not represent collected scores and are not automatically fitted to these banks.

## Sources and permissions

- **ENABLE word list**, Mendel Cooper: public domain. Retrieved from [dolph/dictionary](https://github.com/dolph/dictionary). Exact letter filters generate the isogram/vowel banks. ENABLE's public-domain notice is preserved in [Debian's upstream copyright record](https://sources.debian.org/src/aspell-en/2020.12.07-0-1.1/debian/copyright/). Credit is retained; no restriction is placed on redistribution of the word list.
- **CMU Pronouncing Dictionary**, Carnegie Mellon University: BSD-style license. [Project and license](https://github.com/cmusphinx/cmudict). Full notice is retained in `data-snapshots/cmudict-license.txt`. Silent initials use ENABLE words whose first phoneme omits K/G/W/P/M in the relevant initial cluster, plus known silent-H families. For dictionary words missing from CMU, regular KN/WR/GN/PS/PN/PT/MN and HONOUR spellings are admitted. Dialect variants count if standard. These are pronunciation rules and a finite lexical snapshot, not all English words.
- **Paleobiology Database contributors**: [API](https://paleobiodb.org/data1.2/taxa/list_doc.html), [data use](https://paleobiodb.org/#/data), CC BY 4.0. Requests use accepted, extinct, regular genus taxa under Dinosauria; the corresponding Aves descendants are removed. Form taxa and ichnotaxa are excluded. This accepts genera recognized in the source snapshot, including uncommon/contested taxa; taxonomy can change.
- **Corpora**, Darius Kazemi and contributors: [repository](https://github.com/dariusk/corpora), CC0. Sources: `animals/birds_north_america.json`, `foods/curds.json`, `foods/herbs_n_spices.json`, `foods/condiments.json`, `science/elements.json`, `science/minor_planets.json`, `geography/rivers.json`. The bird source records a historical ABA checklist including vagrants, introduced/extinct species. The dairy source includes fermented milks and named products as well as cheeses; the prompt explicitly includes them. The elements snapshot is updated to permanent IUPAC names Nh, Mc, Ts and Og. River outflows are recursively traced; Mediterranean, Black Sea, Baltic, Gulf of Mexico, River Plate and Hudson Bay drainage is grouped with the Atlantic. Inland basins are excluded.
- **Wikidata contributors**: [data access and CC0 license](https://www.wikidata.org/wiki/Wikidata:Data_access). A SPARQL query selects film instances (`P31/P279* Q11424`) with a win (`P166`) or nomination (`P1411`) for Best Picture (`Q102427`). Human producers are excluded by the film-instance restriction. English labels and aliases are merged; earliest releases must be no later than 2025. Multiple releases and aliases do not inflate answer counts. Names alone are factual data; no plot text or poster artwork is copied.
- **wordfreq 3.1.1**, Robyn Speer and contributors: [project](https://github.com/rspeer/wordfreq), Apache 2.0 software; frequency data CC BY-SA 4.0. Only derived familiarity tiers are shipped. Attribution is retained here. To the extent the generated frequency-derived rankings are adapted data, they are offered under CC BY-SA 4.0; the factual labels retain their upstream permissions. No wordfreq package or full corpus is loaded by the browser.
- **User-supplied airline and vehicle banks** retain their supplied canonical strings, notes, and score allocations without regrading.

## Expansion sources and permissions

- **Corpora**, Darius Kazemi and contributors, [repository](https://github.com/dariusk/corpora), CC0. Snapshot commit `2e7adec11a0561696c236ae1fca82e88be173d42`. Food, breeds, animal anatomy, plant names, geography, occupations, tools, fabrics, colours, games, mythology and other factual lists are selected in the generator. Misspellings, duplicate synonyms and source-specific oddities are normalized or excluded where identified. A source list is not treated as exhaustive.
- **Wikidata contributors**, [CC0 data access](https://www.wikidata.org/wiki/Wikidata:Data_access). Saved queries cover food types, mineral species, animal taxa, space missions, sciences, music, literature, folklore, tools, textiles and award-linked works. The snapshot records the SPARQL query and English labels/aliases, with entity types constrained to the intended category. Instrument/tool class queries avoid individual museum objects. Film-award banks include direct award/nomination statements and recipient statements whose `for work` qualifier identifies the film. Incomplete or contaminated experimental queries were omitted. Knowledge-graph classifications can still have omissions or debatable boundaries; these are curated snapshots, not a live authority.
- **GeoNames**, [download source](https://download.geonames.org/export/dump/) and [attribution terms](https://www.geonames.org/export/), CC BY 4.0, credit GeoNames. Snapshot `cities15000` and `countryInfo` supply city names, alternate names, populations, coordinates and country metadata. City categories require at least 50,000 residents in the snapshot and exclude `PPLX` neighbourhood subdivisions. Latitude, continent, principal language and currency filters are explicit in prompts/generator. Country sets use the recorded sovereign-country inventory. Populations and names can change.
- **Nobel Prize Outreach**, [official laureate API](https://api.nobelprize.org/2.1/laureates?limit=2000), [API terms](https://www.nobelprize.org/about/terms-of-use-for-api-nobelprize-org-and-data-nobelprize-org/). The retained snapshot contains factual names, award years and categories only, through 2025. No biographies, award motivations, portraits or logo are reproduced. Nobel Prize is a registered trademark of the Nobel Foundation.
- **PokéAPI contributors**, [data repository](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv), BSD 3-Clause; full notice is retained in `data-snapshots/expansion/sources/pokemon-license.txt`. Species names, abilities and form typings generate the Pokémon categories. A species is accepted in a type category if any official form in the snapshot has that type; alternate forms do not inflate species counts. The two Nidoran use explicit female/male labels and F/M aliases. Pokémon and character names are trademarks of Nintendo, Creatures and GAME FREAK; this fan game has no affiliation.
- **Bowserinator / Periodic-Table-JSON contributors**, [repository](https://github.com/Bowserinator/Periodic-Table-JSON), CC BY-SA 3.0. Adapted snapshot retains factual element name, symbol, atomic number, phase and category only. Element subset/alias data adapted from this source is available under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/); full notice is retained in `data-snapshots/expansion/sources/periodic-license.txt`. Generated frequency-derived ranking data has the separate CC BY-SA 4.0 attribution above.
- **ENABLE, CMUdict and wordfreq** also power new spelling/pronunciation categories and rankings under the permissions recorded above. Word rules operate on the retained dictionary; they do not admit arbitrary invented strings.

`catalog-manifest.json` records each added category's prompt, source, group, count, tier distribution and normalized answer-set hash. Identical complete answer sets are not counted as separate added categories. `catalog-source-files.json` lists the recorded generator inputs. The compact snapshot's `source-manifest.json` records retrieval date, upstream origin information and SHA-256 hashes for 138 retained data inputs plus notices. Several recorded inputs support quality checks or omitted experiments rather than shipped banks; the generator and output manifest define the actual categories.

## Rebuild

The actual input snapshot is checked into `data-snapshots/`; it is development data and is never fetched by gameplay. No partial instrument search page or failed download was used to fabricate a complete bank. `bank-manifest.json` records counts and score distributions.

```sh
python3 -m venv work/bank-env
work/bank-env/bin/pip install -r scripts/requirements.txt
work/bank-env/bin/python scripts/build-expanded-banks.py
work/bank-env/bin/python scripts/build-question-catalog.py
npm run build
npm test
```

Raw source URLs are in `data-snapshots/downloads.json`. Refined PBDB requests add `taxon_status=accepted&pres=regular&extant=no` to the Dinosauria and Aves descendant-genus queries. The checked-in Wikidata response uses the film-instance restriction above. Experimental sources listed in the download log were not necessarily used; the table and generator define the shipped banks.

The expansion generator defaults to the checked-in `data-snapshots/expansion/` inputs. Rebuilding from that compact snapshot was verified to reproduce both generated question modules byte for byte. `--source-dir` and `--output-dir` allow a separate audit output directory. The answer-row module is fetched only when play needs it, not on home or library entry, and quiz clocks begin after loading. Answer banks are deduplicated in a shared row pool and hydrated by category on demand. Gameplay never fetches raw snapshots or calls Wikidata, GeoNames, Nobel or PokéAPI.
