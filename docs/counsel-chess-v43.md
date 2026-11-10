# Counsel Chess

Counsel Chess adds a 1v1 and 2v2 chess court at `#chess`, with its own Puffer Games entry, original AI-generated court, board and piece artwork, room-code invitations, Google accounts, synchronized clocks and separate chess Elo.

## Rules and rooms

- `chess.js` 1.4.0 validates turns, king safety, castling, en passant and all four promotions. Move requests carry the match ID and current ply; stale, illegal, out-of-turn and spectator actions are rejected by the room referee.
- Five clock presets: 3+2, 5+3, 10+0, 10+5 and 15+10. Time is charged until the request reaches the referee; increment is awarded only after a legal move. A disconnect does not pause the clock. Rejoining restores the current board and record. The room can transfer its referee to the remaining connected player.
- Checkmate, resignation and flag fall end games. Stalemate, insufficient material, threefold repetition, fifty moves, and mutual draw agreement are supported. The conservative timeout policy draws when the opponent has only a king or one minor piece; this is not an implementation of every FIDE dead-position edge case.
- Mutual rematch consent swaps colors and resets the clock. Results must finish saving before a rematch starts. A completed roster remains attached to its result through disconnects.
- This uses Councillion's existing trusted-host room architecture. The host is the authoritative referee. Firebase prevents guests writing another player's requests or directly editing the board, but this is not a tamper-proof competitive chess server: a malicious host can manipulate its own room. No engine evaluation is displayed during an online game.

## 2v2 Team Chess

Two partners share each color and one clock. Partners alternate their team's turns; only the highlighted active player can submit a move. A full lobby supports consent-based seat swaps. Both teammates must agree to resign. All four players must agree to a draw or a rematch; moving clears stale resignation votes. Rematches swap team colors. The same legal chess rules and promotion choices apply, and PGNs name both partners.

The post-game review shows both team totals and the local player's individual move accuracy/counts. Every move records which teammate played it. Local 2v2 practice supplies three bots and stays unrated.

## Ranking and records

Chess starts at 1000 Elo, independent of Puffer rankings. The first five rated games use K=48; later games use K=32, with expected score `1/(1+10^((opponent-rating)/400))`. In 2v2, expected scores use the two team-average ratings, then each teammate receives an adjustment using their own placement K-factor. Draws score one half. Local bot games, aborted games and games ending before both opening plies are unrated. Results are immutable, host-written receipts matched to the completed room state. Replaying receipts in timestamp/game-ID order makes ratings stable across reconnects and input ordering.

Five rated placements precede a visible rank: Bronze below 900, Silver 900+, Gold 1100+, Platinum 1400+, High Court 1700+. Existing AI rank artwork is reused. The record panel shows wins, losses, draws, recent matches, PGN downloads and a chess leaderboard.

## Post-game review

Stockfish.js 19.0.1 Lite, single-threaded, runs as an unmodified separate Web Worker. Its approximately 1.8 MB WASM is loaded only after a completed game. Each position is searched for 180 ms with two principal variations. Progress is visible, failures can be retried, and leaving/rematching terminates the review worker.

Review is **Councillion's own estimate**, not Chess.com's proprietary accuracy formula. Expected score is a sigmoid of centipawn evaluation (`1/(1+exp(-cp/300))`). Per-move accuracy is `100*exp(-4*expected-score-loss)`; game accuracy averages those move scores. Counts distinguish brilliant, great, best, excellent, good, inaccuracy, mistake, blunder and forced moves. Mistake boundaries are expected-score losses of .05, .10 and .20. A great move must be the first engine choice with a substantial gap to its second choice. A brilliant move requires a sound material sacrifice in the following principal variation, a playable resulting position, and at least depth 10 on both analyses. It is deliberately conservative and can disagree with deeper analysis. Review never affects Elo.

The unmodified engine, GPL license, corresponding source archive, build instructions and the Lite neural network are served under `assets/chess/stockfish/`. See `SOURCE.txt` there. The local practice opponent is a separate, bounded chess search worker; it is not advertised as Stockfish or given a fake Elo.

## Artwork

All new court, board and piece image content was made with imagegen. See [the full prompt and asset manifest](../assets/chess/art-manifest-v43.json). The original generated PNG files remain in the generated-image archive and local work checkpoint; production uses compressed WebP exports. Piece sheets use equal 3×2 cells with transparent backgrounds. The board is an AI-generated exact 8×8 surface; interactive legal-move targets and focus indicators are separate accessible controls.

Chess UI classes use `cch-` so they cannot alter the older Counsel Clash `cc-` styles. Reduced motion, keyboard square navigation, board flipping, drag and click input, small-laptop layouts and mobile scrolling are supported.

## Sources

- [chess.js official documentation](https://jhlywa.github.io/chess.js/)
- [FIDE Online Chess Regulations](https://handbook.fide.com/chapter/OnlineChessRegulations)
- [FIDE Laws of Chess](https://handbook.fide.com/chapter/e012023)
- [Stockfish.js v19.0.1](https://github.com/nmrugg/stockfish.js/tree/v19.0.1)
- [Chess.com explanation of move classifications](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc) — conceptual reference for review labels, not a claim to reproduce its private implementation.

## Validation

`npm test`, `npm run build`, `npm run test:chess`, `npm run test:chess:network` (Firebase Database emulator) and `npm run test:chess:browser` (local isolated Chromium).

The network test exercises two- and four-player ordinary Google-authenticated clients, public discovery, protected boards, legal moves, clock increments, referee transfer, reconnection, draw agreement, immutable receipts, Elo, mutual rematches, consensual seat swaps, wrong-teammate rejection, team Elo and checkmate. Browser checks cover 1366×768, 1280×600, 1024×600 and 390×844, legal targets, drag/drop, promotion, history, board themes, a complete bot demonstration, PGN download and real WASM review. The new rules are additive; existing room permissions and other game rankings remain unchanged.
