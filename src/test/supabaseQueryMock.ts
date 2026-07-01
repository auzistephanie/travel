import { vi } from 'vitest'

export function makeQuery(result: { data: unknown; error: unknown }) {
  const query: Record<string, unknown> = {}
  const methods = ['insert', 'select', 'eq', 'order', 'single', 'maybeSingle', 'delete', 'update']
  for (const method of methods) {
    query[method] = vi.fn(() => query)
  }
  query.then = (resolve: (r: typeof result) => unknown) => resolve(result)
  return query
}
