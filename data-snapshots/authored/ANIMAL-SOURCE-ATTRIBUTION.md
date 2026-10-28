# Whole animal groups

These are four distinct questions: kinds of owls, parrots, penguins and bats.
The birds are selected by their actual taxonomic order, never by a word in the
English name. No question is generated for each country, habitat, colour or
pair of attributes.

The Cornell Lab of Ornithology's eBird/Clements public taxonomy response supplies
all 248 owl, 410 parrot and 19 penguin species in the cached October 21, 2026
snapshot. The filtered source retains species codes, English/scientific names
and family membership, along with the full response hash and original species
counts. Only factual names/classifications are used; no photographs, species
accounts or observation records are included. Credit: Cornell Lab of Ornithology,
eBird/Clements Checklist. Sources:

- https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json
- https://www.birds.cornell.edu/clementschecklist/

The American Society of Mammalogists' Mammal Diversity Database v2.5 (July 28,
2026) supplies 6,904 accepted living/recently extinct mammal species, including
all 1,514 bat species. The complete relevant factual fields are pinned to the
publisher's Git commit `749c2de16a949099cfc13ccbd2b86d427641e844`.
The publisher CSV's MD5 matches the v2.5 archived release exactly; its SHA-256 is
also retained in the compressed source. Neither popularity nor the presence of
an English encyclopedia article filters accepted species. Latin scientific
names, alternative common names and documented prior combinations are retained.
An accepted scientific name has priority over another species' legacy synonym.

Credit: Mammal Diversity Database. (2026). Mammal Diversity Database (Version
2.5) [Data set]. American Society of Mammalogists / Zenodo.
https://doi.org/10.5281/zenodo.21654811
License: Creative Commons Attribution 4.0,
https://creativecommons.org/licenses/by/4.0/ . Derived bat-name inventory retains
that attribution. No taxonomy-note prose, distribution notes, specimen locations
or images are incorporated.

The publisher site's citation link still led to an earlier v2.3 archive. The
archive's own latest-version link identified v2.5 and its 6,904-row CSV checksum;
that is the actual version used, rather than incorrectly calling the older DOI
v2.5. Current-species scope does not claim a complete prehistoric-fossil catalog.

Independently supplied common guesses include barn/screech owls, macaws,
cockatoos, budgies, African grey parrots, fairy penguins and jackass penguins.
Established named groups are retained alongside species; colour morphs do not
become additional species identities. A parrot crossbill, parrotfish, puffin,
auk, nighthawk, owlet-nightjar and flying squirrel do not qualify for these
respective groups merely because of a similar name or appearance.

These species rows are answers. They do not count as thousands of questions.


## Six additional whole mammal groups (2026-10-26)

`batches/17-mammal-concepts.json` uses the same pinned ASM Mammal Diversity Database v2.5 complete species source for wild felids, wild canids, mustelids, deer, pinnipeds and cetaceans. Source family or infraorder membership is evaluated across all 6,904 source records. The two wild-only inventories explicitly exclude the publisher's domestic species flag; domestic breeds are outside their stated scope. The other questions retain all eligible publisher species. No range, color, country or year combination creates another question.

The source is credited to the American Society of Mammalogists / Mammal Diversity Database under CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. The v2.5 archived source is https://doi.org/10.5281/zenodo/21654811. Exact release and source checksums remain in `sources/mdd-2.5-species.json.gz` and the generated check ledger.

Independent common guesses and a small set of actual named groups extend species-only entries. Genuine tiger/lion population names share their parent animal identity rather than manufacturing rare duplicate scores. Primary public references from the IUCN Cat Specialist Group and Smithsonian document those names; San Diego Zoo documents black panther as a melanistic leopard. The Australian Museum documents the dingo name despite disputed species rank. NOAA supplies public killer-whale ecotype terminology, and AMNH documents the elk/wapiti versus European elk/moose ambiguity. Exact URLs accompany each question.

Current accepted scientific names retain current ownership when they also occur as historical synonyms. Ambiguous common names have explicit owners rather than an accidental first row: for example, North American elk maps to wapiti, panther to puma, clouded leopard to the mainland species, and the unqualified orca name to Common Killer Whale. Distinct publisher species remain separate, including Bigg's and Resident Killer Whales. Published aliases and reviewed synonyms are retained; random initials are never generated.
