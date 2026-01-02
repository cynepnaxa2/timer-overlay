const todoService = require('../../src/services/todoService');
const todoStore = require('../../src/store/todoStore');

jest.mock('../../src/store/todoStore');

describe('TodoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getTodos calls todoStore.readTodos', () => {
    todoService.getTodos();
    expect(todoStore.readTodos).toHaveBeenCalled();
  });

  test('createTodo calls todoStore.createTodo', () => {
    todoService.createTodo('Test content', 'parent-id');
    expect(todoStore.createTodo).toHaveBeenCalledWith('Test content', 'parent-id');
  });

  test('updateTodo calls todoStore.updateTodo', () => {
    todoService.updateTodo('task-id', { content: 'Updated' });
    expect(todoStore.updateTodo).toHaveBeenCalledWith('task-id', { content: 'Updated' });
  });

  test('deleteTodo calls todoStore.deleteTodo', () => {
    todoService.deleteTodo('task-id');
    expect(todoStore.deleteTodo).toHaveBeenCalledWith('task-id');
  });

  test('reorderTodos calls todoStore.reorderTodos', () => {
    todoService.reorderTodos(['id1', 'id2']);
    expect(todoStore.reorderTodos).toHaveBeenCalledWith(['id1', 'id2']);
  });

  test('toggleCollapse toggles the collapsed state', () => {
    const mockTask = { id: 'task-id', collapsed: false };
    todoStore.readTodos.mockReturnValue([mockTask]);
    
    todoService.toggleCollapse('task-id');
    
    expect(todoStore.updateTodo).toHaveBeenCalledWith('task-id', { collapsed: true });
  });

  test('loadFromFile calls todoStore.loadTodosFromFile', () => {
    todoService.loadFromFile('path/to/file.json');
    expect(todoStore.loadTodosFromFile).toHaveBeenCalledWith('path/to/file.json');
  });

  test('ensureDemo calls todoStore.ensureDemoTodos', () => {
    todoService.ensureDemo();
    expect(todoStore.ensureDemoTodos).toHaveBeenCalled();
  });
});

