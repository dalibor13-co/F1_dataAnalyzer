# Start F1 Analytics Backend Server

Write-Host "Starting F1 Analytics Backend..." -ForegroundColor Cyan

# Stop any existing Python processes
Write-Host "Stopping existing backend processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 1

# Start backend
Write-Host "Starting FastAPI backend on port 8000..." -ForegroundColor Green
Set-Location -Path $PSScriptRoot
$pythonPath = ".\..venv\Scripts\python.exe"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$pythonPath' -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000"

Write-Host ""
Write-Host "Backend started!" -ForegroundColor Green
Write-Host "API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Docs: http://localhost:8000/docs" -ForegroundColor Cyan
