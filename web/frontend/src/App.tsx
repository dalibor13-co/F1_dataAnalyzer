import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DriverComparison from './pages/DriverComparison'
import RaceAnalysis from './pages/RaceAnalysis'
import TelemetryAnalysis from './pages/TelemetryAnalysis'
import Layout from './components/Layout'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/comparison" element={<DriverComparison />} />
          <Route path="/telemetry" element={<TelemetryAnalysis />} />
          <Route path="/race/:year/:round" element={<RaceAnalysis />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
