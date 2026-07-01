import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the landing page at /', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('旅行規劃 App')).toBeInTheDocument()
  })

  it('renders the trip shell with bottom nav at /t/:shareCode', () => {
    window.history.pushState({}, '', '/t/ABC123')
    render(<App />)
    expect(screen.getByText('分享碼：ABC123')).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: '主導覽' })).toBeInTheDocument()
  })
})
