// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const BANNED = [
  'VITE_AVIATIONSTACK_KEY',
  'VITE_TOMTOM_KEY',
  'VITE_TAGGUN_API_KEY',
  'api.aviationstack.com',
  'api.tomtom.com',
  'api.taggun.io',
]

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return filesUnder(path)
    return /\.(ts|tsx)$/.test(entry) ? [path] : []
  })
}

describe('browser source does not contain third-party secrets', () => {
  it('keeps AviationStack, TomTom, and Taggun on the server', () => {
    const root = join(import.meta.dirname, '../../src')
    const hits: string[] = []
    for (const file of filesUnder(root)) {
      const text = readFileSync(file, 'utf8')
      for (const banned of BANNED) {
        if (text.includes(banned)) hits.push(`${file} contains ${banned}`)
      }
    }
    expect(hits).toEqual([])
  })
})
