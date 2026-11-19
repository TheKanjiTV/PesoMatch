$ErrorActionPreference = 'Stop'
$taskProject = Split-Path $PSScriptRoot -Parent
$taskApiOrigin = 'http://127.0.0.1:8017'
function Test-PesoBackend([string]$Origin) {
    try {
        $health = Invoke-RestMethod "$Origin/api/public/health" -TimeoutSec 3
        return $health.application -eq 'pesomatch' -and $health.status -eq 'ok'
    } catch { return $false }
}
$taskApi = $null
if (Get-NetTCPConnection -LocalPort 8017 -State Listen -ErrorAction SilentlyContinue) {
    if (-not (Test-PesoBackend $taskApiOrigin)) {
        throw 'Port 8017 belongs to a different or unavailable backend. Stop that listener or choose a separate override; no process was stopped.'
    }
} else {
    $taskApi = Start-Process -FilePath (Get-Command php).Source -ArgumentList @('artisan','serve','--host=127.0.0.1','--port=8017') -WorkingDirectory (Join-Path $taskProject 'backend') -PassThru -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 30 -and -not (Test-PesoBackend $taskApiOrigin); $attempt++) { Start-Sleep -Milliseconds 500 }
    if (-not (Test-PesoBackend $taskApiOrigin)) {
        if (-not $taskApi.HasExited) { Stop-Process -Id $taskApi.Id }
        throw 'PesoMatch API did not become ready on port 8017. Check backend configuration.'
    }
}
try {
    if (Get-NetTCPConnection -LocalPort 8443 -State Listen -ErrorAction SilentlyContinue) {
        if (-not (Test-PesoBackend 'http://127.0.0.1:8443')) {
            throw 'The existing port 8443 frontend uses a different backend. Restart that PesoMatch frontend so it uses port 8017.'
        }
        Write-Host 'PesoMatch is already running at http://127.0.0.1:8443. Leave its processes running.'
        if ($taskApi) { $taskApi.WaitForExit() }
    } else {
        $env:VITE_LARAVEL_PROXY_URL = $taskApiOrigin
        Set-Location $taskProject
        Write-Host 'PesoMatch: http://127.0.0.1:8443; verified API: http://127.0.0.1:8017'
        pnpm dev --host 127.0.0.1
    }
} finally {
    if ($taskApi -and -not $taskApi.HasExited) { Stop-Process -Id $taskApi.Id }
}
