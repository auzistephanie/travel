import { describe, expect, it } from 'vitest'
import { temperatureTips } from './packingTips'

describe('temperatureTips', () => {
  it('suggests a hand fan when the max temperature is 28°C or above', () => {
    const tips = temperatureTips(20, 28, false, false)
    expect(tips).toContainEqual({ icon: '🌀', text: '天氣熱，建議帶手提風扇' })
  })

  it('suggests a light jacket when the min temperature is under 17°C', () => {
    const tips = temperatureTips(16, 25, false, false)
    expect(tips).toContainEqual({ icon: '🧥', text: '天氣涼，建議帶薄外套' })
  })

  it('suggests a heavy coat instead of a light jacket when the min temperature is under 12°C', () => {
    const tips = temperatureTips(11, 20, false, false)
    expect(tips).toContainEqual({ icon: '🧥', text: '天氣凍，建議帶厚外套' })
    expect(tips).not.toContainEqual({ icon: '🧥', text: '天氣涼，建議帶薄外套' })
  })

  it('suggests an umbrella when rain is likely', () => {
    const tips = temperatureTips(20, 25, true, false)
    expect(tips).toContainEqual({ icon: '☂️', text: '可能落雨，建議帶摺疊遮' })
  })

  it('suggests mosquito repellent for high-mosquito-risk destinations', () => {
    const tips = temperatureTips(20, 25, false, true)
    expect(tips).toContainEqual({ icon: '🦟', text: '目的地蚊蟲較多，建議帶蚊拍/蚊怕水' })
  })

  it('returns no tips for mild weather and low-risk destinations', () => {
    expect(temperatureTips(20, 25, false, false)).toEqual([])
  })
})
