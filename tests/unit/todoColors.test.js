const { getColorForLevel, COLORS } = require('../../src/utils/todoColors');

describe('todoColors', () => {
  test('returns correct color for level 0', () => {
    expect(getColorForLevel(0)).toBe('#8B00FF');
  });

  test('returns correct color for level 1', () => {
    expect(getColorForLevel(1)).toBe('#0000FF');
  });

  test('returns correct color for level 2', () => {
    expect(getColorForLevel(2)).toBe('#00FFFF');
  });

  test('returns correct color for level 3', () => {
    expect(getColorForLevel(3)).toBe('#00FF00');
  });

  test('returns correct color for level 4', () => {
    expect(getColorForLevel(4)).toBe('#FFFF00');
  });

  test('returns correct color for level 5', () => {
    expect(getColorForLevel(5)).toBe('#FF7F00');
  });

  test('returns correct color for level 6+', () => {
    expect(getColorForLevel(6)).toBe('#FF0000');
    expect(getColorForLevel(10)).toBe('#FF0000');
  });

  test('handles negative level', () => {
    expect(getColorForLevel(-1)).toBe(COLORS[0]);
  });

  test('all colors are defined', () => {
    expect(COLORS).toHaveLength(7);
    expect(COLORS[0]).toBe('#8B00FF');
    expect(COLORS[6]).toBe('#FF0000');
  });
});
