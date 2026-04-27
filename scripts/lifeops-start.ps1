param(
  [int]$Port = 4317,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$RuntimeDir = Join-Path $Root ".lifeops-runtime"
$PidFile = Join-Path $RuntimeDir "lifeops-app.pid"
$OutLogFile = Join-Path $RuntimeDir "lifeops-app.out.log"
$ErrLogFile = Join-Path $RuntimeDir "lifeops-app.err.log"
$RunnerFile = Join-Path $RuntimeDir "lifeops-runner.ps1"

New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null

if (Test-Path $PidFile) {
  $ExistingPid = Get-Content $PidFile -ErrorAction SilentlyContinue
  if ($ExistingPid -and (Get-Process -Id $ExistingPid -ErrorAction SilentlyContinue)) {
    Write-Host "LifeOps already appears to be running with PID $ExistingPid."
    Write-Host "Open: http://localhost:$Port"
    exit 0
  }
}

$PortInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($PortInUse) {
  throw "Port $Port is already in use. Choose another port, for example: pnpm lifeops:start -- -Port 4318"
}

Set-Location $Root

Write-Host "Starting Docker infrastructure..."
docker compose up -d

Write-Host "Generating Prisma client..."
pnpm db:generate

Write-Host "Applying database migrations..."
pnpm db:migrate

if (-not $SkipBuild) {
  Write-Host "Building LifeOps web app..."
  pnpm --filter "@lifeops/web" build
}

$Runner = @'
param(
  [string]$Root,
  [int]$Port
)

$ErrorActionPreference = "Stop"
Set-Location $Root

if (Test-Path ".env") {
  Get-Content ".env" | ForEach-Object {
    if ($_ -match "^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$") {
      $name = $matches[1]
      $value = $matches[2].Trim()
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
}

$env:NODE_ENV = "production"
$env:PORT = [string]$Port
pnpm --dir apps/web exec next start -p $Port
'@

Set-Content -Path $RunnerFile -Value $Runner

Write-Host "Starting LifeOps app in the background on port $Port..."
$Process = Start-Process powershell `
  -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", $RunnerFile, "-Root", $Root, "-Port", $Port `
  -RedirectStandardOutput $OutLogFile `
  -RedirectStandardError $ErrLogFile `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $PidFile -Value $Process.Id

Start-Sleep -Seconds 3
Write-Host "LifeOps started."
Write-Host "PID: $($Process.Id)"
Write-Host "Open: http://localhost:$Port"
Write-Host "Logs: $OutLogFile"
Write-Host "Errors: $ErrLogFile"
