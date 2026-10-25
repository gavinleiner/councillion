# Playability correction · October 25

Current release: `20261025-reviewed-standard-v1`.

The preceding expansion admitted every recipe marked `editorialVersion: 1`. That admitted niche dictionary types, team histories and actor-credit joins even though the saved 100-question user review did not support those styles. Source size, familiar-count proxies and structural tests did not establish good gameplay. The old sample contained only 29 originally approved prompts.

## Current live content

Daily, Puffer, random Practice and the live sample use the **same 227 individually admitted questions** in `data-snapshots/reviewed-standard/admission.json`. All 98 Yes-voted original prompts remain. The two No-voted prompts remain excluded. The other 129 were selected individually for recognizable subjects and concrete, accessible answers. This is a quality correction, **not completion of the requested 5,000 genuinely different questions**. Unreviewed source material remains optional and readable for history; it cannot enter ordinary play through a source-generation flag.

No actor co-star joins, team-specific historical rosters, arbitrary league unions, title-word variants, two-label Steam prompts, leather types or laboratory-procedure prompts are admitted. Single Steam labels remain, with their actual recorded memberships. Random selection still balances the nine subjects and formats and excludes seen IDs; the sample is the same real draw, not a separate favorable showcase.

## Answer repairs

The build checks **1,257 familiar exact-answer cases and 137 deliberately wrong inputs** against the real matcher. The cases are authored separately from the source recipes. They do not establish exhaustive coverage of every answer.

Repairs include attacking Minecraft mobs (including neutral/defensive mobs), speaking-animal films, missing console games, boss/character names, sharks, weather, foods and everyday objects. Exact aliases such as Daisy/Princess Daisy, Morgott/Morgott the Omen King, and Skyrim resolve to the intended answer. Cooked Beef/Steak and Courgette/Zucchini share one identity. Invalid Strider, Piano and Cash inputs cannot turn into Spider, Pifano or GCash in questions where they do not qualify.

The athlete bank also now includes all 451 players with recorded first-team league minutes in the pinned official Premier League data, with name-based identity merges and club-profile supplements for Lamine Yamal and Michael Olise. This addresses the old World Cup snapshot gap; it does not claim complete coverage of every professional athlete. Current familiar music and superhero-film omissions are repaired too.

The retained Steam source omitted Dota 2, GTA V, Civilization VI and Age of Empires II. `steam-supplement.json` pins their Steam store tags and source URLs. The repair does not guess tags from game names. `answer-repairs.json` records other corrections and primary source references, including official Minecraft changelogs and studio film pages. Only explicit names and aliases are added; there is no generated initialism expansion.

Content-addressed repaired banks live in `reviewed-banks/`. Older bank files are retained. `scripts/apply-reviewed-answer-repairs.py` updates metadata, counts, fingerprints and manifests; rerunning it is idempotent. After regenerating source inventories, run it again and rebuild the sample.

## Shared Daily and saved games

October 23–24 remain fixed. The authorized correction replaces October 25 and future draws with the reviewed set. Every client gets the same ordered seven IDs for a date, with seven different subjects. Existing stale October 25 runs fail the shared-run check and reload the corrected Daily. The finite schedule currently ends November 17, 2026; it does not secretly recycle or fall back to retired prompts.

Puffer replaces retired active prompts without taking a heart, filters future room decks, and preserves seen history. Practice filters saved queues rather than appending every expansion recipe again.

## Maintenance

1. Add a candidate to `admission.json` only after reviewing the prompt, scope and actual inventory against the saved user review. Record exact prompt/family, at least three independent familiar-answer checks, and relevant wrong-answer boundaries.
2. Repair missing or wrong source memberships in `answer-repairs.json`; do not widen the typo matcher to conceal them.
3. Run `python3 scripts/apply-reviewed-answer-repairs.py`, `node scripts/build-reviewed-standard.mjs`, then `node scripts/build-question-sample.mjs --seed=YOUR_RELEASE`.
4. Preserve published dates unless an explicit current-day repair is authorized. Append future dates with `node scripts/build-daily-schedule.mjs`.
5. `npm run build` verifies the admission file, repair idempotence and every familiar/boundary case before bundling. `npm test` also checks stale queues, random draws, source integrity and shared Daily behavior.

The immutable preference evidence is `data-snapshots/reviewed-standard/user-review.json`. A new source recipe does not get to approve itself or replace these preferences.
