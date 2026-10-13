/**
 * 酒店／機票介紹連結佔位。
 * Stephanie 取得聯盟網址後，把對應的 href 由空字串改成 https 連結。
 * 留空時按鈕停用，畫面寫「連結待填」，不會導去任何網站。
 */
export interface AffiliateSlot {
  id: 'hotel' | 'flight'
  title: '酒店' | '機票'
  titleEn: 'Hotels' | 'Flights'
  description: string
  href: string
}

export const AFFILIATE_SLOTS: readonly AffiliateSlot[] = [
  {
    id: 'hotel',
    title: '酒店',
    titleEn: 'Hotels',
    description: '比較住宿。聯盟網址尚未填入。',
    href: '',
  },
  {
    id: 'flight',
    title: '機票',
    titleEn: 'Flights',
    description: '搜尋航班。聯盟網址尚未填入。',
    href: '',
  },
]

export function affiliateHref(href: string): string | null {
  const trimmed = href.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.toString()
  } catch {
    return null
  }
}
