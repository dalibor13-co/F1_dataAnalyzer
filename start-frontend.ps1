# Start F1 Analytics Frontend

Write-Host "Starting F1 Analytics Frontend..." -ForegroundColor Cyan

# Stop any existing Docker containers on port 3000
Write-Host "Stopping existing frontend containers..." -ForegroundColor Yellow
docker ps -q --filter "publish=3000" | ForEach-Object { docker stop $_ } 2>$null

# Wait a moment
Start-Sleep -Seconds 1

# Start frontend
Write-Host "Starting React frontend on port 3000..." -ForegroundColor Green
Set-Location -Path "$PSScriptRoot\web\frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "docker run -it --rm -v `${PWD}:/app -w /app -p 3000:3000 node:24-alpine sh -c 'npm run dev -- --host 0.0.0.0'"

Write-Host ""
Write-Host "✅ Frontend started!" -ForegroundColor Green
Write-Host "🌐 Web: http://localhost:3000" -ForegroundColor Cyan
