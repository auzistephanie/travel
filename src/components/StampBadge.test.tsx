import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StampBadge } from './StampBadge'

describe('StampBadge', () => {
  it('renders the given label', () => {
    render(<StampBadge label="收拾完成" />)
    expect(screen.getByText('收拾完成')).toBeInTheDocument()
  })

  it('applies the stamp-badge class for the ink-stamp visual', () => {
    render(<StampBadge label="已買" />)
    expect(screen.getByText('已買')).toHaveClass('stamp-badge')
  })
})
