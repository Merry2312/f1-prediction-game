import type {
  JolpicaScheduleResponse,
  JolpicaRace,
  JolpicaDriversResponse,
  JolpicaDriver,
  JolpicaConstructorsResponse,
  JolpicaConstructor,
  JolpicaRaceResultsResponse,
  JolpicaRaceResult,
  JolpicaQualifyingResponse,
  JolpicaQualifyingResult,
  JolpicaConstructorStandingsResponse,
  JolpicaConstructorStanding,
} from '../types'

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

export async function fetchDrivers(): Promise<JolpicaDriver[]> {
  const data = await jolpicaFetch<JolpicaDriversResponse>(`/${CURRENT_SEASON}/drivers.json`)
  return data.MRData.DriverTable.Drivers
}

export async function fetchConstructors(): Promise<JolpicaConstructor[]> {
  const data = await jolpicaFetch<JolpicaConstructorsResponse>(`/${CURRENT_SEASON}/constructors.json`)
  return data.MRData.ConstructorTable.Constructors
}

export async function fetchRaceResults(round: number): Promise<JolpicaRaceResult[]> {
  const data = await jolpicaFetch<JolpicaRaceResultsResponse>(`/${CURRENT_SEASON}/${round}/results.json`)
  return data.MRData.RaceTable.Races[0]?.Results ?? []
}

export async function fetchQualifyingResults(round: number): Promise<JolpicaQualifyingResult[]> {
  const data = await jolpicaFetch<JolpicaQualifyingResponse>(`/${CURRENT_SEASON}/${round}/qualifying.json`)
  return data.MRData.RaceTable.Races[0]?.QualifyingResults ?? []
}

export async function fetchConstructorStandings(round: number): Promise<JolpicaConstructorStanding[]> {
  const data = await jolpicaFetch<JolpicaConstructorStandingsResponse>(`/${CURRENT_SEASON}/${round}/constructorStandings.json`)
  return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? []
}
