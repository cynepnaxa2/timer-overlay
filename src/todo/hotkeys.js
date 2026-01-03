function parseHotkey(hotkeyString) {
  const parts = hotkeyString.split('+').map(p => p.trim());
  const modifiers = {
    ctrl: false,
    alt: false,
    shift: false,
    meta: false
  };
  let key = null;
  
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'ctrl' || lower === 'control') {
      modifiers.ctrl = true;
    } else if (lower === 'alt') {
      modifiers.alt = true;
    } else if (lower === 'shift') {
      modifiers.shift = true;
    } else if (lower === 'meta' || lower === 'cmd') {
      modifiers.meta = true;
    } else {
      key = part;
    }
  }
  
  return { modifiers, key };
}

function matchesHotkey(event, hotkeyString) {
  const parsed = parseHotkey(hotkeyString);
  const eventKey = event.key;
  const eventCode = event.code;
  
  const keyMap = {
    'Insert': 'Insert',
    'Delete': 'Delete',
    'F5': 'F5',
    'Enter': 'Enter',
    'Space': ' ',
    'Esc': 'Escape'
  };
  
  const keyMatches = keyMap[parsed.key] ? keyMap[parsed.key] === eventKey :
    parsed.key?.length === 1 ? parsed.key.toLowerCase() === eventKey.toLowerCase() || parsed.key === eventKey || parsed.key === eventCode :
    parsed.key === eventKey || parsed.key === eventCode;
  
  return keyMatches &&
    parsed.modifiers.ctrl === event.ctrlKey &&
    parsed.modifiers.alt === event.altKey &&
    parsed.modifiers.shift === event.shiftKey &&
    parsed.modifiers.meta === event.metaKey;
}

function setupHotkeys(state, refreshTodos, focusTask) {
  document.addEventListener('keydown', (e) => {
    let currentTaskId = state.activeTaskId;
    
    if (document.activeElement && document.activeElement.classList.contains('task-content')) {
      const taskEl = document.activeElement.closest('.task');
      if (taskEl && taskEl.dataset.taskId) {
        currentTaskId = taskEl.dataset.taskId;
        state.activeTaskId = currentTaskId;
      }
    }

    if (state.focusedElement && document.activeElement === state.focusedElement) {
      if (matchesHotkey(e, state.todoHotkeys.addSubtask)) {
        e.preventDefault();
        window.todoRenderer.createAndFocusTask(currentTaskId, state, refreshTodos);
        return;
      }
      if (matchesHotkey(e, state.todoHotkeys.addSiblingTask)) {
        e.preventDefault();
        let parentId = null;
        if (currentTaskId) {
          const task = state.currentTodos.find(t => t.id === currentTaskId);
          if (task) parentId = task.parentId;
        }
        window.todoRenderer.createAndFocusTask(parentId, state, refreshTodos);
        return;
      }
      return;
    }
    
    // Global hotkeys (no active task required)
    if (matchesHotkey(e, state.todoHotkeys.addRootTask)) {
      e.preventDefault();
      window.todoRenderer.createAndFocusTask(null, state, refreshTodos);
      return;
    }

    if (matchesHotkey(e, state.todoHotkeys.addSiblingTask)) {
      e.preventDefault();
      let parentId = null;
      if (currentTaskId) {
        const task = state.currentTodos.find(t => t.id === currentTaskId);
        if (task) parentId = task.parentId;
      }
      window.todoRenderer.createAndFocusTask(parentId, state, refreshTodos);
      return;
    }

    if (!currentTaskId) return;
    
    if (matchesHotkey(e, state.todoHotkeys.addSubtask)) {
      e.preventDefault();
      window.todoRenderer.createAndFocusTask(currentTaskId, state, refreshTodos);
    } else if (matchesHotkey(e, state.todoHotkeys.execute)) {
      e.preventDefault();
      const task = state.currentTodos.find(t => t.id === currentTaskId);
      if (window.todoApi && task) {
        window.todoApi.startTimer(task.motivationWord || null);
      }
    } else if (matchesHotkey(e, state.todoHotkeys.complete)) {
      e.preventDefault();
      if (window.todoApi) {
        window.todoApi.updateTodo(currentTaskId, { completed: true, completedAt: Date.now() }).then(() => refreshTodos(state));
      }
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseHotkey,
    matchesHotkey,
    setupHotkeys
  };
} else {
  window.todoHotkeys = {
    parseHotkey,
    matchesHotkey,
    setupHotkeys
  };
}

