# AI Guide for This Project

## What the app is
- Electron application with two windows:
  - Overlay window: shows a moving indicator on the right edge of the primary screen. Always-on-top, transparent, ignores mouse/keyboard (clicks pass through). Three levels: 1) circle, 2) digits only, 3) symbol + digits (expert). Motivation modes (money, popularity, selfDevelopment, success, health, sport, creativity, learning) with per-minute formulas and saved stats.
  - Todo window: fullscreen todo list with hierarchical tasks, rich text editing, drag & drop, hotkeys, and timer integration.

## Key files
- `main.js`: Electron main process, creates overlay window (`index.html`), settings window (`settings.html`), todo window (`todo.html`), tray, IPC, timers, hotkey reset, autostart/tray toggles.
- `index.html`: Overlay renderer. Animates indicator upward with CSS; reacts to IPC events (`counter-updated`, `mode-updated`, `level-updated`, `restart-cycle`). Restart-cycle resets animation to bottom.
- `settings.html`: Settings UI. Live updates via IPC: size, opacity, color, duration (any value >=1s), timing (linear/steps), autostart, tray visibility, mode, level, reset hotkey, stats view/reset.
- `todo.html`: Todo list UI. Fullscreen window with hierarchical tasks, rich text editing, drag & drop.
- `src/utils/style.js`: Builds CSS variables for overlay from settings (duration, timing, sizes, colors).
- `src/utils/counters.js`: Counter logic (update, format, reset display counters).
- `src/store/settingsStore.js`: Settings persistence (JSON in userData). Defaults include durationSeconds=60, diameterPx=60, opacity=0.55, level=1, mode default money.
- `src/store/todoStore.js`: Todo tasks persistence (JSON in userData). Functions: readTodos, writeTodos, createTodo, updateTodo, deleteTodo, reorderTodos, loadTodosFromFile, ensureDemoTodos. Automatically creates demo tasks on first run.
- `demo-todos.json`: Demo file with example tasks for testing.
- `src/utils/todoColors.js`: Color mapping for task hierarchy levels (rainbow colors: purple, blue, cyan, green, yellow, orange, red).
- `src/utils/richEditor.js`: Rich text editor utilities (autoResize, setupRichEditor). Auto-resizes contenteditable elements and handles paste events.
- `src/todo/renderer.js`: Task rendering logic (calculateLevel, renderTask, renderTasks). Also embedded in todo.html for browser execution.
- `src/config/modes.js`: Motivation modes config and helpers.
- `preload/overlayPreload.js` / `preload/settingsPreload.js` / `preload/todoPreload.js`: Expose safe IPC APIs to renderer.
- `tests/unit/positioning.test.js`, `tests/unit/todoStore.test.js`, `tests/unit/todoColors.test.js`, `tests/unit/todoRenderer.test.js`, `tests/unit/richEditor.test.js`, `tests/integration/smoke.test.js`, `tests/integration/todoWindow.test.js`: Jest projects (unit, integration).

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
- Todo window added: maximized todo list with hierarchical tasks. Tree-style hierarchy visualization with continuous vertical and horizontal lines (like file manager), dots at line ends, compact 10px spacing. Rich text editing with auto-resize, content saved automatically on input with debounce. Focus preserved during updates. Height properly restored for multi-line tasks on reload. Closing todo window also closes timer overlay. Action icons appear on task click: "+" (adds subtask), "▶" (starts timer), "✓" (marks as completed and hides). Configurable hotkeys: Insert (add subtask), F5 (execute), Delete (complete). Hotkeys work only when todo window is active and not when editing text. Demo tasks created automatically on first run. Can load tasks from JSON file via IPC.

## Packaging notes
- electron-builder config in `package.json` -> `build`. Portable output `dist/win-unpacked/Its-time.exe`. Default Electron icon used unless provided.


