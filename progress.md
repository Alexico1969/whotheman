Original prompt: Let's start from scratch. Build me a web app that just listens to mic input and 1-0n-1 displays it on the screen.

- Rebuilt `index.html` from scratch as a minimal mic transcription page using the browser SpeechRecognition API.
- Added start/stop controls, a live transcript region, and a finalized phrase list for confirmed speech chunks.
- Added a visible debug log plus explicit `getUserMedia` permission request to make browser speech-recognition failures easier to diagnose.
- Switched recognition to short auto-restarting sessions (`continuous = false`) because that pattern is usually more reliable in Chromium than one long continuous session.
- Added a dedicated mic status section showing the device label Chrome granted, browser permission state when available, and a live VU meter using Web Audio on the acquired microphone stream.
- Changed startup behavior so the app temporarily tears down the live VU-monitor audio stream before starting `SpeechRecognition`, then restores the meter afterward, because Chrome can abort speech sessions when both compete for the mic.
- Rebuilt `index.html` into the actual game UI: host panel on the left, scored question history on the right, and the mic/device/permission/VU info compressed into the bottom status bar.
- Added the supplied famous-person roster, one-question-at-a-time microphone capture, strict feedback labels (`yes`, `no`, `I couldn't hear that`, `that is not a yes or no question`), and a win overlay with play-again flow.
- Claude answer checking cannot happen directly in client-side JS; it needs a server-side runtime that can access `CLAUDE_KEY`.
- Changed the game to auto-listen continuously between host turns, added transcript cleanup for common mic mishears like `the man` -> `a man`, and then moved Claude access behind server-side endpoints.
- Updated the sticky bottom status bar so it stays visible while scrolling and shows explicit API-key registration state from the backend runtime.
- Fixed misleading error feedback so backend/judging failures no longer show `I couldn't hear that` when the transcript was actually captured.
- Switched the footer from page-flow sticky behavior to a fixed viewport status bar so it remains visible while scrolling.
- Added local handling for simple gender questions like `Is it a man?` and `Is it a woman?` so the exact heard question is processed directly instead of depending on Claude for that basic case.
- Replaced the local `server.js` backend with Netlify Functions in `netlify/functions/` plus `netlify.toml` redirects, so deployed builds can use Netlify-hosted `CLAUDE_KEY` instead of a local server process.
