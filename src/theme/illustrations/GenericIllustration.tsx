export function GenericIllustration() {
  return (
    <svg viewBox="0 0 200 120" role="img" aria-label="旅程插畫">
      <title>未知目的地 — 通用旅程插畫</title>
      <defs>
        <linearGradient id="generic-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9fc9e8" />
          <stop offset="70%" stopColor="#cfe6f5" />
          <stop offset="100%" stopColor="#f3f8fb" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#generic-sky)" />
      <circle cx="150" cy="26" r="14" fill="#fff6e0" opacity="0.9" />
      <polygon points="30,95 60,50 90,95" fill="#7c8fa6" opacity="0.7" />
      <polygon points="70,95 100,45 130,95" fill="#5b6d84" opacity="0.7" />
      <rect x="0" y="108" width="200" height="12" fill="#3f5a6b" />
    </svg>
  )
}
