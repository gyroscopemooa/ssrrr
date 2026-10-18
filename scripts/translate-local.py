"""Offline subtitle translation with M2M100; JSON payload is base64 encoded."""
import argparse
import base64
import json
from pathlib import Path
from transformers import M2M100ForConditionalGeneration, M2M100Tokenizer

parser = argparse.ArgumentParser()
parser.add_argument('--payload', required=True)
parser.add_argument('--model', default='facebook/m2m100_418M')
parser.add_argument('--cache', default='.worker-tmp/translation-models')
args = parser.parse_args()
payload = json.loads(base64.urlsafe_b64decode(args.payload + '===').decode('utf-8'))
source = payload.get('language') or 'en'
texts = [str(item.get('text') or '') for item in payload.get('subtitles', [])]
if not texts:
    print('[]')
    raise SystemExit(0)

Path(args.cache).mkdir(parents=True, exist_ok=True)
tokenizer = M2M100Tokenizer.from_pretrained(args.model, cache_dir=args.cache, local_files_only=True)
model = M2M100ForConditionalGeneration.from_pretrained(args.model, cache_dir=args.cache, local_files_only=True)
tokenizer.src_lang = source
encoded = tokenizer(texts, return_tensors='pt', padding=True, truncation=True, max_length=256)
generated = model.generate(**encoded, forced_bos_token_id=tokenizer.get_lang_id('ko'), max_new_tokens=256)
translated = tokenizer.batch_decode(generated, skip_special_tokens=True)
print(json.dumps([{'id': i, 'text': text} for i, text in enumerate(translated)], ensure_ascii=False))
