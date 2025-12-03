import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Gauge, Zap, Activity, Flag, Settings, Navigation, Pin, PinOff } from 'lucide-react'

const DRIVERS = [
  { code: 'VER', name: 'Max Verstappen', color: '#1E3A8A' },
  { code: 'HAM', name: 'Lewis Hamilton', color: '#00D2BE' },
  { code: 'LEC', name: 'Charles Leclerc', color: '#DC0000' },
  { code: 'NOR', name: 'Lando Norris', color: '#FF8700' },
  { code: 'PER', name: 'Sergio Perez', color: '#1E3A8A' },
  { code: 'SAI', name: 'Carlos Sainz', color: '#DC0000' },
  { code: 'RUS', name: 'George Russell', color: '#00D2BE' },
  { code: 'ALO', name: 'Fernando Alonso', color: '#006F62' },
  { code: 'PIA', name: 'Oscar Piastri', color: '#FF8700' },
  { code: 'OCO', name: 'Esteban Ocon', color: '#0090FF' },
  { code: 'GAS', name: 'Pierre Gasly', color: '#0090FF' },
  { code: 'STR', name: 'Lance Stroll', color: '#006F62' },
  { code: 'BOT', name: 'Valtteri Bottas', color: '#900000' },
  { code: 'ZHO', name: 'Zhou Guanyu', color: '#900000' },
  { code: 'TSU', name: 'Yuki Tsunoda', color: '#2B4562' },
  { code: 'RIC', name: 'Daniel Ricciardo', color: '#2B4562' },
  { code: 'MAG', name: 'Kevin Magnussen', color: '#FFFFFF' },
  { code: 'HUL', name: 'Nico Hulkenberg', color: '#FFFFFF' },
  { code: 'ALB', name: 'Alexander Albon', color: '#005AFF' },
  { code: 'SAR', name: 'Logan Sargeant', color: '#005AFF' },
]

interface TelemetryData {
  Distance: number[]
  Speed: number[]
  Throttle: number[]
  Brake: number[]
  nGear: number[]
  RPM: number[]
  DRS: number[]
}

interface LapData {
  lap_time: string
  lap_number: number
  compound: string
  telemetry: TelemetryData
}

interface TelemetryComparison {
  driver1: string
  driver2: string
  lap1: LapData
  lap2: LapData
}

interface Race {
  round: number
  race_name: string
  date: string
  country: string
}

interface CircuitLayout {
  x: number[]
  y: number[]
  distance: number[]
}

// Circuit Layout SVG Component
interface CircuitLayoutSVGProps {
  layout: CircuitLayout
  hoveredDistance: number | null
  driver1Color?: string
  driver2Color?: string
  telemetryData?: TelemetryComparison | null
  onDistanceHover?: (distance: number | null) => void
  driver1Name?: string
  driver2Name?: string
  compact?: boolean
}

function CircuitLayoutSVG({ 
  layout, 
  hoveredDistance, 
  driver1Color,
  driver2Color,
  telemetryData,
  onDistanceHover,
  driver1Name,
  driver2Name,
  compact = false
}: CircuitLayoutSVGProps) {
  if (!layout.x || layout.x.length === 0) return null

  // Calculate bounds and scaling
  const xValues = layout.x
  const yValues = layout.y
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)
  
  const width = maxX - minX
  const height = maxY - minY
  
  // SVG viewport dimensions - smaller for compact mode
  const svgWidth = compact ? 300 : 800
  const svgHeight = compact ? 300 : 600
  const padding = compact ? 20 : 40
  
  // Scale to fit viewport
  const scaleX = (svgWidth - 2 * padding) / width
  const scaleY = (svgHeight - 2 * padding) / height
  const scale = Math.min(scaleX, scaleY)
  
  // Center the track
  const offsetX = padding + (svgWidth - 2 * padding - width * scale) / 2
  const offsetY = padding + (svgHeight - 2 * padding - height * scale) / 2
  
  // Transform coordinates
  const transformPoint = (x: number, y: number) => ({
    x: (x - minX) * scale + offsetX,
    y: (y - minY) * scale + offsetY
  })
  
  // Generate SVG path
  const pathData = xValues.map((x, i) => {
    const point = transformPoint(x, yValues[i])
    return `${i === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
  }).join(' ') + ' Z'
  
  // Find current position if hovering
  let currentPoint = null
  if (hoveredDistance !== null) {
    const idx = layout.distance.findIndex(d => d >= hoveredDistance)
    if (idx > 0) {
      currentPoint = transformPoint(xValues[idx], yValues[idx])
    }
  }

  // Get speed data at hovered point
  const getSpeedAtDistance = (distance: number) => {
    if (!telemetryData) return null
    
    const idx1 = telemetryData.lap1.telemetry.Distance.findIndex(d => d >= distance)
    const idx2 = telemetryData.lap2.telemetry.Distance.findIndex(d => d >= distance)
    
    if (idx1 > 0 && idx2 > 0) {
      return {
        speed1: telemetryData.lap1.telemetry.Speed[idx1],
        speed2: telemetryData.lap2.telemetry.Speed[idx2]
      }
    }
    return null
  }

  const speeds = hoveredDistance !== null ? getSpeedAtDistance(hoveredDistance) : null

  // Handle mouse move on track
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Find closest point on track
    let closestIdx = 0
    let closestDist = Infinity
    
    for (let i = 0; i < xValues.length; i++) {
      const point = transformPoint(xValues[i], yValues[i])
      const dist = Math.sqrt(
        Math.pow(point.x - mouseX, 2) + Math.pow(point.y - mouseY, 2)
      )
      if (dist < closestDist) {
        closestDist = dist
        closestIdx = i
      }
    }

    // Only trigger if mouse is close to track (within 30px)
    if (closestDist < 30 && onDistanceHover) {
      onDistanceHover(layout.distance[closestIdx])
    }
  }

  const handleMouseLeave = () => {
    if (onDistanceHover) {
      onDistanceHover(null)
    }
  }

  return (
    <svg 
      width={svgWidth} 
      height={svgHeight} 
      className="mx-auto cursor-crosshair"
      style={{ background: 'var(--muted)' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Track outline */}
      <path
        d={pathData}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-foreground/40"
      />
      
      {/* Current position marker */}
      {currentPoint && (
        <>
          <circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r="8"
            fill="hsl(var(--primary))"
            className="animate-pulse"
          />
          <circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r="12"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="opacity-50"
          />
          
          {/* Speed tooltip */}
          {speeds && (
            <g>
              {/* Tooltip background */}
              <rect
                x={currentPoint.x + 20}
                y={currentPoint.y - 60}
                width="200"
                height="55"
                rx="6"
                fill="hsl(var(--background))"
                stroke="hsl(var(--border))"
                strokeWidth="2"
                opacity="0.95"
              />
              
              {/* Driver 1 speed */}
              <text
                x={currentPoint.x + 30}
                y={currentPoint.y - 35}
                className="text-sm font-bold fill-foreground"
              >
                <tspan fill={driver1Color || 'hsl(var(--primary))'}>{driver1Name || 'Driver 1'}: </tspan>
                <tspan>{speeds.speed1.toFixed(0)} km/h</tspan>
              </text>
              
              {/* Driver 2 speed */}
              <text
                x={currentPoint.x + 30}
                y={currentPoint.y - 15}
                className="text-sm font-bold fill-foreground"
              >
                <tspan fill={driver2Color || 'hsl(var(--secondary))'}>{driver2Name || 'Driver 2'}: </tspan>
                <tspan>{speeds.speed2.toFixed(0)} km/h</tspan>
              </text>
            </g>
          )}
        </>
      )}
      
      {/* Start/Finish line indicator */}
      {xValues.length > 0 && (
        <g>
          <circle
            cx={transformPoint(xValues[0], yValues[0]).x}
            cy={transformPoint(xValues[0], yValues[0]).y}
            r="6"
            fill="hsl(var(--foreground))"
            stroke="white"
            strokeWidth="2"
          />
          <text
            x={transformPoint(xValues[0], yValues[0]).x}
            y={transformPoint(xValues[0], yValues[0]).y - 15}
            textAnchor="middle"
            className="text-xs font-bold fill-foreground"
          >
            START
          </text>
        </g>
      )}
    </svg>
  )
}

export default function TelemetryAnalysis() {
  const [year, setYear] = useState(2025)
  const [selectedRace, setSelectedRace] = useState<number | null>(null)
  const [driver1, setDriver1] = useState('VER')
  const [driver2, setDriver2] = useState('HAM')
  const [races, setRaces] = useState<Race[]>([])
  const [availableDrivers, setAvailableDrivers] = useState<Array<{code: string, name: string, number: string}>>([])
  const [telemetryData, setTelemetryData] = useState<TelemetryComparison | null>(null)
  const [circuitLayout, setCircuitLayout] = useState<CircuitLayout | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredDistance, setHoveredDistance] = useState<number | null>(null)
  const [isLayoutPinned, setIsLayoutPinned] = useState(false)

  // Load races when year changes
  useEffect(() => {
    // Clear old data when year changes
    setTelemetryData(null)
    setCircuitLayout(null)
    setAvailableDrivers([])
    setSelectedRace(null)
    
    async function loadRaces() {
      try {
        const response = await fetch(`http://localhost:8000/races/${year}`)
        if (!response.ok) {
          throw new Error('Failed to load races')
        }
        const data = await response.json()
        setRaces(data)
        // Don't auto-select first race, let user choose
        setSelectedRace(null)
      } catch (err) {
        console.error('Failed to load races:', err)
        setError('Failed to load races')
        setRaces([])
        setSelectedRace(null)
      }
    }
    
    loadRaces()
  }, [year])

  // Load telemetry when race or drivers change
  useEffect(() => {
    if (!selectedRace || !driver1 || !driver2) {
      return
    }
    
    // Prevent loading if drivers are still being loaded
    if (loadingDrivers) {
      return
    }

    async function loadTelemetry() {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(
          `http://localhost:8000/telemetry/${year}/${selectedRace}/${driver1}/${driver2}`
        )
        
        if (!response.ok) {
          throw new Error('Failed to load telemetry data')
        }
        
        const data = await response.json()
        setTelemetryData(data)
      } catch (err) {
        console.error('Error loading telemetry:', err)
        setError(err instanceof Error ? err.message : 'Failed to load telemetry data')
        setTelemetryData(null)
      } finally {
        setLoading(false)
      }
    }
    
    loadTelemetry()
  }, [year, selectedRace, driver1, driver2, loadingDrivers])

  // Load available drivers when race changes
  useEffect(() => {
    if (!selectedRace) return

    async function loadDrivers() {
      setLoadingDrivers(true)
      setTelemetryData(null) // Clear old data
      setCircuitLayout(null)
      
      try {
        const response = await fetch(
          `http://localhost:8000/drivers/${year}/${selectedRace}`
        )
        
        if (!response.ok) {
          console.warn('Drivers not available')
          return
        }
        
        const data = await response.json()
        setAvailableDrivers(data.drivers)
        
        // Set default drivers if current selection is not available
        if (data.drivers.length > 0) {
          const driverCodes = data.drivers.map((d: any) => d.code)
          if (!driverCodes.includes(driver1)) {
            setDriver1(data.drivers[0].code)
          }
          if (!driverCodes.includes(driver2)) {
            setDriver2(data.drivers.length > 1 ? data.drivers[1].code : data.drivers[0].code)
          }
        }
      } catch (err) {
        console.warn('Failed to load drivers:', err)
      } finally {
        setLoadingDrivers(false)
      }
    }
    
    loadDrivers()
  }, [year, selectedRace])

  // Load circuit layout
  useEffect(() => {
    if (!selectedRace) return

    async function loadCircuitLayout() {
      try {
        const response = await fetch(
          `http://localhost:8000/circuit-layout/${year}/${selectedRace}`
        )
        
        if (!response.ok) {
          console.warn('Circuit layout not available')
          return
        }
        
        const data = await response.json()
        setCircuitLayout(data.layout)
      } catch (err) {
        console.warn('Failed to load circuit layout:', err)
      }
    }
    
    loadCircuitLayout()
  }, [year, selectedRace])

  // Prepare chart data
  const prepareSpeedData = () => {
    if (!telemetryData) return []
    
    const data = []
    const len = Math.min(
      telemetryData.lap1.telemetry.Distance.length,
      telemetryData.lap2.telemetry.Distance.length
    )
    
    for (let i = 0; i < len; i++) {
      data.push({
        distance: telemetryData.lap1.telemetry.Distance[i],
        speed1: telemetryData.lap1.telemetry.Speed[i],
        speed2: telemetryData.lap2.telemetry.Speed[i],
        speedDelta: telemetryData.lap1.telemetry.Speed[i] - telemetryData.lap2.telemetry.Speed[i]
      })
    }
    
    return data
  }

  const prepareThrottleBrakeData = () => {
    if (!telemetryData) return []
    
    const data = []
    const len = Math.min(
      telemetryData.lap1.telemetry.Distance.length,
      telemetryData.lap2.telemetry.Distance.length
    )
    
    for (let i = 0; i < len; i++) {
      data.push({
        distance: telemetryData.lap1.telemetry.Distance[i],
        throttle1: telemetryData.lap1.telemetry.Throttle[i],
        brake1: telemetryData.lap1.telemetry.Brake[i] ? -100 : 0,
        throttle2: telemetryData.lap2.telemetry.Throttle[i],
        brake2: telemetryData.lap2.telemetry.Brake[i] ? -100 : 0,
      })
    }
    
    return data
  }

  const prepareGearData = () => {
    if (!telemetryData) return []
    
    const data = []
    const len = telemetryData.lap1.telemetry.Distance.length
    
    for (let i = 0; i < len; i++) {
      data.push({
        distance: telemetryData.lap1.telemetry.Distance[i],
        gear1: telemetryData.lap1.telemetry.nGear[i],
        gear2: telemetryData.lap2.telemetry.nGear[i],
      })
    }
    
    return data
  }

  const prepareRPMData = () => {
    if (!telemetryData) return []
    
    const data = []
    const len = telemetryData.lap1.telemetry.Distance.length
    
    for (let i = 0; i < len; i++) {
      data.push({
        distance: telemetryData.lap1.telemetry.Distance[i],
        rpm1: telemetryData.lap1.telemetry.RPM[i],
        rpm2: telemetryData.lap2.telemetry.RPM[i],
      })
    }
    
    return data
  }

  const driver1Info = DRIVERS.find(d => d.code === driver1)
  const driver2Info = DRIVERS.find(d => d.code === driver2)
  const selectedRaceInfo = races.find(r => r.round === selectedRace)

  // Format lap time to remove "0 days"
  const formatLapTime = (lapTime: string) => {
    return lapTime.replace('0 days ', '')
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Telemetry Analysis</h1>
        <p className="text-muted-foreground mt-2">
          Deep dive into telemetry data - compare two drivers lap by lap
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Select Comparison</CardTitle>
          <CardDescription>Choose year, race, and two drivers to compare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Year selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                disabled={loading || loadingDrivers}
              >
                {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Race selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">Race</label>
              <select
                value={selectedRace || ''}
                onChange={(e) => setSelectedRace(Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                disabled={loading || loadingDrivers}
              >
                <option value="">Select a race</option>
                {races.filter(race => !race.race_name.toLowerCase().includes('pre-season')).map((race) => (
                  <option key={race.round} value={race.round}>
                    {race.race_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver 1 selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Driver 1 {loadingDrivers && <span className="text-xs text-muted-foreground">(loading...)</span>}
              </label>
              <select
                value={driver1}
                onChange={(e) => setDriver1(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                disabled={availableDrivers.length === 0 || loading || loadingDrivers}
              >
                {availableDrivers.length > 0 ? (
                  availableDrivers.map((driver) => (
                    <option key={driver.code} value={driver.code}>
                      {driver.name}
                    </option>
                  ))
                ) : (
                  <option value="">Select a race first</option>
                )}
              </select>
            </div>

            {/* Driver 2 selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Driver 2 {loadingDrivers && <span className="text-xs text-muted-foreground">(loading...)</span>}
              </label>
              <select
                value={driver2}
                onChange={(e) => setDriver2(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md"
                disabled={availableDrivers.length === 0 || loading || loadingDrivers}
              >
                {availableDrivers.length > 0 ? (
                  availableDrivers.map((driver) => (
                    <option key={driver.code} value={driver.code}>
                      {driver.name}
                    </option>
                  ))
                ) : (
                  <option value="">Select a race first</option>
                )}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span>Loading telemetry data... This may take a moment.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !telemetryData && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a race and drivers to view telemetry analysis</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <div className="text-center text-red-500">{error}</div>
          </CardContent>
        </Card>
      )}

      {telemetryData && !loading && (
        <>
          {/* Lap Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-l-4" style={{ borderLeftColor: driver1Info?.color }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  {driver1Info?.name}
                </CardTitle>
                <CardDescription>
                  {selectedRaceInfo?.race_name} - Lap {telemetryData.lap1.lap_number}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Lap Time</span>
                    <span className="font-mono font-bold">{formatLapTime(telemetryData.lap1.lap_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Compound</span>
                    <span className="font-medium">{telemetryData.lap1.compound}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4" style={{ borderLeftColor: driver2Info?.color }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  {driver2Info?.name}
                </CardTitle>
                <CardDescription>
                  {selectedRaceInfo?.race_name} - Lap {telemetryData.lap2.lap_number}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Lap Time</span>
                    <span className="font-mono font-bold">{formatLapTime(telemetryData.lap2.lap_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Compound</span>
                    <span className="font-medium">{telemetryData.lap2.compound}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content area with sticky sidebar */}
          <div className={isLayoutPinned ? "flex gap-4" : ""}>
            {/* Pinned Circuit Layout Sidebar */}
            {isLayoutPinned && circuitLayout && (
              <div className="w-80 flex-shrink-0">
                <Card className="sticky top-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Navigation className="h-4 w-4" />
                      Circuit
                      {hoveredDistance !== null && (
                        <span className="ml-auto text-primary font-mono text-sm">
                          {hoveredDistance.toFixed(0)}m
                        </span>
                      )}
                      <button
                        onClick={() => setIsLayoutPinned(false)}
                        className="ml-auto p-1 hover:bg-secondary rounded"
                        title="Unpin layout"
                      >
                        <PinOff className="h-4 w-4" />
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CircuitLayoutSVG 
                      layout={circuitLayout} 
                      hoveredDistance={hoveredDistance}
                      driver1Color={driver1Info?.color}
                      driver2Color={driver2Info?.color}
                      telemetryData={telemetryData}
                      onDistanceHover={setHoveredDistance}
                      driver1Name={driver1Info?.name}
                      driver2Name={driver2Info?.name}
                      compact={true}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main charts area */}
            <div className="flex-1 space-y-4">
              {/* Circuit Layout - Full width when not pinned */}
              {!isLayoutPinned && circuitLayout && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Navigation className="h-5 w-5" />
                      Circuit Layout
                      <button
                        onClick={() => setIsLayoutPinned(true)}
                        className="ml-2 p-1 hover:bg-secondary rounded"
                        title="Pin layout to sidebar"
                      >
                        <Pin className="h-4 w-4" />
                      </button>
                      {hoveredDistance !== null && (
                        <span className="ml-auto text-primary font-mono">
                          {hoveredDistance.toFixed(0)}m
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CircuitLayoutSVG 
                      layout={circuitLayout} 
                      hoveredDistance={hoveredDistance}
                      driver1Color={driver1Info?.color}
                      driver2Color={driver2Info?.color}
                      telemetryData={telemetryData}
                      onDistanceHover={setHoveredDistance}
                      driver1Name={driver1Info?.name}
                      driver2Name={driver2Info?.name}
                    />
                  </CardContent>
                </Card>
              )}

          {/* Speed Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Speed Comparison
              </CardTitle>
              <CardDescription>Speed (km/h) throughout the lap</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart 
                  data={prepareSpeedData()}
                  onMouseMove={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setHoveredDistance(e.activePayload[0].payload.distance)
                    }
                  }}
                  onMouseLeave={() => setHoveredDistance(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="distance" 
                    label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                    className="text-xs"
                  />
                  <YAxis 
                    label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }}
                    className="text-xs"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="speed1" 
                    stroke={driver1Info?.color} 
                    name={driver1Info?.name}
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="speed2" 
                    stroke={driver2Info?.color} 
                    name={driver2Info?.name}
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Speed Delta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Speed Delta
              </CardTitle>
              <CardDescription>
                Difference in speed: {driver1Info?.name} vs {driver2Info?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart 
                  data={prepareSpeedData()}
                  onMouseMove={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setHoveredDistance(e.activePayload[0].payload.distance)
                    }
                  }}
                  onMouseLeave={() => setHoveredDistance(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="distance" 
                    label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                    className="text-xs"
                  />
                  <YAxis 
                    label={{ value: 'Speed Δ (km/h)', angle: -90, position: 'insideLeft' }}
                    className="text-xs"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="speedDelta" 
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.6}
                    name="Speed Delta"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Throttle & Brake */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Throttle & Brake Input
              </CardTitle>
              <CardDescription>Driver inputs throughout the lap (Throttle: positive, Brake: negative)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart 
                  data={prepareThrottleBrakeData()}
                  onMouseMove={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setHoveredDistance(e.activePayload[0].payload.distance)
                    }
                  }}
                  onMouseLeave={() => setHoveredDistance(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="distance" 
                    label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                    className="text-xs" 
                  />
                  <YAxis 
                    label={{ value: 'Input %', angle: -90, position: 'insideLeft' }}
                    domain={[-100, 100]}
                    className="text-xs" 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  {/* Driver 1 */}
                  <Line 
                    type="monotone" 
                    dataKey="throttle1" 
                    stroke={driver1Info?.color || '#10b981'} 
                    strokeWidth={2}
                    dot={false}
                    name={`${driver1Info?.name} Throttle`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="brake1" 
                    stroke={driver1Info?.color || '#ef4444'} 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name={`${driver1Info?.name} Brake`}
                  />
                  {/* Driver 2 */}
                  <Line 
                    type="monotone" 
                    dataKey="throttle2" 
                    stroke={driver2Info?.color || '#3b82f6'} 
                    strokeWidth={2}
                    dot={false}
                    name={`${driver2Info?.name} Throttle`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="brake2" 
                    stroke={driver2Info?.color || '#f59e0b'} 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name={`${driver2Info?.name} Brake`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gear Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Gear Selection
              </CardTitle>
              <CardDescription>Gear usage throughout the lap</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart 
                  data={prepareGearData()}
                  onMouseMove={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setHoveredDistance(e.activePayload[0].payload.distance)
                    }
                  }}
                  onMouseLeave={() => setHoveredDistance(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="distance" 
                    label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                    className="text-xs"
                  />
                  <YAxis 
                    label={{ value: 'Gear', angle: -90, position: 'insideLeft' }}
                    className="text-xs"
                    domain={[0, 8]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  <Line 
                    type="stepAfter" 
                    dataKey="gear1" 
                    stroke={driver1Info?.color} 
                    name={driver1Info?.name}
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="gear2" 
                    stroke={driver2Info?.color} 
                    name={driver2Info?.name}
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* RPM */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Engine RPM
              </CardTitle>
              <CardDescription>Engine revolutions per minute</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart 
                  data={prepareRPMData()}
                  onMouseMove={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0]) {
                      setHoveredDistance(e.activePayload[0].payload.distance)
                    }
                  }}
                  onMouseLeave={() => setHoveredDistance(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="distance" 
                    label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                    className="text-xs"
                  />
                  <YAxis 
                    label={{ value: 'RPM', angle: -90, position: 'insideLeft' }}
                    className="text-xs"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="rpm1" 
                    stroke={driver1Info?.color} 
                    name={driver1Info?.name}
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rpm2" 
                    stroke={driver2Info?.color} 
                    name={driver2Info?.name}
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
