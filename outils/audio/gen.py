import json, subprocess, sys, os, re
S = sys.argv[1]; out = sys.argv[2]; os.makedirs(out, exist_ok=True)
d = json.load(open(S + '/voix/phrases.json'))
# prononciation (uniquement pour la synthèse)
P = [('ZQSD', 'Z, Q, S, D'), ('deck.gl', 'dèque gé elle'), ('TypeScript', 'taïpe scripte'), ('MapLibre', 'mappe libre'), ('Rust', 'reust'), ('Debian', 'débiane'), ('Docker', 'dokeur'),
     (' git', ' guite'), ('3D', 'trois dé'), ('Louis-Marie', 'Louis-Marie'), ('Elba', 'Elba'), ('CV', 'cé vé'), ('…', ','), ('(', ', '), (')', ','), ('app ', 'appli '), ("l'app", "l'appli"), ('IA', 'I.A.'), ('Précigné', 'Précigné')]
import wave
from piper import PiperVoice
from piper.config import SynthesisConfig
V = PiperVoice.load(S + '/voices/fr_FR-upmc-medium.onnx', espeak_data_dir=os.path.expanduser('~/.cache/espeak-ng-data')); CFG = SynthesisConfig(speaker_id=1, length_scale=0.97); done = 0
for k, t in d.items():
    m4a = f'{out}/{k}.m4a'
    if os.path.exists(m4a): continue
    x = t
    for a, b in P: x = x.replace(a, b)
    wav = f'{S}/voix/{k}.wav'
    with wave.open(wav, 'wb') as w: V.synthesize_wav(x, w, syn_config=CFG)
    subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '32000', wav, m4a], check=True); done += 1
print('générées', done, 'sur', len(d))
