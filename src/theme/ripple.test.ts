import { describe, expect, it } from 'vitest'
import { spawnRipple } from './ripple'

describe('spawnRipple', () => {
  it('appends a tap-ripple span sized and positioned relative to the click point', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)

    spawnRipple(button, 20, 30)

    const ripple = button.querySelector('.tap-ripple') as HTMLElement
    expect(ripple).toBeTruthy()
    expect(ripple.style.width).toBe(ripple.style.height)

    document.body.removeChild(button)
  })

  it('removes the ripple element once its animation ends', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)

    spawnRipple(button, 10, 10)
    const ripple = button.querySelector('.tap-ripple') as HTMLElement
    expect(ripple).toBeTruthy()

    ripple.dispatchEvent(new Event('animationend'))
    expect(button.querySelector('.tap-ripple')).toBeNull()

    document.body.removeChild(button)
  })

  it('does not throw when the button has zero size (jsdom default layout)', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)
    expect(() => spawnRipple(button, 0, 0)).not.toThrow()
    document.body.removeChild(button)
  })
})
