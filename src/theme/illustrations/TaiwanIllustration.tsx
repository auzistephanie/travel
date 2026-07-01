export function TaiwanIllustration() {
  return (
    <svg viewBox="0 0 200 120" role="img" aria-label="台灣插畫">
      <title>台灣 — 台北塔式建築與天燈</title>
      <defs>
        <linearGradient id="tw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2b1f4a" />
          <stop offset="60%" stopColor="#5b3f78" />
          <stop offset="100%" stopColor="#8a6fa0" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#tw-sky)" />
      <g fill="#241a3a">
        <rect x="120" y="70" width="20" height="10" />
        <rect x="122" y="60" width="16" height="10" />
        <rect x="124" y="50" width="12" height="10" />
        <rect x="126" y="40" width="8" height="10" />
        <rect x="127" y="30" width="6" height="10" />
        <rect x="128" y="20" width="4" height="10" />
      </g>
      <g fill="#ffb86b" opacity="0.9">
        <circle cx="40" cy="30" r="8" />
        <polygon points="34,34 46,34 40,44" />
        <circle cx="65" cy="50" r="6" />
        <polygon points="60,53 70,53 65,60" />
        <circle cx="30" cy="60" r="5" />
        <polygon points="26,63 34,63 30,69" />
      </g>
      <rect x="0" y="108" width="200" height="12" fill="#1a1330" />
    </svg>
  )
}
