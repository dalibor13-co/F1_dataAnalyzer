import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService, type DriverLaps, type PaceAnalysis, type Race, type SafetyCarData } from '@/services/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, ZAxis, ComposedChart, ReferenceLine } from 'recharts'
import { Clock, Gauge, TrendingDown, Zap, Activity, Target, Award, Filter, AlertTriangle } from 'lucide-react'

const DRIVERS = [
  { code: 'VER', name: 'Max Verstappen' },
  { code: 'HAM', name: 'Lewis Hamilton' },
  { code: 'LEC', name: 'Charles Leclerc' },
  { code: 'NOR', name: 'Lando Norris' },
  { code: 'PER', name: 'Sergio Perez' },
  { code: 'SAI', name: 'Carlos Sainz' },
  { code: 'RUS', name: 'George Russell' },
  { code: 'ALO', name: 'Fernando Alonso' },
  { code: 'PIA', name: 'Oscar Piastri' },
  { code: 'OCO', name: 'Esteban Ocon' },
  { code: 'GAS', name: 'Pierre Gasly' },
  { code: 'STR', name: 'Lance Stroll' },
  { code: 'BOT', name: 'Valtteri Bottas' },
  { code: 'ZHO', name: 'Zhou Guanyu' },
  { code: 'TSU', name: 'Yuki Tsunoda' },
  { code: 'RIC', name: 'Daniel Ricciardo' },
  { code: 'MAG', name: 'Kevin Magnussen' },
  { code: 'HUL', name: 'Nico Hulkenberg' },
  { code: 'ALB', name: 'Alexander Albon' },
  { code: 'SAR', name: 'Logan Sargeant' },
  { code: 'LAW', name: 'Liam Lawson' },
  { code: 'BEA', name: 'Oliver Bearman' },
]

export default function RaceAnalysis() {
  const { year, round } = useParams<{ year: string; round: string }>()
  const [selectedDriver, setSelectedDriver] = useState('VER')
  const [driverLaps, setDriverLaps] = useState<DriverLaps | null>(null)
  const [paceAnalysis, setPaceAnalysis] = useState<PaceAnalysis | null>(null)
  const [races, setRaces] = useState<Race[]>([])
  const [raceName, setRaceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lapFilter, setLapFilter] = useState<'all' | 'fastest' | 'average'>('all')
  const [safetyCarData, setSafetyCarData] = useState<SafetyCarData | null>(null)

  useEffect(() => {
    if (year) {
      loadRaces()
    }
  }, [year])

  useEffect(() => {
    if (year && round && selectedDriver) {
      loadDriverData()
    }
  }, [year, round, selectedDriver])

  useEffect(() => {
    if (year && round) {
      loadSafetyCarData()
    }
  }, [year, round])

  const loadRaces = async () => {
    if (!year) return
    try {
      const data = await apiService.getRaces(Number(year))
      setRaces(data)
      const currentRace = data.find(r => r.round === Number(round))
      if (currentRace) {
        setRaceName(currentRace.race_name)
      }
    } catch (err) {
      console.error('Failed to load races:', err)
    }
  }

  const loadDriverData = async () => {
    if (!year || !round) return
    
    setLoading(true)
    setError(null)
    
    try {
      const [lapsData, paceData] = await Promise.all([
        apiService.getDriverLaps(Number(year), Number(round), selectedDriver),
        apiService.getPaceAnalysis(Number(year), Number(round), selectedDriver)
      ])
      
      setDriverLaps(lapsData)
      setPaceAnalysis(paceData)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data. Try another driver or race.')
      console.error('Error loading race data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSafetyCarData = async () => {
    if (!year || !round) return
    
    try {
      const scData = await apiService.getSafetyCarPeriods(Number(year), Number(round))
      setSafetyCarData(scData)
    } catch (err: any) {
      console.error('Failed to load Safety Car data:', err)
      // Don't show error to user, just log it
    }
  }

  const formatTime = (seconds: number | null) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(3)
    return `${mins}:${secs.padStart(6, '0')}`
  }

  const chartData = driverLaps?.laps.map(lap => ({
    lap: lap.lap_number,
    time: lap.time,
    compound: lap.compound
  })) || []

  // Detect pit stops (when compound changes)
  const pitStops: number[] = []
  for (let i = 1; i < chartData.length; i++) {
    if (chartData[i].compound !== chartData[i - 1].compound) {
      pitStops.push(chartData[i].lap)
    }
  }

  // Tyre compound colors
  const compoundColors: Record<string, string> = {
    'SOFT': '#ff0000',
    'MEDIUM': '#ffd700',
    'HARD': '#ffffff',
    'INTERMEDIATE': '#00ff00',
    'WET': '#0000ff',
  }

  // Group data by compound for coloring - create continuous segments
  const stints: Array<{ compound: string; data: typeof chartData; startLap: number; endLap: number }> = []
  let currentCompound = chartData[0]?.compound
  let stintData: typeof chartData = []
  
  chartData.forEach((lap, index) => {
    if (lap.compound !== currentCompound && stintData.length > 0) {
      stints.push({
        compound: currentCompound,
        data: stintData,
        startLap: stintData[0].lap,
        endLap: stintData[stintData.length - 1].lap
      })
      stintData = [lap]
      currentCompound = lap.compound
    } else {
      stintData.push(lap)
    }
    
    // Last stint
    if (index === chartData.length - 1 && stintData.length > 0) {
      stints.push({
        compound: currentCompound,
        data: stintData,
        startLap: stintData[0].lap,
        endLap: stintData[stintData.length - 1].lap
      })
    }
  })

  // Filter laps based on selection
  const filteredChartData = chartData.filter(lap => {
    if (lapFilter === 'all') return true
    const times = chartData.map(l => l.time)
    const fastest = Math.min(...times)
    const average = times.reduce((a, b) => a + b, 0) / times.length
    
    if (lapFilter === 'fastest') {
      return lap.time <= fastest * 1.03 // within 3% of fastest
    }
    if (lapFilter === 'average') {
      return Math.abs(lap.time - average) <= average * 0.02 // within 2% of average
    }
    return true
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          {raceName || 'Race Analysis'} - {year}
        </h1>
        <p className="text-muted-foreground mt-2">
          {driverLaps?.race || 'Detailed telemetry and lap time analysis'}
        </p>
      </div>

      {/* Driver Selector */}
      <div className="flex items-center space-x-4 flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Driver:</label>
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="px-4 py-2 rounded-md border border-border bg-card text-foreground w-64"
          >
            {DRIVERS.map(driver => (
              <option key={driver.code} value={driver.code}>
                {driver.name}
              </option>
            ))}
          </select>
          <button
            onClick={loadDriverData}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load Data'}
          </button>
        </div>

        {/* Lap Filter */}
        {chartData.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
            <button
              onClick={() => setLapFilter('all')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                lapFilter === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              All ({chartData.length})
            </button>
            <button
              onClick={() => setLapFilter('fastest')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                lapFilter === 'fastest' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Zap className="inline h-3 w-3 mr-1" />
              Fastest
            </button>
            <button
              onClick={() => setLapFilter('average')}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                lapFilter === 'average' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Activity className="inline h-3 w-3 mr-1" />
              Average
            </button>
            {lapFilter !== 'all' && (
              <span className="text-sm text-muted-foreground">
                ({filteredChartData.length} laps)
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Pace Statistics */}
      {paceAnalysis && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fastest Lap</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(paceAnalysis.pace.fastest_lap)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Best lap time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Pace</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(paceAnalysis.pace.mean_pace)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Median: {formatTime(paceAnalysis.pace.median_pace)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consistency</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(paceAnalysis.pace.consistency * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Lower is better
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lap Range</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(paceAnalysis.pace.slowest_lap - paceAnalysis.pace.fastest_lap).toFixed(2)}s
                </div>
                <p className="text-xs text-muted-foreground">
                  Best to worst delta
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pit Stop & Tyre Strategy Overview */}
          {pitStops.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>🔧 Pit Stop Strategy</CardTitle>
                <CardDescription>
                  Tyre changes and stint information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Pit Stops:</span>
                    <span className="text-lg font-bold">{pitStops.length}</span>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Pit Stop Laps:</p>
                    <div className="flex flex-wrap gap-2">
                      {pitStops.map((lap) => (
                        <span key={lap} className="px-3 py-1 bg-orange-500/20 text-orange-500 rounded-md text-sm font-medium">
                          Lap {lap}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-2">Tyre Compounds Used:</p>
                    <div className="flex flex-wrap gap-2">
                      {stints.map((stint, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-md">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-border" 
                            style={{ backgroundColor: compoundColors[stint.compound] || '#e10600' }}
                          />
                          <span className="text-sm font-medium">{stint.compound}</span>
                          <span className="text-xs text-muted-foreground">
                            (Laps {stint.startLap}-{stint.endLap})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Race Incidents Information */}
          {safetyCarData && safetyCarData.safety_car_periods.length > 0 && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Race Incidents
                </CardTitle>
                <CardDescription>
                  Safety Car, VSC and Red Flag periods during the race
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Incidents:</span>
                    <span className="text-lg font-bold">{safetyCarData.safety_car_periods.length}</span>
                  </div>
                  <div className="border-t border-yellow-500/20 pt-3">
                    <p className="text-sm font-medium mb-2">Affected Laps:</p>
                    <div className="flex flex-wrap gap-2">
                      {safetyCarData.safety_car_periods.map((sc, idx) => {
                        const isRedFlag = sc.type === 'Red Flag'
                        const isSC = sc.type === 'Safety Car'
                        const isVSC = sc.type === 'VSC'
                        
                        return (
                          <div 
                            key={`${sc.lap}-${idx}`} 
                            className={`px-3 py-2 border rounded-md ${
                              isRedFlag 
                                ? 'bg-red-500/20 border-red-500/30' 
                                : 'bg-yellow-500/20 border-yellow-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {isRedFlag ? '🚩' : '🚗'}
                              </span>
                              <div>
                                <p className={`text-sm font-bold ${
                                  isRedFlag 
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-yellow-600 dark:text-yellow-400'
                                }`}>
                                  Lap {sc.lap}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {sc.type}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    💡 Yellow markers indicate SC/VSC, red markers indicate Red Flags in the charts
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Lap Times Chart */}
      {driverLaps && driverLaps.laps.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Lap Times - {selectedDriver}</CardTitle>
              <CardDescription>
                Lap-by-lap performance throughout the race
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="lap" 
                    label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Lap Time (s)', angle: -90, position: 'insideLeft' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                            <p className="text-sm font-medium">Lap {data.lap}</p>
                            <p className="text-sm">Time: {formatTime(data.time)}</p>
                            <p className="text-sm flex items-center gap-1">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: compoundColors[data.compound] || '#e10600' }}
                              />
                              {data.compound}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  
                  {/* Pit stop markers */}
                  {pitStops.map((lap) => (
                    <ReferenceLine 
                      key={`pit-${lap}`} 
                      x={lap} 
                      stroke="#ffa500" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{ value: '🔧', position: 'top', fill: '#ffa500', fontSize: 16 }}
                    />
                  ))}
                  
                  {/* Incident markers */}
                  {safetyCarData?.safety_car_periods.map((sc, idx) => {
                    const isRedFlag = sc.type === 'Red Flag'
                    return (
                      <ReferenceLine 
                        key={`incident-${sc.lap}-${idx}`} 
                        x={sc.lap} 
                        stroke={isRedFlag ? '#ff0000' : '#ffff00'} 
                        strokeWidth={3}
                        strokeDasharray="3 3"
                        label={{ 
                          value: isRedFlag ? '🚩' : '🚗', 
                          position: 'top', 
                          fill: isRedFlag ? '#ff0000' : '#ffff00', 
                          fontSize: 16 
                        }}
                      />
                    )
                  })}
                  
                  {/* Main line - gray/neutral */}
                  <Line 
                    type="monotone" 
                    dataKey="time" 
                    stroke="#666"
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props
                      const color = compoundColors[payload.compound] || '#e10600'
                      return (
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={4} 
                          fill={color}
                          stroke={color}
                          strokeWidth={2}
                        />
                      )
                    }}
                    activeDot={{ r: 6 }}
                  />
                  
                  <Legend 
                    content={() => (
                      <div className="flex justify-center gap-4 mt-2">
                        {stints.map((stint, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: compoundColors[stint.compound] || '#e10600' }}
                            />
                            <span className="text-sm">{stint.compound}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lap Time Distribution</CardTitle>
              <CardDescription>
                Consistency analysis across all laps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={filteredChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="lap" 
                    label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="time"
                    label={{ value: 'Lap Time (s)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                            <p className="text-sm font-medium">Lap {data.lap}</p>
                            <p className="text-sm">Time: {formatTime(data.time)}</p>
                            <p className="text-sm flex items-center gap-1">
                              <span 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: compoundColors[data.compound] || '#e10600' }}
                              />
                              {data.compound}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  
                  {/* Pit stop markers */}
                  {pitStops.map((lap) => (
                    <ReferenceLine 
                      key={lap} 
                      x={lap} 
                      stroke="#ffa500" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  ))}
                  
                  {/* Incident markers */}
                  {safetyCarData?.safety_car_periods.map((sc, idx) => {
                    const isRedFlag = sc.type === 'Red Flag'
                    return (
                      <ReferenceLine 
                        key={`incident-scatter-${sc.lap}-${idx}`} 
                        x={sc.lap} 
                        stroke={isRedFlag ? '#ff0000' : '#ffff00'} 
                        strokeWidth={3}
                        strokeDasharray="3 3"
                      />
                    )
                  })}
                  
                  {/* All points with color by compound */}
                  <Scatter 
                    data={filteredChartData}
                    fill="#e10600"
                    shape={(props: any) => {
                      const { cx, cy, payload } = props
                      const color = compoundColors[payload.compound] || '#e10600'
                      return <circle cx={cx} cy={cy} r={4} fill={color} />
                    }}
                  />
                  
                  <Legend 
                    content={() => (
                      <div className="flex justify-center gap-4 mt-2">
                        {stints.map((stint, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: compoundColors[stint.compound] || '#e10600' }}
                            />
                            <span className="text-sm">{stint.compound}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tyre Degradation */}
      {paceAnalysis && paceAnalysis.tyre_degradation.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Tyre Strategy</CardTitle>
              <CardDescription>
                Degradation analysis per compound
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paceAnalysis.tyre_degradation.map((stint, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{stint.Compound}</span>
                      <span className="text-sm text-muted-foreground">
                        {stint.StintLength} laps
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Avg Lap Time</p>
                        <p className="font-medium">{formatTime(stint.AvgLapTime)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Degradation/Lap</p>
                        <p className="font-medium">{stint.DegradationPerLap.toFixed(3)}s</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Compound Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Compound Performance Comparison</CardTitle>
              <CardDescription>
                Average pace and degradation by tyre compound
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paceAnalysis.tyre_degradation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Compound" />
                  <YAxis yAxisId="left" label={{ value: 'Avg Lap Time (s)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Degradation (s/lap)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="AvgLapTime" fill="#e10600" name="Avg Lap Time" />
                  <Bar yAxisId="right" dataKey="DegradationPerLap" fill="#0090ff" name="Degradation/Lap" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Lap Time Histogram */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lap Time Distribution Analysis</CardTitle>
            <CardDescription>
              Frequency of lap times - shows consistency patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={filteredChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="lap" label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Lap Time (s)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value: any) => formatTime(value)} />
                <Legend />
                <Area type="monotone" dataKey="time" fill="#e10600" fillOpacity={0.3} stroke="none" name="Lap Time Range" />
                <Line type="monotone" dataKey="time" stroke="#e10600" strokeWidth={2} dot={false} name="Lap Time" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading race data...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
