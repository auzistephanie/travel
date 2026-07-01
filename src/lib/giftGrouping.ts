import type { Gift } from '../types/models'

export interface GiftGroup {
  recipient: string
  gifts: Gift[]
  subtotal: number
}

export function groupGiftsByRecipient(gifts: Gift[]): GiftGroup[] {
  const map = new Map<string, Gift[]>()
  for (const gift of gifts) {
    const list = map.get(gift.to_member) ?? []
    list.push(gift)
    map.set(gift.to_member, list)
  }

  return [...map.entries()].map(([recipient, recipientGifts]) => ({
    recipient,
    gifts: recipientGifts,
    subtotal: recipientGifts.reduce((sum, g) => sum + (g.amount ?? 0), 0),
  }))
}
