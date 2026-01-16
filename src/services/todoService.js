const todoStore = require('../store/todoStore.js.legacy');

const TodoService = {
  getTodos() {
    return todoStore.readTodos();
  },

  saveTodos(todos) {
    return todoStore.writeTodos(todos);
  },

  createTodo(content, parentId, afterId) {
    return todoStore.createTodo(content, parentId, afterId);
  },

  updateTodo(id, updates) {
    return todoStore.updateTodo(id, updates);
  },

  deleteTodo(id) {
    return todoStore.deleteTodo(id);
  },

  reorderTodos(todoIds) {
    return todoStore.reorderTodos(todoIds);
  },

  toggleCollapse(id) {
    const todos = todoStore.readTodos();
    const task = todos.find(t => t.id === id);
    if (!task) return null;
    return todoStore.updateTodo(id, { collapsed: !task.collapsed });
  },

  toggleSubtaskType(id) {
    const todos = todoStore.readTodos();
    const task = todos.find(t => t.id === id);
    if (!task) return null;
    const newType = task.subtaskType === 'variants' ? 'list' : 'variants';
    return todoStore.updateTodo(id, { subtaskType: newType });
  },

  loadFromFile(filePath) {
    return todoStore.loadTodosFromFile(filePath);
  },

  ensureDemo() {
    return todoStore.ensureDemoTodos();
  }
};

module.exports = TodoService;
