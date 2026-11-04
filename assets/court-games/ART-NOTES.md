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
