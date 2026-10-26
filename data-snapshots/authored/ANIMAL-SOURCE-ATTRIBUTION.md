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
