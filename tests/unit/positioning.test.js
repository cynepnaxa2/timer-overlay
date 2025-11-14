const { computeWindowBoundsForRightEdge } = require('../../src/utils/positioning');

describe('computeWindowBoundsForRightEdge', () => {
  test('positions overlay at the right edge for origin (0,0)', () => {
    const bounds = { x: 0, y: 0, width: 1920, height: 1080 };
    const result = computeWindowBoundsForRightEdge(bounds, 20);
    expect(result).toEqual({
      x: 1900,
      y: 0,
      width: 20,
      height: 1080
    });
  });

  test('positions overlay at the right edge for non-zero origin', () => {
    const bounds = { x: 1920, y: 200, width: 2560, height: 1440 };
    const result = computeWindowBoundsForRightEdge(bounds, 20);
    expect(result).toEqual({
      x: 1920 + 2560 - 20,
      y: 200,
      width: 20,
      height: 1440
    });
  });
});



