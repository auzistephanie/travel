import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { JapanIllustration } from './JapanIllustration'
import { ThailandIllustration } from './ThailandIllustration'
import { KoreaIllustration } from './KoreaIllustration'
import { TaiwanIllustration } from './TaiwanIllustration'
import { VietnamIllustration } from './VietnamIllustration'
import { GenericIllustration } from './GenericIllustration'

describe('destination illustrations', () => {
  const cases: [string, () => React.JSX.Element, string][] = [
    ['Japan', JapanIllustration, '日本'],
    ['Thailand', ThailandIllustration, '泰國'],
    ['Korea', KoreaIllustration, '韓國'],
    ['Taiwan', TaiwanIllustration, '台灣'],
    ['Vietnam', VietnamIllustration, '越南'],
    ['Generic', GenericIllustration, '未知目的地'],
  ]

  it.each(cases)('%s renders a distinct labeled SVG', (_label, Illustration, titleFragment) => {
    const { container } = render(<Illustration />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(container.querySelector('title')?.textContent).toContain(titleFragment)
  })

  it('gives every destination a visually distinct title (no copy-paste duplicates)', () => {
    const titles = cases.map(([, Illustration]) => {
      const { container } = render(<Illustration />)
      return container.querySelector('title')?.textContent
    })
    expect(new Set(titles).size).toBe(titles.length)
  })
})
