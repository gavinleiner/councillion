# Whole global geographic-feature inventories

The upstream geographic snapshot is [GeoNames allCountries](https://download.geonames.org/export/dump/), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). GeoNames is credited as the publisher of factual place names, aliases, feature classes and locations. The upstream schema and license notice are retained in `sources/geonames-world/readme.txt` and `featureCodes_en.txt`.

The complete 13,483,423-row ZIP was traversed, with CRC validation. Its 422,503,800-byte download has SHA-256 `27271b11185e457074459e777f05856f3d32037101c16ee36e935bc1cb3d9961`. Retained receipts record extraction sizes, feature codes and per-file hashes. Individual mountains exclude mountain-range/group classes. Complete volcano and ice-cap classes supplement the mountain and glacier inventories. Countries and source subsections do not create extra questions.

Fourteen whole concepts are supplied. The source is a geographic gazetteer, not a universal guarantee that every valid answer is listed. Ordinary English names and well-known features missing from a source classification are repaired with explicit, linked evidence in `world-geography-specifications.json`. These include Mount Fuji, Mount Vinson, Ireland, Maldives, NC beaches, Wind Cave, Kula Kai Caverns, Greenland/Antarctic ice sheets, Harris Lake and familiar public gardens and zoos. Public historical/local names share one scoreable identity. Real short names such as K2 are retained; initialisms are not generated.

Supplementary factual names come from the published Wikipedia lists identified in `sources/world-published-list-names.json.gz`. Each list retains its source URL and captured HTML hash. Names and qualifying relationships are retained, not article prose or images. List membership does not automatically establish feature eligibility: location/country labels, gallery captions, bibliography entries, generic words, a river listed near a canyon and a marine park listed near a reef are excluded or separately qualified. A zoo's city is not the zoo name. The wrong Olympus Mons/Mount Olympus entity alias is held in the Earth-only inventory.

The per-question specification records explicit familiar inputs, exclusions, identity merges, reference URLs and source holds. `scripts/prepare-authored-world-geography.py --check` reconstructs all answer banks from the retained complete feature snapshots and explicit supplements. `world-geography-checks.json` reports source and canonical-name counts; `world-geography-holds.json` documents known discarded labels and aliases. Canonical-name counts can be lower than source rows because identical accepted strings share one answer identity.

Rarity is an editorial familiarity estimate using independent familiar inputs, proper-name prominence in the source, shared-name frequency and an explicitly chosen rare discovery. It is not measured player-choice frequency. Large inventories load separately and the answer browser initially renders only 100 rows; valid rare names are not truncated for popularity.

These are development additions toward the unfinished 5,000-question expansion. Source rows and answer aliases do not increase the question count. Explicit normal-play admission remains separate.

| Whole subject | Source rows traversed | Accepted canonical names | Familiar-input checks |
| --- | ---: | ---: | ---: |
| mountains-peaks | 476,853 | 353,704 | 28 |
| islands-archipelagos | 175,037 | 116,403 | 35 |
| deserts | 348 | 366 | 33 |
| beaches | 16,219 | 14,538 | 26 |
| glaciers | 8,353 | 7,476 | 28 |
| caves | 4,110 | 5,345 | 26 |
| reservoirs | 112,870 | 81,396 | 32 |
| dams | 70,192 | 57,781 | 26 |
| zoos | 490 | 2,108 | 42 |
| named-forests | 91,974 | 66,467 | 30 |
| reefs-atolls | 10,994 | 10,067 | 26 |
| capes-headlands | 141,595 | 95,478 | 32 |
| botanic-gardens | 2,545 | 2,575 | 37 |
| valleys-canyons-gorges | 149,559 | 92,248 | 60 |
