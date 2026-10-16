param([string]$JavaPath, [string]$SdkPath)
$ErrorActionPreference = 'Stop'
$taskProject = Split-Path $PSScriptRoot -Parent
$taskTools = Join-Path $taskProject '.local\android-tools'
if (-not $JavaPath) { $JavaPath = (Get-ChildItem $taskTools -Directory -Filter 'jdk-*' -ErrorAction SilentlyContinue | Select-Object -First 1).FullName }
if (-not $JavaPath) { $JavaPath = $env:JAVA_HOME }
if (-not $SdkPath) { $SdkPath = Join-Path $taskTools 'sdk' }
if (-not (Test-Path (Join-Path $JavaPath 'bin\java.exe'))) { throw 'Set -JavaPath to a JDK 17 or newer directory.' }
if (-not (Test-Path (Join-Path $SdkPath 'platforms\android-35\android.jar'))) { throw 'Set -SdkPath to an Android SDK containing platform 35 and build-tools 35.0.0.' }
$env:JAVA_HOME = $JavaPath
$env:ANDROID_HOME = $SdkPath
$env:GRADLE_USER_HOME = Join-Path $taskTools 'gradle-cache'
& (Join-Path $PSScriptRoot 'gradlew.bat') -p $PSScriptRoot --no-daemon --console=plain assembleDebug testDebugUnitTest lintDebug
if ($LASTEXITCODE -ne 0) { throw "Android build failed ($LASTEXITCODE)." }
$taskDownloads = Join-Path $taskProject 'public\downloads'
New-Item -ItemType Directory -Force $taskDownloads | Out-Null
$taskApk = Join-Path $taskDownloads 'peso-android-local.apk'
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'app\build\outputs\apk\debug\app-debug.apk') -Destination $taskApk -Force
$taskStream = [IO.File]::OpenRead($taskApk)
try { $taskHash = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($taskStream)).Replace('-','').ToLower() } finally { $taskStream.Dispose() }
$taskGradle = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'app\build.gradle') -Raw
$taskVersion = [regex]::Match($taskGradle, "versionName\s+'([^']+)'").Groups[1].Value
if (-not $taskVersion) { throw 'Android versionName is missing.' }
$taskRelease = @{ available=$true; version=$taskVersion; url='/downloads/peso-android-local.apk'; sha256=$taskHash } | ConvertTo-Json
[IO.File]::WriteAllText((Join-Path $taskProject 'public\app-release.json'),$taskRelease)
if (Test-Path (Join-Path $taskProject 'dist')) {
    New-Item -ItemType Directory -Force (Join-Path $taskProject 'dist\downloads') | Out-Null
    Copy-Item -LiteralPath $taskApk -Destination (Join-Path $taskProject 'dist\downloads\peso-android-local.apk') -Force
    [IO.File]::WriteAllText((Join-Path $taskProject 'dist\app-release.json'),$taskRelease)
}
Write-Host "APK: $taskApk"
