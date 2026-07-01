import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the landing page at /', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('旅行規劃 App')).toBeInTheDocument()
  })
})
