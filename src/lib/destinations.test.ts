import { describe, expect, it } from 'vitest'
import { DESTINATIONS, getDestination } from './destinations'

describe('getDestination', () => {
  it('returns destination info for a supported country code', () => {
    const jp = getDestination('JP')
    expect(jp?.countryName).toBe('日本')
    expect(jp?.voltage).toBe('100V')
  })

  it('returns undefined for an unsupported country code', () => {
    expect(getDestination('US')).toBeUndefined()
  })

  it('has complete entries for every supported destination', () => {
    for (const [code, info] of Object.entries(DESTINATIONS)) {
      expect(info.countryName, code).toBeTruthy()
      expect(info.plugType, code).toBeTruthy()
      expect(info.voltage, code).toBeTruthy()
      expect(info.visaNote, code).toBeTruthy()
      expect(typeof info.mosquitoRisk, code).toBe('boolean')
    }
  })

  it('flags mosquito risk for tropical/subtropical destinations', () => {
    expect(getDestination('TH')?.mosquitoRisk).toBe(true)
    expect(getDestination('VN')?.mosquitoRisk).toBe(true)
    expect(getDestination('JP')?.mosquitoRisk).toBe(false)
  })
})
