# 🛠️ Development Guide

## Setup

```powershell
git clone https://github.com/yourusername/f1-analytics.git
cd f1-analytics
git checkout -b feature/your-feature
```

### Backend
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### Frontend
```powershell
cd web\frontend
npm install
```

---

## Code Style

**Python:** PEP 8, type hints, Black formatter  
**TypeScript:** Functional components, strict mode

---

## Testing

```powershell
pytest
pytest --cov=src tests/
```

---

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request
