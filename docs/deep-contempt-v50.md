# Deep Contempt · private expedition preview

A complete cooperative extraction expedition for 2–6 crew, with a separate submarine hub and six connected courthouse chambers. Human players and bots share directional movement, wall collisions, oxygen, stamina, evidence-carrying rules, rescue interactions and enemy simulation. The Puffer Games entry is appended after Chess, retaining the existing nine game positions.

The crew can secure 330 evidence and return early, or restore both seals and retrieve the two-person final gavel. Taking the gavel wakes the Judge and starts a 100-second lockdown. All crew at the airlock, or two-thirds of the surviving crew calling extraction, starts a ten-second departure. The expedition ends with evidence secured, returned/lost crew, rescue contributions, elapsed time and an expedition grade. Scores are separate from Puffer rank.

The Bailiff follows running/dropped-object noise. The Clerk moves when unobserved and freezes in a crew lamp beam. The Judge wakes for lockdown and hunts the crew. Downed crew can be rescued by holding interaction; running out of oxygen and abandoning someone at departure have consequences. The dock restores air and gradually restores health. Two field air tanks provide additional refill points.

## Controls

- WASD / arrows: move; Shift: sprint.
- E: pick up, join a heavy carry, bank evidence, hold to restore a seal/refill air/rescue; at the dock after quota, call extraction.
- F: lamp; point the mouse to aim the beam.
- Q: drop; Space: ping; M: chart.
- A lamp, reserve tank or soft-soled boots can be equipped before the expedition.

## Artwork and motion

Six original AI-generated scenes and a three-enemy transparent sheet are in `assets/deep`, with full prompts, provenance and SHA-256s in `art-manifest-v50.json`. The room boundaries are shared geometry, rather than overlapping decorative panels. Existing Councillion character art is reused. The hub mascot extends the established small SVG sprite system.

The camera eases through the connected world. Runtime motion adds breathing/walking sprites, drifting sediment, water caustics, bubbles, localized lights, ray-cast lamp cones, enemy reactions, tethered heavy carries, pings, rescue/evidence particles, arrival titles, descent and ascent. Canvas rendering is capped at 30 fps and a 1280-pixel backing width, pauses while the tab is hidden and disposes on navigation. Saved/OS reduced motion suppresses decorative movement, particles, shakes and CSS transitions. Essential world motion remains playable.

## Privacy and transport

Only exact verified Google emails `gavin@theleiners.com` and `gavin.leiner@student.nhcs.net` can access `deepPreviewAccess` or `deepRooms`. Other visitors see Coming Soon and have no play controls. Room requests are six-letter codes, not public directory entries. The rules also reject other providers, unverified lookalikes, state writes from guests, impersonated inputs and out-of-range input.

`DeepSession` uses the existing Firebase SDK connection and signed session. It sends bounded directional controls at 10 Hz, runs the trusted captain simulation at 20 Hz and sends resumable snapshots at 5 Hz. Rendering interpolates snapshot positions. A departing/disconnected captain can hand off to another authorized crew member. This follows the site's existing trusted-host model; it is not a dedicated authoritative game server. Auth token refresh for the same account preserves a connection being opened. Switching accounts closes the old session.

The localhost-only bot showcase is served by `npm run dev:deep`, at `http://localhost:4201/__deep-bots`. It is explicitly separate from the production Google gate, with play/pause/restart, playback speed and selectable crew cameras. Bots use A* paths through the real collision graph; they do not teleport or receive free objectives. A bot crew may fail an expedition.

## Verification

- `npm run test:deep`: exact account gate, collision/input boundaries, ready requirements, two-carrier banking, held rescue/seal interactions, oxygen, extraction voting, enemy behaviors, snapshot restoration, path reachability and complete 3–6 bot runs.
- `npm run test:deep:network`: Firebase emulator checks exact signed-claim privacy, unauthorized/invalid writes, two authorized humans and four bots, shared movement and lamps, captain transfer and reconnect with preserved evidence.
- `npm run test:deep:browser`: four complete bot expeditions at 1366×768, 1024×600, 1280×720 and 390×844; human keyboard movement/lamp/ping, chart, bounded HUD, reduced motion, lifecycle cleanup, public Coming Soon gate and a four-times CPU-throttled scene.
- Repository-wide unit tests and build/audits run before publication.

Actual Chromebook hardware and a school-managed network were not available; verification uses Chromium at Chromebook resolutions and CPU throttling. The fixed six-chamber expedition is the initial playable preview, not an unlimited procedural campaign.
