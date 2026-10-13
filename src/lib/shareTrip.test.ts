import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareTripInvite, tripInviteUrl } from './shareTrip'

describe('tripInviteUrl', () => {
  it('builds a share-code link without a personal member id', () => {
    expect(tripInviteUrl('ABC234', 'https://travel.example')).toBe('https://travel.example/t/ABC234')
  })
})

describe('shareTripInvite', () => {
  const originalShare = navigator.share
  const originalClipboard = navigator.clipboard

  afterEach(() => {
    Object.defineProperty(navigator, 'share', { value: originalShare, configurable: true })
    Object.defineProperty(navigator, 'clipboard', { value: originalClipboard, configurable: true })
  })

  it('uses the Web Share API when the browser provides it', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })

    await expect(shareTripInvite({ shareCode: 'ABC234', tripName: '台北四日' })).resolves.toBe('shared')
    expect(share).toHaveBeenCalledWith({
      title: '一起規劃「台北四日」',
      text: '開啟連結後選擇自己的名字即可一起編輯，無需登入。',
      url: `${window.location.origin}/t/ABC234`,
    })
  })

  it('copies the link when sharing is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    await expect(shareTripInvite({ shareCode: 'ABC234' })).resolves.toBe('copied')
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/t/ABC234`)
  })

  it('falls back to a text selection copy when the clipboard API is blocked', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    const execCommand = vi.fn().mockReturnValue(true)
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true })

    await expect(shareTripInvite({ shareCode: 'ABC234' })).resolves.toBe('copied')
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it('treats closing the share sheet as a cancel', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError'))
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })

    await expect(shareTripInvite({ shareCode: 'ABC234' })).resolves.toBe('cancelled')
  })
})
