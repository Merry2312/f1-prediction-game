import { useQuery } from '@tanstack/react-query'
import { fetchSchedule, fetchDrivers, fetchConstructors } from '../lib/jolpica'

export function useSchedule() {
  return useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
    staleTime: 1000 * 60 * 60, // 1 hour — schedule rarely changes
  })
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: fetchDrivers,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours — driver list rarely changes mid-season
  })
}

export function useConstructors() {
  return useQuery({
    queryKey: ['constructors'],
    queryFn: fetchConstructors,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}
