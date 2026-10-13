import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../App'

describe('hero preview routes', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('hero-preview-open')
  })

  it.each([
    ['/preview/hero/1', '把下一趟旅程攤開'],
    ['/preview/hero/2', '下一站，想去哪裡'],
    ['/preview/hero/3', '畫一條回家的航線'],
  ])('renders %s without replacing the homepage copy', async (path, title) => {
    window.history.pushState({}, '', path)
    render(<App />)
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
    expect(screen.queryByText('旅行規劃 App')).not.toBeInTheDocument()
  })

  it('keeps the current homepage', () => {
    window.history.pushState({}, '', '/')
    render(<App />)
    expect(screen.getByText('旅行規劃 App')).toBeInTheDocument()
    expect(screen.queryByText('把下一趟旅程攤開')).not.toBeInTheDocument()
  })
})