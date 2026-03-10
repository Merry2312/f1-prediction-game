import type { JolpicaScheduleResponse, JolpicaRace } from '../types'

export const CURRENT_SEASON = 2026

const BASE_URL = 'https://api.jolpi.ca/ergast/f1'

async function jolpicaFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`Jolpica API error: ${res.status}`)
  return res.json() as Promise<T>
}

export async function fetchSchedule(): Promise<JolpicaRace[]> {
  const data = await jolpicaFetch<JolpicaScheduleResponse>(`/${CURRENT_SEASON}.json`)
  return data.MRData.RaceTable.Races
}
