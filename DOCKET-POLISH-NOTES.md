# The Docket — v15

The court now fills the play viewport rather than fitting a smaller 16:9 panel between bars. The same six stage plates, podium anchors and approved character sprites are retained. Short-laptop clue typography scales with the board's height as well as its width. Clues remain mounted through private correction updates and never fade out when a buzzer opens.

## Buzzer behavior

- Light-blue strips flank the board when buzzers open. Eligible podiums and the large button turn blue. The winning podium stays lit during its answer window.
- Mouse/touch attempts register on the physical press, not on a release which may cross into a new phase. Space/Enter require a fresh keydown; held/repeated keys cannot reserve a place.
- The referee applies a 500 ms rolling penalty for early attempts. Continued early mashing extends that penalty. A delayed request from the reading stage cannot win after blue. Simultaneous losing requests do not generate a false error or replace the winner.
- Official Jeopardy opens the buzzer after the host reads, uses board lights, and applies a quarter-second early lockout. Our half-second anti-mash variant is an intentional adaptation requested by the user, not a claim to be the show's exact input rule: https://www.jeopardy.com/jbuzz/behind-scenes/how-does-jeopardy-buzzer-work and https://www.jeopardy.com/jbuzz/behind-scenes/control-room-lifecycle-jeopardy-clue.

## Answer recognition

The Docket and Feud opt into the shared game-show recognizer. Familiar abbreviations, unique phrase initials (including two-letter initials), identifying name initials, harmless articles, and reasonable spelling mistakes are allowed. Ambiguous initials across a Feud board and unrelated content words are rejected. Numeric/roman sequel distinctions remain meaningful. Corrections appear privately after Enter and require a separate confirmation; holding Enter cannot confirm automatically.

Puffer/Daily's answer-matching.js and Final Figure's numerical answer rules have not been changed. Feud additionally has curated semantic equivalents, including graveyard/cemetery, from v14.

## Clue review

56 board clues were rewritten, six obscure response targets replaced, 44 categories reordered as complete clue records, and two finals revised. The inventory remains 500 board clues in 100 actual categories, plus 16 finals and eight tiebreakers: 524 total. Eight subject families still contain 60–65 board clues each. Reordering is editorial judgment about a familiar easy-to-hard progression, not fabricated player-success data.

Examples include refraction instead of dispersion, cello instead of timpani, Icarus instead of Daedalus, and additional identifying context for the narrower gaming and history clues. Low-value clues no longer simply state every obvious identifying feature. Sources travel with the edited clue records; the original v13 snapshot is preserved and v15 is a separate auditable snapshot.

New/replacement facts were checked against:

- Philharmonia, cello: https://philharmonia.co.uk/resources/instruments/cello/
- American Museum of Natural History, refraction: https://www.amnh.org/explore/ology/physics/see-the-light2/refraction
- NASA, Jupiter's moons: https://science.nasa.gov/jupiter/jupiter-moons/
- Walters Art Museum, Icarus: https://art.thewalters.org/object/54.1037/
- Merriam-Webster, oxymoron: https://www.merriam-webster.com/dictionary/oxymoron
- NOAA, tsunami: https://www.noaa.gov/jetstream/tsunamis
- NHL, Stanley Cup: https://records.nhl.com/awards/stanley-cup/history-of-the-trophy

## Validation and limits

The release uses focused engine/matching tests, the 524-clue factual/schema/alias audit, and actual-renderer browser checks at 1366×650, 1280×600, 1024×600, and 1440×900. The browser fixture runs actual CourtGameSession request/acknowledgement code with delayed local responses, checks physical held-key/pointer behavior, post-Enter correction, shorthand, and typing stability at 4× CPU slowdown. A complete six-bot game checks two full boards, wagers, final seals and ordered reveals.

The unchanged remote database rules were previously checked with six Docket clients. This session's new Firebase emulator retest could not start on this Mac, as disclosed in the v14 notes. The new local browser checks are not represented as a network emulator pass. Real internet buzzer order remains dependent on network latency.
