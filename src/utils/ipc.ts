import { Todo, Settings } from '../types';

// These are mockable IPC calls
export const saveTodos = async (todos: Todo[]): Promise<void> => {
  if (window.todoApi) {
    return window.todoApi.saveTodos(todos);
  } else {
    console.error('saveTodos: window.todoApi is missing!');
  }
};

export const loadTodos = async (): Promise<Todo[]> => {
  if (window.todoApi) {
    return window.todoApi.loadTodos();
  } else {
    console.error('loadTodos: window.todoApi is missing!');
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
  return null;
};
