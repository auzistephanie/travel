export function KoreaIllustration() {
  return (
    <svg viewBox="0 0 200 120" role="img" aria-label="韓國插畫">
      <title>韓國 — 韓式飛簷</title>
      <defs>
        <linearGradient id="kr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7b7c5" />
          <stop offset="60%" stopColor="#cfe0f0" />
          <stop offset="100%" stopColor="#eef6fb" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#kr-sky)" />
      <circle cx="160" cy="28" r="14" fill="#fff7f2" opacity="0.9" />
      <path
        d="M40 95 C40 70 55 60 70 60 C85 60 100 70 100 95 Z"
        fill="#3f5a6b"
      />
      <path
        d="M30 62 C45 40 95 40 110 62 C100 55 85 50 70 50 C55 50 40 55 30 62 Z"
        fill="#2f4a58"
      />
      <rect x="66" y="60" width="8" height="10" fill="#8a3b3b" />
      <g fill="#4a6b4a" opacity="0.8">
        <polygon points="130,95 140,70 150,95" />
        <polygon points="145,95 155,65 165,95" />
      </g>
      <rect x="0" y="108" width="200" height="12" fill="#4a5f6f" />
    </svg>
  )
}
