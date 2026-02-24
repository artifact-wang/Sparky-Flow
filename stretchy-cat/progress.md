Original prompt: Read this code base and modify on it. Goals: keep mechanics the same, overhaul art/UI into a proper level-based game with personalized SVG art style, reference Figma files https://www.figma.com/design/WS5LZotFDa4qMabDo6pI7L/SPARKLI?node-id=441-38259&t=MlaIZIZ2CaBRYJxW-0 and https://www.figma.com/design/Q0WVXq9uuiAQWtihINrN1y/Sparkli---UI-Kit?node-id=46-165&t=PYeRxxgnRnzFawp6-1, and polish/validate the UI.

Notes:
- Project copied into writable workspace path: /Users/danielwang/Game Design/Sparky Flow/stretchy-cat (source in Downloads is read-only under sandbox).
- Mechanics map completed: App.tsx + logic/levelGenerator.ts govern timer, score, path rules, level progression.
- Figma MCP check failed due missing FIGMA_OAUTH_TOKEN; proceeding with best-effort art direction fallback.

TODO:
- Reskin layout/HUD/grid/cells/game-over/info-dialog with cohesive Sparkli-like theme.
- Keep mechanics unchanged.
- Run build and interaction validation.

Update:
- Rebuilt UI shell in App.tsx with polished level HUD, animated backdrop, progress display, and timer badge.
- Reworked Grid/Cell rendering with custom SVG-driven tile art, path visuals, collectible warnings, and obstacle icons.
- Re-styled Footer, GameOver modal, and Info dialog to match a cohesive bright/pastel Sparkli-like style.
- Removed dependency on broken external image imports in cell/info art; visuals are now self-contained.
- Added window.render_game_to_text and window.advanceTime hooks for deterministic external testing compatibility.

Validation:
- npm install: success.
- npm run build: success (vite production build completed).
- Playwright validation: success using local copy of skill client script (`scripts/web_game_playwright_client.js`) due module-resolution mismatch when running from skill path.
- Captured artifacts:
  - output/web-game-main/shot-0..3.png + state-0..3.json (UI + interaction baseline)
  - output/web-game-sweep/shot-0..2.png + state-0..2.json (confirmed movement + score/timer/path updates)
- No console/page errors were emitted by the Playwright client runs.

Remaining context:
- Figma MCP server is configured but inaccessible in this session due missing FIGMA_OAUTH_TOKEN.
- Current visual direction is best-effort Sparkli-inspired without direct node extraction.

Figma MCP follow-up:
- Verified remote MCP auth via whoami (daniel@sparkli.ai).
- Direct access to file WS5LZotFDa4qMabDo6pI7L returned permission/access error.
- File Q0WVXq9uuiAQWtihINrN1y is accessible; pulled metadata and design context for node 50:390 (Avatars / Sparkli) and screenshot.
- MCP then hit plan seat limit (tool call cap), blocking additional node fetches/screenshots.

Implementation from fetched Figma data:
- Updated the in-game head avatar style in components/Cell.tsx to match Sparkli character silhouette/eyes/color direction using extracted visual references.
- Rebuilt and validated with Playwright capture: output/web-game-figma-pass/shot-0.png.

New request implementation (entry menu + records):
- Added new component: components/EntryMenu.tsx
  - Start screen with hero card, run stats, and recent run history.
  - Start button (`#menu-start-button`) for automated validation hooks.
  - Clear records action.
- Updated App.tsx:
  - Added menu/play flow state (`hasStarted`).
  - Added persistent run statistics in localStorage (`stretchy-cat-run-stats-v1`).
  - Records tracked: best score, highest level, total runs, recent runs (win/lose/quit).
  - Added "return to menu" flow that records quit runs.
  - Added menu-aware `render_game_to_text` output.
- Updated FooterLeftContent.tsx with `Main Menu` + `Restart Run` actions.
- Updated index.css with full menu layout and responsive styling.

Figma MCP retry status:
- Rechecked with remote MCP and whoami.
- Seat still reports: Starter / View.
- Calls to UI nodes still return tool-call limit errors.
- WS5LZ... file still returns access error.
- Could not pull additional direct button/icon nodes in this pass due these constraints.

Validation:
- npm run build: PASS
- Playwright (menu capture): output/web-game-menu/shot-0.png + state-0.json mode=menu
- Playwright (start from menu + gameplay): output/web-game-play/shot-0.png, shot-1.png + state files

Latest Figma MCP cycle (new copy files):
- Dev/Pro auth path verified with `whoami`:
  - `Sparkli` workspace seat = `Dev`, tier = `pro`.
- Pulled metadata/design context/screenshot from:
  - `di2uJCXKEkUZb3APbwJ9ff`: nodes `4:674` (IconButton Secondary), `4:673` (Control Panel), `4:671` (RainbowPath/App)
  - `s4mggbctzDKCzvWC7bcFgU`: node `3:77` (cover)
- Noted structural limitation: large "Games" area in first file is mostly flattened screenshot rectangles, not reusable component nodes.

UI polish pass applied from fetched nodes:
- `components/Icons.tsx`
  - Added reusable icon set: `FigmaCloseIcon`, `InfoIcon`, `HomeIcon`, `RestartIcon` (while keeping `TimerIcon`).
- `App.tsx`
  - Added in-game help entry point (top-right Figma-style icon button).
  - Added controlled help modal rendering via `InfoDialog`.
  - Kept all core mechanics and scoring/timer/level flow untouched.
- `components/InfoDialog.tsx`
  - Converted close control to Figma-style hard-shadow icon button.
  - Added proper `close` event handling so Esc/backdrop close syncs React state.
- `components/FooterLeftContent.tsx`
  - Upgraded `Main Menu` and `Restart Run` actions with icons and hard-shadow button style.
- `components/EntryMenu.tsx`
  - Added top rainbow accent bar and "latest run" summary chip.
  - Improved run-row semantics (`is-win`, `is-lose`, `is-quit`) for richer visual tags.
  - Upgraded clear/start controls to new button language.
- `index.css`
  - Introduced a stronger Sparkli control language inspired by Figma `Buttons / IconButton / Secondary`:
    - dark stroke + offset hard shadow
    - card refinements, motion reveal, richer menu hierarchy
    - responsive updates for HUD icon stack and action bars
  - Updated typography stack with `Bricolage Grotesque` for product-like headings.
- `components/Grid.tsx`
  - Mobile board sizing tuned to avoid footer overlap (smaller tile cap on narrow screens).

Validation (latest pass):
- npm run build: PASS
- Desktop Playwright:
  - output/web-game-menu-v2/shot-0.png + state-0.json (menu mode)
  - output/web-game-polish-v2/shot-0.png + state-0.json (playing mode, controls functional)
- Mobile Playwright (390x844):
  - Added viewport support to `scripts/web_game_playwright_client.js` via `--viewport-width/--viewport-height`
  - output/web-game-mobile-v2/menu/shot-0.png + state-0.json
  - output/web-game-mobile-v2/gameplay/shot-0.png + state-0.json
- No generated `errors-*.json` in the new output folders.

Character update pass (user-provided Sparkli SVG inspiration):
- Added shared character component: `components/SparkliCharacter.tsx`.
  - Single reusable Sparkli drawing with two variants:
    - `head` for in-grid player head
    - `badge` for entry-menu avatar
  - Design updated to better match provided Sparkli reference (pink/purple body, side swirl, eye treatment, rounded mascot silhouette).
- Replaced duplicated character SVGs with shared component:
  - `components/Cell.tsx`: `CatHeadIcon` now renders `<SparkliCharacter variant="head" />`.
  - `components/EntryMenu.tsx`: menu avatar now renders `<SparkliCharacter variant="badge" />`.
- Core mechanics unchanged (pathing, timer, scoring, win/loss flow untouched).

Validation (this pass):
- `npm run build`: PASS.
- Playwright captures:
  - Menu: `output/web-game-sparkli-character/menu/shot-0.png` + `state-0.json`.
  - Gameplay baseline: `output/web-game-sparkli-character/gameplay/shot-0.png`, `shot-1.png` + states.
  - Gameplay interaction check: `output/web-game-sparkli-character/gameplay-move2/shot-0.png` + `state-0.json`.
    - Confirmed movement/state progression after start (`pathLength: 2`, `score: 10`, `timerStarted: true`).
- No `errors-*.json` generated in these new output directories.

Figma brand + character implementation pass (requested links):
- Verified MCP auth via `whoami`:
  - `Sparkli` workspace seat = Dev, tier = pro
  - `Daniel Wang's team` seat = View, tier = starter
- Calls against `WS5LZotFDa4qMabDo6pI7L` nodes `567:42002` and `567:41994` returned MCP limit errors.
- Confirmed root cause via MCP doc (`plans-access-and-permissions.md`): View/Collab seats are capped at 6 tool calls/month even on paid orgs.

Pro-path fallback (successful):
- Pulled equivalent brand nodes from pro copy file `di2uJCXKEkUZb3APbwJ9ff`:
  - node `567:42002` (Sparkli wordmark)
  - node `567:41994` (spark icon mark)
- Pulled character node from pro UI kit copy `s4mggbctzDKCzvWC7bcFgU`:
  - node `874:2520` (`Avatars / Sparkli`, Size=XL, Emotion=Neutral)
  - screenshot/context used as visual source for character redraw.

Code updates:
- Added `components/BrandMarks.tsx`:
  - `SparkliWordmark`
  - `SparkliStarsMark`
- Updated `components/SparkliCharacter.tsx` to a Figma-aligned Sparkli avatar look (teardrop silhouette, outer swirl ring, star-like eye highlights, badge feet variant).
- Updated `App.tsx`:
  - Added brand strip (stars + wordmark) into HUD title card.
- Updated `components/EntryMenu.tsx`:
  - Added menu header brand placement combining rainbow bar + stars + wordmark.
- Updated `index.css`:
  - New brand mark styles (`sparkli-brand-strip`, `sparkli-brand-stars`, `sparkli-wordmark`, menu variants).
  - Minor avatar sizing adjustment for updated character component.

Validation:
- `npm run build`: PASS.
- Playwright screenshots:
  - menu: `output/web-game-figma-brand/menu/shot-0.png`
  - gameplay: `output/web-game-figma-brand/gameplay/shot-0.png`
  - extra interaction run: `output/web-game-figma-brand/gameplay-move/shot-0.png`
- No generated `errors-*.json` in these run directories.

User request pass (remove cat text + use assets/Sparkli.svg):
- Replaced remaining user-facing cat copy with Sparkli wording:
  - `App.tsx`: aria label, loading copy, help goal text, title (`Sparkli Trail Quest`), run stats storage key (`sparkli-run-stats-v1`).
  - `components/GameOver.tsx`: win message now references Sparkli.
  - `components/EntryMenu.tsx`: hero greeting now Sparkli-themed.
  - `metadata.json`: name/description updated to Sparkli.
  - `README.md`: removed old `stretchy_cat` AI Studio URL text.
- Switched character rendering to the provided asset:
  - `components/SparkliCharacter.tsx` now imports and renders `assets/Sparkli.svg`.
  - `components/Cell.tsx`: renamed head icon component to `SparkliHeadIcon`.
  - `index.css`: updated avatar/head selectors from `svg` to Sparkli image classes.
- Package naming cleanup:
  - `package.json` + `package-lock.json`: package name changed to `sparkli-trail`.

Validation (this pass):
- `npm run build`: PASS.
- Playwright captures:
  - menu: `output/web-game-sparkli-svg/menu/shot-0.png` + `state-0.json`.
  - gameplay: `output/web-game-sparkli-svg/gameplay/shot-0.png` + `state-0.json`.
- Visual check confirms `Sparkli.svg` appears in menu avatar and active board head token.
- No `errors-*.json` files generated under `output/web-game-sparkli-svg`.

Notes:
- Remaining `stretchycat` strings are internal audio asset path segments in `App.tsx` (`/media/audio/sfx/stretchycat/...`) kept unchanged to avoid breaking SFX path resolution.

User feedback pass (word-wheel style outward sparkles, invisible line geometry):
- Updated trail rendering to emphasize particle emission over visible connectors:
  - `components/Cell.tsx`:
    - Replaced free-floating sparkle placement with emitter origins along hidden path nodes and link segments.
    - Added directional outward travel vectors (`travelX`, `travelY`) for each sparkle particle.
    - Emission density and burst count still scale with `completionRatio` (more particles as level completion increases).
  - `index.css`:
    - Made path geometry invisible (`.sparkli-path-node`, `.sparkli-link`, `.sparkli-tail-dot` now hidden/transparent).
    - Added outward particle animation (`@keyframes sparkTrailEject`) using per-particle translation vars.
    - Kept only sparkle particles visible for trail feedback.

Validation (this pass):
- `npm run build`: PASS.
- Playwright captures (escalated run for browser sandbox reliability):
  - baseline: `output/web-game-sparkli-scout-v2/initial/shot-0.png` + `state-0.json` (`pathLength: 1`)
  - gameplay: `output/web-game-sparkli-scout-v2/gameplay/shot-0.png` + `state-0.json` (`pathLength: 4`)
- No generated `errors-*.json` in `output/web-game-sparkli-scout-v2`.

Performance optimization pass (spark trail FPS):
- Root issue identified: too many animated sparkle DOM nodes per path tile (origin points x burst count x full path length) + expensive CSS (`clip-path` star polygons and stacked `drop-shadow` filters).
- Optimizations applied in `components/Cell.tsx`:
  - Added quality scaling for low-power devices (`prefers-reduced-motion`, low memory/cores).
  - Limited sparkle emission to recent active path window near the head instead of entire historical path.
  - Reduced origin points and burst counts per connector; lowered particle size/travel/duration cost.
- Optimizations applied in `index.css`:
  - Replaced `clip-path` spark stars with rounded particles.
  - Removed multi-layer `drop-shadow` filter usage; reduced glow/shadow cost.
  - Kept outward ejection motion and invisible path geometry.

Validation (optimization pass):
- `npm run build`: PASS.
- Playwright capture: `output/web-game-sparkli-scout-v3/gameplay/shot-0.png` + `state-0.json`.

Follow-up tuning pass (user requested original feel, 3x larger + 3x sparser + simpler logic):
- Reworked sparkle logic in `components/Cell.tsx`:
  - Removed multi-origin/per-connection burst logic and low-power branching.
  - Simplified to a small fixed emitter model on active recent path cells only.
  - Spark count reduced to ~1/3 of prior density (`2..4` particles per active tile).
  - Spark size increased to ~3x visual size range.
- Reworked sparkle style in `index.css`:
  - Restored star-like sparkle shape (`clip-path` star) for the original look.
  - Kept invisible trail geometry.
  - Reduced expensive visual effects (lighter shadows, no heavy stacked filter pipeline).
- Validation:
  - `npm run build`: PASS.
  - Playwright capture: `output/web-game-sparkli-scout-v4/gameplay/shot-0.png` + `state-0.json`.

Path readability + density tuning (lightweight):
- User feedback: trail source lines/turns not clear enough; requested denser sparkle while keeping perf.
- Implemented in `components/Cell.tsx`:
  - Added simple connector-aware emitter anchors (center + per-direction midpoint).
  - Kept simple O(n) particle generation (no nested burst/origin loops).
  - Increased sparkle density moderately (`4..6` particles on active emitter cells).
  - Maintained active-path window limit (`last 3` path cells + head) to keep cost bounded.
- Implemented in `index.css`:
  - Added lightweight guide glow for hidden path rails/nodes (low alpha, no expensive blur stack) so turns/lines are visible.
  - Kept star sparkle shape and outward motion.
- Validation:
  - `npm run build`: PASS.
  - Playwright capture: `output/web-game-sparkli-scout-v5/gameplay/shot-0.png` + `state-0.json`.

User request pass (game-phase Sparkli transform):
- Request: in gameplay (not menu), rotate Sparkli anti-clockwise by 90 degrees and make it 1.25x larger.
- Updated `components/Cell.tsx`:
  - `SparkliHeadIcon` now applies a game-only transform offset and scale:
    - rotation offset: `-90deg` (anti-clockwise)
    - scale: `1.25`
  - Menu avatar remains unchanged because it uses `SparkliCharacter` `badge` variant in `EntryMenu.tsx`.

Validation (this pass):
- `npm run build`: PASS.
- Playwright capture (menu -> gameplay): `output/web-game-sparkli-rotate-scale/shot-0.png` + `state-0.json` (`mode: "playing"`).
- No generated `errors-*.json` in `output/web-game-sparkli-rotate-scale`.
