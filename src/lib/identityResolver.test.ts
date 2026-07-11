import { describe, expect, it } from 'vitest'
import { resolveIdentity } from './identityResolver'
import type { TripMember } from '../types/models'

const owner: TripMember = { id: 'm1', trip_id: 't1', name: '阿明', color: null, is_owner: true, auth_user_id: 'u1' }
const friend: TripMember = { id: 'm2', trip_id: 't1', name: '阿珍', color: null, is_owner: false }
const members = [owner, friend]

const base = { members, authUserId: null, urlMemberId: null, storedMemberId: null, manualOverride: false }

describe('resolveIdentity 優先次序', () => {
  it('auth match 到已綁定 member → 最高優先，蓋過 URL 同 localStorage', () => {
    const result = resolveIdentity({ ...base, authUserId: 'u1', urlMemberId: 'm2', storedMemberId: 'm2' })
    expect(result).toEqual({ memberId: 'm1', source: 'auth' })
  })

  it('manualOverride 擋住 auth，跌落去下一層（URL）', () => {
    const result = resolveIdentity({ ...base, authUserId: 'u1', urlMemberId: 'm2', manualOverride: true })
    expect(result).toEqual({ memberId: 'm2', source: 'url' })
  })

  it('冇 auth match → 用 URL ?m=', () => {
    const result = resolveIdentity({ ...base, urlMemberId: 'm2', storedMemberId: 'm1' })
    expect(result).toEqual({ memberId: 'm2', source: 'url' })
  })

  it('冇 URL → 用 localStorage 記錄', () => {
    const result = resolveIdentity({ ...base, storedMemberId: 'm2' })
    expect(result).toEqual({ memberId: 'm2', source: 'storage' })
  })

  it('乜都冇 → none（出揀名畫面）', () => {
    expect(resolveIdentity(base)).toEqual({ memberId: null, source: 'none' })
  })
})

describe('resolveIdentity 驗證 member 存在（防幽靈身份）', () => {
  it('URL 帶住已刪 member 嘅 id → 唔信，跌落下一層', () => {
    const result = resolveIdentity({ ...base, urlMemberId: 'ghost', storedMemberId: 'm1' })
    expect(result).toEqual({ memberId: 'm1', source: 'storage' })
  })

  it('localStorage 記住已刪 member → 唔信，回 none', () => {
    const result = resolveIdentity({ ...base, storedMemberId: 'ghost' })
    expect(result).toEqual({ memberId: null, source: 'none' })
  })

  it('登入咗但呢個 trip 冇綁定過任何 member → auth 層唔會亂認，跌落下一層', () => {
    const result = resolveIdentity({ ...base, authUserId: 'u-unknown', storedMemberId: 'm1' })
    expect(result).toEqual({ memberId: 'm1', source: 'storage' })
  })
})
