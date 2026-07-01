import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SubTabs } from './SubTabs'

const tabs = [
  { id: 'packing', label: '行李' },
  { id: 'wishlist', label: '心願' },
]

describe('SubTabs', () => {
  it('renders every tab', () => {
    render(<SubTabs tabs={tabs} active="packing" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: '行李' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '心願' })).toBeInTheDocument()
  })

  it('marks the active tab as selected', () => {
    render(<SubTabs tabs={tabs} active="wishlist" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: '心願' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '行李' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange with the tab id when clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SubTabs tabs={tabs} active="packing" onChange={onChange} />)
    await user.click(screen.getByRole('tab', { name: '心願' }))
    expect(onChange).toHaveBeenCalledWith('wishlist')
  })
})
