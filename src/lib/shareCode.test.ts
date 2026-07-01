import { describe, expect, it } from 'vitest'
import { generateShareCode, SHARE_CODE_ALPHABET, SHARE_CODE_LENGTH } from './shareCode'

describe('generateShareCode', () => {
  it('produces a code of the expected length', () => {
    expect(generateShareCode()).toHaveLength(SHARE_CODE_LENGTH)
  })

  it('only uses characters from the unambiguous alphabet', () => {
    const code = generateShareCode()
    for (const char of code) {
      expect(SHARE_CODE_ALPHABET).toContain(char)
    }
  })

  it('excludes visually ambiguous characters (0, O, 1, I)', () => {
    expect(SHARE_CODE_ALPHABET).not.toContain('0')
    expect(SHARE_CODE_ALPHABET).not.toContain('O')
    expect(SHARE_CODE_ALPHABET).not.toContain('1')
    expect(SHARE_CODE_ALPHABET).not.toContain('I')
  })

  it('generates different codes across calls (extremely unlikely to collide)', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateShareCode()))
    expect(codes.size).toBe(50)
  })
})
