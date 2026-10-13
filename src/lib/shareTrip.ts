export function tripInviteUrl(shareCode: string, origin = window.location.origin): string {
  return `${origin}/t/${shareCode}`
}

export type ShareTripResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareTripInvite(options: {
  shareCode: string
  tripName?: string
}): Promise<ShareTripResult> {
  const url = tripInviteUrl(options.shareCode)
  const title = options.tripName ? `一起規劃「${options.tripName}」` : '一起規劃行程'
  const text = '開啟連結後選擇自己的名字即可一起編輯，無需登入。'

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    if (copyWithSelection(url)) return 'copied'
    return 'failed'
  }
}

function copyWithSelection(text: string): boolean {
  try {
    const input = document.createElement('textarea')
    input.value = text
    input.setAttribute('readonly', '')
    input.style.position = 'fixed'
    input.style.top = '0'
    input.style.left = '-9999px'
    document.body.appendChild(input)
    input.select()
    const copied = document.execCommand('copy')
    input.remove()
    return copied
  } catch {
    return false
  }
}
