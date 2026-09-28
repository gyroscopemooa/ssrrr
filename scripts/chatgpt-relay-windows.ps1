param([switch]$Enable,[switch]$Disable)
$ErrorActionPreference = 'Stop'
$workerRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$credentialFile = Join-Path $workerRoot '.worker-runtime\credentials.dpapi'
if (-not (Test-Path -LiteralPath $credentialFile)) { throw '먼저 Windows worker 인증을 구성하세요.' }
$protectedValue = Get-Content -LiteralPath $credentialFile -Raw | ConvertTo-SecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($protectedValue)
try { $config = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer) | ConvertFrom-Json } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
try {
 if ($Enable -and $Disable) { throw '-Enable 또는 -Disable 중 하나만 사용하세요.' }
 if ($Enable -or $Disable) {
  $value = if ($Enable) { 'true' } else { 'false' }
  $config | Add-Member -NotePropertyName CHATGPT_RELAY_ENABLED -NotePropertyValue $value -Force
  $config | Add-Member -NotePropertyName CHATGPT_BROWSER_CHANNEL -NotePropertyValue 'msedge' -Force
  $config | Add-Member -NotePropertyName CHATGPT_PROFILE_DIR -NotePropertyValue '.worker-runtime/chatgpt-profile' -Force
  $json = $config | ConvertTo-Json -Compress
  $encrypted = ConvertTo-SecureString -String $json -AsPlainText -Force | ConvertFrom-SecureString
  Set-Content -LiteralPath $credentialFile -Value $encrypted
 }
 $enabled = [string]$config.CHATGPT_RELAY_ENABLED -eq 'true'
 Write-Output ('ChatGPT VM relay: ' + $(if ($enabled) { 'enabled' } else { 'disabled' }))
 Write-Output 'Worker restart required after changing this setting.'
} finally { $config = $null; $json = $null }
