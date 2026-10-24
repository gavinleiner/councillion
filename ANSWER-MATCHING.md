# Answer correction

Canonical answer names and explicit aliases are checked first, ignoring case, accents, punctuation and spacing. The game never generates initials: `DS` cannot stand for `Diamond Sword`, and `BB` cannot choose between `Black Bear` and `Brown Bear`. A real recorded acronym, short answer, symbol or nickname still works. Short acronym aliases are exact-only rather than fuzzy expansion targets.

Corrections appear only after Enter / DIVE / SEND. The input fills with the best plausible answer and asks **Did you mean …?** Another submit confirms it. Editing, a new prompt, a changed turn or leaving the form clears the proposal. Timer expiry cannot invent an unseen correction. Daily, Practice and Puffer use the same matcher/controller.

## What counts as spelling evidence

- Adjacent swaps, missed/extra letters, doubled letters and nearby keyboard keys have bounded edit costs. The budget scales with word length. A long phrase cannot lend its entire edit allowance to replacing one unrelated short word.
- Every typed content word must align with an answer word. `locals coffee`, `diamond knife`, and `random pulp fiction` are rejected.
- Articles/conjunctions, ordinary answer wrappers and a pack's explicit context phrase are handled consistently. Context removal is at whole-word boundaries: `Minecraft diamond sword` is valid; `preminecraft diamond sword` does not get its substring erased.
- Reordered, joined or split words can be corrected. Digits, sequel numbers and `+` / `#` distinctions are protected.
- One omitted answer word can be proposed only with two substantial identifying words, strong spelling/coverage and a clear single completion. `night flame` can identify `Sword Of Night And Flame`; `sword` cannot. `tikka masala` cannot select chicken over paneer. More than one omitted content word is not guessed. Common shorter titles and nicknames should instead be recorded as explicit aliases.
- Fuzzy candidates keep the canonical score and cannot change an exact answer into another one. Explicit wrong-category exclusions still apply.

## Research and limits

Visible tests on [Krillion's movie pack](https://krillion.io/movies?game=1), October 23, 2026, showed `ts` rejected for a Pixar film; `pulp fictin` proposed **Pulp Fiction** with a second-submit confirmation; `random pulp fiction` rejected. In a horror villain prompt, `freddy` and `freddy kruger` proposed **Freddy Krueger**, while `freddy pizza` was rejected. `toy stroy` was rejected; Councillion deliberately handles that straightforward transposition. These are observed outputs, not access to Krillion's private implementation.

The design also draws on [Elastic's length-dependent edit budgets](https://www.elastic.co/docs/reference/elasticsearch/rest-apis/common-options#fuzziness), its [description of fuzzy edits and expansion costs](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-fuzzy-query), and [Peter Norvig's discussion of candidate models, context and held-out evaluation](https://www.norvig.com/spell-correct.html). A trivia matcher must be more conservative than a search engine: a related result does not establish that the player supplied the right answer.

Regression tests cover every two-letter combination, explicit acronyms, missing/extra words, ambiguous omissions, several typing mistakes, numeric sequels, short titles, confirmation timing, edit cancellation, and answer-score preservation. Recorded real-bank evaluation additionally checks common one-edit mistakes and random-word contamination. Finite inventories and spelling similarity cannot guarantee every intended answer; corrections remain visible and reversible before confirmation.
