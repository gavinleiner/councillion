# Councillion

**Puffer Party:** an original pixel courtroom arena backed by Google Authentication and protected Firebase rooms on Spark. Live Google login, hosting, visibility, host settings and chat were verified on October 22. See [PARTY-BACKEND.md](PARTY-BACKEND.md).

[Play Councillion](https://gavinleiner.github.io/councillion/) · [3,188 reviewed question categories](https://gavinleiner.github.io/councillion/#questions) · [Explore the ocean](https://gavinleiner.github.io/councillion/#biomes)

Future Counsel’s pixel ocean trivia game, inspired by Krillion. Original client code, code-native pixel sprites, AI-edited environmental background art, and bundled typography. The environmental art follows the reference composition with small legal details; logos, labels, controls, and fish sprites remain code-native.

## Play

- **Daily Dive:** seven shared prompts, a three-second optional preview, then 25 seconds to answer. You can type immediately and submit early to start the clock. Rejected attempts can be retried. Text left at zero is submitted automatically. Progress and completed results are saved in this browser.
- **Endless Cases:** 80 close-reading questions based on all 16 Future Counsel reviews, including Gavin’s published opinions. Four shuffled choices; five consecutive correct answers clear a challenge. A miss resets the streak. New challenges continue without a play limit. The reviewed bank reshuffles after all 80, with no repeat within a cycle. Progress survives reloads.
- **Unlimited Trivia:** keep playing shuffled seven-question practice dives from 3113 automatic-play categories. Browse 3,188 reviewed categories in `#questions`; the long specialist tail stays optional. Practice works through its saved queue before recycling.
- **Fresh Daily calendar:** from October 23, 2026, a frozen schedule deals seven distinct, previously unused prompts per day. The reviewed schedule contains 36 full dives through November 27, 2026. Earlier dates retain their draws; saved Daily runs must match the published IDs and order. This release intentionally replaces retired questions from October 23 for everyone. Equivalent wordings such as two furniture inventories share one automatic-play question key. The schedule never uses modulo or cycles back; if published fresh sets run out, the game says so instead of repeating. New releases append dates without moving existing ones.
- **Airline reference round:** open `#practice?pack=airline-extras` to begin a practice dive with the user’s exact 111-answer example. `#practice?pack=no-wheels` starts with the imported 1,194-answer vehicle example.
- **Puffer Party rebuild:** Google-only public and private courtrooms, quick play, four-letter invites, five buddies, chat, spectators, ready/rematch controls and reconnect/host transfer. Defaults are six seats, two hearts, a five-heart cap and 600 points per restored heart. New rooms use fixed Ranked rules with either two or six seats. Legacy Casual rooms are retained only for historical compatibility. A shared fuse and minimum turn time govern passing; answers cannot repeat within a category. The reviewed question pool has 3,104 prompts. Seen prompt IDs survive rematches and are remembered by Google/Firebase identity on this browser when starting or joining another room. A room excludes its participants’ reported history. At least two active players, and at least half the survivors, can vote for a fresh category without losing a heart.
- **Ocean preview:** `#biomes` uses the gameplay renderer with a depth slider and slow descent. Five named zones change scenery, lighting, ambient life, and colors.
- **Results:** the full dive unlocks a seven-column log, score guide, searchable answer accordions, rarity filters, and pagination. Answer banks are hidden during all seven prompts.

Visible rarity families follow the supplied image: Krillion, Deep Cut, Rare, Schooler, and Plankton. Both supplied reference packs preserve every canonical entry and score. The library now exposes **3,188 reviewed categories**, with **3,113** in ordinary selection and **3,104** in Puffer. Historical banks are retained for compatibility, but overly narrow and unreliable categories cannot enter new random games. A full integrity scan covers **5,703,098 shipped canonical rows and 2,092,737 aliases**, including historical data. Exact inventory coverage and editorial repairs are documented in [QUESTION-AUDIT.md](QUESTION-AUDIT.md). Counts overlap between categories. Inventories are finite and can miss a valid answer; Daily and Puffer stop on exhaustion instead of repeating. Scores remain editorial familiarity estimates rather than measured player choices or Krillion's private grading.

## Estimated score curve

Final results include a model-based score distribution, the player's marker, and the estimated percentage of scores strictly below theirs. These are not live player statistics. The requested model combines seven question outcomes (0, 10, 30, 60, 85, 100 points) across assumed casual/regular/experienced profiles with 24%/61%/15% weights. Conditional question outcomes are independent within a profile; the shared profile creates variation between players. Exact discrete convolution produces the percentiles. Only the plotted line is smoothed.

The modeled mean is 264.8975 points and standard deviation is about 84.31. A score of 230 beats about 34.54%; 350 beats about 83.13% under these assumptions. These parameters are editorial estimates; no player dataset was used to fit them, and they do not adjust for a particular day's question difficulty. The score-curve disclosure and copied result both identify the estimate. The full probabilities and implementation are in `benchmark.js`; five tests verify mass, support, expectation, strict tie handling, boundary behavior, and the requested mean near 265.

## Run

The built browser bundle is included. Python 3 and a modern browser are sufficient:

```sh
python3 -m http.server 4173
# Open http://localhost:4173
```

To edit source and rebuild, install Node.js dependencies:

```sh
npm install
npm run build
npm test
```

The development live preview retains practice progress across automatic reloads in session storage, so visual edits do not restart a dive.

Use HTTP(S), including the local server, for play: modern browsers block the lazy answer module on `file://` pages. All paths are relative, including artwork, scripts, and invite links. Home and the library use category metadata only. Legacy answer rows are deferred; new banks are fetched separately as deterministic gzip files when selected. The 47 new files total about 9.2 MB compressed, and a dive loads only the banks it needs. The first question clock starts after loading and warming the matcher. Puffer Party prepares the current and next banks before their fuse starts. The 1,974 new banks add about 5.7 MB compressed in separate files; the browser retains at most 16 hydrated new banks rather than accumulating every prompt played. No external trivia API is queried during play.

## Rendering and controls

The home screen loads just the sky asset and uses quiet open water. Gameplay moves through a vertically positioned world, including vegetation-free shallow art, sunken court ruins, bioluminescent trench walls, and amber/violet hadal walls. Scenery stays at fixed world coordinates as the camera descends. Local edge masks blend neighboring scene joins; no global dark overlay covers gameplay. The visual zone thresholds are 0, 200, 650, 1,500, and 3,000 metres, intentionally earlier than the reference to make multiple scenes accessible to ordinary scores. The original ten metres per point is preserved. Cached scenery tiles and a cached viewport avoid repeatedly scaling stationary art; ambient animation uses a paced 30 fps, while descents can render at 60 fps. The backing canvas uses one pixel per CSS pixel instead of a high-DPI multiplier. Hidden tabs stop scheduling frames, and reduced-motion mode renders only when the scene changes. `?perf=1` on localhost exposes optional render-cost diagnostics.

Draft saves are debounced; boundary changes and page exit flush progress immediately. The countdown keeps the input usable. Enter submits an answer and continues a completed round; animation never locks the next button. Timer progress uses a transform instead of repeatedly changing layout width.

## GitHub Pages

Serve the root of `main` using **Settings → Pages → Deploy from a branch**. There is no backend build. The empty `.nojekyll` file disables Jekyll processing. Daily, Practice and Endless need no backend. The new Puffer Party uses the configured Firebase project on its no-cost Spark plan; its public web configuration is bundled with the client.

## Online rooms

The new room service uses Firebase Authentication and Realtime Database. Database rules require the Google sign-in provider, bind player writes to their authenticated UID, protect request/response mailboxes and reserve game-state writes for the current host. Public directory entries omit private rooms and become stale when the host stops updating them. Google email and sign-in tokens are never sent to players. Daily, Practice and Endless remain playable as guests.

The host validates answers and timers. A disconnected player has a 30-second grace period; a connected member can claim an offline host role after that grace. This remains host-authoritative play, so it cannot prevent a malicious host from editing their own room. Backend setup, retention details and release checks are in [PARTY-BACKEND.md](PARTY-BACKEND.md).

## Main files

- `app.js`: screens, local progress, settings, timing, sharing, answer browser.
- `engine.js`: daily selection, persistent practice draws, tiers and party rules.
- `answer-matching.js`: exact aliases, post-submit correction proposals, word alignment, abbreviations and bounded compiled-bank caching.
- `benchmark.js`: explicit assumed skill profiles, exact seven-question distribution, estimated percentiles, and the results curve.
- `ocean.js`, `depth-world.js`: continuous world projection, cached environment tiles, moving ruler ticks and landmarks, sky, waves, and ambient life.
- `case-questions.js`: 80 original questions and explanations with a source link to each of the 16 published reviews.
- `endless.js`, `endless-engine.js`, `endless.css`: four-choice challenge, shuffled decks, consecutive-answer rules, persistence, and the requested animated Easter egg.
- `descent.css`: revised surface composition and compact navigation menu.
- `dive.js`: full-viewport HUD, prompt, answer dock, and round feedback.
- `results.js`, `answer-bank.js`: final dive log and shared large-bank browser.
- `polish.css`: responsive presentation for home, gameplay, results, menus, and the ocean preview.
- `sprites.js`, `assets/*.svg`: original code-native pixel creatures and marks. `assets/*-law.png` and `assets/hadal-pixel.png`: separate pixel-art environment layers, blended by depth. `assets/kelp-pixel-loop.png`: an earlier eight-frame plant sheet retained as an asset; it is no longer loaded or drawn because the user requested less vegetation. Final generation prompts are recorded in `assets/generation-manifest.json`.
- `data.js`: original curated prompts, aliases, and scores.
- `question-catalog.js`, `question-answers.js`: generated category metadata and compact shared answer rows; the large table is bundled separately.
- `question-data.js`, `question-bank-loader.js`, `fun-bank-loader.js`: lazy loading, per-bank gzip decoding, hydration and catalogue compatibility.
- `question-library.js`, `question-library.css`: searchable mixed and specialist categories.
- `fun-question-catalog.js`, `fun-bank-manifest.json`, `question-banks/`: broad-category metadata, count/hash/ranking records and compressed answer banks.
- `scripts/build-fun-banks.py`, `data-snapshots/rework/`: deterministic broad-bank generator and attributed factual snapshots.
- `scripts/build-variety-banks.py`, `variety-question-catalog.js`, `variety-bank-manifest.json`, `variety-banks/`, `data-snapshots/variety/`: curated factual category relationships, compressed banks and integrity records.
- `question-selection.js`, `question-history.js`: balanced group selection and browser/account prompt history.
- `scripts/build-daily-schedule.mjs`, `daily-schedule.json`, `daily-schedule.js`: append-only daily appointments; exhausted schedules stop instead of wrapping.
- `scripts/build-question-catalog.py`, `catalog-manifest.json`, `data-snapshots/expansion/`: reproducible expansion, per-category counts/rankings and attributed source snapshots.
- `airline-bank.js`, `vehicle-bank.js`: the exact user-provided examples and additional local aliases.
- `party.js`, `party-rules.js`: authenticated room lifecycle, presence, host transfer and ready/rematch rules.
- `party-view.js`, `party.css`, `assets/party-court.svg`: original courtroom arena, lobby, answer dock and chat.
- `cloud.js`, `firebase-config.js`, `database.rules.json`: lazy Firebase client, public web identifiers and server authorization rules.
- `tests/database-security.mjs`, `tests/party-network.mjs`: real RTDB emulator authorization and multiplayer connection tests.
- `tests/engine.test.js`: meaningful date, matching, scoring, timing, turn, life, and disconnect checks.

VT323 is bundled under the SIL Open Font License. PeerJS’s MIT license is included in `vendor/`.

Future Counsel: https://futurecounsel.org/ · Reference: https://krillion.io/

## Latest validation

The 23 October quality review adds policy, saved-queue migration, exact source coverage, clockwise turns and current-holder typing regressions. Run `npm test`, `npm run build`, `node scripts/audit-questions.mjs` and `npm run test:security`. The emulator suites exercise membership/ownership, three-player network play, host migration, ranked results, private preparation, synced careers, exact account honors and persisted Google sign-in. Local Playwright checks cover laptop and narrow windows, compact drafts, accepted-answer placement, reduced motion and the 20 fps ambient cap. See [QUESTION-AUDIT.md](QUESTION-AUDIT.md) for scope and limitations.

## Google sign-in

`auth-config.js` contains the public web client ID created for Councillion in Google Cloud project `dark-automata-360415`. Authorized JavaScript origins are `https://gavinleiner.github.io`, `http://localhost:4173` and `http://localhost` (origins have no path). No client secret is stored in this repository. The official Google Identity Services button loads on demand. The Google response is checked for RS256 signature, audience, issuer, nonce and expiry, then immediately exchanged with Firebase Authentication. Firebase stores its renewable session in IndexedDB, with local/session storage fallbacks, and restores it on return visits. Raw Google ID tokens are no longer kept in app-owned storage. An unexpired legacy tab token is migrated once. Ordinary one-hour token expiration refreshes the session rather than signing the player out. Sign-out removes durable authentication and propagates across tabs. Negative token tests cover tampering, wrong audience/issuer/nonce, expiry and unknown keys.

Daily, Practice and Endless have optional identity. Puffer Party requires a current Google identity at the screen and session-method boundaries; signing out, switching Google accounts or losing authorization closes the active room connection. The one-device guest entry is removed. Progress remains on the current browser; daily progress is not synchronized. Firebase verifies the Google provider and account binding before party access. Nickname, buddy and default room visibility are remembered separately per Google account on this browser; a profile editor and returning-player greeting use those preferences. [privacy.html](privacy.html) explains storage and third-party requests. Google Auth Platform branding uses the public game and privacy URLs; the external app is published for external players. A real Google sign-in was verified on the production site on October 21.

## Descent update

The camera now accelerates into a timed fall and settles over roughly 2–3.8 seconds, while the diver pitches and drops slightly. The world traverses 1.1 viewport heights by 200m, 2.7 by 650m, 5.2 by 1,500m, and 8.4 by 3,000m. A screen-composited local lantern follows the little shrimp; deep wall scenes frame clear open water. Motion preferences disable the fall and lantern pulse. Animations never lock the next-question button.

## Forgiving answers

Accent, punctuation and case normalization happen first. Exact names, curated nicknames and recognized abbreviations submit immediately. Plausible misspellings and reordered words are proposed only after Enter/DIVE/SEND, never while typing: the input is filled with the canonical answer and a “Did you mean …?” message asks for another submit or an edit. Editing and turn/category changes clear the proposal. Timer expiry may submit text already in the input, including a previously shown correction; it never creates a new fuzzy correction. The same controller handles Daily/Practice and Puffer.

A shared word cannot rescue an unrelated phrase: `locals coffee`, `global shoe`, `locals tikka` and `diamond knife` are rejected. Every query word must match plausibly; multiple genuine typos such as `dimond swrod`, `global warmign`, `climat chnge` and `chiken tikka masla` still receive suggestions. If several plausible candidates remain, the best score wins, with familiarity and alphabetical tie breaks. Sequel numbers remain distinct. Confirmed corrections receive full canonical points. The interaction was checked against Krillion’s free daily round on October 22; its server-side matcher is not public, so this is an independently tested implementation of observed behavior, not a claim of identical hidden logic.

The previous party used a client-only Google gate and PeerJS. Puffer Party now uses Firebase-enforced Google membership. The 71 authorization checks and three-identity network test pass against the real Realtime Database emulator; real Google login, live room hosting, rule changes, visibility and chat were also verified. The public Firebase key is restricted to the game’s web origins and five Firebase/Auth APIs. See [PARTY-BACKEND.md](PARTY-BACKEND.md).

## No-repeat limits

Prompt history is local to this browser and Firebase identity. Clearing site storage or using a different browser/device does not carry that history over. Room state also keeps seen IDs so a host transfer or rematch does not reset the room. A participant joining an already active category may already have seen that category; their reported history excludes future draws. This release does not claim an infinite supply or global cross-mode/cross-device deduplication. Its guarantees are no duplicate IDs within the published Daily schedule and no silent recycling of known Puffer history.

## Shared entrance

The main application now starts behind an animated, full-screen pixel courthouse entrance. Guests enter the configured shared phrase; a restored, verified Firebase Google session skips the phrase automatically. The game bundle and gameplay timers do not start before admission. The phrase is checked locally against a digest and is never saved in browser storage or sent to Firebase. Guest admission lasts for the current page; reloading as a guest asks again. Google sign-out relocks the entrance across connected tabs, and an in-progress solo timer pauses while that page is locked. The reference-based courthouse artwork is animated with a transparent, 20 fps fish-and-bubble layer that stops after admission and while the tab is hidden. Typing sparks, the rejection shudder, green unlock state and sinking transition respect reduced motion.

This is a courtesy entrance lock, not secure private hosting: GitHub Pages and this repository still serve public static files. Firebase's Google-only membership and verified owner rules remain the actual authorization for multiplayer and owner controls. `boot.js` loads the lightweight entrance before `game.bundle.js`; `tests/entrance.test.js` and the Auth-emulator browser tests cover admission, restoration, logout and races. `entrance-preview.html` is a local-only, ignored design preview and is not deployed.

## Saved profiles and moderation

The verified Google account `gavin@theleiners.com` is the sole game owner. Its Owner’s Bench opens from the account panel, Puffer setup, or the arena. It can view active public/private rooms, start/rematch, change visibility, remove players, end a match without a ranked result, close rooms, and apply eight-second cosmetic effects. Exclusive owner titles are SUPER ADMIN, THE OWNER and FINAL AUTHORITY. The exact verified Google account `logan.lewis@student.nhcs.net` receives VICE PRESIDENT as its one text banner and keeps ordinary player permissions. The exact verified Google account `gavin.leiner@student.nhcs.net` receives the lowercase `pres` text banner and keeps ordinary player permissions. The regular rank image is unchanged. Protected `accountHonors` records are provisioned on Google session restoration/sign-in; email and role checks use signed Firebase token claims, never editable nicknames or cosmetic selections. `scripts/update-admin-rules.mjs` maintains the server rules; `tests/admin-network.mjs` checks denied forgery attempts, separate VP permissions, room control and no-contest results.

The account panel edits the display name, buddy and default room visibility. These preferences and local game progress do not sync between devices. Keep shared-laptop sign-out available; clearing site data/private browsing can remove saved sessions. `tests/auth-browser.mjs` uses a disposable Firebase Auth emulator and fresh browser profile to verify a Google-provider session, refresh, a full process restart, cross-tab sign-out and a signed-out restart. It never reads existing browser profiles. `npm run test:security` runs this with the RTDB checks and multiplayer flow; set `CHROME_BIN` if Chrome is elsewhere.

`moderation.js` normalizes accents, common lookalikes and invisible separators, then rejects slurs/abusive names before preferences or membership are saved. The database independently validates member, host, directory, state-player and chat names. Names allow 1–16 Latin letters/numbers and basic punctuation so unsupported Unicode cannot evade server checks. Chat has a limited abusive-language filter, and hosts retain removal controls. This is not an exhaustive language classifier. Names such as Class Act, Scunthorpe and Niger are regression-tested against substring false positives. Rebuild shared validators with `node scripts/update-moderation-rules.mjs`; `--check` verifies they match the shipped policy. Publish rules separately through Firebase after emulator validation.

## Puffer Founding Court

The familiar home layout, pixel creatures and passing puffer are retained. Rock platforms anchor player buddies to a dedicated pixel-art seabed arena, with detailed reef borders, courthouse fragments and small law props and appear only for present players. Slow bubbles, drifting silt, shifting rays, creature blinks, tentacle and lure movement, occasional rank glints and a soft turn light add small ambient details. Joins and heart changes trigger brief reactions once per event. Rocks stay fixed; every added animation respects reduced motion. Google accounts have a synced Puffer career, one automatic rank image beside each player name, one unlocked achievement title below it in the rank’s color and three small waiting-room stat trackers. The cabinet contains 88 achievement titles across the whole game; exactly one can be equipped. The image always represents the current rank; players cannot replace it. Profile editing opens in a dialog. Five earned rating tiers have three divisions below High Court; five rated placements reveal the rank. The rank image always represents the recorded rating. Locked achievements cannot be equipped by the UI or displayed through a forged cosmetic selection.

Ranked uses two starting hearts, five maximum hearts, 600 points per restored heart and an eight-second minimum turn. New 1v1 and Multiplayer rooms all use Ranked rules. Normal completed matches record W/L. Ranked rating requires a final survivor, 15 seconds, two accepted answers and two answering players; every eligible rematch with the same friends counts. Waiting nameplates show three chosen career statistics. Rating starts around +40 for an evenly matched win or −18 for a duel loss. Average opponent strength uses a 400-point expectation scale; multiplayer placement adjusts losses from a base 12–24. Eligible ranked-win streaks add +8 per prior win, capped at +24. A genuine final one-heart duel with an accepted answer from both finalists and eight seconds of play adds +8 to its winner and halves the runner-up loss; forfeits have a minimum 28-point loss and no discount. Total movement is capped at ±64. Rarity scores never directly increase rating. Spectators receive no receipt; active departures are forfeits when the match completes. A host removal during Ranked, cancelled countdown, or no final survivor produces a no-contest. Records start with this release; previous matches were not captured.

The current host seals `matchResults/{matchId}` only after publishing the matching ended state and participant stats. Immutable `playerRecords/{uid}/{matchId}` copies drive all aggregates; duplicate retries and host migration cannot increment a result twice. `playerBanners/{uid}` contains only owner-editable appearance fields. Google users may read an individual player's Puffer career/banner, but cannot enumerate the root collections. The host remains the game referee on the no-cost Spark architecture: these rules prevent direct edits of sealed results and unauthorized writes, but a modified host can falsify gameplay before sealing. This is suitable for friends, not a cheat-proof public competitive ladder.

Only the current answerer shares a draft. Updated clients keep prepared off-turn text private, and the UI ignores stale or non-holder drafts. A single persistent, compact bubble gently interpolates typing and deletion without a LIVE label or rebuilding player cards. Updates are throttled to 150ms, with a 5-second connection heartbeat; draft text is capped at 120 characters, moderated, scoped to game/category, hidden after 12 seconds without updates, and removed on disconnect/leave/match end. Drafts are not copied into match records. Actual submissions remain turn-checked. The seated ring adjusts to the space between a long question and the controls; accepted-answer bubbles wrap and scroll without truncating their text. Motion preferences disable the existing passing animation and ambient movement.

`tests/party-career.test.js` checks rating, unlimited friend rematches, eligibility, aggregates, badge locks and cosmetic validation. `tests/party-ranked-network.mjs` exercises separate Google-provider RTDB clients for drafts/deletions, sealed results, synced W/L, idempotence, rematches, banner writes and denied forgeries. Run them with `npm test` and `npm run test:security` (Java 21 required). `scripts/update-puffer-rules.mjs` maintains the additive database rules; deploy `database.rules.json` with the client. Protocol 4 rooms require refreshed clients; existing protocol 3 rooms remain supported by backend rules.

The title cabinet now contains 88 concrete achievements across Daily, Practice, Endless, depth/score and Puffer. The image beside a name is always that player's rank. Six AI-generated transparent pixel badges cover Unranked (five placements), Bronze (0–799 CR), Silver (800–999), Gold (1,000–1,199), Platinum (1,200–1,599), and High Court (1,600+). High Court characters wear a small matching crest with a `MAX RANK` label; demotion removes it automatically. The original generated assets and full prompts are under `assets/party-badges/`. Exactly one unlocked text title may appear below it, using the rank's color. Solo summaries are stored locally for guests and claimed once when a Google account connects; `soloRecords/{uid}/{game}` stores immutable numeric summaries under owner-only writes. They never change Puffer rating. Daily receipts use a stable date key; practice/case receipts use stable run identifiers. The case shortcut never counts as a legitimate challenge clear. These are client-reported solo achievements, not independently verified scores. Full typed answers and question text are not uploaded into these summaries.


Puffer seating follows the shared roster clockwise around the oval. Only the first player is randomly drawn; later turns follow the circle and skip eliminated players. Creatures and occupied platforms are larger. The host chooses an equal-chance first player during the countdown; all clients reveal that same choice in a short puffer drawing animation. The friend leaderboard subscribes to saved per-player Puffer records, using names from current and previously shared rooms; it does not enumerate all Google users or expose email. The pre-game screen separates saved name/buddy/profile customization from 1v1/Multiplayer quick play, hosting and joining.


The Puffer entry uses compact stacked identity/play/host/join panels on the left, public rooms on the right, and a selected-character preview on the seabed between them. Table sizes (1v1 or Multiplayer up to six) are remembered locally and apply to quick matchmaking and newly hosted rooms. The player-facing game now uses Ranked rules exclusively; legacy Casual receipts remain in historical statistics.

The Clerk, squid and angler use restrained AI remodels with their familiar shapes. The approved Clerk has no tail. `party-buddy-art.js` animates the original PNG regions, with blinks, individual squid tentacles and the angler's lure. Full generation and tail-removal prompts are in `assets/party-buddies/ai-buddy-prompts.txt`. The unchanged Counsel shrimp and all existing animations remain in place. Setup shares the arena's slow fish, bubbles, silt, light rays and reef glints; reduced-motion preferences disable added motion.


## Quiet arena motion

Puffer setup and every arena phase now share `party-ambience.js`: a low-resolution transparent canvas with slow fish schools, jellyfish, seabed crabs, small anemones, drifting paper, bubble vents, silt, caustics and tiny legal-prop glints. Motion is capped near 20 fps, pauses in hidden tabs and stops on navigation. Both system and game reduced-motion settings are respected. The approved arena background, home and dive art remain unchanged. The browser tab icon uses the established Counsel shrimp artwork in `assets/favicon-shrimp.svg`.


## One shared Daily

Daily is a published, append-only calendar of seven prompts per date, with the same order for every account and browser. Everyone uses the America/New_York calendar date and a midnight Eastern reset, including daylight-saving changes. Practice/Puffer history, Google account, browser locale and randomness do not personalize Daily. A saved Daily resumes only if its mode, date and all seven ordered IDs match the published set; stale or mismatched saved runs restart on the shared set. Valid progress and completed results remain intact. Cross-time-zone regression tests cover the reset boundary and winter offset.


## Content review and retired questions

The 2026-10-23 editorial policy in `question-quality.js` admits concrete, familiar categories to ordinary play. Narrow regional city questions, restricted filmographies, edition-heavy franchise decks, contaminated cast-credit character categories and ambiguous dictionary categories are archived. They are hidden from the library and cannot be selected by an old practice link, saved practice queue or a repaired host queue. Old source files remain for historical compatibility and source inspection. The shared Daily calendar has an explicit quality revision from 2026-10-23; every browser receives the same revised seven IDs, and the existing shared-run validator discards mismatched old Daily sets. No prompt IDs silently cycle.

The bot test route was removed at the user's request. Old `#party?test=bots` links now open normal Puffer setup. No bot Firebase rooms or test records existed to remove. `party-typing.js` owns the one current-holder bubble and respects reduced motion. Preparation is local until your turn; existing database membership/ranked authorization stays unchanged. Small warm sand grains sway by less than two screen pixels over a slow cycle, behind stationary rocks and characters. See `QUESTION-AUDIT.md` for the source audit, finite coverage and reproducible repair steps.
