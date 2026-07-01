export function generateTornEdgePoints(width: number, toothCount: number, amplitude: number): string {
  const step = width / toothCount
  const points: string[] = []
  for (let i = 0; i <= toothCount; i++) {
    const x = i * step
    const y = i % 2 === 0 ? 0 : amplitude
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}
