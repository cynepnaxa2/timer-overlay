# AI Guide for This Project

## What the app is
- Electron overlay for Windows that shows a moving indicator on the right edge of the primary screen. It reminds about time passing and can display counters/motivation stats.
- Always-on-top, transparent, ignores mouse/keyboard (clicks pass through).
- Three levels: 1) circle, 2) digits only, 3) symbol + digits (expert).
- Motivation modes (money, popularity, selfDevelopment, success, health, sport, creativity, learning) with per-minute formulas and saved stats.

## Key files
- `main.js`: Electron main process, creates overlay window (`index.html`), settings window (`settings.html`), tray, IPC, timers, hotkey reset, autostart/tray toggles.
- `index.html`: Overlay renderer. Animates indicator upward with CSS; reacts to IPC events (`counter-updated`, `mode-updated`, `level-updated`, `restart-cycle`). Restart-cycle resets animation to bottom.
- `settings.html`: Settings UI. Live updates via IPC: size, opacity, color, duration (any value >=1s), timing (linear/steps), autostart, tray visibility, mode, level, reset hotkey, stats view/reset.
- `src/utils/style.js`: Builds CSS variables for overlay from settings (duration, timing, sizes, colors).
- `src/utils/counters.js`: Counter logic (update, format, reset display counters).
- `src/store/settingsStore.js`: Settings persistence (JSON in userData). Defaults include durationSeconds=60, diameterPx=60, opacity=0.55, level=1, mode default money.
- `src/config/modes.js`: Motivation modes config and helpers.
- `preload/overlayPreload.js` / `preload/settingsPreload.js`: Expose safe IPC APIs to renderer.
- `tests/unit/positioning.test.js`, `tests/integration/smoke.test.js`: Jest projects (unit, integration).

## Behaviors to know
- Counter ticks each cycle (`durationSeconds`), updating stats and display counters per mode.
- Reset hotkey (default `Ctrl+Shift+R`): clears display counters, restarts timer and sends `restart-cycle` so animation and cycle start from bottom/zero.
- Overlay ignores pointer events; clicks go to underlying windows.

## Commands
- Install: `npm install`
- Dev run: `npm start`
- Tests: `npm test` (or `npm run test:unit`, `npm run test:integration`)
- Build portable Win dir: `npm run build:portable` (enable Windows Developer Mode/admin to allow symlinks; otherwise winCodeSign unpack fails).

## Recent notable changes
- Duration limits removed: durationSeconds can be any value >=1s; animation stays smooth (linear timing).
- Restart-cycle event added: on reset hotkey, overlay animation restarts from bottom; digits reset accordingly.

## Packaging notes
- electron-builder config in `package.json` -> `build`. Portable output `dist/win-unpacked/Its-time.exe`. Default Electron icon used unless provided.


