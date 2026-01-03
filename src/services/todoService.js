const todoStore = require('../store/todoStore');

const TodoService = {
  getTodos() {
    return todoStore.readTodos();
  },

  createTodo(content, parentId) {
    return todoStore.createTodo(content, parentId);
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

