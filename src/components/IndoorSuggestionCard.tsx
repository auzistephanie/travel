import { useEffect, useState } from 'react'
import { searchIndoorPlaces, type PlaceResult } from '../lib/placesApi'

interface IndoorSuggestionCardProps {
  lat: number
  lng: number
}

export function IndoorSuggestionCard({ lat, lng }: IndoorSuggestionCardProps) {
  const [places, setPlaces] = useState<PlaceResult[]>([])

  useEffect(() => {
    searchIndoorPlaces(lat, lng).then(setPlaces)
  }, [lat, lng])

  if (places.length === 0) return null

  return (
    <section aria-label="室內好去處推介">
      <h3>☔ 可能落雨，室內好去處推介</h3>
      <ul>
        {places.map((place, i) => (
          <li key={`${place.name}-${i}`}>
            <strong>{place.name}</strong>
            <span>{place.address}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
