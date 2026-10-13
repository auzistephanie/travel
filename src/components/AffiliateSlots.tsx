import { BedDouble, Plane } from 'lucide-react'
import { AFFILIATE_SLOTS, affiliateHref } from '../lib/affiliateLinks'

const ICONS = {
  hotel: BedDouble,
  flight: Plane,
} as const

export function AffiliateSlots() {
  return (
    <section aria-label="訂房與機票">
      <h2 className="sec-title">訂房與機票</h2>
      <p className="sec-empty">以下是介紹連結的位置。網址尚未填入，暫時不能開啟。</p>
      <ul className="affiliate-list">
        {AFFILIATE_SLOTS.map((slot) => {
          const href = affiliateHref(slot.href)
          const Icon = ICONS[slot.id]
          return (
            <li key={slot.id} className="affiliate-card">
              <span className="affiliate-ic" aria-hidden="true">
                <Icon size={18} />
              </span>
              <div className="affiliate-copy">
                <strong>
                  {slot.title} <span className="affiliate-en">{slot.titleEn}</span>
                </strong>
                <span>{slot.description}</span>
              </div>
              {href ? (
                <a className="affiliate-go" href={href} target="_blank" rel="noreferrer">
                  前往
                </a>
              ) : (
                <button type="button" className="affiliate-go" disabled>
                  連結待填
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
