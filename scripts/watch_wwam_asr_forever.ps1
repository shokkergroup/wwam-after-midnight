$ErrorActionPreference = "Continue"
$work = "C:\Users\Ricky's PC\Documents\Shokker YouTube WIKIS\WWAM Demo"
$generated = Join-Path $work "public\demo\wwam-livestream-asr-excerpts.js"
$watchalongGenerated = Join-Path $work "public\demo\wwam-watchalong-canon.js"
$queueFile = Join-Path $work "source-cache\wwam-asr-queue.json"
$log = Join-Path $work ".codex-asr-publication.log"
Set-Location -LiteralPath $work

function Write-RunLog {
  param([string]$Message)
  Add-Content -LiteralPath $log -Encoding utf8 -Value ("[{0}] {1}" -f (Get-Date -Format o), $Message)
}

function Queue-Running {
  return [bool](Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'run_wwam_asr_queue\.py' })
}

function Queue-ProcessIds {
  return @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'run_wwam_asr_queue\.py' } |
    Select-Object -ExpandProperty ProcessId)
}

function Test-QueueStall {
  param(
    [ref]$LastCpu,
    [ref]$LastProgress,
    [int]$QuietMinutes = 45
  )
  $ids = Queue-ProcessIds
  if (-not $ids) { return $false }
  $process = Get-Process -Id $ids[0] -ErrorAction SilentlyContinue
  $logItem = Get-Item -LiteralPath $log -ErrorAction SilentlyContinue
  $cpu = if ($process) { [double]($process.CPU) } else { 0 }
  $logTime = if ($logItem) { $logItem.LastWriteTimeUtc } else { [datetime]::MinValue.ToUniversalTime() }
  $progressed = $false
  if ($null -eq $LastCpu.Value -or $cpu -gt ([double]$LastCpu.Value + 0.5)) { $progressed = $true }
  if ($logTime -gt ([datetime]$LastProgress.Value).ToUniversalTime()) { $progressed = $true }
  if ($progressed) {
    $LastCpu.Value = $cpu
    $LastProgress.Value = Get-Date
    return $false
  }
  $quietFor = ((Get-Date) - $LastProgress.Value).TotalMinutes
  if ($quietFor -lt $QuietMinutes) { return $false }
  Write-RunLog ("ASR watchdog // no CPU/log progress for {0:N1} minutes // stopping queue worker for retry" -f $quietFor)
  foreach ($id in $ids) {
    Stop-Process -Id ([int]$id) -Force -ErrorAction SilentlyContinue
  }
  return $true
}

function Remaining-Sources {
  if (-not (Test-Path -LiteralPath $queueFile)) { return 0 }
  try {
    $manifest = Get-Content -Raw -LiteralPath $queueFile | ConvertFrom-Json
    return [int]($manifest.available)
  } catch {
    return 1
  }
}

function Run-Logged {
  param([string]$File, [string[]]$Arguments)
  & $File @Arguments 2>&1 | ForEach-Object {
    Add-Content -LiteralPath $log -Encoding utf8 -Value ([string]$_)
  }
  return $LASTEXITCODE
}

function Publish-IfChanged {
  param([ref]$LastHash)
  if (-not (Test-Path -LiteralPath $generated)) { return }
  $hash = (Get-FileHash -LiteralPath $generated -Algorithm SHA256).Hash
  $watchalongHash = if (Test-Path -LiteralPath $watchalongGenerated) {
    (Get-FileHash -LiteralPath $watchalongGenerated -Algorithm SHA256).Hash
  } else { "missing" }
  $combinedHash = "$hash|$watchalongHash"
  if (-not $LastHash.Value) { $LastHash.Value = $combinedHash; return }
  if ($combinedHash -eq $LastHash.Value) { return }

  Write-RunLog "excerpt bundle changed // building Pages"
  $buildExit = Run-Logged "npm" @("run", "build:pages")
  if ($buildExit -ne 0) {
    Write-RunLog "Pages build failed // will retry on next poll"
    return
  }
  git add -- public/demo/wwam-livestream-asr-excerpts.js public/demo/wwam-watchalong-canon.js public/demo/wwam-watchalong-route-index.js public/demo/index.html
  $staged = git diff --cached --name-only
  if ($staged) {
    $commitExit = Run-Logged "git" @("commit", "-m", "Publish queued ASR batch")
    if ($commitExit -eq 0) {
      $pushExit = Run-Logged "git" @("push", "origin", "main")
      if ($pushExit -eq 0) { Write-RunLog "batch published" }
    }
  }
  $LastHash.Value = $combinedHash
}

$lastHash = ""
$lastQueueCpu = $null
$lastQueueProgress = Get-Date
Write-RunLog "forever ASR supervisor active"
while ($true) {
  while (Queue-Running) {
    Publish-IfChanged ([ref]$lastHash)
    if (Test-QueueStall ([ref]$lastQueueCpu) ([ref]$lastQueueProgress)) {
      Start-Sleep -Seconds 5
      break
    }
    Start-Sleep -Seconds 30
  }

  Publish-IfChanged ([ref]$lastHash)
  $remaining = Remaining-Sources
  if ($remaining -le 0) {
    Write-RunLog "queue exhausted // supervisor complete"
    break
  }

  Write-RunLog ("starting next queued ASR tranche // {0} sources remain" -f $remaining)
  # Keep each tranche short so a new evidence policy or faster bounded-window
  # transcription path takes effect on the next restart instead of remaining
  # trapped inside a long-lived model process.
  $exit = Run-Logged "python" @("scripts/run_wwam_asr_queue.py", "--batches", "1", "--batch-size", "3")
  if ($exit -ne 0) {
    Write-RunLog ("queued tranche exited with code {0} // retrying after 60 seconds" -f $exit)
    Start-Sleep -Seconds 60
  } else {
    Write-RunLog "queued tranche complete // continuing"
  }
}
