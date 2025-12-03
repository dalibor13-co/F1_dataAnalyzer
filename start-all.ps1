# Start Complete F1 Analytics Application

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "       F1 Data Analytics Platform       " -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Stop existing processes
Write-Host " Stopping existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process -Force -ErrorAction SilentlyContinue
docker ps -q --filter "publish=3000" | ForEach-Object { docker stop $_ } 2>$null

Start-Sleep -Seconds 2

# Start Backend
Write-Host ""
Write-Host "Starting Backend (FastAPI + FastF1)..." -ForegroundColor Green
Set-Location -Path $PSScriptRoot
$pythonPath = ".\.venv\Scripts\python.exe"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$pythonPath' -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend (React + Vite)..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\web\frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "docker run -it --rm -v `${PWD}:/app -w /app -p 3000:3000 node:24-alpine sh -c 'npm run dev -- --host 0.0.0.0'"

Start-Sleep -Seconds 3

# Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    Application Started Successfully   " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API:       http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs:          http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Frontend Web:      http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to open browser..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Start-Process "http://localhost:3000"
