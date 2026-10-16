param([switch]$ConfigureLocal)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskLocal = Join-Path $taskRoot '.local'
$taskArchive = Join-Path $taskLocal 'xpdf-tools-win-4.06.zip'
New-Item -ItemType Directory -Force -Path $taskLocal | Out-Null
# Official publisher archive; checksum independently matched to ScoopInstaller/Main.
# https://github.com/ScoopInstaller/Main/blob/master/bucket/xpdf-tools.json
$taskExpected = '2b6ca45da794e7854a6468fd6c8063fde62701f001ce03fa4f603eab7e15a0b6'
if (-not (Test-Path -LiteralPath $taskArchive)) {
    Invoke-WebRequest -Uri 'https://dl.xpdfreader.com/xpdf-tools-win-4.06.zip' -OutFile $taskArchive
}
if ((Get-FileHash -LiteralPath $taskArchive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskExpected) { throw 'PDF extractor archive integrity check failed.' }
$taskDestination = Join-Path $taskLocal 'pdf-tools'
Expand-Archive -LiteralPath $taskArchive -DestinationPath $taskDestination -Force
$taskBinary = Join-Path $taskDestination 'xpdf-tools-win-4.06/bin64/pdftotext.exe'
if (-not (Test-Path -LiteralPath $taskBinary)) { throw 'Expected PDF extractor is missing.' }
if ($ConfigureLocal) {
    $taskEnvPath = Join-Path $taskRoot 'backend/.env'
    if (-not (Test-Path -LiteralPath $taskEnvPath)) { throw 'Configure backend/.env first.' }
    $taskEnvText = [IO.File]::ReadAllText($taskEnvPath)
    $taskValue = 'RESUME_PDFTOTEXT="' + $taskBinary.Replace('\','/') + '"'
    $taskPattern = '(?m)^RESUME_PDFTOTEXT=.*$'
    if ([regex]::Matches($taskEnvText, $taskPattern).Count -gt 1) { throw 'Resolve duplicate PDF extractor configuration first.' }
    if ([regex]::IsMatch($taskEnvText, $taskPattern)) { $taskEnvText = [regex]::Replace($taskEnvText, $taskPattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($taskMatch) $taskValue }) }
    else { $taskEnvText += "`r`n$taskValue`r`n" }
    [IO.File]::WriteAllText($taskEnvPath, $taskEnvText, [Text.UTF8Encoding]::new($false))
    Write-Host 'Updated only the local RESUME_PDFTOTEXT setting. Clear cached Laravel config if enabled.'
}
Write-Host 'Verified Xpdf tools 4.06 installed in private .local storage. Preserve the included GPL notices if redistributing the binary.'
