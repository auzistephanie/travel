import { lazy, Suspense, useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

const GlobeCanvas = lazy(() => import('./GlobeCanvas'))

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

export function GlobeSlot() {
  const reduced = usePrefersReducedMotion()
  const [webgl, setWebgl] = useState(false)

  useEffect(() => {
    setWebgl(canUseWebGL())
  }, [])

  if (reduced || !webgl) {
    return <div className="globe-fallback" aria-hidden="true" />
  }

  return (
    <Suspense fallback={<div className="globe-fallback" aria-hidden="true" />}>
      <GlobeCanvas />
    </Suspense>
  )
}
