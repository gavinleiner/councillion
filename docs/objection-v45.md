# Objection!

Objection replaces Beat the Bench in its existing second-page Puffer Games slot. The old `#bench` entry opens the new card room. Other hub positions are unchanged.

## Play

Two to six Google-authenticated players can host/join by room code or the public table register. Each has a private hand. Local practice needs no account. Quick Case ends after one hand; optional matches race to 200 or 500 points. The host chooses 20-, 30- or 45-second turns.

The original implementation follows the [official Mattel classic UNO rules](https://shop.mattel.com/pages/games-uno-braille-rules): seven cards, matching color/number/action, voluntary drawing with only the new card playable, skip, reverse, draw-two, wild, challengeable draw-four, two-card missed-call penalty, remaining-card scoring, and discard recycling. Draw penalties do not stack. Reverse acts as a skip with two players. Final draw penalties settle before scoring.

The one-card call is “Objection!” Arm it while holding two cards or call immediately after playing. Others can catch a missed call until the next player draws/plays. A Draw Four bluff is allowed; the challenger alone sees the pre-play hand as evidence. A successful challenge makes the offender draw four and preserves the challenger’s turn; a failed one costs six and a turn.

Documented adaptations: opening discards are numbers; the dealer is randomized, then rotates; a turn timeout draws one and passes (or keeps a previously drawn card); Quick Case and the 200-point setting are shorter alternatives to 500. A disconnected roster receives an eight-second grace before a lone remaining player can win. The per-turn timer also prevents abandoned seats from blocking a table.

## Presentation

Original AI-generated underwater law-library room, matching overhead table, six-pose puffer barrister, and card back. Dynamic card faces remain readable text and symbols. See [the full generation prompts and artifact hashes](../assets/objection/art-manifest-v45.json). Artwork was generated with the built-in image-generation tool and converted to WebP without content edits.

The separate hand rail avoids covering the table. Players stay in fixed chairs as turns reverse; card flights, seven-card dealing, smooth hand rearrangement, color selection, challenge verdict stamps, dealer poses, subtle water/lantern movement, and a card-burst finale respond to actual engine events. Reduced-motion preferences disable movement. Color names and suit symbols supplement color.

## Multiplayer design

The shared trusted-host referee uses existing Firebase room rules. Public state contains card counts, scores and the discard. Each authenticated member reads only their own private receipt. The host persists the private shuffled deck/hands in its protected referee receipt; a replacement host restores that exact state. Challenge evidence is sent only in the challenger’s receipt. As with other existing Councillion modes, the host is trusted to referee; this is not a dedicated anti-tampering game server.

Actions validate match, hand, turn serial, deadline, membership, ownership and legality. New-card-only play, one draw per turn, idempotent transport acknowledgments, and stale-action rejection prevent duplicate submissions. Late joiners spectate until the next case. Public table entries use a separate Objection catalog version.

## Validation

`npm run test:objection` checks rules and card conservation over 100 complete randomized games spanning two to six players. `npm run test:objection:network` uses the Firebase emulator to test ordinary Google clients, hosting/joining, private hands/evidence, outsider denial, shared actions, referee handoff, reconnect, and Draw Four challenges. `npm run test:objection:browser` covers four viewport sizes, keyboard/wild/last-card controls, route replacement, and five full bot games. Run the repository-wide test/build checks before publishing.

For the user’s full-game showcase, run `OBJECTION_DEMO_PORT=4199 npm run dev:objection`, then open `http://localhost:4199/__objection-bots?seed=4503` in Chrome. All seats are bots; the displayed hand follows the active counsel while chairs stay fixed. Replay, pause and speed controls are explicit. This local showcase exposes no production player hands.
