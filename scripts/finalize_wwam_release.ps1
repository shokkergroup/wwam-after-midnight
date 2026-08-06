$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$log = Join-Path $root ".codex-finalize-release.log"
function Log($value) { "[$(Get-Date -Format o)] $value" | Out-File -FilePath $log -Append }
while (Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "generate-wwam-livestream-canon" -and $_.ProcessId -ne $PID }) {
  Start-Sleep -Seconds 30
}
Set-Location $root
Log "generator idle; building Pages bundle"
& npm.cmd run build:pages *>> $log
Log "build exit=$LASTEXITCODE"
git add -- public/demo/wwam-livestream-canon.js public/demo/wwam-livestream-cold-index.js scripts/refresh_wwam_canon_after_pack.ps1 scripts/finalize_wwam_release.ps1
if (git diff --cached --quiet) {
  Log "no generated changes to commit"
} else {
  git commit -m "Refresh generated WWAM canon through wave 63" *>> $log
  Log "commit exit=$LASTEXITCODE"
  git push origin main *>> $log
  Log "push exit=$LASTEXITCODE"
}
$credentialLines = ("protocol=https`nhost=github.com`n`n" | git credential fill)
$tokenLine = $credentialLines | Where-Object { $_ -like "password=*" } | Select-Object -First 1
if ($tokenLine) {
  $ghToken = $tokenLine.Substring(9)
  $headers = @{ Authorization = "Bearer $ghToken"; Accept = "application/vnd.github+json"; "X-GitHub-Api-Version" = "2022-11-28" }
  try {
    Invoke-RestMethod -Method Post -Headers $headers -ContentType "application/json" -Uri "https://api.github.com/repos/shokkergroup/wwam-after-midnight/actions/workflows/pages.yml/dispatches" -Body '{"ref":"main"}'
    Log "Pages dispatch sent"
  } catch { Log "Pages dispatch failed: $_" }
}
