import { useEffect, useState } from 'react'
import { Store, Toilet } from 'lucide-react'
import { findNearbyConvenienceStore, findNearbyRestroom, type FacilityResult } from '../lib/facilitiesApi'

function facilityMapsUrl(facility: FacilityResult): string {
  return `https://www.google.com/maps/search/?api=1&query=${facility.lat},${facility.lng}`
}

interface FacilityChipsProps {
  lat: number
  lng: number
}

export function FacilityChips({ lat, lng }: FacilityChipsProps) {
  const [restroom, setRestroom] = useState<FacilityResult | null>(null)
  const [store, setStore] = useState<FacilityResult | null>(null)

  useEffect(() => {
    findNearbyRestroom(lat, lng).then(setRestroom)
    findNearbyConvenienceStore(lat, lng).then(setStore)
  }, [lat, lng])

  if (!restroom && !store) return null

  return (
    <span className="facility-chips">
      {restroom && (
        <a href={facilityMapsUrl(restroom)} target="_blank" rel="noreferrer">
          <Toilet size={12} aria-hidden="true" />
          {restroom.name}
        </a>
      )}
      {store && (
        <a href={facilityMapsUrl(store)} target="_blank" rel="noreferrer">
          <Store size={12} aria-hidden="true" />
          {store.name}
        </a>
      )}
    </span>
  )
}
