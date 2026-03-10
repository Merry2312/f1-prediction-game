import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { CURRENT_SEASON } from '../lib/jolpica'
import type { Prediction } from '../types'

export function usePrediction(userId: string | undefined, round: number) {
  return useQuery({
    queryKey: ['prediction', userId, round],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId!)
        .eq('race_round', round)
        .eq('season', CURRENT_SEASON)
        .maybeSingle()

      if (error) throw error
      return data as Prediction | null
    },
    enabled: !!userId,
  })
}

interface PredictionInput {
  user_id: string
  race_round: number
  pole_driver_id: string
  p1_driver_id: string
  p2_driver_id: string
  p3_driver_id: string
  top_constructor_id: string
  finishers_count: number
}

export function useUpsertPrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PredictionInput) => {
      const { data, error } = await supabase
        .from('predictions')
        .upsert(
          { ...input, season: CURRENT_SEASON },
          { onConflict: 'user_id,race_round,season' }
        )
        .select()
        .single()

      if (error) throw error
      return data as Prediction
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['prediction', data.user_id, data.race_round], data)
    },
  })
}
