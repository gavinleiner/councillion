# Four global site inventories

These are four whole questions: airports/airfields, castles/palaces, archaeological sites and burial sites. Individual sites, codes, countries and source subsections never become questions. The retained complete Wikidata class-query snapshots are in `sources/open-knowledge.json.gz`; supplemental operator evidence and explicit source holds are in `open-knowledge-supplements.json`.

## Airports

[OurAirports](https://ourairports.com/data/) publishes public-domain airport data. The frozen complete CSV contains 86,286 rows, with SHA256 `27c6500d0a742edece15c5aaf960e08c01df0d4356c5c86255897b5d3749ad3b`. Selected factual fields from every record are retained in `sources/ourairports-full.json.gz`. `authored_airport_source.py` reconciles these with the existing worldwide Wikidata inventory, preferring documented stable ICAO identity before name and IATA matching. Current scheduled/large facilities precede closed records when actual code assignments collide. IATA, ICAO and US FAA local identifiers come from the corresponding fields, never from inferred name initials. Public two-letter fragments are not generated.

`airport-source-checks.json` records matches, additions, held names and code counts by actual field. Generic or untranslated placeholder labels stay in the retained source but do not become named airport answers. The independent sweep includes JFK, LAX, Heathrow, Charlotte, Raleigh–Durham and Wilmington, plus 35 documented codes. The retained inventory includes small and historical airfields; it is not a popular-airport shortlist.

## Castles and archaeological sites

Primary additions use [Balmoral](https://balmoralcastle.com/), [Chambord](https://www.chambord.org/fr/histoire/le-chateau/), [Chenonceau](https://www.chenonceau.com/infos-pratiques/) and [Schönbrunn](https://www.schoenbrunn.at/en/). The scope includes actual theme-park castle buildings, supported by the operators' Cinderella Castle, Sleeping Beauty Castle, Enchanted Storybook Castle and Universal Hogwarts Castle listings in the question references. A castle existing only inside a story remains ineligible.

Archaeological additions use the exact UNESCO entries for [Memphis/Giza](https://whc.unesco.org/en/list/86/), [Sanchi](https://whc.unesco.org/en/list/524/), [Bodh Gaya](https://whc.unesco.org/en/list/1056/), [Ayutthaya](https://whc.unesco.org/en/list/576/), [Sukhothai](https://whc.unesco.org/en/list/574/) and [Prambanan](https://whc.unesco.org/en/list/642/), plus the National Park Service's Chaco and Mesa Verde records. A full heritage-register paragraph is held until a verified usable public site name exists; it is not truncated into a new invented name.

## Tombs, mausoleums and cemeteries

The scope includes recognized named burial complexes, not people or generic grave types. The [National Park Service](https://www.nps.gov/gegr/index.htm) supports Grant's Tomb/General Grant National Memorial. [Agra's government](https://agra.nic.in/tourist-place/tomb-of-itimad-ud-daulah-baby-taj/) supports the Itimad-ud-Daulah/Baby Taj names. [Türkiye's ministry](https://www.ktb.gov.tr/EN-103960/ankara---anitkabir-ataturks-mausoleum.html) supports Anıtkabir and its public Latin spelling; [UNESCO](https://whc.unesco.org/en/list/1103/) supports the Khoja/Khwaja Ahmed Yasawi mausoleum names.

[Westminster Abbey](https://www.westminster-abbey.org/history/explore-our-history/royal-tombs), [Graceland Cemetery](https://www.gracelandcemetery.org/), [Monticello](https://www.monticello.org/encyclopedia/monticello-graveyard), [Mount Vernon](https://www.mountvernon.org/the-estate-gardens/location/washington-tomb) and [Musée de l'Armée](https://www.musee-armee.fr/en/your-visit/museum-spaces/the-dome-tomb-of-napoleon.html) establish actual burial-site interpretations for those familiar guesses. Their public names are recorded explicitly rather than widening typo matching.

Bare words such as Airport, Castle, Palace, Pyramid, Cemetery, Tomb and Mausoleum do not identify named sites. They are removed from canonical and alias indexes and explicitly rejected. Rarity tiers are editorial estimates, not measured answer-frequency statistics; Wilkins Runway, Predjama Castle, Nan Madol and the Mausoleum of Theodoric are deliberate deep-cut anchors.

These are retained source inventories with explicit known holds, not a claim that every possible site worldwide has been identified. The 5,000-question release remains unfinished.
