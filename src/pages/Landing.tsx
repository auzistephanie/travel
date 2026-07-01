import { Link } from 'react-router-dom'
import '../styles/journalCard.css'
import './Landing.css'

export function Landing() {
  return (
    <div className="journal-page">
      <div className="journal-card journal-cover-content">
        <span className="journal-compass" aria-hidden="true">
          🧭
        </span>
        <h1 className="journal-title">旅行規劃 App</h1>
        <p className="journal-subtitle">Travel Journal</p>
        <p className="journal-tagline">
          同班友仔一齊規劃下一段旅程，
          <br />
          撳個掣就入到去，唔使開戶口。
        </p>
        <div className="journal-actions">
          <Link to="/new" className="journal-cta-primary">
            📖 開新行程
          </Link>
          <div className="journal-divider">定係</div>
          <Link to="/join" className="journal-cta-secondary">
            🔑 用分享碼加入
          </Link>
        </div>
      </div>
    </div>
  )
}
