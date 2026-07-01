import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeQuery } from '../test/supabaseQueryMock'

const { supabase } = vi.hoisted(() => ({ supabase: { from: vi.fn() } }))
vi.mock('./supabaseClient', () => ({ supabase }))

import { ensurePackingItems, listPackingItems, togglePackingItem } from './packingRepo'

describe('listPackingItems', () => {
  beforeEach(() => supabase.from.mockReset())

  it('returns the packing items for a trip', async () => {
    const items = [{ id: 'p1', trip_id: 't1', category: '證件', name: '護照', checked: false, auto_qty: false }]
    supabase.from.mockImplementation(() => makeQuery({ data: items, error: null }))
    expect(await listPackingItems('t1')).toEqual(items)
  })
})

describe('ensurePackingItems', () => {
  beforeEach(() => supabase.from.mockReset())

  it('returns existing items without inserting when items already exist', async () => {
    const items = [{ id: 'p1', trip_id: 't1', category: '證件', name: '護照', checked: false, auto_qty: false }]
    const queries: ReturnType<typeof makeQuery>[] = []
    supabase.from.mockImplementation(() => {
      const query = makeQuery({ data: items, error: null })
      queries.push(query)
      return query
    })

    const result = await ensurePackingItems('t1', 5)
    expect(result).toEqual(items)
    expect(queries.every((q) => (q.insert as ReturnType<typeof vi.fn>).mock.calls.length === 0)).toBe(true)
  })

  it('seeds default items plus auto-computed clothing quantities when none exist', async () => {
    const insertedNames: string[] = []
    supabase.from.mockImplementation(() => {
      let capturedName: string | undefined
      const query: Record<string, unknown> = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        insert: vi.fn((row: { name: string }) => {
          capturedName = row.name
          insertedNames.push(row.name)
          return query
        }),
        single: vi.fn(() => query),
        then: (resolve: (r: unknown) => unknown) => {
          if (capturedName) {
            return resolve({
              data: { id: `p-${capturedName}`, trip_id: 't1', name: capturedName, checked: false },
              error: null,
            })
          }
          return resolve({ data: [], error: null })
        },
      }
      return query
    })

    const result = await ensurePackingItems('t1', 5)

    expect(insertedNames).toContain('護照')
    expect(insertedNames).toContain('褲 x3')
    expect(insertedNames).toContain('上衣 x5')
    expect(result).toHaveLength(insertedNames.length)
  })
})

describe('togglePackingItem', () => {
  it('updates the checked state and returns the item', async () => {
    const updated = { id: 'p1', trip_id: 't1', category: '證件', name: '護照', checked: true, auto_qty: false }
    supabase.from.mockReset()
    supabase.from.mockImplementation(() => makeQuery({ data: updated, error: null }))

    const result = await togglePackingItem('p1', true)
    expect(result).toEqual(updated)
  })
})
