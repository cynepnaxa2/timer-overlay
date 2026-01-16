import { calculateModeValue } from './timer'

describe('calculateModeValue', () => {
  it('calculates money correctly', () => {
    expect(calculateModeValue('money', 10)).toBe(10)
  })

  it('calculates self-development level correctly', () => {
    // XP is total minutes, level is floor(xp/60) + 1
    expect(calculateModeValue('selfDevelopment', 0)).toEqual({ xp: 0, level: 1 })
    expect(calculateModeValue('selfDevelopment', 60)).toEqual({ xp: 60, level: 2 })
    expect(calculateModeValue('selfDevelopment', 119)).toEqual({ xp: 119, level: 2 })
    expect(calculateModeValue('selfDevelopment', 120)).toEqual({ xp: 120, level: 3 })
  })

  it('calculates health (rejuvenation) correctly', () => {
    expect(calculateModeValue('health', 10)).toBe(10) // format is Math.abs(-10)
  })
})
