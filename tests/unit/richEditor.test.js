const { autoResize, setupRichEditor } = require('../../src/utils/richEditor');

describe('richEditor', () => {
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
  });

  describe('setupRichEditor', () => {
    test('adds input event listener', () => {
      const element = {
        style: {},
        scrollHeight: 50,
        addEventListener: jest.fn()
      };
      setupRichEditor(element);
      expect(element.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));
    });

    test('adds paste event listener', () => {
      const element = {
        style: {},
        scrollHeight: 50,
        addEventListener: jest.fn()
      };
      setupRichEditor(element);
      expect(element.addEventListener).toHaveBeenCalledWith('paste', expect.any(Function));
    });

    test('calls autoResize on init', () => {
      const element = {
        style: {},
        scrollHeight: 75,
        addEventListener: jest.fn()
      };
      setupRichEditor(element);
      expect(element.style.height).toBe('75px');
    });

    test('calls onContentChange callback on input', () => {
      const element = {
        style: {},
        scrollHeight: 50,
        innerHTML: 'test',
        addEventListener: jest.fn((event, handler) => {
          if (event === 'input') {
            handler();
          }
        })
      };
      const callback = jest.fn();
      setupRichEditor(element, callback);
      expect(callback).toHaveBeenCalledWith('test');
    });
  });
});
