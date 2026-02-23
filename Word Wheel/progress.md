Original prompt: Build Sparky Word Sprint as an iPad touch-first webview word-wheel + procedural crossword game with grade 1-5 entry points, curated grade word pools, strict countdown, grade-aware hints, synth SFX/BGM, acceleration effects, local progression, deterministic hooks, and screenshot-2-consistent pink UI style.

## 2026-02-20 - Setup
- Initialized project structure for canvas game engine, procedural generation modules, data assets, debug hooks, and scripts.
- Next: create app shell (index.html, styles, main bootstrap) and core modules.

## 2026-02-20 - Core Implementation
- Added complete scaffold: HTML/CSS UI shell, canvas renderer, touch input controller, loop, effects, and synth audio engine.
- Added procedural generation stack (seeded RNG, grade configs, letter checks, crossword board generator, grade pool loader).
- Added debug hooks (`window.render_game_to_text`, `window.advanceTime`) and control hooks (`window.__sparky`).
- Added local progression persistence and grade menu/modal flows.

## 2026-02-20 - Validation
- Installed local Playwright dependency and used skill client (copied locally for module resolution) to run gameplay captures.
- Added deterministic seed support (`?grade=1&seed=42`) and keyboard chaining to make automated solve sequences reliable.
- Verified deterministic solve pass for grade 1 seed 42: solved words `ring`, `wing`, `dig`, mode transitioned to `round-clear`, score/stars/streak updated, and no console error artifact file was produced.
- Procedural generator validation passed for all grades at `ROUNDS=20`.
- Procedural generator validation at `ROUNDS=50` passed grades 1-4; grade 5 generation is much slower and was stopped to keep iteration time practical.
- Final deterministic verification rerun completed (`?grade=1&seed=42`) and again reached `round-clear` with solved board + progression updates in state output.
- Fixed iPad/Retina UI scaling bug in renderer: layout now uses CSS viewport pixels (`canvas.clientWidth/Height`) instead of backing-store pixels, preventing oversized board tiles and off-screen wheel panel.
- Fixed drag input regression after Retina layout patch: pointer coordinates now use CSS pixel coordinates in `input.js`.
- Improved drag usability by removing adjacency-only restriction in trace building so players can connect any visible wheel letters naturally.
- Verified via Playwright drag simulation: dragged `R->I->N->G` on seed 42 and confirmed `ring` solved with score update.
- Fixed randomization bug: missing `seed` query previously coerced to `0` and forced deterministic rounds.
- `seed` is now optional, one-time, and removed from URL for normal play.
- Added per-session `roundSerial` indexing so each new round/restart generates a fresh procedural board from the grade word pool.
- Verified by opening grade 1 three times without seed and confirming different wheel + word sets each run.
- Replaced all grade pools with curated, prewritten ESL-friendly word lists emphasizing high-frequency everyday vocabulary.
- Added in-session difficulty ramp (`buildRoundConfig`) so each successive rounds in a grade gradually increases complexity (longer words/denser board/tighter timer/reduced hint help).
- Enhanced feel of interaction effects: ripple waves, smoother trail stroke, improved particle physics, tile-by-tile solved pop animations, and richer combo feedback.
- Added round difficulty details to `render_game_to_text` for deterministic testing visibility.
- Verified generation with new pools at `ROUNDS=12` across grades 1-5.
- Rewrote all grade word pools with significantly simpler, ESL-friendly curated vocabulary.
- Adjusted grade configs to reduce direct dependence on word length for difficulty progression.
- Difficulty now scales primarily via timer pressure, board density, hint budget/cooldown, and round tier.
- Added a tappable `Hint` chip in HUD that fills an entire unsolved word on board (with reduced score and dedicated hint effects).
- Verified hint behavior by automation: solvedWords increased from 0 to 1 after tapping Hint; hints remaining decremented.

## 2026-02-20 - Sequence Lock + Celebration Pass
- Added explicit strict word-order sequencing per round by deriving a deterministic `wordSequence` from board geometry (top-to-bottom, left-to-right tie-breaks), not alphabetical shuffling.
- Enforced sequence at solve-time and submit-time: only the current goal word can advance progression; out-of-order submissions now show `Next: <WORD>` guidance.
- Improved board readability for sequence play: active goal word cells now receive a warm highlight pulse so learners can see what to solve next.
- Expanded success feedback for children: added celebration banners (`Nice!`, `Great!`, `Awesome!`, etc.), stronger confetti bursts, and round-clear mega celebration effects.
- Added effect state for celebration stack and success pulse; renderer now draws animated celebration cards and wheel success ring pulses.
- Updated HUD goal text to include sequence progress (e.g., `CAT 2/4`) so exact expected order is always visible.
- Maintained full-word hint behavior with strict sequencing: hint now solves the current sequence target cleanly and advances to the next target.
- Simplified hint visual clutter by removing redundant hint fly-up text in favor of the new celebration banner.

### Verification
- Ran procedural validation: `npm test` (500 generated rounds per grade, 1-5) passed.
- Ran Playwright against this game server at `http://127.0.0.1:5177` with deterministic seed checks:
  - `output/web-game-sequence/shot-0.png` + `state-0.json` confirmed strict sequence progression state.
  - `output/web-game-sequence-reject/shot-0.png` + `state-0.json` confirmed out-of-order word is rejected and goal remains unchanged.
  - `output/web-game-celebrate/shot-0.png` confirmed stronger celebration banner and confetti on success.
  - `output/web-game-hint-seq3/shot-0.png` confirmed hint solves a full target word and advances sequence.

### TODO / Next Suggestions
- Add a tiny sequence rail in HUD (`Word 1 -> Word 2 -> Word 3`) for even clearer instruction to early readers.
- Tune celebration density on lower-end iPads if frame pacing drops during repeated combo solves.

## 2026-02-23 - Rainbow Drag VFX Compliance Pass
- Audited VFX against user requirements: pink/cute baseline was present, but drag/selection visuals were not rainbow/sparkle-forward enough.
- Updated drag trail effect model so trail sparks now drift away from the touch path over time (velocity + drag), instead of staying fixed at sampled points.
- Added rainbow rendering utilities and replaced plain trace line with layered rainbow stroke/glow.
- Added animated rainbow sparkle clusters along the active trace path to make dragging feel magical and child-friendly.
- Upgraded selected wheel-letter highlighting to rainbow outlines and secondary rainbow rims.
- Upgraded current target-word board highlight and solve glow to rainbow accents.
- Verified visuals with Playwright capture: `output/web-game-rainbow-trace3/shot-0.png`.

## 2026-02-23 - Drag-Line Removal + 3x Drag Sparkle Fade (Requested)
- Removed active drag stroke rendering from `drawTrace` in `src/game/renderer.js`.
- Kept sparkle-only drag feedback and candidate word text.
- Increased drag sparkle lifetime to 3x in `src/game/effects.js` (`life` and `maxLife` scaled by 3).
- Increased drag trail retention cap to `240` to avoid premature trimming with longer sparkle lifetimes.
- Verification: `npm test` passed (500 generated rounds per grade, 1-5).

## 2026-02-23 - Any-Order Word Completion (Requested)
- Removed strict cross-word sequence enforcement so any unsolved board word can be completed in any order.
- Kept strict in-word letter ordering unchanged: player trace/keyboard order must still exactly match a valid word spelling.
- Updated hint target selection to pick from remaining unsolved words without sequence dependency.
- Updated HUD progress to show solved words using `board.solvedCount` (solved/total), independent of sequence position.
- Updated `render_game_to_text` rules metadata:
  - `sequenceRule: "any-order-across-words"`
  - `wordCompletionRule: "strict-letter-order-within-word"`
  - `wordSequence.index` now reflects solved-word count.

### Verification
- Ran procedural validation: `npm test` passed (500 generated rounds per grade, 1-5).
- Ran Playwright scenario for grade 1 seed 42 with explicit rule checks:
  - First attempted incorrect letter order (`tac`) and continued play.
  - Solved words in non-sequence order (`cat`, `ant`, `bat`) while sequence list was `bat -> cat -> ant`.
  - Reached `round-clear` with no console errors.
- Artifacts:
  - `output/web-game-any-order-pass/shot-0.png`
  - `output/web-game-any-order-pass/state-0.json`

### TODO / Next Suggestions
- Consider removing or renaming `wordSequence` fields in runtime state if no future feature depends on designed solve ordering.

## 2026-02-23 - Round-Clear Wheel Spin + Hint Economy + Selection Fill Update
- Added `wheel.roundClearSpin` runtime state and updated effect stepping so the wheel spins at fast constant velocity during round-clear mode (instead of easing down).
- Added continuous round-clear rainbow sparkle emission around the wheel while waiting on the round-clear modal (`Next Round` / `Grade Menu`).
- Kept the per-word wheel shake/spin effect on successful word solves.
- Removed auto-hint consumption path that previously spent hints after repeated failures; hints are now manual-only via player tap/click.
- Updated hint economy so hints are no longer refilled every round: first round in a grade still starts from configured budget, then remaining hints carry to next rounds.
- Added perfect-round bonus: clearing a round with zero failures grants `+1` hint.
- Updated HUD goal chip to show progress count only (`solved/total`) without exposing the current target word text.
- Updated selected wheel-letter visuals to use a flashing rainbow background fill (no rainbow edge emphasis).

### Verification
- `npm test` passed (500 generated rounds per grade, grades 1-5).
- Playwright verification run against `http://127.0.0.1:5173/?grade=1&seed=42` using local client script:
  - `output/web-game-roundclear-spin/shot-0.png` + `state-0.json`: confirmed `mode: "round-clear"`, wheel celebration visuals active, and perfect-round hint reward applied (`hintsRemaining: 5` from base 4).
  - `output/web-game-no-auto-hint/shot-0.png` + `state-0.json`: after repeated failed submissions, hints stayed unchanged (`hintsRemaining: 4`) and no auto-filled word occurred.
  - `output/web-game-selected-rainbow/shot-0.png` + `state-0.json`: selected letters render with rainbow-filled backgrounds while tracing.
- No Playwright console error artifact files were generated in the above output folders.

### TODO / Next Suggestions
- If desired, tune round-clear sparkle density for lower-end devices by reducing emission frequency in `emitRoundClearWheelSparkles`.

## 2026-02-23 - Word Wheel Independent Folder + v2 Implementation
- Switched implementation target to `/Users/danielwang/Game Design/Sparky Flow/Word Wheel` as an independent game folder.
- Copied baseline code and continued all new work only in `Word Wheel`.

### Data + Validation
- Rebuilt grade pools to exactly `120` words each with layered overlap policy:
  - Grade1-2 overlap: `30`
  - Grade2-3 overlap: `24`
  - Grade3-4 overlap: `20`
  - Grade4-5 overlap: `15`
- Added `scripts/validate_word_pools.mjs`.
- Added npm script: `npm run test:pools`.

### Procedural Generation + Anti-Repeat
- Extended `generateRound` in `src/generation/boardGenerator.js` to accept `seenWords` and `recentWords`.
- Added selection bias to prefer unseen words and avoid recently used words when possible.
- Added `wordPoolMeta` output on generated rounds (`gradePoolSize`, `recentWordReuseBlocked`, `usedRecentWords`, `seenWordsCount`, `recentWordsCount`).
- Added grade-local runtime memory in `src/main.js` to track seen and recent words across endless rounds.

### Gameplay Rules + Debug Payload
- Kept strict in-word letter ordering and any-order across board words.
- Kept hints manual-only and no auto-hint behavior.
- Kept flawless reward of `+1 hint`.
- Added debug payload fields in `src/debug/renderToText.js`:
  - `rules.letterOrder`
  - `rules.wordOrder`
  - `rules.hintPolicy`
  - `celebration.roundClearSpinActive`
  - `wordPool.gradePoolSize`
  - `wordPool.recentWordReuseBlocked`

### Visual + VFX + Audio Refresh
- Updated global style system in:
  - `src/styles.css`
  - `src/data/uiTheme.json`
  - `index.html`
- Added major candy-arcade art refresh while preserving thick border/button language.
- Added grade card tone labels on menu cards.
- Updated renderer palette and background layers for distinct visual identity.
- Kept/strengthened rainbow interactions:
  - selected letter background rainbow fill
  - round-clear constant wheel spin + continuous rainbow sparkles
  - sparkle-heavy drag feel
- Updated effect safety caps for iPad-class performance (`MAX_TRAIL_POINTS`, `MAX_PARTICLES`, etc.).
- Updated trail sparkle lifetime to ~3 seconds fade.
- Reworked synth audio engine with event-specific methods:
  - `playTraceStart`, `playTraceAppend`, `playShuffle`, `playWordSolve`, `playInvalidWord`, `playComboBonus`, `playHintUse`, `playPerfectRound`, `playRoundClear`
- Added richer adaptive BGM sequencing in `startMusicLoop`.

### Verification
- `npm run test:pools`: passed.
- `npm test` (500 rounds x grades 1-5): passed.
- Playwright captures via local client and server at `http://127.0.0.1:5177`:
  - `output/web-game-v2-rules/shot-0.png` + `state-0.json`
    - confirms strict wrong-order rejection, any-order board completion, round-clear mode, and spin-active celebration state.
  - `output/web-game-v2-perfect/shot-0.png` + `state-0.json`
    - confirms flawless clear gives `hintsRemaining: 5` from base `4`.
  - `output/web-game-v2-selected/shot-0.png` + `state-0.json`
    - confirms rainbow selected-letter background fills.

### TODO / Follow-up
- If needed, tune word difficulty distribution in grade 3/5 pools for smoother average-length progression.
- If desired, add a second visual test harness that captures full-page overlays (HUD/menu) in addition to canvas snapshots.

## 2026-02-23 - Pool Difficulty Rebalance + Revalidated Playwright Seeds
- Rebalanced the 120-word grade pools to increase average complexity per grade while preserving overlap bounds:
  - g1 avg 3.72
  - g2 avg 4.79
  - g3 avg 5.67
  - g4 avg 6.46
  - g5 avg 6.76
- Kept overlap counts unchanged: 30 / 24 / 20 / 15.
- Updated deterministic Playwright action files for the new grade1 seed42 board (`boat`, `bat`, `boy`, `toy`).

### Re-Verification
- `npm run test:pools`: passed.
- `npm test`: passed (500 rounds per grade, grades 1-5).
- Playwright:
  - `output/web-game-v2-rules/state-0.json`: confirms rule rejection + any-order completion + round-clear spin.
  - `output/web-game-v2-perfect/state-0.json`: confirms flawless `+1 hint`.
  - `output/web-game-v2-selected/state-0.json`: confirms selected rainbow-fill letter backgrounds.

## 2026-02-23 - Grade Restart Fresh-Start + Hint Reward Popup + HUD Trim + Denser Round-Clear Sparkles
- Implemented **fresh grade restart** behavior:
  - Restart button now restarts the entire active grade run from round 1 (`restartGrade`) instead of rerolling just the current round context.
  - Grade run memory (`seenWords`/`recentWords`) is now reset whenever a grade starts, so replaying a grade is a clean run.
- Added per-grade `maxRound` tracking in save data and migrated runtime sanitization/defaults.
  - Grade-menu cards now display only `Max Round <n>` (with fallback from legacy `roundsCompleted` values).
- Implemented new stacked hint rewards at round clear:
  - `+1 hint` when finishing with more than half timer remaining.
  - `+2 hints` when finishing with zero mistakes.
  - Rewards stack, and both are reflected in the round-clear modal body.
- Added animated reward popups in celebration modal:
  - New modal reward container and animated reward chips (speed/flawless tones).
- Removed top-HUD clutter requested by user:
  - Removed water-drop badge and total-stars pill from HUD.
- Increased round-clear wheel sparkle intensity:
  - Added configurable `pushTrailPoint` emission options.
  - Increased trail capacity and significantly boosted round-clear sparkle size/density + auxiliary particle bursts.

### Verification
- `npm test` passed (500 rounds per grade, grades 1-5).
- Playwright (local server `http://127.0.0.1:5177`) round-clear validation:
  - `output/web-game-20260223-roundclear-updates-5177-pass/shot-0.png`
  - `output/web-game-20260223-roundclear-updates-5177-pass/state-0.json`
  - Confirms `mode: "round-clear"`, `hintsRemaining: 7` from base 4 (speed + flawless stacked), and celebration spin active.
- Playwright restart-grade probe:
  - `output/web-game-20260223-restart-probe-2/state-0.json`
  - Confirms restart returns to `roundIndex: 0`, `score: 0`, `hintsRemaining: 4`, with a fresh board.

### Notes / TODO
- The existing Playwright client captures canvas output (not full DOM overlays), so modal reward-chip DOM is verified by implementation and runtime flow rather than full-page screenshot artifact.

## 2026-02-23 - Grade Fresh Restart + Hint Reward Modal + HUD Trim + Denser Round-Clear Sparkles (Current Request)
- Implemented fresh grade restart behavior on HUD restart:
  - Added `restartGrade()` and bound `#btn-restart` to reset the active grade run from round 1.
  - Grade run memory (`seenWords` / `recentWords`) now resets on every `startGrade`, so restart is a true fresh run.
- Updated menu progression display to only show maximum round reached:
  - Added `gradeStats.maxRound` in save defaults, sanitization migration, and round result updates.
  - Grade cards now render `Max Round <n>` only.
- Removed requested HUD clutter:
  - Removed water-drop badge and total-stars pill from top HUD markup.
  - Removed related overlay bindings/CSS usage.
- Reworked hint rewards at celebration:
  - Added `+1 hint` reward for finishing with at least half timer remaining.
  - Added `+2 hints` reward for flawless rounds (zero mistakes).
  - Rewards stack and are applied together.
  - Added animated reward popup chips in round-clear modal (`#modal-rewards`) with tone styling and pop-in animation.
  - Added `roundClearRewards` to runtime/debug payload for deterministic verification.
- Increased round-clear wheel sparkle output substantially:
  - Added configurable emission options to `pushTrailPoint`.
  - Boosted round-clear emission burst count, sparkle size, lifetime, and auxiliary particle bursts.

### Verification
- `npm test` passed (500 generated rounds per grade, 1-5).
- Playwright round-clear verification:
  - `output/web-game-20260223-final-roundclear/shot-0.png`
  - `output/web-game-20260223-final-roundclear/state-0.json`
  - Confirmed `mode: "round-clear"`, `hintsRemaining: 7` (base 4 + speed 1 + flawless 2), and both reward entries present in `roundClearRewards`.
- Playwright restart verification:
  - `output/web-game-20260223-final-restart/shot-0.png`
  - `output/web-game-20260223-final-restart/state-0.json`
  - Confirmed restart returns to fresh round state (`roundIndex: 0`, `score: 0`, `hintsRemaining: 4`) with a new board.
- Additional speed-only reward check:
  - `output/web-game-20260223-speed-only-check/state-0.json`
  - Confirmed non-flawless fast clear grants only `+1` hint (`hintsRemaining: 5`, single speed reward item).

### TODO / Follow-up
- If needed, add a non-canvas Playwright capture path for full DOM overlays (HUD/menu/modal) to visually diff menu/HUD changes in automated artifacts.
