import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WeatherCard } from './WeatherCard'
import type { DayWeather } from '../lib/weatherApi'

const weather: DayWeather = {
  date: '2026-08-01',
  am: { tempC: 26, rainProbability: 20 },
  pm: { tempC: 31, rainProbability: 70 },
}

describe('WeatherCard', () => {
  it('shows AM and PM temperature and rain probability', () => {
    render(<WeatherCard weather={weather} />)
    expect(screen.getByText('26°C')).toBeInTheDocument()
    expect(screen.getByText('31°C')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
  })

  it('renders nothing when weather data is unavailable', () => {
    const { container } = render(<WeatherCard weather={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
