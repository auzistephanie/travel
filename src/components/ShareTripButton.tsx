import { useState } from 'react'
import { Check, Share2 } from 'lucide-react'
import { shareTripInvite, tripInviteUrl, type ShareTripResult } from '../lib/shareTrip'

interface ShareTripButtonProps {
  shareCode: string
  tripName?: string
  className?: string
  iconOnly?: boolean
}

function labelFor(status: ShareTripResult | null): string {
  if (status === 'copied') return '已複製連結'
  if (status === 'shared') return '已分享'
  if (status === 'failed') return '請手動複製連結'
  return '分享給朋友'
}

export function ShareTripButton({ shareCode, tripName, className, iconOnly = false }: ShareTripButtonProps) {
  const [status, setStatus] = useState<ShareTripResult | null>(null)
  const url = tripInviteUrl(shareCode)

  async function handleShare() {
    const result = await shareTripInvite({ shareCode, tripName })
    setStatus(result)
    if (result === 'copied' || result === 'shared') {
      window.setTimeout(() => setStatus(null), 2000)
    }
  }

  const label = labelFor(status)

  return (
    <button type="button" className={className} aria-label={label} onClick={handleShare}>
      {status === 'copied' || status === 'shared' ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <Share2 size={16} aria-hidden="true" />
      )}
      {!iconOnly && label}
      {status === 'failed' && <span className="share-fallback-url">{url}</span>}
    </button>
  )
}
