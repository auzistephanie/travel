import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DestinationIllustration } from '../../components/DestinationIllustration'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { HeroPreviewFrame } from './HeroPreviewFrame'

const CARDS = [
  { code: 'JP', city: '大阪', note: '城郭與夜色' },
  { code: 'TW', city: '台北', note: '巷弄與山脈' },
  { code: 'KR', city: '首爾', note: '宮殿與市集' },
  { code: 'TH', city: '曼谷', note: '河岸與寺廟' },
  { code: 'VN', city: '河內', note: '湖邊與老街' },
]

function signedOffset(index: number, active: number, total: number) {
  let delta = index - active
  if (delta > total / 2) delta -= total
  if (delta < -total / 2) delta += total
  return delta
}

export function ConceptCardCarousel() {
  const reduced = usePrefersReducedMotion()
  const [active, setActive] = useState(0)
  const [dragX, setDragX] = useState<number | null>(null)

  useEffect(() => {
    if (reduced) return
    const timer = window.setInterval(() => {
      setActive((value) => (value + 1) % CARDS.length)
    }, 3400)
    return () => window.clearInterval(timer)
  }, [reduced])

  function step(direction: number) {
    setActive((value) => (value + direction + CARDS.length) % CARDS.length)
  }

  return (
    <HeroPreviewFrame
      concept={2}
      title="下一站，想去哪裡"
      lede="目的地插畫卡片以立體角度排開。中間一張迎面而來，左右兩張退到景深裡。"
    >
      <div className="carousel">
        <div
          className="carousel-stage"
          onPointerDown={(event) => setDragX(event.clientX)}
          onPointerUp={(event) => {
            if (dragX == null) return
            const delta = event.clientX - dragX
            if (delta > 36) step(-1)
            else if (delta < -36) step(1)
            setDragX(null)
          }}
        >
          {CARDS.map((card, index) => {
            const delta = signedOffset(index, active, CARDS.length)
            const hidden = Math.abs(delta) > 2
            return (
              <article
                key={card.code}
                className="dest-card"
                style={{
                  transform: `translateX(${delta * 58}%) rotateY(${delta * -32}deg) translateZ(${delta === 0 ? 48 : -70}px) scale(${delta === 0 ? 1 : 0.84})`,
                  opacity: hidden ? 0 : 1,
                  zIndex: 10 - Math.abs(delta),
                }}
                aria-hidden={delta !== 0}
              >
                <DestinationIllustration countryCode={card.code} />
                <div className="dest-card-caption">
                  <h2>{card.city}</h2>
                  <p>{card.note}</p>
                </div>
              </article>
            )
          })}
        </div>
        <div className="carousel-nav">
          <button type="button" onClick={() => step(-1)} aria-label="上一張目的地">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <p aria-live="polite">
            {CARDS[active].city}
            <span>
              {active + 1} / {CARDS.length}
            </span>
          </p>
          <button type="button" onClick={() => step(1)} aria-label="下一張目的地">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </HeroPreviewFrame>
  )
}
