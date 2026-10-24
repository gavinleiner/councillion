# Group question tryout

Release: `20261023-tryout-v1`. Review set: `group-100-v1`.

The group reported narrow prompts, missing ordinary answers and repeated openers. The earlier admission policy treated a large source inventory as sufficient editorial review. Its selection algorithm also gave each subject family equal turns: seven world categories competed with 2,000 gaming categories for the same number of openings. It was a shuffled family rotation, not an alphabetical list, but it overexposed small families.

## Review before more banks

`#review` presents 100 new proposals: games 20, sports 12, movies/TV 14, music 10, food 12, nature 10, science 8, places 6 and everyday life 8. The display order is mixed; stable q001–q100 IDs preserve the meaning of feedback. Each proposal includes its intended scope, six preview examples and research links.

Yes/No, keyboard Y/N, auto-advance, Undo, per-question notes, subject/vote filters, numbered navigation and JSON export are available. Textarea keystrokes and empty filtered views cannot create votes. Progress resumes after closing the page. Signed-in review edits sync per cell, preserving offline edits and concurrent changes to other questions.

These are category proposals, not 100 complete new gameplay banks. Research references are starting points, not proof that every possible answer has been collected. Approval means the group wants the category developed; the next editorial step is to construct and audit its answer inventory, aliases, boundaries and rarity tiers. Previously missing Steam/sports entries have not been silently declared fixed by this review.

## Conservative ordinary play

The temporary ordinary pool has 153 Daily/Practice categories and 151 Puffer categories. Narrow Steam tags, console facets, roster/position/award subsets and other specialist inventories stay available only by explicit library choice when their source integrity passed. Archived contaminated inventories remain archived. No source banks are deleted.

Puffer now uses one Fisher–Yates shuffle over all eligible unseen IDs. Rematches use the supplied RNG consistently. Local history is keyed by Firebase account and reported to rooms; it survives new rooms on that browser. It is not a cross-device or global lifetime history. Old and new question-policy builds cannot join the same room.

Daily uses the existing frozen append-only calendar, with the October 23 draw unchanged and a broad-pool revision from October 24. The revised future schedule has 20 complete dives through November 12 plus two remainder IDs. Appending approved banks must preserve assigned IDs and dates. Daily remains identical for everyone and stops rather than recycling when the published calendar runs out.

## Feedback privacy

Guests save locally. Google accounts save under `questionReviews/{uid}/group-100-v1`, with their own separate device cache. Signing in does not silently copy guest or another account's feedback. Votes and optional notes are readable by that account and the verified site owner; other players and anonymous requests are denied. The schema accepts only q001–q100, yes/no/unset, notes up to 500 characters, and server timestamps. Unknown fields are rejected. No additional Google scopes or gameplay answers are collected. The UI discloses owner visibility and provides readable and downloadable feedback.

## Verification

- Full unit suite: 165 tests passed before final layout/calendar refinements; focused review, randomness and shared-Daily tests rerun afterward.
- Browser checks: review/undo/notes/filter/reload/export/completion/navigation and 1366×768, 1024×600, 390×844 layouts.
- Structural audit: all 5,703,098 canonical rows and 2,092,737 aliases; no integrity errors. Inventory coverage checks remain distinct from exhaustive real-world coverage.
- Firebase emulators: private feedback ownership/schema/concurrent/offline writes, existing membership/moderation/ranked permissions, two-client answers/rematches/new-room history, persistent Google auth, titles and platform grants.
