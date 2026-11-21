# Naya app jodo.   Example:
#   .\add-app.ps1 -Key rider -Name "UniVerse Rider"
# Ye apps.json me entry daalta hai aur public\rider.html bana deta hai (agar nahi hai).
param([Parameter(Mandatory=$true)][string]$Key, [Parameter(Mandatory=$true)][string]$Name, [string]$Page = "")
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
if ($Key -notmatch '^[a-z][a-z0-9]*$') { throw "Key sirf chhote english letters/numbers (jaise rider, shop2)" }
if (-not $Page) { $Page = "$Key.html" }
$list = @((Get-Content "$root\apps.json" -Raw | ConvertFrom-Json) | ForEach-Object { $_ })
if ($list | Where-Object { $_.key -eq $Key }) { throw "'$Key' pehle se apps.json me hai" }
$list += [pscustomobject]@{ key = $Key; page = $Page; id = "com.universe.$Key"; name = $Name }
$utf8 = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText("$root\apps.json", (ConvertTo-Json -InputObject $list -Depth 5), $utf8)
$target = "$root\public\$Page"
if (-not (Test-Path $target)) {
  $t = [IO.File]::ReadAllText("$root\public\_template.html").Replace("__NAME__", $Name).Replace("__PAGE__", $Page)
  [IO.File]::WriteAllText($target, $t, $utf8)
  Write-Host "Naya page bana: public\$Page" -ForegroundColor Green
} else { Write-Host "public\$Page pehle se hai, wahi use hoga" -ForegroundColor Yellow }
Write-Host "App '$Key' jud gaya. Ab APK banao:  .\build-apks.ps1 -Only $Key" -ForegroundColor Cyan
