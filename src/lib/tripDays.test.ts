import { describe, expect, it } from 'vitest'
import { inclusiveDayCount } from './tripDays'

describe('inclusiveDayCount', () => {
  it('counts both the start and end date', () => {
    expect(inclusiveDayCount('2026-08-01', '2026-08-05')).toBe(5)
  })

  it('is 1 for a same-day trip', () => {
    expect(inclusiveDayCount('2026-08-01', '2026-08-01')).toBe(1)
  })
})
