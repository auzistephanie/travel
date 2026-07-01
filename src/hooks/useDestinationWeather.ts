import { useEffect, useState } from 'react'
import { getAirport, getAirportForCountry, getFirstFlightAirport } from '../lib/airports'
import { fetchWeather, type DayWeather } from '../lib/weatherApi'
import { useFlights } from './useFlights'
import type { Trip } from '../types/models'

export function useDestinationWeather(trip: Trip) {
  const { flights } = useFlights(trip.id)
  const [weatherByDate, setWeatherByDate] = useState<Record<string, DayWeather>>({})

  useEffect(() => {
    const airport = trip.destination_country
      ? getAirportForCountry(trip.destination_country)
      : (() => {
          const airportCode = getFirstFlightAirport(flights)
          return airportCode ? getAirport(airportCode) : undefined
        })()

    if (!airport) return

    fetchWeather(airport.lat, airport.lng, trip.start_date, trip.end_date).then((days) => {
      const map: Record<string, DayWeather> = {}
      days.forEach((day) => {
        map[day.date] = day
      })
      setWeatherByDate(map)
    })
  }, [flights, trip.destination_country, trip.start_date, trip.end_date])

  return weatherByDate
}
