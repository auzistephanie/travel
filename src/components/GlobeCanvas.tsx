import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

const CITIES: [number, number][] = [
  [35.68, 139.69],
  [22.32, 114.17],
  [25.03, 121.57],
  [37.57, 126.98],
  [13.76, 100.5],
  [1.35, 103.82],
  [21.03, 105.85],
  [35.18, 129.08],
  [48.86, 2.35],
  [51.51, -0.13],
  [40.71, -74.01],
  [-33.87, 151.21],
]

function latLngToVec(lat: number, lng: number, radius: number) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lng + 180) * Math.PI) / 180
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function makeEarthTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)
  ctx.fillStyle = '#1c4f66'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#3f6b4f'
  const blobs: [number, number, number, number][] = [
    [90, 78, 46, 28],
    [150, 70, 34, 22],
    [210, 88, 28, 18],
    [250, 120, 22, 16],
    [300, 90, 40, 24],
    [360, 110, 26, 36],
    [410, 70, 30, 18],
    [120, 150, 36, 22],
    [200, 160, 48, 20],
    [310, 155, 30, 18],
  ]
  for (const [x, y, rx, ry] of blobs) {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = '#c9a15b'
  ctx.globalAlpha = 0.35
  ctx.fillRect(0, 118, 512, 8)
  ctx.globalAlpha = 1
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function Earth() {
  const group = useRef<THREE.Group>(null)
  const texture = useMemo(() => makeEarthTexture(), [])

  useEffect(() => () => texture.dispose(), [texture])

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.18
  })

  return (
    <group ref={group} rotation={[0.35, 0.6, 0]}>
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial map={texture} roughness={0.82} metalness={0.04} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.08, 32, 32]} />
        <meshBasicMaterial color="#9ad7cf" transparent opacity={0.16} side={THREE.BackSide} />
      </mesh>
      {CITIES.map(([lat, lng], index) => (
        <mesh key={index} position={latLngToVec(lat, lng, 1.025)}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#f3c969" />
        </mesh>
      ))}
    </group>
  )
}

export default function GlobeCanvas() {
  return (
    <div className="globe-canvas" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 2.7], fov: 35 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 2, 3]} intensity={1.35} />
        <Earth />
      </Canvas>
    </div>
  )
}
