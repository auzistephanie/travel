import { useState } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { HeroPreviewFrame } from './HeroPreviewFrame'

const ROUTE = 'M 86 220 C 130 200, 155 176, 168 164 C 188 140, 200 110, 210 84'

function RoutePlane({ reduced }: { reduced: boolean }) {
  return (
    <g className={reduced ? 'route-plane is-done' : 'route-plane'} aria-hidden="true">
      <circle r="13" fill="#fffaf1" stroke="#2f3d33" strokeWidth="1.4" />
      <path
        d="M-8 0 L-1.5 -2 L1.5 -7 L4 -7 L2 -2.2 L9 0 L2 2.2 L4 7 L1.5 7 L-1.5 2 Z"
        fill="#c1683a"
      />
    </g>
  )
}

export function ConceptRouteMap() {
  const reduced = usePrefersReducedMotion()
  const [shift, setShift] = useState({ x: 0, y: 0 })

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width - 0.5
    const y = (event.clientY - bounds.top) / bounds.height - 0.5
    setShift({ x, y })
  }

  return (
    <HeroPreviewFrame
      concept={3}
      title="畫一條回家的航線"
      lede="一張手繪地圖。航線慢慢畫出，小飛機沿著香港、台北、大阪飛過去。"
    >
      <div
        className="route-scene"
        onPointerMove={onMove}
        onPointerLeave={() => setShift({ x: 0, y: 0 })}
      >
        <svg viewBox="0 0 320 280" role="img" aria-label="由香港經台北飛往大阪的插畫地圖">
          <title>插畫航線地圖</title>
          <rect width="320" height="280" rx="28" fill="#d7ebe4" />
          <g
            className="route-sea"
            style={{ transform: `translate(${shift.x * -8}px, ${shift.y * -6}px)` }}
            fill="#8ec4b8"
            opacity="0.45"
          >
            <ellipse cx="70" cy="40" rx="46" ry="16" />
            <ellipse cx="240" cy="210" rx="54" ry="18" />
            <ellipse cx="150" cy="140" rx="30" ry="10" />
          </g>
          <g className="route-land" style={{ transform: `translate(${shift.x * 10}px, ${shift.y * 8}px)` }}>
            <path d="M40 210 C70 170, 96 188, 118 214 C92 236, 58 240, 40 210Z" fill="#3f6b4f" />
            <path d="M132 168 C156 142, 188 150, 196 176 C170 196, 142 194, 132 168Z" fill="#2f6a52" />
            <path d="M188 78 C230 46, 268 62, 262 108 C228 126, 196 112, 188 78Z" fill="#3f6b4f" />
            <path d="M146 36 C168 18, 198 28, 190 52 C170 62, 150 54, 146 36Z" fill="#2f4a3e" />
          </g>
          <path className="route-line-glow" d={ROUTE} />
          <path className="route-line" d={ROUTE} />
          <g className="route-cities" fill="#2f3d33">
            <circle cx="86" cy="220" r="5" fill="#c1683a" />
            <text x="96" y="236">香港</text>
            <circle cx="168" cy="164" r="5" fill="#c1683a" />
            <text x="178" y="160">台北</text>
            <circle cx="210" cy="84" r="5" fill="#c1683a" />
            <text x="168" y="74">大阪</text>
          </g>
          <RoutePlane reduced={reduced} />
        </svg>
      </div>
    </HeroPreviewFrame>
  )
}
