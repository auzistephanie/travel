import { beforeEach, describe, expect, it } from 'vitest'
import { getWhoAmI, setWhoAmI } from './whoAmI'

describe('whoAmI', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns null when nothing is stored for a share code', () => {
    expect(getWhoAmI('ABC234')).toBeNull()
  })

  it('remembers the member id chosen for a share code', () => {
    setWhoAmI('ABC234', 'member-1')
    expect(getWhoAmI('ABC234')).toBe('member-1')
  })

  it('keeps different share codes independent', () => {
    setWhoAmI('ABC234', 'member-1')
    setWhoAmI('XYZ987', 'member-2')
    expect(getWhoAmI('ABC234')).toBe('member-1')
    expect(getWhoAmI('XYZ987')).toBe('member-2')
  })
})
