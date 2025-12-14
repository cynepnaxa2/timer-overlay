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

  test('main.js contains createTodoWindow', () => {
    const mainJs = path.join(projectRoot, 'main.js');
    const content = fs.readFileSync(mainJs, 'utf8');
    expect(content).toContain('createTodoWindow');
    expect(content).toContain('todoWindow');
  });

  test('main.js contains todo IPC handlers', () => {
    const mainJs = path.join(projectRoot, 'main.js');
    const content = fs.readFileSync(mainJs, 'utf8');
    expect(content).toContain('get-todos');
    expect(content).toContain('create-todo');
    expect(content).toContain('update-todo');
    expect(content).toContain('delete-todo');
    expect(content).toContain('reorder-todos');
    expect(content).toContain('start-timer');
  });
});
