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

export interface JolpicaDriver {
  driverId: string
  code?: string
  givenName: string
  familyName: string
  nationality: string
}

export interface JolpicaConstructor {
  constructorId: string
  name: string
  nationality: string
}

export interface JolpicaDriversResponse {
  MRData: {
    DriverTable: {
      season: string
      Drivers: JolpicaDriver[]
    }
  }
}

export interface JolpicaConstructorsResponse {
  MRData: {
    ConstructorTable: {
      season: string
      Constructors: JolpicaConstructor[]
    }
  }
}

export interface JolpicaResultDriver {
  driverId: string
  code?: string
  givenName: string
  familyName: string
}

export interface JolpicaResultConstructor {
  constructorId: string
  name: string
}

export interface JolpicaRaceResult {
  position: string
  Driver: JolpicaResultDriver
  Constructor: JolpicaResultConstructor
}

export interface JolpicaQualifyingResult {
  position: string
  Driver: JolpicaResultDriver
}

export interface JolpicaConstructorStanding {
  position: string
  Constructor: JolpicaResultConstructor
}

export interface JolpicaRaceResultsResponse {
  MRData: {
    RaceTable: {
      Races: Array<{
        Results: JolpicaRaceResult[]
      }>
    }
  }
}

export interface JolpicaQualifyingResponse {
  MRData: {
    RaceTable: {
      Races: Array<{
        QualifyingResults: JolpicaQualifyingResult[]
      }>
    }
  }
}

export interface JolpicaConstructorStandingsResponse {
  MRData: {
    StandingsTable: {
      StandingsLists: Array<{
        ConstructorStandings: JolpicaConstructorStanding[]
      }>
    }
  }
}

// Supabase types

export interface Prediction {
  id: string
  user_id: string
  race_round: number
  season: number
  pole_driver_id: string
  p1_driver_id: string
  p2_driver_id: string
  p3_driver_id: string
  top_constructor_id: string
  finishers_count: number
  submitted_at: string
  locked: boolean
}
