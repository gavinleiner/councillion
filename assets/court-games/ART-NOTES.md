# Court-game art

Generated with the built-in `image_gen` tool. No external API key or paid runtime generation is used. Original PNGs live here, with lossless WebP copies served by the game. Reference images are existing Councillion artwork, used for style and location; television footage is not a generation input.

| Asset | Use | Reference |
| --- | --- | --- |
| `clash-wide.png` | Two-bench establishing stage | `assets/party-court-v2.png` |
| `clash-faceoff.png` | Paired face-off podium camera | Existing court stage |
| `figure-wide.png` | Estimation court with measurement/astronomy details | `assets/party-court-v2.png` |
| `host-atlas.png` | Four equal sprite cells: idle, blink, cheer, gavel | `assets/party-buddies/squid-ai-v1.png` |
| `team-bench.png` | A team's reaction-camera inset | `clash-wide.png` |
| `verdict-stage.png` | Winner's central dais | `clash-wide.png` |

The first three scene prompts asked for original, crisp pixel underwater law courts, navy/teal stone, warm brass lamps, a scales relief, broad empty UI space and readable benches/podiums; no characters, UI, words, logos or photorealistic finish. They are design summaries, not verbatim prompt transcripts. The exact subsequent prompts are reproduced in [generation-prompts.json](generation-prompts.json).

The atlas is consumed as a 2×2 background image; there is no frame cutting or AI call during play. PNG-to-WebP encoding preserves the alpha channel and every visible pixel, verified in `data-snapshots/court-games/art-encoding.json`. The original transparent PNG remains unchanged. Moving light, board flips, character gestures, water ambience and match-event animation are implemented separately, allowing reduced-motion support and interactive controls throughout.

## Future Counsel redesign, November 4

The final Feud implementation uses the existing approved `assets/party-court-v2.png` scenery, original Puffer characters and native Puffer menu styling. The alternative generated courtyard, glossy studio and coral amphitheater drafts were rejected and are not shipped.

- `assets/court-games/figure-cabin-v2.webp`: Final Figure's separate Future Counsel expedition chart-room hub. Generated with the built-in `image_gen` tool; final exact prompt in [generation-prompts-v2.json](generation-prompts-v2.json). The WebP is a lossless encoding of the selected generated PNG.
- `assets/court-games/counsel-bench.svg`: a native, pixel-aligned slate bench using Puffer's palette, with restrained scales detail.

Interactive labels, controls, board answers, one-at-a-time Fast Money questions, private first-run review, camera movement, seals and diving crews are DOM/canvas components. Final Figure's changing underwater biomes reuse the existing Daily ocean renderer and artwork. There is no runtime image-generation dependency.

## Feud camera and menu update — `20261104-feud-cameras-v5`

Four new assets were generated with the built-in `image_gen` tool using the approved pixel ocean artwork, the layout prototype, and then the new wide court as references. These replace the flat court prototype and the reused Puffer background in Feud. No runtime generation is required.

- `feud-court-ai-v1.png` / `.webp`: frontal submerged court, with an empty wall and stage for the live board and cast.
- `feud-bench-angle-ai-v1.png` / `.webp`: oblique left-bench view of the same court; the right-bench shot mirrors the environmental plate while keeping text and characters upright.
- `feud-foyer-ai-v1.png` / `.webp`: separate menu entrance with curved steps and court archways.
- `feud-counter-ai-v1.png` / `.webp`: transparent slate-and-gold counsel stand. CSS displays its visible region without editing or discarding the original alpha. Small stands use the center panel; team benches use the full stand.

The exact prompts are saved in [feud-camera-prompts-v5.json](feud-camera-prompts-v5.json). Original generated PNGs are retained beside lossless WebP runtime copies. [feud-camera-art.json](../../data-snapshots/court-games/feud-camera-art.json) records dimensions, visible alpha bounds, source files, and byte-for-byte decoded pixel verification.

Camera direction changes the actual environment plate, cast blocking, board placement and stand scale: wide establishing view; two-person face-off; left/right team and steal views; centered survey judgement; runner-and-host Fast Money view; large two-column review; and the finale. The live input is outside those moving set elements. Reduced motion keeps the framing changes immediate and removes pans, light pulses and transitions.
