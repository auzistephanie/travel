import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OfflineBanner } from './OfflineBanner'

const useOnlineStatus = vi.fn()
vi.mock('../hooks/useOnlineStatus', () => ({ useOnlineStatus: () => useOnlineStatus() }))

describe('OfflineBanner', () => {
  it('renders nothing while online', () => {
    useOnlineStatus.mockReturnValue(true)
    const { container } = render(<OfflineBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a message when offline', () => {
    useOnlineStatus.mockReturnValue(false)
    render(<OfflineBanner />)
    expect(screen.getByRole('alert')).toHaveTextContent('離線中')
  })
})
