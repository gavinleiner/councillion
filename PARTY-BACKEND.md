# Puffer Party backend and release status

The rebuild is staged, not yet released to GitHub Pages. The existing public game is still on commit `487c893`.

## Verified setup

- Firebase was added to Google Cloud project `dark-automata-360415` (display name `My First Project`).
- The console showed **Spark / No-cost ($0/month)**. No billing upgrade was made.
- Optional Google Analytics was disabled.
- The `Councillion` web app was registered. Its public identifiers are in `firebase-config.js`.
- Authentication was initialized. Browser control disconnected while opening the Google provider; its enabled state is **not verified**.
- No Realtime Database URL has been entered. `cloud.js` deliberately refuses to open rooms while `databaseURL` is empty.

## Open key alert

GitHub secret-scanning alert #1 flagged the Firebase web API key in the configuration on this draft branch. The official Firebase documentation says browser keys are public by design when restricted to Firebase services, with data access controlled by rules. The actual key restrictions have not been inspected because browser control is disconnected. Do not dismiss the alert until the Cloud Credentials page confirms a Firebase-only allowlist and excludes Generative Language and other non-Firebase APIs. Do not treat removal from a file as revocation. No password, service-account private key, OAuth client secret, or user identity token was added with this configuration.

Guidance: https://firebase.google.com/docs/projects/api-keys

## Remaining activation work

Use the existing Firebase console tab for this project. The user has already approved Firebase terms, Google Authentication and protected party data on Spark. Do not request the same approval again, and do not upgrade billing.

1. Inspect the key restrictions and address the open key alert described above before releasing.
2. Enable the Google provider, with Councillion as the public app name and the existing support contact. Keep all other providers, including Anonymous, disabled.
2. Add `gavinleiner.github.io` and `localhost` to Authentication's authorized domains as needed. The existing Google Identity Services web client is `312825866122-hmkjuk1841ph7goh85bgav06p73pjua6.apps.googleusercontent.com`, in the same Google project.
3. Create a Realtime Database on Spark in locked mode. Publish `database.rules.json`, which has passed the emulator authorization tests. Never use public/test-mode rules.
4. Copy the database's actual URL into `firebase-config.js`. The Firebase web configuration is public; never put an administrative credential or OAuth client secret in this repository.
5. Test a real Google sign-in with the actual Firebase backend. Confirm unsigned requests fail, a signed-in player can host, and the directory updates. The existing Google profile login was tested before this rebuild; the new Firebase credential exchange has only been checked against its documented integration so far.
6. Check the lobby, active arena, heart rules, chat, eliminated/spectator state and rematch at laptop and narrow sizes through the browser. Browser control failed before this visual check could happen.
7. Finish observing/playing the reference game's round-end flow. Reference rooms were actually joined, but no successful accepted answer was observed before the browser disconnected. Do not claim that step is complete.
8. Build, commit and publish only after the production backend and browser checks pass. Update the cache suffix when releasing and verify the hosted bundles.

## Architecture

The Google Identity Services token is verified locally, then exchanged with Firebase Authentication using `GoogleAuthProvider.credential` and `signInWithCredential`. Firebase verifies Google membership on the server. Identity tokens and emails are never sent to other players. Account matching checks the Google provider identifier, so a saved Firebase session for another Google account cannot be reused.

Realtime Database contains a Google-only public directory and per-room metadata, member presence, host-owned game state, per-user request/response mailboxes and chat. Players can only write their own membership, requests and chat. Only the current host writes game state. A disconnected host has a 30-second grace period before another room member may claim the host role. This is host-authoritative play: it does not prevent a malicious host from editing their own room's game state.

Private rooms are omitted from the public directory. A room's code is an invite code, not a password. Google-authenticated people who know it may join. A stale directory entry stops appearing after 45 seconds. Stored room records do not automatically expire; the privacy notice states this explicitly.

`cloud.bundle.js` is loaded only when a signed-in user requests multiplayer. Daily and Endless do not load Firebase. The canvas ocean is suspended behind the dedicated party arena. Input drafts survive roster, chat and turn updates. Animations respect reduced-motion settings.

## Validation

- `npm test`: 59 checks, including core games, Google token validation, new party rules, typing ahead, escaped names, and chat drafts.
- `tests/database-security.mjs`: 33 checks against the actual Firebase Realtime Database emulator, covering unauthenticated/non-Google denial, UID ownership, host-only state, request privacy, chat impersonation/cooldown, private listings and host migration.
- `tests/party-network.mjs`: three distinct emulator Google-provider identities exercising hosting, host rules, countdown, accepted answers, canonical duplicate rejection, spectator entry, chat delivery, private-directory removal, pop/victory, rematch and host migration.
- `npm audit --omit=dev`: zero runtime dependency findings after the gRPC override. The cloud bundle includes only App, Auth and Realtime Database.

Run database checks with Java 21 on PATH:

```sh
npm run test:security
```

For both the authorization and network tests in one emulator session:

```sh
firebase emulators:exec --only database --project demo-councillion 'node tests/database-security.mjs && node tests/party-network.mjs'
```

A portable official Temurin JRE was downloaded under the parent task's `work/party-rebuild/` for these tests; it was not installed system-wide.

## Local preview

`http://localhost:4173/party-preview.html` is an ignored, local-only simulated art preview, clearly marked **ART PREVIEW / DEMO**. It does not create a public room and is not an authentication bypass. Use it to inspect the arena while console access is unavailable. It must not be deployed.
