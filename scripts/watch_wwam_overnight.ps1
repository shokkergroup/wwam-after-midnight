$ErrorActionPreference = "Continue"
$work = "C:\Users\Ricky's PC\Documents\Shokker YouTube WIKIS\WWAM Demo"
$log = Join-Path $work ".codex-overnight-watchdog.log"
$pack = Join-Path $work "public\demo\episode-editorial-packs-wave40.js"
$canon = Join-Path $work "public\demo\wwam-livestream-canon.js"
$sourceCache = Join-Path $work "source-cache\captions"
Set-Location -LiteralPath $work

# One detached overnight lane only. It never owns the ASR queue and therefore
# cannot compete with the existing Whisper supervisor.
$mutex = New-Object System.Threading.Mutex($false, "Global\WWAM_After_Midnight_Editorial_Watchdog")
try { if (-not $mutex.WaitOne(0)) { exit 0 } } catch { exit 1 }

function Log([string]$Message) {
  Add-Content -LiteralPath $log -Encoding utf8 -Value ("[{0}] {1}" -f (Get-Date -Format o), $Message)
}

function Latest-EvidenceTime {
  $items = @(
    (Get-Item -LiteralPath $pack -ErrorAction SilentlyContinue),
    (Get-Item -LiteralPath $canon -ErrorAction SilentlyContinue),
    (Get-ChildItem -LiteralPath $sourceCache -Filter '*.asr.json' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1)
  ) | Where-Object { $_ }
  if (-not $items) { return [datetime]::MinValue }
  return ($items | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
}

function Run-Check([string]$File, [string[]]$Args) {
  & $File @Args 2>&1 | ForEach-Object { Add-Content -LiteralPath $log -Encoding utf8 -Value ([string]$_) }
  return $LASTEXITCODE
}

$lastEvidence = Latest-EvidenceTime
$lastHeartbeat = Get-Date
Log "overnight editorial watchdog active // evidence=$lastEvidence"

while ($true) {
  Start-Sleep -Seconds 60
  $now = Get-Date
  $evidence = Latest-EvidenceTime
  $activeWorkers = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match 'generate-wwam-livestream-canon|wwam_archive_completion|run_wwam_asr_queue|watch_wwam_overnight'
  })
  if ($evidence -gt $lastEvidence) {
    $lastEvidence = $evidence
    Log "progress observed // latest evidence=$evidence // workers=$($activeWorkers.Count)"
  }

  if (($now - $lastHeartbeat).TotalMinutes -lt 20) { continue }
  $lastHeartbeat = $now
  Log "20-minute heartbeat // workers=$($activeWorkers.Count) // latest evidence=$evidence"

  # If a long-running generator/check is already alive, leave it alone. The
  # heartbeat itself proves the lane is awake without creating a duplicate.
  if ($activeWorkers.Count -gt 1) {
    Log "active editorial/audio worker present // no competing run launched"
    continue
  }

  Log "no active worker detected // running bounded audit recovery"
  $audit = Run-Check "npm" @("run", "audit:livestream-audio")
  Log ("audio coverage audit exit {0}" -f $audit)
  $audit = Run-Check "npm" @("run", "audit:public-receipts")
  Log ("public receipt audit exit {0}" -f $audit)
  $audit = Run-Check "npm" @("run", "audit:public-truth")
  Log ("editorial truth audit exit {0}" -f $audit)

  $packTime = (Get-Item -LiteralPath $pack -ErrorAction SilentlyContinue).LastWriteTime
  $canonTime = (Get-Item -LiteralPath $canon -ErrorAction SilentlyContinue).LastWriteTime
  if ($packTime -and (!$canonTime -or $packTime -gt $canonTime)) {
    Log "pack newer than canon // regenerating livestream canon"
    $regen = Run-Check "npm" @("run", "generate:livestream-canon")
    Log ("canon regeneration exit {0}" -f $regen)
  }
}
