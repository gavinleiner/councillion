# Whole vehicle-makers and gaming-hardware subjects

Reconciled October 27, 2026. Batch 31 has **two questions**, with 1,793 and 1,391
canonical answers. The 108 vehicle and 120 hardware familiar inputs were selected
before the source inventories. Neither answer rows nor hardware models add to the
question count. Familiar checks demonstrate the checked coverage, not mathematical
exhaustiveness of every historical manufacturer or hardware release.

## Retained sources

`sources/vehicle-console-list-sources.json.gz` retains the eligible source rows,
their original text/roles/URLs/line numbers and line-coverage information. The
captured Wikimedia lists cover automobile, motorcycle, truck, school-bus and
trolleybus manufacturers; the manufacturer column of the worldwide bus-model
list; released home/handheld consoles; first-generation, dedicated and retro
hardware; and Game & Watch device models. Source factual tables are available
under Wikimedia's [CC BY-SA terms](https://en.wikipedia.org/wiki/Wikipedia:Copyrights).
The first-generation and worldwide bus tables were traversed in full rather than
cut off at familiar records. Remaining handheld-page gaps are in references after
the released/canceled tables, not an unvisited answer section.

Primary Nintendo manuals/history, Sony timelines, PlayStation releases, Valve,
ASUS/Xbox, Lenovo and MSI records fill familiar hardware/revision omissions.
JLR's published house-of-brands statement establishes Range Rover, Defender and
Discovery as actual marques, rather than extrapolating arbitrary vehicle models
into brands. Brabus and Mercedes-AMG have actual manufacturer/brand evidence.
The inspected source URLs, exact extra name facts and local research hashes are
in `sources/vehicle-console-source-receipts.json`. Full primary marketing copy is
not redistributed. Individual question references and canonical-answer source
maps remain inspectable.

## Source errors and identities

Linked countries following an unlinked maker do not replace that maker: KMC
(Cyprus) and Uri Desert Runner (Namibia) initially exposed that parsing error.
Gallery captions are truck models, not additional makes. Historical notes saying
"defunct in" remain legitimate maker records. In particular, American LaFrance
and Gersix must not disappear with photo captions. Corrupt link fragments,
generic table headers and model-only entries are held. The Hero Motocop source
misspelling is corrected to Hero MotoCorp without becoming an exact alias.

Actual public short names such as MG, GM, AC, DS, FN and CZ are retained. Invented
initial shortcuts are not generated; the unverified GA source label is held.
Different marques such as Toyota/Lexus and Honda/Acura remain separate. Actual
corporate/public-name replacements such as Nissan Diesel/UD Trucks and
Navistar/International share a scoring identity. The explicit Gersix-to-Kenworth
historical replacement shares identity too. Different legal manufacturers
that happen to have the same normalized public label cannot score twice by that
one identical label; this is not a claim that the legal entities are the same.

Wrapped first-generation console rows contain CPU, input and country fields on
later lines. Those continuations cannot become consoles named Image, Poland,
Paddle, light gun or AY-3-8500. Real old units retain their manufacturer-qualified
names. Generic TV Game/Video Game guesses and bare unrelated titles are excluded;
an actual unambiguous public model name remains accepted. Twelve punctuation/name
alias collisions retain a single deterministic public owner, with every decision
recorded in the ledger.

One native-only source model code is held pending an unambiguous public ASCII
identifier. The current matcher otherwise erases the entire identifying code,
leaving a manufacturer-only key. That is repaired in the inventory, without
weakening normalization or silently accepting the manufacturer as a console.

NES/Famicom, SNES/Super Famicom and Genesis/Mega Drive share identity. Actual named
hardware revisions, such as Nintendo DS/DS Lite, PS5/PS5 Pro and Xbox Series X/S,
stay separate. The combined source X/S cell expands into its two real models,
not an invented combined device. Game & Watch table entries represent released
physical handhelds, not imported plots or ordinary game titles. Series/model
identifiers and documented regional device names are aliases of their public
handheld title; the never-released Tetris Jr. prototype is excluded.

Purpose-built gaming PCs and the documented N-Gage hybrid count. General-purpose
phones/computers, input-only controllers and primarily media-streaming boxes with
optional games are outside the explicit scope. Early dedicated electronic/VHS
gaming systems and genuine plug-and-play units with built-in games count. Pending
release evidence for several recent retro-device announcements is held explicitly;
an announcement or table year is not treated as proof of shipment.

`scripts/prepare-authored-vehicles-consoles.py --check` reproduces batch 31 and the
full review ledger from pinned source and policy inputs. Rarity tiers are editorial:
explicit familiar entry names earn 10, other independent common names 30, selected
recognizable tail names 60, further verified names 85, and the named rarity anchors
Borgward/BBC Bridge Companion 100. They are not measured player-frequency claims.
