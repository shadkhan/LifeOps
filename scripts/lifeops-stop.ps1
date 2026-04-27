param(
  [switch]$StopInfra
)

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$RuntimeDir = Join-Path $Root ".lifeops-runtime"
$PidFile = Join-Path $RuntimeDir "lifeops-app.pid"

if (Test-Path $PidFile) {
  $AppPid = Get-Content $PidFile -ErrorAction SilentlyContinue
  $Process = if ($AppPid) { Get-Process -Id $AppPid -ErrorAction SilentlyContinue } else { $null }
  if ($Process) {
    Write-Host "Stopping LifeOps app PID $AppPid..."
    Stop-Process -Id $AppPid -Force
  } else {
    Write-Host "LifeOps app is not running."
  }
  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
} else {
  Write-Host "LifeOps app is not running."
}

if ($StopInfra) {
  Set-Location $Root
  Write-Host "Stopping Docker infrastructure..."
  docker compose stop
}
