# Reference research and implementation decisions

Reviewed October 21, 2026. This document distinguishes verified reference behavior from Councillion’s own data and implementation. No downloaded reference-art files, original client source, or full proprietary answer archive are shipped here. The environmental assets are AI-edited pixel-art variants.

## Evidence examined

- The live home, entry, timed-answer, submission, descent, and round-feedback screens at https://krillion.io/.
- The creator’s FAQ at https://krillion.io/faq.
- The public daily metadata response at https://krillion.io/api/today (prompt text and reset time, without answers).
- Publicly delivered client resources for timing, settings, presentation, and Puffer Party defaults. These were inspected as reference material, not incorporated into this implementation.
- The user’s rarity-filter screenshot and pasted 111-entry airline answer list.

## Daily game rules observed

1. Seven prompts are shared for a given New York calendar date. The observed daily reset is midnight in America/New_York, with daylight-saving time reflected in its UTC timestamp.
2. Each round begins with a three-second preview. The answer clock then runs for 25 seconds. The input’s reference maximum is 256 characters.
3. An accepted response has a canonical answer, a preassigned tier, and the tier’s point value. Depth gained is ten metres per point; seven 100-point responses give 700 points and 7,000 metres.
4. A rejected attempt ordinarily leaves the round running. The player can try again until time expires. Councillion’s initial behavior of immediately consuming the round was incorrect and has been replaced.
5. Nonempty text still in the input when the timer expires is submitted automatically. An empty or unrecognized final response becomes a zero-point miss.
6. The reference can preview a corrected spelling before scoring. A second submission confirms it; a setting can accept corrections immediately. Exact aliases are part of answer lookup.
7. The live menu explicitly states that the timer continues while it is open. A previous inference from generic resume helpers incorrectly suggested otherwise; the direct walkthrough corrected that. Councillion now keeps its clock running through menus as observed. Browser-tab changes do not reset a timer.
8. Results animate the answer’s descent and show the resulting tier, canonical answer, score, and depth gain. A further action advances to the next prompt.
9. Only final results expose answer banks, tier filters, and answer search. The list can contain many more Deep Cut answers than common answers: tier frequency in the bank is not itself a score calculation.

## Rarity is curated, not a fresh popularity vote

The FAQ describes merging and cleaning sources into accepted-answer sets. Some questions use a familiarity database; others combine language-model assistance with manual review. The top answer is selected partly for satisfaction and recognizability, so it is not necessarily the least familiar valid answer. Missing valid answers and surprising autocorrections are possible.

The reference client and FAQ also still describe a separate historical/optional Too Clever tier at 15 points. The user supplied a five-family reference image and specifically requested its visible names and colors. Councillion therefore follows that requested lineup: Krillion (gold), Deep Cut (purple), Rare (red), Schooler (cyan), Plankton (blue-gray). We do not interpret the counts beside these filter names as point values.

## Question structure

The observed daily includes constrained categories, not just unrestricted trivia: television with a rating/vote threshold; players on current professional teams; foods opened before eating; vehicles without wheels; anatomy with a count constraint; countries adjacent to specified countries; and airline extras. Constraints are part of answer validity. Current-roster and live-rating questions need maintained datasets.

Councillion includes original broad, constrained, wordplay, science, geography, and Future Counsel law/courtroom packs. Their editorial assignments are not claimed to reproduce Krillion’s unpublished grading data. The airline-extras and wheel-free vehicle packs are different: their canonical labels and scores come directly from the user-provided reference lists.

## The supplied airline example

The bank contains exactly 111 canonical answers: one at 100, 50 at 85, 30 at 60, 22 at 30, and eight at 10. The top answer is Falcon in cabin. The pasted `Alcoholyou` was interpreted as the canonical answer Alcohol plus the UI’s player marker; the pasted form remains accepted as an alias. Additional aliases are local convenience decisions, not claims about the reference’s matching thresholds.

The second supplied bank contains 1,194 canonical vehicle answers: two at 100, 1,029 at 85, 132 at 60, 27 at 30, and four at 10. Both Ground-effect vehicle and Iceboat are 100-point answers, so the top tier is not globally limited to one answer. Its descriptions are preserved.

## Multiplayer defaults inspected

The public Puffer Party client specifies two initial lives, a maximum of five, a 600-point heart meter, at least eight seconds for a new turn, a random fuse between ten and thirty seconds, six players by default, and four-letter room codes. Councillion now uses those core defaults. The reference also supports public matchmaking, configurable rooms, accounts, unlocks, presence/reconnection, and a dedicated backend. Councillion currently provides private peer-hosted rooms and a one-device game; it does not claim to implement those additional services.

## Limits of an exact reproduction

The private answer matcher’s thresholds, unpublished answer banks, calibration process, and backend rules cannot be recovered from appearance alone. The recreated client uses its own deterministic lookup/matching rules and its own client scene with law-themed generated environments and code-drawn creatures. The user-supplied examples are exact for canonical labels and scores; the whole game is not a byte-for-byte or data-identical copy.

## Full seven-question walkthrough

Played the first free Endless Dive through its final result screen: 230 points and 2,300 m. Four prompts expired during interaction; accepted examples were Assyrtiko (85), Gadzooks (60), and Comoros (85). Inspected the timeout state, preview transitions, submission animation, final Surface action, score distribution, seven-column dive log, score-band guide, all seven answer accordions, inner answer-list scrolling, settings, and wardrobe presentation. The reference’s wine answer list alone exposes 1,982 entries. This was used to verify list scale and presentation, not imported as a proprietary answer bank.

At 850 m the reference already uses a very dark intermediate scene; at 1,450 m and 2,300 m it has distinct dim open water and side silhouettes. The recreated scene must therefore transition through multiple textures and lighting profiles, rather than merely apply one weak overlay to the shallow-water art.

## Changes following the walkthrough

The live preview uses surface, shallow-water, midnight-water, abyssal-trench, and hadal artwork. Intermediate textures blend between 250–1,150 m; abyss walls blend between 2,300–3,700 m; hadal walls blend between 5,100–6,300 m. Five zone captions begin at 0, 350, 1,100, 3,000, and 5,500 m. These are local art-direction choices, not claims about exact reference thresholds. Light shafts fade with depth. Sky drift, small ripples, eight-frame kelp, particles, fish, and sprite parts animate independently at a deliberately slower pace. There is no seafloor. Menus do not extend a question deadline.

The results layout now uses an ocean-backed total, a score-band spectrum, a seven-column per-question depth log, a score guide, and seven expandable answer banks. At the user’s subsequent request, results include an explicitly labeled model-based percentile; it is not presented as observed player data. Answer banks are gated until the whole dive is complete. The large bank browser renders 100 entries at a time, supports five rarity filters, and searches all canonical labels.

Validation after the visual rebuild: played a full practice dive using known accepted answers to reach 700 points / 7,000 m, checked the actual gameplay scenery through each zone, confirmed no mid-round answer-browser action, checked session restoration during a live reload, and verified final-bank pagination (200 of 1,029 Deep Cuts) and search (Iceboat, 100 points). The 19 existing game/data checks pass. Laptop and narrow-panel layouts were visually reviewed.

## Estimated percentile model

The requested bell curve is a transparent prior estimate for first-time seven-question dives. Its inputs are assumed tier probabilities, not the frequency of answers listed in a bank, not measured popularity, and not imported Krillion results. A 40% casual / 50% regular / 10% experienced mixture yields a mean of 229.39 and standard deviation of 96.12 points. The complete finite distribution is computed exactly; a score of 230 has 53.54% of modeled mass strictly below it. A Gaussian kernel smooths the SVG display only. Ranking uses the unsmoothed cumulative probabilities and excludes ties. No sample size, confidence interval, or observed-player population is invented. The disclosed limitations include uncalibrated assumptions and no adjustment for actual daily difficulty. Model validity, normalization, support, analytic expectation, monotonic ranking, ties, and high-tail formatting are checked by four tests.
