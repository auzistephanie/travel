import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BottomNav, type TabId } from './BottomNav'

describe('BottomNav', () => {
  it('renders all 4 tabs', () => {
    render(<BottomNav active="overview" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: '總覽' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '行程' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '準備' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '錢' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '地圖' })).not.toBeInTheDocument()
  })

  it('marks the active tab as selected', () => {
    render(<BottomNav active="itinerary" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: '行程' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: '總覽' })).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onChange with the tab id when clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn<(tab: TabId) => void>()
    render(<BottomNav active="overview" onChange={onChange} />)
    await user.click(screen.getByRole('tab', { name: '準備' }))
    expect(onChange).toHaveBeenCalledWith('prep')
  })
})
