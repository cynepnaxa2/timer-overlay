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
    'Esc': 'Escape',
    'Up': 'ArrowUp',
    'Down': 'ArrowDown',
    'Left': 'ArrowLeft',
    'Right': 'ArrowRight'
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
        if (currentTaskId) {
          // Ищем задачу в актуальном списке от API, а не в потенциально устаревшем state.currentTodos
          window.todoApi.getTodos().then(todos => {
            const task = todos.find(t => t.id === currentTaskId);
            const parentId = task ? task.parentId : null;
            window.todoRenderer.createAndFocusTask(parentId, state, refreshTodos, currentTaskId);
          });
        } else {
          window.todoRenderer.createAndFocusTask(null, state, refreshTodos);
        }
        return;
      }
    }
    
    // Global hotkeys (no active task required)
    if (matchesHotkey(e, state.todoHotkeys.addRootTask)) {
      e.preventDefault();
      window.todoRenderer.createAndFocusTask(null, state, refreshTodos);
      return;
    }

    if (matchesHotkey(e, state.todoHotkeys.addSiblingTask)) {
      e.preventDefault();
      if (currentTaskId) {
        window.todoApi.getTodos().then(todos => {
          const task = todos.find(t => t.id === currentTaskId);
          const parentId = task ? task.parentId : null;
          window.todoRenderer.createAndFocusTask(parentId, state, refreshTodos, currentTaskId);
        });
      } else {
        window.todoRenderer.createAndFocusTask(null, state, refreshTodos);
      }
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
    } else if (matchesHotkey(e, state.todoHotkeys.navNext)) {
      e.preventDefault();
      const current = state.currentTodos.find(t => t.id === currentTaskId);
      if (current) {
        let candidate = current;
        while (candidate) {
          const siblings = state.currentTodos.filter(t => t.parentId === candidate.parentId && (state.showCompleted || !t.completed) && window.todoHierarchy.isTaskVisible(t, state.currentTodos, state.showCompleted))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          const idx = siblings.findIndex(t => t.id === candidate.id);
          if (idx !== -1 && idx < siblings.length - 1) {
            window.todoRenderer.focusTask(siblings[idx + 1].id, state);
            return;
          }
          candidate = candidate.parentId ? state.currentTodos.find(t => t.id === candidate.parentId) : null;
        }
      }
    } else if (matchesHotkey(e, state.todoHotkeys.navPrev)) {
      e.preventDefault();
      const current = state.currentTodos.find(t => t.id === currentTaskId);
      if (current) {
        const siblings = state.currentTodos.filter(t => t.parentId === current.parentId && (state.showCompleted || !t.completed) && window.todoHierarchy.isTaskVisible(t, state.currentTodos, state.showCompleted))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        const idx = siblings.findIndex(t => t.id === current.id);
        if (idx > 0) {
          window.todoRenderer.focusTask(siblings[idx - 1].id, state);
        } else if (current.parentId) {
          window.todoRenderer.focusTask(current.parentId, state);
        }
      }
    } else if (matchesHotkey(e, state.todoHotkeys.navChild)) {
      e.preventDefault();
      const current = state.currentTodos.find(t => t.id === currentTaskId);
      if (current) {
        const navigateToChild = () => {
          const children = state.currentTodos.filter(t => t.parentId === currentTaskId && (state.showCompleted || !t.completed))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          if (children.length > 0) {
            window.todoRenderer.focusTask(children[0].id, state);
          }
        };

        if (current.collapsed) {
          window.todoApi.toggleTaskCollapse(current.id).then(() => {
            refreshTodos(state).then(navigateToChild);
          });
        } else {
          navigateToChild();
        }
      }
    } else if (matchesHotkey(e, state.todoHotkeys.navParent)) {
      e.preventDefault();
      const current = state.currentTodos.find(t => t.id === currentTaskId);
      if (current && current.parentId) {
        window.todoRenderer.focusTask(current.parentId, state);
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

