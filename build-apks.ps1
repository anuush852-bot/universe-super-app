# UniVerse - build 4 separate APKs (customer, seller, delivery, driver)
# Usage (PowerShell, from this folder):
#   .\build-apks.ps1 -ApiBase "http://192.168.1.5:3000"        # PC pe server, same WiFi (testing)
#   .\build-apks.ps1 -ApiBase "https://your-app.onrender.com"   # deployed server (real use)
param([Parameter(Mandatory=$true)][string]$ApiBase)

$ErrorActionPreference = "Stop"
$ApiBase = $ApiBase.TrimEnd("/")
$root = $PSScriptRoot
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

$apps = @(
  @{ key="customer"; page="index.html";    id="com.universe.customer"; name="UniVerse" },
  @{ key="seller";   page="seller.html";   id="com.universe.seller";   name="UniVerse Seller" },
  @{ key="delivery"; page="delivery.html"; id="com.universe.delivery"; name="UniVerse Delivery" },
  @{ key="driver";   page="driver.html";   id="com.universe.driver";   name="UniVerse Driver" }
)

# Android SDK path for this PC
$sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
if (-not (Test-Path $sdk)) { throw "Android SDK nahi mila: $sdk  (Android Studio install karo)" }
[IO.File]::WriteAllText("$root\android\local.properties", "sdk.dir=" + ($sdk -replace '\\','\\'), $utf8)

Write-Host "npm install..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { throw "npm install fail" }

$cfgPath  = "$root\capacitor.config.json"
$cfgOrig  = [IO.File]::ReadAllText($cfgPath)
$strPath  = "$root\android\app\src\main\res\values\strings.xml"
$strOrig  = [IO.File]::ReadAllText($strPath)
$out = Join-Path (Split-Path $root -Parent) "APKs"
New-Item -ItemType Directory $out -Force | Out-Null

try {
  foreach ($a in $apps) {
    Write-Host "`n===== $($a.key) =====" -ForegroundColor Green
    $www = "$root\www-$($a.key)"
    if (Test-Path $www) { Remove-Item $www -Recurse -Force }
    Copy-Item "$root\public" $www -Recurse
    if ($a.page -ne "index.html") { Copy-Item "$www\$($a.page)" "$www\index.html" -Force }
    $js = [IO.File]::ReadAllText("$www\config.js") -replace "window\.API_BASE='[^']*';", "window.API_BASE='$ApiBase';"
    [IO.File]::WriteAllText("$www\config.js", $js, $utf8)

    $cfg = $cfgOrig | ConvertFrom-Json
    $cfg.appId = $a.id; $cfg.appName = $a.name; $cfg.webDir = "www-$($a.key)"
    $cfg | Add-Member -NotePropertyName android -NotePropertyValue ([pscustomobject]@{ allowMixedContent = $true }) -Force
    [IO.File]::WriteAllText($cfgPath, ($cfg | ConvertTo-Json -Depth 10), $utf8)

    $s = $strOrig -replace '(<string name="app_name">)[^<]*', ('${1}' + $a.name)
    $s = $s -replace '(<string name="title_activity_main">)[^<]*', ('${1}' + $a.name)
    [IO.File]::WriteAllText($strPath, $s, $utf8)

    npx cap sync android
    if ($LASTEXITCODE -ne 0) { throw "cap sync fail ($($a.key))" }

    Push-Location "$root\android"
    .\gradlew.bat assembleDebug "-PappId=$($a.id)"
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -ne 0) { throw "gradle build fail ($($a.key))" }

    Copy-Item "$root\android\app\build\outputs\apk\debug\app-debug.apk" "$out\$($a.key).apk" -Force
    Write-Host "OK -> $out\$($a.key).apk" -ForegroundColor Green
  }
}
finally {
  [IO.File]::WriteAllText($cfgPath, $cfgOrig, $utf8)
  [IO.File]::WriteAllText($strPath, $strOrig, $utf8)
  Get-ChildItem $root -Directory -Filter "www-*" | Remove-Item -Recurse -Force
}

Write-Host "`nSab APK ban gayi: $out" -ForegroundColor Cyan
explorer $out
