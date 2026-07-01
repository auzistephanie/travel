import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StampBadge } from './StampBadge'

describe('StampBadge', () => {
  it('renders the given label', () => {
    render(<StampBadge label="執晒" />)
    expect(screen.getByText('執晒')).toBeInTheDocument()
  })

  it('applies the stamp-badge class for the ink-stamp visual', () => {
    render(<StampBadge label="買咗" />)
    expect(screen.getByText('買咗')).toHaveClass('stamp-badge')
  })
})
