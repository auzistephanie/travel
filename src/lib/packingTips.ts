export interface PackingTip {
  icon: string
  text: string
}

const HOT_THRESHOLD_C = 28
const COOL_THRESHOLD_C = 17
const COLD_THRESHOLD_C = 12

export function temperatureTips(
  minTempC: number,
  maxTempC: number,
  anyRainHigh: boolean,
  mosquitoRisk: boolean,
): PackingTip[] {
  const tips: PackingTip[] = []

  if (maxTempC >= HOT_THRESHOLD_C) {
    tips.push({ icon: '🌀', text: '天氣熱，建議帶手提風扇' })
  }

  if (minTempC < COLD_THRESHOLD_C) {
    tips.push({ icon: '🧥', text: '天氣凍，建議帶厚外套' })
  } else if (minTempC < COOL_THRESHOLD_C) {
    tips.push({ icon: '🧥', text: '天氣涼，建議帶薄外套' })
  }

  if (anyRainHigh) {
    tips.push({ icon: '☂️', text: '可能落雨，建議帶摺疊遮' })
  }

  if (mosquitoRisk) {
    tips.push({ icon: '🦟', text: '目的地蚊蟲較多，建議帶蚊拍/蚊怕水' })
  }

  return tips
}
