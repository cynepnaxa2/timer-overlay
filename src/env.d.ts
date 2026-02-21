import { Todo, Settings } from './types';

interface TodoApi {
  loadTodos: () => Promise<Todo[]>;
  saveTodos: (todos: Todo[]) => Promise<void>;
  onTodosUpdated: (callback: (todos: Todo[]) => void) => void;
}

interface SelectSyncFolderOptions {
  copyCurrentFile?: boolean;
}

interface SettingsApi {
  loadSettings: () => Promise<Settings>;
  saveSettings: (settings: Settings) => Promise<void>;
  onSettingsUpdated: (callback: (settings: Settings) => void) => void;
  selectSyncFolder: (options?: SelectSyncFolderOptions) => Promise<string | null>;
}

declare global {
  interface Window {
    todoApi: TodoApi;
    settingsApi: SettingsApi;
  }
}
