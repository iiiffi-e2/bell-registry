# Fix Prisma generation issues on Windows
Write-Host "Fixing Prisma generation issues..." -ForegroundColor Yellow

# Stop any running Node processes
Write-Host "Checking for running Node processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found running Node processes. Please stop them manually." -ForegroundColor Red
    $nodeProcesses | Format-Table -Property Id, ProcessName, StartTime
    Read-Host "Press Enter after stopping the processes"
}

# Remove locked Prisma files
Write-Host "Removing locked Prisma files..." -ForegroundColor Cyan
Remove-Item -Path "node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

# Wait a moment for file system to update
Start-Sleep -Seconds 2

# Regenerate Prisma client
Write-Host "Regenerating Prisma client..." -ForegroundColor Green
npm run db:generate --workspace=packages/shared

Write-Host "Prisma fix complete!" -ForegroundColor Green 