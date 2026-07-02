import { useState } from 'react'
import type { TripMember } from '../types/models'

interface WhoAmIPickerProps {
  members: TripMember[]
  onSelect: (memberId: string) => void
  onAddNew: (name: string) => Promise<TripMember>
}

export function WhoAmIPicker({ members, onSelect, onAddNew }: WhoAmIPickerProps) {
  const [newName, setNewName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAddNew() {
    const trimmed = newName.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      const member = await onAddNew(trimmed)
      onSelect(member.id)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <p>哪位是你？</p>
      <ul>
        {members.map((member) => (
          <li key={member.id}>
            <button type="button" onClick={() => onSelect(member.id)}>
              {member.name}
            </button>
          </li>
        ))}
      </ul>
      <label htmlFor="whoami-new-name">自訂新名字</label>
      <input
        id="whoami-new-name"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
      />
      <button type="button" onClick={handleAddNew} disabled={submitting}>
        加入
      </button>
    </div>
  )
}
