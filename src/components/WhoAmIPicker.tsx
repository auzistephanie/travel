import { useState } from 'react'
import { Compass, UserPlus } from 'lucide-react'
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
    <div className="whoami-page">
      <div className="whoami-card">
        <span className="whoami-brand" aria-hidden="true">
          <Compass size={22} />
        </span>
        <h2>哪位是你？</h2>
        <p className="whoami-hint">揀返自己個名就可以入去，或者用新名字加入。</p>

        <ul className="whoami-member-list">
          {members.map((member) => (
            <li key={member.id}>
              <button type="button" onClick={() => onSelect(member.id)}>
                <span className="whoami-avatar" aria-hidden="true">
                  {member.name.slice(0, 1)}
                </span>
                <span>{member.name}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="whoami-divider">
          <span>或</span>
        </div>

        <label htmlFor="whoami-new-name">自訂新名字</label>
        <div className="whoami-new-row">
          <input
            id="whoami-new-name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="輸入你的名字"
          />
          <button type="button" onClick={handleAddNew} disabled={submitting}>
            <UserPlus size={16} aria-hidden="true" />
            加入
          </button>
        </div>
      </div>
    </div>
  )
}
