"""Réécrit assets/audio/voix/index.json (les phrases qui ont un clip) et supprime les clips orphelins.
Usage (depuis outils/) : python3 audio/index.py audio/phrases.json"""
import json, os, sys
phr = json.load(open(sys.argv[1])); keys = list(phr)
d = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "audio", "voix")
orph = [f for f in os.listdir(d) if f.endswith(".m4a") and f[:-4] not in keys]
for f in orph:
    os.remove(os.path.join(d, f))
have = [k for k in keys if os.path.exists(os.path.join(d, k + ".m4a"))]
json.dump(have, open(os.path.join(d, "index.json"), "w"))
print(f"index : {len(have)} phrases sur {len(keys)} · orphelins supprimés : {len(orph)}")
