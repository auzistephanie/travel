import { describe, expect, it } from 'vitest'
import { generateTornEdgePoints } from './tornEdge'

describe('generateTornEdgePoints', () => {
  it('produces toothCount + 1 evenly spaced points alternating between 0 and the amplitude', () => {
    const points = generateTornEdgePoints(100, 10, 6)
    const pairs = points.split(' ').map((p) => p.split(',').map(Number))

    expect(pairs).toHaveLength(11)
    expect(pairs[0]).toEqual([0, 0])
    expect(pairs[1]).toEqual([10, 6])
    expect(pairs[2]).toEqual([20, 0])
    expect(pairs[10]).toEqual([100, 0])
  })

  it('is deterministic for the same inputs (no visual flicker on re-render)', () => {
    expect(generateTornEdgePoints(200, 24, 8)).toBe(generateTornEdgePoints(200, 24, 8))
  })
})
