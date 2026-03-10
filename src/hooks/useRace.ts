import { useQuery } from '@tanstack/react-query'
import { fetchSchedule } from '../lib/jolpica'

export function useSchedule() {
  return useQuery({
    queryKey: ['schedule'],
    queryFn: fetchSchedule,
    staleTime: 1000 * 60 * 60, // 1 hour — schedule rarely changes
  })
}
