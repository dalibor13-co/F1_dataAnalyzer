import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService, type Comparison, type Race } from '@/services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts'
import { Trophy, Clock, TrendingUp, Activity, Target, Zap } from 'lucide-react'

const DRIVERS = ['VER', 'HAM', 'LEC', 'NOR', 'PER', 'SAI', 'RUS', 'ALO', 'PIA', 'OCO', 'GAS', 'STR', 'BOT', 'ZHO', 'TSU', 'RIC', 'MAG', 'HUL', 'ALB', 'SAR']
const YEARS = [2024, 2023, 2022, 2021]

export default function DriverComparison() {
  const [year, setYear] = useState(2024)
  const [race, setRace] = useState(1)
  const [raceName, setRaceName] = useState('Bahrain Grand Prix')
  const [driver1, setDriver1] = useState('VER')
  const [driver2, setDriver2] = useState('HAM')
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRaces()
  }, [year])

  const loadRaces = async () => {
    try {
      const data = await apiService.getRaces(year)
      setRaces(data)
      if (data.length > 0) {
        setRace(data[0].round)
        setRaceName(data[0].race_name)
      }
    } catch (err) {
      console.error('Failed to load races:', err)
    }
  }

  const handleRaceChange = (roundNumber: number) => {
    setRace(roundNumber)
    const selectedRace = races.find(r => r.round === roundNumber)
    if (selectedRace) {
      setRaceName(selectedRace.race_name)
    }
  }

  const loadComparison = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await apiService.compareDrivers(year, race, driver1, driver2)
      setComparison(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load comparison data')
      console.error('Error loading comparison:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const sign = seconds >= 0 ? '+' : ''
    return `${sign}${seconds.toFixed(3)}s`
  }

  const sectorChartData = comparison ? [
    { sector: 'Sector 1', gap: comparison.sector1_gap, driver1: Math.abs(comparison.sector1_gap) * (comparison.sector1_gap < 0 ? 1 : 0), driver2: Math.abs(comparison.sector1_gap) * (comparison.sector1_gap > 0 ? 1 : 0) },
    { sector: 'Sector 2', gap: comparison.sector2_gap, driver1: Math.abs(comparison.sector2_gap) * (comparison.sector2_gap < 0 ? 1 : 0), driver2: Math.abs(comparison.sector2_gap) * (comparison.sector2_gap > 0 ? 1 : 0) },
    { sector: 'Sector 3', gap: comparison.sector3_gap, driver1: Math.abs(comparison.sector3_gap) * (comparison.sector3_gap < 0 ? 1 : 0), driver2: Math.abs(comparison.sector3_gap) * (comparison.sector3_gap > 0 ? 1 : 0) },
  ] : []

  const radarData = comparison ? [
    { 
      metric: 'Speed', 
      [driver1]: comparison.driver1_faster_laps / 10, 
      [driver2]: comparison.driver2_faster_laps / 10,
      fullMark: 10
    },
    { 
      metric: 'Pace', 
      [driver1]: Math.max(0, 10 - Math.abs(comparison.avg_gap) * 10), 
      [driver2]: Math.max(0, 10 - Math.abs(comparison.avg_gap) * 10),
      fullMark: 10
    },
    { 
      metric: 'Consistency', 
      [driver1]: Math.max(0, 10 - comparison.driver1_consistency * 2), 
      [driver2]: Math.max(0, 10 - comparison.driver2_consistency * 2),
      fullMark: 10
    },
    { 
      metric: 'Fastest Lap', 
      [driver1]: comparison.fastest_lap_gap < 0 ? 10 : 7, 
      [driver2]: comparison.fastest_lap_gap > 0 ? 10 : 7,
      fullMark: 10
    },
  ] : []

  const winner = comparison && comparison.avg_gap < 0 ? driver1 : driver2
  const winnerGap = comparison ? Math.abs(comparison.avg_gap) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Driver Comparison</h1>
        <p className="text-muted-foreground mt-2">
          {raceName} - Head to head performance analysis
        </p>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Select Race & Drivers</CardTitle>
          <CardDescription>
            Choose a race and two drivers to compare their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-md border border-border bg-card text-foreground"
              >
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Race</label>
              <select
                value={race}
                onChange={(e) => handleRaceChange(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-md border border-border bg-card text-foreground"
              >
                {races.map(r => (
                  <option key={r.round} value={r.round}>
                    {r.round}. {r.race_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Driver 1</label>
              <select
                value={driver1}
                onChange={(e) => setDriver1(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-border bg-card text-foreground"
              >
                {DRIVERS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Driver 2</label>
              <select
                value={driver2}
                onChange={(e) => setDriver2(e.target.value)}
                className="w-full px-4 py-2 rounded-md border border-border bg-card text-foreground"
              >
                {DRIVERS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={loadComparison}
            disabled={loading}
            className="mt-4 w-full md:w-auto px-6 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Compare Drivers'}
          </button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {comparison && (
        <>
          {/* Winner Banner */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Race Winner</p>
                  <h2 className="text-3xl font-bold">{winner}</h2>
                  <p className="text-muted-foreground mt-1">
                    Faster by {formatTime(winnerGap)} on average
                  </p>
                </div>
                <Trophy className="h-16 w-16 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Gap</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(comparison.avg_gap)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {driver1} vs {driver2}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fastest Lap Gap</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(comparison.fastest_lap_gap)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Best lap comparison
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faster Laps</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {driver1}: {comparison.driver1_faster_laps}
                </div>
                <p className="text-xs text-muted-foreground">
                  {driver2}: {comparison.driver2_faster_laps}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Battle Stats</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((comparison.driver1_faster_laps / (comparison.driver1_faster_laps + comparison.driver2_faster_laps)) * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {driver1} dominance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sector Comparison Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sector Comparison</CardTitle>
                <CardDescription>
                  Time gap per sector - Negative means {driver1} faster
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sectorChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" />
                    <YAxis label={{ value: 'Gap (seconds)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: any) => `${value.toFixed(3)}s`} />
                    <Legend />
                    <Bar dataKey="gap" fill="#e10600" name="Time Gap" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Radar</CardTitle>
                <CardDescription>
                  Normalized performance metrics (0-10 scale)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} />
                    <Radar name={driver1} dataKey={driver1} stroke="#e10600" fill="#e10600" fillOpacity={0.5} />
                    <Radar name={driver2} dataKey={driver2} stroke="#0090ff" fill="#0090ff" fillOpacity={0.5} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Sector Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Sector-by-Sector Breakdown</CardTitle>
              <CardDescription>
                Detailed time comparison across all three sectors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Sector 1</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{driver1}</span>
                      <span className="font-medium">{formatTime(Math.abs(comparison.sector1_gap))}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {comparison.sector1_gap < 0 ? `${driver1} faster` : `${driver2} faster`}
                    </div>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Sector 2</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{driver1}</span>
                      <span className="font-medium">{formatTime(Math.abs(comparison.sector2_gap))}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {comparison.sector2_gap < 0 ? `${driver1} faster` : `${driver2} faster`}
                    </div>
                  </div>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Sector 3</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{driver1}</span>
                      <span className="font-medium">{formatTime(Math.abs(comparison.sector3_gap))}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {comparison.sector3_gap < 0 ? `${driver1} faster` : `${driver2} faster`}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Head to Head Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Head to Head Summary</CardTitle>
              <CardDescription>
                Overall race performance comparison
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Lap Time</span>
                  <span className="text-sm text-muted-foreground">
                    {comparison.avg_gap < 0 ? `${driver1} by ${formatTime(Math.abs(comparison.avg_gap))}` : `${driver2} by ${formatTime(Math.abs(comparison.avg_gap))}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fastest Single Lap</span>
                  <span className="text-sm text-muted-foreground">
                    {comparison.fastest_lap_gap < 0 ? `${driver1} by ${formatTime(Math.abs(comparison.fastest_lap_gap))}` : `${driver2} by ${formatTime(Math.abs(comparison.fastest_lap_gap))}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Laps Led</span>
                  <span className="text-sm text-muted-foreground">
                    {driver1}: {comparison.driver1_faster_laps} | {driver2}: {comparison.driver2_faster_laps}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Most Consistent</span>
                  <span className="text-sm text-muted-foreground">
                    {comparison.driver1_consistency < comparison.driver2_consistency ? driver1 : driver2} (±{Math.min(comparison.driver1_consistency, comparison.driver2_consistency).toFixed(3)}s)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consistency Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Consistency Analysis</CardTitle>
              <CardDescription>
                Lower standard deviation indicates more consistent lap times
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{driver1}</h3>
                  <p className="text-3xl font-bold">{comparison.driver1_consistency.toFixed(3)}s</p>
                  <p className="text-sm text-muted-foreground mt-1">Standard deviation</p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{driver2}</h3>
                  <p className="text-3xl font-bold">{comparison.driver2_consistency.toFixed(3)}s</p>
                  <p className="text-sm text-muted-foreground mt-1">Standard deviation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading comparison data...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
