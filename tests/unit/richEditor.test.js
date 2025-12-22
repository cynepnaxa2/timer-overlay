const { autoResize, setupRichEditor } = require('../../src/utils/richEditor');

describe('richEditor', () => {
  beforeEach(() => {
    global.window = {
      todoApi: null,
      getSelection: jest.fn(() => ({
        rangeCount: 0,
        removeAllRanges: jest.fn(),
        addRange: jest.fn()
      })),
      clipboardData: null
    };
    global.document = {
      getElementById: jest.fn(() => null)
    };
    global.setTimeout = jest.fn((fn) => {
      if (fn) fn();
      return 123;
    });
    global.clearTimeout = jest.fn();
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    jest.clearAllTimers();
  });

  describe('autoResize', () => {
    test('sets height to scrollHeight', () => {
      const element = {
        style: {},
        scrollHeight: 100
      };
      autoResize(element);
      expect(element.style.height).toBe('100px');
    });

    test('resets height before calculating', () => {
      const element = {
        style: { height: '50px' },
        scrollHeight: 200
      };
      autoResize(element);
      expect(element.style.height).toBe('200px');
    });

    test('sets minimum height to 40px', () => {
      const element = {
        style: {},
        scrollHeight: 20
      };
      autoResize(element);
      expect(element.style.height).toBe('40px');
    });
  });

  describe('setupRichEditor', () => {
    test('adds input event listener', () => {
      const element = {
        style: {},
        scrollHeight: 50,
        innerHTML: '',
        addEventListener: jest.fn()
      };
      const state = { updateTimeout: null, currentTodos: [] };
      setupRichEditor(element, 'task1', state);
      expect(element.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
    });

    test('adds paste event listener', () => {
      const element = {
        style: {},
        scrollHeight: 50,
        innerHTML: '',
        addEventListener: jest.fn()
      };
      const state = { updateTimeout: null, currentTodos: [] };
      setupRichEditor(element, 'task1', state);
      expect(element.addEventListener).toHaveBeenCalledWith('paste', expect.any(Function));
    });

    test('adds focus and blur event listeners', () => {
      const element = {
        style: {},
        scrollHeight: 50,
        innerHTML: '',
        addEventListener: jest.fn()
      };
      const state = { updateTimeout: null, currentTodos: [], focusedElement: null };
      setupRichEditor(element, 'task1', state);
      expect(element.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(element.addEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
    });
  });
});
