# Puffer Games and Under Oath

The surface’s Puffer Games entrance opens an underwater cove. `PUFFER_GAMES` in `puffer-games.js` is the selection registry. Add an entry there after implementing its route; the hall automatically adds coves rather than shrinking or overlapping existing games. Desktop holds five choices, compact screens three, phones one. Keyboard arrows, Home, End, Tab and Enter work. Animation can be paused, respects reduced motion, stops offscreen, and uses one capped canvas.

## Under Oath

Two to six Google-authenticated players share six cases. Each case uses a different family from the 24-question launch bank. The bank is original wording with linked sources for every real answer. Each new game draws a fresh balanced shuffle; no previous-player question history affects it.

1. A short briefing and read precede the 35-second private bluff phase.
2. The clerk shuffles player lies with the real answer. Matching lies merge. If fewer than four options exist, labelled-at-reveal house decoys fill the gaps.
3. Voting lasts up to 20 seconds. Players cannot vote for a lie they wrote. Owners and votes remain hidden until cross-examination. A witness who submitted the real answer is excused from voting.
4. Testimonies are exposed one at a time, with authors, fooled voters, a perjury/truth stamp and reactions at the witness stands. The truth appears last with its source.
5. Truth earns 1,000; each fooled vote earns the lie’s author(s) 500. The sixth case doubles points. Equal final scores share the win. These match scores do not change Puffer Court Rating.

All fake answers retain their wording. Exact truth aliases and conservative misspellings can recognize a genuinely known answer after submission; there are no truth suggestions while composing a bluff. Initials are accepted only if explicitly listed as real aliases. Display casing/punctuation is made consistent across voting options so the true answer is not identified by a formatting convention.

The scene artwork shares the Puffer Party palette and pixel density. Backgrounds are AI-generated raster art; text, controls, sprites and animations stay native. Prompt provenance: `assets/court-games/under-oath-art-v22.json`.

## Room protocol and privacy

Under Oath uses the existing host-refereed Firebase room protocol and Google-only database rules. Submissions, votes, private acknowledgements and the referee’s record use protected request/response branches. Public voting options contain only opaque IDs and text. Public reveal rows are released one at a time. The private referee record is revisioned and restored after host transfer. Actions must match the current match, round, phase timestamp and deadline; duplicate actions cannot rescore a round.

This has the same trust model as the other client-hosted courts: the room host is the referee, and source-backed questions ship in the application. It is not a server-side anti-cheat boundary.

## Development checks

- `npm run test:oath`: data, draw balance, private projections, timing, typo boundaries, duplicate lies, self-votes, stale requests, scoring and full six-case games.
- `npm run dev:oath`: local six-bot trial at `http://localhost:4180/__oath-bots`. Start with its Play button; pause, restart or change playback speed. This does not create an online room or write profile/rank data. `OATH_DEMO_PORT` changes the port.
- With the normal site on port 4173 and the bot server on 4180, run `node tests/puffer-games-browser.mjs` and `npm run test:oath:browser`. They cover laptop sizes, phone hub layout, future registry expansion, keyboard/motion controls, input focus, ready/unready, host controls, long choices and a complete bot game.
- With Java 21+ available, `npm run test:oath:network` runs six real Firebase emulator clients against the production rules, including private requests/responses, anonymous choices, sealed votes and referee handoff.
- `node build.mjs` rebuilds runtime bundles. No database rule expansion is needed for this mode.
