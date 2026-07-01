import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div>
      <h1>旅行規劃 App</h1>
      <Link to="/new">
        <button type="button">開新行程</button>
      </Link>
      <Link to="/join">
        <button type="button">用分享碼加入</button>
      </Link>
    </div>
  )
}
