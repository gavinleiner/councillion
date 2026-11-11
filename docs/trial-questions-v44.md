# Trial by Puffer question quality

The previous Trial pool imported all 648 Beat the Bench questions. Its opening
deliberately picked two low-tier clues. Several higher-tier clues also had
obvious distractors of a different kind, so the nominal difficulty overstated
the challenge of answering with four choices.

New matches use an independent admission list of **128 questions**, exactly
16 in each of Gaming, Sports, Screen, Music, World, Nature, Everyday and Words.
There are 96 retained source-linked facts with individually rewritten sets of
three plausible distractors, and 32 newly authored questions. Beat the Bench,
Daily and Puffer Party retain their existing question pools.

The editorial difficulty levels are medium (3) and harder (4), judged with the
actual choices visible. These are design targets, not measured solve rates.
Each eight-question block contains every subject once in a shuffled order.
The opening alternates a medium question with a harder one; no elementary
warm-up is forced. Questions do not repeat inside a deck. Fresh matches get a
fresh shuffle without retaining player-specific question histories.

The new questions mix game mechanics, sports situations, entertainment,
counterintuitive facts and short word puzzles. Each has a source link and a
short explanation revealed after answers are unsealed. Sources and exact
answer boundaries live beside each question in `trial-question-originals.js`;
the word-puzzle answers are also verified by letter-count tests.

Old question IDs remain resolvable for existing room referee decks. A new
catalog build ID makes fresh-room compatibility explicit. Trial's timers,
survival minigames and 40 escape-category sets retain their existing rules.

Validation includes all-choice uniqueness and alias exclusions, all four
correct-answer positions, 200 seeded decks, equal subject representation,
non-repetition, legacy-ID compatibility, private-until-reveal explanations,
and complete 2–8-player simulated matches. No factual checks are inferred
merely from a source URL being present.
