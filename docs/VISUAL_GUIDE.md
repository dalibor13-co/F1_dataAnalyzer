# 🎨 Visual Project Guide

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                     http://localhost:3000                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND (Vite)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Dashboard   │  │  Telemetry   │  │    Lap       │         │
│  │    Page      │  │   Analysis   │  │  Analysis    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Components: Recharts + shadcn/ui + TailwindCSS                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Fetch API calls
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FASTAPI BACKEND                                │
│                http://localhost:8000                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  API Endpoints (main.py)                               │   │
│  │  • /races/{year}                                       │   │
│  │  • /drivers/{year}/{race}                             │   │
│  │  • /telemetry/{year}/{race}/{d1}/{d2}                │   │
│  │  • /circuit-layout/{year}/{race}                      │   │
│  │  • /laps/{year}/{race}/{driver}                       │   │
│  └────────────────────────────────────────────────────────┘   │
│                         │                                       │
│                         ▼                                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Session Cache (In-Memory Dict)                        │   │
│  │  Key: "{year}_{race}_{session}"                        │   │
│  │  Value: FastF1 Session Object                          │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Data Loading
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FASTF1 LIBRARY                              │
│                                                                  │
│  ┌────────────────┐         ┌─────────────────┐               │
│  │   Ergast API   │────────▶│  F1 Live API    │               │
│  │  (Race Info)   │         │  (Telemetry)    │               │
│  └────────────────┘         └─────────────────┘               │
│                                     │                            │
│                                     ▼                            │
│                         ┌────────────────────┐                  │
│                         │  Local File Cache  │                  │
│                         │   data/cache/      │                  │
│                         └────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌──────────┐
│  User    │
│  Action  │
└────┬─────┘
     │
     │ 1. Select Year/Race/Drivers
     ▼
┌─────────────────┐
│  React State    │
│  Management     │
└────┬────────────┘
     │
     │ 2. useEffect triggered
     ▼
┌─────────────────┐
│  fetch() API    │
│  Request        │
└────┬────────────┘
     │
     │ 3. HTTP GET /telemetry/2024/1/VER/HAM
     ▼
┌─────────────────────────┐
│  FastAPI Endpoint       │
│  get_cached_session()   │
└────┬────────────────────┘
     │
     ├─────────┬──────────┐
     │         │          │
     │ Cache   │ Cache    │
     │ HIT ✓   │ MISS ✗   │
     │         │          │
     ▼         ▼          ▼
┌─────────┐  ┌────────────────┐
│ Return  │  │  FastF1 Load   │
│ Cached  │  │  (10-30s)      │
│ (<100ms)│  │  + Cache       │
└────┬────┘  └────┬───────────┘
     │            │
     └────────┬───┘
              │
              │ 4. JSON Response
              ▼
     ┌──────────────────┐
     │  React State     │
     │  Update          │
     └────┬─────────────┘
          │
          │ 5. Re-render
          ▼
     ┌──────────────────┐
     │  Recharts        │
     │  Visualization   │
     └──────────────────┘
```

---

## 🎯 Feature Map

```
F1 ANALYTICS PLATFORM
│
├── 🏠 Dashboard
│   ├── Race Overview
│   ├── Quick Stats
│   └── Recent Races
│
├── 📊 Telemetry Analysis ⭐
│   ├── Year Selector (2018-2025)
│   ├── Race Selector
│   ├── Driver Selectors (Dynamic)
│   ├── Best Lap Selection
│   │
│   ├── 📈 Charts (6 types)
│   │   ├── Speed Comparison
│   │   ├── Throttle/Brake Combined
│   │   ├── Gear Shifts
│   │   ├── DRS Zones
│   │   ├── Distance Delta
│   │   └── Lap Time Difference
│   │
│   └── 🗺️ Circuit Layout
│       ├── Real GPS Coordinates
│       ├── Interactive Hover
│       ├── Speed at Position
│       └── Pinnable Sidebar
│
├── ⏱️ Lap Analysis
│   ├── All Laps for Driver
│   ├── Sector Times
│   ├── Tire Compounds
│   └── Pace Analysis
│
└── 📈 Analytics
    ├── Race Strategy
    ├── Tire Degradation
    └── Historical Trends
```

---

## 🔄 Component Interaction

```
TelemetryAnalysis.tsx (Main Component)
│
├── State Management
│   ├── year, setYear
│   ├── selectedRace, setSelectedRace
│   ├── driver1, driver2
│   ├── availableDrivers
│   ├── telemetryData
│   ├── circuitLayout
│   ├── loading, loadingDrivers
│   └── error
│
├── useEffect Hooks (4 effects)
│   │
│   ├── [year] → Load races + Clear data
│   │   └── fetch(`/races/${year}`)
│   │
│   ├── [year, selectedRace] → Load drivers
│   │   └── fetch(`/drivers/${year}/${race}`)
│   │
│   ├── [year, race, driver1, driver2] → Load telemetry
│   │   └── fetch(`/telemetry/...`)
│   │
│   └── [telemetryData] → Load circuit
│       └── fetch(`/circuit-layout/...`)
│
└── Render Tree
    ├── <Card> Controls
    │   ├── <select> Year
    │   ├── <select> Race
    │   ├── <select> Driver 1
    │   ├── <select> Driver 2
    │   └── <select> Lap Numbers
    │
    ├── <div> Loading Indicator
    │   └── Spinner + Message
    │
    ├── <Card> Error Display
    │   └── Alert Message
    │
    ├── <div> Placeholder
    │   └── Flag Icon + "Select race..."
    │
    ├── <div> Circuit Layout (if pinned)
    │   └── <svg> Interactive Circuit
    │       ├── <path> Track Shape
    │       ├── <circle> Hover Point
    │       └── Tooltip (Speed)
    │
    └── <div> Charts Grid
        ├── <Card> Speed Chart
        │   └── <LineChart> (Recharts)
        │
        ├── <Card> Throttle/Brake Chart
        │   └── <AreaChart> (Recharts)
        │
        ├── <Card> Gear Chart
        │   └── <ScatterChart> (Recharts)
        │
        ├── <Card> DRS Chart
        │   └── <BarChart> (Recharts)
        │
        ├── <Card> Delta Chart
        │   └── <LineChart> (Recharts)
        │
        └── <Card> Lap Time Chart
            └── <BarChart> (Recharts)
```

---

## 🎨 UI Component Hierarchy

```
App.tsx
│
├── BrowserRouter
│   │
│   ├── Navbar (Always visible)
│   │   ├── Logo
│   │   └── Navigation Links
│   │       ├── Dashboard
│   │       ├── Telemetry
│   │       ├── Lap Analysis
│   │       └── Analytics
│   │
│   └── Routes
│       │
│       ├── / → Dashboard.tsx
│       │   └── Grid of Cards
│       │       ├── Race Info Card
│       │       ├── Stats Card
│       │       └── Recent Races Card
│       │
│       ├── /telemetry → TelemetryAnalysis.tsx
│       │   ├── Controls Card
│       │   ├── Circuit Layout (optional pinned)
│       │   └── Charts Grid
│       │       └── 6x Chart Cards
│       │
│       ├── /lap-analysis → LapAnalysis.tsx
│       │   ├── Driver Selector
│       │   └── Lap Times Table
│       │
│       └── /analytics → Analytics.tsx
│           └── Advanced Analytics
```

---

## 🚀 Request Lifecycle

```
User Action: "Compare VER vs HAM at Bahrain 2024"

Step 1: User Selects Year (2024)
    ↓
    React: setYear(2024)
    ↓
    useEffect: [year]
    ↓
    Clear: telemetryData, circuitLayout, drivers, race
    ↓
    Fetch: GET /races/2024
    ↓
    Backend: Returns list of 2024 races
    ↓
    React: setRaces([...])

Step 2: User Selects Race (Bahrain)
    ↓
    React: setSelectedRace(1)
    ↓
    useEffect: [year, selectedRace]
    ↓
    setLoadingDrivers(true)
    ↓
    Fetch: GET /drivers/2024/1
    ↓
    Backend: get_cached_session(2024, 1, "R")
        ├─ Cache Miss → FastF1.load_session()
        └─ Extract unique drivers
    ↓
    React: setAvailableDrivers([VER, HAM, ...])
    ↓
    setLoadingDrivers(false)

Step 3: User Selects Drivers (VER, HAM)
    ↓
    React: setDriver1("VER"), setDriver2("HAM")
    ↓
    useEffect: [year, race, driver1, driver2]
    ↓
    if (!loadingDrivers) {
        setLoading(true)
        ↓
        Fetch: GET /telemetry/2024/1/VER/HAM
        ↓
        Backend: get_cached_session(2024, 1, "R")
            ├─ Cache Hit ✓ (instant)
            └─ Process telemetry for both drivers
        ↓
        React: setTelemetryData({driver1: {...}, driver2: {...}})
        ↓
        setLoading(false)
    }

Step 4: Circuit Layout Auto-loads
    ↓
    useEffect: [telemetryData]
    ↓
    if (telemetryData && !circuitLayout) {
        Fetch: GET /circuit-layout/2024/1
        ↓
        Backend: get_cached_session(2024, 1, "R")
            └─ Cache Hit ✓
        ↓
        Extract X, Y coordinates
        ↓
        React: setCircuitLayout({coordinates: [...]})
    }

Step 5: Render Complete
    ↓
    ├─ 6 Charts rendered with Recharts
    ├─ Circuit SVG rendered with coordinates
    └─ Interactive hover enabled
```

---

## 📦 File Size Reference

```
Backend:
├── src/api/main.py              ~511 lines / ~15 KB
├── src/ingestion/data_loader.py ~200 lines / ~6 KB
├── src/processing/telemetry.py  ~150 lines / ~5 KB
└── Total Backend                ~1000 lines / ~30 KB

Frontend:
├── src/pages/TelemetryAnalysis.tsx  ~1103 lines / ~40 KB
├── src/pages/Dashboard.tsx          ~200 lines / ~8 KB
├── src/App.tsx                      ~100 lines / ~4 KB
├── src/components/ui/*              ~500 lines / ~20 KB
└── Total Frontend                   ~2000 lines / ~80 KB

Data:
├── API Response (telemetry)     ~1-5 MB
├── Circuit coordinates          ~50-100 KB
├── FastF1 cache per session     ~10-50 MB
└── Total cache (all sessions)   ~1-5 GB
```

---

## 🎭 User Journey Example

```
👤 F1 Fan wants to compare Max vs Lewis at Monza

1. Opens app → Lands on Dashboard
   ⏱️ <1s load time

2. Clicks "Telemetry Analysis" in navbar
   ⏱️ <500ms navigation

3. Selects Year: 2024
   ⏱️ <200ms (instant UI update)
   ⏱️ ~2s (load races from backend)

4. Selects Race: "Italian Grand Prix"
   ⏱️ ~5s (load drivers - first time)
   ⏱️ OR <100ms (cached)

5. Driver 1: Max Verstappen (VER)
   Driver 2: Lewis Hamilton (HAM)
   ⏱️ <100ms (UI update)

6. Clicks "Compare"
   ⏱️ ~15-30s (first load - downloads F1 data)
   ⏱️ OR <100ms (cached subsequent loads)

7. Views Results:
   ✅ 6 synchronized charts
   ✅ Interactive circuit layout
   ✅ Hover to see speeds at any point
   ✅ Pin circuit for side-by-side view

8. Changes lap number
   ⏱️ <100ms (instant - data already loaded)

9. Hovers over circuit turn
   ✅ Sees VER: 315 km/h, HAM: 312 km/h
   ✅ Smooth interaction, no lag

10. Shares screenshot on social media 📸
    🎉 Success!
```

---

## 🔧 Technology Decision Tree

```
Need to add feature? Ask:

├─ Is it data-related?
│  ├─ Yes → Backend (Python/FastAPI)
│  │  ├─ New data source? → ingestion/
│  │  ├─ Data transformation? → processing/
│  │  ├─ Analysis logic? → analytics/
│  │  └─ API endpoint? → api/main.py
│  │
│  └─ No → Frontend (React/TypeScript)
│     ├─ New page? → pages/
│     ├─ Reusable UI? → components/
│     ├─ Chart visualization? → Use Recharts
│     ├─ Form/Input? → Use shadcn/ui
│     └─ Styling? → TailwindCSS utility classes

Need performance boost?
├─ Backend slow?
│  ├─ Add caching (already done ✓)
│  ├─ Optimize data processing
│  └─ Use async/await
│
└─ Frontend slow?
   ├─ Code splitting (lazy load)
   ├─ Memoization (useMemo)
   └─ Debounce user input

Need new chart type?
└─ Check Recharts docs first
   ├─ Available? → Use it
   └─ Not available? → Custom with <svg>
```

---

## 🎯 Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  F1 ANALYTICS - QUICK REFERENCE                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🚀 Start App                                            │
│     .\start-all.ps1                                     │
│                                                          │
│  🛑 Stop App                                             │
│     .\stop-all.ps1                                      │
│                                                          │
│  🌐 URLs                                                 │
│     Frontend:  http://localhost:3000                    │
│     Backend:   http://localhost:8000                    │
│     API Docs:  http://localhost:8000/docs               │
│                                                          │
│  📂 Key Files                                            │
│     Backend:   src/api/main.py                          │
│     Frontend:  web/frontend/src/pages/                  │
│     Config:    .env                                      │
│                                                          │
│  🧪 Testing                                              │
│     Backend:   pytest                                   │
│     Frontend:  cd web/frontend; npm test                │
│                                                          │
│  📊 Data Range                                           │
│     Years:     2018-2025                                │
│     Sessions:  Practice, Qualifying, Race, Sprint       │
│                                                          │
│  ⚡ Cache Location                                       │
│     FastF1:    data/cache/                              │
│     Backend:   In-memory (_session_cache)               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

Made with ❤️ for F1 fans
