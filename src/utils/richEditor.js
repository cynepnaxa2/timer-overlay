function autoResize(element) {
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = Math.max(40, element.scrollHeight) + 'px';
}

function setupRichEditor(element, taskId, state, drawHierarchyLines) {
  element.addEventListener('focus', () => {
    state.focusedElement = element;
  });
  
  element.addEventListener('blur', () => {
    if (state.focusedElement === element) {
      state.focusedElement = null;
    }
  });
  
  const debouncedUpdate = () => {
    clearTimeout(state.updateTimeout);
    state.updateTimeout = setTimeout(() => {
      if (window.todoApi) {
        window.todoApi.updateTodo(taskId, { content: element.innerHTML });
        const container = document.getElementById('todo-container');
        if (container && state.currentTodos) {
          setTimeout(() => {
            if (drawHierarchyLines) {
              drawHierarchyLines(state.currentTodos, container);
            }
          }, 50);
        }
      }
    }, 300);
  };
  
  element.addEventListener('input', () => {
    autoResize(element);
    if (window.todoApi) debouncedUpdate();
  });
  
  element.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    autoResize(element);
    if (window.todoApi) {
      window.todoApi.updateTodo(taskId, { content: element.innerHTML });
    }
  });
  
  setTimeout(() => {
    autoResize(element);
  }, 0);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    autoResize,
    setupRichEditor
  };
} else {
  window.richEditor = {
    autoResize,
    setupRichEditor
  };
}
