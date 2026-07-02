import { useState, type FormEvent } from 'react'
import type { WishlistItem } from '../types/models'

interface ConfirmPurchaseCardProps {
  item: WishlistItem
  onConfirm: (actualStore: string | null, actualAmt: number | null) => void
  onCancel: () => void
}

export function ConfirmPurchaseCard({ item, onConfirm, onCancel }: ConfirmPurchaseCardProps) {
  const [actualStore, setActualStore] = useState(item.buy_at ?? '')
  const [actualAmt, setActualAmt] = useState(
    item.price_hi != null ? String(item.price_hi) : item.price_lo != null ? String(item.price_lo) : '',
  )

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onConfirm(actualStore || null, actualAmt ? Number(actualAmt) : null)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>核實購買：{item.name}</h3>

      <label htmlFor="confirm-purchase-store">實際商戶</label>
      <input
        id="confirm-purchase-store"
        value={actualStore}
        onChange={(e) => setActualStore(e.target.value)}
      />

      <label htmlFor="confirm-purchase-amount">實際價錢</label>
      <input
        id="confirm-purchase-amount"
        type="number"
        value={actualAmt}
        onChange={(e) => setActualAmt(e.target.value)}
      />

      <button type="submit">確認已購</button>
      <button type="button" onClick={onCancel}>
        取消
      </button>
    </form>
  )
}
