# louis-marie.du-cray.eu

Mon site : un monde marin en 3D. On prend la barre d'*Elba* (un Flirt 6 m de 1977) et on navigue d'île en île ; chaque île est un projet.

Première escale : **Insula**, l'outil que j'ai construit pour choisir où acheter un appartement entre amis ([insula.du-cray.eu](https://insula.du-cray.eu)).

- Site statique (HTML, CSS, JavaScript), moteur 3D [three.js](https://threejs.org) r128, servi par GitHub Pages.
- `js/scene.js` : la mer, le bateau, l'île, le pilote auto, le cinéma et la longue-vue.
- `assets/` : modèles glTF exportés de Blender (Elba est modélisé par script ; les bâtiments viennent de Sketchfab et Poly Haven, voir « Crédits » sur le site).

Pour le lancer en local : `python3 -m http.server` dans ce dossier, puis http://localhost:8000.
