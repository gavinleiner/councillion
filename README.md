# Councillion

**Party rebuild staged:** the new arena and Firebase multiplayer are not deployed yet. Firebase is on Spark, but Google-provider activation, the database URL/rules, and real-browser verification are pending after browser control disconnected. See [PARTY-BACKEND.md](PARTY-BACKEND.md).

[Play Councillion](https://gavinleiner.github.io/councillion/) · [Explore the ocean](https://gavinleiner.github.io/councillion/#biomes)

Future Counsel’s pixel ocean trivia game, inspired by Krillion. Original client code, code-native pixel sprites, AI-edited environmental background art, and bundled typography. The environmental art follows the reference composition with small legal details; logos, labels, controls, and fish sprites remain code-native.

## Play

- **Daily Dive:** seven shared prompts, a three-second optional preview, then 25 seconds to answer. You can type immediately and submit early to start the clock. Rejected attempts can be retried. Text left at zero is submitted automatically. Progress and completed results are saved in this browser.
- **Endless Cases:** 80 close-reading questions based on all 16 Future Counsel reviews, including Gavin’s published opinions. Four shuffled choices; five consecutive correct answers clear a challenge. A miss resets the streak. New challenges continue without a play limit. The reviewed bank reshuffles after all 80, with no repeat within a cycle. Progress survives reloads.
- **Trivia Practice:** the original seven-prompt rarity game remains available in the navigation menu.
- **Airline reference round:** open `#practice?pack=airline-extras` to begin a practice dive with the user’s exact 111-answer example. `#practice?pack=no-wheels` starts with the imported 1,194-answer vehicle example.
- **Puffer Party rebuild:** Google-only public and private courtrooms, quick play, four-letter invites, five buddies, chat, spectators, ready/rematch controls and reconnect/host transfer. Defaults are six seats, two hearts, a five-heart cap and 600 points per restored heart. The host can adjust these between games, including up to 16 seats. A shared fuse and minimum turn time govern passing; answers cannot repeat within a category. Activation is still pending.
- **Ocean preview:** `#biomes` uses the gameplay renderer with a depth slider and slow descent. Five named zones change scenery, lighting, ambient life, and colors.
- **Results:** the full dive unlocks a seven-column log, score guide, searchable answer accordions, rarity filters, and pagination. Answer banks are hidden during all seven prompts.

Visible rarity families follow the supplied image: Krillion, Deep Cut, Rare, Schooler, and Plankton. Both supplied reference packs preserve every canonical entry and score. New packs use corpus familiarity with category-specific editorial overrides and selected 100-point discoveries, not measured player-frequency statistics. The 17-prompt daily/practice pool has 12,513 accepted entries; 15 new banks range from 32 to 2,450 entries. See [DATA-SOURCES.md](DATA-SOURCES.md) for scope, sources, licenses and the reproducible generator. Answer banks are finite; otherwise valid answers may be absent. See [RESEARCH.md](RESEARCH.md) for verified reference behavior and known differences.

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

Opening `index.html` directly also loads the bundled client, although multiplayer and invite links should use the hosted HTTP(S) site. All paths are relative, including artwork, scripts, and invite links.

## Rendering and controls

The home screen loads just the sky asset and uses quiet open water. Gameplay moves through a vertically positioned world, including vegetation-free shallow art, sunken court ruins, bioluminescent trench walls, and amber/violet hadal walls. Scenery stays at fixed world coordinates as the camera descends. Local edge masks blend neighboring scene joins; no global dark overlay covers gameplay. The visual zone thresholds are 0, 200, 650, 1,500, and 3,000 metres, intentionally earlier than the reference to make multiple scenes accessible to ordinary scores. The original ten metres per point is preserved. Cached scenery tiles and a cached viewport avoid repeatedly scaling stationary art; ambient animation uses a paced 30 fps, while descents can render at 60 fps. The backing canvas uses one pixel per CSS pixel instead of a high-DPI multiplier. Hidden tabs stop scheduling frames, and reduced-motion mode renders only when the scene changes. `?perf=1` on localhost exposes optional render-cost diagnostics.

Draft saves are debounced; boundary changes and page exit flush progress immediately. The countdown keeps the input usable. Enter submits an answer and continues a completed round; animation never locks the next button. Timer progress uses a transform instead of repeatedly changing layout width.

## GitHub Pages

Serve the root of `main` using **Settings → Pages → Deploy from a branch**. There is no backend build. The empty `.nojekyll` file disables Jekyll processing. Daily, Practice and Endless need no backend. The new Puffer Party uses the configured Firebase project on its no-cost Spark plan; its public web configuration is bundled with the client.

## Online rooms

The new room service uses Firebase Authentication and Realtime Database. Database rules require the Google sign-in provider, bind player writes to their authenticated UID, protect request/response mailboxes and reserve game-state writes for the current host. Public directory entries omit private rooms and become stale when the host stops updating them. Google email and sign-in tokens are never sent to players. Daily, Practice and Endless remain playable as guests.

The host validates answers and timers. A disconnected player has a 30-second grace period; a connected member can claim an offline host role after that grace. This remains host-authoritative play, so it cannot prevent a malicious host from editing their own room. The service is staged and not yet enabled in production. Full setup status, retention details and release checks are in [PARTY-BACKEND.md](PARTY-BACKEND.md).

## Main files

- `app.js`: screens, local progress, settings, timing, sharing, answer browser.
- `engine.js`: date selection, answer matching, tiers, and party rules.
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
- `airline-bank.js`, `vehicle-bank.js`: the exact user-provided examples and additional local aliases.
- `party.js`, `party-rules.js`: authenticated room lifecycle, presence, host transfer and ready/rematch rules.
- `party-view.js`, `party.css`, `assets/party-court.svg`: original courtroom arena, lobby, answer dock and chat.
- `cloud.js`, `firebase-config.js`, `database.rules.json`: lazy Firebase client, public web identifiers and server authorization rules.
- `tests/database-security.mjs`, `tests/party-network.mjs`: real RTDB emulator authorization and multiplayer connection tests.
- `tests/engine.test.js`: meaningful date, matching, scoring, timing, turn, life, and disconnect checks.

VT323 is bundled under the SIL Open Font License. PeerJS’s MIT license is included in `vendor/`.

Future Counsel: https://futurecounsel.org/ · Reference: https://krillion.io/

## Latest validation

59 automated checks cover game rules, both imported answer banks, the percentile model, vertical projection, scene accessibility, four-choice data integrity, deck recycling, streak resets, persistence, and the Easter egg. A 10,000-question simulation verifies that the legitimate answer key never forms the reserved sequence. Browser checks include a real five-correct challenge, shortcut animation, continuing to another challenge, and visible scenery changes during the actual seven-prompt game.

## Google sign-in

`auth-config.js` contains the public web client ID created for Councillion in Google Cloud project `dark-automata-360415`. Authorized JavaScript origins are `https://gavinleiner.github.io` and `http://localhost:4173` (origins have no path). No client secret is stored in this repository. The official Google Identity Services button loads on demand. A browser-local profile verifies the RS256 signature against Google’s rotating JWKs, audience, issuer, nonce and expiry before showing the connected identity. Session storage keeps the short-lived token; sign-out removes it. Negative token tests cover tampering, wrong audience/issuer/nonce, expiry and unknown keys.

Daily, Practice and Endless have optional identity. Puffer Party requires a current Google identity at the screen and session-method boundaries; signing out or expiry closes the active room connection. The one-device guest entry is removed. Progress remains on the current browser; daily progress is not synchronized. The new party backend uses a separate Firebase-authenticated session once activated. A future remote save/leaderboard must independently validate credentials on its backend. [privacy.html](privacy.html) explains storage and third-party requests. Google Auth Platform branding uses the public game and privacy URLs; the external app is published for external players. A real Google sign-in was verified on the production site on October 21.

## Descent update

The camera now accelerates into a timed fall and settles over roughly 2–3.8 seconds, while the diver pitches and drops slightly. The world traverses 1.1 viewport heights by 200m, 2.7 by 650m, 5.2 by 1,500m, and 8.4 by 3,000m. A screen-composited local lantern follows the little shrimp; deep wall scenes frame clear open water. Motion preferences disable the fall and lantern pulse. Animations never lock the next-question button.

## Forgiving answers

Accent, punctuation and case normalization happen first. Exact names and curated shorthand win. Otherwise, unique multiword initials (with or without small connecting words) are recognized; ambiguous initials are rejected. Common Lord of the Rings installment shorthand is explicit. Single-letter guesses and arbitrary partial prefixes do not unlock an answer. Longer names permit multiple typing mistakes, with lower costs for adjacent QWERTY keys, repeated/missing doubled letters, and transposed neighbors. A clear margin over competing candidates is required. The existing confirmation step shows the full intended answer before scoring; the setting can disable it. No points are reduced for a corrected spelling or abbreviation.

The previous production party used a client-only Google gate and PeerJS. This staged rebuild replaces it with Firebase-enforced Google membership. Database emulator tests pass, but production setup and browser verification remain unfinished; see [PARTY-BACKEND.md](PARTY-BACKEND.md).
