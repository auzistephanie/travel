export function JapanIllustration() {
  return (
    <svg viewBox="0 0 200 120" role="img" aria-label="日本插畫">
      <title>日本 — 東京鐵塔與富士山</title>
      <defs>
        <linearGradient id="jp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff9a76" />
          <stop offset="60%" stopColor="#ffd3a5" />
          <stop offset="100%" stopColor="#fff1d6" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#jp-sky)" />
      <circle cx="150" cy="30" r="16" fill="#ffe0b3" opacity="0.8" />
      <polygon points="40,90 75,30 110,90" fill="#7c8fa6" opacity="0.7" />
      <polygon points="55,90 75,52 95,90" fill="#5b6d84" opacity="0.6" />
      <g>
        <polygon points="150,95 158,40 162,40 170,95" fill="#8a2f2f" />
        <line x1="145" y1="75" x2="175" y2="75" stroke="#8a2f2f" strokeWidth="1.5" />
        <line x1="148" y1="60" x2="172" y2="60" stroke="#8a2f2f" strokeWidth="1.5" />
      </g>
      <circle cx="30" cy="100" r="6" fill="#c23b3b" />
      <circle cx="45" cy="105" r="5" fill="#c23b3b" />
      <rect x="0" y="108" width="200" height="12" fill="#3b3226" />
    </svg>
  )
}
