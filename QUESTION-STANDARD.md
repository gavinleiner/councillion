# Question admission standard

Current ordinary play contains **499 curated questions**. Daily, Puffer, random Practice and the live sample use the same set from `data-snapshots/reviewed-standard/admission.json`. All 98 original Yes-voted prompts remain; both No-voted prompts remain excluded.

New content must offer recognizable subjects with familiar entry answers and valid rare answers. Whole game rosters, artist catalogs, foods, sports achievements and everyday subjects can qualify. Source size, an editorial flag, a draft inventory, aliases or an entity count cannot admit a question. Arbitrary tag intersections, title-word variants, unrelated cast-credit joins and specialist filler remain excluded. Single Steam tags retain their actual recorded membership; no new tag-pair prompts are added.

Every admission records the exact prompt/family, separate familiar inputs and wrong-answer boundaries. The production matcher checks 7,577 familiar exact inputs and 915 wrong boundaries across this release. Source hashes, identity uniqueness and canonical/alias ownership are checked separately. These checks do not prove that every valid answer in the world has been included.

Public aliases preserve actual names and alternate spellings. They do not generate initials from answer words. Different releases/personas of the same identity score once where appropriate. Missing factual memberships are repaired in the relevant inventory; global typo tolerances are not widened to conceal a missing answer.

The Daily calendar is shared, frozen and append-only for dates already published. Seven different subjects are selected for each date independently of account, browser locale and Puffer history. The November 4 playability review preserves dates through November 4 and uses the smaller curated pool from November 5. Exhaustion stops instead of wrapping. Every Puffer match and Practice game draws a fresh unweighted shuffle from the entire admitted pool. Per-account and previous-match histories are ignored. Questions do not repeat within a Puffer match; later games can repeat them.

To maintain a release:

1. Retain the immutable taste reference in `data-snapshots/reviewed-standard/user-review.json`.
2. Review a whole prompt, its factual inventory, obvious inputs, aliases, rare anchor and plausible wrong boundaries before explicit admission.
3. Rebuild authored/ordinary catalogs, answer repairs, the calendar and the sample; preserve published Daily dates.
4. Run the production admission checker, relevant membership/gameplay tests and the normal build/test suite.
5. Verify the public deployed count and bytes before reporting publication.

The November 4 review retires 501 specialist prompts without deleting their answer banks, old Daily assignments or saved results. All earlier wrong-answer boundaries remain attached to those archived banks. See [QUESTION-BREADTH-REVIEW.md](QUESTION-BREADTH-REVIEW.md).

The historical 1,000-question release is documented in [QUESTION-EXPANSION-1000.md](QUESTION-EXPANSION-1000.md). The earlier 200-question release remains documented in [QUESTION-EXPANSION-200.md](QUESTION-EXPANSION-200.md). Earlier dated source notes remain historical records rather than statements of the current pool size.
