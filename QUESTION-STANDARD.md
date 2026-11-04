# Question admission standard

Current ordinary play contains **679 individually admitted questions**. Daily, Puffer, random Practice and the live sample use the same set from `data-snapshots/reviewed-standard/admission.json`. All 98 original Yes-voted prompts remain; both No-voted prompts remain excluded.

New content must offer recognizable subjects with familiar entry answers and valid rare answers. Whole game rosters, artist catalogs, foods, sports achievements and everyday subjects can qualify. Source size, an editorial flag, a draft inventory, aliases or an entity count cannot admit a question. Arbitrary tag intersections, title-word variants, unrelated cast-credit joins and specialist filler remain excluded. Single Steam tags retain their actual recorded membership; no new tag-pair prompts are added.

Every admission records the exact prompt/family, separate familiar inputs and wrong-answer boundaries. The production matcher checks 11,635 familiar exact inputs and 1,392 wrong boundaries across this release. Source hashes, identity uniqueness and canonical/alias ownership are checked separately. These checks do not prove that every valid answer in the world has been included.

Public aliases preserve actual names and alternate spellings. They do not generate initials from answer words. Different releases/personas of the same identity score once where appropriate. Missing factual memberships are repaired in the relevant inventory; global typo tolerances are not widened to conceal a missing answer.

The Daily calendar is shared, frozen and append-only for dates already published. Seven different subjects are selected for each date independently of account, browser locale and Puffer history. The November 3 expansion preserves all earlier dates and draws from the expanded pool starting November 4. Exhaustion stops instead of wrapping. Puffer filters retired prompts and preserves seen history across rounds.

To maintain a release:

1. Retain the immutable taste reference in `data-snapshots/reviewed-standard/user-review.json`.
2. Review a whole prompt, its factual inventory, obvious inputs, aliases, rare anchor and plausible wrong boundaries before explicit admission.
3. Rebuild authored/ordinary catalogs, answer repairs, the calendar and the sample; preserve published Daily dates.
4. Run the production admission checker, relevant membership/gameplay tests and the normal build/test suite.
5. Verify the public deployed count and bytes before reporting publication.

The November 3 delta and source review are documented in [QUESTION-EXPANSION-200.md](QUESTION-EXPANSION-200.md). Earlier dated source notes remain historical records rather than statements of the current pool size.
