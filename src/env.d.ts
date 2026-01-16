import { Todo, Settings } from './types';

interface TodoApi {
  loadTodos: () => Promise<Todo[]>;
  saveTodos: (todos: Todo[]) => Promise<void>;
  onTodosUpdated: (callback: (todos: Todo[]) => void) => void;
}

interface SettingsApi {
  loadSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<void>;
  onSettingsUpdated: (callback: (settings: Settings) => void) => void;
}

declare global {
  interface Window {
    todoApi: TodoApi;
    settingsApi: SettingsApi;
  }
}
