# Puffer Party backend and validation

## Activated setup — October 22, 2026

- Firebase is configured in the existing Google Cloud project `dark-automata-360415` (`My First Project`).
- The console confirmed **Spark / No-cost ($0/month)**. No billing upgrade was made. Optional Analytics is disabled.
- The `Councillion` web app is registered; its public browser identifiers are in `firebase-config.js`.
- Google Authentication is enabled. Anonymous authentication is disabled. `localhost` and `gavinleiner.github.io` are authorized domains.
- Realtime Database was created in locked mode in `us-central1` at `https://dark-automata-360415-default-rtdb.firebaseio.com`. The tested `database.rules.json` was published through the console.
- A real Google sign-in, Firebase token exchange, public room creation/listing, private visibility, host rule updates and private-room chat were verified in the browser. Unsigned directory access returned **401 Permission denied**.
- The Google Identity Services client has three authorized JavaScript origins: `https://gavinleiner.github.io`, `http://localhost:4173`, and `http://localhost`.

## Public Firebase key and GitHub alert

GitHub secret-scanning alert #1 identified the intentionally public Firebase browser key. The Cloud Credentials page was inspected and restrictions were saved: website referrers are limited to `https://gavinleiner.github.io/*` and `http://localhost:4173/*`; allowed APIs are Identity Toolkit, Token Service, Firebase Management, Firebase Rules and Cloud Logging. Generative Language and unrelated APIs are excluded. The restricted key was verified with the actual Google/Firebase room connection.

Alert #1 was resolved as an intentionally public key (`wont_fix`) with this rationale; secret scanning remains enabled. No password, service-account private key, OAuth client secret or user identity token was committed. Firebase documents browser API keys as public configuration, with data authorization enforced by Authentication and database rules: https://firebase.google.com/docs/projects/api-keys .

## Browser verification

The arena was inspected at 1366 × 768 and 502 × 600. The laptop layout keeps the ring clear of lobby controls; the ocean canvas is suspended behind the party arena. Live host settings, visibility and chat were exercised against the actual backend. Three distinct Google-provider identities were used in the emulator network test for full multiplayer play; this is separate from the one-account live Google test.

Reference research included joining Krillion quick play, submitting an accepted `Thor` answer to its Avengers category, watching the puffer pass, category changes and heart loss/elimination. Its existing public/private room, readiness, spectator, host settings, chat, fuse and rematch flows informed this original implementation. No reference artwork or source code is shipped. Councillion does not implement Krillion’s new rated matchmaking or claim identical artwork, content or behavior.

## Architecture

The Google Identity Services token is verified locally, then exchanged with Firebase Authentication using `GoogleAuthProvider.credential` and `signInWithCredential`. Firebase verifies Google membership on the server. Identity tokens and emails are never sent to other players. Account matching checks the Google provider identifier, so a saved Firebase session for another Google account cannot be reused.

Realtime Database contains a Google-only public directory and per-room metadata, member presence, host-owned game state, per-user request/response mailboxes and chat. Players can only write their own membership, requests and chat. Only the current host writes game state. A disconnected host has a 30-second grace period before another room member may claim the host role. This is host-authoritative play: it does not prevent a malicious host from editing their own room's game state.

Private rooms are omitted from the public directory. A room's code is an invite code, not a password. Google-authenticated people who know it may join. A stale directory entry stops appearing after 45 seconds. Stored room records do not automatically expire; the privacy notice states this explicitly.

`cloud.bundle.js` is loaded only when a signed-in user requests multiplayer. Daily and Endless do not load Firebase. The normal party deck uses 1,110 reviewed categories from the 2,242-category library. Entry uses metadata only; the current and next answer banks are fetched on demand. The host warms the matcher and holds the countdown or category transition until the upcoming bank is ready, so loading does not consume the shared fuse. New banks are separate gzip files; legacy rows retain their deferred loader. Room metadata includes the catalogue build so updated clients can explain a version mismatch. Host state writes send changed top-level fields instead of resending the entire category deck on every answer. The canvas ocean is suspended behind the dedicated party arena. Input drafts survive roster, chat and turn updates. Animations respect reduced-motion settings.

## Validation

- `npm test`: 85 checks, including core games, Google token validation, party rules, typing ahead, escaped names, chat drafts, the mixed deck and full library, lazy answer data and category integrity.
- `tests/database-security.mjs`: 33 checks against the actual Firebase Realtime Database emulator, covering unauthenticated/non-Google denial, UID ownership, host-only state, request privacy, chat impersonation/cooldown, private listings host migration, player removal and absence of repeated writes after removal.
- `tests/party-network.mjs`: three distinct emulator Google-provider identities exercising hosting, host rules, countdown, accepted answers, canonical duplicate rejection, spectator entry, chat delivery, private-directory removal, pop/victory, rematch host migration, player removal and absence of repeated writes after removal.
- `npm audit --omit=dev`: zero runtime dependency findings after the gRPC override. The cloud bundle includes only App, Auth and Realtime Database.

Run database checks with Java 21 on PATH:

```sh
npm run test:security
```

For both the authorization and network tests in one emulator session:

```sh
firebase emulators:exec --only database --project demo-councillion 'node tests/database-security.mjs && node --import ./tests/question-data.mjs tests/party-network.mjs'
```

A portable official Temurin JRE was downloaded under the parent task's `work/party-rebuild/` for these tests; it was not installed system-wide.

## Local preview

`http://localhost:4173/party-preview.html` is an ignored, local-only simulated art preview, clearly marked **ART PREVIEW / DEMO**. It does not create a public room and is not an authentication bypass. Use it to inspect arena layouts without creating an online room. It must not be deployed.

## Question history and fresh-category votes

The host-owned state retains `seenIds`; each client also records revealed prompt IDs under its Firebase identity in this browser. On joining, a client sends its known prompt IDs using the existing authenticated `ready` request envelope. The host validates them against the current catalogue and removes them from future draws without replacing a currently active category. A rematch rebuilds from unseen IDs; a new room starts with its host’s local history and merges joining members’ reports. No prompts wrap around when the remaining deck ends. History is self-reported for game variety, not an authoritative anti-cheat score record; there is no cross-device history sync.

Active survivors can send a vote using the same `ready` envelope, bound to the current round. Duplicate/spectator/stale votes do not count; at least two and at least half the active survivors must agree. A successful vote advances to an unseen category without changing hearts, and the next bank still loads before its fuse. No database rules, authentication scopes, API-key restrictions or paid services changed. Room state shares prompt IDs, not historical answers or past room codes. The privacy notice describes their storage.
