import { Link } from 'react-router-dom'
import { BookOpen, Compass, KeyRound } from 'lucide-react'
import '../styles/journalCard.css'
import './Landing.css'

export function Landing() {
  return (
    <div className="journal-page">
      <div className="journal-card journal-cover-content">
        <span className="journal-compass" aria-hidden="true">
          <Compass size={30} />
        </span>
        <h1 className="journal-title">旅行規劃 App</h1>
        <p className="journal-subtitle">Travel Journal</p>
        <p className="journal-tagline">
          與朋友一起規劃下一段旅程，
          <br />
          一鍵即可加入，無須註冊帳戶。
        </p>
        <div className="journal-actions">
          <Link to="/new" className="journal-cta-primary">
            <BookOpen size={17} aria-hidden="true" />
            開新行程
          </Link>
          <div className="journal-divider">或</div>
          <Link to="/join" className="journal-cta-secondary">
            <KeyRound size={15} aria-hidden="true" />
            用分享碼加入
          </Link>
        </div>
      </div>
    </div>
  )
}
