const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todoApi', {
  getTodos: () => ipcRenderer.invoke('get-todos'),
  createTodo: (content, parentId) => ipcRenderer.invoke('create-todo', content, parentId),
  updateTodo: (id, updates) => ipcRenderer.invoke('update-todo', id, updates),
  deleteTodo: (id) => ipcRenderer.invoke('delete-todo', id),
  reorderTodos: (todoIds) => ipcRenderer.invoke('reorder-todos', todoIds),
  toggleTaskCollapse: (taskId) => ipcRenderer.invoke('toggle-task-collapse', taskId),
  startTimer: (motivationWord) => ipcRenderer.invoke('start-timer', motivationWord),
  loadTodosFromFile: () => ipcRenderer.invoke('load-todos-from-file'),
  loadDemoTodos: () => ipcRenderer.invoke('load-demo-todos'),
  loadLargeDemo: () => ipcRenderer.invoke('load-large-demo'),
  captureScreenshot: () => ipcRenderer.invoke('capture-todo-screenshot'),
  getTodoHotkeys: () => ipcRenderer.invoke('get-todo-hotkeys'),
  setTodoHotkeys: (hotkeys) => ipcRenderer.invoke('set-todo-hotkeys', hotkeys),
  onTodosUpdated: (callback) => {
    ipcRenderer.on('todos-updated', (_event, todos) => callback(todos));
  },
  onSettingsUpdated: (callback) => {
    ipcRenderer.on('settings-updated', (_event, settings) => callback(settings));
  }
});
