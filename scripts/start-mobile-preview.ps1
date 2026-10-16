param([string]$Address)
$ErrorActionPreference = 'Stop'
$taskProject = Split-Path $PSScriptRoot -Parent
if (-not $Address) {
    $Address = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)' -and $_.InterfaceAlias -notmatch 'vEthernet|WSL|Loopback' } | Select-Object -First 1 -ExpandProperty IPAddress
}
if (-not $Address) { throw 'Connect this computer to Wi-Fi/LAN, or pass -Address with its private IPv4 address.' }
if ($Address -notmatch '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)\d') { throw 'Use the computer private LAN IPv4 address.' }
if (Get-NetTCPConnection -LocalPort 8002,8444 -State Listen -ErrorAction SilentlyContinue) { throw 'Mobile preview ports 8002 or 8444 are already in use.' }
$taskOrigin = "http://${Address}:8444"
$env:APP_URL = 'http://127.0.0.1:8002'
$env:SANCTUM_STATEFUL_DOMAINS = "${Address}:8444,127.0.0.1:8444,localhost:8444"
$env:FRONTEND_URLS = "$taskOrigin,http://127.0.0.1:8444,http://localhost:8444"
$env:SESSION_SECURE_COOKIE = 'false'
$env:VITE_LARAVEL_PROXY_URL = 'http://127.0.0.1:8002'
Set-Location $taskProject
$taskApi = Start-Process -FilePath (Get-Command php).Source -ArgumentList @('artisan','serve','--host=127.0.0.1','--port=8002') -WorkingDirectory (Join-Path $taskProject 'backend') -PassThru -WindowStyle Hidden
try {
    Write-Host "On the same Wi-Fi, open $taskOrigin/app and download the Android APK."
    Write-Host "Enter $taskOrigin in the Android app. This is a local HTTP development preview."
    Write-Host 'Public PWA installation requires the deployed HTTPS platform. Ctrl+C stops this mobile preview.'
    pnpm preview --host 0.0.0.0 --port 8444
} finally { if (-not $taskApi.HasExited) { Stop-Process -Id $taskApi.Id } }
