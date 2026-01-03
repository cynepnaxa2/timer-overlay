const { setupHotkeys } = require('../../src/todo/hotkeys');

describe('Navigation Hotkeys Logic', () => {
  let state;
  let mockRenderer;
  let mockApi;
  let mockRefresh;

  beforeEach(() => {
    // Reset require cache to ensure fresh state if needed
    delete require.cache[require.resolve('../../src/todo/hotkeys')];

    state = {
      activeTaskId: '2',
      focusedElement: null,
      currentTodos: [
        { id: '1', parentId: null, order: 0, completed: false },
        { id: '2', parentId: null, order: 1, completed: false },
        { id: '3', parentId: null, order: 2, completed: false },
        { id: '2.1', parentId: '2', order: 0, completed: false }
      ],
      todoHotkeys: {
        addSubtask: 'Ctrl+Enter',
        addSiblingTask: 'Enter',
        addRootTask: 'Shift+Enter',
        execute: 'Ctrl+Space',
        complete: 'Delete',
        navNext: 'Alt+Down',
        navPrev: 'Alt+Up',
        navChild: 'Alt+Right',
        navParent: 'Alt+Left'
      }
    };

    mockRenderer = {
      focusTask: jest.fn(),
      createAndFocusTask: jest.fn()
    };
    
    mockApi = {
      toggleTaskCollapse: jest.fn().mockResolvedValue(true)
    };

    mockRefresh = jest.fn().mockResolvedValue(state.currentTodos);

    const mockHierarchy = {
      isTaskVisible: jest.fn().mockReturnValue(true)
    };

    global.window = {
      todoRenderer: mockRenderer,
      todoApi: mockApi,
      todoHierarchy: mockHierarchy
    };
    
    const mockTaskEl = {
      dataset: { taskId: '2' },
      closest: jest.fn().mockReturnThis()
    };

    const mockContentEl = {
      classList: {
        contains: (cls) => cls === 'task-content'
      },
      closest: () => mockTaskEl
    };

    state.focusedElement = mockContentEl;

    global.document = {
      addEventListener: jest.fn(),
      activeElement: mockContentEl
    };
  });

  test('navNext should focus the next sibling', () => {
    const event = {
      key: 'ArrowDown',
      altKey: true,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
      preventDefault: jest.fn()
    };

    setupHotkeys(state, mockRefresh);
    
    const handler = document.addEventListener.mock.calls[0][1];
    handler(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockRenderer.focusTask).toHaveBeenCalledWith('3', state);
  });

  test('navPrev should focus the previous sibling', () => {
    const event = {
      key: 'ArrowUp',
      altKey: true,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
      preventDefault: jest.fn()
    };

    setupHotkeys(state, mockRefresh);
    
    const handler = document.addEventListener.mock.calls[0][1];
    handler(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockRenderer.focusTask).toHaveBeenCalledWith('1', state);
  });

  test('navChild should focus the first child', () => {
    const event = {
      key: 'ArrowRight',
      altKey: true,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
      preventDefault: jest.fn()
    };

    setupHotkeys(state, mockRefresh);
    
    const handler = document.addEventListener.mock.calls[0][1];
    handler(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockRenderer.focusTask).toHaveBeenCalledWith('2.1', state);
  });

  test('navParent should focus the parent task', () => {
    state.activeTaskId = '2.1';
    state.currentTodos.find(t => t.id === '2.1').parentId = '2';
    
    // Update active element to represent the child task
    global.document.activeElement.closest = () => ({ dataset: { taskId: '2.1' } });

    const event = {
      key: 'ArrowLeft',
      altKey: true,
      ctrlKey: false,
      shiftKey: false,
      metaKey: false,
      preventDefault: jest.fn()
    };

    setupHotkeys(state, mockRefresh);
    
    const handler = document.addEventListener.mock.calls[0][1];
    handler(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockRenderer.focusTask).toHaveBeenCalledWith('2', state);
  });
});
