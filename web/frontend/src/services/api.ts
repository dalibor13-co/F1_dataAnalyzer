import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Race {
  round: number
  race_name: string
  country: string
  circuit: string
  date: string
}

export interface LapData {
  lap_number: number
  time: number | null
  sector1: number | null
  sector2: number | null
  sector3: number | null
  compound: string
  tyre_life: number | null
}

export interface PitStop {
  lap: number
  stint: number | null
  pit_in_time?: number
  pit_out_time?: number
  pit_duration?: number
  lap_time?: number
  compound_before?: string
  tyre_life_before?: number
}

export interface DriverLaps {
  driver: string
  race: string
  laps: LapData[]
  pit_stops: PitStop[]
}

export interface Comparison {
  driver1: string
  driver2: string
  avg_gap: number
  fastest_lap_gap: number
  driver1_faster_laps: number
  driver2_faster_laps: number
  driver1_consistency: number
  driver2_consistency: number
  sector1_gap: number
  sector2_gap: number
  sector3_gap: number
}

export interface PaceAnalysis {
  driver: string
  pace: {
    mean_pace: number
    median_pace: number
    std_pace: number
    fastest_lap: number
    slowest_lap: number
    consistency: number
  }
  tyre_degradation: Array<{
    Compound: string
    StintLength: number
    AvgLapTime: number
    DegradationPerLap: number
    FirstLapTime: number
    LastLapTime: number
  }>
}

export interface SafetyCarPeriod {
  start_lap: number
  end_lap: number
  type: string
  reason: string
}

export interface SafetyCarData {
  year: number
  race: number
  event: string
  safety_car_periods: SafetyCarPeriod[]
}

export const apiService = {
  async getRaces(year: number = 2024): Promise<Race[]> {
    const response = await api.get(`/races/${year}`)
    return response.data
  },

  async getDriverLaps(
    year: number,
    race: number,
    driver: string,
    session: string = 'R'
  ): Promise<DriverLaps> {
    const response = await api.get(`/laps/${year}/${race}/${driver}?session=${session}`)
    return response.data
  },

  async getSectorTimes(
    year: number,
    race: number,
    driver: string,
    session: string = 'R'
  ) {
    const response = await api.get(`/sectors/${year}/${race}/${driver}?session=${session}`)
    return response.data
  },

  async compareDrivers(
    year: number,
    race: number,
    driver1: string,
    driver2: string,
    session: string = 'R'
  ): Promise<Comparison> {
    const response = await api.get(
      `/comparison/${year}/${race}/${driver1}/${driver2}?session=${session}`
    )
    return response.data
  },

  async getPaceAnalysis(
    year: number,
    race: number,
    driver: string,
    session: string = 'R'
  ): Promise<PaceAnalysis> {
    const response = await api.get(`/analysis/pace/${year}/${race}/${driver}?session=${session}`)
    return response.data
  },

  async getSafetyCarPeriods(
    year: number,
    race: number
  ): Promise<SafetyCarData> {
    const response = await api.get(`/safety-car/${year}/${race}`)
    return response.data
  }
}

export default api
