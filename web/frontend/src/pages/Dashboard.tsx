import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService, Race } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Trophy, Clock, CheckCircle2 } from 'lucide-react'

export default function Dashboard() {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(2025)

  useEffect(() => {
    loadRaces()
  }, [selectedYear])

  const loadRaces = async () => {
    try {
      setLoading(true)
      const data = await apiService.getRaces(selectedYear)
      setRaces(data)
    } catch (error) {
      console.error('Failed to load races:', error)
    } finally {
      setLoading(false)
    }
  }

  // Split races based on current date
  const today = new Date('2025-12-03') // Current date
  const completedRaces = races.filter(r => {
    const raceDate = new Date(r.date)
    return raceDate < today
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
  
  const upcomingRaces = races.filter(r => {
    const raceDate = new Date(r.date)
    return raceDate >= today
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Soonest first

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">F1 Data Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Analyze telemetry, lap times, and race strategies
        </p>
      </div>

      {/* Year Selector */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium">Season:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2 rounded-md border border-border bg-card text-foreground"
        >
          <option value={2025}>2025 (Current Season)</option>
          <option value={2024}>2024</option>
          <option value={2023}>2023</option>
          <option value={2022}>2022</option>
          <option value={2021}>2021</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Races</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{races.length}</div>
            <p className="text-xs text-muted-foreground">Season {selectedYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedRaces.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedRaces.length > 0 ? `Latest: ${completedRaces[completedRaces.length - 1]?.race_name}` : 'None yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{upcomingRaces.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingRaces.length > 0 ? `Next: ${upcomingRaces[0]?.race_name}` : 'Season completed'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analysis Ready</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">Live</div>
            <p className="text-xs text-muted-foreground">API Connected</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Races */}
      {upcomingRaces.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-6 w-6 text-orange-500" />
            Upcoming Races
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingRaces.map((race) => (
              <Card key={race.round} className="border-orange-500/30 bg-orange-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Round {race.round}</span>
                    <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                      UPCOMING
                    </span>
                  </CardTitle>
                  <CardDescription className="text-lg font-semibold text-foreground">
                    {race.race_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {race.country}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {race.date}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Races */}
      {completedRaces.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Completed Races
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedRaces.map((race) => (
              <Link key={race.round} to={`/race/${selectedYear}/${race.round}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Round {race.round}</span>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardTitle>
                    <CardDescription className="text-lg font-semibold text-foreground">
                      {race.race_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {race.country}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {race.date}
                      </div>
                    </div>
                    <div className="mt-4 text-primary text-sm font-medium">
                      View Analysis →
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading races...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
