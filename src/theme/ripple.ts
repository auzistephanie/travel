const RIPPLE_CLASS = 'tap-ripple'

export function spawnRipple(button: HTMLElement, clientX: number, clientY: number): void {
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)

  const ripple = document.createElement('span')
  ripple.className = RIPPLE_CLASS
  ripple.style.width = `${size}px`
  ripple.style.height = `${size}px`
  ripple.style.left = `${clientX - rect.left - size / 2}px`
  ripple.style.top = `${clientY - rect.top - size / 2}px`

  if (getComputedStyle(button).position === 'static') {
    button.style.position = 'relative'
  }
  button.style.overflow = 'hidden'

  button.appendChild(ripple)
  ripple.addEventListener('animationend', () => ripple.remove(), { once: true })
}
