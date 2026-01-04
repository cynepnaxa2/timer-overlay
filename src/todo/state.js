function createTodoState() {
  return {
    focusedElement: null,
    activeTaskId: null,
    currentTodos: [],
    draggingTaskId: null,
    showCompleted: false,
    todoHotkeys: {
      addSubtask: 'Ctrl+Enter',
      addRootTask: 'Shift+Enter',
      execute: 'Ctrl+Space',
      complete: 'Delete',
      navNext: 'Alt+Down',
      navPrev: 'Alt+Up',
      navChild: 'Alt+Right',
      navParent: 'Alt+Left'
    },
    updateTimeout: null
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createTodoState };
} else {
  window.todoState = { createTodoState };
}

