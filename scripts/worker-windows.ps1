param([switch]$Stop,[switch]$Status)
$ErrorActionPreference = 'Stop'
$workerRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$workerRuntime = Join-Path $workerRoot '.worker-runtime'
$workerScript = Join-Path $workerRoot 'worker/index.mjs'
$workerPidFile = Join-Path $workerRuntime 'process.json'
$existingWorker = $null
if (Test-Path -LiteralPath $workerPidFile) {
 $savedWorker = Get-Content -LiteralPath $workerPidFile -Raw | ConvertFrom-Json
 $candidateWorker = Get-CimInstance Win32_Process -Filter "ProcessId = $($savedWorker.pid)" -ErrorAction SilentlyContinue
 if ($candidateWorker -and $candidateWorker.Name -eq 'node.exe' -and $candidateWorker.CommandLine.Contains($workerScript)) { $existingWorker = $candidateWorker }
}
if ($Stop) { if ($existingWorker) { Stop-Process -Id $existingWorker.ProcessId; Write-Output 'Worker stopped.' } else { Write-Output 'Worker is not running.' }; exit }
if ($Status) { if ($existingWorker) { Write-Output "Worker running: PID $($existingWorker.ProcessId)" } else { Write-Output 'Worker is not running.' }; exit }
if ($existingWorker) { Write-Output "Worker already running: PID $($existingWorker.ProcessId)"; exit }
$protectedValue = Get-Content -LiteralPath (Join-Path $workerRuntime 'credentials.dpapi') -Raw | ConvertTo-SecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($protectedValue)
try { $workerConfig = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer) | ConvertFrom-Json } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
$previousWorkerEnv = @{}
try {
 foreach ($entry in $workerConfig.PSObject.Properties) { if ($entry.Name -notmatch '^(WORKER_|SITES_DISPATCHER_TOKEN$|GMAIL_|YOUTUBE_)') { throw 'Unexpected credential key.' }; $previousWorkerEnv[$entry.Name]=[Environment]::GetEnvironmentVariable($entry.Name,'Process'); [Environment]::SetEnvironmentVariable($entry.Name,[string]$entry.Value,'Process') }
 $workerProcess = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList @('"'+$workerScript+'"') -WorkingDirectory $workerRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $workerRuntime 'stdout.log') -RedirectStandardError (Join-Path $workerRuntime 'stderr.log') -PassThru
 @{pid=$workerProcess.Id;startedAt=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath $workerPidFile
 Write-Output "Worker started: PID $($workerProcess.Id)"
} finally { foreach ($key in $previousWorkerEnv.Keys) { [Environment]::SetEnvironmentVariable($key,$previousWorkerEnv[$key],'Process') }; $workerConfig=$null }
