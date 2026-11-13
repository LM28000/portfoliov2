# Outils

Tout ce qui fabrique ou vérifie le contenu de `assets/`. La page n'en charge rien.

| Dossier | Contenu | Documentation |
|---|---|---|
| `verifier.cjs` | vérifications rapides, sans dépendance (lancées aussi par GitHub) | [Publication](../docs/publication.md) |
| `tests/parcours.cjs` | parcours complet dans Chrome : archipel, gestes, Insula, studio, cabine | [Publication](../docs/publication.md) |
| `3d/scripts/` | modèles Blender : Elba, l'île d'Insula et son studio, la cabine, les arbres | [Les modèles 3D](../docs/modeles-3d.md) |
| `audio/` | voix de la VHF : liste des phrases, synthèse Piper, index | [Le son](../docs/son.md) |
| `cv/` | le CV (`cv.html`) et sa mise en PDF | ci-dessous |
| `video/` | la démo d'Insula qui tourne sur le portable du studio | ci-dessous |

```bash
npm install            # Playwright (tests, CV, vidéo)
npm run verifier
npm run parcours       # le site doit tourner sur http://localhost:8000 (ou : npm run parcours -- <URL>)
npm run cv             # cv/cv.html -> ../assets/cv-louis-marie-perret-du-cray.pdf
```

## La démo vidéo

Elle est filmée sur la page de démonstration d'Insula (`essai.html` du dépôt [immobilier-tool](https://github.com/LM28000/immobilier-tool)). Le curseur est visible, et la vidéo montre la fiche qui défile, puis les onglets Calcul et Quartier.

```bash
INSULA_DIR=~/immobilier-tool npm run demo              # -> video/out/page@….webm
mv video/out/page@*.webm video/demo_raw.webm
python3 -m http.server 8766 --directory video &         # sert frames.html, qui lit demo_raw.webm
node video/reencode.js <début s> <fin s> <kbit/s> ../assets/demo-insula.webm
```

`reencode.js` coupe et recompresse la vidéo dans le navigateur (VP9, sinon VP8). L'affiche `assets/demo-poster.jpg` est une image de la démo.
