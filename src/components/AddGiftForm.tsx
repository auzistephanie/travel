import { useState, type FormEvent } from 'react'
import type { TripMember } from '../types/models'

interface AddGiftInputFields {
  item: string
  store: string | null
  amount: number | null
  toMember: string
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!item.trim() || !toMember.trim()) return
    onAdd({ item, store: store || null, amount: amount ? Number(amount) : null, toMember })
    setItem('')
    setStore('')
    setAmount('')
  }

  return (
    <form onSubmit={handleSubmit}>
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
