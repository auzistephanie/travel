import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera } from 'lucide-react'
import { scanReceipt } from '../lib/ocrApi'
import type { Gift, GiftSource, TripMember } from '../types/models'

const CURRENCIES = ['HKD', 'JPY', 'THB', 'KRW', 'TWD', 'VND']

interface AddGiftInputFields {
  item: string
  store: string | null
  amount: number | null
  toMember: string
  source: GiftSource
  currency: string | null
}

interface UpdateGiftFields {
  item: string
  store: string | null
  amount: number | null
  toMember: string
  currency: string | null
}

interface AddGiftFormProps {
  members: TripMember[]
  editingGift?: Gift | null
  onAdd: (input: AddGiftInputFields) => void
  onUpdate?: (id: string, input: UpdateGiftFields) => void
  onCancel?: () => void
}

export function AddGiftForm({ members, editingGift, onAdd, onUpdate, onCancel }: AddGiftFormProps) {
  const isEditing = !!editingGift
  const [item, setItem] = useState(editingGift?.item ?? '')
  const [store, setStore] = useState(editingGift?.store ?? '')
  const [amount, setAmount] = useState(editingGift?.amount != null ? String(editingGift.amount) : '')
  const [currency, setCurrency] = useState(editingGift?.currency ?? 'HKD')
  const [toMember, setToMember] = useState(editingGift?.to_member ?? '自己')
  const [source, setSource] = useState<GiftSource>(editingGift?.source ?? 'manual')
  const [scanning, setScanning] = useState(false)
  const [scanHint, setScanHint] = useState<string | null>(null)

  async function handleScan(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setScanHint(null)
    try {
      const result = await scanReceipt(file)
      if (!result) {
        setScanHint('讀取不到，請手動輸入')
        return
      }
      if (result.merchantName) setStore(result.merchantName)
      if (result.totalAmount != null) setAmount(String(result.totalAmount))
      setSource('ocr')
    } finally {
      setScanning(false)
      e.target.value = ''
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!item.trim() || !toMember.trim()) return
    const parsedAmount = amount ? Number(amount) : null
    if (isEditing && editingGift) {
      onUpdate?.(editingGift.id, {
        item,
        store: store || null,
        amount: parsedAmount,
        toMember,
        currency,
      })
      return
    }
    onAdd({ item, store: store || null, amount: parsedAmount, toMember, source, currency })
    setItem('')
    setStore('')
    setAmount('')
    setSource('manual')
  }

  return (
    <form className="wl-form" onSubmit={handleSubmit}>
      <h3 className="wl-title">{isEditing ? '編輯手信' : '加入手信'}</h3>

      <div className="wl-field">
        <label htmlFor="gift-receipt-photo" className="wl-ocr">
          <Camera size={15} aria-hidden="true" />
          拍單據 OCR
        </label>
        <input
          id="gift-receipt-photo"
          type="file"
          accept="image/*"
          onChange={handleScan}
          disabled={scanning}
        />
        {scanHint && <p className="wl-hint">{scanHint}</p>}
      </div>

      <div className="wl-field">
        <label htmlFor="gift-item">品項</label>
        <input id="gift-item" value={item} onChange={(e) => setItem(e.target.value)} required />
      </div>

      <div className="wl-row">
        <div className="wl-field">
          <label htmlFor="gift-store">商戶</label>
          <input id="gift-store" value={store} onChange={(e) => setStore(e.target.value)} />
        </div>
        <div className="wl-field">
          <label htmlFor="gift-amount">金額</label>
          <input
            id="gift-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="wl-field">
        <label htmlFor="gift-currency">貨幣</label>
        <select id="gift-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="wl-field">
        <label htmlFor="gift-to-member">買給誰</label>
        <input
          id="gift-to-member"
          list="gift-recipients"
          value={toMember}
          onChange={(e) => setToMember(e.target.value)}
          required
        />
        <datalist id="gift-recipients">
          <option value="自己" />
          {members.map((m) => (
            <option key={m.id} value={m.name} />
          ))}
        </datalist>
      </div>

      <div className="modal-actions">
        {onCancel && (
          <button type="button" className="wl-cancel" onClick={onCancel}>
            取消
          </button>
        )}
        <button type="submit" className="wl-submit">
          {isEditing ? '儲存' : '加入手信'}
        </button>
      </div>
    </form>
  )
}
