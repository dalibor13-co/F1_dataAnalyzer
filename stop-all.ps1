# Stop All F1 Analytics Services

Write-Host "Stopping F1 Analytics Application..." -ForegroundColor Yellow

# Stop Python/Backend
Write-Host "Stopping backend processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Stop Docker/Frontend
Write-Host "Stopping frontend containers..." -ForegroundColor Yellow
docker ps -q --filter "publish=3000" | ForEach-Object { docker stop $_ } 2>$null
docker ps -q --filter "ancestor=node:24-alpine" | ForEach-Object { docker stop $_ } 2>$null

Write-Host ""
Write-Host "✅ All services stopped!" -ForegroundColor Green
