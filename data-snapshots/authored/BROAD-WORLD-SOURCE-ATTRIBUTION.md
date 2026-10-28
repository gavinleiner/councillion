# Museums and mountain ranges

The two whole global questions reuse factual Wikidata names, aliases and typed memberships retained in `sources/broad-facts.json.gz` under [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing). Their full queries and retrieval date are preserved. Source rows, alternative names and geographic sublists are answers, never extra questions.

`world-common-challenges.json` supplies 124 independently written entry inputs. The sweep repairs major ranges missing from narrow source classifications (the Scandinavian Mountains, Altai Mountains and Alaska Range), named museum aliases, Chicago's renamed Griffin science museum, and the actual basketball museum from its own publisher. Exact publisher and heritage references are retained in the question specifications. Namesake museums share one answer where the same name is valid for multiple institutions.

Four generic museum-label placeholders are quarantined in `broad-supplements.json`. A generic category alias does not make “museum” a named institution. Proper public names such as Natural History Museum, MoMA, The Met and MSI are preserved. Separate long/unusable source labels remain recorded in `source-omissions.json`; a large dataset does not waive those repairs.

`sources/broad-world-fiction-classification.json` records an independent classification check. Its Sarajevo Tunnel flag conflicts with the actual museum described by the [Sarajevo Memorial Centre](https://www.mcsarajevo.ba/tunel-spasa) and [Visit Sarajevo](https://www.visitsarajevo.ba/listings/monument-complex-tunnel-d-b/), so the real site is retained. A fictional-classification flag is evidence to investigate, not authority to delete a known real museum.

Only factual names and original question/editorial text are shipped. No museum artwork, photographs, source article paragraphs or visitor data are included. Source prominence supports editorial rarity tiers; those tiers are not measured player-frequency claims.
