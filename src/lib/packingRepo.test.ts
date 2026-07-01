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

  it('recovers from a unique-violation race by reading back the rows someone else just seeded', async () => {
    // Simulates two ensurePackingItems() calls overlapping (e.g. React StrictMode
    // double-invoke): both see zero existing items, so both try to seed every
    // default item — every insert here collides because "someone else" already won.
    let listCallCount = 0
    supabase.from.mockImplementation(() => {
      let isInsert = false
      const eqCalls: [string, string][] = []
      const query: Record<string, unknown> = {
        select: vi.fn(() => query),
        eq: vi.fn((col: string, val: string) => {
          eqCalls.push([col, val])
          return query
        }),
        insert: vi.fn(() => {
          isInsert = true
          return query
        }),
        single: vi.fn(() => query),
        then: (resolve: (r: unknown) => unknown) => {
          if (isInsert) {
            return resolve({ data: null, error: { code: '23505', message: 'dup' } })
          }
          const nameEq = eqCalls.find(([col]) => col === 'name')
          if (!nameEq) {
            listCallCount++
            return resolve({ data: [], error: null }) // listPackingItems: nothing yet
          }
          const name = nameEq[1]
          return resolve({
            data: { id: `p-${name}`, trip_id: 't1', category: '?', name, checked: false, auto_qty: false },
            error: null,
          })
        },
      }
      return query
    })

    const result = await ensurePackingItems('t1', 5)
    expect(result.map((r) => r.name)).toContain('護照')
    expect(listCallCount).toBe(1)
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
