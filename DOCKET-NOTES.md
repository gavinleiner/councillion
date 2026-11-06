# The Docket

Councillion’s independent Jeopardy-style friend game, released as `20261105-docket-v13`.

## Content

500 original board clues in 100 categories, 16 final clues, and 8 sudden-death clues. Gaming, Screen, Music and Nature each have 65 board clues; Sports, World, Everyday and Words each have 60. Counts exclude aliases and source inventories. The release snapshot contains every admitted clue, canonical response, explicit alias and source URL.

Categories include Arcade Tokens, Odd Jobs, Scene Partners, Racing Lines, Drive-Through, The Fictional Map, Body of Evidence, Album Sleeves and Puzzle Table. Each contains five distinct facts, ordered by intended difficulty. Difficulty is an editorial judgment rather than a measured player success rate. A new room draws fresh categories without remembered player history. Each board spans six subject families; a match never reuses a category or a canonical response across its two boards. Final answers are drawn outside the selected boards’ canonical response set.

The clues were written for this game. No television clue archive or bulk tag combinations were imported. Facts cite their public reference pages; source links appear after the clue closes. The content review corrected disambiguation links, removed answers accidentally named in clues, removed reciprocal padding such as asking both halves of the same brother/animal-food fact, and added recognizable alternate names. Factual claims and difficulty still benefit from player feedback; an HTTP source receipt alone is not evidence that every statement is correct.

## Format and pacing

Two 6×5 boards, values 200–1,000 then 400–2,000, one hidden Daily Double then two, and a private final category/wager/clue sequence. Responses use a visible question prefix. Correct responses gain the value and board control; wrong responses lose it and allow other eligible players to buzz. Each contestant gets one attempt per ordinary clue. A Daily Double finder wagers before seeing the clue, with a minimum of 5 and a maximum of their score or the board’s highest value. Final wagers range from zero to the positive contestant score; the final response clock is 30 seconds. Final rows reveal from lowest pre-final score upward; ties use a sudden-death clue.

Rules were checked against the [official Jeopardy format](https://www.jeopardy.com/sites/default/files/2025-09/J_S42_press_kit.pdf), the [official buzzer explanation](https://www.jeopardy.com/jbuzz/behind-scenes/how-does-jeopardy-buzzer-work), and [Hasbro’s licensed game instructions](https://www.hasbro.com/common/instruct/Jeopardy_Remote.pdf). The friend-room adaptations are two to six contestants rather than three, typed answer windows of 20 seconds, an explicit read phase, ready breaks, and a random first selector. No positive scores means no champion. Scores are points, not money or Puffer rank.

An early buzz has a 250 ms lockout. Internet buzzer order is the first request received by the host referee; network latency can affect it. The room uses Councillion’s existing Google-authenticated host-referee architecture, not a new cheat-proof server. Hidden Daily Double positions, final answers and wagers are absent from public state and saved on protected referee paths so a host handoff can recover them. Final responses and corrections are private until reveal. Only the active ordinary-clue responder’s draft is projected publicly, through the existing moderation filter.

Autocorrect proposes a conservative spelling match only after Enter. The submitting player privately confirms or edits it before it counts; the same flow applies in the final. There are no generated initials or automatic expansion of arbitrary short input. Explicit familiar names, such as NHL and NPC, remain valid. Clocks continue during correction.

## Artwork and UI

Six complete AI-generated scene plates contain exactly 1, 2, 3, 4, 5 or 6 separate contestant podiums. All were generated with the built-in `image_gen` tool. PNG masters and WebP delivery copies live in `assets/court-games/docket-*-podiums-v13.*`; the exact prompts are in `assets/court-games/docket-prompts-v13.json`. Your pre-join character already occupies the single podium. Waiting rooms switch among the six plates as members arrive; existing avatar nodes stay mounted and glide into position while newcomers settle onto their stands. Characters and live labels use measured per-plate anchors. The same plate supplies foreground occlusion; no detached podium PNGs are pasted over another set. Native HTML supplies the board, clues, scores, inputs and accessibility controls.

Slow bubbles, fish, water light, character idle motion, buzzer lamps, category entrances, score changes and final unsealing keep the scene moving. Reduced-motion preferences remove CSS motion. The school laptop layout keeps the board, contestants and answer dock in view; narrow phones can pan the scene horizontally.

## Checks

`node scripts/audit-docket.mjs` verifies the release snapshot, counts, subject balance, unique prompts and all canonical/alias matching. `tests/docket.test.js` covers complete 60-clue matches, wagers, rebound penalties, negative scores, stale turns, typo confirmation and draft isolation. `tests/docket-network.mjs` runs six Google-authenticated clients against current production database rules, including simultaneous buzzes and sealed final-state host recovery. `tests/docket-browser.mjs` checks all clues at four laptop viewports and input/caret stability under 4× CPU slowdown. The full local bot demo is deliberately outside the published site and bypasses no public authentication.
