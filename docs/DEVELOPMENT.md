# 🎯 Development Guide

## Project Setup for Contributors

### 1. Fork & Clone
```powershell
git clone https://github.com/YOUR_USERNAME/F1_project.git
cd F1_project
git remote add upstream https://github.com/dalibor13-co/F1_project.git
```

### 2. Create Feature Branch
```powershell
git checkout -b feature/your-feature-name
```

### 3. Install Dependencies

#### Backend
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Dev dependencies
```

#### Frontend
```powershell
cd web\frontend
npm install
```

---

## Code Style & Standards

### Python (Backend)

#### Style Guide
- Follow PEP 8
- Use type hints
- Maximum line length: 88 (Black default)
- Use docstrings for functions/classes

#### Example
```python
from typing import List
from dataclasses import dataclass

@dataclass
class LapData:
    """Represents lap timing data."""
    lap_number: int
    lap_time: float
    driver: str
    
    def format_time(self) -> str:
        """Format lap time as MM:SS.mmm"""
        minutes = int(self.lap_time // 60)
        seconds = self.lap_time % 60
        return f"{minutes}:{seconds:06.3f}"
```

#### Formatting
```powershell
# Install dev tools
pip install black ruff mypy

# Format code
black src/

# Lint
ruff check src/

# Type check
mypy src/
```

---

### TypeScript (Frontend)

#### Style Guide
- Use functional components
- Prefer hooks over class components
- Use TypeScript strict mode
- Follow Airbnb React style guide

#### Example
```typescript
interface TelemetryData {
  driver: string
  lapTime: string
  telemetry: {
    Distance: number[]
    Speed: number[]
  }
}

export const TelemetryChart: React.FC<{data: TelemetryData}> = ({ data }) => {
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    // Load data
  }, [data])
  
  return (
    <div className="chart-container">
      {/* Chart content */}
    </div>
  )
}
```

#### Linting
```powershell
cd web\frontend

# Lint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Type check
npm run type-check
```

---

## Project Structure Guidelines

### Backend Structure

```
src/
├── api/
│   ├── main.py              # FastAPI app & routes
│   └── dependencies.py      # Shared dependencies
├── ingestion/
│   └── data_loader.py       # FastF1 data loading
├── processing/
│   ├── telemetry.py         # Telemetry processing
│   └── laps.py              # Lap time processing
├── analytics/
│   └── lap_analysis.py      # Analysis functions
└── models/
    └── schemas.py           # Pydantic models
```

### Frontend Structure

```
src/
├── pages/
│   ├── Dashboard.tsx
│   └── TelemetryAnalysis.tsx
├── components/
│   ├── ui/                  # shadcn components
│   └── charts/              # Custom chart components
├── lib/
│   ├── utils.ts
│   └── api.ts               # API client
└── hooks/
    └── useF1Data.ts         # Custom hooks
```

---

## Adding New Features

### Backend: Add New Endpoint

1. **Create endpoint in `main.py`**
```python
@app.get("/new-endpoint/{param}")
async def new_endpoint(param: str):
    """Endpoint description."""
    try:
        # Your logic
        result = process_data(param)
        return {"data": result}
    except Exception as e:
        logger.error("Error in new_endpoint", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
```

2. **Add tests in `tests/`**
```python
def test_new_endpoint():
    response = client.get("/new-endpoint/test")
    assert response.status_code == 200
    assert "data" in response.json()
```

3. **Update API documentation**
- FastAPI auto-generates docs at `/docs`
- Add description in docstring

---

### Frontend: Add New Page

1. **Create page component**
```typescript
// src/pages/NewPage.tsx
export default function NewPage() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetch('/api/new-endpoint')
      .then(res => res.json())
      .then(setData)
  }, [])
  
  return (
    <div className="container mx-auto p-4">
      <h1>New Page</h1>
      {/* Content */}
    </div>
  )
}
```

2. **Add route**
```typescript
// src/App.tsx
import NewPage from './pages/NewPage'

<Route path="/new-page" element={<NewPage />} />
```

3. **Add navigation link**
```typescript
// src/components/Navbar.tsx
<Link to="/new-page">New Page</Link>
```

---

## Testing Guidelines

### Backend Tests

```python
# tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_get_races():
    response = client.get("/races/2024")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.parametrize("year,race", [
    (2024, 1),
    (2023, 5),
])
def test_get_telemetry(year, race):
    response = client.get(f"/telemetry/{year}/{race}/VER/HAM")
    assert response.status_code == 200
```

Run tests:
```powershell
pytest
pytest --cov=src  # With coverage
pytest -v         # Verbose
```

---

### Frontend Tests

```typescript
// src/pages/__tests__/Dashboard.test.tsx
import { render, screen } from '@testing-library/react'
import Dashboard from '../Dashboard'

describe('Dashboard', () => {
  it('renders dashboard title', () => {
    render(<Dashboard />)
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })
  
  it('loads race data', async () => {
    render(<Dashboard />)
    const races = await screen.findByText(/Bahrain/i)
    expect(races).toBeInTheDocument()
  })
})
```

Run tests:
```powershell
npm test
npm test -- --coverage
```

---

## Debugging

### Backend

1. **Enable debug logging**
```python
import structlog
structlog.configure(
    wrapper_class=structlog.make_filtering_bound_logger(logging.DEBUG)
)
```

2. **Use debugger**
```python
import pdb; pdb.set_trace()  # Breakpoint
```

3. **Check logs**
```powershell
# In development, logs print to console
# In production, configure file logging
```

---

### Frontend

1. **React DevTools**
   - Install browser extension
   - Inspect component props/state

2. **Console debugging**
```typescript
console.log('Data:', data)
console.table(telemetryData)
```

3. **Network tab**
   - Check API requests/responses
   - Verify CORS headers

---

## Performance Profiling

### Backend

```python
import cProfile
import pstats

# Profile function
profiler = cProfile.Profile()
profiler.enable()
# Your code
profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumtime')
stats.print_stats(10)
```

### Frontend

```typescript
// React Profiler
import { Profiler } from 'react'

<Profiler id="TelemetryChart" onRender={logPerformance}>
  <TelemetryChart />
</Profiler>
```

---

## Git Workflow

### Commit Messages

Follow conventional commits:
```
feat: add telemetry comparison endpoint
fix: resolve distance normalization bug
docs: update API documentation
style: format code with Black
refactor: simplify lap analysis logic
test: add tests for circuit layout
chore: update dependencies
```

### Pull Request Process

1. Update your fork
```powershell
git fetch upstream
git checkout main
git merge upstream/main
```

2. Rebase your feature branch
```powershell
git checkout feature/your-feature
git rebase main
```

3. Push and create PR
```powershell
git push origin feature/your-feature
# Create PR on GitHub
```

4. PR checklist:
- [ ] Tests pass
- [ ] Code is formatted
- [ ] Documentation updated
- [ ] No console errors
- [ ] Screenshots for UI changes

---

## Useful Commands

### Backend
```powershell
# Run dev server
uvicorn src.api.main:app --reload

# Run tests
pytest

# Format code
black src/

# Lint
ruff check src/

# Type check
mypy src/
```

### Frontend
```powershell
# Dev server
npm run dev

# Build
npm run build

# Preview build
npm run preview

# Lint
npm run lint

# Test
npm test
```

### Both
```powershell
# Start all services
.\start-all.ps1

# Stop all services
.\stop-all.ps1
```

---

## Common Issues

### Issue: Module not found
```powershell
# Backend
pip install -r requirements.txt

# Frontend
cd web\frontend
npm install
```

### Issue: Port already in use
```powershell
# Find process using port
netstat -ano | findstr :8000

# Kill process
taskkill /PID <PID> /F
```

### Issue: Cache is corrupt
```powershell
# Clear FastF1 cache
Remove-Item -Recurse -Force data\cache\*
```

---

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [FastF1 Docs](https://docs.fastf1.dev/)
- [React Docs](https://react.dev/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

## Need Help?

- Open an issue on GitHub
- Check existing issues/PRs
- Read the full README.md
- Review code comments

Happy coding! 🏎️
