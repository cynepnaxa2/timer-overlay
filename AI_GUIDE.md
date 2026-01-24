# AI Guide for This Project

**ВАЖНО: Перед началом работы с проектом ВСЕГДА читайте README.md для понимания:**
- Что это за проект и его философия
- Какие функции реализованы
- Какие функции планируются
- Общая структура и назначение компонентов

Для общей информации о проекте см. [README.md](README.md).

## Development principles
- **Базовые правила:** Соблюдай все общие user rules, они будут предоставлены средой разработки либо отдельным файлом.
- **Инкапсуляция:** При разработке, если появляется логически независимый функционал, который можно вынести в отдельный файл и переиспользовать, то нужно так и сделать.
- **Итеративность:** Всегда разбивать доработку на маленькие кусочки и после каждого кусочка:
  - Прогонять тесты (`npm test`)
  - Проверять консоль браузера/приложения на отсутствие ошибок
  - Убеждаться, что функционал работает корректно
  - Только после этого переходить к следующему кусочку
- **Чистка кода:** После получения одобрения о том, что функционал работает, нужно просмотреть весь код на предмет оптимизации и уменьшения размера кодовой базы:
  - Найти неиспользуемые файлы и удалить их
  - Найти дублирование кода и вынести в переиспользуемые функции
  - Оптимизировать импорты и зависимости
  - Упростить сложные функции
  - Удалить неиспользуемый код

## 📁 Архитектура и Технологии

### Стек
- **Platform**: Electron (Main Process)
- **UI Framework**: React + Vite
- **Language**: TypeScript (Renderer) / JavaScript (Main - legacy parts)
- **Styling**: Tailwind CSS + Shadcn/UI (partial) + Lucide Icons
- **State**: Zustand (Renderer Stores) + Node.js Singletons (Main State)
- **Drag & Drop**: @dnd-kit
- **Testing**: Vitest + React Testing Library

### Поток данных (Data Flow)
1. **Renderer (React)**: Пользователь взаимодействует с UI. Zustand store обновляется оптимистично.
2. **IPC Bridge**: Store вызывает методы через `window.todoApi` / `window.settingsApi`.
3. **Main Process**: `ipcHandlers.js` принимает запрос.
4. **Service Layer**: `todoService.js` выполняет бизнес-логику (валидация, сложные операции).
5. **Persistence**: `todoStore.js.legacy` или `settingsStore.js.legacy` пишут JSON на диск.
6. **Broadcast**: Main process уведомляет все окна об изменениях (`todos-updated`, `settings-updated`).

---

## 🚀 Детальный список функционала (Feature List)

### 1. Overlay (Таймер-Индикатор)
*Глобальный визуальный таймер, который "всплывает" поверх всех окон.*

- **Механизм**: Окно Electron с `transparent: true`, `frame: false`, `alwaysOnTop: true`, `pointerEvents: none` (прокликиваемое).
- **Файл**: `src/overlay/OverlayWindow.tsx`
- **Анимация**:
  - CSS Keyframes `@keyframes rise` перемещают элемент снизу вверх.
  - Длительность анимации синхронизирована с `settings.durationSeconds`.
  - Цикл перезапускается по событию `restart-cycle` из Main process (`src/main/timerManager.js`).
- **Режимы отображения (Levels)**:
  - **Level 1 (Basic)**: Цветной круг с символом режима ($/❤️/etc). Размер зависит от `diameterPx`.
  - **Level 2 (Counter)**: Только крупные цифры счетчика (накопленная "прибыль" или время).
  - **Level 3 (Expert)**: Glassmorphism плашка с эмодзи и значением.
- **Кастомизация**: Цвет, прозрачность, размер, stepped-timing (рывками) vs linear (плавно).

### 2. Todo Manager (Задачи и Фокус)
*Полноэкранный (или оконный) менеджер задач с глубокой иерархией.*

- **Файл**: `src/todo/TodoWindow.tsx`
- **Task Item UI**:
  - `textarea` с авто-высотой (auto-resize) для ввода текста.
  - Индикатор фокуса (синяя полоска слева).
  - Кнопки действий (Hover): Add Subtask, Start Timer, Complete, Delete.
- **Иерархия (Nesting)**:
  - Бесконечная вложенность задач.
  - Визуализация отступов через prop `depth` в `TaskItem.tsx` (padding-left = depth * 24px).
  - **Logic**: Рекурсивная функция `getFlattenedTasks` преобразует дерево в плоский список для рендеринга.
- **Drag & Drop**:
  - Библиотека `@dnd-kit`.
  - **Drop Zones**:
    - `Top`: Вставить перед задачей.
    - `Center`: Превратить задачу в родителя и вложить перетаскиваемый элемент внутрь.
    - `Bottom`: Вставить после задачи.
  - **Алгоритм**: `calculateZone` в `TodoWindow.tsx` делит высоту целевого элемента на 3 части.
- **Task Types**:
  - `collapsed`: Сворачивание подзадач.
  - `subtaskType`: 'list' (вертикальный) или 'variants' (горизонтальная сетка).
- **Hotkeys (Клавиатурное управление)**:
  - Локальная обработка в `useEffect` (`TodoWindow.tsx`).
  - `Enter` / `Ctrl+Alt+N`: Создать соседа (Sibling).
  - `Tab` / `Ctrl+Alt+S`: Создать подзадачу (Child).
  - `ArrowUp/Down`: Навигация фокуса по списку.
  - `Delete`: Удаление (первое нажатие - запрос подтверждения, второе - удаление).
  - `Space`: Отметить выполненным.
  - `Ctrl+Enter`: Запустить таймер для текущей задачи.

### 3. Settings & Modes (Настройки)
- **Файл**: `src/settings/SettingsWindow.tsx`
- **Режимы (Modes)**:
  - Пресеты: Money, Popularity, Health, Learning и др.
  - Влияют на эмодзи и символ в оверлее.
  - Файл конфигурации: `src/config/modes.js`.
- **Синхронизация**:
  - Возможность выбора папки хранения `todos.json` (например, в Dropbox/Google Drive).
  - Реализация: `ipcMain.handle('select-sync-folder')`.
- **Автозапуск**: Через `app.setLoginItemSettings` в Electron.

### 4. System Integration
- **Tray Icon**:
  - Генерация PNG на лету из canvas (`src/utils/trayIcon.js`) чтобы отображать текущее состояние/цвет.
  - Контекстное меню для скрытия/показа окон.
- **Global Hotkeys**:
  - `Ctrl+Shift+R` (дефолт): Сброс цикла таймера. Обрабатывается в `timerManager.js`.
- **Window Positioning**:
  - Прилипание к краям экрана (`src/utils/positioning.js`).

### 5. Data Persistence
- **Stores**:
  - `todos.json`: Массив задач.
  - `settings.json`: Настройки пользователя.
- **Legacy Logic**:
  - Файлы `src/store/*.js.legacy` содержат низкоуровневую работу с `fs` (Node.js).
  - `todoService.js` оборачивает их, добавляя проверки.

## 🛠 Технические особенности реализации
1. **React Migration**:
   - Проект в стадии миграции с Vanilla JS на React.
   - Старые файлы (`renderer.js`, `hierarchy.js`) могут присутствовать, но точка входа `todo.html` ссылается на `src/todo.tsx`.
   - **Правило**: Новый код пишем ТОЛЬКО на React + TS.
2. **SVG Lines**:
   - Линии иерархии в React версии пока упрощены (отступы).
3. **Rich Text**:
   - Реализован через `textarea` с auto-grow, а не `contenteditable` (в отличие от legacy версии).

## 🧪 Тестирование
- **Unit**: Vitest для утилит и хуков.
- **Integration**: React Testing Library для компонентов (`TodoWindow.test.tsx`).
- **E2E**: Отсутствуют (планируются?).
- **Команда**: `npm test`.
