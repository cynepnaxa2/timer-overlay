const fs = require('fs');
const path = require('path');
const os = require('os');
const electron = require('electron');

jest.mock('electron', () => ({
  app: { getPath: jest.fn() }
}));

describe('Subtask Creation Hierarchy', () => {
  let testDir;
  let todoStore;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-hier-test-'));
    electron.app.getPath.mockReturnValue(testDir);
    delete require.cache[require.resolve('../../src/store/todoStore')];
    todoStore = require('../../src/store/todoStore');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('subtask should be created under its parent even if there are other tasks below', () => {
    // 1. Create structure:
    // Task 1 (Root)
    //   Subtask 1.1
    // Task 2 (Root)
    
    const task1 = todoStore.createTodo('Task 1');
    const task2 = todoStore.createTodo('Task 2');
    
    // Create subtask for Task 1
    const subtask1_1 = todoStore.createTodo('Subtask 1.1', task1.id);
    
    // 2. Verify order
    const todos = todoStore.readTodos();
    
    // Get all root tasks
    const roots = todos.filter(t => !t.parentId).sort((a,b) => a.order - b.order);
    expect(roots[0].id).toBe(task1.id);
    expect(roots[1].id).toBe(task2.id);
    
    // Get Task 1 children
    const children1 = todos.filter(t => t.parentId === task1.id).sort((a,b) => a.order - b.order);
    expect(children1).toHaveLength(1);
    expect(children1[0].id).toBe(subtask1_1.id);
    expect(children1[0].order).toBe(0); // First child should be 0
    
    // 3. Create another subtask for Task 1
    const subtask1_2 = todoStore.createTodo('Subtask 1.2', task1.id);
    const updatedTodos = todoStore.readTodos();
    const children1Updated = updatedTodos.filter(t => t.parentId === task1.id).sort((a,b) => a.order - b.order);
    
    expect(children1Updated).toHaveLength(2);
    expect(children1Updated[1].id).toBe(subtask1_2.id);
    expect(children1Updated[1].order).toBe(1); // Second child should be 1
  });
});

