# 🔌 API Examples

Complete examples for using the F1 Analytics API.

## Base URL

```
http://localhost:8000
```

---

## 📅 Get Races

### Request
```http
GET /races/2024
```

### Response
```json
[
  {
    "round": 1,
    "race_name": "Bahrain Grand Prix",
    "date": "2024-03-02",
    "country": "Bahrain",
    "location": "Sakhir"
  },
  {
    "round": 2,
    "race_name": "Saudi Arabian Grand Prix",
    "date": "2024-03-09",
    "country": "Saudi Arabia",
    "location": "Jeddah"
  }
]
```

### cURL Example
```bash
curl -X GET "http://localhost:8000/races/2024"
```

### Python Example
```python
import requests

response = requests.get("http://localhost:8000/races/2024")
races = response.json()

for race in races:
    print(f"Round {race['round']}: {race['race_name']}")
```

### JavaScript Example
```javascript
fetch('http://localhost:8000/races/2024')
  .then(response => response.json())
  .then(races => {
    races.forEach(race => {
      console.log(`Round ${race.round}: ${race.race_name}`)
    })
  })
```

---

## 👥 Get Drivers

### Request
```http
GET /drivers/2024/1
```

### Response
```json
{
  "year": 2024,
  "race": 1,
  "race_name": "Bahrain Grand Prix",
  "drivers": [
    {
      "code": "VER",
      "name": "Max Verstappen",
      "number": "1",
      "team": "Red Bull Racing"
    },
    {
      "code": "PER",
      "name": "Sergio Perez",
      "number": "11",
      "team": "Red Bull Racing"
    },
    {
      "code": "HAM",
      "name": "Lewis Hamilton",
      "number": "44",
      "team": "Mercedes"
    }
  ]
}
```

### cURL Example
```bash
curl -X GET "http://localhost:8000/drivers/2024/1"
```

### Python Example
```python
response = requests.get("http://localhost:8000/drivers/2024/1")
data = response.json()

print(f"Race: {data['race_name']}")
print(f"Drivers: {len(data['drivers'])}")

for driver in data['drivers']:
    print(f"{driver['number']} - {driver['name']} ({driver['code']})")
```

---

## 📊 Get Telemetry Comparison

### Request
```http
GET /telemetry/2024/1/VER/HAM
```

### Query Parameters
- `lap1` (optional): Lap number for driver 1 (default: best lap)
- `lap2` (optional): Lap number for driver 2 (default: best lap)

### Response
```json
{
  "year": 2024,
  "race": 1,
  "circuit": "Bahrain International Circuit",
  "driver1": {
    "code": "VER",
    "name": "Max Verstappen",
    "best_lap": 1,
    "lap_time": "1:31.304",
    "lap_time_seconds": 91.304,
    "telemetry": {
      "Distance": [0, 10, 20, 30, ...],
      "Speed": [0, 50, 120, 250, ...],
      "Throttle": [0, 30, 80, 100, ...],
      "Brake": [0, 0, 100, 0, ...],
      "nGear": [1, 2, 3, 4, 5, 6, 7, 8, ...],
      "DRS": [0, 0, 0, 1, 1, 0, ...]
    }
  },
  "driver2": {
    "code": "HAM",
    "name": "Lewis Hamilton",
    "best_lap": 2,
    "lap_time": "1:31.506",
    "lap_time_seconds": 91.506,
    "telemetry": {
      "Distance": [0, 10, 20, 30, ...],
      "Speed": [0, 48, 118, 248, ...],
      "Throttle": [0, 28, 78, 100, ...],
      "Brake": [0, 0, 100, 0, ...],
      "nGear": [1, 2, 3, 4, 5, 6, 7, 8, ...],
      "DRS": [0, 0, 0, 1, 1, 0, ...]
    }
  }
}
```

### cURL Example
```bash
curl -X GET "http://localhost:8000/telemetry/2024/1/VER/HAM?lap1=1&lap2=2"
```

### Python Example
```python
import matplotlib.pyplot as plt

response = requests.get("http://localhost:8000/telemetry/2024/1/VER/HAM")
data = response.json()

# Extract telemetry
ver_telemetry = data['driver1']['telemetry']
ham_telemetry = data['driver2']['telemetry']

# Plot speed comparison
plt.figure(figsize=(12, 6))
plt.plot(ver_telemetry['Distance'], ver_telemetry['Speed'], label='Verstappen')
plt.plot(ham_telemetry['Distance'], ham_telemetry['Speed'], label='Hamilton')
plt.xlabel('Distance (m)')
plt.ylabel('Speed (km/h)')
plt.title(f"{data['circuit']} - Speed Comparison")
plt.legend()
plt.grid(True)
plt.show()
```

### JavaScript Example
```javascript
async function compareTelemetry() {
  const response = await fetch('http://localhost:8000/telemetry/2024/1/VER/HAM')
  const data = await response.json()
  
  console.log(`Circuit: ${data.circuit}`)
  console.log(`VER: ${data.driver1.lap_time}`)
  console.log(`HAM: ${data.driver2.lap_time}`)
  
  // Use with Recharts or Chart.js
  const chartData = data.driver1.telemetry.Distance.map((distance, i) => ({
    distance,
    speedVER: data.driver1.telemetry.Speed[i],
    speedHAM: data.driver2.telemetry.Speed[i]
  }))
  
  return chartData
}
```

---

## 🏁 Get Circuit Layout

### Request
```http
GET /circuit-layout/2024/1
```

### Response
```json
{
  "circuit_name": "Bahrain International Circuit",
  "country": "Bahrain",
  "coordinates": [
    {
      "x": 266.9738,
      "y": -445.2054,
      "distance": 0
    },
    {
      "x": 267.1234,
      "y": -444.8932,
      "distance": 10
    },
    {
      "x": 267.2890,
      "y": -444.5123,
      "distance": 20
    }
  ],
  "total_distance": 5412.0
}
```

### cURL Example
```bash
curl -X GET "http://localhost:8000/circuit-layout/2024/1"
```

### Python Example
```python
import matplotlib.pyplot as plt

response = requests.get("http://localhost:8000/circuit-layout/2024/1")
data = response.json()

coordinates = data['coordinates']
x_coords = [point['x'] for point in coordinates]
y_coords = [point['y'] for point in coordinates]

plt.figure(figsize=(10, 8))
plt.plot(x_coords, y_coords, 'b-', linewidth=2)
plt.title(data['circuit_name'])
plt.xlabel('X Position (m)')
plt.ylabel('Y Position (m)')
plt.axis('equal')
plt.grid(True)
plt.show()
```

### SVG Example
```html
<svg width="800" height="600" viewBox="0 0 800 600">
  <path 
    d="M 266.97 -445.21 L 267.12 -444.89 L 267.29 -444.51 ..."
    stroke="white"
    stroke-width="3"
    fill="none"
  />
</svg>
```

---

## ⏱️ Get Lap Times

### Request
```http
GET /laps/2024/1/VER
```

### Response
```json
{
  "driver": {
    "code": "VER",
    "name": "Max Verstappen",
    "number": "1"
  },
  "race": "Bahrain Grand Prix",
  "year": 2024,
  "laps": [
    {
      "lap_number": 1,
      "lap_time": "1:35.123",
      "lap_time_seconds": 95.123,
      "sector1": "28.456",
      "sector2": "35.789",
      "sector3": "30.878",
      "compound": "SOFT",
      "tyre_life": 1,
      "is_personal_best": false,
      "track_status": "1"
    },
    {
      "lap_number": 2,
      "lap_time": "1:31.304",
      "lap_time_seconds": 91.304,
      "sector1": "27.123",
      "sector2": "34.567",
      "sector3": "29.614",
      "compound": "SOFT",
      "tyre_life": 2,
      "is_personal_best": true,
      "track_status": "1"
    }
  ],
  "summary": {
    "total_laps": 57,
    "best_lap": 2,
    "best_lap_time": "1:31.304",
    "avg_lap_time": "1:34.567",
    "pit_stops": 2
  }
}
```

### Track Status Codes
- `1` - Green flag / Normal racing
- `2` - Yellow flag / Caution
- `4` - Safety Car
- `5` - Red flag / Stopped
- `6` - Virtual Safety Car
- `7` - VSC ending

### cURL Example
```bash
curl -X GET "http://localhost:8000/laps/2024/1/VER"
```

### Python Example
```python
import pandas as pd

response = requests.get("http://localhost:8000/laps/2024/1/VER")
data = response.json()

# Create DataFrame
df = pd.DataFrame(data['laps'])

# Analysis
print(f"Driver: {data['driver']['name']}")
print(f"Best lap: {data['summary']['best_lap_time']}")
print(f"Average: {data['summary']['avg_lap_time']}")

# Find pit stops (large lap time jumps)
df['lap_diff'] = df['lap_time_seconds'].diff()
pit_laps = df[df['lap_diff'] > 30]
print(f"\nPit stops on laps: {pit_laps['lap_number'].tolist()}")

# Plot lap times
df['lap_time_seconds'].plot(figsize=(12, 6), marker='o')
plt.title(f"{data['driver']['name']} - Lap Times")
plt.xlabel('Lap Number')
plt.ylabel('Lap Time (seconds)')
plt.grid(True)
plt.show()
```

---

## 🔍 Advanced Examples

### Compare Multiple Drivers
```python
def compare_drivers(year, race, drivers):
    results = {}
    
    for driver in drivers:
        response = requests.get(f"http://localhost:8000/laps/{year}/{race}/{driver}")
        data = response.json()
        results[driver] = {
            'name': data['driver']['name'],
            'best_lap': data['summary']['best_lap_time'],
            'avg_lap': data['summary']['avg_lap_time']
        }
    
    return results

# Usage
drivers = ['VER', 'HAM', 'LEC', 'SAI']
comparison = compare_drivers(2024, 1, drivers)

for driver, stats in comparison.items():
    print(f"{stats['name']}: Best={stats['best_lap']}, Avg={stats['avg_lap']}")
```

### Telemetry Analysis
```python
def analyze_telemetry(year, race, driver1, driver2):
    response = requests.get(f"http://localhost:8000/telemetry/{year}/{race}/{driver1}/{driver2}")
    data = response.json()
    
    tel1 = data['driver1']['telemetry']
    tel2 = data['driver2']['telemetry']
    
    # Calculate average speeds
    avg_speed_1 = sum(tel1['Speed']) / len(tel1['Speed'])
    avg_speed_2 = sum(tel2['Speed']) / len(tel2['Speed'])
    
    # Calculate max speeds
    max_speed_1 = max(tel1['Speed'])
    max_speed_2 = max(tel2['Speed'])
    
    # Calculate throttle usage
    avg_throttle_1 = sum(tel1['Throttle']) / len(tel1['Throttle'])
    avg_throttle_2 = sum(tel2['Throttle']) / len(tel2['Throttle'])
    
    return {
        'driver1': {
            'name': data['driver1']['name'],
            'avg_speed': avg_speed_1,
            'max_speed': max_speed_1,
            'avg_throttle': avg_throttle_1
        },
        'driver2': {
            'name': data['driver2']['name'],
            'avg_speed': avg_speed_2,
            'max_speed': max_speed_2,
            'avg_throttle': avg_throttle_2
        }
    }

# Usage
analysis = analyze_telemetry(2024, 1, 'VER', 'HAM')
print(analysis)
```

### React Hook Example
```typescript
import { useState, useEffect } from 'react'

interface TelemetryData {
  driver1: {
    name: string
    lap_time: string
    telemetry: {
      Distance: number[]
      Speed: number[]
    }
  }
  driver2: {
    name: string
    lap_time: string
    telemetry: {
      Distance: number[]
      Speed: number[]
    }
  }
}

export function useTelemetry(year: number, race: number, driver1: string, driver2: string) {
  const [data, setData] = useState<TelemetryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!driver1 || !driver2) return
    
    setLoading(true)
    setError(null)
    
    fetch(`http://localhost:8000/telemetry/${year}/${race}/${driver1}/${driver2}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [year, race, driver1, driver2])
  
  return { data, loading, error }
}

// Usage in component
function TelemetryChart() {
  const { data, loading, error } = useTelemetry(2024, 1, 'VER', 'HAM')
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No data</div>
  
  return (
    <div>
      <h2>Speed Comparison</h2>
      {/* Render chart with data */}
    </div>
  )
}
```

---

## 🚀 Rate Limiting

Currently, there is no rate limiting on the API. 

**Recommended limits for production:**
- 100 requests per minute per IP
- 1000 requests per hour per IP

---

## 🔒 Authentication

Currently, the API is open and doesn't require authentication.

**For production:**
```python
# Add API key header
headers = {
    'X-API-Key': 'your-api-key-here'
}

response = requests.get('http://localhost:8000/races/2024', headers=headers)
```

---

## 📝 Error Handling

### Error Response Format
```json
{
  "detail": "Error message here",
  "status_code": 500
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (race/driver not found)
- `500` - Internal Server Error

### Example Error Handling
```python
try:
    response = requests.get('http://localhost:8000/telemetry/2024/1/VER/INVALID')
    response.raise_for_status()
    data = response.json()
except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e}")
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
```

---

## 🌐 CORS

CORS is enabled for all origins in development.

**Production CORS config:**
```python
origins = [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
]
```

---

## 📞 Support

Need help? 
- Open an issue on GitHub
- Check the [API Documentation](http://localhost:8000/docs)
- Read the [Development Guide](docs/DEVELOPMENT.md)

---

<div align="center">

**Happy Coding! 🏎️**

[⬆ Back to Top](#-api-examples)

</div>
