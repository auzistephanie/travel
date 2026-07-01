export function VietnamIllustration() {
  return (
    <svg viewBox="0 0 200 120" role="img" aria-label="越南插畫">
      <title>越南 — 下龍灣石灰岩山與帆船</title>
      <defs>
        <linearGradient id="vn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5fc2c2" />
          <stop offset="60%" stopColor="#a8dede" />
          <stop offset="100%" stopColor="#ffe9b3" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#vn-sky)" />
      <circle cx="50" cy="28" r="15" fill="#fff4d6" opacity="0.85" />
      <g fill="#3a6b6b" opacity="0.75">
        <ellipse cx="40" cy="88" rx="26" ry="22" />
        <ellipse cx="90" cy="92" rx="20" ry="18" />
        <ellipse cx="140" cy="86" rx="30" ry="24" />
        <ellipse cx="175" cy="94" rx="16" ry="14" />
      </g>
      <g>
        <line x1="100" y1="100" x2="100" y2="72" stroke="#3b2a1f" strokeWidth="2" />
        <polygon points="100,72 100,90 122,90" fill="#c23b3b" />
        <polygon points="20,100 45,100 42,94 23,94" fill="#3b2a1f" />
      </g>
      <rect x="0" y="108" width="200" height="12" fill="#2f6f6a" />
    </svg>
  )
}
