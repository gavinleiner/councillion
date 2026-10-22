# Councillion answer banks

Snapshot: 21 October 2026. New daily/practice pool: **17 prompts and 12,513 canonical entries**: 11,208 entries in 15 new banks plus the user's exact 111-answer airline and 1,194-answer vehicle banks. Some concepts appear under distinct names in upstream sources; counts are accepted canonical strings after normalized spelling duplicates are merged, not a claim of exhaustive real-world coverage. Aliases do not increase displayed counts.

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

The New York calendar date selects one question from each family: words, nature, food, science, culture, geography, and everyday curiosities. Each family cycles through all its prompts before starting another cycle. A stable first question keeps adjacent cycle boundaries from repeating; the remaining order varies deterministically by cycle. The seven questions are then shuffled into a shared daily order. Two years of consecutive dates are tested for family coverage, uniqueness, and no adjacent-day repeats. Existing saved dives retain their original question IDs; basic legacy packs are kept for compatibility and are excluded from new daily/practice/party selection.

## Original rarity model

This is an editorial familiarity estimate, **not a measurement of player choices** and not Krillion's private scoring system. For each canonical answer, English phrase frequency from wordfreq 3.1.1 provides a baseline: Zipf frequency ≥5 → 10 points; ≥4.1 → 30; ≥3.1 → 60; otherwise 85. Explicit common/familiar/known overrides calibrate category-specific names (for example Tyrannosaurus, Triceratops, Ceres and Vesta). Regular word inflections inherit the familiarity of their dictionary base where identifiable, so adding an ordinary plural or past-tense ending is not a rarity loophole. Selected memorable discoveries receive 100. Every question has at least one such answer. Values are generated once and shipped as static data; there is no AI API call or player tracking while playing.

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

## Rebuild

The actual input snapshot is checked into `data-snapshots/`; it is development data and is never fetched by gameplay. No partial instrument search page or failed download was used to fabricate a complete bank. `bank-manifest.json` records counts and score distributions.

```sh
python3 -m venv work/bank-env
work/bank-env/bin/pip install -r scripts/requirements.txt
work/bank-env/bin/python scripts/build-expanded-banks.py
npm run build
npm test
```

Raw source URLs are in `data-snapshots/downloads.json`. Refined PBDB requests add `taxon_status=accepted&pres=regular&extant=no` to the Dinosauria and Aves descendant-genus queries. The checked-in Wikidata response uses the film-instance restriction above. Experimental sources listed in the download log were not necessarily used; the table and generator define the shipped banks.
