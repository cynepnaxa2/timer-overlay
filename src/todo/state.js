function createTodoState() {
  return {
    focusedElement: null,
    activeTaskId: null,
    currentTodos: [],
    draggingTaskId: null,
    todoHotkeys: {
      addSubtask: 'Insert',
      execute: 'F5',
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

