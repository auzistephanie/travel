import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PackingChecklist } from './PackingChecklist'

const usePackingChecklist = vi.fn()
vi.mock('../hooks/usePackingChecklist', () => ({ usePackingChecklist: () => usePackingChecklist() }))

const items = [
  { id: 'p1', trip_id: 't1', category: '證件', name: '護照', checked: false, auto_qty: false },
  { id: 'p2', trip_id: 't1', category: '衣物', name: '褲 x3', checked: false, auto_qty: true },
]

describe('PackingChecklist', () => {
  beforeEach(() => {
    usePackingChecklist.mockReset()
  })

  it('groups items by category', () => {
    usePackingChecklist.mockReturnValue({ items, loading: false, error: null, toggle: vi.fn() })
    render(<PackingChecklist tripId="t1" dayCount={5} />)
    expect(screen.getByText('證件')).toBeInTheDocument()
    expect(screen.getByText('衣物')).toBeInTheDocument()
    expect(screen.getByText('護照')).toBeInTheDocument()
    expect(screen.getByText('褲 x3')).toBeInTheDocument()
  })

  it('tags auto-computed quantity items but not manual ones', () => {
    usePackingChecklist.mockReturnValue({ items, loading: false, error: null, toggle: vi.fn() })
    render(<PackingChecklist tripId="t1" dayCount={5} />)
    const autoItem = screen.getByText('褲 x3').closest('li')
    const manualItem = screen.getByText('護照').closest('li')
    expect(autoItem).toHaveTextContent('自動')
    expect(manualItem).not.toHaveTextContent('自動')
  })

  it('calls toggle when a checkbox is clicked', async () => {
    const user = userEvent.setup()
    const toggle = vi.fn()
    usePackingChecklist.mockReturnValue({ items, loading: false, error: null, toggle })
    render(<PackingChecklist tripId="t1" dayCount={5} />)

    await user.click(screen.getByRole('checkbox', { name: /護照/ }))
    expect(toggle).toHaveBeenCalledWith('p1', true)
  })

  it('shows a stamp when every item is checked', () => {
    const doneItems = items.map((i) => ({ ...i, checked: true }))
    usePackingChecklist.mockReturnValue({ items: doneItems, loading: false, error: null, toggle: vi.fn() })
    render(<PackingChecklist tripId="t1" dayCount={5} />)
    expect(screen.getByText(/執晒/)).toBeInTheDocument()
  })

  it('does not show a stamp when items are still unchecked', () => {
    usePackingChecklist.mockReturnValue({ items, loading: false, error: null, toggle: vi.fn() })
    render(<PackingChecklist tripId="t1" dayCount={5} />)
    expect(screen.queryByText(/執晒/)).not.toBeInTheDocument()
  })
})
