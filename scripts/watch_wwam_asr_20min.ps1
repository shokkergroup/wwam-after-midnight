$ErrorActionPreference = "Continue"
$work = "C:\Users\Ricky's PC\Documents\Shokker YouTube WIKIS\WWAM Demo"
$log = Join-Path $work ".codex-asr-publication.log"
Set-Location -LiteralPath $work

# Apply the requested 20-minute recovery window to an already-running
# supervisor without launching a competing queue worker.
$mutex = New-Object System.Threading.Mutex($false, "Global\WWAM_After_Midnight_ASR_20min_Watchdog")
try { if (-not $mutex.WaitOne(0)) { exit 0 } } catch { exit 1 }

$lastCpu = $null
$lastLog = [datetime]::MinValue.ToUniversalTime()
$lastProgress = Get-Date

while ($true) {
  $ids = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'run_wwam_asr_queue\.py' } |
    Select-Object -ExpandProperty ProcessId)
  if (-not $ids) {
    Start-Sleep -Seconds 30
    continue
  }

  $process = Get-Process -Id $ids[0] -ErrorAction SilentlyContinue
  $logItem = Get-Item -LiteralPath $log -ErrorAction SilentlyContinue
  $cpu = if ($process) { [double]$process.CPU } else { 0 }
  $logTime = if ($logItem) { $logItem.LastWriteTimeUtc } else { [datetime]::MinValue.ToUniversalTime() }
  $progressed = $false
  if ($null -eq $lastCpu -or $cpu -gt ($lastCpu + 0.5)) { $progressed = $true }
  if ($logTime -gt $lastLog) { $progressed = $true }
  if ($progressed) {
    $lastCpu = $cpu
    $lastLog = $logTime
    $lastProgress = Get-Date
  } elseif (((Get-Date) - $lastProgress).TotalMinutes -ge 20) {
    $quietFor = ((Get-Date) - $lastProgress).TotalMinutes
    Add-Content -LiteralPath $log -Encoding utf8 -Value ("[{0}] ASR 20-minute watchdog // no CPU/log progress for {1:N1} minutes // stopping queue worker for supervisor retry" -f (Get-Date -Format o), $quietFor)
    foreach ($id in $ids) { Stop-Process -Id ([int]$id) -Force -ErrorAction SilentlyContinue }
    $lastCpu = $null
    $lastLog = [datetime]::MinValue.ToUniversalTime()
    $lastProgress = Get-Date
  }
  Start-Sleep -Seconds 30
}
