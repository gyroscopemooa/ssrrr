param([string]$Destination = 'C:\8.secretagit\secretagit-final-review-v3.zip')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$archivePath = [IO.Path]::GetFullPath($Destination)
if ([IO.File]::Exists($archivePath)) { throw 'Destination already exists; choose a new review ZIP name.' }
$filePaths = & git -c "safe.directory=$($projectRoot.Replace('\','/'))" -C $projectRoot ls-files
if ($LASTEXITCODE -ne 0) { throw 'Cannot enumerate source files.' }
$excluded = '(^|/)(node_modules|\.next|dist|\.git|\.wrangler|\.sites-runtime|\.worker-tmp|\.worker-runtime|\.remotion|coverage|build|\.cache)(/|$)|(^|/)\.dev\.vars|\.tsbuildinfo$|\.dpapi$|\.zip$|\.tar\.gz$'
$files = @($filePaths | Where-Object { $_ -notmatch $excluded -and ($_ -notmatch '(^|/)\.env' -or $_ -eq '.env.example') })
foreach ($required in @('package.json','package-lock.json','.env.example','FINAL_IMPLEMENTATION_REPORT.md','drizzle/0002_dashing_red_skull.sql','test-results/summary.json')) { if ($files -notcontains $required) { throw "Missing $required" } }
$manifest = @()
$archive = [IO.Compression.ZipFile]::Open($archivePath,[IO.Compression.ZipArchiveMode]::Create)
try {
 foreach ($relative in $files) {
  $absolute = [IO.Path]::GetFullPath((Join-Path $projectRoot $relative))
  if (!$absolute.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Path escapes project.' }
  if ((Get-Item -LiteralPath $absolute).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Symlink rejected: $relative" }
  [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$absolute,$relative,[IO.Compression.CompressionLevel]::Optimal) | Out-Null
  $manifest += @{path=$relative;sha256=(Get-FileHash -LiteralPath $absolute -Algorithm SHA256).Hash.ToLower();bytes=(Get-Item -LiteralPath $absolute).Length}
 }
 $entry = $archive.CreateEntry('ZIP_MANIFEST.json')
 $writer = [IO.StreamWriter]::new($entry.Open(),[Text.UTF8Encoding]::new($false))
 try { $writer.Write((@{createdAt=[DateTime]::UtcNow.ToString('o');files=$manifest;excluded=@('node_modules','build caches','runtime state','actual secrets; only .env.example included')} | ConvertTo-Json -Depth 6)) } finally { $writer.Dispose() }
} finally { $archive.Dispose() }
$verify = [IO.Compression.ZipFile]::OpenRead($archivePath)
try {
 foreach ($row in $manifest) {
  $entry=$verify.GetEntry($row.path); if (!$entry) { throw "ZIP missing $($row.path)" }
  $stream=$entry.Open();$sha=[Security.Cryptography.SHA256]::Create()
  try { $hash=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','').ToLower();if($hash -ne $row.sha256){throw "Hash mismatch $($row.path)"} } finally {$stream.Dispose();$sha.Dispose()}
 }
 if (@($verify.Entries | Where-Object { $_.FullName -match $excluded -or ($_.FullName -match '(^|/)\.env' -and $_.FullName -ne '.env.example') }).Count) {throw 'Excluded file detected'}
} finally { $verify.Dispose() }
Write-Output (@{zip=$archivePath;files=$manifest.Count+1;bytes=(Get-Item -LiteralPath $archivePath).Length;sha256=(Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash;hashVerification='PASS';excludedFilesVerification='PASS'} | ConvertTo-Json)
