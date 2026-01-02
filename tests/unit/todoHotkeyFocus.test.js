const { matchesHotkey, setupHotkeys } = require('../../src/todo/hotkeys');

describe('Hotkey Task Detection', () => {
  let state, refreshTodos, focusTask;

  beforeEach(() => {
    state = {
      activeTaskId: 'task-1',
      focusedElement: null,
      todoHotkeys: {
        addSubtask: 'Ctrl+Enter',
        addRootTask: 'Shift+Enter'
      }
    };
    refreshTodos = jest.fn().mockResolvedValue();
    focusTask = jest.fn();
    
    // Mock window.todoRenderer
    global.window = {
      todoRenderer: {
        createAndFocusTask: jest.fn()
      }
    };
    
    // Mock document.activeElement and closest
    global.document = {
      addEventListener: jest.fn(),
      activeElement: {
        classList: { contains: jest.fn().mockReturnValue(false) },
        closest: jest.fn()
      }
    };
  });

  test('should detect task from activeElement if state.activeTaskId is out of sync', () => {
    // Simulate being focused on a task-content element
    const mockTaskEl = { dataset: { taskId: 'task-real' } };
    const mockContentEl = { 
      classList: { contains: (cls) => cls === 'task-content' },
      closest: (selector) => selector === '.task' ? mockTaskEl : null
    };
    
    state.activeTaskId = 'old-stale-id';
    state.focusedElement = mockContentEl;
    global.document.activeElement = mockContentEl;

    // Grab the listener that setupHotkeys registered
    setupHotkeys(state, refreshTodos, focusTask);
    const keydownListener = global.document.addEventListener.mock.calls[0][1];

    // Simulate Ctrl+Enter
    const event = {
      key: 'Enter',
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      preventDefault: jest.fn()
    };

    keydownListener(event);

    // Should use 'task-real', not 'old-stale-id'
    expect(global.window.todoRenderer.createAndFocusTask).toHaveBeenCalledWith('task-real', state, refreshTodos);
  });
});

