"""Batch French voice-over with Kokoro (local, Apache-2.0). Usage: python kokoro_batch.py jobs.json
jobs.json: [{"text": "...", "out": "/path/file.wav"}], optional top-level env SPEED / VOICE."""
import json, os, sys
import soundfile as sf
from kokoro_onnx import Kokoro

CACHE = os.path.expanduser('~/.cache/hyperframes/tts')
k = Kokoro(f'{CACHE}/models/kokoro-v1.0.onnx', f'{CACHE}/voices/voices-v1.0.bin')
voice = os.environ.get('VOICE', 'ff_siwis')
speed = float(os.environ.get('SPEED', '1.0'))
jobs = json.load(open(sys.argv[1]))
for j in jobs:
    if os.path.exists(j['out']) and not os.environ.get('FORCE'):
        continue
    if j.get('phonemes'):
        print(k.tokenizer.phonemize(j['text'], 'fr-fr'))
        continue
    samples, sr = k.create(j['text'], voice=voice, speed=float(j.get('speed', speed)), lang='fr-fr')
    sf.write(j['out'], samples, sr)
    print('ok', os.path.basename(j['out']), round(len(samples) / sr, 2))
