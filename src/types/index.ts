// Jolpica API response types

export interface JolpicaLocation {
  locality: string
  country: string
}

export interface JolpicaCircuit {
  circuitId: string
  circuitName: string
  Location: JolpicaLocation
}

export interface JolpicaSession {
  date: string
  time?: string
}

export interface JolpicaRace {
  season: string
  round: string
  raceName: string
  Circuit: JolpicaCircuit
  date: string
  time?: string
  FirstPractice?: JolpicaSession
  SecondPractice?: JolpicaSession
  ThirdPractice?: JolpicaSession
  Qualifying?: JolpicaSession
  Sprint?: JolpicaSession
  SprintQualifying?: JolpicaSession
}

export interface JolpicaScheduleResponse {
  MRData: {
    RaceTable: {
      season: string
      Races: JolpicaRace[]
    }
  }
}
