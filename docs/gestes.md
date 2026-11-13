# Les gestes

Les gestes reprennent ceux de la carte d'[Insula](https://insula.du-cray.eu), basée sur MapLibre : glisser pour déplacer, Ctrl pour tourner, deux doigts pour zoomer.

| Geste | Archipel et îles | En mer | Studio et cabine | Studio et cabine, objet choisi |
|---|---|---|---|---|
| Glisser | déplacer la vue (le point saisi reste sous le curseur) | tourner autour d'Elba | regarder autour | tourner autour de l'objet |
| Ctrl, Maj, Alt, Cmd ou clic droit + glisser | tourner et incliner | | | |
| Deux doigts sur le trackpad | zoomer | zoomer | zoomer | s'approcher, reculer |
| Pincer (trackpad ou écran) | zoomer | zoomer | zoomer | s'approcher, reculer |
| Molette | zoomer | zoomer | zoomer | s'approcher, reculer |
| Écran tactile : deux doigts qui tournent | tourner | | | |
| Flèches ou ZQSD | | barrer | | |
| Échap | | | | revenir |

Quelques détails :
- **Dézoomer à fond** sur une île ramène à l'archipel. Zoomer sur une île depuis l'archipel y emmène.
- **Pendant un glisser,** la 3D garde la souris : les étiquettes des îles ne bloquent pas le geste quand on passe dessus, et la molette passée sur une étiquette agit sur la 3D.
- **Dans le studio,** la caméra reste à l'intérieur de la pièce.
- **Sur l'écran du portable,** les gestes vont à l'app elle-même : clic, défilement, carte.

## Revenir aux anciens gestes

Avant, glisser faisait tourner et deux doigts faisaient pivoter. Pour retrouver ce comportement, tapez dans la console du navigateur :

```js
localStorage.setItem('elba-gestes', 'classique')   // puis recharger
localStorage.removeItem('elba-gestes')            // pour revenir aux gestes d'Insula
```

Le choix est lu par `gestInsula()` dans `scene.js`.
