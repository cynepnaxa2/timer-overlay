const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..');

describe('Todo window', () => {
  test('todo.html exists', () => {
    const todoHtml = path.join(projectRoot, 'todo.html');
    expect(fs.existsSync(todoHtml)).toBe(true);
  });

  test('todoPreload.js exists', () => {
    const preload = path.join(projectRoot, 'preload', 'todoPreload.js');
    expect(fs.existsSync(preload)).toBe(true);
  });

  test('windowManager.js contains createTodoWindow', () => {
    const windowManagerJs = path.join(projectRoot, 'src', 'main', 'windowManager.js');
    const content = fs.readFileSync(windowManagerJs, 'utf8');
    expect(content).toContain('createTodoWindow');
    // windowManager uses state.todoWindow
    expect(content).toContain('todoWindow');
  });

  test('ipcHandlers.js contains todo IPC handlers', () => {
    const ipcHandlersJs = path.join(projectRoot, 'src', 'main', 'ipcHandlers.js');
    const content = fs.readFileSync(ipcHandlersJs, 'utf8');
    expect(content).toContain('get-todos');
    expect(content).toContain('create-todo');
    expect(content).toContain('update-todo');
    expect(content).toContain('delete-todo');
    expect(content).toContain('reorder-todos');
    expect(content).toContain('start-timer');
  });
});
