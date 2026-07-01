import { describe, expect, it } from 'vitest'
import { reorder } from './reorder'

describe('reorder', () => {
  it('moves an item forward in the list', () => {
    expect(reorder(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves an item backward in the list', () => {
    expect(reorder(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('is a no-op when the indexes are the same', () => {
    expect(reorder(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate the original array', () => {
    const original = ['a', 'b', 'c']
    reorder(original, 0, 2)
    expect(original).toEqual(['a', 'b', 'c'])
  })
})
