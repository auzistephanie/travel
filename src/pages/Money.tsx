import { useState } from 'react'
import { SubTabs } from '../components/SubTabs'
import type { TripPageProps } from '../types/props'

const TABS = [
  { id: 'split', label: '夾錢' },
  { id: 'gift', label: '手信' },
]

export function Money(_props: TripPageProps) {
  const [subTab, setSubTab] = useState('split')

  return (
    <div>
      <SubTabs tabs={TABS} active={subTab} onChange={setSubTab} />
      {subTab === 'split' && <p>夾錢 — 即將推出</p>}
      {subTab === 'gift' && <p>手信 — 即將推出</p>}
    </div>
  )
}
