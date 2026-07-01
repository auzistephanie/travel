import { useEffect, useState } from 'react'
import { getAirport, getFirstFlightAirport } from '../lib/airports'
import { fetchWeather, type DayWeather } from '../lib/weatherApi'
import { useFlights } from './useFlights'
import type { Trip } from '../types/models'

export function useDestinationWeather(trip: Trip) {
  const { flights } = useFlights(trip.id)
  const [weatherByDate, setWeatherByDate] = useState<Record<string, DayWeather>>({})

  useEffect(() => {
    if (flights.length === 0) return

    const airportCode = getFirstFlightAirport(flights)
    const airport = airportCode ? getAirport(airportCode) : undefined
    if (!airport) return

    fetchWeather(airport.lat, airport.lng, trip.start_date, trip.end_date).then((days) => {
      const map: Record<string, DayWeather> = {}
      days.forEach((day) => {
        map[day.date] = day
      })
      setWeatherByDate(map)
    })
  }, [flights, trip.start_date, trip.end_date])

  return weatherByDate
}
