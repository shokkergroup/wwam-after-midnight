$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$log = Join-Path $root ".codex-canon-refresh-after-wave63.log"
$err = Join-Path $root ".codex-canon-refresh-after-wave63.err.log"
while (Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "generate-wwam-livestream-canon" -and $_.ProcessId -ne $PID }) {
  Start-Sleep -Seconds 30
}
Push-Location $root
try {
  & npm.cmd run generate:livestream-canon *> $log
  if ($LASTEXITCODE -ne 0) { "generator exit=$LASTEXITCODE" | Out-File -FilePath $err -Append }
} catch {
  $_ | Out-File -FilePath $err -Append
} finally {
  Pop-Location
}
