# Shelved at Gavin's request · November 11, 2026

Gavin asked to scratch this idea, preserve it so it can return on request, and propose a more fun, impressive game instead. Do not continue developing, merge, or publish Deep Contempt until Gavin asks to bring it back.

The exact implementation is retained on `feat/deep-contempt-v50`. Main remains on the previous public release. Restoring this branch brings back the code, all AI artwork, prompts, six-room expedition, private hub, existing-character rendering, bot director, Firebase transport and tests.

## Restore

From the Councillion repository, switch to `feat/deep-contempt-v50`. Build with `node build.mjs`. For the full bot showcase run `npm run dev:deep`, then open `http://localhost:4201/__deep-bots` in Gavin's actual Chrome through CUA. The game route is `#deep`; its Puffer Games entry is appended after Chess. Do not change earlier game positions.

The private access rules for `deepRooms` and `deepPreviewAccess` were already published to Firebase and read back after console reload. They permit only the exact verified Google accounts `gavin@theleiners.com` and `gavin.leiner@student.nhcs.net`. They remain dormant while the frontend is shelved. Preserve this privacy unless Gavin changes it.

## Saved verification

- Repository-wide 664 unit tests passed before adding the final localhost-demo gate test. The final 13 Deep Contempt engine/access tests pass.
- Full build/audits passed; the final source was fast-built after UI/session fixes.
- Four full bot games passed at desktop/Chromebook/mobile viewport sizes; keyboard, lamps, pings, chart, cleanup and reduced motion passed. A four-times CPU slowdown still rendered 45 frames in two seconds.
- Firebase emulator tests passed: verified-account restrictions, six crew, host/join, shared movement/lamps, captain transfer and reconnect.
- The final duplicate-tab browser lock was separately tested: second instance denied, then allowed after the first released its lock.
- Existing five-viewport Puffer Games regression passed after adding the private Coming Soon entry without changing prior game order.
- Actual Chrome Google session successfully created and left private live room `QLHBVU`.

Evidence and screenshots are preserved outside the checkout at `../../work/deep-contempt-v50/`. Full game details and honest scope/transport limitations are in `docs/deep-contempt-v50.md`. AI assets and complete generation prompts are in `assets/deep/art-manifest-v50.json`.

Before future publication, check for newer changes on main, rerun relevant tests after integration, verify the two owner-account gates, then publish only if requested. A future main may require merge work; don't replace newer site changes wholesale.
