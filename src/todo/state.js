function createTodoState() {
  return {
    focusedElement: null,
    activeTaskId: null,
    currentTodos: [],
    draggingTaskId: null,
    todoHotkeys: {
      addSubtask: 'Ctrl+Enter',
      addRootTask: 'Shift+Enter',
      execute: 'Ctrl+Space',
      complete: 'Delete'
    },
    updateTimeout: null
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createTodoState };
} else {
  window.todoState = { createTodoState };
}

