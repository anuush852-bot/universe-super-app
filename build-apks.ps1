# UniVerse - build 4 separate APKs (customer, seller, delivery, driver)
# Usage (PowerShell, is folder me):
#   .\build-apks.ps1                       -> IP khud dhundh leta hai, sab 4 APK banata hai
#   .\build-apks.ps1 -Only driver          -> sirf driver APK
#   .\build-apks.ps1 -ApiBase "https://aapka-server.com"   -> deployed server ke liye
param([string]$ApiBase = "", [string]$Only = "")

$ErrorActionPreference = "Stop"
Write-Host "build-apks.ps1 VERSION 6 (JDK jlink fix)" -ForegroundColor Magenta
$root = $PSScriptRoot
Set-Location $root
$utf8 = New-Object System.Text.UTF8Encoding($false)

if (-not (Test-Path "$root\public\config.js")) { throw "Ye purana folder hai. 'universe-mvp-fixed' wale folder me jao: cd D:\universe-mvp-fixed\universe-mvp" }

# ---- Java: Gradle 8.14 ko JDK 17 se 24 chahiye (Java 25 se 'major version 69' error aata hai) ----
function Get-JdkMajor($home_) {
  # asli JDK chahiye: java.exe + jlink.exe dono hon (kuch JetBrains jbr me jlink nahi hota -> Android build fail)
  $rel = Join-Path $home_ "release"
  if (-not (Test-Path (Join-Path $home_ "bin\java.exe")) -or -not (Test-Path (Join-Path $home_ "bin\jlink.exe")) -or -not (Test-Path $rel)) { return 0 }
  $line = Get-Content $rel | Where-Object { $_ -like "JAVA_VERSION=*" } | Select-Object -First 1
  if ($line -match 'JAVA_VERSION="?(\d+)') { return [int]$Matches[1] }
  return 0
}
$cands = @()
$bases = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, "$env:LOCALAPPDATA\Programs") | Where-Object { $_ }
# pehle asli JDK vendors (Temurin sabse pehle), phir Android Studio / JetBrains
foreach ($vendor in "Eclipse Adoptium","Java","Microsoft","Amazon Corretto","Zulu","BellSoft") {
  foreach ($base in $bases) { if (Test-Path "$base\$vendor") { $cands += (Get-ChildItem "$base\$vendor" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | ForEach-Object { $_.FullName }) } }
}
if ($env:JAVA_HOME) { $cands += $env:JAVA_HOME }
foreach ($base in $bases) {
  $cands += "$base\Android\Android Studio\jbr"
  if (Test-Path "$base\JetBrains") { $cands += (Get-ChildItem "$base\JetBrains" -Directory -ErrorAction SilentlyContinue | ForEach-Object { "$($_.FullName)\jbr" }) }
}
$jdk = $cands | Where-Object { $m = Get-JdkMajor $_; $m -ge 17 -and $m -le 24 } | Select-Object -First 1
if (-not $jdk) {
  throw "Poora JDK 17/21 (jlink ke saath) nahi mila. Ye chalao: winget install EclipseAdoptium.Temurin.21.JDK   phir VS Code band karke dobara kholo aur script chalao."
}
$env:JAVA_HOME = $jdk; $env:Path = "$jdk\bin;$env:Path"
Write-Host "Java use ho raha hai: $jdk (version $(Get-JdkMajor $jdk))" -ForegroundColor Yellow

# ---- Server address ----
if (-not $ApiBase) {
  # asli network adapter = jiska default gateway ho (VirtualBox/VPN wale adapter chhut jaate hain)
  $ip = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq "Up" } | ForEach-Object { $_.IPv4Address.IPAddress } | Select-Object -First 1
  if (-not $ip) { throw "Network IP nahi mila. WiFi connect karo ya -ApiBase 'http://IP:3000' do" }
  $ApiBase = "http://${ip}:3000"
}
$ApiBase = $ApiBase.TrimEnd("/")
Write-Host "Server address: $ApiBase" -ForegroundColor Yellow

# Apps ki list apps.json me hai. Naya app jodne ke liye: .\add-app.ps1
if (-not (Test-Path "$root\apps.json")) { throw "apps.json nahi mila" }
# NOTE: Windows PowerShell 5.1 me ConvertFrom-Json array ko ek hi object bana deta hai, isliye ForEach-Object { $_ } se alag-alag karte hain
$apps = @((Get-Content "$root\apps.json" -Raw | ConvertFrom-Json) | ForEach-Object { $_ })
if ($apps.Count -lt 1 -or -not $apps[0].key -or $apps[0].key -is [array]) { throw "apps.json galat hai. Zip wali original apps.json wapas rakho." }
if ($Only -and -not ($apps | Where-Object { $_.key -eq $Only })) { throw "'$Only' apps.json me nahi hai. Available: $(($apps | ForEach-Object { $_.key }) -join ', ')" }

# Android SDK path for this PC
$sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
if (-not (Test-Path $sdk)) { throw "Android SDK nahi mila: $sdk  (Android Studio install karo)" }
[IO.File]::WriteAllText("$root\android\local.properties", "sdk.dir=" + ($sdk -replace '\\','\\'), $utf8)

# ---- Server chal raha hai? (sirf warning) ----
try { Invoke-WebRequest "$ApiBase/api/products" -UseBasicParsing -TimeoutSec 5 | Out-Null; Write-Host "Server reachable hai: OK" -ForegroundColor Green }
catch { Write-Host "WARNING: $ApiBase par server nahi mila. start-server.bat chalao (APK ban jayegi, par server chalne par hi kaam karegi)." -ForegroundColor Red }

# ---- Android licenses (best effort) ----
$sm = Get-ChildItem "$sdk\cmdline-tools" -Directory -ErrorAction SilentlyContinue | ForEach-Object { "$($_.FullName)\bin\sdkmanager.bat" } | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($sm -and -not (Test-Path "$sdk\licenses\android-sdk-license")) { Write-Host "Android licenses accept ho rahe hain..." -ForegroundColor Cyan; cmd /c "echo y| `"$sm`" --licenses >nul 2>&1" }

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
    if ($Only -and $a.key -ne $Only) { continue }
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
    .\gradlew.bat --stop | Out-Null
    .\gradlew.bat assembleDebug "-PappId=$($a.id)" "-Dorg.gradle.java.home=$jdk"
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
