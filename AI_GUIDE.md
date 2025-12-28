# AI Guide for This Project

**ВАЖНО: Перед началом работы с проектом ВСЕГДА читайте README.md для понимания:**
- Что это за проект и его философия
- Какие функции реализованы
- Какие функции планируются
- Общая структура и назначение компонентов

Для общей информации о проекте см. [README.md](README.md). Список реализованного и планируемого функционала см. [README.md](README.md).

## What the app is
- Electron application with two windows:
  - Overlay window: shows a moving indicator on the right edge of the primary screen. Always-on-top, transparent, ignores mouse/keyboard (clicks pass through). Three levels: 1) circle, 2) digits only, 3) symbol + digits (expert). Motivation modes (money, popularity, selfDevelopment, success, health, sport, creativity, learning) with per-minute formulas and saved stats.
  - Todo window: fullscreen todo list with hierarchical tasks, rich text editing, drag & drop, hotkeys, and timer integration.

**Planned features:** See [README.md](README.md) section "Планируемый функционал" for complete list of planned Todo features.

## Key files

**Main process:**
- `main.js`: Electron main process, creates overlay window (`index.html`), settings window (`settings.html`), todo window (`todo.html`), tray, IPC handlers, timers, hotkey reset, autostart/tray toggles.

**Overlay component:**
- `index.html`: Overlay renderer. Animates indicator upward with CSS; reacts to IPC events (`counter-updated`, `mode-updated`, `level-updated`, `restart-cycle`). Restart-cycle resets animation to bottom.
- `preload/overlayPreload.js`: Exposes safe IPC API (`overlayApi`) to overlay renderer.

**Settings component:**
- `settings.html`: Settings UI. Live updates via IPC: size, opacity, color, duration (any value >=1s), timing (linear/steps), autostart, tray visibility, mode, level, reset hotkey, stats view/reset.
- `preload/settingsPreload.js`: Exposes safe IPC API (`settingsApi`) to settings renderer.

**Todo component:**
- `todo.html`: Todo list UI. Fullscreen window with hierarchical tasks. Подключает модули через script теги.
- `preload/todoPreload.js`: Exposes safe IPC API (`todoApi`) to todo renderer.
- `src/todo/state.js`: Централизованное управление состоянием (focusedElement, activeTaskId, currentTodos, draggingTaskId, todoHotkeys, updateTimeout).
- `src/todo/hierarchy.js`: Утилиты для работы с иерархией задач (calculateLevel, isTaskVisible, hasChildren, getLastVisibleDescendant, getAllDescendants, isDescendant).
- `src/todo/hierarchyLines.js`: Отрисовка SVG линий иерархии (drawHierarchyLines).
- `src/todo/dragDrop.js`: Логика drag&drop для перетаскивания задач (setupDragDrop).
- `src/todo/hotkeys.js`: Обработка горячих клавиш (parseHotkey, matchesHotkey, setupHotkeys).
- `src/todo/renderer.js`: Рендеринг задач (renderTask, renderTasks, createTaskExpander, createTaskActions, focusTask, refreshTodos).

**Utils components:**
- `src/utils/style.js`: Builds CSS variables for overlay from settings (duration, timing, sizes, colors).
- `src/utils/counters.js`: Counter logic (update, format, reset display counters).
- `src/utils/positioning.js`: Window positioning utilities (computeWindowBoundsForRightEdge).
- `src/utils/color.js`: Color conversion utilities (hexToRgb).
- `src/utils/richEditor.js`: Rich text editor utilities (autoResize, setupRichEditor). Auto-resizes contenteditable elements, handles paste events, focus tracking, debounce для сохранения, интеграция с API.
- `src/utils/trayIcon.js`: Создание иконки для системного трея.

**Store components:**
- `src/store/settingsStore.js`: Settings persistence (JSON in userData). Defaults include durationSeconds=60, diameterPx=60, opacity=0.55, level=1, mode default money. Для общей информации о настройках см. [README.md](README.md).
- `src/store/todoStore.js`: Todo tasks persistence (JSON in userData). Functions: readTodos, writeTodos, createTodo, updateTodo, deleteTodo, reorderTodos, loadTodosFromFile, ensureDemoTodos. Automatically creates demo tasks on first run. Список реализованного и планируемого функционала см. [README.md](README.md).

**Config components:**
- `src/config/modes.js`: Motivation modes config and helpers (money, popularity, selfDevelopment, success, health, sport, creativity, learning).

**Test files:**
- `tests/unit/positioning.test.js`, `tests/unit/todoStore.test.js`, `tests/unit/todoRenderer.test.js`, `tests/unit/richEditor.test.js`, `tests/integration/smoke.test.js`, `tests/integration/todoWindow.test.js`: Jest projects (unit, integration).

**Demo data:**
- `demo-todos.json`: Demo file with example tasks for testing.

## Behaviors to know
- Counter ticks each cycle (`durationSeconds`), updating stats and display counters per mode.
- Reset hotkey (default `Ctrl+Shift+R`): clears display counters, restarts timer and sends `restart-cycle` so animation and cycle start from bottom/zero.
- Overlay ignores pointer events; clicks go to underlying windows.

## Development principles
- При разработке, если появляется логически независимый функционал, который можно вынести в отдельный файл и переиспользовать, то нужно так и сделать - вынести в отдельный файл и переиспользовать.
- Всегда разбивать доработку на маленькие кусочки и после каждого кусочка:
  - Прогонять тесты (`npm test`)
  - Проверять консоль браузера/приложения на отсутствие ошибок
  - Убеждаться, что функционал работает корректно
  - Только после этого переходить к следующему кусочку
- После получения одобрения о том, что функционал работает, нужно просмотреть весь код на предмет оптимизации, переиспользования и уменьшения размера кодовой базы:
  - Найти неиспользуемые файлы и удалить их
  - Найти дублирование кода и вынести в переиспользуемые функции
  - Оптимизировать импорты и зависимости
  - Упростить сложные функции
  - Удалить неиспользуемый код

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


