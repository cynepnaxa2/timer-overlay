import { Todo, Settings } from '../types';

// These are mockable IPC calls
export const saveTodos = async (todos: Todo[]): Promise<void> => {
  if (window.todoApi) {
    return window.todoApi.saveTodos(todos);
  }
};

export const loadTodos = async (): Promise<Todo[]> => {
  if (window.todoApi) {
    return window.todoApi.loadTodos();
  }
  return [];
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  if (window.settingsApi) {
    return window.settingsApi.saveSettings(settings);
  }
};

export const loadSettings = async (): Promise<Settings | null> => {
  if (window.settingsApi) {
    return window.settingsApi.loadSettings();
  }
  if (window.todoApi && (window.todoApi as any).loadSettings) {
    return (window.todoApi as any).loadSettings();
  }
  // Try overlayApi too just in case
  if (window.overlayApi && (window.overlayApi as any).loadSettings) {
    return (window.overlayApi as any).loadSettings();
  }
  return null;
};
