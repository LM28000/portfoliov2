# Architecture

Le site est une page statique. `index.html` charge three.js, puis les fichiers de `js/` dans l'ordre ci-dessous. Il n'y a ni framework, ni bundler, ni étape de build.

## Les fichiers

| Fichier | Rôle |
|---|---|
| `js/shim.js` | `DCLogic` : un état et un `setState` qui redessine le HTML. C'est le moteur minimal hérité des prototypes. |
| `js/scene.js` | La classe `Component` : rendu three.js, mer, ciel, Elba, l'île d'Insula, le pilote auto, les gestes, la caméra, la carte marine, et `renderVals()` (ce que le HTML doit afficher). |
| `js/cabin.js` | Tombée de la nuit, carte du voyage (`goTo`), progression du visiteur. |
| `js/cabin3d.js` | La cabine d'Elba (`assets/cabine.glb`) et ses objets. |
| `js/archipel.js` | L'archipel : vue aérienne, les deux autres îles, la traversée d'île en île. |
| `js/descente.js` | Descendre dans la cabine sans fondu. L'ouverture de la descente sert de « portail », qui montre la vraie cabine. |
| `js/studio.js` | L'escale d'Insula : l'immeuble du quai, son panneau et le studio témoin (`assets/studio.glb`). |
| `js/audio.js` | Musique, ambiance marine générée et voix de la VHF. |
| `js/main.js` | Branche `Component` sur la page. Il affiche la radio, les boutons, la carte du voyage, la version texte et l'app, et il gère Échap. |

Les fichiers 2 à 8 complètent la même classe avec `Object.assign(Component.prototype, { … })`. Chaque partie reste lisible seule, et toutes partagent le même état.

## L'état et le rendu

- `this.state` contient ce qui change l'interface : la phase, la radio, l'objet regardé, les fenêtres ouvertes.
- `renderVals()` traduit cet état en valeurs prêtes à afficher : le texte de la radio, la liste des boutons, l'aide en haut de l'écran, les étapes de la carte du voyage. `main.js` les reporte dans le HTML à chaque `setState`.
- Ce qui change à chaque image ne passe pas par l'état : la position d'Elba, la caméra, les animations. `step()` s'en charge, appelé par `requestAnimationFrame`.

## Les phases

Le parcours est une suite de phases (`state.phase`). Chaque phase a sa caméra, ses gestes et ses boutons.

| Phase | Où l'on est | Caméra |
|---|---|---|
| `archipel` | vue aérienne des trois îles | orbite libre |
| `ponton` | à quai, avant de partir | derrière Elba |
| `mer`, `approche`, `accostage` | à la barre, ou au pilote auto | derrière Elba |
| `transit` | traversée express d'une île à l'autre | vue de dessus qui suit la route |
| `accoste` | au quai d'Insula | orbite autour de l'île |
| `studio` | dans le studio témoin d'Insula | à la première personne, puis autour d'un objet |
| `escale` | sur la Carte vivante ou le serveur | orbite autour de l'île |
| `nuit` | sur le pont, la nuit | autour d'Elba |
| `descente`, `montee` | on passe par l'ouverture de la cabine | animée |
| `cabine` | dans la cabine | à la première personne, puis autour d'un objet |

La carte du voyage (`goTo` dans `cabin.js`) permet de sauter d'un lieu à l'autre. Elle sort d'abord proprement de la phase en cours : caméra, nuit, vidéo.

## La boucle de rendu

À chaque image, `step()` fait avancer dans l'ordre :
1. la mer (shader) ;
2. le bateau (barre manuelle ou pilote auto le long d'une courbe Catmull-Rom) ;
3. la caméra de la phase en cours ;
4. les animations (anneaux dorés, nuit, cabine, studio) ;
5. le survol (curseur et étiquette) ;
6. la carte marine.

Ensuite, la scène principale est rendue, ou la scène de la cabine quand on y est.

## Repères

- Les modèles sont faits dans Blender (`z` vers le haut) et exportés en glTF (`y` vers le haut). Dans le code, un point Blender `(x, y, z)` devient `(x, z, -y)` en three.js (`B2T` dans `scene.js`).
- **Le studio** a son propre repère, celui de l'immeuble : `x` le long de la façade, `y` vers l'intérieur, `z` depuis le sol du quai. `stuW()` le convertit en coordonnées three. Les constantes `PR_BLD` et `PR_STU_L` (`studio.js`) viennent de `outils/3d/scripts/immeuble.py` et de `ile_insula_v3.py`. Voir [Les modèles 3D](modeles-3d.md).
- **La cabine** a le sien aussi (`PR_CAB_VIEWS`) : c'est une scène séparée, plus grande « dedans » que le bateau.

## L'app sur l'écran du portable

Dans le studio, la vraie app d'Insula (`insula.du-cray.eu`) s'affiche dans une `iframe` posée sur l'écran du portable 3D. À chaque image :
1. `stuScreen()` projette les quatre coins de l'écran, repérés par les UV du modèle ;
2. une transformation projective CSS (`matrix3d`, calculée par `homography()`) déforme l'`iframe` pour qu'elle épouse l'écran.

L'app reste donc à sa place quand on tourne autour du portable, et on clique dedans directement.

## Chargement

| Quand | Quoi | Poids |
|---|---|---|
| À l'ouverture | `elba.glb`, `ile_insula.glb`, arbres (imposteurs WebP) | ~2 Mo |
| À l'arrivée au quai d'Insula | `studio.glb` | ~4 Mo |
| En entrant dans le studio | `demo-insula.webm`, la démo qui tourne sur le portable | ~7 Mo |
| Quand la nuit tombe | `cabine.glb` | ~8 Mo |

Les fichiers de la page sont versionnés (`?v=N` dans `index.html`), pour qu'un navigateur ne garde pas une ancienne version en cache. Augmentez `N` à chaque changement de `js/` ou de `style.css`. `outils/verifier.cjs` vérifie qu'il n'y en a qu'un seul.

## Accessibilité

- Sans WebGL, la version texte s'affiche directement. Après 30 s de chargement, la page propose aussi de passer à la version texte.
- La version texte (`#texte`) est toujours dans la page, masquée visuellement, pour les lecteurs d'écran et les moteurs de recherche.
- Ce qu'on lit sur un objet est aussi écrit dans `#objText` (`aria-live`).
- `prefers-reduced-motion` remplace les mouvements de caméra par des coupes nettes.
- Tout se fait aussi au clavier et par des boutons : barre, pilote auto, objets, Échap pour revenir.

## Mémoire du navigateur (`localStorage`)

| Clé | Contenu |
|---|---|
| `elba-escales` | les lieux déjà vus (carte du voyage, livre de bord) |
| `elba-son` | `off` si le son est coupé |
| `elba-voix` | `on` si la voix de la VHF est activée (coupée par défaut) |
| `elba-gestes` | `classique` pour revenir aux anciens gestes (voir [Les gestes](gestes.md)) |

## Pour les tests

`window.__elba` expose l'objet `Component`, pour piloter le site depuis un test, par exemple `__elba.goTo('studio')` ou `__elba.stuFocus('ordi')`. `outils/tests/parcours.cjs` s'en sert.
