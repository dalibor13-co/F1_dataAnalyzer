# 🏎️ F1 Data Analytics Platform

Full-stack platform for Formula 1 telemetry analysis with real-time data visualization.

**Stack:** Python 3.12 · FastAPI · React · TypeScript · FastF1

---

## Features

- Real-time telemetry comparison (speed, throttle, brake, DRS, gears)
- Interactive circuit visualization with GPS data
- Lap time analysis with sector breakdown
- Multi-driver comparison charts
- Data coverage: 2018-2025 seasons

---

## Quick Start

```powershell
# Start backend + frontend
.\start-all.ps1
```

Backend: `http://localhost:8000`  
Frontend: `http://localhost:3000`

**Setup:**
```powershell
# Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend
cd web\frontend
npm install
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

---

## API Endpoints

**Races:** `GET /races/{year}`  
**Drivers:** `GET /drivers/{year}/{race}`  
**Telemetry:** `GET /telemetry/{year}/{race}/{driver1}/{driver2}`  
**Circuit:** `GET /circuit-layout/{year}/{race}`  
**Laps:** `GET /laps/{year}/{race}/{driver}`

API docs: `http://localhost:8000/docs`

---

## Tech Stack

**Backend:** FastAPI · FastF1 · Pandas · Uvicorn  
**Frontend:** React · TypeScript · Vite · Recharts · TailwindCSS · shadcn/ui  
**DevOps:** Docker · PowerShell

---

## License

MIT

