import { useState, type ChangeEvent, type FormEvent } from 'react'
import { scanReceipt } from '../lib/ocrApi'
import type { GiftSource, TripMember } from '../types/models'

interface AddGiftInputFields {
  item: string
  store: string | null
  amount: number | null
  toMember: string
  source: GiftSource
}

interface AddGiftFormProps {
  members: TripMember[]
  onAdd: (input: AddGiftInputFields) => void
}

export function AddGiftForm({ members, onAdd }: AddGiftFormProps) {
  const [item, setItem] = useState('')
  const [store, setStore] = useState('')
  const [amount, setAmount] = useState('')
  const [toMember, setToMember] = useState('自己')
  const [source, setSource] = useState<GiftSource>('manual')
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
        setScanHint('讀唔到，請手動輸入')
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
    onAdd({ item, store: store || null, amount: amount ? Number(amount) : null, toMember, source })
    setItem('')
    setStore('')
    setAmount('')
    setSource('manual')
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="gift-receipt-photo">影單 OCR</label>
      <input id="gift-receipt-photo" type="file" accept="image/*" onChange={handleScan} disabled={scanning} />
      {scanHint && <p>{scanHint}</p>}

      <label htmlFor="gift-item">品項</label>
      <input id="gift-item" value={item} onChange={(e) => setItem(e.target.value)} required />

      <label htmlFor="gift-store">商戶</label>
      <input id="gift-store" value={store} onChange={(e) => setStore(e.target.value)} />

      <label htmlFor="gift-amount">金額</label>
      <input id="gift-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />

      <label htmlFor="gift-to-member">買俾邊個</label>
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

      <button type="submit">加入手信</button>
    </form>
  )
}
