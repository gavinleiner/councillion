# Daily Future Counsel visit

The first Councillion page load of each New York calendar day shows an explicit support screen. Its full surface is a real link to `https://futurecounsel.org/weekly`, opening a new tab with `rel=noopener`. The notice explicitly says opening the weekly case is required each day to play Councillion, and explains the support purpose, destination, frequency and immediate return path before the visitor clicks. No reading timer is imposed. It is not an invisible click handler over gameplay.

The permanent Weekly Case route follows Future Counsel’s own featured case selection. No individual case title or old article is hardcoded. The destination was verified against the live site’s Weekly Case navigation and route.

The opening click saves `fc:support:visited-on` in local storage (with session storage fallback). Returning or reloading that browser on the same date bypasses the notice. A storage event clears duplicate notices in other open tabs. Storage errors do not prevent entering the game. This is a per-browser daily preference, not account-level tracking, and it runs at page startup without interrupting an existing running game at midnight.

Game startup is deferred until the user returns from the case tab. If their browser opens the link in the background, the waiting screen offers a direct return button instead. Opening the case itself cannot start timers, Google/room connections or anti-tab-switch monitoring. No dwell time, repeat page loads, background traffic generation or automatic refreshes are added.

Verification covers New York midnight/DST, first/repeat/next-day visits, new-tab link behavior, no startup on the opening gesture, return handling, duplicate-tab synchronization and denied storage. Browser checks cover desktop, Chromebook and mobile layouts and entering a real game after the support visit.

## Reading-reef presentation (v49)

The support screen now has an original landscape/portrait reading reef matching Puffer Games, a native puffer guide on a stone ledge, a small speech bubble, and a clearer “Before the dive” title. The required daily visit, purpose, destination and immediate return remain explicit. Full image-generation prompts, paths and hashes are in [the art manifest](../assets/daily-support/art-manifest-v49.json).

Scenery uses the same half-resolution, 20-fps canvas as the other courts: slow schools of fish, rays, jellyfish, bubble vents, crabs, anemones, drifting paper, tiny sand grains and caustics. Local lantern glows and slow light rays add warmth without moving the whole background. The guide uses the existing pixel mascot/blink system. Hovering the case button creates a small water ripple.

The screen pauses while hidden, disposes the scenery and mascot work when closed, and respects both OS reduced motion and Councillion’s saved motion setting. Mobile art is separately composed; its upper edge blends into the water instead of creating a visible cut. Motion checks measured 24 canvas frames in 1.2 seconds and confirmed animation stops for reduced motion and after entry.
