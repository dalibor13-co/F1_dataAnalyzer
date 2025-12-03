# 🚀 Deployment Guide

## Local Development

### Backend
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.api.main:app --reload --port 8000
```

### Frontend
```powershell
cd web\frontend
npm install
npm run dev
```

### Quick Start
```powershell
.\start-all.ps1  # Start both
.\stop-all.ps1   # Stop all
```

---

## Docker

```powershell
docker-compose up -d
docker-compose down
```

---

## Production

### Backend
```powershell
pip install -r requirements.txt
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend
```powershell
cd web\frontend
npm run build
# Serve dist/ folder with nginx/caddy
```

---

## Environment Variables

**Backend (.env):**
```env
FASTF1_CACHE=./data/cache
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=info
CORS_ORIGINS=["https://yourdomain.com"]
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:8000
```
