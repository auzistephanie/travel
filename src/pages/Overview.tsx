import { HeroCard } from '../components/HeroCard'
import type { TripPageProps } from '../types/props'

export function Overview({ trip, members }: TripPageProps) {
  return <HeroCard trip={trip} members={members} />
}
