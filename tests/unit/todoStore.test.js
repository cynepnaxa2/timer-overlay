const fs = require('fs');
const path = require('path');
const os = require('os');

const electron = require('electron');
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn()
  }
}));

describe('todoStore', () => {
  let testDir;
  let todoStore;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'todo-test-'));
    electron.app.getPath.mockReturnValue(testDir);
    
    delete require.cache[require.resolve('../../src/store/todoStore')];
    todoStore = require('../../src/store/todoStore');
    
    const todosFile = path.join(testDir, 'todos.json');
    if (fs.existsSync(todosFile)) {
      fs.unlinkSync(todosFile);
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('readTodos', () => {
    test('returns empty array when file does not exist', () => {
      const todos = todoStore.readTodos();
      expect(todos).toEqual([]);
    });

    test('reads todos from file', () => {
      const todosFile = path.join(testDir, 'todos.json');
      const testTodos = [
        { id: '1', content: 'Test', parentId: null, completed: false, order: 0 }
      ];
      fs.writeFileSync(todosFile, JSON.stringify(testTodos), 'utf8');
      
      const todos = todoStore.readTodos();
      expect(todos[0].collapsed).toBe(false);
    });
    
    test('adds collapsed field to old todos without it', () => {
      const todosFile = path.join(testDir, 'todos.json');
      const testTodos = [
        { id: '1', content: 'Test', parentId: null, completed: false, order: 0 }
      ];
      fs.writeFileSync(todosFile, JSON.stringify(testTodos), 'utf8');
      
      const todos = todoStore.readTodos();
      expect(todos[0].collapsed).toBe(false);
    });

    test('returns empty array on invalid JSON', () => {
      const todosFile = path.join(testDir, 'todos.json');
      fs.writeFileSync(todosFile, 'invalid json', 'utf8');
      
      const todos = todoStore.readTodos();
      expect(todos).toEqual([]);
    });
  });

  describe('writeTodos', () => {
    test('writes todos to file', () => {
      const testTodos = [
        { id: '1', content: 'Test', parentId: null, completed: false, order: 0 }
      ];
      todoStore.writeTodos(testTodos);
      
      const todosFile = path.join(testDir, 'todos.json');
      expect(fs.existsSync(todosFile)).toBe(true);
      
      const content = fs.readFileSync(todosFile, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(testTodos);
    });
  });

  describe('createTodo', () => {
    test('creates todo with required fields', () => {
      const todo = todoStore.createTodo('Test content');
      
      expect(todo).toHaveProperty('id');
      expect(todo.content).toBe('Test content');
      expect(todo.parentId).toBeNull();
      expect(todo.type).toBe('task');
      expect(todo.completed).toBe(false);
      expect(todo.completedAt).toBeNull();
      expect(todo.order).toBe(0);
      expect(todo.createdAt).toBeGreaterThan(0);
      expect(todo.motivationWord).toBeNull();
      expect(todo.collapsed).toBe(false);
      expect(todo.economics).toEqual({
        cost: 0,
        gain: 0,
        roi: 0
      });
      expect(todo.context).toEqual([]);
      expect(todo.metadata).toEqual({});
      expect(todo.isArchived).toBe(false);
    });

    test('creates todo with parentId', () => {
      const parent = todoStore.createTodo('Parent');
      const child = todoStore.createTodo('Child', parent.id);
      
      expect(child.parentId).toBe(parent.id);
    });

    test('increments order for new todos', () => {
      const todo1 = todoStore.createTodo('First');
      const todo2 = todoStore.createTodo('Second');
      
      const child1 = todoStore.createTodo('Child 1', todo1.id);
      const child2 = todoStore.createTodo('Child 2', todo1.id);
      
      expect(todo1.order).toBe(0);
      expect(todo2.order).toBe(1);
      expect(child1.order).toBe(0);
      expect(child2.order).toBe(1);
    });

    test('saves todo to file', () => {
      todoStore.createTodo('Test');
      const todos = todoStore.readTodos();
      expect(todos).toHaveLength(1);
      expect(todos[0].content).toBe('Test');
    });
  });

  describe('updateTodo', () => {
    test('updates existing todo', () => {
      const todo = todoStore.createTodo('Original');
      const updated = todoStore.updateTodo(todo.id, { content: 'Updated' });
      
      expect(updated.content).toBe('Updated');
      expect(updated.id).toBe(todo.id);
    });

    test('returns null for non-existent todo', () => {
      const result = todoStore.updateTodo('non-existent-id', { content: 'Test' });
      expect(result).toBeNull();
    });

    test('updates multiple fields', () => {
      const todo = todoStore.createTodo('Test');
      const updated = todoStore.updateTodo(todo.id, { 
        content: 'New content',
        completed: true,
        completedAt: 1234567890
      });
      
      expect(updated.content).toBe('New content');
      expect(updated.completed).toBe(true);
      expect(updated.completedAt).toBe(1234567890);
    });

    test('persists updates to file', () => {
      const todo = todoStore.createTodo('Test');
      todoStore.updateTodo(todo.id, { content: 'Updated' });
      
      const todos = todoStore.readTodos();
      expect(todos[0].content).toBe('Updated');
    });
    
    test('updates collapsed field', () => {
      const todo = todoStore.createTodo('Test');
      const updated = todoStore.updateTodo(todo.id, { collapsed: true });
      
      expect(updated.collapsed).toBe(true);
      const todos = todoStore.readTodos();
      expect(todos[0].collapsed).toBe(true);
    });

    test('calculates ROI on economics update', () => {
      const todo = todoStore.createTodo('Test');
      const updated = todoStore.updateTodo(todo.id, { 
        economics: { cost: 10, gain: 50 } 
      });
      
      expect(updated.economics.roi).toBe(5);
    });

    test('handles zero cost in ROI calculation', () => {
      const todo = todoStore.createTodo('Test');
      const updated = todoStore.updateTodo(todo.id, { 
        economics: { cost: 0, gain: 50 } 
      });
      
      expect(updated.economics.roi).toBe(50);
    });
  });

  describe('deleteTodo', () => {
    test('deletes todo by id', () => {
      const todo = todoStore.createTodo('Test');
      todoStore.deleteTodo(todo.id);
      
      const todos = todoStore.readTodos();
      expect(todos).toHaveLength(0);
    });

    test('deletes todo and its children', () => {
      const parent = todoStore.createTodo('Parent');
      const child1 = todoStore.createTodo('Child1', parent.id);
      const child2 = todoStore.createTodo('Child2', parent.id);
      const grandchild = todoStore.createTodo('Grandchild', child1.id);
      const other = todoStore.createTodo('Other');
      
      todoStore.deleteTodo(parent.id);
      
      const todos = todoStore.readTodos();
      expect(todos).toHaveLength(1);
      expect(todos[0].id).toBe(other.id);
    });

    test('handles non-existent id gracefully', () => {
      todoStore.createTodo('Test');
      todoStore.deleteTodo('non-existent-id');
      
      const todos = todoStore.readTodos();
      expect(todos).toHaveLength(1);
    });
  });

  describe('reorderTodos', () => {
    test('reorders todos by provided ids', () => {
      const todo1 = todoStore.createTodo('First');
      const todo2 = todoStore.createTodo('Second');
      const todo3 = todoStore.createTodo('Third');
      
      todoStore.reorderTodos([todo3.id, todo1.id, todo2.id]);
      
      const todos = todoStore.readTodos();
      expect(todos.find(t => t.id === todo3.id).order).toBe(0);
      expect(todos.find(t => t.id === todo1.id).order).toBe(1);
      expect(todos.find(t => t.id === todo2.id).order).toBe(2);
    });

    test('preserves todos not in reorder list', () => {
      const todo1 = todoStore.createTodo('First');
      const todo2 = todoStore.createTodo('Second');
      
      todoStore.reorderTodos([todo2.id]);
      
      const todos = todoStore.readTodos();
      expect(todos).toHaveLength(2);
    });
  });

  describe('hierarchy', () => {
    test('creates parent-child relationship', () => {
      const parent = todoStore.createTodo('Parent');
      const child = todoStore.createTodo('Child', parent.id);
      
      const todos = todoStore.readTodos();
      const savedChild = todos.find(t => t.id === child.id);
      expect(savedChild.parentId).toBe(parent.id);
    });

    test('supports multiple levels of nesting', () => {
      const level1 = todoStore.createTodo('Level 1');
      const level2 = todoStore.createTodo('Level 2', level1.id);
      const level3 = todoStore.createTodo('Level 3', level2.id);
      
      const todos = todoStore.readTodos();
      expect(todos.find(t => t.id === level2.id).parentId).toBe(level1.id);
      expect(todos.find(t => t.id === level3.id).parentId).toBe(level2.id);
    });
  });
});
