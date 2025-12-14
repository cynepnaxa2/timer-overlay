const { calculateLevel } = require('../../src/todo/renderer');

describe('todoRenderer', () => {
  describe('calculateLevel', () => {
    test('returns 0 for root task', () => {
      const task = { id: '1', parentId: null };
      const todos = [task];
      expect(calculateLevel(task, todos)).toBe(0);
    });

    test('returns 1 for first level child', () => {
      const parent = { id: '1', parentId: null };
      const child = { id: '2', parentId: '1' };
      const todos = [parent, child];
      expect(calculateLevel(child, todos)).toBe(1);
    });

    test('returns 2 for second level child', () => {
      const root = { id: '1', parentId: null };
      const level1 = { id: '2', parentId: '1' };
      const level2 = { id: '3', parentId: '2' };
      const todos = [root, level1, level2];
      expect(calculateLevel(level2, todos)).toBe(2);
    });

    test('returns 0 for orphaned task', () => {
      const task = { id: '1', parentId: 'nonexistent' };
      const todos = [task];
      expect(calculateLevel(task, todos)).toBe(0);
    });
  });
});
