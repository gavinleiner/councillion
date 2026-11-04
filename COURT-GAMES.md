# Counsel Clash and Final Figure

Release `20261104-court-games-v1` adds two Google-authenticated room games alongside Puffer. Existing Puffer rating, Daily, Practice, moderation, characters and the 499-question ordinary pool are unchanged.

## Counsel Clash

Two teams, one to five ready players each. The two benches are Petitioners and Respondents. Representatives and answering turns rotate. A face-off has two buzzers, one answer from each side unless the first answer is tied for highest, then the winner chooses play/pass. Equal-valued answers preserve first-buzzer priority. Three misses, repeats or timeouts open one opposing-team steal; the steal transfers the bank without adding the stealing answer's value.

The compact online format uses four boards with 1×, 1×, 2× and 3× scoring. Reach 300 earlier or lead after four; a tie adds another triple board. This is a stated online adaptation, not a promise of an identical television episode format. The winning team chooses two Fast Money runners: five unused boards, 20 seconds then 25 seconds, a combined 200-point goal. A solo winning team gets one run and a 100-point goal. Drafts autosave privately and are banked at the timer. The second runner receives a retry for a duplicated canonical answer; the first runner's responses stay hidden until both finish.

40 individually selected aired boards, 220 displayed answer categories, from seasons 16–25. These are **fan transcriptions of broadcasts**, not official raw survey data or an affiliated product. Prompts and labels are condensed; published point values and combined answer categories are retained. Totals range from 57 to 99; they are deliberately not normalized to 100. Only displayed board categories score, as in a survey-board game. Familiar equivalents and spelling variations are accepted through explicit aliases and the existing conservative matcher.

The complete source URLs, source page hashes, board indexes and point vectors are in [survey-review.json](data-snapshots/court-games/survey-review.json). Only two boards per source page are adapted; the large source-page archives stay outside the shipped repository. Each completed board links its source; Fast Money results also link their source boards. Selection favors approachable food, daily situations, movies, sports, wordplay and animals. No claim is made that the questions themselves have a measured popularity ordering.

Rules references: [Family Feud Live rules](https://familyfeudlive.com/rules.pdf), [Hasbro home-game instructions](https://www.hasbro.com/common/instruct/familyfe.pdf), and the [licensed Endless Games booklet](https://content.cmpl.org/bg/FamilyFeud.pdf). These establish the face-off, board, strike/steal and bonus-round structure; the compact online format is described above.

## Final Figure

Two to eight ready players. Six 30-second rounds, with six different subjects selected from seven: Science, Nature, World, Sports, Culture, Gaming and Everyday. Each match independently shuffles the full 42-question bank; within-match questions do not repeat. Numbers, units, edition boundaries and rounded estimates are individually stated. Sources are from the publisher, institution, maker, sporting authority or the released game data. Each reveal shows the answer, explanation, source, all guesses, points and a comparison line.

One accepted estimate per player per round. Commas, decimals, scientific notation and k/m/b suffixes work; negative values, non-finite values, units and values above 10^15 are rejected. Accuracy is `round(1000 * exp(-2.2 * abs(guess-target) / max(abs(target), scale)))`, clamped to 0–1000. Closest estimates earn an additional 200; exact distance ties share the bonus. No speed or under-answer advantage. Missing answers get zero. Highest six-round sum wins, including shared winners.

[figure-review.json](data-snapshots/court-games/figure-review.json) records each source, answer, unit and scope review. Some source sites refuse automated fetches; those records distinguish accessible source snapshots from primary-site search-index verification. A successful HTTP request alone is not treated as factual verification. Nether distance derives from the pinned released dimension's `coordinate_scale: 8.0`; sunlight and pen length include their simple unit conversions. Classic UNO's 108-card scope excludes later 112-card editions. Conflicting Grand Canyon lengths were excluded rather than picked arbitrarily.

## Visual direction

The setup follows the existing Councillion character/name selection. The stage uses original pixel court art with a wide shot, face-off podium angle, team reaction cut-in and separate winner's dais. The puffer host has a four-pose transparent atlas (idle, blink, cheer, gavel). Board flips, warm marquee lights, point bursts, large strike impacts, teammate reactions, moving rays, aquatic ambience and small finale glints follow match events. Gameplay controls remain usable during cosmetic beats. Reduced motion disables the reaction cut-in, impacts and decorative movement. The aquatic canvas runs at 20 fps and pauses in hidden tabs.

Reference viewing: [official Family Feud compilation](https://www.youtube.com/watch?v=88jMyxR5g40&t=1280s), sampled from approximately 21:20–25:13 on November 4: host-centered face-off, isolated board framing and contestant reaction close-ups. The reference informs staging and pacing. No show footage, branding, voices, music or contestant likenesses ship with the game.

Six original bitmap assets and the four host poses were produced with built-in `image_gen`, using Councillion's existing court and character artwork as style references. [Art notes and prompts](assets/court-games/ART-NOTES.md) describe the reference roles and prompt set. Both original PNGs and lossless WebP delivery copies are kept in the project. [Encoding checks](data-snapshots/court-games/art-encoding.json) verify identical alpha and visible pixels; browser artwork traffic falls from 11.1 MB to 8.7 MB for the complete six-asset set, with no runtime image generation or paid API dependency.

## Rooms, reconnects and privacy

New games use the existing server-enforced Google room authorization. No database rules are loosened or new allowlist added. They have distinct `catalogBuild` values under `rooms/` and `directory/`, so they do not appear in ordinary Puffer's room list or each other's mode list. Clients write only their own member/request nodes. The host owns public state and private response writes. Huddles are copied only to teammates' protected response nodes; estimates and Fast Money drafts/results live in each player's protected secret response until reveal. Sealed estimates are immutable at the referee.

Accepted state, acknowledgement and private result are written atomically. Duplicate request IDs are suppressed, including an already-acknowledged request seen by a new host. Reactions cannot overwrite an in-flight guess. A deliberate host exit transfers to another online participant immediately; abrupt disconnections use the existing 30-second host-claim authorization. New hosts rehydrate accepted private estimates and Fast Money drafts before continuing. Briefly offline seats retain their reconnect grace, while available teammates get new turns. Late arrivals spectate until a rematch. An over-capacity waiting-room join is rejected clearly and its unused membership removed. A whole team leaving ends the match.

This is host-authoritative casual play, like the existing Puffer architecture: an intentionally malicious host or a modified client can inspect bundled question facts. It is not a secure competitive server or an anti-cheat guarantee. The new modes have match scores, not Puffer ranked rating.

## Verification

- `npm test`: original suite plus court engine tests.
- `npm run build`: all existing content, moderation and rules checks plus rebuilt browser bundles.
- `node tests/court-games-browser.mjs` with the app served on localhost:4173: role-gated forms, ten players, preserved input/caret/tiles on live updates, one submit listener, all 40 boards at 1366×768 / 1280×720 / 1024×768 / 390×844, Fast Money autosave/focus and reduced motion.
- `node tests/court-games-network.mjs` against the database emulator on localhost:9000 with unchanged production rules: ten-player teams, full-room rejection, huddle privacy, steals, spectator admission, sealed estimates, duplicate acceptance, host hand-off, private Fast Money draft recovery, timer banking and clean rematch.
- `node tests/database-security.mjs`: 71 existing authorization assertions.
- Additional stage screenshots inspect lobby, face-off, control, steal, board result, Fast Money, both finales, estimate reveal and mobile layouts. A local-only visual director lives outside the repository; no public bot room or sign-in bypass is deployed.
