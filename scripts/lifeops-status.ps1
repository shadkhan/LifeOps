param(
  [int]$Port = 4317
)

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$RuntimeDir = Join-Path $Root ".lifeops-runtime"
$PidFile = Join-Path $RuntimeDir "lifeops-app.pid"
$OutLogFile = Join-Path $RuntimeDir "lifeops-app.out.log"
$ErrLogFile = Join-Path $RuntimeDir "lifeops-app.err.log"

Write-Host "LifeOps local status"
Write-Host "--------------------"

if (Test-Path $PidFile) {
  $AppPid = Get-Content $PidFile -ErrorAction SilentlyContinue
  $Process = if ($AppPid) { Get-Process -Id $AppPid -ErrorAction SilentlyContinue } else { $null }
  if ($Process) {
    Write-Host "App: running"
    Write-Host "PID: $AppPid"
    Write-Host "URL: http://localhost:$Port"
  } else {
    Write-Host "App: not running (stale PID file found)"
  }
} else {
  Write-Host "App: not running"
}

$PortInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
$PortStatus = if ($PortInUse) { "in use" } else { "free" }
Write-Host "Port ${Port}: $PortStatus"

Write-Host ""
Write-Host "Docker containers:"
docker compose ps

if (Test-Path $OutLogFile) {
  Write-Host ""
  Write-Host "Recent app logs:"
  Get-Content -Tail 30 $OutLogFile
}

if (Test-Path $ErrLogFile) {
  Write-Host ""
  Write-Host "Recent app errors:"
  Get-Content -Tail 30 $ErrLogFile
}
