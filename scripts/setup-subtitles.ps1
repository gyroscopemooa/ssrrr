param([string]$Python = 'C:\Users\jeonm\AppData\Local\Programs\Python\Python310\python.exe')
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtime = Join-Path $root '.worker-tmp\subtitle-venv'
$pythonExe = Join-Path $runtime 'Scripts\python.exe'
if (-not (Test-Path -LiteralPath $Python)) { throw "Python executable not found: $Python" }
if (-not (Test-Path -LiteralPath $pythonExe)) { & $Python -m venv $runtime }
& $pythonExe -m pip install --upgrade pip
if ($LASTEXITCODE -ne 0) { throw 'Failed to upgrade pip.' }
& $pythonExe -m pip install -r (Join-Path $PSScriptRoot 'subtitle-requirements.txt')
if ($LASTEXITCODE -ne 0) { throw 'Failed to install subtitle dependencies.' }
Push-Location $root
try {
 & $pythonExe -c "from huggingface_hub import snapshot_download; snapshot_download('Systran/faster-whisper-large-v3', local_dir='.worker-tmp/whisper-large-v3')"
 if ($LASTEXITCODE -ne 0) { throw 'Failed to download Whisper large-v3.' }
 & $pythonExe -c "from faster_whisper import WhisperModel; WhisperModel('.worker-tmp/whisper-large-v3', device='cpu', compute_type='int8', local_files_only=True)"
 if ($LASTEXITCODE -ne 0) { throw 'Failed to download or load Whisper large-v3.' }
 & $pythonExe -c "from huggingface_hub import snapshot_download; snapshot_download('facebook/m2m100_418M', local_dir='.worker-tmp/translation-m2m100-418M', allow_patterns=['config.json','generation_config.json','pytorch_model.bin','sentencepiece.bpe.model','special_tokens_map.json','tokenizer_config.json','vocab.json'])"
 if ($LASTEXITCODE -ne 0) { throw 'Failed to download the translation model.' }
 & $pythonExe -c "from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer; name='.worker-tmp/translation-m2m100-418M'; M2M100Tokenizer.from_pretrained(name, local_files_only=True); M2M100ForConditionalGeneration.from_pretrained(name, local_files_only=True)"
 if ($LASTEXITCODE -ne 0) { throw 'Failed to download or load the translation model.' }
} finally { Pop-Location }
Write-Output 'Subtitle environment and models are ready.'
