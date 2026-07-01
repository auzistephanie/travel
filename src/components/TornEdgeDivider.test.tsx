import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TornEdgeDivider } from './TornEdgeDivider'

describe('TornEdgeDivider', () => {
  it('renders a decorative separator that is hidden from assistive tech', () => {
    const { container } = render(<TornEdgeDivider />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveClass('torn-edge-divider')
  })
})
