import { markBought } from './wishlistRepo'
import { addGift } from './giftRepo'
import type { Gift, WishlistItem } from '../types/models'

export interface ConfirmPurchaseInput {
  tripId: string
  wishlistItem: WishlistItem
  actualStore: string | null
  actualAmt: number | null
}

export interface ConfirmPurchaseResult {
  wishlistItem: WishlistItem
  gift: Gift
}

// 心願確認已購，永遠流入手信（包括買俾自己），spec §5.2
export async function confirmWishlistPurchase(input: ConfirmPurchaseInput): Promise<ConfirmPurchaseResult> {
  const wishlistItem = await markBought(input.wishlistItem.id, input.actualStore, input.actualAmt)
  const gift = await addGift({
    tripId: input.tripId,
    item: input.wishlistItem.name,
    store: input.actualStore,
    amount: input.actualAmt,
    toMember: input.wishlistItem.to_member ?? '自己',
    source: 'wishlist',
  })
  return { wishlistItem, gift }
}
