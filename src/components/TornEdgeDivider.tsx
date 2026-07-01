import { generateTornEdgePoints } from '../theme/tornEdge'

const WIDTH = 200
const TOOTH_COUNT = 24
const AMPLITUDE = 6

export function TornEdgeDivider() {
  const points = generateTornEdgePoints(WIDTH, TOOTH_COUNT, AMPLITUDE)

  return (
    <svg
      className="torn-edge-divider"
      viewBox={`0 0 ${WIDTH} ${AMPLITUDE}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <polyline points={points} />
    </svg>
  )
}
