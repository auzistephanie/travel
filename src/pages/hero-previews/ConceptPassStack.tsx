import { useState } from 'react'
import { HeroPreviewFrame } from './HeroPreviewFrame'

const PASSES = [
  { from: '香港', to: '大阪', code: 'CX 564', when: '11月1日', seat: '14A', kind: '登機證' },
  { from: '大阪', to: '京都', code: '新幹線', when: '11月2日', seat: '7號車', kind: '車票' },
  { from: '京都', to: '香港', code: 'CX 565', when: '11月3日', seat: '18C', kind: '回程' },
]

export function ConceptPassStack() {
  const [front, setFront] = useState(0)
  const ordered = PASSES.map((_, index) => PASSES[(front + index) % PASSES.length])

  return (
    <HeroPreviewFrame
      concept={1}
      title="把下一趟旅程攤開"
      lede="登機證與明信片疊在一起。輕觸或移動指標，三張卡片會扇開，露出每一段路程。"
    >
      <button
        type="button"
        className="pass-stack"
        aria-label="展開下一張行程卡片"
        onClick={() => setFront((value) => (value + 1) % PASSES.length)}
      >
        <article className="pass-card pass-back" aria-hidden="true">
          <p className="pass-stamp">香港</p>
          <p className="pass-post">給同行的朋友</p>
          <p className="pass-post-line">三日，三座城。</p>
        </article>
        {ordered.map((pass, index) => (
          <article key={pass.code} className={`pass-card pass-slip pass-slip-${index}`}>
            <div className="pass-stub">
              <span>{pass.kind}</span>
            </div>
            <div className="pass-body">
              <p className="pass-meta">
                {pass.code}
                <span>{pass.when}</span>
              </p>
              <p className="pass-route">
                <strong>{pass.from}</strong>
                <span aria-hidden="true">→</span>
                <strong>{pass.to}</strong>
              </p>
              <p className="pass-seat">座位 {pass.seat}</p>
              <span className="pass-barcode" aria-hidden="true" />
            </div>
          </article>
        ))}
      </button>
    </HeroPreviewFrame>
  )
}
