# Le son

Le son démarre au premier geste (règle des navigateurs). Le bouton 🔊 le coupe, et le choix est gardé dans `elba-son`. Tout est dans `js/audio.js`.

| Couche | D'où elle vient |
|---|---|
| La mer et le vent | générés dans le navigateur : bruit filtré, modulé lentement |
| La musique | Mendelssohn, ouverture « Les Hébrides » (en mer) ; Satie, Gymnopédie n° 1 (dans la cabine). Domaine public, Wikimedia Commons. Fichiers `assets/audio/musique-*.m4a` |
| La voix de la VHF | synthèse [Piper](https://github.com/rhasspy/piper), voix `fr_FR-upmc-medium` (locuteur « pierre »), passée par un filtre radio. Coupée par défaut : bouton 🗣, choix gardé dans `elba-voix` |

## La voix : un clip par phrase

Chaque phrase de la radio a son clip, `assets/audio/voix/<clé>.m4a`. La clé est une empreinte du texte affiché (`prHash` dans `audio.js`). **Modifier un texte de la radio change donc sa clé** : sans nouveau clip, la phrase s'affiche mais n'est pas lue. `outils/verifier.cjs` signale les clips manquants ou orphelins.

### Régénérer les clips

Il faut Python 3, `piper-tts`, la voix Piper et `afconvert` (macOS).

```bash
cd outils
T=/tmp/piper && mkdir -p $T/voices $T/voix
python3 -m venv $T/venv && $T/venv/bin/pip install piper-tts
for f in fr_FR-upmc-medium.onnx fr_FR-upmc-medium.onnx.json; do
  curl -L -o $T/voices/$f https://huggingface.co/rhasspy/piper-voices/resolve/main/fr/fr_FR/upmc/medium/$f; done
# espeak-ng-data doit être à un chemin court (limite de 160 caractères) :
ln -sfn $T/venv/lib/python3.*/site-packages/piper/espeak-ng-data ~/.cache/espeak-ng-data

node audio/collect.js .. $T/voix/phrases.json         # toutes les phrases de la radio et leurs clés
$T/venv/bin/python audio/gen.py $T ../assets/audio/voix   # ne génère que les clips manquants
python3 audio/index.py $T/voix/phrases.json           # réécrit index.json, supprime les clips orphelins
```

`collect.js` lit les objets de textes radio (`PR_RADIO`, `PR_CAB_RADIO2`, `PR_STU_RADIO`) et chaque `say("…")` écrit en dur dans `js/`. `gen.py` corrige au passage la prononciation de quelques mots (« deck.gl », « Docker », « l'app »…).
