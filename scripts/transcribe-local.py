"""Local-only speech recognition; emits timed JSON for review, not invented captions."""
import argparse
import json
from faster_whisper import WhisperModel

parser = argparse.ArgumentParser()
parser.add_argument('audio')
parser.add_argument('--model', default='small')
parser.add_argument('--english', action='store_true')
args = parser.parse_args()
model = WhisperModel(args.model, device='cpu', compute_type='int8', cpu_threads=4,
                     download_root='.worker-tmp/whisper-models')
segments, info = model.transcribe(args.audio, beam_size=5, vad_filter=True,
                                  word_timestamps=True, condition_on_previous_text=False)
data = {'language': info.language, 'languageProbability': info.language_probability,
                  'segments': [{'start': s.start, 'end': s.end, 'text': s.text,
                                'words': [{'start': w.start, 'end': w.end, 'text': w.word} for w in s.words or []]}
                               for s in segments]}
if args.english and info.language != 'en':
    translated, _ = model.transcribe(args.audio, task='translate', language=info.language,
                                     beam_size=5, vad_filter=True, condition_on_previous_text=False)
    data['english'] = [{'start': s.start, 'end': s.end, 'text': s.text} for s in translated]
print(json.dumps(data, ensure_ascii=True), flush=True)
