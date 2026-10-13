// 冇 Supabase 設定時嘅本機資料層。介面跟住 app 實際用到嘅 supabase query／rpc／auth／storage，
// 資料放 localStorage，方便喺冇雲端 key 嘅環境行齊建立行程、共編、記帳。
// 正式環境（有 VITE_SUPABASE_*）唔會用到呢份。

import { UNIQUE_VIOLATION } from './postgrestErrors'

const STORAGE_KEY = 'travel-local-demo-v1'

type Row = Record<string, unknown>

interface DemoSessionUser {
  id: string
  email: string | null
  is_anonymous: boolean
  app_metadata: { provider: string }
  user_metadata: Record<string, unknown>
}

interface DemoSession {
  user: DemoSessionUser
}

interface DemoState {
  session: DemoSession | null
  tables: Record<string, Row[]>
  files: Record<string, string>
}

type AuthListener = (event: string, session: DemoSession | null) => void

const CHILD_TABLES = [
  'trip_members',
  'itinerary_days',
  'flights',
  'expenses',
  'gifts',
  'wishlist_items',
  'packing_items',
]

function emptyState(): DemoState {
  return { session: null, tables: {}, files: {} }
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as DemoState
    return {
      session: parsed.session ?? null,
      tables: parsed.tables ?? {},
      files: parsed.files ?? {},
    }
  } catch {
    return emptyState()
  }
}

let state = loadState()
const authListeners = new Set<AuthListener>()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 配額滿就留喺記憶體，呢次 session 仍然用得
  }
}

export function resetLocalDemo() {
  state = emptyState()
  authListeners.clear()
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function rowsOf(table: string): Row[] {
  if (!state.tables[table]) state.tables[table] = []
  return state.tables[table]
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

interface QueryError {
  code?: string
  message: string
}

interface QueryResult {
  data: unknown
  error: QueryError | null
}

function matches(row: Row, filters: { column: string; value: unknown }[]): boolean {
  return filters.every((filter) => row[filter.column] === filter.value)
}

function uniqueViolation(table: string, row: Row): boolean {
  const existing = rowsOf(table)
  if (table === 'trips') return existing.some((item) => item.share_code === row.share_code)
  if (table === 'itinerary_days') {
    return existing.some((item) => item.trip_id === row.trip_id && item.date === row.date)
  }
  if (table === 'packing_items') {
    return existing.some((item) => item.trip_id === row.trip_id && item.name === row.name)
  }
  return false
}

function shapeRow(row: Row, columns: string | null): Row {
  if (!columns || columns === '*' || !columns.includes('trips(')) return clone(row)
  const trip = rowsOf('trips').find((item) => item.id === row.trip_id)
  const fieldMatch = columns.match(/trips\(([^)]+)\)/)
  const fields = (fieldMatch?.[1] ?? '').split(',').map((field) => field.trim()).filter(Boolean)
  const shapedTrip = trip
    ? fields.reduce<Row>((acc, field) => {
        acc[field] = trip[field]
        return acc
      }, {})
    : null
  return { is_owner: row.is_owner, trips: shapedTrip }
}

function canDeleteTrip(tripId: string): boolean {
  const user = state.session?.user
  if (!user || user.is_anonymous) return false
  return rowsOf('trip_members').some(
    (member) => member.trip_id === tripId && member.is_owner === true && member.auth_user_id === user.id,
  )
}

function deleteTripCascade(tripId: string) {
  const dayIds = new Set(
    rowsOf('itinerary_days')
      .filter((day) => day.trip_id === tripId)
      .map((day) => day.id),
  )
  state.tables.itinerary_stops = rowsOf('itinerary_stops').filter((stop) => !dayIds.has(stop.day_id))
  for (const table of CHILD_TABLES) {
    state.tables[table] = rowsOf(table).filter((row) => row.trip_id !== tripId)
  }
  state.tables.trips = rowsOf('trips').filter((trip) => trip.id !== tripId)
}

class DemoQuery {
  filters: { column: string; value: unknown }[] = []
  operation: 'select' | 'insert' | 'update' | 'delete' = 'select'
  payload: Row | null = null
  columns: string | null = null
  orderBy: { column: string; ascending: boolean } | null = null
  cardinality: 'many' | 'single' | 'maybe' = 'many'
  table: string

  constructor(table: string) {
    this.table = table
  }

  select(columns?: string) {
    this.columns = columns ?? '*'
    return this
  }

  insert(row: Row) {
    this.operation = 'insert'
    this.payload = row
    return this
  }

  update(row: Row) {
    this.operation = 'update'
    this.payload = row
    return this
  }

  delete() {
    this.operation = 'delete'
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending !== false }
    return this
  }

  single() {
    this.cardinality = 'single'
    return this
  }

  maybeSingle() {
    this.cardinality = 'maybe'
    return this
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve()
      .then(() => this.execute())
      .then(onfulfilled, onrejected)
  }

  private execute(): QueryResult {
    if (this.operation === 'insert') return this.executeInsert()
    if (this.operation === 'update') return this.executeUpdate()
    if (this.operation === 'delete') return this.executeDelete()
    return this.executeSelect()
  }

  private executeInsert(): QueryResult {
    const row: Row = { id: newId(), ...clone(this.payload ?? {}) }
    if (this.table === 'trips' && row.created_at == null) row.created_at = new Date().toISOString()
    if (uniqueViolation(this.table, row)) {
      return { data: null, error: { code: UNIQUE_VIOLATION, message: 'duplicate key' } }
    }
    rowsOf(this.table).push(row)
    persist()
    return { data: clone(row), error: null }
  }

  private executeUpdate(): QueryResult {
    const tableRows = rowsOf(this.table)
    const indexes = tableRows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => matches(row, this.filters))
    for (const hit of indexes) {
      tableRows[hit.index] = { ...hit.row, ...clone(this.payload ?? {}) }
    }
    persist()
    const updated = indexes.map((hit) => clone(tableRows[hit.index]))
    return this.finish(updated)
  }

  private executeDelete(): QueryResult {
    if (this.table === 'trips') {
      const targets = rowsOf('trips').filter((row) => matches(row, this.filters))
      const removed = targets.filter((trip) => canDeleteTrip(String(trip.id)))
      for (const trip of removed) deleteTripCascade(String(trip.id))
      persist()
      return { data: clone(removed), error: null }
    }
    const tableRows = rowsOf(this.table)
    const kept: Row[] = []
    const removed: Row[] = []
    for (const row of tableRows) {
      if (matches(row, this.filters)) removed.push(row)
      else kept.push(row)
    }
    state.tables[this.table] = kept
    persist()
    return { data: clone(removed), error: null }
  }

  private executeSelect(): QueryResult {
    let found = rowsOf(this.table).filter((row) => matches(row, this.filters))
    if (this.orderBy) {
      const { column, ascending } = this.orderBy
      found = [...found].sort((a, b) => {
        const left = String(a[column] ?? '')
        const right = String(b[column] ?? '')
        return ascending ? left.localeCompare(right) : right.localeCompare(left)
      })
    }
    return this.finish(found.map((row) => shapeRow(row, this.columns)))
  }

  private finish(found: Row[]): QueryResult {
    if (this.cardinality === 'many') return { data: found, error: null }
    if (found.length === 1) return { data: found[0], error: null }
    if (this.cardinality === 'maybe' && found.length === 0) return { data: null, error: null }
    return { data: null, error: { code: 'PGRST116', message: 'row count mismatch' } }
  }
}

function createTripRpc(args: Record<string, unknown>): QueryResult {
  const shareCode = String(args.p_share_code ?? '')
  const trip: Row = {
    id: newId(),
    name: args.p_name,
    start_date: args.p_start_date,
    end_date: args.p_end_date,
    share_code: shareCode,
    destination_country: args.p_destination_country ?? null,
    created_at: new Date().toISOString(),
  }
  if (uniqueViolation('trips', trip)) {
    return { data: null, error: { code: UNIQUE_VIOLATION, message: 'duplicate key' } }
  }
  const owner: Row = {
    id: newId(),
    trip_id: trip.id,
    name: args.p_owner_name,
    color: null,
    is_owner: true,
    auth_user_id: null,
  }
  rowsOf('trips').push(trip)
  rowsOf('trip_members').push(owner)
  persist()
  return { data: { trip: clone(trip), owner: clone(owner) }, error: null }
}

function claimTripRpc(args: Record<string, unknown>): QueryResult {
  const code = String(args.p_share_code ?? '')
  const trip = rowsOf('trips').find((item) => item.share_code === code)
  return { data: trip ? trip.id : null, error: null }
}

function notifyAuth(event: string) {
  for (const listener of authListeners) listener(event, state.session)
}

export function createLocalDemoClient() {
  return {
    from(table: string) {
      return new DemoQuery(table)
    },
    rpc(name: string, args: Record<string, unknown> = {}) {
      if (name === 'create_trip') return Promise.resolve(createTripRpc(args))
      if (name === 'claim_trip_by_share_code') return Promise.resolve(claimTripRpc(args))
      return Promise.resolve({ data: null, error: { message: `unknown rpc ${name}` } })
    },
    auth: {
      async getSession() {
        return { data: { session: state.session }, error: null }
      },
      async signInAnonymously() {
        if (!state.session) {
          state.session = {
            user: {
              id: newId(),
              email: null,
              is_anonymous: true,
              app_metadata: { provider: 'anonymous' },
              user_metadata: {},
            },
          }
          persist()
          notifyAuth('SIGNED_IN')
        }
        return { data: { session: state.session, user: state.session.user }, error: null }
      },
      async signInWithOAuth() {
        return { data: null, error: { message: 'provider not enabled' } }
      },
      onAuthStateChange(callback: AuthListener) {
        authListeners.add(callback)
        callback('INITIAL_SESSION', state.session)
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback)
              },
            },
          },
        }
      },
    },
    storage: {
      from() {
        return {
          async upload(path: string, file: Blob) {
            const buffer = await file.arrayBuffer()
            const bytes = new Uint8Array(buffer)
            let binary = ''
            const chunk = 0x8000
            for (let index = 0; index < bytes.length; index += chunk) {
              binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
            }
            const type = file.type || 'application/octet-stream'
            state.files[path] = `data:${type};base64,${btoa(binary)}`
            persist()
            return { data: { path }, error: null }
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: state.files[path] ?? '' } }
          },
        }
      },
    },
  }
}
