import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, KeyRound } from 'lucide-react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import './heroPreviews.css'

interface HeroPreviewFrameProps {
  concept: 1 | 2 | 3
  title: string
  lede: string
  children: ReactNode
}

export function HeroPreviewFrame({ concept, title, lede, children }: HeroPreviewFrameProps) {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    document.documentElement.classList.add('hero-preview-open')
    return () => document.documentElement.classList.remove('hero-preview-open')
  }, [])

  return (
    <div className="hp-page" data-reduced={reduced ? 'true' : 'false'}>
      <p className="hp-kicker">概念 {concept} · 首頁預覽，未取代現有首頁</p>
      <div className="hp-layout">
        <div className="hp-stage">{children}</div>
        <div className="hp-copy">
          <h1>{title}</h1>
          <p>{lede}</p>
          <div className="hp-actions">
            <Link to="/new" className="hp-cta">
              <BookOpen size={18} aria-hidden="true" />
              開新行程
            </Link>
            <Link to="/join" className="hp-cta hp-cta-quiet">
              <KeyRound size={16} aria-hidden="true" />
              用分享碼加入
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
