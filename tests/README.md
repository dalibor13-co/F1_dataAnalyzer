# 🧪 Testing Guide

## Overview

Projekt obsahuje unit testy pro backend API endpointy, zejména pro pit stop funkcionalitu.

## Setup

### 1. Aktivuj virtuální prostředí

```powershell
.\.venv\Scripts\Activate.ps1
```

### 2. Nainstaluj pytest (pokud ještě není)

```powershell
pip install pytest httpx
```

## Spuštění testů

### Všechny testy

```powershell
pytest tests/ -v
```

### Konkrétní test soubor

```powershell
pytest tests/test_api_pitstops.py -v
```

### Konkrétní test třída

```powershell
pytest tests/test_api_pitstops.py::TestPitStopsEndpoint -v
```

### Konkrétní test funkce

```powershell
pytest tests/test_api_pitstops.py::TestPitStopsEndpoint::test_qatar_2025_verstappen_pitstops -v
```

### S coverage reportem

```powershell
pip install pytest-cov
pytest tests/ --cov=src --cov-report=html
```

Po spuštění můžeš otevřít `htmlcov/index.html` v browseru.

## Test Structure

### `test_api_pitstops.py`

Obsahuje testy pro pit stop endpointy:

#### **TestPitStopsEndpoint**
- ✅ `test_get_race_pitstops_qatar_2025` - Testuje základní funkčnost `/pitstops` endpointu
- ✅ `test_pitstops_driver_structure` - Ověřuje strukturu dat pro jednotlivého jezdce
- ✅ `test_qatar_2025_verstappen_pitstops` - Specifický test pro Verstappen (2 pit stopy, laps 7 a 32)

#### **TestDriverLapsEndpoint**
- ✅ `test_get_driver_laps_with_pitstops` - Testuje `/laps` endpoint s pit stop daty
- ✅ `test_laps_exclude_pit_laps` - Ověřuje, že pit lap kola jsou vyloučena z běžných lap dat
- ✅ `test_pit_stops_have_required_fields` - Kontroluje přítomnost všech polí
- ✅ `test_verstappen_qatar_pitstop_details` - Detailní kontrola pit stop dat pro VER

#### **TestPitStopDataQuality**
- ✅ `test_all_drivers_consistent_structure` - Konzistence dat napříč všemi jezdci
- ✅ `test_pit_duration_reasonable` - Pit duration v reálném rozsahu (2-30s)
- ✅ `test_lap_numbers_sequential` - Pit stop laps jsou v pořadí

## Příklad výstupu

```
======================== test session starts ========================
tests/test_api_pitstops.py::TestPitStopsEndpoint::test_get_race_pitstops_qatar_2025 PASSED
tests/test_api_pitstops.py::TestPitStopsEndpoint::test_pitstops_driver_structure PASSED
tests/test_api_pitstops.py::TestPitStopsEndpoint::test_qatar_2025_verstappen_pitstops PASSED
tests/test_api_pitstops.py::TestDriverLapsEndpoint::test_get_driver_laps_with_pitstops PASSED
tests/test_api_pitstops.py::TestDriverLapsEndpoint::test_laps_exclude_pit_laps PASSED
tests/test_api_pitstops.py::TestDriverLapsEndpoint::test_pit_stops_have_required_fields PASSED
tests/test_api_pitstops.py::TestDriverLapsEndpoint::test_verstappen_qatar_pitstop_details PASSED
tests/test_api_pitstops.py::TestPitStopDataQuality::test_all_drivers_consistent_structure PASSED
tests/test_api_pitstops.py::TestPitStopDataQuality::test_pit_duration_reasonable PASSED
tests/test_api_pitstops.py::TestPitStopDataQuality::test_lap_numbers_sequential PASSED

======================== 10 passed in 15.2s ========================
```

## Continuous Integration

Pro CI/CD pipeline přidej do GitHub Actions:

```yaml
- name: Run tests
  run: |
    pip install pytest httpx
    pytest tests/ -v
```

## Troubleshooting

### Backend neběží
Ujisti se, že backend server běží před spuštěním testů:
```powershell
cd src/api
uvicorn main:app --reload --port 8000
```

### Missing dependencies
```powershell
pip install -r requirements.txt
pip install pytest httpx pytest-cov
```

### Cache issues
Pokud FastF1 cache způsobuje problémy:
```powershell
Remove-Item -Recurse -Force data/cache/*
```
