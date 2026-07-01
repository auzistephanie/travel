export function ThailandIllustration() {
  return (
    <svg viewBox="0 0 200 120" role="img" aria-label="泰國插畫">
      <title>泰國 — 佛塔與長尾船</title>
      <defs>
        <linearGradient id="th-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffb347" />
          <stop offset="70%" stopColor="#ffd88a" />
          <stop offset="100%" stopColor="#fff4d6" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#th-sky)" />
      <circle cx="40" cy="30" r="18" fill="#fff0c2" opacity="0.85" />
      <g fill="#7a4a2b">
        <polygon points="120,95 130,70 140,95" />
        <polygon points="124,72 130,45 136,72" />
        <polygon points="127,47 130,25 133,47" />
        <circle cx="130" cy="22" r="3" />
      </g>
      <g fill="#96613a">
        <polygon points="150,95 156,78 162,95" />
        <polygon points="105,95 111,80 117,95" />
      </g>
      <path d="M20 100 L45 100 L40 92 L25 92 Z" fill="#5a3b28" />
      <polygon points="30,92 30,72 44,92" fill="#c23b3b" />
      <rect x="0" y="108" width="200" height="12" fill="#2f6f6a" />
    </svg>
  )
}
