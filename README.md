# Councillion

Future Counsel’s pixel ocean trivia game, inspired by Krillion. Original client code, code-native pixel sprites, AI-edited environmental background art, and bundled typography. The environmental art follows the reference composition with small legal details; logos, labels, controls, and fish sprites remain code-native.

## Play

- **Daily Dive:** seven shared prompts, a three-second preview, then 25 seconds to answer. Rejected attempts can be retried. Text left at zero is submitted automatically. Progress and completed results are saved in this browser.
- **Unlimited Practice:** seven random prompts, no daily limit.
- **Airline reference round:** open `#practice?pack=airline-extras` to begin a practice dive with the user’s exact 111-answer example. `#practice?pack=no-wheels` starts with the imported 1,194-answer vehicle example.
- **Puffer Party:** a private four-letter code joins 2–6 players across devices. Two starting hearts, up to five. Earn 600 rarity points to restore a heart. The puffer has a random shared fuse; each new turn gets at least eight seconds. Answers cannot repeat in the current category.
- **One Device:** the same party rules on one screen; pass the keyboard.
- **Ocean preview:** `#biomes` uses the gameplay renderer with a depth slider and slow descent. Five named zones change scenery, lighting, ambient life, and colors.
- **Results:** the full dive unlocks a seven-column log, score guide, searchable answer accordions, rarity filters, and pagination. Answer banks are hidden during all seven prompts.

Visible rarity families follow the supplied image: Krillion, Deep Cut, Rare, Schooler, and Plankton. Both supplied reference packs preserve every canonical entry and score. Other packs use independent editorial tiers, not measured player-frequency statistics. Answer banks are finite; otherwise valid answers may be absent. See [RESEARCH.md](RESEARCH.md) for verified reference behavior and known differences.

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

## GitHub Pages

Serve the root of `main` using **Settings → Pages → Deploy from a branch**. There is no backend build. The empty `.nojekyll` file disables Jekyll processing. No API key or paid service is needed to play.

## Online rooms

The vendored PeerJS 1.5.5 client uses its public broker to establish WebRTC data connections. The host browser validates turns, matching, duplicates, lives, and deadlines. It must remain open; closing or reloading it ends the room. Room codes are invitations, not strong access controls. Names and game state are visible to other room members. No microphone, camera, account, or email is requested.

Some managed networks and restrictive NATs block the broker or direct WebRTC connections. This static deployment has no managed TURN relay, persistent game server, public matchmaking, host migration, or reconnect system. Daily Dive, practice, and one-device party still work independently. A dedicated game backend would be the next upgrade for more reliable cross-network multiplayer.

## Main files

- `app.js`: screens, local progress, settings, timing, sharing, answer browser.
- `engine.js`: date selection, answer matching, tiers, and party rules.
- `ocean.js`: moving sky, waves, open water, particles, fish, courtroom landmarks, and camera.
- `dive.js`: full-viewport HUD, prompt, answer dock, and round feedback.
- `results.js`, `answer-bank.js`: final dive log and shared large-bank browser.
- `polish.css`: responsive presentation for home, gameplay, results, menus, and the ocean preview.
- `sprites.js`, `assets/*.svg`: original code-native pixel creatures and marks. `assets/*-law.png` and `assets/hadal-pixel.png`: separate pixel-art environment layers, blended by depth. `assets/kelp-pixel-loop.png`: eight animation frames in one transparent sheet. Final generation prompts are recorded in `assets/generation-manifest.json`.
- `data.js`: original curated prompts, aliases, and scores.
- `airline-bank.js`, `vehicle-bank.js`: the exact user-provided examples and additional local aliases.
- `party.js`: host-authoritative room lifecycle.
- `tests/engine.test.js`: meaningful date, matching, scoring, timing, turn, life, and disconnect checks.

VT323 is bundled under the SIL Open Font License. PeerJS’s MIT license is included in `vendor/`.

Future Counsel: https://futurecounsel.org/ · Reference: https://krillion.io/
