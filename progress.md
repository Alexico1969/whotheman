Original prompt: Let's start from scratch. Build me a web app that just listens to mic input and 1-0n-1 displays it on the screen.

- Rebuilt `index.html` from scratch as a minimal mic transcription page using the browser SpeechRecognition API.
- Added start/stop controls, a live transcript region, and a finalized phrase list for confirmed speech chunks.
- Added a visible debug log plus explicit `getUserMedia` permission request to make browser speech-recognition failures easier to diagnose.
- Switched recognition to short auto-restarting sessions (`continuous = false`) because that pattern is usually more reliable in Chromium than one long continuous session.
- Added a dedicated mic status section showing the device label Chrome granted, browser permission state when available, and a live VU meter using Web Audio on the acquired microphone stream.
- Changed startup behavior so the app temporarily tears down the live VU-monitor audio stream before starting `SpeechRecognition`, then restores the meter afterward, because Chrome can abort speech sessions when both compete for the mic.
- Rebuilt `index.html` into the actual game UI: host panel on the left, scored question history on the right, and the mic/device/permission/VU info compressed into the bottom status bar.
- Added the supplied famous-person roster, one-question-at-a-time microphone capture, strict feedback labels (`yes`, `no`, `I couldn't hear that`, `that is not a yes or no question`), and a win overlay with play-again flow.
- Claude answer checking is wired for a runtime-injected key, but a standalone browser page still cannot read `CLAUDE_KEY` directly from the machine environment without some server-side or launch-time injection.
- Changed the game to auto-listen continuously between host turns, added transcript cleanup for common mic mishears like `the man` -> `a man`, and moved Claude access to a local `server.js` backend that reads `process.env.CLAUDE_KEY`.
- Updated the sticky bottom status bar so it stays visible while scrolling and shows explicit API-key registration state from the local server.
- Fixed misleading error feedback so backend/judging failures no longer show `I couldn't hear that` when the transcript was actually captured.
